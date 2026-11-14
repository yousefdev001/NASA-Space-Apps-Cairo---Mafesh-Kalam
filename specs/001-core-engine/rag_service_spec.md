# AuraMed Phase 4 Technical Specification: RAG Decision Support Microservice

**Feature**: `001-core-engine` | **Phase**: `04-rag-service` | **Date**: 2026-11-13  
**Status**: Ready for Implementation | **Port**: `8002` | **Target Directory**: `services/rag_service/`

---

## 1. Architectural Scope & Service Responsibilities
The RAG Decision Support Microservice operates as an independent FastAPI service on port `8002`, providing two core operational endpoints:
1. `POST /v1/protocols/retrieve`: Sub-200ms deterministic checklist retrieval bypassing LLM generation for acute emergencies.
2. `POST /v1/guidance/generate`: Evidence-grounded synthesis powered by local Ollama (`medgemma:latest`) with 6 clinical safety guardrail gates and fail-safe extractive fallback.
3. `GET /health` & `GET /v1/index/info`: Offline readiness and knowledge base monitoring.

---

## 2. Fast-Path Protocols Lookup (`POST /v1/protocols/retrieve`)
- **Latency Budget**: $\le 200 \text{ ms}$.
- **Flow**:
  1. Validate incoming `GuidanceRequest`.
  2. Compute deterministic severity via `assess_vitals(request.vitals, request.ml)`.
  3. If `severity == Normal`, return immediately with `status = "skipped"` and empty procedures list ($\le 5 \text{ ms}$).
  4. If `severity in (Warning, Critical)`:
     - Generate deterministic query via `build_retrieval_query()`.
     - Execute hybrid retrieval (`hybrid_retriever.retrieve()`).
     - Populate `escalation` object (`Flight Surgeon` if Critical).
     - Return `ProtocolRetrieveResponse` containing Tier 1 procedures and supporting context chunks.

---

## 3. LLM Gateway & Local Ollama Integration (`services/rag_service/gateway/`)

### 3.1 Ollama Async Client (`ollama_client.py`)
- Target Runtime: Native Ollama on `http://127.0.0.1:11434`.
- Default Model: `medgemma:latest` (Gemma 3 4B BF16).
- VRAM Pinning: `keep_alive: -1` in request body to prevent model deallocation from Quadro RTX 3000 Max-Q GPU.
- Request Payload:
  ```json
  {
    "model": "medgemma:latest",
    "prompt": "<GROUNDED_PROMPT>",
    "format": "json",
    "stream": false,
    "keep_alive": -1,
    "options": {
      "temperature": 0.1,
      "top_p": 0.9,
      "num_ctx": 4096
    }
  }
  ```
- Timeout: 8.0 seconds with circuit breaker retry.

### 3.2 Gateway Circuit Breaker (`llm_gateway.py`)
- Supports cloud primary with automatic, zero-intervention fallback to local Ollama.
- If both cloud and local Ollama fail or time out, degrades to `active_provider = "extractive_fallback"`.

---

## 4. Six-Stage Clinical Safety Guardrails (`services/rag_service/guardrails/`)

### 4.1 Validation Pipeline
- **Gate G1 (Schema Integrity)**: Validates JSON structure against `GuidanceResponse` Pydantic model.
- **Gate G2 (Evidence-Tier 1 Enforcement)**: Every item in `steps` MUST cite a retrieved chunk where `chunk.tier == 1`. Non-Tier 1 citations trigger rejection.
- **Gate G3 (Faithfulness Scoring)**: Action step text must contain high token overlap ($\tau_{faith} \ge 0.80$) with cited chunk.
- **Gate G4 (Drug & Dosage Verification)**:
  - Regex: `\b(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|l|mEq|units?|%|tablets?|capsules?))\b`.
  - Every dosage in the action step MUST exist verbatim in the cited chunk text. Hallucinated dosages trigger immediate step strip or fallback.
- **Gate G5 (Severity Non-Downgrade)**: Enforces rule-based severity invariance. If rules evaluate to `Critical`, LLM cannot output `Normal` or `Warning`.
- **Gate G6 (Critical Escalation Injection)**: If `severity == Critical`, injects `FLIGHT_SURGEON_ESCALATION_CLAUSE` into the guidance summary and sets `escalation.required = True`.

### 4.2 Extractive Fallback Parser (`extractive_fallback.py`)
If guardrails fail or LLM times out:
- Extracts numbered action steps directly from the highest-ranked Tier 1 chunk using regex: `re.split(r'\n(?=\d+\.\s+)', chunk_text)`.
- Returns HTTP 200 with `status = "degraded"`, `active_provider = "extractive_fallback"`.

---

## 5. Acceptance Test Criteria
- [ ] `POST /v1/protocols/retrieve` responds in $< 150 \text{ ms}$ for acute hypoxia telemetry.
- [ ] `POST /v1/protocols/retrieve` returns `status: "skipped"` for nominal vitals.
- [ ] `POST /v1/guidance/generate` produces grounded steps citing NASA Tier 1 checklist.
- [ ] Hallucinated medication dosages are rejected by Gate G4.
- [ ] Unreachable LLM triggers automatic degraded extractive fallback without returning 500 error.
- [ ] All unit, contract, and service tests pass in Pytest suite.
