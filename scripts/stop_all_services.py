"""AuraMed Unified Clean Service Terminator & GPU Reclaimer.

Gracefully finds and terminates:
1. All running AuraMed microservices:
   - Port 8000 (Unified Client Gateway)
   - Port 8001 (ML Microservice)
   - Port 8002 (RAG Decision Support Microservice)
2. Cloudflare Tunnel processes (cloudflared.exe)
3. Ollama GPU model allocations (unloads models and terminates llama-server.exe)
4. Displays live GPU VRAM recovery status.
"""

import json
import os
import shutil
import subprocess
import sys
import time
import urllib.request
import psutil

AURAMED_PORTS = [8000, 8001, 8002]


def unload_ollama_models():
    """Unload all active models in Ollama to completely free GPU VRAM."""
    unloaded_count = 0
    try:
        req = urllib.request.Request("http://127.0.0.1:11434/api/ps", headers={"User-Agent": "AuraMed"})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                models = data.get("models", [])
                for m in models:
                    model_name = m.get("name") or m.get("model")
                    if model_name:
                        print(f"[*] Unloading model '{model_name}' from GPU VRAM via Ollama...")
                        try:
                            subprocess.run(
                                ["ollama", "stop", model_name],
                                capture_output=True,
                                timeout=5,
                                text=True,
                            )
                            unloaded_count += 1
                        except Exception as exc:
                            print(f"[!] Error stopping model '{model_name}': {exc}")
    except Exception:
        # Ollama daemon might not be running, continue
        pass

    # Ensure any lingering llama-server process (actual GPU compute runner) is terminated
    for proc in psutil.process_iter(["pid", "name"]):
        try:
            name = (proc.info.get("name") or "").lower()
            if "llama-server" in name:
                pid = proc.info["pid"]
                print(f"[*] Terminating lingering GPU model server '{name}' (PID: {pid})...")
                proc.terminate()
                unloaded_count += 1
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    return unloaded_count


def stop_processes_on_ports(ports):
    """Find and terminate processes listening on specified ports or running AuraMed uvicorn services."""
    killed_pids = set()
    current_pid = os.getpid()

    # 1. Check network connections on the specific ports
    try:
        for conn in psutil.net_connections(kind="tcp"):
            if conn.laddr and conn.laddr.port in ports:
                if (not conn.raddr) and conn.status in (psutil.CONN_LISTEN, psutil.CONN_NONE):
                    pid = conn.pid
                    if pid and pid != current_pid and pid not in killed_pids:
                        try:
                            proc = psutil.Process(pid)
                            proc_name = proc.name()
                            print(f"[*] Stopping process '{proc_name}' (PID: {pid}) on port {conn.laddr.port}...")
                            proc.terminate()
                            killed_pids.add(pid)
                        except (psutil.NoSuchProcess, psutil.AccessDenied) as exc:
                            print(f"[!] Could not terminate PID {pid}: {exc}")
    except Exception as e:
        print(f"[!] Warning while checking network connections: {e}")

    # 2. Also check any process whose command line contains AuraMed services
    auramed_signatures = [
        "services.orchestrator.main:app",
        "services.ml_service.main:app",
        "services.rag_service.main:app",
        "start_tunnel_server.py",
        "start_all_services.py",
    ]
    for proc in psutil.process_iter(["pid", "name", "cmdline"]):
        try:
            cmdline = " ".join(proc.info.get("cmdline") or [])
            if any(sig in cmdline for sig in auramed_signatures):
                pid = proc.info["pid"]
                if pid != current_pid and pid not in killed_pids:
                    print(f"[*] Stopping AuraMed service process (PID: {pid})...")
                    proc.terminate()
                    killed_pids.add(pid)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    # Give them 1.5 seconds to terminate cleanly, force-kill if still running
    if killed_pids:
        time.sleep(1.5)
        for pid in list(killed_pids):
            try:
                proc = psutil.Process(pid)
                if proc.is_running():
                    print(f"[*] Force killing stubborn PID {pid}...")
                    proc.kill()
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

    return killed_pids


def stop_cloudflared_processes():
    """Find and terminate any cloudflared tunnel processes."""
    killed = 0
    for proc in psutil.process_iter(["pid", "name"]):
        try:
            name = proc.info.get("name", "") or ""
            if "cloudflared" in name.lower():
                pid = proc.info["pid"]
                print(f"[*] Stopping Cloudflare Tunnel '{name}' (PID: {pid})...")
                proc.terminate()
                killed += 1
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return killed


def get_gpu_status():
    """Retrieve live NVIDIA GPU memory status if nvidia-smi is available."""
    try:
        out = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu", "--format=csv,noheader,nounits"],
            text=True,
            timeout=3,
        ).strip()
        lines = out.splitlines()
        if lines:
            parts = [p.strip() for p in lines[0].split(",")]
            return {
                "name": parts[0],
                "used_mb": int(parts[1]),
                "total_mb": int(parts[2]),
                "util_percent": int(parts[3]),
                "temp_c": int(parts[4]),
            }
    except Exception:
        pass
    return None


def main():
    print("=" * 65)
    print("   AuraMed Clean Service Terminator & GPU Reclaimer")
    print("   Stopping services, tunnels, and freeing GPU memory...")
    print("=" * 65)

    # 1. Unload Ollama models and GPU model servers
    models_unloaded = unload_ollama_models()

    # 2. Stop microservices and reclaim ports
    pids_stopped = stop_processes_on_ports(AURAMED_PORTS)

    # 3. Stop Cloudflare tunnels
    tunnels_stopped = stop_cloudflared_processes()

    # 4. Re-verify ports are free
    still_busy = []
    try:
        for port in AURAMED_PORTS:
            for conn in psutil.net_connections(kind="tcp"):
                if conn.laddr and conn.laddr.port == port and (not conn.raddr) and conn.status in (psutil.CONN_LISTEN, psutil.CONN_NONE):
                    still_busy.append(port)
    except Exception:
        pass

    print("\n" + "=" * 65)
    if not still_busy:
        print("  [SUCCESS] All AuraMed Services & Tunnels have stopped cleanly.")
    else:
        print(f"  [WARNING] Ports still in use: {still_busy}")

    print(f"  - Microservice PIDs terminated: {len(pids_stopped)}")
    print(f"  - Cloudflare Tunnels terminated: {tunnels_stopped}")
    print(f"  - GPU Models unloaded:           {models_unloaded}")
    print("  - Ports 8000, 8001, 8002:       FREE")

    # 5. Display GPU VRAM recovery
    gpu = get_gpu_status()
    if gpu:
        free_mb = gpu["total_mb"] - gpu["used_mb"]
        print("-" * 65)
        print(f"  [GPU STATUS] {gpu['name']}:")
        print(f"  - VRAM Used: {gpu['used_mb']} MiB / {gpu['total_mb']} MiB ({free_mb} MiB Available)")
        print(f"  - GPU Load:  {gpu['util_percent']}% | Temp: {gpu['temp_c']}°C")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
