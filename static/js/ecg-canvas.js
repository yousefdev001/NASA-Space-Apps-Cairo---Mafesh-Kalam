/**
 * Real-Time ECG Cardiac Waveform & Phosphor HUD Canvas
 * AuraMed Ground Station - Houston Flight Surgeon Console
 */

class EcgWaveformRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.bpm = 74;
    this.severity = 'NOMINAL'; // NOMINAL, CAUTION, CRITICAL
    this.sweepX = 0;
    this.dataPoints = [];
    this.maxPoints = 400;
    this.phase = 0;
    this.lastFrameTime = performance.now();
    this.isRunning = true;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initPoints();
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * (window.devicePixelRatio || 1);
    this.canvas.height = rect.height * (window.devicePixelRatio || 1);
    this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
    this.initPoints();
  }

  initPoints() {
    this.maxPoints = Math.floor(this.displayWidth);
    this.dataPoints = new Array(this.maxPoints).fill(this.displayHeight / 2);
    this.sweepX = 0;
  }

  setHeartRate(bpm, severity = 'NOMINAL') {
    this.bpm = Math.max(35, Math.min(220, bpm));
    this.severity = severity;
  }

  /**
   * Generates a physiological P-Q-R-S-T cardiac waveform value
   * based on normalized phase [0.0 to 1.0] of a single heartbeat cycle.
   */
  getCardiacWaveform(p) {
    const mid = this.displayHeight / 2;
    const amp = this.displayHeight * 0.42;

    // Normalizing heartbeat cycle [0, 1]
    if (p < 0.12) {
      // Baseline resting isoelectric segment
      return mid;
    } else if (p >= 0.12 && p < 0.22) {
      // P-Wave (Atrial Depolarization)
      const t = (p - 0.12) / 0.10;
      return mid - Math.sin(t * Math.PI) * (amp * 0.16);
    } else if (p >= 0.22 && p < 0.27) {
      // PR Segment
      return mid;
    } else if (p >= 0.27 && p < 0.31) {
      // Q-Wave (Septal Depolarization - brief dip)
      const t = (p - 0.27) / 0.04;
      return mid + Math.sin(t * Math.PI) * (amp * 0.12);
    } else if (p >= 0.31 && p < 0.38) {
      // R-Wave Peak (Ventricular Depolarization - high voltage spike)
      const t = (p - 0.31) / 0.07;
      if (t < 0.5) {
        return mid - (t / 0.5) * amp;
      } else {
        return (mid - amp) + ((t - 0.5) / 0.5) * (amp * 1.35);
      }
    } else if (p >= 0.38 && p < 0.44) {
      // S-Wave (Ventricular Repolarization dip)
      const t = (p - 0.38) / 0.06;
      return mid + (1 - t) * (amp * 0.35);
    } else if (p >= 0.44 && p < 0.56) {
      // ST Segment
      return mid;
    } else if (p >= 0.56 && p < 0.74) {
      // T-Wave (Ventricular Repolarization)
      const t = (p - 0.56) / 0.18;
      return mid - Math.sin(t * Math.PI) * (amp * 0.28);
    } else {
      // Isoelectric recovery until next beat
      return mid;
    }
  }

  animate() {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    // Heart frequency in Hertz (beats per second)
    const bps = this.bpm / 60;
    this.phase = (this.phase + (dt * bps)) % 1.0;

    // Speed of horizontal sweep in pixels per second
    const sweepSpeed = (this.displayWidth * bps) / 1.5;
    const step = Math.max(1, Math.floor(sweepSpeed * dt));

    for (let i = 0; i < step; i++) {
      const currentY = this.getCardiacWaveform(this.phase);
      // Subtle natural biological noise
      const jitter = (Math.random() - 0.5) * 1.5;
      this.dataPoints[this.sweepX] = currentY + jitter;

      this.sweepX = (this.sweepX + 1) % this.maxPoints;
    }

    this.draw();
    requestAnimationFrame(() => this.animate());
  }

  draw() {
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Medical High-Tech Background Grid
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgba(40, 67, 106, 0.25)';
    ctx.beginPath();
    const gridSize = 24;
    for (let x = 0; x < w; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // 2. Select Waveform Color based on Clinical Severity
    let strokeColor = '#42E8FF'; // auraCyan
    let glowColor = 'rgba(66, 232, 255, 0.45)';

    if (this.severity === 'CRITICAL') {
      strokeColor = '#FF5C70'; // clinicalCritical
      glowColor = 'rgba(255, 92, 112, 0.6)';
    } else if (this.severity === 'CAUTION') {
      strokeColor = '#FFD166'; // clinicalCaution
      glowColor = 'rgba(255, 209, 102, 0.5)';
    }

    // 3. Draw Continuous Sweeping Cardiac Waveform
    ctx.save();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = strokeColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    let started = false;

    // Erase cursor gap (gap of 22px in front of the sweep head)
    const gap = 24;

    for (let x = 0; x < this.maxPoints; x++) {
      // Skip drawing inside the gap ahead of sweep head
      const distFromSweep = (x - this.sweepX + this.maxPoints) % this.maxPoints;
      if (distFromSweep < gap) {
        started = false;
        continue;
      }

      const y = this.dataPoints[x] || h / 2;
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.restore();

    // 4. Draw Phosphor Sweep Cursor Head
    ctx.save();
    const headX = (this.sweepX - 1 + this.maxPoints) % this.maxPoints;
    const headY = this.dataPoints[headX] || h / 2;

    // Glowing Cursor Dot
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(headX, headY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Vertical Scanner Sweep Line
    const sweepGrad = ctx.createLinearGradient(0, 0, 0, h);
    sweepGrad.addColorStop(0, 'rgba(66, 232, 255, 0.0)');
    sweepGrad.addColorStop(0.5, 'rgba(66, 232, 255, 0.35)');
    sweepGrad.addColorStop(1, 'rgba(66, 232, 255, 0.0)');
    ctx.strokeStyle = sweepGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(headX, 0);
    ctx.lineTo(headX, h);
    ctx.stroke();
    ctx.restore();
  }
}

// Global instance
window.EcgWaveformRenderer = EcgWaveformRenderer;
