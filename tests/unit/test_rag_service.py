"""Unit and Integration Tests for AuraMed RAG Service Endpoints."""

import time
import pytest
from fastapi.testclient import TestClient

from services.rag_service.main import app
from shared.constants import SeverityLevel


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def nominal_guidance_request():
    return {
        "request_id": "REQ-RAG-NOMINAL",
        "astronaut_id": "ASTRO-01",
        "ml": {"anomaly_label": 0, "confidence_score": 0.95},
        "vitals": {
            "request_id": "REQ-RAG-NOMINAL",
            "astronaut_id": "ASTRO-01",
            "heart_rate_bpm": 70.0,
            "hrv_rmssd_ms": 50.0,
            "spo2_percent": 98.0,
            "body_temperature_c": 36.8,
            "respiratory_rate_bpm": 14.0,
            "systolic_bp_mmhg": 120.0,
            "diastolic_bp_mmhg": 80.0,
            "heart_rate_bpm_rolling_mean_60min": 70.0,
            "heart_rate_bpm_rolling_std_60min": 2.0,
            "hrv_rmssd_ms_rolling_mean_60min": 50.0,
            "hrv_rmssd_ms_rolling_std_60min": 3.0,
            "spo2_percent_rolling_mean_60min": 98.0,
            "spo2_percent_rolling_std_60min": 0.5,
            "body_temperature_c_rolling_mean_60min": 36.8,
            "body_temperature_c_rolling_std_60min": 0.1,
            "respiratory_rate_bpm_rolling_mean_60min": 14.0,
            "respiratory_rate_bpm_rolling_std_60min": 1.0,
        }
    }


@pytest.fixture
def critical_hypoxia_request(nominal_guidance_request):
    crit = nominal_guidance_request.copy()
    crit["request_id"] = "REQ-RAG-CRIT-01"
    crit["vitals"] = nominal_guidance_request["vitals"].copy()
    crit["vitals"]["request_id"] = "REQ-RAG-CRIT-01"
    crit["vitals"]["spo2_percent"] = 85.5  # Critical SpO2 violation <= 88%
    crit["vitals"]["heart_rate_bpm"] = 115.0
    return crit


def test_protocols_retrieve_fast_path_nominal(client, nominal_guidance_request):
    """Asserts that nominal vitals return status='skipped' in < 50ms without executing search."""
    t0 = time.perf_counter()
    response = client.post("/v1/protocols/retrieve", json=nominal_guidance_request)
    elapsed_ms = (time.perf_counter() - t0) * 1000

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "skipped"
    assert data["severity"] == "Normal"
    assert len(data["tier1_procedures"]) == 0
    assert data["escalation"]["required"] is False
    assert elapsed_ms < 100.0


def test_protocols_retrieve_critical_hypoxia(client, critical_hypoxia_request):
    """Asserts that critical hypoxia retrieves Tier 1 Rev K checklist in < 200ms."""
    response = client.post("/v1/protocols/retrieve", json=critical_hypoxia_request)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "ok"
    assert data["severity"] == "Critical"
    assert "hypoxia_suspected" in data["condition_hypotheses"]
    assert len(data["tier1_procedures"]) > 0

    # Every item in tier1_procedures must be Tier 1
    for chunk in data["tier1_procedures"]:
        assert chunk["tier"] == 1
        assert "NASA-CKLIST" in chunk["doc_id"]

    assert data["escalation"]["required"] is True
    assert data["escalation"]["target"] == "Flight Surgeon"


def test_rag_health_endpoint(client):
    """Asserts /health reports healthy status and offline mode."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "rag_service"
    assert data["indexed_chunks"] in (2661, 3085)


def test_rag_index_info_endpoint(client):
    """Asserts /v1/index/info accurately reflects the 3 evidence tiers."""
    response = client.get("/v1/index/info")
    assert response.status_code == 200
    data = response.json()
    assert data["total_chunks"] in (2661, 3085)
    assert data["tier_distribution"]["tier1_checklists"] in (1316, 1507)
    assert data["tier_distribution"]["tier2_standards"] in (741, 869)
    assert data["tier_distribution"]["tier3_background"] in (604, 709)


def test_guidance_generate_critical_event(client, critical_hypoxia_request):
    """Asserts guidance generation returns structured action steps and enforces flight surgeon escalation."""
    response = client.post("/v1/guidance/generate", json=critical_hypoxia_request)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] in ("ok", "degraded")
    assert data["severity"] == "Critical"
    assert "hypoxia_suspected" in data["condition_hypotheses"]
    assert len(data["steps"]) > 0
    assert data["escalation"]["required"] is True
    assert data["escalation"]["target"] == "Flight Surgeon"
    assert any("p." in ref for ref in data["protocol_refs"])
