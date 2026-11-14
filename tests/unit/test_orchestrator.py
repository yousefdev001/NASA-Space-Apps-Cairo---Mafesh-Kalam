"""Unit and contract tests for AuraMed Unified Orchestration Gateway (Port 8000)."""

import os
import uuid
import pytest
from starlette.testclient import TestClient

from services.orchestrator.main import app
from shared.constants import SeverityLevel


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def sample_critical_telemetry():
    req_id = f"REQ-TEST-GW-{uuid.uuid4().hex[:8]}"
    return {
        "request_id": req_id,
        "astronaut_id": "ASTRO-GATEWAY-01",
        "vitals": {
            "request_id": req_id,
            "astronaut_id": "ASTRO-GATEWAY-01",
            "heart_rate_bpm": 130.0,
            "hrv_rmssd_ms": 28.0,
            "spo2_percent": 85.0,  # Critical SpO2 violation
            "body_temperature_c": 37.3,
            "respiratory_rate_bpm": 24.0,
            "systolic_bp_mmhg": 115.0,
            "diastolic_bp_mmhg": 72.0,
            "heart_rate_bpm_rolling_mean_60min": 76.0,
            "heart_rate_bpm_rolling_std_60min": 3.5,
            "hrv_rmssd_ms_rolling_mean_60min": 48.0,
            "hrv_rmssd_ms_rolling_std_60min": 4.2,
            "spo2_percent_rolling_mean_60min": 97.5,
            "spo2_percent_rolling_std_60min": 1.1,
            "body_temperature_c_rolling_mean_60min": 36.8,
            "body_temperature_c_rolling_std_60min": 0.2,
            "respiratory_rate_bpm_rolling_mean_60min": 15.0,
            "respiratory_rate_bpm_rolling_std_60min": 1.2,
        },
    }


def test_gateway_health_endpoint(client):
    """Verify gateway health monitoring probe."""
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "auramed-client-gateway"
    assert data["operating_mode"] in ("online", "offline", "degraded")


def test_gateway_root_endpoint(client):
    """Verify landing documentation endpoint redirects to chat UI."""
    res = client.get("/", follow_redirects=True)
    assert res.status_code == 200
    assert "AuraMed" in res.text
    assert "NASA Space Apps" in res.text


def test_unified_assess_astronaut_e2e(client, sample_critical_telemetry):
    """Verify full end-to-end telemetry evaluation through the unified client endpoint."""
    key = os.getenv("AURAMED_API_KEY", "auramed-secret-key-2026")
    headers = {"X-API-Key": key} if key else {}
    res = client.post("/api/v1/assess-astronaut", json=sample_critical_telemetry, headers=headers)
    assert res.status_code == 200

    data = res.json()
    assert data["request_id"] == sample_critical_telemetry["request_id"]
    assert data["astronaut_id"] == "ASTRO-GATEWAY-01"
    assert data["severity"] == SeverityLevel.CRITICAL.value
    assert data["operating_mode"] in ("online", "offline", "degraded")
    assert data["active_provider"] in ("cloud", "ollama", "extractive_fallback")

    # Verify ML Assessment payload
    assert "ml_assessment" in data
    assert isinstance(data["ml_assessment"]["anomaly_detected"], bool)
    assert data["ml_assessment"]["confidence_score"] >= 0.0

    # Verify Tier 1 Action Steps
    assert len(data["action_steps"]) >= 1
    assert data["action_steps"][0]["n"] == 1
    assert len(data["action_steps"][0]["source_chunk_id"]) > 0

    # Verify Flight Surgeon Escalation
    assert data["escalation"]["required"] is True
    assert data["escalation"]["target"] == "Flight Surgeon"

    # Verify Latency & Persistence metadata
    assert data["total_latency_ms"] > 0
    assert len(data["protocol_references"]) >= 1


def test_api_key_security_enforcement(client, monkeypatch, sample_critical_telemetry):
    """Verify that when AURAMED_API_KEY is configured, protected endpoints require valid key while public ones remain open."""
    test_key = "test-secret-key-12345"
    monkeypatch.setenv("AURAMED_API_KEY", test_key)
    monkeypatch.setenv("AURAMED_REQUIRE_AUTH", "true")

    # 1. Public endpoint (/health) must still pass without key
    res_health = client.get("/health")
    assert res_health.status_code == 200

    # 2. Protected endpoint without key must return 401
    res_no_key = client.post("/api/v1/assess-astronaut", json=sample_critical_telemetry)
    assert res_no_key.status_code == 401
    assert "Invalid or missing API Key" in res_no_key.json()["detail"]

    # 3. Protected endpoint with invalid key must return 401
    res_bad_key = client.post(
        "/api/v1/assess-astronaut",
        json=sample_critical_telemetry,
        headers={"X-API-Key": "wrong-key"}
    )
    assert res_bad_key.status_code == 401

    # 4. Protected endpoint with valid X-API-Key header must succeed (200)
    res_good_header = client.post(
        "/api/v1/assess-astronaut",
        json=sample_critical_telemetry,
        headers={"X-API-Key": test_key}
    )
    assert res_good_header.status_code == 200

    # 5. Protected endpoint with valid Bearer token must succeed (200)
    res_bearer = client.post(
        "/api/v1/assess-astronaut",
        json=sample_critical_telemetry,
        headers={"Authorization": f"Bearer {test_key}"}
    )
    assert res_bearer.status_code == 200

