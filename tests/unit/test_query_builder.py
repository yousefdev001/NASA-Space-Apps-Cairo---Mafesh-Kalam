"""Unit Tests for Deterministic Query Synthesizer."""

from shared.constants import SeverityLevel
from shared.contracts.ml_contract import MLPredictRequest
from shared.contracts.rag_contract import MLResultPayload
from shared.rules.severity_engine import assess_vitals
from services.rag_service.retrieval.query_builder import build_retrieval_query


def make_vitals(
    spo2: float = 98.0,
    hr: float = 72.0,
    rr: float = 14.0,
) -> MLPredictRequest:
    """Helper to construct telemetry request."""
    return MLPredictRequest(
        request_id="REQ-Q-01",
        astronaut_id="ASTRO-01",
        heart_rate_bpm=hr,
        hrv_rmssd_ms=45.0,
        spo2_percent=spo2,
        body_temperature_c=36.8,
        respiratory_rate_bpm=rr,
        systolic_bp_mmhg=120.0,
        diastolic_bp_mmhg=80.0,
        heart_rate_bpm_rolling_mean_60min=hr,
        heart_rate_bpm_rolling_std_60min=2.0,
        hrv_rmssd_ms_rolling_mean_60min=45.0,
        hrv_rmssd_ms_rolling_std_60min=3.0,
        spo2_percent_rolling_mean_60min=spo2,
        spo2_percent_rolling_std_60min=0.5,
        body_temperature_c_rolling_mean_60min=36.8,
        body_temperature_c_rolling_std_60min=0.1,
        respiratory_rate_bpm_rolling_mean_60min=rr,
        respiratory_rate_bpm_rolling_std_60min=1.0,
    )


def test_build_query_hypoxia():
    """Asserts that acute hypoxia telemetry generates targeted query."""
    vitals = make_vitals(spo2=86.5, hr=115.0)
    ml_res = MLResultPayload(anomaly_label=1, confidence_score=0.98)
    assessment = assess_vitals(vitals, ml_res)

    query = build_retrieval_query(vitals, assessment)

    assert "hypoxia suspected" in query
    assert "spo2 percent 86.5" in query
    assert "emergency medical procedure checklist action steps" in query


def test_build_query_tachycardia():
    """Asserts that severe tachycardia generates targeted tachycardia query."""
    vitals = make_vitals(hr=142.0)
    ml_res = MLResultPayload(anomaly_label=1, confidence_score=0.92)
    assessment = assess_vitals(vitals, ml_res)

    query = build_retrieval_query(vitals, assessment)

    assert "tachycardia" in query
    assert "heart rate bpm 142.0" in query


def test_build_query_nominal_vitals():
    """Asserts that nominal vitals fall back to base operational keywords."""
    vitals = make_vitals()
    ml_res = MLResultPayload(anomaly_label=0, confidence_score=0.95)
    assessment = assess_vitals(vitals, ml_res)

    query = build_retrieval_query(vitals, assessment)

    assert "emergency medical procedure checklist action steps" in query
