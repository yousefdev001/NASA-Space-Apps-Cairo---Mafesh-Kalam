---
description: "Implementation tasks for AuraMed Live Voice Conversation Interface"
---

# Tasks: AuraMed Live Voice Conversation Interface (002-live-voice-mode)

**Input**: Design documents from `/specs/002-live-voice-mode/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`)  
**Prerequisites**: Phase 01 Core Engine working, `.env` configured, Python 3.11 virtual environment  
**Organization**: Tasks are strictly ordered by user story priority (P1 $\rightarrow$ P2 $\rightarrow$ P3) to enable independent, test-driven implementation.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no conflicting dependencies)
- **[Story]**: Target user story (US1 through US6)

---

## Phase 1: Setup & Configuration Infrastructure

**Purpose**: Project setup and multi-project credentials management.

- [x] T001 Define `.env.example` schema for `GEMINI_VOICE_PROJECTS_JSON` and voice configuration variables in `shared/constants.py`
- [x] T002 [P] Install or verify Google GenAI SDK dependency (`google-genai>=2.25.0`) in `requirements.txt` / `pyproject.toml`
- [x] T003 [P] Create modular package structure for voice subsystem: `services/rag_service/gateway/voice/` and `shared/formatting/`

---

## Phase 2: Foundational Architecture (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can run.

- [x] T004 Implement `GeminiKeyManager` in `services/rag_service/gateway/gemini_key_manager.py` managing multi-project pools, masked credentials, cooldown timers, and rotation logic
- [x] T005 [P] Implement `SpokenMedicalFilter` in `shared/formatting/spoken_filter.py` providing deterministic non-generative cleanup of medical markdown while preserving 100% of dosages and instructions
- [x] T006 Implement `GeminiTokenMinter` in `services/rag_service/gateway/gemini_token_minter.py` minting short-lived (30-min) Ephemeral Tokens with constraints locked to `gemini-3.5-transcribe-live`
- [x] T007 Implement `GeminiTTSClient` in `services/rag_service/gateway/gemini_tts_client.py` executing speech synthesis with `gemini-3.8-flash-tts` / `gemini-3.8-flash-lite-tts`
- [x] T008 [P] Unit tests for `GeminiKeyManager` in `tests/unit/test_gemini_key_manager.py` verifying credential rotation and 429 cooldown
- [x] T009 [P] Unit tests for `SpokenMedicalFilter` in `tests/unit/test_spoken_filter.py` verifying exact numerical and dosage invariance

**Checkpoint**: Foundational Key Manager, Token Minter, and TTS Client functional and unit-tested.

---

## Phase 3: User Story 1 (P1) — Hands-Free Voice Streaming & Live Subtitles 🎯 MVP

**Goal**: Crew member starts a voice session, speaks continuously without push-to-talk, sees real-time interim subtitles, and receives spoken clinical guidance.

- [x] T010 [P] [US1] Implement Voice REST Router in `services/rag_service/routers/voice.py` (`POST /api/v1/voice/session/start` and `POST /api/v1/voice/session/token`)
- [x] T011 [US1] Mount Voice Router on Client Gateway (`services/orchestrator/main.py`) and RAG Service (`services/rag_service/main.py`)
- [x] T012 [P] [US1] Create frontend voice engine in `static/js/voice_session.js` implementing Web Audio API 16kHz PCM capture and WebSocket streaming to `gemini-3.5-transcribe-live`
- [x] T013 [US1] Implement interim and finalized transcript event handling in `static/js/voice_session.js`
- [x] T014 [US1] Connect finalized transcript dispatch to existing `POST /v1/chat` in `static/js/voice_session.js`
- [x] T015 [US1] Implement TTS synthesis endpoint `POST /api/v1/voice/tts` and Web Audio 24kHz WAV playback
- [x] T016 [US1] Add "Start Voice" and "End Voice" controls, live subtitle container, and status badges to `static/index.html` and `services/rag_service/routers/chat.py`
- [x] T017 [US1] Contract test for voice session start and token generation in `tests/contract/test_voice_contracts.py`

**Checkpoint**: US1 MVP fully functional — continuous voice stream transcribed live, sent to existing chat copilot, and spoken back.

---

## Phase 4: User Story 2 (P1) — Natural Barge-in & Spoken Interruption

**Goal**: Crew member speaks while assistant is talking; audio immediately halts, buffers flush, and new speech is transcribed.

- [x] T018 [US2] Implement instantaneous audio cutoff in `static/js/voice_session.js` via `AudioBufferSourceNode.stop()` ($<50\text{ ms}$)
- [x] T019 [US2] Implement playback queue flushing and pending TTS request cancellation (`AbortController`) on user speech detection
- [x] T020 [US2] Update `VoiceSession` state machine to handle `INTERRUPTED` state and mark previous conversational turn as interrupted
- [x] T021 [US2] Unit and integration test for barge-in event sequence and audio queue cancellation in `tests/unit/test_voice_barge_in.py`

**Checkpoint**: US2 complete — assistant can be naturally interrupted mid-speech without losing conversational consistency.

---

## Phase 5: User Story 3 (P1) — Medical Grounding & Exact Citation Invariance

**Goal**: Guarantee 100% fidelity to NASA Tier 1 operational checklists; zero invented dosages or lost `source_chunk_id` citations.

- [x] T022 [US3] Verify that `POST /v1/chat` response JSON is preserved untouched in conversation history and database persistence
- [x] T023 [US3] Implement safety check verifying that `SpokenMedicalFilter` outputs match all dosage regex patterns present in the raw medical response
- [x] T024 [US3] Implement acoustic uncertainty gate: flag transcription confidence $<0.75$ and prompt crew for voice confirmation before submitting critical queries
- [x] T025 [US3] Automated regression test verifying zero dosage drift between medical JSON and spoken script in `tests/unit/test_medical_voice_invariance.py`

**Checkpoint**: US3 complete — medical safety invariants mathematically verified and tested.

---

## Phase 6: User Story 4 (P2) — Multi-Project API Key Pool & Automatic Failover

**Goal**: Automatic, zero-delay failover when Google Cloud Projects hit rate limits (429) or credentials fail.

- [x] T026 [US4] Implement project-level rate limit detection (`429 RESOURCE_EXHAUSTED`) with exponential cooldown and jitter in `GeminiKeyManager`
- [x] T027 [US4] Implement key-level revocation for `401 UNAUTHENTICATED` and `403 PERMISSION_DENIED` errors
- [x] T028 [US4] Implement operational telemetry endpoint `GET /api/v1/voice/keypool/status` reporting project quotas and key states
- [x] T029 [US4] Add Key Pool status pill and failover indicator to `static/index.html` header
- [x] T030 [US4] Integration test for multi-project failover simulation under simulated 429 bursts in `tests/integration/test_keypool_failover.py`

**Checkpoint**: US4 complete — resilient multi-project key management operational with automatic failover.

---

## Phase 7: User Story 5 (P2) — Bilingual Arabic/English Code-Switching & Custom Vocabulary

**Goal**: Natural bilingual recognition and pronunciation of mixed Arabic-English spaceflight medical speech.

- [x] T031 [US5] Inject NASA medical acronym custom vocabulary (`["SpO2", "SOMS", "CHECS", "CMRS", "tachycardia", "hypoxia"]`) into `gemini-3.5-transcribe-live` setup
- [x] T032 [US5] Configure automatic language detection (`language_codes: []`) and verify code-switching transcript accuracy
- [x] T033 [US5] Add bidirectional RTL/LTR CSS classes in `static/index.html` dynamically matching detected language
- [x] T034 [US5] Test bilingual Arabic-English transcription and Modern Standard Arabic TTS in `tests/integration/test_bilingual_voice.py`

**Checkpoint**: US5 complete — mixed Arabic-English speech transcribed and synthesized fluently.

---

## Phase 8: User Story 6 (P3) — Offline Detection & Graceful Chat Fallback

**Goal**: Automatic offline detection preventing voice errors and cleanly directing crew to local offline Chat mode.

- [x] T035 [US6] Add browser online/offline event listeners in `static/js/voice_session.js`
- [x] T036 [US6] Implement graceful degradation banner: if offline, disable voice button and display "Voice Mode unavailable (Offline) — Using Local Copilot"
- [x] T037 [US6] Verify that local Ollama (`medgemma:latest`) text chat remains 100% operational when voice mode is offline
- [x] T038 [US6] Test offline failover and disconnection handling in `tests/integration/test_voice_offline_behavior.py`

**Checkpoint**: US6 complete — system cleanly transitions between online Voice Mode and offline local Chat Mode.

---

## Phase 9: End-to-End Verification & Polish

- [x] T039 Implement animated audio waveform visualizer using Web Audio API `AnalyserNode` on HTML5 `<canvas>` in `static/index.html`
- [x] T040 End-to-end integration test covering Golden Scenario (Hypoxia SpO2 85% voice inquiry $\rightarrow$ NASA Tier 1 retrieval $\rightarrow$ TTS playback $\rightarrow$ barge-in interruption)
- [x] T041 Security audit verifying zero exposed API keys in browser network tab, HTML source, and server logs
- [x] T042 Update operational documentation in `README.md` and `docs/designs/system_architecture.md`
