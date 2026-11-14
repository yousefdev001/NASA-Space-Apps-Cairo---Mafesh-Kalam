/**
 * AuraMed Live Voice Session Engine (SpecKit 002-live-voice-mode)
 * 
 * Features:
 * 1. Hands-free continuous 16kHz Linear PCM capture via Web Audio API.
 * 2. Ephemeral-token WebSocket streaming to Google Gemini Live Transcribe (gemini-3.5-transcribe-live).
 * 3. Real-time interim subtitles (<150ms latency).
 * 4. Configurable Silence Debounce Timer (1.5s - 2.0s) to allow natural pauses before turn finalization.
 * 5. Direct submission to existing clinical copilot (POST /v1/chat).
 * 6. High-fidelity TTS speech generation (gemini-3.8-flash-tts) and Web Audio playback.
 * 7. Instant Barge-in interruption (<50ms audio stop on user voice activity).
 * 8. Real-time animated audio waveform on HTML5 canvas.
 */

class VoiceSessionManager {
    constructor(options = {}) {
        this.astronautId = options.astronautId || 'ASTRO-01';
        this.voicePreference = options.voicePreference || 'Kore';
        this.silenceTimeoutMs = options.silenceTimeoutMs || 500; // 0.5s pause window before turn commit
        this.autoSubmitToChat = options.autoSubmitToChat !== false; // Whether to auto-post to /v1/chat and play TTS
        this.getVitals = typeof options.getVitals === 'function' ? options.getVitals : null;
        this.getHistory = typeof options.getHistory === 'function' ? options.getHistory : (() => this.recentChatHistory);
        this.onHistoryUpdate = typeof options.onHistoryUpdate === 'function' ? options.onHistoryUpdate : ((role, content) => {
            this.recentChatHistory.push({ role, content });
        });
        this.baseUrl = (options.baseUrl || '').replace(/\/+$/, '');
        this.playbackStartTime = 0;
        this.bargeInCounter = 0;
        this.lastUserVoiceTime = 0;
        this.lastRealSpeechTime = 0;
        this.isCommitting = false;
        
        // State
        this.state = 'IDLE'; // IDLE, CONNECTING, LISTENING, TRANSCRIBING, PROCESSING, SPEAKING, INTERRUPTED, ERROR, ENDED
        this.sessionId = null;
        this.ws = null;
        this.isMuted = false;
        this.activeLanguage = 'ar';
        
        // Audio
        this.audioContext = null;
        this.micStream = null;
        this.micSource = null;
        this.processor = null;
        this.analyser = null;
        this.currentAudioSource = null; // currently playing TTS audio
        this.ttsAbortController = null;
        
        // Turn Buffering & Silence Debouncing (FR-026)
        this.silenceTimer = null;
        this.currentTurnBuffer = '';
        this.recentChatHistory = [];
        
        // Waveform Animation
        this.canvas = options.canvas || null;
        this.canvasCtx = this.canvas ? this.canvas.getContext('2d') : null;
        this.animationFrameId = null;
        this.sttEngine = options.sttEngine || 'gemini_live';

        // UI Callback Hooks
        this.onStateChange = options.onStateChange || (() => {});
        this.onInterimTranscript = options.onInterimTranscript || (() => {});
        this.onFinalTranscript = options.onFinalTranscript || (() => {});
        this.onChatMessage = options.onChatMessage || (() => {});
        this.onError = options.onError || (() => {});
    }

    setState(newState) {
        console.log(`[VoiceSession] State transition: ${this.state} -> ${newState}`);
        this.state = newState;
        this.onStateChange(this.state);
    }

    async start() {
        if (this.state !== 'IDLE' && this.state !== 'ENDED' && this.state !== 'ERROR') {
            console.warn('[VoiceSession] Session already running');
            return;
        }

        this.setState('CONNECTING');
        try {
            // 0. If STT engine is web_speech or in forced Offline mode, engage Local Speech Recognition directly
            const activeMode = (typeof window !== 'undefined' && window.localStorage?.getItem('auramed_operating_mode')) || 'auto';
            if (this.sttEngine === 'web_speech' || activeMode === 'offline') {
                console.log(`[VoiceSession] Engaging local browser speech recognition (sttEngine=${this.sttEngine}, mode=${activeMode})...`);
                this.sessionId = 'VSES-SPEECH-' + Date.now();
                await this.initMicrophone();
                if (this.startBrowserSpeechRecognition()) {
                    if (this.canvas) this.startWaveformVisualizer();
                    return;
                }
            }

            // 1. Request Ephemeral Token from AuraMed Backend
            const res = await fetch(`${this.baseUrl}/api/v1/voice/session/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': 'auramed-secret-key-2026'
                },
                body: JSON.stringify({
                    astronaut_id: this.astronautId,
                    voice_preference: this.voicePreference,
                    enable_smart_transcribe: true,
                    silence_timeout_ms: this.silenceTimeoutMs
                })
            });

            if (!res.ok) {
                throw new Error(`Failed to initialize session: HTTP ${res.status}`);
            }

            const sessionData = await res.json();
            this.sessionId = sessionData.session_id;
            this.silenceTimeoutMs = sessionData.silence_timeout_ms || this.silenceTimeoutMs;
            this.relayEndpoint = sessionData.relay_endpoint;

            // 2. Initialize Microphone & Web Audio Context
            await this.initMicrophone();

            // 3. Connect WebSocket to Google Gemini Live Transcribe
            this.connectWebSocket(sessionData.ws_endpoint, sessionData.custom_vocabulary, false);

            // 4. Start Canvas Waveform Renderer
            if (this.canvas) {
                this.startWaveformVisualizer();
            }

        } catch (err) {
            console.error('[VoiceSession] Start failed:', err);
            this.setState('ERROR');
            this.onError(err.message);
            this.stop();
        }
    }

    async initMicrophone() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('المتصفح لا يدعم الوصول للمايكروفون عبر اتصال غير مشفر. يرجى فتح الموقع عبر http://localhost:8000 أو تفعيل إذن المايك.');
        }

        try {
            this.micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
        } catch (err) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                throw new Error('تم رفض إذن الوصول إلى المايكروفون. يرجى تفعيل إذن المايك من شريط عنوان المتصفح.');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                throw new Error('لم يتم العثور على مايكروفون متصل بجهازك.');
            }
            throw err;
        }

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.micSource = this.audioContext.createMediaStreamSource(this.micStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 512;
        this.micSource.connect(this.analyser);

        // 16kHz PCM Processor (ScriptProcessor buffer size 2048 ~= 128ms chunks)
        this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);
        this.processor.onaudioprocess = (e) => this.handleAudioProcess(e);
        this.analyser.connect(this.processor);
        this.processor.connect(this.audioContext.destination);
    }

    downsampleTo16k(inputData, inputSampleRate) {
        if (!inputSampleRate || inputSampleRate === 16000) {
            return inputData;
        }
        const sampleRateRatio = inputSampleRate / 16000;
        const newLength = Math.round(inputData.length / sampleRateRatio);
        const result = new Float32Array(newLength);
        let offsetResult = 0;
        let offsetInput = 0;
        while (offsetResult < result.length) {
            const nextOffsetInput = Math.round((offsetResult + 1) * sampleRateRatio);
            let accum = 0;
            let count = 0;
            for (let i = offsetInput; i < nextOffsetInput && i < inputData.length; i++) {
                accum += inputData[i];
                count++;
            }
            result[offsetResult] = count > 0 ? (accum / count) : inputData[offsetInput];
            offsetResult++;
            offsetInput = nextOffsetInput;
        }
        return result;
    }

    handleAudioProcess(e) {
        // MUST NOT send audio chunks until Gemini Live WebSocket confirms setupComplete!
        if (this.isMuted || !this.ws || this.ws.readyState !== WebSocket.OPEN || !this.hasReceivedSetup) {
            return;
        }

        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate RMS audio energy for Barge-in Interruption Detection
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);

        // NOTE: Background noise (ambient noise / fan hum / breathing) does NOT reset the speech turn timer.
        // Turn timers are strictly anchored to real transcribed speech to avoid blocking replies.

        // NATURAL BARGE-IN: If user speaks with strong intent while assistant is playing audio or processing
        if (this.state === 'SPEAKING' || this.state === 'PROCESSING') {
            const elapsedSincePlay = Date.now() - (this.playbackStartTime || 0);
            if (elapsedSincePlay > 350 && rms > 0.08) {
                this.bargeInCounter = (this.bargeInCounter || 0) + 1;
                if (this.bargeInCounter >= 3) {
                    console.log('[VoiceSession] Sustained user barge-in detected! Halting assistant immediately.');
                    this.interruptAudioPlayback();
                    this.bargeInCounter = 0;
                    this.currentTurnBuffer = '';
                }
            } else {
                this.bargeInCounter = 0;
            }
        }

        // Downsample input from native microphone rate (e.g. 48kHz) to pure 16kHz for Gemini
        const nativeRate = this.audioContext ? this.audioContext.sampleRate : 48000;
        const downsampledData = this.downsampleTo16k(inputData, nativeRate);

        // Convert Float32 to 16-bit Signed PCM Little-Endian
        const pcm16 = new Int16Array(downsampledData.length);
        for (let i = 0; i < downsampledData.length; i++) {
            const s = Math.max(-1, Math.min(1, downsampledData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert PCM buffer to Base64
        const uint8 = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < uint8.length; i++) {
            binary += String.fromCharCode(uint8[i]);
        }
        const base64Audio = btoa(binary);

        // Stream audio chunk to Gemini Live API strictly as 16000 Hz
        const realtimeMessage = {
            realtimeInput: {
                mediaChunks: [
                    {
                        mimeType: 'audio/pcm;rate=16000',
                        data: base64Audio
                    }
                ]
            }
        };

        try {
            this.ws.send(JSON.stringify(realtimeMessage));
        } catch (err) {
            console.warn('[VoiceSession] Error sending audio chunk:', err);
        }
    }

    connectWebSocket(wsEndpoint, customVocabulary = [], isFallback = false) {
        console.log(`[VoiceSession] Connecting WebSocket (fallback=${isFallback}) to: ${wsEndpoint.substring(0, 70)}...`);
        this.hasReceivedSetup = false;
        this.ws = new WebSocket(wsEndpoint);

        this.ws.onopen = () => {
            console.log('[VoiceSession] WebSocket connected. Sending initial setup payload...');
            const setupPayload = {
                setup: {
                    model: 'models/gemini-3.5-transcribe-live',
                    generationConfig: {
                        responseModalities: ['TEXT']
                    },
                    inputAudioTranscription: {
                        languageCodes: [], // Automatic language detection (Arabic & English)
                        mode: 'SMART',
                        customVocabulary: customVocabulary
                    }
                }
            };
            this.ws.send(JSON.stringify(setupPayload));
            this.setState('LISTENING');
        };

        this.ws.onmessage = async (event) => {
            try {
                let text = event.data;
                if (event.data instanceof Blob) {
                    text = await event.data.text();
                } else if (event.data instanceof ArrayBuffer) {
                    text = new TextDecoder().decode(event.data);
                }
                const response = JSON.parse(text);
                if (response.setupComplete) {
                    console.log('[VoiceSession] SetupComplete confirmed by Gemini Live API.');
                    this.hasReceivedSetup = true;
                    this.setState('LISTENING');
                    return;
                }
                this.handleServerMessage(response);
            } catch (err) {
                console.error('[VoiceSession] Error parsing server message:', err);
            }
        };

        this.ws.onerror = (err) => {
            console.error('[VoiceSession] WebSocket error:', err);
        };

        this.ws.onclose = (event) => {
            console.log('[VoiceSession] WebSocket closed:', event.code, event.reason);
            // If direct Google WebSocket closed prematurely without setupComplete, attempt backend relay fallback
            if (!this.hasReceivedSetup && !isFallback && this.relayEndpoint) {
                const wsBase = this.baseUrl.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
                const relayUrl = `${wsBase}${this.relayEndpoint}`;
                console.warn(`[VoiceSession] Direct WebSocket closed (${event.code}). Auto-failing over to backend relay: ${relayUrl}`);
                this.connectWebSocket(relayUrl, customVocabulary, true);
                return;
            }

            // Automatic Graceful Fallback to Browser Native Speech Recognition
            if (!this.hasReceivedSetup && this.startBrowserSpeechRecognition()) {
                console.warn('[VoiceSession] WebSocket closed. Seamlessly engaged local browser speech recognition fallback.');
                return;
            }

            if (this.state !== 'ENDED') {
                this.setState('ENDED');
                if (event.code !== 1000 && event.code !== 1005) {
                    this.onError(`انقطع الاتصال الصوتي (رمز: ${event.code} ${event.reason || ''})`);
                }
            }
        };
    }

    handleServerMessage(response) {
        const serverContent = response.serverContent;
        if (!serverContent) return;

        // 1. Interim Hypothesis (Live Preview as user speaks)
        if (serverContent.interimInputTranscription && serverContent.interimInputTranscription.text) {
            const interimText = serverContent.interimInputTranscription.text.trim();
            if (interimText) {
                // If user speaks while assistant is talking, trigger instant barge-in!
                if (this.state === 'SPEAKING' || this.state === 'PROCESSING') {
                    console.log('[VoiceSession] Interim speech received during assistant turn. Triggering barge-in!');
                    this.interruptAudioPlayback();
                    this.currentTurnBuffer = '';
                }
                this.lastRealSpeechTime = Date.now();
                if (this.silenceTimer) {
                    clearTimeout(this.silenceTimer);
                    this.silenceTimer = null;
                }
                if (this.state !== 'TRANSCRIBING') {
                    this.setState('TRANSCRIBING');
                }
                const previewText = this.currentTurnBuffer ? `${this.currentTurnBuffer} ${interimText}` : interimText;
                this.onInterimTranscript(previewText);
            }
        }

        // 2. Finalized Segment (accumulate into turn buffer)
        if (serverContent.inputTranscription && serverContent.inputTranscription.text) {
            const finalText = serverContent.inputTranscription.text.trim();
            if (finalText) {
                if (this.state === 'SPEAKING' || this.state === 'PROCESSING') {
                    this.interruptAudioPlayback();
                    this.currentTurnBuffer = '';
                }
                this.handleSpeechPause(finalText);
            }
        }
    }

    /**
     * FR-026: Configurable Speech Pause / Silence Debounce Timer
     * Anchored to REAL transcribed speech so background noise/fans are completely ignored.
     * Includes intelligent deduplication to prevent utterances from repeating.
     */
    handleSpeechPause(finalSegmentText) {
        if (!finalSegmentText || !finalSegmentText.trim()) return;
        const clean = finalSegmentText.trim();

        // If this text was already committed in the last 4 seconds, ignore it
        if (this.lastCommittedText && (clean === this.lastCommittedText || this.lastCommittedText.includes(clean)) && (Date.now() - (this.lastCommitTime || 0) < 4000)) {
            console.log(`[VoiceSession] Ignored already committed echo: "${clean}"`);
            return;
        }

        // Smart concatenation & deduplication
        if (this.currentTurnBuffer) {
            if (this.currentTurnBuffer === clean || this.currentTurnBuffer.endsWith(clean)) {
                // Exact duplicate segment, do nothing
            } else if (clean.startsWith(this.currentTurnBuffer)) {
                // Recognizer revised the utterance with fuller text; upgrade buffer!
                this.currentTurnBuffer = clean;
            } else if (this.currentTurnBuffer.includes(clean)) {
                // Already captured in buffer
            } else {
                // Distinct new segment in the same utterance, append cleanly
                this.currentTurnBuffer += ' ' + clean;
            }
        } else {
            this.currentTurnBuffer = clean;
        }

        this.onInterimTranscript(this.currentTurnBuffer);
        this.lastRealSpeechTime = Date.now();

        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
        }

        console.log(`[VoiceSession] Real speech segment buffered: "${clean}". Buffer: "${this.currentTurnBuffer}". Silence window: ${this.silenceTimeoutMs}ms`);

        const checkAndCommit = () => {
            const timeSinceSpeech = Date.now() - (this.lastRealSpeechTime || 0);
            if (timeSinceSpeech < this.silenceTimeoutMs) {
                // User spoke recently; wait remaining silence window
                const remaining = this.silenceTimeoutMs - timeSinceSpeech;
                this.silenceTimer = setTimeout(checkAndCommit, Math.max(50, remaining));
                return;
            }

            // Silence confirmed for full duration: commit as single turn!
            const completeTurnText = (this.currentTurnBuffer || '').trim();
            this.currentTurnBuffer = '';
            this.silenceTimer = null;

            if (completeTurnText.length > 0) {
                console.log(`[VoiceSession] Silence verified (${timeSinceSpeech}ms). Committing single turn: "${completeTurnText}"`);
                this.commitFinalTurn(completeTurnText);
            }
        };

        this.silenceTimer = setTimeout(checkAndCommit, this.silenceTimeoutMs);
    }

    executeTurn(userText) {
        this.handleSpeechPause(userText);
    }

    async commitFinalTurn(userText) {
        if (!userText || userText.trim().length === 0) return;
        const cleanText = userText.trim();

        // Strict deduplication: never submit duplicate or substring within 4 seconds
        if (this.lastCommittedText && (cleanText === this.lastCommittedText || this.lastCommittedText.includes(cleanText)) && (Date.now() - (this.lastCommitTime || 0) < 4000)) {
            console.log(`[VoiceSession] Suppressed duplicate turn: "${cleanText}"`);
            return;
        }

        if (this.isCommitting) {
            console.warn('[VoiceSession] Already committing a turn. Queuing into turn buffer.');
            if (!this.lastCommittedText || !cleanText.includes(this.lastCommittedText)) {
                this.currentTurnBuffer = (this.currentTurnBuffer ? this.currentTurnBuffer + ' ' : '') + cleanText;
            }
            return;
        }
        this.isCommitting = true;
        this.lastCommittedText = cleanText;
        this.lastCommitTime = Date.now();
        this.currentTurnBuffer = '';

        this.onFinalTranscript(cleanText);

        if (!this.autoSubmitToChat) {
            this.setState('LISTENING');
            this.isCommitting = false;
            return;
        }

        this.setState('PROCESSING');

        // Capture previous conversation history BEFORE adding current turn
        const previousHistory = (this.getHistory ? this.getHistory() : this.recentChatHistory).slice(-8);

        // Record current user utterance in history
        if (this.onHistoryUpdate) {
            this.onHistoryUpdate('user', userText);
        } else {
            this.recentChatHistory.push({ role: 'user', content: userText });
        }

        try {
            this.ttsAbortController = new AbortController();
            const currentVitals = typeof this.getVitals === 'function' ? this.getVitals() : null;
            const chatPayload = {
                query: userText,
                astronaut_id: this.astronautId,
                history: previousHistory
            };
            if (currentVitals) {
                chatPayload.vitals = currentVitals;
            }

            const chatRes = await fetch(`${this.baseUrl}/v1/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': 'auramed-secret-key-2026'
                },
                signal: this.ttsAbortController.signal,
                body: JSON.stringify(chatPayload)
            });

            if (!chatRes.ok) {
                throw new Error(`Chat API error: HTTP ${chatRes.status}`);
            }

            const chatData = await chatRes.json();
            const assistantSummary = chatData.summary || '';

            // Record assistant response in history
            if (this.onHistoryUpdate) {
                this.onHistoryUpdate('assistant', assistantSummary);
            } else {
                this.recentChatHistory.push({ role: 'assistant', content: assistantSummary });
            }

            this.onChatMessage(chatData);

            // Synthesize and play audio aloud
            await this.synthesizeAndPlayTTS(assistantSummary);

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('[VoiceSession] Chat/TTS generation aborted due to barge-in.');
            } else {
                console.error('[VoiceSession] Error executing medical copilot turn:', err);
                this.setState('ERROR');
                this.onError(err.message);
            }
        } finally {
            this.isCommitting = false;
        }
    }

    async synthesizeAndPlayTTS(summaryMarkdown) {
        if (!summaryMarkdown || this.state === 'INTERRUPTED') return;

        try {
            const activeMode = (typeof window !== 'undefined' && window.localStorage?.getItem('auramed_operating_mode')) || 'auto';
            const ttsRes = await fetch(`${this.baseUrl}/api/v1/voice/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': 'auramed-secret-key-2026'
                },
                signal: this.ttsAbortController ? this.ttsAbortController.signal : null,
                body: JSON.stringify({
                    session_id: this.sessionId,
                    raw_markdown: summaryMarkdown,
                    voice_name: this.voicePreference,
                    language: 'auto',
                    mode: activeMode
                })
            });

            if (!ttsRes.ok) {
                throw new Error(`TTS synthesis error: HTTP ${ttsRes.status}`);
            }

            const ttsData = await ttsRes.json();
            // Validate that we received non-empty audio payload (> 200 bytes)
            if (ttsData.audio_base64 && ttsData.audio_base64.length > 200 && this.state !== 'INTERRUPTED') {
                const mime = ttsData.audio_mime_type || 'audio/mp3';
                await this.playAudioBuffer(ttsData.audio_base64, mime, summaryMarkdown);
            } else if (this.state !== 'INTERRUPTED') {
                console.log('[VoiceSession] Backend returned fallback; engaging browser Web Speech API');
                await this.speakWithWebSpeech(summaryMarkdown);
            }

        } catch (err) {
            if (err.name !== 'AbortError') {
                console.warn('[VoiceSession] TTS server error, engaging browser Web Speech fallback:', err);
                if (this.state !== 'INTERRUPTED') {
                    await this.speakWithWebSpeech(summaryMarkdown);
                }
            } else {
                this.setState('LISTENING');
            }
        }
    }

    async playAudioBuffer(audioBase64, mimeType = 'audio/mp3', fallbackText = '') {
        try {
            // Sniff magic bytes from Base64 header to guarantee correct MIME type
            let resolvedMime = mimeType;
            if (audioBase64.startsWith('//Nkx') || audioBase64.startsWith('SUQz') || audioBase64.startsWith('//+')) {
                resolvedMime = 'audio/mp3';
            } else if (audioBase64.startsWith('UklGR')) {
                resolvedMime = 'audio/wav';
            } else if (audioBase64.startsWith('OggS')) {
                resolvedMime = 'audio/ogg';
            } else if (audioBase64.startsWith('GkXf')) {
                resolvedMime = 'audio/webm';
            }

            this.playbackStartTime = Date.now();
            this.bargeInCounter = 0;
            this.setState('SPEAKING');

            // Strategy 1: Play via Unlocked Web Audio Context (immune to autoplay restrictions)
            if (this.audioContext) {
                try {
                    if (this.audioContext.state === 'suspended') {
                        await this.audioContext.resume();
                    }
                    const binaryString = atob(audioBase64);
                    const len = binaryString.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const arrayBuffer = bytes.buffer.slice(0);

                    const audioBuffer = await new Promise((res, rej) => {
                        this.audioContext.decodeAudioData(arrayBuffer, res, rej);
                    });

                    const source = this.audioContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(this.audioContext.destination);
                    if (this.analyser) {
                        source.connect(this.analyser);
                    }
                    this.currentAudioSource = source;

                    return new Promise((resolve) => {
                        source.onended = () => {
                            this.currentAudioSource = null;
                            if (this.state === 'SPEAKING') {
                                this.setState('LISTENING');
                            }
                            resolve();
                        };
                        source.start(0);
                    });
                } catch (webAudioErr) {
                    console.warn('[VoiceSession] WebAudio decode failed, falling back to HTML5 Audio:', webAudioErr);
                }
            }

            // Strategy 2: Fallback to HTML5 Audio element
            const audio = new Audio(`data:${resolvedMime};base64,${audioBase64}`);
            this.currentAudioElement = audio;

            return new Promise((resolve) => {
                audio.onended = () => {
                    this.currentAudioElement = null;
                    if (this.state === 'SPEAKING') {
                        this.setState('LISTENING');
                    }
                    resolve();
                };
                audio.onerror = async (err) => {
                    console.warn('[VoiceSession] HTML5 Audio error, falling back to Web Speech:', err);
                    this.currentAudioElement = null;
                    await this.speakWithWebSpeech(fallbackText || this.recentChatHistory[this.recentChatHistory.length - 1]?.content || '');
                    resolve();
                };
                audio.play().catch(async (e) => {
                    console.warn('[VoiceSession] HTML5 Audio autoplay blocked, falling back to Web Speech:', e);
                    this.currentAudioElement = null;
                    await this.speakWithWebSpeech(fallbackText || this.recentChatHistory[this.recentChatHistory.length - 1]?.content || '');
                    resolve();
                });
            });

        } catch (err) {
            console.error('[VoiceSession] Error playing audio:', err);
            await this.speakWithWebSpeech(fallbackText || this.recentChatHistory[this.recentChatHistory.length - 1]?.content || '');
        }
    }

    speakWithWebSpeech(text) {
        return new Promise((resolve) => {
            if (!('speechSynthesis' in window)) {
                this.setState('LISTENING');
                return resolve();
            }
            try {
                if (window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                }
                window.speechSynthesis.cancel();
            } catch (e) {}

            // Clean text of markdown, chunk citations, and URLs
            const clean = text
                .replace(/###+/g, '')
                .replace(/\*\*/g, '')
                .replace(/`[^`]+`/g, '')
                .replace(/\[(?:CHUNK|chunk)-[^\]]+\]/gi, '')
                .replace(/https?:\/\/\S+/g, '')
                .replace(/[#*_~]/g, '')
                .trim();
            if (!clean) {
                this.setState('LISTENING');
                return resolve();
            }
            const utterance = new SpeechSynthesisUtterance(clean);
            const arChars = (clean.match(/[\u0600-\u06FF]/g) || []).length;
            const enChars = (clean.match(/[a-zA-Z]/g) || []).length;
            const isArabic = arChars >= enChars;
            utterance.lang = isArabic ? 'ar-SA' : 'en-US';
            utterance.rate = 1.0;

            const voices = window.speechSynthesis.getVoices();
            if (isArabic) {
                const arVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('ar'));
                if (arVoice) utterance.voice = arVoice;
            } else {
                const enVoice = voices.find(v => v.lang && (v.lang.toLowerCase().startsWith('en-us') || v.lang.toLowerCase().startsWith('en')));
                if (enVoice) utterance.voice = enVoice;
            }

            this.setState('SPEAKING');
            utterance.onend = () => {
                if (this.state === 'SPEAKING') {
                    this.setState('LISTENING');
                }
                resolve();
            };
            utterance.onerror = () => {
                if (this.state === 'SPEAKING') {
                    this.setState('LISTENING');
                }
                resolve();
            };
            window.speechSynthesis.speak(utterance);
        });
    }

    /**
     * Natural Barge-in Interruption (FR-013)
     */
    interruptAudioPlayback() {
        if (this.currentAudioElement) {
            try {
                this.currentAudioElement.pause();
            } catch (e) {}
            this.currentAudioElement = null;
        }

        if ('speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel();
            } catch (e) {}
        }

        if (this.currentAudioSource) {
            try {
                this.currentAudioSource.stop(0);
                this.currentAudioSource.disconnect();
            } catch (e) {}
            this.currentAudioSource = null;
        }

        if (this.ttsAbortController) {
            this.ttsAbortController.abort();
            this.ttsAbortController = null;
        }

        this.setState('INTERRUPTED');
        setTimeout(() => {
            if (this.state === 'INTERRUPTED') {
                this.setState('LISTENING');
            }
        }, 100);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        console.log(`[VoiceSession] Microphone ${this.isMuted ? 'Muted' : 'Unmuted'}`);
        return this.isMuted;
    }

    startBrowserSpeechRecognition() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            console.warn('[VoiceSession] Browser Web Speech API not supported.');
            return false;
        }

        try {
            console.log('[VoiceSession] Initializing Browser Speech Recognition fallback...');
            this.recognition = new SpeechRec();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'ar-SA';

            this.recognition.onstart = () => {
                this.hasReceivedSetup = true;
                this.setState('LISTENING');
            };

            this.recognition.onresult = (event) => {
                let interim = '';
                let final = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final += event.results[i][0].transcript;
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }
                if (interim) {
                    this.onInterimTranscript(interim);
                }
                if (final && final.trim().length > 1) {
                    this.executeTurn(final.trim());
                }
            };

            this.recognition.onerror = (err) => {
                console.warn('[VoiceSession] Browser speech recognition event error:', err);
                if (err.error === 'not-allowed') {
                    this.onError('تم رفض إذن المايك في المتصفح.');
                }
            };

            this.recognition.onend = () => {
                if (!this.isStopping && (this.state === 'LISTENING' || this.state === 'TRANSCRIBING')) {
                    try { this.recognition.start(); } catch (e) {}
                }
            };

            this.recognition.start();
            return true;
        } catch (err) {
            console.warn('[VoiceSession] Failed to start browser speech recognition:', err);
            return false;
        }
    }

    stop() {
        if (this.isStopping) return;
        this.isStopping = true;
        console.log('[VoiceSession] Stopping voice session cleanly...');
        this.setState('ENDED');

        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
        }

        this.interruptAudioPlayback();

        if (this.recognition) {
            this.recognition.onend = null;
            this.recognition.onerror = null;
            this.recognition.onresult = null;
            try { this.recognition.stop(); } catch (e) {}
            this.recognition = null;
        }

        if (this.ws) {
            this.ws.onclose = null;
            this.ws.onerror = null;
            this.ws.onmessage = null;
            try { this.ws.close(1000, 'Normal Closure'); } catch (e) {}
            this.ws = null;
        }

        if (this.processor) {
            try { this.processor.disconnect(); } catch (e) {}
            this.processor = null;
        }

        if (this.micSource) {
            try { this.micSource.disconnect(); } catch (e) {}
            this.micSource = null;
        }

        if (this.micStream) {
            try {
                this.micStream.getTracks().forEach(track => {
                    track.stop();
                    track.enabled = false;
                });
            } catch (e) {}
            this.micStream = null;
        }

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        if (this.canvasCtx && this.canvas) {
            this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            try { this.audioContext.close(); } catch (e) {}
            this.audioContext = null;
        }

        this.isStopping = false;
    }

    startWaveformVisualizer() {
        if (!this.canvas || !this.analyser) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            this.animationFrameId = requestAnimationFrame(draw);
            this.analyser.getByteTimeDomainData(dataArray);

            const width = this.canvas.width;
            const height = this.canvas.height;
            this.canvasCtx.clearRect(0, 0, width, height);

            this.canvasCtx.lineWidth = 2.5;
            
            // Dynamic Waveform Color by State
            if (this.state === 'SPEAKING') {
                this.canvasCtx.strokeStyle = '#06b6d4'; // Cyan for assistant speech
            } else if (this.state === 'TRANSCRIBING') {
                this.canvasCtx.strokeStyle = '#10b981'; // Emerald for user speech
            } else if (this.state === 'PROCESSING') {
                this.canvasCtx.strokeStyle = '#f59e0b'; // Amber for copilot reasoning
            } else {
                this.canvasCtx.strokeStyle = '#3b82f6'; // Blue ambient
            }

            this.canvasCtx.beginPath();
            const sliceWidth = width * 1.0 / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * height / 2;

                if (i === 0) {
                    this.canvasCtx.moveTo(x, y);
                } else {
                    this.canvasCtx.lineTo(x, y);
                }
                x += sliceWidth;
            }

            this.canvasCtx.lineTo(width, height / 2);
            this.canvasCtx.stroke();
        };

        draw();
    }
}

window.VoiceSessionManager = VoiceSessionManager;
