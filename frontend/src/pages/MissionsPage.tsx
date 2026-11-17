import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
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

// Countdown / MET Clock Component
const MissionTimer: React.FC<{ launchDate?: string | null; status: string }> = ({ launchDate, status }) => {
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
      className={`inline-flex items-center font-mono font-bold tracking-widest px-3 py-1.5 rounded-lg border text-xs gap-2 ${
        status === 'active'
          ? 'text-cyan-400 bg-[#050B14]/80 border-[#1E3A5F] shadow-[0_0_10px_rgba(0,229,255,0.15)]'
          : isCountdown
          ? 'text-amber-400 bg-amber-950/20 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
          : 'text-slate-400 bg-[#050B14] border-slate-700'
      }`}
    >
      <Clock className={`w-3.5 h-3.5 ${status === 'active' ? 'text-cyan-400 animate-pulse' : 'text-amber-400'}`} />
      <span>{timeStr}</span>
    </div>
  );
};

export const MissionsPage: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inspection Drawer/Modal State
  const [inspectingMission, setInspectingMission] = useState<Mission | null>(null);

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
      // Update inspecting mission if open
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
    // Fallback default operational phases if none seeded in DB
    return [
      { id: 1, mission_id: mission.id, phase_name: 'Launch & Insertion', phase_order: 1, status: 'completed', description: 'Orbital boost and telemetry acquisition.' },
      { id: 2, mission_id: mission.id, phase_name: 'Trajectory Cruise', phase_order: 2, status: 'active', description: 'Trans-orbital navigation and crew health monitoring.' },
      { id: 3, mission_id: mission.id, phase_name: 'Destination Operations', phase_order: 3, status: 'pending', description: 'Orbital docking, surface landing, and scientific debrief.' },
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-mono font-bold text-white tracking-wide flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-cyan-400" />
            FLIGHT MISSIONS & EVA PROTOCOLS
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            CREW ASSIGNMENTS, MISSION ELAPSED TIME (MET) & OPERATIONAL FLIGHT PHASES
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge status="info">{missions.length} MISSIONS LOADED</Badge>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleManualRefresh}
            isLoading={isRefreshing}
            className="text-xs gap-1.5"
            title="Refresh Missions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setErrorMessage(null)} className="text-xs p-1">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Main Missions List */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400 tracking-wider">
            RETRIEVING LIVE MISSION TRAJECTORIES & CREW ROSTERS...
          </p>
        </div>
      ) : missions.length === 0 ? (
        <Card className="border-[#1E3A5F] text-center py-16">
          <Compass className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-mono font-bold text-white">NO MISSIONS FOUND</h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Ground Station reports zero active mission profiles in the database.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {missions.map((mission) => {
            const phases = getMissionPhases(mission);
            const crewList = mission.crew && mission.crew.length > 0
              ? mission.crew.map((c) => `${c.full_name} (${c.pivot?.crew_role || c.callsign})`)
              : ['Crew assignments in flight certification'];

            return (
              <Card
                key={mission.id}
                className="border-[#1E3A5F] hover:border-cyan-400/50 transition-all cursor-pointer group shadow-lg hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]"
                onClick={() => setInspectingMission(mission)}
              >
                {/* Header row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1E3A5F]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                      <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30">
                        {mission.mission_code}
                      </span>
                      <Badge
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
                      <span className="text-xs font-mono text-slate-400">· {mission.mission_type}</span>
                      {mission.is_primary && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40">
                          PRIMARY DIRECTIVE
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {mission.name}
                    </h3>
                  </div>

                  {/* Timer */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">
                        {mission.status === 'active' ? 'MET:' : 'LAUNCH:'}
                      </span>
                      <MissionTimer launchDate={mission.launch_date} status={mission.status} />
                    </div>

                    <Button
                      variant="hud"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectingMission(mission);
                      }}
                      className="text-xs shrink-0 gap-1.5"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-slate-400">DESTINATION:</span>
                      <span className="text-white font-semibold">{mission.destination || 'Low Earth Orbit'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-slate-400">VEHICLE:</span>
                      <span className="text-white font-semibold">{mission.vehicle_name || 'Standard Spacecraft'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-slate-400">LAUNCH DATE:</span>
                      <span className="text-white">
                        {mission.launch_date ? new Date(mission.launch_date).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'TBD'}
                      </span>
                    </div>

                    {mission.description && (
                      <p className="text-xs text-slate-300 mt-2 font-sans line-clamp-2 leading-relaxed">
                        {mission.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span className="text-slate-400 font-bold">CREW COMPLEMENT ({crewList.length}):</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {crewList.map((crewName, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded bg-[#050B14] border border-[#1E3A5F] text-[11px] text-cyan-300 font-mono font-medium shadow-sm"
                        >
                          {crewName}
                        </span>
                      ))}
                    </div>

                    {/* Operational Phases Progress Preview */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-[11px] font-bold">FLIGHT PROGRESSION:</span>
                        <span className="text-[10px] text-cyan-400 hover:underline">
                          Click to inspect phases & milestones
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {phases.slice(0, 4).map((phase, pIdx) => (
                          <div
                            key={pIdx}
                            className={`p-2 rounded border text-[10px] text-center font-mono transition-all ${
                              phase.status === 'completed'
                                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                                : phase.status === 'active'
                                ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 animate-pulse font-bold'
                                : 'bg-[#050B14] border-[#1E3A5F]/50 text-slate-500'
                            }`}
                          >
                            <span className="block truncate">{phase.phase_name}</span>
                            <span className="text-[9px] uppercase opacity-75">[{phase.status}]</span>
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

      {/* INSPECTION MODAL: OPERATIONAL PHASES & PAYLOAD MILESTONES */}
      {inspectingMission && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-3xl border-cyan-500/50 shadow-[0_0_40px_rgba(0,229,255,0.25)] my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#1E3A5F]">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30">
                    {inspectingMission.mission_code}
                  </span>
                  <Badge
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
                  <span className="text-xs font-mono text-slate-400">· {inspectingMission.mission_type}</span>
                </div>
                <h2 className="text-xl font-bold font-mono text-white">{inspectingMission.name}</h2>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInspectingMission(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-1">
              {/* Telemetry Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">DESTINATION</span>
                  <span className="text-cyan-300 font-bold">{inspectingMission.destination || 'LEO'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">VEHICLE</span>
                  <span className="text-white font-bold">{inspectingMission.vehicle_name || 'Standard'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">MISSION CLOCK</span>
                  <MissionTimer launchDate={inspectingMission.launch_date} status={inspectingMission.status} />
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CREW COUNT</span>
                  <span className="text-emerald-400 font-bold">{inspectingMission.crew?.length || 0} ASTRONAUTS</span>
                </div>
              </div>

              {/* SECTION 1: Operational Flight Phases */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-mono font-bold text-white">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>OPERATIONAL FLIGHT PHASES & STEPPERS</span>
                </div>

                <div className="space-y-2.5">
                  {getMissionPhases(inspectingMission).map((phase, idx) => (
                    <div
                      key={phase.id || idx}
                      className={`p-3 rounded-lg border font-mono transition-all ${
                        phase.status === 'completed'
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                          : phase.status === 'active'
                          ? 'bg-cyan-950/30 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                          : 'bg-[#050B14] border-[#1E3A5F]/60 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#050B14] border border-current">
                            {phase.phase_order || idx + 1}
                          </span>
                          <span className="text-xs font-bold text-white">{phase.phase_name}</span>
                        </div>

                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            phase.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : phase.status === 'active'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 animate-pulse'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {phase.status}
                        </span>
                      </div>

                      {phase.description && (
                        <p className="text-xs font-sans text-slate-300 pl-7">{phase.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: Payload Milestones */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-mono font-bold text-white">
                  <Box className="w-4 h-4 text-cyan-400" />
                  <span>SCIENTIFIC & CLINICAL PAYLOAD MILESTONES</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {getPayloadMilestones(inspectingMission.mission_code).map((payload) => (
                    <div
                      key={payload.id}
                      className="p-3 rounded-lg bg-[#050B14] border border-[#1E3A5F] hover:border-cyan-500/40 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-bold text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                          {payload.id}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                            payload.status === 'verified'
                              ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                              : payload.status === 'active'
                              ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-400/30'
                              : 'bg-amber-950/30 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {payload.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white font-mono">{payload.name}</h4>
                      <p className="text-xs text-slate-400 font-sans leading-relaxed">{payload.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3: Crew Roster */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-mono font-bold text-white">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>CREW MANIFEST & MEDICAL READINESS</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {inspectingMission.crew && inspectingMission.crew.length > 0 ? (
                    inspectingMission.crew.map((astro) => (
                      <div
                        key={astro.id}
                        className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <div className="text-white font-bold">{astro.full_name}</div>
                          <div className="text-slate-400 text-[11px]">{astro.rank || astro.callsign}</div>
                          <div className="text-cyan-400 text-[10px]">{astro.specialization}</div>
                        </div>
                        <Badge status="nominal">FLIGHT CERTIFIED</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-lg bg-[#050B14] border border-[#1E3A5F] text-xs font-mono text-slate-400 col-span-2">
                      Crew roster currently undergoing flight surgeon qualification check.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-[#1E3A5F]">
              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>NASA Tier 4 Mission Protocol Active</span>
              </div>
              <Button variant="primary" size="sm" onClick={() => setInspectingMission(null)}>
                Close Mission Manifest
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
