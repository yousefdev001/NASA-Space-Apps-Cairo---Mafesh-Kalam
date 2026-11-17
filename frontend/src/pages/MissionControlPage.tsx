import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  AlertTriangle,
  Cpu,
  Clock,
  Heart,
  Wind,
  Brain,
  Activity,
  Droplets,
  User as UserIcon,
  RefreshCw,
  Palette,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EcgCanvas } from '../components/charts/EcgCanvas';
import { OrganRadarChart } from '../components/charts/OrganRadarChart';
import { RadiationGauge } from '../components/charts/RadiationGauge';
import { VitalsStreamChart } from '../components/charts/VitalsStreamChart';
import { OrganTelemetryGrid } from '../components/telemetry/OrganTelemetryGrid';
import { SuitTelemetryCard, SuitTelemetryData } from '../components/telemetry/SuitTelemetryCard';
import { NeuroRiskCard, NeuroRiskData } from '../components/telemetry/NeuroRiskCard';
import {
  getWobblyStyle,
  Tape,
  PushPin,
  SquiggleUnderline,
  SketchbookMode,
} from '../components/sketchbook';
import { OrganSystemData } from '../types/telemetry.types';
import apiClient from '../api/client';

interface CrewMember {
  id: number;
  callsign: string;
  name: string;
  role: string;
  zone: string;
  hr: number;
  spo2: number;
  status: 'nominal' | 'warning' | 'critical';
  eva_hours: number;
}

interface VitalsHistoryPoint {
  time: string;
  hr: number;
  spo2: number;
  temp: number;
  status: string;
}

interface MissionData {
  id: number;
  mission_code: string;
  name: string;
  destination: string;
  vehicle_name: string;
  launch_date: string;
  status: string;
}

interface CabinEnvironment {
  cabin_pressure_kpa: number;
  o2_percent: number;
  co2_ppm: number;
  temperature_celsius: number;
  humidity_percent: number;
}

interface RadiationData {
  dose_rate_msv_hr: number;
  cumulative_dose_msv: number;
  shelter_recommended: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  cardiovascular: Heart,
  lungs: Wind,
  respiratory: Wind,
  brain: Brain,
  central_nervous: Brain,
  liver: Activity,
  hepatic: Activity,
  kidneys: Droplets,
  renal: Droplets,
  whole_body: UserIcon,
  systemic: UserIcon,
};

export const MissionControlPage: React.FC = () => {
  const navigate = useNavigate();
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [selectedCrewId, setSelectedCrewId] = useState<number>(1);
  const [mission, setMission] = useState<MissionData | null>(null);
  const [organs, setOrgans] = useState<OrganSystemData[]>([]);
  const [vitalsHistory, setVitalsHistory] = useState<VitalsHistoryPoint[]>([]);
  const [radiation, setRadiation] = useState<RadiationData>({
    dose_rate_msv_hr: 0.042,
    cumulative_dose_msv: 14.2,
    shelter_recommended: false,
  });
  const [cabinEnv, setCabinEnv] = useState<CabinEnvironment>({
    cabin_pressure_kpa: 101.3,
    o2_percent: 21.2,
    co2_ppm: 380,
    temperature_celsius: 22.4,
    humidity_percent: 46.0,
  });
  const [unresolvedAlertsCount, setUnresolvedAlertsCount] = useState<number>(2);
  const [suitData, setSuitData] = useState<SuitTelemetryData | undefined>(undefined);
  const [neuroData, setNeuroData] = useState<NeuroRiskData | undefined>(undefined);
  const [lastSyncTime, setLastSyncTime] = useState<string>('SYNCHRONIZED');
  const [metString, setMetString] = useState<string>('042d 14h 22m 00s');

  // Sketchbook Theme Mode: 'paper' (default) | 'dark' | 'cyber'
  const [sketchMode, setSketchMode] = useState<SketchbookMode>(() => {
    const saved = localStorage.getItem('auramed_sketchbook_mode');
    return saved === 'dark' || saved === 'cyber' || saved === 'paper' ? saved : 'paper';
  });

  const handleModeChange = (newMode: SketchbookMode) => {
    setSketchMode(newMode);
    localStorage.setItem('auramed_sketchbook_mode', newMode);
  };

  const isPaper = sketchMode === 'paper';
  const isDark = sketchMode === 'dark';
  const isSketch = isPaper || isDark;

  const selectedCrew = crewMembers.find((c) => c.id === selectedCrewId) || crewMembers[0];

  // MET (Mission Elapsed Time) ticking counter
  useEffect(() => {
    const launchTime = mission?.launch_date
      ? new Date(mission.launch_date).getTime()
      : Date.now() - 42 * 86400000 - 14 * 3600000;

    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = Math.max(0, now - launchTime);
      const days = Math.floor(diffMs / (86400000));
      const hours = Math.floor((diffMs % 86400000) / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      setMetString(
        `${String(days).padStart(3, '0')}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [mission?.launch_date]);

  // Fetch telemetry from backend
  const fetchTelemetry = useCallback(async (astroId: number) => {
    try {
      const res = await apiClient.get('/dashboard/mission-control', {
        params: { astronaut_id: astroId },
      });

      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        if (d.mission) setMission(d.mission);
        if (d.crew && Array.isArray(d.crew)) setCrewMembers(d.crew);
        if (d.cabin_environment) setCabinEnv(d.cabin_environment);
        if (d.radiation) setRadiation(d.radiation);
        if (d.suit_telemetry) setSuitData(d.suit_telemetry);
        if (d.neuro_risk) setNeuroData(d.neuro_risk);
        if (typeof d.unresolved_alerts_count === 'number') {
          setUnresolvedAlertsCount(d.unresolved_alerts_count);
        }

        // Format organs data
        if (d.organs && Array.isArray(d.organs)) {
          const seen = new Set<string>();
          const formattedOrgans: OrganSystemData[] = [];
          for (const o of d.organs) {
            const slug = (o.slug || '').toLowerCase();
            const organId = slug || `organ-${(o.name || '').toLowerCase()}`;
            if (!seen.has(organId)) {
              seen.add(organId);
              const IconComponent = ICON_MAP[slug] || Heart;
              formattedOrgans.push({
                id: organId,
                name: o.name,
                system: o.category || 'Organ System',
                score: Math.round(Number(o.score) || 90),
                status: (o.status as any) || 'nominal',
                metricValue: o.metric_value || `${o.score}%`,
                icon: IconComponent,
              });
            }
          }
          setOrgans(formattedOrgans);
        }

        // Format vitals history
        if (d.vitals_history && Array.isArray(d.vitals_history)) {
          setVitalsHistory(d.vitals_history);
        }

        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Mission control telemetry fetch error:', err);
    }
  }, []);

  // Initial load and astronaut switch
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void fetchTelemetry(selectedCrewId);
  }, [selectedCrewId, fetchTelemetry]);

  // Smooth polling every 4 seconds without UI interruption
  useEffect(() => {
    const pollInterval = setInterval(() => {
      void fetchTelemetry(selectedCrewId);
    }, 4000);
    return () => clearInterval(pollInterval);
  }, [selectedCrewId, fetchTelemetry]);

  // Map scores for OrganRadarChart
  const radarScores = {
    heart: organs.find((o) => o.id === 'heart')?.score || 92,
    lungs: organs.find((o) => o.id === 'lungs')?.score || 96,
    brain: organs.find((o) => o.id === 'brain')?.score || 95,
    liver: organs.find((o) => o.id === 'liver')?.score || 92,
    kidneys: organs.find((o) => o.id === 'kidneys')?.score || 92,
    wholeBody: organs.find((o) => o.id === 'whole_body')?.score || 94,
  };

  return (
    <div
      className={clsx(
        'transition-colors duration-200 space-y-6',
        isSketch && '-m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-full',
        isPaper && 'paper-grain text-[#2d2d2d] font-sketch-hand',
        isDark && 'paper-grain-dark text-white font-sketch-hand'
      )}
    >
      {/* Theme Switcher Bar */}
      <div
        style={isSketch ? getWobblyStyle('wobblySm') : undefined}
        className={clsx(
          'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border-[2.5px] transition-all select-none',
          isPaper
            ? 'bg-white text-[#2d2d2d] border-[#2d2d2d] sketch-shadow'
            : isDark
              ? 'bg-[#0c0c10] text-white border-[#FF4D00] sketch-shadow-orange'
              : 'bg-[#0B132B]/80 text-[#E2E8F0] border-[#1E3A5F] rounded-xl'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
            className={clsx(
              'w-8 h-8 flex items-center justify-center border shrink-0',
              isPaper
                ? 'bg-[#fff9c4] border-[#2d2d2d] text-[#2d2d2d]'
                : isDark
                  ? 'bg-[#FF4D00] border-white text-black'
                  : 'bg-cyan-500/20 border-cyan-400 text-cyan-300 rounded-lg'
            )}
          >
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={clsx(
                  'font-bold',
                  isSketch ? 'font-display-kalam text-base sm:text-lg' : 'font-mono text-sm'
                )}
              >
                THEME TRIAL · AURA-MED SKETCHBOOK
              </span>
              <span
                style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                className={clsx(
                  'text-[10px] font-bold uppercase px-2 py-0.5 border',
                  isPaper
                    ? 'bg-[#ff4d4d] text-white border-[#2d2d2d]'
                    : isDark
                      ? 'bg-[#FF4D00] text-black border-white'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-400 rounded'
                )}
              >
                {isSketch ? 'ro2ya-tech.com Live Style' : 'Default HUD'}
              </span>
            </div>
            <p
              className={clsx(
                'text-xs',
                isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'text-slate-400',
                isSketch ? 'font-sketch-hand' : 'font-mono'
              )}
            >
              Hand-drawn Astronaut Field Notebook Aesthetic · NASA STD-3001
            </p>
          </div>
        </div>

        {/* 3-way Mode Switcher */}
        <div
          className={clsx(
            'flex items-center gap-1.5 p-1 border rounded-lg',
            isPaper
              ? 'bg-[#e5e0d8]/60 border-[#2d2d2d]/30'
              : isDark
                ? 'bg-black/60 border-[#FF4D00]/50'
                : 'bg-black/30 border-[#1E3A5F]'
          )}
        >
          <button
            type="button"
            onClick={() => handleModeChange('paper')}
            style={isPaper ? getWobblyStyle('wobblyTag') : undefined}
            className={clsx(
              'px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              isPaper
                ? 'bg-[#fff9c4] text-[#2d2d2d] border-2 border-[#2d2d2d] font-sketch-hand sketch-btn'
                : 'text-slate-400 hover:text-white'
            )}
          >
            📜 Paper Mode
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('dark')}
            style={isDark ? getWobblyStyle('wobblyTag') : undefined}
            className={clsx(
              'px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              isDark
                ? 'bg-[#FF4D00] text-black border-2 border-white font-sketch-hand sketch-btn-orange'
                : 'text-slate-400 hover:text-white'
            )}
          >
            📓 Mission Dark
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('cyber')}
            className={clsx(
              'px-3 py-1.5 text-xs font-mono font-semibold transition-all rounded cursor-pointer whitespace-nowrap',
              sketchMode === 'cyber'
                ? 'bg-cyan-500 text-black border border-cyan-400 font-bold'
                : 'text-slate-400 hover:text-cyan-300'
            )}
          >
            🚀 Cyber Cockpit
          </button>
        </div>
      </div>

      {/* Top Mission Status Strip / Sketchbook Header */}
      {isSketch ? (
        <div
          style={getWobblyStyle('wobblyMd')}
          className={clsx(
            'relative p-5 sm:p-7 border-[3px] transition-all flex flex-col lg:flex-row lg:items-end justify-between gap-6',
            isPaper
              ? 'bg-white text-[#2d2d2d] border-[#2d2d2d] sketch-shadow'
              : 'bg-[#0c0c10] text-white border-[#FF4D00] sketch-shadow-orange'
          )}
        >
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
            <Tape isDark={isDark} />
          </div>
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                style={getWobblyStyle('wobblyTag')}
                className={clsx(
                  'px-3 py-0.5 text-xs font-bold border-2 tracking-wide uppercase',
                  isPaper
                    ? 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d]'
                    : 'bg-[#FF4D00] text-black border-white'
                )}
              >
                NASA STD-3001 Clinical Architecture
              </span>
              <span
                className={clsx('text-xs font-bold', isPaper ? 'text-[#2d5da1]' : 'text-[#FF4D00]')}
              >
                {mission ? `${mission.mission_code} · ${mission.name}` : 'Artemis IV'} ·{' '}
                {mission?.destination || 'Lunar South Pole Gateway'}
              </span>
            </div>
            <h1 className="font-display-kalam font-bold text-2xl sm:text-4xl lg:text-5xl tracking-wide leading-tight">
              AuraMed — Orbital Astronaut Biometric Sketchbook
            </h1>
            <div className={clsx('w-48 sm:w-72', isPaper ? 'text-[#ff4d4d]' : 'text-[#FF4D00]')}>
              <SquiggleUnderline />
            </div>
            <p
              className={clsx(
                'text-sm sm:text-base leading-relaxed pt-1',
                isPaper ? 'text-[#2d2d2d]/85' : 'text-white/85'
              )}
            >
              Real-time astronaut biometric, EVA suit pressure, cardiac rhythm, and radiation dosimetry
              monitoring for deep-space human flight.
            </p>
          </div>

          {/* Tickers & Action */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div
              style={getWobblyStyle('wobblyTag')}
              className={clsx(
                'flex items-center gap-2 px-3.5 py-1.5 border-2 text-sm font-bold',
                isPaper
                  ? 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d]'
                  : 'bg-[#18110c] text-[#FF4D00] border-[#FF4D00]'
              )}
            >
              <Clock className="w-4 h-4 text-amber-500" />
              <span>MET: {metString}</span>
            </div>
            <div
              style={getWobblyStyle('wobblyTag')}
              className={clsx(
                'flex items-center gap-2 px-3.5 py-1.5 border-2 text-sm font-bold',
                isPaper
                  ? 'bg-emerald-100 text-emerald-950 border-[#2d2d2d]'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-400'
              )}
            >
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>500 HZ BIO-DOWNLINK</span>
            </div>
            <button
              type="button"
              onClick={() => void fetchTelemetry(selectedCrewId)}
              title="Sync now"
              style={getWobblyStyle('wobblyCircle')}
              className={clsx(
                'w-10 h-10 border-2 flex items-center justify-center sketch-btn cursor-pointer',
                isPaper
                  ? 'bg-white border-[#2d2d2d] text-[#2d2d2d] hover:bg-[#fff9c4]'
                  : 'bg-black border-[#FF4D00] text-white hover:bg-[#FF4D00] hover:text-black'
              )}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-[#0B132B]/80 border border-[#1E3A5F]">
          <div className="flex flex-wrap items-center gap-3">
            <Badge status="nominal">MISSION ACTIVE</Badge>
            <div className="text-sm font-mono">
              <span className="text-slate-400">EXPEDITION:</span>{' '}
              <span className="text-white font-bold">
                {mission ? `${mission.mission_code} · ${mission.name}` : 'ARTEMIS IV · ORBITAL HABITAT'}
              </span>
            </div>
            <span className="text-[#1E3A5F] hidden sm:inline">|</span>
            <div className="text-xs font-mono text-cyan-400">
              TARGET: {mission?.destination || 'LUNAR SOUTH POLE GATEWAY'}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-mono bg-[#050B14] px-3 py-1.5 rounded-lg border border-[#1E3A5F]">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">MET:</span>
              <span className="text-amber-400 font-bold">{metString}</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono bg-[#050B14] px-3 py-1.5 rounded-lg border border-[#1E3A5F]">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="text-slate-400">DOWNLINK:</span>
              <span className="text-emerald-400 font-bold">500 HZ BURST NOMINAL</span>
            </div>

            <button
              type="button"
              onClick={() => void fetchTelemetry(selectedCrewId)}
              title="Manual sync now"
              className="p-1.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] hover:border-cyan-400 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Crew Selection Bar */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <p
            className={clsx(
              'uppercase font-bold tracking-wider',
              isPaper
                ? 'text-[#2d5da1] font-sketch-hand text-base'
                : isDark
                  ? 'text-[#FF4D00] font-sketch-hand text-base'
                  : 'text-xs font-mono text-slate-400'
            )}
          >
            ORBITAL CREW TELEMETRY SELECTION (LIVE BIO-DOWNLINK)
          </p>
          <span
            className={clsx(
              'text-xs font-semibold',
              isPaper ? 'text-[#2d2d2d]/65 font-sketch-hand' : isDark ? 'text-white/65 font-sketch-hand' : 'text-slate-500 font-mono text-[11px]'
            )}
          >
            LAST SYNC: {lastSyncTime}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {crewMembers.map((member) => {
            const isSelected = selectedCrewId === member.id;

            if (isSketch) {
              return (
                <div
                  key={member.id}
                  onClick={() => setSelectedCrewId(member.id)}
                  style={getWobblyStyle('wobblySm')}
                  className={clsx(
                    'relative p-4 border-[3px] transition-all cursor-pointer select-none flex items-center justify-between sketch-btn',
                    isPaper
                      ? isSelected
                        ? 'bg-[#fff9c4] border-[#ff4d4d] sketch-shadow -rotate-1'
                        : 'bg-white border-[#2d2d2d] hover:bg-[#fff9c4]/50'
                      : isSelected
                        ? 'bg-[#18110c] border-[#FF4D00] sketch-shadow-orange -rotate-1'
                        : 'bg-[#0c0c10] border-white/40 hover:border-[#FF4D00]'
                  )}
                >
                  {isSelected && (
                    <div className="absolute -top-3 left-4 z-10">
                      <PushPin isDark={isDark} />
                    </div>
                  )}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      style={getWobblyStyle('wobblyCircle')}
                      className={clsx(
                        'w-11 h-11 border-2 flex items-center justify-center font-bold text-sm shrink-0',
                        isPaper
                          ? isSelected
                            ? 'bg-[#ff4d4d] text-white border-[#2d2d2d]'
                            : 'bg-[#e5e0d8] text-[#2d2d2d] border-[#2d2d2d]'
                          : isSelected
                            ? 'bg-[#FF4D00] text-black border-white'
                            : 'bg-black text-white border-white/60'
                      )}
                    >
                      {member.callsign}
                    </div>
                    <div className="truncate">
                      <h4 className="font-display-kalam font-bold text-base truncate leading-snug">
                        {member.name}
                      </h4>
                      <p
                        className={clsx(
                          'text-xs truncate font-sketch-hand',
                          isPaper ? 'text-[#2d2d2d]/70' : 'text-white/70'
                        )}
                      >
                        {member.zone}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <Badge status={member.status} themeMode={sketchMode}>
                      {member.status}
                    </Badge>
                    <p
                      className={clsx(
                        'font-sketch-hand text-sm font-bold mt-1',
                        isPaper ? 'text-[#ff4d4d]' : 'text-[#FF4D00]'
                      )}
                    >
                      {member.hr} BPM
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={member.id}
                onClick={() => setSelectedCrewId(member.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.25)] ring-1 ring-cyan-400'
                    : 'bg-[#0B132B]/60 border-[#1E3A5F] hover:border-cyan-500/40 hover:bg-[#0B132B]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full border flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                        : 'bg-[#050B14] border-slate-700 text-slate-300'
                    }`}
                  >
                    {member.callsign}
                  </div>
                  <div className="truncate">
                    <h4 className="text-sm font-bold text-white truncate leading-snug">
                      {member.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">{member.zone}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <Badge status={member.status}>{member.status}</Badge>
                  <p className="text-xs font-mono text-cyan-400 mt-1 font-bold">
                    {member.hr} BPM
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Physiological 6-Organ Bio-Scan: Compact Gauges directly below Crew Selection */}
      <Card
        themeMode={sketchMode}
        decoration={isSketch ? 'tape' : 'none'}
        title={`PHYSIOLOGICAL 6-ORGAN BIO-SCAN · ${selectedCrew?.callsign || 'CDR-01'} (${selectedCrew?.name || 'Astronaut'})`}
        subtitle={`Direct offline sync from crew spacesuit bio-sensor nodes · Total EVA: ${selectedCrew?.eva_hours || 0} Hours`}
      >
        <OrganTelemetryGrid
          organs={organs.length > 0 ? organs : undefined}
          compact
          themeMode={sketchMode}
        />
      </Card>

      {/* Primary Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): ECG, Vitals Stream */}
        <div className="lg:col-span-8 space-y-6">
          {/* Real-time ECG Waveform Canvas */}
          <Card
            themeMode={sketchMode}
            decoration={isSketch ? 'pin' : 'none'}
            title={`CONTINUOUS CARDIAC ARRAY · ${selectedCrew?.callsign || 'CDR-01'} (${selectedCrew?.name || 'Elena Vance'})`}
            subtitle={`Holographic Lead II Vector Electrocardiogram · 500 Hz Sampling Frequency · Station: ${selectedCrew?.zone || 'Habitation'}`}
          >
            <EcgCanvas
              bpm={selectedCrew?.hr || 62}
              height={150}
              isNominal={selectedCrew?.status === 'nominal'}
              mode={sketchMode}
            />
          </Card>

          {/* Vitals Stream Line Chart (ECharts) */}
          <Card
            themeMode={sketchMode}
            title={`15-MINUTE TELEMETRY STREAM · ${selectedCrew?.name || 'Astronaut'}`}
            subtitle="Real-time Heart Rate (BPM) & SpO2 (%) Time-Series Downlink"
          >
            <VitalsStreamChart
              dataPoints={vitalsHistory.length > 0 ? vitalsHistory : undefined}
              height="280px"
            />
          </Card>

          {/* Advanced Aerospace Telemetry: Spacesuit xEMU & Neuro-Cognitive SANS Risk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SuitTelemetryCard
              suit={suitData}
              callsign={selectedCrew?.callsign}
              themeMode={sketchMode}
            />
            <NeuroRiskCard
              data={neuroData}
              callsign={selectedCrew?.callsign}
              themeMode={sketchMode}
            />
          </div>
        </div>

        {/* Right Column (4 cols): Radar, Radiation, Environment, Triage */}
        <div className="lg:col-span-4 space-y-6">
          {/* Organ Integrity Radar Chart */}
          <Card
            themeMode={sketchMode}
            title="SYSTEMS INTEGRITY RADAR"
            subtitle={`Hexagonal Organ Health Distribution · ${selectedCrew?.name || 'Astronaut'}`}
          >
            <OrganRadarChart scores={radarScores} height="270px" />
          </Card>

          {/* Radiation Dosimeter Gauge */}
          <Card
            themeMode={sketchMode}
            title="ACTIVE RADIATION DOSIMETER"
            subtitle="Galactic Cosmic Radiation & SPE Cumulative Exposure"
          >
            <RadiationGauge
              valueMsvHr={radiation.dose_rate_msv_hr}
              cumulativeMsv={radiation.cumulative_dose_msv}
              height="220px"
            />
          </Card>

          {/* Cabin Environment Panel */}
          <Card
            themeMode={sketchMode}
            decoration={isSketch ? 'pin' : 'none'}
            title="CABIN LIFE SUPPORT (ECLSS)"
            subtitle="Habitat Atmospheric Equilibrium"
          >
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'PRESSURE', value: `${cabinEnv.cabin_pressure_kpa} kPa`, sub: 'NOMINAL' },
                { label: 'OXYGEN (O2)', value: `${cabinEnv.o2_percent} %`, sub: 'NOMINAL' },
                { label: 'CARBON DIOXIDE', value: `${cabinEnv.co2_ppm} ppm`, sub: 'SAFE LIMIT' },
                {
                  label: 'TEMPERATURE',
                  value: `${cabinEnv.temperature_celsius} °C`,
                  sub: 'COMFORT ZONE',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'p-2.5 border transition-all',
                    isPaper
                      ? 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d] sketch-shadow font-sketch-hand'
                      : isDark
                        ? 'bg-[#18110c] text-white border-[#FF4D00] sketch-shadow-orange font-sketch-hand'
                        : 'bg-[#050B14] border-[#1E3A5F] rounded-lg font-mono'
                  )}
                >
                  <span
                    className={clsx(
                      'block text-[10px] font-bold',
                      isPaper
                        ? 'text-[#2d2d2d]/70'
                        : isDark
                          ? 'text-white/70'
                          : 'text-slate-400'
                    )}
                  >
                    {item.label}
                  </span>
                  <span
                    className={clsx(
                      'font-bold text-sm block mt-0.5',
                      isPaper
                        ? 'text-[#ff4d4d]'
                        : isDark
                          ? 'text-[#FF4D00]'
                          : 'text-cyan-400'
                    )}
                  >
                    {item.value}
                  </span>
                  <span
                    className={clsx(
                      'text-[10px] block font-semibold mt-0.5',
                      isPaper
                        ? 'text-[#2d5da1]'
                        : isDark
                          ? 'text-emerald-400'
                          : 'text-emerald-400'
                    )}
                  >
                    {item.sub}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Clinical Decision & Alert Triage Queue */}
          <Card
            themeMode={sketchMode}
            decoration={isSketch ? 'tape' : 'none'}
            title={`CLINICAL ACTION QUEUE (${unresolvedAlertsCount})`}
            subtitle="NASA Flight Surgeon Urgent Protocols"
          >
            <div className="space-y-3">
              <div
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'p-3 border transition-all space-y-1',
                  isPaper
                    ? 'bg-[#fff9c4] border-[#2d2d2d] text-[#2d2d2d] sketch-shadow font-sketch-hand -rotate-0.5'
                    : isDark
                      ? 'bg-[#18110c] border-[#FF4D00] text-white sketch-shadow-orange font-sketch-hand'
                      : 'p-3 rounded-lg bg-amber-950/30 border border-amber-500/40 text-xs font-mono space-y-1'
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={clsx(
                      'font-bold flex items-center gap-1.5 text-xs',
                      isPaper
                        ? 'text-[#ff4d4d]'
                        : isDark
                          ? 'text-[#FF4D00]'
                          : 'text-amber-400'
                    )}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> ALT-094 · ELEVATED HR
                  </span>
                  <Badge status="warning" themeMode={sketchMode}>
                    WARNING
                  </Badge>
                </div>
                <p
                  className={clsx(
                    'text-[11px] leading-relaxed',
                    isPaper ? 'text-[#2d2d2d]/85' : 'text-slate-300'
                  )}
                >
                  SPC-03 Arya Patel sustained heart rate 84 BPM during EVA airlock protocol.
                </p>
                <div className="pt-2 flex justify-end">
                  <Button
                    variant={isPaper ? 'primary' : 'secondary'}
                    size="sm"
                    className={clsx(
                      'text-[10px]',
                      isPaper &&
                        'bg-[#ff4d4d] text-white border-2 border-[#2d2d2d] sketch-btn hover:bg-[#e53e3e]'
                    )}
                    style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                    onClick={() => navigate('/alerts')}
                  >
                    Triage Alert
                  </Button>
                </div>
              </div>

              <div
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'p-3 border transition-all space-y-1',
                  isPaper
                    ? 'bg-white border-[#2d2d2d] text-[#2d2d2d] sketch-shadow font-sketch-hand rotate-0.5'
                    : isDark
                      ? 'bg-[#0c0c10] border-[#FF4D00] text-white sketch-shadow-orange font-sketch-hand'
                      : 'p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/40 text-xs font-mono space-y-1'
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={clsx(
                      'font-bold flex items-center gap-1.5 text-xs',
                      isPaper
                        ? 'text-[#2d5da1]'
                        : isDark
                          ? 'text-[#FF4D00]'
                          : 'text-cyan-400'
                    )}
                  >
                    <Cpu className="w-3.5 h-3.5" /> AI-204 · ARRHYTHMIA CHECK
                  </span>
                  <Badge status="info" themeMode={sketchMode}>
                    HITL REVIEW
                  </Badge>
                </div>
                <p
                  className={clsx(
                    'text-[11px] leading-relaxed',
                    isPaper ? 'text-[#2d2d2d]/85' : 'text-slate-300'
                  )}
                >
                  Neural rhythm model flagged isolated sinus tachycardia. 94.2% confidence.
                </p>
                <div className="pt-2 flex justify-end">
                  <Button
                    variant={isPaper ? 'primary' : 'hud'}
                    size="sm"
                    className={clsx(
                      'text-[10px]',
                      isPaper &&
                        'bg-[#2d5da1] text-white border-2 border-[#2d2d2d] sketch-btn hover:bg-[#1f4782]'
                    )}
                    style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                    onClick={() => navigate('/ai-insights')}
                  >
                    Open HITL Review
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
