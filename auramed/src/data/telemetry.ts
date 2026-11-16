export type MissionMode = 'NOMINAL' | 'EVA' | 'SOLAR_ALERT';

export type TelemetryStatus = 'NOMINAL' | 'ELEVATED' | 'CRITICAL';

export interface CrewProfile {
  id: string;
  callsign: string;
  name: string;
  role: string;
  stationZone: string;
  baselineHr: number;
  baselineSpo2: number;
  baselineCoreTempC: number;
  baselineSuitKpa: number;
  baselineRadiationMsv: number;
}

export interface ComputedTelemetry {
  crew: CrewProfile;
  mode: MissionMode;
  heartRateBpm: number;
  spo2Percent: number;
  suitPressureKpa: number;
  coreTempC: number;
  radiationMsvHr: number;
  downlinkLatencyMs: number;
  status: TelemetryStatus;
  statusNote: string;
}

export interface MonitoringService {
  index: string;
  id: string;
  title: string;
  tags: string[];
  summary: string;
  cadence: string;
  thresholdRule: string;
  redundancy: string;
}

export interface DeploymentRequestInput {
  fullName: string;
  email: string;
  organization: string;
  missionScope: string;
}

export interface DeploymentValidationErrors {
  fullName?: string;
  email?: string;
  organization?: string;
}

export const CREW_PROFILES: CrewProfile[] = [
  {
    id: 'vance',
    callsign: 'CDR-01',
    name: 'ELENA VANCE',
    role: 'MISSION COMMANDER',
    stationZone: 'QUEST AIRLOCK / EVA-1',
    baselineHr: 68,
    baselineSpo2: 98.6,
    baselineCoreTempC: 36.8,
    baselineSuitKpa: 101.3,
    baselineRadiationMsv: 0.042,
  },
  {
    id: 'chen',
    callsign: 'PLT-02',
    name: 'MARCUS CHEN',
    role: 'ORBITAL PILOT',
    stationZone: 'CUPOLA FLIGHT DECK',
    baselineHr: 64,
    baselineSpo2: 99.1,
    baselineCoreTempC: 36.7,
    baselineSuitKpa: 101.3,
    baselineRadiationMsv: 0.038,
  },
  {
    id: 'patel',
    callsign: 'SPC-03',
    name: 'ARYA PATEL',
    role: 'BIOMED SPECIALIST',
    stationZone: 'COLUMBUS LAB MODULE',
    baselineHr: 72,
    baselineSpo2: 98.9,
    baselineCoreTempC: 36.9,
    baselineSuitKpa: 101.2,
    baselineRadiationMsv: 0.04,
  },
];

export const MONITORING_SERVICES: MonitoringService[] = [
  {
    index: '01',
    id: 'cardiac-telemetry',
    title: 'ZERO-G CARDIAC ARRAY',
    tags: ['500HZ ECG', 'HRV DRIFT', 'ORTHOSTATIC'],
    summary:
      'Continuous 12-lead dry-electrode ECG integrated directly into flight undergarments for early arrhythmia and autonomic shift detection.',
    cadence: '500 Hz continuous · 2 ms frame window',
    thresholdRule: 'Alert when HR > 135 bpm sustained 20s or HRV RMSSD drops > 35%',
    redundancy: 'Dual S-Band + optical inter-satellite buffer with 72h onboard flash',
  },
  {
    index: '02',
    id: 'eva-suit-diagnostics',
    title: 'EVA SUIT BIOMETRICS',
    tags: ['PLSS O2', 'CO2 SCRUBBER', 'THERMAL LOOP'],
    summary:
      'Synchronized suit pressure, partial oxygen saturation, and liquid-cooling garment delta tracking during extravehicular spacewalks.',
    cadence: '50 Hz pressure & O2 · 10 Hz thermal loop',
    thresholdRule: 'Alert when Suit Pressure < 28.5 kPa or SpO2 < 94.0%',
    redundancy: 'Triple-voted differential MEMS transducers inside PLSS manifold',
  },
  {
    index: '03',
    id: 'radiation-dosimetry',
    title: 'SOLAR DOSE TELEMETRY',
    tags: ['SPE FLUX', 'TISSUE REM', 'SHIELD ALERT'],
    summary:
      'Real-time charged-particle spectroscopy estimating cumulative bone-marrow and ocular lens dose during solar proton events.',
    cadence: '1 Hz solid-state silicon telescope sweep',
    thresholdRule: 'Critical warning when flux exceeds 0.45 mSv/hr outside storm shelter',
    redundancy: 'Co-located helmet + torso active dosimeters calibrated pre-launch',
  },
  {
    index: '04',
    id: 'neuro-circadian',
    title: 'HYPOXIA & COGNITION',
    tags: ['CEREBRAL SPO2', 'SLEEP PHASE', 'MICRO-SLEEP'],
    summary:
      'Near-infrared spectroscopy paired with pupillometry to detect subtle hypercapnia, sleep fragmentation, and fatigue prior to docking maneuvers.',
    cadence: '25 Hz fNIRS prefrontal oxygenation sampling',
    thresholdRule: 'Elevated state when regional rSO2 drops > 8% below crew baseline',
    redundancy: 'Automated local edge inference when Earth link enters LOS blackout',
  },
];

export function computeCrewTelemetry(crewId: string, mode: MissionMode): ComputedTelemetry {
  const crew = CREW_PROFILES.find((item) => item.id === crewId) ?? CREW_PROFILES[0];

  let heartRateBpm = crew.baselineHr;
  let spo2Percent = crew.baselineSpo2;
  let suitPressureKpa = crew.baselineSuitKpa;
  let coreTempC = crew.baselineCoreTempC;
  let radiationMsvHr = crew.baselineRadiationMsv;
  let downlinkLatencyMs = 240;

  if (mode === 'EVA') {
    heartRateBpm = Math.round(crew.baselineHr * 1.48);
    spo2Percent = Number((crew.baselineSpo2 - 1.4).toFixed(1));
    suitPressureKpa = 29.6; // Standard 4.3 psi pure-O2 EVA suit pressure
    coreTempC = Number((crew.baselineCoreTempC + 0.6).toFixed(1));
    radiationMsvHr = Number((crew.baselineRadiationMsv * 3.8).toFixed(3));
    downlinkLatencyMs = 310;
  } else if (mode === 'SOLAR_ALERT') {
    heartRateBpm = Math.round(crew.baselineHr * 1.72);
    spo2Percent = Number((crew.baselineSpo2 - 3.9).toFixed(1));
    suitPressureKpa = 28.1;
    coreTempC = Number((crew.baselineCoreTempC + 1.1).toFixed(1));
    radiationMsvHr = Number((crew.baselineRadiationMsv * 14.5).toFixed(3));
    downlinkLatencyMs = 680;
  }

  let status: TelemetryStatus = 'NOMINAL';
  let statusNote = 'ALL BIOMETRIC CHANNELS WITHIN FLIGHT SURGEON LIMITS';

  if (radiationMsvHr >= 0.45 || spo2Percent < 95.0 || suitPressureKpa < 28.5) {
    status = 'CRITICAL';
    statusNote = 'SOLAR PARTICLE FLUX & SUIT O2 MARGIN REQUIRE SHELTER PROTOCOL';
  } else if (heartRateBpm >= 95 || suitPressureKpa < 50) {
    status = 'ELEVATED';
    statusNote = 'ACTIVE EVA EXERTION · SUIT OPERATING ON 29.6 KPA PURE O2 LOOP';
  }

  return {
    crew,
    mode,
    heartRateBpm,
    spo2Percent,
    suitPressureKpa,
    coreTempC,
    radiationMsvHr,
    downlinkLatencyMs,
    status,
    statusNote,
  };
}

export function generateEcgWaveformPath(
  heartRateBpm: number,
  phaseOffset: number,
  width: number,
  height: number,
  samples = 140
): string {
  const safeWidth = Math.max(width, 100);
  const safeHeight = Math.max(height, 40);
  const midY = safeHeight * 0.56;
  const cyclesPerView = Math.max(2, Math.min(5.5, (heartRateBpm / 60) * 2.4));

  const points: string[] = [];

  for (let i = 0; i <= samples; i++) {
    const progress = i / samples;
    const x = Number((progress * safeWidth).toFixed(2));
    const cyclePhase = (progress * cyclesPerView + phaseOffset) % 1;

    let amplitude = 0;
    if (cyclePhase > 0.1 && cyclePhase < 0.2) {
      // P wave
      amplitude = Math.sin(((cyclePhase - 0.1) / 0.1) * Math.PI) * 0.16;
    } else if (cyclePhase >= 0.28 && cyclePhase < 0.32) {
      // Q dip
      amplitude = -Math.sin(((cyclePhase - 0.28) / 0.04) * Math.PI) * 0.22;
    } else if (cyclePhase >= 0.32 && cyclePhase < 0.37) {
      // R spike
      amplitude = Math.sin(((cyclePhase - 0.32) / 0.05) * Math.PI) * 0.92;
    } else if (cyclePhase >= 0.37 && cyclePhase < 0.42) {
      // S dip
      amplitude = -Math.sin(((cyclePhase - 0.37) / 0.05) * Math.PI) * 0.32;
    } else if (cyclePhase >= 0.52 && cyclePhase < 0.68) {
      // T wave
      amplitude = Math.sin(((cyclePhase - 0.52) / 0.16) * Math.PI) * 0.25;
    }

    const y = Number((midY - amplitude * (safeHeight * 0.44)).toFixed(2));
    points.push(`${i === 0 ? 'M' : 'L'}${x},${y}`);
  }

  return points.join(' ');
}

export function validateDeploymentRequest(
  input: DeploymentRequestInput
): DeploymentValidationErrors {
  const errors: DeploymentValidationErrors = {};
  const trimmedName = input.fullName.trim();
  const trimmedEmail = input.email.trim();
  const trimmedOrg = input.organization.trim();

  if (trimmedName.length < 2) {
    errors.fullName = 'Enter the flight surgeon or mission lead name (min 2 characters).';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail)) {
    errors.email = 'Enter a valid agency or mission operations email address.';
  }

  if (trimmedOrg.length < 2) {
    errors.organization = 'Specify your space agency, contractor, or orbital program.';
  }

  return errors;
}

export function createMissionTicketId(email: string, organization: string): string {
  const seed = `${email.trim().toLowerCase()}|${organization.trim().toLowerCase()}`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const code = (hash >>> 0).toString(36).toUpperCase().slice(0, 6).padStart(6, '0');
  return `AM-${code}`;
}
