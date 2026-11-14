# Docker Infrastructure Guide — AuraMed

AuraMed supports two infrastructure deployment models:

## Option A: Native Windows Services (Current Machine Baseline)
The development machine already runs local background services:
- **MySQL 9.4 Server**: Running on `127.0.0.1:3306` (Windows Service `MySQL94`).
- **Ollama Engine**: Running on `127.0.0.1:11434`.
- **ChromaDB**: Can run in embedded local mode (`CHROMA_MODE=embedded`, saving vectors to `./chroma_data`).

## Option B: Containerized Docker Environment
If you prefer isolated containerized databases:
1. Ensure Docker Desktop is launched and running.
2. Spin up MySQL and ChromaDB containers:
   ```bash
   docker compose -f docker/docker-compose.yml up -d
   ```
3. Check container status:
   ```bash
   docker compose -f docker/docker-compose.yml ps
   ```
4. Verify database health:
   ```bash
   docker compose -f docker/docker-compose.yml logs mysql
   docker compose -f docker/docker-compose.yml logs chromadb
   ```
5. Stop containers when done:
   ```bash
   docker compose -f docker/docker-compose.yml down
   ```
