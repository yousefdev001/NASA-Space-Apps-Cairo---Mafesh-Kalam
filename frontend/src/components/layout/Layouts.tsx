import React from 'react';
import { Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useThemeStore } from '../../store/themeStore';

export const MissionControlLayout: React.FC = () => {
  const { mode } = useThemeStore();
  const isPaper = mode === 'paper';
  const isDark = mode === 'dark';

  return (
    <div
      className={clsx(
        'h-screen max-h-screen overflow-hidden flex flex-col transition-colors duration-200',
        isPaper
          ? 'bg-[#fdfbf7] text-[#2d2d2d] paper-grain font-sketch-hand'
          : isDark
            ? 'bg-[#000000] text-white paper-grain-dark font-sketch-hand'
            : 'bg-[#050B14] text-[#E2E8F0] hud-grid font-sans'
      )}
    >
      <Navbar />
      <div className="flex-1 flex overflow-hidden min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 lg:p-8 overscroll-contain focus:outline-none">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export const PublicLayout: React.FC = () => {
  const { mode } = useThemeStore();
  const isPaper = mode === 'paper';
  const isDark = mode === 'dark';

  return (
    <div
      className={clsx(
        'min-h-screen flex flex-col transition-colors duration-200',
        isPaper
          ? 'bg-[#fdfbf7] text-[#2d2d2d] paper-grain font-sketch-hand'
          : isDark
            ? 'bg-[#000000] text-white paper-grain-dark font-sketch-hand'
            : 'bg-[#050B14] text-[#E2E8F0] hud-grid font-sans'
      )}
    >
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer
        className={clsx(
          'py-8 text-center text-xs transition-colors duration-200',
          isPaper
            ? 'border-t-2 border-dashed border-[#2d2d2d] bg-[#fdfbf7] text-[#2d2d2d] font-sketch-hand text-sm'
            : isDark
              ? 'border-t-2 border-dashed border-[#FF4D00] bg-black text-white font-sketch-hand text-sm'
              : 'border-t border-[#1E3A5F] bg-[#050B14] font-mono text-slate-500'
        )}
      >
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © 2026 AURAMED — Space Health, Telemetry & Bio-Astronautics Platform · NASA Deep-Space
            STD-3001
          </p>
          <div
            className={clsx(
              'flex items-center gap-4',
              isPaper ? 'text-[#2d5da1] font-bold' : isDark ? 'text-[#FF4D00] font-bold' : 'text-slate-400'
            )}
          >
            <a
              href="/academy"
              className={isPaper ? 'hover:text-[#ff4d4d]' : isDark ? 'hover:text-white' : 'hover:text-cyan-400'}
            >
              Space Academy
            </a>
            <span>·</span>
            <a
              href="/articles"
              className={isPaper ? 'hover:text-[#ff4d4d]' : isDark ? 'hover:text-white' : 'hover:text-cyan-400'}
            >
              Articles
            </a>
            <span>·</span>
            <a
              href="/login"
              className={isPaper ? 'hover:text-[#ff4d4d]' : isDark ? 'hover:text-white' : 'hover:text-cyan-400'}
            >
              Flight Surgeon Portal
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
