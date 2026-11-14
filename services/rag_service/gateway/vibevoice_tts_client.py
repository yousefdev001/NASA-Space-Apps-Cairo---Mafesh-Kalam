"""Local Offline VibeVoice Speech Generation (TTS) Client.

Feature: Offline Voice Fallback (NASA Space Apps 2026 Architecture)
Model: microsoft/VibeVoice-Realtime-0.5B (0.5B parameters, streaming acoustic VAE + diffusion)
Runs 100% locally on device (NVIDIA Quadro RTX 3000 Max-Q or CPU fallback).
Provides zero-delay voice generation when cloud APIs or network connectivity are unavailable.
"""

import asyncio
import base64
import io
import logging
import os
from pathlib import Path
import time
from typing import Dict, Optional, Tuple

import numpy as np
from scipy.io import wavfile
import torch
from transformers.cache_utils import DynamicCache

from services.rag_service.gateway.vibevoice import (
    VibeVoiceStreamingProcessor,
    VibeVoiceStreamingForConditionalGenerationInference,
)
from shared.formatting.spoken_filter import SpokenMedicalFilter

logger = logging.getLogger("auramed.voice.vibevoice_client")

# Default paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DEFAULT_MODEL_DIR = PROJECT_ROOT / "models" / "VibeVoice-Realtime-0.5B"
DEFAULT_VOICES_DIR = DEFAULT_MODEL_DIR / "voices"

# Voice Preset Mapping: maps friendly or cloud voice names to local voice embedding files
VOICE_MAP = {
    # Direct local voice names
    "carter": "en-Carter_man.pt",
    "davis": "en-Davis_man.pt",
    "emma": "en-Emma_woman.pt",
    "frank": "en-Frank_man.pt",
    "grace": "en-Grace_woman.pt",
    "mike": "en-Mike_man.pt",
    # Gemini Cloud Voice aliases mapped to local equivalents
    "kore": "en-Emma_woman.pt",
    "puck": "en-Carter_man.pt",
    "fenrir": "en-Davis_man.pt",
    "aoede": "en-Grace_woman.pt",
    "charon": "en-Frank_man.pt",
}


def _adapt_cache_to_transformers5(cache_obj: DynamicCache) -> DynamicCache:
    """Adapt legacy transformers DynamicCache (key_cache/value_cache) to Transformers v5 format."""
    if hasattr(cache_obj, "key_cache") and hasattr(cache_obj, "value_cache"):
        new_cache = DynamicCache()
        for idx, (k_tensor, v_tensor) in enumerate(zip(cache_obj.key_cache, cache_obj.value_cache)):
            new_cache.update(k_tensor, v_tensor, layer_idx=idx)
        return new_cache
    return cache_obj


class VibeVoiceTTSClient:
    """High-performance local offline TTS client using microsoft/VibeVoice-Realtime-0.5B."""

    def __init__(
        self,
        model_dir: Optional[Path] = None,
        voices_dir: Optional[Path] = None,
        inference_steps: int = 3,
        default_voice: str = "carter",
    ):
        self.model_dir = Path(model_dir) if model_dir else DEFAULT_MODEL_DIR
        self.voices_dir = Path(voices_dir) if voices_dir else (self.model_dir / "voices")
        self.inference_steps = inference_steps
        self.default_voice = default_voice

        self.processor: Optional[VibeVoiceStreamingProcessor] = None
        self.model: Optional[VibeVoiceStreamingForConditionalGenerationInference] = None
        self.device: str = "cpu"
        self.dtype: torch.dtype = torch.float32

        self._cached_voice_prompts: Dict[str, Dict] = {}
        self._init_lock = asyncio.Lock()
        self._is_loaded = False

    def is_model_available(self) -> bool:
        """Check if local model weights and voice files exist on disk."""
        model_file = self.model_dir / "model.safetensors"
        config_file = self.model_dir / "config.json"
        return model_file.is_file() and config_file.is_file() and self.voices_dir.is_dir()

    def _load_model_sync(self):
        """Synchronous loader for model and processor."""
        if self._is_loaded:
            return

        if not self.is_model_available():
            raise FileNotFoundError(
                f"VibeVoice model files not found at '{self.model_dir}'. "
                "Verify model.safetensors and config.json are present."
            )

        t0 = time.perf_counter()
        logger.info(f"[VIBEVOICE-LOAD] Initializing processor from {self.model_dir}...")
        self.processor = VibeVoiceStreamingProcessor.from_pretrained(str(self.model_dir))

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.dtype = torch.bfloat16 if self.device == "cuda" else torch.float32

        if self.device == "cpu":
            num_threads = min(8, os.cpu_count() or 4)
            torch.set_num_threads(num_threads)
            logger.info(f"[VIBEVOICE-LOAD] Configured PyTorch CPU threads: {num_threads}")

        logger.info(
            f"[VIBEVOICE-LOAD] Loading VibeVoice-Realtime-0.5B on device='{self.device}', dtype={self.dtype}..."
        )
        self.model = VibeVoiceStreamingForConditionalGenerationInference.from_pretrained(
            str(self.model_dir),
            dtype=self.dtype,
            low_cpu_mem_usage=False,
            attn_implementation="sdpa" if self.device == "cuda" else None,
        )
        self.model.to(self.device)
        self.model.eval()
        self.model.set_ddpm_inference_steps(num_steps=self.inference_steps)

        load_sec = time.perf_counter() - t0
        self._is_loaded = True
        logger.info(f"[VIBEVOICE-LOAD] Model ready in {load_sec:.2f}s on {self.device}.")

    async def ensure_loaded(self):
        """Ensure model is loaded asynchronously without blocking main loop."""
        if self._is_loaded:
            return
        async with self._init_lock:
            if not self._is_loaded:
                await asyncio.to_thread(self._load_model_sync)

    def _get_voice_prompt(self, voice_name: str) -> Dict:
        """Resolve and load adapted voice prompt cache."""
        v_key = voice_name.strip().lower()
        file_name = VOICE_MAP.get(v_key, VOICE_MAP.get(self.default_voice, "en-Carter_man.pt"))

        if file_name in self._cached_voice_prompts:
            return self._cached_voice_prompts[file_name]

        voice_file = self.voices_dir / file_name
        if not voice_file.exists():
            # Fallback to default carter
            fallback_file = self.voices_dir / "en-Carter_man.pt"
            if not fallback_file.exists():
                raise FileNotFoundError(f"Voice preset file not found: {voice_file}")
            voice_file = fallback_file
            file_name = "en-Carter_man.pt"

        logger.info(f"[VIBEVOICE-VOICE] Loading and adapting voice prompt '{voice_file.name}'...")
        prompt = torch.load(voice_file, map_location=self.device, weights_only=False)

        # Adapt past_key_values caches for transformers v5
        for sub_k in ["lm", "tts_lm", "neg_lm", "neg_tts_lm"]:
            if sub_k in prompt and hasattr(prompt[sub_k], "past_key_values"):
                prompt[sub_k].past_key_values = _adapt_cache_to_transformers5(prompt[sub_k].past_key_values)

        self._cached_voice_prompts[file_name] = prompt
        return prompt

    def _synthesize_sync(
        self,
        spoken_text: str,
        voice_name: str,
    ) -> Tuple[str, float, float]:
        """Synchronous speech synthesis forward pass.

        Returns:
            Tuple[audio_base64, duration_seconds, latency_ms]
        """
        t0 = time.perf_counter()

        cached_prompt = self._get_voice_prompt(voice_name)

        inputs = self.processor.process_input_with_cached_prompt(
            text=spoken_text,
            cached_prompt=cached_prompt,
            padding=True,
            return_tensors="pt",
            return_attention_mask=True,
        )

        for k, v in inputs.items():
            if torch.is_tensor(v):
                inputs[k] = v.to(self.device)

        # 7.5 acoustic tokens per second, speaking rate ~2.5 words/sec -> ~3 tokens/word + margin
        word_count = len(spoken_text.split())
        est_tokens = max(30, min(250, int(word_count * 4) + 15))

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=est_tokens,
                cfg_scale=1.5,
                tokenizer=self.processor.tokenizer,
                generation_config={"do_sample": False},
                verbose=False,
                all_prefilled_outputs=cached_prompt,
            )

        audio_tensor = outputs.speech_outputs[0]
        sample_rate = 24000

        # Convert to 16-bit PCM WAV in memory
        audio_np = audio_tensor.cpu().float().numpy()
        if audio_np.ndim > 1:
            audio_np = audio_np.squeeze()

        max_val = np.max(np.abs(audio_np))
        if max_val > 0:
            audio_np = audio_np / max_val
        audio_pcm16 = (audio_np * 32767).astype(np.int16)

        wav_buf = io.BytesIO()
        wavfile.write(wav_buf, sample_rate, audio_pcm16)
        raw_wav_bytes = wav_buf.getvalue()

        audio_b64 = base64.b64encode(raw_wav_bytes).decode("ascii")
        duration_sec = max(0.5, round(len(audio_pcm16) / float(sample_rate), 2))
        latency_ms = (time.perf_counter() - t0) * 1000

        return audio_b64, duration_sec, round(latency_ms, 1)

    async def synthesize_speech(
        self,
        raw_markdown: str,
        voice_name: str = "carter",
        language: str = "auto",
    ) -> Tuple[str, float, str, float]:
        """Synthesize clinical text into speech audio offline using local VibeVoice.

        Returns:
            Tuple[audio_base64, duration_seconds, spoken_text, latency_ms]
        """
        # 1. Deterministic clinical text cleanup
        spoken_text = SpokenMedicalFilter.clean_for_speech(raw_markdown, language=language)
        if not spoken_text:
            return "", 0.0, "", 0.0

        # Dosage invariance check
        is_safe, missing_elements = SpokenMedicalFilter.verify_dosage_invariance(raw_markdown, spoken_text)
        if not is_safe:
            logger.warning(
                f"[VIBEVOICE-SAFETY] Possible dosage/numerical discrepancy: {missing_elements}"
            )

        # 2. Ensure model loaded
        await self.ensure_loaded()

        # 3. Run inference in worker thread to avoid blocking event loop
        audio_b64, duration_sec, latency_ms = await asyncio.to_thread(
            self._synthesize_sync, spoken_text, voice_name
        )

        logger.info(
            f"[VIBEVOICE-SUCCESS] Generated {duration_sec}s offline audio "
            f"({len(audio_b64)} chars b64) via voice='{voice_name}' in {latency_ms:.1f}ms."
        )

        return audio_b64, duration_sec, spoken_text, latency_ms


# Global Singleton Client Instance
vibevoice_tts_instance = VibeVoiceTTSClient()
