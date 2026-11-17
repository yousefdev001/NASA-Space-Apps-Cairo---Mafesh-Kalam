import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Users,
  Search,
  ShieldCheck,
  X,
  Heart,
  Award,
  Activity,
  Radio,
  FileText,
} from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import {
  getWobblyStyle,
  Tape,
  PushPin,
  SquiggleUnderline,
} from '../components/sketchbook';
import apiClient from '../api/client';

interface AstronautItem {
  id: number;
  uuid: string;
  callsign: string;
  name: string;
  nationality: string;
  rank: string;
  specialization: string;
  bloodType: string;
  totalEvaHours: number;
  totalSpaceDays: number;
  evaCertified: boolean;
  status: 'nominal' | 'warning' | 'critical';
  mission: string;
}

const DEFAULT_ASTRONAUTS: AstronautItem[] = [
  {
    id: 1,
    uuid: 'ast-001',
    callsign: 'CDR-01',
    name: 'Elena Vance',
    nationality: 'United States (NASA)',
    rank: 'Commander / Flight Surgeon',
    specialization: 'Cardiothoracic Surgery & Bio-Astronautics',
    bloodType: 'O+',
    totalEvaHours: 28.5,
    totalSpaceDays: 194,
    evaCertified: true,
    status: 'nominal',
    mission: 'Artemis IV Lunar Gateway',
  },
  {
    id: 2,
    uuid: 'ast-002',
    callsign: 'PLT-02',
    name: 'Marcus Chen',
    nationality: 'Canada (CSA)',
    rank: 'Orbital Pilot / Systems Commander',
    specialization: 'Propulsion, Robotics & Orbital Navigation',
    bloodType: 'A+',
    totalEvaHours: 14.0,
    totalSpaceDays: 112,
    evaCertified: true,
    status: 'nominal',
    mission: 'Artemis IV Lunar Gateway',
  },
  {
    id: 3,
    uuid: 'ast-003',
    callsign: 'SPC-03',
    name: 'Arya Patel',
    nationality: 'ESA / Germany',
    rank: 'Biomedical Payload Specialist',
    specialization: 'Molecular Biology, Microgravity Genomics',
    bloodType: 'B+',
    totalEvaHours: 6.2,
    totalSpaceDays: 85,
    evaCertified: true,
    status: 'warning',
    mission: 'Artemis IV Lunar Gateway',
  },
  {
    id: 4,
    uuid: 'ast-004',
    callsign: 'ENG-04',
    name: 'Alexei Ivanov',
    nationality: 'ESA / France',
    rank: 'Lead Life Support Systems Engineer',
    specialization: 'ECLSS Closed-Loop Systems & Thermodynamics',
    bloodType: 'AB-',
    totalEvaHours: 32.0,
    totalSpaceDays: 240,
    evaCertified: true,
    status: 'nominal',
    mission: 'ISS Expedition 74',
  },
];

export const AstronautsPage: React.FC = () => {
  const { mode } = useThemeStore();
  const isPaper = mode === 'paper';
  const isDark = mode === 'dark';
  const isSketch = isPaper || isDark;

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'artemis' | 'iss' | 'eva' | 'attention'>('all');
  const [crewList, setCrewList] = useState<AstronautItem[]>(DEFAULT_ASTRONAUTS);
  const [inspectingAstronaut, setInspectingAstronaut] = useState<AstronautItem | null>(null);

  useEffect(() => {
    const loadAstronauts = async () => {
      try {
        const res = await apiClient.get('/astronauts');
        if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          const mapped: AstronautItem[] = res.data.data.map((item: any) => ({
            id: item.id,
            uuid: item.uuid || `ast-${item.id}`,
            callsign: item.callsign,
            name: item.full_name,
            nationality: item.nationality || 'International Partner',
            rank: item.rank || 'Mission Specialist',
            specialization: item.specialization || 'Bio-Astronautics',
            bloodType: item.blood_type || 'O+',
            totalEvaHours: Number(item.total_eva_hours) || 0,
            totalSpaceDays: Number(item.total_space_days) || 0,
            evaCertified: Boolean(item.eva_certified),
            status: (item.status as any) || 'nominal',
            mission: item.mission_name || 'Artemis Program',
          }));
          setCrewList(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch astronauts from API, using cached registry', err);
      }
    };
    // oxlint-disable-next-line react/set-state-in-effect
    void loadAstronauts();
  }, []);

  const filtered = crewList.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.callsign.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.mission.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'artemis') return a.mission.toLowerCase().includes('artemis');
    if (activeFilter === 'iss') return a.mission.toLowerCase().includes('iss') || a.mission.toLowerCase().includes('expedition');
    if (activeFilter === 'eva') return a.evaCertified;
    if (activeFilter === 'attention') return a.status !== 'nominal';
    return true;
  });

  return (
    <div className={clsx('space-y-6', isPaper && 'paper-grain text-[#2d2d2d]', isDark && 'paper-grain-dark text-white')}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-block">
            <h1
              className={clsx(
                'text-2xl font-bold tracking-wide flex items-center gap-2.5',
                isSketch ? 'font-display-kalam text-2xl sm:text-3xl' : 'font-mono text-white',
                isPaper ? 'text-[#2d2d2d]' : isDark ? 'text-white' : 'text-white'
              )}
            >
              <Users className={clsx('w-6 h-6', isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400')} />
              NASA ASTRONAUT CREW ROSTER
            </h1>
            {isSketch && (
              <div className="w-56 mt-0.5">
                <SquiggleUnderline className={isPaper ? 'text-[#2d5da1]' : 'text-[#FF4D00]'} />
              </div>
            )}
          </div>
          <p
            className={clsx(
              'text-xs mt-1',
              isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-400',
              isPaper ? 'text-[#2d2d2d]/75' : isDark ? 'text-white/70' : 'text-slate-400'
            )}
          >
            FLIGHT CREW BIOMEDICAL DOSSIERS, EVA CERTIFICATIONS & BASELINE PHYSIOLOGY
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-80">
          <Search
            className={clsx(
              'w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2',
              isPaper ? 'text-stone-500' : 'text-slate-400'
            )}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search callsign, astronaut, specialty..."
            style={isSketch ? getWobblyStyle('wobblySm') : undefined}
            className={clsx(
              'w-full pl-9 pr-4 py-2 text-xs focus:outline-none transition-all',
              isSketch
                ? isPaper
                  ? 'bg-white border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-sm shadow-[2px_2px_0px_0px_#2d2d2d] placeholder-stone-400'
                  : 'bg-[#0c0c10] border-2 border-[#FF4D00] text-white font-sketch-hand text-sm shadow-[2px_2px_0px_0px_#FF4D00] placeholder-zinc-500'
                : 'rounded-lg bg-[#0B132B] border border-[#1E3A5F] text-white placeholder-slate-500 focus:border-cyan-400 font-mono'
            )}
          />
        </div>
      </div>

      {/* Tactile Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {[
          { key: 'all', label: `All Crew (${crewList.length})` },
          { key: 'artemis', label: 'Artemis IV Gateway' },
          { key: 'iss', label: 'Expedition 74' },
          { key: 'eva', label: 'EVA Certified' },
          { key: 'attention', label: 'Requires Attention' },
        ].map((pill) => (
          <button
            key={pill.key}
            type="button"
            onClick={() => setActiveFilter(pill.key as any)}
            style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
            className={clsx(
              'px-3.5 py-1 text-xs font-bold transition-all cursor-pointer select-none',
              isSketch
                ? isPaper
                  ? activeFilter === pill.key
                    ? 'bg-[#2d2d2d] text-white border-2 border-[#2d2d2d] font-sketch-hand text-sm sketch-btn shadow-[2px_2px_0px_0px_#ff4d00]'
                    : 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] font-sketch-hand text-sm sketch-btn hover:bg-stone-100'
                  : activeFilter === pill.key
                  ? 'bg-[#FF4D00] text-black border-2 border-white font-sketch-hand text-sm sketch-btn-orange shadow-[2px_2px_0px_0px_#FF4D00]'
                  : 'bg-[#0c0c10] text-white border-2 border-white/40 font-sketch-hand text-sm sketch-btn-orange hover:border-[#FF4D00]'
                : activeFilter === pill.key
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-mono rounded-lg'
                : 'bg-[#0B132B] text-slate-400 border border-[#1E3A5F] hover:text-white font-mono rounded-lg'
            )}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Astronauts Profile Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((astronaut, idx) => (
          /* Profile Card Styled as Physical Flight Crew Dossier / ID Badge */
          <div
            key={astronaut.id}
            style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
            className={clsx(
              'relative transition-all p-5 sm:p-6',
              isSketch
                ? isPaper
                  ? 'bg-white text-[#2d2d2d] border-[3px] border-[#2d2d2d] sketch-shadow -rotate-[0.2deg]'
                  : 'bg-[#0c0c10] text-white border-[3px] border-[#FF4D00] sketch-shadow-orange -rotate-[0.2deg]'
                : 'rounded-xl border border-[#1E3A5F] bg-[#0B132B]/80 hover:border-cyan-500/40 shadow-md'
            )}
          >
            {/* Top Tape or PushPin Decoration on each Dossier Badge */}
            {isSketch && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                {idx % 2 === 0 ? (
                  <Tape isDark={isDark} className="-rotate-1" />
                ) : (
                  <PushPin isDark={isDark} />
                )}
              </div>
            )}

            <div className="flex items-start justify-between gap-3 pt-1">
              <div className="flex items-center gap-3.5">
                {/* Physical ID Badge Photo / Cloth Patch with Handwritten Callsign */}
                <div
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'w-14 h-14 border-2 flex flex-col items-center justify-center font-bold transition-all select-none',
                    isSketch
                      ? isPaper
                        ? 'bg-[#fdfbf7] border-[#2d2d2d] text-[#2d2d2d] font-display-kalam -rotate-1 shadow-[2px_2px_0px_0px_#2d2d2d]'
                        : 'bg-[#000000] border-[#FF4D00] text-[#FF4D00] font-display-kalam -rotate-1 shadow-[2px_2px_0px_0px_#FF4D00]'
                      : 'rounded-xl bg-[#050B14] border-cyan-500/40 text-cyan-300 font-mono shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                  )}
                >
                  <span className="text-[9px] uppercase tracking-wider opacity-60">PATCH</span>
                  <span className="text-base tracking-wide leading-none">{astronaut.callsign}</span>
                </div>

                <div>
                  <h3
                    className={clsx(
                      'font-bold',
                      isSketch ? 'font-display-kalam text-xl' : 'text-base text-white',
                      isPaper ? 'text-[#2d2d2d]' : 'text-white'
                    )}
                  >
                    {astronaut.name}
                  </h3>
                  <p
                    className={clsx(
                      'text-xs',
                      isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-cyan-400',
                      isPaper ? 'text-[#ff4d00]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'
                    )}
                  >
                    {astronaut.rank}
                  </p>
                  <p
                    className={clsx(
                      'text-[11px]',
                      isSketch ? 'font-sketch-hand text-xs opacity-75' : 'text-slate-400'
                    )}
                  >
                    {astronaut.nationality}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <Badge status={astronaut.status} themeMode={mode}>
                {astronaut.status.toUpperCase()}
              </Badge>
            </div>

            {/* Dossier Fields */}
            <div
              className={clsx(
                'mt-4 pt-3 border-t space-y-2 text-xs',
                isSketch
                  ? isPaper
                    ? 'border-dashed border-[#2d2d2d]/30 font-sketch-hand text-sm'
                    : 'border-dashed border-[#FF4D00]/40 font-sketch-hand text-sm'
                  : 'border-[#1E3A5F] font-mono'
              )}
            >
              <div>
                <span className={clsx('font-bold', isPaper ? 'text-stone-500' : 'text-slate-400')}>
                  SPECIALIZATION:{' '}
                </span>
                <span className={clsx('font-bold', isPaper ? 'text-[#2d2d2d]' : 'text-slate-200')}>
                  {astronaut.specialization}
                </span>
              </div>

              <div>
                <span className={clsx('font-bold', isPaper ? 'text-stone-500' : 'text-slate-400')}>
                  ASSIGNED MISSION:{' '}
                </span>
                <span className={clsx('font-bold', isPaper ? 'text-[#2d5da1]' : 'text-cyan-300')}>
                  {astronaut.mission}
                </span>
              </div>

              {/* Stamped Dossier Stats */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-[11px]">
                <div
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'p-2 text-center border transition-all',
                    isSketch
                      ? isPaper
                        ? 'bg-[#fdfbf7] border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand'
                        : 'bg-black border-white/20 text-white font-sketch-hand'
                      : 'rounded bg-[#050B14] border border-[#1E3A5F]/60'
                  )}
                >
                  <span className={clsx('block text-[10px] uppercase font-bold', isPaper ? 'text-stone-500' : 'text-slate-400')}>
                    TOTAL EVA
                  </span>
                  <span className={clsx('font-bold text-sm', isPaper ? 'text-[#ff4d00]' : 'text-cyan-400')}>
                    {astronaut.totalEvaHours} hrs
                  </span>
                </div>

                <div
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'p-2 text-center border transition-all',
                    isSketch
                      ? isPaper
                        ? 'bg-[#fdfbf7] border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand'
                        : 'bg-black border-white/20 text-white font-sketch-hand'
                      : 'rounded bg-[#050B14] border border-[#1E3A5F]/60'
                  )}
                >
                  <span className={clsx('block text-[10px] uppercase font-bold', isPaper ? 'text-stone-500' : 'text-slate-400')}>
                    SPACE TIME
                  </span>
                  <span className={clsx('font-bold text-sm', isPaper ? 'text-[#2d5da1]' : 'text-cyan-400')}>
                    {astronaut.totalSpaceDays} days
                  </span>
                </div>

                <div
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'p-2 text-center border transition-all',
                    isSketch
                      ? isPaper
                        ? 'bg-[#fdfbf7] border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand'
                        : 'bg-black border-white/20 text-white font-sketch-hand'
                      : 'rounded bg-[#050B14] border border-[#1E3A5F]/60'
                  )}
                >
                  <span className={clsx('block text-[10px] uppercase font-bold', isPaper ? 'text-stone-500' : 'text-slate-400')}>
                    BLOOD TYPE
                  </span>
                  <span className="text-emerald-500 font-bold text-sm">
                    {astronaut.bloodType}
                  </span>
                </div>
              </div>
            </div>

            {/* Dossier Card Footer */}
            <div
              className={clsx(
                'mt-4 pt-3 border-t flex items-center justify-between gap-2',
                isSketch
                  ? isPaper
                    ? 'border-dashed border-[#2d2d2d]/30'
                    : 'border-dashed border-[#FF4D00]/40'
                  : 'border-[#1E3A5F]'
              )}
            >
              <div
                className={clsx(
                  'flex items-center gap-1.5 text-xs',
                  isSketch ? 'font-sketch-hand text-sm font-bold' : 'font-mono',
                  astronaut.evaCertified ? 'text-emerald-500' : 'text-amber-500'
                )}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{astronaut.evaCertified ? 'EVA SUIT CERTIFIED' : 'EVA PENDING'}</span>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setInspectingAstronaut(astronaut)}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'text-xs transition-all',
                  isSketch && (
                    isPaper
                      ? 'bg-white hover:bg-stone-100 text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold'
                      : 'bg-[#0c0c10] hover:bg-[#1c1c24] text-white border-2 border-[#FF4D00] sketch-btn-orange font-sketch-hand font-bold'
                  )
                )}
              >
                Inspect Baseline Records
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* INSPECT BIOMEDICAL DOSSIER MODAL */}
      {inspectingAstronaut && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card
            themeMode={mode}
            radius="wobblyMd"
            decoration={isSketch ? 'tape' : 'none'}
            className={clsx(
              'w-full max-w-lg transition-all',
              !isSketch && 'border-cyan-500/50 shadow-[0_0_30px_rgba(0,229,255,0.25)]'
            )}
          >
            <div
              className={clsx(
                'flex items-center justify-between pb-3 border-b mb-4',
                isSketch
                  ? isPaper
                    ? 'border-dashed border-[#2d2d2d]/30'
                    : 'border-dashed border-[#FF4D00]/40'
                  : 'border-[#1E3A5F]'
              )}
            >
              <div className="flex items-center gap-2.5">
                <FileText className={clsx('w-5 h-5', isPaper ? 'text-[#ff4d00]' : 'text-cyan-400')} />
                <div>
                  <h3
                    className={clsx(
                      'font-bold',
                      isSketch ? 'font-display-kalam text-xl' : 'font-mono text-base text-white',
                      isPaper ? 'text-[#2d2d2d]' : 'text-white'
                    )}
                  >
                    Clinical Baseline Dossier [{inspectingAstronaut.callsign}]
                  </h3>
                  <span
                    className={clsx(
                      'text-xs',
                      isSketch ? 'font-sketch-hand text-sm opacity-75' : 'font-mono text-slate-400'
                    )}
                  >
                    NASA Flight Surgeon Bio-Archive · NASA-STD-3001
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingAstronaut(null)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 my-2">
              <div
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'p-3 border-2 flex items-center justify-between',
                  isSketch
                    ? isPaper
                      ? 'bg-stone-50 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand'
                      : 'bg-black border-white/20 text-white font-sketch-hand'
                    : 'rounded bg-[#050B14] border border-[#1E3A5F] font-mono'
                )}
              >
                <div>
                  <h4 className={clsx('font-bold', isSketch ? 'font-display-kalam text-lg' : 'text-white')}>
                    {inspectingAstronaut.name}
                  </h4>
                  <p className="text-xs opacity-75">{inspectingAstronaut.rank} · {inspectingAstronaut.nationality}</p>
                </div>
                <Badge status={inspectingAstronaut.status} themeMode={mode}>
                  {inspectingAstronaut.status.toUpperCase()}
                </Badge>
              </div>

              {/* Physiological Baselines */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'p-2.5 border-2 space-y-1',
                    isSketch
                      ? isPaper
                        ? 'bg-white border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand'
                        : 'bg-[#0c0c10] border-[#FF4D00] text-white font-sketch-hand'
                      : 'rounded bg-[#050B14] border border-[#1E3A5F] font-mono'
                  )}
                >
                  <div className="flex items-center gap-1.5 opacity-75 font-bold">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>RESTING HEART RATE</span>
                  </div>
                  <div className="text-base font-bold text-rose-500">58 BPM (Nominal)</div>
                </div>

                <div
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'p-2.5 border-2 space-y-1',
                    isSketch
                      ? isPaper
                        ? 'bg-white border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand'
                        : 'bg-[#0c0c10] border-[#FF4D00] text-white font-sketch-hand'
                      : 'rounded bg-[#050B14] border border-[#1E3A5F] font-mono'
                  )}
                >
                  <div className="flex items-center gap-1.5 opacity-75 font-bold">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>SPO2 SATURATION</span>
                  </div>
                  <div className="text-base font-bold text-cyan-400">98.5% (High O2)</div>
                </div>

                <div
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'p-2.5 border-2 space-y-1',
                    isSketch
                      ? isPaper
                        ? 'bg-white border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand'
                        : 'bg-[#0c0c10] border-[#FF4D00] text-white font-sketch-hand'
                      : 'rounded bg-[#050B14] border border-[#1E3A5F] font-mono'
                  )}
                >
                  <div className="flex items-center gap-1.5 opacity-75 font-bold">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>VO2 MAX AEROBIC</span>
                  </div>
                  <div className="text-base font-bold text-amber-500">52 mL/kg/min</div>
                </div>

                <div
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'p-2.5 border-2 space-y-1',
                    isSketch
                      ? isPaper
                        ? 'bg-white border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand'
                        : 'bg-[#0c0c10] border-[#FF4D00] text-white font-sketch-hand'
                      : 'rounded bg-[#050B14] border border-[#1E3A5F] font-mono'
                  )}
                >
                  <div className="flex items-center gap-1.5 opacity-75 font-bold">
                    <Radio className="w-3.5 h-3.5 text-emerald-500" />
                    <span>RADIATION EXPOSURE</span>
                  </div>
                  <div className="text-base font-bold text-emerald-500">14.2 mSv (Safe Limit)</div>
                </div>
              </div>

              {/* Surgeon Certification Note */}
              <div
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'p-3 text-xs border-2',
                  isSketch
                    ? isPaper
                      ? 'bg-[#fff9c4] border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-sm'
                      : 'bg-[#18110c] border-[#FF4D00] text-white font-sketch-hand text-sm'
                    : 'rounded bg-[#050B14] border border-[#1E3A5F] text-slate-300 font-mono'
                )}
              >
                <div className="font-bold mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>FLIGHT SURGEON CERTIFICATION STATUS:</span>
                </div>
                <p className="leading-relaxed">
                  Astronaut cleared for unrestricted extravehicular sorties and high-g acceleration. Cardiovascular and neural baselines within NASA STD-3001 operational tolerances.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t mt-4 border-current/20">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setInspectingAstronaut(null)}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  isSketch && (
                    isPaper
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold text-sm'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black border-2 border-white sketch-btn-orange font-sketch-hand font-bold text-sm'
                  )
                )}
              >
                Close Dossier
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
