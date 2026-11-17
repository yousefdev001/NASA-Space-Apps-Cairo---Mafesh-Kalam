import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Users,
  Compass,
  Activity,
  BrainCircuit,
  AlertTriangle,
  FileText,
  GraduationCap,
  ShieldCheck,
  LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types/auth.types';
import apiClient from '../../api/client';
import { clsx } from 'clsx';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
  permission?: string;
  roles?: UserRole[];
}

export const Sidebar: React.FC = () => {
  const { hasRole, hasPermission } = useAuthStore();
  const [unresolvedAlertsCount, setUnresolvedAlertsCount] = useState<number | null>(null);

  // Dynamically fetch unresolved alert count if operator has view_alerts permission
  useEffect(() => {
    if (!hasPermission('view_alerts')) return;

    let isMounted = true;
    apiClient
      .get('/alerts/unresolved-count')
      .then((res) => {
        if (isMounted && res.data?.data?.total_unresolved !== undefined) {
          setUnresolvedAlertsCount(res.data.data.total_unresolved);
        }
      })
      .catch(() => {
        // Fallback gracefully to default badge value on network/mock error
      });

    return () => {
      isMounted = false;
    };
  }, [hasPermission]);

  const navItems: NavItem[] = [
    {
      to: '/mission-control',
      label: 'Mission Control',
      icon: LayoutDashboard,
      badge: 'LIVE',
      permission: 'view_vital_readings',
    },
    {
      to: '/bio-twin',
      label: 'Bio-Digital Twin',
      icon: Sparkles,
      badge: '3D TWIN',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(0,229,255,0.25)]',
      permission: 'view_vital_readings',
    },
    {
      to: '/astronauts',
      label: 'Crew Roster',
      icon: Users,
      permission: 'view_astronauts',
    },
    {
      to: '/missions',
      label: 'Missions & EVA',
      icon: Compass,
      permission: 'view_missions',
    },
    {
      to: '/telemetry',
      label: 'Live Telemetry',
      icon: Activity,
      permission: 'view_vital_readings',
    },
    {
      to: '/ai-insights',
      label: 'AI Clinical Review',
      icon: BrainCircuit,
      badge: 'HITL',
      permission: 'view_ai_insights',
    },
    {
      to: '/alerts',
      label: 'Alert Triage',
      icon: AlertTriangle,
      badge: unresolvedAlertsCount !== null ? String(unresolvedAlertsCount) : '2',
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
      permission: 'view_alerts',
    },
    {
      to: '/reports',
      label: 'Reports & Forensic',
      icon: FileText,
      permission: 'view_reports',
    },
    {
      to: '/academy',
      label: 'Space Academy',
      icon: GraduationCap,
      permission: 'view_academy',
    },
    {
      to: '/audit',
      label: 'Audit Trail',
      icon: ShieldCheck,
      permission: 'view_audit_logs',
      roles: ['system_administrator', 'auditor_compliance'],
    },
  ];

  const visibleNavItems = navItems.filter((item) => {
    if (item.roles && !hasRole(item.roles)) {
      return false;
    }
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    return true;
  });

  return (
    <aside className="w-64 border-r border-[#1E3A5F] bg-[#050B14]/80 backdrop-blur-md flex flex-col h-full min-h-0 shrink-0 select-none">
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-1 overscroll-contain">
        <div className="px-3 py-2 text-[11px] font-mono tracking-widest text-slate-400 uppercase font-bold">
          MISSION SYSTEMS
        </div>

        {visibleNavItems.map((item) => {
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

      {/* System Status Footer in Sidebar (Fixed at bottom) */}
      <div className="p-4 border-t border-[#1E3A5F] bg-[#0B132B]/60 shrink-0 space-y-2">
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
