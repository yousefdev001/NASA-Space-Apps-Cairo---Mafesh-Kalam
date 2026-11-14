"""Online-First / Offline-Fallback LLM Gateway.

Orchestrates generation requests across external Cloud APIs (Google Gemini Multi-Project Pool,
Groq Cloud API) and local offline Ollama runtime (medgemma:latest / deepseek-r1:8b).
Automatically rotates across API keys on quota exhaustion and falls back to local execution
without human intervention on network loss.
"""

import logging
import os
import time
from typing import Any, Dict, Optional, Tuple

from services.rag_service.gateway.gemini_llm_client import GeminiLLMClient, gemini_llm_client_instance
from services.rag_service.gateway.groq_client import GroqClient
from services.rag_service.gateway.ollama_client import OllamaClient

logger = logging.getLogger("auramed.gateway")


class LLMGateway:
    """Gateway orchestrating online cloud generation and offline Ollama failover."""

    def __init__(
        self,
        ollama_client: Optional[OllamaClient] = None,
        cloud_client: Optional[GroqClient] = None,
        gemini_client: Optional[GeminiLLMClient] = None,
        cloud_enabled: Optional[bool] = None,
    ):
        self.ollama_client = ollama_client or OllamaClient(timeout_seconds=90.0)
        self.cloud_client = cloud_client or GroqClient(timeout_seconds=25.0)
        self.gemini_client = gemini_client or gemini_llm_client_instance

        self.primary_provider = os.getenv("LLM_PRIMARY_PROVIDER", "gemini").lower().strip()

        if cloud_enabled is not None:
            self.cloud_enabled = cloud_enabled
        else:
            self.cloud_enabled = (
                self.gemini_client.is_configured()
                or self.cloud_client.is_configured()
            )

        self.default_mode = os.getenv("AURAMED_MODE", os.getenv("LLM_MODE", "auto")).lower().strip()
        self._cached_mode: Optional[str] = None
        self._last_mode_check: float = 0.0

    def set_default_mode(self, mode: str) -> str:
        """Set active default operating mode: 'online', 'offline', or 'auto'."""
        normalized = mode.lower().strip()
        if normalized not in ("online", "offline", "auto"):
            raise ValueError(f"Invalid mode '{mode}'. Choose 'online', 'offline', or 'auto'.")
        self.default_mode = normalized
        self._cached_mode = None
        logger.info(f"[LLM-GATEWAY] Switched default operating mode to '{self.default_mode}'.")
        return self.default_mode

    async def get_operating_mode(self) -> str:
        """Return current operating mode: online, offline, or degraded with 30s TTL cache."""
        if self.default_mode in ("offline", "online"):
            return self.default_mode

        now = time.time()
        if self._cached_mode and (now - self._last_mode_check < 30.0):
            return self._cached_mode

        if self.cloud_enabled:
            try:
                if self.gemini_client.is_configured() and await self.gemini_client.is_reachable():
                    self._cached_mode = "online"
                    self._last_mode_check = now
                    return "online"
                if self.cloud_client.is_configured() and await self.cloud_client.is_reachable():
                    self._cached_mode = "online"
                    self._last_mode_check = now
                    return "online"
            except Exception:
                pass

        try:
            if await self.ollama_client.is_reachable():
                self._cached_mode = "offline"
                self._last_mode_check = now
                return "offline"
        except Exception:
            pass

        self._cached_mode = "degraded"
        self._last_mode_check = now
        return "degraded"

    async def _generate_cloud(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
    ) -> Tuple[str, Dict[str, Any]]:
        """Attempt cloud generation using Gemini multi-project pool or Groq fallback."""
        if self.primary_provider == "gemini" or (self.primary_provider != "groq" and self.gemini_client.is_configured()):
            try:
                raw_json = await self.gemini_client.generate_json(
                    prompt=prompt,
                    system_instruction=system_instruction,
                )
                return "gemini", raw_json
            except Exception as exc:
                logger.warning(
                    f"Gemini multi-project generation failed: {exc}. "
                    "Checking if Groq fallback is configured."
                )
                if self.cloud_client.is_configured():
                    raw_json = await self.cloud_client.generate_json(
                        prompt=prompt,
                        system_instruction=system_instruction,
                    )
                    return "groq", raw_json
                raise
        else:
            try:
                raw_json = await self.cloud_client.generate_json(
                    prompt=prompt,
                    system_instruction=system_instruction,
                )
                return "groq", raw_json
            except Exception as exc:
                logger.warning(
                    f"Groq cloud generation failed: {exc}. "
                    "Checking if Gemini multi-project pool is configured."
                )
                if self.gemini_client.is_configured():
                    raw_json = await self.gemini_client.generate_json(
                        prompt=prompt,
                        system_instruction=system_instruction,
                    )
                    return "gemini", raw_json
                raise

    async def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        mode: Optional[str] = None,
    ) -> Tuple[str, Dict[str, Any]]:
        """Generate guidance with explicit or automatic offline failover.

        Modes:
        - 'online': Force Cloud LLM only for rapid cloud execution.
        - 'offline': Force Local Ollama execution (medgemma:latest) with zero network wait.
        - 'auto': Cloud first, failing over to local Ollama.
        """
        active_mode = (mode or self.default_mode).lower().strip()

        # 1. Forced Offline Mode
        if active_mode == "offline":
            try:
                raw_json = await self.ollama_client.generate_json(
                    prompt=prompt,
                    system_instruction=system_instruction,
                )
                return "ollama", raw_json
            except Exception as exc:
                logger.warning(
                    f"Local Ollama generation failed: {exc}. Engaging extractive fallback."
                )
                return "extractive_fallback", {}

        # 2. Online Mode with graceful local fallback on rate limits or errors
        if active_mode == "online":
            try:
                provider, raw_json = await self._generate_cloud(
                    prompt=prompt,
                    system_instruction=system_instruction,
                )
                return provider, raw_json
            except Exception as exc:
                logger.warning(
                    f"Cloud generation failed in online mode: {exc}. "
                    "Engaging zero-delay local Ollama fallback."
                )
                try:
                    raw_json = await self.ollama_client.generate_json(
                        prompt=prompt,
                        system_instruction=system_instruction,
                    )
                    return "ollama", raw_json
                except Exception as ollama_exc:
                    logger.warning(
                        f"Local Ollama generation also failed: {ollama_exc}. "
                        "Engaging deterministic extractive fallback."
                    )
                    return "extractive_fallback", {}

        # 3. Auto Mode (Online-First with Offline Failover)
        if self.cloud_enabled:
            try:
                provider, raw_json = await self._generate_cloud(
                    prompt=prompt,
                    system_instruction=system_instruction,
                )
                return provider, raw_json
            except Exception as exc:
                logger.warning(
                    f"Cloud generation failed or timed out: {exc}. "
                    "Engaging zero-delay local Ollama fallback."
                )

        # Local Ollama Runtime (medgemma:latest)
        try:
            raw_json = await self.ollama_client.generate_json(
                prompt=prompt,
                system_instruction=system_instruction,
            )
            return "ollama", raw_json
        except Exception as exc:
            logger.warning(
                f"Local Ollama generation failed: {exc}. "
                "Engaging deterministic extractive fallback."
            )
            return "extractive_fallback", {}


# Global Singleton Gateway
gateway_instance = LLMGateway()
