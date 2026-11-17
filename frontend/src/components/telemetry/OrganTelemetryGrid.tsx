import React from 'react';
import { Heart, Wind, Brain, Activity, Droplets, User } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { clsx } from 'clsx';

export interface OrganSystemData {
  id: string;
  name: string;
  system: string;
  score: number;
  status: 'nominal' | 'warning' | 'critical';
  metricValue: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const DEFAULT_ORGANS_DATA: OrganSystemData[] = [
  {
    id: 'heart',
    name: 'Heart',
    system: 'Cardiovascular',
    score: 92,
    status: 'nominal',
    metricValue: '62 BPM',
    icon: Heart,
  },
  {
    id: 'lungs',
    name: 'Lungs',
    system: 'Respiratory',
    score: 96,
    status: 'nominal',
    metricValue: '97% SpO2',
    icon: Wind,
  },
  {
    id: 'brain',
    name: 'Brain',
    system: 'Central Nervous',
    score: 95,
    status: 'nominal',
    metricValue: '8.4 Hz Alpha',
    icon: Brain,
  },
  {
    id: 'liver',
    name: 'Liver',
    system: 'Hepatic / Metabolic',
    score: 92,
    status: 'nominal',
    metricValue: 'ALT/AST Nominal',
    icon: Activity,
  },
  {
    id: 'kidneys',
    name: 'Kidneys',
    system: 'Renal System',
    score: 92,
    status: 'nominal',
    metricValue: 'Hydration 92%',
    icon: Droplets,
  },
  {
    id: 'whole_body',
    name: 'Whole Body',
    system: 'Systemic Bio-Scan',
    score: 94,
    status: 'nominal',
    metricValue: '36.7 °C',
    icon: User,
  },
];

interface OrganTelemetryGridProps {
  organs?: OrganSystemData[];
  onSelectOrgan?: (organ: OrganSystemData) => void;
  selectedOrganId?: string;
  className?: string;
}

export const OrganTelemetryGrid: React.FC<OrganTelemetryGridProps> = ({
  organs = DEFAULT_ORGANS_DATA,
  onSelectOrgan,
  selectedOrganId,
  className,
}) => {
  return (
    <div className={clsx('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="font-mono text-xs uppercase font-bold tracking-wider text-cyan-400">
            ORGAN TELEMETRY
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">Synced from astronaut mobile bio-scan</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {organs.map((organ) => {
          const Icon = organ.icon;
          const isSelected = selectedOrganId === organ.id;

          return (
            <div
              key={organ.id}
              onClick={() => onSelectOrgan?.(organ)}
              className={clsx(
                'group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer border select-none',
                'bg-[#0B132B]/90 hover:bg-[#101D3F] backdrop-blur-md',
                isSelected
                  ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                  : 'border-[#1E3A5F] hover:border-cyan-500/50'
              )}
            >
              {/* Header: Title + Subtitle + Score Pill */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-white text-base tracking-wide group-hover:text-cyan-300 transition-colors">
                    {organ.name}
                  </h4>
                  <p className="text-xs text-slate-400">{organ.system}</p>
                </div>
                <div className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#050B14] text-cyan-400 border border-cyan-500/40 shadow-[0_0_8px_rgba(0,229,255,0.15)]">
                  {organ.score}%
                </div>
              </div>

              {/* Center: Glowing Circular Icon */}
              <div className="my-5 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#050B14] border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.15)] group-hover:scale-105 group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all duration-300">
                  <Icon className="w-7 h-7 text-cyan-400" />
                </div>
              </div>

              {/* Footer: NOMINAL badge + Live Value */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1E3A5F]/60">
                <Badge status={organ.status} pulse={organ.status !== 'nominal'}>
                  {organ.status}
                </Badge>
                <span className="font-mono text-xs font-semibold text-slate-200 tracking-wide">
                  {organ.metricValue}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
