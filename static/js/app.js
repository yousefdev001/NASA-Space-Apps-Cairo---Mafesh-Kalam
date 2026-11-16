/**
 * AuraMed Ground Station — Houston Flight Surgeon Mission Control App
 * WebSocket Telemetry Receiver, Medical HUD Synthesizer, and UI Orchestrator
 */

// ============================================================================
// Web Audio Synthesizer (Zero External Audio Files Required)
// ============================================================================
class WebAudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('auramed_muted') === 'true';
    this.updateMuteButtonUI();
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('auramed_muted', this.isMuted ? 'true' : 'false');
    this.updateMuteButtonUI();
    if (!this.isMuted) {
      this.playClick();
    }
  }

  updateMuteButtonUI() {
    const btn = document.getElementById('sound-toggle-btn');
    if (btn) {
      btn.innerHTML = this.isMuted ? '🔇' : '🔊';
      btn.title = this.isMuted ? 'Unmute Sound FX' : 'Mute Sound FX';
    }
  }

  playClick() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (_) {}
  }

  playTelemetryPing() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(980, this.ctx.currentTime);
      osc.frequency.setValueAtTime(1320, this.ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.14);
    } catch (_) {}
  }

  playCriticalAlert() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [0, 0.16].forEach((offset) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now + offset);
        osc.frequency.linearRampToValueAtTime(620, now + offset + 0.12);
        gain.gain.setValueAtTime(0.08, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
      });
    } catch (_) {}
  }

  playChirp() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (_) {}
  }
}

window.AudioSynth = new WebAudioSynthesizer();

// ============================================================================
// Translations & Localization (Arabic / English)
// ============================================================================
const TRANSLATIONS = {
  ar: {
    dashboard_title: "مركز القيادة والطب الفضائي — هيوستن",
    brand_sub: "محطة مراقبة المؤشرات الحيوية لطاقم أوريون • NASA STD-3001",
    dsn_status: "اتصال شبكة الفضاء السحيق DSN اسمي",
    live_label: "بث حي",
    last_contact: "آخر إشارة:",
    packets_label: "الحزم المستقبلة:",
    astronaut_label: "رائد الفضاء",
    mission_label: "المهمة",
    vehicle_label: "المركبة",
    mission_day: "يوم المهمة",
    health_score: "مؤشر الصحة العام",
    active_anomaly: "تنبيه طارئ نشط",
    ecg_canvas_title: "تخطيط القلب المباشر (ECG)",
    ecg_lead_tag: "مسار II • بث مستمر",
    organs_title: "أطلس الأعضاء الحيوية",
    ground_comms_title: "قناة الاتصال المباشر مع الرائد (Ground Comms)",
    comms_placeholder: "أرسل توجيهاً سريرياً أو رسالة صوتية لرائد الفضاء...",
    btn_transmit: "إرسال للأوريون",
    sim_title: "محاكاة الحالات الطارئة للاختبار:",
    sim_nominal: "طبيعي مستقر",
    sim_hypoxia: "🚨 نقص الأكسجين (Hypoxia)",
    sim_cardiac: "⚡ تسارع القلب (Cardiac)",
    sim_heat: "🔥 إجهاد حراري (Heat Stress)",
    sim_hypothermia: "❄️ انخفاض الحرارة (Hypothermia)",
    sim_hypercapnia: "💨 غاز CO2 سام (Hypercapnia)",
    ai_title: "مساعد الإنقاذ السريري لمركز التحكم",
    ai_sub: "ذكاء اصطناعي سريري مخصص لإنقاذ الرائد فوراً",
    ai_placeholder: "اسأل عن بروتوكولات الإنقاذ، الجرعات، وإجراءات الطوارئ...",
    ai_btn_send: "استشارة",
    lang_btn: "English",
  },
  en: {
    dashboard_title: "AuraMed Mission Control — Houston",
    brand_sub: "Orion Crew Biometric Telemetry & Flight Surgeon Console • NASA STD-3001",
    dsn_status: "DSN TELEMETRY LINK NOMINAL",
    live_label: "LIVE TELEMETRY",
    last_contact: "Last Ping:",
    packets_label: "Packets Recv:",
    astronaut_label: "Astronaut",
    mission_label: "Mission",
    vehicle_label: "Spacecraft",
    mission_day: "Mission Day",
    health_score: "Overall Health Score",
    active_anomaly: "ACTIVE CLINICAL ALERT",
    ecg_canvas_title: "REAL-TIME CARDIAC ECG WAVEFORM",
    ecg_lead_tag: "LEAD II • CONTINUOUS",
    organs_title: "ORGAN EFFICIENCY ATLAS",
    ground_comms_title: "HOUSTON TO ORION TWO-WAY TACTICAL COMMS",
    comms_placeholder: "Transmit clinical orders or mission message to astronaut...",
    btn_transmit: "TRANSMIT",
    sim_title: "EMERGENCY SIMULATION INJECTION:",
    sim_nominal: "Nominal Baseline",
    sim_hypoxia: "🚨 Acute Hypoxia",
    sim_cardiac: "⚡ Tachycardia",
    sim_heat: "🔥 EVA Heat Stroke",
    sim_hypothermia: "❄️ Hypothermia",
    sim_hypercapnia: "💨 CO2 Breakthrough",
    ai_title: "Flight Surgeon Rescue Co-Pilot",
    ai_sub: "Dedicated Houston Emergency Rescue Advisor",
    ai_placeholder: "Ask emergency rescue protocol, drug doses, ECLSS orders...",
    ai_btn_send: "ADVISE",
    lang_btn: "العربية",
  }
};

// ============================================================================
// Main Application Controller
// ============================================================================
class GroundMissionApp {
  constructor() {
    this.currentLang = localStorage.getItem('auramed_lang') || 'ar';
    this.state = {
      astronaut_id: 'ASTRO-8492',
      vitals: {},
      organs: {},
      overall_status: 'NOMINAL',
      overall_score: 96,
      active_alert: null,
      last_updated: null,
      packet_count: 0,
      comms_messages: [],
    };

    this.ecgRenderer = null;
    this.rescueBot = null;
    this.ws = null;
    this.reconnectTimer = null;
    this.lastPacketTimestamp = Date.now();

    this.init();
  }

  init() {
    this.applyLanguage(this.currentLang);

    // Initialize ECG Renderer
    this.ecgRenderer = new window.EcgWaveformRenderer('ecg-canvas');

    // Initialize Rescue Bot
    this.rescueBot = new window.FlightSurgeonRescueBot(
      'ai-chat-feed',
      'ai-input-field',
      'ai-chat-form'
    );

    // Event Listeners
    this.initUIEvents();

    // Start WebSocket Stream
    this.connectWebSocket();

    // Freshness Watcher Timer
    setInterval(() => this.updateFreshnessTimer(), 1000);
  }

  initUIEvents() {
    // Sound Toggle Button
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        window.AudioSynth.toggleMute();
      });
    }

    // Language Toggle Button
    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        this.currentLang = this.currentLang === 'ar' ? 'en' : 'ar';
        localStorage.setItem('auramed_lang', this.currentLang);
        this.applyLanguage(this.currentLang);
        if (this.rescueBot) this.rescueBot.seedWelcomeCard();
        window.AudioSynth.playClick();
      });
    }

    // Ground Comms Transmit Form
    const commsForm = document.getElementById('ground-comms-form');
    if (commsForm) {
      commsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('ground-comms-input');
        const text = input ? input.value.trim() : '';
        if (!text) return;

        input.value = '';
        window.AudioSynth.playChirp();

        try {
          const res = await fetch('/api/v1/ground-comms/send-to-astronaut', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, is_urgent: this.state.overall_status === 'CRITICAL' })
          });
          if (res.ok) {
            const data = await res.json();
            this.appendCommsMessage(data.message);
          }
        } catch (err) {
          console.error('Failed to transmit comms:', err);
        }
      });
    }

    // Scenario Injection Chips
    document.querySelectorAll('.btn-sim-chip').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const scenario = btn.getAttribute('data-scenario') || 'nominal';
        window.AudioSynth.playClick();
        try {
          const res = await fetch('/api/v1/telemetry/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenario })
          });
          if (res.ok) {
            const data = await res.json();
            // Trigger automatic rescue analysis from the AI Co-Pilot if critical!
            if (data.severity === 'CRITICAL' && this.rescueBot) {
              setTimeout(() => {
                this.rescueBot.submitQuery(`Emergency Alert Injected: ${data.label}. What is the immediate survival protocol?`);
              }, 400);
            }
          }
        } catch (e) {
          console.error('Simulation error:', e);
        }
      });
    });
  }

  applyLanguage(lang) {
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);

    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) {
        el.textContent = t[key];
      }
    });

    document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
      const key = el.getAttribute('data-i18n-ph');
      if (t[key]) {
        el.setAttribute('placeholder', t[key]);
      }
    });

    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      langBtn.textContent = t.lang_btn;
    }
  }

  connectWebSocket() {
    clearTimeout(this.reconnectTimer);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Telemetry WebSocket connected.');
      this.updateConnectionBadge(true);
      window.AudioSynth.playTelemetryPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = jsonParseSafe(event.data);
        if (!data) return;

        this.lastPacketTimestamp = Date.now();

        if (data.type === 'INITIAL_STATE') {
          this.handleStateUpdate(data.payload);
          this.renderCommsHistory(data.payload.comms_messages || []);
        } else if (data.type === 'TELEMETRY_UPDATE' || data.type === 'TELEMETRY_JITTER') {
          this.handleStateUpdate(data.payload);
        } else if (data.type === 'NEW_COMMS_MESSAGE') {
          this.appendCommsMessage(data.payload);
          window.AudioSynth.playChirp();
        }
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    this.ws.onclose = () => {
      console.warn('Telemetry WebSocket disconnected. Reconnecting in 3s...');
      this.updateConnectionBadge(false);
      this.reconnectTimer = setTimeout(() => this.connectWebSocket(), 3000);
    };

    this.ws.onerror = () => {
      this.updateConnectionBadge(false);
    };
  }

  updateConnectionBadge(isOnline) {
    const dot = document.getElementById('pulse-beacon-dot');
    const text = document.getElementById('pulse-beacon-text');
    if (dot && text) {
      if (isOnline) {
        dot.className = `pulse-dot ${this.state.overall_status.toLowerCase()}`;
        text.textContent = TRANSLATIONS[this.currentLang].live_label;
        text.style.color = this.state.overall_status === 'CRITICAL' ? 'var(--clinical-critical)' : 'var(--clinical-nominal)';
      } else {
        dot.className = 'pulse-dot caution';
        text.textContent = 'LINK SEARCHING';
        text.style.color = 'var(--clinical-caution)';
      }
    }
  }

  handleStateUpdate(payload) {
    if (payload.vitals) {
      this.state.vitals = { ...this.state.vitals, ...payload.vitals };
      this.updateMetricsUI(this.state.vitals);

      // Sync ECG Canvas with live heart rate
      if (this.ecgRenderer) {
        const hr = this.state.vitals.heart_rate_bpm || 74;
        this.ecgRenderer.setHeartRate(hr, payload.overall_status || this.state.overall_status);
      }
    }

    if (payload.organs) {
      this.state.organs = payload.organs;
      this.updateOrgansUI(payload.organs);
    }

    if (payload.overall_status) {
      const prevStatus = this.state.overall_status;
      this.state.overall_status = payload.overall_status;

      if (payload.overall_status === 'CRITICAL' && prevStatus !== 'CRITICAL') {
        window.AudioSynth.playCriticalAlert();
      }
    }

    if (payload.overall_score !== undefined) {
      this.state.overall_score = payload.overall_score;
      this.updateOverallScoreUI(payload.overall_score, this.state.overall_status);
    }

    if (payload.packet_count !== undefined) {
      this.state.packet_count = payload.packet_count;
      const countEl = document.getElementById('packets-recv-val');
      if (countEl) countEl.textContent = payload.packet_count;
    }

    if (payload.active_alert !== undefined) {
      this.state.active_alert = payload.active_alert;
      this.renderClinicalAlert(payload.active_alert);
    }

    this.updateConnectionBadge(true);
  }

  updateMetricsUI(vitals) {
    const hr = Math.round(vitals.heart_rate_bpm || 74);
    const spo2 = (vitals.spo2_percent || 98.2).toFixed(1);
    const sys = Math.round(vitals.systolic_bp_mmhg || 118);
    const dia = Math.round(vitals.diastolic_bp_mmhg || 76);
    const temp = (vitals.body_temperature_c || 36.8).toFixed(1);
    const resp = Math.round(vitals.respiratory_rate_bpm || 16);
    const hrv = Math.round(vitals.hrv_rmssd_ms || 48);

    setElText('val-heart-rate', hr);
    setElText('val-spo2', spo2);
    setElText('val-blood-pressure', `${sys}/${dia}`);
    setElText('val-temperature', temp);
    setElText('val-respiration', resp);
    setElText('val-hrv', hrv);

    // Update chips & alert card classes
    this.updateMetricChip('chip-heart-rate', hr > 130 || hr < 48 ? 'critical' : (hr > 100 ? 'caution' : 'nominal'), hr > 130 || hr < 48 ? 'CRITICAL' : (hr > 100 ? 'ELEVATED' : 'NOMINAL'));
    this.updateMetricChip('chip-spo2', spo2 < 90 ? 'critical' : (spo2 < 95 ? 'caution' : 'nominal'), spo2 < 90 ? 'HYPOXIA' : (spo2 < 95 ? 'CAUTION' : 'NOMINAL'));
    this.updateMetricChip('chip-blood-pressure', sys > 150 ? 'critical' : (sys > 135 ? 'caution' : 'nominal'), sys > 150 ? 'HIGH' : 'NOMINAL');
    this.updateMetricChip('chip-temperature', temp > 38.3 || temp < 35.2 ? 'critical' : (temp > 37.6 ? 'caution' : 'NOMINAL'), temp > 38.3 ? 'FEVER' : (temp < 35.2 ? 'COLD' : 'NOMINAL'));
  }

  updateMetricChip(id, statusClass, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `metric-status-chip ${statusClass}`;
    el.textContent = text;

    const card = el.closest('.corner-bracket-card');
    if (card) {
      card.classList.remove('caution', 'critical');
      if (statusClass === 'critical') card.classList.add('critical');
      else if (statusClass === 'caution') card.classList.add('caution');
    }
  }

  updateOverallScoreUI(score, status) {
    const el = document.getElementById('overall-score-val');
    if (el) {
      el.textContent = `${score}%`;
      el.style.color = status === 'CRITICAL' ? 'var(--clinical-critical)' : (status === 'CAUTION' ? 'var(--clinical-caution)' : 'var(--clinical-nominal)');
    }
  }

  updateOrgansUI(organs) {
    for (const [key, data] of Object.entries(organs)) {
      const scoreEl = document.getElementById(`organ-${key}-score`);
      const metricEl = document.getElementById(`organ-${key}-metric`);
      if (scoreEl) {
        scoreEl.textContent = `${data.score}%`;
        scoreEl.className = `organ-score ${data.status.toLowerCase()}`;
      }
      if (metricEl) {
        metricEl.textContent = data.metric || '';
      }
    }
  }

  renderClinicalAlert(alert) {
    const container = document.getElementById('clinical-alert-dock');
    if (!container) return;

    if (!alert) {
      container.innerHTML = '';
      return;
    }

    const isAr = this.currentLang === 'ar';
    const stepsHtml = (alert.action_steps || []).map((step, idx) => `
      <div class="alert-step-item" id="step-row-${idx}">
        <input type="checkbox" class="alert-step-check" id="chk-step-${idx}" onchange="window.GroundApp.toggleStep(${idx})">
        <label for="chk-step-${idx}" class="alert-step-text">${escapeHtml(step.action || step)}</label>
        ${step.ref_label ? `<span class="alert-step-ref">${step.ref_label}</span>` : ''}
      </div>
    `).join('');

    container.innerHTML = `
      <div class="clinical-alert-card">
        <div class="alert-icon-box">
          <svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
        </div>
        <div class="alert-body">
          <div class="alert-header-row">
            <h3>${escapeHtml(alert.title)}</h3>
            <span class="alert-badge">${alert.severity}</span>
          </div>
          <div class="alert-summary">${escapeHtml(alert.summary)}</div>
          <div class="alert-steps-list">
            ${stepsHtml}
          </div>
        </div>
      </div>
    `;
  }

  toggleStep(idx) {
    const row = document.getElementById(`step-row-${idx}`);
    const chk = document.getElementById(`chk-step-${idx}`);
    if (row && chk) {
      row.classList.toggle('checked', chk.checked);
      window.AudioSynth.playClick();
    }
  }

  renderCommsHistory(messages) {
    const box = document.getElementById('comms-history-box');
    if (!box) return;
    box.innerHTML = '';
    messages.forEach((msg) => this.appendCommsMessage(msg, false));
    box.scrollTop = box.scrollHeight;
  }

  appendCommsMessage(msg, autoScroll = true) {
    const box = document.getElementById('comms-history-box');
    if (!box) return;

    const isGround = msg.sender === 'ground';
    const item = document.createElement('div');
    item.className = `comms-msg-item ${isGround ? 'ground' : 'astronaut'}`;
    item.innerHTML = `
      <div class="comms-msg-top">
        <span class="comms-msg-sender">${escapeHtml(msg.sender_title || (isGround ? 'Houston Flight Surgeon' : 'Commander Orion'))}</span>
        <span class="comms-msg-time">${escapeHtml(msg.timestamp || 'Just now')}</span>
      </div>
      <div>${escapeHtml(msg.text)}</div>
    `;

    box.appendChild(item);
    if (autoScroll) {
      box.scrollTop = box.scrollHeight;
    }
  }

  updateFreshnessTimer() {
    const pingEl = document.getElementById('last-ping-val');
    if (!pingEl) return;

    const diffSec = Math.floor((Date.now() - this.lastPacketTimestamp) / 1000);
    if (diffSec <= 1) {
      pingEl.textContent = this.currentLang === 'ar' ? 'الآن' : 'just now';
    } else {
      pingEl.textContent = `${diffSec}s ago`;
    }
  }
}

// Helper utilities
function setElText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function jsonParseSafe(str) {
  try {
    return JSON.parse(str);
  } catch (_) {
    return null;
  }
}

// Bootstrap on window load
window.addEventListener('DOMContentLoaded', () => {
  window.GroundApp = new GroundMissionApp();
});
