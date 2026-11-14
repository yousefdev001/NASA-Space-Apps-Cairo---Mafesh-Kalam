"""RAG Service Request and Response Data Contracts.

Defines schemas for protocol retrieval, clinical action steps, escalation payloads,
and evidence-grounded guidance generation.
"""

from datetime import datetime, timezone
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

from shared.constants import SeverityLevel
from shared.contracts.ml_contract import MLPredictRequest


class MLResultPayload(BaseModel):
    """Encapsulated ML prediction outcome passed into RAG pipeline."""
    anomaly_label: int = Field(
        ..., ge=0, le=1, description="0 = Normal/Stable, 1 = Anomaly detected"
    )
    confidence_score: float = Field(
        ..., ge=0.0, le=1.0, description="Model decision confidence score"
    )


class GuidanceRequest(BaseModel):
    """Incoming request for decision-support guidance generation."""
    request_id: str = Field(
        ..., min_length=4, max_length=64, description="Unique tracing request ID"
    )
    astronaut_id: str = Field(
        ..., min_length=2, max_length=32, description="Target astronaut ID"
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Request creation timestamp in UTC"
    )

    # Decoupled ML result: nullable so ML failure does not block Critical RAG retrieval
    ml: Optional[MLResultPayload] = Field(
        None,
        description="ML anomaly output, or null if ML service is degraded/offline"
    )

    # Complete 17 physiological telemetry fields
    vitals: MLPredictRequest = Field(
        ..., description="Full validated physiological telemetry object"
    )
    window_count: int = Field(
        default=12,
        ge=1,
        description="Number of readings in rolling window; if < 12, cold-start mode active"
    )
    options: Optional[dict] = Field(
        default_factory=lambda: {"mode": "auto"},
        description="Execution routing options"
    )


class ActionStep(BaseModel):
    """Discrete procedural action item strictly derived from Tier 1 checklist."""
    n: int = Field(..., ge=1, description="Sequential step index (1-based)")
    action: str = Field(
        ..., min_length=5, description="Procedural clinical step verbatim from Tier 1 chunk"
    )
    source_chunk_id: str = Field(
        ..., description="Unique ID of the source Tier 1 checklist chunk"
    )
    ref_label: str = Field(
        ..., description="Human-readable citation (e.g. Medical Checklist Rev K, p.42)"
    )
    warning: Optional[str] = Field(
        None, description="Associated WARNING or CAUTION notice verbatim from chunk"
    )


class EscalationPayload(BaseModel):
    """Flight surgeon and medical officer escalation directive."""
    required: bool = Field(..., description="Whether immediate human escalation is required")
    reason: str = Field(..., description="Clinical justification for escalation")
    target: Literal["Flight Surgeon", "Crew Medical Officer", "None"] = Field(
        ..., description="Designated recipient for escalation alert"
    )


class ProtocolChunkResult(BaseModel):
    """Individual protocol chunk retrieved from the hybrid knowledge index."""
    chunk_id: str = Field(..., description="Unique chunk identifier")
    doc_id: str = Field(..., description="Document ID in sources catalog")
    doc_title: str = Field(..., description="Official title of document")
    tier: int = Field(..., ge=1, le=3, description="Evidence tier: 1=Checklist, 2=Standard, 3=Background")
    procedure_title: str = Field(..., description="Identified procedure or section title")
    page_start: int = Field(..., description="Starting page number in raw PDF")
    ref_label: str = Field(..., description="Formatted reference label (e.g. DocTitle, p.X)")
    score: float = Field(..., description="Calibrated similarity/reranker score")
    text: str = Field(..., description="Verbatim text content of chunk")
    has_warning: bool = Field(
        default=False, description="Whether chunk contains WARNING or CAUTION notice"
    )


class ProtocolRetrieveResponse(BaseModel):
    """Fast-path protocol lookup response (target latency < 200ms)."""
    request_id: str = Field(..., description="Echoed request identifier")
    status: Literal["ok", "no_protocol_found", "skipped"] = Field(
        ..., description="Retrieval outcome status"
    )
    severity: SeverityLevel = Field(..., description="Evaluated severity level")
    condition_hypotheses: List[str] = Field(
        default_factory=list, description="Clinical hypotheses driving retrieval"
    )
    tier1_procedures: List[ProtocolChunkResult] = Field(
        default_factory=list, description="Admitted Tier 1 operational procedures"
    )
    context_chunks: List[ProtocolChunkResult] = Field(
        default_factory=list, description="Supporting Tier 2/3 background chunks"
    )
    escalation: EscalationPayload = Field(..., description="Escalation status directive")
    latency_ms: float = Field(..., description="Endpoint processing latency in milliseconds")


class GuidanceResponse(BaseModel):
    """Full synthesized decision-support guidance response."""
    request_id: str = Field(..., description="Echoed request identifier")
    status: Literal["ok", "degraded", "no_protocol_found"] = Field(
        ..., description="Guidance generation outcome status"
    )
    severity: SeverityLevel = Field(..., description="Final enforced severity level")
    condition_hypotheses: List[str] = Field(
        default_factory=list, description="Clinical hypotheses evaluated"
    )
    summary: str = Field(
        ..., description="Concise clinical summary grounded in certified evidence"
    )
    steps: List[ActionStep] = Field(
        default_factory=list, description="Ordered procedural action steps"
    )
    escalation: EscalationPayload = Field(..., description="Escalation directive")
    protocol_refs: List[str] = Field(
        default_factory=list, description="List of cited protocol reference labels"
    )
    active_provider: Literal["cloud", "ollama", "extractive_fallback"] = Field(
        ..., description="Provider that generated the output"
    )
    latency_ms: float = Field(..., description="Total processing latency in milliseconds")
