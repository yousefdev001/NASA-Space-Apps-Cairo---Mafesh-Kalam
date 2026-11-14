# Implementation Plan: AuraMed Live Voice Conversation Mode
# SpecKit 002-live-voice-mode

**Branch**: `002-live-voice-mode` | **Date**: 2026-11-14 | **Spec**: [specs/002-live-voice-mode/spec.md](file:///e:/Projects/AuraMed/specs/002-live-voice-mode/spec.md)

---

## 1. Summary

Add an interactive, hands-free Live Voice Conversation Interface to AuraMed using Google Gemini APIs (`gemini-3.5-transcribe-live` for low-latency STT streaming and `gemini-3.8-flash-tts` for clinical speech synthesis).
The Voice Interface functions strictly as a non-reasoning I/O layer around the existing AuraMed Clinical Copilot, reusing `POST /v1/chat`, `assess_vitals`, the NASA Tier 1 Hybrid Retriever, and the 6-stage Safety Guardrail Validator.

---

## 2. Technical Context

- **Language & Runtime**: Python 3.11.x, Windows 11 Pro host.
- **Backend Framework**: FastAPI 0.115+, Uvicorn 0.32+, Pydantic v2.10+, HTTPX 0.28+, WebSockets.
- **Frontend Runtimes**: Vanilla JavaScript (ES2022), Web Audio API (`AudioContext`, `AudioWorklet` / `ScriptProcessor`, `AnalyserNode`), HTML5 Canvas for real-time waveform visualization, Tailwind CSS.
- **AI Runtimes & Models**:
  - Live STT: Google Gemini Live API (`gemini-3.5-transcribe-live`) via WebSockets.
  - Speech Synthesis: Google Gemini Speech Generation (`gemini-3.8-flash-tts`) via REST Interactions API.
  - Medical Reasoning: Existing AuraMed Copilot (`services/rag_service/routers/chat.py`).
  - Local Fallback: Native Ollama (`medgemma:latest`, `deepseek-r1:8b`).
- **Hardware Architecture**:
  - Intel Core i7-10850H (12 vCPUs), 32GB RAM, NVIDIA Quadro RTX 3000 Max-Q (6GB VRAM).
  - VRAM is 100% reserved for Ollama local inference. Audio capture, streaming, and TTS conversion execute purely on CPU and network I/O.
- **Constraints**:
  - Latency: STT interim updates $<200\text{ ms}$; barge-in cutoff $<50\text{ ms}$; TTS start $<1.8\text{ s}$.
  - Safety: Invariance of medical severity, zero alteration of dosages/medications, exact `source_chunk_id` preservation.
  - Quota: Project-level quota tracking with automatic failover across configured Google Cloud projects.

---

## 3. Constitution Check (AuraMed Governance)

| Principle | Constitution Requirement | Plan Compliance Verification |
|:---|:---|:---|
| **I. Decision Support, Not Autonomous** | The system is exclusively clinical decision-support for astronauts and flight surgeons. | Voice Mode provides voice interaction for the existing decision-support copilot. It never prescribes or initiates treatment autonomously. |
| **II. Strict Evidence-Tier Partitioning** | Only approved Tier 1 checklists generate procedural actions; citations required. | Voice Mode delivers transcripts directly to `POST /v1/chat`. The validated response citations (`source_chunk_id`) are preserved intact. |
| **III. Deterministic Severity Invariance** | Severity is governed strictly by deterministic rules. LLMs can never downgrade severity. | Severity calculation remains exclusively inside `shared/rules/severity_engine.py`. Voice Mode has zero ability to calculate or modify severity. |
| **IV. Online-First / 100% Offline-Fallback** | Online primary; seamless failover to local Ollama on network loss. | Voice Mode is an online-only layer; if offline, system immediately alerts user and seamlessly falls back to local text Chat mode. |
| **V. Fail-Safe Extractive Fallback** | Any LLM failure immediately yields raw NASA checklist steps. | If chat or TTS fails, raw Tier 1 checklist steps are returned via Extractive Fallback. |
| **VI. Decoupled Microservices** | Independent microservices, contract-tested endpoints. | Voice router runs as a clean modular router mounted on the Client Gateway (Port 8000) and RAG microservice. |

---

## 4. Architectural Proposal & Component Structure

```text
       ┌────────────────────────────────────────────────────────┐
       │                Browser / Client (UI)                   │
       │  - Web Audio API (Mic 16kHz PCM + Audio Playback)      │
       │  - Audio Waveform Canvas & Live Subtitle Renderer      │
       │  - Instant Barge-in Interruption Detector              │
       └──────────────┬───────────────────────────▲─────────────┘
                      │ 1. Start Session          │ 5. TTS Audio (WAV)
                      │ (POST /voice/start)       │ (POST /voice/tts)
                      ▼                           │
       ┌──────────────────────────────┐           │
       │  AuraMed Client Gateway      │           │
       │  (Port 8000 / 8002)          │           │
       │  ┌────────────────────────┐  │           │
       │  │ Gemini Key Manager     │  │           │
       │  │ - Project Quota Buckets│  │           │
       │  │ - Key Rotation & Health│  │           │
       │  │ - Cooldown & Failover  │  │           │
       │  └───────────┬────────────┘  │           │
       │              ▼               │           │
       │  ┌────────────────────────┐  │           │
       │  │ Ephemeral Token Minter │  │           │
       │  └───────────┬────────────┘  │           │
       └──────────────┼───────────────┘           │
                      │ 2. Return Ephemeral Token │
                      ▼                           │
       ┌──────────────────────────────────────────┴─────────────┐
       │  Browser Direct WebSocket Stream                       │
       │  wss://generativelanguage.googleapis.com/...            │
       │  (gemini-3.5-transcribe-live)                          │
       └──────────────┬─────────────────────────────────────────┘
                      │ 3. Interim & Finalized Transcripts
                      ▼
       ┌────────────────────────────────────────────────────────┐
       │  Existing AuraMed Chat API (POST /v1/chat)             │
       │  - ML Anomaly Runner & Severity Engine Invariance      │
       │  - NASA Tier 1 Hybrid Retriever (3,085 chunks)         │
       │  - 6-Stage Clinical Guardrail Validator                │
       └──────────────┬─────────────────────────────────────────┘
                      │ 4. Validated Medical Response JSON
                      ▼
       ┌────────────────────────────────────────────────────────┐
       │  Spoken Representation Formatter                       │
       │  - Strip markdown, retain 100% of medical facts        │
       │  - Synthesize via Gemini 3.8 Flash TTS                 │
       └────────────────────────────────────────────────────────┘
```

---

## 5. Source Code Layout (New & Reused Components)

```text
services/
├── orchestrator/
│   ├── main.py                          # Mounts voice_router
│   └── router.py                        # Client gateway endpoints
├── rag_service/
│   ├── main.py                          # Microservice endpoints
│   ├── routers/
│   │   ├── chat.py                      # REUSED: POST /v1/chat & GET /chat
│   │   └── voice.py                     # NEW: POST /session/start, /tts, /keypool/status
│   └── gateway/
│       ├── gemini_key_manager.py        # NEW: Multi-project quota pool & failover
│       ├── gemini_tts_client.py         # NEW: gemini-3.8-flash-tts client
│       └── gemini_token_minter.py       # NEW: Ephemeral token creator
shared/
├── formatting/
│   └── spoken_filter.py                 # NEW: Deterministic spoken text formatter
├── contracts/
│   └── voice_contract.py                # NEW: Pydantic request/response schemas
static/
├── index.html                           # UPDATED: Voice Mode UI, Web Audio API, Canvas
└── js/
    └── voice_session.js                 # NEW: Voice session state machine & audio recorder
tests/
├── unit/
│   ├── test_gemini_key_manager.py       # NEW: Quota rotation, cooldown, 429 failover
│   ├── test_spoken_filter.py            # NEW: Markdown stripping & dosage preservation
│   └── test_voice_router.py             # NEW: Voice endpoints & ephemeral tokens
└── integration/
    └── test_voice_chat_integration.py   # NEW: End-to-end voice transcript to chat pipeline
```

---

## 6. Implementation Strategy (Phased Delivery)

- **Phase 1: Key Manager & Ephemeral Token Minter**
  - Implement `GeminiKeyManager` supporting multiple Google Cloud Projects and keys.
  - Implement project-level 429 quota backoff with jitter and 401/403 key revocation.
  - Implement `GeminiTokenMinter` issuing scoped tokens for `gemini-3.5-transcribe-live`.
- **Phase 2: Voice REST Endpoints & Contracts**
  - Implement `POST /api/v1/voice/session/start` and `/api/v1/voice/session/token`.
  - Implement `POST /api/v1/voice/tts` calling `gemini-3.8-flash-tts`.
  - Implement `GET /api/v1/voice/keypool/status` telemetry probe.
- **Phase 3: Spoken Representation Formatter**
  - Implement deterministic cleaner for clinical markdown.
  - Test exact number, medication dosage, and procedural action preservation.
- **Phase 4: Client Audio Engine & State Machine**
  - Implement `VoiceSessionManager` in frontend JavaScript.
  - Implement 16kHz PCM capture via Web Audio API.
  - Connect WebSocket directly to Google Gemini Live API with ephemeral token.
  - Implement instant barge-in interruption listener.
- **Phase 5: UI & Waveform Integration**
  - Add Voice Mode modal/dock to `index.html` and `GET /chat`.
  - Add real-time animated waveform canvas and subtitle preview.
  - Support Arabic RTL / English LTR automatic text direction.
- **Phase 6: Verification & Testing**
  - Run unit, contract, and integration tests.
  - Test bilingual Arabic/English scenarios and simulated network blackouts.
