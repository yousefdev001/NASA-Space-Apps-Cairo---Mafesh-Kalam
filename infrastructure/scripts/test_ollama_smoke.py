"""
Verification script for Ollama Local Runtime and controlled smoke test inference.
Tests local API reachability, model inventory, and executes smoke test on medgemma:latest.
"""
import time
import httpx

def test_ollama():
    base_url = "http://127.0.0.1:11434"
    print(f"[1/3] Connecting to Ollama API at {base_url}...")
    tags_resp = httpx.get(f"{base_url}/api/tags", timeout=5.0)
    assert tags_resp.status_code == 200, f"Ollama HTTP error: {tags_resp.status_code}"
    models_data = tags_resp.json().get("models", [])
    print(f" [PASS] Ollama reachable. Found {len(models_data)} installed models.")
    
    print("\n[2/3] Local Model Inventory:")
    for m in models_data:
        name = m.get("name")
        size_gb = m.get("size", 0) / (1024**3)
        details = m.get("details", {})
        quant = details.get("quantization_level", "N/A")
        family = details.get("family", "N/A")
        print(f"  - {name:<24} | Family: {family:<10} | Quant: {quant:<8} | Size: {size_gb:.2f} GB")

    target_model = "medgemma:latest" if any(m["name"] == "medgemma:latest" for m in models_data) else "deepseek-r1:8b"
    print(f"\n[3/3] Controlled Smoke Test on candidate medical fallback '{target_model}'...")
    t0 = time.time()
    gen_resp = httpx.post(
        f"{base_url}/api/generate",
        json={
            "model": target_model,
            "prompt": "Respond with 'SYSTEM READY' only.",
            "stream": False
        },
        timeout=60.0
    )
    elapsed = time.time() - t0
    assert gen_resp.status_code == 200, f"Inference failed: {gen_resp.text}"
    result_json = gen_resp.json()
    resp_text = result_json.get("response", "").strip()
    eval_count = result_json.get("eval_count", 0)
    eval_duration_ms = result_json.get("eval_duration", 0) / 1_000_000
    print(f" [PASS] Inference response received in {elapsed:.2f}s:")
    print(f"        Output text: {resp_text[:80]!r}")
    if eval_duration_ms > 0:
        tokens_per_sec = (eval_count / (eval_duration_ms / 1000.0))
        print(f"        Tokens evaluated: {eval_count} ({tokens_per_sec:.2f} tokens/s)")

    print(f"\n>>> OLLAMA SMOKE TEST VERIFIED FOR {target_model} <<<")

if __name__ == "__main__":
    test_ollama()
