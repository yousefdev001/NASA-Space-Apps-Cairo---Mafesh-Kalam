"""Integration test for End-to-End Voice Mode and Clinical Copilot Pipeline."""

import pytest
from starlette.testclient import TestClient

from services.rag_service.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_end_to_end_voice_to_copilot_flow(client):
    """Verify complete flow: Voice Session Start -> Chat Dispatch -> TTS Audio Synthesis."""
    # 1. Start Voice Session
    start_payload = {
        "astronaut_id": "ASTRO-E2E-01",
        "voice_preference": "Kore",
        "silence_timeout_ms": 1500,
    }
    start_res = client.post("/api/v1/voice/session/start", json=start_payload)
    assert start_res.status_code == 200
    session_data = start_res.json()
    session_id = session_data["session_id"]
    assert session_data["silence_timeout_ms"] == 1500

    # 2. Simulate Finalized Speech Transcript submitted to existing AuraMed Copilot
    chat_payload = {
        "query": "Astronaut cyanotic with acute oxygen saturation drop to SpO2 85% and tachycardia 130 bpm.",
        "astronaut_id": "ASTRO-E2E-01",
    }
    chat_res = client.post("/v1/chat", json=chat_payload)
    assert chat_res.status_code == 200
    chat_data = chat_res.json()

    assert chat_data["severity"] == "Critical"
    assert len(chat_data["summary"]) > 10
    assert len(chat_data["action_steps"]) >= 1

    # 3. Request TTS Audio Synthesis for the Medical Response
    tts_payload = {
        "session_id": session_id,
        "raw_markdown": chat_data["summary"],
        "voice_name": "Kore",
        "language": "en",
    }
    tts_res = client.post("/api/v1/voice/tts", json=tts_payload)
    assert tts_res.status_code == 200
    tts_data = tts_res.json()

    assert tts_data["session_id"] == session_id
    assert "audio_base64" in tts_data
    assert len(tts_data["audio_base64"]) > 0
    assert tts_data["duration_seconds"] > 0
    assert len(tts_data["spoken_text"]) > 0
    # Markdown symbols stripped
    assert "###" not in tts_data["spoken_text"]
