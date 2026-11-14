"""Unit Tests for Deterministic Clinical Severity Engine & Golden Dataset Vectors."""

import pytest

from shared.constants import SeverityLevel
from shared.contracts.ml_contract import MLPredictRequest
from shared.contracts.rag_contract import MLResultPayload
from shared.rules.severity_engine import assess_vitals


def make_vitals(
    spo2: float = 98.0,
    hr: float = 72.0,
    rr: float = 14.0,
    sys_bp: float = 120.0,
    dia_bp: float = 80.0,
    temp: float = 36.8,
) -> MLPredictRequest:
    """Helper to construct valid MLPredictRequest with configurable real-time vitals."""
    return MLPredictRequest(
        request_id="REQ-TEST-VEC",
        astronaut_id="ASTRO-TEST",
        heart_rate_bpm=hr,
        hrv_rmssd_ms=45.0,
        spo2_percent=spo2,
        body_temperature_c=temp,
        respiratory_rate_bpm=rr,
        systolic_bp_mmhg=sys_bp,
        diastolic_bp_mmhg=dia_bp,
        heart_rate_bpm_rolling_mean_60min=hr,
        heart_rate_bpm_rolling_std_60min=2.0,
        hrv_rmssd_ms_rolling_mean_60min=45.0,
        hrv_rmssd_ms_rolling_std_60min=3.0,
        spo2_percent_rolling_mean_60min=spo2,
        spo2_percent_rolling_std_60min=0.5,
        body_temperature_c_rolling_mean_60min=temp,
        body_temperature_c_rolling_std_60min=0.1,
        respiratory_rate_bpm_rolling_mean_60min=rr,
        respiratory_rate_bpm_rolling_std_60min=1.0,
    )


# ==============================================================================
# GOLDEN DATASET VECTORS (VEC-01 to VEC-05)
# ==============================================================================

def test_golden_vector_01_acute_hypoxia():
    """VEC-01: SpO2 86.5%, HR 115, RR 25 with ML label=1, conf=0.98 -> Critical."""
    vitals = make_vitals(spo2=86.5, hr=115.0, rr=25.0)
    ml_res = MLResultPayload(anomaly_label=1, confidence_score=0.98)

    assessment = assess_vitals(vitals, ml_res)

    assert assessment.severity == SeverityLevel.CRITICAL
    assert "hypoxia_suspected" in assessment.condition_hypotheses
    # Verify triggered rules contain SPO2_CRITICAL
    rule_names = [r.rule_name for r in assessment.triggered_rules]
    assert "SPO2_CRITICAL" in rule_names
    assert "HR_WARNING" in rule_names
    assert "RR_WARNING" in rule_names


def test_golden_vector_02_severe_tachycardia():
    """VEC-02: HR 142, SpO2 97.0%, RR 16 with ML label=1, conf=0.91 -> Critical."""
    vitals = make_vitals(hr=142.0, spo2=97.0, rr=16.0)
    ml_res = MLResultPayload(anomaly_label=1, confidence_score=0.91)

    assessment = assess_vitals(vitals, ml_res)

    assert assessment.severity == SeverityLevel.CRITICAL
    assert "tachycardia" in assessment.condition_hypotheses
    rule_names = [r.rule_name for r in assessment.triggered_rules]
    assert "HR_CRITICAL" in rule_names


def test_golden_vector_03_rule_elevates_over_ml_zero():
    """VEC-03: HR 108, SpO2 93.5%, RR 18 with ML label=0 -> Warning (Rule elevates!)."""
    vitals = make_vitals(hr=108.0, spo2=93.5, rr=18.0)
    ml_res = MLResultPayload(anomaly_label=0, confidence_score=0.88)

    assessment = assess_vitals(vitals, ml_res)

    # Invariant: Rule Warning elevates severity despite ML=0
    assert assessment.severity == SeverityLevel.WARNING
    assert "tachycardia" in assessment.condition_hypotheses
    rule_names = [r.rule_name for r in assessment.triggered_rules]
    assert "HR_WARNING" in rule_names


def test_golden_vector_04_unknown_anomaly():
    """VEC-04: All vitals normal, ML label=1, conf=0.94 -> Warning (unknown_physiological_anomaly)."""
    vitals = make_vitals()  # all normal
    ml_res = MLResultPayload(anomaly_label=1, confidence_score=0.94)

    assessment = assess_vitals(vitals, ml_res)

    assert assessment.severity == SeverityLevel.WARNING
    assert "unknown_physiological_anomaly" in assessment.condition_hypotheses
    assert len(assessment.triggered_rules) == 0


def test_golden_vector_05_ml_crash_offline_resilience():
    """VEC-05: Acute SpO2 drop (84.0%) with ml=None (ML crash) -> Critical."""
    vitals = make_vitals(spo2=84.0)

    # ML service is offline / returned None
    assessment = assess_vitals(vitals, ml_result=None)

    assert assessment.severity == SeverityLevel.CRITICAL
    assert "hypoxia_suspected" in assessment.condition_hypotheses
    rule_names = [r.rule_name for r in assessment.triggered_rules]
    assert "SPO2_CRITICAL" in rule_names


# ==============================================================================
# ADDITIONAL BOUNDARY & SAFETY INVARIANCE TESTS
# ==============================================================================

def test_nominal_vitals_normal_severity():
    """All vitals within normal ranges and ML=0 yields Normal severity."""
    vitals = make_vitals()
    ml_res = MLResultPayload(anomaly_label=0, confidence_score=0.95)

    assessment = assess_vitals(vitals, ml_res)

    assert assessment.severity == SeverityLevel.NORMAL
    assert len(assessment.triggered_rules) == 0
    assert len(assessment.condition_hypotheses) == 0


def test_degraded_ml_without_rule_violations():
    """Normal vitals with ml=None elevates to Warning (telemetry_monitoring_degraded)."""
    vitals = make_vitals()
    assessment = assess_vitals(vitals, ml_result=None)

    assert assessment.severity == SeverityLevel.WARNING
    assert "telemetry_monitoring_degraded" in assessment.condition_hypotheses


def test_critical_hypertension_systolic():
    """Systolic BP >= 180 mmHg triggers Critical severity."""
    vitals = make_vitals(sys_bp=185.0)
    ml_res = MLResultPayload(anomaly_label=0, confidence_score=0.9)

    assessment = assess_vitals(vitals, ml_res)

    assert assessment.severity == SeverityLevel.CRITICAL
    assert "hypertension" in assessment.condition_hypotheses
    assert any(r.rule_name == "BP_SYS_CRITICAL" for r in assessment.triggered_rules)


def test_critical_hypotension_systolic():
    """Systolic BP <= 80 mmHg triggers Critical severity."""
    vitals = make_vitals(sys_bp=75.0)
    ml_res = MLResultPayload(anomaly_label=0, confidence_score=0.9)

    assessment = assess_vitals(vitals, ml_res)

    assert assessment.severity == SeverityLevel.CRITICAL
    assert "hypotension" in assessment.condition_hypotheses
    assert any(r.rule_name == "BP_SYS_CRITICAL" for r in assessment.triggered_rules)


def test_critical_hyperthermia():
    """Core body temperature >= 39.5 C triggers Critical severity."""
    vitals = make_vitals(temp=40.1)
    ml_res = MLResultPayload(anomaly_label=0, confidence_score=0.9)

    assessment = assess_vitals(vitals, ml_res)

    assert assessment.severity == SeverityLevel.CRITICAL
    assert "fever_hyperthermia" in assessment.condition_hypotheses
    assert any(r.rule_name == "TEMP_CRITICAL" for r in assessment.triggered_rules)


def test_critical_hypothermia():
    """Core body temperature <= 34.5 C triggers Critical severity."""
    vitals = make_vitals(temp=33.8)
    ml_res = MLResultPayload(anomaly_label=0, confidence_score=0.9)

    assessment = assess_vitals(vitals, ml_res)

    assert assessment.severity == SeverityLevel.CRITICAL
    assert "hypothermia" in assessment.condition_hypotheses
    assert any(r.rule_name == "TEMP_CRITICAL" for r in assessment.triggered_rules)


def test_critical_respiratory_rate_low():
    """Respiratory rate <= 8 breaths/min triggers Critical severity."""
    vitals = make_vitals(rr=7.0)
    ml_res = MLResultPayload(anomaly_label=0, confidence_score=0.9)

    assessment = assess_vitals(vitals, ml_res)

    assert assessment.severity == SeverityLevel.CRITICAL
    assert "respiratory_distress" in assessment.condition_hypotheses
    assert any(r.rule_name == "RR_CRITICAL" for r in assessment.triggered_rules)
