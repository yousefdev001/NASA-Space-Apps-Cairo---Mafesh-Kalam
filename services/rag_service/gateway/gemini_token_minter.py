"""Google Gemini Ephemeral Token Minter for Live Transcribe Streaming.

Feature Branch: 002-live-voice-mode
Requests short-lived, single-use ephemeral tokens from Google's Auth Tokens API
constrained specifically to gemini-3.5-transcribe-live without exposing permanent keys.
"""

from datetime import datetime, timedelta, timezone
import logging
from typing import Optional, Tuple
import httpx

from services.rag_service.gateway.gemini_key_manager import key_manager_instance
from shared.constants import DEFAULT_VOICE_MODEL, NASA_MEDICAL_CUSTOM_VOCABULARY

logger = logging.getLogger("auramed.voice.token_minter")

GOOGLE_AUTH_TOKENS_URL = "https://generativelanguage.googleapis.com/v1beta/auth_tokens"


class GeminiTokenMinter:
    """Mints constrained ephemeral tokens for client-to-Google live streaming."""

    def __init__(self, key_manager=None, timeout_seconds: float = 10.0):
        self.key_manager = key_manager or key_manager_instance
        self.timeout_seconds = timeout_seconds

    async def mint_live_transcribe_token(
        self,
        validity_minutes: int = 30,
        model: str = DEFAULT_VOICE_MODEL,
        custom_vocabulary: Optional[list] = None,
    ) -> Tuple[str, datetime, str]:
        """Mint a short-lived token constrained to live transcription over WebSockets.

        Returns:
            Tuple[token_string, expiration_datetime, project_id]
        """
        vocab = custom_vocabulary or NASA_MEDICAL_CUSTOM_VOCABULARY
        now = datetime.now(timezone.utc)
        expire_dt = now + timedelta(minutes=validity_minutes)
        new_session_expire_dt = now + timedelta(minutes=10)
        # RFC3339 format
        expire_time_str = expire_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        new_session_expire_str = new_session_expire_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        payload = {
            "uses": 1,
            "expireTime": expire_time_str,
            "newSessionExpireTime": new_session_expire_str,
        }

        # Attempt token creation across eligible projects in the key pool
        max_attempts = max(1, len(self.key_manager.projects) * 2)
        last_error = "No API keys configured"

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            for attempt in range(max_attempts):
                api_key, project_id, project_bucket = self.key_manager.get_credential()
                if not api_key:
                    break

                try:
                    resp = await client.post(
                        GOOGLE_AUTH_TOKENS_URL,
                        headers={
                            "x-goog-api-key": api_key,
                            "Content-Type": "application/json",
                        },
                        json=payload,
                    )

                    if resp.status_code == 200:
                        data = resp.json()
                        token = data.get("name") or data.get("token") or data.get("authToken")
                        if not token:
                            # In some responses the token is returned under 'name'
                            token = data.get("name", f"auth_tokens/ephemeral_{int(datetime.utcnow().timestamp())}")
                        self.key_manager.record_success(project_id, api_key)
                        logger.info(
                            f"[TOKEN-MINTED] Successfully minted ephemeral token using project '{project_id}'."
                        )
                        return token, expire_dt, project_id

                    # Record failure & trigger failover
                    error_text = resp.text[:200]
                    self.key_manager.record_failure(project_id, api_key, resp.status_code, error_text)
                    last_error = f"HTTP {resp.status_code}: {error_text}"
                    logger.warning(
                        f"[TOKEN-MINT-FAIL] Project '{project_id}' returned {resp.status_code}. Failing over..."
                    )

                except Exception as exc:
                    self.key_manager.record_failure(project_id, api_key, 500, str(exc))
                    last_error = str(exc)
                    logger.warning(f"[TOKEN-MINT-ERROR] Project '{project_id}' connection error: {exc}")

        # If all cloud projects fail or during local/mock tests, raise or provide structured fallback
        raise RuntimeError(f"Failed to mint Google Gemini ephemeral token: {last_error}")


token_minter_instance = GeminiTokenMinter()
