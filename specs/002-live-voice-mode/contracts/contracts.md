# API & WebSocket Contracts: AuraMed Live Voice Conversation Mode
# SpecKit 002-live-voice-mode

**Feature Branch**: `002-live-voice-mode`  
**Created**: 2026-11-14  
**Status**: Ready for Implementation  

---

## 1. REST Endpoints

### 1.1 `POST /api/v1/voice/session/start`
Initiates a new voice session, allocates an eligible Google Cloud Project and API key from the Key Manager, mints a short-lived Ephemeral Token, and configures the streaming session parameters.

#### Request Headers
- `Content-Type: application/json`
- `X-Request-Id: REQ-VOICE-...` (Optional, auto-generated if omitted)

#### Request Body
```json
{
  "astronaut_id": "ASTRO-01",
  "language_hint": "ar",
  "voice_preference": "Kore",
  "enable_smart_transcribe": true
}
```

#### Response Body (`200 OK`)
```json
{
  "session_id": "VSES-A7F92B3C814D",
  "ephemeral_token": "auth_tokens/c3ZldDEyMzQ1Njc4OTBhYmM...",
  "token_expires_at": "2026-11-14T00:35:46.000Z",
  "ws_endpoint": "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent",
  "relay_endpoint": "wss://localhost:8000/ws/voice/relay/VSES-A7F92B3C814D",
  "model": "gemini-3.5-transcribe-live",
  "custom_vocabulary": [
    "SpO2", "SOMS", "CHECS", "CMRS", "tachycardia", "hypoxia",
    "cyanosis", "arrhythmia", "PEA", "asystole", "microgravity"
  ],
  "audio_format": {
    "format": "pcm_s16le",
    "sample_rate_hz": 16000,
    "channels": 1,
    "chunk_duration_ms": 100
  }
}
```

#### Error Responses
- `429 Too Many Requests`: All configured Google Cloud Projects are in cooldown.
- `503 Service Unavailable`: Google API unreachable; offers fallback to offline Chat mode.

---

### 1.2 `POST /api/v1/voice/tts`
Converts a validated AuraMed clinical response into high-fidelity spoken audio using Google Gemini Speech Generation (`gemini-3.8-flash-tts`). Runs through the deterministic Spoken Representation Formatter.

#### Request Body
```json
{
  "session_id": "VSES-A7F92B3C814D",
  "raw_markdown": "### 1. تحليل القياسات ونماذج الذكاء الاصطناعي\nالأكسجين منخفض (SpO2 84%)...\n\n### 3. التفسير السريري للخطوات الإجرائية\nالخطوة 1: توصيل قناع Resuscitator وتفعيل تدفق الأكسجين من وحدة SOMS.",
  "voice_name": "Kore",
  "speech_style": "calm, articulate, authoritative flight surgeon",
  "language": "ar"
}
```

#### Response Body (`200 OK`)
```json
{
  "session_id": "VSES-A7F92B3C814D",
  "turn_id": "TURN-88C21EA4",
  "audio_base64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ...",
  "audio_mime_type": "audio/wav",
  "duration_seconds": 6.4,
  "spoken_text": "الأكسجين منخفض. تشبع الأكسجين 84 بالمائة. الخطوة الأولى: توصيل قناع Resuscitator وتفعيل تدفق الأكسجين من وحدة SOMS.",
  "latency_ms": 780.5
}
```

---

### 1.3 `GET /api/v1/voice/keypool/status`
Operational health and quota telemetry probe for system administrators.

#### Response Body (`200 OK`)
```json
{
  "service": "auramed-gemini-keypool",
  "timestamp": "2026-11-14T00:05:46.000Z",
  "active_projects_count": 2,
  "total_projects_count": 2,
  "total_keys_count": 4,
  "active_keys_count": 4,
  "global_status": "HEALTHY",
  "projects": [
    {
      "project_id": "auramed-cloud-alpha",
      "priority": 1,
      "is_active": true,
      "is_cooling_down": false,
      "cooldown_seconds_remaining": 0.0,
      "current_rpm": 4,
      "total_keys": 2,
      "active_keys": 2,
      "credentials": [
        {
          "credential_id": "cred-alpha-1",
          "masked_key": "AQ.Ab8...L5ew",
          "status": "ACTIVE",
          "consecutive_failures": 0,
          "last_failure_reason": null,
          "total_calls_succeeded": 142,
          "total_calls_failed": 0,
          "last_used_at": "2026-11-14T00:04:12.000Z"
        }
      ]
    }
  ]
}
```

---

## 2. WebSocket Protocols

### 2.1 Google Direct Live Transcribe WebSocket (`gemini-3.5-transcribe-live`)
Connected directly from client via Ephemeral Token:
- **URL**: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${EPHEMERAL_TOKEN}`

#### Client Setup Message
```json
{
  "setup": {
    "model": "models/gemini-3.5-transcribe-live",
    "generationConfig": {
      "responseModalities": ["TEXT"]
    },
    "inputAudioTranscription": {
      "languageCodes": [],
      "mode": "SMART",
      "customVocabulary": ["SpO2", "SOMS", "CHECS", "CMRS", "tachycardia", "hypoxia"]
    }
  }
}
```

#### Client Real-Time Audio Streaming (Every 100ms)
```json
{
  "realtimeInput": {
    "mediaChunks": [
      {
        "mimeType": "audio/pcm;rate=16000",
        "data": "5j7+Pf8+/r7/v/+..."
      }
    ]
  }
}
```

#### Server Interim Transcription Event
```json
{
  "serverContent": {
    "interimInputTranscription": {
      "text": "Astronaut cyanotic SpO2 dropping to 84"
    }
  }
}
```

#### Server Finalized Transcription Event
```json
{
  "serverContent": {
    "inputTranscription": {
      "text": "Astronaut cyanotic, SpO2 dropping to 84%."
    }
  }
}
```

---

### 2.2 Client-to-Backend Chat Integration
Once `inputTranscription` is emitted, the browser calls the existing:
- **`POST /v1/chat`** with payload:
```json
{
  "query": "Astronaut cyanotic, SpO2 dropping to 84%.",
  "astronaut_id": "ASTRO-01",
  "history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```
And upon receiving `ChatMessageResponse`, invokes `POST /api/v1/voice/tts` to generate spoken audio.
