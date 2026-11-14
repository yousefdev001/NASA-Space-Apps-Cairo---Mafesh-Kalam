"""Groq Cloud LLM Client for High-Performance Online Inference.

Provides asynchronous access to cloud-hosted open models (e.g. openai/gpt-oss-120b)
with structured JSON generation mode and explicit timeouts for fail-safe fallback.
"""

import json
import logging
import os
from typing import Any, Dict, Optional
import dotenv
import httpx

dotenv.load_dotenv()

logger = logging.getLogger("auramed.gateway.groq")


class GroqClient:
    """Async client for Groq Cloud API with native JSON object formatting."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        timeout_seconds: Optional[float] = None,
    ):
        self.api_key = api_key or os.getenv("GROQ_API_KEY", "")
        self.base_url = (base_url or os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")).rstrip("/")
        self.model = model or os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
        self.timeout = timeout_seconds or float(os.getenv("LLM_TIMEOUT_SECONDS", "10.0"))

    def is_configured(self) -> bool:
        """Check whether valid API key and endpoint are configured."""
        return bool(self.api_key and self.api_key.startswith("gsk_"))

    async def is_reachable(self) -> bool:
        """Probe Groq endpoint reachability."""
        if not self.is_configured():
            return False
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "User-Agent": "AuraMed-NASA-SpaceApps/1.0",
        }
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.base_url}/models", headers=headers)
                return res.status_code == 200
        except Exception as exc:
            logger.warning(f"Groq reachability probe failed: {exc}")
            return False

    async def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate structured JSON response using Groq Cloud API."""
        if not self.is_configured():
            raise ValueError("Groq API key not configured.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "AuraMed-NASA-SpaceApps/1.0",
        }

        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        # OpenAI/Groq requirement: at least one message must contain 'json' when using json_object format
        has_json_word = any("json" in m.get("content", "").lower() for m in messages)
        if not has_json_word:
            if messages and messages[0]["role"] == "system":
                messages[0]["content"] += "\nYou must format your entire response as a valid JSON object."
            else:
                messages.insert(0, {"role": "system", "content": "You are a clinical decision support system. Return output as a valid JSON object."})

        payload = {
            "model": self.model,
            "messages": messages,
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
            "max_completion_tokens": 1000,
        }
        if "gpt-oss" in self.model:
            payload["reasoning_effort"] = "low"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
            )

            # Intelligent rate-limit backoff & model rotation
            if resp.status_code == 429:
                import re, asyncio
                match_s = re.search(r"try again in (\d+(?:\.\d+)?)s", resp.text)
                match_ms = re.search(r"try again in (\d+(?:\.\d+)?)ms", resp.text)
                if match_s:
                    wait_sec = float(match_s.group(1)) + 0.4
                elif match_ms:
                    wait_sec = (float(match_ms.group(1)) / 1000.0) + 0.3
                else:
                    wait_sec = 2.0

                if wait_sec <= 8.0:
                    logger.warning("Groq rate limit hit. Waiting %.2fs for token bucket refill...", wait_sec)
                    await asyncio.sleep(wait_sec)
                    resp = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                    )
                if resp.status_code == 429:
                    alt_model = "qwen/qwen3.8-27b" if payload["model"] != "qwen/qwen3.8-27b" else "openai/gpt-oss-20b"
                    logger.warning("Groq rate limit persistent; switching to alternative model %s", alt_model)
                    payload["model"] = alt_model
                    resp = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                    )

            if resp.status_code == 400 and "json_validate_failed" in resp.text:
                logger.warning("Groq strict JSON mode failed; retrying with safe max_tokens")
                payload["max_completion_tokens"] = 900
                resp = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                )

        if resp.status_code != 200:
            raise RuntimeError(
                f"Groq API error ({resp.status_code}): {resp.text}"
            )

        data = resp.json()
        raw_content = data["choices"][0]["message"]["content"].strip()
        # Clean markdown code blocks if present
        if raw_content.startswith("```"):
            lines = raw_content.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            raw_content = "\n".join(lines).strip()
        try:
            parsed = json.loads(raw_content)
            return parsed
        except json.JSONDecodeError as jde:
            # Fallback: attempt regex extraction of JSON object {...}
            import re
            match = re.search(r"\{.*\}", raw_content, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except Exception:
                    pass
            raise ValueError(f"Groq response is not valid JSON: {jde}") from jde
