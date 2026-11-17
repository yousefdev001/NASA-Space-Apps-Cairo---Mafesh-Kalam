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
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EcgCanvas } from '../components/charts/EcgCanvas';
import { OrganRadarChart } from '../components/charts/OrganRadarChart';
import { RadiationGauge } from '../components/charts/RadiationGauge';
import { VitalsStreamChart } from '../components/charts/VitalsStreamChart';
import { OrganTelemetryGrid } from '../components/telemetry/OrganTelemetryGrid';
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
  const [lastSyncTime, setLastSyncTime] = useState<string>('SYNCHRONIZED');
  const [metString, setMetString] = useState<string>('042d 14h 22m 00s');

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
    <div className="space-y-6">
      {/* Top Mission Status Strip */}
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
          {/* Mission Elapsed Time */}
          <div className="flex items-center gap-2 text-xs font-mono bg-[#050B14] px-3 py-1.5 rounded-lg border border-[#1E3A5F]">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">MET:</span>
            <span className="text-amber-400 font-bold">{metString}</span>
          </div>

          {/* Telemetry Stream Health */}
          <div className="flex items-center gap-2 text-xs font-mono bg-[#050B14] px-3 py-1.5 rounded-lg border border-[#1E3A5F]">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-slate-400">DOWNLINK:</span>
            <span className="text-emerald-400 font-bold">500 HZ BURST NOMINAL</span>
          </div>

          <button
            onClick={() => void fetchTelemetry(selectedCrewId)}
            title="Manual sync now"
            className="p-1.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] hover:border-cyan-400 text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Crew Selection Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-mono uppercase text-slate-400 tracking-wider font-bold">
            ORBITAL CREW TELEMETRY SELECTION (LIVE BIO-DOWNLINK)
          </p>
          <span className="text-[11px] font-mono text-slate-500">
            LAST SYNC: {lastSyncTime}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {crewMembers.map((member) => {
            const isSelected = selectedCrewId === member.id;
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
        title={`PHYSIOLOGICAL 6-ORGAN BIO-SCAN · ${selectedCrew?.callsign || 'CDR-01'} (${selectedCrew?.name || 'Astronaut'})`}
        subtitle={`Direct offline sync from crew spacesuit bio-sensor nodes · Total EVA: ${selectedCrew?.eva_hours || 0} Hours`}
      >
        <OrganTelemetryGrid organs={organs.length > 0 ? organs : undefined} compact />
      </Card>

      {/* Primary Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): ECG, Vitals Stream */}
        <div className="lg:col-span-8 space-y-6">
          {/* Real-time ECG Waveform Canvas */}
          <Card
            title={`CONTINUOUS CARDIAC ARRAY · ${selectedCrew?.callsign || 'CDR-01'} (${selectedCrew?.name || 'Elena Vance'})`}
            subtitle={`Holographic Lead II Vector Electrocardiogram · 500 Hz Sampling Frequency · Station: ${selectedCrew?.zone || 'Habitation'}`}
          >
            <EcgCanvas
              bpm={selectedCrew?.hr || 62}
              height={150}
              isNominal={selectedCrew?.status === 'nominal'}
            />
          </Card>

          {/* Vitals Stream Line Chart (ECharts) */}
          <Card
            title={`15-MINUTE TELEMETRY STREAM · ${selectedCrew?.name || 'Astronaut'}`}
            subtitle="Real-time Heart Rate (BPM) & SpO2 (%) Time-Series Downlink"
          >
            <VitalsStreamChart
              dataPoints={vitalsHistory.length > 0 ? vitalsHistory : undefined}
              height="280px"
            />
          </Card>
        </div>

        {/* Right Column (4 cols): Radar, Radiation, Environment, Triage */}
        <div className="lg:col-span-4 space-y-6">
          {/* Organ Integrity Radar Chart */}
          <Card
            title="SYSTEMS INTEGRITY RADAR"
            subtitle={`Hexagonal Organ Health Distribution · ${selectedCrew?.name || 'Astronaut'}`}
          >
            <OrganRadarChart scores={radarScores} height="270px" />
          </Card>

          {/* Radiation Dosimeter Gauge */}
          <Card
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
          <Card title="CABIN LIFE SUPPORT (ECLSS)" subtitle="Habitat Atmospheric Equilibrium">
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F]">
                <span className="text-slate-400 block text-[10px]">PRESSURE</span>
                <span className="text-cyan-400 font-bold text-sm">
                  {cabinEnv.cabin_pressure_kpa} kPa
                </span>
                <span className="text-[10px] text-emerald-400 block">NOMINAL</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F]">
                <span className="text-slate-400 block text-[10px]">OXYGEN (O2)</span>
                <span className="text-cyan-400 font-bold text-sm">
                  {cabinEnv.o2_percent} %
                </span>
                <span className="text-[10px] text-emerald-400 block">NOMINAL</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F]">
                <span className="text-slate-400 block text-[10px]">CARBON DIOXIDE</span>
                <span className="text-cyan-400 font-bold text-sm">
                  {cabinEnv.co2_ppm} ppm
                </span>
                <span className="text-[10px] text-emerald-400 block">SAFE LIMIT</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F]">
                <span className="text-slate-400 block text-[10px]">TEMPERATURE</span>
                <span className="text-cyan-400 font-bold text-sm">
                  {cabinEnv.temperature_celsius} °C
                </span>
                <span className="text-[10px] text-emerald-400 block">COMFORT ZONE</span>
              </div>
            </div>
          </Card>

          {/* Clinical Decision & Alert Triage Queue */}
          <Card
            title={`CLINICAL ACTION QUEUE (${unresolvedAlertsCount})`}
            subtitle="NASA Flight Surgeon Urgent Protocols"
          >
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/40 text-xs font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> ALT-094 · ELEVATED HR
                  </span>
                  <Badge status="warning">WARNING</Badge>
                </div>
                <p className="text-slate-300 text-[11px]">
                  SPC-03 Arya Patel sustained heart rate 84 BPM during EVA airlock protocol.
                </p>
                <div className="pt-2 flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-[10px]"
                    onClick={() => navigate('/alerts')}
                  >
                    Triage Alert
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/40 text-xs font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" /> AI-204 · ARRHYTHMIA CHECK
                  </span>
                  <Badge status="info">HITL REVIEW</Badge>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Neural rhythm model flagged isolated sinus tachycardia. 94.2% confidence.
                </p>
                <div className="pt-2 flex justify-end">
                  <Button
                    variant="hud"
                    size="sm"
                    className="text-[10px]"
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
