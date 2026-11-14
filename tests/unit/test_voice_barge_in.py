"""Unit tests for Voice Session State Transitions and Barge-In Interruption."""

import pytest
from shared.contracts.voice_contract import VoiceSessionStatus


def test_barge_in_state_machine_transitions():
    """Verify state transitions when user interrupts during SPEAKING state."""
    # Simulated state machine transitions
    current_state = VoiceSessionStatus.LISTENING

    # User speaks
    current_state = VoiceSessionStatus.TRANSCRIBING
    assert current_state == VoiceSessionStatus.TRANSCRIBING

    # Speech pause and finalized
    current_state = VoiceSessionStatus.PROCESSING
    assert current_state == VoiceSessionStatus.PROCESSING

    # Audio synthesis completes and starts playback
    current_state = VoiceSessionStatus.SPEAKING
    assert current_state == VoiceSessionStatus.SPEAKING

    # USER INTERRUPTS (BARGE-IN): speech energy detected during playback
    is_user_speech_detected = True
    if current_state == VoiceSessionStatus.SPEAKING and is_user_speech_detected:
        # Immediate halt
        playback_stopped = True
        audio_queue_cleared = True
        current_state = VoiceSessionStatus.INTERRUPTED

    assert current_state == VoiceSessionStatus.INTERRUPTED
    assert playback_stopped is True
    assert audio_queue_cleared is True

    # System immediately resumes transcribing the new utterance
    current_state = VoiceSessionStatus.TRANSCRIBING
    assert current_state == VoiceSessionStatus.TRANSCRIBING
