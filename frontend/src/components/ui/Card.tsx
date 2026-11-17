import React from 'react';
import { clsx } from 'clsx';
import { Tape, PushPin } from '../sketchbook/SketchbookTheme';
import { getWobblyStyle, WobblyRadiusType } from '../sketchbook/sketchbookConstants';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  headerAction?: React.ReactNode;
  title?: string;
  subtitle?: string;
  themeMode?: 'cyber' | 'paper' | 'dark';
  decoration?: 'none' | 'tape' | 'pin';
  radius?: WobblyRadiusType;
}

export const Card: React.FC<CardProps> = ({
  glow = false,
  title,
  subtitle,
  headerAction,
  children,
  className,
  themeMode = 'cyber',
  decoration = 'none',
  radius = 'wobblyMd',
  style,
  ...props
}) => {
  const isPaper = themeMode === 'paper';
  const isDark = themeMode === 'dark';
  const isSketch = isPaper || isDark;

  if (isSketch) {
    return (
      <div
        style={{
          ...getWobblyStyle(radius),
          ...style,
        }}
        className={clsx(
          'relative border-[3px] transition-all duration-150',
          isPaper
            ? 'bg-white text-[#2d2d2d] border-[#2d2d2d] sketch-shadow'
            : 'bg-[#0c0c10] text-white border-[#FF4D00] sketch-shadow-orange',
          className
        )}
        {...props}
      >
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

        {(title || headerAction) && (
          <div
            className={clsx(
              'flex items-center justify-between px-5 py-3.5 border-b-2 border-dashed',
              isPaper ? 'border-[#2d2d2d]/30' : 'border-[#FF4D00]/40'
            )}
          >
            <div>
              {title && (
                <h3
                  className={clsx(
                    'font-display-kalam font-bold text-base sm:text-lg tracking-wide',
                    isPaper ? 'text-[#2d2d2d]' : 'text-white'
                  )}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  className={clsx(
                    'font-sketch-hand text-xs sm:text-sm mt-0.5',
                    isPaper ? 'text-[#2d2d2d]/75' : 'text-white/70'
                  )}
                >
                  {subtitle}
                </p>
              )}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'rounded-xl border transition-all duration-200',
        glow ? 'glass-panel-glow' : 'glass-panel',
        className
      )}
      style={style}
      {...props}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E3A5F]">
          <div>
            {title && (
              <h3 className="text-sm font-mono font-bold tracking-wider uppercase text-cyan-400">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};
