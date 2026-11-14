"""
Automated Pytest Suite for Healthcare AI — Phase 01: Environment Setup Verification.
"""
import sys
import socket
import pytest
import httpx
import chromadb

def test_python_version_and_runtime():
    """Verify Python runtime >= 3.11"""
    assert sys.version_info >= (3, 11), "Python 3.11+ required"

def test_foundational_imports():
    """Verify all pinned foundational dependencies import without error"""
    import fastapi
    import uvicorn
    import pydantic
    import pydantic_settings
    import sqlalchemy
    import alembic
    import pymysql
    import httpx
    import chromadb
    import pytest
    import dotenv
    assert True

def test_mysql_port_listening():
    """Verify MySQL 9.4 service is responding on port 3306"""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(2.0)
    res = s.connect_ex(("127.0.0.1", 3306))
    s.close()
    assert res == 0, "MySQL port 3306 should be actively listening"

def test_chromadb_offline_persistence(tmp_path):
    """Verify ChromaDB collection creation, offline embedding insert, query, and persistence"""
    persist_dir = str(tmp_path / "chroma_test")
    client = chromadb.PersistentClient(path=persist_dir)
    col = client.create_collection("pytest_collection")
    
    # 4D synthetic vectors
    col.add(
        embeddings=[[1.0, 0.0, 0.0, 0.0], [0.0, 1.0, 0.0, 0.0]],
        documents=["NASA protocol chunk 1", "Routine maintenance chunk 2"],
        metadatas=[{"tier": 1}, {"tier": 2}],
        ids=["p1", "p2"]
    )
    
    # Query with metadata filter
    results = col.query(
        query_embeddings=[[0.9, 0.1, 0.0, 0.0]],
        n_results=1,
        where={"tier": 1}
    )
    assert len(results["ids"][0]) == 1
    assert results["ids"][0][0] == "p1"
    
    # Check persistence
    del client
    del col
    client2 = chromadb.PersistentClient(path=persist_dir)
    col2 = client2.get_collection("pytest_collection")
    assert col2.count() == 2
    del client2

def test_ollama_api_connectivity():
    """Verify Ollama service is reachable on port 11434 and has models installed"""
    url = "http://127.0.0.1:11434/api/tags"
    resp = httpx.get(url, timeout=5.0)
    assert resp.status_code == 200
    models = resp.json().get("models", [])
    assert len(models) > 0, "At least one model must be installed in Ollama"
    model_names = [m["name"] for m in models]
    assert any("deepseek-r1" in name or "qwen2.5-coder" in name for name in model_names)
