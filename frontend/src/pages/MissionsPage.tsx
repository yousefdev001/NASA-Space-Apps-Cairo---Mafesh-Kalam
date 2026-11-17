import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Compass,
  Rocket,
  MapPin,
  Users,
  Clock,
  RefreshCw,
  ChevronRight,
  X,
  Layers,
  Box,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Activity,
  Gauge,
  CheckSquare,
} from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import {
  getWobblyStyle,
  Tape,
  SquiggleUnderline,
} from '../components/sketchbook';
import { clinicalApi } from '../api/clinicalApi';
import { Mission, MissionPhase } from '../types/clinical.types';

// Mission Payload Milestone interface
interface PayloadMilestone {
  id: string;
  name: string;
  category: 'clinical' | 'habitat' | 'science' | 'avionics';
  status: 'verified' | 'active' | 'pending';
  description: string;
}

// EVA Sortie interface for aerospace flight notebook
interface EvaSortie {
  id: string;
  name: string;
  evaNumber: string;
  astronauts: string[];
  durationPlanned: string;
  durationActual?: string;
  status: 'completed' | 'in_progress' | 'scheduled';
  objective: string;
  date: string;
}

// Suit Consumables interface
interface SuitConsumable {
  system: string;
  level: number; // percentage
  status: 'nominal' | 'warning' | 'critical';
  details: string;
}

const MISSION_PAYLOAD_MAP: Record<string, PayloadMilestone[]> = {
  'ARTEMIS-IV': [
    {
      id: 'PL-01',
      name: 'I-Hab International Habitation Module (ESA/JAXA)',
      category: 'habitat',
      status: 'active',
      description: 'Hermetically sealed multi-berth zero-g quarters with automated life support scrubbers.',
    },
    {
      id: 'PL-02',
      name: 'AuraMed Bio-Astronautics Telemetry Core',
      category: 'clinical',
      status: 'active',
      description: 'Continuous 500Hz multi-lead ECG and SpO2 mesh network connecting crew bio-patches to ground.',
    },
    {
      id: 'PL-03',
      name: 'HALO Autonomous Docking & Micro-thruster Array',
      category: 'avionics',
      status: 'verified',
      description: 'Lunar Gateway orbital trajectory attitude control and high-gain Ka-band deep-space antenna.',
    },
    {
      id: 'PL-04',
      name: 'Lunar Surface Regolith Cryo-Core Sampler',
      category: 'science',
      status: 'pending',
      description: 'Sub-surface volatile ice extraction drill payload designated for Shackleton crater EVA.',
    },
  ],
  'EXPEDITION-74': [
    {
      id: 'PL-11',
      name: 'Microgravity 3D Cardiovascular Bioprinter',
      category: 'clinical',
      status: 'active',
      description: 'BFF manufacturing chamber producing cardiac tissue patches without terrestrial sedimentation.',
    },
    {
      id: 'PL-12',
      name: 'Columbus Micro-Fluidic Cell Culture Incubator',
      category: 'science',
      status: 'active',
      description: 'Endothelial cellular proliferation study under long-duration cosmic ionizing radiation.',
    },
    {
      id: 'PL-13',
      name: 'Closed-Loop ECLSS Ammonia Heat Exchanger',
      category: 'habitat',
      status: 'verified',
      description: 'External radiator cooling manifold maintaining pressurized module thermal homeostasis.',
    },
  ],
  'ARES-PATHFINDER': [
    {
      id: 'PL-21',
      name: 'AuraMed Edge-AI Offline Triage Computer',
      category: 'clinical',
      status: 'pending',
      description: 'Autonomous zero-latency clinical decision support system operating during 22-minute radio blackouts.',
    },
    {
      id: 'PL-22',
      name: 'Deep-Space Radiation Polyethylene Storm Shelter',
      category: 'habitat',
      status: 'pending',
      description: 'High-density hydrogenous shielding bunker for coronal mass ejection survival.',
    },
    {
      id: 'PL-23',
      name: 'Bioregenerative Algal Oxygen Recycler',
      category: 'science',
      status: 'pending',
      description: 'Photobioreactor converting astronaut exhalation CO2 into consumable O2 and biomass.',
    },
  ],
};

const MISSION_EVA_SORTIES: Record<string, EvaSortie[]> = {
  'ARTEMIS-IV': [
    {
      id: 'EVA-01',
      name: 'Lunar Gateway I-Hab Umbilical Mating & Antenna Deployment',
      evaNumber: 'US EVA 91',
      astronauts: ['Elena Vance', 'Marcus Chen'],
      durationPlanned: '6 hr 30 min',
      durationActual: '6 hr 18 min',
      status: 'completed',
      objective: 'Secure external optical comms payload & verify hermetic hatch coupling.',
      date: '2026-10-14',
    },
    {
      id: 'EVA-02',
      name: 'Shackleton Crater Volatile Ice Core Drilling Sortie',
      evaNumber: 'LUNAR SORTIE 1',
      astronauts: ['Elena Vance', 'Arya Patel'],
      durationPlanned: '7 hr 15 min',
      status: 'in_progress',
      objective: 'Deploy cryogenic drill, collect permanent shadow region regolith core samples.',
      date: '2026-11-18',
    },
    {
      id: 'EVA-03',
      name: 'South Pole Radiator Servicing & Thermal Blanket Fixation',
      evaNumber: 'LUNAR SORTIE 2',
      astronauts: ['Marcus Chen', 'Arya Patel'],
      durationPlanned: '5 hr 45 min',
      status: 'scheduled',
      objective: 'Inspect secondary coolant manifold and reposition sunshade shields.',
      date: '2026-11-22',
    },
  ],
  'EXPEDITION-74': [
    {
      id: 'EVA-74-1',
      name: 'Columbus Exposed Facility Bio-Sensor Retrofit',
      evaNumber: 'US EVA 89',
      astronauts: ['Alexei Ivanov', 'Marcus Chen'],
      durationPlanned: '6 hr 45 min',
      durationActual: '6 hr 52 min',
      status: 'completed',
      objective: 'Replace high-energy cosmic ray dosimeter array and retrieve bio-cassettes.',
      date: '2026-08-05',
    },
  ],
};

const DEFAULT_SUIT_CONSUMABLES: SuitConsumable[] = [
  { system: 'Primary O2 Bottle Pressure', level: 94, status: 'nominal', details: '3,020 PSI / 4.2 kg reserve' },
  { system: 'Secondary Emergency O2', level: 100, status: 'nominal', details: 'Backup manifold sealed (nominal)' },
  { system: 'LiOH CO2 Scrubber Bed', level: 82, status: 'nominal', details: 'Absorption nominal (0.3% ppCO2)' },
  { system: 'Suit Battery Pack (Wh)', level: 78, status: 'nominal', details: '14.2V / 5.1 hrs autonomy remaining' },
  { system: 'Sublimator Feedwater (H2O)', level: 89, status: 'nominal', details: '3.8 L available for thermal loops' },
  { system: 'Internal Suit Pressure', level: 98, status: 'nominal', details: '4.3 PSI pure O2 operating state' },
];

// Countdown / MET Clock Component
const MissionTimer: React.FC<{ launchDate?: string | null; status: string; isSketch?: boolean; isPaper?: boolean }> = ({
  launchDate,
  status,
  isSketch = false,
  isPaper = false,
}) => {
  const [timeStr, setTimeStr] = useState<string>(() => {
    if (!launchDate) return 'TBD';
    return 'T+00:00:00:00';
  });
  const [isCountdown, setIsCountdown] = useState<boolean>(() => {
    if (!launchDate) return false;
    return new Date(launchDate).getTime() > Date.now();
  });

  useEffect(() => {
    if (!launchDate) return;

    const targetTime = new Date(launchDate).getTime();

    const update = () => {
      const now = Date.now();
      const diffMs = now - targetTime;
      const isPast = diffMs >= 0;
      setIsCountdown(!isPast);

      const totalSeconds = Math.floor(Math.abs(diffMs) / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const pad = (n: number) => n.toString().padStart(2, '0');
      const prefix = isPast ? 'T+' : 'T-';
      setTimeStr(`${prefix}${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [launchDate]);

  return (
    <div
      style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
      className={clsx(
        'inline-flex items-center font-bold tracking-widest px-3 py-1 text-xs gap-1.5 transition-all select-none',
        isSketch
          ? isPaper
            ? 'bg-[#fff9c4] text-[#2d2d2d] border-2 border-[#2d2d2d] font-sketch-hand text-sm shadow-[2px_2px_0px_0px_#2d2d2d]'
            : 'bg-[#18110c] text-[#FF4D00] border-2 border-[#FF4D00] font-sketch-hand text-sm shadow-[2px_2px_0px_0px_#FF4D00]'
          : status === 'active'
          ? 'text-cyan-400 bg-[#050B14]/80 border border-[#1E3A5F] rounded-lg shadow-[0_0_10px_rgba(0,229,255,0.15)] font-mono'
          : isCountdown
          ? 'text-amber-400 bg-amber-950/20 border border-amber-500/40 rounded-lg font-mono'
          : 'text-slate-400 bg-[#050B14] border border-slate-700 rounded-lg font-mono'
      )}
    >
      <Clock
        className={clsx(
          'w-3.5 h-3.5',
          status === 'active' ? (isPaper ? 'text-[#ff4d00]' : 'text-cyan-400 animate-pulse') : 'text-amber-400'
        )}
      />
      <span>{timeStr}</span>
    </div>
  );
};

export const MissionsPage: React.FC = () => {
  const { mode } = useThemeStore();
  const isPaper = mode === 'paper';
  const isDark = mode === 'dark';
  const isSketch = isPaper || isDark;

  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inspection Drawer/Modal State
  const [inspectingMission, setInspectingMission] = useState<Mission | null>(null);
  const [activeTab, setActiveTab] = useState<'phases' | 'payloads' | 'eva' | 'consumables' | 'crew'>('phases');

  useEffect(() => {
    let ignore = false;

    const loadMissions = async () => {
      try {
        const data = await clinicalApi.getMissions();
        if (!ignore) {
          setMissions(data);
          setErrorMessage(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Failed to retrieve mission operational flight data.';
          setErrorMessage(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadMissions();

    return () => {
      ignore = true;
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const data = await clinicalApi.getMissions();
      setMissions(data);
      if (inspectingMission) {
        const updated = data.find((m) => m.id === inspectingMission.id);
        if (updated) setInspectingMission(updated);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to refresh missions.';
      setErrorMessage(msg);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getMissionPhases = (mission: Mission): MissionPhase[] => {
    if (mission.phases && mission.phases.length > 0) {
      return mission.phases;
    }
    return [
      { id: 1, mission_id: mission.id, phase_name: 'Launch & TLI Insertion', phase_order: 1, status: 'completed', description: 'SLS Block 1B orbital boost and trans-lunar trajectory acquisition.' },
      { id: 2, mission_id: mission.id, phase_name: 'Gateway Rendezvous & Docking', phase_order: 2, status: 'active', description: 'HALO module proximity operations and autonomous docking mating.' },
      { id: 3, mission_id: mission.id, phase_name: 'Lunar Surface Descent & EVA', phase_order: 3, status: 'pending', description: 'Starship HLS lunar landing, Shackleton crater EVA sorties and science.' },
      { id: 4, mission_id: mission.id, phase_name: 'Earth Return & Splashdown', phase_order: 4, status: 'pending', description: 'Trans-Earth injection burn and Pacific oceanic recovery.' },
    ];
  };

  const getPayloadMilestones = (missionCode: string): PayloadMilestone[] => {
    return (
      MISSION_PAYLOAD_MAP[missionCode] || [
        {
          id: 'PL-STD',
          name: 'Standard Astronautics ECLSS & Telemetry Node',
          category: 'clinical',
          status: 'active',
          description: 'Autonomous health monitoring and life support instrumentation.',
        },
      ]
    );
  };

  const getMissionEvaSorties = (missionCode: string): EvaSortie[] => {
    return MISSION_EVA_SORTIES[missionCode] || [];
  };

  return (
    <div className={clsx('space-y-6', isPaper && 'paper-grain text-[#2d2d2d]', isDark && 'paper-grain-dark text-white')}>
      {/* Header Styled as Aerospace Flight Notebook Log */}
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
              <Compass className={clsx('w-6 h-6', isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400')} />
              FLIGHT MISSIONS & EVA PROTOCOLS
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
            AEROSPACE FLIGHT NOTEBOOK · CREW MANIFEST, MET TIMELINE & EVA CONSUMABLES
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge status="info" themeMode={mode}>
            {missions.length} FLIGHTS LOGGED
          </Badge>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleManualRefresh}
            isLoading={isRefreshing}
            style={isSketch ? getWobblyStyle('wobblySm') : undefined}
            className={clsx(
              'text-xs gap-1.5',
              isSketch && (
                isPaper
                  ? 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold hover:bg-[#fdfbf7]'
                  : 'bg-[#0c0c10] text-white border-2 border-[#FF4D00] sketch-btn-orange font-sketch-hand font-bold'
              )
            )}
            title="Refresh Missions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sync Logbook
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div
          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
          className={clsx(
            'p-3.5 text-xs flex items-center justify-between gap-2',
            isSketch
              ? isPaper
                ? 'bg-[#ff4d4d]/15 border-2 border-[#ff4d4d] text-rose-950 font-sketch-hand text-sm sketch-shadow'
                : 'bg-[#FF4D00]/20 border-2 border-[#FF4D00] text-rose-200 font-sketch-hand text-sm sketch-shadow-orange'
              : 'rounded-lg bg-rose-950/40 border border-rose-500/50 text-rose-300 font-mono'
          )}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs p-1 hover:opacity-75 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Missions List */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw
            className={clsx(
              'w-8 h-8 animate-spin mx-auto',
              isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'
            )}
          />
          <p
            className={clsx(
              'text-xs tracking-wider',
              isSketch ? 'font-sketch-hand text-base' : 'font-mono text-slate-400'
            )}
          >
            RETRIEVING LIVE MISSION TRAJECTORIES & CREW ROSTERS...
          </p>
        </div>
      ) : missions.length === 0 ? (
        <Card
          themeMode={mode}
          radius="wobblyMd"
          decoration={isSketch ? 'tape' : 'none'}
          className="text-center py-16"
        >
          <Compass
            className={clsx('w-12 h-12 mx-auto mb-3', isPaper ? 'text-stone-400' : 'text-slate-600')}
          />
          <h3
            className={clsx(
              'text-base font-bold',
              isSketch ? 'font-display-kalam text-lg' : 'font-mono text-white'
            )}
          >
            NO MISSIONS FOUND
          </h3>
          <p
            className={clsx(
              'text-xs mt-1',
              isSketch ? 'font-sketch-hand text-sm text-stone-500' : 'font-mono text-slate-400'
            )}
          >
            Ground Station reports zero active mission profiles in the database.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {missions.map((mission, idx) => {
            const phases = getMissionPhases(mission);
            const crewList =
              mission.crew && mission.crew.length > 0
                ? mission.crew.map((c) => `${c.full_name} (${c.pivot?.crew_role || c.callsign})`)
                : ['Flight crew qualification active'];
            const sorties = getMissionEvaSorties(mission.mission_code);

            return (
              /* Aerospace Flight Notebook Card */
              <Card
                key={mission.id}
                themeMode={mode}
                radius="wobblyMd"
                decoration={isSketch ? (idx % 2 === 0 ? 'tape' : 'pin') : 'none'}
                className={clsx(
                  'cursor-pointer transition-all relative group',
                  !isSketch &&
                    'border-[#1E3A5F] hover:border-cyan-400/50 shadow-lg hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]'
                )}
                onClick={() => {
                  setInspectingMission(mission);
                  setActiveTab('phases');
                }}
              >
                {/* Secondary tape corner accent in sketch mode */}
                {isSketch && idx % 2 === 1 && (
                  <div className="absolute -top-3.5 right-10 z-10 pointer-events-none">
                    <Tape isDark={isDark} className="rotate-2 w-16 h-5" />
                  </div>
                )}

                {/* Header row */}
                <div
                  className={clsx(
                    'flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b',
                    isSketch
                      ? isPaper
                        ? 'border-dashed border-[#2d2d2d]/30'
                        : 'border-dashed border-[#FF4D00]/40'
                      : 'border-[#1E3A5F]'
                  )}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                      <span
                        style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                        className={clsx(
                          'text-xs font-bold px-2.5 py-0.5 select-none',
                          isSketch
                            ? isPaper
                              ? 'bg-stone-100 text-[#2d2d2d] border-2 border-[#2d2d2d] font-sketch-hand shadow-[2px_2px_0px_0px_#2d2d2d]'
                              : 'bg-black text-[#FF4D00] border-2 border-[#FF4D00] font-sketch-hand shadow-[2px_2px_0px_0px_#FF4D00]'
                            : 'rounded bg-cyan-950 border border-cyan-500/30 text-cyan-400 font-mono'
                        )}
                      >
                        {mission.mission_code}
                      </span>

                      <Badge
                        themeMode={mode}
                        status={
                          mission.status === 'active'
                            ? 'nominal'
                            : mission.status === 'planned'
                            ? 'warning'
                            : mission.status === 'completed'
                            ? 'info'
                            : 'critical'
                        }
                      >
                        {mission.status.toUpperCase()}
                      </Badge>

                      <span
                        className={clsx(
                          'text-xs',
                          isSketch ? 'font-sketch-hand text-sm opacity-80' : 'font-mono text-slate-400'
                        )}
                      >
                        · {mission.mission_type}
                      </span>

                      {mission.is_primary && (
                        <span
                          style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                          className={clsx(
                            'text-[10px] px-2 py-0.5 font-bold uppercase select-none',
                            isSketch
                              ? isPaper
                                ? 'bg-[#fff9c4] text-[#2d2d2d] border-2 border-[#2d2d2d] font-sketch-hand'
                                : 'bg-[#FF4D00]/30 text-[#FF4D00] border-2 border-[#FF4D00] font-sketch-hand'
                              : 'rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-mono'
                          )}
                        >
                          PRIMARY DIRECTIVE
                        </span>
                      )}
                    </div>

                    <h3
                      className={clsx(
                        'font-bold transition-colors',
                        isSketch ? 'font-display-kalam text-xl sm:text-2xl' : 'text-lg text-white group-hover:text-cyan-300',
                        isPaper ? 'text-[#2d2d2d]' : 'text-white'
                      )}
                    >
                      {mission.name}
                    </h3>
                  </div>

                  {/* Timer & Inspect Action */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          'text-xs font-bold',
                          isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-400'
                        )}
                      >
                        {mission.status === 'active' ? 'MISSION MET:' : 'LAUNCH:'}
                      </span>
                      <MissionTimer
                        launchDate={mission.launch_date}
                        status={mission.status}
                        isSketch={isSketch}
                        isPaper={isPaper}
                      />
                    </div>

                    <Button
                      variant={isSketch ? (isPaper ? 'secondary' : 'hud') : 'hud'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectingMission(mission);
                        setActiveTab('phases');
                      }}
                      style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                      className={clsx(
                        'text-xs shrink-0 gap-1.5 transition-all',
                        isSketch && (
                          isPaper
                            ? 'bg-white hover:bg-stone-100 text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold'
                            : 'bg-[#0c0c10] hover:bg-[#1c1c24] text-white border-2 border-[#FF4D00] sketch-btn-orange font-sketch-hand font-bold'
                        )
                      )}
                    >
                      <span>Flight Dossier</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </div>
                </div>

                {/* Details Grid */}
                <div
                  className={clsx(
                    'py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs',
                    isSketch ? 'font-sketch-hand text-sm' : 'font-mono text-slate-300'
                  )}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <MapPin className={clsx('w-4 h-4 shrink-0', isPaper ? 'text-[#2d5da1]' : 'text-cyan-400')} />
                      <span className={clsx('font-bold', isPaper ? 'text-stone-500' : 'text-slate-400')}>
                        DESTINATION:
                      </span>
                      <span className={clsx('font-bold', isPaper ? 'text-[#2d2d2d]' : 'text-white')}>
                        {mission.destination || 'Low Earth Orbit (LEO)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Rocket className={clsx('w-4 h-4 shrink-0', isPaper ? 'text-[#ff4d00]' : 'text-cyan-400')} />
                      <span className={clsx('font-bold', isPaper ? 'text-stone-500' : 'text-slate-400')}>
                        VEHICLE:
                      </span>
                      <span className={clsx('font-bold', isPaper ? 'text-[#2d2d2d]' : 'text-white')}>
                        {mission.vehicle_name || 'Standard Exploration Spacecraft'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className={clsx('w-4 h-4 shrink-0', isPaper ? 'text-[#2d5da1]' : 'text-cyan-400')} />
                      <span className={clsx('font-bold', isPaper ? 'text-stone-500' : 'text-slate-400')}>
                        LAUNCH DATE:
                      </span>
                      <span className={clsx(isPaper ? 'text-[#2d2d2d]' : 'text-white')}>
                        {mission.launch_date
                          ? new Date(mission.launch_date).toLocaleDateString(undefined, { dateStyle: 'long' })
                          : 'TBD'}
                      </span>
                    </div>

                    {mission.description && (
                      <p
                        className={clsx(
                          'mt-2 leading-relaxed line-clamp-2',
                          isSketch ? 'font-sketch-hand text-sm' : 'font-sans text-slate-300',
                          isPaper ? 'text-[#2d2d2d]/85' : 'text-slate-300'
                        )}
                      >
                        {mission.description}
                      </p>
                    )}

                    {sorties.length > 0 && (
                      <div className="pt-1 flex items-center gap-2 text-xs">
                        <Activity className={clsx('w-3.5 h-3.5', isPaper ? 'text-[#ff4d00]' : 'text-cyan-400')} />
                        <span className="font-bold opacity-80">EVA Sorties:</span>
                        <span className={clsx('font-bold', isPaper ? 'text-[#ff4d00]' : 'text-cyan-300')}>
                          {sorties.length} Planned Sorties
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className={clsx('w-4 h-4', isPaper ? 'text-[#2d5da1]' : 'text-cyan-400')} />
                      <span className={clsx('font-bold', isPaper ? 'text-stone-500' : 'text-slate-400')}>
                        CREW MANIFEST ({crewList.length}):
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {crewList.map((crewName, i) => (
                        <span
                          key={i}
                          style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                          className={clsx(
                            'px-2.5 py-0.5 text-xs font-bold transition-all select-none',
                            isSketch
                              ? isPaper
                                ? 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] font-sketch-hand shadow-[1px_1px_0px_0px_#2d2d2d]'
                                : 'bg-[#000000] text-cyan-300 border-2 border-[#FF4D00] font-sketch-hand shadow-[1px_1px_0px_0px_#FF4D00]'
                              : 'rounded bg-[#050B14] border border-[#1E3A5F] text-cyan-300 font-mono shadow-sm'
                          )}
                        >
                          {crewName}
                        </span>
                      ))}
                    </div>

                    {/* Operational Stepper Flight Progress */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={clsx(
                            'text-[11px] font-bold',
                            isSketch ? 'font-sketch-hand text-xs' : 'font-mono text-slate-400'
                          )}
                        >
                          FLIGHT PROGRESSION STAGES:
                        </span>
                        <span
                          className={clsx(
                            'text-[11px]',
                            isSketch
                              ? 'font-sketch-hand text-[#2d5da1] dark:text-[#FF4D00] underline'
                              : 'text-cyan-400 font-mono'
                          )}
                        >
                          Click to open flight logbook
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {phases.slice(0, 4).map((phase, pIdx) => (
                          <div
                            key={pIdx}
                            style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                            className={clsx(
                              'p-2 text-center text-[11px] transition-all border-2',
                              isSketch
                                ? isPaper
                                  ? phase.status === 'completed'
                                    ? 'bg-emerald-100 border-[#2d2d2d] text-emerald-950 font-sketch-hand font-bold'
                                    : phase.status === 'active'
                                    ? 'bg-[#fff9c4] border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand font-bold shadow-[2px_2px_0px_0px_#2d2d2d]'
                                    : 'bg-stone-50 border-[#2d2d2d]/30 text-stone-500 font-sketch-hand'
                                  : phase.status === 'completed'
                                  ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300 font-sketch-hand font-bold'
                                  : phase.status === 'active'
                                  ? 'bg-[#18110c] border-[#FF4D00] text-[#FF4D00] font-sketch-hand font-bold shadow-[2px_2px_0px_0px_#FF4D00]'
                                  : 'bg-black border-white/20 text-stone-400 font-sketch-hand'
                                : phase.status === 'completed'
                                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-mono rounded'
                                : phase.status === 'active'
                                ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 animate-pulse font-mono font-bold rounded'
                                : 'bg-[#050B14] border-[#1E3A5F]/50 text-slate-500 font-mono rounded'
                            )}
                          >
                            <span className="block truncate font-bold">{phase.phase_name}</span>
                            <span className="text-[10px] uppercase opacity-80">
                              {phase.status === 'completed'
                                ? '[✓] COMPLETE'
                                : phase.status === 'active'
                                ? '[►] ACTIVE'
                                : '[ ] QUEUED'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* INSPECTION MODAL: AEROSPACE FLIGHT NOTEBOOK DOSSIER */}
      {inspectingMission && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card
            themeMode={mode}
            radius="wobblyMd"
            decoration={isSketch ? 'tape' : 'none'}
            className={clsx(
              'w-full max-w-4xl my-8 transition-all',
              !isSketch && 'border-cyan-500/50 shadow-[0_0_40px_rgba(0,229,255,0.25)]'
            )}
          >
            {/* Modal Header */}
            <div
              className={clsx(
                'flex items-start justify-between pb-4 border-b',
                isSketch
                  ? isPaper
                    ? 'border-dashed border-[#2d2d2d]/30'
                    : 'border-dashed border-[#FF4D00]/40'
                  : 'border-[#1E3A5F]'
              )}
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                    className={clsx(
                      'text-xs font-bold px-2 py-0.5 select-none',
                      isSketch
                        ? isPaper
                          ? 'bg-stone-100 text-[#2d2d2d] border-2 border-[#2d2d2d] font-sketch-hand'
                          : 'bg-black text-[#FF4D00] border-2 border-[#FF4D00] font-sketch-hand'
                        : 'rounded bg-cyan-950 border border-cyan-500/30 text-cyan-400 font-mono'
                    )}
                  >
                    {inspectingMission.mission_code}
                  </span>
                  <Badge
                    themeMode={mode}
                    status={
                      inspectingMission.status === 'active'
                        ? 'nominal'
                        : inspectingMission.status === 'planned'
                        ? 'warning'
                        : inspectingMission.status === 'completed'
                        ? 'info'
                        : 'critical'
                    }
                  >
                    {inspectingMission.status.toUpperCase()}
                  </Badge>
                  <span
                    className={clsx(
                      'text-xs',
                      isSketch ? 'font-sketch-hand text-sm opacity-80' : 'font-mono text-slate-400'
                    )}
                  >
                    · {inspectingMission.mission_type}
                  </span>
                </div>
                <h2
                  className={clsx(
                    'font-bold',
                    isSketch ? 'font-display-kalam text-2xl sm:text-3xl' : 'text-xl font-mono text-white',
                    isPaper ? 'text-[#2d2d2d]' : 'text-white'
                  )}
                >
                  {inspectingMission.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setInspectingMission(null)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Flight Telemetry Strip */}
            <div
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={clsx(
                'grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 my-4 text-xs transition-all',
                isSketch
                  ? isPaper
                    ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-sm shadow-[2px_2px_0px_0px_#2d2d2d]'
                    : 'bg-[#000000] border-2 border-[#FF4D00] text-white font-sketch-hand text-sm shadow-[2px_2px_0px_0px_#FF4D00]'
                  : 'rounded-lg bg-[#050B14] border border-[#1E3A5F] font-mono'
              )}
            >
              <div>
                <span className={clsx('block text-[10px] uppercase', isPaper ? 'text-stone-500' : 'text-slate-400')}>
                  DESTINATION
                </span>
                <span className={clsx('font-bold text-sm', isPaper ? 'text-[#2d5da1]' : 'text-cyan-300')}>
                  {inspectingMission.destination || 'LEO'}
                </span>
              </div>
              <div>
                <span className={clsx('block text-[10px] uppercase', isPaper ? 'text-stone-500' : 'text-slate-400')}>
                  VEHICLE
                </span>
                <span className={clsx('font-bold text-sm', isPaper ? 'text-[#2d2d2d]' : 'text-white')}>
                  {inspectingMission.vehicle_name || 'Standard'}
                </span>
              </div>
              <div>
                <span className={clsx('block text-[10px] uppercase', isPaper ? 'text-stone-500' : 'text-slate-400')}>
                  MISSION CLOCK
                </span>
                <MissionTimer
                  launchDate={inspectingMission.launch_date}
                  status={inspectingMission.status}
                  isSketch={isSketch}
                  isPaper={isPaper}
                />
              </div>
              <div>
                <span className={clsx('block text-[10px] uppercase', isPaper ? 'text-stone-500' : 'text-slate-400')}>
                  FLIGHT CREW
                </span>
                <span className="text-emerald-500 font-bold text-sm">
                  {inspectingMission.crew?.length || 0} ASTRONAUTS
                </span>
              </div>
            </div>

            {/* Notebook Tabs Bar */}
            <div
              className={clsx(
                'flex flex-wrap items-center gap-2 border-b pb-3 mb-4',
                isSketch
                  ? isPaper
                    ? 'border-dashed border-[#2d2d2d]/30'
                    : 'border-dashed border-[#FF4D00]/40'
                  : 'border-[#1E3A5F]'
              )}
            >
              {[
                { key: 'phases', label: 'Flight Phases', icon: Layers },
                { key: 'payloads', label: 'Milestones & Payloads', icon: Box },
                { key: 'eva', label: 'EVA Sorties Timeline', icon: Activity },
                { key: 'consumables', label: 'Suit Consumables Checklist', icon: Gauge },
                { key: 'crew', label: 'Crew Manifest', icon: Users },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as any)}
                    style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                    className={clsx(
                      'px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer',
                      isSketch
                        ? isPaper
                          ? isActive
                            ? 'bg-[#2d2d2d] text-white border-2 border-[#2d2d2d] font-sketch-hand shadow-[2px_2px_0px_0px_#ff4d00]'
                            : 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] font-sketch-hand hover:bg-stone-100'
                          : isActive
                          ? 'bg-[#FF4D00] text-black border-2 border-white font-sketch-hand shadow-[2px_2px_0px_0px_#FF4D00]'
                          : 'bg-[#0c0c10] text-white border-2 border-white/40 font-sketch-hand hover:border-[#FF4D00]'
                        : isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-mono rounded-lg'
                        : 'bg-[#050B14] text-slate-400 border border-[#1E3A5F] hover:text-white font-mono rounded-lg'
                    )}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="py-2 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* TAB 1: FLIGHT PHASES */}
              {activeTab === 'phases' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-bold">
                    <Layers className={clsx('w-4 h-4', isPaper ? 'text-[#2d5da1]' : 'text-cyan-400')} />
                    <span className={clsx(isSketch ? 'font-display-kalam text-lg' : 'font-mono text-white')}>
                      OPERATIONAL FLIGHT PHASES & CHECKLIST
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {getMissionPhases(inspectingMission).map((phase, idx) => (
                      <div
                        key={phase.id || idx}
                        style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                        className={clsx(
                          'p-3.5 border-2 transition-all',
                          isSketch
                            ? isPaper
                              ? phase.status === 'completed'
                                ? 'bg-emerald-50 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand'
                                : phase.status === 'active'
                                ? 'bg-[#fff9c4] border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand shadow-[2px_2px_0px_0px_#2d2d2d]'
                                : 'bg-stone-50 border-[#2d2d2d]/30 text-stone-600 font-sketch-hand'
                              : phase.status === 'completed'
                              ? 'bg-emerald-950/40 border-emerald-400 text-white font-sketch-hand'
                              : phase.status === 'active'
                              ? 'bg-[#18110c] border-[#FF4D00] text-white font-sketch-hand shadow-[2px_2px_0px_0px_#FF4D00]'
                              : 'bg-black border-white/20 text-stone-300 font-sketch-hand'
                            : phase.status === 'completed'
                            ? 'rounded-lg bg-emerald-950/20 border-emerald-500/40 text-emerald-200 font-mono'
                            : phase.status === 'active'
                            ? 'rounded-lg bg-cyan-950/30 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,229,255,0.15)] font-mono'
                            : 'rounded-lg bg-[#050B14] border-[#1E3A5F]/60 text-slate-400 font-mono'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
                              className={clsx(
                                'w-6 h-6 flex items-center justify-center text-xs font-bold border-2',
                                isPaper ? 'border-[#2d2d2d] bg-white' : 'border-current bg-black'
                              )}
                            >
                              {phase.phase_order || idx + 1}
                            </span>
                            <span className={clsx('font-bold', isSketch ? 'font-display-kalam text-base' : 'text-sm text-white')}>
                              {phase.phase_name}
                            </span>
                          </div>

                          <Badge
                            themeMode={mode}
                            status={
                              phase.status === 'completed'
                                ? 'nominal'
                                : phase.status === 'active'
                                ? 'warning'
                                : 'neutral'
                            }
                          >
                            {phase.status.toUpperCase()}
                          </Badge>
                        </div>

                        {phase.description && (
                          <p className={clsx('text-xs pl-8 leading-relaxed', isSketch && 'text-sm font-sketch-hand')}>
                            {phase.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: MILESTONES & PAYLOADS */}
              {activeTab === 'payloads' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-bold">
                    <Box className={clsx('w-4 h-4', isPaper ? 'text-[#ff4d00]' : 'text-cyan-400')} />
                    <span className={clsx(isSketch ? 'font-display-kalam text-lg' : 'font-mono text-white')}>
                      SCIENTIFIC & CLINICAL PAYLOAD MILESTONES
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getPayloadMilestones(inspectingMission.mission_code).map((payload) => (
                      <div
                        key={payload.id}
                        style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                        className={clsx(
                          'p-3.5 border-2 space-y-1.5 transition-all',
                          isSketch
                            ? isPaper
                              ? 'bg-white border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand shadow-[2px_2px_0px_0px_#2d2d2d]'
                              : 'bg-[#0c0c10] border-[#FF4D00] text-white font-sketch-hand shadow-[2px_2px_0px_0px_#FF4D00]'
                            : 'rounded-lg bg-[#050B14] border border-[#1E3A5F] hover:border-cyan-500/40'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                            className={clsx(
                              'text-[10px] font-bold px-2 py-0.5 select-none',
                              isSketch
                                ? isPaper
                                  ? 'bg-stone-100 text-[#2d2d2d] border border-[#2d2d2d]'
                                  : 'bg-black text-[#FF4D00] border border-[#FF4D00]'
                                : 'rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-mono'
                            )}
                          >
                            {payload.id}
                          </span>

                          <Badge
                            themeMode={mode}
                            status={
                              payload.status === 'verified'
                                ? 'nominal'
                                : payload.status === 'active'
                                ? 'info'
                                : 'warning'
                            }
                          >
                            {payload.status.toUpperCase()}
                          </Badge>
                        </div>

                        <h4 className={clsx('font-bold', isSketch ? 'font-display-kalam text-base' : 'text-xs text-white')}>
                          {payload.name}
                        </h4>
                        <p className={clsx('text-xs leading-relaxed', isSketch ? 'font-sketch-hand text-sm opacity-90' : 'text-slate-400')}>
                          {payload.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: EVA SORTIES TIMELINE */}
              {activeTab === 'eva' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-bold">
                    <Activity className={clsx('w-4 h-4', isPaper ? 'text-[#ff4d00]' : 'text-cyan-400')} />
                    <span className={clsx(isSketch ? 'font-display-kalam text-lg' : 'font-mono text-white')}>
                      ARTEMIS & ORBITAL EVA SORTIES TIMELINE
                    </span>
                  </div>

                  {getMissionEvaSorties(inspectingMission.mission_code).length === 0 ? (
                    <div
                      style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                      className={clsx(
                        'p-5 text-center border-2',
                        isSketch
                          ? isPaper
                            ? 'bg-stone-50 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand'
                            : 'bg-black border-white/30 text-white font-sketch-hand'
                          : 'rounded-lg bg-[#050B14] border border-[#1E3A5F] text-slate-400 font-mono text-xs'
                      )}
                    >
                      No extravehicular activities currently scheduled for this flight profile.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getMissionEvaSorties(inspectingMission.mission_code).map((sortie) => (
                        <div
                          key={sortie.id}
                          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                          className={clsx(
                            'p-3.5 border-2 space-y-2 transition-all',
                            isSketch
                              ? isPaper
                                ? 'bg-white border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand shadow-[2px_2px_0px_0px_#2d2d2d]'
                                : 'bg-[#0c0c10] border-[#FF4D00] text-white font-sketch-hand shadow-[2px_2px_0px_0px_#FF4D00]'
                              : 'rounded-lg bg-[#050B14] border border-[#1E3A5F]'
                          )}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                                className={clsx(
                                  'text-xs font-bold px-2.5 py-0.5',
                                  isSketch
                                    ? isPaper
                                      ? 'bg-amber-100 text-[#2d2d2d] border border-[#2d2d2d]'
                                      : 'bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]'
                                    : 'rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono'
                                )}
                              >
                                {sortie.evaNumber}
                              </span>
                              <span className={clsx('font-bold', isSketch ? 'font-display-kalam text-lg' : 'text-sm text-white')}>
                                {sortie.name}
                              </span>
                            </div>

                            <Badge
                              themeMode={mode}
                              status={
                                sortie.status === 'completed'
                                  ? 'nominal'
                                  : sortie.status === 'in_progress'
                                  ? 'warning'
                                  : 'info'
                              }
                            >
                              {sortie.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>

                          <p className={clsx('text-xs leading-relaxed', isSketch ? 'font-sketch-hand text-sm' : 'text-slate-300')}>
                            {sortie.objective}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-dashed border-current/20">
                            <div>
                              <span className="opacity-75">Sortie Crew: </span>
                              <strong className={isPaper ? 'text-[#ff4d00]' : 'text-cyan-300'}>
                                {sortie.astronauts.join(' & ')}
                              </strong>
                            </div>
                            <div>
                              <span className="opacity-75">Planned Duration: </span>
                              <strong>{sortie.durationPlanned}</strong>
                            </div>
                            {sortie.durationActual && (
                              <div>
                                <span className="opacity-75">Actual Duration: </span>
                                <strong className="text-emerald-500">{sortie.durationActual}</strong>
                              </div>
                            )}
                            <div>
                              <span className="opacity-75">Scheduled Date: </span>
                              <strong>{sortie.date}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SUIT CONSUMABLES CHECKLIST */}
              {activeTab === 'consumables' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-bold">
                    <Gauge className={clsx('w-4 h-4', isPaper ? 'text-[#2d5da1]' : 'text-cyan-400')} />
                    <span className={clsx(isSketch ? 'font-display-kalam text-lg' : 'font-mono text-white')}>
                      AURA-SUIT EXTRAVEHICULAR CONSUMABLES CHECKLIST
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DEFAULT_SUIT_CONSUMABLES.map((item, cIdx) => (
                      <div
                        key={cIdx}
                        style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                        className={clsx(
                          'p-3 border-2 space-y-2 transition-all',
                          isSketch
                            ? isPaper
                              ? 'bg-white border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand shadow-[2px_2px_0px_0px_#2d2d2d]'
                              : 'bg-[#0c0c10] border-[#FF4D00] text-white font-sketch-hand shadow-[2px_2px_0px_0px_#FF4D00]'
                            : 'rounded-lg bg-[#050B14] border border-[#1E3A5F]'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold">
                            <CheckSquare className={clsx('w-4 h-4', isPaper ? 'text-emerald-700' : 'text-emerald-400')} />
                            <span className={clsx(isSketch ? 'font-display-kalam text-sm' : 'text-xs text-white')}>
                              {item.system}
                            </span>
                          </div>
                          <span
                            className={clsx(
                              'font-bold text-xs',
                              item.level > 85 ? 'text-emerald-500' : 'text-amber-500'
                            )}
                          >
                            {item.level}%
                          </span>
                        </div>

                        {/* Progress meter */}
                        <div
                          className={clsx(
                            'w-full h-2 rounded-full overflow-hidden border',
                            isPaper ? 'bg-stone-200 border-[#2d2d2d]' : 'bg-zinc-800 border-white/30'
                          )}
                        >
                          <div
                            className={clsx(
                              'h-full transition-all',
                              item.level > 85 ? 'bg-emerald-500' : 'bg-amber-500'
                            )}
                            style={{ width: `${item.level}%` }}
                          />
                        </div>

                        <p className={clsx('text-[11px] opacity-80', isSketch && 'text-xs')}>
                          {item.details}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: CREW ROSTER */}
              {activeTab === 'crew' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-bold">
                    <Users className={clsx('w-4 h-4', isPaper ? 'text-[#2d5da1]' : 'text-cyan-400')} />
                    <span className={clsx(isSketch ? 'font-display-kalam text-lg' : 'font-mono text-white')}>
                      CREW MANIFEST & FLIGHT CERTIFICATIONS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {inspectingMission.crew && inspectingMission.crew.length > 0 ? (
                      inspectingMission.crew.map((astro) => (
                        <div
                          key={astro.id}
                          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                          className={clsx(
                            'p-3 border-2 flex items-center justify-between text-xs transition-all',
                            isSketch
                              ? isPaper
                                ? 'bg-white border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand shadow-[2px_2px_0px_0px_#2d2d2d]'
                                : 'bg-[#0c0c10] border-[#FF4D00] text-white font-sketch-hand shadow-[2px_2px_0px_0px_#FF4D00]'
                              : 'rounded-lg bg-[#050B14] border border-[#1E3A5F] font-mono'
                          )}
                        >
                          <div>
                            <div className={clsx('font-bold', isSketch ? 'font-display-kalam text-base' : 'text-white')}>
                              {astro.full_name}
                            </div>
                            <div className={clsx('text-[11px]', isPaper ? 'text-stone-600' : 'text-slate-400')}>
                              {astro.rank || astro.callsign}
                            </div>
                            <div className={clsx('text-[11px] font-bold', isPaper ? 'text-[#ff4d00]' : 'text-cyan-400')}>
                              {astro.specialization}
                            </div>
                          </div>
                          <Badge status="nominal" themeMode={mode}>
                            CERTIFIED
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div
                        style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                        className={clsx(
                          'p-3 border-2 text-xs col-span-2 text-center',
                          isSketch
                            ? isPaper
                              ? 'bg-stone-50 border-[#2d2d2d] font-sketch-hand text-sm'
                              : 'bg-black border-white/20 font-sketch-hand text-sm'
                            : 'rounded-lg bg-[#050B14] border border-[#1E3A5F] font-mono text-slate-400'
                        )}
                      >
                        Crew roster currently undergoing flight surgeon qualification check.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className={clsx(
                'flex items-center justify-between pt-4 border-t mt-4',
                isSketch
                  ? isPaper
                    ? 'border-dashed border-[#2d2d2d]/30'
                    : 'border-dashed border-[#FF4D00]/40'
                  : 'border-[#1E3A5F]'
              )}
            >
              <div
                className={clsx(
                  'text-xs flex items-center gap-1.5',
                  isSketch ? 'font-sketch-hand text-sm text-stone-600 dark:text-stone-300' : 'font-mono text-slate-400'
                )}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>NASA Tier-4 Flight Logbook Record Signed</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setInspectingMission(null)}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  isSketch && (
                    isPaper
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-[#2d2d2d] sketch-btn font-sketch-hand font-bold text-sm'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black border-2 border-white sketch-btn-orange font-sketch-hand font-bold text-sm'
                  )
                )}
              >
                Close Flight Dossier
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
