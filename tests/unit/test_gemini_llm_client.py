"""Unit tests for GeminiLLMClient multi-project quota failover and JSON parsing."""

import json
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from services.rag_service.gateway.gemini_key_manager import GeminiKeyManager
from services.rag_service.gateway.gemini_llm_client import GeminiLLMClient


@pytest.fixture
def mock_key_manager():
    config = json.dumps([
        {
            "project_id": "proj-alpha",
            "priority": 1,
            "keys": [
                {"key": "KEY_A1", "label": "a1"},
                {"key": "KEY_A2", "label": "a2"}
            ]
        },
        {
            "project_id": "proj-beta",
            "priority": 2,
            "keys": [
                {"key": "KEY_B1", "label": "b1"}
            ]
        }
    ])
    return GeminiKeyManager(config_json=config)


@pytest.mark.asyncio
async def test_gemini_llm_client_success(mock_key_manager):
    """Verify GeminiLLMClient successfully returns parsed JSON."""
    client = GeminiLLMClient(key_manager=mock_key_manager, model="gemini-3-flash-preview")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": '{"clinical_assessment": "Tachycardia", "severity": "HIGH"}'}]
                }
            }
        ]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        res = await client.generate_json(prompt="Check vitals")
        assert res["clinical_assessment"] == "Tachycardia"
        assert res["severity"] == "HIGH"


@pytest.mark.asyncio
async def test_gemini_llm_client_429_rotation(mock_key_manager):
    """Verify GeminiLLMClient automatically rotates to the next key on 429."""
    client = GeminiLLMClient(key_manager=mock_key_manager, model="gemini-3-flash-preview")

    resp_429 = MagicMock()
    resp_429.status_code = 429
    resp_429.text = "Quota exceeded (RPM limit reached)"

    resp_200 = MagicMock()
    resp_200.status_code = 200
    resp_200.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": '{"status": "recovered_with_key_rotation"}'}]
                }
            }
        ]
    }

    call_count = 0

    async def mock_post(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return resp_429
        return resp_200

    with patch("httpx.AsyncClient.post", side_effect=mock_post):
        res = await client.generate_json(prompt="Check vitals")
        assert res["status"] == "recovered_with_key_rotation"
        assert call_count == 2
        # Verify first key was cooled down and second key succeeded
        telemetry = mock_key_manager.get_status_telemetry()
        assert telemetry.projects[0].credentials[0].total_calls_failed == 1
        assert telemetry.projects[0].credentials[1].total_calls_succeeded == 1


@pytest.mark.asyncio
async def test_gemini_llm_client_markdown_fence_cleaning(mock_key_manager):
    """Verify GeminiLLMClient strips markdown code fences from JSON output."""
    client = GeminiLLMClient(key_manager=mock_key_manager)

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": "```json\n{\"clean\": true, \"value\": 42}\n```"}]
                }
            }
        ]
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        res = await client.generate_json(prompt="Get data")
        assert res["clean"] is True
        assert res["value"] == 42
