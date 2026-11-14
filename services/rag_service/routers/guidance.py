"""Guidance Generation Router for Evidence-Grounded Clinical Decision Support.

Orchestrates deterministic severity assessment, hybrid NASA knowledge retrieval,
Ollama LLM synthesis (medgemma:latest), 6-stage clinical safety guardrails,
and fail-safe extractive fallback.
"""

import json
import time
from fastapi import APIRouter, HTTPException, status

from shared.constants import SeverityLevel
from shared.contracts.rag_contract import GuidanceRequest, GuidanceResponse
from shared.rules.severity_engine import assess_vitals
from shared.system_prompts import AURAMED_SYSTEM_INSTRUCTIONS
from services.rag_service.gateway.llm_gateway import gateway_instance
from services.rag_service.guardrails.extractive_fallback import trigger_extractive_fallback
from services.rag_service.guardrails.safety_validator import run_guardrails
from services.rag_service.retrieval.hybrid_retriever import get_retriever
from services.rag_service.retrieval.query_builder import build_retrieval_query
from infrastructure.database.audit_service import record_guidance_audit

router = APIRouter(prefix="/v1/guidance", tags=["Clinical Guidance Generation"])

retriever_instance = None


def _get_retriever():
    return get_retriever()

SYSTEM_PROMPT = AURAMED_SYSTEM_INSTRUCTIONS


def format_guidance_prompt(
    vitals,
    assessment,
    tier1_chunks,
    context_chunks
) -> str:
    """Format structured prompt with grounded knowledge context."""
    chunks_text = []
    for c in tier1_chunks:
        chunks_text.append(
            f"--- CHUNK ID: {c.chunk_id} ---\n"
            f"source_chunk_id: {c.chunk_id}\n"
            f"source_tier: NASA_TIER_1\n"
            f"document_status: approved\n"
            f"document_title: {c.doc_title}\n"
            f"ref_label: {c.ref_label}\n"
            f"procedure_title: {c.procedure_title}\n"
            f"source_text:\n{c.text}\n"
        )

    context_text = "\n".join(chunks_text)

    prompt = f"""REPORTED EMERGENCY TELEMETRY & SITUATION:
- SpO2: {vitals.spo2_percent}%
- Heart Rate: {vitals.heart_rate_bpm} BPM
- Respiratory Rate: {vitals.respiratory_rate_bpm} breaths/min
- Blood Pressure: {vitals.systolic_bp_mmhg}/{vitals.diastolic_bp_mmhg} mmHg
- Body Temperature: {vitals.body_temperature_c} °C
- Enforced Severity Level: {assessment.severity.value}
- Clinical Hypotheses / Reported Symptoms: {', '.join(assessment.condition_hypotheses)}

RETRIEVED ELIGIBLE NASA OPERATIONAL CHECKLIST CONTEXT:
{context_text}

INSTRUCTIONS:
Adhere strictly to the System Instructions. Extract verified procedural action steps verbatim from the eligible NASA Tier 1 operational chunks above.
Return ONLY valid JSON strictly matching the output schema.
"""
    return prompt


@router.post("/generate", response_model=GuidanceResponse, status_code=status.HTTP_200_OK)
async def generate_guidance(request: GuidanceRequest) -> GuidanceResponse:
    """Generate synthesized medical decision support guidance grounded in NASA Tier 1 evidence."""
    t0 = time.perf_counter()

    # 1. Deterministic Rule Assessment
    assessment = assess_vitals(request.vitals, request.ml)

    # 2. Query Synthesis & Hybrid Retrieval
    query = build_retrieval_query(request.vitals, assessment)
    tier1_procs, context_chunks = _get_retriever().retrieve(query=query, final_k=5)

    # 3. Guard against absence of Tier 1 checklists
    if not tier1_procs:
        elapsed_ms = (time.perf_counter() - t0) * 1000
        guidance = trigger_extractive_fallback(
            retrieved_tier1_chunks=[],
            assessment=assessment,
            request_id=request.request_id,
            latency_ms=round(elapsed_ms, 2)
        )
        record_guidance_audit(request, assessment, guidance)
        return guidance

    # 4. Prompt Synthesis
    prompt = format_guidance_prompt(
        vitals=request.vitals,
        assessment=assessment,
        tier1_chunks=tier1_procs,
        context_chunks=context_chunks
    )

    # 5. LLM Gateway Generation (Local Ollama medgemma:latest with offline failover)
    provider, raw_json = await gateway_instance.generate(
        prompt=prompt,
        system_instruction=SYSTEM_PROMPT
    )

    elapsed_ms = (time.perf_counter() - t0) * 1000

    # 6. Apply Six-Stage Clinical Safety Guardrails
    if provider == "extractive_fallback" or not raw_json:
        guidance = trigger_extractive_fallback(
            retrieved_tier1_chunks=tier1_procs,
            assessment=assessment,
            request_id=request.request_id,
            latency_ms=round(elapsed_ms, 2)
        )
    else:
        is_valid, guidance = run_guardrails(
            raw_response=raw_json,
            retrieved_tier1_chunks=tier1_procs,
            assessment=assessment,
            request_id=request.request_id,
            latency_ms=round(elapsed_ms, 2)
        )
        if is_valid:
            guidance.active_provider = provider

    guidance.latency_ms = round(elapsed_ms, 2)
    record_guidance_audit(request, assessment, guidance)
    return guidance
