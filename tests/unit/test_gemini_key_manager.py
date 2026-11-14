"""Unit tests for Gemini Multi-Project Key Manager and Quota Failover Engine."""

import json
from datetime import datetime, timedelta
import pytest

from services.rag_service.gateway.gemini_key_manager import (
    GeminiKeyManager,
    mask_key,
)
from shared.contracts.voice_contract import CredentialHealthStatus


def test_mask_key():
    """Verify API keys are masked properly for privacy and logs."""
    assert mask_key("SAMPLE_KEY_TESTING_1234") == "SAMPLE_K...1234"
    assert mask_key("") == "***"
    assert mask_key("short") == "***"


def test_key_manager_initialization_and_priority():
    """Verify projects and keys load ordered by priority."""
    config = json.dumps([
        {
            "project_id": "proj-beta",
            "priority": 2,
            "keys": [{"key": "KEY_BETA_1", "label": "beta-1"}]
        },
        {
            "project_id": "proj-alpha",
            "priority": 1,
            "keys": [{"key": "KEY_ALPHA_1", "label": "alpha-1"}, {"key": "KEY_ALPHA_2", "label": "alpha-2"}]
        }
    ])

    km = GeminiKeyManager(config_json=config)
    assert len(km.projects) == 2
    # proj-alpha should be first because priority=1
    assert km.projects[0].project_id == "proj-alpha"
    assert km.projects[1].project_id == "proj-beta"

    # Get credential should return key from highest priority project
    key, proj_id, bucket = km.get_credential()
    assert proj_id == "proj-alpha"
    assert key in ("KEY_ALPHA_1", "KEY_ALPHA_2")


def test_key_manager_project_429_failover():
    """Verify HTTP 429 triggers key rotation, and project-level cooldown once all keys are exhausted."""
    config = json.dumps([
        {
            "project_id": "proj-primary",
            "priority": 1,
            "keys": [
                {"key": "KEY_P1", "label": "p1"},
                {"key": "KEY_P2", "label": "p2"}
            ]
        },
        {
            "project_id": "proj-backup",
            "priority": 2,
            "keys": [
                {"key": "KEY_B1", "label": "b1"}
            ]
        }
    ])

    km = GeminiKeyManager(config_json=config)

    # First call: picks primary key P1
    key1, proj_id1, _ = km.get_credential()
    assert proj_id1 == "proj-primary"

    # Simulate 429 quota exhaustion on key P1
    km.record_failure("proj-primary", key1, 429, "Quota exhausted")

    # Second call: rotates to key P2 in same project
    key2, proj_id2, _ = km.get_credential()
    assert proj_id2 == "proj-primary"
    assert key2 != key1

    # Simulate 429 quota exhaustion on key P2 as well
    km.record_failure("proj-primary", key2, 429, "Quota exhausted")

    # Primary project must now be cooling down because all keys in it are exhausted
    primary_bucket = km.projects[0]
    assert primary_bucket.cooldown_until is not None
    assert primary_bucket.is_available() is False

    # Third call: must automatically fail over to backup project
    key3, proj_id3, _ = km.get_credential()
    assert proj_id3 == "proj-backup"
    assert key3 == "KEY_B1"


def test_key_manager_key_revocation_401():
    """Verify HTTP 401 revokes the specific key and rotates to another key in same project."""
    config = json.dumps([
        {
            "project_id": "proj-single",
            "priority": 1,
            "keys": [
                {"key": "KEY_BAD", "label": "bad"},
                {"key": "KEY_GOOD", "label": "good"}
            ]
        }
    ])

    km = GeminiKeyManager(config_json=config)

    # Mark KEY_BAD as revoked
    km.record_failure("proj-single", "KEY_BAD", 401, "Invalid API Key")

    bad_cred = km.projects[0].credentials[0]
    assert bad_cred.status == CredentialHealthStatus.REVOKED

    # Subsequent request should pick KEY_GOOD
    key, proj_id, _ = km.get_credential()
    assert proj_id == "proj-single"
    assert key == "KEY_GOOD"


def test_telemetry_reporting():
    """Verify admin telemetry status response generation."""
    config = json.dumps([
        {
            "project_id": "proj-alpha",
            "priority": 1,
            "keys": [{"key": "KEY_1", "label": "k1"}]
        }
    ])
    km = GeminiKeyManager(config_json=config)
    km.record_success("proj-alpha", "KEY_1")

    telemetry = km.get_status_telemetry()
    assert telemetry.global_status == "HEALTHY"
    assert telemetry.total_projects_count == 1
    assert telemetry.active_projects_count == 1
    assert telemetry.total_keys_count == 1
    assert telemetry.projects[0].credentials[0].total_calls_succeeded == 1
