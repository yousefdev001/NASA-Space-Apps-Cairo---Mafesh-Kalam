"""Unit tests for Deterministic Spoken Medical Filter and Dosage Invariance."""

import pytest
from shared.formatting.spoken_filter import SpokenMedicalFilter


def test_spoken_filter_strips_markdown_and_citations():
    """Verify that headers, chunk IDs, and markdown artifacts are removed."""
    raw = """### 1. تحليل القياسات ونماذج الذكاء الاصطناعي
[CHUNK-0042] Astronaut exhibiting acute hypoxia with **SpO2 85%** and heart rate 125 bpm.
---
### 3. الخطوات الإجرائية (NASA Tier 1)
1. Attach SOMS O2 mask with flow rate 10 L/min.
2. Monitor blood pressure at 140/90 mmHg.
source_chunk_id: JSC-48031-REV-K-0042
"""
    cleaned = SpokenMedicalFilter.clean_for_speech(raw)

    # Markdown artifacts must be stripped
    assert "###" not in cleaned
    assert "[CHUNK-0042]" not in cleaned
    assert "source_chunk_id" not in cleaned
    assert "**" not in cleaned
    assert "---" not in cleaned

    # Critical medical facts and dosages must be preserved
    assert "SpO2" in cleaned
    assert "85" in cleaned
    assert "125 bpm" in cleaned
    assert "10 L/min" in cleaned
    assert "140/90 mmHg" in cleaned


def test_dosage_invariance_verification_pass():
    """Verify invariance passes when all original dosages exist in cleaned text."""
    raw = "Patient given 250 mg Acetaminophen and SpO2 is 88% with HR 110 bpm."
    cleaned = SpokenMedicalFilter.clean_for_speech(raw)

    is_safe, missing = SpokenMedicalFilter.verify_dosage_invariance(raw, cleaned)
    assert is_safe is True
    assert len(missing) == 0


def test_dosage_invariance_verification_detects_tampering():
    """Verify invariance flags when a dosage is missing or altered."""
    raw = "Patient given 50 mg Epinephrine."
    tampered_spoken = "Patient given Epinephrine."

    is_safe, missing = SpokenMedicalFilter.verify_dosage_invariance(raw, tampered_spoken)
    assert is_safe is False
    assert any("50 mg" in m for m in missing)
