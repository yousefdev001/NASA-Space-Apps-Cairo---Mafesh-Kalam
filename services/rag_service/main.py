"""AuraMed RAG Decision Support Microservice (Port 8002).

Independent FastAPI microservice providing:
- Fast-path checklist retrieval (POST /v1/protocols/retrieve)
- Evidence-grounded clinical guidance generation (POST /v1/guidance/generate)
- System health & index telemetry (GET /health, GET /v1/index/info)
"""

from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from shared.offline_docs import get_offline_swagger_html
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from services.rag_service.routers.guidance import router as guidance_router
from services.rag_service.routers.health import router as health_router
from services.rag_service.routers.protocols import router as protocols_router
from services.rag_service.routers.chat import router as chat_router
from services.rag_service.routers.voice import router as voice_router
from services.rag_service.gateway.llm_gateway import gateway_instance


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Verify retriever and Ollama readiness on startup."""
    mode = await gateway_instance.get_operating_mode()
    print(f"[RAG-SERVICE] Starting on port 8002... Mode: {mode}")
    yield
    print("[RAG-SERVICE] Shutting down.")


app = FastAPI(
    title="AuraMed RAG Decision Support Service",
    version="1.0.0",
    description="NASA Space Apps 2026 Evidence-Grounded Medical Decision Support System",
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local offline static assets
static_path = Path(__file__).resolve().parent.parent.parent / "static"
if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

# Mount Routers
app.include_router(protocols_router)
app.include_router(guidance_router)
app.include_router(health_router)
app.include_router(chat_router)
app.include_router(voice_router)


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """Offline-resilient Swagger UI documentation using local assets."""
    return get_offline_swagger_html(
        openapi_url=app.openapi_url,
        title="AuraMed RAG Microservice",
        service_name="RAG Microservice",
        current_port=8002
    )


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.rag_service.main:app", host="0.0.0.0", port=8002, reload=True)
