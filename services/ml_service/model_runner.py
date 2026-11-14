"""ML Microservice Model Runner.

Loads trained NASA Spaceflight Multi-Hazard ML models (space_hazard_risk_classifier.joblib
and space_hazard_degradation_regressor.joblib) from models/space_hazards_ml/models/
and executes low-latency inference (< 30ms).
"""

import os
import joblib
import pandas as pd
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from shared.contracts.ml_contract import MLPredictRequest, MLPredictResponse


class MLModelRunner:
    """Inference engine managing trained NASA spaceflight hazard models."""

    def __init__(
        self,
        models_dir: Optional[str] = None
    ):
        if models_dir is None:
            # Default to models/space_hazards_ml/models
            base_project_dir = Path(__file__).resolve().parent.parent.parent
            self.models_dir = base_project_dir / "models" / "space_hazards_ml" / "models"
        else:
            self.models_dir = Path(models_dir)

        self.classifier = None
        self.regressor = None
        self._load_models()

    def _load_models(self):
        """Load trained classification and regression joblib artifacts."""
        clf_path = self.models_dir / "space_hazard_risk_classifier.joblib"
        reg_path = self.models_dir / "space_hazard_degradation_regressor.joblib"

        if clf_path.exists():
            self.classifier = joblib.load(clf_path)
        if reg_path.exists():
            self.regressor = joblib.load(reg_path)

    def is_ready(self) -> bool:
        """Check if models are loaded and ready for inference."""
        return self.classifier is not None and self.regressor is not None

    def _map_vitals_to_features(self, vitals: MLPredictRequest) -> Dict[str, Any]:
        """Map 17-feature physiological vitals into space hazard feature vector with sensible defaults."""
        # Baseline physiological stress approximation from HRV and HR
        # High HR (>100) and low HRV (<30ms) indicate acute physiological stress
        stress_val = 3.0
        if vitals.heart_rate_bpm > 100.0 or vitals.hrv_rmssd_ms < 30.0:
            stress_val = min(10.0, 3.0 + (vitals.heart_rate_bpm - 100.0) * 0.08 + (30.0 - vitals.hrv_rmssd_ms) * 0.1)

        # Baseline reaction time approximation
        reaction_time = 230.0
        if vitals.spo2_percent < 90.0:
            # Hypoxia causes severe cognitive reaction time latency
            reaction_time += (90.0 - vitals.spo2_percent) * 15.0

        # Elevated cabin CO2 approximation from respiratory rate
        ppCO2 = 2.0
        if vitals.respiratory_rate_bpm > 20.0:
            ppCO2 += (vitals.respiratory_rate_bpm - 20.0) * 0.15

        return {
            "mission_type": "LEO_ISS",
            "mission_elapsed_days": 90,
            "radiation_rate_uGy_day": 400.0,
            "shielding_thickness_g_cm2": 18.0,
            "spe_event_flag": 0,
            "radiation_cumulative_mSv": 30.0,
            "crew_size": 7,
            "daily_sleep_hours": 7.0,
            "pvt_reaction_time_ms": reaction_time,
            "stress_index": stress_val,
            "distance_million_km": 0.0004,
            "comm_latency_minutes": 0.0001,
            "evacuation_feasibility": 1.0,
            "gravity_g": 0.0,
            "daily_exercise_hours": 2.0,
            "bone_density_loss_pct": 1.5,
            "muscle_mass_loss_pct": 3.0,
            "cabin_ppCO2_mmHg": ppCO2,
            "cabin_acoustic_dBA": 60.0,
            "eclss_efficiency_pct": 95.0,
            "microbial_dysbiosis_index": 2.5
        }

    def predict_vitals(self, vitals: MLPredictRequest) -> MLPredictResponse:
        """Run ML anomaly prediction on incoming 17 physiological metrics.

        Returns:
        -------
        MLPredictResponse:
            anomaly_label (0 = Normal, 1 = Anomaly) and confidence_score.
        """
        if not self.is_ready():
            # If models not loaded, provide baseline statistical fallback
            is_anomaly = int(
                vitals.spo2_percent <= 92.0 or
                vitals.heart_rate_bpm >= 110.0 or
                vitals.heart_rate_bpm <= 45.0 or
                vitals.respiratory_rate_bpm >= 22.0
            )
            return MLPredictResponse(
                request_id=vitals.request_id,
                anomaly_label=is_anomaly,
                confidence_score=0.85
            )

        # Map to model feature input
        feature_dict = self._map_vitals_to_features(vitals)
        df_input = pd.DataFrame([feature_dict])

        # Model inference
        risk_code = int(self.classifier.predict(df_input)[0])
        risk_probs = self.classifier.predict_proba(df_input)[0]

        # Invariant physiological anomaly flag:
        # If SpO2 is dropping or extreme tachycardia/bradycardia, guarantee anomaly_label = 1
        acute_vital_violation = (
            vitals.spo2_percent <= 90.0 or
            vitals.heart_rate_bpm >= 120.0 or
            vitals.heart_rate_bpm <= 42.0 or
            vitals.respiratory_rate_bpm >= 26.0
        )

        if acute_vital_violation or risk_code in (1, 2):
            anomaly_label = 1
            # Confidence is probability of anomaly (moderate or critical)
            conf = float(risk_probs[1] + risk_probs[2]) if len(risk_probs) >= 3 else 0.95
            confidence = max(0.85, min(0.999, conf if not acute_vital_violation else 0.98))
        else:
            anomaly_label = 0
            confidence = float(risk_probs[0])

        return MLPredictResponse(
            request_id=vitals.request_id,
            anomaly_label=anomaly_label,
            confidence_score=round(confidence, 4)
        )

    def predict_hazard_full(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """Full space hazard risk classification and degradation regression inference."""
        if not self.is_ready():
            raise RuntimeError("ML Models are not loaded.")

        df_input = pd.DataFrame([telemetry])
        risk_code = int(self.classifier.predict(df_input)[0])
        risk_probs = self.classifier.predict_proba(df_input)[0]
        degradation_score = float(self.regressor.predict(df_input)[0])

        inv_mapping = {0: "Nominal_Low_Risk", 1: "Moderate_Risk", 2: "Critical_Risk"}
        predicted_risk = inv_mapping.get(risk_code, "Unknown")

        action_items = []
        if telemetry.get("radiation_cumulative_mSv", 0) > 250:
            action_items.append("CRITICAL: Approaching career radiation limits. Reorient storm shelter shielding.")
        if telemetry.get("bone_density_loss_pct", 0) > 5.0 or telemetry.get("muscle_mass_loss_pct", 0) > 8.0:
            action_items.append("ALERT: Significant musculoskeletal deconditioning. Increase ARED resistive exercise.")
        if telemetry.get("pvt_reaction_time_ms", 0) > 300 or telemetry.get("daily_sleep_hours", 8) < 5.5:
            action_items.append("WARNING: Cognitive fatigue and circadian desynchrony detected. Implement sleep hygiene protocol.")
        if telemetry.get("cabin_ppCO2_mmHg", 0) > 3.5:
            action_items.append("ENVIRONMENT: Elevated cabin CO2. Activate secondary CDRA scrubber to prevent hypercapnia.")
        if not action_items:
            action_items.append("STATUS OPTIMAL: All physiological telemetry within acceptable operational thresholds.")

        return {
            "predicted_risk_level": predicted_risk,
            "risk_probabilities": {
                "Nominal_Low_Risk": round(float(risk_probs[0]) * 100, 2),
                "Moderate_Risk": round(float(risk_probs[1]) * 100, 2),
                "Critical_Risk": round(float(risk_probs[2]) * 100, 2),
            },
            "predicted_degradation_score": round(degradation_score, 2),
            "clinical_countermeasures": action_items
        }


# Singleton runner instance
runner_instance = MLModelRunner()
