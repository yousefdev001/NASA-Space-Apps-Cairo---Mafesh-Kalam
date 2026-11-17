import React, { useState, useId } from 'react';
import {
  OrganId,
  OrganDiagnosticData,
  AnatomicalLayer,
  ViewPerspective,
  ShaderMode,
  ActiveLayersState,
  OrganStatus,
} from '../../types/biotwin.types';

export interface HolographicBodyModelProps {
  selectedOrganId?: OrganId | string | null;
  onSelectOrgan?: (organId: OrganId) => void;
  organsData?: OrganDiagnosticData[] | Record<string, OrganDiagnosticData>;
  heartRate?: number; // Beats Per Minute
  perspective?: ViewPerspective; // 'anterior' | 'posterior'
  shaderMode?: ShaderMode; // 'holographic' | 'thermal_heatmap' | 'radiation_flux'
  activeLayers?: ActiveLayersState;
  showPointers?: boolean;
  className?: string;
  onHoverOrgan?: (organId: OrganId | null) => void;
}

interface OrganAnchor {
  id: OrganId;
  name: string;
  system: string;
  anterior: { x: number; y: number };
  posterior: { x: number; y: number };
  layer: AnatomicalLayer;
}

const ORGAN_ANCHORS: Record<OrganId, OrganAnchor> = {
  brain: {
    id: 'brain',
    name: 'Cerebral Cortex & Stem',
    system: 'Central Nervous',
    anterior: { x: 250, y: 64 },
    posterior: { x: 250, y: 64 },
    layer: 'neural',
  },
  eyes: {
    id: 'eyes',
    name: 'Ocular & Optic Sheath (SANS)',
    system: 'Neuro-Ophthalmic',
    anterior: { x: 250, y: 74 },
    posterior: { x: 250, y: 74 },
    layer: 'neural',
  },
  carotid_jugular: {
    id: 'carotid_jugular',
    name: 'Carotid & Jugular Venous Axis',
    system: 'Vascular / Hemodynamics',
    anterior: { x: 250, y: 126 },
    posterior: { x: 250, y: 126 },
    layer: 'vascular',
  },
  heart: {
    id: 'heart',
    name: 'Myocardium & Aortic Root',
    system: 'Cardiovascular',
    anterior: { x: 268, y: 195 },
    posterior: { x: 264, y: 198 },
    layer: 'visceral',
  },
  lungs: {
    id: 'lungs',
    name: 'Pulmonary Lobes & Gas Exchange',
    system: 'Respiratory',
    anterior: { x: 220, y: 198 },
    posterior: { x: 220, y: 198 },
    layer: 'visceral',
  },
  liver: {
    id: 'liver',
    name: 'Hepatic Parenchyma',
    system: 'Metabolic / Hepatic',
    anterior: { x: 224, y: 252 },
    posterior: { x: 224, y: 254 },
    layer: 'visceral',
  },
  kidneys: {
    id: 'kidneys',
    name: 'Renal Cortex & Medulla',
    system: 'Renal / Fluid Balance',
    anterior: { x: 278, y: 280 },
    posterior: { x: 278, y: 280 },
    layer: 'visceral',
  },
  gastrointestinal: {
    id: 'gastrointestinal',
    name: 'Gastrointestinal Track & Motility',
    system: 'Digestive / Microbiome',
    anterior: { x: 250, y: 326 },
    posterior: { x: 250, y: 326 },
    layer: 'visceral',
  },
  spine: {
    id: 'spine',
    name: 'Spinal Column & Microgravity Elongation',
    system: 'Skeletal / Axial',
    anterior: { x: 250, y: 242 },
    posterior: { x: 250, y: 242 },
    layer: 'skeletal',
  },
  muscular_core: {
    id: 'muscular_core',
    name: 'Abdominal Wall & Trunk Stabilizers',
    system: 'Musculoskeletal',
    anterior: { x: 250, y: 295 },
    posterior: { x: 250, y: 295 },
    layer: 'muscular',
  },
  upper_limbs: {
    id: 'upper_limbs',
    name: 'Brachial & Upper Extremities',
    system: 'Musculoskeletal / Neurovascular',
    anterior: { x: 154, y: 270 },
    posterior: { x: 154, y: 270 },
    layer: 'muscular',
  },
  lower_limbs: {
    id: 'lower_limbs',
    name: 'Femoral & Lower Extremities',
    system: 'Musculoskeletal / Venous Pooling',
    anterior: { x: 216, y: 560 },
    posterior: { x: 216, y: 560 },
    layer: 'muscular',
  },
};

export const HolographicBodyModel: React.FC<HolographicBodyModelProps> = ({
  selectedOrganId,
  onSelectOrgan,
  organsData,
  heartRate = 72,
  perspective = 'anterior',
  shaderMode = 'holographic',
  activeLayers = {
    visceral: true,
    neural: true,
    vascular: true,
    muscular: true,
    skeletal: true,
  },
  className = '',
  onHoverOrgan,
}) => {
  const [hoveredOrgan, setHoveredOrgan] = useState<OrganId | null>(null);
  const idPrefix = useId().replace(/:/g, '');

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

  const handleMouseEnter = (organId: OrganId) => {
    setHoveredOrgan(organId);
    onHoverOrgan?.(organId);
  };

  const handleMouseLeave = () => {
    setHoveredOrgan(null);
    onHoverOrgan?.(null);
  };

  const handleSelect = (organId: OrganId) => {
    onSelectOrgan?.(organId);
  };

  // Status colors based on shader mode
  const getStatusColor = (status: OrganStatus): string => {
    if (shaderMode === 'radiation_flux') {
      if (status === 'critical') return '#EF4444';
      if (status === 'warning') return '#F59E0B';
      return '#E879F9'; // bright cosmic magenta
    }
    if (shaderMode === 'thermal_heatmap') {
      if (status === 'critical') return '#FF1744';
      if (status === 'warning') return '#FF9100';
      return '#00E5FF';
    }
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

  const heartPulsePeriod = `${(60 / Math.max(30, heartRate)).toFixed(2)}s`;

  // Reticle positioning for selected organ
  const activeAnchor = selectedOrganId && ORGAN_ANCHORS[selectedOrganId as OrganId]
    ? ORGAN_ANCHORS[selectedOrganId as OrganId][perspective]
    : null;
  const activeOrganStatus = selectedOrganId ? getOrganStatus(selectedOrganId) : 'nominal';
  const activeOrganColor = getStatusColor(activeOrganStatus);

  // Silhouette path anterior
  const anteriorSilhouette = `
    M 250,40
    C 272,40 276,58 276,72
    C 276,88 270,105 266,114
    C 268,124 270,138 270,144
    C 288,148 316,154 330,164
    C 344,174 348,194 344,216
    C 342,238 348,272 352,298
    C 354,310 358,354 362,410
    C 364,424 366,432 368,446
    C 370,458 368,474 364,486
    C 360,490 354,484 352,470
    C 350,454 352,434 352,422
    C 350,380 344,324 338,300
    C 330,270 326,242 320,222
    C 316,242 312,274 308,310
    C 304,338 310,364 314,386
    C 318,406 318,422 316,436
    C 314,480 306,536 298,580
    C 294,600 306,634 304,670
    C 302,704 294,742 292,776
    C 292,796 296,824 294,842
    C 288,844 274,844 274,834
    C 274,812 276,786 274,774
    C 270,730 264,680 262,636
    C 260,598 266,580 268,574
    C 264,528 260,480 256,442
    C 254,438 250,438 248,438
    C 244,480 240,528 236,574
    C 238,580 244,598 242,636
    C 240,680 234,730 230,774
    C 228,786 230,812 230,834
    C 230,844 216,844 210,842
    C 208,824 212,796 212,776
    C 210,742 202,704 200,670
    C 198,634 210,600 206,580
    C 198,536 190,480 188,436
    C 186,422 186,406 190,386
    C 194,364 200,338 196,310
    C 192,274 188,242 184,222
    C 178,242 174,270 166,300
    C 160,324 154,380 152,422
    C 152,434 154,454 152,470
    C 150,484 144,490 140,486
    C 136,474 134,458 136,446
    C 138,432 140,424 142,410
    C 146,354 150,310 152,298
    C 156,272 162,238 160,216
    C 156,194 160,174 174,164
    C 188,154 216,148 234,144
    C 234,138 236,124 238,114
    C 234,105 228,88 228,72
    C 228,58 232,40 250,40
    Z
  `;

  // Silhouette path posterior
  const posteriorSilhouette = anteriorSilhouette; // Identical external contours, distinct dorsal musculature

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
      data-testid="holographic-body-model"
    >
      {/* SVG Inline Animations */}
      <style>{`
        @keyframes biotwin-heartbeat {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 3px rgba(0, 229, 255, 0.4)); }
          15% { transform: scale(1.12); filter: drop-shadow(0 0 12px rgba(0, 229, 255, 0.95)); }
          30% { transform: scale(1.02); filter: drop-shadow(0 0 5px rgba(0, 229, 255, 0.5)); }
          45% { transform: scale(1.09); filter: drop-shadow(0 0 9px rgba(0, 229, 255, 0.8)); }
          65% { transform: scale(1); filter: drop-shadow(0 0 3px rgba(0, 229, 255, 0.4)); }
        }

        @keyframes biotwin-reticle-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes biotwin-flux-scan {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 40; }
        }

        @keyframes biotwin-warning-pulse {
          0%, 100% { opacity: 0.9; filter: drop-shadow(0 0 3px #F59E0B); }
          50% { opacity: 0.4; filter: drop-shadow(0 0 10px #F59E0B); }
        }

        @keyframes biotwin-critical-pulse {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 5px #EF4444); }
          50% { opacity: 0.35; filter: drop-shadow(0 0 14px #EF4444); }
        }
      `}</style>

      {/* Main Vector Canvas */}
      <svg
        viewBox="0 0 500 890"
        className="h-full w-auto max-h-[580px] max-w-full drop-shadow-2xl overflow-visible mx-auto block"
        preserveAspectRatio="xMidYMid meet"
        style={{
          filter: shaderMode === 'holographic' ? 'drop-shadow(0 0 18px rgba(0, 229, 255, 0.25))' : undefined,
        }}
        aria-label={`Humanoid Bio-Twin (${perspective} view)`}
      >
        <defs>
          {/* Cybernetic Glow Filters */}
          <filter id={`${idPrefix}-holo-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="7" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={`${idPrefix}-active-reticle`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={`${idPrefix}-organ-highlight`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4.5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Shading Gradients */}
          <linearGradient id={`${idPrefix}-holo-body-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.22" />
            <stop offset="25%" stopColor="#0284C7" stopOpacity="0.16" />
            <stop offset="60%" stopColor="#0369A1" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.18" />
          </linearGradient>

          <linearGradient id={`${idPrefix}-thermal-body-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF5722" stopOpacity="0.4" />
            <stop offset="18%" stopColor="#FF1744" stopOpacity="0.55" />
            <stop offset="38%" stopColor="#FF9100" stopOpacity="0.38" />
            <stop offset="65%" stopColor="#10B981" stopOpacity="0.22" />
            <stop offset="85%" stopColor="#0284C7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0.35" />
          </linearGradient>

          <linearGradient id={`${idPrefix}-radiation-body-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E879F9" stopOpacity="0.45" />
            <stop offset="15%" stopColor="#C084FC" stopOpacity="0.4" />
            <stop offset="30%" stopColor="#F43F5E" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#A855F7" stopOpacity="0.35" />
            <stop offset="75%" stopColor="#38BDF8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.25" />
          </linearGradient>

          {/* Radial Organ Glows */}
          <radialGradient id={`${idPrefix}-heart-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#0284C7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0369A1" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={`${idPrefix}-brain-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.75" />
            <stop offset="70%" stopColor="#0284C7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
          </radialGradient>

          {/* Hologram Scanlines Pattern */}
          <pattern id={`${idPrefix}-scanlines`} width="100" height="4" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="100" y2="0" stroke="rgba(0, 229, 255, 0.12)" strokeWidth="0.8" />
          </pattern>

          {/* Cyber Coordinate Grid */}
          <pattern id={`${idPrefix}-cyber-grid`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(0, 229, 255, 0.05)" strokeWidth="0.6" />
          </pattern>
        </defs>

        {/* 1. BACKGROUND HUD CALIBRATION RULERS & MATRIX */}
        <g opacity="0.35">
          <rect x="30" y="30" width="440" height="830" fill={`url(#${idPrefix}-cyber-grid)`} />
          {/* Height elevation ticks */}
          {[100, 200, 300, 400, 500, 600, 700, 800].map((y) => (
            <g key={y}>
              <line x1="28" y1={y} x2="38" y2={y} stroke="#00E5FF" strokeWidth="0.75" />
              <line x1="462" y1={y} x2="472" y2={y} stroke="#00E5FF" strokeWidth="0.75" />
              <text x="12" y={y + 3} fill="#00E5FF" fontSize="7" fontFamily="monospace" opacity="0.7">
                {890 - y}
              </text>
            </g>
          ))}
          {/* Centerline vertical coordinate */}
          <line x1="250" y1="25" x2="250" y2="865" stroke="#00E5FF" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.4" />
        </g>

        {/* 2. RADIATION FLUX FIELD / HOTSPOTS (When shaderMode === 'radiation_flux') */}
        {shaderMode === 'radiation_flux' && (
          <g className="radiation-flux-layer pointer-events-none">
            {/* Cosmic Wave Rings around Cranium */}
            <circle
              cx="250"
              cy="64"
              r="48"
              fill="none"
              stroke="#E879F9"
              strokeWidth="1.2"
              strokeDasharray="4 6"
              opacity="0.6"
              style={{ animation: 'biotwin-flux-scan 3s linear infinite' }}
            />
            <circle
              cx="250"
              cy="64"
              r="62"
              fill="none"
              stroke="#F43F5E"
              strokeWidth="0.8"
              strokeDasharray="6 8"
              opacity="0.4"
            />
            {/* Thoracic / Sternum Marrow Radiation Hotspot */}
            <ellipse
              cx="250"
              cy="210"
              rx="40"
              ry="26"
              fill="#F43F5E"
              fillOpacity="0.25"
              filter={`url(#${idPrefix}-holo-glow)`}
            />
            {/* Pelvic Marrow Radiation Hotspot */}
            <ellipse
              cx="250"
              cy="380"
              rx="46"
              ry="20"
              fill="#D946EF"
              fillOpacity="0.2"
              filter={`url(#${idPrefix}-holo-glow)`}
            />
          </g>
        )}

        {/* 3. TRANSLUCENT BODY SILHOUETTE (Cyber Glass Contour) */}
        <g id="body-silhouette-group">
          {/* Body Fill */}
          <path
            d={perspective === 'anterior' ? anteriorSilhouette : posteriorSilhouette}
            fill={
              shaderMode === 'thermal_heatmap'
                ? `url(#${idPrefix}-thermal-body-grad)`
                : shaderMode === 'radiation_flux'
                ? `url(#${idPrefix}-radiation-body-grad)`
                : `url(#${idPrefix}-holo-body-grad)`
            }
            stroke={
              shaderMode === 'thermal_heatmap'
                ? '#FF5722'
                : shaderMode === 'radiation_flux'
                ? '#E879F9'
                : '#00E5FF'
            }
            strokeWidth="1.8"
            strokeOpacity="0.75"
            filter={shaderMode === 'holographic' ? `url(#${idPrefix}-holo-glow)` : undefined}
          />
          {/* Hologram Scanlines Overlay */}
          <path
            d={perspective === 'anterior' ? anteriorSilhouette : posteriorSilhouette}
            fill={`url(#${idPrefix}-scanlines)`}
            pointerEvents="none"
            opacity="0.6"
          />
        </g>

        {/* 4. SKELETAL LAYER */}
        {activeLayers.skeletal && (
          <g id="skeletal-layer" stroke="#00E5FF" strokeOpacity="0.38" fill="none" pointerEvents="none">
            {/* Cranium & Jaw Outline */}
            <path
              d="M 234,54 C 234,44 266,44 266,54 C 266,66 260,82 250,84 C 240,82 234,66 234,54 Z"
              strokeWidth="0.9"
            />
            {/* Clavicles */}
            <path
              d="M 250,144 C 228,142 200,148 178,160 M 250,144 C 272,142 300,148 322,160"
              strokeWidth="1.4"
            />
            {/* Sternum (Anterior) */}
            {perspective === 'anterior' && (
              <path d="M 250,144 L 250,224" strokeWidth="2" strokeDasharray="3 2" />
            )}
            {/* Scapulae (Posterior) */}
            {perspective === 'posterior' && (
              <g strokeWidth="1.2" strokeOpacity="0.5">
                <path d="M 224,166 C 204,170 196,198 214,214 C 222,204 224,180 224,166 Z" />
                <path d="M 276,166 C 296,170 304,198 286,214 C 278,204 276,180 276,166 Z" />
              </g>
            )}
            {/* Thoracic Ribcage (Rib Arcs) */}
            {[164, 178, 192, 206, 220, 234].map((ry, idx) => (
              <g key={ry}>
                <path
                  d={`M 248,${ry} C ${224 - idx * 2},${ry - 4} ${202 + idx * 2},${ry + 10} ${190 + idx * 3},${ry + 16}`}
                  strokeWidth="0.9"
                />
                <path
                  d={`M 252,${ry} C ${276 + idx * 2},${ry - 4} ${298 - idx * 2},${ry + 10} ${310 - idx * 3},${ry + 16}`}
                  strokeWidth="0.9"
                />
              </g>
            ))}
            {/* Vertebral Spinal Column (Vertebrae blocks) */}
            {[116, 126, 136, 146, 158, 170, 182, 194, 208, 222, 236, 250, 264, 280, 296, 312, 330, 348, 366].map(
              (vy) => (
                <rect
                  key={vy}
                  x="246"
                  y={vy}
                  width="8"
                  height="7"
                  rx="1.5"
                  strokeWidth="0.8"
                  fill="rgba(0, 229, 255, 0.08)"
                />
              )
            )}
            {/* Pelvic Girdle & Iliac Crests */}
            <path
              d="M 210,344 C 200,352 192,374 206,396 C 220,412 244,414 250,404 C 256,414 280,412 294,396 C 308,374 300,352 290,344"
              strokeWidth="1.2"
            />
            {/* Femurs / Upper Leg Bones */}
            <path d="M 214,420 L 218,574 M 286,420 L 282,574" strokeWidth="1.5" strokeDasharray="5 3" />
            {/* Patella / Kneecaps */}
            <circle cx="218" cy="578" r="5" strokeWidth="1" />
            <circle cx="282" cy="578" r="5" strokeWidth="1" />
            {/* Tibia & Fibula / Lower Leg Bones */}
            <path d="M 218,586 L 220,768 M 282,586 L 280,768" strokeWidth="1.3" strokeDasharray="6 3" />
            {/* Humerus & Forearm Bones */}
            <path d="M 166,192 L 158,294 M 158,306 L 144,412" strokeWidth="1.1" strokeDasharray="4 2" />
            <path d="M 334,192 L 342,294 M 342,306 L 356,412" strokeWidth="1.1" strokeDasharray="4 2" />
          </g>
        )}

        {/* 5. MUSCULAR LAYER (Realistic Contours & Striations matching reference photo) */}
        {activeLayers.muscular && (
          <g
            id="muscular-layer"
            stroke={shaderMode === 'thermal_heatmap' ? '#FF9100' : '#00E5FF'}
            strokeOpacity="0.45"
            fill="none"
            pointerEvents="none"
          >
            {perspective === 'anterior' ? (
              <>
                {/* Pectoralis Major (Left & Right Muscle Striations) */}
                <path
                  d="M 248,154 C 228,154 200,166 182,192 C 196,212 226,214 248,212 Z"
                  strokeWidth="1.3"
                  fill="rgba(0, 229, 255, 0.05)"
                />
                <path
                  d="M 252,154 C 272,154 300,166 318,192 C 304,212 274,214 252,212 Z"
                  strokeWidth="1.3"
                  fill="rgba(0, 229, 255, 0.05)"
                />
                {/* Pectoral fiber striations */}
                <path d="M 246,168 C 224,168 206,178 190,194 M 246,182 C 228,184 212,194 200,206" strokeWidth="0.7" />
                <path d="M 254,168 C 276,168 294,178 310,194 M 254,182 C 272,184 288,194 300,206" strokeWidth="0.7" />

                {/* Rectus Abdominis (Six-Pack Contours) */}
                {/* Linea Alba center furrow */}
                <line x1="250" y1="216" x2="250" y2="390" strokeWidth="1.5" strokeOpacity="0.7" />
                {/* Paired abdominal blocks */}
                {[
                  { y: 224, h: 32 },
                  { y: 262, h: 32 },
                  { y: 300, h: 34 },
                  { y: 340, h: 36 },
                ].map(({ y, h }, i) => (
                  <g key={i}>
                    {/* Left block */}
                    <rect
                      x="230"
                      y={y}
                      width="17"
                      height={h}
                      rx="4"
                      strokeWidth="1"
                      fill="rgba(0, 229, 255, 0.04)"
                    />
                    {/* Right block */}
                    <rect
                      x="253"
                      y={y}
                      width="17"
                      height={h}
                      rx="4"
                      strokeWidth="1"
                      fill="rgba(0, 229, 255, 0.04)"
                    />
                  </g>
                ))}
                {/* External Obliques / Flank musculature */}
                <path d="M 198,244 C 206,264 214,290 224,312 M 194,272 C 204,294 214,320 220,344" strokeWidth="0.8" />
                <path d="M 302,244 C 294,264 286,290 276,312 M 306,272 C 296,294 286,320 280,344" strokeWidth="0.8" />

                {/* Deltoids & Biceps (Arms) */}
                <path d="M 174,166 C 158,180 156,204 162,224" strokeWidth="1.2" />
                <path d="M 326,166 C 342,180 344,204 338,224" strokeWidth="1.2" />
                <path d="M 166,226 C 160,250 160,274 166,292" strokeWidth="1" />
                <path d="M 334,226 C 340,250 340,274 334,292" strokeWidth="1" />
                {/* Forearm Brachioradialis */}
                <path d="M 156,306 C 148,340 144,380 144,410" strokeWidth="0.9" />
                <path d="M 344,306 C 352,340 356,380 356,410" strokeWidth="0.9" />

                {/* Quadriceps Femoris (Thighs) */}
                {/* Rectus femoris central bellies */}
                <path d="M 214,432 C 208,468 206,512 216,558" strokeWidth="1.2" />
                <path d="M 286,432 C 292,468 294,512 284,558" strokeWidth="1.2" />
                {/* Vastus medialis teardrop (medial knee) */}
                <path d="M 226,526 C 234,544 232,562 224,572" strokeWidth="1.2" />
                <path d="M 274,526 C 266,544 268,562 276,572" strokeWidth="1.2" />
                {/* Vastus lateralis (lateral thigh) */}
                <path d="M 194,446 C 190,490 196,536 208,568" strokeWidth="1" />
                <path d="M 306,446 C 310,490 304,536 292,568" strokeWidth="1" />

                {/* Calves / Tibialis Anterior */}
                <path d="M 214,598 C 202,624 200,664 212,714" strokeWidth="1" />
                <path d="M 286,598 C 298,624 300,664 288,714" strokeWidth="1" />
              </>
            ) : (
              <>
                {/* Posterior Musculature: Trapezius & Lats */}
                {/* Trapezius Kite / Diamond */}
                <path
                  d="M 250,114 L 202,156 L 250,230 L 298,156 Z"
                  strokeWidth="1.4"
                  fill="rgba(0, 229, 255, 0.05)"
                />
                {/* Latissimus Dorsi Sweeps */}
                <path d="M 248,234 C 220,240 192,260 186,286" strokeWidth="1.2" />
                <path d="M 252,234 C 280,240 308,260 314,286" strokeWidth="1.2" />
                {/* Erector Spinae vertical columns */}
                <path d="M 242,146 L 242,360 M 258,146 L 258,360" strokeWidth="1.3" />
                {/* Gluteus Maximus (Posterior) */}
                <path
                  d="M 204,364 C 192,390 198,432 248,434 C 248,390 238,368 204,364 Z"
                  strokeWidth="1.3"
                  fill="rgba(0, 229, 255, 0.06)"
                />
                <path
                  d="M 296,364 C 308,390 302,432 252,434 C 252,390 262,368 296,364 Z"
                  strokeWidth="1.3"
                  fill="rgba(0, 229, 255, 0.06)"
                />
                {/* Hamstrings (Posterior Thigh) */}
                <path d="M 216,442 C 210,480 210,524 216,564" strokeWidth="1.2" />
                <path d="M 284,442 C 290,480 290,524 284,564" strokeWidth="1.2" />
                {/* Gastrocnemius (Two calf heads + Achilles tendon) */}
                <path d="M 208,600 C 198,628 200,668 214,700 M 224,600 C 234,628 232,668 220,700" strokeWidth="1" />
                <path d="M 292,600 C 302,628 300,668 286,700 M 276,600 C 266,628 268,668 280,700" strokeWidth="1" />
                {/* Achilles Tendon */}
                <line x1="218" y1="704" x2="218" y2="768" strokeWidth="1.5" />
                <line x1="282" y1="704" x2="282" y2="768" strokeWidth="1.5" />
              </>
            )}
          </g>
        )}

        {/* 6. NEURAL LAYER (Brain, Spinal Cord, Brachial & Sciatic Nerve Filaments) */}
        {activeLayers.neural && (
          <g id="neural-layer" stroke="#38BDF8" strokeOpacity="0.65" fill="none" pointerEvents="none">
            {/* Brain neural network arborization */}
            <path
              d="M 242,52 C 238,58 244,66 248,70 M 258,52 C 262,58 256,66 252,70"
              strokeWidth="1.2"
              filter={`url(#${idPrefix}-holo-glow)`}
            />
            {/* Central Spinal Cord descending */}
            <path
              d="M 250,72 L 250,378"
              stroke="#00E5FF"
              strokeWidth="1.8"
              filter={`url(#${idPrefix}-holo-glow)`}
            />
            {/* Brachial Plexus into Arms */}
            <path
              d="M 250,136 C 220,146 182,180 164,220 C 154,244 148,310 144,410"
              strokeWidth="0.9"
              strokeDasharray="4 2"
            />
            <path
              d="M 250,136 C 280,146 318,180 336,220 C 346,244 352,310 356,410"
              strokeWidth="0.9"
              strokeDasharray="4 2"
            />
            {/* Lumbosacral Plexus / Sciatic Nerves into Legs */}
            <path
              d="M 250,356 C 236,378 220,430 218,530 C 216,590 220,670 222,764"
              strokeWidth="0.9"
              strokeDasharray="5 2.5"
            />
            <path
              d="M 250,356 C 264,378 280,430 282,530 C 284,590 280,670 278,764"
              strokeWidth="0.9"
              strokeDasharray="5 2.5"
            />
            {/* Synaptic Nerve nodes */}
            {[
              { x: 250, y: 64 },
              { x: 240, y: 74 },
              { x: 260, y: 74 },
              { x: 194, y: 168 },
              { x: 306, y: 168 },
              { x: 236, y: 396 },
              { x: 264, y: 396 },
            ].map((node, i) => (
              <circle key={i} cx={node.x} cy={node.y} r="2" fill="#38BDF8" opacity="0.8" />
            ))}
          </g>
        )}

        {/* 7. VASCULAR LAYER (Carotids, Jugulars, Aorta, Vena Cava, Femoral Axis) */}
        {activeLayers.vascular && (
          <g id="vascular-layer" pointerEvents="none">
            {/* Carotid Arteries (Red/Cyan pulsed path) */}
            <path
              d="M 245,142 L 243,108 M 255,142 L 257,108"
              stroke="#EF4444"
              strokeWidth="1.6"
              strokeOpacity="0.75"
            />
            {/* Jugular Veins */}
            <path
              d="M 240,142 L 238,110 M 260,142 L 262,110"
              stroke="#00E5FF"
              strokeWidth="1.4"
              strokeOpacity="0.75"
            />
            {/* Aortic Arch & Descending Aorta */}
            <path
              d="M 264,188 C 264,174 250,172 250,188 L 250,344"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2.2"
              strokeOpacity="0.75"
            />
            {/* Inferior Vena Cava */}
            <path
              d="M 256,198 L 256,344"
              fill="none"
              stroke="#0284C7"
              strokeWidth="2.2"
              strokeOpacity="0.7"
            />
            {/* Iliac & Femoral Arteries */}
            <path
              d="M 250,344 C 238,368 226,410 224,530 C 222,590 224,670 224,764"
              fill="none"
              stroke="#EF4444"
              strokeWidth="1.4"
              strokeOpacity="0.7"
            />
            <path
              d="M 250,344 C 262,368 274,410 276,530 C 278,590 276,670 276,764"
              fill="none"
              stroke="#EF4444"
              strokeWidth="1.4"
              strokeOpacity="0.7"
            />
          </g>
        )}

        {/* 8. VISCERAL ORGANS LAYER (Heart, Lungs, Liver, Kidneys, GI) */}
        {activeLayers.visceral && (
          <g id="visceral-layer" pointerEvents="none">
            {/* Lungs (Bilateral Pulmonary Lobes) */}
            <g id="lungs-vector" opacity="0.6">
              {/* Right lung (viewer left) */}
              <path
                d="M 244,160 C 232,156 210,166 204,186 C 198,206 202,230 216,242 C 234,244 244,236 244,222 Z"
                fill="rgba(0, 229, 255, 0.12)"
                stroke="#00E5FF"
                strokeWidth="1"
              />
              {/* Left lung with cardiac notch (viewer right) */}
              <path
                d="M 256,160 C 268,156 290,166 296,186 C 302,206 298,230 284,242 C 274,244 268,234 266,218 C 264,204 256,192 256,176 Z"
                fill="rgba(0, 229, 255, 0.12)"
                stroke="#00E5FF"
                strokeWidth="1"
              />
            </g>

            {/* Liver (Right Hypochondrium / Viewer Left) */}
            <g id="liver-vector" opacity="0.75">
              <path
                d="M 204,234 C 220,230 244,232 250,244 C 250,264 238,272 214,272 C 202,270 200,250 204,234 Z"
                fill="rgba(245, 158, 11, 0.18)"
                stroke="#F59E0B"
                strokeWidth="1"
              />
            </g>

            {/* Kidneys (Bilateral retroperitoneal beans) */}
            <g id="kidneys-vector" opacity="0.75">
              <ellipse
                cx="224"
                cy="282"
                rx="8"
                ry="13"
                fill="rgba(16, 185, 129, 0.2)"
                stroke="#10B981"
                strokeWidth="1"
              />
              <ellipse
                cx="276"
                cy="280"
                rx="8"
                ry="13"
                fill="rgba(16, 185, 129, 0.2)"
                stroke="#10B981"
                strokeWidth="1"
              />
            </g>

            {/* Gastrointestinal Track (Stomach + Intestinal Loops) */}
            <g id="gi-vector" opacity="0.65">
              {/* Stomach */}
              <path
                d="M 252,240 C 266,236 278,244 274,260 C 270,270 256,270 250,264 Z"
                fill="rgba(0, 229, 255, 0.15)"
                stroke="#00E5FF"
                strokeWidth="0.9"
              />
              {/* Small intestine looping track */}
              <path
                d="M 238,290 C 250,286 262,294 256,304 C 248,312 236,316 244,328 C 252,336 264,332 260,344 C 254,354 242,352 248,360"
                fill="none"
                stroke="#00E5FF"
                strokeWidth="1.6"
                strokeDasharray="2 3"
              />
            </g>

            {/* HEART (Dynamic Biomechanical Pulse Synced to bpm) */}
            <g
              id="heart-vector"
              style={{
                transformOrigin: '268px 195px',
                animation: `biotwin-heartbeat ${heartPulsePeriod} infinite ease-in-out`,
              }}
            >
              {/* Radial cardiac glow aura */}
              <circle
                cx="268"
                cy="195"
                r="18"
                fill={`url(#${idPrefix}-heart-glow)`}
                opacity="0.8"
              />
              {/* Cardiac silhouette */}
              <path
                d="M 268,184 C 260,180 254,190 260,200 C 266,210 268,214 268,214 C 268,214 270,210 276,200 C 282,190 276,180 268,184 Z"
                fill="rgba(0, 229, 255, 0.35)"
                stroke={getStatusColor(getOrganStatus('heart'))}
                strokeWidth="1.6"
                filter={`url(#${idPrefix}-holo-glow)`}
              />
            </g>
          </g>
        )}

        {/* 9. DISCRETE CLICKABLE ORGAN INTERACTIVE HITBOX ZONES (12 Zones) */}
        <g id="interactive-organ-zones">
          {Object.entries(ORGAN_ANCHORS).map(([key, organ]) => {
            const organId = key as OrganId;
            const status = getOrganStatus(organId);
            const isSelected = selectedOrganId === organId;
            const isHovered = hoveredOrgan === organId;
            const organColor = getStatusColor(status);
            const anchor = organ[perspective];

            // Render custom interactive zone hitboxes
            return (
              <g
                key={organId}
                id={`zone-${organId}`}
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleSelect(organId)}
                onMouseEnter={() => handleMouseEnter(organId)}
                onMouseLeave={handleMouseLeave}
                role="button"
                tabIndex={0}
                aria-label={`Inspect ${organ.name}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(organId);
                  }
                }}
              >
                {/* Organ Hitbox Shape / Interactive Halo */}
                {organId === 'brain' && (
                  <ellipse
                    cx={anchor.x}
                    cy={anchor.y}
                    rx="26"
                    ry="24"
                    fill={isHovered || isSelected ? organColor : 'transparent'}
                    fillOpacity={isSelected ? 0.35 : isHovered ? 0.2 : 0}
                    stroke={isHovered || isSelected ? organColor : 'transparent'}
                    strokeWidth={isSelected ? 2 : 1.2}
                    filter={isSelected || isHovered ? `url(#${idPrefix}-organ-highlight)` : undefined}
                  />
                )}

                {organId === 'eyes' && (
                  <g>
                    <ellipse
                      cx="240"
                      cy={anchor.y}
                      rx="7"
                      ry="5"
                      fill={isHovered || isSelected ? organColor : 'transparent'}
                      fillOpacity={isSelected ? 0.4 : isHovered ? 0.25 : 0}
                      stroke={isHovered || isSelected ? organColor : 'transparent'}
                      strokeWidth={1.5}
                    />
                    <ellipse
                      cx="260"
                      cy={anchor.y}
                      rx="7"
                      ry="5"
                      fill={isHovered || isSelected ? organColor : 'transparent'}
                      fillOpacity={isSelected ? 0.4 : isHovered ? 0.25 : 0}
                      stroke={isHovered || isSelected ? organColor : 'transparent'}
                      strokeWidth={1.5}
                    />
                  </g>
                )}

                {organId === 'carotid_jugular' && (
                  <rect
                    x="234"
                    y="112"
                    width="32"
                    height="32"
                    rx="6"
                    fill={isHovered || isSelected ? organColor : 'transparent'}
                    fillOpacity={isSelected ? 0.35 : isHovered ? 0.2 : 0}
                    stroke={isHovered || isSelected ? organColor : 'transparent'}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                )}

                {organId === 'heart' && (
                  <ellipse
                    cx={anchor.x}
                    cy={anchor.y}
                    rx="22"
                    ry="22"
                    fill={isHovered || isSelected ? organColor : 'transparent'}
                    fillOpacity={isSelected ? 0.4 : isHovered ? 0.25 : 0}
                    stroke={isHovered || isSelected ? organColor : 'transparent'}
                    strokeWidth={isSelected ? 2.2 : 1.2}
                    filter={isSelected || isHovered ? `url(#${idPrefix}-organ-highlight)` : undefined}
                  />
                )}

                {organId === 'lungs' && (
                  <g>
                    <ellipse
                      cx="218"
                      cy={anchor.y}
                      rx="22"
                      ry="36"
                      fill={isHovered || isSelected ? organColor : 'transparent'}
                      fillOpacity={isSelected ? 0.3 : isHovered ? 0.18 : 0}
                      stroke={isHovered || isSelected ? organColor : 'transparent'}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                    <ellipse
                      cx="282"
                      cy={anchor.y}
                      rx="22"
                      ry="36"
                      fill={isHovered || isSelected ? organColor : 'transparent'}
                      fillOpacity={isSelected ? 0.3 : isHovered ? 0.18 : 0}
                      stroke={isHovered || isSelected ? organColor : 'transparent'}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                  </g>
                )}

                {organId === 'liver' && (
                  <ellipse
                    cx={anchor.x}
                    cy={anchor.y}
                    rx="26"
                    ry="20"
                    fill={isHovered || isSelected ? organColor : 'transparent'}
                    fillOpacity={isSelected ? 0.35 : isHovered ? 0.2 : 0}
                    stroke={isHovered || isSelected ? organColor : 'transparent'}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                )}

                {organId === 'kidneys' && (
                  <g>
                    <ellipse
                      cx="224"
                      cy={anchor.y}
                      rx="14"
                      ry="18"
                      fill={isHovered || isSelected ? organColor : 'transparent'}
                      fillOpacity={isSelected ? 0.35 : isHovered ? 0.2 : 0}
                      stroke={isHovered || isSelected ? organColor : 'transparent'}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                    <ellipse
                      cx="276"
                      cy={anchor.y}
                      rx="14"
                      ry="18"
                      fill={isHovered || isSelected ? organColor : 'transparent'}
                      fillOpacity={isSelected ? 0.35 : isHovered ? 0.2 : 0}
                      stroke={isHovered || isSelected ? organColor : 'transparent'}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                  </g>
                )}

                {organId === 'gastrointestinal' && (
                  <rect
                    x="226"
                    y="280"
                    width="48"
                    height="65"
                    rx="12"
                    fill={isHovered || isSelected ? organColor : 'transparent'}
                    fillOpacity={isSelected ? 0.3 : isHovered ? 0.18 : 0}
                    stroke={isHovered || isSelected ? organColor : 'transparent'}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                )}

                {organId === 'spine' && (
                  <rect
                    x="242"
                    y="130"
                    width="16"
                    height="230"
                    rx="4"
                    fill={isHovered || isSelected ? organColor : 'transparent'}
                    fillOpacity={isSelected ? 0.35 : isHovered ? 0.2 : 0}
                    stroke={isHovered || isSelected ? organColor : 'transparent'}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                )}

                {organId === 'muscular_core' && (
                  <rect
                    x="218"
                    y="240"
                    width="64"
                    height="110"
                    rx="8"
                    fill={isHovered || isSelected ? organColor : 'transparent'}
                    fillOpacity={isSelected ? 0.25 : isHovered ? 0.15 : 0}
                    stroke={isHovered || isSelected ? organColor : 'transparent'}
                    strokeWidth={isSelected ? 1.8 : 1}
                  />
                )}

                {organId === 'upper_limbs' && (
                  <g>
                    <rect
                      x="142"
                      y="160"
                      width="34"
                      height="260"
                      rx="14"
                      fill={isHovered || isSelected ? organColor : 'transparent'}
                      fillOpacity={isSelected ? 0.25 : isHovered ? 0.15 : 0}
                      stroke={isHovered || isSelected ? organColor : 'transparent'}
                      strokeWidth={isSelected ? 1.8 : 1}
                    />
                    <rect
                      x="324"
                      y="160"
                      width="34"
                      height="260"
                      rx="14"
                      fill={isHovered || isSelected ? organColor : 'transparent'}
                      fillOpacity={isSelected ? 0.25 : isHovered ? 0.15 : 0}
                      stroke={isHovered || isSelected ? organColor : 'transparent'}
                      strokeWidth={isSelected ? 1.8 : 1}
                    />
                  </g>
                )}

                {organId === 'lower_limbs' && (
                  <g>
                    <rect
                      x="196"
                      y="420"
                      width="42"
                      height="370"
                      rx="16"
                      fill={isHovered || isSelected ? organColor : 'transparent'}
                      fillOpacity={isSelected ? 0.25 : isHovered ? 0.15 : 0}
                      stroke={isHovered || isSelected ? organColor : 'transparent'}
                      strokeWidth={isSelected ? 1.8 : 1}
                    />
                    <rect
                      x="262"
                      y="420"
                      width="42"
                      height="370"
                      rx="16"
                      fill={isHovered || isSelected ? organColor : 'transparent'}
                      fillOpacity={isSelected ? 0.25 : isHovered ? 0.15 : 0}
                      stroke={isHovered || isSelected ? organColor : 'transparent'}
                      strokeWidth={isSelected ? 1.8 : 1}
                    />
                  </g>
                )}

                {/* Status Indicator Pulse Bead on Active Warning/Critical Organs */}
                {status !== 'nominal' && (
                  <g>
                    <circle
                      cx={anchor.x}
                      cy={anchor.y}
                      r="4.5"
                      fill={organColor}
                      style={{
                        animation:
                          status === 'critical'
                            ? 'biotwin-critical-pulse 1.2s infinite ease-in-out'
                            : 'biotwin-warning-pulse 2s infinite ease-in-out',
                      }}
                    />
                    <circle
                      cx={anchor.x}
                      cy={anchor.y}
                      r="8"
                      fill="none"
                      stroke={organColor}
                      strokeWidth="0.8"
                      opacity="0.6"
                    />
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* 10. ACTIVE SELECTION RING WITH GLOWING CROSSHAIR RETICLE */}
        {activeAnchor && (
          <g
            id="active-selection-reticle"
            className="pointer-events-none"
            filter={`url(#${idPrefix}-active-reticle)`}
          >
            {/* Pulsing Target Ring */}
            <circle
              cx={activeAnchor.x}
              cy={activeAnchor.y}
              r="22"
              fill="none"
              stroke={activeOrganColor}
              strokeWidth="1.2"
              strokeDasharray="4 4"
              style={{
                transformOrigin: `${activeAnchor.x}px ${activeAnchor.y}px`,
                animation: 'biotwin-reticle-spin 8s linear infinite',
              }}
            />

            {/* Corner Targeting Brackets */}
            <path
              d={`
                M ${activeAnchor.x - 28},${activeAnchor.y - 16} L ${activeAnchor.x - 28},${activeAnchor.y - 28} L ${activeAnchor.x - 16},${activeAnchor.y - 28}
                M ${activeAnchor.x + 16},${activeAnchor.y - 28} L ${activeAnchor.x + 28},${activeAnchor.y - 28} L ${activeAnchor.x + 28},${activeAnchor.y - 16}
                M ${activeAnchor.x - 28},${activeAnchor.y + 16} L ${activeAnchor.x - 28},${activeAnchor.y + 28} L ${activeAnchor.x - 16},${activeAnchor.y + 28}
                M ${activeAnchor.x + 16},${activeAnchor.y + 28} L ${activeAnchor.x + 28},${activeAnchor.y + 28} L ${activeAnchor.x + 28},${activeAnchor.y + 16}
              `}
              fill="none"
              stroke={activeOrganColor}
              strokeWidth="2"
            />

            {/* Crosshair Center Ticks */}
            <line
              x1={activeAnchor.x - 7}
              y1={activeAnchor.y}
              x2={activeAnchor.x + 7}
              y2={activeAnchor.y}
              stroke={activeOrganColor}
              strokeWidth="1.5"
            />
            <line
              x1={activeAnchor.x}
              y1={activeAnchor.y - 7}
              x2={activeAnchor.x}
              y2={activeAnchor.y + 7}
              stroke={activeOrganColor}
              strokeWidth="1.5"
            />

            {/* Telemetry Coordinate Label */}
            <text
              x={activeAnchor.x + 32}
              y={activeAnchor.y - 14}
              fill={activeOrganColor}
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
              letterSpacing="0.05em"
            >
              {selectedOrganId?.toUpperCase()} // LOCK
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
