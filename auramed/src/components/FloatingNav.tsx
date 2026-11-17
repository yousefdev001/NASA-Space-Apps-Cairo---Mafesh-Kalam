import { useState } from 'react';
import { Download, Menu, Send, X } from 'lucide-react';
import { getWobblyBorderStyle } from '../styles/handDrawnTokens';
import { WavyUnderlineSvg } from './HandDrawnDecor';

interface FloatingNavProps {
  onOpenBriefing: () => void;
}

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Screenshots', href: '#screenshots' },
  { label: '3D Rig', href: '#orbital-3d' },
  { label: 'Telemetry', href: '#telemetry' },
  { label: 'Systems', href: '#systems' },
  { label: 'Deploy', href: '#cta' },
];

export function FloatingNav({ onOpenBriefing }: FloatingNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 pointer-events-none">
      {/* GSAP Scroll Progress Sketch Line */}
      <div
        data-gsap="scroll-progress"
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 h-[4px] bg-[#ff4d4d] dark:bg-[#FF4D00] origin-left scale-x-0 z-50"
      />
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-4 lg:gap-8">
        {/* Zone 1: Single-element Handwritten Wordmark */}
        <a
          href="#top"
          style={getWobblyBorderStyle('wobblySm')}
          className="pointer-events-auto font-display font-bold text-lg sm:text-xl lg:text-2xl leading-none text-[#2d2d2d] dark:text-black bg-[#fff9c4] dark:bg-[#FF4D00] px-3 py-2 sm:px-3.5 sm:py-2 border-[3px] border-[#2d2d2d] dark:border-white -rotate-1 sketch-shadow hover:rotate-1 transition-transform duration-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#2d5da1]"
        >
          AuraMed
        </a>

        {/* Zone 2: Wobbly Paper Navigation Bar */}
        <nav
          aria-label="Primary navigation"
          style={getWobblyBorderStyle('wobbly')}
          className="pointer-events-auto hidden md:flex items-center gap-3.5 lg:gap-5 bg-[#fdfbf7]/95 dark:bg-black/95 border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] px-4 lg:px-6 py-2 sketch-shadow"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative font-sans text-sm lg:text-base text-[#2d2d2d] dark:text-white hover:text-[#ff4d4d] dark:hover:text-[#FF4D00] transition-colors whitespace-nowrap shrink-0 py-0.5 focus-visible:outline-2 focus-visible:outline-[#2d5da1]"
            >
              <span>{link.label}</span>
              <span className="pointer-events-none absolute -bottom-1.5 left-0 right-0 text-[#ff4d4d] dark:text-[#FF4D00] opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                <WavyUnderlineSvg />
              </span>
            </a>
          ))}
        </nav>

        {/* Zone 3: Single Primary Action (+ Mobile Toggle) */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 shrink-0">
          <a
            href="/AuraMed.apk"
            download="AuraMed.apk"
            style={getWobblyBorderStyle('wobblySm')}
            className="hidden sm:inline-flex items-center justify-center gap-1.5 h-11 lg:h-12 bg-[#2d5da1] dark:bg-[#FF4D00] text-white dark:text-black border-[3px] border-[#2d2d2d] dark:border-white px-3.5 lg:px-4 font-sans text-sm lg:text-base font-bold hover:bg-[#ff4d4d] dark:hover:bg-white dark:hover:text-black sketch-btn whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" strokeWidth={2.5} />
            <span>Download APK</span>
          </a>
          <button
            type="button"
            onClick={onOpenBriefing}
            style={getWobblyBorderStyle('wobbly')}
            className="hidden sm:inline-flex items-center justify-center gap-2 h-11 lg:h-12 bg-white dark:bg-black text-[#2d2d2d] dark:text-white border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] px-4 lg:px-5 font-sans text-base lg:text-lg hover:bg-[#ff4d4d] hover:text-white dark:hover:bg-[#FF4D00] dark:hover:text-black sketch-btn whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2d5da1]"
          >
            <Send className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
            <span>Briefing</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            style={getWobblyBorderStyle('wobblySm')}
            className="md:hidden w-11 h-11 flex items-center justify-center bg-white dark:bg-black text-[#2d2d2d] dark:text-[#FF4D00] border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] sketch-btn cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Sketch Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          style={getWobblyBorderStyle('wobblyMd')}
          className="pointer-events-auto md:hidden mt-3 bg-[#fdfbf7] dark:bg-black text-[#2d2d2d] dark:text-white border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] p-4 flex flex-col gap-2.5 sketch-shadow-lg"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              style={getWobblyBorderStyle('wobblySm')}
              className="font-sans text-lg py-2.5 px-4 border-2 border-dashed border-[#2d2d2d] dark:border-white/30 hover:bg-[#fff9c4] dark:hover:bg-[#FF4D00] dark:hover:text-black transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/AuraMed.apk"
            download="AuraMed.apk"
            onClick={() => setMobileMenuOpen(false)}
            style={getWobblyBorderStyle('wobbly')}
            className="mt-1 h-12 flex items-center justify-center gap-2 font-sans font-bold text-lg bg-[#2d5da1] dark:bg-[#FF4D00] text-white dark:text-black border-[3px] border-[#2d2d2d] dark:border-white hover:bg-[#ff4d4d] sketch-btn text-center cursor-pointer"
          >
            <Download className="w-5 h-5" />
            <span>Download APK (111 MB)</span>
          </a>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenBriefing();
            }}
            style={getWobblyBorderStyle('wobblyAlt')}
            className="mt-1 h-12 font-sans text-lg bg-white dark:bg-black text-[#2d2d2d] dark:text-white border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] hover:bg-[#ff4d4d] hover:text-white dark:hover:bg-[#FF4D00] dark:hover:text-black sketch-btn text-center cursor-pointer"
          >
            Request Briefing
          </button>
        </nav>
      )}
    </header>
  );
}
