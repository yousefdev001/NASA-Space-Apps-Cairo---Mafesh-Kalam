"""Unit and integration tests for Groq Cloud LLM Client and Gateway Failover."""

import pytest
from unittest.mock import AsyncMock, patch

from services.rag_service.gateway.groq_client import GroqClient
from services.rag_service.gateway.llm_gateway import LLMGateway
from services.rag_service.gateway.ollama_client import OllamaClient


def test_groq_client_configuration():
    """Verify GroqClient detects valid API key and endpoint configuration."""
    client = GroqClient(api_key="gsk_test123456789")
    assert client.is_configured() is True
    assert client.model in ("openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.8-27b")


@pytest.mark.asyncio
async def test_groq_client_live_inference():
    """Verify real inference against Groq Cloud API with openai/gpt-oss-120b."""
    client = GroqClient()
    if not client.is_configured():
        pytest.skip("Groq API key not configured in environment.")

    prompt = (
        "Return a JSON object with: 'status': 'ok', 'model': 'gpt-oss-120b', "
        "'message': 'Ready for NASA Space Apps guidance'."
    )
    result = await client.generate_json(
        prompt=prompt,
        system_instruction="You are an AI assistant. Output valid JSON strictly.",
    )

    assert isinstance(result, dict)
    assert result.get("status") == "ok"
    assert "NASA" in result.get("message", "") or "Ready" in result.get("message", "")


@pytest.mark.asyncio
async def test_llm_gateway_cloud_routing():
    """Assert LLM Gateway selects Cloud provider when configured and healthy."""
    mock_cloud = AsyncMock()
    mock_cloud.is_configured.return_value = True
    mock_cloud.generate_json.return_value = {"status": "ok", "summary": "Cloud guidance"}

    gateway = LLMGateway(
        cloud_client=mock_cloud,
        cloud_enabled=True,
    )

    provider, res = await gateway.generate(prompt="Test prompt")
    assert provider == "cloud"
    assert res["summary"] == "Cloud guidance"


@pytest.mark.asyncio
async def test_llm_gateway_automatic_failover_to_ollama():
    """Assert LLM Gateway falls back to local Ollama when Cloud call raises an exception."""
    mock_cloud = AsyncMock()
    mock_cloud.is_configured.return_value = True
    mock_cloud.generate_json.side_effect = TimeoutError("Connection to Groq timed out")

    mock_ollama = AsyncMock()
    mock_ollama.generate_json.return_value = {"status": "ok", "summary": "Ollama local guidance"}

    gateway = LLMGateway(
        cloud_client=mock_cloud,
        ollama_client=mock_ollama,
        cloud_enabled=True,
    )

    provider, res = await gateway.generate(prompt="Emergency prompt")
    assert provider == "ollama"
    assert res["summary"] == "Ollama local guidance"
