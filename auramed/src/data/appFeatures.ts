export type FeatureCategory = 'all' | 'medical' | 'ai-comms' | 'resilience';

export interface AppFeatureItem {
  id: string;
  index: string;
  category: Exclude<FeatureCategory, 'all'>;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  metricLabel: string;
  metricValue: string;
  cardBg: string;
  tilt: string;
}

export const FEATURE_CATEGORIES: { id: FeatureCategory; label: string }[] = [
  { id: 'all', label: 'All 6 Modules' },
  { id: 'medical', label: 'Medical & 2D Atlas' },
  { id: 'ai-comms', label: 'AI & Mars Comms' },
  { id: 'resilience', label: 'Quests & Mindset' },
];

export const APP_FEATURES: AppFeatureItem[] = [
  {
    id: 'two-min-checkin',
    index: '01',
    category: 'medical',
    badge: '2-Min Self-Assessment',
    title: '6-Vital Check-In & Live ECG',
    subtitle: 'Heart Rate · BP · Glucose · Temp · Sleep · Mood',
    description:
      'Astronauts log six baseline metrics in under two minutes while continuous 500Hz ECG, SpO2, respiration, and HRV RMSSD stream to mission health scorecards.',
    highlights: [
      'Real-time holographic ECG canvas trace',
      '10-packet telemetry batching & trend arrows',
      'Instant Nominal, Warning, and Critical status',
    ],
    metricLabel: 'Check-In Time',
    metricValue: '2 min',
    cardBg: 'bg-[#fff9c4] dark:bg-[#0c0c10]',
    tilt: 'sm:-rotate-1',
  },
  {
    id: 'interactive-body-atlas',
    index: '02',
    category: 'medical',
    badge: '2.4x Focal Zoom',
    title: 'Interactive 2D Organ Atlas',
    subtitle: '14 Physiological Systems · Green / Yellow / Red',
    description:
      'Tap any hotspot across 14 organs—heart, lungs, brain, kidneys, liver, spine—to zoom 2.4× and inspect NASA STD-3001 limits with step-by-step triage.',
    highlights: [
      'Answers: Why it changed & what to do now',
      'Clear trigger: When to call Flight Surgeon',
      'Color-coded live status across every organ',
    ],
    metricLabel: 'Monitored Organs',
    metricValue: '14 Systems',
    cardBg: 'bg-white dark:bg-[#0c0c10]',
    tilt: 'sm:rotate-1',
  },
  {
    id: 'clinical-decision-engine',
    index: '03',
    category: 'ai-comms',
    badge: 'NASA STD-3001 Rules',
    title: 'AI Health Score & Checklists',
    subtitle: 'Multi-Risk Assessment · Guided Care Steps',
    description:
      'Combines astronaut vitals into a holistic mission readiness percentage and turns clinical findings into interactive medical checklists astronauts can mark off.',
    highlights: [
      'Actionable treatment & countermeasure steps',
      'Deep-assess mode for multi-organ risk trends',
      'Interactive checklist completion tracking',
    ],
    metricLabel: 'Readiness Index',
    metricValue: '0–100%',
    cardBg: 'bg-[#e5e0d8] dark:bg-[#16161a]',
    tilt: 'sm:-rotate-1',
  },
  {
    id: 'offline-rag-houston-comms',
    index: '04',
    category: 'ai-comms',
    badge: '>20m Blackout Safe',
    title: 'Edge RAG Advisor & Ground Link',
    subtitle: 'Offline NASA Fallback · Voice STT · Queue Sync',
    description:
      'Built for deep-space 20+ minute signal delays. Runs Artemis clinical RAG guidance offline with hands-free Speech-to-Text and syncs encrypted packets once linked.',
    highlights: [
      'Citations from NASA STD-3001 & Artemis manuals',
      'Speech-to-Text dictation for EVA gloves',
      'Automatic offline queue sync with Houston',
    ],
    metricLabel: 'Delay Tolerance',
    metricValue: '20+ min',
    cardBg: 'bg-white dark:bg-[#0c0c10]',
    tilt: 'sm:rotate-1',
  },
  {
    id: 'health-quests-cognitive',
    index: '05',
    category: 'resilience',
    badge: 'Zero Penalty Loop',
    title: 'Health Quests & Cognitive Games',
    subtitle: '100 Rank Tiers · Space Reflex · Alien Memory',
    description:
      'Protects organ shields through daily exercise and check-in quests from Cadet to Commander across 100 ranks—rewarding consistent care, never punishing illness.',
    highlights: [
      'Space Reflex: millisecond neuro-motor trainer',
      'Alien Memory: 4×4 spatial recall across 100 levels',
      '10 rank tiers (Bronze to Mythic Legend XP)',
    ],
    metricLabel: 'Progression Ladder',
    metricValue: '100 Ranks',
    cardBg: 'bg-[#fff9c4] dark:bg-[#0c0c10]',
    tilt: 'sm:-rotate-1',
  },
  {
    id: 'earth-memories-aurabot',
    index: '06',
    category: 'resilience',
    badge: 'Crew Psychology',
    title: 'Earth Capsule & AuraBot Companion',
    subtitle: 'Isolation Defense · Return Journal · Voice Prompts',
    description:
      'Combats deep-space isolation with the Life Style on Earth memory journal and Return Capsule, supported by AuraBot’s draggable hydration, O2, and exercise reminders.',
    highlights: [
      'Searchable journal for family, places & moods',
      'Return Capsule unlocked on atmospheric re-entry',
      'Draggable AuraBot floating chat & tips',
    ],
    metricLabel: 'Crew Morale',
    metricValue: 'Protected',
    cardBg: 'bg-[#e5e0d8] dark:bg-[#16161a]',
    tilt: 'sm:rotate-1',
  },
];

export function filterAppFeatures(category: FeatureCategory): AppFeatureItem[] {
  if (category === 'all') {
    return APP_FEATURES;
  }
  return APP_FEATURES.filter((item) => item.category === category);
}
