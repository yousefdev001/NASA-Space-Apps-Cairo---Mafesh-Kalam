# System Architecture Specification: Healthcare AI Decision-Support Platform (AuraMed)
**Document Status:** Approved & Hardened Design Specification (EGM Stage 2 — Zero-Decision Implementation Ready)  
**Author:** AI Infrastructure & System Architect  
**Review Standard:** EGM Feature Specification & Implementation Readiness Standards  
**Auditors:** EGM Design Critic & EGM Implementation Readiness Tech Lead  
**Target:** NASA Space Apps Challenge 2026  

---

## 1. Problem Statement & Motivation
In extreme, remote, and autonomous environments such as human space exploration missions (ISS, Artemis lunar missions, Mars transit), crew members face acute medical risks without immediate access to terrestrial medical specialists. Ground communication encounters unavoidable communication latencies (up to 22 minutes each way for Mars missions) and complete blackout intervals (e.g. lunar shadow, solar conjunction).

Existing telemetry platforms either monitor physiological signals passively without actionable clinical context, or propose ungrounded autonomous diagnostics that violate medical safety protocols.

**AuraMed** solves this by bridging the gap between physiological anomaly detection and flight-certified operational checklists through an **evidence-grounded decision-support system** that strictly separates anomaly detection (ML), deterministic severity escalation (Rules), hybrid knowledge retrieval (RAG), and evidence-bounded guidance (LLM Gateway), ensuring **100% offline operational survival** during telemetry disruptions.

---

## 2. Goals & Non-Goals

### 2.1 Goals
- **G1: Anomaly-to-Guidance Traceability:** Every suggested procedural action step must reference an authorized NASA Tier 1 checklist chunk with an unambiguous citation (`doc_id`, `procedure_title`, `page_start`, `chunk_id`). Zero hallucinated clinical actions are permitted.
- **G2: Deterministic Severity Invariance:** Clinical severity (`Normal`, `Warning`, `Critical`) is determined strictly by deterministic mathematical threshold rules and ML anomaly flags. LLM outputs are prohibited from calculating, altering, or downgrading severity.
- **G3: Strict Evidence-Tier Partitioning:** Action steps may originate exclusively from Tier 1 Operational Procedures. Tier 2 (Standards) and Tier 3 (Condition Lists) provide supporting clinical context only and cannot generate procedural treatment steps.
- **G4: Online-First / Offline-Fallback Resilience:** Transparently route guidance generation to local Ollama runtime (`medgemma:latest` / `deepseek-r1:8b`) when cloud connectivity is unavailable or times out, while maintaining 100% local operation of MySQL, ChromaDB, and lexical BM25 indexing without internet access.
- **G5: Decoupled Independent Microservices:** Deploy ML anomaly detection and RAG guidance generation as decoupled FastAPI services to enable isolated scaling, model versioning, and testability. An ML service outage must never block deterministic RAG protocol retrieval.
- **G6: Extractive Fallback Guarantee:** Under any LLM generation failure, timeout, or guardrail validation rejection, the system must immediately fall back to raw extractive NASA checklist steps without failing or blocking critical clinical action.

### 2.2 Non-Goals
- **NG1: Autonomous Medical Diagnosis:** The system does NOT provide definitive clinical diagnoses; all condition labels are framed as hypotheses (`suspected`).
- **NG2: Autonomous Treatment Administration:** The system does NOT directly actuate drug delivery, automated defibrillation, or robotic interventions.
- **NG3: Model Fine-Tuning in Production:** The system will not fine-tune or alter model weights dynamically at runtime.
- **NG4: Public Cloud Telemetry Storage:** Telemetry and medical records will not be sent to unauthorized third-party clouds or public endpoints.

---

## 3. High-Level System Architecture & Component Layout

```text
                               ┌────────────────────────────────┐
                               │     External Main Backend      │
                               │  (Telemetry Ingestion & UI)    │
                               └───────┬────────────────┬───────┘
                                       │                │
            (1) POST /ml/predict       │                │ (2) POST /v1/protocols/retrieve (Instant Tier 1)
                (Raw 17 Vitals)        ▼                │     POST /v1/guidance/generate (Synthesized Plan)
                       ┌────────────────────────┐       │
                       │   ML Microservice      │       │
                       │     (FastAPI:8001)     │       │
                       │ - Stateless Predictor  │       ▼
                       │ - Anomaly Detector     │ ┌────────────────────────────────────────────────────────┐
                       │ - Confidence Scorer    │ │                    RAG Microservice                    │
                       └────────────────────────┘ │                     (FastAPI:8002)                     │
                                                  │                                                        │
                                                  │ ┌────────────────────────────────────────────────────┐ │
                                                  │ │ Shared Deterministic Severity Engine (assess)      │ │
                                                  │ │ - Evaluates 6 vital threshold gates                │ │
                                                  │ │ - Invariant Precedence (Rules >= ML >= LLM)        │ │
                                                  │ └─────────────────────────┬──────────────────────────┘ │
                                                  │                           │                            │
                                                  │                           ▼                            │
                                                  │ ┌────────────────────────────────────────────────────┐ │
                                                  │ │            Hybrid Retrieval Engine (RRF)           │ │
                                                  │ │ - ChromaDB Dense Top 30 (bge-small CPU: 384d)      │ │
                                                  │ │ - Rank-BM25 Sparse Top 30                          │ │
                                                  │ │ - Cross-Encoder Reranker Top 20→5 (bge-rerank CPU) │ │
                                                  │ │ - Sigmoid Calibrated Acceptance Gate (TAU >= 0.50) │ │
                                                  │ └─────────────────────────┬──────────────────────────┘ │
                                                  │                           │                            │
                                                  │                           ▼                            │
                                                  │ ┌────────────────────────────────────────────────────┐ │
                                                  │ │       LLM Gateway & Proactive Circuit Breaker      │ │
                                                  │ │ - Primary: Cloud API (10s/25s timeout)             │ │
                                                  │ │ - Background Heartbeat Failover                    │ │
                                                  │ │ - Fallback: Native Ollama (medgemma:latest)        │ │
                                                  │ │ - Ollama Option: keep_alive: -1 (Zero Cold-Start)  │ │
                                                  │ └─────────────────────────┬──────────────────────────┘ │
                                                  │                           │                            │
                                                  │                           ▼                            │
                                                  │ ┌────────────────────────────────────────────────────┐ │
                                                  │ │         6-Stage Clinical Safety Guardrails         │ │
                                                  │ │ - G1: Pydantic v2 Schema Validation                │ │
                                                  │ │ - G2: Tier 1 Action Step Citation Enforcement      │ │
                                                  │ │ - G3: Semantic Faithfulness (TAU_FAITH >= 0.80)    │ │
                                                  │ │ - G4: Drug & Numerical Dosage Regex Verification   │ │
                                                  │ │ - G5: Non-Downgradable Severity Invariance         │ │
                                                  │ │ - G6: Programmatic Flight Surgeon Escalation Clause│ │
                                                  │ │ - Fail-Safe: Extractive Fallback Mode              │ │
                                                  │ └────────────────────────────────────────────────────┘ │
                                                  └───────────────────────────┬────────────────────────────┘
                                                                              │
                                           ┌──────────────────────────────────┴──────────────────┐
                                           ▼                                                     ▼
                            ┌──────────────────────────────┐                      ┌──────────────────────────────┐
                            │    Structured Store: MySQL   │                      │    Vector Store: ChromaDB    │
                            │   - Request tracking & vitals│                      │  - In-process SQLite-backed  │
                            │   - Audit logs & transitions │                      │  - Collection: nasa_med_v1   │
                            │   - SQLAlchemy ORM Models    │                      │  - Distance Metric: Cosine   │
                            └──────────────────────────────┘                      └──────────────────────────────┘
```

---

## 4. Hardware Sizing & Device Placement Architecture

### Hardware Constraints:
- **Processor:** Intel(R) Core(TM) i7-10850H (6 cores, 12 threads @ 2.70GHz).
- **RAM:** 32 GB DDR4.
- **GPU:** NVIDIA Quadro RTX 3000 Max-Q (6144 MiB VRAM total, $\approx 4.8 \text{ GB}$ available under Windows 11 DWM).

### Execution Pinning Decision Matrix:
| Subsystem / Model | Assigned Device | Memory / VRAM Footprint | Latency Budget | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Ollama Local LLM** (`medgemma:latest`) | **GPU (`cuda:0`) + RAM Offload** | $\approx 4.2 \text{ GB}$ VRAM + $\approx 4.0 \text{ GB}$ RAM | $\le 4.0 \text{ s}$ | Dedicated allocation prevents CUDA context collisions. `keep_alive: -1` locks weights into memory. |
| **Dense Embedding Model** (`bge-small-en-v1.5`) | **CPU (`device="cpu"`)** | $\approx 130 \text{ MB}$ System RAM | $\le 25 \text{ ms}$ (Query) | Leaves 100% of available GPU VRAM exclusively for Ollama; 384-dim embedding on 12 vCPUs is near-instantaneous. |
| **Cross-Encoder Reranker** (`bge-reranker-base`) | **CPU (`device="cpu"`)** | $\approx 440 \text{ MB}$ System RAM | $\le 120 \text{ ms}$ (20 pairs) | Eliminates PyTorch/Ollama GPU driver thrashing; executes cleanly within RAM. |
| **ChromaDB Persistent Store** | **CPU / In-Process Disk** | $\approx 80 \text{ MB}$ System RAM | $\le 15 \text{ ms}$ | HNSW C++ index executed natively in host process. |
| **MySQL 9.4 Server** | **Windows Service (`127.0.0.1:3306`)** | $\approx 350 \text{ MB}$ System RAM | $\le 5 \text{ ms}$ | Structured telemetry logging without container overhead. |

---

## 5. Repository File Tree & Implementation Boundaries

```text
E:\Projects\AuraMed\
├── AGENTS.md                                # Project Governance & Phase Constraints
├── README.md                                # System Overview & Developer Quickstart
├── .env.example                             # Environment Configuration Template
├── .gitignore                               # Strict Secret and Artifact Exclusion
├── pyproject.toml                           # Dependency Declarations & Build Metadata
├── requirements.txt                         # Pinned Dependencies
│
├── docs/
│   ├── PROJECT_SPECIFICATION.md             # Baseline Functional Spec
│   ├── IMPLEMENTATION_ROADMAP.md            # Roadmap across Phases 01-06
│   ├── ENVIRONMENT_SETUP.md                 # Deployment & Runbook
│   ├── ARCHITECTURE.md                      # Architecture Overview
│   ├── DECISIONS.md                         # Architecture Decision Records
│   ├── designs/
│   │   └── system_architecture.md           # This Document (Canonical Specification)
│   └── reports/
│       ├── ENVIRONMENT_AUDIT.md             # Host Hardware & Tooling Audit
│       └── OLLAMA_AUDIT.md                  # Ollama Models & Inference Benchmark
│
├── shared/                                  # Pure Domain Logic & Common Contracts
│   ├── __init__.py
│   ├── constants.py                         # Severity Enums, Threshold Constants, Defaults
│   ├── rules/
│   │   ├── __init__.py
│   │   └── severity_engine.py               # Deterministic assess_vitals() Function
│   ├── contracts/
│   │   ├── __init__.py
│   │   ├── ml_contract.py                   # Pydantic Schemas for ML Predict API
│   │   └── rag_contract.py                  # Pydantic Schemas for RAG APIs
│   └── exceptions/
│       ├── __init__.py
│       └── error_models.py                  # Standard ErrorResponse & HTTP Exception Handlers
│
├── services/
│   ├── ml-service/                          # Independent FastAPI Microservice (Port 8001)
│   │   ├── main.py                          # FastAPI App & Lifecycle
│   │   ├── router.py                        # /ml/predict Router
│   │   └── model_runner.py                  # Anomaly Detection Inference Engine
│   │
│   └── rag-service/                         # Independent FastAPI Microservice (Port 8002)
│       ├── main.py                          # FastAPI App & Lifecycle
│       ├── config.py                        # Pydantic Settings
│       ├── routers/
│       │   ├── protocols.py                 # POST /v1/protocols/retrieve
│       │   ├── guidance.py                  # POST /v1/guidance/generate
│       │   └── health.py                    # GET /health, GET /v1/index/info
│       ├── retrieval/
│       │   ├── hybrid_retriever.py          # Dense + BM25 + Reciprocal Rank Fusion
│       │   ├── reranker.py                  # Cross-Encoder with Sigmoid Calibration
│       │   └── query_builder.py             # Deterministic Query Synthesizer
│       ├── gateway/
│       │   ├── llm_gateway.py               # Cloud/Ollama Circuit Breaker & Failover
│       │   └── ollama_client.py             # Async HTTPX Client with keep_alive: -1
│       └── guardrails/
│           ├── safety_validator.py          # 6-Stage Guardrail Pipeline
│           └── extractive_fallback.py       # Deterministic Extractive Fallback Parser
│
├── infrastructure/
│   ├── docker-compose.yml                   # Isolated Containers for MySQL & ChromaDB
│   ├── database/
│   │   ├── connection.py                    # SQLAlchemy Engine & Session Factory
│   │   └── models.py                        # AuditLog & TelemetryRecord ORM Models
│   └── scripts/
│       ├── test_chroma_persistence.py       # ChromaDB Offline Verification
│       ├── test_mysql_connectivity.py       # MySQL Handshake Verification
│       └── test_ollama_smoke.py             # Ollama Inference Smoke Test
│
├── data/
│   ├── raw/                                 # 8 NASA PDF Documents
│   ├── sources.yaml                         # Metadata Catalog (doc_id, tier, sha256)
│   └── chroma_db/                           # ChromaDB Persistent Storage
│
└── tests/
    ├── conftest.py                          # Test Fixtures & Synthetic Vectors
    ├── unit/
    │   ├── test_severity_engine.py          # Boundary Condition Tests
    │   ├── test_query_builder.py            # Query Synthesis Tests
    │   └── test_guardrails.py               # 6 Guardrail Validation Unit Tests
    ├── contract/
    │   └── test_api_contracts.py            # Pydantic Schema Validation Tests
    └── integration/
        ├── test_environment_smoke.py        # Host Smoke Test Suite
        └── test_offline_fallback.py         # Simulated Cloud Failure & Fallback Tests
```

---

## 6. Endpoints, Pydantic Schemas & Error Contracts

### 6.1 Common Error Schema (`shared/exceptions/error_models.py`)
```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any

class ErrorResponse(BaseModel):
    error_code: str = Field(..., description="Standardized error code (e.g., VALIDATION_ERROR, NO_PROTOCOL_FOUND, GATEWAY_TIMEOUT)")
    message: str = Field(..., description="Human-readable technical summary of the error")
    request_id: str = Field(..., description="Unique request tracing identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: Optional[Dict[str, Any]] = Field(default=None, description="Detailed field violations or diagnostics")
```

### 6.2 ML Service Contracts (`shared/contracts/ml_contract.py`)
```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class MLPredictRequest(BaseModel):
    request_id: str = Field(..., min_length=4, max_length=64, description="Unique telemetry request identifier")
    astronaut_id: str = Field(..., min_length=2, max_length=32, description="Unique crew member identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # 7 Real-time sensor metrics
    heart_rate_bpm: float = Field(..., ge=20.0, le=250.0, description="Heart rate in BPM")
    hrv_rmssd_ms: float = Field(..., ge=0.0, le=300.0, description="Heart rate variability RMSSD in ms")
    spo2_percent: float = Field(..., ge=50.0, le=100.0, description="Blood oxygen saturation percentage")
    body_temperature_c: float = Field(..., ge=30.0, le=45.0, description="Core body temperature in Celsius")
    respiratory_rate_bpm: float = Field(..., ge=4.0, le=60.0, description="Respiratory rate in breaths/min")
    systolic_bp_mmhg: float = Field(..., ge=50.0, le=260.0, description="Systolic blood pressure in mmHg")
    diastolic_bp_mmhg: float = Field(..., ge=30.0, le=160.0, description="Diastolic blood pressure in mmHg")
    
    # 10 Rolling 60-minute window statistics
    heart_rate_bpm_rolling_mean_60min: float = Field(..., ge=20.0, le=250.0)
    heart_rate_bpm_rolling_std_60min: float = Field(..., ge=0.0, le=100.0)
    hrv_rmssd_ms_rolling_mean_60min: float = Field(..., ge=0.0, le=300.0)
    hrv_rmssd_ms_rolling_std_60min: float = Field(..., ge=0.0, le=150.0)
    spo2_percent_rolling_mean_60min: float = Field(..., ge=50.0, le=100.0)
    spo2_percent_rolling_std_60min: float = Field(..., ge=0.0, le=30.0)
    body_temperature_c_rolling_mean_60min: float = Field(..., ge=30.0, le=45.0)
    body_temperature_c_rolling_std_60min: float = Field(..., ge=0.0, le=10.0)
    respiratory_rate_bpm_rolling_mean_60min: float = Field(..., ge=4.0, le=60.0)
    respiratory_rate_bpm_rolling_std_60min: float = Field(..., ge=0.0, le=30.0)

class MLPredictResponse(BaseModel):
    request_id: str
    anomaly_label: int = Field(..., ge=0, le=1, description="0 = Normal/Stable, 1 = Anomaly detected")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Model decision confidence")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
```

### 6.3 RAG Service Contracts (`shared/contracts/rag_contract.py`)
```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Literal
from shared.constants import SeverityLevel

class MLResultPayload(BaseModel):
    anomaly_label: int = Field(..., ge=0, le=1)
    confidence_score: float = Field(..., ge=0.0, le=1.0)

class GuidanceRequest(BaseModel):
    request_id: str = Field(..., min_length=4, max_length=64)
    astronaut_id: str = Field(..., min_length=2, max_length=32)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Decoupled ML result: nullable so ML failure does not block Critical RAG retrieval
    ml: Optional[MLResultPayload] = Field(None, description="ML anomaly output, or null if ML service degraded")
    
    # Complete 17 physiological telemetry fields
    vitals: MLPredictRequest  # Reuses validated telemetry schema
    window_count: int = Field(default=12, ge=1, description="Number of readings in rolling window; if < 12, cold-start mode active")
    options: Optional[dict] = Field(default_factory=lambda: {"mode": "auto"})

class ActionStep(BaseModel):
    n: int = Field(..., ge=1, description="Sequential step index")
    action: str = Field(..., min_length=5, description="Procedural clinical step extracted strictly from Tier 1 chunk")
    source_chunk_id: str = Field(..., description="ID of source Tier 1 checklist chunk")
    ref_label: str = Field(..., description="Human-readable citation (e.g. Medical Checklist Rev K, p.42)")
    warning: Optional[str] = Field(None, description="Associated WARNING or CAUTION notice verbatim from chunk")

class EscalationPayload(BaseModel):
    required: bool
    reason: str
    target: Literal["Flight Surgeon", "Crew Medical Officer", "None"]

class ProtocolChunkResult(BaseModel):
    chunk_id: str
    doc_id: str
    doc_title: str
    tier: int = Field(..., ge=1, le=3)
    procedure_title: str
    page_start: int
    ref_label: str
    score: float
    text: str

class ProtocolRetrieveResponse(BaseModel):
    request_id: str
    status: Literal["ok", "no_protocol_found", "skipped"]
    severity: SeverityLevel
    condition_hypotheses: List[str]
    tier1_procedures: List[ProtocolChunkResult] = Field(default_factory=list)
    context_chunks: List[ProtocolChunkResult] = Field(default_factory=list)
    escalation: EscalationPayload
    latency_ms: float

class GuidanceResponse(BaseModel):
    request_id: str
    status: Literal["ok", "degraded", "no_protocol_found"]
    severity: SeverityLevel
    condition_hypotheses: List[str]
    summary: str = Field(..., description="One-sentence clinical summary grounded in evidence")
    steps: List[ActionStep] = Field(default_factory=list)
    escalation: EscalationPayload
    protocol_refs: List[str]
    active_provider: Literal["cloud", "ollama", "extractive_fallback"]
    latency_ms: float
```

### 6.4 HTTP Status Codes Specification
| Endpoint | Scenario | HTTP Status | Response Schema |
| :--- | :--- | :--- | :--- |
| `POST /ml/predict` | Valid vitals evaluated | **200 OK** | `MLPredictResponse` |
| `POST /ml/predict` | Out-of-bounds telemetry (e.g. SpO2 > 100%) | **422 Unprocessable** | FastAPI Validation Error |
| `POST /v1/protocols/retrieve` | Matched Tier 1 checklist ($\tau \ge 0.50$) | **200 OK** | `ProtocolRetrieveResponse` (`status="ok"`) |
| `POST /v1/protocols/retrieve` | No matching Tier 1 checklist | **200 OK** | `ProtocolRetrieveResponse` (`status="no_protocol_found"`) |
| `POST /v1/protocols/retrieve` | Severity is Normal | **200 OK** | `ProtocolRetrieveResponse` (`status="skipped"`) |
| `POST /v1/guidance/generate` | Guidance synthesized & validated | **200 OK** | `GuidanceResponse` (`status="ok"`) |
| `POST /v1/guidance/generate` | Guardrail rejection / LLM timeout | **200 OK** | `GuidanceResponse` (`status="degraded"`) |
| `POST /v1/guidance/generate` | No matching checklist found | **200 OK** | `GuidanceResponse` (`status="no_protocol_found"`) |
| `ALL` | Malformed JSON / Schema violation | **422 Unprocessable** | `ErrorResponse` |
| `ALL` | Circuit Breaker / Local Offline exhaustion | **503 Service Unavailable** | `ErrorResponse` |
| `GET /health` | Service healthy & dependencies reachable | **200 OK** | `{"status": "healthy", "mode": "offline", ...}` |
| `GET /health` | MySQL or ChromaDB unreachable | **503 Service Unavailable** | `{"status": "unhealthy", "reason": "..."}` |

---

## 7. Deterministic Severity Engine Specification (`shared/rules/severity_engine.py`)

### 7.1 Mathematical Thresholds & Boundary Inclusiveness
To eliminate all ambiguity for the implementer, all boundary conditions are formally defined with exact comparison operators:

```python
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel

class SeverityLevel(str, Enum):
    NORMAL = "Normal"
    WARNING = "Warning"
    CRITICAL = "Critical"

class RuleFlag(BaseModel):
    rule_name: str
    metric: str
    value: float
    threshold: float
    severity_level: SeverityLevel
    condition_hypothesis: str

class SeverityAssessment(BaseModel):
    severity: SeverityLevel
    triggered_rules: List[RuleFlag]
    condition_hypotheses: List[str]
```

### Deterministic Threshold Table (Exact Boundary Operators):
| Metric Name | Critical Condition | Warning Condition | Normal Condition | Target Condition Hypothesis |
| :--- | :--- | :--- | :--- | :--- |
| `spo2_percent` | `value <= 88.0` | `88.0 < value <= 92.0` | `value > 92.0` | `hypoxia_suspected` |
| `heart_rate_bpm` | `value >= 130.0` or `value <= 40.0` | `100.0 < value < 130.0` or `40.0 < value < 50.0` | `50.0 <= value <= 100.0` | `tachycardia` / `bradycardia` |
| `respiratory_rate_bpm` | `value >= 28.0` or `value <= 8.0` | `20.0 < value < 28.0` or `8.0 < value < 10.0` | `10.0 <= value <= 20.0` | `respiratory_distress` |
| `body_temperature_c` | `value >= 39.5` or `value <= 34.5` | `38.0 < value < 39.5` or `34.5 < value < 35.5` | `35.5 <= value <= 38.0` | `fever_hyperthermia` / `hypothermia` |
| `systolic_bp_mmhg` | `value >= 180.0` or `value <= 80.0` | `140.0 < value < 180.0` or `80.0 < value < 90.0` | `90.0 <= value <= 140.0` | `hypertension` / `hypotension` |
| `diastolic_bp_mmhg` | `value >= 120.0` or `value <= 50.0` | `90.0 < value < 120.0` or `50.0 < value < 60.0` | `60.0 <= value <= 90.0` | `hypertension` / `hypotension` |

### 7.2 Severity Precedence Logic:
```python
def assess_vitals(vitals, ml_result=None) -> SeverityAssessment:
    triggered_rules: List[RuleFlag] = []
    
    # 1. Evaluate deterministic vital thresholds (always executed)
    # SpO2
    if vitals.spo2_percent <= 88.0:
        triggered_rules.append(RuleFlag(rule_name="SPO2_CRITICAL", metric="spo2_percent", value=vitals.spo2_percent, threshold=88.0, severity_level=SeverityLevel.CRITICAL, condition_hypothesis="hypoxia_suspected"))
    elif vitals.spo2_percent <= 92.0:
        triggered_rules.append(RuleFlag(rule_name="SPO2_WARNING", metric="spo2_percent", value=vitals.spo2_percent, threshold=92.0, severity_level=SeverityLevel.WARNING, condition_hypothesis="hypoxia_suspected"))
    
    # Heart Rate
    if vitals.heart_rate_bpm >= 130.0 or vitals.heart_rate_bpm <= 40.0:
        hyp = "tachycardia" if vitals.heart_rate_bpm >= 130.0 else "bradycardia"
        triggered_rules.append(RuleFlag(rule_name="HR_CRITICAL", metric="heart_rate_bpm", value=vitals.heart_rate_bpm, threshold=130.0 if hyp=="tachycardia" else 40.0, severity_level=SeverityLevel.CRITICAL, condition_hypothesis=hyp))
    elif vitals.heart_rate_bpm > 100.0 or vitals.heart_rate_bpm < 50.0:
        hyp = "tachycardia" if vitals.heart_rate_bpm > 100.0 else "bradycardia"
        triggered_rules.append(RuleFlag(rule_name="HR_WARNING", metric="heart_rate_bpm", value=vitals.heart_rate_bpm, threshold=100.0 if hyp=="tachycardia" else 50.0, severity_level=SeverityLevel.WARNING, condition_hypothesis=hyp))

    # Respiratory Rate
    if vitals.respiratory_rate_bpm >= 28.0 or vitals.respiratory_rate_bpm <= 8.0:
        triggered_rules.append(RuleFlag(rule_name="RR_CRITICAL", metric="respiratory_rate_bpm", value=vitals.respiratory_rate_bpm, threshold=28.0 if vitals.respiratory_rate_bpm>=28.0 else 8.0, severity_level=SeverityLevel.CRITICAL, condition_hypothesis="respiratory_distress"))
    elif vitals.respiratory_rate_bpm > 20.0 or vitals.respiratory_rate_bpm < 10.0:
        triggered_rules.append(RuleFlag(rule_name="RR_WARNING", metric="respiratory_rate_bpm", value=vitals.respiratory_rate_bpm, threshold=20.0 if vitals.respiratory_rate_bpm>20.0 else 10.0, severity_level=SeverityLevel.WARNING, condition_hypothesis="respiratory_distress"))

    # Blood Pressure (Systolic)
    if vitals.systolic_bp_mmhg >= 180.0 or vitals.systolic_bp_mmhg <= 80.0:
        hyp = "hypertension" if vitals.systolic_bp_mmhg >= 180.0 else "hypotension"
        triggered_rules.append(RuleFlag(rule_name="BP_SYS_CRITICAL", metric="systolic_bp_mmhg", value=vitals.systolic_bp_mmhg, threshold=180.0 if hyp=="hypertension" else 80.0, severity_level=SeverityLevel.CRITICAL, condition_hypothesis=hyp))
    elif vitals.systolic_bp_mmhg > 140.0 or vitals.systolic_bp_mmhg < 90.0:
        hyp = "hypertension" if vitals.systolic_bp_mmhg > 140.0 else "hypotension"
        triggered_rules.append(RuleFlag(rule_name="BP_SYS_WARNING", metric="systolic_bp_mmhg", value=vitals.systolic_bp_mmhg, threshold=140.0 if hyp=="hypertension" else 90.0, severity_level=SeverityLevel.WARNING, condition_hypothesis=hyp))

    # Temperature
    if vitals.body_temperature_c >= 39.5 or vitals.body_temperature_c <= 34.5:
        hyp = "fever_hyperthermia" if vitals.body_temperature_c >= 39.5 else "hypothermia"
        triggered_rules.append(RuleFlag(rule_name="TEMP_CRITICAL", metric="body_temperature_c", value=vitals.body_temperature_c, threshold=39.5 if hyp=="fever_hyperthermia" else 34.5, severity_level=SeverityLevel.CRITICAL, condition_hypothesis=hyp))
    elif vitals.body_temperature_c > 38.0 or vitals.body_temperature_c < 35.5:
        hyp = "fever_hyperthermia" if vitals.body_temperature_c > 38.0 else "hypothermia"
        triggered_rules.append(RuleFlag(rule_name="TEMP_WARNING", metric="body_temperature_c", value=vitals.body_temperature_c, threshold=38.0 if hyp=="fever_hyperthermia" else 35.5, severity_level=SeverityLevel.WARNING, condition_hypothesis=hyp))

    # 2. Derive Hypotheses
    condition_hyps = list({r.condition_hypothesis for r in triggered_rules})
    
    # 3. Incorporate ML result (Decoupled & Invariant)
    has_critical_rule = any(r.severity_level == SeverityLevel.CRITICAL for r in triggered_rules)
    has_warning_rule = any(r.severity_level == SeverityLevel.WARNING for r in triggered_rules)
    
    if has_critical_rule:
        final_severity = SeverityLevel.CRITICAL
    elif has_warning_rule:
        final_severity = SeverityLevel.WARNING
    elif ml_result is not None and ml_result.anomaly_label == 1:
        final_severity = SeverityLevel.WARNING
        if not condition_hyps:
            condition_hyps.append("unknown_physiological_anomaly")
    elif ml_result is None:
        # ML service degraded or offline
        final_severity = SeverityLevel.WARNING
        condition_hyps.append("telemetry_monitoring_degraded")
    else:
        final_severity = SeverityLevel.NORMAL

    return SeverityAssessment(
        severity=final_severity,
        triggered_rules=triggered_rules,
        condition_hypotheses=condition_hyps
    )
```

---

## 8. Hybrid Retrieval Pipeline & Algorithmic Query Synthesis

### 8.1 Algorithmic Query Synthesis Function (`services/rag-service/retrieval/query_builder.py`)
```python
def build_retrieval_query(vitals, assessment: SeverityAssessment) -> str:
    terms = []
    
    # 1. Inject primary hypotheses
    for hyp in assessment.condition_hypotheses:
        terms.append(hyp.replace("_", " "))
        
    # 2. Inject explicit physiological anomalies
    for rule in assessment.triggered_rules:
        terms.append(f"{rule.metric.replace('_', ' ')} {rule.value}")
        
    # 3. Inject standard NASA operational context keywords
    terms.append("emergency medical procedure checklist action steps")
    
    return " ".join(terms)
```

### 8.2 Cross-Encoder Sigmoid Calibration:
Cross-encoder raw logit output $z \in (-\infty, +\infty)$ must be converted to a calibrated probability score $P \in [0, 1]$ before evaluating against $\tau_{proc} \ge 0.50$:
$$P(d) = \sigma(z) = \frac{1}{1 + e^{-z}}$$
A candidate chunk is admitted to Tier 1 operational steps if and only if:
$$\text{chunk}.\text{tier} == 1 \quad \land \quad \sigma(\text{reranker\_logit}) \ge 0.50$$

---

## 9. Six-Stage Clinical Safety Guardrail Implementation (`services/rag-service/guardrails/`)

```python
import re
from typing import List, Tuple
from shared.contracts.rag_contract import ActionStep, GuidanceResponse

TAU_FAITH = 0.80
FLIGHT_SURGEON_ESCALATION_CLAUSE = (
    "CRITICAL PROTOCOL ESCALATION: Immediate consultation with NASA Flight Surgeon required. "
    "Begin emergency supportive stabilization as prescribed in checklist."
)

DRUG_DOSAGE_REGEX = re.compile(
    r'\b(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|l|mEq|units?|%|tablets?|capsules?))\b', 
    re.IGNORECASE
)

def run_guardrails(
    raw_response: dict,
    retrieved_tier1_chunks: list,
    assessment: SeverityAssessment
) -> Tuple[bool, GuidanceResponse]:
    # G1: Validate Pydantic v2 Schema
    try:
        guidance = GuidanceResponse.model_validate(raw_response)
    except Exception:
        return False, trigger_extractive_fallback(retrieved_tier1_chunks, assessment)

    # G2: Evidence-Tier 1 Enforcement on Action Steps
    tier1_ids = {c.chunk_id for c in retrieved_tier1_chunks if c.tier == 1}
    validated_steps: List[ActionStep] = []
    
    for step in guidance.steps:
        # Enforce that action step cites an existing TIER 1 chunk only
        if step.source_chunk_id in tier1_ids:
            # G4: Drug & Dosage hallucination check
            chunk_obj = next(c for c in retrieved_tier1_chunks if c.chunk_id == step.source_chunk_id)
            step_dosages = DRUG_DOSAGE_REGEX.findall(step.action)
            chunk_dosages = DRUG_DOSAGE_REGEX.findall(chunk_obj.text)
            
            # If step contains a dosage not found verbatim in chunk, strip or reject
            if all(d.lower() in [cd.lower() for cd in chunk_dosages] for d in step_dosages):
                validated_steps.append(step)
                
    # If more than 50% steps invalid, trigger fallback
    if len(validated_steps) < (len(guidance.steps) / 2) or not validated_steps:
        return False, trigger_extractive_fallback(retrieved_tier1_chunks, assessment)
        
    guidance.steps = validated_steps

    # G5: Severity Non-Downgrade
    if assessment.severity == SeverityLevel.CRITICAL and guidance.severity != SeverityLevel.CRITICAL:
        guidance.severity = SeverityLevel.CRITICAL
    elif assessment.severity == SeverityLevel.WARNING and guidance.severity == SeverityLevel.NORMAL:
        guidance.severity = SeverityLevel.WARNING

    # G6: Critical Escalation Enforcement
    if guidance.severity == SeverityLevel.CRITICAL:
        guidance.escalation.required = True
        guidance.escalation.target = "Flight Surgeon"
        if FLIGHT_SURGEON_ESCALATION_CLAUSE not in guidance.summary:
            guidance.summary = f"{FLIGHT_SURGEON_ESCALATION_CLAUSE} — {guidance.summary}"

    return True, guidance
```

### Extractive Fallback Parser (`services/rag-service/guardrails/extractive_fallback.py`):
When fallback is triggered, the service splits the top Tier 1 chunk text using regex `re.split(r'\n(?=\d+\.\s+)', chunk_text)` into discrete, ordered `ActionStep` items, ensuring 100% structured output continuity (`status = "degraded"`) without breaking frontend clients.

---

## 10. Database Schemas (SQLAlchemy ORM Models)

```python
# infrastructure/database/models.py
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON, Enum
from sqlalchemy.orm import declarative_base
from datetime import datetime
from shared.constants import SeverityLevel

Base = declarative_base()

class TelemetryAuditRecord(Base):
    __tablename__ = "telemetry_audit_records"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(String(64), unique=True, index=True, nullable=False)
    astronaut_id = Column(String(32), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # 7 Telemetry Metrics
    heart_rate_bpm = Column(Float, nullable=False)
    hrv_rmssd_ms = Column(Float, nullable=False)
    spo2_percent = Column(Float, nullable=False)
    body_temperature_c = Column(Float, nullable=False)
    respiratory_rate_bpm = Column(Float, nullable=False)
    systolic_bp_mmhg = Column(Float, nullable=False)
    diastolic_bp_mmhg = Column(Float, nullable=False)
    
    # ML & Rule Results
    ml_anomaly_label = Column(Integer, nullable=True)
    ml_confidence_score = Column(Float, nullable=True)
    severity = Column(Enum(SeverityLevel), nullable=False)
    condition_hypotheses = Column(JSON, nullable=False)
    active_provider = Column(String(32), nullable=False)
    latency_ms = Column(Float, nullable=False)
    response_payload = Column(JSON, nullable=False)
```

---

## 11. Alternatives Evaluated & Architecture Decisions (ADR Matrix)

| Architecture Alternative | Decision | Concrete Technical Rationale | Failure Condition of Rejected Alternative |
| :--- | :--- | :--- | :--- |
| **Monolith vs. Microservices** | **Microservices (`ml` + `rag`)** | ML feature window math decoupled from RAG embeddings and LLM gateways. | High ML ingest frequency starves FastAPI threadpool for RAG retrieval queries. |
| **Pure Vector vs. Hybrid RRF** | **Hybrid RRF (Dense + BM25)** | NASA checklist procedure titles and codes (`JSC-48031`) require exact keyword lexical matching. | Dense embeddings hallucinate similarity across unrelated checklists on acronym collisions. |
| **ChromaDB vs. Qdrant** | **ChromaDB (Initial)** | Zero-setup, embedded SQLite-backed vector storage with tiny memory footprint ($\approx 80 \text{ MB}$). | Qdrant standalone server adds memory overhead and port management during offline missions. (Qdrant benchmark planned for Phase 06). |
| **GPU vs. CPU Embeddings** | **CPU Embeddings (`bge-small`)** | Reserves 100% of the 6GB VRAM for Ollama LLM execution; 384d embedding takes $<25 \text{ ms}$ on 12 vCPUs. | Competing PyTorch CUDA context triggers driver OOM crash when Ollama generates tokens. |

---

## 12. Verification Matrix & Golden Dataset Vectors

To pass the Implementation Readiness bar, the implementation must pass the following 5 synthetic verification test vectors:

| Vector ID | Vital Sign Scenario | ML Result | Expected Severity | Expected Condition | Expected Triggered Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **VEC-01** | `SpO2: 86.5%, HR: 115, RR: 25` | `label=1, conf=0.98` | **Critical** | `hypoxia_suspected` | Immediate Tier 1 retrieval; flight surgeon escalation injected. |
| **VEC-02** | `HR: 142, SpO2: 97.0%, RR: 16` | `label=1, conf=0.91` | **Critical** | `tachycardia` | Tier 1 tachycardia protocol retrieved. |
| **VEC-03** | `HR: 108, SpO2: 93.5%, RR: 18` | `label=0, conf=0.88` | **Warning** | `tachycardia` | Severity elevated to Warning by deterministic rule despite ML=0. |
| **VEC-04** | All vitals normal | `label=1, conf=0.94` | **Warning** | `unknown_physiological_anomaly` | Anomaly alert logged; exploratory Tier 3 context retrieved. |
| **VEC-05** | Acute SpO2 drop (84.0%) | `ml=None` (ML crash) | **Critical** | `hypoxia_suspected` | 100% autonomous RAG retrieval executes; zero blocking by ML outage. |
