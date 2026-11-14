"""AuraMed Gateway Package (LLM & Voice Gateways)."""

from services.rag_service.gateway.llm_gateway import LLMGateway, gateway_instance
from services.rag_service.gateway.ollama_client import OllamaClient
from services.rag_service.gateway.tts_gateway import TTSGateway, tts_gateway_instance
from services.rag_service.gateway.vibevoice_tts_client import VibeVoiceTTSClient, vibevoice_tts_instance

__all__ = [
    "LLMGateway",
    "OllamaClient",
    "gateway_instance",
    "TTSGateway",
    "tts_gateway_instance",
    "VibeVoiceTTSClient",
    "vibevoice_tts_instance",
]
