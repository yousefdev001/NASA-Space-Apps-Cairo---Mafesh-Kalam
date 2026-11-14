"""Unit and integration tests for Conversational RAG Chat Endpoint and Web UI."""

import pytest
from starlette.testclient import TestClient

from services.rag_service.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_chat_html_ui_renders(client):
    """Verify GET /chat serves the interactive web interface."""
    res = client.get("/chat")
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]
    assert "AuraMed" in res.text
    assert "NASA Space Apps" in res.text
    assert "Quick-Don" in res.text or "Golden Scenarios" in res.text


def test_chat_post_endpoint_hypoxia(client):
    """Verify POST /v1/chat evaluates natural language clinical inquiries."""
    payload = {
        "query": "Astronaut exhibiting severe hypoxia with SpO2 dropping to 85% in airlock.",
        "astronaut_id": "ASTRO-CHAT-01",
    }
    res = client.post("/v1/chat", json=payload)
    assert res.status_code == 200

    data = res.json()
    assert data["severity"] == "Critical"
    assert "hypoxia" in data["query"].lower()
    assert len(data["summary"]) > 10
    assert data["escalation"]["required"] is True
    assert data["escalation"]["target"] == "Flight Surgeon"
    assert len(data["action_steps"]) >= 1
    assert "sources" in data
    assert len(data["sources"]) >= 1
    assert "chunk_id" in data["sources"][0]
    assert data["active_provider"] in ("cloud", "gemini", "groq", "ollama", "extractive_fallback")


def test_copilot_system_instructions_contain_4_pillars():
    """Verify AURAMED_COPILOT_CHAT_INSTRUCTIONS enforces the 4-pillar clinical framework."""
    from shared.system_prompts import AURAMED_COPILOT_CHAT_INSTRUCTIONS
    
    assert "Telemetry & ML" in AURAMED_COPILOT_CHAT_INSTRUCTIONS
    assert "Prioritized Triage" in AURAMED_COPILOT_CHAT_INSTRUCTIONS
    assert "Microgravity Considerations" in AURAMED_COPILOT_CHAT_INSTRUCTIONS
    assert "Flight Surgeon Directives" in AURAMED_COPILOT_CHAT_INSTRUCTIONS
    assert "CMRS" in AURAMED_COPILOT_CHAT_INSTRUCTIONS
    assert "Fluid Dynamics" in AURAMED_COPILOT_CHAT_INSTRUCTIONS


def test_chat_html_ui_includes_markdown_formatter(client):
    """Verify GET /chat includes client-side markdown formatting for structured copilot responses."""
    res = client.get("/chat")
    assert res.status_code == 200
    assert "formatMarkdownToHtml" in res.text


def test_classify_query_intent_helper():
    """Verify intent classifier correctly isolates conversational vs emergency inquiries."""
    from services.rag_service.routers.chat import classify_query_intent

    # Conversational cases
    assert classify_query_intent("Hello AuraMed, how are you today?", {}) is False
    assert classify_query_intent("What is space adaptation syndrome?", {}) is False
    assert classify_query_intent("Who are you and what is your mission?", {}) is False
    assert classify_query_intent("How do astronauts sleep in microgravity?", {}) is False

    # Emergency / Protocol cases
    assert classify_query_intent("Astronaut exhibiting severe hypoxia in airlock", {}) is True
    assert classify_query_intent("Request cardiac arrest resuscitation protocol", {}) is True
    assert classify_query_intent("Crew member experiencing acute shortness of breath and hypoxia", {}) is True
    assert classify_query_intent("What is the operational procedure for emergency decompression?", {}) is True
    assert classify_query_intent("Nominal vitals check", {"spo2_percent": 84.0}) is True  # abnormal vital


@pytest.mark.asyncio
async def test_chat_conversational_response_mocked(monkeypatch):
    """Verify that a conversational query returns is_protocol=False and empty action_steps without fallback."""
    from services.rag_service.routers.chat import chat_with_auramed, ChatMessageRequest
    from services.rag_service.gateway.llm_gateway import gateway_instance

    async def mock_generate(*args, **kwargs):
        return "cloud", {
            "system": "AuraMed",
            "status": "CONVERSATIONAL",
            "emergency_assessment": {
                "evidence_summary": "Hello astronaut! Microgravity causes cephalad fluid shifts toward the head and chest. I am here to assist and support you.",
                "reported_situation": "General inquiry",
                "reported_symptoms": [],
            },
            "steps": [],
            "sources": [],
            "escalation_required": False,
            "escalation_reason": "General conversational query",
        }

    monkeypatch.setattr(gateway_instance, "generate", mock_generate)

    req = ChatMessageRequest(query="Hello AuraMed, how does microgravity affect bodily fluids?")
    res = await chat_with_auramed(req)

    assert res.is_protocol is False
    assert res.severity == "Normal"
    assert len(res.action_steps) == 0
    assert "Microgravity" in res.summary
    assert res.escalation.required is False
    assert res.ml_insights is None
    assert len(res.sources) == 0


@pytest.mark.asyncio
async def test_chat_conversational_fallback_no_protocol_dump(monkeypatch):
    """Verify that even when LLM fails, conversational query returns polite conversational fallback without dumping Tier 1 protocol steps."""
    from services.rag_service.routers.chat import chat_with_auramed, ChatMessageRequest
    from services.rag_service.gateway.llm_gateway import gateway_instance

    async def mock_fail(*args, **kwargs):
        return "extractive_fallback", {}

    monkeypatch.setattr(gateway_instance, "generate", mock_fail)

    req = ChatMessageRequest(query="Hello AuraMed how are you?")
    res = await chat_with_auramed(req)

    assert res.is_protocol is False
    assert res.severity == "Normal"
    assert len(res.action_steps) == 0
    assert "AuraMed" in res.summary
    assert "Flight Surgeon" in res.summary
    assert "DEGRADED MODE EXTRACTIVE FALLBACK" not in res.summary
    assert res.escalation.required is False
    assert len(res.sources) == 0




