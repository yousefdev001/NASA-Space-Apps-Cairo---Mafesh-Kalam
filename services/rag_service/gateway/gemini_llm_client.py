"""Google Gemini LLM Client for Clinical Chat & Medical Guidance.

Provides asynchronous access to Google Gemini models (e.g. gemini-3-flash-preview, gemini-3.8-flash)
with structured JSON output formatting and automatic key pool rotation across Google Cloud Projects
using GeminiKeyManager.
"""

import json
import logging
import os
import re
import time
from typing import Any, Dict, Optional
import dotenv
import httpx

from services.rag_service.gateway.gemini_key_manager import key_manager_instance, mask_key

dotenv.load_dotenv()

logger = logging.getLogger("auramed.gateway.gemini")

GOOGLE_GENERATE_CONTENT_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


class GeminiLLMClient:
    """Async client for Google Gemini API with native JSON object formatting and key pool rotation."""

    def __init__(
        self,
        key_manager=None,
        model: Optional[str] = None,
        timeout_seconds: Optional[float] = None,
    ):
        self.key_manager = key_manager or key_manager_instance
        self.model = model or os.getenv("GEMINI_CHAT_MODEL", "gemini-3-flash-preview")
        self.timeout = timeout_seconds or float(os.getenv("LLM_TIMEOUT_SECONDS", "25.0"))

    def is_configured(self) -> bool:
        """Check whether at least one project and key are configured in the key manager."""
        if not self.key_manager or not self.key_manager.projects:
            return False
        return any(len(p.credentials) > 0 for p in self.key_manager.projects)

    async def is_reachable(self) -> bool:
        """Probe Gemini reachability using an available credential from the pool."""
        if not self.is_configured():
            return False
        api_key, project_id, _ = self.key_manager.get_credential()
        if not api_key:
            return False
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(
                    f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
                )
                return res.status_code == 200
        except Exception as exc:
            logger.warning(f"Gemini reachability probe failed: {exc}")
            return False

    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate structured JSON response using Google Gemini API with multi-project rotation.

        Iterates over eligible credentials in the key pool. On HTTP 429 or transient error,
        marks the credential for cooldown and automatically fails over to the next available key.
        """
        if not self.is_configured():
            raise ValueError("Google Gemini API keys are not configured in key manager.")

        payload: Dict[str, Any] = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}],
                }
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.2,
            },
        }

        if system_instruction:
            payload["system_instruction"] = {
                "parts": [{"text": system_instruction}]
            }

        total_keys = sum(len(p.credentials) for p in self.key_manager.projects)
        max_attempts = max(3, total_keys + 1)
        last_error = "No active API keys available in the pool."

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for attempt in range(max_attempts):
                api_key, project_id, project_bucket = self.key_manager.get_credential()
                if not api_key:
                    break

                try:
                    url = GOOGLE_GENERATE_CONTENT_URL.format(model=self.model)
                    resp = await client.post(
                        f"{url}?key={api_key}",
                        headers={"Content-Type": "application/json"},
                        json=payload,
                    )

                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if not candidates:
                            raise ValueError("Gemini returned empty candidates.")

                        raw_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()

                        # Strip markdown fences if present
                        if raw_content.startswith("```"):
                            lines = raw_content.splitlines()
                            if lines[0].startswith("```"):
                                lines = lines[1:]
                            if lines and lines[-1].startswith("```"):
                                lines = lines[:-1]
                            raw_content = "\n".join(lines).strip()

                        try:
                            parsed = json.loads(raw_content)
                        except json.JSONDecodeError as jde:
                            match = re.search(r"\{.*\}", raw_content, re.DOTALL)
                            if match:
                                parsed = json.loads(match.group(0))
                            else:
                                raise ValueError(f"Gemini response could not be parsed as JSON: {jde}") from jde

                        self.key_manager.record_success(project_id, api_key)
                        logger.info(
                            f"[GEMINI-CHAT-SUCCESS] Generated response via '{self.model}' using project '{project_id}' "
                            f"(key {mask_key(api_key)})."
                        )
                        return parsed

                    # Handle HTTP 429 or other API error
                    error_text = resp.text[:200]
                    self.key_manager.record_failure(project_id, api_key, resp.status_code, error_text)
                    last_error = f"HTTP {resp.status_code}: {error_text}"
                    logger.warning(
                        f"[GEMINI-CHAT-FAILOVER] Key in project '{project_id}' returned HTTP {resp.status_code}. "
                        f"Rotating to next key in pool... (attempt {attempt + 1}/{max_attempts})"
                    )

                except Exception as exc:
                    self.key_manager.record_failure(project_id, api_key, 500, str(exc))
                    last_error = str(exc)
                    logger.warning(
                        f"[GEMINI-CHAT-ERROR] Project '{project_id}' connection error: {exc}. Rotating to next key..."
                    )

        raise RuntimeError(f"All Google Gemini projects/keys in pool exhausted: {last_error}")


gemini_llm_client_instance = GeminiLLMClient()
