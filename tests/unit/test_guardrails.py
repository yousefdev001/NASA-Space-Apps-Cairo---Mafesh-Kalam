"""Unit Tests for 6-Stage Clinical Safety Guardrails and Extractive Fallback."""

import pytest

from shared.constants import FLIGHT_SURGEON_ESCALATION_CLAUSE, SeverityLevel
from shared.contracts.rag_contract import ActionStep, EscalationPayload, ProtocolChunkResult
from shared.rules.severity_engine import RuleFlag, SeverityAssessment
from services.rag_service.guardrails.extractive_fallback import trigger_extractive_fallback
from services.rag_service.guardrails.safety_validator import run_guardrails


@pytest.fixture
def sample_tier1_chunk():
    return ProtocolChunkResult(
        chunk_id="chk_revk_oxygen_01",
        doc_id="NASA-CKLIST-REVK",
        doc_title="JSC-48031 Medical Checklist Generic, Revision K PCN-4",
        tier=1,
        procedure_title="Emergency Oxygen Resuscitation",
        page_start=226,
        ref_label="Medical Checklist Rev K PCN-4, p.226",
        score=0.95,
        text=(
            "1. Don Quick-Don Mask.\n"
            "2. Connect Quick Disconnect with Shuttle oxygen port LEH O2 8.\n"
            "3. Administer oxygen at 15 L/min flow rate.\n"
            "4. Verify chest rises with each ventilation."
        )
    )


@pytest.fixture
def critical_assessment():
    return SeverityAssessment(
        severity=SeverityLevel.CRITICAL,
        triggered_rules=[
            RuleFlag(
                rule_name="SPO2_CRITICAL",
                metric="spo2_percent",
                value=86.0,
                threshold=88.0,
                severity_level=SeverityLevel.CRITICAL,
                condition_hypothesis="hypoxia_suspected"
            )
        ],
        condition_hypotheses=["hypoxia_suspected"]
    )


def test_extractive_fallback_splits_numbered_steps(sample_tier1_chunk, critical_assessment):
    """Asserts extractive fallback correctly extracts discrete numbered steps from chunk."""
    response = trigger_extractive_fallback(
        retrieved_tier1_chunks=[sample_tier1_chunk],
        assessment=critical_assessment,
        request_id="REQ-FB-01"
    )

    assert response.status == "degraded"
    assert response.active_provider == "extractive_fallback"
    assert response.severity == SeverityLevel.CRITICAL
    assert len(response.steps) >= 3
    assert response.steps[0].source_chunk_id == "chk_revk_oxygen_01"
    assert "Quick-Don Mask" in response.steps[0].action
    assert response.escalation.required is True
    assert response.escalation.target == "Flight Surgeon"
    assert FLIGHT_SURGEON_ESCALATION_CLAUSE in response.summary


def test_guardrails_gate_g1_invalid_schema(sample_tier1_chunk, critical_assessment):
    """Asserts that malformed LLM JSON triggers extractive fallback."""
    raw_invalid = {"invalid_key": "some value"}
    is_valid, guidance = run_guardrails(raw_invalid, [sample_tier1_chunk], critical_assessment)

    assert is_valid is False
    assert guidance.status == "degraded"
    assert guidance.active_provider == "extractive_fallback"


def test_guardrails_gate_g2_invalid_tier_citation(sample_tier1_chunk, critical_assessment):
    """Asserts that action steps citing non-Tier 1 chunks are stripped."""
    raw_response = {
        "request_id": "REQ-G-001",
        "status": "ok",
        "severity": "Critical",
        "condition_hypotheses": ["hypoxia_suspected"],
        "summary": "Patient in acute hypoxia.",
        "steps": [
            {
                "n": 1,
                "action": "Administer oxygen at 15 L/min flow rate.",
                "source_chunk_id": "chk_revk_oxygen_01",  # Valid Tier 1
                "ref_label": "Rev K"
            },
            {
                "n": 2,
                "action": "Read flight manual background overview.",
                "source_chunk_id": "chk_tier3_background_99",  # Invalid Tier 3!
                "ref_label": "Tier 3"
            }
        ],
        "escalation": {
            "required": True,
            "reason": "Critical",
            "target": "Flight Surgeon"
        },
        "protocol_refs": ["Rev K"],
        "active_provider": "ollama",
        "latency_ms": 1200.0
    }

    is_valid, guidance = run_guardrails(raw_response, [sample_tier1_chunk], critical_assessment)
    assert is_valid is True
    # Step 2 was stripped because it cited non-existent/non-Tier 1 chunk
    assert len(guidance.steps) == 1
    assert guidance.steps[0].source_chunk_id == "chk_revk_oxygen_01"


def test_guardrails_gate_g4_dosage_hallucination_rejected(sample_tier1_chunk, critical_assessment):
    """Asserts that hallucinated drug dosages not in source chunk trigger step removal or fallback."""
    raw_response = {
        "request_id": "REQ-G-002",
        "status": "ok",
        "severity": "Critical",
        "condition_hypotheses": ["hypoxia_suspected"],
        "summary": "Patient in acute hypoxia.",
        "steps": [
            {
                "n": 1,
                "action": "Administer 50 mg Epinephrine immediately via IV.",  # Hallucinated 50 mg not in Rev K chunk!
                "source_chunk_id": "chk_revk_oxygen_01",
                "ref_label": "Rev K"
            }
        ],
        "escalation": {
            "required": True,
            "reason": "Critical",
            "target": "Flight Surgeon"
        },
        "protocol_refs": ["Rev K"],
        "active_provider": "ollama",
        "latency_ms": 1200.0
    }

    is_valid, guidance = run_guardrails(raw_response, [sample_tier1_chunk], critical_assessment)
    # The only step contained hallucinated dosage, so fallback must trigger
    assert is_valid is False
    assert guidance.status == "degraded"
    assert guidance.active_provider == "extractive_fallback"


def test_guardrails_gate_g5_severity_non_downgrade(sample_tier1_chunk, critical_assessment):
    """Asserts LLM cannot downgrade Critical rule severity to Normal."""
    raw_response = {
        "request_id": "REQ-G-003",
        "status": "ok",
        "severity": "Normal",  # LLM attempts to downgrade to Normal!
        "condition_hypotheses": ["hypoxia_suspected"],
        "summary": "Vitals seem okay.",
        "steps": [
            {
                "n": 1,
                "action": "Don Quick-Don Mask.",
                "source_chunk_id": "chk_revk_oxygen_01",
                "ref_label": "Rev K"
            }
        ],
        "escalation": {
            "required": False,
            "reason": "None",
            "target": "None"
        },
        "protocol_refs": ["Rev K"],
        "active_provider": "ollama",
        "latency_ms": 800.0
    }

    is_valid, guidance = run_guardrails(raw_response, [sample_tier1_chunk], critical_assessment)
    # Severity must be overridden back to CRITICAL
    assert guidance.severity == SeverityLevel.CRITICAL
    assert guidance.escalation.required is True
    assert guidance.escalation.target == "Flight Surgeon"
    assert FLIGHT_SURGEON_ESCALATION_CLAUSE in guidance.summary


def test_guardrails_new_auramed_system_instructions_schema(sample_tier1_chunk, critical_assessment):
    """Asserts that responses matching the new AuraMed System Instructions schema are properly normalized and pass all gates."""
    raw_response = {
        "system": "AuraMed",
        "status": "SUPPORTED",
        "emergency_assessment": {
            "reported_situation": "Acute oxygen desaturation during EVA preparation",
            "reported_symptoms": ["hypoxia_suspected"],
            "evidence_summary": "Retrieved verified Shuttle Medical Checklist Rev K emergency oxygen protocol.",
            "evidence_limitations": []
        },
        "steps": [
            {
                "step_number": 1,
                "instruction": "Don Quick-Don Mask.",
                "source_chunk_id": "chk_revk_oxygen_01",
                "source_text": "1. Don Quick-Don Mask."
            },
            {
                "step_number": 2,
                "instruction": "Administer oxygen at 15 L/min flow rate.",
                "source_chunk_id": "chk_revk_oxygen_01",
                "source_text": "3. Administer oxygen at 15 L/min flow rate."
            }
        ],
        "medications": [],
        "sources": [
            {
                "source_chunk_id": "chk_revk_oxygen_01",
                "source_tier": "NASA_TIER_1",
                "document_title": "Medical Checklist Rev K PCN-4, p.226"
            }
        ],
        "escalation_required": True,
        "escalation_reason": "Acute SpO2 critical drop"
    }

    is_valid, guidance = run_guardrails(raw_response, [sample_tier1_chunk], critical_assessment)
    assert is_valid is True
    assert guidance.status == "ok"
    assert guidance.severity == SeverityLevel.CRITICAL
    assert len(guidance.steps) == 2
    assert guidance.steps[0].action == "Don Quick-Don Mask."
    assert guidance.steps[0].source_chunk_id == "chk_revk_oxygen_01"
    assert guidance.steps[0].ref_label == "Medical Checklist Rev K PCN-4, p.226"
    assert guidance.escalation.required is True
    assert guidance.escalation.target == "Flight Surgeon"
    assert FLIGHT_SURGEON_ESCALATION_CLAUSE in guidance.summary

