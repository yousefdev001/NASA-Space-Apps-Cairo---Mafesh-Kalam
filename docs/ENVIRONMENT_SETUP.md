# Healthcare AI — Environment Setup Guide
**Context:** NASA Space Apps Challenge 2026  
**Stack:** Python 3.11, FastAPI, ChromaDB, MySQL 9.4, Ollama  

---

## 1. Prerequisites
- **Operating System:** Windows 11 Pro 64-bit.
- **Python Package Manager:** `uv` (`0.12.6+`) installed.
- **Database:** Native MySQL 9.4 or Docker Compose.
- **Local AI:** Ollama running on `127.0.0.1:11434`.

---

## 2. Virtual Environment Setup
Create and activate the isolated virtual environment:

```powershell
# Create Python 3.11 environment using uv
$env:UV_SYSTEM_CERTS = "true"
uv venv .venv --python 3.11

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install pinned foundational dependencies
uv pip install -r requirements.txt --system-certs
```

---

## 3. Configuration Setup
Copy the environment template and inspect settings:

```powershell
Copy-Item .env.example .env
```

Key environment configurations in `.env`:
- `SYSTEM_OPERATING_MODE=offline` (or `online` when cloud API is configured).
- `MYSQL_HOST=127.0.0.1` and `MYSQL_PORT=3306`.
- `CHROMA_PERSIST_DIRECTORY=./data/chroma_db`.
- `OLLAMA_BASE_URL=http://localhost:11434`.

---

## 4. Verification & Smoke Testing
Run the automated verification suite to validate all infrastructure components:

```powershell
# Run the end-to-end verification script
.\.venv\Scripts\python scripts/verify_environment.py

# Run the pytest smoke tests
.\.venv\Scripts\pytest tests/test_environment_smoke.py -v
```

---

## 5. Docker Infrastructure (Optional)
If running MySQL or ChromaDB inside Docker containers instead of native services:

```powershell
docker compose -f infrastructure/docker-compose.yml up -d
```
