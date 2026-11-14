"""Health Check and Index Telemetry Router for RAG Service."""

from typing import Any, Dict
from fastapi import APIRouter, status

from services.rag_service.gateway.llm_gateway import gateway_instance
from services.rag_service.routers.protocols import retriever_instance

router = APIRouter(tags=["Health & Index Telemetry"])


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check() -> Dict[str, Any]:
    """Report microservice operational status, offline mode, and component readiness."""
    mode = await gateway_instance.get_operating_mode()
    has_index = retriever_instance.bm25 is not None

    return {
        "status": "healthy" if has_index else "degraded",
        "service": "rag_service",
        "mode": mode,
        "indexed_chunks": len(retriever_instance.chunk_ids),
        "ollama_connected": mode in ("online", "offline"),
        "port": 8002
    }


@router.get("/v1/index/info", status_code=status.HTTP_200_OK)
async def index_info() -> Dict[str, Any]:
    """Report knowledge base catalog statistics partitioned by evidence tier."""
    tier_counts = {1: 0, 2: 0, 3: 0}
    for chunk in retriever_instance.metadata_lookup.values():
        t = chunk.get("tier", 3)
        tier_counts[t] = tier_counts.get(t, 0) + 1

    return {
        "total_chunks": len(retriever_instance.chunk_ids),
        "tier_distribution": {
            "tier1_checklists": tier_counts[1],
            "tier2_standards": tier_counts[2],
            "tier3_background": tier_counts[3]
        },
        "retrieval_architecture": "Hybrid RRF (ChromaDB + Rank-BM25 + Cross-Encoder)"
    }
