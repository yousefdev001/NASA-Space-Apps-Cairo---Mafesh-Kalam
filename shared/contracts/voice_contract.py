"""Pydantic Contracts and Schemas for AuraMed Live Voice Conversation Mode.

Feature Branch: 002-live-voice-mode
Authoritative API Contracts for Voice Session Management, Key Pool, and Speech Synthesis.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


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
    silence_timeout_ms: int = Field(default=1500, description="Configured silence timeout in milliseconds")
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


class SynthesizeSpeechRequest(BaseModel):
    session_id: str = Field(..., description="Active voice session ID")
    raw_markdown: str = Field(..., description="Exact medical response markdown from POST /v1/chat")
    voice_name: Optional[str] = Field(default="Kore", description="Studio voice name: Kore, Charon, Fenrir, Puck, etc.")
    speech_style: Optional[str] = Field(
        default="calm, articulate, authoritative flight surgeon",
        description="Delivery style instructions for speech_metadata.style"
    )
    language: Optional[str] = Field(default="auto", description="Spoken language: 'ar', 'en', or 'auto'")
    mode: Optional[str] = Field(
        default="auto",
        description="Operating mode: 'online' (fast cloud), 'offline' (local VibeVoice), or 'auto' (fallback)"
    )


class SynthesizeSpeechResponse(BaseModel):
    session_id: str
    turn_id: str
    audio_base64: str = Field(..., description="Base64-encoded WAV (24kHz 16-bit mono) audio payload")
    audio_mime_type: str = Field(default="audio/wav", description="Audio MIME format")
    duration_seconds: float = Field(..., description="Calculated duration of synthesized audio in seconds")
    spoken_text: str = Field(..., description="Cleaned verbatim script delivered to TTS engine")
    latency_ms: float = Field(..., description="TTS generation latency in milliseconds")
    tts_provider: Optional[str] = Field(
        default="gemini_cloud",
        description="Active speech synthesis provider: gemini_cloud, vibevoice_offline, or edge_tts_fallback"
    )


class KeyHealthInfo(BaseModel):
    credential_id: str
    masked_key: str
    status: CredentialHealthStatus
    consecutive_failures: int
    last_failure_reason: Optional[str] = None
    total_calls_succeeded: int = 0
    total_calls_failed: int = 0
    last_used_at: Optional[datetime] = None


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


class AudioTurnRequest(BaseModel):
    audio_base64: str = Field(..., description="Base64 encoded audio bytes (WAV, WebM, MP3, OGG, PCM)")
    audio_mime_type: str = Field(default="audio/wav", description="Input audio MIME type, e.g. audio/wav or audio/webm")
    astronaut_id: str = Field(default="ASTRO-01", description="Astronaut identifier")
    vitals: Optional[Dict[str, float]] = Field(default=None, description="Optional active telemetry vitals dictionary")
    history: Optional[List[Dict[str, Any]]] = Field(default=None, description="Previous conversation turns for multi-turn context")
    voice_preference: Optional[str] = Field(default="Kore", description="Desired TTS studio voice (Kore, Puck, etc.)")
    language: Optional[str] = Field(default="auto", description="Spoken language: 'ar', 'en', or 'auto'")
    mode: Optional[str] = Field(
        default="auto",
        description="Operating mode: 'online' (fast cloud), 'offline' (local VibeVoice), or 'auto' (fallback)"
    )


class AudioTurnResponse(BaseModel):
    session_id: str
    turn_id: str
    user_transcript: str = Field(..., description="Verbatim speech-to-text transcript generated by Gemini")
    severity: str = Field(..., description="Clinical evaluated severity (Normal, Warning, Critical)")
    assistant_summary: str = Field(..., description="Evidence-grounded medical guidance generated by AuraMed")
    action_steps: List[Dict[str, Any]] = Field(default_factory=list, description="Prescribed NASA checklist procedural steps")
    escalation: Dict[str, Any] = Field(default_factory=dict, description="Medical escalation payload")
    audio_base64: str = Field(..., description="Base64-encoded spoken response audio (WAV 24kHz)")
    audio_mime_type: str = Field(default="audio/wav", description="Audio MIME format")
    duration_seconds: float = Field(..., description="Duration of spoken output audio in seconds")
    telemetry_evaluated: Dict[str, Any] = Field(default_factory=dict, description="Summary of evaluated vitals")
    latency_ms: float = Field(..., description="End-to-end processing latency in milliseconds")
    tts_provider: Optional[str] = Field(
        default="gemini_cloud",
        description="Active speech synthesis provider: gemini_cloud, vibevoice_offline, or edge_tts_fallback"
    )


class SetVoiceModeRequest(BaseModel):
    mode: str = Field(..., description="Operating mode to set: 'online', 'offline', or 'auto'")


class VoiceModeResponse(BaseModel):
    service: str = "auramed-voice-gateway"
    operating_mode: str = Field(..., description="'online', 'offline', or 'degraded'")
    configured_default_mode: str = Field(default="auto", description="Active default mode: 'online', 'offline', or 'auto'")
    cloud_tts_configured: bool
    cloud_tts_model: str
    offline_tts_available: bool
    offline_tts_model: str = "microsoft/VibeVoice-Realtime-0.5B"


