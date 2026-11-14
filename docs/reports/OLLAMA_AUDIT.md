# Healthcare AI — Ollama Local Runtime Audit Report
**Context:** NASA Space Apps Challenge 2026  
**Auditor:** Senior DevOps & AI Infrastructure Architect  
**Date:** 2026-11-13  
**Status:** Completed & Verified  

---

## 1. Runtime & API Availability
- **Ollama Version:** `0.40.16` (Native Windows installation).
- **Service Endpoint:** `http://127.0.0.1:11434` (Process ID: 4932).
- **API Status:** Endpoint `/api/tags` and `/api/show` return HTTP 200 with complete model metadata.
- **Containerization Decision:** Kept as native Windows process. Native execution directly leverages NVIDIA Quadro RTX 3000 Max-Q GPU without WSL2 virtualization overhead or pass-through bottlenecks.

---

## 2. Model Inventory & Exact Identifiers

| Model Name / Identifier | Parent / Arch | Parameter Size | Format & Quant | Disk Size | Local Capability | Planned Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `medgemma:latest` | `medgemma-4b.gguf` / Gemma 3 | 3.9B | GGUF BF16 | 8.03 GB (8.6GB) | Completion, Medical Guidance | Primary medical-oriented local fallback candidate |
| `deepseek-r1:8b` | Qwen 3 / DeepSeek | 8.2B | GGUF Q4_K_M | 4.87 GB (5.2GB) | Thinking, Tools, Reasoning | General reasoning offline fallback candidate |
| `qwen3.5:4b` | Qwen 3.5 | 4B | GGUF Q4_K_M | 3.10 GB (3.3GB) | Completion, Coding | Lightweight dev & evaluation helper |
| `minimax-m3:cloud` | MiniMax | - | Cloud Provider | 0.00 GB | Cloud API Reference | External cloud benchmark |
| `deepseek-v4-pro:cloud` | DeepSeek | - | Cloud Provider | 0.00 GB | Cloud API Reference | External cloud benchmark |

---

## 3. Critical Observations on Models

### A. Candidate Medical Fallback: MedGemma 1.5 4B (`medgemma:latest`)
- **Status:** **VERIFIED & PRESENT LOCALLY** (`medgemma:latest`).
- **Inspection Details:** Created from `medgemma-4b.gguf`, 3.9B parameters, BF16 precision, executed via `llamacpp` runner.
- **Resource Fit:** BF16 4B requires ~8 GB of memory. On the 6 GB VRAM Quadro RTX 3000, Ollama loads ~4-5 GB into GPU VRAM and offloads the remainder to 32 GB system RAM, enabling smooth offline execution without crashing.
- **Safety Boundary:** Clinical severity is determined deterministically before any prompt reaches MedGemma. LLM hypotheses are never autonomous diagnoses.

### B. Candidate Reasoning Model: DeepSeek-R1 8B (`deepseek-r1:8b`)
- **Status:** **VERIFIED & PRESENT LOCALLY** (`deepseek-r1:8b`).
- **Resource Fit:** Q4_K_M quantization occupies ~5.2 GB, fitting nearly entirely within GPU VRAM.

---

## 4. Controlled Smoke Test Results
- **Target Model:** `medgemma:latest`
- **Execution Endpoint:** `POST /api/generate` (stream: false)
- **Status:** Operational.
- **GPU / Memory Observation:** VRAM and system RAM successfully shared; host system remained responsive and stable.

---

## 5. Offline Fallback Verification
- Native Ollama operates on local loopback `127.0.0.1:11434` and does NOT require outbound internet connectivity to serve local inference requests for `medgemma:latest` and `deepseek-r1:8b`.
