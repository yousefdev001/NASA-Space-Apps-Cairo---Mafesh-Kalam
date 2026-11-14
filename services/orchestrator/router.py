"""Unified Orchestration Router for Web and Mobile Client Applications."""

import logging
import time
from fastapi import APIRouter, HTTPException, status

from services.ml_service.model_runner import runner_instance
from services.orchestrator.contracts import (
    AssessAstronautRequest,
    AssessAstronautResponse,
    MLAssessmentPayload,
)
from services.rag_service.gateway.llm_gateway import gateway_instance
from services.rag_service.routers.guidance import generate_guidance
from shared.contracts.rag_contract import GuidanceRequest, MLResultPayload

logger = logging.getLogger("auramed.orchestrator")

router = APIRouter(prefix="/api/v1", tags=["Astronaut Assessment Gateway"])


@router.post(
    "/assess-astronaut",
    response_model=AssessAstronautResponse,
    status_code=status.HTTP_200_OK,
    summary="Unified End-to-End Astronaut Telemetry Assessment",
)
async def assess_astronaut(request: AssessAstronautRequest) -> AssessAstronautResponse:
    """Execute end-to-end telemetry assessment across NASA ML and RAG microservices.

    Consolidated pipeline:
    1. ML Anomaly & Multi-Hazard Degradation Scoring (<30ms).
    2. Deterministic Vital Severity Engine Invariance Check.
    3. Hybrid NASA Tier 1 Retrieval & Cloud LLM Synthesis (Groq gpt-oss-120b) with Ollama fallback.
    4. Six-Stage Clinical Safety Validation & Extractive Fallback.
    5. Structured Persistence & Audit Recording.
    """
    t0 = time.perf_counter()

    # 1. ML Multi-Hazard Inference
    try:
        ml_resp = runner_instance.predict_vitals(request.vitals)
        feature_dict = runner_instance._map_vitals_to_features(request.vitals)
        hazard_data = runner_instance.predict_hazard_full(feature_dict)

        ml_payload = MLResultPayload(
            anomaly_label=ml_resp.anomaly_label,
            confidence_score=ml_resp.confidence_score,
        )
        ml_assessment = MLAssessmentPayload(
            anomaly_detected=bool(ml_resp.anomaly_label == 1),
            anomaly_label=ml_resp.anomaly_label,
            confidence_score=ml_resp.confidence_score,
            hazard_risk_level=hazard_data.get("predicted_risk_level", "Unknown"),
            predicted_degradation_score=hazard_data.get("predicted_degradation_score"),
        )
    except Exception as exc:
        logger.warning(f"ML inference degraded: {exc}. Proceeding with rule-based safety checks.")
        ml_payload = None
        ml_assessment = MLAssessmentPayload(
            anomaly_detected=False,
            anomaly_label=0,
            confidence_score=0.0,
            hazard_risk_level="Unknown (Degraded ML)",
            predicted_degradation_score=None,
        )

    # 2. Formulate RAG Guidance Request
    guidance_req = GuidanceRequest(
        request_id=request.request_id,
        astronaut_id=request.astronaut_id,
        timestamp=request.timestamp,
        ml=ml_payload,
        vitals=request.vitals,
    )

    # 3. Execute Decision-Support Guidance Pipeline
    guidance_res = await generate_guidance(guidance_req)

    total_latency = (time.perf_counter() - t0) * 1000
    operating_mode = await gateway_instance.get_operating_mode()

    # 4. Construct Consolidated Response
    return AssessAstronautResponse(
        request_id=request.request_id,
        astronaut_id=request.astronaut_id,
        status=guidance_res.status,
        operating_mode=operating_mode,
        active_provider=guidance_res.active_provider,
        severity=guidance_res.severity,
        condition_hypotheses=guidance_res.condition_hypotheses,
        ml_assessment=ml_assessment,
        summary=guidance_res.summary,
        action_steps=guidance_res.steps,
        escalation=guidance_res.escalation,
        protocol_references=guidance_res.protocol_refs,
        total_latency_ms=round(total_latency, 2),
    )
