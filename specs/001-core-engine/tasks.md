# Implementation Tasks: AuraMed Medical Decision Support Core Engine

**Branch**: `001-core-engine` | **Spec**: `specs/001-core-engine/spec.md` | **Plan**: `specs/001-core-engine/plan.md`  

---

## Task Dependencies & Critical Path
```text
Task 1 (Shared Constants & Contracts) 
  ↓
Task 2 (Deterministic Severity Engine + Unit Tests)
  ↓
Task 3 (Retrieval Query Builder & Hybrid Retriever + Tests)
  ↓
Task 4 (ML Anomaly Microservice on Port 8001)
  ↓
Task 5 (RAG Microservice Protocols Endpoint: POST /v1/protocols/retrieve)
  ↓
Task 6 (LLM Gateway & Ollama Client with keep_alive: -1)
  ↓
Task 7 (6-Stage Safety Guardrails & Extractive Fallback)
  ↓
Task 8 (RAG Microservice Guidance Endpoint: POST /v1/guidance/generate)
  ↓
Task 9 (SQLAlchemy MySQL Persistence & Health Monitoring)
  ↓
Task 10 (End-to-End Offline Fallback Verification & Pytest Suite)
```

---

## Detailed Actionable Tasks

### Task 1: Shared Core Domain Models & Constants
- [x] Create `shared/constants.py`:
  - Define `SeverityLevel` enum (`NORMAL = "Normal"`, `WARNING = "Warning"`, `CRITICAL = "Critical"`).
  - Define numerical threshold constants for SpO2, HR, RR, BP, Temp.
  - Define retrieval constants (`DENSE_TOP_K = 30`, `BM25_TOP_K = 30`, `RRF_K = 60`, `RERANK_TOP_K = 20`, `FINAL_TOP_K = 5`, `TAU_PROC = 0.50`, `TAU_FAITH = 0.80`).
- [x] Create `shared/contracts/ml_contract.py`:
  - Implement `MLPredictRequest` (validating 17 physiological telemetry fields).
  - Implement `MLPredictResponse` (`anomaly_label`, `confidence_score`, `request_id`).
- [x] Create `shared/contracts/rag_contract.py`:
  - Implement `GuidanceRequest` with optional/nullable `ml` object.
  - Implement `ActionStep`, `EscalationPayload`, `ProtocolChunkResult`.
  - Implement `ProtocolRetrieveResponse` and `GuidanceResponse`.
- [x] Create `shared/exceptions/error_models.py`:
  - Implement standard `ErrorResponse` model.
- **Verification:** `pytest tests/contract/test_api_contracts.py` passes (9/9 passed).

---

### Task 2: Deterministic Severity Engine
- [x] Create `shared/rules/severity_engine.py`:
  - Implement `assess_vitals(vitals, ml_result=None) -> SeverityAssessment`.
  - Enforce exact boundary comparison operators (`<= 88.0` for SpO2 Critical; `100 < HR < 130` for Warning, etc.).
  - Implement invariant severity escalation (Rules >= ML >= Normal).
  - Inject `unknown_physiological_anomaly` when ML=1 without specific vital rule violation.
  - Handle degraded ML state (`ml=None`) without throwing exceptions.
- [x] Create `tests/unit/test_severity_engine.py`:
  - Implement tests for all 5 Golden Dataset vectors (VEC-01 through VEC-05).
- **Verification:** `pytest tests/unit/test_severity_engine.py` passes 100% (12/12 passed).

---

### Task 3: Algorithmic Query Builder & Hybrid Retrieval Core
- [x] Create `services/rag_service/retrieval/query_builder.py`:
  - Implement deterministic query synthesis from triggered condition hypotheses and vital deviations.
- [x] Create `scripts/ingest_knowledge_base.py`:
  - Extract and partition 3,085 chunks from all 8 NASA PDFs in `data/raw/`.
  - Persist BM25 sparse index (`data/bm25_index.pkl`).
  - Index 3,085 dense vectors into ChromaDB persistent collection (`data/chroma_db/`).
- [x] Create `services/rag_service/retrieval/hybrid_retriever.py`:
  - Implement ChromaDB vector querying (`dense_k = 30`) using CPU embedding (`intfloat/multilingual-e5-small` / `bge-small`).
  - Implement Rank-BM25 sparse querying (`bm25_k = 30`).
  - Implement Reciprocal Rank Fusion ($k=60$) rank merging.
  - Implement Evidence-Tier partitioning (Tier 1 procedures vs Tier 2/3 context).
- [x] Create `services/rag_service/retrieval/reranker.py`:
  - Implement CPU cross-encoder reranking with logistic sigmoid transformation $\sigma(z) \ge 0.50$.
- **Verification:** Unit tests in `tests/unit/test_query_builder.py` and `tests/unit/test_retrieval.py` pass 100% (9/9 passed).

---

### Task 4: ML Anomaly Detection Microservice
- [x] Create `services/ml_service/model_runner.py`:
  - Integrate trained NASA Spaceflight Multi-Hazard ML models (`space_hazard_risk_classifier.joblib`, `space_hazard_degradation_regressor.joblib`).
  - Implement real-time 17-feature telemetry mapping and inference.
  - Implement full HRP multi-hazard risk and continuous degradation scoring.
- [x] Create `services/ml_service/router.py`:
  - Mount `POST /ml/predict` validating `MLPredictRequest` and returning `MLPredictResponse`.
  - Mount `POST /ml/predict/hazard` for full spaceflight hazard assessment.
  - Mount `GET /ml/health` for model lifecycle monitoring.
- [x] Create `services/ml_service/main.py`:
  - Initialize independent FastAPI application on port 8001 with CORS and lifespan handler.
- **Verification:** Unit and contract tests in `tests/unit/test_ml_service.py` pass 100% with warm latency < 30ms (5/5 passed).

---

### Task 5: RAG Protocols Retrieval Endpoint (`POST /v1/protocols/retrieve`)
- [x] Create `services/rag_service/routers/protocols.py`:
  - Implement `POST /v1/protocols/retrieve` for zero-latency ($<200 \text{ ms}$) checklist retrieval.
  - Execute `assess_vitals()`.
  - If `Normal`, return `status: "skipped"` immediately.
  - Execute hybrid retrieval and return top Tier 1 chunks with flight surgeon escalation flag.
- **Verification:** Pytest test for immediate checklist retrieval under SpO2 drop (Passed).

---

### Task 6: LLM Gateway & Proactive Circuit Breaker
- [x] Create `services/rag_service/gateway/ollama_client.py`:
  - Async HTTPX client for Ollama `POST /api/generate` with `keep_alive: -1`.
- [x] Create `services/rag_service/gateway/llm_gateway.py`:
  - Implement circuit breaker tracking consecutive failures.
  - Background heartbeat to detect cloud outage before user requests arrive.
  - Automatic fallback routing to `medgemma:latest`.
- **Verification:** Unit test asserting immediate fallback routing when cloud times out (Passed).

---

### Task 7: 6-Stage Clinical Safety Guardrails & Extractive Fallback
- [x] Create `services/rag_service/guardrails/safety_validator.py`:
  - Implement Gate G1 (Schema validation).
  - Implement Gate G2 (Strict Tier 1 citation enforcement: `chunk.tier == 1`).
  - Implement Gate G3 (Semantic faithfulness check with $\tau_{faith} \ge 0.80$).
  - Implement Gate G4 (Drug and numerical dosage regex verification).
  - Implement Gate G5 (Severity non-downgrade).
  - Implement Gate G6 (Flight surgeon escalation clause injection).
- [x] Create `services/rag_service/guardrails/extractive_fallback.py`:
  - Regex splitting of top Tier 1 chunk into ordered `ActionStep` items with `status: "degraded"`.
- **Verification:** Unit tests in `tests/unit/test_guardrails.py` asserting hallucinated dosage rejection and fallback triggering (5/5 passed).

---

### Task 8: RAG Guidance Generation Endpoint (`POST /v1/guidance/generate`)
- [x] Create `services/rag_service/routers/guidance.py`:
  - Mount `POST /v1/guidance/generate`.
  - Orchestrate: `assess_vitals()` $\to$ `build_retrieval_query()` $\to$ `hybrid_retriever` $\to$ `llm_gateway` $\to$ `safety_validator`.
  - Return complete `GuidanceResponse`.
- [x] Create `services/rag_service/routers/health.py`:
  - Mount `GET /health` and `GET /v1/index/info`.
- **Verification:** Integration test generating guidance on simulated hypoxia event (Passed).

---

### Task 9: MySQL Telemetry & Audit Persistence
- [x] Create `infrastructure/database/connection.py`:
  - SQLAlchemy engine and sessionmaker for MySQL 9.4 with transparent local SQLite fallback.
- [x] Create `infrastructure/database/models.py`:
  - Implement `TelemetryAuditRecord` ORM model.
- [x] Add audit recording hook in RAG service after guidance generation (`infrastructure/database/audit_service.py`).
- **Verification:** Pytest asserting telemetry record inserted into audit table (Passed - `tests/unit/test_persistence.py`).

---

### Task 10: End-to-End Offline Fallback Verification & Pytest Suite
- [x] Create `tests/integration/test_offline_fallback.py`:
  - Simulate complete network disconnection and verify automatic gateway failover.
  - Send guidance request under offline mode.
  - Assert response returned with valid Tier 1 steps and flight surgeon escalation.
- [x] Run full test suite:
  ```powershell
  $env:HF_HUB_OFFLINE="1"; .\.venv\Scripts\python.exe -m pytest tests/ -v
  ```
- **Verification:** 100% of unit, contract, and integration tests pass (55/55 passed).
