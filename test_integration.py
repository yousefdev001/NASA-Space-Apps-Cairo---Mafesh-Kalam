"""
AuraMed Ground Station & Houston Telemetry Gateway
End-to-End Integration and Contract Verification Test Suite
"""

import sys
from starlette.testclient import TestClient
from server import app

client = TestClient(app)

def run_tests():
    print("=================================================================")
    print("Running AuraMed Ground Station & Mobile App Integration Tests...")
    print("=================================================================")
    passed = 0
    total = 0

    def assert_test(name, condition, extra=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"  [PASS] {name} {extra}")
        else:
            print(f"  [FAIL] {name} {extra}")
            sys.exit(1)

    # 1. Health Probe
    res = client.get("/health")
    assert_test("GET /health status == 200", res.status_code == 200)
    data = res.json()
    assert_test("GET /health status healthy", data.get("status") == "healthy")

    # 2. Telemetry Push from Flutter Mobile App (POST /api/v1/telemetry/report)
    telemetry_payload = {
        "astronaut_id": "ASTRO-8492",
        "timestamp": "2026-11-17T08:30:00Z",
        "vitals": {
            "heart_rate_bpm": 86.0,
            "spo2_percent": 97.4,
            "systolic_bp_mmhg": 122.0,
            "diastolic_bp_mmhg": 78.0,
            "body_temperature_c": 36.8,
            "respiratory_rate_bpm": 16.0,
            "hrv_rmssd_ms": 44.0
        }
    }
    res = client.post("/api/v1/telemetry/report", json=telemetry_payload)
    assert_test("POST /api/v1/telemetry/report status == 200", res.status_code == 200)
    data = res.json()
    assert_test("Report ingestion status == received", data.get("status") == "received")
    assert_test("Triage severity is NOMINAL", data.get("triage_severity") == "NOMINAL")

    # 3. Critical Telemetry Push (Hypoxia Simulation)
    hypoxia_payload = {
        "astronaut_id": "ASTRO-8492",
        "timestamp": "2026-11-17T08:31:00Z",
        "vitals": {
            "heart_rate_bpm": 138.0,
            "spo2_percent": 84.0,
            "systolic_bp_mmhg": 145.0,
            "diastolic_bp_mmhg": 90.0,
            "body_temperature_c": 36.9,
            "respiratory_rate_bpm": 28.0,
            "hrv_rmssd_ms": 16.0
        }
    }
    res = client.post("/api/v1/telemetry/report", json=hypoxia_payload)
    assert_test("POST critical telemetry == 200", res.status_code == 200)
    data = res.json()
    assert_test("Critical triage severity is CRITICAL", data.get("triage_severity") == "CRITICAL")
    assert_test("Anomaly flag is True", data.get("anomaly_flagged") == True)

    # 4. Assess Astronaut Endpoint (POST /api/v1/assess-astronaut)
    res = client.post("/api/v1/assess-astronaut", json=hypoxia_payload)
    assert_test("POST /api/v1/assess-astronaut == 200", res.status_code == 200)
    data = res.json()
    assert_test("Assess response severity == Critical", data.get("severity") == "Critical")
    assert_test("Action steps generated", len(data.get("action_steps", [])) > 0)
    assert_test("Escalation required flag == True", data.get("escalation_required") == True)

    # 5. Predict Telemetry Endpoint (POST /api/v1/predict)
    res = client.post("/api/v1/predict", json=hypoxia_payload["vitals"])
    assert_test("POST /api/v1/predict == 200", res.status_code == 200)
    data = res.json()
    assert_test("Predict is_anomaly == True", data.get("is_anomaly") == True)

    # 6. Two-Way Ground Comms (POST /api/v1/ground-comms)
    comms_ast = {"text": "Houston, cabin pressure fluctuating slightly, checking suit seal.", "sender": "astronaut"}
    res = client.post("/api/v1/ground-comms", json=comms_ast)
    assert_test("Astronaut ground comms push == 200", res.status_code == 200)

    # 7. Ground Surgeon reply to Astronaut (POST /api/v1/ground-comms/send-to-astronaut)
    comms_ground = {"text": "Copy Commander. Flight Surgeon confirms seal intact on telemetry.", "is_urgent": False}
    res = client.post("/api/v1/ground-comms/send-to-astronaut", json=comms_ground)
    assert_test("Ground surgeon comms transmission == 200", res.status_code == 200)

    # 8. Check Comms transcript (GET /api/v1/ground-comms)
    res = client.get("/api/v1/ground-comms")
    assert_test("GET /api/v1/ground-comms == 200", res.status_code == 200)
    messages = res.json().get("messages", [])
    assert_test("Comms transcript has multiple messages", len(messages) >= 4)

    # 9. Dedicated Flight Surgeon Rescue AI Co-Pilot (POST /api/v1/monitor/chat)
    # Query: Hypoxia
    ai_req = {"query": "Astronaut SpO2 dropped to 84%. Give me the acute hypoxia resuscitation sequence."}
    res = client.post("/api/v1/monitor/chat", json=ai_req)
    assert_test("Rescue AI hypoxia query == 200", res.status_code == 200)
    data = res.json()
    assert_test("Rescue AI triage_level == CRITICAL", data.get("triage_level") == "CRITICAL")
    assert_test("Rescue AI urgent_actions populated", len(data.get("urgent_actions", [])) >= 2)
    assert_test("Rescue AI pharmacopeia includes 100% O2", any("100%" in p for p in data.get("pharmacopeia", [])))
    assert_test("Rescue AI radio_directive exists", len(data.get("radio_directive", "")) > 10)

    # Query: Pharmacopeia
    ai_req_drugs = {"query": "What are the emergency drug doses in the Orion medical kit?"}
    res = client.post("/api/v1/monitor/chat", json=ai_req_drugs)
    assert_test("Rescue AI pharmacopeia query == 200", res.status_code == 200)
    data = res.json()
    assert_test("Rescue AI pharmacopeia list populated", len(data.get("pharmacopeia", [])) >= 3)

    # 10. Scenario Simulation Injection (POST /api/v1/telemetry/simulate)
    res = client.post("/api/v1/telemetry/simulate", json={"scenario": "heat_stress"})
    assert_test("Simulate heat_stress == 200", res.status_code == 200)
    data = res.json()
    assert_test("Simulate severity is CRITICAL", data.get("severity") == "CRITICAL")

    # Reset to nominal
    res = client.post("/api/v1/telemetry/simulate", json={"scenario": "nominal"})
    assert_test("Simulate nominal == 200", res.status_code == 200)
    data = res.json()
    assert_test("Simulate nominal severity is NOMINAL", data.get("severity") == "NOMINAL")

    # 11. Static Dashboard Frontend Delivery (GET /)
    res = client.get("/")
    assert_test("GET / (Dashboard HTML) == 200", res.status_code == 200)
    assert_test("Dashboard HTML contains AuraMed title", "AuraMed" in res.text)
    assert_test("Dashboard HTML contains ecg-canvas", "ecg-canvas" in res.text)
    assert_test("Dashboard HTML contains ai-chat-feed", "ai-chat-feed" in res.text)

    # 12. Static Assets Delivery
    res = client.get("/static/css/style.css")
    assert_test("GET /static/css/style.css == 200", res.status_code == 200)
    assert_test("CSS contains spaceVoid token", "--space-void: #050816" in res.text)

    res = client.get("/static/js/app.js")
    assert_test("GET /static/js/app.js == 200", res.status_code == 200)

    res = client.get("/static/js/ecg-canvas.js")
    assert_test("GET /static/js/ecg-canvas.js == 200", res.status_code == 200)

    res = client.get("/static/js/rescue-bot.js")
    assert_test("GET /static/js/rescue-bot.js == 200", res.status_code == 200)

    print("-----------------------------------------------------------------")
    print(f"Summary: All {passed}/{total} Integration & API Tests Passed! (100% Green)")
    print("=================================================================")

if __name__ == "__main__":
    run_tests()
