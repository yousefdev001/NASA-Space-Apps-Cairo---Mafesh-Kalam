# Healthcare AI System — AuraMed
> **NASA Space Apps Challenge 2026**  
> Medical Decision-Support Platform with Evidence-Grounded Guidance & Online-First / Offline-Fallback Architecture.

---

## Overview
AuraMed is a medical decision-support platform designed for extreme and remote environments (such as space missions). It processes astronaut physiological telemetry, detects anomalies using an independent ML microservice, retrieves authorized operational procedures from NASA standards via a deterministic RAG microservice, and generates evidence-grounded guidance with strict safety bounds.

## Key Principles & Guardrails
- **Decision Support Only:** This is not an autonomous medical diagnosis system.
- **Evidence-Based:** Every action step must reference an authorized NASA Tier 1 document chunk.
- **Deterministic Severity Rules:** Rule-based checks calculate severity and may only escalate severity, never downgrade it. LLMs cannot override severity.
- **Online-First / Offline-Fallback:**
  - **Online Mode:** Cloud LLM API is the primary generation provider.
  - **Offline Mode:** Automatically switches to local Ollama (`DeepSeek-R1:8B` / `MedGemma:4B`) without human intervention when internet or cloud APIs are unavailable. Local embeddings, databases (MySQL, ChromaDB), and cached documents remain 100% operational offline.
- **Independent Microservices:** Independent FastAPI services for ML and RAG.

## Project Structure
- `services/ml_service`: FastAPI microservice for physiological anomaly detection.
- `services/rag_service`: FastAPI microservice for protocol retrieval and guidance generation.
- `shared/`: Shared data contracts, Pydantic schemas, and rule checks.
- `docker/`: Docker Compose configurations for MySQL and ChromaDB.
- `scripts/`: Environment verification and health check automation.
- `docs/`: Technical specifications, EGM designs, and audit reports.
- `tests/`: Automated unit, integration, and smoke test suites.

## Current Status
- **Current Status:** All Core Engine Phases (Phase 01 through Phase 06) and **Live Voice Mode (SpecKit 002)** **100% Completed & Verified**.
- **Automated Tests:** 73+ tests passing across core engine and voice mode (`uv run pytest tests/ -v`).
- **Live Voice Mode (Gemini Audio):** Real-time hands-free speech interface with `gemini-3.5-transcribe-live` (WebSocket STT) and `gemini-3.8-flash-tts` (Clinical speech synthesis), featuring multi-project key pool failover, instant barge-in interruption (<50ms), and configurable silence debounce timer (1.5s - 2.0s).
- **System Design & Architecture:** See [docs/SYSTEM_DESIGN_AND_ARCHITECTURE.md](file:///e:/Projects/AuraMed/docs/SYSTEM_DESIGN_AND_ARCHITECTURE.md).
- **Benchmark Report:** See [docs/reports/EVALUATION_REPORT.md](file:///e:/Projects/AuraMed/docs/reports/EVALUATION_REPORT.md).
- **API Integration Guide:** See [docs/API_INTEGRATION_GUIDE.md](file:///e:/Projects/AuraMed/docs/API_INTEGRATION_GUIDE.md).
- **Voice Mode Specification:** See [specs/002-live-voice-mode/spec.md](file:///e:/Projects/AuraMed/specs/002-live-voice-mode/spec.md).

## Quick Start (Run All Microservices)

To launch all three microservices concurrently:
```powershell
.\.venv\Scripts\python.exe scripts/start_all_services.py
```

- **Client Gateway (Web & Mobile API):** `http://localhost:8000` (Swagger: `/docs`)
- **ML Anomaly Microservice:** `http://localhost:8001` (Swagger: `/docs`)
- **RAG Decision Support Microservice:** `http://localhost:8002` (Swagger: `/docs`)
