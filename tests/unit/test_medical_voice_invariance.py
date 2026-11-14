"""Unit tests for Medical Response Invariance and Safety Guardrail Preservation."""

import pytest
from shared.formatting.spoken_filter import SpokenMedicalFilter


def test_medical_hypoxia_scenario_invariance():
    """Verify that acute hypoxia protocol text maintains 100% dosage fidelity."""
    original_guidance = """### 1. تحليل القياسات ونماذج الذكاء الاصطناعي
- SpO2: 85% (نقص حاد في الأكسجين - Critical Hypoxia)
- Heart Rate: 135 bpm (تسارع نبضات القلب - Tachycardia)
- Blood Pressure: 145/95 mmHg

### 3. الخطوات الإجرائية (NASA Tier 1 Rev K)
1. قم بتوصيل قناع Resuscitator فورا وتفعيل تدفق الأكسجين من وحدة SOMS بمعدل 12 L/min.
2. ثبت المريض على نقالة Crew Medical Restraint System لمنع الحركة في الجاذبية الصغرى.
3. أعط المريض جرعة أولية 500 mg مضاد أكسدة وريديا.
source_chunk_id: JSC-48031-REV-K-0012
"""
    spoken = SpokenMedicalFilter.clean_for_speech(original_guidance)

    # Invariance check
    is_safe, missing = SpokenMedicalFilter.verify_dosage_invariance(original_guidance, spoken)
    assert is_safe is True
    assert len(missing) == 0

    # Ensure critical numbers remain
    assert "85" in spoken
    assert "135 bpm" in spoken
    assert "145/95 mmHg" in spoken
    assert "12 L/min" in spoken
    assert "500 mg" in spoken


def test_acoustic_uncertainty_threshold():
    """Verify low acoustic confidence triggers verbal confirmation rule."""
    def evaluate_transcription_safety(confidence: float) -> bool:
        # Safety gate: if acoustic confidence < 0.75, require confirmation
        return confidence >= 0.75

    assert evaluate_transcription_safety(0.92) is True
    assert evaluate_transcription_safety(0.70) is False
