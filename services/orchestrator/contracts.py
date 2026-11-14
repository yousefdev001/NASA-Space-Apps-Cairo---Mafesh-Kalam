"""Data Contracts for AuraMed Unified Orchestration Gateway.

Provides combined schemas consumed by Web and Mobile applications.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

from shared.constants import SeverityLevel
from shared.contracts.ml_contract import MLPredictRequest
from shared.contracts.rag_contract import ActionStep, EscalationPayload


class AssessAstronautRequest(BaseModel):
    """Unified incoming request from Web / Mobile client."""
    request_id: str = Field(
        ..., min_length=4, max_length=64, description="Unique client request ID"
    )
    astronaut_id: str = Field(
        ..., min_length=2, max_length=32, description="Target astronaut identifier"
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Reading timestamp in UTC"
    )
    vitals: MLPredictRequest = Field(
        ..., description="Full 17 physiological telemetry readings"
    )


class MLAssessmentPayload(BaseModel):
    """Enriched ML anomaly detection and multi-hazard spaceflight scoring."""
    anomaly_detected: bool = Field(..., description="Whether ML detected anomalous physiological behavior")
    anomaly_label: int = Field(..., ge=0, le=1, description="Binary classification (0=Stable, 1=Anomaly)")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Model decision confidence score")
    hazard_risk_level: Optional[str] = Field(None, description="Spaceflight hazard category")
    predicted_degradation_score: Optional[float] = Field(None, description="Continuous physiological degradation (0-100)")


class AssessAstronautResponse(BaseModel):
    """Consolidated end-to-end response for astronaut medical monitoring."""
    request_id: str = Field(..., description="Echoed request identifier")
    astronaut_id: str = Field(..., description="Target astronaut identifier")
    status: Literal["ok", "degraded", "no_protocol_found"] = Field(
        ..., description="Overall assessment status"
    )
    operating_mode: Literal["online", "offline", "degraded"] = Field(
        ..., description="System operating mode (online Cloud / offline Ollama)"
    )
    active_provider: str = Field(
        ..., description="Generation provider utilized (cloud, gemini, groq, ollama, or extractive_fallback)"
    )
    severity: SeverityLevel = Field(
        ..., description="Enforced deterministic severity level (Normal, Warning, Critical)"
    )
    condition_hypotheses: List[str] = Field(
        default_factory=list, description="Clinical hypotheses evaluated"
    )
    ml_assessment: MLAssessmentPayload = Field(
        ..., description="ML model predictions"
    )
    summary: str = Field(
        ..., description="Clinical summary grounded in NASA evidence"
    )
    action_steps: List[ActionStep] = Field(
        default_factory=list, description="Procedural Tier 1 action checklist steps"
    )
    escalation: EscalationPayload = Field(
        ..., description="Flight surgeon and crew escalation directive"
    )
    protocol_references: List[str] = Field(
        default_factory=list, description="Cited NASA medical manual references"
    )
    total_latency_ms: float = Field(
        ..., description="Total end-to-end processing latency in milliseconds"
    )
