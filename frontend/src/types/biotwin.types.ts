export type StatusType = 'nominal' | 'warning' | 'critical';
export type OrganStatus = StatusType;

export type AnatomicalLayer = 'visceral' | 'neural' | 'vascular' | 'muscular' | 'skeletal' | 'cardiovascular';

export type ViewPerspective = 'anterior' | 'posterior';

export type ShaderMode = 'holographic' | 'thermal_heatmap' | 'radiation_flux';

export type OrganStatusFilter = 'all' | 'nominal' | 'warning' | 'critical';

export type OrganId =
  | 'brain'
  | 'eyes'
  | 'carotid_jugular'
  | 'heart'
  | 'lungs'
  | 'liver'
  | 'kidneys'
  | 'gastrointestinal'
  | 'spine'
  | 'muscular_core'
  | 'upper_limbs'
  | 'lower_limbs';

export interface SecondaryMetric {
  id?: string;
  name?: string;
  label?: string;
  value: string | number;
  unit?: string;
  status?: StatusType;
  normalRange?: string;
  changeRate?: string;
}

export interface TrendPoint {
  time: string;
  value?: number;
  score?: number;
  metricValue?: number;
}

export interface MicrogravityDossier {
  title: string;
  description: string;
  mechanism: string;
  severity?: 'Mild' | 'Moderate' | 'Severe' | 'Compensated' | 'Nominal';
}

export interface RadiationSensitivity {
  level: 'Low' | 'Moderate' | 'High' | 'Extreme';
  scorePercent?: number;
  badgeColor?: string;
  details: string;
}

export interface CountermeasureItem {
  name: string;
  type: string;
  protocol: string;
  frequency?: string;
}

export interface ClinicalNote {
  id: number;
  author: string;
  role: string;
  timestamp: string;
  text: string;
}

export interface OrganDiagnosticData {
  id: string; // OrganId or string
  slug?: string;
  name: string;
  system: string;
  status: StatusType;
  score?: number; // 0-100
  healthScore?: number; // 0-100
  category?: string;
  primaryMetric: {
    name?: string;
    label?: string;
    value: string | number;
    unit?: string;
    nominalRange?: string;
  };
  secondaryMetrics: SecondaryMetric[];
  microgravityAdaptation?: MicrogravityDossier;
  radiationSensitivity?: RadiationSensitivity;
  countermeasures?: CountermeasureItem[];
  trend24h?: TrendPoint[];
  trend?: TrendPoint[];
  notes?: ClinicalNote[];
  clinicalNotes?: string;
  radiationAbsorbedDoseMgy?: number;
  temperatureCelsius?: number;
  layer?: AnatomicalLayer;
}

export interface BioTwinCrewMember {
  id: number;
  uuid?: string;
  callsign: string;
  name: string;
  role: string;
  zone: string;
  hr: number;
  spo2: number;
  status: StatusType;
  eva_hours?: number;
  syncStatus?: 'synced' | 'syncing' | 'delayed';
  lastSyncTime?: string;
}

export interface BioTwinSummary {
  overallHealthScore: number;
  status: StatusType;
  activeAnomaliesCount: number;
  radiationExposureMsv: number;
  microgravityAdaptationIndex: number;
  lastDownlinkTimestamp: string;
}

export interface BioTwinResponse {
  astronaut: BioTwinCrewMember;
  organs: OrganDiagnosticData[];
  summary: BioTwinSummary;
}

export interface BodyLandmarkPin {
  organId: OrganId | string;
  label: string;
  system: string;
  status: StatusType;
  value: string;
  unit?: string;
  side: 'left' | 'right';
  anchor: {
    x: number;
    y: number;
  };
}

export interface ActiveLayersState {
  visceral: boolean;
  neural: boolean;
  vascular: boolean;
  muscular: boolean;
  skeletal: boolean;
  cardiovascular?: boolean;
}
