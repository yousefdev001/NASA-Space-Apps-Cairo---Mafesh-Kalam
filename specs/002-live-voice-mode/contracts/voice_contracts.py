"""Pydantic Contracts and Schemas for AuraMed Live Voice Conversation Mode.

Feature Branch: 002-live-voice-mode
Authoritative API Contracts for Voice Session Management, Key Pool, and Speech Synthesis.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class VoiceSessionStatus(str, Enum):
    IDLE = "IDLE"
    CONNECTING = "CONNECTING"
    LISTENING = "LISTENING"
    TRANSCRIBING = "TRANSCRIBING"
    PROCESSING = "PROCESSING"
    SPEAKING = "SPEAKING"
    INTERRUPTED = "INTERRUPTED"
    RECONNECTING = "RECONNECTING"
    ERROR = "ERROR"
    ENDED = "ENDED"


class CredentialHealthStatus(str, Enum):
    ACTIVE = "ACTIVE"
    RATE_LIMITED = "RATE_LIMITED"
    REVOKED = "REVOKED"
    DISABLED = "DISABLED"


# ---------------------------------------------------------------------------
# 1. Voice Session Initiation & Ephemeral Token
# ---------------------------------------------------------------------------

class StartVoiceSessionRequest(BaseModel):
    astronaut_id: str = Field(default="ASTRO-01", description="Astronaut or Flight Surgeon identifier")
    language_hint: Optional[str] = Field(default=None, description="Optional language preference (e.g. 'ar' or 'en')")
    voice_preference: Optional[str] = Field(default="Kore", description="Preferred Gemini studio voice name")
    enable_smart_transcribe: bool = Field(default=True, description="Enable smart formatting and disfluency removal")
    silence_timeout_ms: int = Field(
        default=1500,
        ge=800,
        le=5000,
        description="Duration of continuous silence (in ms) to wait before finalizing a speech turn (e.g. 1500-2000ms)"
    )


class StartVoiceSessionResponse(BaseModel):
    session_id: str = Field(..., description="Unique voice session tracking ID")
    ephemeral_token: str = Field(..., description="Single-use constrained Google Gemini ephemeral token")
    token_expires_at: datetime = Field(..., description="Expiration timestamp (UTC)")
    ws_endpoint: str = Field(..., description="Target Google Gemini Live Transcribe WebSocket URL")
    relay_endpoint: str = Field(..., description="Fallback internal AuraMed WebSocket relay URL")
    model: str = Field(default="gemini-3.5-transcribe-live", description="Assigned transcription model")
    custom_vocabulary: List[str] = Field(default_factory=list, description="Custom medical vocabulary biasing list")
    audio_format: Dict[str, Any] = Field(
        default={
            "format": "pcm_s16le",
            "sample_rate_hz": 16000,
            "channels": 1,
            "chunk_duration_ms": 100
        },
        description="Audio format requirements for microphone capture"
    )


class RefreshTokenRequest(BaseModel):
    session_id: str = Field(..., description="Active voice session identifier")


class RefreshTokenResponse(BaseModel):
    session_id: str
    ephemeral_token: str
    token_expires_at: datetime
    active_project_id: str


# ---------------------------------------------------------------------------
# 2. Text-to-Speech (TTS) Synthesis
# ---------------------------------------------------------------------------

class SynthesizeSpeechRequest(BaseModel):
    session_id: str = Field(..., description="Active voice session ID")
    raw_markdown: str = Field(..., description="Exact medical response markdown from POST /v1/chat")
    voice_name: Optional[str] = Field(default="Kore", description="Studio voice name: Kore, Charon, Fenrir, Puck, etc.")
    speech_style: Optional[str] = Field(
        default="calm, articulate, authoritative flight surgeon",
        description="Delivery style instructions for speech_metadata.style"
    )
    language: Optional[str] = Field(default="auto", description="Spoken language: 'ar', 'en', or 'auto'")


class SynthesizeSpeechResponse(BaseModel):
    session_id: str
    turn_id: str
    audio_base64: str = Field(..., description="Base64-encoded WAV (24kHz 16-bit mono) audio payload")
    audio_mime_type: str = Field(default="audio/wav", description="Audio MIME format")
    duration_seconds: float = Field(..., description="Calculated duration of synthesized audio in seconds")
    spoken_text: str = Field(..., description="Cleaned verbatim script delivered to TTS engine")
    latency_ms: float = Field(..., description="TTS generation latency in milliseconds")


# ---------------------------------------------------------------------------
# 3. Key Manager & Health Telemetry
# ---------------------------------------------------------------------------

class KeyHealthInfo(BaseModel):
    credential_id: str
    masked_key: str
    status: CredentialHealthStatus
    consecutive_failures: int
    last_failure_reason: Optional[str]
    total_calls_succeeded: int
    total_calls_failed: int
    last_used_at: Optional[datetime]


class ProjectQuotaInfo(BaseModel):
    project_id: str
    priority: int
    is_active: bool
    is_cooling_down: bool
    cooldown_seconds_remaining: float
    current_rpm: int
    total_keys: int
    active_keys: int
    credentials: List[KeyHealthInfo]


class KeyPoolStatusResponse(BaseModel):
    service: str = "auramed-gemini-keypool"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    active_projects_count: int
    total_projects_count: int
    total_keys_count: int
    active_keys_count: int
    global_status: str = Field(..., description="'HEALTHY', 'DEGRADED', or 'EXHAUSTED'")
    projects: List[ProjectQuotaInfo]


# ---------------------------------------------------------------------------
# 4. WebSocket Client & Relay Protocol Messages
# ---------------------------------------------------------------------------

class ClientAudioMessage(BaseModel):
    event: str = Field(default="audio_chunk", description="Event name: 'audio_chunk', 'barge_in', 'mute'")
    session_id: str
    chunk_index: int
    audio_base64: str = Field(..., description="Base64-encoded 16kHz PCM audio chunk")


class ServerTranscriptMessage(BaseModel):
    event: str = Field(..., description="'interim_transcript', 'final_transcript', 'barge_in_ack', 'error'")
    session_id: str
    text: str
    is_final: bool = False
    confidence: Optional[float] = 1.0
    language_code: Optional[str] = None
