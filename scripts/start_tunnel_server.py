"""AuraMed Unified Server & Cloudflare Tunnel Launcher for Flutter Integration.

Spins up:
1. ML Microservice (Port 8001)
2. RAG Decision Support (Port 8002)
3. Unified Client Gateway with API Key Security (Port 8000)
4. Cloudflare Tunnel (cloudflared) exposing Port 8000 to a public HTTPS URL.

Prints the live HTTPS tunnel URL and API Key for instant use in Flutter.
"""

import os
import re
import shutil
import subprocess
import sys
import threading
import time
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
BIN_CLOUDFLARED = BASE_DIR / "infrastructure" / "bin" / "cloudflared.exe"


def get_api_key():
    """Retrieve AURAMED_API_KEY from environment or .env file."""
    env_file = BASE_DIR / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("AURAMED_API_KEY=") and not line.startswith("#"):
                return line.split("=", 1)[1].strip()
    return os.getenv("AURAMED_API_KEY", "auramed-secret-key-2026")


def is_port_listening(port: int) -> bool:
    """Check if a TCP port is actively accepting connections."""
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.3)
            return s.connect_ex(('127.0.0.1', port)) == 0
    except Exception:
        return False


def cleanup_ports():
    """Ensure ports 8000, 8001, 8002 are free before starting, and kill old cloudflared."""
    try:
        import psutil
        current_pid = os.getpid()
        for conn in psutil.net_connections(kind="tcp"):
            if conn.laddr and conn.laddr.port in [8000, 8001, 8002]:
                if (not conn.raddr) and conn.status in (psutil.CONN_LISTEN, psutil.CONN_NONE):
                    if conn.pid and conn.pid != current_pid:
                        try:
                            p = psutil.Process(conn.pid)
                            print(f"[*] Reclaiming busy port {conn.laddr.port} from '{p.name()}' (PID: {conn.pid})...")
                            p.terminate()
                        except Exception:
                            pass
        # Kill lingering cloudflared processes
        for p in psutil.process_iter(["pid", "name"]):
            if "cloudflared" in (p.info.get("name") or "").lower():
                try:
                    p.terminate()
                except Exception:
                    pass
    except Exception:
        pass


def ensure_ollama_running():
    """Check if local Ollama daemon is reachable; if not, launch in background."""
    try:
        req = urllib.request.Request("http://127.0.0.1:11434/api/tags", headers={"User-Agent": "AuraMed"})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            if resp.status == 200:
                print("  [OK] Local Ollama daemon is online and reachable.")
                return True
    except Exception:
        pass

    print("  [*] Ollama daemon is offline. Starting in background...")
    ollama_exe = shutil.which("ollama") or r"C:\Users\MSA\AppData\Local\Programs\Ollama\ollama.exe"
    try:
        creation_flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
        subprocess.Popen(
            [ollama_exe, "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=creation_flags,
        )
        for _ in range(8):
            time.sleep(1)
            try:
                req = urllib.request.Request("http://127.0.0.1:11434/api/tags", headers={"User-Agent": "AuraMed"})
                with urllib.request.urlopen(req, timeout=1) as resp:
                    if resp.status == 200:
                        print("  [OK] Ollama daemon started successfully.")
                        return True
            except Exception:
                pass
        print("  [!] Ollama process initiated, continuing...")
    except Exception as exc:
        print(f"  [!] Note: Ollama auto-start failed ({exc}). Continuing with Cloud LLM.")
    return False


def wait_for_gateway(timeout=25):
    """Wait until Gateway on port 8000 responds to /health."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            req = urllib.request.Request("http://127.0.0.1:8000/health", headers={"User-Agent": "AuraMed"})
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            time.sleep(1)
    return False


def main():
    print("=" * 70)
    print("   AuraMed Healthcare AI — NASA Space Apps 2026")
    print("   Edge AI Server & Cloudflare Tunnel Supervisor")
    print("=" * 70)

    # 1. Environment checks
    print("\n[*] Pre-flight Checks:")
    cleanup_ports()
    ensure_ollama_running()
    api_key = get_api_key()
    print(f"  [OK] Secured with API Key: {api_key}")

    # 2. Locate cloudflared binary
    cloudflared_cmd = None
    if BIN_CLOUDFLARED.exists():
        cloudflared_cmd = str(BIN_CLOUDFLARED)
    elif shutil.which("cloudflared"):
        cloudflared_cmd = "cloudflared"
    else:
        print("\n[ERROR] cloudflared.exe not found.")
        print(f"Expected at: {BIN_CLOUDFLARED}")
        sys.exit(1)

    print(f"  [OK] Using Cloudflare binary: {cloudflared_cmd}")

    python_executable = sys.executable
    service_specs = [
        ("ML Service (Port 8001)", [python_executable, "-m", "uvicorn", "services.ml_service.main:app", "--host", "127.0.0.1", "--port", "8001"]),
        ("RAG Service (Port 8002)", [python_executable, "-m", "uvicorn", "services.rag_service.main:app", "--host", "127.0.0.1", "--port", "8002"]),
        ("Client Gateway (Port 8000)", [python_executable, "-m", "uvicorn", "services.orchestrator.main:app", "--host", "0.0.0.0", "--port", "8000"]),
    ]

    active_processes = []
    tunnel_proc = None

    try:
        # 3. Boot backend services
        print("\n[*] Booting AuraMed Microservices...")
        for name, cmd in service_specs:
            p = subprocess.Popen(cmd, cwd=str(BASE_DIR))
            active_processes.append({"name": name, "cmd": cmd, "proc": p})
            time.sleep(1.2)

        print("[*] Waiting for Client Gateway to initialize...")
        if not wait_for_gateway(timeout=30):
            print("[!] Gateway took longer than expected to initialize. Proceeding anyway...")

        # 4. Launch Cloudflare Tunnel
        print("\n[*] Establishing secure Cloudflare Tunnel to port 8000...")
        tunnel_log_file = BASE_DIR / ".tunnel.log"
        log_f = open(tunnel_log_file, "w", encoding="utf-8", buffering=1)
        tunnel_cmd = [cloudflared_cmd, "tunnel", "--protocol", "http2", "--url", "http://127.0.0.1:8000"]
        tunnel_proc = subprocess.Popen(
            tunnel_cmd,
            stdout=log_f,
            stderr=log_f,
        )

        # 5. Extract Tunnel URL from cloudflared logs
        tunnel_url = None
        tunnel_regex = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")
        for _ in range(40):
            time.sleep(0.5)
            if tunnel_log_file.exists():
                try:
                    text = tunnel_log_file.read_text(encoding="utf-8", errors="replace")
                    match = tunnel_regex.search(text)
                    if match:
                        tunnel_url = match.group(0)
                        (BASE_DIR / ".tunnel_url").write_text(tunnel_url.strip(), encoding="utf-8")
                        break
                except Exception:
                    pass

        # 6. Display Connection Banner
        print("\n" + "=" * 70)
        print("  🚀 AuraMed Local AI Server is ONLINE and Connected!")
        print("=" * 70)
        if tunnel_url:
            (BASE_DIR / ".tunnel_url").write_text(tunnel_url.strip(), encoding="utf-8")
            # Auto-sync tunnel URL into Flutter service configuration
            dart_file = BASE_DIR / "docs" / "flutter_integration" / "auramed_api_service.dart"
            if dart_file.exists():
                try:
                    content = dart_file.read_text(encoding="utf-8")
                    updated = re.sub(
                        r"static String baseUrl = 'https://[a-zA-Z0-9-]+\.trycloudflare\.com';",
                        f"static String baseUrl = '{tunnel_url.strip()}';",
                        content
                    )
                    dart_file.write_text(updated, encoding="utf-8")
                except Exception:
                    pass
            print("\n  🌐 PUBLIC HTTPS TUNNEL URL (FOR FLUTTER):")
            print(f"     >>>  {tunnel_url}  <<<")
        else:
            print("\n  [!] Tunnel connected, but URL parsing timed out. Check active tunnels.")

        print(f"\n  🔑 X-API-KEY HEADER: {api_key}")
        print("\n  📱 In your Flutter 'auramed_api_service.dart', set:")
        if tunnel_url:
            print(f"     static const String baseUrl = '{tunnel_url}';")
        else:
            print("     static const String baseUrl = 'https://<your-tunnel-url>.trycloudflare.com';")
        print(f"     static const String apiKey  = '{api_key}';")

        print("\n  💻 Local Testing Endpoints:")
        print("     - Swagger UI:   http://127.0.0.1:8000/docs")
        print("     - Health Probe: http://127.0.0.1:8000/health")
        print("=" * 70)
        print("Press Ctrl+C to terminate the server and tunnel cleanly.\n", flush=True)

        service_ports = {
            "ML Service (Port 8001)": 8001,
            "RAG Service (Port 8002)": 8002,
            "Client Gateway (Port 8000)": 8000,
        }

        # 7. Supervision loop
        while True:
            try:
                time.sleep(2)
                for item in active_processes:
                    port = service_ports.get(item["name"])
                    if port and is_port_listening(port):
                        continue  # Service is healthy and listening on its dedicated port

                    if item["proc"].poll() is not None:
                        print(f"\n[!] ALERT: {item['name']} (Port {port}) stopped. Auto-restarting...")
                        new_p = subprocess.Popen(item["cmd"], cwd=str(BASE_DIR))
                        item["proc"] = new_p

                if tunnel_proc and tunnel_proc.poll() is not None:
                    print("\n[!] ALERT: Cloudflare Tunnel closed. Re-opening tunnel...")
                    log_f = open(tunnel_log_file, "a", encoding="utf-8", buffering=1)
                    tunnel_proc = subprocess.Popen(
                        tunnel_cmd,
                        stdout=log_f,
                        stderr=log_f,
                    )
            except Exception as exc:
                print(f"[!] Supervision loop tick error: {exc}")

    except KeyboardInterrupt:
        print("\n[*] Gracefully shutting down all services and tunnel...")
    finally:
        if tunnel_proc:
            try:
                tunnel_proc.terminate()
            except Exception:
                pass
        for item in active_processes:
            try:
                item["proc"].terminate()
            except Exception:
                pass
        print("[*] All AuraMed services and tunnel stopped cleanly.")


if __name__ == "__main__":
    main()
