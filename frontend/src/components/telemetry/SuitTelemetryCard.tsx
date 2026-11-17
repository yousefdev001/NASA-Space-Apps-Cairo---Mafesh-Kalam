import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Gauge, ShieldAlert, BatteryCharging, Droplets, Wind, Zap, Radio } from 'lucide-react';

export interface SuitTelemetryData {
  suit_pressure_kpa: number;
  suit_pressure_psi: number;
  o2_partial_pressure_kpa: number;
  co2_scrubber_efficiency: number;
  suit_temp_inner_celsius: number;
  battery_percent: number;
  battery_margin_hours: number;
  lcvg_water_temp_celsius: number;
  lcvg_flow_rate_lpm: number;
  metabolic_rate_btu_hr: number;
  eva_duration_minutes: number;
  mode: string;
  status: 'nominal' | 'warning' | 'critical';
}

interface SuitTelemetryCardProps {
  suit?: SuitTelemetryData;
  callsign?: string;
}

export const SuitTelemetryCard: React.FC<SuitTelemetryCardProps> = ({
  suit = {
    suit_pressure_kpa: 29.6,
    suit_pressure_psi: 4.3,
    o2_partial_pressure_kpa: 28.4,
    co2_scrubber_efficiency: 97.4,
    suit_temp_inner_celsius: 18.2,
    battery_percent: 88.5,
    battery_margin_hours: 4.6,
    lcvg_water_temp_celsius: 16.8,
    lcvg_flow_rate_lpm: 1.35,
    metabolic_rate_btu_hr: 860,
    eva_duration_minutes: 185,
    mode: 'EVA-1 Sortie · Active Excursion',
    status: 'nominal',
  },
  callsign = 'CDR-01',
}) => {
  return (
    <Card
      title={`SPACESUIT BIO-HARNESS & xEMU · ${callsign}`}
      subtitle="Extravehicular Micro-Environment & Closed-Loop Avionics Telemetry"
      headerAction={
        <div className="flex items-center gap-2">
          <Badge status={suit.status} pulse={suit.status !== 'nominal'}>
            {suit.status}
          </Badge>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-bold hidden sm:inline-block">
            {suit.mode}
          </span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Top 6 telemetry gauges grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Suit Pressure */}
          <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                SUIT PRESS
              </span>
              <span className="text-cyan-400 font-bold">{suit.suit_pressure_psi} psi</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono text-white">
                {suit.suit_pressure_kpa}
              </span>
              <span className="text-[10px] font-mono text-slate-400">kPa</span>
            </div>
            <div className="w-full bg-slate-800/80 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (suit.suit_pressure_kpa / 101.3) * 100)}%` }}
              />
            </div>
          </div>

          {/* O2 Partial Pressure */}
          <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
              <span className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-emerald-400" />
                ppO2 PURGE
              </span>
              <span className="text-emerald-400 font-bold">PURE O2</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono text-white">
                {suit.o2_partial_pressure_kpa}
              </span>
              <span className="text-[10px] font-mono text-slate-400">kPa</span>
            </div>
            <div className="w-full bg-slate-800/80 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (suit.o2_partial_pressure_kpa / 30) * 100)}%` }}
              />
            </div>
          </div>

          {/* LCVG Coolant Loop */}
          <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                LCVG LOOP
              </span>
              <span className="text-blue-300 font-bold">{suit.lcvg_flow_rate_lpm} L/m</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono text-white">
                {suit.lcvg_water_temp_celsius}
              </span>
              <span className="text-[10px] font-mono text-slate-400">°C Water</span>
            </div>
            <div className="w-full bg-slate-800/80 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-blue-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (suit.lcvg_water_temp_celsius / 25) * 100)}%` }}
              />
            </div>
          </div>

          {/* CO2 Amine Scrubber */}
          <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                CO2 SCRUB
              </span>
              <span className="text-cyan-400 font-bold">Amine Bed</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono text-white">
                {suit.co2_scrubber_efficiency}%
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">Nominal</span>
            </div>
            <div className="w-full bg-slate-800/80 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${suit.co2_scrubber_efficiency}%` }}
              />
            </div>
          </div>

          {/* Metabolic BTU Load */}
          <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                METABOLIC
              </span>
              <span className="text-amber-400 font-bold">Exertion</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono text-white">
                {suit.metabolic_rate_btu_hr}
              </span>
              <span className="text-[10px] font-mono text-slate-400">BTU/h</span>
            </div>
            <div className="w-full bg-slate-800/80 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (suit.metabolic_rate_btu_hr / 1200) * 100)}%` }}
              />
            </div>
          </div>

          {/* Suit Battery & Margin */}
          <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
              <span className="flex items-center gap-1.5">
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                BATTERY
              </span>
              <span className="text-emerald-400 font-bold">+{suit.battery_margin_hours}h Margin</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono text-white">
                {suit.battery_percent}%
              </span>
              <span className="text-[10px] font-mono text-slate-400">Li-Ion Cell</span>
            </div>
            <div className="w-full bg-slate-800/80 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${suit.battery_percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bio-Harness Connectivity Ribbon */}
        <div className="p-2.5 rounded-lg bg-[#050B14]/80 border border-[#1E3A5F]/60 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>BIO-SUIT HARNESS: <strong className="text-cyan-300">12-CH BIO-IMPEDANCE MESH ACTIVE</strong></span>
          </div>
          <span className="text-slate-400">EVA ELAPSED: <strong className="text-white">{suit.eva_duration_minutes} MIN</strong></span>
        </div>
      </div>
    </Card>
  );
};
