# AuraMed Project Evidence Register
**Context:** NASA Space Apps Challenge 2026  
**Auditor Methodology:** Rigorous Artifact & Claim Verification

This document catalogs every technical, scientific, and architectural claim made within the AuraMed project, linking each claim to verified filesystem artifacts and explicitly defining the boundaries of what the evidence proves versus what it does NOT prove.

---

## 1. Core Claims & Evidence Verification Register

| # | System Claim | Status | File / Artifact Path | What It Proves | What It Does NOT Prove |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **C-01** | **Repository and Version Control Status** | **Verified (Untracked)** | `e:\Projects\AuraMed\.git` | Git repository exists on branch `master`. | Does not prove commit history or remote synchronization (no commits exist yet). |
| **C-02** | **End-to-End Telemetry Evaluation Endpoint** | **Implemented & Tested** | `services/orchestrator/router.py`, `tests/unit/test_orchestrator.py` | FastAPI gateway serves `POST /api/v1/assess-astronaut`, evaluates vitals, returns NASA Tier 1 steps, passes unit tests. | Does not prove live external client (Flutter/React) is actively receiving data in production. |
| **C-03** | **Machine Learning Hazard Anomaly Detection** | **Implemented & Tested** | `models/space_hazards_ml/models/space_hazard_risk_classifier.joblib`, `tests/unit/test_ml_service.py` | GradientBoosting classifier loads, predicts 3 risk classes, achieves 93.43% test accuracy on synthetic test split. | Does not prove diagnostic accuracy on real human astronauts in spaceflight. |
| **C-04** | **Spaceflight Cognitive/Physiological Degradation Regression** | **Implemented & Tested** | `models/space_hazards_ml/models/space_hazard_degradation_regressor.joblib`, `metrics.json` | GradientBoosting regressor achieves $R^2 = 0.9788$ and $\text{RMSE} = 3.08$ on synthetic test set. | Does not prove calibration against clinical medical lab assays or biomarkers. |
| **C-05** | **Synthetic Data Origin & Parameterization** | **Verified Synthetic** | `models/space_hazards_ml/data/generate_dataset.py`, `space_hazards_dataset.csv` | Exactly 3,500 records generated using mathematical formulas derived from NASA HRP literature with `random_seed=42`. | Proves that 0 actual human participants or flight telemetry records were used to train these models. |
| **C-06** | **Deterministic Severity Non-Downgrade Invariance** | **Formally Proven & Tested** | `shared/rules/severity_engine.py`, `tests/unit/test_severity_engine.py` | Mathematical rule engine guarantees that clinical rules may escalate severity (Normal $\to$ Warning $\to$ Critical) but never downgrade. | Does not prove clinical completeness of threshold numbers across all edge medical conditions. |
| **C-07** | **NASA Medical Documentation Ingestion** | **Verified Corpus** | `data/raw/` (8 PDF files), `data/sources.yaml` | 8 official NASA medical PDFs cataloged (948 pages total) with SHA256 cryptographic hashes and 95.6%–100% digital extractability. | Does not prove that NASA officially endorses the AuraMed software system. |
| **C-08** | **ChromaDB & BM25 Dual Vector/Lexical Indexing** | **Implemented & Verified** | `data/chroma_db/chroma.sqlite3` (29.3 MB), `data/bm25_index.pkl` (3.85 MB) | 3,085 indexed text chunks partitioned by evidence tiers (Tier 1, Tier 2, Tier 3) exist on disk. | Does not prove dynamic incremental updating when new documents are uploaded. |
| **C-09** | **Six-Stage Clinical Guardrail Engine** | **Implemented & Tested** | `services/rag_service/guardrails/safety_validator.py`, `tests/unit/test_guardrails.py` | Engine enforces schema validation, Tier 1 checklist restriction, medication dosage regex invariance, and severity non-downgrade. | Does not prove that LLMs will never attempt to hallucinate; it proves the guardrail catches and converts hallucinations to fallback. |
| **C-10** | **Fail-Safe Extractive Checklist Fallback** | **Implemented & Tested** | `services/rag_service/guardrails/extractive_fallback.py` | When LLM fails, timed out, or hallucinated, verbatim numbered steps from raw Tier 1 chunks are extracted with zero natural language generation. | Does not prove that the underlying NASA checklist itself is clinically suitable for unassisted layperson execution. |
| **C-11** | **Online-First / Offline-Fallback LLM Gateway** | **Implemented & Tested** | `services/rag_service/gateway/llm_gateway.py`, `tests/integration/test_offline_fallback.py` | Gateway routes to Groq Cloud API when online; seamlessly switches to native Ollama (`medgemma:latest`) with zero downtime on network failure. | Does not guarantee unlimited local GPU memory if host is constrained below 6GB VRAM. |
| **C-12** | **Native Ollama Host Models** | **Verified Present** | `docs/reports/OLLAMA_AUDIT.md`, `Ollama v0.40.16` | Models `medgemma:latest` (3.9B BF16) and `deepseek-r1:8b` (8.2B Q4_K_M) exist in local Ollama storage. | Does not prove model weights were fine-tuned or trained by AuraMed (weights are open-source upstream models). |
| **C-13** | **Live Voice Mode & TTS Dual Gateway** | **Implemented & Tested (Unit)** | `services/rag_service/routers/voice.py`, `models/VibeVoice-Realtime-0.5B/` (2.03 GB) | Speech generation supports Cloud Gemini TTS and local offline VibeVoice model; contracts and barge-in state machine verified. | Does not prove physical acoustics/microphone noise cancellation inside an actual ISS space cabin. |
| **C-14** | **API Key Security Middleware** | **Implemented & Tested** | `services/orchestrator/main.py`, `tests/unit/test_orchestrator.py` | Enforces `X-API-Key` or `Authorization: Bearer <key>` when `AURAMED_API_KEY` is configured; public endpoints exempted. | Does not prove zero-trust network encryption beyond the tunnel boundary. |
| **C-15** | **Cloudflare Tunnel Deployment Tooling** | **Implemented & Tested** | `infrastructure/bin/cloudflared.exe` (v2026.11.0), `scripts/start_tunnel_server.py` | Standalone binary exists and successfully exposes port 8000 over HTTPS with automatic URL extraction. | Does not guarantee 100% uptime if local home ISP internet connection drops. |
| **C-16** | **Golden Dataset Evaluation Benchmark** | **Verified Results** | `docs/reports/EVALUATION_REPORT.md`, `eval/golden/cases/` (40 cases) | Measured 100% severity preservation, 100% flight surgeon escalation, 0% dosage hallucination, and 108.4ms median retrieval latency. | Does not represent real-time prospective clinical trial validation. |
| **C-17** | **Flutter Mobile Client Integration** | **Contract Prepared / Code Wrapper** | `docs/flutter_integration/auramed_api_service.dart`, `FLUTTER_INTEGRATION_PROMPT.md` | Complete Dart service wrapper and prompt specifications created for external Flutter engineers. | Does not prove that the Flutter app is currently compiled, running, or published in app stores. |
| **C-18** | **Laravel / External Backend Integration** | **Planned / Not Verified** | Referenced in `AGENTS.md` | Architectural intent documented. | Integration not verified from the available workspace (no Laravel repository present). |

---

## 2. Inventory of Tangible Artifacts, Datasets & Models

### 2.1 Machine Learning Artifacts
* **Classifier:** `models/space_hazards_ml/models/space_hazard_risk_classifier.joblib` (Size: 1,435,077 bytes).
* **Regressor:** `models/space_hazards_ml/models/space_hazard_degradation_regressor.joblib` (Size: 647,364 bytes).
* **Preprocessor:** `models/space_hazards_ml/models/preprocessor.joblib` (Size: 4,566 bytes).
* **Metrics File:** `models/space_hazards_ml/models/metrics.json` (Size: 3,439 bytes).
* **Feature Importance:** `models/space_hazards_ml/models/feature_importance.json` (Size: 755 bytes).
* **Local TTS Model:** `models/VibeVoice-Realtime-0.5B/model.safetensors` (Size: 2,035,332,888 bytes).
* **TTS Audio Test Output:** `models/VibeVoice-Realtime-0.5B/test_output.wav` (Size: 313,644 bytes).

### 2.2 Knowledge Base & Database Artifacts
* **ChromaDB Vector Store:** `data/chroma_db/chroma.sqlite3` (Size: 29,376,512 bytes).
* **ChromaDB Index Files:** `data/chroma_db/1d65538c-8e9f-44c7-b41b-f8298ef0dd7f/data_level0.bin` (Size: 3,352,000 bytes).
* **Rank-BM25 Index:** `data/bm25_index.pkl` (Size: 3,857,043 bytes).
* **Audit Database:** `data/auramed_audit.db` (Size: 147,456 bytes).
* **Raw NASA Source PDFs:** 8 PDF files in `data/raw/` totaling ~11.3 MB.

### 2.3 Process Control & Operational Scripts
* **One-Click Start (Server + Tunnel):** `start.bat` $\to$ `bin/start.bat` $\to$ `scripts/start_tunnel_server.py`.
* **One-Click Stop (Reclaim Ports 8000–8002):** `stop.bat` $\to$ `bin/stop.bat` $\to$ `scripts/stop_all_services.py`.
* **Status Monitor:** `bin/status.bat` $\to$ `scripts/status_services.py`.
* **Portable Cloudflare Binary:** `infrastructure/bin/cloudflared.exe` (Size: 55,397,592 bytes).

---

## 3. Visual & Experimental Artifact Status

| Visual Artifact Type | Current Location / State | Description | Action Required for Final Presentation |
| :--- | :--- | :--- | :--- |
| **Interactive Testing Studio Webpage** | `static/index.html` (136.9 KB) | Complete browser-based GUI for testing vitals and RAG. | Capture actual browser screenshots during live simulation. |
| **VibeVoice Architecture Diagram** | `models/VibeVoice-Realtime-0.5B/figures/Fig1.png` (123.5 KB) | Architectural visual of the offline TTS engine. | Reference directly in scientific paper. |
| **Model Evaluation Charts (ROC / PR)** | `[PLACEHOLDER: Not plotted to PNG]` | Raw numbers exist in `metrics.json`. | Generate high-res matplotlib plots of ROC and PR curves. |
| **Confusion Matrix Graphic** | `[PLACEHOLDER: Plotted heatmap required]` | Raw matrix values exist in `metrics.json` and Section 5.1. | Generate seaborn/matplotlib heatmap visual. |
| **End-to-End Demo Video** | `[PLACEHOLDER: Recording required]` | Live execution supported via `start.bat`. | Record 2-minute video demonstrating acute vital triage and tunnel response. |
