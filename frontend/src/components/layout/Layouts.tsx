import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const MissionControlLayout: React.FC = () => {
  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#050B14] text-[#E2E8F0] flex flex-col font-sans hud-grid">
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
  return (
    <div className="min-h-screen bg-[#050B14] text-[#E2E8F0] flex flex-col font-sans hud-grid">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-[#1E3A5F] bg-[#050B14] py-8 text-center text-xs font-mono text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 AURAMED — Space Health, Telemetry & Bio-Astronautics Platform · NASA Deep-Space STD-3001</p>
          <div className="flex items-center gap-4 text-slate-400">
            <a href="/academy" className="hover:text-cyan-400">Space Academy</a>
            <span>·</span>
            <a href="/articles" className="hover:text-cyan-400">Articles</a>
            <span>·</span>
            <a href="/login" className="hover:text-cyan-400">Flight Surgeon Portal</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
