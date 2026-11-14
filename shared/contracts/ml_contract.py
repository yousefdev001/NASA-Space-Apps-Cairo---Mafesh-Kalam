"""ML Service Request and Response Data Contracts.

Defines schemas for the 17 physiological telemetry features (7 real-time + 10 rolling)
and the anomaly prediction output.
"""

from datetime import datetime, timezone
import time
from typing import Any
from pydantic import BaseModel, Field, model_validator


class MLPredictRequest(BaseModel):
    """Telemetry input payload containing 17 physiological sensor metrics."""

    @model_validator(mode="before")
    @classmethod
    def populate_defaults_and_rolling(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "request_id" not in data or not data["request_id"]:
                data["request_id"] = f"REQ-AUTO-{int(time.time()*1000)}"
            if "astronaut_id" not in data or not data["astronaut_id"]:
                data["astronaut_id"] = "ASTRO-01"

            hr = float(data.get("heart_rate_bpm", 72.0))
            spo2 = float(data.get("spo2_percent", 98.0))
            temp = float(data.get("body_temperature_c", 36.8))
            rr = float(data.get("respiratory_rate_bpm", 14.0))
            hrv = float(data.get("hrv_rmssd_ms", 50.0))

            if "heart_rate_bpm_rolling_mean_60min" not in data:
                data["heart_rate_bpm_rolling_mean_60min"] = hr
            if "heart_rate_bpm_rolling_std_60min" not in data:
                data["heart_rate_bpm_rolling_std_60min"] = 3.0
            if "hrv_rmssd_ms_rolling_mean_60min" not in data:
                data["hrv_rmssd_ms_rolling_mean_60min"] = hrv
            if "hrv_rmssd_ms_rolling_std_60min" not in data:
                data["hrv_rmssd_ms_rolling_std_60min"] = 5.0
            if "spo2_percent_rolling_mean_60min" not in data:
                data["spo2_percent_rolling_mean_60min"] = spo2
            if "spo2_percent_rolling_std_60min" not in data:
                data["spo2_percent_rolling_std_60min"] = 1.0
            if "body_temperature_c_rolling_mean_60min" not in data:
                data["body_temperature_c_rolling_mean_60min"] = temp
            if "body_temperature_c_rolling_std_60min" not in data:
                data["body_temperature_c_rolling_std_60min"] = 0.3
            if "respiratory_rate_bpm_rolling_mean_60min" not in data:
                data["respiratory_rate_bpm_rolling_mean_60min"] = rr
            if "respiratory_rate_bpm_rolling_std_60min" not in data:
                data["respiratory_rate_bpm_rolling_std_60min"] = 2.0
        return data
    request_id: str = Field(
        ...,
        min_length=4,
        max_length=64,
        description="Unique telemetry request identifier"
    )
    astronaut_id: str = Field(
        ...,
        min_length=2,
        max_length=32,
        description="Unique crew member identifier"
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of the telemetry reading"
    )

    # 7 Real-time sensor metrics
    heart_rate_bpm: float = Field(
        ..., ge=20.0, le=250.0, description="Heart rate in BPM"
    )
    hrv_rmssd_ms: float = Field(
        ..., ge=0.0, le=300.0, description="Heart rate variability RMSSD in ms"
    )
    spo2_percent: float = Field(
        ..., ge=50.0, le=100.0, description="Blood oxygen saturation percentage"
    )
    body_temperature_c: float = Field(
        ..., ge=30.0, le=45.0, description="Core body temperature in Celsius"
    )
    respiratory_rate_bpm: float = Field(
        ..., ge=4.0, le=60.0, description="Respiratory rate in breaths/min"
    )
    systolic_bp_mmhg: float = Field(
        ..., ge=50.0, le=260.0, description="Systolic blood pressure in mmHg"
    )
    diastolic_bp_mmhg: float = Field(
        ..., ge=30.0, le=160.0, description="Diastolic blood pressure in mmHg"
    )

    # 10 Rolling 60-minute window statistics
    heart_rate_bpm_rolling_mean_60min: float = Field(
        ..., ge=20.0, le=250.0, description="Rolling mean HR over 60 min"
    )
    heart_rate_bpm_rolling_std_60min: float = Field(
        ..., ge=0.0, le=100.0, description="Rolling std HR over 60 min"
    )
    hrv_rmssd_ms_rolling_mean_60min: float = Field(
        ..., ge=0.0, le=300.0, description="Rolling mean HRV RMSSD over 60 min"
    )
    hrv_rmssd_ms_rolling_std_60min: float = Field(
        ..., ge=0.0, le=150.0, description="Rolling std HRV RMSSD over 60 min"
    )
    spo2_percent_rolling_mean_60min: float = Field(
        ..., ge=50.0, le=100.0, description="Rolling mean SpO2 over 60 min"
    )
    spo2_percent_rolling_std_60min: float = Field(
        ..., ge=0.0, le=30.0, description="Rolling std SpO2 over 60 min"
    )
    body_temperature_c_rolling_mean_60min: float = Field(
        ..., ge=30.0, le=45.0, description="Rolling mean body temp over 60 min"
    )
    body_temperature_c_rolling_std_60min: float = Field(
        ..., ge=0.0, le=10.0, description="Rolling std body temp over 60 min"
    )
    respiratory_rate_bpm_rolling_mean_60min: float = Field(
        ..., ge=4.0, le=60.0, description="Rolling mean respiratory rate over 60 min"
    )
    respiratory_rate_bpm_rolling_std_60min: float = Field(
        ..., ge=0.0, le=30.0, description="Rolling std respiratory rate over 60 min"
    )


class MLPredictResponse(BaseModel):
    """Output payload from ML anomaly detection microservice."""
    request_id: str = Field(..., description="Echoed request identifier")
    anomaly_label: int = Field(
        ..., ge=0, le=1, description="0 = Normal/Stable, 1 = Anomaly detected"
    )
    confidence_score: float = Field(
        ..., ge=0.0, le=1.0, description="Model decision confidence score"
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of the prediction"
    )
