import React, { useState } from 'react';
import { clsx } from 'clsx';
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
import { useThemeStore } from '../../store/themeStore';
import { getWobblyStyle } from '../sketchbook/sketchbookConstants';
import { Tape } from '../sketchbook/SketchbookTheme';
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

  const { mode } = useThemeStore();
  const isPaper = mode === 'paper';
  const isDark = mode === 'dark';
  const isSketch = isPaper || isDark;

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
    if (isPaper) {
      switch (status) {
        case 'nominal':
          return {
            border: 'border-[#2d2d2d]',
            bg: 'bg-emerald-50',
            text: 'text-emerald-900',
            bar: 'from-emerald-600 to-teal-500',
            ring: '#059669',
            shadow: 'sketch-shadow-sm',
          };
        case 'warning':
          return {
            border: 'border-[#2d2d2d]',
            bg: 'bg-[#fff9c4]',
            text: 'text-[#2d2d2d]',
            bar: 'from-amber-500 to-orange-400',
            ring: '#d97706',
            shadow: 'sketch-shadow-sm',
          };
        case 'critical':
          return {
            border: 'border-[#2d2d2d]',
            bg: 'bg-[#ff4d4d]',
            text: 'text-white',
            bar: 'from-red-600 to-rose-500',
            ring: '#dc2626',
            shadow: 'sketch-shadow-sm',
          };
      }
    }

    if (isDark) {
      switch (status) {
        case 'nominal':
          return {
            border: 'border-emerald-500/70',
            bg: 'bg-emerald-950/60',
            text: 'text-emerald-300',
            bar: 'from-emerald-500 to-teal-400',
            ring: '#10B981',
            shadow: 'sketch-shadow-orange-sm',
          };
        case 'warning':
          return {
            border: 'border-[#FF4D00]',
            bg: 'bg-[#fff9c4]',
            text: 'text-black font-bold',
            bar: 'from-amber-500 to-orange-400',
            ring: '#F59E0B',
            shadow: 'sketch-shadow-orange-sm',
          };
        case 'critical':
          return {
            border: 'border-white',
            bg: 'bg-[#FF4D00]',
            text: 'text-black font-bold',
            bar: 'from-red-600 to-rose-400',
            ring: '#EF4444',
            shadow: 'sketch-shadow-orange-sm',
          };
      }
    }

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
    if (isPaper) {
      switch (level) {
        case 'Extreme':
          return 'border-[#2d2d2d] bg-[#ff4d4d] text-white font-bold';
        case 'High':
          return 'border-[#2d2d2d] bg-amber-100 text-amber-900 font-bold';
        case 'Moderate':
          return 'border-[#2d2d2d] bg-[#2d5da1]/15 text-[#2d5da1]';
        default:
          return 'border-[#2d2d2d] bg-emerald-100 text-emerald-900';
      }
    }

    if (isDark) {
      switch (level) {
        case 'Extreme':
          return 'border-white bg-[#FF4D00] text-black font-bold';
        case 'High':
          return 'border-[#FF4D00] bg-amber-400 text-black font-bold';
        case 'Moderate':
          return 'border-[#FF4D00] bg-[#FF4D00]/25 text-[#FF4D00]';
        default:
          return 'border-emerald-400 bg-emerald-950/60 text-emerald-300';
      }
    }

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
    <>
      {/* Mobile Backdrop Overlay (only on mobile screens < lg) */}
      <div
        className={clsx(
          'fixed inset-0 z-40 lg:hidden animate-in fade-in',
          isPaper ? 'bg-black/40 backdrop-blur-xs' : 'bg-[#050B14]/80 backdrop-blur-sm'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
        className={clsx(
          'flex flex-col transition-all duration-300 overflow-hidden',
          'fixed top-0 right-0 bottom-0 z-50 w-full sm:max-w-md',
          'lg:relative lg:top-auto lg:right-auto lg:bottom-auto lg:z-auto lg:w-full lg:max-w-none lg:h-full lg:min-h-[580px] lg:max-h-[680px]',
          isPaper
            ? 'border-[3px] border-[#2d2d2d] bg-white text-[#2d2d2d] sketch-shadow-lg font-sketch-hand'
            : isDark
              ? 'border-[3px] border-[#FF4D00] bg-[#0c0c10] text-white sketch-shadow-orange-lg font-sketch-hand'
              : 'border border-cyan-500/30 bg-gradient-to-b from-[#0B132B]/95 via-[#070D1E]/95 to-[#0B132B]/95 backdrop-blur-2xl shadow-[0_0_35px_rgba(0,229,255,0.08)] rounded-3xl'
        )}
      >
        {/* Sketch Tape Decoration on top */}
        {isSketch && (
          <div className="absolute -top-3.5 left-8 z-20 pointer-events-none">
            <Tape isDark={isDark} />
          </div>
        )}

        {/* Drawer Header */}
        <div
          className={clsx(
            'relative p-3.5 sm:p-4 flex items-center justify-between gap-3 shrink-0 border-b',
            isPaper
              ? 'bg-[#fff9c4] border-[#2d2d2d]'
              : isDark
                ? 'bg-[#18110c] border-[#FF4D00]'
                : 'border-[#1E3A5F] bg-[#0B132B]/80'
          )}
        >
          <div className="flex items-center gap-2.5">
            <div
              style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
              className={clsx(
                'flex h-9 w-9 shrink-0 items-center justify-center border',
                isPaper
                  ? 'border-2 border-[#2d2d2d] bg-white text-[#2d5da1] sketch-shadow-sm'
                  : isDark
                    ? 'border-2 border-[#FF4D00] bg-black text-[#FF4D00] sketch-shadow-orange-sm'
                    : 'rounded-xl border border-cyan-400/40 bg-cyan-950/40 text-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.25)]'
              )}
            >
              <Stethoscope className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                  className={clsx(
                    'text-[10px] font-bold tracking-widest uppercase',
                    isPaper
                      ? 'text-[#2d5da1] font-sketch-hand'
                      : isDark
                        ? 'text-[#FF4D00] font-sketch-hand'
                        : 'font-mono text-cyan-400'
                  )}
                >
                  CLINICAL INSPECTION DOSSIER
                </span>
                <span
                  style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                  className={clsx(
                    'px-1.5 py-0.2 text-[9px] border',
                    isPaper
                      ? 'bg-white text-[#2d2d2d] border-[#2d2d2d] font-sketch-hand'
                      : isDark
                        ? 'bg-black text-[#FF4D00] border-[#FF4D00] font-sketch-hand'
                        : 'rounded bg-slate-800 font-mono text-slate-300 border-slate-700'
                  )}
                >
                  {astronautCallsign}
                </span>
              </div>
              <h2
                className={clsx(
                  'truncate max-w-[240px] sm:max-w-[300px]',
                  isSketch
                    ? 'font-display-kalam font-bold text-base sm:text-lg'
                    : 'text-sm sm:text-base font-mono font-black text-white'
                )}
              >
                {organ ? organ.name : 'Select Anatomical Target'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={clsx(
                'hidden sm:flex h-8 w-8 items-center justify-center border transition-colors select-none',
                isPaper
                  ? 'border-2 border-[#2d2d2d] bg-white text-[#2d2d2d] hover:bg-[#fff9c4] sketch-btn'
                  : isDark
                    ? 'border-2 border-[#FF4D00] bg-black text-white hover:bg-[#FF4D00] hover:text-black sketch-btn-orange'
                    : 'rounded-lg border border-[#1E3A5F] bg-[#050B14] text-slate-400 hover:text-cyan-300'
              )}
              title={isExpanded ? 'Collapse Drawer' : 'Expand Drawer'}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={clsx(
                'flex h-8 w-8 items-center justify-center border transition-colors cursor-pointer select-none',
                isPaper
                  ? 'border-2 border-[#2d2d2d] bg-white text-[#2d2d2d] hover:bg-[#ff4d4d] hover:text-white sketch-btn'
                  : isDark
                    ? 'border-2 border-[#FF4D00] bg-black text-white hover:bg-[#FF4D00] hover:text-black sketch-btn-orange'
                    : 'rounded-lg border border-[#1E3A5F] bg-[#050B14] text-slate-400 hover:text-white hover:border-red-500/50'
              )}
              title="Close Drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 custom-hud-scrollbar">
          {!organ ? (
            <div
              className={clsx(
                'flex flex-col items-center justify-center py-20 text-center space-y-3',
                isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'text-slate-400'
              )}
            >
              <Info
                className={clsx(
                  'h-10 w-10 animate-pulse',
                  isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400/60'
                )}
              />
              <p className={isSketch ? 'font-sketch-hand text-base' : 'font-mono text-sm'}>
                Select an organ on the humanoid avatar or use the anatomical systems selector below.
              </p>
            </div>
          ) : (
            <>
              {/* Notification alert on directive logged */}
              {noteSuccessMessage && (
                <div
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'p-3 text-xs flex items-center gap-2 border animate-fadeIn',
                    isPaper
                      ? 'border-2 border-[#2d2d2d] bg-emerald-100 text-emerald-900 font-sketch-hand font-bold'
                      : isDark
                        ? 'border-2 border-emerald-400 bg-emerald-950/80 text-emerald-300 font-sketch-hand font-bold'
                        : 'rounded-xl border border-emerald-500/50 bg-emerald-500/15 font-mono text-emerald-300'
                  )}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{noteSuccessMessage}</span>
                </div>
              )}

              {/* Organ Identification & Health Score Header Card */}
              <div
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'relative overflow-hidden p-4 sm:p-5 border transition-all',
                  isPaper
                    ? 'border-2 border-[#2d2d2d] bg-[#fdfbf7] text-[#2d2d2d] sketch-shadow-sm font-sketch-hand'
                    : isDark
                      ? 'border-2 border-[#FF4D00] bg-[#140e0a] text-white sketch-shadow-orange-sm font-sketch-hand'
                      : clsx('rounded-2xl backdrop-blur-xl', statusStyle.border, statusStyle.bg)
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          'text-[11px] font-bold uppercase tracking-wider',
                          isPaper ? 'text-[#2d2d2d]/80' : isDark ? 'text-white/80' : 'font-mono text-slate-300'
                        )}
                      >
                        {organ.system}
                      </span>
                      {organ.category && (
                        <span
                          style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                          className={clsx(
                            'px-2 py-0.5 text-[10px] border',
                            isPaper
                              ? 'border-[#2d2d2d] bg-white text-[#2d5da1] font-sketch-hand'
                              : isDark
                                ? 'border-[#FF4D00] bg-black text-[#FF4D00] font-sketch-hand'
                                : 'rounded bg-slate-900/60 font-mono text-cyan-300 border-cyan-500/30'
                          )}
                        >
                          {organ.category}
                        </span>
                      )}
                    </div>
                    <h3
                      className={clsx(
                        'mt-1 font-bold',
                        isSketch
                          ? 'font-display-kalam text-xl sm:text-2xl'
                          : 'text-xl sm:text-2xl font-mono font-black text-white'
                      )}
                    >
                      {organ.name}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                        className={clsx(
                          'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider',
                          isSketch ? 'font-sketch-hand' : 'rounded-full font-mono font-black',
                          statusStyle.border,
                          statusStyle.bg,
                          statusStyle.text
                        )}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                        {organ.status} STATUS
                      </span>
                      <span
                        className={clsx(
                          'text-xs',
                          isPaper ? 'text-[#2d2d2d]/80 font-sketch-hand' : isDark ? 'text-white/70 font-sketch-hand' : 'font-mono text-slate-400'
                        )}
                      >
                        Astronaut: <strong className={isPaper ? 'text-[#2d2d2d]' : 'text-white'}>{astronautName}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Circular Score Gauge */}
                  <div className="relative flex flex-col items-center justify-center shrink-0">
                    <div className="relative h-20 w-20 flex items-center justify-center">
                      <svg className="h-20 w-20 -rotate-90 transform" viewBox="0 0 36 36">
                        <path
                          className={isPaper ? 'text-[#e5e0d8]' : isDark ? 'text-[#261810]' : 'text-slate-800/80'}
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
                        <span
                          className={clsx(
                            'text-xl font-black leading-none',
                            isPaper ? 'font-sketch-hand text-[#2d2d2d]' : isDark ? 'font-sketch-hand text-white' : 'font-mono text-white'
                          )}
                        >
                          {score}
                        </span>
                        <span
                          className={clsx(
                            'text-[9px]',
                            isPaper ? 'font-sketch-hand text-[#2d2d2d]/70' : isDark ? 'font-sketch-hand text-white/70' : 'font-mono text-slate-400'
                          )}
                        >
                          HEALTH
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress bar line */}
                <div className="mt-4">
                  <div
                    className={clsx(
                      'flex justify-between text-[10px] mb-1 font-bold',
                      isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'font-mono text-slate-400'
                    )}
                  >
                    <span>ORGAN FUNCTIONAL EFFICIENCY</span>
                    <span>{score}% / 100%</span>
                  </div>
                  <div
                    className={clsx(
                      'h-2 w-full overflow-hidden border',
                      isPaper
                        ? 'rounded-full bg-[#e5e0d8] border-[#2d2d2d]'
                        : isDark
                          ? 'rounded-full bg-black border-[#FF4D00]'
                          : 'rounded-full bg-slate-900/80 border-transparent'
                    )}
                  >
                    <div
                      className={`h-full bg-gradient-to-r ${statusStyle.bar} transition-all duration-500`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Primary Telemetry Metric */}
              <div
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'p-4 border transition-all',
                  isPaper
                    ? 'border-2 border-[#2d2d2d] bg-white text-[#2d2d2d] sketch-shadow-sm font-sketch-hand'
                    : isDark
                      ? 'border-2 border-[#FF4D00] bg-black text-white sketch-shadow-orange-sm font-sketch-hand'
                      : 'rounded-xl border border-[#1E3A5F] bg-[#050B14]/85'
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={clsx(
                      'text-[10px] font-bold tracking-widest uppercase',
                      isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'font-mono text-cyan-400'
                    )}
                  >
                    PRIMARY REALTIME TELEMETRY
                  </span>
                  <span
                    className={clsx(
                      'text-[10px]',
                      isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'font-mono text-slate-400'
                    )}
                  >
                    Nominal: {organ.primaryMetric.nominalRange || 'Calibrated'}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <div
                    className={clsx(
                      'text-sm font-bold',
                      isPaper ? 'text-[#2d2d2d]' : isDark ? 'text-white' : 'font-mono text-slate-300'
                    )}
                  >
                    {organ.primaryMetric.name || organ.primaryMetric.label || 'Primary Telemetry'}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={clsx(
                        'text-2xl sm:text-3xl font-black',
                        isPaper
                          ? 'text-[#2d5da1] font-sketch-hand'
                          : isDark
                            ? 'text-[#FF4D00] font-sketch-hand'
                            : 'font-mono text-white'
                      )}
                    >
                      {organ.primaryMetric.value}
                    </span>
                    {organ.primaryMetric.unit && (
                      <span
                        style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                        className={clsx(
                          'px-2 py-0.5 text-xs font-bold border',
                          isPaper
                            ? 'border-[#2d2d2d] bg-[#fff9c4] text-[#2d2d2d] font-sketch-hand'
                            : isDark
                              ? 'border-[#FF4D00] bg-[#221208] text-[#FF4D00] font-sketch-hand'
                              : 'rounded-md border border-cyan-500/30 bg-cyan-950/40 font-mono text-cyan-300'
                        )}
                      >
                        {organ.primaryMetric.unit}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Secondary Telemetry Metrics Grid */}
              {organ.secondaryMetrics && organ.secondaryMetrics.length > 0 && (
                <div className="space-y-2">
                  <div
                    className={clsx(
                      'flex items-center justify-between text-xs font-bold uppercase',
                      isPaper ? 'text-[#2d2d2d] font-sketch-hand' : isDark ? 'text-white font-sketch-hand' : 'font-mono text-slate-400'
                    )}
                  >
                    <span>SECONDARY BIOMARKERS ({organ.secondaryMetrics.length})</span>
                    <span className={isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'}>
                      CALIBRATED SENSORS
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {organ.secondaryMetrics.map((sec, idx) => (
                      <div
                        key={idx}
                        style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                        className={clsx(
                          'p-3 border transition-colors',
                          isPaper
                            ? 'border-2 border-[#2d2d2d] bg-[#fdfbf7] text-[#2d2d2d] hover:bg-[#fff9c4]/30 font-sketch-hand'
                            : isDark
                              ? 'border-2 border-[#FF4D00]/60 bg-[#0c0c10] text-white hover:border-[#FF4D00] font-sketch-hand'
                              : 'rounded-xl border border-[#1E3A5F]/70 bg-[#0B132B]/60 hover:border-cyan-500/40'
                        )}
                      >
                        <div
                          className={clsx(
                            'flex items-center justify-between text-[10px]',
                            isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'font-mono text-slate-400'
                          )}
                        >
                          <span className="truncate pr-1 font-semibold">{sec.name || sec.label}</span>
                          {sec.status && (
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                sec.status === 'warning'
                                  ? 'bg-amber-500'
                                  : sec.status === 'critical'
                                  ? 'bg-red-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                          )}
                        </div>
                        <div className="mt-1 flex items-baseline justify-between gap-1">
                          <span
                            className={clsx(
                              'text-base font-black truncate',
                              isPaper ? 'text-[#2d2d2d]' : isDark ? 'text-white' : 'font-mono text-white'
                            )}
                          >
                            {sec.value}
                          </span>
                          {sec.unit && (
                            <span
                              className={clsx(
                                'text-[10px] font-bold shrink-0',
                                isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'font-mono text-cyan-300'
                              )}
                            >
                              {sec.unit}
                            </span>
                          )}
                        </div>
                        {sec.normalRange && (
                          <div
                            className={clsx(
                              'text-[9px] mt-1',
                              isPaper ? 'text-[#2d2d2d]/60' : isDark ? 'text-white/60' : 'font-mono text-slate-500'
                            )}
                          >
                            Ref: {sec.normalRange}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Microgravity Adaptation Dossier (Sticky Note style in Paper mode) */}
              {organ.microgravityAdaptation && (
                <div
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'p-4 space-y-2.5 border transition-all',
                    isPaper
                      ? 'border-2 border-[#2d2d2d] bg-[#fff9c4] text-[#2d2d2d] sketch-shadow-sm rotate-[0.5deg] font-sketch-hand'
                      : isDark
                        ? 'border-2 border-[#FF4D00] bg-[#1a1208] text-white sketch-shadow-orange-sm font-sketch-hand'
                        : 'rounded-xl border border-cyan-500/30 bg-cyan-950/20'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles
                        className={clsx(
                          'h-4 w-4',
                          isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-300'
                        )}
                      />
                      <span
                        className={clsx(
                          'text-xs font-bold uppercase tracking-wider',
                          isPaper ? 'text-[#2d2d2d]' : isDark ? 'text-white' : 'font-mono text-cyan-300'
                        )}
                      >
                        Microgravity Adaptation Dossier
                      </span>
                    </div>
                    {organ.microgravityAdaptation.severity && (
                      <span
                        style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                        className={clsx(
                          'px-2 py-0.5 text-[10px] font-bold uppercase border',
                          isPaper
                            ? 'border-[#2d2d2d] bg-white text-[#2d5da1] font-sketch-hand'
                            : isDark
                              ? 'border-[#FF4D00] bg-black text-[#FF4D00] font-sketch-hand'
                              : 'rounded-full border border-cyan-400/40 bg-cyan-500/10 font-mono text-cyan-300'
                        )}
                      >
                        {organ.microgravityAdaptation.severity} Impact
                      </span>
                    )}
                  </div>
                  <h4
                    className={clsx(
                      'text-sm font-bold',
                      isPaper ? 'font-display-kalam text-base text-[#2d2d2d]' : isDark ? 'font-display-kalam text-base text-white' : 'font-mono text-white'
                    )}
                  >
                    {organ.microgravityAdaptation.title}
                  </h4>
                  <p
                    className={clsx(
                      'text-xs leading-relaxed',
                      isPaper ? 'text-[#2d2d2d]/90 font-sketch-hand' : isDark ? 'text-white/80 font-sketch-hand' : 'font-mono text-slate-300'
                    )}
                  >
                    {organ.microgravityAdaptation.description}
                  </p>
                  <div
                    style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                    className={clsx(
                      'p-2.5 text-[11px] border',
                      isPaper
                        ? 'border-2 border-[#2d2d2d] bg-white text-[#2d2d2d] font-sketch-hand'
                        : isDark
                          ? 'border border-[#FF4D00]/50 bg-black text-white/80 font-sketch-hand'
                          : 'rounded-lg border border-cyan-500/20 bg-[#050B14]/80 font-mono text-slate-400'
                    )}
                  >
                    <strong className={isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'}>
                      Mechanism:{' '}
                    </strong>
                    {organ.microgravityAdaptation.mechanism}
                  </div>
                </div>
              )}

              {/* Space Radiation Sensitivity Dossier */}
              {organ.radiationSensitivity && (
                <div
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'p-4 space-y-2 border transition-all',
                    isPaper
                      ? 'border-2 border-[#2d2d2d] bg-white text-[#2d2d2d] sketch-shadow-sm font-sketch-hand'
                      : isDark
                        ? 'border-2 border-[#FF4D00] bg-[#0c0c10] text-white sketch-shadow-orange-sm font-sketch-hand'
                        : 'rounded-xl border border-[#1E3A5F] bg-[#050B14]/80'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert
                        className={clsx('h-4 w-4', isPaper ? 'text-amber-600' : 'text-amber-400')}
                      />
                      <span
                        className={clsx(
                          'text-xs font-bold uppercase tracking-wider',
                          isPaper ? 'text-[#2d2d2d]' : isDark ? 'text-white' : 'font-mono text-slate-300'
                        )}
                      >
                        Space Radiation Sensitivity
                      </span>
                    </div>
                    <span
                      style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                      className={clsx(
                        'px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border',
                        isSketch ? 'font-sketch-hand' : 'rounded-full font-mono',
                        getRadBadge(organ.radiationSensitivity.level)
                      )}
                    >
                      {organ.radiationSensitivity.level} Vulnerability
                    </span>
                  </div>
                  <p
                    className={clsx(
                      'text-xs leading-relaxed',
                      isPaper ? 'text-[#2d2d2d]/90 font-sketch-hand' : isDark ? 'text-white/80 font-sketch-hand' : 'font-mono text-slate-300'
                    )}
                  >
                    {organ.radiationSensitivity.details}
                  </p>
                  {organ.radiationSensitivity.scorePercent !== undefined && (
                    <div
                      className={clsx(
                        'flex items-center gap-2 pt-1 text-[10px] font-bold',
                        isPaper ? 'text-[#2d2d2d]/80 font-sketch-hand' : isDark ? 'text-white/80 font-sketch-hand' : 'font-mono text-slate-400'
                      )}
                    >
                      <span>Vulnerability Index:</span>
                      <div
                        className={clsx(
                          'h-2 flex-1 rounded-full border',
                          isPaper ? 'bg-[#e5e0d8] border-[#2d2d2d]' : isDark ? 'bg-black border-[#FF4D00]' : 'bg-slate-800 border-transparent'
                        )}
                      >
                        <div
                          className={clsx(
                            'h-full rounded-full',
                            isPaper ? 'bg-amber-500' : isDark ? 'bg-[#FF4D00]' : 'bg-amber-400'
                          )}
                          style={{ width: `${organ.radiationSensitivity.scorePercent}%` }}
                        />
                      </div>
                      <span className={isPaper ? 'text-amber-700' : isDark ? 'text-[#FF4D00]' : 'text-amber-400'}>
                        {organ.radiationSensitivity.scorePercent}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Prescribed Countermeasures */}
              {organ.countermeasures && organ.countermeasures.length > 0 && (
                <div className="space-y-2.5">
                  <div
                    className={clsx(
                      'flex items-center justify-between text-xs font-bold uppercase',
                      isPaper ? 'text-[#2d2d2d] font-sketch-hand' : isDark ? 'text-white font-sketch-hand' : 'font-mono text-slate-400'
                    )}
                  >
                    <span>PRESCRIBED COUNTERMEASURES</span>
                    <span className={isPaper ? 'text-emerald-700' : isDark ? 'text-emerald-400' : 'text-emerald-400'}>
                      NASA FLIGHT PROTOCOLS
                    </span>
                  </div>
                  <div className="space-y-2">
                    {organ.countermeasures.map((cm, idx) => (
                      <div
                        key={idx}
                        style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                        className={clsx(
                          'p-3 border transition-colors',
                          isPaper
                            ? 'border-2 border-[#2d2d2d] bg-[#f0fdf4] text-[#2d2d2d] font-sketch-hand'
                            : isDark
                              ? 'border-2 border-emerald-500/60 bg-[#051e13] text-white font-sketch-hand'
                              : 'rounded-xl border border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-500/40'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2
                              className={clsx(
                                'h-4 w-4 shrink-0',
                                isPaper ? 'text-emerald-700' : 'text-emerald-400'
                              )}
                            />
                            <h5
                              className={clsx(
                                'text-xs font-bold',
                                isPaper ? 'text-[#2d2d2d]' : 'text-white'
                              )}
                            >
                              {cm.name}
                            </h5>
                          </div>
                          {cm.frequency && (
                            <span
                              style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                              className={clsx(
                                'px-2 py-0.5 text-[9px] font-bold border shrink-0',
                                isPaper
                                  ? 'border-[#2d2d2d] bg-white text-emerald-800 font-sketch-hand'
                                  : isDark
                                    ? 'border-emerald-400 bg-black text-emerald-300 font-sketch-hand'
                                    : 'rounded bg-slate-900 font-mono text-emerald-400 border-emerald-500/30'
                              )}
                            >
                              {cm.frequency}
                            </span>
                          )}
                        </div>
                        <p
                          className={clsx(
                            'mt-1.5 text-[11px] pl-6 leading-relaxed',
                            isPaper ? 'text-[#2d2d2d]/85' : isDark ? 'text-white/80' : 'text-slate-300 font-mono'
                          )}
                        >
                          {cm.protocol}
                        </p>
                        <div
                          className={clsx(
                            'mt-1 text-[10px] pl-6',
                            isPaper ? 'text-[#2d2d2d]/60' : isDark ? 'text-white/60' : 'text-slate-500 font-mono'
                          )}
                        >
                          Type: {cm.type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 24-Hour Historical Health Score Trend (SVG Sparkline) */}
              {organ.trend24h && organ.trend24h.length > 0 && (
                <div
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'p-4 space-y-3 border transition-all',
                    isPaper
                      ? 'border-2 border-[#2d2d2d] bg-[#fdfbf7] text-[#2d2d2d] sketch-shadow-sm font-sketch-hand'
                      : isDark
                        ? 'border-2 border-[#FF4D00] bg-[#0c0c10] text-white sketch-shadow-orange-sm font-sketch-hand'
                        : 'rounded-xl border border-[#1E3A5F] bg-[#050B14]/85'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp
                        className={clsx(
                          'h-4 w-4',
                          isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'
                        )}
                      />
                      <span
                        className={clsx(
                          'text-xs font-bold uppercase tracking-wider',
                          isPaper ? 'text-[#2d2d2d]' : isDark ? 'text-white' : 'font-mono text-slate-300'
                        )}
                      >
                        24-Hour Functional Score Trajectory
                      </span>
                    </div>
                    <span
                      className={clsx(
                        'text-[10px]',
                        isPaper ? 'text-[#2d2d2d]/60' : isDark ? 'text-white/60' : 'font-mono text-slate-400'
                      )}
                    >
                      ORBITAL TIME (UTC)
                    </span>
                  </div>

                  {/* SVG Trendline Graphic */}
                  <div className="relative h-28 w-full pt-2">
                    {/* Grid Lines */}
                    <div
                      className={clsx(
                        'absolute inset-x-0 top-2 border-b',
                        isPaper ? 'border-[#2d2d2d]/15' : isDark ? 'border-[#FF4D00]/25' : 'border-slate-800/60'
                      )}
                    />
                    <div
                      className={clsx(
                        'absolute inset-x-0 top-1/2 border-b',
                        isPaper ? 'border-[#2d2d2d]/10' : isDark ? 'border-[#FF4D00]/15' : 'border-slate-800/40'
                      )}
                    />
                    <div
                      className={clsx(
                        'absolute inset-x-0 bottom-6 border-b',
                        isPaper ? 'border-[#2d2d2d]/15' : isDark ? 'border-[#FF4D00]/25' : 'border-slate-800/60'
                      )}
                    />

                    <svg className="h-20 w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 50">
                      <defs>
                        <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop
                            offset="0%"
                            stopColor={isPaper ? '#2d5da1' : isDark ? '#FF4D00' : '#00E5FF'}
                            stopOpacity={isPaper ? '0.25' : '0.4'}
                          />
                          <stop
                            offset="100%"
                            stopColor={isPaper ? '#2d5da1' : isDark ? '#FF4D00' : '#00E5FF'}
                            stopOpacity="0.0"
                          />
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

                        const strokeColor = isPaper ? '#2d5da1' : isDark ? '#FF4D00' : '#00E5FF';
                        const dotFill = isPaper ? '#fff9c4' : isDark ? '#000000' : '#0B132B';

                        return (
                          <>
                            <path d={areaD} fill="url(#trendGradient)" />
                            <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
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
                                  fill={dotFill}
                                  stroke={strokeColor}
                                  strokeWidth="1.5"
                                />
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>

                    {/* Horizontal Time Labels */}
                    <div
                      className={clsx(
                        'flex justify-between text-[9px] pt-1 font-bold',
                        isPaper ? 'text-[#2d2d2d]/60 font-sketch-hand' : isDark ? 'text-white/60 font-sketch-hand' : 'text-slate-500 font-mono'
                      )}
                    >
                      {organ.trend24h.map((p, i) => (
                        <span key={i}>{p.time}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Flight Surgeon Notes & Directives Section */}
              <div
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'p-4 space-y-3 border transition-all',
                  isPaper
                    ? 'border-2 border-[#2d2d2d] bg-white text-[#2d2d2d] sketch-shadow-sm font-sketch-hand'
                    : isDark
                      ? 'border-2 border-[#FF4D00] bg-[#0c0c10] text-white sketch-shadow-orange-sm font-sketch-hand'
                      : 'rounded-xl border border-[#1E3A5F] bg-[#050B14]/80'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText
                      className={clsx(
                        'h-4 w-4',
                        isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'
                      )}
                    />
                    <span
                      className={clsx(
                        'text-xs font-bold uppercase tracking-wider',
                        isPaper ? 'text-[#2d2d2d]' : isDark ? 'text-white' : 'font-mono text-slate-300'
                      )}
                    >
                      Flight Surgeon Action Directives
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNoteModalOpen(true)}
                    style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                    className={clsx(
                      'px-2.5 py-1 text-[11px] font-bold border transition-colors cursor-pointer select-none',
                      isPaper
                        ? 'border-2 border-[#2d2d2d] bg-[#2d5da1] text-white hover:bg-[#204375] sketch-btn font-sketch-hand'
                        : isDark
                          ? 'border-2 border-[#FF4D00] bg-[#FF4D00] text-black hover:bg-[#ff6a26] sketch-btn-orange font-sketch-hand'
                          : 'rounded-lg border border-cyan-500/40 bg-cyan-500/15 font-mono text-cyan-300 hover:bg-cyan-500/25'
                    )}
                  >
                    + Add Directive Note
                  </button>
                </div>

                {/* List of existing directives */}
                {localNotes.length === 0 && (!organ.notes || organ.notes.length === 0) ? (
                  <p
                    className={clsx(
                      'text-xs italic',
                      isPaper ? 'text-[#2d2d2d]/60 font-sketch-hand' : isDark ? 'text-white/60 font-sketch-hand' : 'text-slate-500 font-mono'
                    )}
                  >
                    No active clinical directives issued for this system. Nominal mission baseline.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {[...localNotes, ...(organ.notes || [])].map((note, i) => (
                      <div
                        key={i}
                        style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                        className={clsx(
                          'p-2.5 space-y-1 text-xs border',
                          isPaper
                            ? 'border-2 border-[#2d2d2d] bg-[#fff9c4] text-[#2d2d2d] font-sketch-hand'
                            : isDark
                              ? 'border border-[#FF4D00]/60 bg-[#18110c] text-white font-sketch-hand'
                              : 'rounded-lg border border-[#1E3A5F] bg-[#0B132B] font-mono'
                        )}
                      >
                        <div
                          className={clsx(
                            'flex items-center justify-between text-[10px] font-bold',
                            isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'
                          )}
                        >
                          <span>{note.author} ({note.role})</span>
                          <span className={isPaper ? 'text-[#2d2d2d]/60' : 'text-slate-500'}>{note.timestamp}</span>
                        </div>
                        <p className={isPaper ? 'text-[#2d2d2d]' : isDark ? 'text-white/90' : 'text-slate-300 text-[11px]'}>
                          {note.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Inline Note Modal / Form */}
              {isNoteModalOpen && (
                <form
                  onSubmit={handleSendDirective}
                  style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
                  className={clsx(
                    'p-4 space-y-3 border animate-fadeIn',
                    isPaper
                      ? 'border-[3px] border-[#2d2d2d] bg-white text-[#2d2d2d] sketch-shadow-lg font-sketch-hand'
                      : isDark
                        ? 'border-2 border-[#FF4D00] bg-[#0c0c10] text-white sketch-shadow-orange-lg font-sketch-hand'
                        : 'rounded-xl border border-cyan-400/50 bg-[#0B132B] shadow-[0_0_20px_rgba(0,229,255,0.2)]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={clsx(
                        'text-xs font-bold uppercase',
                        isPaper ? 'text-[#2d2d2d] font-sketch-hand' : isDark ? 'text-white font-sketch-hand' : 'font-mono text-cyan-300'
                      )}
                    >
                      Issue Clinical Directive ({organ.name})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsNoteModalOpen(false)}
                      className={isPaper ? 'text-[#2d2d2d] hover:text-black' : 'text-slate-400 hover:text-white'}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    value={directiveNote}
                    onChange={(e) => setDirectiveNote(e.target.value)}
                    placeholder="e.g. Prescribe +15 min LBNP protocol and verify hydration index before next EVA sortie..."
                    rows={3}
                    style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                    className={clsx(
                      'w-full p-2.5 text-xs border focus:outline-none',
                      isPaper
                        ? 'border-2 border-[#2d2d2d] bg-[#fdfbf7] text-[#2d2d2d] placeholder-[#2d2d2d]/50 font-sketch-hand'
                        : isDark
                          ? 'border-2 border-[#FF4D00] bg-black text-white placeholder-slate-400 font-sketch-hand'
                          : 'rounded-lg border border-[#1E3A5F] bg-[#050B14] font-mono text-white placeholder-slate-500 focus:border-cyan-400'
                    )}
                    required
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsNoteModalOpen(false)}
                      style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                      className={clsx(
                        'px-3 py-1 text-xs border cursor-pointer select-none',
                        isPaper
                          ? 'border-2 border-[#2d2d2d] bg-[#fdfbf7] text-[#2d2d2d] hover:bg-[#fff9c4] font-sketch-hand'
                          : isDark
                            ? 'border border-white/40 bg-black text-white hover:border-white font-sketch-hand'
                            : 'rounded-lg border border-slate-700 font-mono text-slate-400 hover:bg-slate-800'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingNote}
                      style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1 text-xs font-bold border transition-colors disabled:opacity-50 cursor-pointer select-none',
                        isPaper
                          ? 'border-2 border-[#2d2d2d] bg-[#2d5da1] text-white hover:bg-[#204375] sketch-btn font-sketch-hand'
                          : isDark
                            ? 'border-2 border-[#FF4D00] bg-[#FF4D00] text-black hover:bg-[#ff6a26] sketch-btn-orange font-sketch-hand'
                            : 'rounded-lg border border-cyan-400 bg-cyan-500/25 font-mono text-cyan-300 hover:bg-cyan-500/40'
                      )}
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
        <div
          className={clsx(
            'p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs shrink-0 border-t',
            isPaper
              ? 'bg-[#fff9c4] border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand'
              : isDark
                ? 'bg-[#18110c] border-[#FF4D00] text-white font-sketch-hand'
                : 'border-[#1E3A5F] bg-[#0B132B]/90 font-mono text-slate-400'
          )}
        >
          <div className="flex items-center gap-2">
            <Activity className={clsx('h-4 w-4', isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400')} />
            <span className="font-bold">AuraMed Bio-Twin Core v3.2</span>
          </div>
          <button
            type="button"
            onClick={() => setIsNoteModalOpen(true)}
            style={isSketch ? getWobblyStyle('wobblySm') : undefined}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 font-bold border transition-colors cursor-pointer select-none',
              isPaper
                ? 'border-2 border-[#2d2d2d] bg-[#2d5da1] text-white hover:bg-[#204375] sketch-btn'
                : isDark
                  ? 'border-2 border-[#FF4D00] bg-[#FF4D00] text-black hover:bg-[#ff6a26] sketch-btn-orange'
                  : 'rounded-lg border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/30'
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            Directive Action
          </button>
        </div>
      </aside>
    </>
  );
};

export default OrganDetailDrawer;
