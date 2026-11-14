# Healthcare AI System — Project Specification
**Challenge:** NASA Space Apps Challenge 2026  
**Document Status:** Baseline Specification (Phase 01)  

---

## 1. Executive Summary & Identity
The Healthcare AI System (AuraMed) is an evidence-grounded medical decision-support platform designed to monitor astronaut health during space missions, detect physiological telemetry anomalies, retrieve authorized NASA medical procedures, and generate step-by-step guidance.

> [!CRITICAL]
> AuraMed is a **decision-support system**, NOT an autonomous diagnostic or treatment engine. Clinical authority resides exclusively with human medical officers / flight surgeons.

---

## 2. Core Operational Pillars
1. **Evidence-Based Output (Evidence Hierarchy):**
   - **Tier 1 (Operational Procedures & Checklists):** NASA Flight Rules, Medical Checklists (e.g., Medical Checklist Rev K PCN-4). Only Tier 1 sources may generate operational treatment steps.
   - **Tier 2 (Medical Standards & Care Levels):** NASA-STD-3001 Vol 1/2. Sets acceptable physiological bounds and level of care.
   - **Tier 3 (Condition Lists & Background Evidence):** Clinical literature, pathophysiology. Contextual only.
2. **Deterministic Severity Gates:**
   - Severity is computed strictly via deterministic mathematical rules (`shared/`).
   - Rules may elevate severity, but can NEVER reduce severity.
   - LLMs can NEVER calculate or override severity.
3. **Traceability & Citations:**
   - Every generated action step must explicitly reference a retrieved document chunk (Document ID, Title, Page, Section, Chunk ID, Tier).
   - Zero hallucinated citations tolerated.
4. **Online-First / Offline-Fallback:**
   - Primary generation: Cloud LLM API (provider TBD).
   - Offline fallback: Native Ollama (`deepseek-r1:8b` / `medgemma:4b`).
   - Local databases, vector stores, and embeddings remain 100% operational in offline mode without user intervention.

---

## 3. High-Level Architecture
- **Main Backend:** External integration (Technology TBD).
- **ML Service:** Independent FastAPI microservice performing anomaly detection on physiological telemetry.
- **RAG Service:** Independent FastAPI microservice orchestrating hybrid retrieval (Dense + BM25 + RRF), evidence gating, and guidance generation.
- **Relational Store:** MySQL 9.4 for astronaut telemetry logs, audit trails, and request tracking.
- **Vector Store:** ChromaDB (persistent mode) storing NASA protocol embeddings.
- **AI Runtime:** Ollama local inference engine for offline fallback.
