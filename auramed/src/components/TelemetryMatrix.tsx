import { useEffect, useMemo, useState } from 'react';
import {
  CREW_PROFILES,
  computeCrewTelemetry,
  generateEcgWaveformPath,
  type MissionMode,
} from '../data/telemetry';
import { getWobblyBorderStyle } from '../styles/handDrawnTokens';
import {
  SketchCard,
  SquigglyConnectorSvg,
  TapeStrip,
} from './HandDrawnDecor';

const MISSION_MODES: { id: MissionMode; label: string }[] = [
  { id: 'NOMINAL', label: 'Nominal Orbit' },
  { id: 'EVA', label: 'EVA Spacewalk' },
  { id: 'SOLAR_ALERT', label: 'Solar Flare Alert' },
];

export function TelemetryMatrix() {
  const [selectedCrewId, setSelectedCrewId] = useState<string>(CREW_PROFILES[0].id);
  const [missionMode, setMissionMode] = useState<MissionMode>('NOMINAL');
  const [phase, setPhase] = useState<number>(0);

  const telemetry = useMemo(
    () => computeCrewTelemetry(selectedCrewId, missionMode),
    [selectedCrewId, missionMode]
  );

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return;
    }

    let frameId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const speed = telemetry.heartRateBpm / 180;
      setPhase((prev) => (prev + dt * speed) % 1);
      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [telemetry.heartRateBpm]);

  const ecgPath = useMemo(
    () => generateEcgWaveformPath(telemetry.heartRateBpm, phase, 720, 180, 140),
    [telemetry.heartRateBpm, phase]
  );

  const statusSymbol =
    telemetry.status === 'CRITICAL'
      ? '✖ CRITICAL'
      : telemetry.status === 'ELEVATED'
      ? '▲ ELEVATED'
      : '● NOMINAL';

  return (
    <section
      id="telemetry"
      aria-labelledby="telemetry-heading"
      className="scroll-mt-24 py-14 sm:py-20 px-4 sm:px-6 text-[#2d2d2d] dark:text-white"
    >
      <div data-gsap="reveal" className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 border-b-[3px] border-dashed border-[#2d2d2d] dark:border-[#FF4D00] pb-5 sm:pb-6 mb-6 sm:mb-8">
          <div>
            <p className="font-sans text-sm sm:text-base text-[#2d5da1] dark:text-[#FF4D00] mb-1">
              Live Crew Telemetry Simulator · Flight Deck Feed
            </p>
            <h2
              id="telemetry-heading"
              className="font-display font-bold text-3xl sm:text-4xl md:text-5xl leading-tight"
            >
              Orbital Biometrics
            </h2>
          </div>
          <p className="font-sans text-base sm:text-lg max-w-md text-[#2d2d2d]/85 dark:text-white/85 leading-relaxed">
            Inspect how AuraMed fuses continuous 500Hz cardiac ECG, EVA suit
            pressure loops, and solar particle dosimetry on one mission sheet.
          </p>
        </div>

        {/* Crew Selector + Mission Mode Switcher */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 mb-6 sm:mb-8">
          <div
            className="lg:col-span-7 flex flex-wrap gap-2 sm:gap-2.5"
            role="group"
            aria-label="Select crew member"
          >
            {CREW_PROFILES.map((member) => {
              const active = member.id === selectedCrewId;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedCrewId(member.id)}
                  aria-pressed={active}
                  style={getWobblyBorderStyle('wobblySm')}
                  className={`h-11 sm:h-12 font-sans text-sm sm:text-base px-3 sm:px-4 border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] sketch-btn cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#ff4d4d] dark:bg-[#FF4D00] text-white dark:text-black font-bold'
                      : 'bg-white dark:bg-black text-[#2d2d2d] dark:text-white hover:bg-[#fff9c4] dark:hover:bg-[#FF4D00]/20'
                  }`}
                >
                  {member.callsign} · {member.name}
                </button>
              );
            })}
          </div>

          <div
            className="lg:col-span-5 flex flex-wrap lg:justify-end gap-2 sm:gap-2.5"
            role="group"
            aria-label="Select mission phase"
          >
            {MISSION_MODES.map((m) => {
              const active = m.id === missionMode;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMissionMode(m.id)}
                  aria-pressed={active}
                  style={getWobblyBorderStyle('wobbly')}
                  className={`h-11 sm:h-12 font-sans text-sm sm:text-base px-3.5 sm:px-4 border-[3px] border-[#2d2d2d] dark:border-white sketch-btn cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#2d5da1] dark:bg-white text-white dark:text-black font-bold'
                      : 'bg-[#e5e0d8] dark:bg-black text-[#2d2d2d] dark:text-white hover:bg-[#2d5da1] hover:text-white dark:hover:bg-[#FF4D00] dark:hover:text-black'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Wobbly Sketchbook Oscilloscope + Metrics Grid */}
        <div
          style={getWobblyBorderStyle('wobblyMd')}
          className="relative border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] bg-white dark:bg-[#0c0c10] text-[#2d2d2d] dark:text-white sketch-shadow-lg p-5 sm:p-6"
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <TapeStrip />
          </div>

          {/* Top Crew Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-dashed border-[#2d2d2d]/40 dark:border-white/25">
            <div className="font-sans text-base sm:text-lg flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-display font-bold text-[#ff4d4d] dark:text-[#FF4D00]">
                {telemetry.crew.callsign}
              </span>
              <span>{telemetry.crew.name}</span>
              <span aria-hidden="true" className="opacity-50">·</span>
              <span className="opacity-80">{telemetry.crew.role}</span>
              <span aria-hidden="true" className="opacity-50">·</span>
              <span className="opacity-80">{telemetry.crew.stationZone}</span>
            </div>

            <div
              data-testid="telemetry-status"
              style={getWobblyBorderStyle('wobblyTag')}
              className={`font-sans text-base px-3.5 py-1 border-2 font-bold whitespace-nowrap self-start sm:self-auto ${
                telemetry.status === 'CRITICAL'
                  ? 'bg-[#ff4d4d] dark:bg-[#FF4D00] text-white dark:text-black border-[#2d2d2d] dark:border-white'
                  : telemetry.status === 'ELEVATED'
                  ? 'bg-[#fff9c4] dark:bg-white text-[#2d2d2d] dark:text-black border-[#2d2d2d] dark:border-white'
                  : 'bg-[#e5e0d8] dark:bg-black text-[#2d2d2d] dark:text-white border-[#2d2d2d] dark:border-white/40'
              }`}
            >
              {statusSymbol}
            </div>
          </div>

          {/* Oscilloscope + Readout Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
            {/* ECG Waveform Viewport */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3 font-sans text-base text-[#2d2d2d]/80 dark:text-white/80">
                <span>Lead-II ECG Trace · 500Hz</span>
                <span className="tabular-nums">
                  Downlink: {telemetry.downlinkLatencyMs} ms
                </span>
              </div>

              <div
                style={getWobblyBorderStyle('wobblySm')}
                className="w-full bg-[#fdfbf7] dark:bg-black border-2 border-[#2d2d2d] dark:border-white/30 p-3"
              >
                <svg
                  viewBox="0 0 720 180"
                  role="img"
                  aria-label={`Live ECG waveform at ${telemetry.heartRateBpm} beats per minute`}
                  className="w-full h-40 sm:h-48 block"
                >
                  <line x1="0" y1="45" x2="720" y2="45" stroke="currentColor" strokeOpacity="0.14" strokeDasharray="4 4" />
                  <line x1="0" y1="90" x2="720" y2="90" stroke="currentColor" strokeOpacity="0.24" strokeDasharray="4 4" />
                  <line x1="0" y1="135" x2="720" y2="135" stroke="currentColor" strokeOpacity="0.14" strokeDasharray="4 4" />
                  <line x1="180" y1="0" x2="180" y2="180" stroke="currentColor" strokeOpacity="0.14" />
                  <line x1="360" y1="0" x2="360" y2="180" stroke="currentColor" strokeOpacity="0.14" />
                  <line x1="540" y1="0" x2="540" y2="180" stroke="currentColor" strokeOpacity="0.14" />
                  <path
                    d={ecgPath}
                    fill="none"
                    stroke="#ff4d4d"
                    className="dark:stroke-[#FF4D00]"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <p className="mt-3 font-sans text-base text-[#2d5da1] dark:text-[#FF4D00]">
                {telemetry.statusNote}
              </p>
            </div>

            {/* 5 Biometric Channels */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-3.5">
              <div
                style={getWobblyBorderStyle('wobblySm')}
                className="p-3 sm:p-4 border-2 border-[#2d2d2d] dark:border-white/25 bg-[#fff9c4] dark:bg-black sm:-rotate-1"
              >
                <p className="font-sans text-xs sm:text-sm text-[#2d2d2d]/80 dark:text-white/75">
                  Heart Rate
                </p>
                <p
                  data-testid="metric-hr"
                  className="font-display font-bold text-2xl sm:text-3xl md:text-4xl tabular-nums text-[#ff4d4d] dark:text-[#FF4D00]"
                >
                  {telemetry.heartRateBpm}
                  <span className="text-xs sm:text-sm font-sans text-[#2d2d2d]/75 dark:text-white/75 ml-1">
                    bpm
                  </span>
                </p>
              </div>

              <div
                style={getWobblyBorderStyle('wobblySm')}
                className="p-3 sm:p-4 border-2 border-[#2d2d2d] dark:border-white/25 bg-[#fdfbf7] dark:bg-black sm:rotate-1"
              >
                <p className="font-sans text-xs sm:text-sm text-[#2d2d2d]/80 dark:text-white/75">
                  Blood Oxygen
                </p>
                <p
                  data-testid="metric-spo2"
                  className="font-display font-bold text-2xl sm:text-3xl md:text-4xl tabular-nums text-[#2d5da1] dark:text-white"
                >
                  {telemetry.spo2Percent.toFixed(1)}
                  <span className="text-xs sm:text-sm font-sans text-[#2d2d2d]/75 dark:text-white/75 ml-1">
                    %
                  </span>
                </p>
              </div>

              <div
                style={getWobblyBorderStyle('wobblySm')}
                className="p-3 sm:p-4 border-2 border-[#2d2d2d] dark:border-white/25 bg-[#fdfbf7] dark:bg-black sm:rotate-1"
              >
                <p className="font-sans text-xs sm:text-sm text-[#2d2d2d]/80 dark:text-white/75">
                  Suit Pressure
                </p>
                <p
                  data-testid="metric-pressure"
                  className="font-display font-bold text-2xl sm:text-3xl md:text-4xl tabular-nums text-[#2d2d2d] dark:text-white"
                >
                  {telemetry.suitPressureKpa.toFixed(1)}
                  <span className="text-xs sm:text-sm font-sans text-[#2d2d2d]/75 dark:text-white/75 ml-1">
                    kPa
                  </span>
                </p>
              </div>

              <div
                style={getWobblyBorderStyle('wobblySm')}
                className="p-3 sm:p-4 border-2 border-[#2d2d2d] dark:border-white/25 bg-[#e5e0d8] dark:bg-black sm:-rotate-1"
              >
                <p className="font-sans text-xs sm:text-sm text-[#2d2d2d]/80 dark:text-white/75">
                  Core Temp
                </p>
                <p
                  data-testid="metric-temp"
                  className="font-display font-bold text-2xl sm:text-3xl md:text-4xl tabular-nums text-[#2d2d2d] dark:text-white"
                >
                  {telemetry.coreTempC.toFixed(1)}
                  <span className="text-xs sm:text-sm font-sans text-[#2d2d2d]/75 dark:text-white/75 ml-1">
                    °C
                  </span>
                </p>
              </div>

              <div
                style={getWobblyBorderStyle('wobblySm')}
                className="col-span-2 p-3.5 sm:p-4 border-2 border-dashed border-[#2d2d2d] dark:border-[#FF4D00] bg-[#fdfbf7] dark:bg-black flex flex-wrap items-center justify-between gap-2 sm:gap-4"
              >
                <div>
                  <p className="font-sans text-xs sm:text-sm text-[#2d2d2d]/80 dark:text-white/75">
                    Solar Radiation Flux
                  </p>
                  <p
                    data-testid="metric-radiation"
                    className="font-display font-bold text-2xl sm:text-3xl tabular-nums text-[#ff4d4d] dark:text-[#FF4D00]"
                  >
                    {telemetry.radiationMsvHr.toFixed(3)}
                    <span className="text-xs sm:text-sm font-sans text-[#2d2d2d]/75 dark:text-white/75 ml-1.5">
                      mSv/hr
                    </span>
                  </p>
                </div>
                <div className="sm:text-right font-sans text-xs sm:text-sm text-[#2d2d2d]/75 dark:text-white/75">
                  <p>Limit: 0.450 mSv/hr</p>
                  <p>Silicon Telescope</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drop-Cap Mission Overview Sticky Card + Speech Bubble Testimonial */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Product Detail Sticky Card with Drop-Cap First Letter & Post-it Tag */}
          <SketchCard decoration="tape" className="p-6 md:p-8 -rotate-1 hover:rotate-0">
            <span
              style={getWobblyBorderStyle('wobblyTag')}
              className="inline-block bg-[#fff9c4] dark:bg-[#FF4D00] text-[#2d2d2d] dark:text-black border-2 border-[#2d2d2d] dark:border-white px-3 py-0.5 text-sm font-bold mb-3 -rotate-2"
            >
              Mission Notebook · Why AuraMed
            </span>
            <p className="font-sans text-lg leading-relaxed first-letter:font-display first-letter:font-bold first-letter:text-5xl first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:text-[#ff4d4d] dark:first-letter:text-[#FF4D00]">
              During orbital Earth-link loss of signal, ground flight surgeons go
              dark for up to 22 minutes at a stretch. AuraMed keeps 72 hours of
              compressed waveform memory right inside the suit collar so every
              hypoxia drift or solar particle spike triggers local rescue alerts
              immediately.
            </p>
          </SketchCard>

          {/* Speech Bubble Testimonial with Border-Triangle Tail + Overlapping Avatars */}
          <div className="relative">
            <div
              style={getWobblyBorderStyle('wobblyMd')}
              className="relative bg-[#fff9c4] dark:bg-[#18110c] text-[#2d2d2d] dark:text-white border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] p-6 md:p-8 rotate-1 sketch-shadow"
            >
              <p className="font-sans text-lg md:text-xl leading-relaxed">
                “Seeing PLSS oxygen loop delta right next to Commander Vance’s
                dry-electrode ECG saved us four critical minutes during EVA-14
                antenna repair.”
              </p>

              {/* Speech bubble geometric tail */}
              <div
                aria-hidden="true"
                className="absolute -bottom-5 left-12 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[20px] border-t-[#2d2d2d] dark:border-t-[#FF4D00]"
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-3.5 left-[50px] w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[17px] border-t-[#fff9c4] dark:border-t-[#18110c]"
              />
            </div>

            {/* Crew Overlapping Avatar Circles (-space-x-4) */}
            <div className="mt-7 ml-2 sm:ml-6 flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex -space-x-3 sm:-space-x-4 shrink-0">
                {['EV', 'MC', 'AP'].map((initials, idx) => (
                  <span
                    key={initials}
                    style={getWobblyBorderStyle('wobblyCircle')}
                    className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center font-display font-bold text-xs sm:text-sm border-2 border-[#2d2d2d] dark:border-[#FF4D00] ${
                      idx === 0
                        ? 'bg-[#ff4d4d] text-white'
                        : idx === 1
                        ? 'bg-[#2d5da1] text-white'
                        : 'bg-white dark:bg-black text-[#2d2d2d] dark:text-white'
                    }`}
                  >
                    {initials}
                  </span>
                ))}
              </div>
              <div className="font-sans text-sm sm:text-base">
                <p className="font-bold leading-tight">Dr. Henrik Lindqvist</p>
                <p className="text-xs sm:text-sm text-[#2d2d2d]/75 dark:text-white/75">
                  Lead Flight Surgeon · Expedition 74 Orbital Crew
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works / Protocols Row (#protocols) with Squiggly Connecting SVG */}
        <div id="protocols" className="scroll-mt-24 mt-14 sm:mt-16 relative">
          <div className="mb-6 sm:mb-8">
            <p className="font-sans text-sm sm:text-base text-[#2d5da1] dark:text-[#FF4D00]">
              How It Works · Autonomous Flight Triage
            </p>
            <h3 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl">
              Three Steps Between Orbit &amp; Safety
            </h3>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <SquigglyConnectorSvg className="hidden md:block absolute top-8 left-12 right-12 h-10 text-[#2d5da1]/55 dark:text-[#FF4D00]/55 z-0 pointer-events-none" />

            <SketchCard
              decoration="tack"
              className="p-6 bg-[#fff9c4] dark:bg-[#0c0c10] -rotate-1 hover:rotate-0 relative z-10"
            >
              <span
                data-gsap="protocol-card"
                style={getWobblyBorderStyle('wobblyCircle')}
                className="relative z-10 inline-flex items-center justify-center w-11 h-11 bg-[#ff4d4d] dark:bg-[#FF4D00] text-white dark:text-black font-display font-bold text-xl border-2 border-[#2d2d2d] dark:border-white mb-4"
              >
                01
              </span>
              <h4 className="font-display font-bold text-2xl mb-2">
                Zero Blackout Blindness
              </h4>
              <p className="font-sans text-base leading-relaxed text-[#2d2d2d]/85 dark:text-white/85">
                Onboard flight-deck inference buffers 72 hours of raw telemetry
                and escalates hypoxia or arrhythmia alerts locally during orbital
                loss of signal.
              </p>
            </SketchCard>

            <SketchCard
              decoration="tack"
              className="p-6 bg-white dark:bg-[#0c0c10] rotate-1 hover:rotate-0 relative z-10"
            >
              <span
                data-gsap="protocol-card"
                style={getWobblyBorderStyle('wobblyCircle')}
                className="relative z-10 inline-flex items-center justify-center w-11 h-11 bg-[#2d5da1] dark:bg-[#FF4D00] text-white dark:text-black font-display font-bold text-xl border-2 border-[#2d2d2d] dark:border-white mb-4"
              >
                02
              </span>
              <h4 className="font-display font-bold text-2xl mb-2">
                PLSS to Biomed Lock
              </h4>
              <p className="font-sans text-base leading-relaxed text-[#2d2d2d]/85 dark:text-white/85">
                Correlates oxygen scrubbers, suit kPa drops, and core thermal
                load directly against astronaut metabolic exertion during 8-hour
                EVA rotations.
              </p>
            </SketchCard>

            <SketchCard
              decoration="tack"
              className="p-6 bg-[#e5e0d8] dark:bg-[#0c0c10] -rotate-1 hover:rotate-0 relative z-10"
            >
              <span
                data-gsap="protocol-card"
                style={getWobblyBorderStyle('wobblyCircle')}
                className="relative z-10 inline-flex items-center justify-center w-11 h-11 bg-[#ff4d4d] dark:bg-[#FF4D00] text-white dark:text-black font-display font-bold text-xl border-2 border-[#2d2d2d] dark:border-white mb-4"
              >
                03
              </span>
              <h4 className="font-display font-bold text-2xl mb-2">
                Storm Shelter Trigger
              </h4>
              <p className="font-sans text-base leading-relaxed text-[#2d2d2d]/85 dark:text-white/85">
                Active helmet and torso dosimeters stream particle energy
                spectra to trigger crew shelter alerts 14 minutes before peak
                proton arrival.
              </p>
            </SketchCard>
          </div>
        </div>
      </div>
    </section>
  );
}
