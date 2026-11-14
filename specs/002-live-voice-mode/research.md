# Phase 0: Technical Research & Architectural Feasibility
# AuraMed Live Voice Conversation Mode (SpecKit 002-live-voice-mode)

**Feature Branch**: `002-live-voice-mode`  
**Created**: 2026-11-14  
**Status**: Completed  
**Domain**: Real-Time Audio Streaming, Speech-to-Text (STT), Text-to-Speech (TTS), Multimodal Gateway, Spaceflight Medical Safety

---

## 1. Google Gemini Audio Models Research

### 1.1 Real-Time Speech-to-Text: `gemini-3.5-transcribe-live`

- **Official Upstream ID**: `gemini-3.5-transcribe-live`
- **Documentation**: 
  - Overview & Quickstart: https://ai.google.dev/gemini-api/docs/live-api/live-transcribe
  - API Reference: https://ai.google.dev/gemini-api/docs/live-api
  - Pricing Reference: https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-transcribe-live
- **Protocol**: Bidirectional streaming WebSocket over `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`
- **Input Audio Format**:
  - Raw 16-bit Linear PCM (Pulse Code Modulation), little-endian.
  - Sample rate: 16,000 Hz (`audio/pcm;rate=16000`), mono channel.
  - Audio chunking: 100 ms to 250 ms chunks (1,600 to 4,000 samples per packet, base64 encoded in JSON payloads or raw binary over WebSocket).
- **Output Modalities & Fields**:
  - `response_modalities`: `["TEXT"]` (dedicated low-latency transcription pipeline).
  - `server_content.interim_input_transcription`: Low-latency, speculative partial transcription hypotheses emitted continuously while the user is actively speaking. Used for immediate live subtitle rendering in the UI.
  - `server_content.input_transcription`: Finalized, authoritative input transcript emitted when a speech turn finishes (speaker pause or activity end). Used to trigger the AuraMed clinical copilot pipeline.
- **Language Support & Code-Switching**:
  - Automatic language identification enabled by default (`language_codes: []`).
  - Native support for Arabic (`ar`, `ar-SA`, `ar-EG`, etc.) and English (`en-US`, `en-GB`, etc.).
  - Seamless handling of intra-sentential Arabic-English code-switching (e.g., an astronaut speaking Arabic but pronouncing medical terms and acronyms like "SpO2", "CPR", "Chest compressions", "Defibrillator", "Airlock" in English).
- **Custom Vocabulary Biasing**:
  - Supports `custom_vocabulary` (up to 1,000 terms; optimal up to 100 terms).
  - Critical for spaceflight medical terminology: `["SpO2", "SOMS", "CHECS", "CMRS", "tachycardia", "hypoxia", "cyanosis", "arrhythmia", "PEA", "asystole", "microgravity", "cephalic fluid shift"]`.
- **Transcription Modes**:
  - `VERBATIM`: Literal transcription preserving disfluencies and filler words.
  - `SMART`: Removes filler words, resolves inline self-corrections, formats medical acronyms and vital numbers cleanly.
- **Session Limits & Reconnection**:
  - Maximum continuous streaming session duration: **10 minutes**.
  - AuraMed Voice Session Manager must automatically manage transparent session renewal / reconnection when approaching the 9-minute mark without dropping conversational turn history.

---

### 1.2 Text-to-Speech: `gemini-3.8-flash-tts` & `gemini-3.8-flash-lite-tts`

- **Official Upstream ID**: `gemini-3.8-flash-tts` (High-fidelity studio grade) & `gemini-3.8-flash-lite-tts` (Low-latency conversational workhorse)
- **Documentation**:
  - Overview: https://ai.google.dev/gemini-api/docs/speech-generation
  - Model Details: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash-tts
  - Pricing Reference: https://ai.google.dev/gemini-api/docs/pricing#gemini-3.8-flash-tts
- **Protocol**: Unary REST API (`POST https://generativelanguage.googleapis.com/v1beta/interactions`) and streaming interactions.
- **Input Text Requirements**:
  - Verbatim text representation.
  - Prosody/Style separation: `speech_metadata.style` carries delivery attributes (e.g. `"calm, authoritative flight surgeon, articulate"`), while `text` strictly carries the spoken script.
  - Point-in-time inline tags supported: `<short pause>`, `<breath>`.
- **Audio Output Format**:
  - Default: WAV (`audio/wav`) 24,000 Hz, 16-bit mono PCM with RIFF header.
  - Optional: Raw PCM `audio/l16` (24kHz).
- **Language Support**:
  - Multilingual support including Modern Standard Arabic (العربية الفصحى) and English.
  - Handles Arabic diacritics and phonetics accurately.
- **Voice Selection**:
  - 30 prebuilt studio voices. Recommended for AuraMed:
    - `Kore` (Firm, authoritative, steady — ideal for emergency guidance).
    - `Charon` (Informative, calm — ideal for diagnostic review).
    - `Fenrir` or `Puck` (Upbeat / crisp).
  - Extended Voice Library accessible via `GET /v1beta/voices` for regional Arabic accents.
- **Pricing & Quota Characteristics**:
  - Standard Tier:
    - Input Text: $0.50 / 1M tokens (through Dec 31, 2026).
    - Output Audio: $9.00 / 1M audio tokens (~$0.00225 per 10s audio) for `gemini-3.8-flash-tts`; $6.00 / 1M audio tokens (~$0.0015 per 10s audio) for `gemini-3.8-flash-lite-tts`.
    - 25 audio tokens per second of speech.

---

## 2. API Key Pool & Project-Level Quota Architecture

### 2.1 The Fundamental Quota Law in Google Cloud
Google Gemini API rate limits and quotas are strictly enforced at the **Google Cloud Project** level, **NOT** per API key:
- Creating 10 API keys within the same Google Cloud Project shares the exact same RPM (Requests Per Minute), TPM (Tokens Per Minute), and RPD (Requests Per Day) quota limits.
- If a project exhausts its quota (HTTP 429 `RESOURCE_EXHAUSTED`), rotating to another API key from the *same* project will **still return HTTP 429**.
- Therefore, the AuraMed Key Manager must model a two-tier hierarchy:
  1. **Google Cloud Project Bucket** (holds project-level quota, rate-limit state, and cooldown timers).
  2. **API Key Credential** (belongs to a specific project; manages authentication validity, 401/403 revoking, and per-key rotation).

### 2.2 Credential Configuration Schema
Credentials must be loaded dynamically from environment variables without code modifications:
```json
[
  {
    "project_id": "auramed-cloud-alpha",
    "priority": 1,
    "keys": [
      {"key": "YOUR_GEMINI_KEY_1", "label": "alpha-primary"},
      {"key": "YOUR_GEMINI_KEY_2", "label": "alpha-secondary"}
    ]
  },
  {
    "project_id": "auramed-cloud-beta",
    "priority": 2,
    "keys": [
      {"key": "YOUR_GEMINI_KEY_3", "label": "beta-primary"},
      {"key": "YOUR_GEMINI_KEY_4", "label": "beta-secondary"}
    ]
  }
]
```

### 2.3 Failure Handling Matrix
| HTTP Status | Error Type | Impact Scope | Key Manager Action |
|:---|:---|:---|:---|
| **429** | `RESOURCE_EXHAUSTED` | **Project-Level** | Mark the entire Google Project as "Cooldown" for `retry-after` seconds (default 60s with exponential jitter). Immediately fail over to the next priority Google Project. |
| **401** | `UNAUTHENTICATED` | **Key-Level** | Mark the specific API key as `REVOKED`. Rotate to another key within the project or fail over to the next project. Log error with masked key ID. |
| **403** | `PERMISSION_DENIED` | **Key/Project** | Check if quota/billing is disabled or model disabled. Disable key for that model; fail over. |
| **500 / 503 / 504** | Transient Server Error | **System-Level** | Bounded retry with exponential backoff (initial 250ms, multiplier 2x, max 2 retries). If still failing, fail over project. |
| **Network Timeout** | Connection Loss | **Transport-Level** | Socket retry; if offline, trigger graceful fallback to local Chat mode. |

---

## 3. Streaming Transport Architecture: Client Direct vs. Proxy

### 3.1 Security & Ephemeral Tokens
Under no circumstances should permanent Google API keys be exposed to the browser.
Google Gemini provides a secure, officially supported solution: **Ephemeral Tokens** (`POST /v1beta/auth_tokens`):
1. Browser client requests a voice session token from AuraMed backend: `POST /api/v1/voice/session/start`.
2. AuraMed backend picks an eligible Google Project/Key from the Key Pool and calls Google's `client.auth_tokens.create`:
   - `expire_time`: 30 minutes from creation.
   - `uses`: 1 (or single-session bound).
   - `live_connect_constraints`:
     - `model`: `"gemini-3.5-transcribe-live"`
     - `response_modalities`: `["TEXT"]`
3. Backend returns the single-use Ephemeral Token to the browser.
4. Browser directly establishes WebSocket to `wss://generativelanguage.googleapis.com/...` with `access_token=EPHEMERAL_TOKEN`.

### 3.2 Benefits of Ephemeral Token Direct Connection
- **Ultra-low latency**: Audio goes directly from browser mic to Google's ingestion edge over WebSocket; interim transcription arrives back with sub-150ms roundtrip.
- **Zero server audio bandwidth**: The AuraMed backend server (running on an Intel Core i7 with 32GB RAM and 6GB Quadro GPU) does not waste CPU cycles transcoding or buffering thousands of continuous 16kHz PCM audio packets.
- **100% Secure**: The long-lived Google API keys remain strictly in backend environment memory; the client only holds a short-lived token restricted to transcription.

### 3.3 Fallback Relay Architecture
In enterprise network environments where client firewalls block outbound WebSocket traffic on non-standard ports or to Google APIs directly, AuraMed provides a fallback **WebSocket Audio Relay** endpoint: `WS /api/v1/voice/relay`.
The client automatically detects WebSocket connection failures to Google and seamlessly falls back to the backend relay.

---

## 4. Medical Safety & Spoken Representation Layer

### 4.1 Invariance Principle (NON-NEGOTIABLE)
- The medical response returned by the existing `POST /v1/chat` endpoint is the **single source of medical truth**.
- It contains exact NASA Tier 1 chunks, citations (`source_chunk_id`), deterministic severity (`Critical`, `Warning`, `Normal`), and flight surgeon escalation flags.
- **The Voice Layer MUST NEVER modify this response in the database or conversation history.**

### 4.2 Spoken Representation Filter (Deterministic Text Prep for TTS)
Raw medical markdown contains brackets, chunk IDs, bullets, tables, and citations (e.g. `[CHUNK-01]`, `### 1. تحليل القياسات`, `SpO2 <= 88%`, `Rev K PCN-4`).
If fed raw to a TTS engine, the voice would read aloud "bracket C-H-U-N-K dash zero one bracket hash hash hash", causing severe acoustic clutter during life-critical emergencies.

A **deterministic, non-generative spoken text formatter** transforms the text for speech synthesis without changing any medical fact:
1. Strips UI-only tokens: `###`, `**`, `---`, `[CHUNK-...]`.
2. Translates abbreviations for phonetic clarity:
   - `SpO2 85%` $\rightarrow$ "SpO2 85 percent" (or "تشبع الأكسجين 85 بالمائة").
   - `140/90 mmHg` $\rightarrow$ "140 over 90 millimeters of mercury" (or "140 على 90 مليمتر زئبق").
   - `HR 115 bpm` $\rightarrow$ "Heart rate 115 beats per minute" (or "نبض 115 نبضة في الدقيقة").
3. Separates the response into:
   - **Immediate Clinical Briefing** (spoken aloud first).
   - **Procedural Steps** (spoken with brief pauses `<short pause>` between numbered actions).
   - **Escalation Warning** (spoken with urgent, authoritative inflection).
4. Strictly preserves all medication names, dosages, units, and numbers character-for-character.

---

## 5. Barge-in & Natural Interruption Handling

### 5.1 The Interruption Sequence
1. AuraMed is in `SPEAKING` state, playing audio chunks via Web Audio API.
2. The user starts speaking into the microphone.
3. The browser Web Audio API analyzer or Google's Live Transcribe VAD detects voice activity:
   - Client immediately stops the `AudioBufferSourceNode` or HTML5 Audio element.
   - Clears the pending audio playback buffer queue.
   - Transitions state to `INTERRUPTED`.
4. The new speech audio is streamed to `gemini-3.5-transcribe-live`.
5. Interim subtitles show the user's incoming utterance immediately.
6. When `input_transcription` finalizes, the turn is dispatched to `POST /v1/chat` with previous turn history.
7. Any pending background TTS requests from the previous interrupted turn are cancelled via `AbortController`.

---

## 6. Official References & Citation Summary

1. **Google Gemini Live API Guide**: https://ai.google.dev/gemini-api/docs/live-api
2. **Google Gemini Live Transcribe Guide**: https://ai.google.dev/gemini-api/docs/live-api/live-transcribe
3. **Google Gemini Speech Generation (TTS)**: https://ai.google.dev/gemini-api/docs/speech-generation
4. **Google Gemini Voice Library**: https://ai.google.dev/gemini-api/docs/speech-generation#voices
5. **Google Gemini Pricing**: https://ai.google.dev/gemini-api/docs/pricing
6. **Google Gemini API Rate Limits & Errors**: https://ai.google.dev/gemini-api/docs/rate-limits & https://ai.google.dev/gemini-api/docs/api-errors
