import React from 'react';
import { clsx } from 'clsx';
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
import { useThemeStore } from '../../store/themeStore';
import { getWobblyStyle } from '../sketchbook/sketchbookConstants';

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
  const { mode } = useThemeStore();
  const isPaper = mode === 'paper';
  const isDark = mode === 'dark';
  const isSketch = isPaper || isDark;

  const activeCount = Object.values(activeLayers).filter(Boolean).length;
  const allActive = activeCount === 5;

  const handleToggleAll = () => {
    onSetAllLayers?.(!allActive);
  };

  const containerClasses = isPaper
    ? 'bg-white text-[#2d2d2d] border-[3px] border-[#2d2d2d] sketch-shadow font-sketch-hand p-3.5'
    : isDark
      ? 'bg-[#0c0c10] text-white border-[3px] border-[#FF4D00] sketch-shadow-orange font-sketch-hand p-3.5'
      : variant === 'floating'
        ? 'backdrop-blur-xl bg-slate-950/85 border border-cyan-500/30 rounded-2xl p-3 shadow-2xl shadow-cyan-950/50'
        : 'backdrop-blur-md bg-slate-900/70 border border-slate-800 rounded-xl p-3';

  return (
    <div
      style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
      className={clsx('flex flex-col gap-3 z-30 select-none transition-all', containerClasses, className)}
      data-testid="anatomical-layers-control"
    >
      {/* 1. TOP HEADER / TELEMETRY STATUS STRIP */}
      <div
        className={clsx(
          'flex items-center justify-between gap-3 pb-2 border-b text-[11px]',
          isPaper ? 'border-[#2d2d2d]/25 font-sketch-hand' : isDark ? 'border-[#FF4D00]/30 font-sketch-hand' : 'border-cyan-900/40 font-mono'
        )}
      >
        <div className={clsx('flex items-center gap-1.5 font-bold', isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400')}>
          <span className={clsx('w-2 h-2 rounded-full', isPaper ? 'bg-[#2d5da1]' : isDark ? 'bg-[#FF4D00]' : 'bg-cyan-400 animate-pulse')} />
          <span className="tracking-wider uppercase">BIO-TWIN SPECTROMETRY</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className={isPaper ? 'text-[#2d2d2d]/80' : isDark ? 'text-white/80' : 'text-slate-400'}>
            LAYERS: <strong className={isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-300'}>{activeCount}/5</strong>
          </span>
          {onSetAllLayers && (
            <button
              onClick={handleToggleAll}
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={clsx(
                'text-[9px] px-1.5 py-0.5 border transition-colors cursor-pointer font-bold',
                isPaper
                  ? 'border-[#2d2d2d] bg-[#fdfbf7] text-[#2d2d2d] hover:bg-[#fff9c4]'
                  : isDark
                    ? 'border-[#FF4D00] bg-black text-[#FF4D00] hover:bg-[#FF4D00]/20'
                    : 'rounded border-cyan-500/30 hover:border-cyan-400 hover:text-cyan-300'
              )}
              title={allActive ? 'Hide all layers' : 'Show all layers'}
            >
              <span className="flex items-center gap-1">
                <CheckSquare className="w-2.5 h-2.5" />
                {allActive ? 'ISO' : 'ALL'}
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
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={clsx(
                'flex flex-col items-center justify-center py-2 px-1 border text-center transition-all cursor-pointer select-none',
                isPaper
                  ? isActive
                    ? 'bg-[#2d5da1] text-white border-[#2d2d2d] sketch-btn font-sketch-hand'
                    : 'bg-white text-[#2d2d2d] border-[#2d2d2d] hover:bg-[#fff9c4] font-sketch-hand'
                  : isDark
                    ? isActive
                      ? 'bg-[#FF4D00] text-black border-[#FF4D00] sketch-btn-orange font-sketch-hand'
                      : 'bg-black text-white border-[#FF4D00]/50 hover:border-[#FF4D00] font-sketch-hand'
                    : isActive
                      ? 'rounded-lg bg-cyan-500/15 border-cyan-400/60 text-cyan-300 shadow-sm shadow-cyan-500/20'
                      : 'rounded-lg bg-slate-900/40 border-slate-800/80 text-slate-500 hover:border-slate-700 hover:text-slate-300'
              )}
            >
              <IconComponent className="w-4 h-4 mb-1 shrink-0" />
              <span className="text-[10px] font-bold tracking-tight uppercase leading-none">
                {label}
              </span>
              <span
                className={clsx(
                  'mt-1 w-1.5 h-1.5 rounded-full',
                  isActive
                    ? isPaper ? 'bg-white' : isDark ? 'bg-black' : 'bg-cyan-400'
                    : isPaper ? 'bg-slate-300' : isDark ? 'bg-slate-700' : 'bg-slate-700'
                )}
              />
            </button>
          );
        })}
      </div>

      {/* 3. PERSPECTIVE & SHADER MODE CONTROLS */}
      <div
        className={clsx(
          'grid grid-cols-2 gap-2 pt-1 border-t',
          isPaper ? 'border-[#2d2d2d]/25' : isDark ? 'border-[#FF4D00]/30' : 'border-cyan-900/30'
        )}
      >
        {/* PERSPECTIVE ROTATION SWITCH */}
        <div className="flex flex-col gap-1">
          <span
            className={clsx(
              'text-[9px] uppercase tracking-wider font-bold',
              isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'text-slate-400 font-mono'
            )}
          >
            PERSPECTIVE
          </span>
          <button
            onClick={onTogglePerspective}
            style={isSketch ? getWobblyStyle('wobblySm') : undefined}
            className={clsx(
              'flex items-center justify-center gap-2 py-1.5 px-3 border text-xs transition-all cursor-pointer group select-none font-bold',
              isPaper
                ? 'border-2 border-[#2d2d2d] bg-white text-[#2d2d2d] hover:bg-[#fff9c4] sketch-btn font-sketch-hand'
                : isDark
                  ? 'border-2 border-[#FF4D00] bg-black text-white hover:bg-[#FF4D00]/20 sketch-btn-orange font-sketch-hand'
                  : 'rounded-lg border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 font-mono'
            )}
          >
            <RotateCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
            <span className="tracking-wider uppercase">
              {perspective}
            </span>
          </button>
        </div>

        {/* SHADER MODE SELECTOR */}
        <div className="flex flex-col gap-1">
          <span
            className={clsx(
              'text-[9px] uppercase tracking-wider font-bold',
              isPaper ? 'text-[#2d2d2d]/70' : isDark ? 'text-white/70' : 'text-slate-400 font-mono'
            )}
          >
            SHADER MODE
          </span>
          <div className="grid grid-cols-3 gap-1">
            {/* Holographic Mode */}
            <button
              onClick={() => onChangeShaderMode('holographic')}
              title="Cyber Hologram / Blueprint mode"
              className={clsx(
                'flex items-center justify-center py-1.5 rounded border text-[10px] transition-all cursor-pointer',
                shaderMode === 'holographic'
                  ? isPaper
                    ? 'bg-[#fff9c4] text-[#2d5da1] border-[#2d2d2d] font-bold'
                    : isDark
                      ? 'bg-[#FF4D00] text-black border-[#FF4D00] font-bold'
                      : 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/30'
                  : isPaper
                    ? 'bg-white border-[#2d2d2d]/60 text-[#2d2d2d]/70 hover:text-[#2d2d2d]'
                    : isDark
                      ? 'bg-black border-[#FF4D00]/40 text-white/70 hover:text-white'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>

            {/* Thermal Heatmap Mode */}
            <button
              onClick={() => onChangeShaderMode('thermal_heatmap')}
              title="Infrared Thermal Heatmap"
              className={clsx(
                'flex items-center justify-center py-1.5 rounded border text-[10px] transition-all cursor-pointer',
                shaderMode === 'thermal_heatmap'
                  ? isPaper
                    ? 'bg-amber-100 text-amber-900 border-[#2d2d2d] font-bold'
                    : isDark
                      ? 'bg-amber-400 text-black border-amber-400 font-bold'
                      : 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm shadow-amber-500/30'
                  : isPaper
                    ? 'bg-white border-[#2d2d2d]/60 text-[#2d2d2d]/70 hover:text-[#2d2d2d]'
                    : isDark
                      ? 'bg-black border-[#FF4D00]/40 text-white/70 hover:text-white'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              )}
            >
              <Flame className="w-3.5 h-3.5" />
            </button>

            {/* Radiation Flux Mode */}
            <button
              onClick={() => onChangeShaderMode('radiation_flux')}
              title="SPE / GCR Radiation Flux Hotspots"
              className={clsx(
                'flex items-center justify-center py-1.5 rounded border text-[10px] transition-all cursor-pointer',
                shaderMode === 'radiation_flux'
                  ? isPaper
                    ? 'bg-purple-100 text-purple-900 border-[#2d2d2d] font-bold'
                    : isDark
                      ? 'bg-fuchsia-400 text-black border-fuchsia-400 font-bold'
                      : 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-300 shadow-sm shadow-fuchsia-500/30'
                  : isPaper
                    ? 'bg-white border-[#2d2d2d]/60 text-[#2d2d2d]/70 hover:text-[#2d2d2d]'
                    : isDark
                      ? 'bg-black border-[#FF4D00]/40 text-white/70 hover:text-white'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              )}
            >
              <Radio className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnatomicalLayersControl;
