"""SQLAlchemy ORM models for AuraMed structured persistence and audit logging.

Provides schemas for telemetry recording, clinical decision-support auditing,
and offline request tracking.
"""

from datetime import datetime, timezone
import json
from typing import Any, Dict, List, Optional
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class TelemetryAuditRecord(Base):
    """Stores complete telemetry, ML predictions, and clinical RAG decision audit trail."""

    __tablename__ = "telemetry_audit_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(String(64), index=True, nullable=False)
    astronaut_id = Column(String(32), index=True, nullable=False)
    timestamp = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    # Physiological severity and ML flags
    severity = Column(String(16), nullable=False)
    ml_anomaly_label = Column(Integer, nullable=True)
    ml_confidence_score = Column(Float, nullable=True)

    # Serialized telemetry and hypotheses
    vitals_json = Column(Text, nullable=False)
    condition_hypotheses_json = Column(Text, nullable=True)

    # Decision-support output
    summary = Column(Text, nullable=True)
    active_provider = Column(String(32), nullable=False)
    status = Column(String(32), nullable=False)
    action_steps_count = Column(Integer, default=0)

    # Escalation directives
    escalation_required = Column(Boolean, default=False)
    escalation_target = Column(String(32), default="None")

    # Observability
    latency_ms = Column(Float, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    def set_vitals(self, vitals_dict: Dict[str, Any]) -> None:
        """Serialize vitals telemetry to JSON text."""
        self.vitals_json = json.dumps(vitals_dict, default=str)

    def get_vitals(self) -> Dict[str, Any]:
        """Deserialize vitals telemetry JSON."""
        return json.loads(self.vitals_json) if self.vitals_json else {}

    def set_hypotheses(self, hypotheses: List[str]) -> None:
        """Serialize clinical condition hypotheses to JSON text."""
        self.condition_hypotheses_json = json.dumps(hypotheses)

    def get_hypotheses(self) -> List[str]:
        """Deserialize condition hypotheses."""
        return json.loads(self.condition_hypotheses_json) if self.condition_hypotheses_json else []

    def __repr__(self) -> str:
        return (
            f"<TelemetryAuditRecord(id={self.id}, request_id='{self.request_id}', "
            f"astronaut_id='{self.astronaut_id}', severity='{self.severity}')>"
        )
