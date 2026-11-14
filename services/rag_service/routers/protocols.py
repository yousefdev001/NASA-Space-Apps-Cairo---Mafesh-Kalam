"""Protocols Retrieval Router for Fast-Path Emergency Checklist Access.

Bypasses LLM generation to deliver certified NASA Tier 1 operational procedures
with sub-200ms deterministic latency for acute vital emergencies.
"""

import time
from fastapi import APIRouter, HTTPException, status

from shared.constants import SeverityLevel
from shared.contracts.rag_contract import (
    EscalationPayload,
    GuidanceRequest,
    ProtocolRetrieveResponse,
)
from shared.rules.severity_engine import assess_vitals
from services.rag_service.retrieval.hybrid_retriever import HybridRetriever
from services.rag_service.retrieval.query_builder import build_retrieval_query

router = APIRouter(prefix="/v1/protocols", tags=["Protocols Retrieval"])

# Cached retriever instance
retriever_instance = HybridRetriever()


@router.post("/retrieve", response_model=ProtocolRetrieveResponse, status_code=status.HTTP_200_OK)
async def retrieve_protocols(request: GuidanceRequest) -> ProtocolRetrieveResponse:
    """Instant lookup of flight-certified NASA operational procedures.

    Evaluates physiological telemetry against mathematical rules and returns matching
    Tier 1 checklists in < 200ms.
    """
    t0 = time.perf_counter()

    # 1. Deterministic Severity Assessment
    assessment = assess_vitals(request.vitals, request.ml)

    # 2. Fast-path exit for nominal vitals
    if assessment.severity == SeverityLevel.NORMAL:
        elapsed_ms = (time.perf_counter() - t0) * 1000
        return ProtocolRetrieveResponse(
            request_id=request.request_id,
            status="skipped",
            severity=assessment.severity,
            condition_hypotheses=[],
            tier1_procedures=[],
            context_chunks=[],
            escalation=EscalationPayload(
                required=False,
                reason="Nominal telemetry, protocol retrieval not indicated.",
                target="None"
            ),
            latency_ms=round(elapsed_ms, 2)
        )

    # 3. Build deterministic search query
    query = build_retrieval_query(request.vitals, assessment)

    # 4. Execute hybrid retrieval
    tier1_procs, context_chunks = retriever_instance.retrieve(query=query, final_k=5)

    retrieval_status = "ok" if tier1_procs else "no_protocol_found"
    is_critical = assessment.severity == SeverityLevel.CRITICAL

    escalation = EscalationPayload(
        required=is_critical,
        reason="Acute critical physiological violation" if is_critical else "Physiological warning deviation",
        target="Flight Surgeon" if is_critical else "Crew Medical Officer"
    )

    elapsed_ms = (time.perf_counter() - t0) * 1000

    return ProtocolRetrieveResponse(
        request_id=request.request_id,
        status=retrieval_status,
        severity=assessment.severity,
        condition_hypotheses=assessment.condition_hypotheses,
        tier1_procedures=tier1_procs,
        context_chunks=context_chunks,
        escalation=escalation,
        latency_ms=round(elapsed_ms, 2)
    )
