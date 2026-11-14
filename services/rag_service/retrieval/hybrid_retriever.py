"""Hybrid Knowledge Retrieval Engine (ChromaDB + Rank-BM25 + RRF).

Combines dense vector semantic similarity with sparse lexical matching
using Reciprocal Rank Fusion (k=60), then partitions results by Evidence Tier.
"""

import logging
import os
import pickle
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("auramed.retriever")

from shared.constants import BM25_TOP_K, DENSE_TOP_K, FINAL_TOP_K, RRF_K
from shared.contracts.rag_contract import ProtocolChunkResult

TOKENIZE_REGEX = re.compile(r'\b[a-zA-Z0-9_\-\.]{2,}\b')


def tokenize_query(query: str) -> List[str]:
    """Tokenize query string for BM25 search."""
    return TOKENIZE_REGEX.findall(query.lower())


class HybridRetriever:
    """Orchestrates dense vector search, sparse BM25 search, and RRF rank fusion."""

    def __init__(
        self,
        bm25_index_path: str = "data/bm25_index.pkl",
        chroma_path: str = "data/chroma_db",
        collection_name: str = "auramed_medical_knowledge",
        embedding_model_name: str = "intfloat/multilingual-e5-small",
        device: str = "cpu"
    ):
        self.bm25_index_path = bm25_index_path
        self.chroma_path = chroma_path
        self.collection_name = collection_name
        self.embedding_model_name = embedding_model_name
        self.device = device

        self.bm25 = None
        self.chunk_ids: List[str] = []
        self.metadata_lookup: Dict[str, Dict[str, Any]] = {}

        self.chroma_client = None
        self.collection = None
        self.embedding_model = None

        self._load_bm25()

    def _load_bm25(self):
        """Load pre-computed BM25 index and chunk metadata lookup table."""
        if Path(self.bm25_index_path).exists():
            with open(self.bm25_index_path, "rb") as f:
                payload = pickle.load(f)
                self.bm25 = payload["bm25"]
                self.chunk_ids = payload["chunk_ids"]
                self.metadata_lookup = payload["metadata_lookup"]

    def _init_chroma(self):
        """Lazy load ChromaDB persistent client and embedding model on CPU."""
        if self.collection is None and Path(self.chroma_path).exists():
            import chromadb
            self.chroma_client = chromadb.PersistentClient(path=self.chroma_path)
            try:
                self.collection = self.chroma_client.get_collection(name=self.collection_name)
            except Exception:
                self.collection = None

        if self.embedding_model is None and self.collection is not None:
            try:
                from sentence_transformers import SentenceTransformer
                try:
                    self.embedding_model = SentenceTransformer(
                        self.embedding_model_name,
                        device=self.device,
                        local_files_only=True
                    )
                except Exception:
                    self.embedding_model = SentenceTransformer(
                        self.embedding_model_name,
                        device=self.device
                    )
            except Exception:
                self.embedding_model = None

    def search_bm25(self, query: str, top_k: int = BM25_TOP_K) -> List[Tuple[str, float]]:
        """Execute sparse lexical search via BM25."""
        if not self.bm25 or not self.chunk_ids:
            return []

        tokens = tokenize_query(query)
        if not tokens:
            return []

        scores = self.bm25.get_scores(tokens)
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]

        results = []
        for idx in top_indices:
            score = float(scores[idx])
            if score > 0.0:
                results.append((self.chunk_ids[idx], score))
        return results

    def search_dense(self, query: str, top_k: int = DENSE_TOP_K) -> List[Tuple[str, float]]:
        """Execute dense semantic search via ChromaDB with resilient fallback."""
        self._init_chroma()
        if not self.collection or not self.embedding_model:
            return []

        try:
            query_embedding = self.embedding_model.encode(
                [query],
                normalize_embeddings=True,
                show_progress_bar=False
            ).tolist()
        except Exception as e:
            logger.warning("Dense embedding encoding failed: %s", e)
            return []

        res = None
        try:
            res = self.collection.query(
                query_embeddings=query_embedding,
                n_results=top_k
            )
        except Exception as err:
            logger.warning("Initial ChromaDB query failed (%s); attempting reconnection...", err)
            try:
                if self.chroma_client:
                    self.collection = self.chroma_client.get_collection(name=self.collection_name)
                    res = self.collection.query(
                        query_embeddings=query_embedding,
                        n_results=top_k
                    )
            except Exception as retry_err:
                logger.error("ChromaDB query retry failed: %s. Falling back to BM25 sparse search.", retry_err)
                return []

        results = []
        if res and res.get("ids") and res["ids"][0]:
            ids = res["ids"][0]
            distances = res["distances"][0] if "distances" in res and res["distances"] else [0.0] * len(ids)
            for cid, dist in zip(ids, distances):
                # Convert cosine distance to similarity score
                similarity = max(0.0, 1.0 - dist)
                results.append((cid, similarity))
        return results

    def reciprocal_rank_fusion(
        self,
        dense_results: List[Tuple[str, float]],
        bm25_results: List[Tuple[str, float]],
        rrf_k: int = RRF_K
    ) -> List[Tuple[str, float]]:
        """Merge dense and sparse search rankings using Reciprocal Rank Fusion."""
        rrf_scores: Dict[str, float] = {}

        # Dense rank contributions
        for rank, (chunk_id, _) in enumerate(dense_results):
            rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + (1.0 / (rrf_k + (rank + 1)))

        # BM25 rank contributions
        for rank, (chunk_id, _) in enumerate(bm25_results):
            rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + (1.0 / (rrf_k + (rank + 1)))

        # Sort descending by fused score
        merged = sorted(rrf_scores.items(), key=lambda item: item[1], reverse=True)
        return merged

    def retrieve(
        self,
        query: str,
        dense_k: int = DENSE_TOP_K,
        bm25_k: int = BM25_TOP_K,
        final_k: int = FINAL_TOP_K
    ) -> Tuple[List[ProtocolChunkResult], List[ProtocolChunkResult]]:
        """Retrieve and partition candidate chunks into Tier 1 procedures and Tier 2/3 context.

        Returns:
        -------
        Tuple[List[ProtocolChunkResult], List[ProtocolChunkResult]]:
            (tier1_procedures, context_chunks)
        """
        dense_results = self.search_dense(query, top_k=dense_k)
        bm25_results = self.search_bm25(query, top_k=bm25_k)

        # If both dense and sparse have results, apply RRF; otherwise fallback to whichever is available
        if dense_results and bm25_results:
            fused_candidates = self.reciprocal_rank_fusion(dense_results, bm25_results)
        elif dense_results:
            fused_candidates = dense_results
        else:
            fused_candidates = bm25_results

        def is_toc_or_index(txt: str) -> bool:
            txt_upper = txt.upper()
            if "TABLE OF CONTENTS" in txt_upper:
                return True
            if txt.count(".....") >= 2 or txt.count("(see ") >= 2:
                return True
            if "DELETED" in txt_upper and txt.count("TEMP") >= 3:
                return True
            return False

        tier1_procedures: List[ProtocolChunkResult] = []
        tier1_toc_fallback: List[ProtocolChunkResult] = []
        context_chunks: List[ProtocolChunkResult] = []

        for chunk_id, score in fused_candidates[:final_k * 4]:
            meta = self.metadata_lookup.get(chunk_id)
            if not meta:
                continue

            chunk_obj = ProtocolChunkResult(
                chunk_id=meta["chunk_id"],
                doc_id=meta["doc_id"],
                doc_title=meta["doc_title"],
                tier=meta["tier"],
                procedure_title=meta["procedure_title"],
                page_start=meta["page_start"],
                ref_label=meta["ref_label"],
                score=round(score, 4),
                text=meta["text"],
                has_warning=bool(meta.get("has_warning", False))
            )

            # Strict evidence-tier partitioning with operational preference
            if meta["tier"] == 1:
                if meta.get("is_toc", False) or is_toc_or_index(meta["text"]):
                    tier1_toc_fallback.append(chunk_obj)
                else:
                    tier1_procedures.append(chunk_obj)
            else:
                context_chunks.append(chunk_obj)

        if not tier1_procedures and tier1_toc_fallback:
            tier1_procedures = tier1_toc_fallback

        return tier1_procedures[:final_k], context_chunks[:final_k]


_retriever_singleton: Optional[HybridRetriever] = None


def get_retriever() -> HybridRetriever:
    """Get or create singleton instance of HybridRetriever, preventing duplicated model/client allocations."""
    global _retriever_singleton
    if _retriever_singleton is None:
        _retriever_singleton = HybridRetriever()
    return _retriever_singleton

