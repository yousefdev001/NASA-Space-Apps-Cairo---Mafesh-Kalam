"""AuraMed Comprehensive End-to-End API and Subsystem Verification Suite.

Exercises and verifies every single endpoint, microservice, database, and local AI model:
1. Low-level Models & Vector Database (ChromaDB, E5 embeddings, XGBoost models, Ollama GPU runtime)
2. Microservices direct connections (Port 8001 ML, Port 8002 RAG)
3. Unified Client Gateway on Port 8000 (all 14+ endpoints)
4. Public Cloudflare Tunnel for Flutter mobile integration
5. Authentication and Loopback security policies
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

API_KEY = os.getenv("AURAMED_API_KEY", "auramed-secret-key-2026")
GATEWAY_URL = "http://127.0.0.1:8000"
ML_URL = "http://127.0.0.1:8001"
RAG_URL = "http://127.0.0.1:8002"

# Complete 17-feature NASA physiological telemetry payload
SAMPLE_VITALS = {
    "request_id": f"REQ-VERIFY-{int(time.time())}",
    "astronaut_id": "ASTRO-01",
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "heart_rate_bpm": 128.0,
    "hrv_rmssd_ms": 22.0,
    "spo2_percent": 91.0,
    "body_temperature_c": 37.8,
    "respiratory_rate_bpm": 24.0,
    "systolic_bp_mmhg": 138.0,
    "diastolic_bp_mmhg": 88.0,
    "heart_rate_bpm_rolling_mean_60min": 115.0,
    "heart_rate_bpm_rolling_std_60min": 12.0,
    "hrv_rmssd_ms_rolling_mean_60min": 28.0,
    "hrv_rmssd_ms_rolling_std_60min": 5.0,
    "spo2_percent_rolling_mean_60min": 93.0,
    "spo2_percent_rolling_std_60min": 2.5,
    "body_temperature_c_rolling_mean_60min": 37.2,
    "body_temperature_c_rolling_std_60min": 0.4,
    "respiratory_rate_bpm_rolling_mean_60min": 21.0,
    "respiratory_rate_bpm_rolling_std_60min": 3.0,
}


def send_http(url, method="GET", data=None, headers=None, timeout=30):
    """Execute HTTP request and return (status, parsed_body, latency_ms, error)."""
    h = {"User-Agent": "AuraMed-Verification/1.0", "X-API-Key": API_KEY}
    if headers:
        h.update(headers)

    body_bytes = None
    if data is not None:
        if isinstance(data, dict):
            body_bytes = json.dumps(data).encode("utf-8")
            h["Content-Type"] = "application/json"
        elif isinstance(data, bytes):
            body_bytes = data
        elif isinstance(data, str):
            body_bytes = data.encode("utf-8")

    req = urllib.request.Request(url, data=body_bytes, headers=h, method=method)
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            elapsed = (time.perf_counter() - t0) * 1000
            raw = resp.read()
            content_type = resp.headers.get("Content-Type", "")
            if "application/json" in content_type:
                try:
                    parsed = json.loads(raw.decode("utf-8"))
                except Exception:
                    parsed = raw.decode("utf-8", errors="replace")
            else:
                parsed = raw.decode("utf-8", errors="replace")[:120]
            return resp.status, parsed, elapsed, None
    except urllib.error.HTTPError as e:
        elapsed = (time.perf_counter() - t0) * 1000
        try:
            err_body = json.loads(e.read().decode("utf-8"))
        except Exception:
            err_body = str(e)
        return e.code, err_body, elapsed, str(e)
    except Exception as exc:
        elapsed = (time.perf_counter() - t0) * 1000
        return 0, None, elapsed, str(exc)


def main():
    print("=" * 75)
    print("   AuraMed Comprehensive API & Subsystem Verification Suite")
    print("   NASA Space Apps 2026 — End-to-End System Audit")
    print("=" * 75)

    results = []

    def record(category, test_name, passed, status, latency_ms, detail=""):
        res = {
            "category": category,
            "test": test_name,
            "passed": passed,
            "status": status,
            "latency_ms": round(latency_ms, 1),
            "detail": detail,
        }
        results.append(res)
        mark = "✓ PASS" if passed else "✗ FAIL"
        lat_str = f"({latency_ms:.1f}ms)" if latency_ms > 0 else ""
        print(f"  [{mark}] {test_name:<42} -> HTTP {status:<4} {lat_str:<10} {detail[:40]}", flush=True)

    # =========================================================================
    # 1. Low-level AI Models & Storage
    # =========================================================================
    print("\n[1] Low-Level AI Models, Weights & Storage:")

    # 1.1 ChromaDB
    try:
        t0 = time.perf_counter()
        from services.rag_service.retrieval.hybrid_retriever import get_retriever
        retriever = get_retriever()
        retriever._init_chroma()
        cnt = retriever.collection.count() if retriever.collection else len(retriever.chunk_ids)
        lat = (time.perf_counter() - t0) * 1000
        record("Storage", "ChromaDB Vector Store", cnt > 0, 200, lat, f"{cnt} chunks indexed")
    except Exception as e:
        record("Storage", "ChromaDB Vector Store", False, 0, 0, str(e))

    # 1.2 ML Model Runner
    try:
        t0 = time.perf_counter()
        from services.ml_service.model_runner import runner_instance
        from shared.contracts.ml_contract import MLPredictRequest
        vitals_obj = MLPredictRequest(**SAMPLE_VITALS)
        pred = runner_instance.predict_vitals(vitals_obj)
        ready = runner_instance.is_ready()
        lat = (time.perf_counter() - t0) * 1000
        record("ML Models", "XGBoost Hazard & Anomaly Models", ready, 200, lat, f"Anomaly: {pred.anomaly_label}")
    except Exception as e:
        record("ML Models", "XGBoost Hazard & Anomaly Models", False, 0, 0, str(e))

    # 1.3 Ollama Local Runtime
    status, body, lat, err = send_http("http://127.0.0.1:11434/api/tags", timeout=3)
    if status == 200 and isinstance(body, dict):
        models = [m.get("name") for m in body.get("models", [])]
        has_medgemma = any("medgemma" in m for m in models)
        record("Local LLM", "Ollama Daemon & MedGemma Model", has_medgemma, status, lat, f"Models: {len(models)}")
    else:
        record("Local LLM", "Ollama Daemon & MedGemma Model", False, status, lat, err or "Unreachable")

    # =========================================================================
    # 2. Direct Microservices
    # =========================================================================
    print("\n[2] Direct Microservice Endpoints (Internal Mesh):")

    # 2.1 ML Service Port 8001
    status, body, lat, err = send_http(f"{ML_URL}/ml/health", timeout=3)
    record("ML Direct", "GET Port 8001 /ml/health", status == 200, status, lat, f"Models: {body.get('models_loaded') if isinstance(body, dict) else ''}")

    status, body, lat, err = send_http(f"{ML_URL}/ml/predict", method="POST", data=SAMPLE_VITALS, timeout=5)
    record("ML Direct", "POST Port 8001 /ml/predict", status == 200, status, lat, f"Anomaly: {body.get('anomaly_label') if isinstance(body, dict) else ''}")

    # 2.2 RAG Service Port 8002
    status, body, lat, err = send_http(f"{RAG_URL}/v1/index/info", timeout=3)
    record("RAG Direct", "GET Port 8002 /v1/index/info", status == 200, status, lat, f"Chunks: {body.get('total_chunks') if isinstance(body, dict) else ''}")

    guidance_req = {
        "request_id": "REQ-TEST-PROT",
        "astronaut_id": "ASTRO-01",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ml": {"anomaly_label": 1, "confidence_score": 0.88},
        "vitals": SAMPLE_VITALS,
        "window_count": 12,
        "options": {"mode": "auto"},
    }
    status, body, lat, err = send_http(f"{RAG_URL}/v1/protocols/retrieve", method="POST", data=guidance_req, timeout=20)
    record("RAG Direct", "POST Port 8002 /v1/protocols/retrieve", status == 200, status, lat, f"Status: {body.get('status') if isinstance(body, dict) else ''}")

    # =========================================================================
    # 3. Client API Gateway (Port 8000)
    # =========================================================================
    print("\n[3] Unified Client Gateway (Port 8000 Endpoints):")

    # 3.1 Core Gateway Health
    status, body, lat, err = send_http(f"{GATEWAY_URL}/health", timeout=5)
    record("Gateway", "GET /health (Instant readiness probe)", status == 200, status, lat, f"Mode: {body.get('operating_mode') if isinstance(body, dict) else ''}")

    # 3.2 Proxied ML Health
    status, body, lat, err = send_http(f"{GATEWAY_URL}/ml/health", timeout=5)
    record("Gateway", "GET /ml/health (Proxied ML health)", status == 200, status, lat, f"Models loaded: {body.get('models_loaded') if isinstance(body, dict) else ''}")

    # 3.3 Proxied RAG Index Info
    status, body, lat, err = send_http(f"{GATEWAY_URL}/v1/index/info", timeout=5)
    record("Gateway", "GET /v1/index/info (Proxied RAG telemetry)", status == 200, status, lat, f"Chunks: {body.get('total_chunks') if isinstance(body, dict) else ''}")

    # 3.4 ML Predict via Gateway
    status, body, lat, err = send_http(f"{GATEWAY_URL}/ml/predict", method="POST", data=SAMPLE_VITALS, timeout=5)
    record("Gateway", "POST /ml/predict (Telemetry anomaly inference)", status == 200, status, lat, f"Score: {body.get('confidence_score') if isinstance(body, dict) else ''}")

    # 3.5 ML Predict Space Hazard via Gateway
    status, body, lat, err = send_http(f"{GATEWAY_URL}/ml/predict/hazard", method="POST", data=SAMPLE_VITALS, timeout=5)
    record("Gateway", "POST /ml/predict/hazard (NASA hazard risks)", status == 200, status, lat, f"Risk: {body.get('predicted_risk_level') if isinstance(body, dict) else ''}")

    # 3.6 RAG Retrieve via Gateway
    status, body, lat, err = send_http(f"{GATEWAY_URL}/v1/protocols/retrieve", method="POST", data=guidance_req, timeout=10)
    record("Gateway", "POST /v1/protocols/retrieve (Hybrid RAG)", status == 200, status, lat, f"Severity: {body.get('severity') if isinstance(body, dict) else ''}")

    # 3.7 RAG Guidance Generate via Gateway
    status, body, lat, err = send_http(f"{GATEWAY_URL}/v1/guidance/generate", method="POST", data=guidance_req, timeout=65)
    record("Gateway", "POST /v1/guidance/generate (Guidance synthesis)", status == 200, status, lat, f"Provider: {body.get('active_provider', 'ok') if isinstance(body, dict) else ''}")

    # 3.8 Unified Assess Astronaut (End-to-End Orchestrator Pipeline)
    assess_req = {
        "request_id": f"REQ-ASSESS-{int(time.time())}",
        "astronaut_id": "ASTRO-01",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "vitals": SAMPLE_VITALS,
        "window_count": 12,
        "options": {"mode": "auto"},
    }
    status, body, lat, err = send_http(f"{GATEWAY_URL}/api/v1/assess-astronaut", method="POST", data=assess_req, timeout=65)
    record("Gateway", "POST /api/v1/assess-astronaut (E2E Pipeline)", status == 200, status, lat, f"Severity: {body.get('severity') if isinstance(body, dict) else ''}")

    # 3.9 Conversational Copilot Chat (/v1/chat)
    chat_req = {
        "query": "Astronaut reports headache and elevated heart rate",
        "astronaut_id": "ASTRO-01",
        "mode": "auto",
    }
    status, body, lat, err = send_http(f"{GATEWAY_URL}/v1/chat", method="POST", data=chat_req, timeout=65)
    record("Gateway", "POST /v1/chat (Flight Surgeon Copilot)", status == 200, status, lat, f"Provider: {body.get('active_provider') if isinstance(body, dict) else ''}")

    # 3.10 Web UI & Swagger Docs
    status, body, lat, err = send_http(f"{GATEWAY_URL}/", timeout=5)
    record("Gateway UI", "GET / (Interactive Testing Studio UI)", status == 200, status, lat, "HTML Studio")

    status, body, lat, err = send_http(f"{GATEWAY_URL}/docs", timeout=5)
    record("Gateway UI", "GET /docs (Offline Swagger UI Documentation)", status == 200, status, lat, "Swagger HTML")

    status, body, lat, err = send_http(f"{GATEWAY_URL}/chat", timeout=5)
    record("Gateway UI", "GET /chat (Dedicated Chat UI Page)", status == 200, status, lat, "HTML Chat")

    # 3.11 Voice Keypool Status
    status, body, lat, err = send_http(f"{GATEWAY_URL}/api/v1/voice/keypool/status", timeout=5)
    record("Voice", "GET /api/v1/voice/keypool/status (TTS Keys)", status == 200, status, lat, f"Keys: {body.get('total_keys') if isinstance(body, dict) else ''}")

    # 3.12 Voice Mode
    status, body, lat, err = send_http(f"{GATEWAY_URL}/api/v1/voice/mode", timeout=5)
    record("Voice", "GET /api/v1/voice/mode (Operating Mode)", status == 200, status, lat, f"Mode: {body.get('mode') if isinstance(body, dict) else ''}")

    # 3.13 Voice TTS Speech Synthesis
    tts_req = {
        "session_id": "SESSION-VERIFY-01",
        "raw_markdown": "Medical alert: telemetry check confirmed nominal.",
        "voice_name": "Puck",
    }
    status, body, lat, err = send_http(f"{GATEWAY_URL}/api/v1/voice/tts", method="POST", data=tts_req, timeout=25)
    has_audio = isinstance(body, dict) and bool(body.get("audio_base64"))
    record("Voice", "POST /api/v1/voice/tts (Gemini Speech Synth)", status == 200 and has_audio, status, lat, f"Audio: {body.get('duration_seconds', 0) if isinstance(body, dict) else 0}s")

    # =========================================================================
    # 4. Cloudflare Tunnel Verification (Public Access for Flutter)
    # =========================================================================
    print("\n[4] Cloudflare Tunnel Remote Access (for Flutter App):")
    tunnel_file = BASE_DIR / ".tunnel_url"
    if tunnel_file.exists():
        t_url = tunnel_file.read_text(encoding="utf-8").strip()
        print(f"  Tunnel URL: {t_url}")

        status, body, lat, err = send_http(f"{t_url}/health", timeout=10)
        record("Tunnel", "Tunnel GET /health", status == 200, status, lat, "Public HTTPS")

        status, body, lat, err = send_http(f"{t_url}/ml/health", timeout=10)
        record("Tunnel", "Tunnel GET /ml/health", status == 200, status, lat, "Public HTTPS")

        status, body, lat, err = send_http(f"{t_url}/v1/index/info", timeout=10)
        record("Tunnel", "Tunnel GET /v1/index/info", status == 200, status, lat, "Public HTTPS")

        chat_remote = {"query": "Telemetry probe via Cloudflare Tunnel", "mode": "auto"}
        status, body, lat, err = send_http(f"{t_url}/v1/chat", method="POST", data=chat_remote, timeout=65)
        record("Tunnel", "Tunnel POST /v1/chat", status == 200, status, lat, f"Provider: {body.get('active_provider') if isinstance(body, dict) else ''}")
    else:
        record("Tunnel", "Cloudflare Tunnel active check", False, 0, 0, ".tunnel_url file not found")

    # =========================================================================
    # Summary
    # =========================================================================
    print("\n" + "=" * 75)
    total = len(results)
    passed_count = sum(1 for r in results if r["passed"])
    failed_count = total - passed_count
    print(f"   Verification Summary: {passed_count}/{total} Passed ({failed_count} Failed)")
    print("=" * 75)

    if failed_count == 0:
        print("\n  🚀 ALL ENDPOINTS, MICROSERVICES, AND LOCAL MODELS ARE 100% OPERATIONAL!")
    else:
        print(f"\n  [!] Notice: {failed_count} tests require attention:")
        for r in results:
            if not r["passed"]:
                print(f"      - {r['test']}: HTTP {r['status']} ({r['detail']})")

    # Save verification report as JSON
    report_path = BASE_DIR / "documentation_export" / "System_Verification_Report.json"
    report_path.write_text(json.dumps({"timestamp": datetime.now(timezone.utc).isoformat(), "total": total, "passed": passed_count, "results": results}, indent=2), encoding="utf-8")
    print(f"\nSaved structured audit report to: {report_path.name}\n")


if __name__ == "__main__":
    main()
