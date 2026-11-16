/**
 * Specialized Ground Flight Surgeon Rescue AI Co-Pilot
 * Engineered strictly for the MONITOR / Houston Flight Surgeon
 * to provide rapid emergency medical guidance and life-saving protocols.
 */

class FlightSurgeonRescueBot {
  constructor(feedContainerId, inputFieldId, formId) {
    this.feed = document.getElementById(feedContainerId);
    this.input = document.getElementById(inputFieldId);
    this.form = document.getElementById(formId);
    this.isAwaitingResponse = false;

    this.initEventListeners();
    this.seedWelcomeCard();
  }

  initEventListeners() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitQuery(this.input.value);
      });
    }

    // Quick Action Prompt Chips
    document.querySelectorAll('.ai-quick-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-query') || chip.textContent;
        this.submitQuery(query);
      });
    });
  }

  seedWelcomeCard() {
    if (!this.feed) return;
    const isAr = document.documentElement.getAttribute('dir') === 'rtl';

    const welcomeHtml = `
      <div class="ai-response-card">
        <div class="ai-card-title-row">
          <h4>${isAr ? 'مساعد الإنقاذ السريري لمركز التحكم (هيوستن)' : 'Houston Flight Surgeon Rescue Co-Pilot'}</h4>
          <span class="hud-code">NASA STD-3001</span>
        </div>
        <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.45;">
          ${isAr
            ? 'مرحباً دكتور. أنا مساعدك الطبي الذكي المخصص لمركز التحكم الأرضي في هيوستن. أراقب القياسات الحيوية اللحظية لرائد الفضاء وجاهز لتزويدك ببروتوكولات الإنقاذ السريعة، الجرعات الدوائية الطارئة، وضبط منظومة دعم الحياة (ECLSS) فور حدوث أي طارئ.'
            : 'Welcome Flight Surgeon. I am your specialized Ground Mission Rescue AI Co-Pilot. I continuously correlate astronaut live telemetry with NASA STD-3001 aerospace protocols to provide instantaneous emergency resuscitation workflows, drug dosages, and life support intervention directives.'}
        </p>
        <div class="ai-section-label">${isAr ? 'أوامر سريعة مقترحة للإنقاذ:' : 'RAPID RESCUE PLAYBOOKS:'}</div>
        <div class="ai-citations-row">
          <span>• Hypoxia Protocol</span>
          <span>• Tachycardia Intervention</span>
          <span>• EVA Heat Exhaustion</span>
          <span>• Emergency Pharmacopeia</span>
        </div>
      </div>
    `;
    this.feed.innerHTML = welcomeHtml;
  }

  async submitQuery(rawQuery) {
    const text = rawQuery.trim();
    if (!text || this.isAwaitingResponse) return;

    if (this.input) this.input.value = '';
    this.isAwaitingResponse = true;

    // Append Monitor's Query to feed
    this.appendUserMessage(text);
    this.showTypingIndicator();

    if (window.AudioSynth) {
      window.AudioSynth.playClick();
    }

    try {
      const response = await fetch('/api/v1/monitor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, include_vitals: true })
      });

      if (!response.ok) throw new Error('API server unreachable');
      const data = await response.json();

      this.removeTypingIndicator();
      this.renderAiRescueCard(data);

      if (window.AudioSynth) {
        if (data.triage_level === 'CRITICAL') {
          window.AudioSynth.playCriticalAlert();
        } else {
          window.AudioSynth.playTelemetryPing();
        }
      }
    } catch (err) {
      this.removeTypingIndicator();
      this.renderFallbackError(err.message);
    } finally {
      this.isAwaitingResponse = false;
    }
  }

  appendUserMessage(text) {
    const userMsg = document.createElement('div');
    userMsg.className = 'user-query-card';
    userMsg.innerHTML = `
      <div style="font-size: 10px; color: var(--aura-cyan); font-weight: 800; margin-bottom: 2px;">
        FLIGHT SURGEON (GROUND)
      </div>
      <div>${this.escapeHtml(text)}</div>
    `;
    this.feed.appendChild(userMsg);
    this.scrollToBottom();
  }

  showTypingIndicator() {
    const typing = document.createElement('div');
    typing.id = 'ai-typing-indicator';
    typing.style.cssText = 'font-size: 11px; color: var(--aura-violet); padding: 8px 12px; display: flex; align-items: center; gap: 8px;';
    typing.innerHTML = `
      <div class="pulse-dot" style="background: var(--aura-violet); width: 7px; height: 7px;"></div>
      <span>Houston AI Computing NASA STD-3001 Rescue Sequence...</span>
    `;
    this.feed.appendChild(typing);
    this.scrollToBottom();
  }

  removeTypingIndicator() {
    const el = document.getElementById('ai-typing-indicator');
    if (el) el.remove();
  }

  renderAiRescueCard(data) {
    const isCritical = data.triage_level === 'CRITICAL';
    const isAr = document.documentElement.getAttribute('dir') === 'rtl';
    const vitals = data.current_vitals_snapshot || {};

    const card = document.createElement('div');
    card.className = `ai-response-card ${isCritical ? 'critical' : ''}`;

    let actionsHtml = '';
    if (data.urgent_actions && data.urgent_actions.length > 0) {
      actionsHtml = `
        <div class="ai-section-label">${isAr ? 'الإجراءات السريرية الفورية للإنقاذ:' : 'IMMEDIATE CLINICAL ACTION SEQUENCE:'}</div>
        <div class="ai-action-checklist">
          ${data.urgent_actions.map((act, i) => `
            <div class="ai-action-step">
              <span class="ai-step-num">${i + 1}</span>
              <span>${this.escapeHtml(act)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    let pharmaHtml = '';
    if (data.pharmacopeia && data.pharmacopeia.length > 0) {
      pharmaHtml = `
        <div class="ai-section-label" style="color: var(--aura-pink);">${isAr ? '💊 التوجيهات الدوائية والجرعات الطارئة:' : '💊 EMERGENCY PHARMACOPEIA & DOSAGES:'}</div>
        <div class="ai-pharma-box">
          ${data.pharmacopeia.map(p => `<div>${this.escapeHtml(p)}</div>`).join('')}
        </div>
      `;
    }

    let eclssHtml = '';
    if (data.eclss_commands && data.eclss_commands.length > 0) {
      eclssHtml = `
        <div class="ai-section-label" style="color: var(--clinical-nominal);">${isAr ? '🛰️ أوامر أنظمة دعم الحياة (ECLSS):' : '🛰️ HABITAT / SUIT LIFE SUPPORT DIRECTIVES:'}</div>
        <div style="font-size: 11.5px; color: var(--text-secondary); background: rgba(98, 245, 194, 0.08); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(98, 245, 194, 0.25);">
          ${data.eclss_commands.map(cmd => `<div>• ${this.escapeHtml(cmd)}</div>`).join('')}
        </div>
      `;
    }

    let radioHtml = '';
    if (data.radio_directive) {
      radioHtml = `
        <div class="ai-section-label">${isAr ? '📡 نص الرسالة اللاسلكية للتوجيه المباشر:' : '📡 DIRECT RADIO DIRECTIVE TO TRANSMIT:'}</div>
        <div class="ai-radio-directive">
          <div class="ai-radio-directive-text" id="directive-text-${Date.now()}">"${this.escapeHtml(data.radio_directive)}"</div>
          <button class="btn-copy-radio" onclick="window.FlightSurgeonRescueBot.transmitToComms('${this.escapeHtml(data.radio_directive).replace(/'/g, "\\'")}')">
            ${isAr ? '🚀 إرسال مباشر لراديو الرائد' : '🚀 Send Direct to Astronaut Radio'}
          </button>
        </div>
      `;
    }

    let citationsHtml = '';
    if (data.citations && data.citations.length > 0) {
      citationsHtml = `
        <div class="ai-citations-row">
          ${data.citations.map(c => `<span>Ref: ${this.escapeHtml(c)}</span>`).join('')}
        </div>
      `;
    }

    card.innerHTML = `
      <div class="ai-card-title-row">
        <h4 class="${isCritical ? 'critical' : ''}">${this.escapeHtml(data.title)}</h4>
        <span class="hud-code" style="color: ${isCritical ? 'var(--clinical-critical)' : 'var(--clinical-nominal)'};">
          ${this.escapeHtml(data.triage_level)}
        </span>
      </div>

      <div class="ai-vitals-mini-bar">
        <span>HR: <strong>${vitals.hr || '--'}</strong></span>
        <span>SpO2: <strong>${vitals.spo2 || '--'}</strong></span>
        <span>BP: <strong>${vitals.bp || '--'}</strong></span>
        <span>Temp: <strong>${vitals.temp || '--'}</strong></span>
      </div>

      ${actionsHtml}
      ${pharmaHtml}
      ${eclssHtml}
      ${radioHtml}
      ${citationsHtml}
    `;

    this.feed.appendChild(card);
    this.scrollToBottom();
  }

  renderFallbackError(msg) {
    const card = document.createElement('div');
    card.className = 'ai-response-card';
    card.innerHTML = `
      <h4 style="color: var(--clinical-caution)">Telemetry Server Offline Fallback</h4>
      <p style="font-size: 12px; color: var(--text-secondary);">
        Unable to reach backend GPU endpoint (${msg}).
        Local NASA STD-3001 Emergency Protocols:
        • Hypoxia: 100% O2 via high-flow mask immediately.
        • Cardiac Overload: Stop physical exertion, recline couch, monitor 12-lead ECG.
        • Heat Stroke: Maximize LCVG suit cooling loop, hydrate with electrolyte pouch.
      </p>
    `;
    this.feed.appendChild(card);
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this.feed) {
      this.feed.scrollTop = this.feed.scrollHeight;
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  static transmitToComms(text) {
    const input = document.getElementById('ground-comms-input');
    if (input) {
      input.value = text;
      input.focus();
    }
    const form = document.getElementById('ground-comms-form');
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true }));
    }
    if (window.AudioSynth) {
      window.AudioSynth.playChirp();
    }
  }
}

window.FlightSurgeonRescueBot = FlightSurgeonRescueBot;
