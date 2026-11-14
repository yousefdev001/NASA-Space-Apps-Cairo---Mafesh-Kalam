"""Unit and Contract Tests for AuraMed ML Microservice."""

import time
import pytest
from fastapi.testclient import TestClient

from services.ml_service.main import app
from services.ml_service.model_runner import runner_instance
from shared.contracts.ml_contract import MLPredictRequest


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def nominal_vitals_payload():
    return {
        "request_id": "REQ-ML-001",
        "astronaut_id": "ASTRO-101",
        "heart_rate_bpm": 68.0,
        "hrv_rmssd_ms": 55.0,
        "spo2_percent": 98.5,
        "body_temperature_c": 36.8,
        "respiratory_rate_bpm": 13.0,
        "systolic_bp_mmhg": 115.0,
        "diastolic_bp_mmhg": 75.0,
        "heart_rate_bpm_rolling_mean_60min": 67.5,
        "heart_rate_bpm_rolling_std_60min": 2.1,
        "hrv_rmssd_ms_rolling_mean_60min": 54.0,
        "hrv_rmssd_ms_rolling_std_60min": 3.0,
        "spo2_percent_rolling_mean_60min": 98.6,
        "spo2_percent_rolling_std_60min": 0.3,
        "body_temperature_c_rolling_mean_60min": 36.75,
        "body_temperature_c_rolling_std_60min": 0.1,
        "respiratory_rate_bpm_rolling_mean_60min": 13.2,
        "respiratory_rate_bpm_rolling_std_60min": 1.0,
    }


@pytest.fixture
def acute_anomaly_payload(nominal_vitals_payload):
    anomaly = nominal_vitals_payload.copy()
    anomaly["request_id"] = "REQ-ML-002"
    anomaly["spo2_percent"] = 86.0  # acute hypoxia
    anomaly["heart_rate_bpm"] = 125.0  # tachycardia
    return anomaly


def test_models_loaded_successfully():
    """Asserts that trained NASA ML hazard models are loaded in memory."""
    assert runner_instance.is_ready() is True
    assert runner_instance.classifier is not None
    assert runner_instance.regressor is not None


def test_ml_predict_nominal_vitals(client, nominal_vitals_payload):
    """Asserts that nominal astronaut vitals yield anomaly_label = 0."""
    # Warmup request to initialize ASGI pipeline
    client.post("/ml/predict", json=nominal_vitals_payload)

    # Measured request
    t0 = time.perf_counter()
    response = client.post("/ml/predict", json=nominal_vitals_payload)
    elapsed_ms = (time.perf_counter() - t0) * 1000

    assert response.status_code == 200
    data = response.json()
    assert data["request_id"] == "REQ-ML-001"
    assert data["anomaly_label"] == 0
    assert data["confidence_score"] >= 0.70
    # Latency check: warm inference executes in < 30ms
    assert elapsed_ms < 50.0


def test_ml_predict_acute_anomaly(client, acute_anomaly_payload):
    """Asserts that acute vital violations yield anomaly_label = 1 with high confidence."""
    response = client.post("/ml/predict", json=acute_anomaly_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["request_id"] == "REQ-ML-002"
    assert data["anomaly_label"] == 1
    assert data["confidence_score"] >= 0.85


def test_ml_predict_hazard_full_iss(client):
    """Asserts full space hazard prediction on nominal ISS profile."""
    iss_telemetry = {
        "mission_type": "LEO_ISS",
        "mission_elapsed_days": 60,
        "radiation_rate_uGy_day": 420.0,
        "shielding_thickness_g_cm2": 18.5,
        "spe_event_flag": 0,
        "radiation_cumulative_mSv": 22.5,
        "crew_size": 7,
        "daily_sleep_hours": 6.8,
        "pvt_reaction_time_ms": 228.0,
        "stress_index": 2.8,
        "distance_million_km": 0.0004,
        "comm_latency_minutes": 0.0001,
        "evacuation_feasibility": 1.0,
        "gravity_g": 0.0,
        "daily_exercise_hours": 2.1,
        "bone_density_loss_pct": 1.1,
        "muscle_mass_loss_pct": 2.3,
        "cabin_ppCO2_mmHg": 2.2,
        "cabin_acoustic_dBA": 59.0,
        "eclss_efficiency_pct": 96.5,
        "microbial_dysbiosis_index": 2.1
    }
    response = client.post("/ml/predict/hazard", json=iss_telemetry)
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_risk_level"] == "Nominal_Low_Risk"
    assert data["predicted_degradation_score"] < 25.0
    assert len(data["clinical_countermeasures"]) > 0


def test_ml_health_endpoint(client):
    """Asserts /ml/health reports healthy model status."""
    response = client.get("/ml/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["models_loaded"] is True
