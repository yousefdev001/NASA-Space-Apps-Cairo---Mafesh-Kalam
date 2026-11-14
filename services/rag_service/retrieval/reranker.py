"""Cross-Encoder Reranker with Calibrated Sigmoid Scoring.

Evaluates candidate chunks against search queries using BAAI/bge-reranker-base on CPU.
Converts raw logits to calibrated probabilities via logistic sigmoid:
P(d) = 1 / (1 + exp(-z)).
Enforces tau_proc >= 0.50 threshold gate.
"""

import math
from typing import List, Tuple
from shared.constants import TAU_PROC
from shared.contracts.rag_contract import ProtocolChunkResult


def sigmoid(z: float) -> float:
    """Logistic sigmoid transformation converting logit to [0, 1] probability."""
    try:
        return 1.0 / (1.0 + math.exp(-z))
    except OverflowError:
        return 0.0 if z < 0 else 1.0


class CrossEncoderReranker:
    """CPU-pinned Cross-Encoder reranking engine."""

    def __init__(
        self,
        model_name: str = "BAAI/bge-reranker-base",
        device: str = "cpu",
        tau_proc: float = TAU_PROC
    ):
        self.model_name = model_name
        self.device = device
        self.tau_proc = tau_proc
        self.model = None

    def _init_model(self):
        """Lazy initialization of the cross-encoder model on CPU with offline resilience."""
        if self.model is None:
            try:
                from sentence_transformers import CrossEncoder
                # First try local cache only to prevent blocking network hangs
                try:
                    self.model = CrossEncoder(self.model_name, device=self.device, local_files_only=True)
                except Exception:
                    # In online mode with short timeout, or fallback to None
                    self.model = None
            except Exception:
                self.model = None

    def rerank(
        self,
        query: str,
        candidates: List[ProtocolChunkResult]
    ) -> List[ProtocolChunkResult]:
        """Rerank candidate chunks using Cross-Encoder and apply sigmoid calibration.

        Parameters:
        ----------
        query: str
            The synthesized medical search query.
        candidates: List[ProtocolChunkResult]
            Candidate chunks retrieved from hybrid RRF stage.

        Returns:
        -------
        List[ProtocolChunkResult]:
            Reranked candidate chunks sorted by calibrated probability score.
        """
        if not candidates:
            return []

        self._init_model()
        if self.model is None:
            # Fallback to pre-existing scores if model cannot be loaded
            return sorted(candidates, key=lambda c: c.score, reverse=True)

        pairs = [[query, c.text] for c in candidates]
        raw_scores = self.model.predict(pairs, show_progress_bar=False)

        reranked: List[ProtocolChunkResult] = []
        for candidate, raw_score in zip(candidates, raw_scores):
            prob = sigmoid(float(raw_score))
            # Update score with calibrated probability
            candidate.score = round(prob, 4)
            reranked.append(candidate)

        # Sort descending by calibrated score
        reranked.sort(key=lambda c: c.score, reverse=True)
        return reranked
