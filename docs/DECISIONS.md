# Architecture Decision Records (ADR) — Healthcare AI System
**Context:** NASA Space Apps Challenge 2026  

---

## ADR 001: Separation of ML and RAG Microservices
- **Decision:** ML anomaly detection and RAG guidance generation are separated into independent FastAPI microservices.
- **Rationale:** Decouples physiological telemetry processing and feature sliding-window math from heavy document search, embedding logic, and LLM orchestration. Allows isolated deployment and scaling.

---

## ADR 002: Dual Database Strategy (MySQL + ChromaDB)
- **Decision:** Utilize MySQL for structured application state and request tracking; utilize ChromaDB for semantic document chunk embeddings.
- **Rationale:** Relational data requires ACID guarantees and audit compliance; semantic retrieval requires specialized nearest-neighbor vector indexing. Qdrant remains a candidate for future benchmarking.

---

## ADR 003: Native Ollama over Containerized Ollama
- **Decision:** Run Ollama natively on Windows host rather than containerized in Docker / WSL2.
- **Rationale:** Native Ollama directly accesses the NVIDIA Quadro RTX 3000 Max-Q GPU via native CUDA drivers without WSL2 GPU pass-through friction or container memory ceilings.

---

## ADR 004: Evidence-Tier Architecture for Guidance Generation
- **Decision:** Enforce 3-tier evidence classification (Tier 1: Checklists/Procedures; Tier 2: Standards; Tier 3: Conditions).
- **Rationale:** Prevents autonomous or unverified procedural action steps. Only Tier 1 operational NASA checklists can output imperative actions.

---

## ADR 005: Online-First / Offline-Fallback with Local Circuit Breaker
- **Decision:** Cloud LLM acts as primary generation when online, with transparent fallback to local Ollama when offline or experiencing network failure.
- **Rationale:** Space mission constraints demand zero reliance on terrestrial network availability while preserving high fidelity when communications are available.
