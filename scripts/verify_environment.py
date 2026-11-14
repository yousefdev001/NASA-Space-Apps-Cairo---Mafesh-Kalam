"""
AuraMed Healthcare AI System - Phase 01 Environment Verification Script
Tests Python environment, core dependencies, Ollama connectivity, ChromaDB, and MySQL.
"""
import sys
import socket
import json
import time

def print_section(title: str):
    print("\n" + "=" * 70)
    print(f" {title}")
    print("=" * 70)

def test_python():
    print_section("1. Python Environment")
    print(f"Python Executable: {sys.executable}")
    print(f"Python Version: {sys.version.split()[0]}")
    assert sys.version_info >= (3, 11), "Python >= 3.11 required!"
    print(" [PASS] Python version compatible (>= 3.11)")

def test_imports():
    print_section("2. Core Dependencies Import Check")
    packages = [
        ("fastapi", "FastAPI"),
        ("uvicorn", "Uvicorn"),
        ("pydantic", "Pydantic v2"),
        ("sqlalchemy", "SQLAlchemy"),
        ("httpx", "HTTPX"),
        ("chromadb", "ChromaDB"),
        ("rank_bm25", "BM25"),
        ("fitz", "PyMuPDF"),
        ("sentence_transformers", "Sentence Transformers"),
    ]
    for mod_name, label in packages:
        try:
            mod = __import__(mod_name)
            ver = getattr(mod, "__version__", "unknown")
            print(f" [PASS] {label:<22} (version: {ver})")
        except ImportError as e:
            print(f" [FAIL] {label:<22} - {e}")
            raise

def test_ollama():
    print_section("3. Ollama Connectivity & Model Inventory")
    import httpx
    url = "http://localhost:11434/api/tags"
    try:
        resp = httpx.get(url, timeout=5.0)
        assert resp.status_code == 200, f"Ollama HTTP error: {resp.status_code}"
        data = resp.json()
        models = data.get("models", [])
        print(f" [PASS] Ollama service reachable at {url}")
        print(f" Total models installed: {len(models)}")
        for m in models:
            name = m.get("name")
            size_gb = m.get("size", 0) / (1024**3)
            print(f"  - {name:<25} ({size_gb:.2f} GB)")
        
        # Smoke test inference with deepseek-r1:8b or qwen2.5-coder:14b
        candidate_models = [m["name"] for m in models if "deepseek-r1:8b" in m["name"] or "qwen2.5-coder:14b" in m["name"]]
        if candidate_models:
            smoke_model = candidate_models[0]
            print(f"\n Performing smoke test inference on: {smoke_model}...")
            t0 = time.time()
            gen_resp = httpx.post(
                "http://localhost:11434/api/generate",
                json={"model": smoke_model, "prompt": "Respond with 'HEALTHY' only.", "stream": False},
                timeout=30.0
            )
            elapsed = time.time() - t0
            assert gen_resp.status_code == 200, f"Generate failed: {gen_resp.text}"
            res_text = gen_resp.json().get("response", "").strip()
            print(f" [PASS] Smoke inference succeeded in {elapsed:.2f}s: {res_text[:60]!r}")
        else:
            print(" [WARN] Neither deepseek-r1:8b nor qwen2.5-coder:14b found for smoke inference.")
    except Exception as e:
        print(f" [FAIL] Ollama check failed: {e}")
        raise

def test_chromadb():
    print_section("4. ChromaDB Vector Store Verification")
    import chromadb
    client = chromadb.EphemeralClient()
    collection_name = "test_smoke_collection"
    try:
        col = client.create_collection(name=collection_name)
        col.add(
            documents=["NASA medical procedure checklist: inspect airway."],
            metadatas=[{"source": "test_protocol", "tier": 1}],
            ids=["chunk_test_001"]
        )
        results = col.query(query_texts=["airway inspection"], n_results=1)
        assert len(results["ids"][0]) == 1
        assert results["ids"][0][0] == "chunk_test_001"
        print(" [PASS] ChromaDB Ephemeral insert and semantic query verified.")
        client.delete_collection(name=collection_name)
        print(" [PASS] ChromaDB test collection cleaned up.")
    except Exception as e:
        print(f" [FAIL] ChromaDB verification failed: {e}")
        raise

def test_mysql_port():
    print_section("5. MySQL Service / Port Check")
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(2.0)
    try:
        s.connect(("127.0.0.1", 3306))
        s.close()
        print(" [PASS] MySQL service listening on port 3306 (127.0.0.1:3306)")
    except Exception as e:
        print(f" [WARN] Port 3306 check: {e}")
        print(" Note: MySQL container can be run via docker/docker-compose.yml or local MySQL94 service.")

if __name__ == "__main__":
    print("=" * 70)
    print(" AuraMed Phase 01: Automated Environment Verification")
    print("=" * 70)
    try:
        test_python()
        test_imports()
        test_ollama()
        test_chromadb()
        test_mysql_port()
        print("\n" + "#" * 70)
        print(" ALL PHASE 01 ENVIRONMENT CHECKS PASSED SUCCESSFULLY!")
        print("#" * 70)
    except Exception as err:
        print(f"\n[ERROR] Environment verification halted: {err}")
        sys.exit(1)
