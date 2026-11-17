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
import { useThemeStore } from '../../store/themeStore';
import { getWobblyStyle } from '../sketchbook/sketchbookConstants';
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

  const { mode } = useThemeStore();
  const isPaper = mode === 'paper';
  const isDark = mode === 'dark';
  const isSketch = isPaper || isDark;

  return (
    <aside
      className={clsx(
        'w-64 flex flex-col h-full min-h-0 shrink-0 select-none transition-colors duration-200',
        isPaper
          ? 'bg-[#fdfbf7] border-r-[2.5px] border-[#2d2d2d] text-[#2d2d2d]'
          : isDark
            ? 'bg-[#0c0c10] border-r-[2.5px] border-[#FF4D00] text-white'
            : 'bg-[#050B14]/80 border-r border-[#1E3A5F] text-[#E2E8F0] backdrop-blur-md'
      )}
    >
      <div className="flex-1 overflow-y-auto min-h-0 p-3.5 space-y-1.5 overscroll-contain">
        <div
          className={clsx(
            'px-3 py-2 text-xs uppercase tracking-widest font-bold',
            isPaper
              ? 'text-[#2d5da1] font-sketch-hand text-sm'
              : isDark
                ? 'text-[#FF4D00] font-sketch-hand text-sm'
                : 'text-slate-400 font-mono text-[11px]'
          )}
        >
          MISSION SYSTEMS
        </div>

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) =>
                isSketch && isActive ? getWobblyStyle('wobblySm') : undefined
              }
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between px-3.5 py-2.5 transition-all duration-150',
                  isPaper
                    ? isActive
                      ? 'bg-[#fff9c4] text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-shadow font-sketch-hand font-bold text-base'
                      : 'text-[#2d2d2d]/80 hover:bg-[#e5e0d8] font-sketch-hand text-base rounded-lg border border-transparent'
                    : isDark
                      ? isActive
                        ? 'bg-[#18110c] text-[#FF4D00] border-2 border-[#FF4D00] sketch-shadow-orange font-sketch-hand font-bold text-base'
                        : 'text-white/80 hover:bg-black font-sketch-hand text-base rounded-lg border border-transparent'
                      : isActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,229,255,0.15)] rounded-lg text-sm font-medium'
                        : 'text-slate-300 hover:bg-[#0B132B] hover:text-white border border-transparent rounded-lg text-sm font-medium'
                )
              }
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={clsx(
                    'w-4 h-4',
                    isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                  className={clsx(
                    'text-[10px] px-2 py-0.5 font-bold',
                    isPaper
                      ? 'bg-white text-[#2d2d2d] border border-[#2d2d2d] font-sketch-hand'
                      : isDark
                        ? 'bg-black text-[#FF4D00] border border-white font-sketch-hand'
                        : item.badgeColor || 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono rounded-full'
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
      <div
        className={clsx(
          'p-3.5 border-t shrink-0 space-y-2',
          isPaper
            ? 'bg-[#e5e0d8]/40 border-[#2d2d2d]/30 text-[#2d2d2d]'
            : isDark
              ? 'bg-black/40 border-[#FF4D00]/40 text-white'
              : 'bg-[#0B132B]/60 border-[#1E3A5F] text-[#E2E8F0]'
        )}
      >
        <div
          className={clsx(
            'flex items-center justify-between text-xs',
            isSketch ? 'font-sketch-hand text-sm' : 'font-mono'
          )}
        >
          <span className={isPaper ? 'text-[#2d2d2d]/70' : 'text-slate-400'}>STATUS:</span>
          <span
            className={clsx(
              'font-bold flex items-center gap-1.5',
              isPaper ? 'text-emerald-800' : 'text-emerald-400'
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            TIER-4 OPERATIONAL
          </span>
        </div>
        <div
          className={clsx(
            'flex items-center justify-between text-xs',
            isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-[11px] text-slate-400'
          )}
        >
          <span>LATENCY:</span>
          <span className={clsx('font-bold', isPaper ? 'text-[#2d5da1]' : 'text-cyan-300')}>
            142ms Downlink
          </span>
        </div>
      </div>
    </aside>
  );
};
