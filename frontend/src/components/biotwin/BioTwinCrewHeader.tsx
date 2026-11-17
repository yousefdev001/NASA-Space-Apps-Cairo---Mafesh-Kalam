import React from 'react';
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
  const selectedMember = crewMembers.find((c) => c.id === selectedCrewId) || crewMembers[0];

  const getStatusColor = (status: 'nominal' | 'warning' | 'critical') => {
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
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#0B132B]/85 p-3 sm:p-4 backdrop-blur-xl shadow-[0_0_25px_rgba(0,229,255,0.08)]">
        {/* Holographic grid overlay pattern */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-950/40 text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.25)]">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-md border border-cyan-400/50 bg-cyan-500/15 px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest text-cyan-300">
                  BIO-DIGITAL TWIN · 3D AVATAR
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  REALTIME 500Hz DOWNLINK ACTIVE
                </span>
              </div>
              <h1 className="mt-0.5 text-base sm:text-xl font-mono font-black tracking-tight text-white flex items-center gap-2">
                Holographic Humanoid Anatomical Diagnostic
              </h1>
              <p className="text-[11px] font-mono text-slate-400">
                Deep-Space Microgravity Deconditioning & Multi-Organ Bio-Impedance Telemetry · NASA STD-3001
              </p>
            </div>
          </div>

          {/* Realtime Live Vitals Readout of Active Astronaut */}
          {selectedMember && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* HR Card */}
              <div className="flex items-center gap-2.5 rounded-xl border border-[#1E3A5F] bg-[#050B14]/80 px-3 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
                  <Heart className="h-3.5 w-3.5 animate-bounce" />
                </div>
                <div>
                  <div className="text-[9px] font-mono font-semibold uppercase text-slate-400">Live Heart Rate</div>
                  <div className="text-xs sm:text-sm font-mono font-black text-white">
                    {selectedMember.hr}{' '}
                    <span className="text-[10px] font-normal text-slate-400">BPM</span>
                  </div>
                </div>
              </div>

              {/* SpO2 Card */}
              <div className="flex items-center gap-2.5 rounded-xl border border-[#1E3A5F] bg-[#050B14]/80 px-3 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
                  <Wind className="h-3.5 w-3.5 text-cyan-300" />
                </div>
                <div>
                  <div className="text-[9px] font-mono font-semibold uppercase text-slate-400">Blood Oxygen</div>
                  <div className="text-xs sm:text-sm font-mono font-black text-cyan-300">
                    {selectedMember.spo2}
                    <span className="text-[10px] font-normal text-slate-400">%</span>
                  </div>
                </div>
              </div>

              {/* Twin Overall Health Index */}
              {summary && (
                <div className="flex items-center gap-2.5 rounded-xl border border-cyan-500/30 bg-cyan-950/25 px-3 py-1.5 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                    <Activity className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-[9px] font-mono font-semibold uppercase text-cyan-300">Twin Health Score</div>
                    <div className="text-xs sm:text-sm font-mono font-black text-white">
                      {summary.overallHealthScore}%
                      <span className="ml-1 text-[9px] font-mono text-emerald-400">
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
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#1E3A5F] bg-[#050B14] text-slate-300 hover:border-cyan-400 hover:text-cyan-300 transition-all cursor-pointer disabled:opacity-50"
                  title="Resync Bio-Twin Telemetry"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
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
              className={`group relative text-left rounded-xl p-2.5 sm:p-3 transition-all duration-200 border cursor-pointer ${
                isSelected
                  ? 'border-cyan-400 bg-gradient-to-br from-cyan-950/40 via-[#0B132B] to-[#050B14] shadow-[0_0_20px_rgba(0,229,255,0.22)]'
                  : 'border-[#1E3A5F]/70 bg-[#0B132B]/60 hover:border-cyan-500/40 hover:bg-[#0B132B]/90'
              }`}
            >
              {/* Active selection accent line */}
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-cyan-200 to-cyan-400 rounded-t-xl" />
              )}

              <div className="flex items-start justify-between gap-1.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider bg-slate-800 text-cyan-300 border border-cyan-500/30">
                      {member.callsign}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 truncate max-w-[100px]">
                      {member.zone}
                    </span>
                  </div>
                  <h3 className="mt-0.5 text-xs sm:text-sm font-mono font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                    {member.name}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 truncate">
                    {member.role}
                  </p>
                </div>

                {/* Status indicator badge */}
                <div
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-mono font-bold border shrink-0 ${statusStyle.border} ${statusStyle.bg} ${statusStyle.text}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                  {member.status.toUpperCase()}
                </div>
              </div>

              {/* Bottom quick stats */}
              <div className="mt-2 pt-2 border-t border-[#1E3A5F]/50 flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-1 text-slate-300">
                  <Heart className="h-2.5 w-2.5 text-red-400" />
                  <span>{member.hr} BPM</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <Wind className="h-2.5 w-2.5 text-cyan-400" />
                  <span>{member.spo2}% SpO2</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-cyan-400 font-semibold">
                  <Radio className="h-2 w-2" />
                  <span>3D SYNC</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Filter Ribbon by Organ Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#1E3A5F]/70 bg-[#050B14]/70 px-3 py-1.5">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Layers className="h-4 w-4 text-cyan-400" />
          <span className="font-bold uppercase tracking-wider text-slate-300">Filter Organ Status:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* ALL */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('all')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
              currentStatusFilter === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                : 'bg-[#0B132B] text-slate-400 border-[#1E3A5F] hover:text-white hover:border-slate-500'
            }`}
          >
            ALL SYSTEMS ({organCounts.all})
          </button>

          {/* NOMINAL */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('nominal')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
              currentStatusFilter === 'nominal'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                : 'bg-[#0B132B] text-emerald-400/70 border-[#1E3A5F] hover:text-emerald-300 hover:border-emerald-500/40'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            NOMINAL ({organCounts.nominal})
          </button>

          {/* WARNING */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('warning')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
              currentStatusFilter === 'warning'
                ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                : 'bg-[#0B132B] text-amber-400/70 border-[#1E3A5F] hover:text-amber-300 hover:border-amber-500/40'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            WARNING ({organCounts.warning})
          </button>

          {/* CRITICAL */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('critical')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
              currentStatusFilter === 'critical'
                ? 'bg-red-500/20 text-red-300 border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                : 'bg-[#0B132B] text-red-400/70 border-[#1E3A5F] hover:text-red-300 hover:border-red-500/40'
            }`}
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
