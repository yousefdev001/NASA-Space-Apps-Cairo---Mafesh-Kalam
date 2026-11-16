import type { ReactNode } from 'react';
import { getWobblyBorderStyle, type WOBBLY_RADII } from '../styles/handDrawnTokens';

export function TapeStrip({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none block w-20 h-6 bg-[#e5e0d8]/85 dark:bg-[#FF4D00]/40 border border-[#2d2d2d]/30 dark:border-[#FF4D00]/60 -rotate-2 ${className}`}
      style={{ borderRadius: '4px 12px 6px 10px / 10px 4px 12px 6px' }}
    />
  );
}

export function ThumbtackPin({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-flex items-center justify-center w-5 h-5 bg-[#ff4d4d] dark:bg-[#FF4D00] border-2 border-[#2d2d2d] dark:border-white shadow-[2px_2px_0px_0px_#2d2d2d] dark:shadow-[2px_2px_0px_0px_#000000] ${className}`}
      style={getWobblyBorderStyle('wobblyCircle')}
    >
      <span className="w-1.5 h-1.5 bg-white/90" style={getWobblyBorderStyle('wobblyCircle')} />
    </span>
  );
}

export function WavyUnderlineSvg({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 12"
      fill="none"
      aria-hidden="true"
      className={`w-full h-2.5 overflow-visible ${className}`}
    >
      <path
        d="M 2 7 Q 15 2, 30 7 T 60 7 T 90 7 T 118 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HandDrawnArrowSvg({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 56"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        data-gsap="hero-arrow-path"
        d="M 8 10 C 36 4, 66 38, 104 34"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeDasharray="6 5"
        strokeLinecap="round"
      />
      <path
        d="M 92 24 L 108 34 L 93 45"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SquigglyConnectorSvg({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 44"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
    >
      <path
        data-gsap="squiggle-path"
        d="M 20 22 C 95 4, 150 40, 230 22 C 310 4, 370 38, 450 20 C 530 2, 600 40, 680 22 C 725 12, 760 20, 784 22"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="8 7"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface SketchCardProps {
  children: ReactNode;
  decoration?: 'tape' | 'tack' | 'none';
  radius?: keyof typeof WOBBLY_RADII;
  className?: string;
}

export function SketchCard({
  children,
  decoration = 'none',
  radius = 'wobblyMd',
  className = '',
}: SketchCardProps) {
  return (
    <div
      className={`relative bg-white dark:bg-[#0c0c10] text-[#2d2d2d] dark:text-white border-2 border-[#2d2d2d] dark:border-[#FF4D00] sketch-shadow-card transition-transform duration-100 ${className}`}
      style={getWobblyBorderStyle(radius)}
    >
      {decoration === 'tape' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <TapeStrip />
        </div>
      )}
      {decoration === 'tack' && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
          <ThumbtackPin />
        </div>
      )}
      {children}
    </div>
  );
}
