"""Contract tests for Voice Mode Endpoints and Schemas."""

import pytest
from starlette.testclient import TestClient

from services.rag_service.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_start_voice_session_contract(client):
    """Verify POST /api/v1/voice/session/start returns valid session contract."""
    req_payload = {
        "astronaut_id": "ASTRO-TEST-01",
        "language_hint": "ar",
        "voice_preference": "Kore",
        "enable_smart_transcribe": True,
        "silence_timeout_ms": 1500,
    }
    res = client.post("/api/v1/voice/session/start", json=req_payload)
    assert res.status_code == 200

    data = res.json()
    assert "session_id" in data
    assert data["session_id"].startswith("VSES-")
    assert "ephemeral_token" in data
    assert "token_expires_at" in data
    assert "ws_endpoint" in data
    assert "gemini-3.5-transcribe-live" in data["model"]
    assert len(data["custom_vocabulary"]) >= 5
    assert data["silence_timeout_ms"] == 1500
    assert data["audio_format"]["sample_rate_hz"] == 16000


def test_voice_tts_contract(client):
    """Verify POST /api/v1/voice/tts generates compliant audio payload and preserves dosage."""
    req_payload = {
        "session_id": "VSES-TEST-01",
        "raw_markdown": "### 1. تحليل القياسات\nالمريض يعاني من نقص الأكسجين (SpO2 84%).\n### 3. الخطوات الإجرائية\nالخطوة 1: ارتداء قناع الأكسجين فورا.",
        "voice_name": "Kore",
        "language": "ar",
    }
    res = client.post("/api/v1/voice/tts", json=req_payload)
    assert res.status_code == 200

    data = res.json()
    assert data["session_id"] == "VSES-TEST-01"
    assert "turn_id" in data
    assert "audio_base64" in data
    assert len(data["audio_base64"]) > 20
    assert data["audio_mime_type"] in ["audio/wav", "audio/mp3"]
    assert data["duration_seconds"] > 0
    assert "84" in data["spoken_text"]
    assert "###" not in data["spoken_text"]


def test_keypool_status_contract(client):
    """Verify GET /api/v1/voice/keypool/status returns telemetry."""
    res = client.get("/api/v1/voice/keypool/status")
    assert res.status_code == 200

    data = res.json()
    assert data["service"] == "auramed-gemini-keypool"
    assert "global_status" in data
    assert "projects" in data
    assert isinstance(data["projects"], list)
