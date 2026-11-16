import { Activity, ArrowDown, Film, Moon, Sun } from 'lucide-react';
import { getWobblyBorderStyle, type ThemeMode } from '../styles/handDrawnTokens';
import { HandDrawnArrowSvg, TapeStrip } from './HandDrawnDecor';

interface HeroSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenBriefing: () => void;
}

const INTRO_VIDEO_SRC =
  '/assets/aistudio/WhatsApp_Video_2026-11-17_at_12.39.09_AM_afbdcece.mp4';

const ORGANIC_STATS = [
  {
    value: '2 min',
    label: '6-Vital Self Check-In',
    tilt: '-rotate-2',
    bg: 'bg-[#fff9c4] dark:bg-[#0c0c10]',
    radius: 'wobblyCircle' as const,
  },
  {
    value: '14 Organs',
    label: '2.4× Interactive Atlas',
    tilt: 'rotate-2',
    bg: 'bg-white dark:bg-[#0c0c10]',
    radius: 'wobblySm' as const,
  },
  {
    value: '>20 min',
    label: 'Mars Comms Delay Safe',
    tilt: '-rotate-1',
    bg: 'bg-[#e5e0d8] dark:bg-[#16161a]',
    radius: 'wobblyAlt' as const,
  },
  {
    value: '100 Ranks',
    label: 'Health Quests & Shields',
    tilt: 'rotate-1',
    bg: 'bg-[#fff9c4] dark:bg-[#0c0c10]',
    radius: 'wobblyCircle' as const,
  },
];

export function HeroSection({
  theme,
  onToggleTheme,
  onOpenBriefing,
}: HeroSectionProps) {
  return (
    <section
      id="top"
      className="pt-20 pb-12 sm:pt-24 sm:pb-16 lg:pt-28 lg:pb-20 px-4 sm:px-6 text-[#2d2d2d] dark:text-white"
    >
      <div className="max-w-5xl mx-auto">
        {/* Top Metadata & Theme Mode Switch Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-7 sm:mb-10">
          <div
            data-gsap="hero-kicker"
            style={getWobblyBorderStyle('wobblyTag')}
            className="inline-flex items-center gap-2 bg-[#fff9c4] dark:bg-[#18110c] text-[#2d2d2d] dark:text-[#FF4D00] border-2 border-[#2d2d2d] dark:border-[#FF4D00] px-3 py-1 sm:px-4 sm:py-1.5 -rotate-1 sketch-shadow-card font-sans text-xs sm:text-sm lg:text-base"
          >
            <Activity className="w-4 h-4 text-[#ff4d4d] dark:text-[#FF4D00] shrink-0" strokeWidth={2.5} aria-hidden="true" />
            <span>NASA STD-3001 · Deep-Space Medical Telemetry</span>
          </div>

          <button
            type="button"
            data-testid="theme-toggle"
            onClick={onToggleTheme}
            aria-label={theme === 'light' ? 'Switch to Dark Orbit Mode' : 'Switch to Warm Paper Mode'}
            style={getWobblyBorderStyle('wobbly')}
            className="h-11 sm:h-12 inline-flex items-center gap-2 bg-white dark:bg-black text-[#2d2d2d] dark:text-[#FF4D00] border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] px-3.5 sm:px-5 font-sans text-sm sm:text-base lg:text-lg hover:bg-[#e5e0d8] dark:hover:bg-[#FF4D00] dark:hover:text-black sketch-btn cursor-pointer whitespace-nowrap"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-[#2d5da1]" strokeWidth={2.5} aria-hidden="true" />
                <span>Dark Orbit Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-[#FF4D00]" strokeWidth={2.5} aria-hidden="true" />
                <span>Paper Sketch Mode</span>
              </>
            )}
          </button>
        </div>

        {/* 2-Column Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch gap-8 lg:gap-10">
          {/* Left Column: Handwritten Headline + Value Proposition + Dashed Arrow to CTA */}
          <div className="flex flex-col justify-center">
            <h1
              data-gsap="hero-title"
              className="font-display font-bold text-[2.35rem] leading-[1.06] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.02] text-[#2d2d2d] dark:text-white text-balance"
            >
              AuraMed turns crew vitals into instant space medicine
              <span
                data-gsap="hero-bang"
                className="inline-block ml-1.5 text-[#ff4d4d] dark:text-[#FF4D00] rotate-12 origin-bottom"
                aria-hidden="true"
              >
                !
              </span>
            </h1>

            <p
              data-gsap="hero-meta"
              className="mt-4 sm:mt-5 font-sans text-base sm:text-lg lg:text-xl leading-relaxed text-[#2d2d2d]/85 dark:text-white/85 max-w-xl"
            >
              On a Mars transit, Houston answers take over 20 minutes. AuraMed
              fuses a 2-minute 6-vital check-in, a color-coded 14-organ body
              atlas, offline NASA RAG clinical triage, and daily Health Quests
              into one astronaut cockpit.
            </p>

            {/* Primary & Secondary Action Pair + Hand-Drawn Arrow */}
            <div className="mt-6 sm:mt-8 relative flex flex-wrap items-center gap-3 sm:gap-4">
              <HandDrawnArrowSvg className="hidden lg:block w-20 h-12 text-[#2d5da1] dark:text-[#FF4D00] -ml-3 -mt-2 shrink-0" />

              <a
                href="#features"
                style={getWobblyBorderStyle('wobbly')}
                className="flex-1 sm:flex-initial min-w-[165px] h-12 sm:h-14 inline-flex items-center justify-center gap-2 bg-white dark:bg-[#FF4D00] text-[#2d2d2d] dark:text-black border-[3px] border-[#2d2d2d] dark:border-white px-5 sm:px-7 font-sans text-lg sm:text-xl lg:text-2xl hover:bg-[#ff4d4d] hover:text-white dark:hover:bg-white dark:hover:text-black sketch-btn whitespace-nowrap cursor-pointer"
              >
                <span>Explore App</span>
                <ArrowDown className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
              </a>

              <button
                type="button"
                onClick={onOpenBriefing}
                style={getWobblyBorderStyle('wobblyAlt')}
                className="flex-1 sm:flex-initial min-w-[145px] h-12 sm:h-14 inline-flex items-center justify-center bg-[#e5e0d8] dark:bg-black text-[#2d2d2d] dark:text-white border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] px-5 sm:px-6 font-sans text-lg sm:text-xl hover:bg-[#2d5da1] hover:text-white dark:hover:bg-[#FF4D00] dark:hover:text-black sketch-btn whitespace-nowrap cursor-pointer"
              >
                Flight Briefing
              </button>
            </div>
          </div>

          {/* Right Column: Taped Sketchpad Card with Embedded Intro Video */}
          <div className="relative flex items-center justify-center">
            {/* Bouncing decorative scribbled seal (desktop only) */}
            <div
              aria-hidden="true"
              style={getWobblyBorderStyle('wobblyCircle')}
              className="hidden lg:flex items-center justify-center w-20 h-20 bg-[#fff9c4] dark:bg-[#FF4D00] text-[#2d2d2d] dark:text-black border-[3px] border-dashed border-[#2d2d2d] dark:border-white animate-bounce-3s absolute -top-5 -right-3 z-20 font-display font-bold text-sm text-center leading-tight sketch-shadow"
            >
              Mars
              <br />
              &gt;20m
            </div>

            <div
              style={getWobblyBorderStyle('wobblyMd')}
              className="relative w-full bg-white dark:bg-[#0c0c10] border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] p-4 sm:p-6 lg:p-7 sm:rotate-1 hover:rotate-0 transition-transform duration-100 sketch-shadow-lg flex flex-col justify-between"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                <TapeStrip />
              </div>

              {/* Corner frame sketch marks */}
              <span
                aria-hidden="true"
                className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#2d5da1] dark:border-[#FF4D00]"
              />
              <span
                aria-hidden="true"
                className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#2d5da1] dark:border-[#FF4D00]"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 lg:pr-14 pt-1 mb-3">
                <span className="inline-flex items-center gap-1.5 font-display font-bold text-base sm:text-lg text-[#2d5da1] dark:text-[#FF4D00]">
                  <Film className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  <span>Mission Film · AuraMed Intro</span>
                </span>
                <span
                  style={getWobblyBorderStyle('wobblyTag')}
                  className="bg-[#fff9c4] dark:bg-[#FF4D00] text-[#2d2d2d] dark:text-black border-2 border-[#2d2d2d] dark:border-white px-2.5 sm:px-3 py-0.5 text-xs sm:text-sm whitespace-nowrap shrink-0"
                >
                  NASA HRP Briefing
                </span>
              </div>

              {/* Embedded Mission Intro Video */}
              <div
                style={getWobblyBorderStyle('wobblySm')}
                className="w-full overflow-hidden border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] bg-[#070b14] aspect-video"
              >
                <video
                  data-testid="hero-intro-video"
                  src={INTRO_VIDEO_SRC}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label="AuraMed Mission Intro Video explaining Mars crew self-assessment and health quests"
                  className="w-full h-full object-contain block"
                />
              </div>

              <p className="mt-3 font-sans text-sm sm:text-base text-[#2d2d2d]/80 dark:text-white/80 border-t-2 border-dashed border-[#2d2d2d]/40 dark:border-white/25 pt-3">
                Watch how AuraMed protects astronauts during 20+ minute Earth–Mars
                blackouts with color-coded 3D/2D organ triage and Health Quests.
              </p>
            </div>
          </div>
        </div>

        {/* 4-Column Fluid Organic Stats Strip */}
        <div className="mt-10 sm:mt-14 grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-7 place-items-center">
          {ORGANIC_STATS.map((stat) => (
            <div
              key={stat.label}
              data-gsap="hero-stat"
              style={getWobblyBorderStyle(stat.radius)}
              className={`w-full max-w-[220px] min-h-[96px] sm:min-h-[112px] lg:min-h-[124px] ${stat.bg} ${stat.tilt} hover:rotate-0 transition-transform duration-100 border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] sketch-shadow flex flex-col items-center justify-center p-3 text-center`}
            >
              <span className="font-display font-bold text-xl sm:text-2xl lg:text-3xl text-[#ff4d4d] dark:text-[#FF4D00] tabular-nums leading-none">
                {stat.value}
              </span>
              <span className="font-sans text-xs sm:text-sm lg:text-base text-[#2d2d2d] dark:text-white mt-1.5 leading-tight">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
