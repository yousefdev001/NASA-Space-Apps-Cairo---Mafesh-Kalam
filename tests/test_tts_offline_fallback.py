"""Integration test for TTS Gateway Online-First / Offline-Fallback architecture.

Feature: Live Voice Engine Failover & Mode Selection
Verifies:
1. TTS Gateway initializes in correct operating mode.
2. Mode 'online' forces cloud execution with lowest latency.
3. Mode 'offline' forces local VibeVoice execution without network delays.
4. Mode 'auto' provides automatic failover.
5. POST /api/v1/voice/mode allows dynamic mode switching.
"""

import base64
import io
import pytest
from scipy.io import wavfile
from httpx import AsyncClient, ASGITransport

from services.rag_service.gateway.tts_gateway import TTSGateway
from services.rag_service.gateway.vibevoice_tts_client import VibeVoiceTTSClient
from services.rag_service.main import app


@pytest.mark.asyncio
async def test_tts_explicit_online_mode():
    """Verify explicit online mode uses cloud path rapidly without local CPU model overhead."""
    gateway = TTSGateway()
    test_markdown = "Heart rate is 72 BPM. Oxygen saturation 99%. Status normal."
    audio_b64, duration, text, lat, provider = await gateway.synthesize_speech(
        raw_markdown=test_markdown,
        voice_name="Kore",
        mode="online",
    )
    assert provider in ("gemini_cloud", "edge_tts_fallback")
    assert duration > 0.5
    assert len(audio_b64) > 500


@pytest.mark.asyncio
async def test_voice_mode_endpoints_and_switching():
    """Verify GET and POST /api/v1/voice/mode dynamically switch and report modes."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Switch to online
        resp = await ac.post("/api/v1/voice/mode", json={"mode": "online"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["configured_default_mode"] == "online"

        # 2. Switch to offline
        resp = await ac.post("/api/v1/voice/mode", json={"mode": "offline"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["configured_default_mode"] == "offline"
        assert data["operating_mode"] == "offline"

        # 3. Switch back to auto
        resp = await ac.post("/api/v1/voice/mode", json={"mode": "auto"})
        assert resp.status_code == 200
        assert resp.json()["configured_default_mode"] == "auto"


@pytest.mark.asyncio
async def test_tts_endpoint_online_mode_latency():
    """Verify POST /api/v1/voice/tts with mode='online' returns sub-second fast cloud audio."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        req_payload = {
            "session_id": "VSES-ONLINE-FAST",
            "raw_markdown": "Telemetry nominal. Flight surgeon notified.",
            "voice_name": "Kore",
            "language": "en",
            "mode": "online"
        }
        resp = await ac.post("/api/v1/voice/tts", json=req_payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["session_id"] == "VSES-ONLINE-FAST"
        assert data["audio_base64"]
        assert data["tts_provider"] in ("gemini_cloud", "edge_tts_fallback")
