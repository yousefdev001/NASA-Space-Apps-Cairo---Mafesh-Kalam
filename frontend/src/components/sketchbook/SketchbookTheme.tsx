import React from 'react';
import {
  WobblyRadiusType,
  getWobblyStyle,
  SketchbookMode,
} from './sketchbookConstants';

/**
 * Masking Tape Strip (from https://ro2ya-tech.com/)
 */
export const Tape: React.FC<{ className?: string; isDark?: boolean }> = ({ className = '', isDark = false }) => (
  <span
    aria-hidden="true"
    className={`pointer-events-none block w-20 h-6 -rotate-2 border ${
      isDark
        ? 'bg-[#FF4D00]/40 border-[#FF4D00]/70'
        : 'bg-[#e5e0d8]/85 border-[#2d2d2d]/30'
    } ${className}`}
    style={{ borderRadius: '4px 12px 6px 10px / 10px 4px 12px 6px' }}
  />
);

/**
 * Pushpin / Thumbtack (from https://ro2ya-tech.com/)
 */
export const PushPin: React.FC<{ className?: string; isDark?: boolean }> = ({ className = '', isDark = false }) => (
  <span
    aria-hidden="true"
    className={`pointer-events-none inline-flex items-center justify-center w-5 h-5 border-2 ${
      isDark
        ? 'bg-[#FF4D00] border-white shadow-[2px_2px_0px_0px_#000000]'
        : 'bg-[#ff4d4d] border-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d]'
    } ${className}`}
    style={getWobblyStyle('wobblyCircle')}
  >
    <span
      className="w-1.5 h-1.5 bg-white/95"
      style={getWobblyStyle('wobblyCircle')}
    />
  </span>
);

/**
 * Squiggly Hand-drawn Underline
 */
export const SquiggleUnderline: React.FC<{ className?: string }> = ({ className = '' }) => (
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

/**
 * Hand-drawn Dashed Arrow
 */
export const DashedArrow: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 120 56"
    fill="none"
    aria-hidden="true"
    className={`w-20 h-10 ${className}`}
  >
    <path
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

/**
 * Reusable Hand-drawn Sketch Card
 */
interface SketchCardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  rightAction?: React.ReactNode;
  decoration?: 'none' | 'tape' | 'pin';
  radius?: WobblyRadiusType;
  mode?: SketchbookMode;
  className?: string;
  badge?: React.ReactNode;
}

export const SketchCard: React.FC<SketchCardProps> = ({
  children,
  title,
  subtitle,
  rightAction,
  decoration = 'none',
  radius = 'wobblyMd',
  mode = 'paper',
  className = '',
  badge,
}) => {
  const isDark = mode === 'dark';

  return (
    <div
      style={getWobblyStyle(radius)}
      className={`relative transition-all duration-150 p-5 sm:p-6 ${
        isDark
          ? 'bg-[#0c0c10] text-white border-[3px] border-[#FF4D00] sketch-shadow-orange'
          : 'bg-white text-[#2d2d2d] border-[3px] border-[#2d2d2d] sketch-shadow'
      } ${className}`}
    >
      {/* Top Accessory */}
      {decoration === 'tape' && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <Tape isDark={isDark} />
        </div>
      )}
      {decoration === 'pin' && (
        <div className="absolute -top-2.5 left-5 z-10">
          <PushPin isDark={isDark} />
        </div>
      )}

      {/* Card Header (if title exists) */}
      {(title || subtitle || rightAction || badge) && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 mb-4 border-b-2 border-dashed ${
            isDark ? 'border-[#FF4D00]/40' : 'border-[#2d2d2d]/30'
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              {title && (
                <h3 className="font-display-kalam font-bold text-lg sm:text-xl tracking-wide">
                  {title}
                </h3>
              )}
              {badge}
            </div>
            {subtitle && (
              <p
                className={`font-sketch-hand text-sm sm:text-base leading-snug mt-0.5 ${
                  isDark ? 'text-white/70' : 'text-[#2d2d2d]/75'
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
          {rightAction && <div className="shrink-0">{rightAction}</div>}
        </div>
      )}

      {/* Card Content */}
      {children}
    </div>
  );
};

/**
 * Hand-drawn Tag / Badge
 */
interface SketchBadgeProps {
  children: React.ReactNode;
  variant?: 'nominal' | 'warning' | 'critical' | 'info' | 'neutral' | 'accent';
  mode?: SketchbookMode;
  className?: string;
}

export const SketchBadge: React.FC<SketchBadgeProps> = ({
  children,
  variant = 'neutral',
  mode = 'paper',
  className = '',
}) => {
  const isDark = mode === 'dark';

  const getColorClasses = () => {
    if (isDark) {
      switch (variant) {
        case 'nominal':
          return 'bg-emerald-950/80 text-emerald-300 border-emerald-400';
        case 'warning':
          return 'bg-[#fff9c4] text-black border-white font-bold';
        case 'critical':
          return 'bg-[#FF4D00] text-black border-white font-bold';
        case 'info':
        case 'accent':
          return 'bg-[#FF4D00]/25 text-[#FF4D00] border-[#FF4D00]';
        default:
          return 'bg-black text-white border-white/50';
      }
    } else {
      switch (variant) {
        case 'nominal':
          return 'bg-emerald-100 text-emerald-900 border-[#2d2d2d]';
        case 'warning':
          return 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d] font-bold';
        case 'critical':
          return 'bg-[#ff4d4d] text-white border-[#2d2d2d] font-bold';
        case 'info':
          return 'bg-[#2d5da1]/15 text-[#2d5da1] border-[#2d5da1]';
        case 'accent':
          return 'bg-[#ff4d4d]/15 text-[#ff4d4d] border-[#ff4d4d]';
        default:
          return 'bg-[#e5e0d8] text-[#2d2d2d] border-[#2d2d2d]';
      }
    }
  };

  return (
    <span
      style={getWobblyStyle('wobblyTag')}
      className={`inline-flex items-center gap-1 px-3 py-0.5 font-sketch-hand text-xs sm:text-sm border-2 tracking-wide whitespace-nowrap select-none ${getColorClasses()} ${className}`}
    >
      {children}
    </span>
  );
};
