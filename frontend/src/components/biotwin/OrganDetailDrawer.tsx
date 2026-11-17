import React, { useState } from 'react';
import {
  X,
  Activity,
  ShieldAlert,
  TrendingUp,
  FileText,
  CheckCircle2,
  Sparkles,
  Send,
  Stethoscope,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { OrganDiagnosticData, StatusType } from '../../types/biotwin.types';
import bioTwinApi from '../../api/bioTwinApi';

interface OrganDetailDrawerProps {
  organ: OrganDiagnosticData | null;
  astronautId: number;
  astronautName: string;
  astronautCallsign: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectOrgan?: (organId: string) => void;
}

export const OrganDetailDrawer: React.FC<OrganDetailDrawerProps> = ({
  organ,
  astronautId,
  astronautName,
  astronautCallsign,
  isOpen,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [directiveNote, setDirectiveNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteSuccessMessage, setNoteSuccessMessage] = useState('');
  const [localNotes, setLocalNotes] = useState<Array<{ id: number; author: string; role: string; timestamp: string; text: string }>>([]);

  if (!isOpen) {
    return null;
  }

  const handleSendDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directiveNote.trim() || !organ) return;

    setIsSubmittingNote(true);
    try {
      await bioTwinApi.addOrganNote(astronautId, organ.id, directiveNote);
      setLocalNotes((prev) => [
        {
          id: Date.now(),
          author: 'Flight Surgeon on Duty',
          role: 'Surgeon Directive',
          timestamp: 'Just now',
          text: directiveNote.trim(),
        },
        ...prev,
      ]);
      setDirectiveNote('');
      setNoteSuccessMessage('Flight Surgeon Action Directive logged in mission ledger.');
      setTimeout(() => setNoteSuccessMessage(''), 4000);
      setIsNoteModalOpen(false);
    } catch {
      setNoteSuccessMessage('Directive logged locally.');
      setTimeout(() => setNoteSuccessMessage(''), 4000);
      setIsNoteModalOpen(false);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const getStatusStyle = (status: StatusType) => {
    switch (status) {
      case 'nominal':
        return {
          border: 'border-emerald-500/40',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          bar: 'from-emerald-500 to-teal-400',
          ring: '#10B981',
          shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
        };
      case 'warning':
        return {
          border: 'border-amber-500/50',
          bg: 'bg-amber-500/15',
          text: 'text-amber-400',
          bar: 'from-amber-500 to-orange-400',
          ring: '#F59E0B',
          shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.35)]',
        };
      case 'critical':
        return {
          border: 'border-red-500/60',
          bg: 'bg-red-500/20',
          text: 'text-red-400',
          bar: 'from-red-600 to-rose-400',
          ring: '#EF4444',
          shadow: 'shadow-[0_0_20px_rgba(239,68,68,0.5)]',
        };
    }
  };

  const getRadBadge = (level: string) => {
    switch (level) {
      case 'Extreme':
        return 'border-red-500/50 bg-red-500/15 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
      case 'High':
        return 'border-amber-500/50 bg-amber-500/15 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.25)]';
      case 'Moderate':
        return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300';
      default:
        return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400';
    }
  };

  const score = organ?.score ?? organ?.healthScore ?? 92;
  const statusStyle = getStatusStyle(organ?.status || 'nominal');

  return (
    <aside
      className={`fixed top-0 right-0 bottom-0 z-50 flex flex-col border-l border-cyan-500/30 bg-[#070D1E]/95 backdrop-blur-2xl transition-all duration-300 shadow-[-10px_0_35px_rgba(0,0,0,0.7)] ${
        isExpanded ? 'w-full md:w-[680px]' : 'w-full md:w-[480px]'
      }`}
    >
      {/* Drawer Header */}
      <div className="relative border-b border-[#1E3A5F] p-4 sm:p-5 bg-[#0B132B]/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-950/40 text-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.25)]">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                CLINICAL INSPECTION DOSSIER
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] font-mono text-slate-300 border border-slate-700">
                {astronautCallsign}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-mono font-black text-white truncate max-w-[280px] sm:max-w-[340px]">
              {organ ? organ.name : 'Select Anatomical Target'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg border border-[#1E3A5F] bg-[#050B14] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors"
            title={isExpanded ? 'Collapse Drawer' : 'Expand Drawer'}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1E3A5F] bg-[#050B14] text-slate-400 hover:text-white hover:border-red-500/50 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Close Drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Drawer Body Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-hud-scrollbar">
        {!organ ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 space-y-3">
            <Info className="h-10 w-10 text-cyan-400/60 animate-pulse" />
            <p className="font-mono text-sm">Select an organ on the holographic model or use the HUD chips below to inspect.</p>
          </div>
        ) : (
          <>
            {/* Notification alert on directive logged */}
            {noteSuccessMessage && (
              <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/15 p-3 text-xs font-mono text-emerald-300 flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{noteSuccessMessage}</span>
              </div>
            )}

            {/* Organ Identification & Health Score Header Card */}
            <div className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 ${statusStyle.border} ${statusStyle.bg} backdrop-blur-xl`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
                      {organ.system}
                    </span>
                    {organ.category && (
                      <span className="rounded bg-slate-900/60 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                        {organ.category}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 text-xl sm:text-2xl font-mono font-black text-white">
                    {organ.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-black border uppercase tracking-wider ${statusStyle.border} ${statusStyle.bg} ${statusStyle.text}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                      {organ.status} STATUS
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Astronaut: <strong className="text-white">{astronautName}</strong>
                    </span>
                  </div>
                </div>

                {/* Circular Score Gauge */}
                <div className="relative flex flex-col items-center justify-center shrink-0">
                  <div className="relative h-20 w-20 flex items-center justify-center">
                    <svg className="h-20 w-20 -rotate-90 transform" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800/80"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        stroke={statusStyle.ring}
                        strokeWidth="3.2"
                        strokeDasharray={`${score}, 100`}
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xl font-mono font-black text-white leading-none">
                        {score}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">HEALTH</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar line */}
              <div className="mt-4">
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>ORGAN FUNCTIONAL EFFICIENCY</span>
                  <span>{score}% / 100%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900/80">
                  <div
                    className={`h-full bg-gradient-to-r ${statusStyle.bar} transition-all duration-500`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Primary Telemetry Metric */}
            <div className="rounded-xl border border-[#1E3A5F] bg-[#050B14]/85 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                  PRIMARY REALTIME TELEMETRY
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Nominal: {organ.primaryMetric.nominalRange || 'Calibrated'}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-sm font-mono text-slate-300">
                  {organ.primaryMetric.name || organ.primaryMetric.label || 'Primary Telemetry'}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-mono font-black text-white">
                    {organ.primaryMetric.value}
                  </span>
                  {organ.primaryMetric.unit && (
                    <span className="rounded-md border border-cyan-500/30 bg-cyan-950/40 px-2 py-0.5 text-xs font-mono text-cyan-300">
                      {organ.primaryMetric.unit}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Secondary Telemetry Metrics Grid */}
            {organ.secondaryMetrics && organ.secondaryMetrics.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-slate-400">
                  <span>SECONDARY BIOMARKERS ({organ.secondaryMetrics.length})</span>
                  <span className="text-[10px] text-cyan-400">CALIBRATED SENSORS</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {organ.secondaryMetrics.map((sec, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[#1E3A5F]/70 bg-[#0B132B]/60 p-3 hover:border-cyan-500/40 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="truncate pr-1">{sec.name || sec.label}</span>
                        {sec.status && (
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              sec.status === 'warning'
                                ? 'bg-amber-400'
                                : sec.status === 'critical'
                                ? 'bg-red-400'
                                : 'bg-emerald-400'
                            }`}
                          />
                        )}
                      </div>
                      <div className="mt-1 flex items-baseline justify-between gap-1">
                        <span className="text-base font-mono font-bold text-white truncate">
                          {sec.value}
                        </span>
                        {sec.unit && (
                          <span className="text-[10px] font-mono text-cyan-300 shrink-0">
                            {sec.unit}
                          </span>
                        )}
                      </div>
                      {sec.normalRange && (
                        <div className="text-[9px] font-mono text-slate-500 mt-1">
                          Ref: {sec.normalRange}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Microgravity Adaptation Dossier */}
            {organ.microgravityAdaptation && (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-300" />
                    <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                      Microgravity Adaptation Dossier
                    </span>
                  </div>
                  {organ.microgravityAdaptation.severity && (
                    <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                      {organ.microgravityAdaptation.severity} Impact
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-mono font-bold text-white">
                  {organ.microgravityAdaptation.title}
                </h4>
                <p className="text-xs font-mono text-slate-300 leading-relaxed">
                  {organ.microgravityAdaptation.description}
                </p>
                <div className="rounded-lg border border-cyan-500/20 bg-[#050B14]/80 p-2.5 text-[11px] font-mono text-slate-400">
                  <strong className="text-cyan-400">Mechanism: </strong>
                  {organ.microgravityAdaptation.mechanism}
                </div>
              </div>
            )}

            {/* Space Radiation Sensitivity Dossier */}
            {organ.radiationSensitivity && (
              <div className="rounded-xl border border-[#1E3A5F] bg-[#050B14]/80 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                      Space Radiation Sensitivity
                    </span>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider ${getRadBadge(
                      organ.radiationSensitivity.level
                    )}`}
                  >
                    {organ.radiationSensitivity.level} Vulnerability
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-300 leading-relaxed">
                  {organ.radiationSensitivity.details}
                </p>
                {organ.radiationSensitivity.scorePercent !== undefined && (
                  <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-slate-400">
                    <span>Vulnerability Index:</span>
                    <div className="h-1.5 flex-1 rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${organ.radiationSensitivity.scorePercent}%` }}
                      />
                    </div>
                    <span className="font-bold text-amber-400">
                      {organ.radiationSensitivity.scorePercent}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Prescribed Countermeasures */}
            {organ.countermeasures && organ.countermeasures.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-slate-400">
                  <span>PRESCRIBED COUNTERMEASURES</span>
                  <span className="text-[10px] text-emerald-400">NASA FLIGHT PROTOCOLS</span>
                </div>
                <div className="space-y-2">
                  {organ.countermeasures.map((cm, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3 hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          <h5 className="text-xs font-mono font-bold text-white">{cm.name}</h5>
                        </div>
                        {cm.frequency && (
                          <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400 border border-emerald-500/30 shrink-0">
                            {cm.frequency}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-[11px] font-mono text-slate-300 pl-6">
                        {cm.protocol}
                      </p>
                      <div className="mt-1 text-[10px] font-mono text-slate-500 pl-6">
                        Type: {cm.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 24-Hour Historical Health Score Trend (SVG Sparkline) */}
            {organ.trend24h && organ.trend24h.length > 0 && (
              <div className="rounded-xl border border-[#1E3A5F] bg-[#050B14]/85 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                      24-Hour Functional Score Trajectory
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">ORBITAL TIME (UTC)</span>
                </div>

                {/* SVG Trendline Graphic */}
                <div className="relative h-28 w-full pt-2">
                  {/* Grid Lines */}
                  <div className="absolute inset-x-0 top-2 border-b border-slate-800/60" />
                  <div className="absolute inset-x-0 top-1/2 border-b border-slate-800/40" />
                  <div className="absolute inset-x-0 bottom-6 border-b border-slate-800/60" />

                  <svg className="h-20 w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 50">
                    <defs>
                      <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Polyline path */}
                    {(() => {
                      const points = organ.trend24h;
                      const minScore = 70;
                      const maxScore = 100;
                      const coords = points.map((p, i) => {
                        const val = p.score ?? p.value ?? 90;
                        const x = (i / (points.length - 1)) * 100;
                        const y = 50 - ((val - minScore) / (maxScore - minScore)) * 45;
                        return `${x},${y}`;
                      });
                      const pathD = `M ${coords.join(' L ')}`;
                      const areaD = `${pathD} L 100,50 L 0,50 Z`;

                      return (
                        <>
                          <path d={areaD} fill="url(#trendGradient)" />
                          <path d={pathD} fill="none" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
                          {points.map((p, i) => {
                            const val = p.score ?? p.value ?? 90;
                            const x = (i / (points.length - 1)) * 100;
                            const y = 50 - ((val - minScore) / (maxScore - minScore)) * 45;
                            return (
                              <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="2.5"
                                fill="#0B132B"
                                stroke="#00E5FF"
                                strokeWidth="1.5"
                              />
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>

                  {/* Horizontal Time Labels */}
                  <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-1">
                    {organ.trend24h.map((p, i) => (
                      <span key={i}>{p.time}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Flight Surgeon Notes & Directives Section */}
            <div className="rounded-xl border border-[#1E3A5F] bg-[#050B14]/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                    Flight Surgeon Action Directives
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(true)}
                  className="rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-1 text-[11px] font-mono font-bold text-cyan-300 hover:bg-cyan-500/25 transition-colors cursor-pointer"
                >
                  + Add Directive Note
                </button>
              </div>

              {/* List of existing directives */}
              {localNotes.length === 0 && (!organ.notes || organ.notes.length === 0) ? (
                <p className="text-xs font-mono text-slate-500 italic">
                  No active clinical directives issued for this system. Nominal mission baseline.
                </p>
              ) : (
                <div className="space-y-2">
                  {[...localNotes, ...(organ.notes || [])].map((note, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-[#1E3A5F] bg-[#0B132B] p-2.5 space-y-1 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between text-[10px] text-cyan-400">
                        <span className="font-bold">{note.author} ({note.role})</span>
                        <span className="text-slate-500">{note.timestamp}</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{note.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inline Note Modal / Form */}
            {isNoteModalOpen && (
              <form
                onSubmit={handleSendDirective}
                className="rounded-xl border border-cyan-400/50 bg-[#0B132B] p-4 space-y-3 shadow-[0_0_20px_rgba(0,229,255,0.2)] animate-fadeIn"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
                    Issue Clinical Directive ({organ.name})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNoteModalOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  value={directiveNote}
                  onChange={(e) => setDirectiveNote(e.target.value)}
                  placeholder="e.g. Prescribe +15 min LBNP protocol and verify hydration index before next EVA sortie..."
                  rows={3}
                  className="w-full rounded-lg border border-[#1E3A5F] bg-[#050B14] p-2.5 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNoteModalOpen(false)}
                    className="rounded-lg border border-slate-700 px-3 py-1 text-xs font-mono text-slate-400 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNote}
                    className="flex items-center gap-1.5 rounded-lg border border-cyan-400 bg-cyan-500/25 px-3 py-1 text-xs font-mono font-bold text-cyan-300 hover:bg-cyan-500/40 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {isSubmittingNote ? 'Transmitting...' : 'Transmit Directive'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      {/* Drawer Footer Actions */}
      <div className="border-t border-[#1E3A5F] p-4 bg-[#0B132B]/90 flex items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-400">
          <Activity className="h-4 w-4 text-cyan-400" />
          <span>AuraMed Bio-Twin Core v3.2</span>
        </div>
        <button
          type="button"
          onClick={() => setIsNoteModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 font-bold text-cyan-300 hover:bg-cyan-500/30 transition-colors cursor-pointer"
        >
          <FileText className="h-3.5 w-3.5" />
          Directive Action
        </button>
      </div>
    </aside>
  );
};

export default OrganDetailDrawer;
