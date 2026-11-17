import { Download, Moon, Sun } from 'lucide-react';
import { getWobblyBorderStyle, type ThemeMode } from '../styles/handDrawnTokens';
import { TapeStrip, WavyUnderlineSvg } from './HandDrawnDecor';

interface CtaFooterProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenBriefing: () => void;
}

export function CtaFooter({
  theme,
  onToggleTheme,
  onOpenBriefing,
}: CtaFooterProps) {
  return (
    <section
      id="cta"
      className="scroll-mt-24 pt-12 sm:pt-16 pb-20 sm:pb-24 px-4 sm:px-6 text-[#2d2d2d] dark:text-white"
    >
      <div className="max-w-5xl mx-auto">
        {/* Highlighted Hand-Drawn CTA Card with Dashed Sketch Overlay */}
        <div
          data-gsap="reveal"
          style={getWobblyBorderStyle('wobblyMd')}
          className="relative bg-[#fff9c4] dark:bg-[#0c0c10] border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] p-6 sm:p-10 md:p-14 text-center sketch-shadow-lg lg:scale-[1.02] mb-14 sm:mb-20"
        >
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <TapeStrip />
          </div>

          {/* Dashed circle overlay behind headline highlight (desktop only) */}
          <div
            aria-hidden="true"
            style={getWobblyBorderStyle('wobblyCircle')}
            className="hidden md:block pointer-events-none absolute inset-x-16 inset-y-6 border-2 border-dashed border-[#ff4d4d]/45 dark:border-[#FF4D00]/45 rotate-1"
          />

          <p className="font-sans text-base sm:text-lg text-[#2d5da1] dark:text-[#FF4D00] mb-2 sm:mb-3">
            Human spaceflight telemetry ready for mission integration
          </p>
          <h2 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl leading-[1.02] text-[#2d2d2d] dark:text-white text-balance">
            Protect Every Crew Member
          </h2>

          <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/AuraMed.apk"
              download="AuraMed.apk"
              style={getWobblyBorderStyle('wobbly')}
              className="w-full sm:w-auto h-12 sm:h-14 inline-flex items-center justify-center gap-2 bg-[#ff4d4d] dark:bg-[#FF4D00] text-white dark:text-black font-sans font-bold text-lg sm:text-xl md:text-2xl px-6 sm:px-10 border-[3px] border-[#2d2d2d] dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black sketch-btn cursor-pointer whitespace-nowrap shadow-lg"
            >
              <Download className="w-6 h-6" strokeWidth={2.5} />
              <span>Download AuraMed APK (111 MB)</span>
            </a>

            <button
              type="button"
              onClick={onOpenBriefing}
              style={getWobblyBorderStyle('wobblyAlt')}
              className="w-full sm:w-auto h-12 sm:h-14 bg-white dark:bg-black text-[#2d2d2d] dark:text-white font-sans text-lg sm:text-xl md:text-2xl px-6 sm:px-10 border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] hover:bg-[#fff9c4] dark:hover:bg-[#FF4D00]/20 sketch-btn cursor-pointer whitespace-nowrap"
            >
              Request Flight Briefing
            </button>
          </div>
          <p className="mt-4 text-xs sm:text-sm font-mono text-[#2d2d2d]/70 dark:text-white/70">
            Compatible with Android 8.0+ · Autonomous Flight Telemetry · NASA STD-3001
          </p>
        </div>

        {/* Hand-Drawn Footer with Wavy Header Underline & Line-Through Link Hover */}
        <footer className="border-t-[3px] border-dashed border-[#2d2d2d] dark:border-[#FF4D00] pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 font-sans text-base">
          <div>
            <p className="font-display font-bold text-xl inline-block relative">
              AuraMed Orbital Biometrics
              <span className="block text-[#ff4d4d] dark:text-[#FF4D00]">
                <WavyUnderlineSvg />
              </span>
            </p>
            <p className="text-sm text-[#2d2d2d]/75 dark:text-white/75 mt-1">
              © 2026 AuraMed Aerospace Telemetry · Houston / LEO 408 km
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              href="#top"
              className="hover:line-through hover:text-[#ff4d4d] dark:hover:text-[#FF4D00] transition-colors py-1"
            >
              Top
            </a>
            <a
              href="#features"
              className="hover:line-through hover:text-[#ff4d4d] dark:hover:text-[#FF4D00] transition-colors py-1"
            >
              Features
            </a>
            <a
              href="#orbital-3d"
              className="hover:line-through hover:text-[#ff4d4d] dark:hover:text-[#FF4D00] transition-colors py-1"
            >
              3D Rig
            </a>
            <a
              href="#telemetry"
              className="hover:line-through hover:text-[#ff4d4d] dark:hover:text-[#FF4D00] transition-colors py-1"
            >
              Telemetry
            </a>
            <a
              href="#systems"
              className="hover:line-through hover:text-[#ff4d4d] dark:hover:text-[#FF4D00] transition-colors py-1"
            >
              Systems
            </a>
            <a
              href="#protocols"
              className="hover:line-through hover:text-[#ff4d4d] dark:hover:text-[#FF4D00] transition-colors py-1"
            >
              Protocols
            </a>
            <button
              type="button"
              onClick={onToggleTheme}
              style={getWobblyBorderStyle('wobblySm')}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 border-2 border-[#2d2d2d] dark:border-[#FF4D00] bg-white dark:bg-black text-sm cursor-pointer hover:bg-[#e5e0d8] dark:hover:bg-[#FF4D00] dark:hover:text-black"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
                  <span>Paper Mode</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}
