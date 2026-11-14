"""AuraMed Unified Service, Ollama & GPU Status Inspector."""

import json
from pathlib import Path
import subprocess
import urllib.request
import psutil

BASE_DIR = Path(__file__).resolve().parent.parent

AURAMED_PORTS = {
    8000: "Unified Client Gateway",
    8001: "ML Microservice",
    8002: "RAG Decision Support Microservice",
}


def check_port(port):
    """Check if port is listening and return PID + process name."""
    try:
        for conn in psutil.net_connections(kind="tcp"):
            if conn.laddr and conn.laddr.port == port:
                if (not conn.raddr) and conn.status in (psutil.CONN_LISTEN, psutil.CONN_NONE):
                    try:
                        proc = psutil.Process(conn.pid)
                        return True, conn.pid, proc.name()
                    except Exception:
                        return True, conn.pid, "active"
    except Exception:
        pass

    # Fallback direct socket probe if psutil lacks permissions on Windows
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            if s.connect_ex(("127.0.0.1", port)) == 0:
                return True, "Active", "python.exe"
    except Exception:
        pass
    return False, None, None


def check_gateway_health():
    """Probe Gateway health endpoint."""
    try:
        req = urllib.request.Request("http://127.0.0.1:8000/health", headers={"User-Agent": "AuraMed"})
        with urllib.request.urlopen(req, timeout=6.0) as resp:
            if resp.status == 200:
                return True, json.loads(resp.read().decode("utf-8"))
    except Exception:
        pass
    return False, None


def check_ollama_status():
    """Check Ollama daemon and list loaded models."""
    daemon_online = False
    loaded_models = []
    try:
        req = urllib.request.Request("http://127.0.0.1:11434/api/tags", headers={"User-Agent": "AuraMed"})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            if resp.status == 200:
                daemon_online = True
    except Exception:
        pass

    if daemon_online:
        try:
            req_ps = urllib.request.Request("http://127.0.0.1:11434/api/ps", headers={"User-Agent": "AuraMed"})
            with urllib.request.urlopen(req_ps, timeout=1.5) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    loaded_models = data.get("models", [])
        except Exception:
            pass

    return daemon_online, loaded_models


def get_gpu_status():
    """Retrieve live NVIDIA GPU status via nvidia-smi."""
    try:
        out = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu", "--format=csv,noheader,nounits"],
            text=True,
            timeout=3,
        ).strip()
        lines = out.splitlines()
        if lines:
            parts = [p.strip() for p in lines[0].split(",")]
            gpu_info = {
                "name": parts[0],
                "used_mb": int(parts[1]),
                "total_mb": int(parts[2]),
                "util_percent": int(parts[3]),
                "temp_c": int(parts[4]),
            }

            # Also check compute apps
            try:
                apps_out = subprocess.check_output(
                    ["nvidia-smi", "--query-compute-apps=pid,process_name", "--format=csv,noheader"],
                    text=True,
                    timeout=3,
                ).strip()
                apps = []
                for line in apps_out.splitlines():
                    if line.strip():
                        apps.append(line.strip())
                gpu_info["apps"] = apps
            except Exception:
                gpu_info["apps"] = []

            return gpu_info
    except Exception:
        pass
    return None


def main():
    print("=" * 68)
    print("   AuraMed Comprehensive System Status Monitor")
    print("=" * 68)

    # 1. AuraMed Microservices
    print("\n[1] Backend Microservices:")
    for port, label in AURAMED_PORTS.items():
        is_open, pid, name = check_port(port)
        if is_open:
            print(f"  ● [RUNNING] Port {port:<4} -> {label:<35} (PID: {pid}, {name})")
        else:
            print(f"  ○ [STOPPED] Port {port:<4} -> {label:<35} (Offline)")

    # 2. Client Direct Integration Endpoints
    print("\n[2] Client Integration (Direct Mode for Flutter):")
    print("  ● Direct Gateway Port: 8000")
    print("  - Flutter Windows / Web:   http://127.0.0.1:8000")
    print("  - Flutter Android Emu:     http://10.0.2.2:8000")
    print("  - API Documentation:       http://127.0.0.1:8000/docs")

    # 3. Ollama & Local AI Models
    daemon_online, loaded_models = check_ollama_status()
    print("\n[3] Ollama Local AI Runtime:")
    if daemon_online:
        print("  ● [ONLINE]  Ollama Daemon (http://127.0.0.1:11434)")
        if loaded_models:
            for m in loaded_models:
                m_name = m.get("name") or m.get("model", "unknown")
                size_gb = round(m.get("size", 0) / (1024**3), 2)
                vram_gb = round(m.get("size_vram", 0) / (1024**3), 2)
                print(f"    - Model Loaded in VRAM: {m_name} (Total: {size_gb} GB, VRAM: {vram_gb} GB)")
        else:
            print("    - No models currently loaded in VRAM (GPU Idle)")
    else:
        print("  ○ [OFFLINE] Ollama Daemon (Not running)")

    # 4. Hardware / GPU Status
    gpu = get_gpu_status()
    print("\n[4] GPU Hardware Status:")
    if gpu:
        free_mb = gpu["total_mb"] - gpu["used_mb"]
        print(f"  ● {gpu['name']}:")
        print(f"    - Memory: {gpu['used_mb']} MiB / {gpu['total_mb']} MiB ({free_mb} MiB Free)")
        print(f"    - Compute Load: {gpu['util_percent']}% | Temperature: {gpu['temp_c']}°C")
        if gpu["apps"]:
            print(f"    - Active GPU Processes: {', '.join(gpu['apps'])}")
        else:
            print("    - No compute processes currently using GPU.")
    else:
        print("  ○ NVIDIA GPU metrics not available.")

    # 5. Gateway Health Probe
    healthy, data = check_gateway_health()
    print("\n[5] Gateway Health Probe:")
    if healthy:
        print(f"  ● [HEALTHY] Status: {data.get('status')} | Mode: {data.get('operating_mode')}")
    else:
        print("  ○ [OFFLINE] Gateway probe: Unreachable")

    print("\n" + "=" * 68 + "\n")


if __name__ == "__main__":
    main()
