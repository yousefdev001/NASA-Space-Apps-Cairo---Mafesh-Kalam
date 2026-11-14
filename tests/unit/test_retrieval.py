"""Unit Tests for Hybrid Retrieval & Cross-Encoder Reranking Core."""

import pytest
from services.rag_service.retrieval.hybrid_retriever import HybridRetriever, tokenize_query
from services.rag_service.retrieval.reranker import CrossEncoderReranker, sigmoid
from shared.contracts.rag_contract import ProtocolChunkResult


def test_sigmoid_calibration():
    """Asserts logistic sigmoid converts logits to calibrated probabilities."""
    assert pytest.approx(sigmoid(0.0), abs=1e-4) == 0.50
    assert sigmoid(10.0) > 0.999
    assert sigmoid(-10.0) < 0.001
    # Check extreme overflow safety
    assert sigmoid(1000.0) == 1.0
    assert sigmoid(-1000.0) == 0.0


def test_query_tokenization():
    """Asserts tokenizer preserves NASA acronyms and numbers."""
    tokens = tokenize_query("SpO2 dropped to 86.5% - emergency JSC-48031!")
    assert "spo2" in tokens
    assert "86.5" in tokens
    assert "jsc-48031" in tokens
    assert "emergency" in tokens


def test_bm25_search_hypoxia():
    """Asserts that BM25 returns relevant hypoxia and oxygen protocol chunks from NASA checklists."""
    retriever = HybridRetriever(bm25_index_path="data/bm25_index.pkl")
    results = retriever.search_bm25("emergency oxygen administration mask hypoxia", top_k=10)

    assert len(results) > 0
    top_chunks = [retriever.metadata_lookup[cid] for cid, _ in results[:5]]
    # At least one of the top chunks must be a Tier 1 medical checklist containing oxygen
    tier1_oxygen = [c for c in top_chunks if c["tier"] == 1 and "oxygen" in c["text"].lower()]
    assert len(tier1_oxygen) > 0
    assert any("NASA-CKLIST" in c["doc_id"] for c in tier1_oxygen)


def test_hybrid_retrieve_tier_partitioning():
    """Asserts that retrieve() strictly partitions Tier 1 chunks from Tier 2/3 chunks."""
    retriever = HybridRetriever(bm25_index_path="data/bm25_index.pkl")
    tier1_procs, context_chunks = retriever.retrieve(
        query="hypoxia oxygen emergency medical checklist",
        final_k=5
    )

    # Every chunk in tier1_procs must be Tier 1
    assert len(tier1_procs) > 0
    for chunk in tier1_procs:
        assert chunk.tier == 1
        assert "NASA-CKLIST" in chunk.doc_id

    # Every chunk in context_chunks must NOT be Tier 1
    for chunk in context_chunks:
        assert chunk.tier in (2, 3)


def test_reranker_with_mocked_model():
    """Asserts reranker scores candidate chunks via sigmoid calibration and sorts descending."""
    reranker = CrossEncoderReranker()

    class MockCrossEncoder:
        def predict(self, pairs, show_progress_bar=False):
            return [2.0, -1.0]

    reranker.model = MockCrossEncoder()
    sample_chunks = [
        ProtocolChunkResult(
            chunk_id="chk_01",
            doc_id="doc_1",
            doc_title="Rev K",
            tier=1,
            procedure_title="Oxygen",
            page_start=10,
            ref_label="Rev K, p.10",
            score=0.1,
            text="Administer emergency oxygen."
        ),
        ProtocolChunkResult(
            chunk_id="chk_02",
            doc_id="doc_2",
            doc_title="Standard 3001",
            tier=2,
            procedure_title="Overview",
            page_start=1,
            ref_label="Standard, p.1",
            score=0.1,
            text="General crew health standards."
        ),
    ]

    reranked = reranker.rerank("emergency oxygen", sample_chunks)
    assert len(reranked) == 2
    assert reranked[0].chunk_id == "chk_01"
    assert reranked[0].score > 0.85  # sigmoid(2.0) ~= 0.8808
    assert reranked[1].chunk_id == "chk_02"
    assert reranked[1].score < 0.30  # sigmoid(-1.0) ~= 0.2689


def test_reranker_fallback_when_uninitialized():
    """Asserts reranker gracefully preserves candidate chunks if model is uninitialized."""
    reranker = CrossEncoderReranker()
    reranker.model = None

    sample_chunks = [
        ProtocolChunkResult(
            chunk_id="chk_01",
            doc_id="doc_1",
            doc_title="Rev K",
            tier=1,
            procedure_title="Oxygen",
            page_start=10,
            ref_label="Rev K, p.10",
            score=0.9,
            text="Administer emergency oxygen."
        ),
        ProtocolChunkResult(
            chunk_id="chk_02",
            doc_id="doc_2",
            doc_title="Standard 3001",
            tier=2,
            procedure_title="Overview",
            page_start=1,
            ref_label="Standard, p.1",
            score=0.4,
            text="General crew health standards."
        ),
    ]

    # Temporarily disable _init_model
    reranker._init_model = lambda: None
    reranked = reranker.rerank("emergency oxygen", sample_chunks)
    assert len(reranked) == 2
    assert reranked[0].score == 0.9
