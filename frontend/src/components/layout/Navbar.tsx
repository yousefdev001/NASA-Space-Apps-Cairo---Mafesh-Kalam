import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Bell, LogOut, Shield, Radio } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { getWobblyStyle } from '../sketchbook/sketchbookConstants';
import { MetClock } from '../ui/MetClock';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { mode, setMode } = useThemeStore();
  const navigate = useNavigate();

  const isPaper = mode === 'paper';
  const isDark = mode === 'dark';
  const isSketch = isPaper || isDark;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className={clsx(
        'h-16 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between transition-colors duration-200 select-none',
        isPaper
          ? 'bg-[#fdfbf7]/95 border-b-[2.5px] border-[#2d2d2d] text-[#2d2d2d]'
          : isDark
            ? 'bg-[#0c0c10]/95 border-b-[2.5px] border-[#FF4D00] text-white'
            : 'bg-[#050B14]/90 border-b border-[#1E3A5F] text-[#E2E8F0] backdrop-blur-md'
      )}
    >
      {/* Brand & Mission Status */}
      <div className="flex items-center gap-4 sm:gap-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div
            style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
            className={clsx(
              'w-9 h-9 border flex items-center justify-center transition-transform group-hover:scale-105',
              isPaper
                ? 'bg-white border-[#2d2d2d] text-[#2d5da1] shadow-sm'
                : isDark
                  ? 'bg-black border-[#FF4D00] text-[#FF4D00] shadow-[0_0_10px_rgba(255,77,0,0.3)]'
                  : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400 rounded-lg shadow-[0_0_12px_rgba(0,229,255,0.3)]'
            )}
          >
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={clsx(
                  'font-bold tracking-wider',
                  isSketch ? 'font-display-kalam text-lg sm:text-xl' : 'font-mono text-base text-white'
                )}
              >
                AURAMED
              </span>
              <span
                style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                className={clsx(
                  'text-[10px] font-bold px-1.5 py-0.2 border',
                  isPaper
                    ? 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d] font-sketch-hand'
                    : isDark
                      ? 'bg-[#FF4D00] text-black border-white font-sketch-hand'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 rounded font-mono'
                )}
              >
                BIO-ASTRO
              </span>
            </div>
            <p
              className={clsx(
                'text-[10px] hidden sm:block',
                isPaper ? 'text-[#2d2d2d]/70 font-sketch-hand' : isDark ? 'text-white/70 font-sketch-hand' : 'text-slate-400 font-mono'
              )}
            >
              NASA GROUND CONTROL SYS
            </p>
          </div>
        </Link>

        <div
          className={clsx(
            'h-6 w-px hidden md:block',
            isPaper ? 'bg-[#2d2d2d]/30' : isDark ? 'bg-[#FF4D00]/40' : 'bg-[#1E3A5F]'
          )}
        />

        {/* MET Clock */}
        <div className="hidden sm:flex items-center gap-2">
          <span
            className={clsx(
              'text-[11px] uppercase tracking-wider',
              isSketch ? 'font-sketch-hand text-xs font-bold' : 'font-mono text-slate-400'
            )}
          >
            MET:
          </span>
          <MetClock size="sm" />
        </div>

        {/* Sync Status Indicator */}
        <div
          style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
          className={clsx(
            'hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1 border',
            isPaper
              ? 'bg-emerald-100 text-emerald-950 border-[#2d2d2d] font-sketch-hand font-bold'
              : isDark
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 font-sketch-hand font-bold'
                : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30 rounded-md font-mono'
          )}
        >
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
          <span>DOWNLINK ACTIVE · 128 kbps</span>
        </div>
      </div>

      {/* Right Controls: Global Theme Switcher + Auth Buttons */}
      <div className="flex items-center gap-3">
        {/* Global 3-Way Theme Switcher */}
        <div
          className={clsx(
            'flex items-center gap-1 p-0.5 border rounded-lg',
            isPaper
              ? 'bg-[#e5e0d8]/80 border-[#2d2d2d]'
              : isDark
                ? 'bg-black border-[#FF4D00]'
                : 'bg-[#050B14] border-[#1E3A5F]'
          )}
        >
          <button
            type="button"
            onClick={() => setMode('paper')}
            title="AuraMed Paper Mode (Sketchbook)"
            style={mode === 'paper' ? getWobblyStyle('wobblyTag') : undefined}
            className={clsx(
              'px-2 py-0.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              mode === 'paper'
                ? 'bg-[#fff9c4] text-[#2d2d2d] border border-[#2d2d2d] font-sketch-hand shadow-sm'
                : isPaper
                  ? 'text-[#2d2d2d]/70 hover:text-black font-sketch-hand'
                  : 'text-slate-400 hover:text-white'
            )}
          >
            📜 Paper
          </button>
          <button
            type="button"
            onClick={() => setMode('dark')}
            title="AuraMed Mission Dark (Orange Sketch)"
            style={mode === 'dark' ? getWobblyStyle('wobblyTag') : undefined}
            className={clsx(
              'px-2 py-0.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              mode === 'dark'
                ? 'bg-[#FF4D00] text-black border border-white font-sketch-hand shadow-sm'
                : isPaper
                  ? 'text-[#2d2d2d]/70 hover:text-black font-sketch-hand'
                  : 'text-slate-400 hover:text-white'
            )}
          >
            📓 Dark
          </button>
          <button
            type="button"
            onClick={() => setMode('cyber')}
            title="NASA Cyber HUD"
            className={clsx(
              'px-2 py-0.5 text-xs font-mono font-bold transition-all cursor-pointer rounded whitespace-nowrap',
              mode === 'cyber'
                ? 'bg-cyan-500 text-black border border-cyan-400'
                : isPaper
                  ? 'text-[#2d2d2d]/70 hover:text-black font-sketch-hand'
                  : 'text-slate-400 hover:text-cyan-300'
            )}
          >
            🚀 Cyber
          </button>
        </div>

        {isAuthenticated && user ? (
          <>
            {/* Unresolved Alert Badge */}
            <Link
              to="/alerts"
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={clsx(
                'relative p-2 border transition-colors',
                isPaper
                  ? 'bg-white border-[#2d2d2d] text-[#2d2d2d] hover:bg-[#fff9c4]'
                  : isDark
                    ? 'bg-[#0c0c10] border-[#FF4D00] text-white hover:bg-[#18110c]'
                    : 'bg-[#0B132B] border-[#1E3A5F] text-slate-300 hover:text-cyan-400 hover:border-cyan-400 rounded-lg'
              )}
            >
              <Bell className="w-4 h-4" />
              <span
                style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-[10px] font-mono font-bold text-white flex items-center justify-center animate-pulse border border-[#2d2d2d]"
              >
                2
              </span>
            </Link>

            {/* User Profile Badge */}
            <div
              className={clsx(
                'flex items-center gap-2.5 pl-2 border-l',
                isPaper ? 'border-[#2d2d2d]/30' : isDark ? 'border-[#FF4D00]/40' : 'border-[#1E3A5F]'
              )}
            >
              <div
                style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
                className={clsx(
                  'w-8 h-8 border flex items-center justify-center font-bold text-xs',
                  isPaper
                    ? 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d] font-sketch-hand'
                    : isDark
                      ? 'bg-[#FF4D00] text-black border-white font-sketch-hand'
                      : 'bg-cyan-950 border-cyan-500/50 text-cyan-300 font-mono rounded-full'
                )}
              >
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p
                  className={clsx(
                    'text-xs font-semibold leading-tight',
                    isPaper ? 'text-[#2d2d2d] font-sketch-hand text-sm' : isDark ? 'text-white font-sketch-hand text-sm' : 'text-white'
                  )}
                >
                  {user.name}
                </p>
                <div className="flex items-center gap-1">
                  <Shield
                    className={clsx(
                      'w-3 h-3',
                      isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'
                    )}
                  />
                  <span
                    className={clsx(
                      'text-[10px] uppercase tracking-wider',
                      isPaper
                        ? 'text-[#2d5da1] font-sketch-hand font-bold'
                        : isDark
                          ? 'text-[#FF4D00] font-sketch-hand font-bold'
                          : 'text-cyan-400 font-mono'
                    )}
                  >
                    {user.roles[0]?.replace('_', ' ') || 'Specialist'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className={clsx(
                  'p-1.5 transition-colors ml-1 cursor-pointer',
                  isPaper
                    ? 'text-[#2d2d2d] hover:text-rose-600'
                    : isDark
                      ? 'text-white hover:text-[#FF4D00]'
                      : 'text-slate-400 hover:text-rose-400'
                )}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/academy">
              <Button variant="ghost" size="sm">
                Academy
              </Button>
            </Link>
            <Link to="/articles">
              <Button variant="ghost" size="sm">
                Articles
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="primary" size="sm">
                Mission Login
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
