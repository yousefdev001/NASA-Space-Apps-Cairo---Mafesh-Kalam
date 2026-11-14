# Implementation Plan: AuraMed Medical Decision Support Core Engine

**Branch**: `001-core-engine` | **Date**: 2026-11-13 | **Spec**: `specs/001-core-engine/spec.md`  
**Reference Design**: `docs/designs/system_architecture.md`  

---

## 1. Summary
Implementation of the core decision-support engine for AuraMed, structured across two independent FastAPI microservices (`ml-service` and `rag-service`) with a shared domain core (`shared/`). The engine implements deterministic rule-based vital severity evaluation, hybrid retrieval (ChromaDB + BM25 + Cross-Encoder reranking), evidence-tier gating (Tier 1 operational procedures vs Tier 2/3 context), an online-first / offline-fallback LLM gateway (`medgemma:latest`), and 6-stage clinical safety guardrails with fail-safe extractive fallback.

---

## 2. Technical Context
- **Language / Runtime:** Python 3.11.16 on Windows 11 Pro (AMD64).
- **Core Frameworks:** FastAPI, Uvicorn, Pydantic v2, SQLAlchemy, HTTPX.
- **Databases:** MySQL 9.4 (structured audit logs), ChromaDB 0.6.3 (in-process persistent vector store), Rank-BM25.
- **Local AI Engine:** Native Ollama runtime hosting `medgemma:latest` (Gemma 3 4B) and `deepseek-r1:8b`.
- **Device Placement:**
  - Ollama LLM: GPU (`cuda:0`) + System RAM offload (`keep_alive: -1`).
  - Embeddings (`BAAI/bge-small-en-v1.5`) & Reranker (`BAAI/bge-reranker-base`): CPU (`device="cpu"`).
- **Test Framework:** Pytest, pytest-asyncio.

---

## 3. Constitution Compliance Gates
- [x] **Gate 1 (Clinical Boundary):** Decision-support only; no autonomous diagnosis or treatment.
- [x] **Gate 2 (Evidence-Tier Partitioning):** Procedural steps bound strictly to Tier 1 chunks; Gate G2 verifies `chunk.tier == 1`.
- [x] **Gate 3 (Deterministic Invariance):** Mathematical rules can only elevate severity, never downgrade.
- [x] **Gate 4 (Offline Readiness):** 100% operational offline without internet.
- [x] **Gate 5 (Extractive Fallback):** Fail-safe mode returns verbatim steps on validation failure.
- [x] **Gate 6 (Decoupled Services):** ML and RAG services run independently; ML failure does not block Critical RAG retrieval.

---

## 4. Implementation Phasing & Target Scope

### Phase 1: Shared Core & Severity Engine
- **Files Created:**
  - `shared/constants.py`: SeverityLevel enum, vital thresholds, default hyperparameters.
  - `shared/rules/severity_engine.py`: Deterministic `assess_vitals()` implementation with exact operators.
  - `shared/contracts/ml_contract.py`: `MLPredictRequest` and `MLPredictResponse`.
  - `shared/contracts/rag_contract.py`: `GuidanceRequest`, `GuidanceResponse`, `ProtocolRetrieveResponse`, `ActionStep`.
  - `shared/exceptions/error_models.py`: `ErrorResponse` and HTTPException handlers.
- **Verification:** Unit tests in `tests/unit/test_severity_engine.py` covering all 5 Golden Dataset vectors.

### Phase 2: Ingestion & Hybrid Retrieval Engine
- **Files Created:**
  - `services/rag-service/retrieval/query_builder.py`: Deterministic query synthesis function.
  - `services/rag-service/retrieval/hybrid_retriever.py`: ChromaDB dense search + Rank-BM25 sparse search + RRF merger ($k=60$).
  - `services/rag-service/retrieval/reranker.py`: CPU Cross-Encoder with logistic sigmoid calibration ($\tau_{proc} \ge 0.50$).
- **Verification:** Retrieval tests asserting Hit@1 on Rev K checklists for hypoxia and tachycardia.

### Phase 3: ML Anomaly Detection Microservice
- **Files Created:**
  - `services/ml-service/main.py`: FastAPI application entry point on port 8001.
  - `services/ml-service/router.py`: `POST /ml/predict` endpoint.
  - `services/ml-service/model_runner.py`: Baseline anomaly detector implementation.
- **Verification:** Contract tests in `tests/contract/test_api_contracts.py`.

### Phase 4: RAG Microservice & 6-Stage Guardrails
- **Files Created:**
  - `services/rag-service/main.py`: FastAPI application entry point on port 8002.
  - `services/rag-service/routers/protocols.py`: Instant `POST /v1/protocols/retrieve` endpoint.
  - `services/rag-service/routers/guidance.py`: Synthesized `POST /v1/guidance/generate` endpoint.
  - `services/rag-service/routers/health.py`: `GET /health` and `GET /v1/index/info`.
  - `services/rag-service/guardrails/safety_validator.py`: 6 validation gates with Tier 1 citation enforcement.
  - `services/rag-service/guardrails/extractive_fallback.py`: Regex step parser for degraded mode.
  - `services/rag-service/gateway/llm_gateway.py`: Online/Offline circuit breaker with Ollama client.
- **Verification:** Unit tests in `tests/unit/test_guardrails.py`.

### Phase 5: Persistence & End-to-End Verification
- **Files Created:**
  - `infrastructure/database/connection.py`: SQLAlchemy session engine for MySQL 9.4.
  - `infrastructure/database/models.py`: `TelemetryAuditRecord` ORM model.
  - `tests/integration/test_offline_fallback.py`: Simulated blackout failover test suite.
- **Verification:** End-to-end pytest suite passing 100%.
