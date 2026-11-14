"""Interactive RAG Chat and Clinical Copilot Router.

Provides:
1. REST API endpoint `POST /v1/chat` for free-form clinical inquiries.
2. Web UI interface `GET /chat` with NASA Mission Control dark theme and preset Golden scenarios.
"""

import json
import logging
import re
import time
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field, model_validator

from services.ml_service.model_runner import runner_instance
from services.rag_service.gateway.llm_gateway import gateway_instance
from services.rag_service.guardrails.extractive_fallback import trigger_extractive_fallback
from services.rag_service.guardrails.safety_validator import run_guardrails
from services.rag_service.retrieval.hybrid_retriever import get_retriever
from services.rag_service.retrieval.query_builder import build_retrieval_query
from shared.constants import FLIGHT_SURGEON_ESCALATION_CLAUSE, SeverityLevel
from shared.contracts.ml_contract import MLPredictRequest
from shared.contracts.rag_contract import ActionStep, EscalationPayload, GuidanceResponse, MLResultPayload
from shared.rules.severity_engine import assess_vitals
from shared.system_prompts import AURAMED_COPILOT_CHAT_INSTRUCTIONS, AURAMED_SYSTEM_INSTRUCTIONS

logger = logging.getLogger("auramed.chat")

router = APIRouter(tags=["Conversational Clinical RAG"])


def _get_retriever():
    return get_retriever()


class ChatHistoryMessage(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message text content")


class ChatMessageRequest(BaseModel):
    query: Optional[str] = Field(default=None, description="Natural language medical inquiry or scenario")
    message: Optional[str] = Field(default=None, description="Alias for query (supported for mobile client compatibility)")
    astronaut_id: str = Field(default="ASTRO-01", description="Astronaut identifier")
    vitals: Optional[Dict[str, float]] = Field(
        default=None, description="Optional explicit 17-feature telemetry dictionary"
    )
    history: Optional[List[ChatHistoryMessage]] = Field(
        default=None, description="Optional previous conversation turns for multi-turn dialogue context"
    )
    mode: Optional[str] = Field(
        default="auto", description="Operating mode: 'online' (fast cloud), 'offline' (local Ollama), or 'auto'"
    )

    @model_validator(mode="after")
    def ensure_query(self):
        if not self.query and self.message:
            self.query = self.message
        if not self.query or len(self.query.strip()) < 2:
            raise ValueError("Either 'query' or 'message' must be provided with at least 2 characters.")
        return self


class MLInsights(BaseModel):
    anomaly_detected: bool = Field(..., description="Whether ML anomaly detector flagged an anomaly")
    anomaly_confidence: float = Field(..., description="Confidence score of ML anomaly detection")
    hazard_risk_level: str = Field(..., description="Predicted space hazard risk level")
    degradation_score: float = Field(..., description="Predicted astronaut physiological degradation score (0-100)")
    telemetry_summary: Dict[str, Any] = Field(default_factory=dict, description="Summary of parsed vital signs")
    countermeasures: List[str] = Field(default_factory=list, description="Clinical countermeasures suggested by hazard model")


class SourceReference(BaseModel):
    chunk_id: str = Field(..., description="Unique chunk identifier")
    document_title: str = Field(..., description="NASA document title")
    procedure_title: Optional[str] = Field(default=None, description="Procedure or section title")
    source_tier: str = Field(default="NASA_TIER_1", description="Evidence tier (NASA_TIER_1, etc.)")
    snippet: Optional[str] = Field(default=None, description="Verbatim source snippet")


class ChatMessageResponse(BaseModel):
    query: str
    astronaut_id: str
    severity: str
    summary: str
    response: Optional[str] = Field(default=None, description="Alias for summary for mobile clients")
    action_steps: List[ActionStep]
    escalation: EscalationPayload
    protocol_references: List[str]
    sources: List[SourceReference] = Field(default_factory=list, description="Verified NASA reference documents and chunks cited")
    active_provider: str
    latency_ms: float
    ml_insights: Optional[MLInsights] = None
    is_protocol: bool = Field(default=False, description="Whether this response represents an actionable emergency medical protocol checklist")


SYSTEM_CHAT_PROMPT = """# AuraMed — NASA Assistant Flight Surgeon
You are Dr. AuraMed, an expert NASA Assistant Flight Surgeon providing clinical decision support to the Crew Medical Officer and astronauts.

### MANDATORY CLINICAL DIRECTIVES:
1. Clinical Identity: You ARE the Assistant Flight Surgeon. Speak with calm composure, professional empathy, articulate intelligence, and operational discipline (in the natural, engaging, and clear style of ChatGPT). When introducing yourself, state that you are Dr. AuraMed, the NASA Assistant Flight Surgeon.
2. STRICT PROTOCOL GROUNDING:
   - Every procedural step, clinical countermeasure, tool, and medication MUST be derived directly from verified NASA protocols, Tier 1 operational checklists, and aerospace medical standards.
   - For emergency/acute situations: Provide exact actionable steps citing eligible Tier 1 checklist sources. Explain zero-g execution (CMRS stabilization, fluid suction, space medical kits SOMS/CHECS).
   - In ANY medical response: Base all physiological explanations and medical advice strictly on verified spaceflight standards (e.g. NASA-STD-3001, JSC Medical Checklists). Zero ungrounded speculation.
3. ChatGPT-Style Conversational Phrasing:
   - In `emergency_assessment.evidence_summary`, author a comprehensive, fluid, and beautifully formatted clinical response in clean markdown.
   - Begin with a warm, intelligent assessment correlating symptoms with vitals and explaining microgravity physiological mechanisms (fluid shift, space motion sickness).
   - Provide clear, actionable steps with practical instructions without robotic templates.
4. Language: Always respond in natural, professional, spoken aerospace medical English.
5. Return output strictly as a JSON object matching this schema:
{
  "system": "AuraMed",
  "status": "SUPPORTED",
  "emergency_assessment": {
    "evidence_summary": "Unified conversational medical guidance grounded strictly in NASA protocol"
  },
  "steps": [
    {
      "step_number": 1,
      "instruction": "Action step",
      "source_chunk_id": "Exact chunk ID from retrieved context"
    }
  ],
  "escalation_required": true,
  "escalation_reason": "Clinical escalation to primary Flight Surgeon"
}"""

SYSTEM_CONVERSATIONAL_PROMPT = """# AuraMed — NASA Assistant Flight Surgeon
You are Dr. AuraMed, an expert Assistant Flight Surgeon dedicated to supporting the health, safety, and physical well-being of astronauts during spaceflight missions (ISS, Artemis Lunar Gateway, Mars Transit).
You operate as a certified clinical decision-support physician and copilot working alongside the Crew Medical Officer (CMO) and Mission Control.

OPERATIONAL INSTRUCTIONS & PROTOCOL GROUNDING:
1. Clinical Identity: You ARE the Assistant Flight Surgeon. When greeting or speaking, introduce yourself as Dr. AuraMed, the NASA Assistant Flight Surgeon.
2. ChatGPT-Style Intelligent Conversation:
   - Provide a clear, natural, intelligent, articulate, and reassuring conversational response in fluent, professional English (in the style of ChatGPT).
   - In ANY medical response, explanation, symptom assessment, or countermeasure: strictly rely on verified spaceflight medicine protocols, NASA-STD-3001, and JSC medical checklists.
   - Do NOT invent arbitrary medical opinions or ungrounded advice. All physiological and clinical guidance must reflect certified aerospace medical science.
3. PROTOCOL PROCEDURES IN EMERGENCY / ACUTE CASES:
   - When a situation requires an operational checklist or acute intervention, adhere strictly to the verified checklist steps and equipment from NASA documentation.
   - For general conversational or educational inquiries without acute distress, provide a clear, supportive, protocol-grounded conversational explanation with `steps: []` empty.
4. If the astronaut reports mild symptoms, provide reassuring flight surgeon guidance based on space adaptation protocols (e.g. fluid shifts, space motion sickness), advise which vitals to measure, and direct them to the Flight Surgeon if symptoms evolve.
5. Tone: Calm, empathetic, direct, reassuring, and professionally clinical (optimized for speech/Voice TTS).

REQUIRED JSON OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "system": "AuraMed",
  "status": "CONVERSATIONAL",
  "emergency_assessment": {
    "evidence_summary": "Your fluid, reassuring, protocol-grounded Assistant Flight Surgeon response in fluent Arabic (or English)...",
    "reported_situation": "General inquiry / Medical advice",
    "reported_symptoms": []
  },
  "steps": [],
  "sources": [],
  "escalation_required": false,
  "escalation_reason": "General conversational query - no acute escalation required"
}
"""

CLINICAL_EMERGENCY_REGEX_PATTERNS = [
    # English emergency and protocol keywords
    r"\bprotocol\b", r"\bprocedure\b", r"\bchecklist\b", r"\bemergency\b",
    r"\bhypoxia\b", r"\barrhythmia\b", r"\bcardiac\b", r"\barrest\b", r"\bcpr\b",
    r"\bresuscitation\b", r"\bchest pain\b", r"\bdyspnea\b", r"\bshortness of breath\b",
    r"\bunconscious\b", r"\bloss of consciousness\b", r"\bsyncope\b", r"\bseizure\b",
    r"\bhemorrhage\b", r"\bbleeding\b", r"\bfracture\b", r"\btrauma\b", r"\btoxic\b",
    r"\bdecompression\b", r"\bdcs\b", r"\bbarotrauma\b", r"\banaphylaxis\b",
    r"\bchoking\b", r"\baspiration\b", r"\bburn\b", r"\bpalpitation\b",
    r"\btreatment step\b", r"\baction step\b", r"\boperational procedure\b",
    r"\bshock\b", r"\bpneumothorax\b", r"\btoxic exposure\b",
]


def is_abnormal_telemetry(explicit_metrics: Dict[str, float]) -> bool:
    """Check if any explicitly measured vital signs fall outside nominal spaceflight safety thresholds."""
    if not explicit_metrics:
        return False
    if "spo2_percent" in explicit_metrics and explicit_metrics["spo2_percent"] < 95.0:
        return True
    if "heart_rate_bpm" in explicit_metrics and (explicit_metrics["heart_rate_bpm"] > 105.0 or explicit_metrics["heart_rate_bpm"] < 50.0):
        return True
    if "systolic_bp_mmhg" in explicit_metrics and (explicit_metrics["systolic_bp_mmhg"] > 140.0 or explicit_metrics["systolic_bp_mmhg"] < 90.0):
        return True
    if "body_temperature_c" in explicit_metrics and (explicit_metrics["body_temperature_c"] > 37.8 or explicit_metrics["body_temperature_c"] < 35.8):
        return True
    if "respiratory_rate_bpm" in explicit_metrics and (explicit_metrics["respiratory_rate_bpm"] > 22.0 or explicit_metrics["respiratory_rate_bpm"] < 10.0):
        return True
    return False


def classify_query_intent(query: str, explicit_metrics: Dict[str, float]) -> bool:
    """Classify user query into:
    True  -> Clinical Emergency / Protocol / Abnormal Telemetry Inquiry (triggers Tier 1 checklist RAG).
    False -> Conversational / General Medical / Educational Inquiry (triggers conversational flight surgeon copilot).
    """
    # 1. Any abnormal explicit telemetry triggers clinical emergency pipeline
    if is_abnormal_telemetry(explicit_metrics):
        return True

    # 2. Check for emergency clinical keywords or protocol requests
    query_lower = query.lower()
    for pattern in CLINICAL_EMERGENCY_REGEX_PATTERNS:
        if re.search(pattern, query_lower, re.IGNORECASE):
            return True

    return False


def extract_or_default_vitals(
    query: str, vitals_dict: Optional[Dict[str, float]] = None
) -> tuple[MLPredictRequest, Dict[str, float], bool]:
    """Extract numbers from query text or supply baseline nominal values.
    
    Returns:
        vitals (MLPredictRequest): safe object for downstream models.
        explicit_metrics (Dict[str, float]): only metrics explicitly provided or parsed.
        has_explicit_vitals (bool): True if at least one vital sign was sent or parsed.
    """
    base = {
        "heart_rate_bpm": 72.0,
        "hrv_rmssd_ms": 50.0,
        "spo2_percent": 98.0,
        "body_temperature_c": 36.8,
        "respiratory_rate_bpm": 14.0,
        "systolic_bp_mmhg": 118.0,
        "diastolic_bp_mmhg": 76.0,
        "heart_rate_bpm_rolling_mean_60min": 72.0,
        "heart_rate_bpm_rolling_std_60min": 2.0,
        "hrv_rmssd_ms_rolling_mean_60min": 50.0,
        "hrv_rmssd_ms_rolling_std_60min": 3.0,
        "spo2_percent_rolling_mean_60min": 98.0,
        "spo2_percent_rolling_std_60min": 0.5,
        "body_temperature_c_rolling_mean_60min": 36.8,
        "body_temperature_c_rolling_std_60min": 0.1,
        "respiratory_rate_bpm_rolling_mean_60min": 14.0,
        "respiratory_rate_bpm_rolling_std_60min": 1.0,
    }

    explicit_metrics: Dict[str, float] = {}

    vitals_aliases = {
        "spo2": "spo2_percent",
        "heart_rate": "heart_rate_bpm",
        "hr": "heart_rate_bpm",
        "pulse": "heart_rate_bpm",
        "systolic_bp": "systolic_bp_mmhg",
        "sys_bp": "systolic_bp_mmhg",
        "diastolic_bp": "diastolic_bp_mmhg",
        "dia_bp": "diastolic_bp_mmhg",
        "temp_c": "body_temperature_c",
        "temp": "body_temperature_c",
        "temperature": "body_temperature_c",
        "hrv": "hrv_rmssd_ms",
        "rr": "respiratory_rate_bpm",
        "resp_rate": "respiratory_rate_bpm",
    }

    if vitals_dict:
        for k, v in vitals_dict.items():
            if v is not None:
                target_key = vitals_aliases.get(k, k)
                if target_key in base:
                    base[target_key] = float(v)
                    explicit_metrics[target_key] = float(v)

    # Regex heuristics from query (English) to supplement or override
    spo2_match = (
        re.search(r"(?:spo2|oxygen|saturation).*?(\d{2,3})", query, re.IGNORECASE)
        or re.search(r"(\d{2,3})\s*%", query)
    )
    if spo2_match:
        val = float(spo2_match.group(1))
        if 50.0 <= val <= 100.0:
            base["spo2_percent"] = val
            explicit_metrics["spo2_percent"] = val

    hr_match = re.search(
        r"(?:heart rate|pulse|hr|bpm).*?(\d{2,3})",
        query,
        re.IGNORECASE
    )
    if hr_match:
        val = float(hr_match.group(1))
        if 30.0 <= val <= 250.0:
            base["heart_rate_bpm"] = val
            explicit_metrics["heart_rate_bpm"] = val

    bp_match = re.search(
        r"(?:blood pressure|bp).*?(\d{2,3})\s*[/,]\s*(\d{2,3})",
        query,
        re.IGNORECASE
    )
    if bp_match:
        base["systolic_bp_mmhg"] = float(bp_match.group(1))
        base["diastolic_bp_mmhg"] = float(bp_match.group(2))
        explicit_metrics["systolic_bp_mmhg"] = float(bp_match.group(1))
        explicit_metrics["diastolic_bp_mmhg"] = float(bp_match.group(2))

    temp_match = re.search(
        r"(?:temp|temperature).*?(\d{2}(?:\.\d)?)",
        query,
        re.IGNORECASE
    )
    if temp_match:
        val = float(temp_match.group(1))
        if 30.0 <= val <= 45.0:
            base["body_temperature_c"] = val
            explicit_metrics["body_temperature_c"] = val

    rr_match = re.search(
        r"(?:respiratory rate|resp rate|rr)\s*(?:is|:|\s*)?\s*(\d{1,2})",
        query,
        re.IGNORECASE
    )
    if rr_match:
        val = float(rr_match.group(1))
        if 4.0 <= val <= 60.0:
            base["respiratory_rate_bpm"] = val
            explicit_metrics["respiratory_rate_bpm"] = val

    # Clamping boundaries to guarantee strict contract safety with MLPredictRequest
    base["heart_rate_bpm"] = max(20.0, min(250.0, float(base.get("heart_rate_bpm", 72.0))))
    base["hrv_rmssd_ms"] = max(0.0, min(300.0, float(base.get("hrv_rmssd_ms", 50.0))))
    base["spo2_percent"] = max(50.0, min(100.0, float(base.get("spo2_percent", 98.0))))
    base["body_temperature_c"] = max(30.0, min(45.0, float(base.get("body_temperature_c", 36.8))))
    base["respiratory_rate_bpm"] = max(4.0, min(60.0, float(base.get("respiratory_rate_bpm", 14.0))))
    base["systolic_bp_mmhg"] = max(50.0, min(260.0, float(base.get("systolic_bp_mmhg", 118.0))))
    base["diastolic_bp_mmhg"] = max(30.0, min(160.0, float(base.get("diastolic_bp_mmhg", 76.0))))

    has_explicit_vitals = len(explicit_metrics) > 0

    return MLPredictRequest(
        request_id=f"REQ-CHAT-{int(time.time())}",
        astronaut_id="ASTRO-01",
        **base
    ), explicit_metrics, has_explicit_vitals


@router.post("/v1/chat", response_model=ChatMessageResponse)
async def chat_with_auramed(request: ChatMessageRequest) -> ChatMessageResponse:
    """Conversational endpoint executing live NASA hybrid retrieval, ML inference, and Flight Surgeon copilot reasoning."""
    t0 = time.perf_counter()

    # 1. Parse Telemetry (if explicitly provided in request body or parsed from query)
    vitals, explicit_metrics, has_explicit_vitals = extract_or_default_vitals(request.query, request.vitals)

    # 2. Determine Query Intent: Clinical Emergency vs Conversational
    is_clinical_emergency = classify_query_intent(request.query, explicit_metrics)

    if not is_clinical_emergency:
        # ==============================================================
        # CONVERSATIONAL & SPACE MEDICINE TRACK (No Checklist Dumping)
        # ==============================================================
        retriever = _get_retriever()
        tier1_chunks, context_chunks = retriever.retrieve(query=request.query, final_k=3)
        background_context = ""
        all_chunks = (tier1_chunks + context_chunks)[:2]
        if all_chunks:
            snippets = [f"[{c.doc_title}]: {c.text.strip()[:250]}" for c in all_chunks]
            background_context = "SUPPORTING NASA REFERENCE CONTEXT:\n" + "\n".join(snippets) + "\n\n"

        history_section = ""
        if request.history:
            recent = request.history[-6:]
            lines = []
            for msg in recent:
                role_tag = "CREW / USER" if msg.role == "user" else "AURAMED FLIGHT SURGEON COPILOT"
                lines.append(f"{role_tag}: {msg.content}")
            history_section = "PREVIOUS CONVERSATION HISTORY:\n" + "\n".join(lines) + "\n\n"

        prompt = f"""USER INQUIRY & CONVERSATION:
"{request.query}"

{history_section}{background_context}USER INTENT: Conversational / Educational / General Inquiry (No acute emergency protocol requested).

CRITICAL INSTRUCTIONS FOR DR. AURAMED (NASA ASSISTANT FLIGHT SURGEON):
1. Clinical Identity: You ARE Dr. AuraMed, certified NASA Assistant Flight Surgeon. Speak with calm composure, empathy, articulate intelligence, and professional aerospace medical competence in the style of ChatGPT.
2. STRICT PROTOCOL GROUNDING: In ANY medical response, symptoms explanation, or advice: strictly ground your statements in verified spaceflight standards and NASA protocols (e.g., NASA-STD-3001, JSC Medical Checklists). Zero unverified speculation.
3. Provide a natural, intelligent, direct, and reassuring conversational response in fluent, professional aerospace English.
4. Do NOT invent emergency checklist steps, and do NOT force CPR, intubation, oxygen mask setups, or acute trauma protocols for general conversational or educational questions.
5. If the user asks about space medicine concepts (e.g., microgravity, fluid shift, space adaptation syndrome, radiation, sleep in orbit), explain them clearly and scientifically as an aerospace medicine physician.
6. If the user asks general questions or greets you, reply cordially, professionally, and concisely as their Assistant Flight Surgeon.
7. If the user reports mild symptoms without requesting an emergency checklist, provide reassuring clinical guidance grounded in protocol and advise them what vital signs to monitor (e.g., check SpO2 or blood pressure) and practical flight surgeon directives.
8. Return valid JSON strictly matching this schema:
{{
  "system": "AuraMed",
  "status": "CONVERSATIONAL",
  "emergency_assessment": {{
    "evidence_summary": "Your fluid, conversational, protocol-grounded Assistant Flight Surgeon response in English...",
    "reported_situation": "General inquiry / Medical advice",
    "reported_symptoms": []
  }},
  "steps": [],
  "sources": [],
  "escalation_required": false,
  "escalation_reason": "General conversational query - no acute escalation required"
}}
"""
        provider, raw_json = await gateway_instance.generate(
            prompt=prompt,
            system_instruction=SYSTEM_CONVERSATIONAL_PROMPT,
            mode=request.mode,
        )
        elapsed_ms = (time.perf_counter() - t0) * 1000

        if provider == "extractive_fallback" or not raw_json:
            fallback_msg = (
                "Hello, I am Dr. AuraMed, your NASA Assistant Flight Surgeon. "
                "I am here to monitor your health, provide NASA protocol-grounded clinical decision support, "
                "and assist you throughout your mission. How can I support you right now?"
            )
            return ChatMessageResponse(
                query=request.query,
                astronaut_id=request.astronaut_id,
                severity="Normal",
                summary=fallback_msg,
                response=fallback_msg,
                action_steps=[],
                escalation=EscalationPayload(required=False, reason="None", target="None"),
                protocol_references=[],
                sources=[],
                active_provider="conversational_fallback",
                latency_ms=round(elapsed_ms, 2),
                ml_insights=None,
                is_protocol=False,
            )

        dummy_assessment = assess_vitals(vitals, MLResultPayload(anomaly_label=0, confidence_score=0.99))
        is_valid, guidance = run_guardrails(
            raw_json,
            [],
            dummy_assessment,
            vitals.request_id,
            elapsed_ms,
            is_conversational=True,
        )

        return ChatMessageResponse(
            query=request.query,
            astronaut_id=request.astronaut_id,
            severity="Normal",
            summary=guidance.summary,
            response=guidance.summary,
            action_steps=[],
            escalation=EscalationPayload(required=False, reason="None", target="None"),
            protocol_references=[],
            sources=[],
            active_provider=provider if is_valid else "conversational_fallback",
            latency_ms=round(elapsed_ms, 2),
            ml_insights=None,
            is_protocol=False,
        )

    # ==============================================================
    # CLINICAL EMERGENCY & PROTOCOL RAG TRACK
    # ==============================================================
    # 1. Telemetry & ML Model Inferences
    ml_pred = runner_instance.predict_vitals(vitals)
    ml_res_payload = MLResultPayload(
        anomaly_label=ml_pred.anomaly_label,
        confidence_score=ml_pred.confidence_score
    )

    features = runner_instance._map_vitals_to_features(vitals)
    try:
        hazard_data = runner_instance.predict_hazard_full(features)
    except Exception as err:
        logger.warning("Hazard model evaluation error: %s", err)
        hazard_data = {
            "predicted_risk_level": "Nominal_Low_Risk",
            "risk_probabilities": {"Nominal_Low_Risk": 99.0, "Moderate_Risk": 1.0, "Critical_Risk": 0.0},
            "predicted_degradation_score": 10.0,
            "clinical_countermeasures": ["Maintain standard mission telemetry monitoring."]
        }

    # Combined Deterministic Severity Assessment (Rules + ML Anomaly)
    assessment = assess_vitals(vitals, ml_res_payload)

    # 2. Hybrid Retrieval from 3,085 NASA manual chunks with Clinical Query Synthesis
    synth_query = build_retrieval_query(vitals, assessment)
    retriever = _get_retriever()
    search_query = f"{request.query} {synth_query}"
    tier1_chunks, context_chunks = retriever.retrieve(query=search_query, final_k=5)

    if not tier1_chunks:
        # Fallback to pure synthesized clinical query
        tier1_chunks, context_chunks = retriever.retrieve(query=synth_query, final_k=5)

    if not tier1_chunks:
        # Fallback to user query alone
        tier1_chunks, context_chunks = retriever.retrieve(query=request.query, final_k=5)

    if not tier1_chunks:
        elapsed_ms = (time.perf_counter() - t0) * 1000
        fallback = trigger_extractive_fallback([], assessment, vitals.request_id, elapsed_ms)
        return ChatMessageResponse(
            query=request.query,
            astronaut_id=request.astronaut_id,
            severity=assessment.severity.value,
            summary=fallback.summary,
            response=fallback.summary,
            action_steps=[],
            escalation=fallback.escalation,
            protocol_references=[],
            sources=[],
            active_provider="extractive_fallback",
            latency_ms=round(elapsed_ms, 2),
            is_protocol=True,
            ml_insights=MLInsights(
                anomaly_detected=bool(ml_pred.anomaly_label == 1),
                anomaly_confidence=round(float(ml_pred.confidence_score), 4),
                hazard_risk_level=str(hazard_data.get("predicted_risk_level", "Unknown")),
                degradation_score=round(float(hazard_data.get("predicted_degradation_score", 0.0)), 2),
                telemetry_summary={
                    "heart_rate_bpm": vitals.heart_rate_bpm,
                    "spo2_percent": vitals.spo2_percent,
                    "blood_pressure": f"{int(vitals.systolic_bp_mmhg)}/{int(vitals.diastolic_bp_mmhg)} mmHg",
                    "respiratory_rate_bpm": vitals.respiratory_rate_bpm,
                    "body_temperature_c": vitals.body_temperature_c,
                    "hrv_rmssd_ms": vitals.hrv_rmssd_ms,
                },
                countermeasures=hazard_data.get("clinical_countermeasures", [])
            )
        )

    # 3. LLM Synthesis with Copilot Telemetry & ML Context (Token-Optimized)
    tier1_items = []
    for c in tier1_chunks[:2]:
        clean_chunk_text = c.text.strip()
        if len(clean_chunk_text) > 350:
            clean_chunk_text = clean_chunk_text[:350] + "..."
        tier1_items.append(
            f"--- CHUNK ID: {c.chunk_id} ---\n"
            f"source_chunk_id: {c.chunk_id}\n"
            f"document_title: {c.doc_title}\n"
            f"procedure_title: {c.procedure_title}\n"
            f"source_text:\n{clean_chunk_text}\n"
        )
    tier1_text = "\n".join(tier1_items)

    context_items = []
    for c in context_chunks[:1]:
        ctx_snip = c.text.strip()[:180]
        context_items.append(f"[{c.chunk_id}]: {ctx_snip}")
    context_text = "\n".join(context_items) if context_items else "None"

    # 4. Multi-turn conversation history integration
    history_section = ""
    if request.history:
        recent = request.history[-6:]
        lines = []
        for msg in recent:
            role_tag = "CREW / USER" if msg.role == "user" else "AURAMED FLIGHT SURGEON COPILOT"
            lines.append(f"{role_tag}: {msg.content}")
        history_section = "PREVIOUS CONVERSATION HISTORY:\n" + "\n".join(lines) + "\n\n"

    # Rules triggered summary
    rules_triggered_str = (
        ", ".join([f"{r.rule_name} ({r.metric}={r.value})" for r in assessment.triggered_rules])
        if assessment.triggered_rules else "None (Nominal physiological baseline)"
    )

    # Machine Learning Model inference summary
    ml_status_str = (
        f"- Anomaly Detected: {'YES (Anomaly Flagged)' if ml_pred.anomaly_label == 1 else 'NO (Nominal Telemetry)'}\n"
        f"- Confidence Score: {ml_pred.confidence_score * 100:.1f}%\n"
        f"- Hazard Risk Level: {hazard_data.get('predicted_risk_level', 'Nominal_Low_Risk')}\n"
        f"- Degradation Score: {hazard_data.get('predicted_degradation_score', 0):.1f}"
    )

    # Dynamic Telemetry Status Section
    if has_explicit_vitals:
        explicit_parts = []
        if "heart_rate_bpm" in explicit_metrics:
            explicit_parts.append(f"Heart Rate: {explicit_metrics['heart_rate_bpm']:.0f} bpm")
        if "spo2_percent" in explicit_metrics:
            explicit_parts.append(f"Oxygen Saturation SpO2: {explicit_metrics['spo2_percent']:.0f}%")
        if "systolic_bp_mmhg" in explicit_metrics:
            explicit_parts.append(f"Blood Pressure: {explicit_metrics['systolic_bp_mmhg']:.0f}/{explicit_metrics.get('diastolic_bp_mmhg', 80):.0f} mmHg")
        if "body_temperature_c" in explicit_metrics:
            explicit_parts.append(f"Body Temperature: {explicit_metrics['body_temperature_c']:.1f}°C")
        if "respiratory_rate_bpm" in explicit_metrics:
            explicit_parts.append(f"Respiratory Rate: {explicit_metrics['respiratory_rate_bpm']:.0f} bpm")

        telemetry_status_prompt = (
            "REPORTED VITAL SIGNS (ONLY THESE SPECIFIC READINGS WERE PROVIDED BY USER):\n"
            + "\n".join([f"- {p}" for p in explicit_parts]) + "\n"
            + "(CRITICAL: Other unlisted vital signs were NOT measured or provided. Do NOT fabricate numbers for unprovided metrics. Address ONLY what was reported)."
        )
    else:
        telemetry_status_prompt = (
            "PHYSIOLOGICAL TELEMETRY STATUS:\n"
            "- NO VITAL SIGNS were measured or provided for this inquiry (No HR, SpO2, BP, or Temp numbers sent).\n"
            "- CRITICAL DIRECTIVE: Do NOT assume or hallucinate default numbers (NEVER say 'your pulse is 72' or 'vitals are nominal'!).\n"
            "- Acknowledge the symptoms directly, and explicitly advise the user which specific vital signs should be measured (e.g. check pulse, SpO2, blood pressure)."
        )

    prompt = f"""USER INQUIRY & REPORTED SITUATION:
"{request.query}"

{history_section}EVALUATED CLINICAL SEVERITY: {assessment.severity.value}
TRIGGERED HYPOTHESES / REPORTED SYMPTOMS: {', '.join(assessment.condition_hypotheses) if assessment.condition_hypotheses else 'Routine medical inquiry'}
DETERMINISTIC CLINICAL RULES TRIGGERED: {rules_triggered_str}

MACHINE LEARNING (ML) MODEL OUTPUT:
{ml_status_str}

{telemetry_status_prompt}

RETRIEVED ELIGIBLE NASA TIER 1 OPERATIONAL CHECKLISTS:
{tier1_text}

RETRIEVED NASA TIER 2/3 MEDICAL CONTEXT:
{context_text}

Provide a supportive, conversational, and medically grounded Flight Surgeon response in `emergency_assessment.evidence_summary`.
Return ONLY valid JSON matching the schema with 1-3 actionable steps citing source_chunk_id.
"""

    provider, raw_json = await gateway_instance.generate(
        prompt=prompt,
        system_instruction=SYSTEM_CHAT_PROMPT,
        mode=request.mode,
    )
    elapsed_ms = (time.perf_counter() - t0) * 1000

    if provider == "extractive_fallback" or not raw_json:
        guidance = trigger_extractive_fallback(tier1_chunks, assessment, vitals.request_id, elapsed_ms)
    else:
        is_valid, guidance = run_guardrails(raw_json, tier1_chunks, assessment, vitals.request_id, elapsed_ms)
        if is_valid:
            guidance.active_provider = provider

    if has_explicit_vitals:
        ml_insights = MLInsights(
            anomaly_detected=bool(ml_pred.anomaly_label == 1),
            anomaly_confidence=round(float(ml_pred.confidence_score), 4),
            hazard_risk_level=str(hazard_data.get("predicted_risk_level", "Nominal_Low_Risk")),
            degradation_score=round(float(hazard_data.get("predicted_degradation_score", 0.0)), 2),
            telemetry_summary={
                "heart_rate_bpm": explicit_metrics.get("heart_rate_bpm"),
                "spo2_percent": explicit_metrics.get("spo2_percent"),
                "blood_pressure": (
                    f"{int(explicit_metrics['systolic_bp_mmhg'])}/{int(explicit_metrics.get('diastolic_bp_mmhg', 80))} mmHg"
                    if "systolic_bp_mmhg" in explicit_metrics else None
                ),
                "respiratory_rate_bpm": explicit_metrics.get("respiratory_rate_bpm"),
                "body_temperature_c": explicit_metrics.get("body_temperature_c"),
                "hrv_rmssd_ms": explicit_metrics.get("hrv_rmssd_ms"),
            },
            countermeasures=hazard_data.get("clinical_countermeasures", [])
        )
    else:
        ml_insights = MLInsights(
            anomaly_detected=False,
            anomaly_confidence=0.0,
            hazard_risk_level="Awaiting_Telemetry",
            degradation_score=0.0,
            telemetry_summary={"status": "No explicit telemetry was provided with this inquiry."},
            countermeasures=[]
        )

    # Build rich source references for client inspection (e.g., collapsible citations drawer)
    source_refs = []
    for c in tier1_chunks:
        source_refs.append(
            SourceReference(
                chunk_id=c.chunk_id,
                document_title=c.doc_title,
                procedure_title=c.procedure_title,
                source_tier=str(getattr(c, "tier", getattr(c, "source_tier", "NASA_TIER_1"))),
                snippet=c.text.strip()[:300] if hasattr(c, "text") and c.text else None,
            )
        )
    for c in context_chunks:
        source_refs.append(
            SourceReference(
                chunk_id=c.chunk_id,
                document_title=c.doc_title,
                procedure_title=c.procedure_title,
                source_tier=str(getattr(c, "tier", getattr(c, "source_tier", "NASA_TIER_2"))),
                snippet=c.text.strip()[:200] if hasattr(c, "text") and c.text else None,
            )
        )

    return ChatMessageResponse(
        query=request.query,
        astronaut_id=request.astronaut_id,
        severity=guidance.severity.value if hasattr(guidance.severity, "value") else str(guidance.severity),
        summary=guidance.summary,
        response=guidance.summary,
        action_steps=guidance.steps,
        escalation=guidance.escalation,
        protocol_references=guidance.protocol_refs,
        sources=source_refs,
        active_provider=guidance.active_provider,
        latency_ms=round(elapsed_ms, 2),
        ml_insights=ml_insights,
        is_protocol=True,
    )


@router.get("/chat", response_class=HTMLResponse)
async def chat_web_interface():
    """Interactive Spaceflight Medical Copilot Web Interface."""
    return """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AuraMed — NASA Flight Surgeon Medical Copilot</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .glass { background: rgba(17, 24, 39, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
    .chat-scroll::-webkit-scrollbar { width: 6px; }
    .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 4px; }
  </style>
</head>
<body class="text-gray-100 flex flex-col h-screen overflow-hidden">

  <!-- Header -->
  <header class="glass px-6 py-4 flex items-center justify-between border-b border-gray-800">
    <div class="flex items-center space-x-3">
      <div class="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
        <i class="fa-solid fa-user-astronaut"></i>
      </div>
      <div>
        <h1 class="font-bold text-lg text-white flex items-center space-x-2">
          <span>AuraMed Medical Copilot</span>
          <span class="text-xs bg-blue-900/60 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">NASA Space Apps 2026</span>
        </h1>
        <p class="text-xs text-gray-400">Offline-First Evidence-Grounded Decision Support | JSC-48031 & NASA-STD-3001</p>
      </div>
    </div>
    <div class="flex items-center space-x-4">
      <div class="text-right hidden sm:block">
        <span class="text-xs text-gray-400 block">LLM Engine</span>
        <span id="engineBadge" class="text-xs font-mono font-bold text-green-400 flex items-center justify-end space-x-1">
          <span class="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
          <span>Groq (gpt-oss-120b) + Ollama</span>
        </span>
      </div>
      <a href="/docs" target="_blank" class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-300 border border-gray-700 transition">
        <i class="fa-solid fa-book-medical mr-1"></i> Swagger API
      </a>
    </div>
  </header>

  <!-- Main Container -->
  <main class="flex-1 flex flex-col max-w-5xl w-full mx-auto p-4 overflow-hidden">
    
    <!-- Quick Scenario Presets -->
    <div class="mb-3 flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
      <span class="text-gray-400 font-medium whitespace-nowrap"><i class="fa-solid fa-bolt text-amber-400 mr-1"></i> Golden Scenarios:</span>
      <button onclick="setQuery('Astronaut exhibiting acute cyanosis and oxygen saturation drop to SpO2 85%. Request emergency protocol.')" class="bg-red-950/40 text-red-300 border border-red-500/40 px-3 py-1 rounded-full hover:bg-red-900/60 transition whitespace-nowrap">
        🚨 Acute Hypoxia (SpO2 85%)
      </button>
      <button onclick="setQuery('Astronaut telemetry displays extreme tachycardia with heart rate 145 bpm and palpitations.')" class="bg-amber-950/40 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full hover:bg-amber-900/60 transition whitespace-nowrap">
        ❤️ Severe Tachycardia (145 bpm)
      </button>
      <button onclick="setQuery('What are the exact step-by-step procedures for Cardiopulmonary Resuscitation CPR on the shuttle/ISS?')" class="bg-blue-950/40 text-blue-300 border border-blue-500/40 px-3 py-1 rounded-full hover:bg-blue-900/60 transition whitespace-nowrap">
        🫁 CPR & Airway Resuscitation
      </button>
      <button onclick="setQuery('Core body temperature has dropped to 34.0 C. Provide active rewarming steps.')" class="bg-cyan-950/40 text-cyan-300 border border-cyan-500/40 px-3 py-1 rounded-full hover:bg-cyan-900/60 transition whitespace-nowrap">
        ❄️ Severe Hypothermia (34.0°C)
      </button>
      <button onclick="setQuery('All vitals nominal (SpO2 98%, HR 72, BP 120/80). Verify baseline routine protocol status.')" class="bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full hover:bg-emerald-900/60 transition whitespace-nowrap">
        🩺 Nominal Baseline (Healthy)
      </button>
    </div>

    <!-- Chat Messages Box -->
    <div id="chatBox" class="flex-1 glass rounded-2xl p-4 overflow-y-auto chat-scroll space-y-4 mb-3 border border-gray-800">
      
      <!-- Welcome Message -->
      <div class="flex items-start space-x-3">
        <div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
          <i class="fa-solid fa-stethoscope"></i>
        </div>
        <div class="bg-gray-800/90 rounded-2xl rounded-tl-none p-4 max-w-2xl border border-gray-700/60 text-sm">
          <p class="font-semibold text-blue-400 mb-1">AuraMed Medical Copilot</p>
          <p class="text-gray-200 leading-relaxed">
            Welcome, Flight Surgeon / Crew Medical Officer. I am connected directly to the <strong>NASA Medical Knowledge Store (3,085 authorized manual chunks)</strong> with 6-stage clinical safety guardrails.
          </p>
          <p class="text-gray-400 text-xs mt-2">
            Ask any clinical scenario, provide physiological readings, or select a scenario above to test live retrieval and synthesis.
          </p>
        </div>
      </div>

    </div>

    <!-- Input Bar -->
    <div class="glass rounded-2xl p-2 border border-gray-800 flex items-center space-x-2">
      <button id="voiceBtn" onclick="toggleChatVoice()" type="button" class="bg-gray-800 hover:bg-gray-700 text-cyan-400 p-2.5 rounded-xl border border-gray-700 transition flex items-center justify-center w-10 h-10" title="Start Live Voice (Gemini)">
        <i class="fa-solid fa-microphone" id="voiceIcon"></i>
      </button>
      <input id="queryInput" type="text" placeholder="Type astronaut clinical scenario (e.g. 'SpO2 86%, heart rate 130 bpm...')" 
             class="flex-1 bg-transparent px-4 py-2.5 text-sm text-white focus:outline-none placeholder-gray-500"
             onkeydown="if(event.key === 'Enter') sendMessage()" />
      <button id="sendBtn" onclick="sendMessage()" class="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-xl transition flex items-center space-x-2 text-sm shadow-lg shadow-blue-600/30">
        <span>Send</span>
        <i class="fa-solid fa-paper-plane text-xs"></i>
      </button>
    </div>

  </main>

  <script src="/static/js/voice_session.js"></script>
  <script>
    let chatHistory = [];
    let chatVoiceManager = null;

    async function toggleChatVoice() {
      const vBtn = document.getElementById('voiceBtn');
      const vIcon = document.getElementById('voiceIcon');
      
      if (chatVoiceManager && (chatVoiceManager.state === 'LISTENING' || chatVoiceManager.state === 'TRANSCRIBING' || chatVoiceManager.state === 'SPEAKING')) {
        chatVoiceManager.stop();
        chatVoiceManager = null;
        vBtn.className = "bg-gray-800 hover:bg-gray-700 text-cyan-400 p-2.5 rounded-xl border border-gray-700 transition flex items-center justify-center w-10 h-10";
        vIcon.className = "fa-solid fa-microphone";
        return;
      }

      chatVoiceManager = new VoiceSessionManager({
        astronautId: 'ASTRO-01',
        voicePreference: 'Kore',
        silenceTimeoutMs: 1800,
        autoSubmitToChat: false,
        onStateChange: (state) => {
          if (state === 'LISTENING') {
            vBtn.className = "bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl border border-emerald-400 transition animate-pulse flex items-center justify-center w-10 h-10";
            vIcon.className = "fa-solid fa-microphone";
          } else if (state === 'SPEAKING') {
            vBtn.className = "bg-cyan-600 hover:bg-cyan-500 text-white p-2.5 rounded-xl border border-cyan-400 transition animate-pulse flex items-center justify-center w-10 h-10";
            vIcon.className = "fa-solid fa-volume-high";
          } else if (state === 'ENDED' || state === 'ERROR') {
            vBtn.className = "bg-gray-800 hover:bg-gray-700 text-cyan-400 p-2.5 rounded-xl border border-gray-700 transition flex items-center justify-center w-10 h-10";
            vIcon.className = "fa-solid fa-microphone";
          }
        },
        onInterimTranscript: (text) => {
          document.getElementById('queryInput').value = text;
        },
        onFinalTranscript: (text) => {
          document.getElementById('queryInput').value = text;
          sendMessage();
        }
      });

      await chatVoiceManager.start();
    }

    function setQuery(text) {
      document.getElementById('queryInput').value = text;
      sendMessage();
    }

    async function sendMessage() {
      const input = document.getElementById('queryInput');
      const text = input.value.trim();
      if (!text) return;

      const chatBox = document.getElementById('chatBox');
      const sendBtn = document.getElementById('sendBtn');

      // 1. Append User Message
      chatBox.innerHTML += `
        <div class="flex items-start justify-end space-x-3">
          <div class="bg-blue-600 text-white rounded-2xl rounded-tr-none p-3.5 max-w-xl text-sm shadow">
            <p>${escapeHtml(text)}</p>
          </div>
          <div class="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
            <i class="fa-solid fa-user"></i>
          </div>
        </div>
      `;
      input.value = '';
      chatBox.scrollTop = chatBox.scrollHeight;

      // 2. Loading Placeholder
      const loadingId = 'loading-' + Date.now();
      chatBox.innerHTML += `
        <div id="${loadingId}" class="flex items-start space-x-3">
          <div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
            <i class="fa-solid fa-stethoscope"></i>
          </div>
          <div class="bg-gray-800/90 rounded-2xl rounded-tl-none p-4 max-w-xl border border-gray-700/60 text-sm text-gray-400 flex items-center space-x-3">
            <i class="fa-solid fa-circle-notch fa-spin text-blue-400 text-lg"></i>
            <span>Consulting NASA 3,085 manual chunks & evaluating guardrails...</span>
          </div>
        </div>
      `;
      chatBox.scrollTop = chatBox.scrollHeight;
      sendBtn.disabled = true;

      // Add to conversation history
      chatHistory.push({ role: 'user', content: text });

      try {
        const response = await fetch('/v1/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'auramed-secret-key-2026'
          },
          body: JSON.stringify({ query: text, astronaut_id: 'ASTRO-01', history: chatHistory.slice(-6) })
        });
        const data = await response.json();
        document.getElementById(loadingId).remove();

        // Color coding for severity
        let badgeColor = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
        let alertIcon = 'fa-solid fa-circle-check text-emerald-400';
        if (data.severity === 'Critical') {
          badgeColor = 'bg-red-950/80 text-red-200 border-red-500/60';
          alertIcon = 'fa-solid fa-triangle-exclamation text-red-400 animate-pulse';
        } else if (data.severity === 'Warning') {
          badgeColor = 'bg-amber-950/80 text-amber-200 border-amber-500/60';
          alertIcon = 'fa-solid fa-circle-exclamation text-amber-400';
        }

        // Action Steps HTML
        let stepsHtml = '';
        if (data.action_steps && data.action_steps.length > 0) {
          stepsHtml = `
            <div class="mt-3 pt-3 border-t border-gray-700/60">
              <p class="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center space-x-1">
                <i class="fa-solid fa-list-check text-blue-400 mr-1"></i>
                <span>NASA Tier 1 Operational Checklist (${data.action_steps.length} Steps):</span>
              </p>
              <div class="space-y-2">
                ${data.action_steps.map(s => `
                  <div class="bg-gray-900/80 p-2.5 rounded-xl border border-gray-800 text-xs">
                    <p class="text-gray-100 font-medium">${s.action}</p>
                    <div class="flex items-center justify-between text-gray-400 mt-1.5 pt-1.5 border-t border-gray-800/60">
                      <span class="text-[11px] text-blue-300"><i class="fa-solid fa-bookmark mr-1"></i>${escapeHtml(s.ref_label)}</span>
                      <span class="font-mono text-[10px] text-gray-500">${s.source_chunk_id}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }

        // Escalation Banner
        let escalationHtml = '';
        if (data.escalation && data.escalation.required) {
          escalationHtml = `
            <div class="mt-3 bg-red-950/40 border border-red-600/40 rounded-xl p-3 flex items-start space-x-3">
              <i class="fa-solid fa-tower-broadcast text-red-400 mt-0.5"></i>
              <div>
                <p class="text-xs font-bold text-red-300 uppercase">Emergency Human Escalation: ${data.escalation.target}</p>
                <p class="text-xs text-red-200/80 mt-0.5">${data.escalation.reason}</p>
              </div>
            </div>
          `;
        }

        chatBox.innerHTML += `
          <div class="flex items-start space-x-3">
            <div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
              <i class="fa-solid fa-stethoscope"></i>
            </div>
            <div class="bg-gray-800/90 rounded-2xl rounded-tl-none p-4 max-w-2xl border border-gray-700/60 text-sm shadow-xl">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center space-x-1.5 ${badgeColor}">
                  <i class="${alertIcon}"></i>
                  <span>${data.severity.toUpperCase()}</span>
                </span>
                <span class="text-[11px] font-mono text-gray-400">
                  <i class="fa-solid fa-server mr-1"></i>${data.active_provider} (${data.latency_ms} ms)
                </span>
              </div>
              <div class="text-gray-200 leading-relaxed space-y-1">
                ${formatMarkdownToHtml(data.summary || '')}
              </div>
              ${stepsHtml}
              ${escalationHtml}
            </div>
          </div>
        `;
        chatHistory.push({ role: 'assistant', content: data.summary || '' });
      } catch (err) {
        document.getElementById(loadingId).remove();
        chatBox.innerHTML += `
          <div class="flex items-start space-x-3">
            <div class="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">!</div>
            <div class="bg-red-950/80 border border-red-800 text-red-200 rounded-2xl p-3 text-sm">
              Error connecting to AuraMed RAG API: ${err.message}
            </div>
          </div>
        `;
      } finally {
        sendBtn.disabled = false;
        chatBox.scrollTop = chatBox.scrollHeight;
      }
    }

    function formatMarkdownToHtml(markdownText) {
      if (!markdownText) return '';
      let text = String(markdownText).trim();
      text = escapeHtml(text);

      const lines = text.split('\\n');
      let html = '';
      let inList = false;

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) {
          if (inList) { html += '</ul>'; inList = false; }
          continue;
        }

        // Section Headers: ### Header
        if (line.startsWith('### ')) {
          if (inList) { html += '</ul>'; inList = false; }
          const headerText = line.substring(4);
          let icon = 'fa-stethoscope text-blue-400';
          if (headerText.includes('Assessment') || headerText.includes('Understanding') || headerText.includes('Telemetry') || headerText.includes('ML')) {
            icon = 'fa-chart-line text-cyan-400';
          } else if (headerText.includes('Action') || headerText.includes('Procedure') || headerText.includes('Steps') || headerText.includes('Triage') || headerText.includes('Checklist')) {
            icon = 'fa-list-ol text-blue-400';
          } else if (headerText.includes('Microgravity') || headerText.includes('Equipment') || headerText.includes('Rationale') || headerText.includes('Fluid')) {
            icon = 'fa-microscope text-amber-400';
          } else if (headerText.includes('Directives') || headerText.includes('Safety') || headerText.includes('Advisory') || headerText.includes('Surgeon') || headerText.includes('Escalation')) {
            icon = 'fa-user-doctor text-emerald-400';
          }

          html += `
            <div class="mt-3 mb-1.5 pb-1 border-b border-gray-700/80 flex items-center gap-2">
              <i class="fa-solid ${icon} text-xs"></i>
              <h4 class="font-bold text-xs text-cyan-300">${headerText}</h4>
            </div>
          `;
          continue;
        }

        // Subheaders: ## or #
        if (line.startsWith('## ') || line.startsWith('# ')) {
          if (inList) { html += '</ul>'; inList = false; }
          const headerText = line.replace(/^#+\\s*/, '');
          html += `<h3 class="font-bold text-xs text-blue-300 mt-2.5 mb-1 pb-1 border-b border-gray-800">${headerText}</h3>`;
          continue;
        }

        // Bullet lists: - item or * item
        if (line.startsWith('- ') || line.startsWith('* ')) {
          if (!inList) {
            html += '<ul class="space-y-1 my-1.5 pl-2">';
            inList = true;
          }
          let itemContent = line.substring(2);
          itemContent = itemContent.replace(/\\*\\*(.*?)\\*\\*/g, '<strong class="text-white font-semibold">$1</strong>');
          html += `
            <li class="flex items-start gap-2 text-xs text-gray-300 leading-relaxed">
              <span class="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></span>
              <div>${itemContent}</div>
            </li>
          `;
          continue;
        }

        // Numbered lists: 1. item
        const numMatch = line.match(/^(\\d+)\\.\\s+(.*)/);
        if (numMatch) {
          if (inList) { html += '</ul>'; inList = false; }
          let itemContent = numMatch[2].replace(/\\*\\*(.*?)\\*\\*/g, '<strong class="text-white font-semibold">$1</strong>');
          html += `
            <div class="flex items-start gap-2 my-1 text-xs text-gray-300 leading-relaxed">
              <span class="h-4 w-4 rounded-full bg-gray-800 border border-gray-700 text-cyan-300 flex items-center justify-center font-bold text-[9px] flex-shrink-0 mt-0.5">${numMatch[1]}</span>
              <div>${itemContent}</div>
            </div>
          `;
          continue;
        }

        if (inList) {
          html += '</ul>';
          inList = false;
        }

        // Regular paragraphs with bolding
        let paragraphContent = line.replace(/\\*\\*(.*?)\\*\\*/g, '<strong class="text-white font-semibold">$1</strong>');
        html += `<p class="text-xs text-gray-300 leading-relaxed my-1">${paragraphContent}</p>`;
      }

      if (inList) {
        html += '</ul>';
      }
      return html;
    }

    function escapeHtml(string) {
      return String(string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
  </script>

</body>
</html>
"""
