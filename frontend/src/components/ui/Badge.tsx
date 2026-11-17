import React from 'react';
import { clsx } from 'clsx';
import { StatusType } from '../../styles/tokens';

interface BadgeProps {
  status?: StatusType | 'info' | 'neutral';
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
  themeMode?: 'cyber' | 'paper' | 'dark';
}

export const Badge: React.FC<BadgeProps> = ({
  status = 'neutral',
  children,
  className,
  pulse = false,
  themeMode = 'cyber',
}) => {
  const isPaper = themeMode === 'paper';
  const isDark = themeMode === 'dark';
  const isSketch = isPaper || isDark;

  if (isSketch) {
    const getSketchClasses = () => {
      if (isPaper) {
        switch (status) {
          case 'nominal':
            return 'bg-emerald-100 text-emerald-950 border-[#2d2d2d]';
          case 'warning':
            return 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d] font-bold';
          case 'critical':
            return 'bg-[#ff4d4d] text-white border-[#2d2d2d] font-bold';
          case 'info':
            return 'bg-[#2d5da1]/15 text-[#2d5da1] border-[#2d5da1]';
          default:
            return 'bg-[#e5e0d8] text-[#2d2d2d] border-[#2d2d2d]';
        }
      } else {
        switch (status) {
          case 'nominal':
            return 'bg-emerald-950/80 text-emerald-300 border-emerald-400';
          case 'warning':
            return 'bg-[#fff9c4] text-black border-white font-bold';
          case 'critical':
            return 'bg-[#FF4D00] text-black border-white font-bold';
          case 'info':
            return 'bg-[#FF4D00]/25 text-[#FF4D00] border-[#FF4D00]';
          default:
            return 'bg-black text-white border-white/50';
        }
      }
    };

    return (
      <span
        style={{ borderRadius: '22px 8px 26px 10px / 10px 20px 8px 24px' }}
        className={clsx(
          'inline-flex items-center gap-1.5 px-3 py-0.5 text-xs font-sketch-hand border-2 font-bold tracking-wide uppercase select-none',
          getSketchClasses(),
          pulse && 'animate-pulse',
          className
        )}
      >
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full',
            status === 'nominal'
              ? 'bg-emerald-500'
              : status === 'warning'
                ? 'bg-amber-500'
                : status === 'critical'
                  ? 'bg-rose-500'
                  : 'bg-current'
          )}
        />
        {children}
      </span>
    );
  }

  const statusStyles: Record<string, string> = {
    nominal: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]',
    warning: 'bg-amber-950/60 text-amber-400 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
    critical: 'bg-rose-950/60 text-rose-400 border-rose-500/40 shadow-[0_0_8px_rgba(239,68,68,0.2)] animate-pulse',
    info: 'bg-cyan-950/60 text-cyan-400 border-cyan-500/40 shadow-[0_0_8px_rgba(0,229,255,0.2)]',
    neutral: 'bg-slate-800/60 text-slate-300 border-slate-700',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border tracking-wide uppercase',
        statusStyles[status] || statusStyles.neutral,
        pulse && 'animate-pulse',
        className
      )}
    >
      <span
        className={clsx('w-1.5 h-1.5 rounded-full', {
          'bg-emerald-400': status === 'nominal',
          'bg-amber-400': status === 'warning',
          'bg-rose-400': status === 'critical',
          'bg-cyan-400': status === 'info',
          'bg-slate-400': status === 'neutral',
        })}
      />
      {children}
    </span>
  );
};
