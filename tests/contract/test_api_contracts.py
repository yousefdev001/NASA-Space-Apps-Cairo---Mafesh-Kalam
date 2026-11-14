"""Contract and Schema Validation Tests for AuraMed Data Models."""

import pytest
from pydantic import ValidationError

from shared.constants import SeverityLevel
from shared.contracts.ml_contract import MLPredictRequest, MLPredictResponse
from shared.contracts.rag_contract import (
    ActionStep,
    EscalationPayload,
    GuidanceRequest,
    GuidanceResponse,
    MLResultPayload,
    ProtocolChunkResult,
    ProtocolRetrieveResponse,
)
from shared.exceptions.error_models import ErrorResponse


@pytest.fixture
def valid_telemetry_dict():
    """Returns a dictionary containing 17 valid physiological telemetry metrics."""
    return {
        "request_id": "REQ-TEST-001",
        "astronaut_id": "ASTRO-42",
        "heart_rate_bpm": 72.0,
        "hrv_rmssd_ms": 45.0,
        "spo2_percent": 98.0,
        "body_temperature_c": 36.8,
        "respiratory_rate_bpm": 14.0,
        "systolic_bp_mmhg": 118.0,
        "diastolic_bp_mmhg": 76.0,
        "heart_rate_bpm_rolling_mean_60min": 71.5,
        "heart_rate_bpm_rolling_std_60min": 4.2,
        "hrv_rmssd_ms_rolling_mean_60min": 46.0,
        "hrv_rmssd_ms_rolling_std_60min": 5.1,
        "spo2_percent_rolling_mean_60min": 98.2,
        "spo2_percent_rolling_std_60min": 0.5,
        "body_temperature_c_rolling_mean_60min": 36.7,
        "body_temperature_c_rolling_std_60min": 0.2,
        "respiratory_rate_bpm_rolling_mean_60min": 14.2,
        "respiratory_rate_bpm_rolling_std_60min": 1.1,
    }


def test_ml_predict_request_valid(valid_telemetry_dict):
    """Asserts that a compliant 17-feature telemetry payload parses correctly."""
    req = MLPredictRequest(**valid_telemetry_dict)
    assert req.request_id == "REQ-TEST-001"
    assert req.spo2_percent == 98.0
    assert req.heart_rate_bpm == 72.0


def test_ml_predict_request_out_of_bounds_spo2(valid_telemetry_dict):
    """Asserts that SpO2 > 100% or < 50% triggers validation errors."""
    invalid_high = valid_telemetry_dict.copy()
    invalid_high["spo2_percent"] = 105.0
    with pytest.raises(ValidationError):
        MLPredictRequest(**invalid_high)

    invalid_low = valid_telemetry_dict.copy()
    invalid_low["spo2_percent"] = 40.0
    with pytest.raises(ValidationError):
        MLPredictRequest(**invalid_low)


def test_ml_predict_request_out_of_bounds_hr(valid_telemetry_dict):
    """Asserts that HR out of physiological bounds triggers validation error."""
    invalid = valid_telemetry_dict.copy()
    invalid["heart_rate_bpm"] = 15.0  # ge=20.0
    with pytest.raises(ValidationError):
        MLPredictRequest(**invalid)


def test_ml_predict_response_valid():
    """Asserts MLPredictResponse validates labels and confidence scores."""
    resp = MLPredictResponse(
        request_id="REQ-001",
        anomaly_label=1,
        confidence_score=0.94
    )
    assert resp.anomaly_label == 1
    assert resp.confidence_score == 0.94

    with pytest.raises(ValidationError):
        MLPredictResponse(request_id="REQ-002", anomaly_label=2, confidence_score=0.5)

    with pytest.raises(ValidationError):
        MLPredictResponse(request_id="REQ-003", anomaly_label=0, confidence_score=1.5)


def test_guidance_request_decoupled_ml(valid_telemetry_dict):
    """Asserts GuidanceRequest functions seamlessly when ml object is null."""
    vitals = MLPredictRequest(**valid_telemetry_dict)
    req_without_ml = GuidanceRequest(
        request_id="REQ-GUIDE-001",
        astronaut_id="ASTRO-42",
        ml=None,
        vitals=vitals
    )
    assert req_without_ml.ml is None
    assert req_without_ml.vitals.spo2_percent == 98.0

    req_with_ml = GuidanceRequest(
        request_id="REQ-GUIDE-002",
        astronaut_id="ASTRO-42",
        ml=MLResultPayload(anomaly_label=1, confidence_score=0.89),
        vitals=vitals
    )
    assert req_with_ml.ml.anomaly_label == 1


def test_action_step_validation():
    """Asserts ActionStep enforces 1-based indexing, minimum length, and citations."""
    step = ActionStep(
        n=1,
        action="Administer 100% O2 via Quick-Don Mask at 15 L/min.",
        source_chunk_id="chk_revk_hypoxia_001",
        ref_label="Medical Checklist Rev K, p.42",
        warning="Ensure seal is airtight before initiating flow."
    )
    assert step.n == 1
    assert step.warning is not None

    with pytest.raises(ValidationError):
        ActionStep(
            n=0,  # ge=1
            action="Too short",
            source_chunk_id="chk_01",
            ref_label="Rev K"
        )


def test_protocol_retrieve_response():
    """Asserts ProtocolRetrieveResponse serialization and status values."""
    chunk = ProtocolChunkResult(
        chunk_id="chk_revk_01",
        doc_id="doc_revk",
        doc_title="Medical Checklist Rev K PCN-4",
        tier=1,
        procedure_title="Emergency Oxygen Administration",
        page_start=42,
        ref_label="Rev K PCN-4, p.42",
        score=0.92,
        text="1. Don mask. 2. Verify oxygen flow."
    )
    resp = ProtocolRetrieveResponse(
        request_id="REQ-RET-01",
        status="ok",
        severity=SeverityLevel.CRITICAL,
        condition_hypotheses=["hypoxia_suspected"],
        tier1_procedures=[chunk],
        escalation=EscalationPayload(
            required=True,
            reason="SpO2 dropped below 88%",
            target="Flight Surgeon"
        ),
        latency_ms=45.2
    )
    assert resp.status == "ok"
    assert resp.severity == SeverityLevel.CRITICAL
    assert len(resp.tier1_procedures) == 1
    assert resp.tier1_procedures[0].tier == 1


def test_guidance_response_model():
    """Asserts GuidanceResponse validates provider literals and action steps."""
    guidance = GuidanceResponse(
        request_id="REQ-G-01",
        status="ok",
        severity=SeverityLevel.CRITICAL,
        condition_hypotheses=["hypoxia_suspected"],
        summary="Acute hypoxia event. Immediate supportive oxygen required.",
        steps=[
            ActionStep(
                n=1,
                action="Don emergency oxygen mask immediately.",
                source_chunk_id="chk_revk_01",
                ref_label="Medical Checklist Rev K, p.42"
            )
        ],
        escalation=EscalationPayload(
            required=True,
            reason="Critical SpO2 depression",
            target="Flight Surgeon"
        ),
        protocol_refs=["Medical Checklist Rev K, p.42"],
        active_provider="ollama",
        latency_ms=1850.5
    )
    assert guidance.active_provider == "ollama"
    assert len(guidance.steps) == 1


def test_error_response_contract():
    """Asserts standard ErrorResponse schema serialization."""
    err = ErrorResponse(
        error_code="NO_PROTOCOL_FOUND",
        message="No verified Tier 1 checklist matched the query criteria.",
        request_id="REQ-ERR-001",
        details={"query": "rare condition"}
    )
    assert err.error_code == "NO_PROTOCOL_FOUND"
    assert err.details["query"] == "rare condition"
