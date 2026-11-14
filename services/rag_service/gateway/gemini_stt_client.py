"""Google Gemini Speech-to-Text (STT) Client for Clinical Audio Transcription.

Feature Branch: 002-live-voice-mode
Transcribes clinical audio inputs verbatim using gemini-3.5-transcribe.
"""

import logging
import time
from typing import Optional, Tuple
import httpx

from services.rag_service.gateway.gemini_key_manager import key_manager_instance
from shared.constants import DEFAULT_VOICE_MODEL, NASA_MEDICAL_CUSTOM_VOCABULARY

logger = logging.getLogger("auramed.voice.stt_client")

GOOGLE_TRANSCRIBE_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-transcribe:generateContent"
)


class GeminiSTTClient:
    """Client for converting spoken audio into medical transcripts with multi-project failover."""

    def __init__(self, key_manager=None, timeout_seconds: float = 25.0):
        self.key_manager = key_manager or key_manager_instance
        self.timeout_seconds = timeout_seconds

    async def transcribe_audio(
        self,
        audio_base64: str,
        mime_type: str = "audio/wav",
        language: str = "auto",
        custom_vocabulary: Optional[list] = None,
    ) -> Tuple[str, float]:
        """Transcribe base64-encoded audio to text.

        Returns:
            Tuple[transcript_text, latency_ms]
        """
        t0 = time.perf_counter()
        vocab = custom_vocabulary or NASA_MEDICAL_CUSTOM_VOCABULARY

        instruction = (
            "You are a medical speech-to-text transcriber for NASA spaceflight operations. "
            "Transcribe this audio verbatim without commentary or additions. "
            "If spoken in Arabic, transcribe in standard fluent Arabic. "
            "If spoken in English, transcribe in English. "
            f"Preserve technical terms accurately: {', '.join(vocab[:15])}."
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"inline_data": {"mime_type": mime_type, "data": audio_base64}},
                        {"text": instruction},
                    ]
                }
            ]
        }

        max_attempts = max(1, len(self.key_manager.projects) * 2)
        last_error = "No API keys configured"

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            for attempt in range(max_attempts):
                api_key, project_id, project_bucket = self.key_manager.get_credential()
                if not api_key:
                    break

                try:
                    resp = await client.post(
                        GOOGLE_TRANSCRIBE_URL,
                        headers={
                            "x-goog-api-key": api_key,
                            "Content-Type": "application/json",
                        },
                        json=payload,
                    )

                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [{}])[0]
                            # Gemini 3.5 Transcribe returns audioTranscription.text or text
                            transcript = (
                                parts.get("audioTranscription", {}).get("text")
                                or parts.get("text")
                                or ""
                            ).strip()

                            self.key_manager.record_success(project_id, api_key)
                            latency_ms = (time.perf_counter() - t0) * 1000
                            logger.info(
                                f"[STT-SUCCESS] Transcribed '{transcript[:60]}...' via gemini-3.5-transcribe "
                                f"using '{project_id}' in {latency_ms:.1f}ms."
                            )
                            return transcript, round(latency_ms, 1)

                    error_text = resp.text[:200]
                    self.key_manager.record_failure(project_id, api_key, resp.status_code, error_text)
                    last_error = f"HTTP {resp.status_code}: {error_text}"
                    logger.warning(
                        f"[STT-FAIL] Project '{project_id}' returned {resp.status_code}. Failing over..."
                    )

                except Exception as exc:
                    self.key_manager.record_failure(project_id, api_key, 500, str(exc))
                    last_error = str(exc)
                    logger.warning(f"[STT-ERROR] Project '{project_id}' error: {exc}")

        raise RuntimeError(f"Failed to transcribe audio via Google Gemini: {last_error}")


stt_client_instance = GeminiSTTClient()
