import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Compass,
  Activity,
  BrainCircuit,
  AlertTriangle,
  FileText,
  GraduationCap,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();

  const navItems = [
    {
      to: '/mission-control',
      label: 'Mission Control',
      icon: LayoutDashboard,
      badge: 'LIVE',
    },
    {
      to: '/astronauts',
      label: 'Crew Roster',
      icon: Users,
    },
    {
      to: '/missions',
      label: 'Missions & EVA',
      icon: Compass,
    },
    {
      to: '/telemetry',
      label: 'Live Telemetry',
      icon: Activity,
    },
    {
      to: '/ai-insights',
      label: 'AI Clinical Review',
      icon: BrainCircuit,
      badge: 'HITL',
    },
    {
      to: '/alerts',
      label: 'Alert Triage',
      icon: AlertTriangle,
      badge: '2',
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
    },
    {
      to: '/reports',
      label: 'Reports & Forensic',
      icon: FileText,
    },
    {
      to: '/academy',
      label: 'Space Academy',
      icon: GraduationCap,
    },
    {
      to: '/audit',
      label: 'Audit & Hash Chain',
      icon: ShieldCheck,
      roles: ['system_administrator', 'auditor_compliance'],
    },
  ];

  return (
    <aside className="w-64 border-r border-[#1E3A5F] bg-[#050B14]/70 backdrop-blur-md flex flex-col justify-between shrink-0 select-none">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-mono tracking-widest text-slate-400 uppercase font-bold">
          MISSION SYSTEMS
        </div>

        {navItems
          .filter((item) => {
            if (!item.roles) return true;
            return item.roles.some((r) => user?.roles.includes(r as any));
          })
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                      : 'text-slate-300 hover:bg-[#0B132B] hover:text-white border border-transparent'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={clsx(
                      'text-[10px] font-mono px-2 py-0.5 rounded-full font-bold',
                      item.badgeColor || 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
      </div>

      {/* System Status Footer in Sidebar */}
      <div className="p-4 border-t border-[#1E3A5F] bg-[#0B132B]/40 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">STATUS:</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            TIER-4 OPERATIONAL
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>LATENCY:</span>
          <span className="text-cyan-300">142ms Downlink</span>
        </div>
      </div>
    </aside>
  );
};
