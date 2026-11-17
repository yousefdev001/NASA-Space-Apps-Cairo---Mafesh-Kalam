import React from 'react';
import {
  AnatomicalLayer,
  ViewPerspective,
  ShaderMode,
  ActiveLayersState,
} from '../../types/biotwin.types';
import {
  Brain,
  Activity,
  Heart,
  User,
  Layers,
  RotateCw,
  Sparkles,
  Flame,
  Radio,
  CheckSquare,
} from 'lucide-react';

export interface AnatomicalLayersControlProps {
  activeLayers: ActiveLayersState;
  onToggleLayer: (layer: AnatomicalLayer) => void;
  onSetAllLayers?: (active: boolean) => void;
  perspective: ViewPerspective;
  onTogglePerspective: () => void;
  shaderMode: ShaderMode;
  onChangeShaderMode: (mode: ShaderMode) => void;
  className?: string;
  variant?: 'floating' | 'inline' | 'compact';
}

interface LayerConfig {
  id: AnatomicalLayer;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const LAYERS_CONFIG: LayerConfig[] = [
  { id: 'neural', label: 'Neural', description: 'Brain, spinal cord, & peripheral nerves', icon: Brain },
  { id: 'vascular', label: 'Vascular', description: 'Carotids, aorta, & femoral circulation', icon: Activity },
  { id: 'visceral', label: 'Visceral', description: 'Heart, lungs, liver, kidneys, & GI', icon: Heart },
  { id: 'muscular', label: 'Muscular', description: 'Pectorals, trunk core, & limb bellies', icon: User },
  { id: 'skeletal', label: 'Skeletal', description: 'Cranium, vertebrae, ribcage, & pelvis', icon: Layers },
];

export const AnatomicalLayersControl: React.FC<AnatomicalLayersControlProps> = ({
  activeLayers,
  onToggleLayer,
  onSetAllLayers,
  perspective,
  onTogglePerspective,
  shaderMode,
  onChangeShaderMode,
  className = '',
  variant = 'floating',
}) => {
  const activeCount = Object.values(activeLayers).filter(Boolean).length;
  const allActive = activeCount === 5;

  const handleToggleAll = () => {
    onSetAllLayers?.(!allActive);
  };

  const containerClasses =
    variant === 'floating'
      ? 'backdrop-blur-xl bg-slate-950/85 border border-cyan-500/30 rounded-2xl p-3 shadow-2xl shadow-cyan-950/50'
      : 'backdrop-blur-md bg-slate-900/70 border border-slate-800 rounded-xl p-3';

  return (
    <div
      className={`flex flex-col gap-3 z-30 select-none ${containerClasses} ${className}`}
      data-testid="anatomical-layers-control"
    >
      {/* 1. TOP HEADER / TELEMETRY STATUS STRIP */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-cyan-900/40 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold tracking-wider uppercase">BIO-TWIN SPECTROMETRY</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-[10px]">
          <span>
            LAYERS: <strong className="text-cyan-300 font-bold">{activeCount}/5</strong>
          </span>
          {onSetAllLayers && (
            <button
              onClick={handleToggleAll}
              className="text-[9px] px-1.5 py-0.5 rounded border border-cyan-500/30 hover:border-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title={allActive ? 'Hide all layers' : 'Show all layers'}
            >
              <span className="flex items-center gap-1">
                <CheckSquare className="w-2.5 h-2.5" />
                {allActive ? 'ISOLATE' : 'ALL'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 2. LAYER TOGGLE BUTTONS */}
      <div className="grid grid-cols-5 gap-1.5">
        {LAYERS_CONFIG.map(({ id, label, icon: IconComponent, description }) => {
          const isActive = activeLayers[id as keyof ActiveLayersState];
          return (
            <button
              key={id}
              onClick={() => onToggleLayer(id)}
              title={description}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-300 shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-500 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <IconComponent className="w-4 h-4 mb-1 shrink-0" />
              <span className="text-[10px] font-medium tracking-tight uppercase leading-none">
                {label}
              </span>
              <span
                className={`mt-1 w-1.5 h-1.5 rounded-full ${
                  isActive ? 'bg-cyan-400' : 'bg-slate-700'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* 3. PERSPECTIVE & SHADER MODE CONTROLS */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-cyan-900/30">
        {/* PERSPECTIVE ROTATION SWITCH */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
            PERSPECTIVE
          </span>
          <button
            onClick={onTogglePerspective}
            className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 hover:text-cyan-200 text-xs font-mono transition-all cursor-pointer group"
          >
            <RotateCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
            <span className="font-bold tracking-wider uppercase">
              {perspective}
            </span>
          </button>
        </div>

        {/* SHADER MODE SELECTOR */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
            SHADER MODE
          </span>
          <div className="grid grid-cols-3 gap-1">
            {/* Holographic Mode */}
            <button
              onClick={() => onChangeShaderMode('holographic')}
              title="Cyber Hologram mode"
              className={`flex items-center justify-center py-1.5 rounded border text-[10px] font-mono transition-all cursor-pointer ${
                shaderMode === 'holographic'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/30'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>

            {/* Thermal Heatmap Mode */}
            <button
              onClick={() => onChangeShaderMode('thermal_heatmap')}
              title="Infrared Thermal Heatmap"
              className={`flex items-center justify-center py-1.5 rounded border text-[10px] font-mono transition-all cursor-pointer ${
                shaderMode === 'thermal_heatmap'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm shadow-amber-500/30'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
            </button>

            {/* Radiation Flux Mode */}
            <button
              onClick={() => onChangeShaderMode('radiation_flux')}
              title="SPE / GCR Radiation Flux Hotspots"
              className={`flex items-center justify-center py-1.5 rounded border text-[10px] font-mono transition-all cursor-pointer ${
                shaderMode === 'radiation_flux'
                  ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-300 shadow-sm shadow-fuchsia-500/30'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
