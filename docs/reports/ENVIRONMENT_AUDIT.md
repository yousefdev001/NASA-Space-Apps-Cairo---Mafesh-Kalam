# Healthcare AI — Environment Audit Report
**Context:** NASA Space Apps Challenge 2026  
**Auditor:** Senior DevOps & AI Infrastructure Architect  
**Date:** 2026-11-13  
**Status:** Completed & 100% Verified  

---

## 1. Operating System & Host Environment
- **Operating System:** Windows 11 Pro 64-bit (Build 10.0.26300).
- **PowerShell Version:** 5.1 / PowerShell Core available (`powershell.exe`).
- **System Architecture:** x86_64 (AMD64).
- **WSL Availability:** WSL2 installed (`docker-desktop` distro present, currently stopped).

---

## 2. Hardware Resources
- **Processor (CPU):** Intel(R) Core(TM) i7-10850H CPU @ 2.70GHz (6 physical cores, 12 logical vCPUs).
- **Physical Memory (RAM):** 32.0 GB installed.
- **Dedicated Graphics (GPU):** NVIDIA Quadro RTX 3000 Max-Q (6144 MiB / 6 GB VRAM).
- **Driver Version:** 596.36.
- **CUDA Version:** 13.2 runtime supported by driver.
- **Storage / SSD Constraints:**
  - Host workspace located on volume `E:` (`E:\Projects\AuraMed`).
- **Hardware Compatibility Assessment:**
  - **Local LLM Execution:** 6 GB VRAM can accommodate Q4 quantized models up to 8B (e.g., DeepSeek-R1:8B requires ~4.87 GB VRAM).
  - **MedGemma Execution:** `medgemma:latest` (3.9B parameters, BF16, 8.03 GB) successfully allocates across GPU VRAM and 32 GB system RAM, executing inference in 2.41s.
  - Multi-model concurrent execution in VRAM is strictly prohibited.

---

## 3. Development Tools & Runtimes
| Tool | Detected Version | Status / Location |
| :--- | :--- | :--- |
| **Git** | `2.52.0.windows.1` | Git repository initialized in workspace |
| **Python Toolchain (uv)** | `0.12.6` | Fast package management & virtual environments |
| **Python Runtime** | CPython `3.11.16` | Isolated `.venv` prepared at `E:\Projects\AuraMed\.venv` |
| **Docker Engine** | `29.4.0` | Desktop engine installed; service `com.docker.service` stopped |
| **Docker Compose** | `v5.1.1` | Installed and available via CLI |
| **MySQL Server** | `9.4.0` | Local Windows service `MySQL94` actively running on port 3306 |
| **Ollama** | `0.40.16` | Native local AI runtime actively running on `127.0.0.1:11434` |
| **GitHub Spec Kit** | `1.4.1.dev0` | Installed in user PATH (`specify`) |
| **Elephant-Goldfish (EGM)** | `0.1.1` | Installed globally in `~/.gemini/config/plugins/egm` |

---

## 4. Databases & Storage Infrastructure
- **Native MySQL Server 9.4:**
  - Service Name: `MySQL94` (Status: `Running`).
  - Listening Port: `127.0.0.1:3306` (verified via socket connection & PyMySQL handshake).
  - Native Windows installation takes precedence over running a duplicate Docker container to preserve system resources.
- **ChromaDB Vector Store:**
  - Selected Vector DB for initial Phase 01.
  - In-process persistent mode (`chromadb.PersistentClient`) storing vectors under `./data/chroma_db`.
  - Offline vector insertion, persistence across restart, and metadata tier filtering verified via `infrastructure/scripts/test_chroma_persistence.py`.
  - Docker Compose definition provided in `infrastructure/docker-compose.yml`.

---

## 5. Ollama Models & Verification Summary
- **Verified Local Models:**
  - `medgemma:latest` (3.9B params, BF16, 8.03 GB) — Candidate medical local fallback. Smoke test passed (2.41s).
  - `deepseek-r1:8b` (8.2B params, Q4_K_M, 4.87 GB) — Candidate general reasoning fallback.
  - `qwen3.5:4b` (4B params, Q4_K_M, 3.10 GB) — Helper model.
- **Smoke Inference Result:** Successfully generated output (`SYSTEM READY`) from `medgemma:latest` via `http://127.0.0.1:11434/api/generate`.

---

## 6. Offline Readiness Assessment
- **Components 100% Offline Capable:**
  - Local Python 3.11 environment with all 103 foundational packages installed.
  - Native MySQL 9.4 running on localhost:3306.
  - Persistent ChromaDB vector database operating with synthetic/offline embeddings.
  - Native Ollama inference engine serving `medgemma:latest` and `deepseek-r1:8b` on localhost:11434 without internet.
- **Components Requiring External / Cloud Decision:**
  - Cloud LLM primary API (provider undecided, intentionally postponed to Phase 03/04).
  - Main Backend (technology undecided, external integration).
- **Offline Blockers Remaining for Future Phases:**
  - None for Phase 01 infrastructure. In Phase 02/03, local embedding model weights (e.g., BGE-small) must be cached locally to ensure embedding generation is also 100% offline.
