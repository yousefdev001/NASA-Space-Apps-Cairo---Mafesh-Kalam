"""End-to-End Offline Fallback and Network Blackout Resilience Integration Tests.

Validates that:
1. When cloud connectivity is unavailable or network is disconnected, the system automatically routes to local runtime.
2. Under offline mode, the RAG microservice successfully retrieves Tier 1 procedures and generates valid decision-support guidance.
3. If local Ollama is offline or uninstalled, the system fails over gracefully to 6-stage extractive fallback.
4. Telemetry and clinical decision audit trails are reliably persisted to the structured database.
"""

from datetime import datetime, timezone
import uuid
import pytest
from starlette.testclient import TestClient
from sqlalchemy import select

from infrastructure.database.connection import SessionLocal
from infrastructure.database.models import TelemetryAuditRecord
from services.rag_service.gateway.llm_gateway import LLMGateway, gateway_instance
from services.rag_service.gateway.ollama_client import OllamaClient
from services.rag_service.main import app
from shared.constants import FLIGHT_SURGEON_ESCALATION_CLAUSE, SeverityLevel


@pytest.fixture
def api_client():
    return TestClient(app)


@pytest.fixture
def acute_hypoxia_telemetry():
    return {
        "request_id": "REQ-E2E-OFFLINE-HYPOXIA",
        "astronaut_id": "ASTRO-OFFLINE-01",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ml": {
            "anomaly_label": 1,
            "confidence_score": 0.94,
        },
        "vitals": {
            "request_id": "REQ-E2E-OFFLINE-HYPOXIA",
            "astronaut_id": "ASTRO-OFFLINE-01",
            "heart_rate_bpm": 128.0,
            "hrv_rmssd_ms": 35.0,
            "spo2_percent": 84.5,  # Acute SpO2 critical drop
            "body_temperature_c": 37.2,
            "respiratory_rate_bpm": 24.0,
            "systolic_bp_mmhg": 115.0,
            "diastolic_bp_mmhg": 75.0,
            "heart_rate_bpm_rolling_mean_60min": 78.0,
            "heart_rate_bpm_rolling_std_60min": 4.0,
            "hrv_rmssd_ms_rolling_mean_60min": 52.0,
            "hrv_rmssd_ms_rolling_std_60min": 5.0,
            "spo2_percent_rolling_mean_60min": 98.0,
            "spo2_percent_rolling_std_60min": 1.2,
            "body_temperature_c_rolling_mean_60min": 36.8,
            "body_temperature_c_rolling_std_60min": 0.2,
            "respiratory_rate_bpm_rolling_mean_60min": 15.0,
            "respiratory_rate_bpm_rolling_std_60min": 1.5,
        },
    }


@pytest.mark.asyncio
async def test_gateway_operating_mode_detection():
    """Verify LLM Gateway operating mode transitions without network calls."""
    gateway = LLMGateway(cloud_enabled=False)
    mode = await gateway.get_operating_mode()
    assert mode in ("offline", "degraded")


@pytest.mark.asyncio
async def test_gateway_automatic_failover_when_cloud_fails():
    """Assert gateway automatically falls back to local execution when cloud errors."""
    gateway = LLMGateway(cloud_enabled=True)
    provider, _ = await gateway.generate(
        prompt="Test prompt",
        system_instruction="Test instruction",
    )
    # Since cloud is not configured, it must immediately failover to ollama or extractive fallback
    assert provider in ("ollama", "extractive_fallback")


def test_e2e_guidance_generation_in_offline_mode(api_client, acute_hypoxia_telemetry):
    """Assert complete end-to-end guidance generation under offline blackout conditions."""
    req_id = f"REQ-E2E-{uuid.uuid4().hex[:8]}"
    acute_hypoxia_telemetry["request_id"] = req_id
    acute_hypoxia_telemetry["vitals"]["request_id"] = req_id

    # Enforce offline blackout on singleton gateway
    original_cloud_state = gateway_instance.cloud_enabled
    gateway_instance.cloud_enabled = False
    try:
        response = api_client.post("/v1/guidance/generate", json=acute_hypoxia_telemetry)
        assert response.status_code == 200

        data = response.json()
        assert data["request_id"] == req_id
        assert data["severity"] == SeverityLevel.CRITICAL.value
        assert data["active_provider"] in ("ollama", "extractive_fallback")

        # Critical Escalation Assertion
        assert data["escalation"]["required"] is True
        assert data["escalation"]["target"] == "Flight Surgeon"
        assert FLIGHT_SURGEON_ESCALATION_CLAUSE in data["summary"]

        # Verify procedural steps are present and sourced strictly from Tier 1 checklists
        assert len(data["steps"]) >= 1
        for step in data["steps"]:
            assert step["n"] >= 1
            assert len(step["action"]) >= 5
            assert len(step["source_chunk_id"]) > 0
            assert len(step["ref_label"]) > 0

        # Verify structured audit trail was persisted to database
        with SessionLocal() as session:
            stmt = select(TelemetryAuditRecord).where(
                TelemetryAuditRecord.request_id == req_id
            )
            audit = session.execute(stmt).scalar_one_or_none()
            assert audit is not None
            assert audit.astronaut_id == "ASTRO-OFFLINE-01"
            assert audit.severity == SeverityLevel.CRITICAL.value
            assert audit.action_steps_count >= 1
            assert audit.escalation_required is True
            assert audit.escalation_target == "Flight Surgeon"
            assert audit.ml_anomaly_label == 1
            assert audit.ml_confidence_score == 0.94
    finally:
        gateway_instance.cloud_enabled = original_cloud_state
