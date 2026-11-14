"""Centralized Google Gemini Multi-Project Key Manager & Quota Failover Engine.

Feature Branch: 002-live-voice-mode
Manages multiple Google Cloud Projects and API keys, tracks project-level
rate limits (HTTP 429), handles cooldowns with exponential jitter, and
rotates keys without exposing secrets in logs.
"""

from datetime import datetime, timedelta
import json
import logging
import os
import random
import threading
from typing import Any, Dict, List, Optional, Tuple
import dotenv

dotenv.load_dotenv()

from shared.contracts.voice_contract import (
    CredentialHealthStatus,
    KeyHealthInfo,
    KeyPoolStatusResponse,
    ProjectQuotaInfo,
)

logger = logging.getLogger("auramed.voice.key_manager")


def mask_key(key: str) -> str:
    """Safely mask an API key for logs and telemetry."""
    if not key or len(key) < 12:
        return "***"
    return f"{key[:8]}...{key[-4:]}"


class GeminiCredentialInternal:
    """Internal representation of an individual API key credential."""

    def __init__(self, key: str, label: str, project_id: str):
        self.key = key
        self.label = label
        self.project_id = project_id
        self.masked_key = mask_key(key)
        self.status = CredentialHealthStatus.ACTIVE
        self.consecutive_failures = 0
        self.last_failure_reason: Optional[str] = None
        self.total_calls_succeeded = 0
        self.total_calls_failed = 0
        self.last_used_at: Optional[datetime] = None
        self.cooldown_until: Optional[datetime] = None

    def is_available(self) -> bool:
        if self.status == CredentialHealthStatus.REVOKED:
            return False
        if self.cooldown_until and datetime.utcnow() < self.cooldown_until:
            return False
        return True

    def record_success(self):
        self.consecutive_failures = 0
        self.total_calls_succeeded += 1
        self.last_used_at = datetime.utcnow()
        self.cooldown_until = None
        self.status = CredentialHealthStatus.ACTIVE

    def record_failure(self, error_code: int, reason: str):
        self.consecutive_failures += 1
        self.total_calls_failed += 1
        self.last_failure_reason = f"HTTP {error_code}: {reason}"
        self.last_used_at = datetime.utcnow()

        if error_code in (401, 403):
            self.status = CredentialHealthStatus.REVOKED
            logger.error(
                f"[KEY-REVOKED] Credential {self.masked_key} in project '{self.project_id}' "
                f"marked REVOKED due to HTTP {error_code}: {reason}"
            )
        elif error_code == 429:
            self.status = CredentialHealthStatus.RATE_LIMITED
            self.cooldown_until = datetime.utcnow() + timedelta(seconds=60)
            logger.warning(
                f"[KEY-RATE-LIMITED] Credential {self.label} ({self.masked_key}) in '{self.project_id}' "
                f"rate-limited (429). Rotating to next key. Key cooling down for 60s."
            )


class GoogleProjectBucketInternal:
    """Internal representation of a Google Cloud Project Quota Bucket."""

    def __init__(self, project_id: str, priority: int = 1):
        self.project_id = project_id
        self.priority = priority
        self.is_active = True
        self.cooldown_until: Optional[datetime] = None
        self.consecutive_429s = 0
        self.current_rpm = 0
        self.credentials: List[GeminiCredentialInternal] = []
        self._key_index = 0

    def add_key(self, key: str, label: str):
        cred = GeminiCredentialInternal(key=key, label=label, project_id=self.project_id)
        self.credentials.append(cred)

    def is_available(self) -> bool:
        if not self.is_active:
            return False
        if self.cooldown_until and datetime.utcnow() < self.cooldown_until:
            return False
        # Project must have at least one eligible, non-cooled credential
        return any(c.is_available() for c in self.credentials)

    def trigger_cooldown(self, base_seconds: float = 30.0, max_seconds: float = 300.0):
        """Trigger project-level cooldown with exponential backoff and jitter."""
        self.consecutive_429s += 1
        jitter = random.uniform(1.0, 5.0)
        backoff = min(base_seconds * (2 ** (self.consecutive_429s - 1)), max_seconds) + jitter
        self.cooldown_until = datetime.utcnow() + timedelta(seconds=backoff)
        logger.warning(
            f"[PROJECT-COOLDOWN] Google Project '{self.project_id}' rate-limited (429). "
            f"Cooling down for {backoff:.1f}s until {self.cooldown_until.isoformat()}"
        )

    def get_eligible_credential(self) -> Optional[GeminiCredentialInternal]:
        available_creds = [c for c in self.credentials if c.is_available()]
        if not available_creds:
            return None
        # Round-robin selection among available credentials
        cred = available_creds[self._key_index % len(available_creds)]
        self._key_index += 1
        return cred


class GeminiKeyManager:
    """Thread-safe multi-project key manager with automatic failover."""

    def __init__(self, config_json: Optional[str] = None):
        self._lock = threading.Lock()
        self.projects: List[GoogleProjectBucketInternal] = []
        self._load_configuration(config_json)

    def _load_configuration(self, config_json: Optional[str] = None):
        raw_config = config_json or os.getenv("GEMINI_PROJECTS_JSON") or os.getenv("GEMINI_VOICE_PROJECTS_JSON")
        if not raw_config:
            # Fallback to single project from env GEMINI_API_KEY
            single_key = os.getenv("GEMINI_API_KEY")
            if single_key:
                p = GoogleProjectBucketInternal(project_id="default-project", priority=1)
                p.add_key(key=single_key, label="default-key")
                self.projects.append(p)
            return

        try:
            parsed = json.loads(raw_config)
            for proj_cfg in parsed:
                proj_id = proj_cfg.get("project_id", "unnamed-project")
                priority = proj_cfg.get("priority", 1)
                bucket = GoogleProjectBucketInternal(project_id=proj_id, priority=priority)
                for k_cfg in proj_cfg.get("keys", []):
                    key_val = k_cfg.get("key")
                    label = k_cfg.get("label", "key")
                    if key_val:
                        bucket.add_key(key=key_val, label=label)
                if bucket.credentials:
                    self.projects.append(bucket)

            # Sort projects by priority ascending (1 = highest priority)
            self.projects.sort(key=lambda p: p.priority)
            logger.info(
                f"[KEY-MANAGER] Initialized with {len(self.projects)} Google Projects and "
                f"{sum(len(p.credentials) for p in self.projects)} credentials."
            )
        except Exception as exc:
            logger.error(f"[KEY-MANAGER] Failed to parse GEMINI_VOICE_PROJECTS_JSON: {exc}")

    def get_credential(self) -> Tuple[Optional[str], Optional[str], Optional[GoogleProjectBucketInternal]]:
        """Select highest priority eligible project and credential.

        Returns:
            Tuple[api_key, project_id, project_bucket]
        """
        with self._lock:
            now = datetime.utcnow()
            for project in self.projects:
                if project.is_available():
                    cred = project.get_eligible_credential()
                    if cred:
                        return cred.key, project.project_id, project

            # If all are cooling down, check if any cooldown has expired
            for project in self.projects:
                if project.cooldown_until and now >= project.cooldown_until:
                    project.cooldown_until = None
                    project.consecutive_429s = max(0, project.consecutive_429s - 1)
                    cred = project.get_eligible_credential()
                    if cred:
                        logger.info(f"[KEY-MANAGER] Cooldown expired for project '{project.project_id}'. Restoring.")
                        return cred.key, project.project_id, project

            logger.error("[KEY-MANAGER-EXHAUSTED] All configured Google Cloud Projects are exhausted or cooling down!")
            return None, None, None

    def record_success(self, project_id: str, key: str):
        """Record successful API call."""
        with self._lock:
            for p in self.projects:
                if p.project_id == project_id:
                    for c in p.credentials:
                        if c.key == key:
                            c.record_success()
                            return

    def record_failure(self, project_id: str, key: str, status_code: int, error_text: str):
        """Handle failure and trigger appropriate key cooldown or project failover."""
        with self._lock:
            for p in self.projects:
                if p.project_id == project_id:
                    for c in p.credentials:
                        if c.key == key:
                            c.record_failure(status_code, error_text)
                    # Only trigger project-level cooldown if ALL keys in this project are unavailable
                    if status_code == 429 and not any(c.is_available() for c in p.credentials):
                        p.trigger_cooldown()
                    return

    def get_status_telemetry(self) -> KeyPoolStatusResponse:
        """Produce admin telemetry on all configured credentials and projects."""
        with self._lock:
            now = datetime.utcnow()
            proj_infos: List[ProjectQuotaInfo] = []
            total_keys = 0
            active_keys = 0
            active_projects = 0

            for p in self.projects:
                is_cooling = bool(p.cooldown_until and now < p.cooldown_until)
                cooldown_remaining = max(0.0, (p.cooldown_until - now).total_seconds()) if is_cooling else 0.0
                if p.is_available():
                    active_projects += 1

                cred_infos: List[KeyHealthInfo] = []
                for c in p.credentials:
                    total_keys += 1
                    if c.status == CredentialHealthStatus.ACTIVE:
                        active_keys += 1
                    cred_infos.append(
                        KeyHealthInfo(
                            credential_id=c.label,
                            masked_key=c.masked_key,
                            status=c.status,
                            consecutive_failures=c.consecutive_failures,
                            last_failure_reason=c.last_failure_reason,
                            total_calls_succeeded=c.total_calls_succeeded,
                            total_calls_failed=c.total_calls_failed,
                            last_used_at=c.last_used_at,
                        )
                    )

                proj_infos.append(
                    ProjectQuotaInfo(
                        project_id=p.project_id,
                        priority=p.priority,
                        is_active=p.is_active,
                        is_cooling_down=is_cooling,
                        cooldown_seconds_remaining=round(cooldown_remaining, 1),
                        current_rpm=p.current_rpm,
                        total_keys=len(p.credentials),
                        active_keys=len([c for c in p.credentials if c.status == CredentialHealthStatus.ACTIVE]),
                        credentials=cred_infos,
                    )
                )

            if active_projects == len(self.projects) and active_projects > 0:
                global_status = "HEALTHY"
            elif active_projects > 0:
                global_status = "DEGRADED"
            else:
                global_status = "EXHAUSTED"

            return KeyPoolStatusResponse(
                active_projects_count=active_projects,
                total_projects_count=len(self.projects),
                total_keys_count=total_keys,
                active_keys_count=active_keys,
                global_status=global_status,
                projects=proj_infos,
            )


# Global Singleton Key Manager
key_manager_instance = GeminiKeyManager()
