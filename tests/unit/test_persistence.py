"""Unit tests for structured persistence, TelemetryAuditRecord, and audit logging."""

from datetime import datetime, timezone
import uuid
import pytest
from sqlalchemy import select

from infrastructure.database.audit_service import record_guidance_audit
from infrastructure.database.connection import SessionLocal
from infrastructure.database.models import TelemetryAuditRecord
from shared.constants import SeverityLevel
from shared.contracts.ml_contract import MLPredictRequest
from shared.contracts.rag_contract import (
    ActionStep,
    EscalationPayload,
    GuidanceRequest,
    GuidanceResponse,
    MLResultPayload,
)
from shared.rules.severity_engine import assess_vitals


@pytest.fixture
def sample_guidance_pair():
    req_id = f"REQ-AUDIT-{uuid.uuid4().hex[:8]}"
    vitals = MLPredictRequest(
        request_id=req_id,
        astronaut_id="ASTRO-01",
        heart_rate_bpm=125.0,
        hrv_rmssd_ms=45.0,
        spo2_percent=86.0,
        body_temperature_c=37.1,
        respiratory_rate_bpm=22.0,
        systolic_bp_mmhg=118.0,
        diastolic_bp_mmhg=76.0,
        heart_rate_bpm_rolling_mean_60min=75.0,
        heart_rate_bpm_rolling_std_60min=3.0,
        hrv_rmssd_ms_rolling_mean_60min=50.0,
        hrv_rmssd_ms_rolling_std_60min=4.0,
        spo2_percent_rolling_mean_60min=97.0,
        spo2_percent_rolling_std_60min=1.0,
        body_temperature_c_rolling_mean_60min=36.8,
        body_temperature_c_rolling_std_60min=0.2,
        respiratory_rate_bpm_rolling_mean_60min=15.0,
        respiratory_rate_bpm_rolling_std_60min=1.0,
    )
    request = GuidanceRequest(
        request_id=req_id,
        astronaut_id="ASTRO-01",
        timestamp=datetime.now(timezone.utc),
        ml=MLResultPayload(anomaly_label=1, confidence_score=0.92),
        vitals=vitals,
    )
    assessment = assess_vitals(vitals, request.ml)
    guidance = GuidanceResponse(
        request_id=request.request_id,
        status="ok",
        severity=assessment.severity,
        condition_hypotheses=assessment.condition_hypotheses,
        summary="Clinical advisory on acute hypoxia event.",
        steps=[
            ActionStep(
                n=1,
                action="Don Quick-Don Mask immediately.",
                source_chunk_id="chk_revk_01",
                ref_label="Medical Checklist Rev K, p.226",
            )
        ],
        escalation=EscalationPayload(
            required=True,
            reason="SpO2 dropped below critical threshold",
            target="Flight Surgeon",
        ),
        protocol_refs=["Medical Checklist Rev K, p.226"],
        active_provider="ollama",
        latency_ms=124.5,
    )
    return request, assessment, guidance


def test_audit_model_serialization():
    """Verify TelemetryAuditRecord JSON serialization helpers."""
    record = TelemetryAuditRecord(
        request_id="REQ-TEST",
        astronaut_id="ASTRO-01",
        severity=SeverityLevel.CRITICAL.value,
        status="ok",
        active_provider="ollama",
    )
    vitals_sample = {"heart_rate_bpm": 85.0, "spo2_percent": 98.0}
    record.set_vitals(vitals_sample)
    assert record.get_vitals() == vitals_sample

    hypotheses = ["hypoxia_suspected", "tachycardia_mild"]
    record.set_hypotheses(hypotheses)
    assert record.get_hypotheses() == hypotheses


def test_record_guidance_audit(sample_guidance_pair):
    """Verify record_guidance_audit inserts record into persistent audit store."""
    request, assessment, guidance = sample_guidance_pair

    record_id = record_guidance_audit(request, assessment, guidance)
    assert record_id is not None
    assert isinstance(record_id, int)

    # Query back using SessionLocal
    with SessionLocal() as session:
        stmt = select(TelemetryAuditRecord).where(
            TelemetryAuditRecord.id == record_id
        )
        saved = session.execute(stmt).scalar_one_or_none()

        assert saved is not None
        assert saved.astronaut_id == "ASTRO-01"
        assert saved.severity == SeverityLevel.CRITICAL.value
        assert saved.ml_anomaly_label == 1
        assert saved.ml_confidence_score == 0.92
        assert saved.action_steps_count == 1
        assert saved.escalation_required is True
        assert saved.escalation_target == "Flight Surgeon"
        assert "hypoxia_suspected" in saved.get_hypotheses()
        assert saved.get_vitals()["spo2_percent"] == 86.0
