# AGENTS.md
# Healthcare AI System — NASA Space Apps 2026

## 1. Project Identity

Project: Healthcare AI System
Context: NASA Space Apps Challenge 2026

The system is a medical decision-support platform designed to process physiological readings, detect anomalies, retrieve relevant medical procedures, and generate evidence-grounded guidance.

The system must prioritize:
- Reliability.
- Data integrity.
- Evidence-based outputs.
- Traceability.
- Privacy.
- Graceful degradation.
- Independent service architecture.

This is a decision-support system, not an autonomous medical diagnosis or treatment system.

## 2. Target Architecture

The target architecture consists of:

1. Main Backend — external integration, technology TBD.
2. ML Service — independent FastAPI microservice.
3. RAG Service — independent FastAPI microservice.
4. MySQL — structured application database.
5. ChromaDB — initial vector database.
6. Ollama — local model runtime.
7. LLM Gateway — cloud provider and local fallback orchestration.

The Main Backend technology and Cloud LLM provider are not decided.

Do not assume or select them without approval.

## 3. Confirmed Technology Stack

### Application and API
- Python.
- FastAPI.
- Uvicorn.
- Pydantic v2.
- SQLAlchemy.
- Alembic.
- HTTPX.
- Pytest.

### Databases
- MySQL for structured application data.
- ChromaDB initially for vector storage.
- Qdrant as a candidate for future benchmarking.
- BM25 for lexical retrieval.

### AI and Retrieval
- Sentence Transformers.
- BGE embeddings as an initial candidate.
- Cross-Encoder reranking.
- Reciprocal Rank Fusion.
- RAGAS and custom evaluation scripts.

### Document Processing
- PyMuPDF.
- OCRmyPDF or Tesseract when OCR is required.

### Infrastructure
- Docker.
- Docker Compose.
- Git.
- Environment variables.

## 4. Existing Local Hardware and AI Environment

Development machine:
- Windows 11 Pro.
- NVIDIA Quadro RTX 3000 Max-Q.
- 6GB VRAM.
- 32GB RAM.
- Intel Core i7-10850H.

Existing Ollama installation and models:
- Qwen2.5-Coder:14B.
- DeepSeek-R1:8B.
- MedGemma 1.5 4B.

Important:
- Verify exact model tags locally.
- Do not assume model aliases.
- Do not download models unnecessarily.
- Do not delete or replace existing models.
- Do not load multiple large models simultaneously without checking available memory.
- MedGemma is the primary candidate for medical-oriented local fallback.
- DeepSeek-R1 is a general reasoning candidate.
- Qwen2.5-Coder is for development tasks only.

## 5. Database Responsibilities

### MySQL

Responsible for structured application data:
- Application entities.
- Medical records where authorized.
- ML predictions.
- Request tracking.
- Audit metadata.
- System configuration.

Do not finalize the schema before reviewing the actual data and integration requirements.

### ChromaDB

Responsible for:
- Document embeddings.
- Chunk embeddings.
- Semantic retrieval.
- Metadata filtering.
- Persistent vector collections.

The initial retrieval architecture may combine:
- Dense retrieval.
- BM25 retrieval.
- Reciprocal Rank Fusion.
- Cross-Encoder reranking.

Qdrant must be benchmarked before replacing ChromaDB.

## 6. RAG Knowledge Architecture

Medical knowledge sources are organized by evidence tier.

Tier 1:
Operational procedures and medical checklists.

Tier 2:
Medical standards and care-level references.

Tier 3:
Medical condition lists and background evidence.

Only approved Tier 1 sources may support operational action steps.

Tier 2 and Tier 3 may provide supporting context but must not independently generate procedural treatment steps.

Preserve:
- Document ID.
- Document title.
- Source URL.
- Source version.
- SHA256.
- Download date.
- Page numbers.
- Section.
- Chunk ID.
- Evidence tier.
- Procedure title.

Never invent source references or page numbers.

## 7. Medical Logic and Safety Boundaries

- ML is responsible for anomaly detection.
- The RAG service receives ML output and physiological readings.
- Rule-based checks calculate severity.
- Rules may increase severity but must never decrease it.
- LLM output must never override severity.
- LLM hypotheses are not confirmed diagnoses.
- Every generated action step must reference a retrieved source chunk.
- No approved Tier 1 evidence means no generated procedural guidance.
- Critical escalation must not wait for LLM generation.
- Validation failure must result in extractive fallback or a controlled error.

The system must preserve the original source wording where required for safety.

## 8. ML-RAG Data Contract

The proposed input includes:
- request_id.
- astronaut_id.
- timestamp.
- anomaly_label.
- confidence_score.
- physiological readings.
- rolling statistics.
- window_count.

The final contract must be verified against the actual ML model and its documentation.

Do not rename ML fields or invent model outputs.

Do not assume that anomaly_label is a medical diagnosis.

## 9. Retrieval Architecture

The proposed pipeline:

1. Validate the request.
2. Calculate deterministic rule flags.
3. Build a deterministic search query.
4. Retrieve dense candidates.
5. Retrieve BM25 candidates.
6. Merge using Reciprocal Rank Fusion.
7. Rerank candidates.
8. Apply evidence-tier and confidence gates.
9. Return approved chunks or no_protocol_found.

Initial parameters are experimental:
- Dense top K: 30.
- BM25 top K: 30.
- RRF k: 60.
- Reranking candidates: 20.
- Final candidates: 5.

Tune these parameters using a manually reviewed golden dataset.

Do not treat reranker scores as calibrated probabilities without validation.

## 10. LLM Architecture

Primary provider:
Cloud LLM API — not selected.

Fallback:
Ollama local runtime.

Local model roles:
- MedGemma 1.5 4B: medical-oriented tasks.
- DeepSeek-R1 8B: general reasoning.
- Qwen2.5-Coder 14B: coding only.

Use provider adapters through an LLM Gateway.

The Gateway must support:
- Timeouts.
- Bounded retries.
- Provider health checks.
- Circuit breaker.
- Model identification.
- Structured output validation.
- Local fallback.
- Failure reporting.

Do not assume cloud and local models have equivalent capabilities.

Do not send sensitive medical data to external APIs without explicit authorization and an approved privacy policy.

## 11. Online-First / Offline-Fallback Architecture

The system must support two operating modes.

### Online Mode
- Cloud LLM API is the primary generation provider.
- Local Ollama remains available as fallback.
- Local databases and retrieval services remain operational.
- Embedding models must run locally.

### Offline Mode
When internet connectivity or the Cloud LLM provider becomes unavailable:
- Automatically route generation requests to Ollama.
- Use locally installed models.
- Continue using local MySQL.
- Continue using local ChromaDB.
- Continue using locally cached medical documents.
- Continue using local embedding and retrieval models.
- Do not require user intervention to switch modes.

### Recovery
When connectivity returns:
- Verify Cloud provider health.
- Restore Cloud as primary after successful health checks.
- Avoid switching providers on every request.
- Use Circuit Breaker and bounded retries.
- Record provider transitions.

### Privacy
- Do not transmit medical data to external providers without explicit authorization.
- Support configurable data-redaction policies.
- Never send sensitive medical records to cloud providers by default.

### Offline Readiness
All required inference and retrieval assets must be available locally:
- Ollama models.
- Embedding models.
- Reranking models if used.
- Medical document index.
- Source documents.
- Required application dependencies.

The application must expose its current operating mode and provider status through health monitoring.

If neither Cloud nor local generation is available, return a structured error. Never fabricate a medical response.

### Main Backend Constraint
The complete offline workflow requires the Main Backend and user interface to be locally accessible or available over a local network.

A cloud-hosted Main Backend alone cannot satisfy full offline operation.

## 12. API Standards

- Use versioned API paths.
- Use Pydantic request and response schemas.
- Include request_id in every relevant request.
- Return request_id in responses.
- Support X-Request-Id.
- Use structured error responses.
- Configure explicit timeouts.
- Use bounded retries.
- Document every endpoint.

Target RAG endpoints:
- POST /v1/protocols/retrieve
- POST /v1/guidance/generate
- GET /health
- GET /v1/index/info

Do not implement them during Environment Setup.

## 13. Project Execution Phases

Phase 01: Environment Setup.

Phase 02: Data Discovery and Model Discovery.

Phase 03: Architecture and Contract Finalization.

Phase 04: ML and RAG Implementation.

Phase 05: Integration.

Phase 06: Evaluation and Testing.

Never skip a phase or implement later-phase business logic without approval.

## 14. Current Authorized Agent Scope

CURRENT_PHASE = ENVIRONMENT_SETUP

The Agent is authorized to:
- Audit the existing development environment.
- Verify installed software.
- Prepare isolated Python environments.
- Configure Docker infrastructure.
- Verify MySQL connectivity.
- Prepare ChromaDB infrastructure.
- Verify Ollama connectivity and installed models.
- Create project directories.
- Create configuration templates.
- Prepare health checks.
- Write technical documentation.

The Agent is NOT authorized to:
- Implement ML logic.
- Implement RAG logic.
- Build document ingestion pipelines.
- Implement LLM Gateway.
- Train or fine-tune models.
- Modify model weights.
- Build production APIs.
- Create final database schemas.
- Process actual medical datasets.
- Upload medical data to external services.

## 15. Environment Safety

- Inspect before installing.
- Preserve existing working installations.
- Do not overwrite existing databases.
- Do not delete files.
- Do not expose database ports publicly.
- Do not hardcode credentials.
- Keep .env out of Git.
- Maintain .env.example.
- Use persistent Docker volumes.
- Verify disk space before downloads.
- Ask before destructive operations.
- Ask before paid services or external data transfer.

## 16. Testing Standards

For environment setup:
- Python import checks.
- Database connectivity checks.
- Docker health checks.
- ChromaDB insert/retrieve tests using temporary data.
- Ollama API checks.
- Local model smoke tests.
- Git secret-exclusion checks.

For future application implementation:
- Unit tests.
- Contract tests.
- Integration tests.
- Retrieval evaluation.
- Model evaluation.
- End-to-end tests.

## 17. Agent Workflow

For each task:

1. Read this file.
2. Inspect the current environment.
3. Identify existing installations and dependencies.
4. Prepare a step-by-step plan.
5. Identify risks.
6. Execute only authorized actions.
7. Verify every change.
8. Update documentation.
9. Report modified files.
10. List unresolved issues.

Do not silently change architecture decisions.

## 18. Definition of Done — Phase 01

Phase 01 is complete only when:

- Environment audit is documented.
- Python environment is working.
- Dependencies are pinned.
- Docker infrastructure is verified.
- MySQL connectivity is verified.
- ChromaDB connectivity is verified.
- Ollama is reachable.
- Existing models are inventoried.
- Model smoke test is completed.
- Project structure is prepared.
- .env.example is documented.
- .gitignore is verified.
- Health checks pass.
- Setup documentation is complete.
- No business logic has been implemented.

## 19. Final Report

Produce:
- Environment audit.
- Installed software and versions.
- Hardware compatibility observations.
- Database status.
- Docker status.
- Ollama model inventory.
- Verification results.
- Files created or modified.
- Known issues.
- Pending decisions.
- Recommended next phase.

STOP after Phase 01.

Wait for explicit user approval before proceeding to Phase 02.
