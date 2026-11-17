import React from 'react';
import { clsx } from 'clsx';
import {
  Heart,
  Wind,
  Radio,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { BioTwinCrewMember, BioTwinSummary, OrganStatusFilter } from '../../types/biotwin.types';
import { useThemeStore } from '../../store/themeStore';
import { getWobblyStyle } from '../sketchbook/sketchbookConstants';
import { Tape, PushPin } from '../sketchbook/SketchbookTheme';

interface BioTwinCrewHeaderProps {
  selectedCrewId: number;
  onSelectCrew: (id: number) => void;
  crewMembers: BioTwinCrewMember[];
  currentStatusFilter: OrganStatusFilter;
  onStatusFilterChange: (filter: OrganStatusFilter) => void;
  summary?: BioTwinSummary;
  organCounts?: {
    all: number;
    nominal: number;
    warning: number;
    critical: number;
  };
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const BioTwinCrewHeader: React.FC<BioTwinCrewHeaderProps> = ({
  selectedCrewId,
  onSelectCrew,
  crewMembers,
  currentStatusFilter,
  onStatusFilterChange,
  summary,
  organCounts = { all: 12, nominal: 10, warning: 2, critical: 0 },
  onRefresh,
  isRefreshing = false,
}) => {
  const { mode } = useThemeStore();
  const isPaper = mode === 'paper';
  const isDark = mode === 'dark';
  const isSketch = isPaper || isDark;

  const selectedMember = crewMembers.find((c) => c.id === selectedCrewId) || crewMembers[0];

  const getStatusColor = (status: 'nominal' | 'warning' | 'critical') => {
    if (isPaper) {
      switch (status) {
        case 'nominal':
          return {
            border: 'border-[#2d2d2d]',
            bg: 'bg-emerald-100',
            text: 'text-emerald-900',
            dot: 'bg-emerald-600',
            glow: '',
          };
        case 'warning':
          return {
            border: 'border-[#2d2d2d]',
            bg: 'bg-[#fff9c4]',
            text: 'text-[#2d2d2d]',
            dot: 'bg-amber-600 animate-pulse',
            glow: '',
          };
        case 'critical':
          return {
            border: 'border-[#2d2d2d]',
            bg: 'bg-[#ff4d4d]',
            text: 'text-white',
            dot: 'bg-white animate-ping',
            glow: '',
          };
      }
    }

    if (isDark) {
      switch (status) {
        case 'nominal':
          return {
            border: 'border-emerald-500/70',
            bg: 'bg-emerald-950/70',
            text: 'text-emerald-300',
            dot: 'bg-emerald-400',
            glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]',
          };
        case 'warning':
          return {
            border: 'border-[#FF4D00]',
            bg: 'bg-[#fff9c4]',
            text: 'text-black font-bold',
            dot: 'bg-amber-500 animate-pulse',
            glow: 'shadow-[0_0_10px_rgba(255,77,0,0.35)]',
          };
        case 'critical':
          return {
            border: 'border-white',
            bg: 'bg-[#FF4D00]',
            text: 'text-black font-bold',
            dot: 'bg-white animate-ping',
            glow: 'shadow-[0_0_12px_rgba(255,77,0,0.5)]',
          };
      }
    }

    switch (status) {
      case 'nominal':
        return {
          border: 'border-emerald-500/40',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          dot: 'bg-emerald-400',
          glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
        };
      case 'warning':
        return {
          border: 'border-amber-500/50',
          bg: 'bg-amber-500/15',
          text: 'text-amber-400',
          dot: 'bg-amber-400 animate-pulse',
          glow: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]',
        };
      case 'critical':
        return {
          border: 'border-red-500/60',
          bg: 'bg-red-500/20',
          text: 'text-red-400',
          dot: 'bg-red-500 animate-ping',
          glow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]',
        };
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Top Banner: Module Identity & Telemetry Sync Ribbon */}
      <div
        style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
        className={clsx(
          'relative overflow-hidden p-3.5 sm:p-5 transition-all duration-200',
          isPaper
            ? 'bg-white text-[#2d2d2d] border-[3px] border-[#2d2d2d] sketch-shadow font-sketch-hand'
            : isDark
              ? 'bg-[#0c0c10] text-white border-[3px] border-[#FF4D00] sketch-shadow-orange font-sketch-hand'
              : 'rounded-2xl border border-cyan-500/30 bg-[#0B132B]/85 backdrop-blur-xl shadow-[0_0_25px_rgba(0,229,255,0.08)]'
        )}
      >
        {/* Sketch Tape Decoration */}
        {isSketch && (
          <div className="absolute -top-3 left-8 z-20 pointer-events-none">
            <Tape isDark={isDark} />
          </div>
        )}

        {/* Ambient background for Cyber mode */}
        {!isSketch && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
          </>
        )}

        <div className="relative z-10 flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start sm:items-center gap-3">
            <div
              style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
              className={clsx(
                'flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center border transition-transform duration-200',
                isPaper
                  ? 'border-2 border-[#2d2d2d] bg-[#fff9c4] text-[#2d5da1] sketch-shadow-sm'
                  : isDark
                    ? 'border-2 border-[#FF4D00] bg-black text-[#FF4D00] sketch-shadow-orange-sm'
                    : 'rounded-xl border border-cyan-400/40 bg-cyan-950/40 text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.25)]'
              )}
            >
              <Sparkles
                className={clsx(
                  'h-5 w-5 sm:h-6 sm:w-6',
                  isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'animate-pulse text-cyan-300'
                )}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                  className={clsx(
                    'px-2.5 py-0.5 text-[9px] font-bold tracking-widest uppercase border',
                    isPaper
                      ? 'border-[#2d2d2d] bg-[#2d5da1] text-white font-sketch-hand'
                      : isDark
                        ? 'border-[#FF4D00] bg-[#FF4D00] text-black font-sketch-hand'
                        : 'rounded-md border border-cyan-400/50 bg-cyan-500/15 font-mono text-cyan-300'
                  )}
                >
                  BIO-DIGITAL TWIN · 3D AVATAR
                </span>
                <span
                  className={clsx(
                    'flex items-center gap-1 text-[10px] font-bold',
                    isPaper
                      ? 'text-emerald-800 font-sketch-hand'
                      : isDark
                        ? 'text-emerald-400 font-sketch-hand'
                        : 'font-mono text-emerald-400'
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  REALTIME 500Hz DOWNLINK ACTIVE
                </span>
              </div>
              <h1
                className={clsx(
                  'mt-1 tracking-tight flex items-center gap-2',
                  isSketch
                    ? 'font-display-kalam font-bold text-xl sm:text-2xl'
                    : 'text-base sm:text-xl font-mono font-black text-white'
                )}
              >
                Holographic Humanoid Anatomical Diagnostic
              </h1>
              <p
                className={clsx(
                  'text-xs leading-relaxed',
                  isPaper
                    ? 'text-[#2d2d2d]/80 font-sketch-hand'
                    : isDark
                      ? 'text-white/70 font-sketch-hand'
                      : 'text-[11px] font-mono text-slate-400'
                )}
              >
                Deep-Space Microgravity Deconditioning & Multi-Organ Bio-Impedance Telemetry · NASA STD-3001
              </p>
            </div>
          </div>

          {/* Realtime Live Vitals Readout of Active Astronaut */}
          {selectedMember && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* HR Card */}
              <div
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'flex items-center gap-2.5 px-3 py-1.5 border transition-all',
                  isPaper
                    ? 'border-2 border-[#2d2d2d] bg-[#fdfbf7] text-[#2d2d2d] sketch-shadow-sm font-sketch-hand'
                    : isDark
                      ? 'border-2 border-[#FF4D00] bg-black text-white sketch-shadow-orange-sm font-sketch-hand'
                      : 'rounded-xl border border-[#1E3A5F] bg-[#050B14]/80'
                )}
              >
                <div
                  style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
                  className={clsx(
                    'flex h-7 w-7 items-center justify-center shrink-0',
                    isPaper
                      ? 'bg-rose-100 text-rose-600 border border-[#2d2d2d]'
                      : isDark
                        ? 'bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]'
                        : 'rounded-lg bg-red-500/15 text-red-400'
                  )}
                >
                  <Heart className="h-3.5 w-3.5 animate-bounce" />
                </div>
                <div>
                  <div
                    className={clsx(
                      'text-[9px] font-semibold uppercase',
                      isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'font-mono text-slate-400'
                    )}
                  >
                    Live Heart Rate
                  </div>
                  <div
                    className={clsx(
                      'text-xs sm:text-sm font-black',
                      isSketch ? 'font-sketch-hand' : 'font-mono text-white'
                    )}
                  >
                    {selectedMember.hr}{' '}
                    <span
                      className={clsx(
                        'text-[10px] font-normal',
                        isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'text-slate-400'
                      )}
                    >
                      BPM
                    </span>
                  </div>
                </div>
              </div>

              {/* SpO2 Card */}
              <div
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'flex items-center gap-2.5 px-3 py-1.5 border transition-all',
                  isPaper
                    ? 'border-2 border-[#2d2d2d] bg-[#fdfbf7] text-[#2d2d2d] sketch-shadow-sm font-sketch-hand'
                    : isDark
                      ? 'border-2 border-[#FF4D00] bg-black text-white sketch-shadow-orange-sm font-sketch-hand'
                      : 'rounded-xl border border-[#1E3A5F] bg-[#050B14]/80'
                )}
              >
                <div
                  style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
                  className={clsx(
                    'flex h-7 w-7 items-center justify-center shrink-0',
                    isPaper
                      ? 'bg-blue-100 text-[#2d5da1] border border-[#2d2d2d]'
                      : isDark
                        ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-400'
                        : 'rounded-lg bg-cyan-500/15 text-cyan-400'
                  )}
                >
                  <Wind className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div
                    className={clsx(
                      'text-[9px] font-semibold uppercase',
                      isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'font-mono text-slate-400'
                    )}
                  >
                    Blood Oxygen
                  </div>
                  <div
                    className={clsx(
                      'text-xs sm:text-sm font-black',
                      isPaper
                        ? 'font-sketch-hand text-[#2d5da1]'
                        : isDark
                          ? 'font-sketch-hand text-cyan-300'
                          : 'font-mono text-cyan-300'
                    )}
                  >
                    {selectedMember.spo2}
                    <span
                      className={clsx(
                        'text-[10px] font-normal',
                        isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'text-slate-400'
                      )}
                    >
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Twin Overall Health Index */}
              {summary && (
                <div
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'flex items-center gap-2.5 px-3 py-1.5 border transition-all',
                    isPaper
                      ? 'border-2 border-[#2d2d2d] bg-[#fff9c4] text-[#2d2d2d] sketch-shadow-sm font-sketch-hand'
                      : isDark
                        ? 'border-2 border-[#FF4D00] bg-[#1a0f08] text-white sketch-shadow-orange-sm font-sketch-hand'
                        : 'rounded-xl border border-cyan-500/30 bg-cyan-950/25 shadow-[0_0_15px_rgba(0,229,255,0.1)]'
                  )}
                >
                  <div
                    style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
                    className={clsx(
                      'flex h-7 w-7 items-center justify-center shrink-0',
                      isPaper
                        ? 'bg-white text-emerald-700 border border-[#2d2d2d]'
                        : isDark
                          ? 'bg-black text-[#FF4D00] border border-[#FF4D00]'
                          : 'rounded-lg bg-cyan-500/20 text-cyan-300'
                    )}
                  >
                    <Activity className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div
                      className={clsx(
                        'text-[9px] font-semibold uppercase',
                        isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'font-mono text-cyan-300'
                      )}
                    >
                      Twin Health Score
                    </div>
                    <div
                      className={clsx(
                        'text-xs sm:text-sm font-black',
                        isSketch ? 'font-sketch-hand' : 'font-mono text-white'
                      )}
                    >
                      {summary.overallHealthScore}%
                      <span
                        className={clsx(
                          'ml-1 text-[10px] font-bold uppercase',
                          isPaper ? 'text-emerald-700' : isDark ? 'text-emerald-400' : 'text-emerald-400'
                        )}
                      >
                        {summary.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Refresh / Sync Button */}
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
                  className={clsx(
                    'flex h-9 w-9 items-center justify-center border transition-all cursor-pointer disabled:opacity-50 select-none',
                    isPaper
                      ? 'border-2 border-[#2d2d2d] bg-[#2d5da1] text-white hover:bg-[#204375] sketch-btn'
                      : isDark
                        ? 'border-2 border-[#FF4D00] bg-[#FF4D00] text-black hover:bg-[#ff6a26] sketch-btn-orange'
                        : 'rounded-xl border border-[#1E3A5F] bg-[#050B14] text-slate-300 hover:border-cyan-400 hover:text-cyan-300'
                  )}
                  title="Resync Bio-Twin Telemetry"
                >
                  <RefreshCw
                    className={clsx(
                      'h-4 w-4',
                      isRefreshing ? 'animate-spin' : '',
                      !isSketch && isRefreshing ? 'text-cyan-400' : ''
                    )}
                  />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Crew Selection Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {crewMembers.map((member) => {
          const isSelected = member.id === selectedCrewId;
          const statusStyle = getStatusColor(member.status);

          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelectCrew(member.id)}
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={clsx(
                'group relative text-left p-3 transition-all duration-200 border cursor-pointer select-none',
                isPaper
                  ? isSelected
                    ? 'border-[3px] border-[#ff4d4d] bg-[#fff9c4] text-[#2d2d2d] sketch-shadow -rotate-0.5 font-sketch-hand'
                    : 'border-2 border-[#2d2d2d] bg-white text-[#2d2d2d] hover:bg-[#fff9c4]/30 sketch-btn font-sketch-hand'
                  : isDark
                    ? isSelected
                      ? 'border-[3px] border-[#FF4D00] bg-[#1a0f08] text-white sketch-shadow-orange -rotate-0.5 font-sketch-hand'
                      : 'border-2 border-[#FF4D00]/50 bg-[#0c0c10] text-white hover:border-[#FF4D00] sketch-btn-orange font-sketch-hand'
                    : isSelected
                      ? 'rounded-xl border-cyan-400 bg-gradient-to-br from-cyan-950/40 via-[#0B132B] to-[#050B14] shadow-[0_0_20px_rgba(0,229,255,0.22)]'
                      : 'rounded-xl border-[#1E3A5F]/70 bg-[#0B132B]/60 hover:border-cyan-500/40 hover:bg-[#0B132B]/90'
              )}
            >
              {/* PushPin for selected sketch card */}
              {isSketch && isSelected && (
                <div className="absolute -top-2.5 right-3 z-10 pointer-events-none">
                  <PushPin isDark={isDark} />
                </div>
              )}

              {/* Active selection accent line for Cyber mode */}
              {!isSketch && isSelected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-cyan-200 to-cyan-400 rounded-t-xl" />
              )}

              <div className="flex items-start justify-between gap-1.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                      className={clsx(
                        'px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider border',
                        isPaper
                          ? 'border-[#2d2d2d] bg-[#2d5da1]/15 text-[#2d5da1] font-sketch-hand'
                          : isDark
                            ? 'border-[#FF4D00]/60 bg-black text-[#FF4D00] font-sketch-hand'
                            : 'rounded font-mono bg-slate-800 text-cyan-300 border-cyan-500/30'
                      )}
                    >
                      {member.callsign}
                    </span>
                    <span
                      className={clsx(
                        'text-[10px] truncate max-w-[110px]',
                        isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'font-mono text-slate-400'
                      )}
                    >
                      {member.zone}
                    </span>
                  </div>
                  <h3
                    className={clsx(
                      'mt-0.5 truncate font-bold',
                      isSketch
                        ? 'font-display-kalam text-sm sm:text-base'
                        : 'text-xs sm:text-sm font-mono text-white group-hover:text-cyan-300'
                    )}
                  >
                    {member.name}
                  </h3>
                  <p
                    className={clsx(
                      'text-[11px] truncate',
                      isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'font-mono text-slate-400'
                    )}
                  >
                    {member.role}
                  </p>
                </div>

                {/* Status indicator badge */}
                <div
                  style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                  className={clsx(
                    'flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold border shrink-0',
                    isSketch ? 'font-sketch-hand' : 'font-mono rounded-full',
                    statusStyle.border,
                    statusStyle.bg,
                    statusStyle.text,
                    statusStyle.glow
                  )}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                  {member.status.toUpperCase()}
                </div>
              </div>

              {/* Bottom quick stats */}
              <div
                className={clsx(
                  'mt-2.5 pt-2 border-t flex items-center justify-between text-xs',
                  isPaper
                    ? 'border-[#2d2d2d]/30 font-sketch-hand text-[#2d2d2d]'
                    : isDark
                      ? 'border-[#FF4D00]/40 font-sketch-hand text-white'
                      : 'border-[#1E3A5F]/50 font-mono text-slate-300'
                )}
              >
                <div className="flex items-center gap-1">
                  <Heart className={clsx('h-3 w-3', isPaper ? 'text-rose-600' : 'text-red-400')} />
                  <span>{member.hr} BPM</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wind className={clsx('h-3 w-3', isPaper ? 'text-[#2d5da1]' : 'text-cyan-400')} />
                  <span>{member.spo2}% SpO2</span>
                </div>
                <div
                  className={clsx(
                    'flex items-center gap-1 text-[10px] font-semibold',
                    isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'
                  )}
                >
                  <Radio className="h-2.5 w-2.5" />
                  <span>3D SYNC</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Filter Ribbon by Organ Status */}
      <div
        style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
        className={clsx(
          'flex flex-wrap items-center justify-between gap-2.5 p-2.5 sm:px-4 sm:py-2 border transition-all',
          isPaper
            ? 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-shadow font-sketch-hand'
            : isDark
              ? 'bg-[#0c0c10] text-white border-2 border-[#FF4D00] sketch-shadow-orange font-sketch-hand'
              : 'rounded-xl border border-[#1E3A5F]/70 bg-[#050B14]/70 px-3 py-1.5 font-mono'
        )}
      >
        <div className="flex items-center gap-2 text-xs">
          <Layers className={clsx('h-4 w-4', isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400')} />
          <span
            className={clsx(
              'font-bold uppercase tracking-wider',
              isPaper ? 'text-[#2d2d2d]' : isDark ? 'text-white' : 'text-slate-300'
            )}
          >
            Filter Organ Status:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* ALL */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('all')}
            style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
            className={clsx(
              'px-3 py-1 text-xs font-bold transition-all cursor-pointer border select-none',
              isPaper
                ? currentStatusFilter === 'all'
                  ? 'bg-[#2d2d2d] text-white border-[#2d2d2d] sketch-btn'
                  : 'bg-[#fdfbf7] text-[#2d2d2d] border-[#2d2d2d] hover:bg-[#fff9c4]'
                : isDark
                  ? currentStatusFilter === 'all'
                    ? 'bg-[#FF4D00] text-black border-[#FF4D00] sketch-btn-orange'
                    : 'bg-black text-white border-[#FF4D00]/50 hover:border-[#FF4D00]'
                  : currentStatusFilter === 'all'
                    ? 'rounded-lg bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                    : 'rounded-lg bg-[#0B132B] text-slate-400 border-[#1E3A5F] hover:text-white'
            )}
          >
            ALL SYSTEMS ({organCounts.all})
          </button>

          {/* NOMINAL */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('nominal')}
            style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
            className={clsx(
              'px-3 py-1 text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 select-none',
              isPaper
                ? currentStatusFilter === 'nominal'
                  ? 'bg-emerald-700 text-white border-[#2d2d2d] sketch-btn'
                  : 'bg-[#fdfbf7] text-emerald-800 border-[#2d2d2d] hover:bg-emerald-50'
                : isDark
                  ? currentStatusFilter === 'nominal'
                    ? 'bg-emerald-400 text-black border-emerald-400 sketch-btn font-bold'
                    : 'bg-black text-emerald-400 border-emerald-500/50 hover:border-emerald-400'
                  : currentStatusFilter === 'nominal'
                    ? 'rounded-lg bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                    : 'rounded-lg bg-[#0B132B] text-emerald-400/70 border-[#1E3A5F] hover:text-emerald-300'
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            NOMINAL ({organCounts.nominal})
          </button>

          {/* WARNING */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('warning')}
            style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
            className={clsx(
              'px-3 py-1 text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 select-none',
              isPaper
                ? currentStatusFilter === 'warning'
                  ? 'bg-amber-500 text-black border-[#2d2d2d] sketch-btn'
                  : 'bg-[#fdfbf7] text-amber-800 border-[#2d2d2d] hover:bg-amber-50'
                : isDark
                  ? currentStatusFilter === 'warning'
                    ? 'bg-amber-400 text-black border-amber-400 sketch-btn font-bold'
                    : 'bg-black text-amber-400 border-amber-500/50 hover:border-amber-400'
                  : currentStatusFilter === 'warning'
                    ? 'rounded-lg bg-amber-500/20 text-amber-300 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                    : 'rounded-lg bg-[#0B132B] text-amber-400/70 border-[#1E3A5F] hover:text-amber-300'
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            WARNING ({organCounts.warning})
          </button>

          {/* CRITICAL */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('critical')}
            style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
            className={clsx(
              'px-3 py-1 text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 select-none',
              isPaper
                ? currentStatusFilter === 'critical'
                  ? 'bg-[#ff4d4d] text-white border-[#2d2d2d] sketch-btn'
                  : 'bg-[#fdfbf7] text-rose-800 border-[#2d2d2d] hover:bg-rose-50'
                : isDark
                  ? currentStatusFilter === 'critical'
                    ? 'bg-red-500 text-white border-red-500 sketch-btn font-bold'
                    : 'bg-black text-red-400 border-red-500/50 hover:border-red-400'
                  : currentStatusFilter === 'critical'
                    ? 'rounded-lg bg-red-500/20 text-red-300 border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                    : 'rounded-lg bg-[#0B132B] text-red-400/70 border-[#1E3A5F] hover:text-red-300'
            )}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            CRITICAL ({organCounts.critical})
          </button>
        </div>
      </div>
    </div>
  );
};

export default BioTwinCrewHeader;
