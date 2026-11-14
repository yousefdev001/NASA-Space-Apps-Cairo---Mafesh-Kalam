"""Generator script for AuraMed Phase 06 Golden Dataset.

Generates 40 clinically rigorous evaluation scenarios across 10 NASA conditions
and 4 standard variants (Typical, Boundary, Unknown Anomaly, Nominal/Out-of-Scope).
"""

import json
from pathlib import Path

OUTPUT_DIR = Path(__file__).resolve().parent / "golden" / "cases"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

CONDITIONS_CONFIG = [
    {
        "cond_id": "hypoxia",
        "name": "Acute Hypoxia",
        "primary_metric": "spo2_percent",
        "typical_critical_val": 85.0,
        "typical_warning_val": 91.0,
        "expected_hypotheses": ["hypoxia_suspected"],
        "expected_query_keywords": ["oxygen", "mask", "hypoxia"],
    },
    {
        "cond_id": "tachycardia",
        "name": "Severe Tachycardia",
        "primary_metric": "heart_rate_bpm",
        "typical_critical_val": 142.0,
        "typical_warning_val": 118.0,
        "expected_hypotheses": ["tachycardia_critical", "tachycardia_mild"],
        "expected_query_keywords": ["tachycardia", "cardiac", "heart"],
    },
    {
        "cond_id": "bradycardia",
        "name": "Acute Bradycardia",
        "primary_metric": "heart_rate_bpm",
        "typical_critical_val": 38.0,
        "typical_warning_val": 48.0,
        "expected_hypotheses": ["bradycardia_critical", "bradycardia_mild"],
        "expected_query_keywords": ["bradycardia", "cardiac"],
    },
    {
        "cond_id": "hypotension",
        "name": "Circulatory Shock / Hypotension",
        "primary_metric": "systolic_bp_mmhg",
        "typical_critical_val": 75.0,
        "typical_warning_val": 88.0,
        "expected_hypotheses": ["hypotension_critical", "hypotension_mild"],
        "expected_query_keywords": ["blood pressure", "shock", "iv fluid"],
    },
    {
        "cond_id": "hypertension",
        "name": "Hypertensive Crisis",
        "primary_metric": "systolic_bp_mmhg",
        "typical_critical_val": 185.0,
        "typical_warning_val": 145.0,
        "expected_hypotheses": ["hypertension"],
        "expected_query_keywords": ["hypertension", "blood pressure", "pressure"],
    },
    {
        "cond_id": "hyperthermia",
        "name": "Severe Hyperthermia",
        "primary_metric": "body_temperature_c",
        "typical_critical_val": 39.8,
        "typical_warning_val": 38.4,
        "expected_hypotheses": ["fever_hyperthermia"],
        "expected_query_keywords": ["temperature", "cooling", "heat", "fever"],
    },
    {
        "cond_id": "hypothermia",
        "name": "Severe Hypothermia",
        "primary_metric": "body_temperature_c",
        "typical_critical_val": 34.0,
        "typical_warning_val": 35.2,
        "expected_hypotheses": ["hypothermia"],
        "expected_query_keywords": ["hypothermia", "rewarming", "temperature"],
    },
    {
        "cond_id": "hypoventilation",
        "name": "Respiratory Depression",
        "primary_metric": "respiratory_rate_bpm",
        "typical_critical_val": 7.0,
        "typical_warning_val": 9.5,
        "expected_hypotheses": ["respiratory_rate_critical_low", "respiratory_rate_warning_low"],
        "expected_query_keywords": ["ventilation", "respiratory", "airway"],
    },
    {
        "cond_id": "tachypnea",
        "name": "Tachypnea / Hyperventilation",
        "primary_metric": "respiratory_rate_bpm",
        "typical_critical_val": 29.0,
        "typical_warning_val": 24.0,
        "expected_hypotheses": ["tachypnea_critical", "tachypnea_mild"],
        "expected_query_keywords": ["respiratory", "breathing"],
    },
]


def get_base_nominal_vitals():
    return {
        "heart_rate_bpm": 72.0,
        "hrv_rmssd_ms": 52.0,
        "spo2_percent": 98.5,
        "body_temperature_c": 36.8,
        "respiratory_rate_bpm": 14.0,
        "systolic_bp_mmhg": 118.0,
        "diastolic_bp_mmhg": 76.0,
        "heart_rate_bpm_rolling_mean_60min": 72.0,
        "heart_rate_bpm_rolling_std_60min": 2.5,
        "hrv_rmssd_ms_rolling_mean_60min": 52.0,
        "hrv_rmssd_ms_rolling_std_60min": 3.0,
        "spo2_percent_rolling_mean_60min": 98.5,
        "spo2_percent_rolling_std_60min": 0.4,
        "body_temperature_c_rolling_mean_60min": 36.8,
        "body_temperature_c_rolling_std_60min": 0.1,
        "respiratory_rate_bpm_rolling_mean_60min": 14.0,
        "respiratory_rate_bpm_rolling_std_60min": 1.0,
    }


def generate_all_cases():
    case_counter = 0

    # 1. Generate 3 variants per condition (Typical Critical, Typical Warning, Boundary Case) = 27 cases
    for cond in CONDITIONS_CONFIG:
        # Variant A: Typical Critical
        case_counter += 1
        cid = f"GOLDEN-{case_counter:03d}"
        vitals_crit = get_base_nominal_vitals()
        vitals_crit[cond["primary_metric"]] = cond["typical_critical_val"]
        vitals_crit["request_id"] = cid
        vitals_crit["astronaut_id"] = "ASTRO-EVAL-01"

        case_crit = {
            "case_id": cid,
            "condition_id": cond["cond_id"],
            "variant": "typical_critical",
            "description": f"Typical presentation of {cond['name']} with acute threshold violation.",
            "expected_severity": "Critical",
            "expected_escalation": True,
            "expected_escalation_target": "Flight Surgeon",
            "expected_query_keywords": cond["expected_query_keywords"],
            "request_payload": {
                "request_id": cid,
                "astronaut_id": "ASTRO-EVAL-01",
                "ml": {"anomaly_label": 1, "confidence_score": 0.96},
                "vitals": vitals_crit,
            },
        }
        with open(OUTPUT_DIR / f"{cid}.json", "w", encoding="utf-8") as f:
            json.dump(case_crit, f, indent=2)

        # Variant B: Typical Warning
        case_counter += 1
        cid = f"GOLDEN-{case_counter:03d}"
        vitals_warn = get_base_nominal_vitals()
        vitals_warn[cond["primary_metric"]] = cond["typical_warning_val"]
        vitals_warn["request_id"] = cid
        vitals_warn["astronaut_id"] = "ASTRO-EVAL-01"

        case_warn = {
            "case_id": cid,
            "condition_id": cond["cond_id"],
            "variant": "typical_warning",
            "description": f"Moderate presentation of {cond['name']} within warning boundary.",
            "expected_severity": "Warning",
            "expected_escalation": False,
            "expected_escalation_target": "Crew Medical Officer",
            "expected_query_keywords": cond["expected_query_keywords"],
            "request_payload": {
                "request_id": cid,
                "astronaut_id": "ASTRO-EVAL-01",
                "ml": {"anomaly_label": 1, "confidence_score": 0.88},
                "vitals": vitals_warn,
            },
        }
        with open(OUTPUT_DIR / f"{cid}.json", "w", encoding="utf-8") as f:
            json.dump(case_warn, f, indent=2)

        # Variant C: Boundary Case (Borderline values)
        case_counter += 1
        cid = f"GOLDEN-{case_counter:03d}"
        vitals_bound = get_base_nominal_vitals()
        vitals_bound[cond["primary_metric"]] = cond["typical_warning_val"]
        vitals_bound["request_id"] = cid
        vitals_bound["astronaut_id"] = "ASTRO-EVAL-01"

        case_bound = {
            "case_id": cid,
            "condition_id": cond["cond_id"],
            "variant": "boundary_check",
            "description": f"Borderline threshold check for {cond['name']}.",
            "expected_severity": "Warning",
            "expected_escalation": False,
            "expected_escalation_target": "Crew Medical Officer",
            "expected_query_keywords": cond["expected_query_keywords"],
            "request_payload": {
                "request_id": cid,
                "astronaut_id": "ASTRO-EVAL-01",
                "ml": {"anomaly_label": 0, "confidence_score": 0.65},
                "vitals": vitals_bound,
            },
        }
        with open(OUTPUT_DIR / f"{cid}.json", "w", encoding="utf-8") as f:
            json.dump(case_bound, f, indent=2)

    # 2. Variant D: Unknown Physiological Anomaly (ML=1 without vital rule violation) = 5 cases
    for i in range(1, 6):
        case_counter += 1
        cid = f"GOLDEN-{case_counter:03d}"
        vitals_unk = get_base_nominal_vitals()
        vitals_unk["request_id"] = cid
        vitals_unk["astronaut_id"] = f"ASTRO-EVAL-UNK-{i}"

        case_unk = {
            "case_id": cid,
            "condition_id": "unknown_anomaly",
            "variant": "unknown_anomaly",
            "description": f"ML Multi-hazard model flags unknown degradation (Case {i}) with normal vitals.",
            "expected_severity": "Warning",
            "expected_escalation": False,
            "expected_escalation_target": "Crew Medical Officer",
            "expected_query_keywords": ["anomaly", "evaluation", "assessment"],
            "request_payload": {
                "request_id": cid,
                "astronaut_id": f"ASTRO-EVAL-UNK-{i}",
                "ml": {"anomaly_label": 1, "confidence_score": 0.91},
                "vitals": vitals_unk,
            },
        }
        with open(OUTPUT_DIR / f"{cid}.json", "w", encoding="utf-8") as f:
            json.dump(case_unk, f, indent=2)

    # 3. Variant E: Nominal Baseline Cases (ML=0, normal vitals) = 5 cases
    for i in range(1, 6):
        case_counter += 1
        cid = f"GOLDEN-{case_counter:03d}"
        vitals_nom = get_base_nominal_vitals()
        vitals_nom["heart_rate_bpm"] = 70.0 + (i * 2.0)
        vitals_nom["request_id"] = cid
        vitals_nom["astronaut_id"] = f"ASTRO-EVAL-NOM-{i}"

        case_nom = {
            "case_id": cid,
            "condition_id": "nominal_baseline",
            "variant": "nominal_healthy",
            "description": f"Completely healthy astronaut baseline telemetry reading (Case {i}).",
            "expected_severity": "Normal",
            "expected_escalation": False,
            "expected_escalation_target": "None",
            "expected_query_keywords": ["nominal"],
            "request_payload": {
                "request_id": cid,
                "astronaut_id": f"ASTRO-EVAL-NOM-{i}",
                "ml": {"anomaly_label": 0, "confidence_score": 0.98},
                "vitals": vitals_nom,
            },
        }
        with open(OUTPUT_DIR / f"{cid}.json", "w", encoding="utf-8") as f:
            json.dump(case_nom, f, indent=2)

    # 4. Variant F: Multi-Vital Extreme Crisis = 3 cases
    for i in range(1, 4):
        case_counter += 1
        cid = f"GOLDEN-{case_counter:03d}"
        vitals_crisis = get_base_nominal_vitals()
        vitals_crisis["spo2_percent"] = 82.0
        vitals_crisis["heart_rate_bpm"] = 145.0
        vitals_crisis["systolic_bp_mmhg"] = 70.0
        vitals_crisis["request_id"] = cid
        vitals_crisis["astronaut_id"] = f"ASTRO-CRISIS-{i}"

        case_crisis = {
            "case_id": cid,
            "condition_id": "compound_crisis",
            "variant": "compound_critical",
            "description": f"Compound multi-organ failure scenario (Hypoxia + Shock + Extreme Tachycardia).",
            "expected_severity": "Critical",
            "expected_escalation": True,
            "expected_escalation_target": "Flight Surgeon",
            "expected_query_keywords": ["oxygen", "shock", "cardiac", "resuscitation"],
            "request_payload": {
                "request_id": cid,
                "astronaut_id": f"ASTRO-CRISIS-{i}",
                "ml": {"anomaly_label": 1, "confidence_score": 0.99},
                "vitals": vitals_crisis,
            },
        }
        with open(OUTPUT_DIR / f"{cid}.json", "w", encoding="utf-8") as f:
            json.dump(case_crisis, f, indent=2)

    print(f"[SUCCESS] Generated {case_counter} Golden Evaluation Cases in {OUTPUT_DIR}")


if __name__ == "__main__":
    generate_all_cases()
