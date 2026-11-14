"""Extractive Fallback Parser for Clinical Safety Assurance.

When LLM generation fails, times out, or produces ungrounded content,
this parser deterministically extracts numbered action steps directly from
the top-ranked NASA Tier 1 operational checklist chunk.
Guarantees zero medical hallucinations and 100% structured output continuity.
"""

import re
from typing import List, Optional

from shared.constants import FLIGHT_SURGEON_ESCALATION_CLAUSE, SeverityLevel
from shared.contracts.rag_contract import (
    ActionStep,
    EscalationPayload,
    GuidanceResponse,
    ProtocolChunkResult,
)
from shared.rules.severity_engine import SeverityAssessment

STEP_SPLIT_REGEX = re.compile(r'\n(?=\d+\.\s+)')
CLEAN_NUM_REGEX = re.compile(r'^\d+\.\s*')


def trigger_extractive_fallback(
    retrieved_tier1_chunks: List[ProtocolChunkResult],
    assessment: SeverityAssessment,
    request_id: str = "REQ-FALLBACK",
    latency_ms: float = 5.0
) -> GuidanceResponse:
    """Deterministically parse the highest-ranked Tier 1 chunk into structured ActionStep items.

    Parameters:
    ----------
    retrieved_tier1_chunks: List[ProtocolChunkResult]
        Retrieved Tier 1 operational checklist chunks.
    assessment: SeverityAssessment
        Deterministic clinical assessment containing enforced severity and hypotheses.
    request_id: str
        Original request identifier.
    latency_ms: float
        Fallback processing latency in milliseconds.

    Returns:
    -------
    GuidanceResponse:
        Structured guidance payload in degraded mode.
    """
    if not retrieved_tier1_chunks:
        # No Tier 1 chunks available
        return GuidanceResponse(
            request_id=request_id,
            status="no_protocol_found",
            severity=assessment.severity,
            condition_hypotheses=assessment.condition_hypotheses,
            summary="No verified NASA Tier 1 operational checklist found for current condition.",
            steps=[],
            escalation=EscalationPayload(
                required=assessment.severity == SeverityLevel.CRITICAL,
                reason="No protocol found under elevated severity",
                target="Flight Surgeon" if assessment.severity == SeverityLevel.CRITICAL else "None"
            ),
            protocol_refs=[],
            active_provider="extractive_fallback",
            latency_ms=latency_ms
        )

    # Use the highest-ranked Tier 1 chunk
    top_chunk = retrieved_tier1_chunks[0]
    raw_text = top_chunk.text.strip()

    # Split into discrete numbered steps
    raw_steps = STEP_SPLIT_REGEX.split(raw_text)
    steps: List[ActionStep] = []

    step_counter = 1
    for raw_s in raw_steps:
        cleaned_action = raw_s.strip()
        if len(cleaned_action) >= 8:
            steps.append(ActionStep(
                n=step_counter,
                action=cleaned_action,
                source_chunk_id=top_chunk.chunk_id,
                ref_label=top_chunk.ref_label,
                warning="Extracted verbatim under fail-safe degraded fallback." if top_chunk.has_warning else None
            ))
            step_counter += 1

    # Fallback to single chunk step if regex splitting yields nothing
    if not steps:
        steps.append(ActionStep(
            n=1,
            action=raw_text[:400],
            source_chunk_id=top_chunk.chunk_id,
            ref_label=top_chunk.ref_label,
            warning=None
        ))

    # Construct Escalation Payload
    is_critical = assessment.severity == SeverityLevel.CRITICAL
    escalation = EscalationPayload(
        required=is_critical,
        reason="Acute critical physiological violation" if is_critical else "Clinical monitoring advisory",
        target="Flight Surgeon" if is_critical else "Crew Medical Officer"
    )

    summary = f"DEGRADED MODE EXTRACTIVE FALLBACK: Verbatim procedure steps extracted from {top_chunk.ref_label}."
    if is_critical:
        summary = f"{FLIGHT_SURGEON_ESCALATION_CLAUSE} — {summary}"

    return GuidanceResponse(
        request_id=request_id,
        status="degraded",
        severity=assessment.severity,
        condition_hypotheses=assessment.condition_hypotheses,
        summary=summary,
        steps=steps,
        escalation=escalation,
        protocol_refs=[top_chunk.ref_label],
        active_provider="extractive_fallback",
        latency_ms=latency_ms
    )
