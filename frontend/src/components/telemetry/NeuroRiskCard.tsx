import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Brain, Eye, Activity, ShieldCheck, Waves } from 'lucide-react';

export interface NeuroRiskData {
  alpha_hz: number;
  beta_hz: number;
  theta_hz: number;
  delta_hz: number;
  cognitive_load_index: number;
  fatigue_index: number;
  readiness_score: number;
  dcs_spencer_grade: string;
  sans_optic_nerve_mm: number;
  sans_risk: string;
  orthostatic_stability: number;
  fluid_shift_jvp_mmhg: number;
}

interface NeuroRiskCardProps {
  data?: NeuroRiskData;
  callsign?: string;
  themeMode?: 'cyber' | 'paper' | 'dark';
}

export const NeuroRiskCard: React.FC<NeuroRiskCardProps> = ({
  data = {
    alpha_hz: 10.4,
    beta_hz: 18.2,
    theta_hz: 5.2,
    delta_hz: 1.8,
    cognitive_load_index: 74.5,
    fatigue_index: 18.0,
    readiness_score: 94,
    dcs_spencer_grade: 'Grade 0 (Zero VGE)',
    sans_optic_nerve_mm: 4.75,
    sans_risk: 'Nominal (<5.8 mm)',
    orthostatic_stability: 95.2,
    fluid_shift_jvp_mmhg: 1.4,
  },
  callsign = 'CDR-01',
  themeMode = 'cyber',
}) => {
  const isPaper = themeMode === 'paper';
  const isDark = themeMode === 'dark';
  const isSketch = isPaper || isDark;

  return (
    <Card
      title={`NEURO-COGNITIVE SPECTRUM & SANS PREDICTOR · ${callsign}`}
      subtitle="Cerebral EEG Density, Decompression Spencer Scale & SANS Vector"
      themeMode={themeMode}
      decoration={isSketch ? 'tape' : 'none'}
      headerAction={
        <div className="flex items-center gap-2">
          <Badge status={data.readiness_score >= 85 ? 'nominal' : 'warning'} themeMode={themeMode}>
            {data.readiness_score}% READINESS
          </Badge>
          <span
            className={
              isPaper
                ? 'text-[11px] font-sketch-hand px-2.5 py-0.5 rounded border border-[#2d2d2d] bg-[#fff9c4] text-[#2d2d2d] font-bold hidden sm:inline-block'
                : isDark
                  ? 'text-[11px] font-sketch-hand px-2.5 py-0.5 rounded border border-white bg-black text-[#FF4D00] font-bold hidden sm:inline-block'
                  : 'text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/70 border border-purple-500/40 text-purple-300 font-bold hidden sm:inline-block'
            }
          >
            BIO-AI PREDICTIVE
          </span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Real-Time EEG 4-Band Spectrum Visualizer */}
        <div className="p-3 rounded-lg bg-[#050B14] border border-[#1E3A5F] space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5 font-bold uppercase">
              <Brain className="w-4 h-4 text-purple-400" />
              CEREBRAL EEG FREQUENCY SPECTRUM
            </span>
            <span className="text-cyan-400 font-mono text-[11px]">Sampling: 500 Hz</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-[11px] font-mono">
            {/* Delta */}
            <div className="p-2 rounded bg-[#07101E] border border-[#1E3A5F]/60 text-center">
              <div className="text-slate-400 text-[10px]">DELTA (0.5-4Hz)</div>
              <div className="text-white font-bold text-sm my-0.5">{data.delta_hz} Hz</div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-slate-400 h-full rounded-full" style={{ width: `${(data.delta_hz / 4) * 100}%` }} />
              </div>
            </div>

            {/* Theta */}
            <div className="p-2 rounded bg-[#07101E] border border-[#1E3A5F]/60 text-center">
              <div className="text-amber-400 text-[10px]">THETA (4-8Hz)</div>
              <div className="text-white font-bold text-sm my-0.5">{data.theta_hz} Hz</div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(data.theta_hz / 8) * 100}%` }} />
              </div>
            </div>

            {/* Alpha */}
            <div className="p-2 rounded bg-[#07101E] border border-cyan-500/30 text-center shadow-[0_0_8px_rgba(0,229,255,0.1)]">
              <div className="text-cyan-400 text-[10px] font-bold">ALPHA (8-12Hz)</div>
              <div className="text-cyan-300 font-bold text-sm my-0.5">{data.alpha_hz} Hz</div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${(data.alpha_hz / 12) * 100}%` }} />
              </div>
            </div>

            {/* Beta */}
            <div className="p-2 rounded bg-[#07101E] border border-[#1E3A5F]/60 text-center">
              <div className="text-emerald-400 text-[10px]">BETA (12-30Hz)</div>
              <div className="text-white font-bold text-sm my-0.5">{data.beta_hz} Hz</div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${(data.beta_hz / 30) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Cognitive Load Bar */}
          <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>COGNITIVE LOAD: <strong className="text-white">{data.cognitive_load_index}%</strong> (Optimal Focus)</span>
            <span>FATIGUE INDEX: <strong className="text-emerald-400">{data.fatigue_index}%</strong> (Low)</span>
          </div>
        </div>

        {/* Predictive Microgravity Risk Matrix */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* DCS Spencer Scale */}
          <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
              <span className="flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                DCS SPENCER
              </span>
              <Badge status="nominal" className="text-[9px] px-1.5 py-0">CLEAN</Badge>
            </div>
            <div className="mt-1 text-sm font-bold font-mono text-white truncate">
              {data.dcs_spencer_grade}
            </div>
            <p className="text-[10px] font-mono text-slate-500 mt-0.5">Venous Bubble Doppler</p>
          </div>

          {/* SANS Optic Nerve Sheath */}
          <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                SANS SHEATH
              </span>
              <span className="text-purple-300 font-bold text-[10px] font-mono">{data.sans_optic_nerve_mm} mm</span>
            </div>
            <div className="mt-1 text-sm font-bold font-mono text-white truncate">
              {data.sans_risk}
            </div>
            <p className="text-[10px] font-mono text-slate-500 mt-0.5">Optic Nerve Ultrasound</p>
          </div>

          {/* Fluid Shift JVP */}
          <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                HEADWARD SHIFT
              </span>
              <span className="text-blue-300 font-bold text-[10px] font-mono">+{data.fluid_shift_jvp_mmhg} mmHg</span>
            </div>
            <div className="mt-1 text-sm font-bold font-mono text-white">
              Cephalic Fluid Shift
            </div>
            <p className="text-[10px] font-mono text-slate-500 mt-0.5">Internal Jugular Doppler</p>
          </div>

          {/* Orthostatic Stability Index */}
          <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E3A5F] flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ORTHO STABILITY
              </span>
              <span className="text-emerald-400 font-bold text-[10px] font-mono">{data.orthostatic_stability}%</span>
            </div>
            <div className="mt-1 text-sm font-bold font-mono text-white">
              G-Transition Ready
            </div>
            <p className="text-[10px] font-mono text-slate-500 mt-0.5">Autonomic Baroreflex</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
