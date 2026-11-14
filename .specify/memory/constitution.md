# AuraMed Healthcare AI Constitution
**Project:** Healthcare AI Decision-Support System  
**Context:** NASA Space Apps Challenge 2026  
**Methodology:** Spec-Driven Development (Spec Kit) & Elephant-Goldfish Model (EGM)  

---

## Core Principles

### I. Decision Support, Not Autonomous Treatment (NON-NEGOTIABLE)
The system is exclusively a clinical decision-support platform for flight surgeons and astronaut crew members. It is strictly forbidden from acting as an autonomous medical diagnosis or prescription system. All diagnostic conditions are classified as hypotheses (`suspected`).

### II. Strict Evidence-Tier Partitioning (NON-NEGOTIABLE)
Knowledge sources are classified into three strict tiers:
- **Tier 1 (Operational Procedures & Checklists):** Only approved Tier 1 checklists (e.g. `Medical Checklist Rev K PCN-4`) may generate procedural action steps.
- **Tier 2 (Medical Standards):** NASA-STD-3001 Vol 1/2 provide baseline vital bounds and levels of care; cannot generate action steps.
- **Tier 3 (Condition Lists & Evidence Reports):** Clinical taxonomy and background context only; cannot generate action steps.
Every generated step must explicitly cite a verified Tier 1 chunk. Zero hallucinated steps or citations tolerated.

### III. Deterministic Severity Invariance (NON-NEGOTIABLE)
Severity calculation (`Normal`, `Warning`, `Critical`) is governed strictly by deterministic mathematical threshold equations and ML anomaly flags. Rules may escalate severity, but can NEVER downgrade it. LLMs are strictly prohibited from calculating, altering, or downgrading severity.

### IV. Online-First / 100% Offline-Fallback
The system must support two operating modes:
- **Online Mode:** Primary generation through Cloud LLM API with bounded timeouts (10s Critical / 25s Warning).
- **Offline Mode:** Seamless, zero-delay failover to local native Ollama runtime (`medgemma:latest` / `deepseek-r1:8b`).
Local databases (MySQL 9.4), local vector stores (ChromaDB), and local CPU embeddings (`bge-small`) must remain 100% operational without internet connectivity.

### V. Fail-Safe Extractive Fallback
Under any LLM failure, gateway timeout, or guardrail validation rejection, the system must immediately return raw, verbatim NASA checklist steps with original citations (`status = "degraded"`), ensuring immediate, reliable guidance during life-critical emergencies.

### VI. Decoupled Microservices & Test-First Verification
- Independent FastAPI microservices: `services/ml-service` (Port 8001) and `services/rag-service` (Port 8002).
- An ML service failure must never block Critical RAG retrieval.
- Every endpoint must be backed by contract tests and verified against the 5 golden dataset vectors.

---

## Hardware Execution Governance
- **Target Machine:** Intel Core i7-10850H (12 vCPUs), 32GB RAM, NVIDIA Quadro RTX 3000 Max-Q (6GB VRAM, ~4.8GB usable).
- **VRAM Budget:** 100% of GPU VRAM is reserved for Ollama local LLM execution. Embedding (`bge-small`) and reranking (`bge-reranker`) models are strictly pinned to CPU execution (`device="cpu"`).
- **Ollama Persistence:** Ollama models must be initialized with `keep_alive: -1` to eliminate cold-start weight loading delays during emergencies.

---

**Version**: 1.0.0 | **Ratified**: 2026-11-13 | **Status**: Active & Enforced
