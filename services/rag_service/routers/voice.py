"""Voice Mode Router for AuraMed Clinical Copilot.

Feature Branch: 002-live-voice-mode
Provides:
1. POST /api/v1/voice/session/start: Mints constrained ephemeral token for live STT.
2. POST /api/v1/voice/session/token: Refreshes token for active sessions.
3. POST /api/v1/voice/tts: Synthesizes spoken audio for clinical guidance.
4. GET /api/v1/voice/keypool/status: Health & quota telemetry probe.
"""

import asyncio
from datetime import datetime, timedelta, timezone
import logging
import os
import time
from uuid import uuid4
from fastapi import APIRouter, HTTPException, status, WebSocket, WebSocketDisconnect
import websockets

from services.rag_service.gateway.gemini_key_manager import key_manager_instance
from services.rag_service.gateway.gemini_stt_client import stt_client_instance
from services.rag_service.gateway.gemini_token_minter import token_minter_instance
from services.rag_service.gateway.gemini_tts_client import tts_client_instance
from services.rag_service.gateway.tts_gateway import tts_gateway_instance
from shared.constants import (
    DEFAULT_SILENCE_TIMEOUT_MS,
    DEFAULT_TTS_MODEL,
    DEFAULT_TTS_VOICE,
    DEFAULT_VOICE_MODEL,
    NASA_MEDICAL_CUSTOM_VOCABULARY,
)
from shared.contracts.voice_contract import (
    AudioTurnRequest,
    AudioTurnResponse,
    KeyPoolStatusResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    SetVoiceModeRequest,
    StartVoiceSessionRequest,
    StartVoiceSessionResponse,
    SynthesizeSpeechRequest,
    SynthesizeSpeechResponse,
    VoiceModeResponse,
)

logger = logging.getLogger("auramed.voice.router")

router = APIRouter(prefix="/api/v1/voice", tags=["Live Voice Interface"])


@router.post(
    "/session/start",
    response_model=StartVoiceSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Initialize Live Voice Session and Mint Ephemeral Token",
)
async def start_voice_session(request: StartVoiceSessionRequest) -> StartVoiceSessionResponse:
    """Initialize a hands-free voice session.

    Allocates an eligible Google Cloud Project from the Key Manager and
    mints a short-lived, single-use Ephemeral Token with constraints strictly
    restricted to gemini-3.5-transcribe-live without exposing permanent keys.
    """
    session_id = f"VSES-{uuid4().hex[:12].upper()}"
    silence_ms = request.silence_timeout_ms or DEFAULT_SILENCE_TIMEOUT_MS

    try:
        token, expires_at, project_id = await token_minter_instance.mint_live_transcribe_token(
            validity_minutes=30,
            model=DEFAULT_VOICE_MODEL,
            custom_vocabulary=NASA_MEDICAL_CUSTOM_VOCABULARY,
        )
    except Exception as exc:
        logger.warning(
            f"[VOICE-SESSION-START] Cloud token minting failed ({exc}). "
            "Generating fallback session token for offline/development mode."
        )
        # Fallback token for local/dev environments without outbound access
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
        token = f"dev_ephemeral_{uuid4().hex[:16]}"
        project_id = "local-simulated-project"

    # For ephemeral tokens, Google's documented endpoint format is BidiGenerateContentConstrained?access_token={token}
    ws_url = (
        f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta."
        f"GenerativeService.BidiGenerateContentConstrained?access_token={token}"
    )
    relay_url = f"/api/v1/voice/relay/{session_id}"

    return StartVoiceSessionResponse(
        session_id=session_id,
        ephemeral_token=token,
        token_expires_at=expires_at,
        ws_endpoint=ws_url,
        relay_endpoint=relay_url,
        model=DEFAULT_VOICE_MODEL,
        custom_vocabulary=NASA_MEDICAL_CUSTOM_VOCABULARY,
        silence_timeout_ms=silence_ms,
        audio_format={
            "format": "pcm_s16le",
            "sample_rate_hz": 16000,
            "channels": 1,
            "chunk_duration_ms": 100,
        },
    )


@router.post(
    "/session/token",
    response_model=RefreshTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh In-Flight Ephemeral Token",
)
async def refresh_voice_token(request: RefreshTokenRequest) -> RefreshTokenResponse:
    """Refresh an ephemeral token before the 10-minute session cap expires."""
    try:
        token, expires_at, project_id = await token_minter_instance.mint_live_transcribe_token(
            validity_minutes=30,
            model=DEFAULT_VOICE_MODEL,
            custom_vocabulary=NASA_MEDICAL_CUSTOM_VOCABULARY,
        )
    except Exception as exc:
        logger.error(f"[TOKEN-REFRESH-ERROR] Failed to refresh ephemeral token: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to refresh ephemeral token: {exc}",
        )

    return RefreshTokenResponse(
        session_id=request.session_id,
        ephemeral_token=token,
        token_expires_at=expires_at,
        active_project_id=project_id,
    )


@router.post(
    "/conversation/audio-turn",
    response_model=AudioTurnResponse,
    status_code=status.HTTP_200_OK,
    summary="End-to-End Spoken Turn: Audio In -> Medical RAG Reasoning -> Audio Out",
)
async def process_audio_conversation_turn(request: AudioTurnRequest) -> AudioTurnResponse:
    """Full Audio-In / Audio-Out Turn Endpoint.

    Takes raw user audio (WAV, WebM, MP3), transcribes it with Gemini 3.5 Transcribe,
    processes the transcript through AuraMed's clinical reasoning copilot
    (with NASA Tier 1 retrieval, vital rules, and clinical safety guardrails),
    and synthesizes the resulting medical guidance directly into speech audio via Gemini TTS.
    """
    t0 = time.perf_counter()
    session_id = f"VSES-{uuid4().hex[:10].upper()}"
    turn_id = f"TURN-{uuid4().hex[:8].upper()}"

    # 1. Transcribe Spoken User Audio via Google Gemini 3.5 Transcribe
    try:
        user_transcript, stt_latency = await stt_client_instance.transcribe_audio(
            audio_base64=request.audio_base64,
            mime_type=request.audio_mime_type,
            language=request.language or "auto",
        )
    except Exception as exc:
        logger.error(f"[AUDIO-TURN-STT-ERROR] Failed to transcribe audio: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Speech transcription failed: {exc}",
        )

    if not user_transcript:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No recognizable speech detected in audio payload.",
        )

    # 2. Process Medical Query through AuraMed Clinical Copilot
    from services.rag_service.routers.chat import ChatMessageRequest, chat_with_auramed

    chat_req = ChatMessageRequest(
        query=user_transcript,
        astronaut_id=request.astronaut_id,
        vitals=request.vitals,
        history=request.history,
    )

    try:
        chat_res = await chat_with_auramed(chat_req)
    except Exception as exc:
        logger.error(f"[AUDIO-TURN-COPILOT-ERROR] Medical reasoning failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Medical copilot reasoning failed: {exc}",
        )

    # 3. Synthesize AuraMed Clinical Guidance into Speech with Online-First / Offline-Fallback
    voice = request.voice_preference or DEFAULT_TTS_VOICE
    audio_b64, duration_sec, spoken_text, tts_latency, active_provider = await tts_gateway_instance.synthesize_speech(
        raw_markdown=chat_res.summary,
        voice_name=voice,
        model=DEFAULT_TTS_MODEL,
        language=request.language or "auto",
        mode=request.mode,
    )

    total_latency_ms = (time.perf_counter() - t0) * 1000

    # Format action steps and telemetry
    steps_data = [
        s.model_dump() if hasattr(s, "model_dump") else dict(s)
        for s in (chat_res.action_steps or [])
    ]
    escalation_data = (
        chat_res.escalation.model_dump()
        if hasattr(chat_res.escalation, "model_dump")
        else dict(chat_res.escalation or {})
    )
    telemetry_data = (
        chat_res.ml_insights.telemetry_summary
        if chat_res.ml_insights
        else (request.vitals or {})
    )

    audio_mime = (
        "audio/mp3"
        if (active_provider == "edge_tts_fallback" or audio_b64.startswith("//") or audio_b64.startswith("SUQz"))
        else "audio/wav"
    )

    return AudioTurnResponse(
        session_id=session_id,
        turn_id=turn_id,
        user_transcript=user_transcript,
        severity=chat_res.severity,
        assistant_summary=chat_res.summary,
        action_steps=steps_data,
        escalation=escalation_data,
        audio_base64=audio_b64,
        audio_mime_type=audio_mime,
        duration_seconds=duration_sec,
        telemetry_evaluated=telemetry_data,
        latency_ms=round(total_latency_ms, 1),
        tts_provider=active_provider,
    )


@router.post(
    "/tts",
    response_model=SynthesizeSpeechResponse,
    status_code=status.HTTP_200_OK,
    summary="Synthesize Clinical Guidance Audio with Online-First / Offline-Fallback",
)
async def synthesize_voice_guidance(request: SynthesizeSpeechRequest) -> SynthesizeSpeechResponse:
    """Convert validated medical markdown into high-fidelity spoken audio.

    Orchestrates generation through TTSGateway:
    1. Cloud Google Gemini 3.8 Flash TTS (if configured & online).
    2. Zero-delay offline VibeVoice-Realtime-0.5B local engine on cloud outage/rate-limit.
    3. Neural Edge-TTS fallback if local model encounters an issue.
    """
    turn_id = f"TURN-{uuid4().hex[:8].upper()}"
    voice = request.voice_name or DEFAULT_TTS_VOICE
    style = request.speech_style or "calm, articulate, authoritative flight surgeon"

    audio_b64, duration_sec, spoken_script, latency_ms, active_provider = await tts_gateway_instance.synthesize_speech(
        raw_markdown=request.raw_markdown,
        voice_name=voice,
        speech_style=style,
        model=DEFAULT_TTS_MODEL,
        language=request.language or "auto",
        mode=request.mode,
    )

    audio_mime = (
        "audio/mp3"
        if (active_provider == "edge_tts_fallback" or audio_b64.startswith("//") or audio_b64.startswith("SUQz"))
        else "audio/wav"
    )

    return SynthesizeSpeechResponse(
        session_id=request.session_id,
        turn_id=turn_id,
        audio_base64=audio_b64,
        audio_mime_type=audio_mime,
        duration_seconds=duration_sec,
        spoken_text=spoken_script,
        latency_ms=latency_ms,
        tts_provider=active_provider,
    )


@router.get(
    "/mode",
    response_model=VoiceModeResponse,
    status_code=status.HTTP_200_OK,
    summary="Voice Engine Operating Mode & Provider Status",
)
async def voice_operating_mode() -> VoiceModeResponse:
    """Report active voice mode (online, offline, degraded) and provider telemetry."""
    mode = await tts_gateway_instance.get_operating_mode()
    cloud_cfg = tts_gateway_instance.cloud_client.is_configured()
    offline_avail = tts_gateway_instance.local_client.is_model_available()
    return VoiceModeResponse(
        service="auramed-voice-gateway",
        operating_mode=mode,
        configured_default_mode=tts_gateway_instance.default_mode,
        cloud_tts_configured=cloud_cfg,
        cloud_tts_model=DEFAULT_TTS_MODEL,
        offline_tts_available=offline_avail,
        offline_tts_model="microsoft/VibeVoice-Realtime-0.5B",
    )


@router.post(
    "/mode",
    response_model=VoiceModeResponse,
    status_code=status.HTTP_200_OK,
    summary="Configure Default Operating Mode (online, offline, auto)",
)
async def set_voice_operating_mode(payload: SetVoiceModeRequest) -> VoiceModeResponse:
    """Dynamically switch operating mode between online (fast cloud), offline (local VibeVoice), or auto."""
    try:
        tts_gateway_instance.set_default_mode(payload.mode)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return await voice_operating_mode()


@router.get(
    "/keypool/status",
    response_model=KeyPoolStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Key Pool Quota & Telemetry Health Status",
)
async def keypool_status() -> KeyPoolStatusResponse:
    """Retrieve operational telemetry and health across all configured Google Projects and keys."""
    return key_manager_instance.get_status_telemetry()


@router.websocket("/relay/{session_id}")
async def voice_websocket_relay(websocket: WebSocket, session_id: str):
    """Server-side bi-directional WebSocket relay to Google Gemini Live API.

    Provides transparent failover for client environments that cannot directly
    reach Google's WebSocket endpoints or when ephemeral token handshakes fail.
    Uses the server-managed Gemini Key Pool with automatic rotation.
    """
    await websocket.accept()
    logger.info(f"[VOICE-RELAY] Client connected for session {session_id}")

    api_key, project_id, _ = key_manager_instance.get_credential()
    if not api_key:
        logger.error(f"[VOICE-RELAY] No active Gemini API key available for session {session_id}")
        await websocket.close(code=1011, reason="No active Google Gemini credentials")
        return

    google_ws_url = (
        f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta."
        f"GenerativeService.BidiGenerateContent?key={api_key}"
    )

    try:
        async with websockets.connect(google_ws_url) as google_ws:
            logger.info(f"[VOICE-RELAY] Upstream connected to Gemini Live API ({project_id})")

            async def client_to_google():
                try:
                    while True:
                        msg = await websocket.receive_text()
                        await google_ws.send(msg)
                except (WebSocketDisconnect, asyncio.CancelledError):
                    pass
                except Exception as e:
                    logger.debug(f"[VOICE-RELAY] Client-to-Google terminated: {e}")

            async def google_to_client():
                try:
                    async for msg in google_ws:
                        if isinstance(msg, bytes):
                            msg = msg.decode("utf-8", errors="replace")
                        await websocket.send_text(msg)
                except (WebSocketDisconnect, asyncio.CancelledError):
                    pass
                except Exception as e:
                    logger.debug(f"[VOICE-RELAY] Google-to-Client terminated: {e}")

            task_c2g = asyncio.create_task(client_to_google())
            task_g2c = asyncio.create_task(google_to_client())
            done, pending = await asyncio.wait(
                [task_c2g, task_g2c], return_when=asyncio.FIRST_COMPLETED
            )
            for t in pending:
                t.cancel()
    except Exception as exc:
        logger.error(f"[VOICE-RELAY] Upstream connection failure for session {session_id}: {exc}")
        key_manager_instance.record_failure(project_id, api_key, 503, str(exc))
        try:
            await websocket.close(code=1011, reason=f"Upstream relay error: {exc}")
        except Exception:
            pass

