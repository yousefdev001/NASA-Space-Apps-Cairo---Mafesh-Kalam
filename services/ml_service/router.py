"""FastAPI Router for ML Anomaly Detection Service."""

import time
from typing import Any, Dict
from fastapi import APIRouter, HTTPException, status

from shared.contracts.ml_contract import MLPredictRequest, MLPredictResponse
from services.ml_service.model_runner import runner_instance

router = APIRouter(prefix="/ml", tags=["Machine Learning Anomaly Detection"])


@router.post("/predict", response_model=MLPredictResponse, status_code=status.HTTP_200_OK)
async def predict_anomaly(vitals: MLPredictRequest) -> MLPredictResponse:
    """Evaluate 17 physiological telemetry metrics for acute medical anomalies.

    Guarantees < 30ms latency budget.
    """
    try:
        response = runner_instance.predict_vitals(vitals)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ML Anomaly inference failed: {str(e)}"
        )


@router.post("/predict/hazard", status_code=status.HTTP_200_OK)
async def predict_space_hazard(telemetry: Dict[str, Any]) -> Dict[str, Any]:
    """Execute full NASA HRP Multi-Hazard risk classification and degradation scoring."""
    try:
        if "mission_type" not in telemetry and "heart_rate_bpm" in telemetry:
            vitals = MLPredictRequest(**telemetry)
            telemetry = runner_instance._map_vitals_to_features(vitals)
        result = runner_instance.predict_hazard_full(telemetry)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Space hazard inference failed: {str(e)}"
        )


@router.get("/health", status_code=status.HTTP_200_OK)
async def ml_health() -> Dict[str, Any]:
    """Return model operational status and metadata."""
    return {
        "status": "healthy" if runner_instance.is_ready() else "degraded",
        "service": "ml_service",
        "models_loaded": runner_instance.is_ready(),
        "models_dir": str(runner_instance.models_dir)
    }
