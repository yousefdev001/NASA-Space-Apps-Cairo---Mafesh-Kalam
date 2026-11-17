import React, { useState } from 'react';
import {
  Activity,
  Heart,
  ShieldAlert,
  Radio,
  Flame,
  Wind,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EcgCanvas } from '../components/charts/EcgCanvas';
import { OrganRadarChart } from '../components/charts/OrganRadarChart';
import { RadiationGauge } from '../components/charts/RadiationGauge';
import { VitalsStreamChart } from '../components/charts/VitalsStreamChart';
import { OrganTelemetryGrid, DEFAULT_ORGANS_DATA } from '../components/telemetry/OrganTelemetryGrid';

interface CrewMember {
  id: string;
  callsign: string;
  name: string;
  role: string;
  zone: string;
  hr: number;
  spo2: number;
  status: 'nominal' | 'warning' | 'critical';
  evaHours: number;
}

export const MissionControlPage: React.FC = () => {
  const crewMembers: CrewMember[] = [
    {
      id: 'vance',
      callsign: 'CDR-01',
      name: 'Elena Vance',
      role: 'Mission Commander',
      zone: 'Quest Airlock / EVA-1',
      hr: 62,
      spo2: 97.2,
      status: 'nominal',
      evaHours: 28.5,
    },
    {
      id: 'chen',
      callsign: 'PLT-02',
      name: 'Marcus Chen',
      role: 'Orbital Pilot',
      zone: 'Cupola Flight Deck',
      hr: 74,
      spo2: 98.4,
      status: 'nominal',
      evaHours: 14.0,
    },
    {
      id: 'patel',
      callsign: 'SPC-03',
      name: 'Arya Patel',
      role: 'Biomed Specialist',
      zone: 'Columbus Lab Module',
      hr: 82,
      spo2: 96.0,
      status: 'warning',
      evaHours: 6.2,
    },
  ];

  const [selectedCrew, setSelectedCrew] = useState<CrewMember>(crewMembers[0]);

  return (
    <div className="space-y-6">
      {/* Top Mission Status Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-[#0B132B]/80 border border-[#1E3A5F]">
        <div className="flex flex-wrap items-center gap-3">
          <Badge status="nominal">MISSION ACTIVE</Badge>
          <div className="text-sm font-mono">
            <span className="text-slate-400">EXPEDITION:</span>{' '}
            <span className="text-white font-bold">ARTEMIS IV · ORBITAL HABITAT</span>
          </div>
          <span className="text-[#1E3A5F] hidden sm:inline">|</span>
          <div className="text-xs font-mono text-cyan-400">
            TARGET: LUNAR SOUTH POLE GATEWAY
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono bg-[#050B14] px-3 py-1.5 rounded-lg border border-[#1E3A5F]">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-slate-400">TELEMETRY:</span>
            <span className="text-emerald-400 font-bold">500 HZ BURST NOMINAL</span>
          </div>
        </div>
      </div>

      {/* Crew Selection Bar */}
      <div>
        <p className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2 font-bold">
          ORBITAL CREW TELEMETRY SELECTION
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {crewMembers.map((member) => (
            <div
              key={member.id}
              onClick={() => setSelectedCrew(member)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedCrew.id === member.id
                  ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                  : 'bg-[#0B132B]/60 border-[#1E3A5F] hover:border-cyan-500/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#050B14] border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-xs text-cyan-300">
                  {member.callsign}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-snug">{member.name}</h4>
                  <p className="text-[11px] text-slate-400">{member.role}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge status={member.status}>{member.status}</Badge>
                <p className="text-xs font-mono text-cyan-400 mt-1 font-bold">{member.hr} BPM</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): ECG, Vitals Stream, Organ Grid */}
        <div className="lg:col-span-8 space-y-6">
          {/* Real-time ECG Waveform Canvas */}
          <Card
            title={`CONTINUOUS CARDIAC ARRAY · ${selectedCrew.callsign} (${selectedCrew.name})`}
            subtitle="Holographic Lead II Vector Electrocardiogram · 500 Hz Sampling Frequency"
          >
            <EcgCanvas bpm={selectedCrew.hr} height={150} isNominal={selectedCrew.status === 'nominal'} />
          </Card>

          {/* Vitals Stream Line Chart (ECharts) */}
          <Card
            title="15-MINUTE MULTI-METRIC TELEMETRY STREAM"
            subtitle="Real-time Heart Rate (BPM) & SpO2 (%) with Dynamic Envelope"
          >
            <VitalsStreamChart height="280px" />
          </Card>

          {/* Organ Telemetry 6-System Grid (Direct match with mobile screen) */}
          <Card
            title="ASTRONAUT PHYSIOLOGICAL BIO-SCAN"
            subtitle="Direct offline sync from crew spacesuit bio-sensor nodes"
          >
            <OrganTelemetryGrid />
          </Card>
        </div>

        {/* Right Column (4 cols): Radar, Radiation, Environment, Triage */}
        <div className="lg:col-span-4 space-y-6">
          {/* Organ Integrity Radar Chart */}
          <Card
            title="SYSTEMS INTEGRITY RADAR"
            subtitle="Hexagonal Organ Health Distribution"
          >
            <OrganRadarChart height="270px" />
          </Card>

          {/* Radiation Dosimeter Gauge */}
          <Card
            title="ACTIVE RADIATION DOSIMETER"
            subtitle="Particle Energy Spectra & Cumulative Msv"
          >
            <RadiationGauge valueMsvHr={0.042} cumulativeMsv={42.1} height="220px" />
          </Card>

          {/* Cabin Environment Panel */}
          <Card title="CABIN LIFE SUPPORT (ECLSS)" subtitle="Habitat Atmospheric Equilibrium">
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F]">
                <span className="text-slate-400 block text-[10px]">PRESSURE</span>
                <span className="text-cyan-400 font-bold text-sm">101.3 kPa</span>
                <span className="text-[10px] text-emerald-400 block">NOMINAL</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F]">
                <span className="text-slate-400 block text-[10px]">OXYGEN (O2)</span>
                <span className="text-cyan-400 font-bold text-sm">21.2 %</span>
                <span className="text-[10px] text-emerald-400 block">NOMINAL</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F]">
                <span className="text-slate-400 block text-[10px]">CARBON DIOXIDE</span>
                <span className="text-cyan-400 font-bold text-sm">0.38 %</span>
                <span className="text-[10px] text-emerald-400 block">SAFE LIMIT</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F]">
                <span className="text-slate-400 block text-[10px]">TEMPERATURE</span>
                <span className="text-cyan-400 font-bold text-sm">22.4 °C</span>
                <span className="text-[10px] text-emerald-400 block">COMFORT ZONE</span>
              </div>
            </div>
          </Card>

          {/* Clinical Decision & Alert Triage Queue */}
          <Card title="CLINICAL ALERTS REQUIRING TRIAGE" subtitle="NASA Flight Surgeon Action Queue">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/40 text-xs font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> ALT-094 · ELEVATED HR
                  </span>
                  <Badge status="warning">WARNING</Badge>
                </div>
                <p className="text-slate-300 text-[11px]">
                  SPC-03 Arya Patel sustained heart rate 82 BPM during EVA airlock pre-breathe protocol.
                </p>
                <div className="pt-2 flex justify-end">
                  <Button variant="secondary" size="sm" className="text-[10px]">
                    Acknowledge
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
                  Deep-learning rhythm model detected isolated PVC during sleep cycle. 94.2% confidence.
                </p>
                <div className="pt-2 flex justify-end">
                  <Button variant="hud" size="sm" className="text-[10px]">
                    Open Clinical Review
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
