import httpx, time

time.sleep(3)
for port, name in [(8000, "Gateway"), (8001, "ML Service"), (8002, "RAG Service")]:
    try:
        r = httpx.get(f"http://127.0.0.1:{port}/health", timeout=6.0)
        print(f"[{name}] Port {port}: HTTP {r.status_code} - {r.json().get('status')}")
    except Exception as e:
        print(f"[{name}] Port {port}: Pending or Error ({e})")
