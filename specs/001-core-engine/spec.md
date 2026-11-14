# Feature Specification: AuraMed Medical Decision Support Core Engine

**Feature Branch**: `001-core-engine`  
**Created**: 2026-11-13  
**Status**: Ready for Planning & Implementation  
**Reference Document**: `docs/designs/system_architecture.md`  

---

## 1. User Scenarios & Prioritized User Stories

### User Story 1 — Immediate Protocol Retrieval for Critical Vitals (Priority: P1)
As an astronaut crew member or flight surgeon facing an acute vital emergency (e.g. SpO2 <= 88%), I want immediate access to flight-certified NASA operational procedures without waiting for multi-second LLM synthesis, so that critical life-saving actions are initiated in under 200 milliseconds.

**Why this priority:** Life safety in spaceflight demands deterministic zero-latency delivery of emergency procedures.

**Independent Test:** Send telemetry payload with `spo2_percent: 86.5` to `POST /v1/protocols/retrieve`. Verify that `status == "ok"`, `severity == "Critical"`, and matching Tier 1 checklist steps are returned in $<200 \text{ ms}$ with flight surgeon escalation active.

**Acceptance Scenarios:**
1. **Given** telemetry with SpO2 = 86.5% and HR = 115 bpm, **When** `POST /v1/protocols/retrieve` is invoked, **Then** return HTTP 200 with `severity: Critical`, `tier1_procedures` populated with Rev K hypoxia checklist chunks, and `escalation.required: true`.
2. **Given** normal telemetry and `ml.anomaly_label: 0`, **When** `POST /v1/protocols/retrieve` is invoked, **Then** return HTTP 200 with `severity: Normal` and `status: skipped` without executing vector search.

---

### User Story 2 — Evidence-Grounded Guidance Generation (Priority: P1)
As an astronaut, I want synthesized step-by-step guidance derived exclusively from certified NASA Tier 1 operational checklists, with citations down to the page number, so that I can execute emergency procedures safely without medical hallucinations.

**Why this priority:** Autonomous medical hallucinations in spaceflight are fatal. All action steps must be grounded in verified flight rules.

**Independent Test:** Send telemetry with an active anomaly to `POST /v1/guidance/generate`. Verify that every single action step in `steps` cites a valid Tier 1 `source_chunk_id` and contains no hallucinated dosages.

**Acceptance Scenarios:**
1. **Given** valid telemetry and retrieved Tier 1 checklist chunks, **When** guidance is generated, **Then** every item in `steps` references a chunk where `chunk.tier == 1`, with exact page reference `ref_label`.
2. **Given** an LLM output proposing an ungrounded medication or dosage not present in the source chunk, **When** guardrail Gate G4 executes, **Then** the hallucinated step is stripped or the response is automatically converted to Extractive Fallback.

---

### User Story 3 — 100% Offline Operational Fallback (Priority: P1)
As a crew member operating during a communications blackout or spacecraft shadow, I want the system to seamlessly execute guidance generation using local Ollama (`medgemma:latest`), local ChromaDB, and local MySQL without any human intervention or network errors.

**Why this priority:** Deep-space exploration has unavoidable network blackouts.

**Independent Test:** Disconnect or mock external cloud endpoint failure. Send guidance request. Verify that `active_provider == "ollama"`, response is generated locally in $<4 \text{ s}$, and all 6 guardrail gates pass.

**Acceptance Scenarios:**
1. **Given** external cloud API unreachable or timed out, **When** `POST /v1/guidance/generate` is called, **Then** circuit breaker immediately routes to local Ollama `medgemma:latest` and returns HTTP 200 with `active_provider: "ollama"`.
2. **Given** host has no internet connection, **When** the service boots up, **Then** `GET /health` returns `status: "healthy"` and `mode: "offline"`.

---

### User Story 4 — Decoupled ML Anomaly Detection (Priority: P2)
As a flight systems engineer, I want physiological anomaly detection to execute in an independent microservice (`POST /ml/predict`), such that an anomaly flags alerts without tightly coupling RAG retrieval or blocking on slow queries.

**Why this priority:** Separation of concerns allows ML model retraining without redeploying the knowledge base.

**Acceptance Scenarios:**
1. **Given** 17 physiological telemetry metrics, **When** `POST /ml/predict` is called on port 8001, **Then** return `anomaly_label` (0 or 1) and `confidence_score` within 20ms.
2. **Given** ML microservice is offline or crashing, **When** `POST /v1/guidance/generate` is called with `ml: null`, **Then** RAG service still executes deterministic vital assessment and returns Critical/Warning protocols without failing.

---

### User Story 5 — Fail-Safe Extractive Fallback (Priority: P2)
As a system operator, I want any generation failure or timeout to immediately yield verbatim NASA checklist text (`status = "degraded"`), ensuring guidance is never withheld from the crew.

**Acceptance Scenarios:**
1. **Given** LLM timeout or invalid JSON output, **When** guardrails fail, **Then** return HTTP 200 with `status: "degraded"` and `active_provider: "extractive_fallback"`, containing ordered steps directly extracted from the top-ranked Tier 1 chunk.

---

## 2. Technical & Performance Requirements
- **Latency Budget:**
  - `POST /ml/predict`: $\le 30 \text{ ms}$.
  - `POST /v1/protocols/retrieve`: $\le 200 \text{ ms}$.
  - `POST /v1/guidance/generate` (Cloud): $\le 10 \text{ s}$ (Critical), $\le 25 \text{ s}$ (Warning).
  - `POST /v1/guidance/generate` (Ollama fallback): $\le 4.0 \text{ s}$ on Quadro RTX 3000 Max-Q.
- **Memory Footprint:**
  - PyTorch embeddings & rerankers pinned to CPU (`device="cpu"`), consuming $\le 600 \text{ MB}$ RAM.
  - GPU VRAM reserved exclusively for Ollama local LLM execution.
- **Data Integrity:**
  - Zero hallucinated medication dosages ($\text{Regex match} == 100\%$).
  - Zero action steps from Tier 2 or Tier 3 sources.
