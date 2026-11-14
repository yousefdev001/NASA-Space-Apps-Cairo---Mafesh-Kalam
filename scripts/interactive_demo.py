"""Interactive CLI Demo & Golden Dataset Explorer for AuraMed.

Allows testing any of the 40 NASA Golden Dataset scenarios live through
the unified pipeline (ML Hazard Model -> Severity Engine -> Hybrid NASA Retrieval -> Groq LLM -> Guardrails).
"""

import json
import sys
import time
from pathlib import Path

# Fix Windows console UTF-8 output encoding
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from starlette.testclient import TestClient
from services.orchestrator.main import app

client = TestClient(app)
CASES_DIR = PROJECT_ROOT / "eval" / "golden" / "cases"


def list_available_cases():
    cases = sorted(list(CASES_DIR.glob("*.json")))
    print("\n" + "=" * 70)
    print("      AURAMED GOLDEN DATASET BENCHMARK BANK (40 CASES)")
    print("=" * 70)
    print(f"{'Case ID':<12} | {'Condition / Scenario':<32} | {'Severity'}")
    print("-" * 70)
    for c in cases:
        with open(c, "r", encoding="utf-8") as f:
            data = json.load(f)
        cid = data["case_id"]
        desc = data["description"][:30] + "..." if len(data["description"]) > 30 else data["description"]
        sev = data["expected_severity"]
        print(f"{cid:<12} | {desc:<32} | {sev}")
    print("=" * 70)


def run_case(case_id_or_number: str):
    # Support typing "1" or "001" or "GOLDEN-001"
    clean_id = case_id_or_number.upper().strip()
    if clean_id.isdigit():
        clean_id = f"GOLDEN-{int(clean_id):03d}"
    elif not clean_id.startswith("GOLDEN-"):
        clean_id = f"GOLDEN-{clean_id}"

    case_path = CASES_DIR / f"{clean_id}.json"
    if not case_path.exists():
        print(f"[!] Case '{clean_id}' not found. Please choose between GOLDEN-001 and GOLDEN-040.")
        return

    with open(case_path, "r", encoding="utf-8") as f:
        case_data = json.load(f)

    print("\n" + "=" * 75)
    print(f"  [RUNNING TEST] {case_data['case_id']}: {case_data['description']}")
    print("=" * 75)

    v = case_data["request_payload"]["vitals"]
    print("[1] VITAL TELEMETRY:")
    print(f"    - SpO2:              {v['spo2_percent']}%")
    print(f"    - Heart Rate:        {v['heart_rate_bpm']} bpm")
    print(f"    - Blood Pressure:    {v['systolic_bp_mmhg']}/{v['diastolic_bp_mmhg']} mmHg")
    print(f"    - Core Temp:         {v['body_temperature_c']} C")
    print(f"    - Respiratory Rate:  {v['respiratory_rate_bpm']} breaths/min")

    print("\n[*] Sending request to Unified Client Gateway (POST /api/v1/assess-astronaut)...")
    t0 = time.perf_counter()

    # Direct in-process execution with real Groq Cloud API & real ChromaDB
    res = client.post("/api/v1/assess-astronaut", json=case_data["request_payload"])
    latency_ms = (time.perf_counter() - t0) * 1000

    if res.status_code != 200:
        print(f"[ERROR] Gateway returned status {res.status_code}: {res.text}")
        return

    resp = res.json()

    print("\n" + "=" * 75)
    print("  [LIVE PIPELINE ASSESSMENT RESULTS]")
    print("=" * 75)
    print(f"Status:            {resp['status'].upper()}")
    print(f"Operating Mode:    {resp['operating_mode'].upper()} (Provider: {resp['active_provider']})")
    print(f"Enforced Severity: {resp['severity'].upper()}")
    print(f"Hypotheses:        {', '.join(resp['condition_hypotheses']) if resp['condition_hypotheses'] else 'None'}")
    print(f"Total Latency:     {latency_ms:.1f} ms")

    # ML Details
    ml = resp["ml_assessment"]
    print("\n[2] NASA MACHINE LEARNING MODEL OUTPUT:")
    print(f"    - Anomaly Detected:  {ml['anomaly_detected']}")
    print(f"    - Model Confidence:  {ml['confidence_score'] * 100:.1f}%")
    print(f"    - Hazard Risk Level: {ml['hazard_risk_level']}")
    if ml.get("predicted_degradation_score") is not None:
        print(f"    - Degradation Score: {ml['predicted_degradation_score']:.1f}/100")

    # Flight Surgeon Escalation
    esc = resp["escalation"]
    print("\n[3] CLINICAL ESCALATION STATUS:")
    if esc["required"]:
        print(f"    [!] ESCALATION REQUIRED: Alert sent to {esc['target'].upper()}!")
        print(f"        Reason: {esc['reason']}")
    else:
        print(f"    [OK] Routine Monitoring. Recipient: {esc['target']}")

    # Clinical Summary
    print("\n[4] CLINICAL SUMMARY:")
    print(f"    {resp['summary']}")

    # NASA Tier 1 Action Steps
    print(f"\n[5] NASA TIER 1 OPERATIONAL ACTION STEPS ({len(resp['action_steps'])} steps):")
    if not resp["action_steps"]:
        print("    (No emergency procedural intervention required for nominal telemetry)")
    for step in resp["action_steps"]:
        warn_text = f" | [WARNING: {step['warning']}]" if step.get("warning") else ""
        print(f"    Step {step['n']}: {step['action']}")
        print(f"            Source: {step['ref_label']} [Chunk: {step['source_chunk_id']}]{warn_text}")

    print("\n" + "=" * 75)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg in ("--list", "-l", "list"):
            list_available_cases()
        else:
            run_case(arg)
    else:
        # Default: Show showcase of 3 distinct cases
        list_available_cases()
        print("\nTo test any case, run:")
        print("  .\\.venv\\Scripts\\python.exe scripts/interactive_demo.py <case_number>")
        print("Example: .\\.venv\\Scripts\\python.exe scripts/interactive_demo.py 1")
