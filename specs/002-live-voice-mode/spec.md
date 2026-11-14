# Feature Specification: AuraMed Live Voice Conversation Interface

**Feature Branch**: `002-live-voice-mode`  
**Created**: 2026-11-14  
**Status**: Ready for Planning & Review  
**Reference Architecture**: `docs/designs/system_architecture.md`, `specs/001-core-engine/spec.md`  
**Input**: Master Prompt — AuraMed Voice Mode | SpecKit Specification Phase

---

## 1. Executive Summary & Architectural Scope

The Live Voice Conversation Interface adds an interactive, hands-free voice layer to AuraMed, enabling flight surgeons and astronaut crew members to converse naturally with the system during simulated or operational spaceflight emergencies.

### Non-Negotiable Medical Isolation Principle
The Voice Interface functions **exclusively as an Input/Output (I/O) transport layer**. It:
1. Captures microphone speech and streams it to Google Gemini Live Transcribe (`gemini-3.5-transcribe-live`).
2. Delivers the finalized transcript directly to the existing AuraMed Clinical Copilot Chat API (`POST /v1/chat`).
3. Reuses the existing Medical Agent (`assess_vitals` + ML model runner), NASA Tier 1 Hybrid Retriever (3,085 chunks), and 6-stage Safety Guardrail Validator.
4. Receives the validated medical response and synthesizes audio speech using Google Gemini Speech Generation (`gemini-3.8-flash-tts`).
5. Plays the synthesized audio to the crew with instantaneous barge-in interruption support.

**The Voice Layer is strictly forbidden from reasoning, diagnosing, summarizing, inventing, or altering medical instructions.**

---

## 2. User Scenarios & Prioritized User Stories

### User Story 1 — Hands-Free Continuous Voice Conversation (Priority: P1)
As an astronaut crew member conducting an emergency procedure inside an airlock or module with gloved hands, I want to initiate a live voice session once and talk continuously with AuraMed without needing to click a push-to-talk button for every sentence, so that I can maintain sterile, hands-free physical execution of medical tasks while receiving real-time clinical guidance.

**Why this priority**: Hands-free voice operation is vital in spaceflight environments where crew members are physically engaged in chest compressions, airway management, or restraint fastening.

**Independent Test**: Start a voice session from the UI, speak a medical observation into the microphone (e.g., "Astronaut cyanotic, SpO2 down to 84%, heart rate 125"), verify live interim subtitles appear on screen within $<200 \text{ ms}$, followed by the finalized transcript, and verify synthesized spoken guidance begins playing automatically.

**Acceptance Scenarios**:
1. **Given** microphone permission is granted and internet connectivity is active, **When** the user clicks "Start Voice", **Then** the interface initializes a live audio stream, updates connection status to `LISTENING`, and displays an active audio waveform indicator.
2. **Given** the user speaks continuously, **When** speech pauses are detected, **Then** the system commits the finalized transcript, renders it in the conversation thread, and submits it to the existing `POST /v1/chat` endpoint.
3. **Given** the existing chat pipeline returns a validated clinical response, **When** the response is received, **Then** AuraMed generates audio via Gemini TTS and plays it through the speakers while transitioning status to `SPEAKING`.

---

### User Story 2 — Natural Barge-in and Spoken Interruption (Priority: P1)
As a Crew Medical Officer, I want to interrupt AuraMed immediately while it is speaking simply by talking over it, so that I can provide new critical telemetry updates or redirect the procedure without waiting for the assistant to finish a lengthy spoken paragraph.

**Why this priority**: Medical emergencies change dynamically within seconds; an un-interruptible voice assistant is unacceptable and hazardous during clinical crisis intervention.

**Independent Test**: Trigger an assistant spoken response; while audio is actively playing, speak "Wait, patient has lost consciousness!"; verify audio playback stops immediately ($<50 \text{ ms}$), the pending audio queue is flushed, state transitions to `INTERRUPTED`, and the new utterance is transcribed and processed.

**Acceptance Scenarios**:
1. **Given** AuraMed is actively in state `SPEAKING`, **When** user voice activity is detected by the client microphone, **Then** playback ceases immediately, queued audio chunks are discarded, and any pending TTS synthesis requests are aborted.
2. **Given** an interruption occurs, **When** the previous turn is recorded in conversation history, **Then** it is marked as `interrupted: true` so conversational context accurately reflects what was actually delivered to the crew.
3. **Given** the user completes their interrupting utterance, **When** transcription finalizes, **Then** the new message is submitted to `POST /v1/chat` with updated history and answered without latency penalty.

---

### User Story 3 — Medical Safety & Exact Citation Invariance (Priority: P1)
As a NASA Flight Surgeon, I want complete assurance that the Voice Interface never modifies, hallucinates, or strips medical dosages, procedural actions, or `source_chunk_id` citations from the underlying validated response, so that procedural fidelity to NASA Tier 1 checklists is 100% preserved.

**Why this priority**: Patient safety is non-negotiable. Hallucinated dosages or dropped precautions in microgravity can be fatal.

**Independent Test**: Compare the exact JSON response from `POST /v1/chat` with the audio transcript spoken by Gemini TTS. Verify that every medication name, dosage value, unit (e.g. mg, mcg, mL), and procedural step in the spoken script matches the underlying NASA checklist chunk verbatim.

**Acceptance Scenarios**:
1. **Given** a validated medical response containing action steps citing NASA Tier 1 chunks (e.g. `JSC-48031-REV-K-0042`), **When** the response is rendered in the UI, **Then** all `source_chunk_id` badges and citations remain fully visible.
2. **Given** the spoken representation formatter runs, **When** formatting text for TTS, **Then** markdown artifacts (like `###`, tables, and bracketed IDs) are stripped from the spoken stream, but all numbers, medical entities, and step instructions are preserved without altering a single character of clinical content.
3. **Given** the transcription model outputs ambiguous medical text (e.g. low acoustic confidence), **When** confidence falls below safety thresholds, **Then** AuraMed requests verbal confirmation before proceeding with irreversible clinical procedures.

---

### User Story 4 — Multi-Project API Key Pool & Automatic Failover (Priority: P2)
As a system administrator, I want to configure multiple Google Gemini API keys across different Google Cloud Projects, such that quota exhaustion (HTTP 429) or credential failures automatically fail over to an alternate project without interrupting the user's ongoing voice session.

**Why this priority**: High availability during mission-critical voice interactions requires resilience against quota depletion and cloud provider hiccups.

**Independent Test**: Configure two Google Cloud Projects (`Project-A` and `Project-B`). Simulate or trigger an HTTP 429 `RESOURCE_EXHAUSTED` on `Project-A`. Verify that the Key Manager transitions `Project-A` into cooldown, selects an eligible key from `Project-B`, and completes the request within $<500 \text{ ms}$ without surfacing an error to the crew.

**Acceptance Scenarios**:
1. **Given** an HTTP 429 error returned by a Google API endpoint, **When** the Key Manager intercepts the error, **Then** it recognizes this as a project-level rate limit, applies cooldown with exponential jitter to that project, and routes subsequent calls to an alternate eligible project.
2. **Given** an HTTP 401 `UNAUTHENTICATED` error on a specific key, **When** intercepted, **Then** the Key Manager marks that specific key as `REVOKED`, logs an alert with the masked key identifier, and rotates to another configured key.
3. **Given** all configured Google projects are exhausted or in cooldown, **When** a voice request arrives, **Then** the system gracefully preserves the conversation, notifies the user with an actionable message, and offers fallback to Chat mode.

---

### User Story 5 — Bilingual Arabic/English Code-Switching (Priority: P2)
As a bilingual Crew Medical Officer speaking Arabic during operations, I want to speak in Arabic while naturally interjecting English medical terminology and acronyms (e.g., "المريض يعاني من tachycardia و SpO2 نازل لـ 82%"), so that the system accurately transcribes both languages simultaneously without transcription corruption.

**Why this priority**: Real-world international spaceflight crews and Middle Eastern medical personnel frequently communicate in mixed Arabic-English technical dialects.

**Independent Test**: Stream audio containing mixed Arabic speech and English medical acronyms to `gemini-3.5-transcribe-live`. Verify that the transcribed output correctly represents the Arabic words in Arabic script and the medical acronyms in Latin characters.

**Acceptance Scenarios**:
1. **Given** automatic language detection (`language_codes: []`), **When** speech switches between Arabic and English within a single utterance, **Then** the finalized transcript preserves exact wording in both scripts without phonetic mutilation.
2. **Given** medical custom vocabulary biasing is active (`["SpO2", "tachycardia", "SOMS", "CHECS"]`), **When** these terms are vocalized in mixed speech, **Then** the transcription engine biases recognition to the correct technical spelling.
3. **Given** the user inquires in Arabic, **When** the medical copilot responds, **Then** the spoken audio from Gemini TTS speaks the Arabic clinical synthesis fluently using Modern Standard Arabic phonetics.

---

### User Story 6 — Offline Detection & Graceful Chat Fallback (Priority: P3)
As an astronaut operating during a spacecraft communication blackout, I want the interface to immediately detect offline status and provide a clear status indicator, ensuring I can seamlessly transition to the existing local offline Chat mode (powered by local MedGemma and ChromaDB) without system crashes.

**Why this priority**: Deep-space communications latency and blackouts are inevitable; the system must degrade gracefully.

**Independent Test**: Disable external internet access. Attempt to open Voice Mode. Verify that the UI displays an informative "Voice Mode unavailable (Offline) — Using Local Copilot" badge and keeps the text chat operational via Ollama `medgemma:latest`.

**Acceptance Scenarios**:
1. **Given** network connectivity is lost, **When** the user attempts to start Voice Mode, **Then** the system blocks voice connection, displays an offline warning, and highlights the text chat input box.
2. **Given** a voice session is active when network fails, **When** WebSocket disconnection occurs, **Then** the state machine transitions to `RECONNECTING` (3 retries with backoff), and if unrecoverable, transitions to `ENDED` while saving the text transcript in the chat view.
3. **Given** the user switches to text chat while offline, **When** sending a text message, **Then** the existing offline gateway routes to local Ollama and local ChromaDB as verified in Phase 01.

---

## 3. Edge Cases & Safety Hazards

| Edge Case / Hazard | Impact | System Mitigation |
|:---|:---|:---|
| **Microphone Permission Denied** | Voice session cannot start | UI detects `NotAllowedError`, displays clear instructions to allow mic access in browser, and keeps text chat active. |
| **Acoustic Background Noise (Cabin Fans / Thrusters)** | False VAD triggering | Implement Web Audio API high-pass filtering (80Hz cut-off) and configure Gemini Live Transcribe with balanced VAD sensitivity. |
| **Severe Acoustic Medical Ambiguity** | Misheard numbers or medication names | If transcription acoustic confidence score is low ($<0.75$) or contains unrecognized phonetic strings for critical vitals, UI displays confirmation dialog before submitting to chat. |
| **Rapid Successive Interruptions** | Buffer overflow / race conditions | Incoming speech debounced by 150ms; existing `AbortController` terminates ongoing TTS generation; audio queue immediately flushed. |
| **10-Minute Live Streaming Session Cap** | Connection dropped by Google API | Voice Session Manager tracks session uptime; at minute 9, initiates an in-flight token refresh and seamless WebSocket reconnect without user disruption. |
| **All Google Project Quotas Exhausted (Global 429)** | Voice Mode completely unavailable | UI displays `All cloud voice credentials rate-limited. Preserving conversation in text mode.`, auto-focuses text chat input, and continues with local Ollama fallback. |
| **Arabic Right-to-Left (RTL) Layout Flipping** | UI text disorientation | Dynamic `dir="rtl"` / `dir="ltr"` applied based on language detection of the active message turn; audio waveform remains visually symmetrical. |

---

## 4. System Requirements

### 4.1 Functional Requirements (FR)

- **FR-001**: System MUST provide a "Start Voice" and "End Voice" control within the AuraMed Chat UI.
- **FR-002**: System MUST capture microphone audio in 16-bit Linear PCM format at 16,000 Hz mono.
- **FR-003**: System MUST mint short-lived (30-minute), single-use Ephemeral Tokens via `POST /api/v1/voice/session/start` without exposing permanent Google API keys to the browser.
- **FR-004**: System MUST connect directly to Google's Gemini Live Transcribe WebSocket (`gemini-3.5-transcribe-live`) using the minted ephemeral token.
- **FR-005**: System MUST provide an optional backend WebSocket audio relay (`/ws/voice/relay`) as a fallback for restricted network environments.
- **FR-006**: System MUST stream real-time interim transcription updates (`interim_input_transcription`) to the UI for live captioning ($<150 \text{ ms}$ latency).
- **FR-007**: System MUST detect turn completion from `input_transcription` and automatically forward the finalized transcript to `POST /v1/chat`.
- **FR-008**: System MUST pass previous conversation history (up to last 6 turns) with each voice-initiated chat request to preserve conversational context.
- **FR-009**: System MUST preserve all existing medical reasoning, severity assessment (`assess_vitals`), hybrid retrieval, and 6-stage safety guardrails without modification.
- **FR-010**: System MUST format validated medical responses for spoken synthesis via a deterministic Spoken Representation Formatter that strips markdown formatting while preserving all medical facts, dosages, and units character-for-character.
- **FR-011**: System MUST synthesize spoken audio using `gemini-3.8-flash-tts` (or `gemini-3.8-flash-lite-tts`) via the centralized Key Manager.
- **FR-012**: System MUST stream or deliver 24 kHz WAV/PCM audio to the client and play it through Web Audio API.
- **FR-013**: System MUST support instant barge-in: detecting user speech during audio playback, immediately halting playback ($<50 \text{ ms}$), flushing audio buffers, and aborting pending TTS requests.
- **FR-014**: System MUST maintain a centralized API Key Manager supporting multiple Google Cloud Projects and multiple API keys per project.
- **FR-015**: System MUST track quota exhaustion at the Google Cloud Project level and enforce temporary cooldown with exponential backoff and jitter.
- **FR-016**: System MUST mark invalid (HTTP 401/403) credentials as revoked and rotate to an alternate key/project without user interruption.
- **FR-017**: System MUST mask all API keys in server logs (e.g. `AQ.Ab8...5ew`) to prevent credential leakage.
- **FR-018**: System MUST support automatic language detection (`language_codes: []`) for seamless Arabic and English transcription.
- **FR-019**: System MUST inject a custom medical vocabulary list (up to 100 terms) into the transcription configuration to bias recognition for spaceflight medical terminology.
- **FR-020**: System MUST display an animated audio waveform reflecting live microphone input volume and assistant speech output.
- **FR-021**: System MUST display real-time connection status badges (`CONNECTING`, `LISTENING`, `PROCESSING`, `SPEAKING`, `ERROR`, `RECONNECTING`).
- **FR-022**: System MUST support bidirectional RTL/LTR layout transitions based on user language.
- **FR-023**: System MUST maintain full conversation synchronization between Voice Mode and normal Chat Mode.
- **FR-024**: System MUST allow the user to toggle mute/unmute of their microphone at any time during a voice session.
- **FR-025**: System MUST automatically detect internet disconnection, block voice initialization, and keep local offline Chat Mode operational.
- **FR-026 (Configurable Speech Pause / Silence Debounce Timer)**: System MUST implement a configurable silence hangover timer (default 1,500 ms, adjustable from 800 ms to 3,000 ms) before committing a finalized speech turn to the medical chat pipeline. If the user resumes speaking within this window, the silence timer MUST immediately reset and merge subsequent speech into the ongoing conversational turn without premature interruption.

---

### 4.2 Non-Functional Requirements (NFR)

- **NFR-001 (Acoustic Latency)**: First interim transcription update MUST be visible in the UI within $<200 \text{ ms}$ of user vocalization.
- **NFR-002 (Barge-in Cutoff)**: Audio playback MUST stop within $<50 \text{ ms}$ of user speech activity detection.
- **NFR-003 (TTS Latency)**: First audio playback buffer MUST begin playing within $<1.8 \text{ s}$ of medical chat response completion.
- **NFR-004 (Failover Latency)**: Project-level quota failover MUST complete within $<500 \text{ ms}$ without dropping the voice session.
- **NFR-005 (Memory Constraints)**: Client voice streaming buffer MUST not exceed $25 \text{ MB}$ RAM in the browser; backend relay buffer MUST not exceed $10 \text{ MB}$ per session.
- **NFR-006 (Hardware Efficiency)**: Audio processing on the host machine MUST execute entirely on CPU/Web Audio without consuming GPU VRAM reserved for local Ollama.
- **NFR-007 (Security & Privacy)**: No permanent Google API credentials may ever be transferred to the client. Raw audio must not be stored on disk.
- **NFR-008 (Reconnection Resilience)**: Voice Session Manager MUST retry failed WebSocket connections up to 3 times with exponential backoff ($1\text{s}, 2\text{s}, 4\text{s}$) before concluding session failure.
- **NFR-009 (Session Duration)**: System MUST support continuous voice interaction for up to 30 minutes via automated transparent token refreshes.
- **NFR-010 (Bilingual Fidelity)**: Medical acronym transcription accuracy in mixed Arabic-English speech MUST exceed $95\%$ on the golden spaceflight medical terms.

---

## 5. Key Entities & Data Schema Summary

1. **`VoiceSession`**: Represents a live voice conversation instance with `session_id`, `astronaut_id`, `state`, `created_at`, `active_project_id`, `language_detected`, and `turns_count`.
2. **`VoiceTurn`**: Represents an individual conversational exchange containing `turn_id`, `user_transcript`, `is_interrupted`, `clinical_response` (full ChatMessageResponse), and `audio_duration_seconds`.
3. **`GoogleProjectBucket`**: Represents a Google Cloud project managing a pool of keys, tracking `project_id`, `priority`, `cooldown_until`, `rpm_count`, `daily_requests`, and `is_active`.
4. **`GeminiCredential`**: Represents an individual API key linked to a project, tracking `key_hash`, `masked_key`, `status` (`ACTIVE`, `RATE_LIMITED`, `REVOKED`), `failure_count`, and `last_used_at`.
5. **`SpokenMedicalScript`**: Represents the safely filtered text submitted to Gemini TTS, with `clean_speech_text`, `speech_style`, `target_language`, and `preserved_chunk_references`.

---

## 6. Measurable Success Criteria

- **SC-001 (End-to-End Voice Latency)**: Crew member completes speaking $\rightarrow$ medical response validated $\rightarrow$ voice begins speaking in $<3.5 \text{ s}$ total round-trip.
- **SC-002 (Zero Medical Hallucination)**: 100% of generated procedural steps cited in voice mode reference verified NASA Tier 1 chunks with zero invented dosages ($0.0\%$ error rate).
- **SC-003 (Reliable Barge-In)**: Interruption stops audio in $<50 \text{ ms}$ in 100% of tested interruption events without dropping conversation history.
- **SC-004 (Quota Failover Success)**: Key Manager successfully fails over from a rate-limited Google Cloud Project to a backup project in $<500 \text{ ms}$ with zero user-visible error.
- **SC-005 (Bilingual Fluency)**: Arabic clinical syntheses are spoken with correct medical Arabic phrasing; English NASA checklist steps are pronounced with clear aviation/clinical diction.

---

## 7. Assumptions & Technical Constraints

1. **Online-Only for Voice Mode**: Live voice transcription and speech generation require active internet connectivity to Google's Gemini APIs in Phase 02. Offline operation defaults to existing local text chat.
2. **Web Audio API**: Browser environment supports HTML5 Web Audio API, `MediaDevices.getUserMedia`, and WebSocket protocols.
3. **Existing Chat API Reusability**: The existing `POST /v1/chat` endpoint is fully functional, thread-safe, and capable of receiving rapid sequential requests without state corruption.
4. **No Permanent Audio Persistence**: In compliance with medical privacy standards and spaceflight telemetry privacy protocols, raw audio streams are processed ephemerally in RAM and immediately discarded.
