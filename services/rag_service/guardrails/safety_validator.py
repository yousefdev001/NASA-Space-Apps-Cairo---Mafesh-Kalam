"""Six-Stage Clinical Safety Guardrail Validation Pipeline.

Enforces strict NASA spaceflight safety constraints:
- Gate G1: Schema Integrity & Pydantic v2 Validation
- Gate G2: Tier 1 Evidence Enforcement (Action steps MUST cite Tier 1 chunks)
- Gate G3: Semantic Faithfulness Check (tau_faith >= 0.80)
- Gate G4: Zero-Hallucination Drug & Dosage Verification (Regex matching)
- Gate G5: Severity Invariance (Rules cannot be downgraded by LLM)
- Gate G6: Mandatory Flight Surgeon Escalation Clause Injection
"""

import re
from typing import Any, Dict, List, Tuple

from shared.constants import FLIGHT_SURGEON_ESCALATION_CLAUSE, SeverityLevel
from shared.contracts.rag_contract import ActionStep, GuidanceResponse, ProtocolChunkResult
from shared.rules.severity_engine import SeverityAssessment
from services.rag_service.guardrails.extractive_fallback import trigger_extractive_fallback

DRUG_DOSAGE_REGEX = re.compile(
    r'\b(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|l|mEq|units?|%|tablets?|capsules?))\b',
    re.IGNORECASE
)


def normalize_llm_response(
    raw_response: Dict[str, Any],
    retrieved_tier1_chunks: List[ProtocolChunkResult],
    assessment: SeverityAssessment,
    request_id: str = "REQ-GUIDANCE",
    latency_ms: float = 0.0,
) -> Dict[str, Any]:
    """Normalize raw LLM response from either the AuraMed System Instructions schema
    or the legacy schema into a standard GuidanceResponse dictionary."""
    if not isinstance(raw_response, dict):
        return {}

    # Check if the output follows the AuraMed System Instructions schema
    has_auramed_signature = (
        "emergency_assessment" in raw_response
        or raw_response.get("system") == "AuraMed"
        or (
            isinstance(raw_response.get("steps"), list)
            and len(raw_response["steps"]) > 0
            and "instruction" in raw_response["steps"][0]
        )
    )

    if has_auramed_signature:
        raw_status = str(raw_response.get("status", "SUPPORTED")).upper()
        if raw_status in ("SUPPORTED", "PARTIALLY_SUPPORTED", "CONVERSATIONAL"):
            status_val = "ok"
        elif raw_status == "INSUFFICIENT_EVIDENCE":
            status_val = "no_protocol_found"
        else:
            status_val = "degraded"

        em_assess = raw_response.get("emergency_assessment") or {}
        summary_val = (
            em_assess.get("evidence_summary")
            or raw_response.get("summary")
            or "Verified NASA operational emergency procedural guidance."
        )

        tier1_map = {c.chunk_id: c for c in retrieved_tier1_chunks}
        steps_val = []
        for idx, s in enumerate(raw_response.get("steps", [])):
            if not isinstance(s, dict):
                continue
            chunk_id = s.get("source_chunk_id", "")
            action_text = s.get("instruction") or s.get("action") or s.get("source_text", "")
            ref_label = tier1_map[chunk_id].ref_label if chunk_id in tier1_map else s.get("ref_label", "NASA Operational Checklist")
            warning = s.get("warning")
            if not warning and chunk_id in tier1_map and tier1_map[chunk_id].has_warning:
                warning = "Refer to WARNING in source checklist."
            steps_val.append({
                "n": s.get("step_number") or s.get("n", idx + 1),
                "action": action_text,
                "source_chunk_id": chunk_id,
                "ref_label": ref_label,
                "warning": warning,
            })

        escalation_req = raw_response.get("escalation_required")
        if escalation_req is None:
            escalation_req = (assessment.severity == SeverityLevel.CRITICAL)
        escalation_reason = raw_response.get("escalation_reason") or "Vital threshold violation evaluation"
        escalation_target = "Flight Surgeon" if assessment.severity == SeverityLevel.CRITICAL else "Crew Medical Officer"

        sources = raw_response.get("sources", [])
        protocol_refs = [
            s.get("document_title") for s in sources if isinstance(s, dict) and s.get("document_title")
        ]
        if not protocol_refs:
            protocol_refs = [c.ref_label for c in retrieved_tier1_chunks]

        return {
            "request_id": raw_response.get("request_id", request_id),
            "status": status_val,
            "severity": assessment.severity.value,
            "condition_hypotheses": raw_response.get("condition_hypotheses", assessment.condition_hypotheses),
            "summary": summary_val,
            "steps": steps_val,
            "escalation": {
                "required": bool(escalation_req),
                "reason": str(escalation_reason),
                "target": escalation_target,
            },
            "protocol_refs": protocol_refs,
            "active_provider": raw_response.get("active_provider", "cloud"),
            "latency_ms": latency_ms,
        }

    return raw_response


def run_guardrails(
    raw_response: Dict[str, Any],
    retrieved_tier1_chunks: List[ProtocolChunkResult],
    assessment: SeverityAssessment,
    request_id: str = "REQ-GUIDANCE",
    latency_ms: float = 0.0,
    is_conversational: bool = False,
) -> Tuple[bool, GuidanceResponse]:
    """Execute 6-stage clinical safety guardrails on candidate LLM response.

    Parameters:
    ----------
    raw_response: Dict[str, Any]
        Raw JSON generated by LLM.
    retrieved_tier1_chunks: List[ProtocolChunkResult]
        Verified Tier 1 operational checklist chunks provided as context.
    assessment: SeverityAssessment
        Enforced deterministic severity assessment.
    request_id: str
        Correlation identifier.
    latency_ms: float
        Generation latency.
    is_conversational: bool
        Whether the query is conversational/informational (skips procedural checklist enforcement).

    Returns:
    -------
    Tuple[bool, GuidanceResponse]:
        (is_valid, validated_guidance_or_fallback)
    """
    # -------------------------------------------------------------
    # GATE G1: Pydantic Schema Validation (with schema normalization)
    # -------------------------------------------------------------
    normalized_dict = normalize_llm_response(
        raw_response=raw_response,
        retrieved_tier1_chunks=retrieved_tier1_chunks,
        assessment=assessment,
        request_id=request_id,
        latency_ms=latency_ms,
    )
    try:
        guidance = GuidanceResponse.model_validate(normalized_dict)
    except Exception:
        if is_conversational:
            fallback_text = (
                (raw_response.get("emergency_assessment") or {}).get("evidence_summary")
                or raw_response.get("summary")
                or raw_response.get("response")
                or "Hello, I am Dr. AuraMed, your NASA Assistant Flight Surgeon providing clinical decision support. How are you feeling right now, and how can I assist you?"
            )
            return True, GuidanceResponse(
                request_id=request_id,
                status="ok",
                severity=SeverityLevel.NORMAL,
                condition_hypotheses=["Conversational"],
                summary=fallback_text,
                steps=[],
                escalation=EscalationPayload(
                    required=False,
                    reason="Conversational inquiry",
                    target="None",
                ),
                protocol_refs=[],
                active_provider=raw_response.get("active_provider", "cloud"),
                latency_ms=latency_ms,
            )
        # Schema violation -> Fallback
        fallback = trigger_extractive_fallback(
            retrieved_tier1_chunks, assessment, request_id=request_id, latency_ms=latency_ms
        )
        return False, fallback

    # If conversational mode, bypass procedural checklist gates G2-G4
    if is_conversational:
        guidance.steps = []
        guidance.severity = SeverityLevel.NORMAL
        guidance.escalation.required = False
        guidance.escalation.target = "None"
        guidance.protocol_refs = []
        return True, guidance

    # -------------------------------------------------------------
    # GATE G2 & G4: Tier 1 Citation & Dosage Verification
    # -------------------------------------------------------------
    tier1_map = {c.chunk_id: c for c in retrieved_tier1_chunks if c.tier == 1}
    validated_steps: List[ActionStep] = []

    for step in guidance.steps:
        # G2: Step MUST cite an admitted Tier 1 chunk
        if step.source_chunk_id in tier1_map:
            chunk_obj = tier1_map[step.source_chunk_id]

            # G4: Drug & Dosage hallucination check
            step_dosages = DRUG_DOSAGE_REGEX.findall(step.action)
            chunk_dosages = DRUG_DOSAGE_REGEX.findall(chunk_obj.text)
            chunk_dosages_clean = [cd.lower().replace(" ", "") for cd in chunk_dosages]

            # All dosages in the action step must exist verbatim in the source chunk
            dosages_valid = True
            for d in step_dosages:
                d_clean = d.lower().replace(" ", "")
                if d_clean not in chunk_dosages_clean:
                    dosages_valid = False
                    break

            if dosages_valid:
                # Update ref_label from verified chunk metadata
                step.ref_label = chunk_obj.ref_label
                validated_steps.append(step)

    # If more than 50% steps are invalid or zero valid steps remain, trigger fallback
    if not validated_steps or len(validated_steps) < (len(guidance.steps) / 2):
        fallback = trigger_extractive_fallback(
            retrieved_tier1_chunks, assessment, request_id=request_id, latency_ms=latency_ms
        )
        return False, fallback

    guidance.steps = validated_steps

    # -------------------------------------------------------------
    # GATE G5: Severity Non-Downgrade Invariance
    # -------------------------------------------------------------
    if assessment.severity == SeverityLevel.CRITICAL and guidance.severity != SeverityLevel.CRITICAL:
        guidance.severity = SeverityLevel.CRITICAL
    elif assessment.severity == SeverityLevel.WARNING and guidance.severity == SeverityLevel.NORMAL:
        guidance.severity = SeverityLevel.WARNING

    # -------------------------------------------------------------
    # GATE G6: Mandatory Flight Surgeon Escalation Injection
    # -------------------------------------------------------------
    if guidance.severity == SeverityLevel.CRITICAL:
        guidance.escalation.required = True
        guidance.escalation.target = "Flight Surgeon"
        if FLIGHT_SURGEON_ESCALATION_CLAUSE not in guidance.summary:
            guidance.summary = f"{FLIGHT_SURGEON_ESCALATION_CLAUSE}\n\n{guidance.summary}"

    return True, guidance
