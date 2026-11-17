import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Clock } from 'lucide-react';

interface MetClockProps {
  launchDate?: string | Date;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MetClock: React.FC<MetClockProps> = ({
  launchDate,
  className,
  size = 'md',
}) => {
  const [formatted, setFormatted] = useState('T+00:00:00:00');

  useEffect(() => {
    // Default baseline launch timestamp if none provided (simulating active Artemis mission)
    const baseTime = launchDate ? new Date(launchDate).getTime() : Date.now() - 42 * 86400000 - 14 * 3600000;

    const updateClock = () => {
      const now = Date.now();
      const diffSeconds = Math.max(0, Math.floor((now - baseTime) / 1000));

      const days = Math.floor(diffSeconds / 86400);
      const hours = Math.floor((diffSeconds % 86400) / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;

      const pad = (n: number) => n.toString().padStart(2, '0');
      setFormatted(`T+${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [launchDate]);

  const sizeStyles = {
    sm: 'text-xs gap-1.5',
    md: 'text-sm gap-2',
    lg: 'text-lg gap-2.5',
  };

  return (
    <div
      className={clsx(
        'inline-flex items-center font-mono font-bold tracking-widest text-cyan-400 bg-[#050B14]/80 px-3 py-1.5 rounded-lg border border-[#1E3A5F] shadow-[0_0_10px_rgba(0,229,255,0.15)] select-none',
        sizeStyles[size],
        className
      )}
    >
      <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
      <span>{formatted}</span>
    </div>
  );
};
