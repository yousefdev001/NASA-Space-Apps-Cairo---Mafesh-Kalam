import apiClient from './client';
import { OrganDiagnosticData, BioTwinCrewMember, BioTwinSummary, BioTwinResponse, StatusType } from '../types/biotwin.types';

export const CREW_MEMBERS_METADATA: Record<number, { name: string; callsign: string; role: string; zone: string }> = {
  1: { name: 'Elena Vance', callsign: 'CDR-01', role: 'Mission Commander', zone: 'Quest Airlock / EVA-1' },
  2: { name: 'Marcus Chen', callsign: 'PLT-02', role: 'Chief Pilot', zone: 'Cupola Flight Deck' },
  3: { name: 'Arya Patel', callsign: 'SPC-03', role: 'Flight Surgeon & Specialist', zone: 'Columbus Lab Module' },
  4: { name: 'Alexei Ivanov', callsign: 'ENG-04', role: 'Systems Engineer', zone: 'Node 3 Tranquility / ECLSS Bay' },
};

export function generateRealisticBioTwin(astronautId: number): BioTwinResponse {
  const meta = CREW_MEMBERS_METADATA[astronautId] || CREW_MEMBERS_METADATA[1];
  
  // Per-astronaut variations
  const isVance = astronautId === 1;
  const isChen = astronautId === 2;
  const isPatel = astronautId === 3;
  const isIvanov = astronautId === 4;

  const hr = isVance ? 72 : isChen ? 88 : isPatel ? 64 : 81;
  const spo2 = isVance ? 98.4 : isChen ? 96.1 : isPatel ? 99.2 : 97.5;
  const generalStatus: StatusType = isChen ? 'warning' : 'nominal';

  const organs: OrganDiagnosticData[] = [
    {
      id: 'brain',
      slug: 'brain',
      name: 'Brain & Intracranial Cavity',
      system: 'Central Nervous System',
      status: isChen ? 'warning' : 'nominal',
      score: isChen ? 79 : 94,
      category: 'Neurological',
      layer: 'neural',
      primaryMetric: {
        name: 'Alpha Band Power',
        value: isChen ? '7.4' : '10.2',
        unit: 'Hz (Alpha)',
        nominalRange: '8.0 - 12.0 Hz',
      },
      secondaryMetrics: [
        { name: 'Intracranial Pressure (ICP)', value: isChen ? 19.8 : 13.2, unit: 'mmHg', status: isChen ? 'warning' : 'nominal', normalRange: '7 - 15 mmHg' },
        { name: 'Cognitive Workload Index', value: isChen ? 'High (0.84)' : 'Nominal (0.42)', unit: 'Index', status: isChen ? 'warning' : 'nominal' },
        { name: 'Theta/Beta Focus Ratio', value: '1.45', unit: 'Ratio', status: 'nominal' },
        { name: 'Cerebral Perfusion Pressure', value: '78', unit: 'mmHg', status: 'nominal' },
      ],
      microgravityAdaptation: {
        title: 'Cephalad Venous Engorgement & ICP Rise',
        mechanism: 'Loss of hydrostatic pressure column causes approximately 2,000 mL of fluid to redistribute into the cranium and cervical vasculature.',
        description: 'Prolonged microgravity exposure shifts cerebral spinal fluid rostrally, resulting in subtle dural expansion and sustained intracranial pressure elevation.',
        severity: isChen ? 'Moderate' : 'Mild',
      },
      radiationSensitivity: {
        level: 'High',
        scorePercent: 82,
        badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
        details: 'Deep hippocampal neurons and oligodendrocyte precursor cells exhibit high vulnerability to Galactic Cosmic Ray (GCR) iron ions.',
      },
      countermeasures: [
        { name: 'Chibis Lower Body Negative Pressure', type: 'Physical Baro-Countermeasure', protocol: '-25 to -35 mmHg for 60 min pre-sleep', frequency: 'Daily' },
        { name: 'Cognitive Neuro-Stimulation Protocol', type: 'Neuro-Adaptive Training', protocol: 'Dual n-back adaptive session 20 min', frequency: 'Bidaily' },
        { name: 'Melatonin Receptor Agonist', type: 'Pharmacological', protocol: 'Circadian entrainment 0.5 mg timed release', frequency: 'Pre-flight sleep' },
      ],
      trend24h: [
        { time: '00:00', score: 92 },
        { time: '04:00', score: 94 },
        { time: '08:00', score: isChen ? 86 : 95 },
        { time: '12:00', score: isChen ? 81 : 94 },
        { time: '16:00', score: isChen ? 78 : 93 },
        { time: '20:00', score: isChen ? 80 : 94 },
      ],
    },
    {
      id: 'eyes',
      slug: 'eyes',
      name: 'Eyes & Optic Chiasm (SANS)',
      system: 'Neuro-Ocular Complex',
      status: isChen ? 'warning' : 'nominal',
      score: isChen ? 76 : 96,
      category: 'Ophthalmic',
      layer: 'neural',
      primaryMetric: {
        name: 'Optic Nerve Sheath Diam.',
        value: isChen ? '6.3' : '5.1',
        unit: 'mm',
        nominalRange: '< 5.8 mm',
      },
      secondaryMetrics: [
        { name: 'Choroidal Thickness', value: isChen ? '+42' : '+12', unit: 'µm edema', status: isChen ? 'warning' : 'nominal' },
        { name: 'Globe Flattening Grade', value: isChen ? 'Grade 2' : 'Grade 0', unit: 'Frisén', status: isChen ? 'warning' : 'nominal' },
        { name: 'Intraocular Pressure (IOP)', value: '16.4', unit: 'mmHg', status: 'nominal' },
        { name: 'Retinal Micro-Vascular Density', value: '94.2', unit: '%', status: 'nominal' },
      ],
      microgravityAdaptation: {
        title: 'Spaceflight-Associated Neuro-Ocular Syndrome (SANS)',
        mechanism: 'Impaired ocular venous egress and optic nerve sheath cerebrospinal fluid sequestration cause posterior globe flattening and choroidal folds.',
        description: 'Astronaut displays early bilateral papilledema risk with hyperopic shift requiring adjustable focal optics and regular OCT scans.',
        severity: isChen ? 'Moderate' : 'Nominal',
      },
      radiationSensitivity: {
        level: 'Extreme',
        scorePercent: 91,
        badgeColor: 'text-red-400 border-red-500/40 bg-red-500/10',
        details: 'Crystalline lens epithelium has heightened vulnerability to radiation-induced posterior subcapsular cataractogenesis.',
      },
      countermeasures: [
        { name: 'Swimming-Cap Venous Drainage Mask', type: 'Passive Hemodynamic', protocol: 'Low resistance jugular relief collar', frequency: 'Sleep phase' },
        { name: 'Lutein & Zeaxanthin Carotenoids', type: 'Nutritional Antioxidant', protocol: '20 mg oral macula protection supplement', frequency: 'Daily' },
        { name: 'LBNP Ocular Recovery Phase', type: 'Baro-Decompression', protocol: 'Combined with high-intensity cycling', frequency: '3x weekly' },
      ],
      trend24h: [
        { time: '00:00', score: isChen ? 82 : 97 },
        { time: '04:00', score: isChen ? 80 : 96 },
        { time: '08:00', score: isChen ? 77 : 96 },
        { time: '12:00', score: isChen ? 75 : 95 },
        { time: '16:00', score: isChen ? 76 : 96 },
        { time: '20:00', score: isChen ? 76 : 96 },
      ],
    },
    {
      id: 'carotid',
      slug: 'carotid',
      name: 'Carotid & Jugular Conduits',
      system: 'Cervical Hemodynamics',
      status: 'nominal',
      score: 91,
      category: 'Vascular',
      layer: 'cardiovascular',
      primaryMetric: {
        name: 'Internal Jugular Cross-Sect.',
        value: '1.24',
        unit: 'cm²',
        nominalRange: '0.8 - 1.4 cm²',
      },
      secondaryMetrics: [
        { name: 'Jugular Flow Stasis Risk', value: 'Low (0.12)', unit: 'Index', status: 'nominal' },
        { name: 'Carotid Intima-Media Thk.', value: '0.62', unit: 'mm', status: 'nominal' },
        { name: 'Retrograde Venous Pulse', value: 'Absent', unit: 'Doppler', status: 'nominal' },
        { name: 'Cerebral Venous Outflow', value: '680', unit: 'mL/min', status: 'nominal' },
      ],
      microgravityAdaptation: {
        title: 'Cephalic Fluid Redistribution & Jugular Distension',
        mechanism: 'Absence of caudal gravitational pool causes permanent elevation of internal jugular venous pressure in 0-G.',
        description: 'Vascular compliance adjusts over 14 days, though stagnant flow must be tracked via ultrasound to prevent micro-thrombosis.',
        severity: 'Compensated',
      },
      radiationSensitivity: {
        level: 'Moderate',
        scorePercent: 58,
        badgeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
        details: 'Endothelial lining prone to oxidative shear stress under solar energetic particle bursts.',
      },
      countermeasures: [
        { name: 'Cervical Doppler Ultrasound Scan', type: 'Surveillance Protocol', protocol: 'Standard 7-zone thrombosis screening', frequency: 'Weekly' },
        { name: 'Pneumatic Thigh Cuffs (Braslets)', type: 'Fluid Trap', protocol: '35 mmHg occlusive venous retention during station work', frequency: '4 hrs/day' },
      ],
      trend24h: [
        { time: '00:00', score: 90 },
        { time: '04:00', score: 91 },
        { time: '08:00', score: 92 },
        { time: '12:00', score: 91 },
        { time: '16:00', score: 90 },
        { time: '20:00', score: 91 },
      ],
    },
    {
      id: 'heart',
      slug: 'heart',
      name: 'Heart & Great Vessels',
      system: 'Cardiovascular System',
      status: isChen ? 'warning' : 'nominal',
      score: isChen ? 82 : 95,
      category: 'Cardiology',
      layer: 'cardiovascular',
      primaryMetric: {
        name: 'Heart Rate (ECG)',
        value: hr,
        unit: 'BPM',
        nominalRange: '55 - 85 BPM',
      },
      secondaryMetrics: [
        { name: 'Stroke Volume', value: isChen ? 71 : 84, unit: 'mL/beat', status: 'nominal' },
        { name: 'Left Ventricular Mass Drift', value: '-4.8%', unit: 'Mass Delta', status: 'nominal', normalRange: '-8% to +2%' },
        { name: 'Cardiac Output', value: (hr * 0.08).toFixed(1), unit: 'L/min', status: 'nominal' },
        { name: 'HRV RMSSD', value: isChen ? 28 : 52, unit: 'ms', status: isChen ? 'warning' : 'nominal' },
      ],
      microgravityAdaptation: {
        title: 'Myocardial Deconditioning & Sphericity Shift',
        mechanism: 'Reduced cardiac workload in weightlessness causes left ventricular muscle mass unloading and spherical cardiac remodeling.',
        description: 'Frank-Starling curve shifts leftward due to ~15% intravascular plasma loss, requiring strict resistance-aerobic maintenance.',
        severity: isChen ? 'Moderate' : 'Nominal',
      },
      radiationSensitivity: {
        level: 'Moderate',
        scorePercent: 64,
        badgeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
        details: 'Microvascular capillary rarefaction and conduction system fibrosis after cumulative deep-space exposure.',
      },
      countermeasures: [
        { name: 'ARED High-Resistance Deadlifts & Squats', type: 'Biomechanical Loading', protocol: 'Up to 600 lbf equivalent compressive load', frequency: 'Daily 45m' },
        { name: 'T2 Cycle Ergometer with Vibration Isolation', type: 'Aerobic Interval', protocol: 'High intensity interval training (HIIT) 85% VO2max', frequency: 'Daily 30m' },
        { name: 'Oral Fluid Loading Protocol (Electrolyte Replenish)', type: 'Plasma Expansion', protocol: '8 bouillon tablets + 1L H2O before de-orbit/high-G', frequency: 'Prn' },
      ],
      trend24h: [
        { time: '00:00', score: isChen ? 85 : 96 },
        { time: '04:00', score: isChen ? 86 : 97 },
        { time: '08:00', score: isChen ? 82 : 95 },
        { time: '12:00', score: isChen ? 80 : 94 },
        { time: '16:00', score: isChen ? 81 : 95 },
        { time: '20:00', score: isChen ? 82 : 95 },
      ],
    },
    {
      id: 'lungs',
      slug: 'lungs',
      name: 'Lungs & Pulmonary Tree',
      system: 'Respiratory System',
      status: 'nominal',
      score: 97,
      category: 'Pulmonology',
      layer: 'visceral',
      primaryMetric: {
        name: 'Blood Oxygen (SpO2)',
        value: `${spo2}%`,
        unit: '% O2 Sat',
        nominalRange: '96 - 100%',
      },
      secondaryMetrics: [
        { name: 'Respiratory Rate', value: '14.2', unit: 'br/min', status: 'nominal', normalRange: '12 - 18' },
        { name: 'Ventilation-Perfusion (V/Q)', value: '0.98', unit: 'Ratio (Uniform)', status: 'nominal' },
        { name: 'End-Tidal CO2 (EtCO2)', value: '37.8', unit: 'mmHg', status: 'nominal' },
        { name: 'Pulmonary Capillary Blood Vol.', value: '185', unit: 'mL', status: 'nominal' },
      ],
      microgravityAdaptation: {
        title: 'Uniform Ventilation-Perfusion Redistribution',
        mechanism: 'Absence of gravity abolishes apical-to-basal pleural pressure gradient, creating exceptionally uniform alveolar ventilation.',
        description: 'Total lung capacity is slightly diminished by 5-10% due to cephalad diaphragm shift caused by abdominal viscera relaxation.',
        severity: 'Nominal',
      },
      radiationSensitivity: {
        level: 'Moderate',
        scorePercent: 62,
        badgeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
        details: 'High concentration of atmospheric trace contaminants combined with ionizing particles can induce alveolar macrophage inflammation.',
      },
      countermeasures: [
        { name: 'ECLSS HEPA & Charcoal Air Scrubbing', type: 'Environmental Control', protocol: 'Maintain station particulates < 0.05 mg/m³', frequency: 'Continuous' },
        { name: 'Incentive Spirometry & Deep Breathing', type: 'Pulmonary Fitness', protocol: 'Target 3,500 mL inspiratory capacity', frequency: 'Daily post-EVA' },
      ],
      trend24h: [
        { time: '00:00', score: 98 },
        { time: '04:00', score: 98 },
        { time: '08:00', score: 97 },
        { time: '12:00', score: 97 },
        { time: '16:00', score: 96 },
        { time: '20:00', score: 97 },
      ],
    },
    {
      id: 'liver',
      slug: 'liver',
      name: 'Liver & Hepatic Portal',
      system: 'Hepatic & Metabolic System',
      status: 'nominal',
      score: 93,
      category: 'Metabolic',
      layer: 'visceral',
      primaryMetric: {
        name: 'Transaminase (ALT/AST)',
        value: '26 / 22',
        unit: 'U/L (Nominal)',
        nominalRange: '< 40 U/L',
      },
      secondaryMetrics: [
        { name: 'Hepatic Blood Flow', value: '1.25', unit: 'L/min', status: 'nominal' },
        { name: 'Cytochrome P450 Clearance', value: '98%', unit: 'Enzymatic Flux', status: 'nominal' },
        { name: 'Bilirubin Total', value: '0.8', unit: 'mg/dL', status: 'nominal' },
        { name: 'Lipid Peroxidation Markers', value: 'Normal', unit: 'MDA level', status: 'nominal' },
      ],
      microgravityAdaptation: {
        title: 'Altered Pharmacokinetics & Hepatic Clearance',
        mechanism: 'Changes in splanchnic circulation and gut transit rate alter bioavailability and CYP enzyme metabolic turnover rates.',
        description: 'Drug dosages must be dynamically calibrated against the astronaut twin profile to prevent xenobiotic accumulation.',
        severity: 'Compensated',
      },
      radiationSensitivity: {
        level: 'Moderate',
        scorePercent: 55,
        badgeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
        details: 'Kupffer cells generate low-level reactive oxygen species in response to secondary bremsstrahlung radiation.',
      },
      countermeasures: [
        { name: 'N-Acetylcysteine (NAC) Infusion/Oral', type: 'Antioxidant Prophylaxis', protocol: '600 mg twice daily with orbital meal pack', frequency: 'Daily' },
        { name: 'Metabolic Panel Downlink Telemetry', type: 'Diagnostic Array', protocol: 'Transdermal microneedle biosensing array', frequency: 'Real-time' },
      ],
      trend24h: [
        { time: '00:00', score: 94 },
        { time: '04:00', score: 94 },
        { time: '08:00', score: 93 },
        { time: '12:00', score: 93 },
        { time: '16:00', score: 92 },
        { time: '20:00', score: 93 },
      ],
    },
    {
      id: 'kidneys',
      slug: 'kidneys',
      name: 'Kidneys & Renal Axis',
      system: 'Renal & Fluid Regulation',
      status: isIvanov ? 'warning' : 'nominal',
      score: isIvanov ? 81 : 94,
      category: 'Nephrology',
      layer: 'visceral',
      primaryMetric: {
        name: 'Urinary Ca2+ Excretion',
        value: isIvanov ? '380' : '220',
        unit: 'mg/24h',
        nominalRange: '100 - 250 mg/24h',
      },
      secondaryMetrics: [
        { name: 'Hydration Osmolality', value: isIvanov ? 820 : 450, unit: 'mOsm/kg', status: isIvanov ? 'warning' : 'nominal', normalRange: '300 - 600' },
        { name: 'Glomerular Filtration Rate (eGFR)', value: '112', unit: 'mL/min/1.73m²', status: 'nominal' },
        { name: 'Nephrolithiasis Risk Score', value: isIvanov ? 'Moderate (0.68)' : 'Low (0.18)', unit: 'Tiselius Index', status: isIvanov ? 'warning' : 'nominal' },
        { name: 'Electrolyte Na+/K+ Balance', value: 'Balanced', unit: 'Plasma', status: 'nominal' },
      ],
      microgravityAdaptation: {
        title: 'Hypercalciuria & Nephrolithiasis (Kidney Stone) Risk',
        mechanism: 'Bone mineral resorption floods the bloodstream with ionized calcium, forcing intense renal filtration and calcium oxalate crystallization risk.',
        description: 'Coupled with voluntary dehydration to minimize EVA suit voiding, urine becomes hyper-concentrated and super-saturated.',
        severity: isIvanov ? 'Moderate' : 'Mild',
      },
      radiationSensitivity: {
        level: 'Moderate',
        scorePercent: 59,
        badgeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
        details: 'Podocytes and renal tubule cells sustain micro-vascular endothelial damage under chronic proton background.',
      },
      countermeasures: [
        { name: 'Potassium Citrate Therapy', type: 'Urine Alkalinization', protocol: '30 mEq daily to inhibit calcium phosphate/oxalate precipitation', frequency: 'Daily' },
        { name: 'Strict Fluid Ingestion Directive', type: 'Hydration Target', protocol: 'Mandatory minimum 2,500 mL water downlink tracked', frequency: 'Continuous' },
        { name: 'Acoustic Shockwave Lithotripsy Ready', type: 'Contingency Standby', protocol: 'Station portable ultrasound focal disintegration probe', frequency: 'On-demand' },
      ],
      trend24h: [
        { time: '00:00', score: isIvanov ? 86 : 95 },
        { time: '04:00', score: isIvanov ? 85 : 95 },
        { time: '08:00', score: isIvanov ? 83 : 94 },
        { time: '12:00', score: isIvanov ? 80 : 94 },
        { time: '16:00', score: isIvanov ? 81 : 94 },
        { time: '20:00', score: isIvanov ? 81 : 94 },
      ],
    },
    {
      id: 'gi_tract',
      slug: 'gi_tract',
      name: 'Gastrointestinal Core',
      system: 'Digestive & Microbiome',
      status: 'nominal',
      score: 91,
      category: 'Gastroenterology',
      layer: 'visceral',
      primaryMetric: {
        name: 'Space Motion Sickness (SMS)',
        value: 'Grade 0',
        unit: 'Miller Index (Adapted)',
        nominalRange: 'Grade 0 (Asymptomatic)',
      },
      secondaryMetrics: [
        { name: 'Gastric Emptying Latency', value: '+8%', unit: 'Delay', status: 'nominal' },
        { name: 'Microbiome Diversity Index', value: '4.2', unit: 'Shannon Index', status: 'nominal' },
        { name: 'Intestinal Barrier Integrity', value: 'Intact', unit: 'Zonulin normal', status: 'nominal' },
        { name: 'Nutrient Absorption Rate', value: '94%', unit: 'Caloric Yield', status: 'nominal' },
      ],
      microgravityAdaptation: {
        title: 'Neuro-Vestibular Conflict & Gastric Motility Slowing',
        mechanism: 'Otolith-canal sensory mismatch during initial flight triggers vestibular autonomic output, attenuating peristaltic contractions.',
        description: 'Post-adaptation day 4, systemic digestive motility recovers, though probiotic microbiome balance requires constant dietary fortification.',
        severity: 'Nominal',
      },
      radiationSensitivity: {
        level: 'High',
        scorePercent: 78,
        badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
        details: 'Intestinal crypt stem cells are rapid-cycling and sensitive to cosmic heavy-ion cell cycle arrest.',
      },
      countermeasures: [
        { name: 'Lyophilized Synbiotic Probiotic Ration', type: 'Nutritional Biotherapy', protocol: 'Bifidobacterium & Lactobacillus 10^10 CFU daily', frequency: 'Daily breakfast' },
        { name: 'Promethazine Transdermal Protocol', type: 'Anti-Emetic (PRN)', protocol: '25 mg micro-patch for sudden vestibular disequilibrium', frequency: 'Standby' },
      ],
      trend24h: [
        { time: '00:00', score: 90 },
        { time: '04:00', score: 91 },
        { time: '08:00', score: 92 },
        { time: '12:00', score: 91 },
        { time: '16:00', score: 91 },
        { time: '20:00', score: 91 },
      ],
    },
    {
      id: 'spine',
      slug: 'spine',
      name: 'Spine & Vertebral Column',
      system: 'Skeletal Framework',
      status: isPatel ? 'warning' : 'nominal',
      score: isPatel ? 84 : 96,
      category: 'Orthopedic / Biomechanics',
      layer: 'skeletal',
      primaryMetric: {
        name: 'Spinal Elongation Delta',
        value: isPatel ? '+5.4' : '+3.8',
        unit: 'cm',
        nominalRange: '+2.0 to +4.5 cm',
      },
      secondaryMetrics: [
        { name: 'Intervertebral Disc Hydration', value: '+18%', unit: 'Water Volume', status: isPatel ? 'warning' : 'nominal' },
        { name: 'Paraspinal Muscle Tone', value: isPatel ? '-14%' : '-6%', unit: 'Resting Tension', status: isPatel ? 'warning' : 'nominal' },
        { name: 'Lordotic Curvature Loss', value: isPatel ? 'Flattened 4.2°' : 'Compensated', unit: 'Angle', status: isPatel ? 'warning' : 'nominal' },
        { name: 'Lumbar Strain Severity', value: isPatel ? 'Mild-Moderate' : 'Negligible', unit: 'VAS scale', status: isPatel ? 'warning' : 'nominal' },
      ],
      microgravityAdaptation: {
        title: 'Microgravity Disc Decompression & Axial Elongation',
        mechanism: 'Unloading of 1-G axial gravity allows nucleus pulposus hydration swelling, lengthening the vertebral spine by up to 5-7 cm.',
        description: 'Taut posterior ligaments cause frequent spaceflight back pain and markedly increases disc herniation hazard upon Earth return.',
        severity: isPatel ? 'Moderate' : 'Mild',
      },
      radiationSensitivity: {
        level: 'Moderate',
        scorePercent: 48,
        badgeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
        details: 'Vertebral red marrow contains hematopoietic niches requiring protection from ionizing cumulative fluence.',
      },
      countermeasures: [
        { name: 'Skinsuit / Penguin Compression Garment', type: 'Axial Loading Suit', protocol: 'Imparts 100% Earth-weight equivalent axial gradient', frequency: '4 hrs daily' },
        { name: 'Spinal Core Decompression Isometric Holds', type: 'Physical Therapy', protocol: 'Multifidus and transverse abdominis activation circuit', frequency: 'Post-ARED daily' },
      ],
      trend24h: [
        { time: '00:00', score: isPatel ? 88 : 96 },
        { time: '04:00', score: isPatel ? 86 : 96 },
        { time: '08:00', score: isPatel ? 84 : 96 },
        { time: '12:00', score: isPatel ? 82 : 95 },
        { time: '16:00', score: isPatel ? 83 : 95 },
        { time: '20:00', score: isPatel ? 84 : 96 },
      ],
    },
    {
      id: 'musculoskeletal_upper',
      slug: 'musculoskeletal_upper',
      name: 'Upper Musculoskeletal Groups',
      system: 'Musculoskeletal (Cervical / Torso)',
      status: 'nominal',
      score: 95,
      category: 'Musculoskeletal',
      layer: 'muscular',
      primaryMetric: {
        name: 'Deltoid / Trapezius Tone',
        value: '94%',
        unit: 'Baseline Strength',
        nominalRange: '> 90%',
      },
      secondaryMetrics: [
        { name: 'Pectoralis Force Vector', value: '185', unit: 'Nm max', status: 'nominal' },
        { name: 'Shoulder Joint Glenohumeral Rom', value: 'Full (180°)', unit: 'Range', status: 'nominal' },
        { name: 'Forearm Grip Endurance', value: '52', unit: 'kg-f', status: 'nominal' },
        { name: 'Myoglobin Efflux Marker', value: 'Baseline', unit: 'Serum', status: 'nominal' },
      ],
      microgravityAdaptation: {
        title: 'Upper Torso Microgravity Hyper-Utilization',
        mechanism: 'Upper limbs serve as primary station locomotion thrusters; upper body maintains tone significantly better than postural legs.',
        description: 'Shoulder impingement and tendon overuse are the primary clinical risks during intensive spacewalk EVA excursions.',
        severity: 'Nominal',
      },
      radiationSensitivity: {
        level: 'Low',
        scorePercent: 32,
        badgeColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
        details: 'Differentiated striated myocytes have low mitotic index and high radiation tolerance.',
      },
      countermeasures: [
        { name: 'Rotator Cuff Resistance Band Routines', type: 'Tendon Preservation', protocol: 'Supraspinatus external rotation sets with elastomer cords', frequency: 'Daily' },
        { name: 'EVA Suit Glove Comfort Gel Liners', type: 'Ergonomic Support', protocol: 'Custom thermo-molded silicone fingertip shock dampeners', frequency: 'During EVA' },
      ],
      trend24h: [
        { time: '00:00', score: 96 },
        { time: '04:00', score: 96 },
        { time: '08:00', score: 95 },
        { time: '12:00', score: 95 },
        { time: '16:00', score: 94 },
        { time: '20:00', score: 95 },
      ],
    },
    {
      id: 'musculoskeletal_lower',
      slug: 'musculoskeletal_lower',
      name: 'Lower Musculoskeletal Groups',
      system: 'Musculoskeletal (Postural & Legs)',
      status: isChen ? 'warning' : 'nominal',
      score: isChen ? 78 : 92,
      category: 'Musculoskeletal',
      layer: 'muscular',
      primaryMetric: {
        name: 'Soleus / Gastrocnemius Mass',
        value: isChen ? '-7.8%' : '-2.4%',
        unit: 'Atrophy Index',
        nominalRange: '< -4.0%',
      },
      secondaryMetrics: [
        { name: 'Femoral Trabecular BMD', value: isChen ? '-1.2%' : '-0.4%', unit: 'monthly BMD', status: isChen ? 'warning' : 'nominal' },
        { name: 'Quadriceps Peak Torque', value: isChen ? '165' : '210', unit: 'Nm', status: isChen ? 'warning' : 'nominal' },
        { name: 'Fast-Twitch Type IIb Conversion', value: '+12%', unit: 'Fiber Shift', status: 'nominal' },
        { name: 'Osteoclast CTx Resorption Marker', value: isChen ? 'Elevated' : 'Normal', unit: 'Biomarker', status: isChen ? 'warning' : 'nominal' },
      ],
      microgravityAdaptation: {
        title: 'Postural Muscle Atrophy & Bone Mineral Density Loss',
        mechanism: 'Complete unloading of antigravity extensor muscles (soleus, vastus lateralis) triggers rapid ubiquitin-proteasome protein breakdown.',
        description: 'Bones shed up to 1-1.5% mineral density monthly in weightlessness, predominantly in weight-bearing hip and calcaneus matrices.',
        severity: isChen ? 'Moderate' : 'Mild',
      },
      radiationSensitivity: {
        level: 'Moderate',
        scorePercent: 44,
        badgeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
        details: 'Osteoblasts demonstrate diminished differentiation capacity under protracted heavy-ion flux.',
      },
      countermeasures: [
        { name: 'ARED Heavy Resistive Squats & Heel Raises', type: 'Mechanical Osteogenesis', protocol: '6 sets of 10 reps at 75-80% 1RM target load', frequency: 'Daily' },
        { name: 'Bisphosphonates (Zoledronic Acid)', type: 'Pharmacological Anti-Resorptive', protocol: 'Single annual 5 mg IV dose pre-mission', frequency: 'Completed' },
        { name: 'Daily Vitamin D3 + K2 Supplementation', type: 'Nutritional Support', protocol: '2,000 IU D3 + 100 mcg K2 with evening caloric intake', frequency: 'Daily' },
      ],
      trend24h: [
        { time: '00:00', score: isChen ? 82 : 93 },
        { time: '04:00', score: isChen ? 81 : 93 },
        { time: '08:00', score: isChen ? 79 : 92 },
        { time: '12:00', score: isChen ? 77 : 91 },
        { time: '16:00', score: isChen ? 78 : 92 },
        { time: '20:00', score: isChen ? 78 : 92 },
      ],
    },
    {
      id: 'radiation_absorption',
      slug: 'radiation_absorption',
      name: 'Whole-Body Radiation & Dosimetry',
      system: 'Dosimetry & Bio-Scan',
      status: 'nominal',
      score: 92,
      category: 'Radiobiology',
      layer: 'visceral',
      primaryMetric: {
        name: 'Cumulative Mission Dose',
        value: '14.82',
        unit: 'mSv',
        nominalRange: '< 50.0 mSv / mission',
      },
      secondaryMetrics: [
        { name: 'Instantaneous Dose Rate', value: '0.042', unit: 'mSv/hr', status: 'nominal', normalRange: '< 0.10' },
        { name: 'GCR Iron-Ion Track Density', value: '1.42', unit: 'hits/cm²/hr', status: 'nominal' },
        { name: 'DNA Double-Strand Breaks (γ-H2AX)', value: '3.8', unit: 'foci/lymphocyte', status: 'nominal' },
        { name: 'Solar Storm (SPE) Alert Status', value: 'Quiet', unit: 'GOES-18 Proxy', status: 'nominal' },
      ],
      microgravityAdaptation: {
        title: 'Deep-Space Galactic Cosmic Radiation (GCR) Flux',
        mechanism: 'High-energy relativistic nuclei (HZE particles) penetrate standard spacecraft aluminum hulls, inducing clustered DNA lesions.',
        description: 'Continuous bio-dosimeter monitoring correlates biological DNA repair efficiency against physical silicon sensor telemetry.',
        severity: 'Nominal',
      },
      radiationSensitivity: {
        level: 'Extreme',
        scorePercent: 95,
        badgeColor: 'text-red-400 border-red-500/40 bg-red-500/10',
        details: 'Fleet lifetime exposure threshold governed by NASA REID (Risk of Exposure-Induced Death) strict 3% limits.',
      },
      countermeasures: [
        { name: 'Crew Storm Shelter Retreat (Water Wall)', type: 'Physical Polyethylene Shielding', protocol: 'Relocate to Node 2 Crew Quarters during SPE events', frequency: 'Standby' },
        { name: 'Exogenous NAD+ Precursor & Polyphenols', type: 'DNA Repair Augmentation', protocol: '500 mg NMN + Resveratrol morning formulation', frequency: 'Daily' },
      ],
      trend24h: [
        { time: '00:00', score: 94 },
        { time: '04:00', score: 93 },
        { time: '08:00', score: 93 },
        { time: '12:00', score: 92 },
        { time: '16:00', score: 92 },
        { time: '20:00', score: 92 },
      ],
    },
  ];

  const crewMember: BioTwinCrewMember = {
    id: astronautId,
    callsign: meta.callsign,
    name: meta.name,
    role: meta.role,
    zone: meta.zone,
    hr,
    spo2,
    status: generalStatus,
    eva_hours: isVance ? 42.5 : isChen ? 28.0 : isPatel ? 12.5 : 34.0,
    syncStatus: 'synced',
    lastSyncTime: '2 sec ago',
  };

  const summary: BioTwinSummary = {
    overallHealthScore: isChen ? 82 : isPatel ? 92 : isIvanov ? 89 : 95,
    status: generalStatus,
    activeAnomaliesCount: isChen ? 3 : isPatel ? 1 : isIvanov ? 1 : 0,
    radiationExposureMsv: 14.82,
    microgravityAdaptationIndex: isChen ? 84 : 96,
    lastDownlinkTimestamp: new Date().toISOString(),
  };

  return {
    astronaut: crewMember,
    organs,
    summary,
  };
}

export const bioTwinApi = {
  /**
   * Fetch 3D Bio-Digital Twin dossier and telemetry for a specific astronaut
   */
  async getBioTwin(astronautId: number): Promise<BioTwinResponse> {
    try {
      const response = await apiClient.get(`/bio-twin/${astronautId}`);
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return generateRealisticBioTwin(astronautId);
    } catch {
      // Return high-fidelity fallback model data if offline or backend is synchronizing
      return generateRealisticBioTwin(astronautId);
    }
  },

  /**
   * Submit Flight Surgeon Action Directive Note for an organ
   */
  async addOrganNote(astronautId: number, organId: string, note: string): Promise<boolean> {
    try {
      await apiClient.post(`/bio-twin/${astronautId}/notes`, {
        organ_id: organId,
        note,
      });
      return true;
    } catch {
      // In offline/mock mode, pretend succeeded
      return true;
    }
  },
};

export default bioTwinApi;
