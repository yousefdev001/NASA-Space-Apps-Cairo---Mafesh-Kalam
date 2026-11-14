# Quickstart Guide: AuraMed Live Voice Conversation Mode
# SpecKit 002-live-voice-mode

This guide explains how to configure, run, and test the Live Voice Conversation Interface.

---

## 1. Prerequisites

- Python 3.11.x installed.
- Modern Web Browser (Chrome, Edge, Firefox, Safari) with microphone access.
- At least one valid Google Gemini API Key. For production high availability, configure multiple keys across 2 or more Google Cloud Projects.

---

## 2. Environment Configuration

Add your Google Cloud Projects and Gemini API Keys to `.env`.

### Multi-Project Configuration Example
```env
# ==============================================================================
# Google Gemini Multi-Project Key Pool (Voice Mode)
# ==============================================================================
GEMINI_VOICE_PROJECTS_JSON=[{"project_id":"auramed-cloud-alpha","priority":1,"keys":[{"key":"YOUR_GEMINI_KEY_1","label":"alpha-primary"},{"key":"YOUR_GEMINI_KEY_2","label":"alpha-secondary"}]},{"project_id":"auramed-cloud-beta","priority":2,"keys":[{"key":"YOUR_GEMINI_KEY_3","label":"beta-primary"},{"key":"YOUR_GEMINI_KEY_4","label":"beta-secondary"}]}]

# Default Voice Settings
GEMINI_VOICE_DEFAULT_MODEL=gemini-3.5-transcribe-live
GEMINI_TTS_DEFAULT_MODEL=gemini-3.8-flash-tts
GEMINI_TTS_DEFAULT_VOICE=Kore
```

---

## 3. Running the Service

Start the unified AuraMed Gateway:
```powershell
# Activate Python virtual environment
.venv\Scripts\Activate.ps1

# Launch the unified client gateway (Port 8000)
python -m uvicorn services.orchestrator.main:app --host 0.0.0.0 --port 8000 --reload
```

Open your browser to:
- **Testing Studio**: `http://localhost:8000/`
- **Clinical Copilot Chat UI**: `http://localhost:8000/chat`
- **OpenAPI Documentation**: `http://localhost:8000/docs`

---

## 4. Operational Testing via Curl / PowerShell

### 4.1 Check Key Pool Health Status
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/voice/keypool/status" -Method GET | ConvertTo-Json -Depth 5
```

### 4.2 Mint an Ephemeral Voice Session Token
```powershell
$body = @{
    astronaut_id = "ASTRO-01"
    voice_preference = "Kore"
    enable_smart_transcribe = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/voice/session/start" -Method POST -Body $body -ContentType "application/json"
```

### 4.3 Synthesize Spoken Audio for Clinical Guidance
```powershell
$ttsBody = @{
    session_id = "VSES-TEST-01"
    raw_markdown = "### 1. تحليل القياسات\nالمريض يعاني من نقص الأكسجين (SpO2 84%).\n### 3. الخطوات الإجرائية\nالخطوة 1: ارتداء قناع الأكسجين فورا."
    voice_name = "Kore"
    language = "ar"
} | ConvertTo-Json

$res = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/voice/tts" -Method POST -Body $ttsBody -ContentType "application/json"
Write-Host "Audio Duration: $($res.duration_seconds) s | Latency: $($res.latency_ms) ms"
```

---

## 5. Running Automated Tests

Run the test suite:
```powershell
pytest tests/unit/test_gemini_key_manager.py -v
pytest tests/unit/test_spoken_filter.py -v
pytest tests/integration/test_voice_chat_integration.py -v
```
