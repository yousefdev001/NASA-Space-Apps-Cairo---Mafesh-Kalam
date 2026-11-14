"""AuraMed RAG Service Routers."""

from services.rag_service.routers.guidance import router as guidance_router
from services.rag_service.routers.health import router as health_router
from services.rag_service.routers.protocols import router as protocols_router

__all__ = ["protocols_router", "guidance_router", "health_router"]
