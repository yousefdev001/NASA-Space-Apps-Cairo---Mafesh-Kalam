import React, { useState, useEffect, useMemo } from 'react';
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

  return (
    <div className="min-h-screen bg-[#050B14] text-white p-3 sm:p-4 lg:p-5 space-y-4 pb-16 hud-grid">
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
          className={`relative rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-[#0B132B]/95 via-[#050B14]/90 to-[#0B132B]/95 p-3.5 sm:p-4 lg:p-5 backdrop-blur-2xl shadow-[0_0_35px_rgba(0,229,255,0.08)] overflow-hidden transition-all duration-300 flex flex-col justify-between ${isDrawerOpen ? 'lg:col-span-7 xl:col-span-7 2xl:col-span-8' : 'lg:col-span-12'
            }`}
        >
          {/* Subtle Ambient HUD Grid Background */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />

          {/* Unified High-Tech HUD Control Bar */}
          <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-cyan-500/20 mb-1">
            {/* Left: 5 Anatomical Layers Pills + All/Isolate */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
              <div className="flex items-center gap-1.5 mr-1 text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider hidden sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
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
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-mono transition-all cursor-pointer ${isActive
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,229,255,0.2)]'
                        : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                  >
                    <IconComponent className="h-3 w-3 shrink-0" />
                    <span>{label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => handleSetAllLayers(!Object.values(activeLayers).every(Boolean))}
                className="text-[9px] font-mono px-1.5 py-1 rounded border border-cyan-500/30 text-slate-400 hover:text-cyan-300 hover:border-cyan-400 transition-colors cursor-pointer"
                title={Object.values(activeLayers).every(Boolean) ? 'Isolate Layer' : 'Show All Layers'}
              >
                {Object.values(activeLayers).every(Boolean) ? 'ISO' : 'ALL'}
              </button>
            </div>

            {/* Right: Shader Mode, Perspective Flip, HUD Callouts, and Dossier Drawer Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Shader Mode Pills */}
              <div className="flex items-center gap-0.5 bg-[#050B14]/80 p-0.5 rounded-lg border border-[#1E3A5F]">
                <button
                  type="button"
                  onClick={() => setShaderMode('holographic')}
                  title="Cyber Hologram"
                  className={`p-1 rounded transition-all cursor-pointer ${shaderMode === 'holographic' ? 'bg-cyan-500/25 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShaderMode('thermal_heatmap')}
                  title="Thermal Heatmap"
                  className={`p-1 rounded transition-all cursor-pointer ${shaderMode === 'thermal_heatmap' ? 'bg-amber-500/25 text-amber-300' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                  <Flame className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShaderMode('radiation_flux')}
                  title="Radiation Flux"
                  className={`p-1 rounded transition-all cursor-pointer ${shaderMode === 'radiation_flux' ? 'bg-fuchsia-500/25 text-fuchsia-300' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                  <Radio className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Perspective 180° Flip */}
              <button
                type="button"
                onClick={handleTogglePerspective}
                className="flex items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-2 py-1 text-[11px] font-mono font-bold text-cyan-300 hover:bg-cyan-500/25 transition-all shadow-[0_0_10px_rgba(0,229,255,0.15)] cursor-pointer"
                title="Rotate Humanoid Avatar 180°"
              >
                <RotateCw className="h-3 w-3" />
                <span>{perspective.toUpperCase()}</span>
              </button>

              {/* Callout Pins Toggle */}
              <button
                type="button"
                onClick={() => setShowCalloutPins(!showCalloutPins)}
                className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-mono font-bold transition-all cursor-pointer ${showCalloutPins
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                    : 'border-[#1E3A5F] bg-[#050B14] text-slate-400 hover:text-white'
                  }`}
                title="Toggle HUD landmark callouts"
              >
                <Radio className="h-3 w-3" />
                <span>PINS {showCalloutPins ? 'ON' : 'OFF'}</span>
              </button>

              {/* Drawer Toggle */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-mono font-bold transition-all cursor-pointer ${isDrawerOpen
                    ? 'border-cyan-400 bg-cyan-500/25 text-cyan-300'
                    : 'border-[#1E3A5F] bg-[#050B14] text-slate-400 hover:text-white'
                  }`}
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
                <div className="h-12 w-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <p className="text-xs font-mono text-cyan-300 animate-pulse">
                  Acquiring 500Hz Bio-Impedance Mesh & Holographic Avatar Telemetry...
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
                  className="h-full w-auto max-h-[580px] mx-auto drop-shadow-[0_0_25px_rgba(0,229,255,0.2)]"
                />

                {/* Cybernetic Leader Lines & Landmark Callout Pins Overlay */}
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
            <div className="pointer-events-none absolute bottom-2 left-2 z-20 space-y-0.5 font-mono text-[9px] text-slate-400 hidden sm:block">
              <div className="flex items-center gap-1 text-cyan-300 font-bold">
                <Sparkles className="h-2.5 w-2.5" />
                <span>VECTOR BIO-TWIN RESOLUTION: 500 DPI</span>
              </div>
              <div>SPACE-STD: NASA STD-3001 VOL 1 & 2</div>
              <div>BIO-MESH SENSORS: 12 ANATOMICAL CHANNELS LOCKED</div>
              {hoveredOrganId && (
                <div className="text-cyan-400">TARGET HOVER: {hoveredOrganId.toUpperCase()}</div>
              )}
            </div>

            <div className="pointer-events-none absolute bottom-2 right-2 z-20 text-right font-mono text-[9px] text-slate-400 hidden sm:block">
              <div className="text-emerald-400 font-bold">● BIO-DOWNLINK NOMINAL</div>
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

      {/* 4. Bottom HUD Ribbon: Quick Organ Selector Chips Strip */}
      <div className="rounded-2xl border border-cyan-500/30 bg-[#0B132B]/90 p-4 backdrop-blur-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Anatomical Systems Selector ({filteredOrgans.length} Active Targets)
            </h3>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter organ or biomarker..."
              className="w-full rounded-lg border border-[#1E3A5F] bg-[#050B14] pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
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
                className={`group relative text-left rounded-xl p-3 border transition-all duration-200 cursor-pointer ${isSelected
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                    : isCritical
                      ? 'border-red-500/50 bg-red-950/20 hover:border-red-400'
                      : isWarning
                        ? 'border-amber-500/50 bg-amber-950/20 hover:border-amber-400'
                        : 'border-[#1E3A5F]/70 bg-[#050B14]/70 hover:border-cyan-500/40 hover:bg-[#0B132B]'
                  }`}
              >
                {/* Active selection dot */}
                {isSelected && (
                  <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                )}

                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border ${isSelected
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                        : isCritical
                          ? 'border-red-500/40 bg-red-500/15 text-red-400'
                          : isWarning
                            ? 'border-amber-500/40 bg-amber-500/15 text-amber-400'
                            : 'border-[#1E3A5F] bg-[#0B132B] text-slate-400 group-hover:text-cyan-300'
                      }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-mono font-bold text-white truncate group-hover:text-cyan-300">
                      {organ.name}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 truncate block">
                      {organ.primaryMetric?.value} {organ.primaryMetric?.unit}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] font-mono border-t border-[#1E3A5F]/40 pt-1.5">
                  <span
                    className={`font-bold uppercase ${isCritical
                        ? 'text-red-400'
                        : isWarning
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                  >
                    ● {organ.status}
                  </span>
                  <span className="text-slate-400 font-bold">
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
