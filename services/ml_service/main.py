"""AuraMed Machine Learning Microservice (Port 8001).

Runs independent FastAPI service providing real-time anomaly detection and
NASA Spaceflight Multi-Hazard predictions.
"""

from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from shared.offline_docs import get_offline_swagger_html
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from services.ml_service.router import router as ml_router
from services.ml_service.model_runner import runner_instance


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context verifying ML model readiness on startup."""
    print(f"[ML-SERVICE] Starting on port 8001... Models loaded: {runner_instance.is_ready()}")
    yield
    print("[ML-SERVICE] Shutting down.")


app = FastAPI(
    title="AuraMed ML Anomaly Service",
    version="1.0.0",
    description="Independent FastAPI Microservice for Spaceflight Multi-Hazard Anomaly Detection",
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

# Mount Router
app.include_router(ml_router)


@app.get("/health", include_in_schema=False)
async def health():
    return {
        "status": "healthy" if runner_instance.is_ready() else "degraded",
        "service": "ml_service",
        "models_loaded": runner_instance.is_ready(),
        "models_dir": str(runner_instance.models_dir)
    }


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """Offline-resilient Swagger UI documentation using local assets."""
    return get_offline_swagger_html(
        openapi_url=app.openapi_url,
        title="AuraMed ML Anomaly Service",
        service_name="ML Microservice",
        current_port=8001
    )


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.ml_service.main:app", host="0.0.0.0", port=8001, reload=True)
