import React from 'react';
import {
  OrganId,
  OrganDiagnosticData,
  OrganStatus,
  ViewPerspective,
} from '../../types/biotwin.types';
import {
  Brain,
  Eye,
  Activity,
  Heart,
  Wind,
  Droplets,
  Layers,
  Flame,
  User,
  Zap,
} from 'lucide-react';

export interface BodyLandmarkPointersProps {
  selectedOrganId?: OrganId | string | null;
  onSelectOrgan?: (organId: OrganId) => void;
  organsData?: OrganDiagnosticData[] | Record<string, OrganDiagnosticData>;
  perspective?: ViewPerspective;
  filterMode?: 'all' | 'anomalies_only' | 'warnings_and_selected';
  className?: string;
  heartRate?: number;
}

interface PointerDefinition {
  id: OrganId;
  label: string;
  side: 'left' | 'right';
  anchor: { x: number; y: number };
  pillYPercent: number; // percentage down the vertical container for HTML positioning
  defaultMetric: string;
  icon: React.ComponentType<{ className?: string }>;
}

const LANDMARK_POINTERS: PointerDefinition[] = [
  // Left Flank Callouts
  {
    id: 'brain',
    label: 'Cerebral Perfusion',
    side: 'left',
    anchor: { x: 236, y: 64 },
    pillYPercent: 7,
    defaultMetric: 'ICP 14 mmHg',
    icon: Brain,
  },
  {
    id: 'eyes',
    label: 'Ocular Sheath (SANS)',
    side: 'left',
    anchor: { x: 236, y: 78 },
    pillYPercent: 17,
    defaultMetric: 'ONSD 5.8 mm',
    icon: Eye,
  },
  {
    id: 'carotid_jugular',
    label: 'IJV Cephalad Venous',
    side: 'left',
    anchor: { x: 238, y: 126 },
    pillYPercent: 27,
    defaultMetric: 'CSA 1.42 cm²',
    icon: Activity,
  },
  {
    id: 'lungs',
    label: 'Pulmonary Ventilation',
    side: 'left',
    anchor: { x: 218, y: 198 },
    pillYPercent: 37,
    defaultMetric: 'SpO2 98.6%',
    icon: Wind,
  },
  {
    id: 'heart',
    label: 'Cardiovascular Core',
    side: 'left',
    anchor: { x: 260, y: 195 },
    pillYPercent: 47,
    defaultMetric: 'HR 72 bpm',
    icon: Heart,
  },
  {
    id: 'muscular_core',
    label: 'Trunk Musculature',
    side: 'left',
    anchor: { x: 228, y: 295 },
    pillYPercent: 60,
    defaultMetric: 'ΔCSA -3.8%',
    icon: User,
  },

  // Right Flank Callouts
  {
    id: 'spine',
    label: 'Spinal Elongation',
    side: 'right',
    anchor: { x: 256, y: 170 },
    pillYPercent: 12,
    defaultMetric: 'ΔL +4.6 cm',
    icon: Layers,
  },
  {
    id: 'liver',
    label: 'Hepatic Metabolism',
    side: 'right',
    anchor: { x: 242, y: 250 },
    pillYPercent: 24,
    defaultMetric: 'ALT 26 U/L',
    icon: Flame,
  },
  {
    id: 'kidneys',
    label: 'Renal / Electrolytes',
    side: 'right',
    anchor: { x: 276, y: 280 },
    pillYPercent: 35,
    defaultMetric: 'eGFR 112 mL',
    icon: Droplets,
  },
  {
    id: 'gastrointestinal',
    label: 'GI Motility / Flora',
    side: 'right',
    anchor: { x: 266, y: 326 },
    pillYPercent: 46,
    defaultMetric: 'Motility 94%',
    icon: Zap,
  },
  {
    id: 'upper_limbs',
    label: 'Upper Extremities',
    side: 'right',
    anchor: { x: 346, y: 270 },
    pillYPercent: 57,
    defaultMetric: 'Dexterity 99%',
    icon: Activity,
  },
  {
    id: 'lower_limbs',
    label: 'Venous Fluid Shift',
    side: 'right',
    anchor: { x: 284, y: 560 },
    pillYPercent: 72,
    defaultMetric: 'Calf Vol -7.4%',
    icon: User,
  },
];

export const BodyLandmarkPointers: React.FC<BodyLandmarkPointersProps> = ({
  selectedOrganId,
  onSelectOrgan,
  organsData,
  filterMode = 'all',
  className = '',
  heartRate,
}) => {
  const getOrganData = (id: string): OrganDiagnosticData | undefined => {
    if (!organsData) return undefined;
    if (Array.isArray(organsData)) {
      return organsData.find((o) => o.id === id || o.slug === id);
    }
    return organsData[id];
  };

  const getOrganStatus = (id: string): OrganStatus => {
    const data = getOrganData(id);
    if (data?.status) return data.status;
    if (id === 'carotid_jugular' || id === 'spine') return 'warning';
    return 'nominal';
  };

  const getMetricDisplay = (pointer: PointerDefinition): string => {
    if (pointer.id === 'heart' && heartRate) {
      return `HR ${heartRate} bpm`;
    }
    const data = getOrganData(pointer.id);
    if (data?.primaryMetric?.value !== undefined) {
      const unit = data.primaryMetric.unit ? ` ${data.primaryMetric.unit}` : '';
      return `${data.primaryMetric.value}${unit}`;
    }
    return pointer.defaultMetric;
  };

  // Filter pointers based on mode
  const visiblePointers = LANDMARK_POINTERS.filter((pointer) => {
    const status = getOrganStatus(pointer.id);
    const isSelected = selectedOrganId === pointer.id;

    if (filterMode === 'anomalies_only') {
      return status === 'warning' || status === 'critical';
    }
    if (filterMode === 'warnings_and_selected') {
      return status === 'warning' || status === 'critical' || isSelected;
    }
    return true; // 'all'
  });

  const getStatusBadgeStyle = (status: OrganStatus) => {
    switch (status) {
      case 'critical':
        return 'border-rose-500/50 bg-rose-950/60 text-rose-400 shadow-rose-950/50';
      case 'warning':
        return 'border-amber-500/50 bg-amber-950/60 text-amber-400 shadow-amber-950/50';
      case 'nominal':
      default:
        return 'border-cyan-500/40 bg-cyan-950/40 text-cyan-400 shadow-cyan-950/30';
    }
  };

  const getStatusLineColor = (status: OrganStatus) => {
    switch (status) {
      case 'critical':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'nominal':
      default:
        return '#00E5FF';
    }
  };

  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none ${className}`}
      data-testid="body-landmark-pointers"
    >
      {/* 1. SVG CALLOUT LEADER LINES */}
      <svg
        viewBox="0 0 500 890"
        className="w-full h-full absolute inset-0 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <filter id="pointer-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {visiblePointers.map((pointer) => {
          const status = getOrganStatus(pointer.id);
          const isSelected = selectedOrganId === pointer.id;
          const lineColor = getStatusLineColor(status);
          const { x, y } = pointer.anchor;

          // Compute circuit elbow trajectory towards side edge
          const isLeft = pointer.side === 'left';
          const edgeX = isLeft ? 18 : 482;
          const elbowX = isLeft ? x - 42 : x + 42;
          const targetY = (pointer.pillYPercent / 100) * 890 + 16;

          const pathD = `M ${x},${y} L ${elbowX},${targetY} L ${edgeX},${targetY}`;

          return (
            <g
              key={pointer.id}
              opacity={isSelected ? 1 : status !== 'nominal' ? 0.95 : 0.65}
              filter="url(#pointer-glow)"
              className="transition-opacity duration-300"
            >
              {/* Origin Pulsing Node on Organ */}
              <circle cx={x} cy={y} r="3" fill={lineColor} />
              <circle
                cx={x}
                cy={y}
                r="6"
                fill="none"
                stroke={lineColor}
                strokeWidth="0.8"
                strokeDasharray="2 2"
                opacity={0.8}
              />

              {/* HUD Leader Circuit Line */}
              <path
                d={pathD}
                fill="none"
                stroke={lineColor}
                strokeWidth={isSelected ? 1.8 : 1}
                strokeDasharray={status === 'warning' ? '4 2' : undefined}
              />

              {/* Terminal Arrow / Dot at flank edge */}
              <circle cx={edgeX} cy={targetY} r="2.5" fill={lineColor} />
            </g>
          );
        })}
      </svg>

      {/* 2. HUD SIDE INDICATOR PILLS (LEFT & RIGHT FLANKS) */}
      <div className="relative w-full h-full pointer-events-auto">
        {visiblePointers.map((pointer) => {
          const status = getOrganStatus(pointer.id);
          const isSelected = selectedOrganId === pointer.id;
          const isLeft = pointer.side === 'left';
          const IconComponent = pointer.icon;
          const metricText = getMetricDisplay(pointer);

          return (
            <div
              key={pointer.id}
              style={{
                top: `${pointer.pillYPercent}%`,
                left: isLeft ? '0.5rem' : undefined,
                right: !isLeft ? '0.5rem' : undefined,
              }}
              className={`absolute transform -translate-y-1/2 transition-all duration-200 z-10 cursor-pointer ${
                isSelected
                  ? 'scale-105 ring-1 ring-cyan-400 ring-offset-1 ring-offset-slate-950'
                  : 'hover:scale-102 opacity-85 hover:opacity-100'
              }`}
              onClick={() => onSelectOrgan?.(pointer.id)}
              role="button"
              tabIndex={0}
              aria-label={`Select ${pointer.label}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectOrgan?.(pointer.id);
                }
              }}
            >
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs backdrop-blur-md shadow-md transition-colors ${getStatusBadgeStyle(
                  status
                )}`}
              >
                <IconComponent className="w-3.5 h-3.5 shrink-0" />
                <div className="flex flex-col text-[10px] leading-tight">
                  <span className="font-semibold tracking-wider uppercase text-[9px] opacity-90 truncate max-w-[95px]">
                    {pointer.label}
                  </span>
                  <span className="font-mono font-bold tracking-tight text-[10px]">
                    {metricText}
                  </span>
                </div>
                {status !== 'nominal' && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      status === 'critical'
                        ? 'bg-rose-500 animate-ping'
                        : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
