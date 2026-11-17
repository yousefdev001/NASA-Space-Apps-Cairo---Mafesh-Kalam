import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Bell, LogOut, User as UserIcon, Shield, Radio } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { MetClock } from '../ui/MetClock';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-[#1E3A5F] bg-[#050B14]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
      {/* Brand & Mission Status */}
      <div className="flex items-center gap-4 sm:gap-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_12px_rgba(0,229,255,0.3)] group-hover:border-cyan-400">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-base tracking-wider text-white">AURAMED</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                BIO-ASTRO
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 hidden sm:block">NASA GROUND CONTROL SYS</p>
          </div>
        </Link>

        <div className="h-6 w-px bg-[#1E3A5F] hidden md:block" />

        {/* MET Clock */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">MET:</span>
          <MetClock size="sm" />
        </div>

        {/* Sync Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-md">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>DOWNLINK ACTIVE · 128 kbps</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <>
            {/* Unresolved Alert Badge */}
            <Link
              to="/alerts"
              className="relative p-2 rounded-lg bg-[#0B132B] border border-[#1E3A5F] text-slate-300 hover:text-cyan-400 hover:border-cyan-400 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-mono font-bold text-white flex items-center justify-center animate-pulse">
                2
              </span>
            </Link>

            {/* User Profile Badge */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#1E3A5F]">
              <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-300 font-mono text-xs font-bold">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-white leading-tight">{user.name}</p>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                    {user.roles[0]?.replace('_', ' ') || 'Specialist'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors ml-1"
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
