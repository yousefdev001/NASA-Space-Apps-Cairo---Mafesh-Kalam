"""AuraMed Unified Microservices Launcher & Supervisor (Local Mode).

Spins up and supervises:
- Pre-flight port verification and cleanup
- Verification / auto-start of local Ollama runtime
- ML Microservice on port 8001
- RAG Decision Support Microservice on port 8002
- Unified Client Gateway on port 8000

Includes auto-healing supervision: automatically restarts any service that exits.
"""

import os
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
import psutil

BASE_DIR = Path(__file__).resolve().parent.parent
AURAMED_PORTS = [8000, 8001, 8002]


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
    """Ensure ports 8000, 8001, 8002 are free before starting."""
    current_pid = os.getpid()
    for conn in psutil.net_connections(kind="tcp"):
        if conn.laddr and conn.laddr.port in AURAMED_PORTS:
            if (not conn.raddr) and conn.status in (psutil.CONN_LISTEN, psutil.CONN_NONE):
                if conn.pid and conn.pid != current_pid:
                    try:
                        p = psutil.Process(conn.pid)
                        print(f"[*] Reclaiming busy port {conn.laddr.port} from '{p.name()}' (PID: {conn.pid})...")
                        p.terminate()
                    except Exception:
                        pass


def ensure_ollama_running():
    """Verify Ollama daemon is reachable; if not, launch in background."""
    try:
        req = urllib.request.Request("http://127.0.0.1:11434/api/tags", headers={"User-Agent": "AuraMed"})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            if resp.status == 200:
                print("  [OK] Local Ollama daemon is online (http://127.0.0.1:11434).")
                return True
    except Exception:
        pass

    print("  [*] Ollama is offline. Starting Ollama daemon in background...")
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
                        print("  [OK] Ollama daemon successfully started in background.")
                        return True
            except Exception:
                pass
        print("  [!] Ollama was started, continuing startup...")
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
    print("=" * 65)
    print("   AuraMed Healthcare AI — NASA Space Apps 2026")
    print("   Unified Microservices Supervisor (Local Mode)")
    print("=" * 65)

    print("\n[*] Pre-flight Checks:")
    cleanup_ports()
    ensure_ollama_running()

    python_executable = sys.executable
    reload_args = ["--reload"] if "--reload" in sys.argv else []

    service_specs = [
        ("ML Service (Port 8001)", [python_executable, "-m", "uvicorn", "services.ml_service.main:app", "--host", "127.0.0.1", "--port", "8001"] + reload_args),
        ("RAG Service (Port 8002)", [python_executable, "-m", "uvicorn", "services.rag_service.main:app", "--host", "127.0.0.1", "--port", "8002"] + reload_args),
        ("Client Gateway (Port 8000)", [python_executable, "-m", "uvicorn", "services.orchestrator.main:app", "--host", "0.0.0.0", "--port", "8000"] + reload_args),
    ]

    active_processes = []
    try:
        print("\n[*] Booting AuraMed Microservices...")
        for name, cmd in service_specs:
            print(f"  - Launching {name}...")
            p = subprocess.Popen(cmd, cwd=str(BASE_DIR))
            active_processes.append({"name": name, "cmd": cmd, "proc": p})
            time.sleep(1.2)

        print("[*] Waiting for Client Gateway initialization...")
        wait_for_gateway(timeout=20)

        print("\n" + "=" * 65)
        print("  [SUCCESS] All AuraMed Services are Running & Supervised!")
        print("  - Direct Gateway API:     http://127.0.0.1:8000 (Swagger: /docs)")
        print("  - Flutter (Windows/Web):  http://127.0.0.1:8000")
        print("  - Flutter (Android Emu):  http://10.0.2.2:8000")
        print("  - ML Microservice:        http://127.0.0.1:8001 (Swagger: /docs)")
        print("  - RAG Microservice:       http://127.0.0.1:8002 (Swagger: /docs)")
        print("=" * 65)
        print("Auto-healing active. Press Ctrl+C to stop all services.\n")

        service_ports = {
            "ML Service (Port 8001)": 8001,
            "RAG Service (Port 8002)": 8002,
            "Client Gateway (Port 8000)": 8000,
        }

        while True:
            time.sleep(2)
            for item in active_processes:
                port = service_ports.get(item["name"])
                if port and is_port_listening(port):
                    continue  # Port is actively listening

                if item["proc"].poll() is not None:
                    print(f"\n[!] ALERT: {item['name']} (Port {port}) stopped. Auto-restarting...")
                    new_p = subprocess.Popen(item["cmd"], cwd=str(BASE_DIR))
                    item["proc"] = new_p
                    print(f"[*] Successfully restarted {item['name']}.")
    except KeyboardInterrupt:
        print("\n[*] Shutting down services cleanly...")
    finally:
        for item in active_processes:
            try:
                item["proc"].terminate()
                item["proc"].wait(timeout=2)
            except Exception:
                try:
                    item["proc"].kill()
                except Exception:
                    pass
        print("[*] All local services stopped.")


if __name__ == "__main__":
    main()
