export type CameraPresetId = 'astronaut' | 'station' | 'capsule' | 'orbit' | 'exploded';

export type SubsystemHitId = 'helmet' | 'chest-ecg' | 'plss' | 'spacecraft' | 'capsule';

export interface CameraPreset {
  id: CameraPresetId;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
  defaultExplode: number;
}

export interface SubsystemInspectorInfo {
  id: SubsystemHitId;
  code: string;
  title: string;
  metric: string;
  detail: string;
}

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'astronaut',
    label: 'EVA Astronaut',
    position: [0.4, 0.7, 5.4],
    target: [0, 0.25, 0],
    defaultExplode: 0,
  },
  {
    id: 'station',
    label: 'NASA Module',
    position: [4.8, 2.2, 7.6],
    target: [-2.1, 0.55, -3.5],
    defaultExplode: 0,
  },
  {
    id: 'capsule',
    label: 'Crew Capsule',
    position: [2.2, 2.0, 4.6],
    target: [4.4, 1.3, -3.1],
    defaultExplode: 0,
  },
  {
    id: 'orbit',
    label: 'Earth & Moon',
    position: [-5.2, 3.0, 10.6],
    target: [0.2, 0.1, -2.5],
    defaultExplode: 0,
  },
  {
    id: 'exploded',
    label: 'Exploded Suit',
    position: [2.8, 1.1, 4.9],
    target: [0, 0.35, 0],
    defaultExplode: 1,
  },
];

export const SUBSYSTEM_INFO: Record<SubsystemHitId, SubsystemInspectorInfo> = {
  helmet: {
    id: 'helmet',
    code: 'EVA-VISOR · 01',
    title: 'GOLD ATTENUATION VISOR & HUD',
    metric: '1.2% UV TRANSMITTANCE · HEADS-UP O2',
    detail:
      'Vapor-deposited gold polycarbonate shield paired with retinal-safe micro-OLED SpO2 and suit pressure projections.',
  },
  'chest-ecg': {
    id: 'chest-ecg',
    code: 'DCM-BIOMED · 02',
    title: 'CHEST TELEMETRY & 500HZ ECG',
    metric: '12-LEAD DRY ELECTRODE · 2 MS WINDOW',
    detail:
      'Armored Display & Control Module housing the AuraMed arrhythmia processor and tactile emergency O2 purge valve.',
  },
  plss: {
    id: 'plss',
    code: 'PLSS-PACK · 03',
    title: 'LIFE SUPPORT & SAFER THRUSTERS',
    metric: '29.6 KPA PURE O2 · DUAL S-BAND',
    detail:
      'Primary Portable Life Support System with dual high-pressure oxygen cylinders, CO2 amine bed, and SAFER nitrogen rescue jets.',
  },
  spacecraft: {
    id: 'spacecraft',
    code: 'HAB-NODE · 04',
    title: 'NASA ORBITAL HABITAT & CUPOLA',
    metric: '408 KM LEO · 48 KW PHOTOVOLTAIC',
    detail:
      'Pressurized orbital docking module, cupola observation deck, and twin solar arrays receiving encrypted biometric packets.',
  },
  capsule: {
    id: 'capsule',
    code: 'ORION-CREW · 05',
    title: 'CREW TRANSFER VEHICLE & HEATSHIELD',
    metric: 'MACH 25 TPS · 4X RCS QUADS',
    detail:
      'Autonomous crew return capsule on orbital station-keeping approach with carbon-phenolic heatshield and telemetry relay.',
  },
};

export function getCameraPreset(id: CameraPresetId): CameraPreset {
  return CAMERA_PRESETS.find((preset) => preset.id === id) ?? CAMERA_PRESETS[0];
}

export function clampCameraZoom(distance: number, minDist = 2.6, maxDist = 16): number {
  return Math.max(minDist, Math.min(maxDist, Number(distance.toFixed(3))));
}

export function computeExplodedOffsets(explodeFactor: number): {
  helmetY: number;
  visorZ: number;
  chestZ: number;
  plssZ: number;
  leftArmX: number;
  rightArmX: number;
} {
  const clamped = Math.max(0, Math.min(1, explodeFactor));
  return {
    helmetY: Number((clamped * 0.65).toFixed(4)),
    visorZ: Number((clamped * 0.52).toFixed(4)),
    chestZ: Number((clamped * 0.45).toFixed(4)),
    plssZ: Number((-clamped * 0.72).toFixed(4)),
    leftArmX: Number((-clamped * 0.48).toFixed(4)),
    rightArmX: Number((clamped * 0.48).toFixed(4)),
  };
}
