# Phase 01: Environment Audit & Setup Report
**Project:** Healthcare AI System — AuraMed  
**Context:** NASA Space Apps Challenge 2026  
**Date:** 2026-11-13  
**Status:** In Progress / Verifying

---

## 1. Hardware & System Audit
- **Operating System:** Windows 11 Pro (OS Version: 10.0.26300, AMD64).
- **Processor (CPU):** Intel(R) Core(TM) i7-10850H CPU @ 2.70GHz (12 vCPUs).
- **System Memory (RAM):** 32 GB.
- **Graphics Card (GPU):** NVIDIA Quadro RTX 3000 Max-Q (6 GB VRAM).
- **NVIDIA Driver Version:** 596.36.
- **CUDA Version Supported:** 13.2.
- **Hardware Compatibility Assessment:**
  - The 6 GB VRAM is sufficient for quantized 4B-8B local LLMs (e.g., DeepSeek-R1:8B Q4, MedGemma 4B) and local embedding models (e.g., BGE-small, BGE-base).
  - 14B models (e.g., Qwen2.5-Coder:14B) take ~9 GB and offload partially to the 32 GB system RAM, causing slower tokens/second; suitable for coding/dev assistance, but 4B-8B models are primary for real-time offline inference.
  - Concurrent loading of multiple LLMs must be strictly prevented.

---

## 2. Installed Software & Tooling Audit
| Software / Tool | Detected Version | Status / Location |
| :--- | :--- | :--- |
| **Git** | `2.52.0.windows.1` | Initialized repository, `.gitignore` active |
| **Python Toolchain (uv)** | `0.12.6` | `uv` installed, managing virtual environments |
| **CPython (Virtual Env)** | `3.11.16` | `.venv` created at `E:\Projects\AuraMed\.venv` |
| **Docker Engine / CLI** | `29.4.0` | Client installed, `com.docker.service` present |
| **Docker Compose** | `v5.1.1` | CLI installed |
| **Ollama** | `0.40.16` | Running locally as service on `http://127.0.0.1:11434` |
| **MySQL Server** | `9.4.0` | Local Windows service `MySQL94` running on port 3306 |
| **GitHub Spec Kit** | `1.4.1.dev0` | Installed in PATH (`specify`) |
| **Elephant-Goldfish (EGM)** | `0.1.1` | Installed globally (`~/.gemini/config/plugins/egm`) |

---

## 3. Ollama Model Inventory & Local Readiness
Query to `http://localhost:11434/api/tags` returned:

| Model Tag | Family | Size | Quant | Local Role / Target |
| :--- | :--- | :--- | :--- | :--- |
| `deepseek-r1:8b` | Qwen3/DeepSeek | 5.22 GB | Q4_K_M | General reasoning candidate for offline fallback |
| `qwen2.5-coder:14b` | Qwen2 | 8.99 GB | Q4_K_M | Development and code generation assistant |
| `minimax-m3:cloud` | MiniMax | - | Cloud | Cloud provider reference |
| `deepseek-v4-pro:cloud` | DeepSeek | - | Cloud | Cloud provider reference |

> [!IMPORTANT]
> **Observation on MedGemma:**  
> The specification in `AGENTS.md` identifies **MedGemma 1.5 4B** as the primary candidate for medical-oriented local fallback.  
> It was not found in the existing `ollama list`.  
> Per Section 4 & 14 ("Do not download models unnecessarily"), MedGemma was **NOT** pulled automatically. Pulling or importing MedGemma will be requested as a pending decision for user approval.

---

## 4. Database Infrastructure Status
1. **MySQL Structured Store:**
   - Native Windows service `MySQL94` is active and listening on `127.0.0.1:3306`.
   - `docker/docker-compose.yml` provides an alternative isolated MySQL container (`auramed_mysql`) for containerized workflows.
2. **ChromaDB Vector Store:**
   - Both in-process persistent mode (`CHROMA_MODE=embedded` at `./chroma_data`) and server mode via `docker-compose` (`chromadb/chroma:0.5.20` on port 8000) are configured in `.env.example`.

---

## 5. Repository Structure
```text
E:\Projects\AuraMed\
├── .git/                      # Git version control
├── .gitignore                 # Strict secrets and data exclusion
├── .env.example               # Complete environment variable template
├── pyproject.toml             # Pinned project dependencies
├── AGENTS.md                  # Project identity, constraints & phase definitions
├── README.md                  # Project overview & quickstart
├── docker/
│   └── docker-compose.yml     # MySQL & ChromaDB container definitions
├── services/
│   ├── ml_service/            # ML microservice skeleton (Phase 04)
│   └── rag_service/           # RAG microservice skeleton (Phase 04)
├── shared/                    # Shared contracts and rule checks
├── scripts/
│   └── verify_environment.py  # End-to-end environment smoke tests
├── tests/
│   └── test_environment_smoke.py # Pytest automated test suite
├── docs/
│   ├── designs/               # Architectural designs & RFC briefs
│   └── phase01_environment_audit.md # This report
└── data/                      # NASA source documentation and datasets
```
