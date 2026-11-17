import React from 'react';
import { clsx } from 'clsx';
import { useThemeStore } from '../../store/themeStore';
import { getWobblyStyle, WobblyRadiusType } from '../sketchbook/sketchbookConstants';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'hud';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  radius?: WobblyRadiusType;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  radius,
  style,
  ...props
}) => {
  const { mode } = useThemeStore();
  const isPaper = mode === 'paper';
  const isDark = mode === 'dark';
  const isSketch = isPaper || isDark;

  const baseStyles = isSketch
    ? 'relative inline-flex items-center justify-center font-sketch-hand font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none'
    : 'relative inline-flex items-center justify-center font-mono font-medium rounded-lg transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none';

  const sizeStyles = {
    sm: isSketch ? 'px-3 py-1 text-sm gap-1.5' : 'px-3 py-1.5 text-xs gap-1.5',
    md: isSketch ? 'px-4.5 py-1.5 text-base gap-2' : 'px-4 py-2 text-sm gap-2',
    lg: isSketch ? 'px-6 py-2.5 text-lg gap-2.5' : 'px-6 py-3 text-base gap-2.5',
  };

  const getVariantStyles = () => {
    if (isPaper) {
      switch (variant) {
        case 'primary':
          return 'bg-[#ff4d4d] hover:bg-[#e03d3d] text-white border-2 border-[#2d2d2d] sketch-btn';
        case 'secondary':
          return 'bg-white hover:bg-[#fff9c4] text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn';
        case 'hud':
          return 'bg-[#2d5da1] hover:bg-[#23487c] text-white border-2 border-[#2d2d2d] sketch-btn';
        case 'danger':
          return 'bg-[#e03d3d] text-white border-2 border-[#2d2d2d] sketch-btn';
        case 'ghost':
          return 'bg-transparent hover:bg-[#e5e0d8] text-[#2d2d2d] border border-transparent';
      }
    } else if (isDark) {
      switch (variant) {
        case 'primary':
          return 'bg-[#FF4D00] hover:bg-white hover:text-black text-black border-2 border-white sketch-btn-orange';
        case 'secondary':
          return 'bg-[#0c0c10] hover:bg-black text-white border-2 border-[#FF4D00] sketch-btn-orange';
        case 'hud':
          return 'bg-black text-[#FF4D00] border-2 border-[#FF4D00] sketch-btn-orange';
        case 'danger':
          return 'bg-rose-600 text-white border-2 border-white sketch-btn-orange';
        case 'ghost':
          return 'bg-transparent hover:bg-[#18110c] text-white border border-transparent';
      }
    } else {
      switch (variant) {
        case 'primary':
          return 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-[0_0_15px_rgba(0,229,255,0.4)] active:scale-[0.98]';
        case 'secondary':
          return 'bg-[#0B132B] hover:bg-[#1E3A5F] text-cyan-400 border border-[#1E3A5F] hover:border-cyan-400 shadow-[0_0_10px_rgba(30,58,95,0.3)]';
        case 'hud':
          return 'bg-transparent border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_12px_rgba(0,229,255,0.3)]';
        case 'danger':
          return 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)] active:scale-[0.98]';
        case 'ghost':
          return 'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white';
      }
    }
  };

  const dynamicRadius = isSketch
    ? getWobblyStyle(radius || (size === 'sm' ? 'wobblyTag' : 'wobblySm'))
    : undefined;

  return (
    <button
      className={clsx(baseStyles, sizeStyles[size], getVariantStyles(), className)}
      style={{ ...dynamicRadius, ...style }}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
};
