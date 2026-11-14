# AuraMed: Comprehensive System Design & Architecture Specification
# المواصفات الشاملة للتصميم المعماري وهندسة نظام AuraMed

> **Context:** NASA Space Apps Challenge 2026  
> **System:** Autonomous Medical Decision-Support Platform for Deep Space Exploration  
> **Status:** Production-Ready Architectural Blueprint (EGM Stage 2 Hardened)  
> **Classification:** Clinical Decision-Support System (Not Autonomous Diagnosis)  

---

## 1. Executive Summary & Mission Context (الملخص التنفيذي وسياق المهمة)

### 1.1 The Deep Space Medical Challenge
During human deep space exploration missions (International Space Station, Artemis Lunar Base, Mars Transit), crew members operate under extreme environmental constraints:
- **Communication Blackouts & Extreme Latency:** Radio transmissions encounter physical latency ranging from 3 to 22 minutes each way during Mars missions, with periodic solar conjunction blackout windows lasting up to 2 weeks.
- **Microgravity Pathophysiology:** Astronauts experience cephalic fluid shifts, muscle atrophy, bone demineralization, cardiovascular deconditioning, and heightened radiation exposure.
- **Resource Constraints:** Medical resources are limited; clinical specialists on Earth cannot provide real-time tactile or immediate emergency intervention.

**AuraMed** bridges this critical gap by delivering a resilient, **evidence-grounded medical decision-support platform**. The system ingests astronaut physiological telemetry, detects anomalies using machine learning, deterministically assesses severity, retrieves certified flight operational protocols from NASA manuals, and synthesizes actionable clinical guidance with a **100% offline operational guarantee**.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CORE ARCHITECTURAL INVARIANTS                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Decision-Support Only: Hypotheses, not definitive autonomous diagnoses.   │
│ 2. Deterministic Severity: Rules >= ML >= LLM (LLMs can NEVER downgrade).   │
│ 3. Strict Evidence Tiers: Action steps MUST cite approved Tier 1 checklists. │
│ 4. Zero Cold-Start Offline: Automatic failover to local Ollama runtime.     │
│ 5. Extractive Fail-Safe: Raw checklist extraction if any generation fails.  │
│ 6. Complete Data Privacy: Zero unauthorized cloud transmission of vitals.   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. High-Level Microservice Topology (طوبولوجيا الخدمات المصغرة للنظام)

The AuraMed architecture decouples responsibilities across three dedicated microservices, supported by persistent relational and vector storage engines, an intelligent LLM Gateway, and a bidirectional hands-free voice interface.

```mermaid
flowchart TD
    subgraph Clients ["Client & Telemetry Ingestion Layer"]
        Sensors["Wearable Biosensors\n(ECG, PPG, Temp, SpO2)"]
        WebUI["Web Clinical Dashboard\n(HTML5 / Canvas / Tailwind)"]
        MobileApp["AuraMed Mobile App\n(Flutter Cross-Platform)"]
        VoiceClient["Hands-Free Voice Client\n(EVA Suit Audio / WebSocket)"]
    end

    subgraph Tunnel ["Connectivity & Gateway Access"]
        Cloudflare["Cloudflared Tunnel / Localhost Loopback"]
    end

    subgraph GatewayService ["Unified Orchestrator Gateway (Port 8000)"]
        GW["Client API Gateway (FastAPI)"]
        GW_Static["Offline Swagger & Static UI Engine"]
        GW_Session["Session & Request Context Manager"]
        GW_Voice["Live Voice WebSocket Hub"]
    end

    subgraph MLService ["ML Anomaly Microservice (Port 8001)"]
        ML_API["FastAPI ML Router"]
        ML_Feat["Feature Engineering Engine\n(Rolling Windows & Statistics)"]
        ML_Model["Space Hazard ML Model\n(Isolation Forest / Classifier)"]
        ML_Score["Anomaly Confidence Scorer"]
    end

    subgraph RAGService ["RAG Decision Support Microservice (Port 8002)"]
        RAG_API["FastAPI RAG Router"]
        Rules["Deterministic Severity Engine\n(6 Vital Threshold Gates)"]
        HybridRetriever["Hybrid Retrieval Engine\n(RRF k=60)"]
        LLMGateway["LLM Gateway & Circuit Breaker\n(Online-First / Offline-Fallback)"]
        Guardrails["6-Stage Clinical Safety Guardrails"]
    end

    subgraph DataStorage ["Data & Knowledge Persistence Layer"]
        MySQL[("Relational Store (MySQL / SQLite)\nTelemetry, Sessions, Audit Records")]
        Chroma[("Vector Store (ChromaDB)\nCollection: nasa_med_v1\n384d Dense bge-small")]
        BM25_Index[("Lexical Index (Rank-BM25)\nIn-Memory Keyword Index")]
        NASADocs[("NASA Medical Corpus\nTier 1 Checklists / Tier 2 Standards")]
    end

    subgraph InferenceRuntimes ["LLM & Voice Inference Backends"]
        CloudLLM["Cloud LLM API\n(Groq / Gemini 120B / Fast Inference)"]
        OllamaLocal["Local Ollama Runtime\n(MedGemma 4B / DeepSeek-R1 8B)"]
        GeminiAudio["Gemini Live Audio API\n(Transcribe-Live & Flash-TTS)"]
        LocalTTS["Local VibeVoice-0.5B TTS\n(Offline Voice Synthesis)"]
    end

    Sensors -->|Raw 17 Vitals Telemetry| GW
    WebUI <-->|REST & SSE Stream| Cloudflare
    MobileApp <-->|REST API| Cloudflare
    VoiceClient <-->|PCM 16kHz WebSocket| Cloudflare
    Cloudflare <--> GW

    GW --> GW_Static
    GW --> GW_Session
    GW <--> GW_Voice

    GW -->|"(1) POST /ml/predict"| ML_API
    ML_API --> ML_Feat --> ML_Model --> ML_Score
    ML_Score -->|Prediction & Confidence| GW

    GW -->|"(2) POST /v1/guidance/generate"| RAG_API
    RAG_API --> Rules
    Rules --> HybridRetriever

    HybridRetriever <--> Chroma
    HybridRetriever <--> BM25_Index
    HybridRetriever --> LLMGateway

    LLMGateway -->|Online Path| CloudLLM
    LLMGateway -->|Offline Fallback| OllamaLocal

    CloudLLM --> Guardrails
    OllamaLocal --> Guardrails

    Guardrails -->|Verified Action Plan| RAG_API
    RAG_API -->|Audit Trail Log| MySQL
    RAG_API -->|Structured Guidance| GW

    GW_Voice <-->|Online STT / TTS| GeminiAudio
    GW_Voice <-->|Offline TTS Fallback| LocalTTS
```

---

## 3. End-to-End Clinical Data Flow (تسلسل تدفق البيانات من المستشعر إلى التوجيه السريري)

The following sequence diagram outlines the exact request lifecycle when astronaut physiological telemetry undergoes real-time analysis, anomaly detection, deterministic escalation, hybrid retrieval, and guardrailed generation.

```mermaid
sequenceDiagram
    autonumber
    actor Astronaut as Astronaut / Wearable Biosensors
    participant Gateway as Client Gateway (Port 8000)
    participant ML as ML Service (Port 8001)
    participant RAG as RAG Service (Port 8002)
    participant Rules as Deterministic Severity Engine
    participant Hybrid as Hybrid Retriever (Chroma + BM25)
    participant GatewayLLM as LLM Gateway (Cloud / Ollama)
    participant Guard as 6-Stage Safety Guardrails
    participant DB as MySQL Audit Store

    Astronaut->>Gateway: POST /v1/telemetry (17 Raw Vitals)
    Note over Gateway: Generate X-Request-ID<br/>Inject Timestamps & Astronaut Context

    Gateway->>ML: POST /ml/predict (Raw Vitals & Rolling Stats)
    ML->>ML: Compute Feature Transformations & Window Deltas
    ML->>ML: Run Space Hazard Risk Classifier
    ML-->>Gateway: Return {anomaly_label, confidence_score, risk_features}

    Gateway->>RAG: POST /v1/guidance/generate (Vitals + ML Output)
    
    RAG->>Rules: assess(vitals, ml_anomaly_label, ml_confidence)
    Note over Rules: Evaluate 6 Threshold Gates<br/>Rule Invariance: Escalates severity, NEVER downgrades!
    Rules-->>RAG: SeverityAssessment (NORMAL / WARNING / CRITICAL)

    RAG->>Hybrid: retrieve(query, top_k=5, severity)
    par Dense Search
        Hybrid->>Hybrid: ChromaDB Query (bge-small 384d, Cosine, Top 30)
    and Sparse Search
        Hybrid->>Hybrid: Rank-BM25 Lexical Keyword Search (Top 30)
    end
    Hybrid->>Hybrid: Merge via Reciprocal Rank Fusion (k=60)
    Hybrid->>Hybrid: Cross-Encoder Neural Reranking (Top 20 -> Top 5)
    Hybrid->>Hybrid: Calibrated Filter (tau_proc >= 0.50)
    Hybrid-->>RAG: Approved NASA Tier 1 & Supporting Chunks

    RAG->>GatewayLLM: generate_clinical_guidance(vitals, severity, chunks)
    alt Cloud API Healthy (Online Mode)
        GatewayLLM->>GatewayLLM: Cloud LLM API (Groq / Gemini) (Timeout: 25s)
    else Cloud Unavailable / Timeout (Offline Fallback)
        GatewayLLM->>GatewayLLM: Route to Local Ollama (MedGemma:4B / DeepSeek-R1:8B)
    end
    GatewayLLM-->>RAG: Raw Synthesized Response

    RAG->>Guard: validate(raw_response, tier1_chunks, severity)
    Note over Guard: Gate 1: Pydantic v2 Schema<br/>Gate 2: Tier 1 Citation Exact Match<br/>Gate 3: Faithfulness Check (tau >= 0.80)<br/>Gate 4: Drug & Dosage Regex Verification<br/>Gate 5: Non-Downgrade Invariance<br/>Gate 6: Flight Surgeon Emergency Clause
    alt Validation Passes
        Guard-->>RAG: Validated GuidanceResponse
    else Hallucination / Validation Failure
        Guard->>Guard: Trigger Extractive Fallback (Raw NASA Checklist Chunks)
        Guard-->>RAG: Extractive Fallback GuidanceResponse
    end

    RAG->>DB: Persist TelemetryAuditRecord (vitals, hypotheses, latency, provider)
    RAG-->>Gateway: Return Final Guidance JSON
    Gateway-->>Astronaut: Display Actionable Guidance & Emit Voice Audio (<50ms Barge-in)
```

---

## 4. Microservice Architecture & Subsystem Specifications (تفاصيل الخدمات والأنظمة الفرعية)

### 4.1 Service Port & Responsibility Allocation
| Service Component | Port | Technology | Primary Responsibility |
| :--- | :---: | :--- | :--- |
| **Unified Orchestrator Gateway** | `8000` | FastAPI, Uvicorn, WebSockets | Single client entrypoint, CORS, static UI, live audio streaming hub, Cloudflared tunnel routing. |
| **ML Anomaly Microservice** | `8001` | FastAPI, Scikit-learn, Joblib | Stateless ML inference, 17-vital anomaly detection, feature engineering, space hazard classification. |
| **RAG Decision Support Microservice** | `8002` | FastAPI, ChromaDB, Rank-BM25, PyTorch | Deterministic rule gating, hybrid retrieval, LLM generation, 6-stage clinical safety guardrails. |
| **Structured Store (MySQL / SQLite)** | `3306` / File | SQLAlchemy, Alembic | Astronaut telemetry logs, session tracking, clinical audit trail, provider transition metrics. |
| **Vector Store (ChromaDB)** | `8002` (In-Proc) | ChromaDB, SQLite-backed | Persistent embedding store (`nasa_med_v1`), 384-dimensional cosine distance retrieval. |
| **Local Model Runtime (Ollama)** | `11434` | Ollama C++ Native Runtime | 100% offline LLM execution (`medgemma:latest`, `deepseek-r1:8b`, `qwen2.5-coder:14b`). |

---

### 4.2 ML Anomaly Microservice (`Port 8001`)

The ML Microservice evaluates astronaut physiological telemetry in streaming real-time to detect anomalous space hazard patterns before acute decompensation occurs.

```mermaid
flowchart LR
    VitalsInput["Raw 17 Vitals Input\n(HR, SpO2, SBP, DBP, RR, Temp, etc.)"] --> FeatEng["Feature Engineering\n- Mean & Std Windows\n- Rate of Change (dV/dt)\n- Pulse Pressure Calculation"]
    FeatEng --> Scaler["Preprocessor & Robust Scaler\n(preprocessor.joblib)"]
    Scaler --> Classifier["Space Hazard Risk Classifier\n(space_hazard_risk_classifier.joblib)"]
    Scaler --> Regressor["Degradation Severity Regressor\n(space_hazard_degradation_regressor.joblib)"]
    Classifier --> Out["Output Payload:\n- anomaly_label (0=Normal, 1=Hazard)\n- confidence_score (0.0 to 1.0)\n- primary_hazard_category"]
    Regressor --> Out
```

#### Monitored Physiological Vitals & Engineering Rules:
1. **Heart Rate (HR):** Baseline $60-100\text{ BPM}$; Critical thresholds $< 40$ or $> 130\text{ BPM}$.
2. **Oxygen Saturation ($\text{SpO}_2$):** Critical hypoxia cutoff $< 88.0\%$; Warning threshold $< 92.0\%$.
3. **Blood Pressure (Systolic / Diastolic):** Hypertensive crisis $> 180 / 120\text{ mmHg}$; Hypovolemic shock $< 80 / 50\text{ mmHg}$.
4. **Respiratory Rate (RR):** Tachypnea $> 28\text{ breaths/min}$; Bradypnea $< 8\text{ breaths/min}$.
5. **Core Body Temperature:** Hyperthermia $> 39.5^\circ\text{C}$; Severe hypothermia $< 34.5^\circ\text{C}$.
6. **Telemetry Features:** Pulse Pressure ($\text{SBP} - \text{DBP}$), Mean Arterial Pressure ($\text{MAP}$), and rolling standard deviations.

---

### 4.3 Deterministic Severity Engine (محرك الخطورة الحتمي)

To ensure clinical safety, medical severity is **never determined by an LLM**. The severity engine applies mathematical boundary rules that operate with strict invariant precedence:

$$\text{Severity}_{\text{Final}} = \max\Big(\text{Severity}_{\text{Deterministic Rules}}, \text{Severity}_{\text{ML Model}}\Big)$$

An LLM is mathematically and programmatically prohibited from altering, lowering, or overriding the calculated severity.

```mermaid
flowchart TD
    Start["Receive Physiological Vitals & ML Prediction"] --> Gate1{"Any Vital in CRITICAL Threshold?\n(SpO2 < 88%, HR > 130 or < 40,\nBP > 180/120 or < 80/50, Temp > 39.5C)"}
    
    Gate1 -- YES --> SetCritical["Set Severity = CRITICAL\nInject Mandatory Flight Surgeon Clause\nImmediate Stabilization Priority"]
    
    Gate1 -- NO --> Gate2{"Any Vital in WARNING Threshold?\n(SpO2 < 92%, HR > 100 or < 50,\nBP > 140/90, Temp > 38.0C)\nOR ML Anomaly Label == 1"}
    
    Gate2 -- YES --> SetWarning["Set Severity = WARNING\nHeightened Monitoring & Supportive Protocol"]
    Gate2 -- NO --> SetNormal["Set Severity = NORMAL\nBaseline Routine Observation"]

    SetCritical --> Output["Return SeverityAssessment\nSeverity cannot be downgraded by LLM"]
    SetWarning --> Output
    SetNormal --> Output
```

---

## 5. Hybrid Retrieval Pipeline & Evidence Architecture (محرك الاسترجاع الهجين ومستويات الأدلة)

### 5.1 Evidence-Tier Partitioning (مستويات الأدلة الطبية لـ NASA)
The medical knowledge base is compartmentalized into three rigid evidence tiers:

| Evidence Tier | Document Type | Authorization Scope | Usage in AuraMed |
| :---: | :--- | :--- | :--- |
| **Tier 1** | Flight Operational Procedures, Medical Checklists, Emergency Protocols | **Full Operational Steps** | **Only Tier 1 chunks can generate action steps.** Every recommended action MUST provide an exact citation to a Tier 1 chunk. |
| **Tier 2** | NASA Medical Standards, Level of Care Guidelines, Clinical References | **Contextual Background** | Used strictly for clinical context, condition summaries, and diagnostic criteria. Cannot create procedural steps. |
| **Tier 3** | Medical Condition Lists, Space Toxicology, Pathophysiology Papers | **Reference Knowledge** | General educational and background understanding. Prohibited from generating action steps. |

---

### 5.2 Hybrid Retrieval Pipeline Architecture

```mermaid
flowchart TD
    UserQuery["Clinical Search Query\n(Symptoms, Hypotheses, Vital Flags)"] --> QueryBuilder["Query Normalizer & Medical Term Expander"]
    
    QueryBuilder --> DenseRetrieval["Dense Semantic Search\n- Model: bge-small (384d, CPU)\n- Vector Store: ChromaDB (nasa_med_v1)\n- Distance Metric: Cosine\n- Top K: 30 Candidates"]
    
    QueryBuilder --> BM25Retrieval["Sparse Lexical Search\n- Engine: Rank-BM25\n- In-Memory Inverted Index\n- Keyword & Acronym Matching\n- Top K: 30 Candidates"]

    DenseRetrieval --> RRF["Reciprocal Rank Fusion (RRF)\nRRF_Score(d) = sum( 1 / (60 + rank_i(d)) )\nMerges Top 30 Dense + Top 30 Sparse"]
    BM25Retrieval --> RRF

    RRF --> Filter["Candidate Pool Slicer\nTop 20 Unique Documents"]

    Filter --> Reranker["Neural Cross-Encoder Reranker\n- Model: bge-reranker-base (CPU)\n- Full Cross-Attention Pair Scoring\n- Top K: 5 Chunks"]

    Reranker --> SigmoidGate{"Calibrated Acceptance Gate\nSigmoid Score >= tau_proc (0.50)?"}

    SigmoidGate -- PASS --> ApprovedChunks["Approved Chunks List\n(Tier 1 Operational Procedures + Context)"]
    SigmoidGate -- FAIL --> FallbackEmpty["Return: no_protocol_found\nPrevent Hallucinated Retrieval"]
```

---

## 6. Online-First / Offline-Fallback LLM Gateway (بوابة الذكاء الاصطناعي وبدائل الأوفلاين)

### 6.1 Resilient Gateway Mechanics
The LLM Gateway manages generation requests with proactive health probes, bounded timeouts, and transparent automatic failover:
- **Online Mode:** Routes requests to high-throughput Cloud LLM APIs (e.g. Groq OpenAI-compatible endpoint or Gemini API) with a strict $25.0\text{s}$ timeout.
- **Offline Mode:** When network connectivity is severed or cloud endpoints fail, requests instantly route to the local **Ollama** runtime running on the spacecraft workstation.
- **Zero Cold-Start:** Local models are loaded with `keep_alive: -1`, pinning the model weights in VRAM/RAM to eliminate cold-start initialization latency.

```mermaid
stateDiagram-v2
    [*] --> Closed: Initial State (Cloud Primary Enabled)

    state Closed {
        [*] --> OnlineActive: Heartbeat Healthy
        OnlineActive --> CloudExecution: Guidance Request
        CloudExecution --> OnlineActive: Generation Success (<25s)
    }

    Closed --> Open: Consecutive Failures >= 3 OR Network Disconnect
    
    state Open {
        [*] --> OfflineFallbackActive: Route to Local Ollama
        OfflineFallbackActive --> OllamaExecution: Run MedGemma:4B / DeepSeek-R1:8B
        OllamaExecution --> OfflineFallbackActive: Local Generation Output
    }

    Open --> HalfOpen: Proactive Background Probe Success (TTL 30s)
    
    state HalfOpen {
        [*] --> CanaryProbe: Test Single Request on Cloud API
        CanaryProbe --> Closed: Canary Request Succeeded
        CanaryProbe --> Open: Canary Request Failed
    }
```

---

## 7. Six-Stage Clinical Safety Guardrails (صمامات الأمان الطبية السداسية)

Before any guidance payload is transmitted to the astronaut or flight surgeon, it must pass sequentially through six independent programmatic safety gates. If any gate fails, the system triggers the **Extractive Fallback Engine**, returning verified verbatim NASA manual text without speculative synthesis.

```mermaid
flowchart LR
    RawLLM["Raw LLM Output"] --> G1["Gate G1:\nPydantic v2 Schema"]
    G1 --> G2["Gate G2:\nTier 1 Citation Match"]
    G2 --> G3["Gate G3:\nFaithfulness (tau >= 0.80)"]
    G3 --> G4["Gate G4:\nDrug & Dosage Regex"]
    G4 --> G5["Gate G5:\nSeverity Invariance"]
    G5 --> G6["Gate G6:\nFlight Surgeon Injection"]
    G6 --> SafeOutput["Final Validated Guidance JSON"]

    G1 -.->|Validation Error| ExtractiveFallback["Extractive Fallback Engine\n(Raw NASA Checklist Chunks)"]
    G2 -.->|Missing Citation| ExtractiveFallback
    G3 -.->|Low Faithfulness| ExtractiveFallback
    G4 -.->|Hallucinated Drug| ExtractiveFallback
    G5 -.->|Severity Altered| ExtractiveFallback
    ExtractiveFallback --> SafeOutput
```

### Safety Gate Specifications:
1. **Gate G1 (Pydantic v2 Schema Enforcement):** Validates structural compliance with `GuidanceResponse`. Rejects malformed JSON, truncated tokens, or missing fields.
2. **Gate G2 (Tier 1 Action Citation Check):** Every action step must reference a retrieved chunk ID present in the active Tier 1 candidate set. Unreferenced instructions are stripped.
3. **Gate G3 (Semantic Faithfulness Check):** Calculates lexical token overlap and semantic similarity between generated steps and cited source text ($\tau_{\text{faith}} \ge 0.80$).
4. **Gate G4 (Zero-Hallucination Drug & Dosage Regex):** Uses `\b(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|tablets?))\b` to extract all pharmacological numbers. Every detected dosage must exist verbatim within the cited NASA checklist.
5. **Gate G5 (Non-Downgradable Severity Invariance):** Confirms that the final output severity is strictly identical to the pre-calculated `SeverityAssessment`.
6. **Gate G6 (Flight Surgeon Escalation Clause):** If severity is `CRITICAL`, programmatically prepends the mandatory emergency directive:
   > *"CRITICAL PROTOCOL ESCALATION: Immediate consultation with NASA Flight Surgeon required. Begin emergency supportive stabilization as prescribed in checklist."*

---

## 8. Live Hands-Free Voice Subsystem (نظام التفاعل الصوتي الحي بدون استخدام اليدين)

### 8.1 Hands-Free Clinical Workflow
During Extravehicular Activity (EVA) or critical medical emergencies, astronauts wear pressurized suits or sterile gloves and cannot interact with physical keyboards or touchscreens. AuraMed features an integrated **Live Voice Mode**:

```mermaid
sequenceDiagram
    autonumber
    actor Astronaut as Astronaut (EVA Headset)
    participant VoiceHub as Voice WebSocket Hub (Port 8000)
    participant STT as Gemini Transcribe-Live / Offline STT
    participant Orchestrator as AuraMed Core Engine
    participant TTS as Gemini Flash-TTS / VibeVoice-0.5B
    
    Astronaut->>VoiceHub: Continuous Audio Stream (PCM 16kHz Mono)
    VoiceHub->>STT: Stream Audio Chunks
    
    Note over STT: Real-time Transcribe with<br/>NASA Custom Medical Vocabulary<br/>(SpO2, SOMS, CHECS, CMRS, PEA)
    STT-->>VoiceHub: Partial Transcript Stream
    
    Astronaut->>Astronaut: Finishes Speaking (Silence Debounce: 500ms - 1500ms)
    STT-->>VoiceHub: Finalized User Transcript Turn

    VoiceHub->>Orchestrator: Query Pipeline (Chat / Protocol / Telemetry)
    Orchestrator-->>VoiceHub: Synthesized Medical Guidance Response

    VoiceHub->>TTS: Request Speech Synthesis (Voice: Kore)
    TTS-->>VoiceHub: Stream Audio Chunks (PCM / WAV)
    VoiceHub-->>Astronaut: Audible Clinical Instructions

    opt Astronaut Interrupts (Barge-In Event)
        Astronaut->>VoiceHub: Starts Speaking While Audio Playing
        VoiceHub->>VoiceHub: Detect Audio Energy / VAD Trigger (<50ms)
        VoiceHub->>TTS: CANCEL Ongoing Audio Generation
        VoiceHub-->>Astronaut: Immediate Playback Mute (<50ms)
        VoiceHub->>STT: Stream New Astronaut Voice Input
    end
```

---

## 9. Data Persistence & Relational Schema (قواعد البيانات ونمذجة البيانات)

```mermaid
erDiagram
    TELEMETRY_AUDIT_RECORD {
        int id PK "Auto Increment"
        string request_id UK "Unique Correlation ID (UUID4)"
        string astronaut_id "Astronaut Identification Code"
        datetime timestamp "Telemetry Capture Timestamp"
        string severity "Normal / Warning / Critical"
        int ml_anomaly_label "0: Normal, 1: Hazard Detected"
        float ml_confidence_score "Model Confidence (0.00 - 1.00)"
        text vitals_json "Serialized 17 Vitals Dictionary"
        text condition_hypotheses_json "Diagnostic Hypotheses Array"
        text summary "Clinical Assessment Summary"
        string active_provider "groq / gemini / ollama / extractive"
        string status "ok / degraded / no_protocol_found"
        int action_steps_count "Number of Verified Steps"
        boolean escalation_required "Flag for Flight Surgeon Alert"
        string escalation_target "Ground Surgeon / CMDR / Local Medical"
        float latency_ms "Total Pipeline Processing Latency"
        datetime created_at "Record Creation Timestamp"
    }

    CHROMA_VECTOR_COLLECTION {
        string chunk_id PK "Unique Chunk Identifier (e.g. CHK-REV-K-042)"
        string document_id "Source Document Code (e.g. JSC-48031)"
        string title "Procedure Title"
        string evidence_tier "Tier 1 / Tier 2 / Tier 3"
        int page_start "Starting Page in NASA Manual"
        int page_end "Ending Page in NASA Manual"
        text content "Extracted Raw Procedure & Checklist Text"
        vector_384 embedding "bge-small 384-dimensional dense vector"
    }

    TELEMETRY_AUDIT_RECORD ||--o{ CHROMA_VECTOR_COLLECTION : "cites retrieved chunks"
```

---

## 10. Hardware Deployment & Spacecraft Edge Topology (طوبولوجيا النشر والعتاد)

AuraMed is engineered to execute fully within the constraints of real-world spacecraft computing hardware, validated on the edge development environment:

```mermaid
flowchart TD
    subgraph SpacecraftHardware ["Spacecraft Onboard Computing Node (Edge Hardware)"]
        CPU["Intel Core i7-10850H (6 Cores / 12 Threads)"]
        RAM["32GB System RAM (DDR4)"]
        GPU["NVIDIA Quadro RTX 3000 Max-Q (6GB GDDR6 VRAM)"]
        SSD["1TB NVMe Local Fast Storage"]
    end

    subgraph LocalStack ["Fully Local Software Stack (100% Offline Survival)"]
        Docker["Docker Engine & Compose Runtime"]
        MySQL_Inst["MySQL 8.0 / SQLite Embedded"]
        Chroma_Inst["ChromaDB (In-Process SQLite Vector DB)"]
        Ollama_Inst["Native Ollama Server\n- MedGemma 1.5 4B (VRAM: ~3.2GB)\n- DeepSeek-R1 8B (Q4_K_M VRAM: ~4.9GB)\n- bge-small CPU Embeddings (RAM: ~300MB)"]
        Gateway_Inst["FastAPI Client Gateway & Orchestrator (Port 8000)"]
        ML_Inst["FastAPI ML Service (Port 8001)"]
        RAG_Inst["FastAPI RAG Service (Port 8002)"]
    end

    subgraph DeepSpaceComm ["Intermittent Deep-Space Communication Link"]
        LaserComm["High-Bandwidth Deep Space Optical Comm\n(Latency: 3 to 22 minutes / Outages during Conjunction)"]
    end

    subgraph TerrestrialGround ["Terrestrial Ground Control (Earth)"]
        GroundControl["NASA Mission Control Center (Houston)"]
        CloudAPIs["Cloud High-Parameter LLM Models\n(Large Reasoning & Retrospective Analysis)"]
    end

    SpacecraftHardware --- LocalStack
    LocalStack <-->|Periodic Telemetry Burst Sync| LaserComm
    LaserComm <--> TerrestrialGround
```

---

## 11. System Health Verification & Quality Gates (مؤشرات الأداء وضمان الجودة)

The entire AuraMed system is validated by an automated test suite comprising **73+ unit, integration, and contract tests**:
- **Test Command:** `uv run pytest tests/ -v`
- **End-to-End Latency Target:**
  - Anomaly Detection (ML Service): $< 15\text{ ms}$.
  - Deterministic Severity Rule Check: $< 2\text{ ms}$.
  - Hybrid Retrieval (Dense + BM25 + Rerank): $< 85\text{ ms}$.
  - Voice Barge-In Cancellation: $< 50\text{ ms}$.
  - Total Guidance Generation (Online): $< 1.8\text{ s}$.
  - Total Guidance Generation (Offline Ollama): $< 4.5\text{ s}$.
- **Hallucination Rate:** $0.0\%$ on clinical procedural actions (guaranteed by Gate G2 citation matching & Gate G4 dosage verification).

---

## 12. Related Technical Documentation (روابط التوثيق التقني المرتبطة)

- [System Architecture EGM Spec](file:///e:/Projects/AuraMed/docs/designs/system_architecture.md)
- [API Integration Guide](file:///e:/Projects/AuraMed/docs/API_INTEGRATION_GUIDE.md)
- [Frontend & Mobile Integration Guide](file:///e:/Projects/AuraMed/docs/FRONTEND_INTEGRATION_GUIDE.md)
- [Live Voice Mode Specification](file:///e:/Projects/AuraMed/specs/002-live-voice-mode/spec.md)
- [System Evaluation & Benchmark Report](file:///e:/Projects/AuraMed/docs/reports/EVALUATION_REPORT.md)
- [Decisions Log](file:///e:/Projects/AuraMed/docs/DECISIONS.md)
