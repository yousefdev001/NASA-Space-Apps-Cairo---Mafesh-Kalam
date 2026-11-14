"""AuraMed Unified Orchestrator and Client API Gateway (Port 8000).

Provides single-point access for Web and Mobile client applications,
CORS handling, health monitoring, and interactive OpenAPI documentation.
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import json
import logging
import os
from pathlib import Path
import time
from urllib.parse import parse_qs
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from starlette.types import ASGIApp, Receive, Scope, Send
from shared.offline_docs import get_offline_swagger_html
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from services.orchestrator.router import router as orchestrator_router
from services.rag_service.routers.chat import router as chat_router
from services.rag_service.routers.voice import router as voice_router
from services.rag_service.routers.protocols import router as protocols_router
from services.rag_service.routers.guidance import router as guidance_router
from services.rag_service.routers.health import index_info
from services.ml_service.router import router as ml_router
from services.rag_service.gateway.llm_gateway import gateway_instance

import sys
if sys.platform == "win32":
    import asyncio
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    except Exception:
        pass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("auramed.gateway.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Set exception handler on loop to gracefully ignore client disconnects
    if sys.platform == "win32":
        try:
            loop = asyncio.get_running_loop()
            def _loop_exc_handler(l, ctx):
                exc = ctx.get("exception")
                if isinstance(exc, (OSError, ConnectionResetError, BrokenPipeError)):
                    return
                l.default_exception_handler(ctx)
            loop.set_exception_handler(_loop_exc_handler)
        except Exception:
            pass

    logger.info("Initializing AuraMed Unified Client Gateway...")
    mode = await gateway_instance.get_operating_mode()
    logger.info(f"LLM Gateway operational mode: {mode}")
    yield
    logger.info("AuraMed Unified Client Gateway shut down cleanly.")


class APIKeySecurityMiddleware:
    """Security middleware that verifies X-API-Key or Bearer token when AURAMED_API_KEY is set."""

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] not in ("http", "websocket"):
            await self.app(scope, receive, send)
            return

        expected_key = os.getenv("AURAMED_API_KEY", "").strip()
        require_auth = os.getenv("AURAMED_REQUIRE_AUTH", "false").lower() == "true"
        # If authentication not strictly enforced or no key configured, allow open access (development mode)
        if not expected_key or not require_auth:
            await self.app(scope, receive, send)
            return

        # Bypass CORS preflight OPTIONS requests
        if scope.get("method") == "OPTIONS":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        # Public endpoints that never require an API key
        public_prefixes = (
            "/health",
            "/ml/health",
            "/v1/index/info",
            "/api/v1/voice/",
            "/chat",
            "/docs",
            "/openapi.json",
            "/static",
            "/favicon.ico",
        )
        if path in ("/", "/index") or any(path.startswith(p) for p in public_prefixes):
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))

        # Browser Same-Origin bypass (allows interactive web studio and chat page to work seamlessly)
        sec_fetch_site = headers.get(b"sec-fetch-site", b"").decode("latin1").lower()
        if sec_fetch_site in ("same-origin", "none"):
            await self.app(scope, receive, send)
            return

        # Direct local development loopback bypass (e.g. localhost / 127.0.0.1 / Android emulator 10.0.2.2)
        client_info = scope.get("client")
        client_ip = client_info[0] if client_info else ""
        if client_ip in ("127.0.0.1", "::1", "localhost", "10.0.2.2"):
            await self.app(scope, receive, send)
            return

        # Extract client API key from headers
        client_key = headers.get(b"x-api-key", b"").decode("latin1").strip()
        if not client_key and b"authorization" in headers:
            auth = headers[b"authorization"].decode("latin1").strip()
            if auth.lower().startswith("bearer "):
                client_key = auth[7:].strip()

        # Query param fallback for WebSockets/Flutter where custom headers might be unavailable
        if not client_key and scope.get("query_string"):
            query_params = parse_qs(scope["query_string"].decode("latin1"))
            if "api_key" in query_params and query_params["api_key"]:
                client_key = query_params["api_key"][0].strip()

        if client_key != expected_key:
            if scope["type"] == "http":
                response_body = json.dumps({
                    "error": "Unauthorized",
                    "detail": "Invalid or missing API Key. Provide a valid 'X-API-Key' header or 'Authorization: Bearer <token>'."
                }).encode("utf-8")
                await send({
                    "type": "http.response.start",
                    "status": 401,
                    "headers": [
                        (b"content-type", b"application/json"),
                        (b"content-length", str(len(response_body)).encode("ascii")),
                    ],
                })
                await send({
                    "type": "http.response.body",
                    "body": response_body,
                })
                return
            elif scope["type"] == "websocket":
                await send({"type": "websocket.close", "code": 4401})
                return

        await self.app(scope, receive, send)


app = FastAPI(
    title="AuraMed Medical Decision Support — Client API Gateway",
    description="Unified API gateway providing end-to-end telemetry assessment for NASA Space Apps 2026.",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
)

# API Key Security Middleware (evaluated inside CORS wrapper)
app.add_middleware(APIKeySecurityMiddleware)

# Cross-Origin Resource Sharing (CORS) for React Web & Flutter Mobile clients
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

REQUEST_LOG_FILE = Path(__file__).resolve().parent.parent.parent / "gateway_requests.log"

@app.middleware("http")
async def log_requests(request, call_next):
    t0 = time.perf_counter()
    response = await call_next(request)
    elapsed = (time.perf_counter() - t0) * 1000
    msg = f"{datetime.now(timezone.utc).isoformat()} [{request.method}] {request.url.path} -> {response.status_code} ({elapsed:.1f}ms)\n"
    try:
        with open(REQUEST_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(msg)
    except Exception:
        pass
    return response

def custom_openapi():
    """Inject API Key security scheme for interactive Swagger UI."""
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    openapi_schema["components"] = openapi_schema.get("components", {})
    openapi_schema["components"]["securitySchemes"] = {
        "ApiKeyAuth": {
            "type": "apiKey",
            "in": "header",
            "name": "X-API-Key",
            "description": "Enter API Key: auramed-secret-key-2026",
        }
    }
    openapi_schema["security"] = [{"ApiKeyAuth": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

app.include_router(orchestrator_router)
app.include_router(chat_router)
app.include_router(voice_router)
app.include_router(protocols_router)
app.include_router(guidance_router)
app.include_router(ml_router)

# Mount RAG index telemetry probe without shadowing gateway /health
app.get("/v1/index/info", status_code=status.HTTP_200_OK, tags=["Health & Index Telemetry"])(index_info)


@app.get("/health", status_code=status.HTTP_200_OK, tags=["System Health"])
async def gateway_health():
    """Verify gateway readiness and operating mode."""
    mode = await gateway_instance.get_operating_mode()
    return {
        "status": "healthy",
        "service": "auramed-client-gateway",
        "operating_mode": mode,
        "cloud_provider": "groq (openai/gpt-oss-20b)",
        "offline_fallback": "ollama (medgemma:latest)",
    }


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """Offline-resilient Swagger UI documentation using local assets."""
    return get_offline_swagger_html(
        openapi_url=app.openapi_url,
        title="AuraMed Client Gateway",
        service_name="Client Gateway",
        current_port=8000
    )


@app.get("/", include_in_schema=False)
@app.head("/", include_in_schema=False)
@app.get("/index", include_in_schema=False)
async def root():
    """AuraMed Gateway entrypoint redirecting to API documentation."""
    return RedirectResponse(url="/docs")
