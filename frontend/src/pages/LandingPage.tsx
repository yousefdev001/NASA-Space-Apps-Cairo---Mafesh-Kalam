import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  ArrowRight,
  ChevronRight,
  Zap,
  Heart,
  Cpu,
  Stethoscope,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Wrench,
  Shield,
  Video,
  Sparkles,
  CheckCircle2,
  X,
  Play,
} from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import {
  Tape,
  PushPin,
  SquiggleUnderline,
  DashedArrow,
  SketchBadge,
  getWobblyStyle,
} from '../components/sketchbook';
import { OrganTelemetryGrid } from '../components/telemetry/OrganTelemetryGrid';
import { EcgCanvas } from '../components/charts/EcgCanvas';

export const LandingPage: React.FC = () => {
  const { mode, setMode } = useThemeStore();
  const isPaper = mode === 'paper';
  const isDark = mode === 'dark';
  const isCyber = mode === 'cyber';
  const isSketch = isPaper || isDark;

  const [activeCategory, setActiveCategory] = useState<'all' | 'medical' | 'ai-comms' | 'resilience'>('all');
  const [articleAudience, setArticleAudience] = useState<'kids' | 'adults'>('adults');
  const [isFilmModalOpen, setIsFilmModalOpen] = useState(false);

  // Hero stat cards from ro2ya-tech.com
  const heroStats = [
    {
      value: '2 min',
      label: '6-Vital Self Check-In',
      tilt: '-rotate-2',
      bg: isDark ? 'bg-[#0c0c10]' : isPaper ? 'bg-[#fff9c4]' : 'bg-[#0B132B]/80',
      radius: 'wobblyCircle' as const,
    },
    {
      value: '14 Organs',
      label: '2.4× Interactive Atlas',
      tilt: 'rotate-2',
      bg: isDark ? 'bg-[#0c0c10]' : isPaper ? 'bg-white' : 'bg-[#0B132B]/80',
      radius: 'wobblySm' as const,
    },
    {
      value: '>20 min',
      label: 'Mars Comms Delay Safe',
      tilt: '-rotate-1',
      bg: isDark ? 'bg-[#16161a]' : isPaper ? 'bg-[#e5e0d8]' : 'bg-[#0B132B]/80',
      radius: 'wobblyAlt' as const,
    },
    {
      value: '100 Ranks',
      label: 'Health Quests & Shields',
      tilt: 'rotate-1',
      bg: isDark ? 'bg-[#0c0c10]' : isPaper ? 'bg-[#fff9c4]' : 'bg-[#0B132B]/80',
      radius: 'wobblyCircle' as const,
    },
  ];

  // Inside the AuraMed App features from ro2ya-tech.com
  const capabilities = [
    {
      id: 'two-min-checkin',
      index: '01',
      category: 'medical',
      badge: '2-Min Self-Assessment',
      title: '6-Vital Check-In & Live ECG',
      subtitle: 'Heart Rate · BP · Glucose · Temp · Sleep · Mood',
      description:
        'Astronauts log six baseline metrics in under two minutes while continuous 500Hz ECG, SpO2, respiration, and HRV RMSSD stream to mission health scorecards.',
      highlights: [
        'Real-time holographic ECG canvas trace',
        '10-packet telemetry batching & trend arrows',
        'Instant Nominal, Warning, and Critical status',
      ],
      metricLabel: 'Check-In Time',
      metricValue: '2 min',
      tilt: 'sm:-rotate-1',
    },
    {
      id: 'interactive-body-atlas',
      index: '02',
      category: 'medical',
      badge: '2.4x Focal Zoom',
      title: 'Interactive 2D Organ Atlas',
      subtitle: '14 Physiological Systems · Green / Yellow / Red',
      description:
        'Tap any hotspot across 14 organs—heart, lungs, brain, kidneys, liver, spine—to zoom 2.4× and inspect NASA STD-3001 limits with step-by-step triage.',
      highlights: [
        'Answers: Why it changed & what to do now',
        'Clear trigger: When to call Flight Surgeon',
        'Color-coded live status across every organ',
      ],
      metricLabel: 'Monitored Organs',
      metricValue: '14 Systems',
      tilt: 'sm:rotate-1',
    },
    {
      id: 'clinical-decision-engine',
      index: '03',
      category: 'ai-comms',
      badge: 'NASA STD-3001 Rules',
      title: 'AI Health Score & Checklists',
      subtitle: 'Multi-Risk Assessment · Guided Care Steps',
      description:
        'Combines astronaut vitals into a holistic mission readiness percentage and turns clinical findings into interactive medical checklists astronauts can mark off.',
      highlights: [
        'Actionable treatment & countermeasure steps',
        'Deep-assess mode for multi-organ risk trends',
        'Interactive checklist completion tracking',
      ],
      metricLabel: 'Readiness Index',
      metricValue: '0–100%',
      tilt: 'sm:-rotate-1',
    },
    {
      id: 'offline-rag-houston-comms',
      index: '04',
      category: 'ai-comms',
      badge: '>20m Blackout Safe',
      title: 'Edge RAG Advisor & Ground Link',
      subtitle: 'Offline NASA Fallback · Voice STT · Queue Sync',
      description:
        'Built for deep-space 20+ minute signal delays. Runs Artemis clinical RAG guidance offline with hands-free Speech-to-Text and syncs encrypted packets once linked.',
      highlights: [
        'Citations from NASA STD-3001 & Artemis manuals',
        'Speech-to-Text dictation for EVA gloves',
        'Automatic offline queue sync with Houston',
      ],
      metricLabel: 'Delay Tolerance',
      metricValue: '20+ min',
      tilt: 'sm:rotate-1',
    },
    {
      id: 'health-quests-cognitive',
      index: '05',
      category: 'resilience',
      badge: 'Zero Penalty Loop',
      title: 'Health Quests & Cognitive Games',
      subtitle: '100 Rank Tiers · Space Reflex · Alien Memory',
      description:
        'Protects organ shields through daily exercise and check-in quests from Cadet to Commander across 100 ranks—rewarding consistent care, never punishing illness.',
      highlights: [
        'Space Reflex: millisecond neuro-motor trainer',
        'Alien Memory: 4×4 spatial recall across 100 levels',
        '10 rank tiers (Bronze to Mythic Legend XP)',
      ],
      metricLabel: 'Progression Ladder',
      metricValue: '100 Ranks',
      tilt: 'sm:-rotate-1',
    },
    {
      id: 'earth-memories-aurabot',
      index: '06',
      category: 'resilience',
      badge: 'Crew Psychology',
      title: 'Earth Capsule & AuraBot Companion',
      subtitle: 'Isolation Defense · Return Journal · Voice Prompts',
      description:
        'Combats deep-space isolation with the Life Style on Earth memory journal and Return Capsule, supported by AuraBot’s draggable hydration, O2, and exercise reminders.',
      highlights: [
        'Searchable journal for family, places & moods',
        'Return Capsule unlocked on atmospheric re-entry',
        'Draggable AuraBot floating chat & tips',
      ],
      metricLabel: 'Crew Morale',
      metricValue: 'Protected',
      tilt: 'sm:rotate-1',
    },
  ];

  const filteredCapabilities =
    activeCategory === 'all'
      ? capabilities
      : capabilities.filter((c) => c.category === activeCategory);

  const kidsArticles = [
    {
      title: 'How Do Astronauts Sleep Without Floating Away? 🚀',
      excerpt:
        'Discover why astronauts have to strap themselves to walls in sleeping bags so they do not bump their heads in Zero-G!',
      readTime: '3 min read · Fun Science',
      category: 'Space Life',
    },
    {
      title: 'Why Does Your Heart Work Differently in Orbit? ❤️',
      excerpt:
        'Without gravity pulling your blood down to your feet, your heart does not need to pump as hard! Meet the space heart trick.',
      readTime: '4 min read · Physiology',
      category: 'Kids Health',
    },
    {
      title: 'Can Astronauts Grow Vegetables on Mars? 🌱',
      excerpt:
        'Astronauts are already eating space lettuce! Learn how plants know which way is up when there is no gravity.',
      readTime: '5 min read · Biology',
      category: 'Space Farming',
    },
  ];

  const adultArticles = [
    {
      title: 'Orthostatic Intolerance & Cardiovascular Remodeling in Microgravity',
      excerpt:
        'Clinical analysis of cephalad fluid shifts, baroreceptor resetting, and post-flight stroke volume reduction under NASA STD-3001.',
      readTime: '8 min read · Clinical Medicine',
      category: 'Cardiovascular',
    },
    {
      title: 'Spaceflight-Associated Neuro-Ocular Syndrome (SANS) Management',
      excerpt:
        'Pathophysiology of optic disc edema, posterior globe flattening, and hyperopic refractive shift during long-duration orbital missions.',
      readTime: '12 min read · Neuro-Ophthalmology',
      category: 'Neurology',
    },
    {
      title: 'Galactic Cosmic Radiation (GCR) Proton Energy Spectra & Cell Repair',
      excerpt:
        'Assessment of cumulative tissue dose equivalent and dosimetric threshold triggers for crew shelter deployment during solar particle events.',
      readTime: '10 min read · Bio-Astronautics',
      category: 'Radiation Oncology',
    },
  ];

  const groundRoles = [
    { role: 'Flight Surgeon', code: 'flight_surgeon', desc: 'Clinical approvals & intervention authority', icon: Stethoscope },
    { role: 'Mission Director', code: 'mission_director', desc: 'Holistic mission status & crew readiness', icon: UserCheck },
    { role: 'Medical Officer', code: 'medical_officer', desc: 'Threshold calibrations & telemetry triage', icon: Heart },
    { role: 'Biomed Engineer', code: 'biomedical_engineer', desc: 'Hardware arrays, EVA suits, sensor calibration', icon: Wrench },
    { role: 'Astronaut Crew', code: 'astronaut_crew', desc: 'Personal check-ins, baselines, wellness', icon: Activity },
    { role: 'Ground Controller', code: 'ground_controller', desc: 'Data packet ingestion & downlink sync', icon: Cpu },
    { role: 'Cadet / Student', code: 'cadet_student', desc: 'Interactive academy, quizzes, Zero-G mini-games', icon: GraduationCap },
    { role: 'Content Creator', code: 'educator_content_creator', desc: 'Curricula authoring & article publishing', icon: Sparkles },
    { role: 'Sys Administrator', code: 'system_administrator', desc: 'User RBAC, system config, security policies', icon: Shield },
    { role: 'Compliance Auditor', code: 'auditor_compliance', desc: 'SHA-256 hash chains & forensic logs', icon: ShieldCheck },
  ];

  return (
    <div
      className={`min-h-screen space-y-16 sm:space-y-24 pb-24 transition-colors duration-200 ${
        isPaper ? 'paper-grain text-[#2d2d2d]' : isDark ? 'paper-grain-dark text-white' : 'hud-grid text-slate-100'
      }`}
    >
      {/* ========================================================
          1. Hero Section (Matching https://ro2ya-tech.com/#top)
          ======================================================== */}
      <section id="top" className="relative pt-8 sm:pt-14 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Top Kicker Bar: Badges & 3-Way Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 sm:mb-12">
          <div
            style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-sketch-hand border-2 -rotate-1 select-none ${
              isPaper
                ? 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d] sketch-shadow-card'
                : isDark
                  ? 'bg-[#18110c] text-[#FF4D00] border-[#FF4D00] sketch-shadow-orange'
                  : 'bg-[#0B132B] text-cyan-300 border-cyan-500/40 rounded-full shadow-[0_0_15px_rgba(0,229,255,0.2)] font-mono'
            }`}
          >
            <Activity
              className={`w-4 h-4 shrink-0 ${
                isPaper ? 'text-[#ff4d4d]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'
              } animate-pulse`}
            />
            <span className="font-bold">NASA STD-3001 · Deep-Space Medical Telemetry</span>
          </div>

          {/* 3-way Mode Switcher */}
          <div
            className={`flex items-center gap-1.5 p-1 border rounded-xl ${
              isPaper
                ? 'bg-[#e5e0d8]/80 border-[#2d2d2d]/40'
                : isDark
                  ? 'bg-black/80 border-[#FF4D00]/50'
                  : 'bg-[#0B132B] border-[#1E3A5F]'
            }`}
          >
            <button
              type="button"
              onClick={() => setMode('paper')}
              className={`px-3 py-1 text-xs font-sketch-hand font-bold transition-all cursor-pointer ${
                isPaper
                  ? 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn'
                  : isDark
                    ? 'text-white/70 hover:text-white'
                    : 'text-slate-400 hover:text-white font-mono'
              }`}
              style={isPaper ? getWobblyStyle('wobblyTag') : undefined}
            >
              📜 Paper Sketch
            </button>
            <button
              type="button"
              onClick={() => setMode('dark')}
              className={`px-3 py-1 text-xs font-sketch-hand font-bold transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#FF4D00] text-black border-2 border-white sketch-btn-orange font-bold'
                  : isPaper
                    ? 'text-[#2d2d2d]/70 hover:text-[#2d2d2d]'
                    : 'text-slate-400 hover:text-white font-mono'
              }`}
              style={isDark ? getWobblyStyle('wobblyTag') : undefined}
            >
              🚀 Dark Orbit
            </button>
            <button
              type="button"
              onClick={() => setMode('cyber')}
              className={`px-3 py-1 text-xs font-mono font-bold transition-all rounded-md cursor-pointer ${
                isCyber
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : isPaper
                    ? 'text-[#2d2d2d]/70 hover:text-[#2d2d2d]'
                    : 'text-white/70 hover:text-white'
              }`}
            >
              ⚡ Cyber HUD
            </button>
          </div>
        </div>

        {/* Hero Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 lg:gap-12">
          {/* Left Column: Heading, Subtitle, Badges, CTAs */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            <h1 className="font-display-kalam font-bold text-4xl sm:text-6xl lg:text-[3.5rem] lg:leading-[1.04] tracking-tight text-balance">
              AuraMed turns crew vitals into instant space medicine
              <span
                className={`inline-block ml-1.5 rotate-12 origin-bottom font-bold ${
                  isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#ff4d4d]' : 'text-cyan-400'
                }`}
                aria-hidden="true"
              >
                !
              </span>
            </h1>

            {/* Hand-drawn squiggly underline */}
            <div className="mt-2 mb-4 max-w-md">
              <SquiggleUnderline
                className={isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#ff4d4d]' : 'text-cyan-400'}
              />
            </div>

            {/* Subtitle */}
            <p
              className={`font-sketch-hand text-lg sm:text-xl leading-relaxed max-w-2xl ${
                isPaper ? 'text-[#2d2d2d]/85' : isDark ? 'text-white/85' : 'text-slate-300 font-sans'
              }`}
            >
              On a Mars transit, Houston answers take over 20 minutes. AuraMed fuses a 2-minute 6-vital check-in, a
              color-coded 14-organ body atlas, offline NASA RAG clinical triage, and daily Health Quests into one astronaut
              cockpit.
            </p>

            {/* Hand-drawn Tags */}
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <span
                style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                className={`px-3 py-1 text-xs font-sketch-hand border-2 font-bold select-none ${
                  isPaper
                    ? 'bg-[#2d5da1]/15 text-[#2d5da1] border-[#2d5da1]'
                    : isDark
                      ? 'bg-[#FF4D00]/25 text-[#FF4D00] border-[#FF4D00]'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-mono rounded'
                }`}
              >
                NASA STD-3001 Clinical Architecture
              </span>
              <span
                style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                className={`px-3 py-1 text-xs font-sketch-hand border-2 font-bold select-none ${
                  isPaper
                    ? 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d]'
                    : isDark
                      ? 'bg-[#FF4D00] text-black border-white'
                      : 'bg-amber-500/20 text-amber-300 border-amber-400 font-mono rounded'
                }`}
              >
                NASA HRP Briefing
              </span>
            </div>

            {/* Action Buttons with Dashed Arrow */}
            <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
              <DashedArrow
                className={`hidden lg:block w-16 h-8 -ml-2 -mt-2 shrink-0 ${
                  isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#2d5da1]' : 'text-cyan-400'
                }`}
              />

              {/* Primary CTA: Launch Mission Control */}
              <Link
                to="/mission-control"
                style={isSketch ? getWobblyStyle('wobbly') : undefined}
                className={`h-12 sm:h-14 inline-flex items-center justify-center gap-2 px-6 sm:px-8 text-base sm:text-lg font-bold font-sketch-hand whitespace-nowrap cursor-pointer transition-all ${
                  isPaper
                    ? 'bg-[#ff4d4d] text-white border-[3px] border-[#2d2d2d] sketch-btn hover:bg-[#e53e3e]'
                    : isDark
                      ? 'bg-[#FF4D00] text-black border-[3px] border-white sketch-btn-orange hover:bg-white hover:text-black'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono rounded-lg shadow-[0_0_20px_rgba(0,229,255,0.4)]'
                }`}
              >
                <span>Launch Mission Control</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              {/* Secondary CTA: Explore App */}
              <a
                href="#features"
                style={isSketch ? getWobblyStyle('wobbly') : undefined}
                className={`h-12 sm:h-14 inline-flex items-center justify-center gap-2 px-5 sm:px-7 text-base sm:text-lg font-sketch-hand font-bold whitespace-nowrap cursor-pointer transition-all ${
                  isPaper
                    ? 'bg-white text-[#2d2d2d] border-[3px] border-[#2d2d2d] sketch-btn hover:bg-[#fff9c4]'
                    : isDark
                      ? 'bg-[#0c0c10] text-white border-[3px] border-[#FF4D00] sketch-btn-orange hover:bg-[#FF4D00]/20'
                      : 'bg-[#0B132B] hover:bg-[#1E3A5F] text-white border border-[#1E3A5F] font-mono rounded-lg'
                }`}
              >
                <span>Explore App</span>
                <ChevronRight className="w-4 h-4" />
              </a>

              {/* Tertiary CTA: Mission Film */}
              <button
                type="button"
                onClick={() => setIsFilmModalOpen(true)}
                style={isSketch ? getWobblyStyle('wobblyAlt') : undefined}
                className={`h-12 sm:h-14 inline-flex items-center justify-center gap-2 px-5 sm:px-6 text-base sm:text-lg font-sketch-hand font-bold whitespace-nowrap cursor-pointer transition-all ${
                  isPaper
                    ? 'bg-[#e5e0d8] text-[#2d2d2d] border-[3px] border-[#2d2d2d] sketch-btn hover:bg-[#2d5da1] hover:text-white'
                    : isDark
                      ? 'bg-black text-white border-[3px] border-[#FF4D00] sketch-btn-orange hover:bg-[#FF4D00] hover:text-black'
                      : 'bg-[#0B132B]/80 hover:bg-[#0B132B] text-cyan-300 border border-cyan-500/30 font-mono rounded-lg'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Mission Film</span>
              </button>
            </div>
          </div>

          {/* Right Column: Preview Card with Tape, Pushpin, Corner Angles, and Video */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Floating "Mars >20m" Badge */}
            <div
              aria-hidden="true"
              style={getWobblyStyle('wobblyCircle')}
              className={`hidden sm:flex items-center justify-center w-20 h-20 border-[3px] border-dashed animate-bounce absolute -top-5 -right-3 z-30 font-display-kalam font-bold text-sm text-center leading-tight select-none ${
                isPaper
                  ? 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d] sketch-shadow'
                  : isDark
                    ? 'bg-[#FF4D00] text-black border-white sketch-shadow-orange'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-400 rounded-full font-mono'
              }`}
            >
              Mars
              <br />
              &gt;20m
            </div>

            {/* The Dossier Video Preview Card */}
            <div
              style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
              className={`relative w-full p-4 sm:p-6 sm:rotate-1 hover:rotate-0 transition-transform duration-200 flex flex-col justify-between ${
                isPaper
                  ? 'bg-white text-[#2d2d2d] border-[3px] border-[#2d2d2d] sketch-shadow-lg'
                  : isDark
                    ? 'bg-[#0c0c10] text-white border-[3px] border-[#FF4D00] sketch-shadow-orange-lg'
                    : 'bg-[#0B132B] text-white border border-cyan-500/40 rounded-2xl shadow-[0_0_30px_rgba(0,229,255,0.15)]'
              }`}
            >
              {/* Tape Strip on top */}
              {isSketch && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                  <Tape isDark={isDark} />
                </div>
              )}

              {/* Pushpin at top left */}
              {isSketch && (
                <div className="absolute -top-2.5 left-5 z-20">
                  <PushPin isDark={isDark} />
                </div>
              )}

              {/* Corner decorative marks */}
              <span
                aria-hidden="true"
                className={`absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 ${
                  isDark ? 'border-[#FF4D00]' : isPaper ? 'border-[#2d5da1]' : 'border-cyan-400'
                }`}
              />
              <span
                aria-hidden="true"
                className={`absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 ${
                  isDark ? 'border-[#FF4D00]' : isPaper ? 'border-[#2d5da1]' : 'border-cyan-400'
                }`}
              />

              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 mb-3">
                <span
                  className={`inline-flex items-center gap-1.5 font-display-kalam font-bold text-base sm:text-lg ${
                    isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#2d5da1]' : 'text-cyan-400 font-mono'
                  }`}
                >
                  <Video className="w-4 h-4 shrink-0" />
                  <span>Mission Film · AuraMed Intro</span>
                </span>
                <span
                  style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                  className={`px-2.5 py-0.5 text-xs font-sketch-hand font-bold border-2 whitespace-nowrap ${
                    isDark
                      ? 'bg-[#FF4D00] text-black border-white'
                      : isPaper
                        ? 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d]'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-mono rounded'
                  }`}
                >
                  NASA HRP Briefing
                </span>
              </div>

              {/* Video Player */}
              <div
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={`w-full overflow-hidden border-[3px] aspect-video bg-black flex items-center justify-center ${
                  isDark ? 'border-[#FF4D00]' : isPaper ? 'border-[#2d2d2d]' : 'border-cyan-500/40 rounded-xl'
                }`}
              >
                <video
                  data-testid="hero-intro-video"
                  src="https://ro2ya-tech.com/assets/aistudio/WhatsApp_Video_2026-11-17_at_12.39.09_AM_afbdcece.mp4"
                  controls
                  playsInline
                  preload="metadata"
                  aria-label="AuraMed Mission Intro Video explaining Mars crew self-assessment and health quests"
                  className="w-full h-full object-contain block"
                />
              </div>

              {/* Video Subtext */}
              <p
                className={`mt-3 font-sketch-hand text-sm sm:text-base border-t-2 border-dashed pt-3 ${
                  isPaper
                    ? 'text-[#2d2d2d]/80 border-[#2d2d2d]/30'
                    : isDark
                      ? 'text-white/80 border-[#FF4D00]/40'
                      : 'text-slate-300 border-[#1E3A5F] font-sans'
                }`}
              >
                Watch how AuraMed protects astronauts during 20+ minute Earth–Mars blackouts with color-coded 3D/2D
                organ triage and Health Quests.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Hero Stat Cards */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-6 place-items-stretch">
          {heroStats.map((stat, i) => (
            <div
              key={i}
              style={isSketch ? getWobblyStyle(stat.radius) : undefined}
              className={`w-full p-4 sm:p-5 border-[3px] text-center flex flex-col items-center justify-center transition-transform duration-150 hover:rotate-0 cursor-default ${
                stat.tilt
              } ${stat.bg} ${
                isPaper
                  ? 'border-[#2d2d2d] sketch-shadow text-[#2d2d2d]'
                  : isDark
                    ? 'border-[#FF4D00] sketch-shadow-orange text-white'
                    : 'border-[#1E3A5F] rounded-xl text-white'
              }`}
            >
              <span
                className={`font-display-kalam font-bold text-2xl sm:text-3xl lg:text-4xl leading-none tabular-nums ${
                  isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#ff4d4d]' : 'text-cyan-400 font-mono'
                }`}
              >
                {stat.value}
              </span>
              <span
                className={`mt-2 font-sketch-hand text-xs sm:text-sm lg:text-base leading-tight font-medium ${
                  isPaper ? 'text-[#2d2d2d]' : isDark ? 'text-white' : 'text-slate-300 font-mono'
                }`}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          2. Inside the AuraMed App / Capabilities Section
          ======================================================== */}
      <section id="features" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div
          className={`border-b-[3px] border-dashed pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 ${
            isDark ? 'border-[#FF4D00]/60' : isPaper ? 'border-[#2d2d2d]/40' : 'border-[#1E3A5F]'
          }`}
        >
          <div>
            <p
              className={`font-sketch-hand text-sm sm:text-base font-bold ${
                isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#2d5da1]' : 'text-cyan-400 font-mono'
              }`}
            >
              Full Mission Suite · NASA STD-3001 Clinical Architecture
            </p>
            <h2 className="font-display-kalam font-bold text-3xl sm:text-5xl leading-tight mt-1">
              Inside the AuraMed App
            </h2>
            <div className="max-w-[180px] mt-1">
              <SquiggleUnderline
                className={isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#ff4d4d]' : 'text-cyan-400'}
              />
            </div>
          </div>

          {/* Capability Category Filter Tabs */}
          <div
            className={`flex flex-wrap items-center gap-1.5 p-1 border rounded-xl ${
              isPaper
                ? 'bg-[#e5e0d8]/70 border-[#2d2d2d]/40'
                : isDark
                  ? 'bg-[#16161a] border-[#FF4D00]/50'
                  : 'bg-[#0B132B] border-[#1E3A5F]'
            }`}
          >
            {[
              { id: 'all', label: 'All Capabilities' },
              { id: 'medical', label: 'Medical & Atlas' },
              { id: 'ai-comms', label: 'AI & Mars Comms' },
              { id: 'resilience', label: 'Quests & Mindset' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id as any)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-sketch-hand font-bold transition-all cursor-pointer ${
                  activeCategory === tab.id
                    ? isPaper
                      ? 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn'
                      : isDark
                        ? 'bg-[#FF4D00] text-black border-2 border-white sketch-btn-orange'
                        : 'bg-cyan-500 text-slate-950 font-mono font-bold rounded'
                    : isPaper
                      ? 'text-[#2d2d2d]/70 hover:text-[#2d2d2d]'
                      : isDark
                        ? 'text-white/70 hover:text-white'
                        : 'text-slate-400 hover:text-white font-mono'
                }`}
                style={isSketch && activeCategory === tab.id ? getWobblyStyle('wobblyTag') : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6 Capabilities Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {filteredCapabilities.map((cap, i) => (
            <div
              key={cap.id}
              style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
              className={`relative p-5 sm:p-6 border-[3px] flex flex-col justify-between transition-all duration-150 ${
                cap.tilt
              } hover:rotate-0 ${
                isPaper
                  ? i % 2 === 0
                    ? 'bg-white border-[#2d2d2d] sketch-shadow text-[#2d2d2d]'
                    : 'bg-[#fff9c4] border-[#2d2d2d] sketch-shadow text-[#2d2d2d]'
                  : isDark
                    ? 'bg-[#0c0c10] border-[#FF4D00] sketch-shadow-orange text-white'
                    : 'bg-[#0B132B]/90 border-[#1E3A5F] rounded-xl text-slate-100 hover:border-cyan-400'
              }`}
            >
              {/* Accessory Decoration */}
              {isSketch && i % 2 === 0 && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <Tape isDark={isDark} />
                </div>
              )}
              {isSketch && i % 2 !== 0 && (
                <div className="absolute -top-2.5 right-6 z-10">
                  <PushPin isDark={isDark} />
                </div>
              )}

              <div>
                {/* Header Tag & Index */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                    className={`px-2.5 py-0.5 text-xs font-sketch-hand font-bold border-2 ${
                      isDark
                        ? 'bg-[#FF4D00]/25 text-[#FF4D00] border-[#FF4D00]'
                        : isPaper
                          ? 'bg-[#2d5da1]/15 text-[#2d5da1] border-[#2d5da1]'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-mono rounded'
                    }`}
                  >
                    {cap.badge}
                  </span>
                  <span
                    className={`font-display-kalam font-bold text-lg ${
                      isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#ff4d4d]' : 'text-cyan-400 font-mono'
                    }`}
                  >
                    #{cap.index}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <h3 className="font-display-kalam font-bold text-xl sm:text-2xl leading-snug">
                  {cap.title}
                </h3>
                <p
                  className={`mt-1 font-sketch-hand text-xs sm:text-sm font-medium ${
                    isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'text-slate-400 font-mono'
                  }`}
                >
                  {cap.subtitle}
                </p>

                {/* Description */}
                <p
                  className={`mt-3.5 font-sketch-hand text-sm sm:text-base leading-relaxed ${
                    isPaper ? 'text-[#2d2d2d]/90' : isDark ? 'text-white/85' : 'text-slate-300 font-sans'
                  }`}
                >
                  {cap.description}
                </p>

                {/* Highlights List */}
                <ul className="mt-4 space-y-1.5 border-t border-dashed pt-3 text-xs sm:text-sm font-sketch-hand">
                  {cap.highlights.map((h, hi) => (
                    <li key={hi} className="flex items-start gap-2">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#2d5da1]' : 'text-cyan-400'
                        }`}
                      />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Metric & CTA */}
              <div
                className={`mt-6 pt-3.5 border-t-2 border-dashed flex items-center justify-between ${
                  isDark ? 'border-[#FF4D00]/40' : isPaper ? 'border-[#2d2d2d]/30' : 'border-[#1E3A5F]'
                }`}
              >
                <div>
                  <span
                    className={`text-[10px] font-sketch-hand uppercase block ${
                      isPaper ? 'text-[#2d2d2d]/60' : isDark ? 'text-white/60' : 'text-slate-400 font-mono'
                    }`}
                  >
                    {cap.metricLabel}
                  </span>
                  <span
                    className={`font-display-kalam font-bold text-base sm:text-lg ${
                      isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#ff4d4d]' : 'text-cyan-400 font-mono'
                    }`}
                  >
                    {cap.metricValue}
                  </span>
                </div>

                <Link
                  to="/mission-control"
                  style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                  className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-sketch-hand font-bold border-2 transition-all cursor-pointer ${
                    isPaper
                      ? 'bg-white text-[#2d2d2d] border-[#2d2d2d] sketch-btn hover:bg-[#fff9c4]'
                      : isDark
                        ? 'bg-black text-[#FF4D00] border-[#FF4D00] sketch-btn-orange hover:bg-[#FF4D00] hover:text-black'
                        : 'bg-[#1E3A5F] hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-mono rounded'
                  }`}
                >
                  <span>Launch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          3. Live Telemetry & Organ Systems Bio-Scan Section
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="font-display-kalam font-bold text-3xl sm:text-4xl md:text-5xl">
            Real-Time Organ Systems Bio-Scan
          </h2>
          <div className="max-w-[200px] mx-auto mt-1 mb-3">
            <SquiggleUnderline
              className={isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#ff4d4d]' : 'text-cyan-400'}
            />
          </div>
          <p
            className={`font-sketch-hand text-base sm:text-lg max-w-2xl mx-auto leading-relaxed ${
              isPaper ? 'text-[#2d2d2d]/80' : isDark ? 'text-white/80' : 'text-slate-400 font-sans'
            }`}
          >
            Directly mirroring the offline-first astronaut mobile health application. Synced to Houston Ground Control
            the moment orbital telemetry downlink is restored.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8">
            <OrganTelemetryGrid />
          </div>

          <div className="lg:col-span-4 space-y-5">
            {/* Holographic ECG Card */}
            <div
              style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
              className={`relative p-5 border-[3px] ${
                isPaper
                  ? 'bg-white text-[#2d2d2d] border-[#2d2d2d] sketch-shadow'
                  : isDark
                    ? 'bg-[#0c0c10] text-white border-[#FF4D00] sketch-shadow-orange'
                    : 'bg-[#0B132B] text-white border-[#1E3A5F] rounded-xl'
              }`}
            >
              {isSketch && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <Tape isDark={isDark} />
                </div>
              )}

              <div className="pb-3 mb-3 border-b-2 border-dashed border-current/20 flex items-center justify-between">
                <div>
                  <h3 className="font-display-kalam font-bold text-lg sm:text-xl">
                    Live Lead II Cardiac Array
                  </h3>
                  <p
                    className={`font-sketch-hand text-xs ${
                      isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'text-slate-400'
                    }`}
                  >
                    Continuous 500Hz Holter Waveform
                  </p>
                </div>
                <SketchBadge variant="nominal" mode={mode}>
                  62 BPM
                </SketchBadge>
              </div>

              <EcgCanvas height={130} bpm={62} mode={mode} />

              <div
                className={`mt-4 pt-4 border-t-2 border-dashed space-y-2 text-xs font-sketch-hand ${
                  isPaper ? 'border-[#2d2d2d]/25' : isDark ? 'border-[#FF4D00]/30' : 'border-[#1E3A5F]'
                }`}
              >
                <div className="flex justify-between">
                  <span className={isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'text-slate-400'}>
                    RHYTHM DIAGNOSIS:
                  </span>
                  <span className="font-bold text-emerald-500">NORMAL SINUS (NOMINAL)</span>
                </div>
                <div className="flex justify-between">
                  <span className={isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'text-slate-400'}>
                    QTC INTERVAL:
                  </span>
                  <span className="font-bold">412 ms</span>
                </div>
                <div className="flex justify-between">
                  <span className={isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'text-slate-400'}>
                    HRV RMSSD:
                  </span>
                  <span
                    className={`font-bold ${
                      isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#2d5da1]' : 'text-cyan-400'
                    }`}
                  >
                    42.5 ms
                  </span>
                </div>
              </div>
            </div>

            {/* Zero Blackout Architecture Card */}
            <div
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={`p-4 border-[3px] space-y-2 ${
                isPaper
                  ? 'bg-[#fff9c4] border-[#2d2d2d] sketch-shadow text-[#2d2d2d]'
                  : isDark
                    ? 'bg-[#16161a] border-[#FF4D00] sketch-shadow-orange text-white'
                    : 'bg-cyan-950/30 border border-cyan-500/30 text-slate-200 rounded-xl'
              }`}
            >
              <div
                className={`flex items-center gap-2 font-display-kalam font-bold text-sm uppercase ${
                  isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#ff4d4d]' : 'text-cyan-300'
                }`}
              >
                <Zap className="w-4 h-4 shrink-0 fill-current" />
                <span>Zero Blackout Architecture</span>
              </div>
              <p
                className={`font-sketch-hand text-xs sm:text-sm leading-relaxed ${
                  isPaper ? 'text-[#2d2d2d]/85' : isDark ? 'text-white/85' : 'text-slate-300'
                }`}
              >
                Buffers up to 72 hours of raw biometric waveforms locally on the crew device. Automatically performs
                differential sync and automated alert deduplication upon network re-establishment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. Space Medicine Articles (Kids vs Adults Dual Tracks)
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-[3px] border-dashed pb-5 mb-8 ${
            isDark ? 'border-[#FF4D00]/60' : isPaper ? 'border-[#2d2d2d]/40' : 'border-[#1E3A5F]'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <BookOpen
                className={`w-4 h-4 ${
                  isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#2d5da1]' : 'text-cyan-400'
                }`}
              />
              <span
                className={`font-sketch-hand text-xs uppercase tracking-wider font-bold ${
                  isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#2d5da1]' : 'text-cyan-400 font-mono'
                }`}
              >
                AuraMed Space Medicine Articles
              </span>
            </div>
            <h2 className="font-display-kalam font-bold text-2xl sm:text-4xl mt-1">
              Astronaut Health & Spaceflight Knowledge
            </h2>
          </div>

          {/* Toggle Audience Tabs */}
          <div
            className={`flex items-center gap-1.5 p-1 border rounded-xl ${
              isPaper
                ? 'bg-[#e5e0d8]/70 border-[#2d2d2d]/40'
                : isDark
                  ? 'bg-[#16161a] border-[#FF4D00]/50'
                  : 'bg-[#0B132B] border-[#1E3A5F]'
            }`}
          >
            <button
              type="button"
              onClick={() => setArticleAudience('kids')}
              className={`px-4 py-1.5 text-xs sm:text-sm font-sketch-hand font-bold transition-all cursor-pointer ${
                articleAudience === 'kids'
                  ? isPaper
                    ? 'bg-[#fff9c4] text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn'
                    : isDark
                      ? 'bg-[#FF4D00] text-black border-2 border-white sketch-btn-orange'
                      : 'bg-amber-500 text-slate-950 font-mono font-bold rounded'
                  : isPaper
                    ? 'text-[#2d2d2d]/70 hover:text-[#2d2d2d]'
                    : isDark
                      ? 'text-white/70 hover:text-white'
                      : 'text-slate-400 hover:text-white font-mono'
              }`}
              style={isSketch && articleAudience === 'kids' ? getWobblyStyle('wobblyTag') : undefined}
            >
              Junior Cadets (Kids)
            </button>
            <button
              type="button"
              onClick={() => setArticleAudience('adults')}
              className={`px-4 py-1.5 text-xs sm:text-sm font-sketch-hand font-bold transition-all cursor-pointer ${
                articleAudience === 'adults'
                  ? isPaper
                    ? 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn'
                    : isDark
                      ? 'bg-white text-black border-2 border-white sketch-btn'
                      : 'bg-cyan-500 text-slate-950 font-mono font-bold rounded'
                  : isPaper
                    ? 'text-[#2d2d2d]/70 hover:text-[#2d2d2d]'
                    : isDark
                      ? 'text-white/70 hover:text-white'
                      : 'text-slate-400 hover:text-white font-mono'
              }`}
              style={isSketch && articleAudience === 'adults' ? getWobblyStyle('wobblyTag') : undefined}
            >
              Flight Surgeons (Adults)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(articleAudience === 'kids' ? kidsArticles : adultArticles).map((article, idx) => (
            <div
              key={idx}
              style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
              className={`relative p-6 border-[3px] transition-all duration-200 flex flex-col justify-between ${
                isPaper
                  ? articleAudience === 'kids'
                    ? 'bg-[#fff9c4] border-[#2d2d2d] sketch-shadow text-[#2d2d2d] -rotate-1 hover:rotate-0'
                    : 'bg-white border-[#2d2d2d] sketch-shadow text-[#2d2d2d] rotate-1 hover:rotate-0'
                  : isDark
                    ? 'bg-[#0c0c10] border-[#FF4D00] sketch-shadow-orange text-white'
                    : 'bg-[#0B132B]/80 border-[#1E3A5F] rounded-xl text-slate-100 hover:border-cyan-400'
              }`}
            >
              {isSketch && (
                <div className="absolute -top-2.5 left-5 z-10">
                  <PushPin isDark={isDark} />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between text-xs font-sketch-hand mb-3">
                  <span
                    className={`font-bold ${
                      articleAudience === 'kids'
                        ? isDark
                          ? 'text-[#FF4D00]'
                          : 'text-amber-600'
                        : isDark
                          ? 'text-[#FF4D00]'
                          : isPaper
                            ? 'text-[#2d5da1]'
                            : 'text-cyan-400'
                    }`}
                  >
                    {article.category}
                  </span>
                  <span className={isPaper ? 'text-[#2d2d2d]/60' : isDark ? 'text-white/60' : 'text-slate-400'}>
                    {article.readTime}
                  </span>
                </div>
                <h3 className="font-display-kalam font-bold text-lg sm:text-xl leading-snug">
                  {article.title}
                </h3>
                <p
                  className={`mt-3 font-sketch-hand text-sm leading-relaxed ${
                    isPaper ? 'text-[#2d2d2d]/85' : isDark ? 'text-white/80' : 'text-slate-300 font-sans'
                  }`}
                >
                  {article.excerpt}
                </p>
              </div>

              <div
                className={`mt-6 pt-4 border-t-2 border-dashed flex items-center justify-between text-xs font-sketch-hand font-bold ${
                  isDark ? 'border-[#FF4D00]/40' : isPaper ? 'border-[#2d2d2d]/30' : 'border-[#1E3A5F]'
                }`}
              >
                <span>Read Full Clinical Article</span>
                <ChevronRight
                  className={`w-4 h-4 ${
                    isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#ff4d4d]' : 'text-cyan-400'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          5. 10 Tailored Ground Control & Orbit Roles Section
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="font-display-kalam font-bold text-3xl sm:text-4xl">
            10 Tailored Ground Control & Orbit Roles
          </h2>
          <div className="max-w-[220px] mx-auto mt-1 mb-2">
            <SquiggleUnderline
              className={isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#ff4d4d]' : 'text-cyan-400'}
            />
          </div>
          <p
            className={`font-sketch-hand text-sm sm:text-base max-w-2xl mx-auto leading-relaxed ${
              isPaper ? 'text-[#2d2d2d]/75' : isDark ? 'text-white/75' : 'text-slate-400 font-sans'
            }`}
          >
            Granular Role-Based Access Control (RBAC) ensuring precise medical data privacy and clinical workflow
            separation under NASA STD-3001.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {groundRoles.map((r, i) => {
            const Icon = r.icon;
            return (
              <Link
                key={i}
                to={`/login?role=${r.code}`}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={`p-3.5 border-[2px] transition-all duration-150 flex flex-col justify-between hover:-translate-y-1 ${
                  isPaper
                    ? 'bg-white border-[#2d2d2d] sketch-btn text-[#2d2d2d] hover:bg-[#fff9c4]'
                    : isDark
                      ? 'bg-[#0c0c10] border-[#FF4D00] sketch-btn-orange text-white hover:bg-[#16161a]'
                      : 'bg-[#0B132B]/70 border-[#1E3A5F] rounded-lg text-slate-200 hover:border-cyan-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Icon
                      className={`w-4 h-4 ${
                        isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#2d5da1]' : 'text-cyan-400'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-sketch-hand font-bold uppercase ${
                        isPaper ? 'text-[#2d2d2d]/60' : isDark ? 'text-white/60' : 'text-slate-500 font-mono'
                      }`}
                    >
                      RBAC #{i + 1}
                    </span>
                  </div>
                  <p className="font-display-kalam font-bold text-sm leading-snug">{r.role}</p>
                  <p
                    className={`mt-1 font-sketch-hand text-[11px] leading-tight ${
                      isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'text-slate-400 font-sans'
                    }`}
                  >
                    {r.desc}
                  </p>
                </div>
                <div
                  className={`mt-3 pt-2 border-t border-dashed flex items-center justify-between text-[10px] font-sketch-hand font-bold ${
                    isDark ? 'border-[#FF4D00]/30 text-[#FF4D00]' : isPaper ? 'border-[#2d2d2d]/20 text-[#2d5da1]' : 'border-[#1E3A5F] text-cyan-400'
                  }`}
                >
                  <span>Simulate Access</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          6. Protect Every Crew Member (CTA Section)
          ======================================================== */}
      <section id="cta" className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
        <div
          style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
          className={`relative p-8 sm:p-12 md:p-16 text-center border-[3px] ${
            isPaper
              ? 'bg-[#fff9c4] border-[#2d2d2d] sketch-shadow-lg text-[#2d2d2d]'
              : isDark
                ? 'bg-[#0c0c10] border-[#FF4D00] sketch-shadow-orange-lg text-white'
                : 'bg-[#0B132B] border-cyan-500/40 rounded-2xl shadow-[0_0_40px_rgba(0,229,255,0.2)] text-white'
          }`}
        >
          {isSketch && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
              <Tape isDark={isDark} />
            </div>
          )}

          <p
            className={`font-sketch-hand text-base sm:text-lg mb-2 font-bold ${
              isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#2d5da1]' : 'text-cyan-400 font-mono'
            }`}
          >
            Human spaceflight telemetry ready for mission integration
          </p>

          <h2 className="font-display-kalam font-bold text-4xl sm:text-5xl md:text-6xl leading-[1.05] text-balance">
            Protect Every Crew Member
          </h2>

          <div className="max-w-xs mx-auto mt-2 mb-6">
            <SquiggleUnderline
              className={isDark ? 'text-[#FF4D00]' : isPaper ? 'text-[#ff4d4d]' : 'text-cyan-400'}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/mission-control"
              style={isSketch ? getWobblyStyle('wobbly') : undefined}
              className={`h-12 sm:h-14 px-7 sm:px-10 inline-flex items-center justify-center gap-2 font-sketch-hand font-bold text-lg sm:text-xl transition-all cursor-pointer ${
                isPaper
                  ? 'bg-white text-[#2d2d2d] border-[3px] border-[#2d2d2d] sketch-btn hover:bg-[#ff4d4d] hover:text-white'
                  : isDark
                    ? 'bg-[#FF4D00] text-black border-[3px] border-white sketch-btn-orange hover:bg-white hover:text-black'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono rounded-lg shadow-[0_0_20px_rgba(0,229,255,0.4)]'
              }`}
            >
              <span>Launch Mission Control</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to="/academy"
              style={isSketch ? getWobblyStyle('wobblyAlt') : undefined}
              className={`h-12 sm:h-14 px-6 sm:px-8 inline-flex items-center justify-center gap-2 font-sketch-hand font-bold text-lg sm:text-xl transition-all cursor-pointer ${
                isPaper
                  ? 'bg-[#e5e0d8] text-[#2d2d2d] border-[3px] border-[#2d2d2d] sketch-btn hover:bg-[#2d5da1] hover:text-white'
                  : isDark
                    ? 'bg-black text-white border-[3px] border-[#FF4D00] sketch-btn-orange hover:bg-[#FF4D00] hover:text-black'
                    : 'bg-[#0B132B] hover:bg-[#1E3A5F] text-cyan-300 border border-[#1E3A5F] font-mono rounded-lg'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span>Explore Space Academy</span>
            </Link>

            <Link
              to="/login"
              style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
              className={`h-12 sm:h-14 px-6 sm:px-8 inline-flex items-center justify-center gap-2 font-sketch-hand font-bold text-base sm:text-lg transition-all cursor-pointer ${
                isPaper
                  ? 'bg-[#fff9c4] text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn hover:bg-white'
                  : isDark
                    ? 'bg-[#16161a] text-[#FF4D00] border-2 border-[#FF4D00] sketch-btn-orange hover:bg-black'
                    : 'bg-[#050B14] hover:bg-[#0B132B] text-slate-300 border border-slate-700 font-mono rounded-lg'
              }`}
            >
              <span>Simulate Astronaut Login</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. Mission Film / Flight Briefing Modal
          ======================================================== */}
      {isFilmModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div
            style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
            className={`relative w-full max-w-4xl p-5 sm:p-7 border-[3px] ${
              isPaper
                ? 'bg-white text-[#2d2d2d] border-[#2d2d2d] sketch-shadow-lg'
                : isDark
                  ? 'bg-[#0c0c10] text-white border-[#FF4D00] sketch-shadow-orange-lg'
                  : 'bg-[#0B132B] text-white border-cyan-500/50 rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.3)]'
            }`}
          >
            {isSketch && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                <Tape isDark={isDark} />
              </div>
            )}

            <div className="flex items-center justify-between pb-4 mb-4 border-b-2 border-dashed border-current/25">
              <div>
                <h3 className="font-display-kalam font-bold text-2xl sm:text-3xl">
                  AuraMed Mission Film &amp; Clinical Briefing
                </h3>
                <p className="font-sketch-hand text-xs sm:text-sm opacity-80 mt-0.5">
                  Artemis Transit &amp; Mars Surface Autonomous Telemetry System (NASA HRP Briefing)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFilmModalOpen(false)}
                className={`p-2 border-2 cursor-pointer transition-all ${
                  isPaper
                    ? 'bg-[#fdfbf7] border-[#2d2d2d] sketch-btn hover:bg-[#ff4d4d] hover:text-white'
                    : isDark
                      ? 'bg-black border-[#FF4D00] text-[#FF4D00] sketch-btn-orange hover:bg-[#FF4D00] hover:text-black'
                      : 'border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg'
                }`}
                style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={`w-full overflow-hidden border-[3px] aspect-video bg-black ${
                isDark ? 'border-[#FF4D00]' : isPaper ? 'border-[#2d2d2d]' : 'border-cyan-500/40 rounded-xl'
              }`}
            >
              <video
                src="https://ro2ya-tech.com/assets/aistudio/WhatsApp_Video_2026-11-17_at_12.39.09_AM_afbdcece.mp4"
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-dashed border-current/20">
              <span className="font-sketch-hand text-xs sm:text-sm opacity-80">
                NASA STD-3001 Compliance: 14 Systems · 6-Vital Check-In · Offline RAG
              </span>
              <button
                type="button"
                onClick={() => setIsFilmModalOpen(false)}
                style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                className={`px-5 py-2 text-sm font-sketch-hand font-bold border-2 cursor-pointer ${
                  isPaper
                    ? 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d] sketch-btn hover:bg-[#ff4d4d] hover:text-white'
                    : isDark
                      ? 'bg-[#FF4D00] text-black border-white sketch-btn-orange'
                      : 'bg-cyan-500 text-slate-950 font-mono rounded'
                }`}
              >
                Close Briefing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
