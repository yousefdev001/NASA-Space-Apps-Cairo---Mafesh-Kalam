"""Online-First / Offline-Fallback Speech Generation (TTS) Gateway.

Feature: Live Voice Engine Failover (NASA Space Apps 2026 Architecture)
Orchestrates speech generation across external Cloud API (Google Gemini 3.8 Flash TTS / Edge-TTS)
and local offline VibeVoice runtime (microsoft/VibeVoice-Realtime-0.5B).
Supports explicit mode selection ('online', 'offline', 'auto') for lowest possible latency.
"""

import logging
import os
from typing import Optional, Tuple

from services.rag_service.gateway.gemini_tts_client import GeminiTTSClient, tts_client_instance
from services.rag_service.gateway.vibevoice_tts_client import VibeVoiceTTSClient, vibevoice_tts_instance
from shared.constants import DEFAULT_TTS_MODEL, DEFAULT_TTS_VOICE

logger = logging.getLogger("auramed.voice.tts_gateway")


class TTSGateway:
    """Gateway orchestrating online cloud speech generation and offline VibeVoice failover."""

    def __init__(
        self,
        cloud_client: Optional[GeminiTTSClient] = None,
        local_client: Optional[VibeVoiceTTSClient] = None,
        cloud_enabled: Optional[bool] = None,
        default_mode: Optional[str] = None,
    ):
        self.cloud_client = cloud_client or tts_client_instance
        self.local_client = local_client or vibevoice_tts_instance

        if cloud_enabled is not None:
            self.cloud_enabled = cloud_enabled
        else:
            primary_provider = os.getenv("TTS_PRIMARY_PROVIDER", "gemini").lower()
            self.cloud_enabled = (primary_provider == "gemini" and self.cloud_client.is_configured())

        self.default_mode = (
            default_mode
            or os.getenv("AURAMED_MODE", os.getenv("TTS_MODE", "auto"))
        ).lower().strip()

    def set_default_mode(self, mode: str) -> str:
        """Set active default operating mode: 'online', 'offline', or 'auto'."""
        normalized = mode.lower().strip()
        if normalized not in ("online", "offline", "auto"):
            raise ValueError(f"Invalid mode '{mode}'. Choose 'online', 'offline', or 'auto'.")
        self.default_mode = normalized
        logger.info(f"[TTS-GATEWAY] Switched default operating mode to '{self.default_mode}'.")
        return self.default_mode

    async def get_operating_mode(self) -> str:
        """Return current operating mode: online, offline, auto, or degraded."""
        if self.default_mode == "offline":
            return "offline"
        if self.default_mode == "online":
            return "online" if self.cloud_client.is_configured() else "degraded"

        # Mode == "auto"
        if self.cloud_enabled and self.cloud_client.is_configured():
            return "online"
        if self.local_client.is_model_available():
            return "offline"
        return "degraded"

    async def synthesize_speech(
        self,
        raw_markdown: str,
        voice_name: str = DEFAULT_TTS_VOICE,
        speech_style: str = "calm, articulate, authoritative flight surgeon",
        model: str = DEFAULT_TTS_MODEL,
        language: str = "auto",
        mode: Optional[str] = None,
    ) -> Tuple[str, float, str, float, str]:
        """Synthesize clinical text into speech with mode selection.

        Modes:
        - 'online': Force external Cloud (Gemini / Edge-TTS) for ultra-fast sub-second generation.
                    Does not attempt local CPU inference.
        - 'offline': Force 100% on-device local VibeVoice execution without any network access or delays.
        - 'auto': Online-first with zero-delay local fallback on cloud outage or rate limits.

        Returns:
            Tuple[audio_base64, duration_seconds, spoken_script, latency_ms, active_provider]
        """
        active_mode = (mode or self.default_mode).lower().strip()

        # ---------------------------------------------------------------------
        # OPTION A: FORCED OFFLINE MODE (No cloud calls, zero network wait)
        # ---------------------------------------------------------------------
        if active_mode == "offline":
            if not self.local_client.is_model_available():
                raise RuntimeError(
                    "Offline mode selected, but local VibeVoice model is not available on disk."
                )
            try:
                audio_b64, duration, text, lat = await self.local_client.synthesize_speech(
                    raw_markdown=raw_markdown,
                    voice_name=voice_name,
                    language=language,
                )
                return audio_b64, duration, text, lat, "vibevoice_offline"
            except Exception as exc:
                logger.error(f"[TTS-OFFLINE-ERROR] Local VibeVoice offline synthesis failed: {exc}")
                raise RuntimeError(f"Offline voice synthesis failed: {exc}") from exc

        # ---------------------------------------------------------------------
        # OPTION B: FORCED ONLINE MODE (Cloud only, ultra-low latency)
        # ---------------------------------------------------------------------
        if active_mode == "online":
            # 1. Try Gemini TTS with fast execution
            if self.cloud_client.is_configured():
                try:
                    audio_b64, duration, text, lat = await self.cloud_client.synthesize_speech(
                        raw_markdown=raw_markdown,
                        voice_name=voice_name,
                        speech_style=speech_style,
                        model=model,
                        language=language,
                        raise_on_failure=True,
                    )
                    return audio_b64, duration, text, lat, "gemini_cloud"
                except Exception as exc:
                    logger.warning(
                        f"[TTS-ONLINE] Gemini TTS failed ({exc}). Engaging rapid cloud Edge-TTS."
                    )

            # 2. Online cloud Edge-TTS (fast, zero local overhead)
            try:
                audio_b64, duration, text, lat = await self.cloud_client._synthesize_edge_tts(
                    text=raw_markdown,
                    language=language,
                )
                return audio_b64, duration, text, lat, "edge_tts_fallback"
            except Exception as exc:
                logger.error(f"[TTS-ONLINE-ERROR] Cloud speech generation failed: {exc}")
                raise RuntimeError(f"Online speech synthesis failed: {exc}") from exc

        # ---------------------------------------------------------------------
        # OPTION C: AUTO MODE (Online with Offline Failover)
        # ---------------------------------------------------------------------
        # 1. Attempt Cloud Gemini TTS across key pool
        if self.cloud_enabled:
            try:
                audio_b64, duration, text, lat = await self.cloud_client.synthesize_speech(
                    raw_markdown=raw_markdown,
                    voice_name=voice_name,
                    speech_style=speech_style,
                    model=model,
                    language=language,
                    raise_on_failure=True,
                )
                return audio_b64, duration, text, lat, "gemini_cloud"
            except Exception as exc:
                logger.warning(
                    f"[TTS-AUTO-FAILOVER] Cloud Gemini TTS failed ({exc}). "
                    "Engaging rapid Edge-TTS neural fallback."
                )

        # 2. Online Rapid Edge-TTS (instant fallback, zero GPU overhead)
        try:
            audio_b64, duration, text, lat = await self.cloud_client._synthesize_edge_tts(
                text=raw_markdown,
                language=language,
            )
            return audio_b64, duration, text, lat, "edge_tts_fallback"
        except Exception as exc:
            logger.warning(
                f"[TTS-AUTO-FAILOVER] Edge-TTS failed ({exc}). Engaging local VibeVoice."
            )

        # 3. Local VibeVoice Runtime (0.5B) - offline fallback
        if self.local_client.is_model_available():
            try:
                audio_b64, duration, text, lat = await self.local_client.synthesize_speech(
                    raw_markdown=raw_markdown,
                    voice_name=voice_name,
                    language=language,
                )
                return audio_b64, duration, text, lat, "vibevoice_offline"
            except Exception as exc:
                logger.warning(
                    f"[TTS-AUTO-FAILOVER] Local VibeVoice generation failed: {exc}"
                )

        raise RuntimeError("All speech synthesis providers failed.")


# Global Singleton TTS Gateway
tts_gateway_instance = TTSGateway()
