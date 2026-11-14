import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath("."))

from shared.contracts.ml_contract import MLPredictRequest
from shared.rules.severity_engine import assess_vitals
from services.ml_service.model_runner import runner_instance
from services.orchestrator.contracts import AssessAstronautRequest

scenarios = [
    {
        "id": "SCN-01",
        "scenario_ar": "رائد فضاء في حالة استرخاء وراحة تامة (حالة طبيعية مستقرة)",
        "scenario_en": "Nominal Resting State (Healthy)",
        "expected_severity": "Normal",
        "expected_anomaly": 0,
        "vitals": {
            "request_id": "REQ-AURA-001",
            "astronaut_id": "ASTRO-101",
            "heart_rate_bpm": 68.0,
            "hrv_rmssd_ms": 58.0,
            "spo2_percent": 98.4,
            "body_temperature_c": 36.7,
            "respiratory_rate_bpm": 14.0,
            "systolic_bp_mmhg": 116.0,
            "diastolic_bp_mmhg": 74.0,
            "heart_rate_bpm_rolling_mean_60min": 67.5,
            "heart_rate_bpm_rolling_std_60min": 2.0,
            "hrv_rmssd_ms_rolling_mean_60min": 57.0,
            "hrv_rmssd_ms_rolling_std_60min": 3.5,
            "spo2_percent_rolling_mean_60min": 98.5,
            "spo2_percent_rolling_std_60min": 0.2,
            "body_temperature_c_rolling_mean_60min": 36.7,
            "body_temperature_c_rolling_std_60min": 0.08,
            "respiratory_rate_bpm_rolling_mean_60min": 14.2,
            "respiratory_rate_bpm_rolling_std_60min": 0.9
        }
    },
    {
        "id": "SCN-02",
        "scenario_ar": "نقص أكسجين حاد مفاجئ ناتج عن خلل في إمداد الأكسجين بكابينة المركبة أو البدلة",
        "scenario_en": "Acute Severe Hypoxia (Cabin/Suit O2 drop)",
        "expected_severity": "Critical",
        "expected_anomaly": 1,
        "vitals": {
            "request_id": "REQ-AURA-002",
            "astronaut_id": "ASTRO-101",
            "heart_rate_bpm": 126.0,
            "hrv_rmssd_ms": 24.0,
            "spo2_percent": 83.5,
            "body_temperature_c": 36.8,
            "respiratory_rate_bpm": 27.0,
            "systolic_bp_mmhg": 110.0,
            "diastolic_bp_mmhg": 68.0,
            "heart_rate_bpm_rolling_mean_60min": 95.0,
            "heart_rate_bpm_rolling_std_60min": 15.0,
            "hrv_rmssd_ms_rolling_mean_60min": 42.0,
            "hrv_rmssd_ms_rolling_std_60min": 8.0,
            "spo2_percent_rolling_mean_60min": 92.0,
            "spo2_percent_rolling_std_60min": 4.5,
            "body_temperature_c_rolling_mean_60min": 36.8,
            "body_temperature_c_rolling_std_60min": 0.1,
            "respiratory_rate_bpm_rolling_mean_60min": 20.0,
            "respiratory_rate_bpm_rolling_std_60min": 3.5
        }
    },
    {
        "id": "SCN-03",
        "scenario_ar": "تسارع نبض شديد واضطراب في النظم القلبي أثناء نشاط مكثف خارج المركبة (EVA)",
        "scenario_en": "Severe Tachycardia & Cardiac Strain",
        "expected_severity": "Critical",
        "expected_anomaly": 1,
        "vitals": {
            "request_id": "REQ-AURA-003",
            "astronaut_id": "ASTRO-102",
            "heart_rate_bpm": 148.0,
            "hrv_rmssd_ms": 16.0,
            "spo2_percent": 95.0,
            "body_temperature_c": 37.1,
            "respiratory_rate_bpm": 24.0,
            "systolic_bp_mmhg": 138.0,
            "diastolic_bp_mmhg": 88.0,
            "heart_rate_bpm_rolling_mean_60min": 120.0,
            "heart_rate_bpm_rolling_std_60min": 14.5,
            "hrv_rmssd_ms_rolling_mean_60min": 28.0,
            "hrv_rmssd_ms_rolling_std_60min": 6.0,
            "spo2_percent_rolling_mean_60min": 96.0,
            "spo2_percent_rolling_std_60min": 0.8,
            "body_temperature_c_rolling_mean_60min": 37.0,
            "body_temperature_c_rolling_std_60min": 0.15,
            "respiratory_rate_bpm_rolling_mean_60min": 21.0,
            "respiratory_rate_bpm_rolling_std_60min": 2.0
        }
    },
    {
        "id": "SCN-04",
        "scenario_ar": "انخفاض حرارة الجسم الحاد بسبب عطل في نظام التدفئة السائل لبدلة الفضاء (LCG)",
        "scenario_en": "Severe Hypothermia (Suit Heating Failure)",
        "expected_severity": "Critical",
        "expected_anomaly": 1,
        "vitals": {
            "request_id": "REQ-AURA-004",
            "astronaut_id": "ASTRO-103",
            "heart_rate_bpm": 48.0,
            "hrv_rmssd_ms": 68.0,
            "spo2_percent": 96.2,
            "body_temperature_c": 33.8,
            "respiratory_rate_bpm": 9.0,
            "systolic_bp_mmhg": 92.0,
            "diastolic_bp_mmhg": 56.0,
            "heart_rate_bpm_rolling_mean_60min": 58.0,
            "heart_rate_bpm_rolling_std_60min": 5.5,
            "hrv_rmssd_ms_rolling_mean_60min": 60.0,
            "hrv_rmssd_ms_rolling_std_60min": 5.0,
            "spo2_percent_rolling_mean_60min": 97.0,
            "spo2_percent_rolling_std_60min": 0.6,
            "body_temperature_c_rolling_mean_60min": 35.1,
            "body_temperature_c_rolling_std_60min": 0.85,
            "respiratory_rate_bpm_rolling_mean_60min": 12.0,
            "respiratory_rate_bpm_rolling_std_60min": 1.8
        }
    },
    {
        "id": "SCN-05",
        "scenario_ar": "إجهاد حراري شديد وارتفاع حرج في حرارة الجسم (ضربة حرارة) داخل بدلة الفضاء",
        "scenario_en": "Hyperthermia / Heat Exhaustion Crisis",
        "expected_severity": "Critical",
        "expected_anomaly": 1,
        "vitals": {
            "request_id": "REQ-AURA-005",
            "astronaut_id": "ASTRO-102",
            "heart_rate_bpm": 135.0,
            "hrv_rmssd_ms": 14.0,
            "spo2_percent": 94.0,
            "body_temperature_c": 40.1,
            "respiratory_rate_bpm": 29.0,
            "systolic_bp_mmhg": 126.0,
            "diastolic_bp_mmhg": 80.0,
            "heart_rate_bpm_rolling_mean_60min": 110.0,
            "heart_rate_bpm_rolling_std_60min": 12.0,
            "hrv_rmssd_ms_rolling_mean_60min": 25.0,
            "hrv_rmssd_ms_rolling_std_60min": 5.5,
            "spo2_percent_rolling_mean_60min": 95.5,
            "spo2_percent_rolling_std_60min": 1.0,
            "body_temperature_c_rolling_mean_60min": 38.6,
            "body_temperature_c_rolling_std_60min": 0.9,
            "respiratory_rate_bpm_rolling_mean_60min": 23.0,
            "respiratory_rate_bpm_rolling_std_60min": 3.0
        }
    },
    {
        "id": "SCN-06",
        "scenario_ar": "أزمة ارتفاع ضغط دم حاد ومفاجئ تهدد الأوعية الدماغية والقلبية",
        "scenario_en": "Hypertensive Emergency / Crisis",
        "expected_severity": "Critical",
        "expected_anomaly": 1,
        "vitals": {
            "request_id": "REQ-AURA-006",
            "astronaut_id": "ASTRO-104",
            "heart_rate_bpm": 96.0,
            "hrv_rmssd_ms": 22.0,
            "spo2_percent": 97.5,
            "body_temperature_c": 36.9,
            "respiratory_rate_bpm": 19.0,
            "systolic_bp_mmhg": 188.0,
            "diastolic_bp_mmhg": 118.0,
            "heart_rate_bpm_rolling_mean_60min": 88.0,
            "heart_rate_bpm_rolling_std_60min": 5.0,
            "hrv_rmssd_ms_rolling_mean_60min": 32.0,
            "hrv_rmssd_ms_rolling_std_60min": 4.5,
            "spo2_percent_rolling_mean_60min": 98.0,
            "spo2_percent_rolling_std_60min": 0.4,
            "body_temperature_c_rolling_mean_60min": 36.8,
            "body_temperature_c_rolling_std_60min": 0.1,
            "respiratory_rate_bpm_rolling_mean_60min": 17.0,
            "respiratory_rate_bpm_rolling_std_60min": 1.2
        }
    },
    {
        "id": "SCN-07",
        "scenario_ar": "تباطؤ حاد في نبضات القلب وانخفاض التروية الدموية (بطء قلب حرج)",
        "scenario_en": "Severe Bradycardia & Hypoperfusion",
        "expected_severity": "Critical",
        "expected_anomaly": 1,
        "vitals": {
            "request_id": "REQ-AURA-007",
            "astronaut_id": "ASTRO-101",
            "heart_rate_bpm": 38.0,
            "hrv_rmssd_ms": 75.0,
            "spo2_percent": 95.8,
            "body_temperature_c": 36.3,
            "respiratory_rate_bpm": 11.0,
            "systolic_bp_mmhg": 88.0,
            "diastolic_bp_mmhg": 54.0,
            "heart_rate_bpm_rolling_mean_60min": 52.0,
            "heart_rate_bpm_rolling_std_60min": 8.5,
            "hrv_rmssd_ms_rolling_mean_60min": 65.0,
            "hrv_rmssd_ms_rolling_std_60min": 6.0,
            "spo2_percent_rolling_mean_60min": 97.0,
            "spo2_percent_rolling_std_60min": 0.5,
            "body_temperature_c_rolling_mean_60min": 36.5,
            "body_temperature_c_rolling_std_60min": 0.15,
            "respiratory_rate_bpm_rolling_mean_60min": 13.0,
            "respiratory_rate_bpm_rolling_std_60min": 1.0
        }
    },
    {
        "id": "SCN-08",
        "scenario_ar": "ضيق تنفس وتسارع حرج في معدل التنفس ناتج عن تراكم ثاني أكسيد الكربون (Hypercapnia)",
        "scenario_en": "Tachypnea & Suspected CO2 Scrubbing Failure",
        "expected_severity": "Critical",
        "expected_anomaly": 1,
        "vitals": {
            "request_id": "REQ-AURA-008",
            "astronaut_id": "ASTRO-103",
            "heart_rate_bpm": 115.0,
            "hrv_rmssd_ms": 26.0,
            "spo2_percent": 91.5,
            "body_temperature_c": 37.2,
            "respiratory_rate_bpm": 32.0,
            "systolic_bp_mmhg": 132.0,
            "diastolic_bp_mmhg": 84.0,
            "heart_rate_bpm_rolling_mean_60min": 98.0,
            "heart_rate_bpm_rolling_std_60min": 9.0,
            "hrv_rmssd_ms_rolling_mean_60min": 35.0,
            "hrv_rmssd_ms_rolling_std_60min": 5.0,
            "spo2_percent_rolling_mean_60min": 94.5,
            "spo2_percent_rolling_std_60min": 1.8,
            "body_temperature_c_rolling_mean_60min": 37.0,
            "body_temperature_c_rolling_std_60min": 0.12,
            "respiratory_rate_bpm_rolling_mean_60min": 24.0,
            "respiratory_rate_bpm_rolling_std_60min": 4.2
        }
    },
    {
        "id": "SCN-09",
        "scenario_ar": "إجهاد بدني وتجفاف معتدل مع ارتفاع طفيف في النبض (مستوى تحذيري تنبيهي)",
        "scenario_en": "Moderate Dehydration & Physical Exertion (Warning)",
        "expected_severity": "Warning",
        "expected_anomaly": 1,
        "vitals": {
            "request_id": "REQ-AURA-009",
            "astronaut_id": "ASTRO-104",
            "heart_rate_bpm": 105.0,
            "hrv_rmssd_ms": 32.0,
            "spo2_percent": 96.5,
            "body_temperature_c": 37.6,
            "respiratory_rate_bpm": 19.0,
            "systolic_bp_mmhg": 104.0,
            "diastolic_bp_mmhg": 66.0,
            "heart_rate_bpm_rolling_mean_60min": 95.0,
            "heart_rate_bpm_rolling_std_60min": 6.0,
            "hrv_rmssd_ms_rolling_mean_60min": 38.0,
            "hrv_rmssd_ms_rolling_std_60min": 3.5,
            "spo2_percent_rolling_mean_60min": 97.2,
            "spo2_percent_rolling_std_60min": 0.4,
            "body_temperature_c_rolling_mean_60min": 37.3,
            "body_temperature_c_rolling_std_60min": 0.2,
            "respiratory_rate_bpm_rolling_mean_60min": 17.5,
            "respiratory_rate_bpm_rolling_std_60min": 1.1
        }
    },
    {
        "id": "SCN-10",
        "scenario_ar": "نشاط حركي روتيني مستقر داخل المحطة مع مؤشرات حيوية متزنة ومثالية",
        "scenario_en": "Nominal Active Routine (Stable Workload)",
        "expected_severity": "Normal",
        "expected_anomaly": 0,
        "vitals": {
            "request_id": "REQ-AURA-010",
            "astronaut_id": "ASTRO-102",
            "heart_rate_bpm": 78.0,
            "hrv_rmssd_ms": 48.0,
            "spo2_percent": 98.1,
            "body_temperature_c": 36.9,
            "respiratory_rate_bpm": 16.0,
            "systolic_bp_mmhg": 122.0,
            "diastolic_bp_mmhg": 78.0,
            "heart_rate_bpm_rolling_mean_60min": 76.0,
            "heart_rate_bpm_rolling_std_60min": 2.5,
            "hrv_rmssd_ms_rolling_mean_60min": 50.0,
            "hrv_rmssd_ms_rolling_std_60min": 3.0,
            "spo2_percent_rolling_mean_60min": 98.3,
            "spo2_percent_rolling_std_60min": 0.25,
            "body_temperature_c_rolling_mean_60min": 36.85,
            "body_temperature_c_rolling_std_60min": 0.09,
            "respiratory_rate_bpm_rolling_mean_60min": 15.5,
            "respiratory_rate_bpm_rolling_std_60min": 0.8
        }
    }
]

print("Verifying 10 scenarios...")
for scn in scenarios:
    v = scn["vitals"]
    v["timestamp"] = datetime.now(timezone.utc).isoformat()
    req = MLPredictRequest(**v)
    ml_res = runner_instance.predict_vitals(req)
    sev = assess_vitals(req, ml_res)
    
    # Check AssessAstronautRequest schema too
    assess_req = AssessAstronautRequest(
        request_id=v["request_id"],
        astronaut_id=v["astronaut_id"],
        vitals=req
    )
    
    print(f"[{scn['id']}] {scn['scenario_en']}:")
    print(f"   ML Anomaly: {ml_res.anomaly_label} (Conf: {ml_res.confidence_score:.2f}) | Sev: {sev.severity.value}")

# Save full rich format
with open("data/test_telemetry_10_readings.json", "w", encoding="utf-8") as f:
    json.dump(scenarios, f, indent=2, ensure_ascii=False)

# Save also a direct list of vitals (ready for direct POST /ml/predict)
vitals_only = [s["vitals"] for s in scenarios]
with open("data/sample_vitals_ml_predict.json", "w", encoding="utf-8") as f:
    json.dump(vitals_only, f, indent=2, ensure_ascii=False)

# Save unified assess requests (ready for POST /api/v1/assess-astronaut)
assess_requests = [
    {
        "request_id": s["vitals"]["request_id"],
        "astronaut_id": s["vitals"]["astronaut_id"],
        "timestamp": s["vitals"]["timestamp"],
        "vitals": s["vitals"]
    }
    for s in scenarios
]
with open("data/sample_assess_requests.json", "w", encoding="utf-8") as f:
    json.dump(assess_requests, f, indent=2, ensure_ascii=False)

print("\nFiles successfully created and verified!")
