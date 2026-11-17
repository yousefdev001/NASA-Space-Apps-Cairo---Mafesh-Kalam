import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  headerAction?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const Card: React.FC<CardProps> = ({
  glow = false,
  title,
  subtitle,
  headerAction,
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'rounded-xl border transition-all duration-200',
        glow ? 'glass-panel-glow' : 'glass-panel',
        className
      )}
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
