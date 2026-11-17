import React from 'react';
import { clsx } from 'clsx';
import { StatusType } from '../../styles/tokens';

interface BadgeProps {
  status?: StatusType | 'info' | 'neutral';
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  status = 'neutral',
  children,
  className,
  pulse = false,
}) => {
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
