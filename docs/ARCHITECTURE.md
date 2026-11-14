# Healthcare AI System — Architecture Specification
**Context:** NASA Space Apps Challenge 2026  
**Status:** Architectural Baseline  

> [!NOTE]
> **Complete & Visual System Design:** A comprehensive architecture document with all interactive Mermaid diagrams, sequence flows, state machines, and microservice specifications is available in [docs/SYSTEM_DESIGN_AND_ARCHITECTURE.md](file:///e:/Projects/AuraMed/docs/SYSTEM_DESIGN_AND_ARCHITECTURE.md).

---

## 1. System Topology & Microservice Boundaries

```text
┌─────────────────────────────────────────────────────────────┐
│                    External Main Backend                    │
│      (Receives wearable telemetry & coordinates requests)   │
└──────────────┬───────────────────────────────┬──────────────┘
               │ (1) Raw Telemetry             │ (2) ML Result + Vitals
               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│       ML Microservice        │ │       RAG Microservice       │
│         (FastAPI)            │ │         (FastAPI)            │
│  - Anomaly Detection         │ │  - Rule-based Severity Gate  │
│  - Confidence Scoring        │ │  - Hybrid Retrieval Engine   │
│  - Feature Engineering       │ │  - Evidence-Tier Validator   │
│                              │ │  - Citation Formatter        │
└──────────────────────────────┘ └──────────────┬───────────────┘
                                                │
                 ┌──────────────────────────────┴───────────────┐
                 │                                              │
                 ▼                                              ▼
┌──────────────────────────────┐               ┌──────────────────────────────┐
│    Relational Store: MySQL   │               │   Vector Database: ChromaDB  │
│ - Telemetry audit trails     │               │ - Persistent NASA chunks     │
│ - Request tracking logs      │               │ - Metadata tier filtering    │
└──────────────────────────────┘               └──────────────────────────────┘
```

---

## 2. Online-First / Offline-Fallback Runtime Architecture

```text
                  Incoming Guidance Request
                             │
                             ▼
                 ┌───────────────────────┐
                 │  Circuit Breaker Gate │
                 └───────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
     [Cloud Healthy & Online]          [Offline / Cloud Error]
            │                                 │
            ▼                                 ▼
┌───────────────────────────┐     ┌───────────────────────────┐
│     Cloud LLM Provider    │     │       Native Ollama       │
│       (Primary API)       │     │     (Offline Fallback)    │
│  - High throughput        │     │  - DeepSeek-R1:8B         │
│  - Provider TBD           │     │  - MedGemma 1.5 4B (cand) │
└───────────────────────────┘     └───────────────────────────┘
```

### Safety & Operational Guarantees
1. **Zero External Dependency for Core Inference:** In offline mode, the system utilizes local loopback embeddings, local ChromaDB vector index, and native Ollama model execution.
2. **Deterministic Severity Precedence:** Medical severity is determined before any LLM prompt is constructed. LLM output cannot override severity.
3. **Graceful Degradation:** If neither Cloud nor local model runtime responds within bounded timeout, the system outputs an extractive NASA checklist fallback without generating speculative text.
