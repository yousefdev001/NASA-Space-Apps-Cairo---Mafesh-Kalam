"""Audit logging service for storing telemetry, ML results, and RAG clinical decisions."""

import logging
from typing import Optional

from infrastructure.database.connection import SessionLocal
from infrastructure.database.models import TelemetryAuditRecord
from shared.contracts.rag_contract import GuidanceRequest, GuidanceResponse
from shared.rules.severity_engine import SeverityAssessment

logger = logging.getLogger("auramed.audit")


def record_guidance_audit(
    request: GuidanceRequest,
    assessment: SeverityAssessment,
    guidance: GuidanceResponse
) -> Optional[int]:
    """Persist telemetry, ML output, and clinical guidance response to audit log.

    Returns the inserted record ID if successful, or None on failure.
    """
    try:
        with SessionLocal() as session:
            record = TelemetryAuditRecord(
                request_id=request.request_id,
                astronaut_id=request.astronaut_id,
                timestamp=request.timestamp,
                severity=guidance.severity.value,
                ml_anomaly_label=request.ml.anomaly_label if request.ml else None,
                ml_confidence_score=request.ml.confidence_score if request.ml else None,
                summary=guidance.summary,
                active_provider=guidance.active_provider,
                status=guidance.status,
                action_steps_count=len(guidance.steps),
                escalation_required=guidance.escalation.required,
                escalation_target=guidance.escalation.target,
                latency_ms=guidance.latency_ms,
            )
            record.set_vitals(request.vitals.model_dump(mode="json"))
            record.set_hypotheses(guidance.condition_hypotheses)

            session.add(record)
            session.commit()
            session.refresh(record)
            return record.id
    except Exception as exc:
        logger.warning(f"Telemetry audit recording failed gracefully: {exc}")
        return None
