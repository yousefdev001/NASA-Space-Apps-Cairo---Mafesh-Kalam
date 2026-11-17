import React, { useState, useEffect, useMemo } from 'react';
import { clsx } from 'clsx';
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
  Radio,
  RotateCw,
  Sparkles,
  Search,
  Stethoscope,
} from 'lucide-react';
import {
  OrganId,
  BioTwinCrewMember,
  BioTwinResponse,
  OrganStatusFilter,
  ViewPerspective,
  ShaderMode,
  ActiveLayersState,
  AnatomicalLayer,
} from '../types/biotwin.types';
import {
  BioTwinCrewHeader,
  HolographicBodyModel,
  BodyLandmarkPointers,
  OrganDetailDrawer,
} from '../components/biotwin';
import { useThemeStore } from '../store/themeStore';
import { getWobblyStyle } from '../components/sketchbook/sketchbookConstants';
import bioTwinApi from '../api/bioTwinApi';
import apiClient from '../api/client';

const DEFAULT_CREW: BioTwinCrewMember[] = [
  {
    id: 1,
    callsign: 'CDR-01',
    name: 'Elena Vance',
    role: 'Mission Commander',
    zone: 'Quest Airlock / EVA-1',
    hr: 72,
    spo2: 98.4,
    status: 'nominal',
    eva_hours: 42.5,
    syncStatus: 'synced',
    lastSyncTime: 'Live',
  },
  {
    id: 2,
    callsign: 'PLT-02',
    name: 'Marcus Chen',
    role: 'Chief Pilot',
    zone: 'Cupola Flight Deck',
    hr: 88,
    spo2: 96.1,
    status: 'warning',
    eva_hours: 28.0,
    syncStatus: 'synced',
    lastSyncTime: 'Live',
  },
  {
    id: 3,
    callsign: 'SPC-03',
    name: 'Arya Patel',
    role: 'Flight Surgeon & Specialist',
    zone: 'Columbus Lab Module',
    hr: 64,
    spo2: 99.2,
    status: 'nominal',
    eva_hours: 12.5,
    syncStatus: 'synced',
    lastSyncTime: 'Live',
  },
  {
    id: 4,
    callsign: 'ENG-04',
    name: 'Alexei Ivanov',
    role: 'Systems Engineer',
    zone: 'Node 3 Tranquility / ECLSS Bay',
    hr: 81,
    spo2: 97.5,
    status: 'nominal',
    eva_hours: 34.0,
    syncStatus: 'synced',
    lastSyncTime: 'Live',
  },
];

const ORGAN_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  brain: Brain,
  eyes: Eye,
  carotid: Activity,
  carotid_jugular: Activity,
  heart: Heart,
  lungs: Wind,
  liver: Activity,
  kidneys: Droplets,
  gi_tract: Flame,
  gastrointestinal: Flame,
  spine: Layers,
  musculoskeletal_upper: User,
  muscular_core: User,
  upper_limbs: User,
  musculoskeletal_lower: User,
  lower_limbs: User,
  radiation_absorption: Radio,
};

export const BioTwinPage: React.FC = () => {
  // 1. Crew & BioTwin Telemetry State
  const [selectedCrewId, setSelectedCrewId] = useState<number>(1);
  const [crewMembers, setCrewMembers] = useState<BioTwinCrewMember[]>(DEFAULT_CREW);
  const [bioTwinData, setBioTwinData] = useState<BioTwinResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // 2. Interactive Anatomical 3D Avatar State
  const [selectedOrganId, setSelectedOrganId] = useState<string>('heart');
  const [hoveredOrganId, setHoveredOrganId] = useState<string | null>(null);
  const [perspective, setPerspective] = useState<ViewPerspective>('anterior');
  const [shaderMode, setShaderMode] = useState<ShaderMode>('holographic');
  const [activeLayers, setActiveLayers] = useState<ActiveLayersState>({
    neural: true,
    vascular: true,
    visceral: true,
    muscular: true,
    skeletal: true,
  });

  // 3. Filters & Inspection Drawer
  const [statusFilter, setStatusFilter] = useState<OrganStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
  const [showCalloutPins, setShowCalloutPins] = useState<boolean>(true);

  // Load crew live vitals from mission control API if available
  useEffect(() => {
    let isMounted = true;
    apiClient
      .get('/dashboard/mission-control')
      .then((res) => {
        if (!isMounted) return;
        const apiCrew = res.data?.data?.crew;
        if (Array.isArray(apiCrew) && apiCrew.length > 0) {
          const mappedCrew: BioTwinCrewMember[] = apiCrew.map((c: any) => ({
            id: c.id,
            uuid: c.uuid,
            callsign: c.callsign,
            name: c.name,
            role: c.role,
            zone: c.zone,
            hr: c.hr,
            spo2: c.spo2,
            status: c.status,
            eva_hours: c.eva_hours,
            syncStatus: 'synced',
            lastSyncTime: 'Live',
          }));
          setCrewMembers(mappedCrew);
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_CREW
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch BioTwin dossier and telemetry whenever selected crew changes
  useEffect(() => {
    let ignore = false;
    bioTwinApi
      .getBioTwin(selectedCrewId)
      .then((data) => {
        if (!ignore) {
          setBioTwinData(data);
          setIsLoading(false);
          setIsRefreshing(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load Bio-Digital Twin telemetry:', err);
        if (!ignore) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedCrewId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    bioTwinApi
      .getBioTwin(selectedCrewId)
      .then((data) => {
        setBioTwinData(data);
        setIsRefreshing(false);
      })
      .catch(() => {
        setIsRefreshing(false);
      });
  };

  // Layer Toggle Handlers
  const handleToggleLayer = (layer: AnatomicalLayer) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  const handleSetAllLayers = (active: boolean) => {
    setActiveLayers({
      neural: active,
      vascular: active,
      visceral: active,
      muscular: active,
      skeletal: active,
    });
  };

  const handleTogglePerspective = () => {
    setPerspective((prev) => (prev === 'anterior' ? 'posterior' : 'anterior'));
  };

  // Organ Selection Handler (handles canonical ID aliases)
  const handleSelectOrgan = (organId: string) => {
    setSelectedOrganId(organId);
    setIsDrawerOpen(true);
  };

  // Compute Organ Counts
  const organCounts = useMemo(() => {
    const list = bioTwinData?.organs || [];
    return {
      all: list.length,
      nominal: list.filter((o) => o.status === 'nominal').length,
      warning: list.filter((o) => o.status === 'warning').length,
      critical: list.filter((o) => o.status === 'critical').length,
    };
  }, [bioTwinData]);

  // Filtered Organs List
  const filteredOrgans = useMemo(() => {
    if (!bioTwinData?.organs) return [];
    return bioTwinData.organs.filter((organ) => {
      // Status filter
      if (statusFilter !== 'all' && organ.status !== statusFilter) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = organ.name.toLowerCase().includes(q);
        const matchesSystem = organ.system.toLowerCase().includes(q);
        const matchesMetric = organ.primaryMetric?.name?.toLowerCase().includes(q);
        return matchesName || matchesSystem || matchesMetric;
      }
      return true;
    });
  }, [bioTwinData, statusFilter, searchQuery]);

  // Find currently selected organ object
  const activeOrgan = useMemo(() => {
    if (!bioTwinData?.organs || !selectedOrganId) return null;
    return (
      bioTwinData.organs.find(
        (o) =>
          o.id === selectedOrganId ||
          o.slug === selectedOrganId ||
          (selectedOrganId === 'carotid_jugular' && (o.id === 'carotid' || o.id === 'carotid_jugular')) ||
          (selectedOrganId === 'carotid' && (o.id === 'carotid_jugular' || o.id === 'carotid')) ||
          (selectedOrganId === 'gastrointestinal' && (o.id === 'gi_tract' || o.id === 'gastrointestinal')) ||
          (selectedOrganId === 'gi_tract' && (o.id === 'gastrointestinal' || o.id === 'gi_tract')) ||
          (selectedOrganId === 'muscular_core' && (o.id === 'musculoskeletal_upper' || o.id === 'muscular_core')) ||
          (selectedOrganId === 'upper_limbs' && (o.id === 'musculoskeletal_upper' || o.id === 'upper_limbs')) ||
          (selectedOrganId === 'lower_limbs' && (o.id === 'musculoskeletal_lower' || o.id === 'lower_limbs'))
      ) || bioTwinData.organs[0]
    );
  }, [bioTwinData, selectedOrganId]);

  const selectedAstronaut =
    crewMembers.find((c) => c.id === selectedCrewId) || crewMembers[0];

  const { mode } = useThemeStore();
  const isPaper = mode === 'paper';
  const isDark = mode === 'dark';
  const isSketch = isPaper || isDark;

  return (
    <div
      className={clsx(
        'min-h-screen p-3 sm:p-4 lg:p-5 space-y-4 pb-16 transition-colors duration-200',
        isPaper
          ? 'bg-[#fdfbf7] text-[#2d2d2d] paper-grain font-sketch-hand -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8'
          : isDark
            ? 'bg-[#000000] text-white paper-grain-dark font-sketch-hand -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8'
            : 'bg-[#050B14] text-white hud-grid'
      )}
    >
      {/* 1. Top Section: Crew Header & Telemetry Sync Ribbon */}
      <BioTwinCrewHeader
        selectedCrewId={selectedCrewId}
        onSelectCrew={(id) => {
          setSelectedCrewId(id);
          setSelectedOrganId('heart'); // reset to heart on astronaut switch
        }}
        crewMembers={crewMembers}
        currentStatusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        summary={bioTwinData?.summary}
        organCounts={organCounts}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* 2. Main Viewport: Center 3D Avatar Viewport + Sliding Drawer */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
        {/* Holographic Avatar Center Viewport */}
        <div
          style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
          className={clsx(
            'relative overflow-hidden transition-all duration-300 flex flex-col justify-between p-3.5 sm:p-4 lg:p-5',
            isDrawerOpen ? 'lg:col-span-7 xl:col-span-7 2xl:col-span-8' : 'lg:col-span-12',
            isPaper
              ? 'bg-white text-[#2d2d2d] border-[3px] border-[#2d2d2d] sketch-shadow font-sketch-hand'
              : isDark
                ? 'bg-[#0c0c10] text-white border-[3px] border-[#FF4D00] sketch-shadow-orange font-sketch-hand'
                : 'rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-[#0B132B]/95 via-[#050B14]/90 to-[#0B132B]/95 backdrop-blur-2xl shadow-[0_0_35px_rgba(0,229,255,0.08)]'
          )}
        >
          {/* Subtle Ambient HUD Grid Background for Cyber mode */}
          {!isSketch && (
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
          )}

          {/* Unified High-Tech / Sketch HUD Control Bar */}
          <div
            className={clsx(
              'relative z-20 flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-1 border-b',
              isPaper
                ? 'border-[#2d2d2d]/30 text-[#2d2d2d]'
                : isDark
                  ? 'border-[#FF4D00]/40 text-white'
                  : 'border-cyan-500/20'
            )}
          >
            {/* Left: 5 Anatomical Layers Pills + All/Isolate */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
              <div
                className={clsx(
                  'flex items-center gap-1.5 mr-1 text-[10px] font-bold uppercase tracking-wider hidden sm:flex',
                  isPaper ? 'text-[#2d2d2d] font-sketch-hand' : isDark ? 'text-[#FF4D00] font-sketch-hand' : 'font-mono text-cyan-400'
                )}
              >
                <span
                  className={clsx(
                    'h-1.5 w-1.5 rounded-full',
                    isPaper ? 'bg-[#2d5da1]' : isDark ? 'bg-[#FF4D00]' : 'bg-cyan-400 animate-pulse'
                  )}
                />
                <span>LAYERS:</span>
              </div>
              {[
                { id: 'neural' as AnatomicalLayer, label: 'Neural', icon: Brain },
                { id: 'vascular' as AnatomicalLayer, label: 'Vascular', icon: Activity },
                { id: 'visceral' as AnatomicalLayer, label: 'Visceral', icon: Heart },
                { id: 'muscular' as AnatomicalLayer, label: 'Muscular', icon: User },
                { id: 'skeletal' as AnatomicalLayer, label: 'Skeletal', icon: Layers },
              ].map(({ id, label, icon: IconComponent }) => {
                const isActive = activeLayers[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleToggleLayer(id)}
                    style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                    className={clsx(
                      'flex items-center gap-1 px-2 py-1 text-[10px] font-bold transition-all cursor-pointer select-none border',
                      isPaper
                        ? isActive
                          ? 'bg-[#2d5da1] text-white border-[#2d2d2d] sketch-btn font-sketch-hand'
                          : 'bg-white text-[#2d2d2d] border-[#2d2d2d] hover:bg-[#fff9c4] font-sketch-hand'
                        : isDark
                          ? isActive
                            ? 'bg-[#FF4D00] text-black border-[#FF4D00] sketch-btn-orange font-sketch-hand'
                            : 'bg-black text-white border-[#FF4D00]/50 hover:border-[#FF4D00] font-sketch-hand'
                          : isActive
                            ? 'rounded-lg bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,229,255,0.2)] font-mono'
                            : 'rounded-lg bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300 font-mono'
                    )}
                  >
                    <IconComponent className="h-3 w-3 shrink-0" />
                    <span>{label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => handleSetAllLayers(!Object.values(activeLayers).every(Boolean))}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'text-[9px] px-1.5 py-1 border transition-colors cursor-pointer select-none font-bold',
                  isPaper
                    ? 'border-[#2d2d2d] bg-[#fdfbf7] text-[#2d2d2d] hover:bg-[#fff9c4] font-sketch-hand'
                    : isDark
                      ? 'border-[#FF4D00] bg-black text-[#FF4D00] hover:bg-[#FF4D00]/20 font-sketch-hand'
                      : 'rounded border-cyan-500/30 text-slate-400 hover:text-cyan-300 hover:border-cyan-400 font-mono'
                )}
                title={Object.values(activeLayers).every(Boolean) ? 'Isolate Layer' : 'Show All Layers'}
              >
                {Object.values(activeLayers).every(Boolean) ? 'ISO' : 'ALL'}
              </button>
            </div>

            {/* Right: Shader Mode, Perspective Flip, HUD Callouts, and Dossier Drawer Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Shader Mode Pills */}
              <div
                className={clsx(
                  'flex items-center gap-0.5 p-0.5 border rounded-lg',
                  isPaper
                    ? 'bg-white border-[#2d2d2d]'
                    : isDark
                      ? 'bg-black border-[#FF4D00]'
                      : 'bg-[#050B14]/80 border-[#1E3A5F]'
                )}
              >
                <button
                  type="button"
                  onClick={() => setShaderMode('holographic')}
                  title="Cyber Hologram / Blueprint"
                  className={clsx(
                    'p-1 rounded transition-all cursor-pointer',
                    shaderMode === 'holographic'
                      ? isPaper
                        ? 'bg-[#fff9c4] text-[#2d5da1] font-bold'
                        : isDark
                          ? 'bg-[#FF4D00] text-black font-bold'
                          : 'bg-cyan-500/25 text-cyan-300'
                      : isPaper
                        ? 'text-[#2d2d2d]/60 hover:text-[#2d2d2d]'
                        : isDark
                          ? 'text-white/60 hover:text-white'
                          : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShaderMode('thermal_heatmap')}
                  title="Thermal Heatmap"
                  className={clsx(
                    'p-1 rounded transition-all cursor-pointer',
                    shaderMode === 'thermal_heatmap'
                      ? isPaper
                        ? 'bg-amber-100 text-amber-900 font-bold'
                        : isDark
                          ? 'bg-amber-400 text-black font-bold'
                          : 'bg-amber-500/25 text-amber-300'
                      : isPaper
                        ? 'text-[#2d2d2d]/60 hover:text-[#2d2d2d]'
                        : isDark
                          ? 'text-white/60 hover:text-white'
                          : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  <Flame className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShaderMode('radiation_flux')}
                  title="Radiation Flux"
                  className={clsx(
                    'p-1 rounded transition-all cursor-pointer',
                    shaderMode === 'radiation_flux'
                      ? isPaper
                        ? 'bg-purple-100 text-purple-900 font-bold'
                        : isDark
                          ? 'bg-fuchsia-400 text-black font-bold'
                          : 'bg-fuchsia-500/25 text-fuchsia-300'
                      : isPaper
                        ? 'text-[#2d2d2d]/60 hover:text-[#2d2d2d]'
                        : isDark
                          ? 'text-white/60 hover:text-white'
                          : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  <Radio className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Perspective 180° Flip */}
              <button
                type="button"
                onClick={handleTogglePerspective}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border transition-all cursor-pointer select-none',
                  isPaper
                    ? 'border-2 border-[#2d2d2d] bg-white text-[#2d2d2d] hover:bg-[#fff9c4] sketch-btn font-sketch-hand'
                    : isDark
                      ? 'border-2 border-[#FF4D00] bg-black text-white hover:bg-[#FF4D00]/20 sketch-btn-orange font-sketch-hand'
                      : 'rounded-lg border-cyan-500/40 bg-cyan-950/40 font-mono text-cyan-300 hover:bg-cyan-500/25 shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                )}
                title="Rotate Humanoid Avatar 180°"
              >
                <RotateCw className="h-3 w-3" />
                <span>{perspective.toUpperCase()}</span>
              </button>

              {/* Callout Pins Toggle */}
              <button
                type="button"
                onClick={() => setShowCalloutPins(!showCalloutPins)}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'flex items-center gap-1 px-2 py-1 text-[11px] font-bold border transition-all cursor-pointer select-none',
                  isPaper
                    ? showCalloutPins
                      ? 'border-2 border-[#2d2d2d] bg-[#2d5da1] text-white sketch-btn font-sketch-hand'
                      : 'border-2 border-[#2d2d2d] bg-white text-[#2d2d2d] hover:bg-[#fff9c4] font-sketch-hand'
                    : isDark
                      ? showCalloutPins
                        ? 'border-2 border-[#FF4D00] bg-[#FF4D00] text-black sketch-btn-orange font-sketch-hand'
                        : 'border border-[#FF4D00]/50 bg-black text-white font-sketch-hand'
                      : showCalloutPins
                        ? 'rounded-lg border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.2)] font-mono'
                        : 'rounded-lg border-[#1E3A5F] bg-[#050B14] text-slate-400 hover:text-white font-mono'
                )}
                title="Toggle HUD landmark callouts"
              >
                <Radio className="h-3 w-3" />
                <span>PINS {showCalloutPins ? 'ON' : 'OFF'}</span>
              </button>

              {/* Drawer Toggle */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border transition-all cursor-pointer select-none',
                  isPaper
                    ? 'border-2 border-[#2d2d2d] bg-[#2d5da1] text-white hover:bg-[#204375] sketch-btn font-sketch-hand'
                    : isDark
                      ? 'border-2 border-[#FF4D00] bg-[#FF4D00] text-black hover:bg-[#ff6a26] sketch-btn-orange font-sketch-hand'
                      : isDrawerOpen
                        ? 'rounded-lg border-cyan-400 bg-cyan-500/25 text-cyan-300 font-mono'
                        : 'rounded-lg border-[#1E3A5F] bg-[#050B14] text-slate-400 hover:text-white font-mono'
                )}
              >
                <Stethoscope className="h-3 w-3" />
                <span>{isDrawerOpen ? 'HIDE DOSSIER' : 'INSPECT DOSSIER'}</span>
              </button>
            </div>
          </div>

          {/* Holographic Body Model Canvas Viewport */}
          <div className="relative flex-1 min-h-[480px] sm:min-h-[540px] max-h-[620px] flex items-center justify-center py-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-24 text-center">
                <div
                  className={clsx(
                    'h-12 w-12 rounded-full border-2 border-t-transparent animate-spin',
                    isPaper ? 'border-[#2d5da1]' : isDark ? 'border-[#FF4D00]' : 'border-cyan-400'
                  )}
                />
                <p
                  className={clsx(
                    'text-xs animate-pulse font-bold',
                    isPaper ? 'text-[#2d5da1] font-sketch-hand' : isDark ? 'text-[#FF4D00] font-sketch-hand' : 'font-mono text-cyan-300'
                  )}
                >
                  Acquiring 500Hz Bio-Impedance Mesh & Humanoid Avatar Telemetry...
                </p>
              </div>
            ) : (
              <div className="relative h-full w-full max-w-[480px] mx-auto flex items-center justify-center aspect-[500/890]">
                {/* 3D SVG Holographic Humanoid Body Model */}
                <HolographicBodyModel
                  selectedOrganId={selectedOrganId as OrganId}
                  onSelectOrgan={(id) => handleSelectOrgan(id)}
                  organsData={bioTwinData?.organs || []}
                  heartRate={selectedAstronaut.hr}
                  perspective={perspective}
                  shaderMode={shaderMode}
                  activeLayers={activeLayers}
                  showPointers={false}
                  onHoverOrgan={(id) => setHoveredOrganId(id)}
                  className="h-full w-auto max-h-[580px] mx-auto"
                />

                {/* Cybernetic / Hand-drawn Leader Lines & Landmark Callout Pins Overlay */}
                {showCalloutPins && (
                  <BodyLandmarkPointers
                    selectedOrganId={selectedOrganId as OrganId}
                    onSelectOrgan={(id) => handleSelectOrgan(id)}
                    organsData={bioTwinData?.organs || []}
                    perspective={perspective}
                    heartRate={selectedAstronaut.hr}
                    filterMode={statusFilter === 'all' ? 'all' : 'warnings_and_selected'}
                    className="pointer-events-auto"
                  />
                )}
              </div>
            )}

            {/* Corner Metadata HUD Callouts */}
            <div
              className={clsx(
                'pointer-events-none absolute bottom-2 left-2 z-20 space-y-0.5 text-[9px] hidden sm:block',
                isPaper ? 'text-[#2d2d2d]/80 font-sketch-hand font-bold text-[10px]' : isDark ? 'text-white/80 font-sketch-hand font-bold text-[10px]' : 'font-mono text-slate-400'
              )}
            >
              <div className={clsx('flex items-center gap-1 font-bold', isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-300')}>
                <Sparkles className="h-2.5 w-2.5" />
                <span>VECTOR BIO-TWIN RESOLUTION: 500 DPI</span>
              </div>
              <div>SPACE-STD: NASA STD-3001 VOL 1 & 2</div>
              <div>BIO-MESH SENSORS: 12 ANATOMICAL CHANNELS LOCKED</div>
              {hoveredOrganId && (
                <div className={isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'}>
                  TARGET HOVER: {hoveredOrganId.toUpperCase()}
                </div>
              )}
            </div>

            <div
              className={clsx(
                'pointer-events-none absolute bottom-2 right-2 z-20 text-right text-[9px] hidden sm:block',
                isPaper ? 'text-[#2d2d2d]/80 font-sketch-hand font-bold text-[10px]' : isDark ? 'text-white/80 font-sketch-hand font-bold text-[10px]' : 'font-mono text-slate-400'
              )}
            >
              <div className="text-emerald-500 font-bold">● BIO-DOWNLINK NOMINAL</div>
              <div>LATENCY: 42 ms · ORBIT NO. 14,892</div>
              <div>ASTRONAUT: {selectedAstronaut.callsign} ({selectedAstronaut.name})</div>
            </div>
          </div>
        </div>

        {/* 3. Right: Slide-out / Expandable Clinical Inspection Drawer */}
        {isDrawerOpen && (
          <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-4 h-full">
            <OrganDetailDrawer
              organ={activeOrgan}
              astronautId={selectedCrewId}
              astronautName={selectedAstronaut.name}
              astronautCallsign={selectedAstronaut.callsign}
              isOpen={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              onSelectOrgan={(id) => handleSelectOrgan(id)}
            />
          </div>
        )}
      </div>

      {/* 4. Bottom Ribbon: Quick Organ Selector Chips Strip */}
      <div
        style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
        className={clsx(
          'p-4 space-y-3 transition-all',
          isPaper
            ? 'bg-white text-[#2d2d2d] border-[3px] border-[#2d2d2d] sketch-shadow font-sketch-hand'
            : isDark
              ? 'bg-[#0c0c10] text-white border-[3px] border-[#FF4D00] sketch-shadow-orange font-sketch-hand'
              : 'rounded-2xl border border-cyan-500/30 bg-[#0B132B]/90 backdrop-blur-xl'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className={clsx('h-4 w-4', isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400')} />
            <h3
              className={clsx(
                'font-bold uppercase tracking-wider',
                isSketch ? 'font-display-kalam text-sm' : 'text-xs font-mono text-white'
              )}
            >
              Anatomical Systems Selector ({filteredOrgans.length} Active Targets)
            </h3>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className={clsx('absolute left-2.5 top-2.5 h-3.5 w-3.5', isPaper ? 'text-[#2d2d2d]/60' : 'text-slate-400')} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter organ or biomarker..."
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={clsx(
                'w-full pl-8 pr-3 py-1.5 text-xs transition-colors focus:outline-none',
                isPaper
                  ? 'border-2 border-[#2d2d2d] bg-[#fdfbf7] text-[#2d2d2d] placeholder-[#2d2d2d]/50 font-sketch-hand'
                  : isDark
                    ? 'border-2 border-[#FF4D00] bg-black text-white placeholder-slate-400 font-sketch-hand'
                    : 'rounded-lg border border-[#1E3A5F] bg-[#050B14] font-mono text-white placeholder-slate-500 focus:border-cyan-400'
              )}
            />
          </div>
        </div>

        {/* Horizontal Chips Carousel / Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {filteredOrgans.map((organ) => {
            const isSelected =
              activeOrgan?.id === organ.id ||
              organ.id === selectedOrganId ||
              organ.slug === selectedOrganId;
            const Icon = ORGAN_ICON_MAP[organ.id] || ORGAN_ICON_MAP[organ.slug || ''] || Activity;

            const isWarning = organ.status === 'warning';
            const isCritical = organ.status === 'critical';

            return (
              <button
                key={organ.id}
                type="button"
                onClick={() => handleSelectOrgan(organ.id)}
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'group relative text-left p-3 border transition-all duration-150 cursor-pointer select-none',
                  isPaper
                    ? isSelected
                      ? 'border-[#ff4d4d] bg-[#fff9c4] text-[#2d2d2d] sketch-shadow font-sketch-hand'
                      : 'border-[#2d2d2d] bg-white text-[#2d2d2d] hover:bg-[#fff9c4]/50 font-sketch-hand'
                    : isDark
                      ? isSelected
                        ? 'border-[#FF4D00] bg-[#18110c] text-white sketch-shadow-orange font-sketch-hand'
                        : 'border-[#FF4D00]/60 bg-[#0c0c10] text-white hover:border-[#FF4D00] font-sketch-hand'
                      : isSelected
                        ? 'rounded-xl border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                        : isCritical
                          ? 'rounded-xl border-red-500/50 bg-red-950/20 hover:border-red-400'
                          : isWarning
                            ? 'rounded-xl border-amber-500/50 bg-amber-950/20 hover:border-amber-400'
                            : 'rounded-xl border-[#1E3A5F]/70 bg-[#050B14]/70 hover:border-cyan-500/40 hover:bg-[#0B132B]'
                )}
              >
                {/* Active selection dot */}
                {isSelected && (
                  <div
                    className={clsx(
                      'absolute top-2 right-2 h-2.5 w-2.5 rounded-full animate-ping',
                      isPaper ? 'bg-[#ff4d4d]' : isDark ? 'bg-[#FF4D00]' : 'bg-cyan-400'
                    )}
                  />
                )}

                <div className="flex items-center gap-2">
                  <div
                    style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
                    className={clsx(
                      'flex h-7 w-7 items-center justify-center border shrink-0',
                      isPaper
                        ? 'border-[#2d2d2d] bg-[#fdfbf7] text-[#2d5da1]'
                        : isDark
                          ? 'border-[#FF4D00] bg-black text-[#FF4D00]'
                          : isSelected
                            ? 'rounded-lg border-cyan-400 bg-cyan-500/20 text-cyan-300'
                            : isCritical
                              ? 'rounded-lg border-red-500/40 bg-red-500/15 text-red-400'
                              : isWarning
                                ? 'rounded-lg border-amber-500/40 bg-amber-500/15 text-amber-400'
                                : 'rounded-lg border-[#1E3A5F] bg-[#0B132B] text-slate-400 group-hover:text-cyan-300'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="truncate">
                    <h4
                      className={clsx(
                        'text-xs truncate font-bold',
                        isSketch ? 'font-display-kalam text-sm' : 'font-mono text-white'
                      )}
                    >
                      {organ.name}
                    </h4>
                    <span
                      className={clsx(
                        'text-[10px] truncate block',
                        isSketch ? 'font-sketch-hand' : 'font-mono text-slate-400'
                      )}
                    >
                      {organ.primaryMetric?.value} {organ.primaryMetric?.unit}
                    </span>
                  </div>
                </div>

                <div
                  className={clsx(
                    'mt-2 flex items-center justify-between text-[10px] border-t pt-1.5',
                    isPaper
                      ? 'border-[#2d2d2d]/30 font-sketch-hand text-xs font-bold'
                      : isDark
                        ? 'border-[#FF4D00]/40 font-sketch-hand text-xs font-bold'
                        : 'border-[#1E3A5F]/40 font-mono'
                  )}
                >
                  <span
                    className={clsx(
                      'font-bold uppercase',
                      isCritical
                        ? isPaper ? 'text-rose-600' : 'text-red-400'
                        : isWarning
                          ? isPaper ? 'text-amber-700' : 'text-amber-400'
                          : isPaper ? 'text-emerald-700' : 'text-emerald-400'
                    )}
                  >
                    ● {organ.status}
                  </span>
                  <span className={isPaper ? 'text-[#2d2d2d]/80' : 'text-slate-400'}>
                    {organ.score ?? organ.healthScore ?? 90}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BioTwinPage;
