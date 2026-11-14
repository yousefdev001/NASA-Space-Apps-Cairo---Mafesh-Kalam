"""Google Gemini Speech Generation (TTS) Client for Clinical Guidance.

Feature Branch: 002-live-voice-mode
Transforms validated medical responses into studio-grade audio using gemini-3.8-flash-tts.
"""

import base64
import logging
import time
from typing import Optional, Tuple
import httpx

from services.rag_service.gateway.gemini_key_manager import key_manager_instance
from shared.constants import DEFAULT_TTS_MODEL, DEFAULT_TTS_VOICE
from shared.formatting.spoken_filter import SpokenMedicalFilter

logger = logging.getLogger("auramed.voice.tts_client")

GOOGLE_INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions"
GOOGLE_MODELS_GENERATE_CONTENT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


class GeminiTTSClient:
    """Client for generating speech via Google Gemini TTS with multi-project failover."""

    def __init__(self, key_manager=None, timeout_seconds: float = 20.0):
        self.key_manager = key_manager or key_manager_instance
        self.timeout_seconds = timeout_seconds

    def is_configured(self) -> bool:
        """Check if at least one active API key is available in the key pool."""
        if not self.key_manager:
            return False
        key, proj, bucket = self.key_manager.get_credential()
        return bool(key)

    async def synthesize_speech(
        self,
        raw_markdown: str,
        voice_name: str = DEFAULT_TTS_VOICE,
        speech_style: str = "calm, articulate, authoritative flight surgeon",
        model: str = DEFAULT_TTS_MODEL,
        language: str = "auto",
        raise_on_failure: bool = False,
    ) -> Tuple[str, float, str, float]:
        """Synthesize clinical text into speech audio.

        Returns:
            Tuple[audio_base64, duration_seconds, spoken_script, latency_ms]
        """
        t0 = time.perf_counter()

        # 1. Deterministic cleanup for voice delivery
        spoken_text = SpokenMedicalFilter.clean_for_speech(raw_markdown, language=language)
        if not spoken_text:
            return "", 0.0, "", 0.0

        # Safety verification check
        is_safe, missing_elements = SpokenMedicalFilter.verify_dosage_invariance(raw_markdown, spoken_text)
        if not is_safe:
            logger.warning(
                f"[SPOKEN-FILTER-WARNING] Possible dosage/numerical discrepancy: {missing_elements}"
            )

        payload = {
            "model": model,
            "input": [
                {
                    "type": "user_input",
                    "content": [
                        {
                            "type": "text",
                            "text": spoken_text,
                            "annotations": [
                                {
                                    "type": "speech_metadata",
                                    "style": speech_style,
                                }
                            ],
                        }
                    ],
                }
            ],
            "response_format": {"type": "audio"},
            "generation_config": {
                "speech_config": [
                    {"voice": voice_name}
                ]
            },
        }

        total_keys = sum(len(p.credentials) for p in self.key_manager.projects) if self.key_manager and self.key_manager.projects else 4
        max_attempts = max(2, total_keys + 1)
        last_error = "No API keys configured"

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            for attempt in range(max_attempts):
                api_key, project_id, project_bucket = self.key_manager.get_credential()
                if not api_key:
                    break

                try:
                    resp = await client.post(
                        GOOGLE_INTERACTIONS_URL,
                        headers={
                            "x-goog-api-key": api_key,
                            "Content-Type": "application/json",
                        },
                        json=payload,
                    )

                    if resp.status_code == 200:
                        data = resp.json()
                        audio_base64 = ""

                        # Extract audio data from interactions output
                        # Format A: interaction.output_audio.data
                        output_audio = data.get("output_audio") or {}
                        if output_audio.get("data"):
                            audio_base64 = output_audio["data"]
                        else:
                            # Format B: steps[].content[].data
                            steps = data.get("steps", [])
                            for step in steps:
                                for content in step.get("content", []):
                                    if content.get("type") == "audio" and content.get("data"):
                                        audio_base64 = content["data"]
                                        break

                        if audio_base64:
                            self.key_manager.record_success(project_id, api_key)
                            latency_ms = (time.perf_counter() - t0) * 1000

                            # Approximate duration from WAV bytes: 24000 Hz * 1 channel * 2 bytes/sample = 48000 bytes/sec
                            raw_bytes = base64.b64decode(audio_base64)
                            duration_seconds = max(0.5, round(len(raw_bytes) / 48000.0, 2))

                            logger.info(
                                f"[TTS-SUCCESS] Generated {duration_seconds}s audio ({len(raw_bytes)} bytes) "
                                f"via '{model}' using project '{project_id}' in {latency_ms:.1f}ms."
                            )
                            return audio_base64, duration_seconds, spoken_text, round(latency_ms, 1)

                    # Handle quota or auth error
                    error_text = resp.text[:200]
                    self.key_manager.record_failure(project_id, api_key, resp.status_code, error_text)
                    last_error = f"HTTP {resp.status_code}: {error_text}"
                    logger.warning(
                        f"[TTS-FAIL] Project '{project_id}' returned {resp.status_code}. Failing over..."
                    )

                except Exception as exc:
                    self.key_manager.record_failure(project_id, api_key, 500, str(exc))
                    last_error = str(exc)
                    logger.warning(f"[TTS-ERROR] Project '{project_id}' error: {exc}")

        if raise_on_failure:
            raise RuntimeError(f"Google Gemini TTS unavailable: {last_error}")

        # If all Gemini projects fail or rate-limit and raise_on_failure is False, fallback to Edge-TTS
        logger.warning(
            f"[TTS-GEMINI-EXHAUSTED] Google Gemini TTS unavailable ({last_error}). "
            "Engaging high-fidelity Edge-TTS fallback."
        )
        return await self._synthesize_edge_tts(raw_markdown, language=language)

    async def _synthesize_edge_tts(self, text: str, language: str = "auto") -> Tuple[str, float, str, float]:
        """Synthesize natural neural speech via edge-tts as zero-quota fallback."""
        t0 = time.perf_counter()
        clean_text = SpokenMedicalFilter.clean_for_speech(text, language=language)
        speech_text = clean_text.replace("<short pause>", " ... ").strip()
        if not speech_text:
            return "", 0.0, "", 0.0

        ar_count = sum(1 for c in speech_text if "\u0600" <= c <= "\u06FF")
        en_count = sum(1 for c in speech_text if ("a" <= c <= "z" or "A" <= c <= "Z"))

        if language == "en":
            edge_voice = "en-US-ChristopherNeural"
        elif language == "ar":
            edge_voice = "ar-SA-HamedNeural"
        else:
            edge_voice = "ar-SA-HamedNeural" if ar_count >= en_count else "en-US-ChristopherNeural"

        try:
            import edge_tts
            communicate = edge_tts.Communicate(speech_text, edge_voice)
            chunks = []
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    chunks.append(chunk["data"])
            audio_bytes = b"".join(chunks)
            audio_b64 = base64.b64encode(audio_bytes).decode("ascii")
            duration_sec = max(1.0, round(len(audio_bytes) / 16000.0, 2))
            lat = (time.perf_counter() - t0) * 1000
            logger.info(
                f"[EDGE-TTS-SUCCESS] Generated {duration_sec}s speech via '{edge_voice}' "
                f"({len(audio_bytes)} bytes) in {lat:.1f}ms."
            )
            return audio_b64, duration_sec, clean_text, round(lat, 1)
        except Exception as exc:
            logger.error(f"[EDGE-TTS-ERROR] Edge-TTS synthesis failed: {exc}")
            raise RuntimeError(f"All TTS providers failed: {exc}") from exc


tts_client_instance = GeminiTTSClient()
