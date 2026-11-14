# AuraMed Phase 2 Technical Specification: PDF Ingestion & Hybrid Retrieval Core

**Feature**: `001-core-engine` | **Phase**: `02-retrieval-core` | **Date**: 2026-11-13  
**Status**: Ready for Implementation | **Target Services**: `services/rag-service/retrieval/`

---

## 1. Objective & Architecture Overview
Transform the 8 NASA medical knowledge base PDFs in `data/raw/` into a persistent, offline-capable, dual-index hybrid retrieval engine combining:
1. **Dense Vector Retrieval**: ChromaDB persistent store with CPU-pinned `BAAI/bge-small-en-v1.5` embeddings (384 dimensions).
2. **Sparse Lexical Retrieval**: Rank-BM25 sparse index persisted as a serialized data structure.
3. **Reciprocal Rank Fusion (RRF)**: Merges dense and sparse ranks with constant $k=60$.
4. **CPU Cross-Encoder Reranking**: `BAAI/bge-reranker-base` evaluating candidates against calibrated probability $\sigma(z) \ge 0.50$.
5. **Evidence-Tier Partitioning**: Segregating Tier 1 (Rev K, Rev H, 177788 operational checklists) from Tier 2 (NASA-STD-3001) and Tier 3 (Condition lists and Evidence reports).

---

## 2. PDF Processing & Chunking Strategy

### 2.1 Text Extraction via PyMuPDF
- Direct digital stream extraction using `fitz.open()`.
- Pre-validated digital text coverage > 95.6% across all 8 documents (no OCR required).
- Per-page extraction preserving page numbering, section headings, warnings, and numbered action lists.

### 2.2 Medical Semantic Chunking Rules
- **Boundary Detection**: Splits along section headers (`SECTION`, `CHECKLIST`, `PROCEDURE`, uppercase headers) and numbered list sequences (`1. `, `2. `).
- **Chunk Size**: Target 400–700 characters (~100–180 tokens).
- **Overlap**: 100 characters to prevent loss of clinical continuity between procedural steps.
- **Metadata Payload**:
  - `chunk_id`: Deterministic hash or sequential ID: `{doc_id}_p{page}_{chunk_idx}`.
  - `doc_id`: String identifier matching `data/sources.yaml` (e.g. `NASA-CKLIST-REVK`).
  - `doc_title`: Human-readable title from sources catalog.
  - `tier`: Integer {1, 2, 3}.
  - `procedure_title`: Inferred or parsed section title.
  - `page_start`: Physical PDF page index (1-based).
  - `ref_label`: Official citation format: `{doc_title}, p.{page}`.
  - `has_warning`: Boolean indicating presence of WARNING / CAUTION notices.

---

## 3. Dual-Index Storage Architecture

### 3.1 ChromaDB Persistent Collection
- **Directory**: `data/chroma_db/`
- **Collection Name**: `auramed_medical_knowledge`
- **Embedding Model**: `BAAI/bge-small-en-v1.5` running strictly on CPU (`device="cpu"`).
- **Distance Metric**: Cosine similarity (`hnsw:space: cosine`).
- **RAM Footprint**: $< 250 \text{ MB}$. VRAM Footprint: $0 \text{ MB}$ (reserves 100% Quadro RTX 3000 VRAM for Ollama LLM).

### 3.2 Rank-BM25 Lexical Index
- **File**: `data/bm25_index.pkl`
- **Tokenizer**: Lowercase alphanumeric regex tokenizer with spaceflight medical stopword filtering.
- **Corpus**: Tokenized chunks mapped 1:1 to ChromaDB IDs.

---

## 4. Query Synthesis & Retrieval Pipeline

### 4.1 Algorithmic Query Synthesis (`query_builder.py`)
Deterministic function translating clinical hypotheses and vital telemetry into targeted retrieval queries:
```python
def build_retrieval_query(vitals: MLPredictRequest, assessment: SeverityAssessment) -> str:
    # 1. Hypotheses (e.g. "hypoxia suspected tachycardia")
    # 2. Vital violations (e.g. "spo2 percent 86.5 heart rate bpm 115")
    # 3. Context anchor: "emergency medical procedure checklist action steps"
```

### 4.2 Hybrid Fusion & Reranking (`hybrid_retriever.py`, `reranker.py`)
1. **Dense Query**: Top 30 chunks from ChromaDB.
2. **BM25 Query**: Top 30 chunks from BM25 index.
3. **RRF Merge**:
   $$RRF(d) = \frac{1}{60 + rank_{dense}(d)} + \frac{1}{60 + rank_{bm25}(d)}$$
4. **Reranking**: Top 20 RRF candidates scored via Cross-Encoder $\sigma(z) = \frac{1}{1 + e^{-z}}$.
5. **Gating**: Top 5 chunks; only chunks where `tier == 1` and score $\ge 0.50$ admitted into `tier1_procedures`.

---

## 5. Acceptance Criteria
- [ ] Chunking pipeline executes on all 8 PDFs without data loss or exceptions.
- [ ] ChromaDB persistent collection created and queryable offline.
- [ ] BM25 index saved and queryable offline.
- [ ] Test query for acute hypoxia (`spo2 <= 88%`) returns Rev K hypoxia checklist as Hit@1.
- [ ] End-to-end retrieval latency $\le 150 \text{ ms}$ on local CPU.
