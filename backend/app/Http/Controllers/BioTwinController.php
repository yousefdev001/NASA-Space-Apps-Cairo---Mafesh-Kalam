<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class BioTwinController extends Controller
{
    /**
     * Retrieve comprehensive anatomical telemetry for all 12 body regions of an astronaut.
     */
    public function show(string|int $astronautId): JsonResponse
    {
        $astronaut = is_numeric($astronautId)
            ? DB::table('astronauts')->where('id', (int) $astronautId)->first()
            : DB::table('astronauts')->where('callsign', $astronautId)->orWhere('uuid', $astronautId)->first();

        if (! $astronaut) {
            return ApiResponse::error('Astronaut not found.', 404);
        }

        $profile = $this->resolveAstronautProfile($astronaut);
        $regions = $this->buildOrganTelemetry($profile);

        // Overall score calculated across the 12 body regions
        $overallScore = (int) round(collect($regions)->avg('health_score'));
        $hasCritical = collect($regions)->contains('status', 'critical');
        $hasWarning = collect($regions)->contains('status', 'warning');
        $overallStatus = $hasCritical ? 'critical' : ($hasWarning ? 'warning' : 'nominal');
        $activeAnomaliesCount = collect($regions)->where('status', '!=', 'nominal')->count();

        $zoneMap = [
            'CDR-01' => 'Quest Airlock / EVA-1',
            'PLT-02' => 'Cupola Flight Deck',
            'SPC-03' => 'Columbus Lab Module',
            'ENG-04' => 'Node 3 Tranquility / ECLSS Bay',
        ];

        // Retrieve current heart rate and spo2 from organs
        $heartRegion = collect($regions)->firstWhere('slug', 'heart');
        $lungsRegion = collect($regions)->firstWhere('slug', 'lungs');
        $hrValue = (int) ($heartRegion['primary_metric_value'] ?? 72);
        $spo2Value = (float) ($lungsRegion['primary_metric_value'] ?? 98.4);

        $astronautPayload = [
            'id' => (int) $astronaut->id,
            'uuid' => $astronaut->uuid,
            'callsign' => $astronaut->callsign,
            'name' => $astronaut->full_name,
            'full_name' => $astronaut->full_name,
            'role' => $astronaut->rank,
            'rank' => $astronaut->rank,
            'specialization' => $astronaut->specialization,
            'blood_type' => $astronaut->blood_type,
            'gender' => $astronaut->gender,
            'zone' => $zoneMap[$astronaut->callsign] ?? 'Habitation Module',
            'hr' => $hrValue,
            'spo2' => $spo2Value,
            'total_eva_hours' => (float) $astronaut->total_eva_hours,
            'eva_hours' => (float) $astronaut->total_eva_hours,
            'total_space_days' => (int) $astronaut->total_space_days,
            'status' => $overallStatus,
            'syncStatus' => 'synced',
            'lastSyncTime' => 'Live',
        ];

        $summary = [
            'overallHealthScore' => $overallScore,
            'overall_health_score' => $overallScore,
            'status' => $overallStatus,
            'activeAnomaliesCount' => $activeAnomaliesCount,
            'active_anomalies_count' => $activeAnomaliesCount,
            'radiationExposureMsv' => 14.82,
            'radiation_exposure_msv' => 14.82,
            'microgravityAdaptationIndex' => $overallScore,
            'microgravity_adaptation_index' => $overallScore,
            'lastDownlinkTimestamp' => now()->toIso8601String(),
            'last_downlink_timestamp' => now()->toIso8601String(),
        ];

        return ApiResponse::success([
            'astronaut' => $astronautPayload,
            'overall_health_score' => $overallScore,
            'overall_status' => $overallStatus,
            'summary' => $summary,
            'regions' => $regions,
            'organs' => $regions,
            'body_regions' => $regions,
        ], 'Bio-Digital Twin anatomical telemetry retrieved successfully.');
    }

    /**
     * Map astronaut record to dynamic telemetry profile.
     */
    protected function resolveAstronautProfile(object $astronaut): string
    {
        if ($astronaut->callsign === 'CDR-01' || str_contains($astronaut->full_name, 'Vance') || (int) $astronaut->id === 1) {
            return 'elena_vance';
        }
        if ($astronaut->callsign === 'PLT-02' || str_contains($astronaut->full_name, 'Chen') || (int) $astronaut->id === 2) {
            return 'marcus_chen';
        }
        if ($astronaut->callsign === 'SPC-03' || str_contains($astronaut->full_name, 'Patel') || (int) $astronaut->id === 3) {
            return 'arya_patel';
        }
        if ($astronaut->callsign === 'ENG-04' || str_contains($astronaut->full_name, 'Ivanov') || (int) $astronaut->id === 4) {
            return 'alexei_ivanov';
        }

        return 'nominal_resting';
    }

    /**
     * Build anatomical telemetry dataset across 12 organ structures.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function buildOrganTelemetry(string $profile): array
    {
        return [
            $this->buildBrainRegion($profile),
            $this->buildEyesRegion($profile),
            $this->buildCarotidJugularRegion($profile),
            $this->buildHeartRegion($profile),
            $this->buildLungsRegion($profile),
            $this->buildLiverRegion($profile),
            $this->buildKidneysRegion($profile),
            $this->buildGastrointestinalRegion($profile),
            $this->buildSpineRegion($profile),
            $this->buildMuscularCoreRegion($profile),
            $this->buildUpperLimbsRegion($profile),
            $this->buildLowerLimbsRegion($profile),
        ];
    }

    /**
     * 1. Brain (Central Nervous)
     */
    protected function buildBrainRegion(string $profile): array
    {
        $isArya = ($profile === 'arya_patel');
        $isElena = ($profile === 'elena_vance');
        $isAlexei = ($profile === 'alexei_ivanov');

        $healthScore = $isArya ? 74 : ($isElena ? 94 : ($isAlexei ? 95 : 98));
        $status = $isArya ? 'warning' : 'nominal';
        $cognitiveLoad = $isArya ? 84 : ($isElena ? 48 : ($isAlexei ? 42 : 32));

        $betaPower = $isArya ? 24.8 : ($isElena ? 15.6 : ($isAlexei ? 14.5 : 13.5));
        $alphaPower = $isArya ? 6.4 : ($isElena ? 10.2 : ($isAlexei ? 10.0 : 11.2));
        $thetaPower = $isArya ? 4.2 : 5.1;
        $deltaPower = $isArya ? 1.8 : 2.0;
        $icp = $isArya ? 15.8 : ($isElena ? 12.1 : ($isAlexei ? 11.5 : 10.6));

        $trendScores = $isArya
            ? [92, 90, 89, 87, 85, 83, 81, 79, 77, 75, 74, 74]
            : $this->generateTrend($healthScore, 2);

        $trendPoints = $this->formatTrendPoints($trendScores);

        $secMetrics = [
            [
                'label' => 'EEG Alpha Power',
                'name' => 'EEG Alpha Power',
                'value' => $alphaPower,
                'unit' => 'Hz',
                'status' => $isArya ? 'warning' : 'nominal',
                'normalRange' => '8.0 - 12.0 Hz',
            ],
            [
                'label' => 'EEG Beta Power',
                'name' => 'EEG Beta Power',
                'value' => $betaPower,
                'unit' => 'Hz',
                'status' => $isArya ? 'warning' : 'nominal',
                'normalRange' => '13.0 - 20.0 Hz',
            ],
            [
                'label' => 'EEG Theta Power',
                'name' => 'EEG Theta Power',
                'value' => $thetaPower,
                'unit' => 'Hz',
                'status' => 'nominal',
                'normalRange' => '4.0 - 7.0 Hz',
            ],
            [
                'label' => 'EEG Delta Power',
                'name' => 'EEG Delta Power',
                'value' => $deltaPower,
                'unit' => 'Hz',
                'status' => 'nominal',
                'normalRange' => '0.5 - 3.5 Hz',
            ],
            [
                'label' => 'Intracranial Pressure (ICP)',
                'name' => 'Intracranial Pressure (ICP)',
                'value' => $icp,
                'unit' => 'mmHg',
                'status' => $isArya ? 'warning' : 'nominal',
                'normalRange' => '7 - 15 mmHg',
            ],
        ];

        return [
            'id' => 1,
            'slug' => 'brain',
            'name' => 'Brain & Central Nervous System',
            'system' => 'Central Nervous',
            'layer' => 'neural',
            'category' => 'Neurological',
            'health_score' => $healthScore,
            'score' => $healthScore,
            'healthScore' => $healthScore,
            'status' => $status,
            'primary_metric_label' => 'Cognitive Load',
            'primary_metric_value' => $cognitiveLoad,
            'primary_metric_unit' => '%',
            'primaryMetric' => [
                'name' => 'Cognitive Load',
                'label' => 'Cognitive Load',
                'value' => $cognitiveLoad,
                'unit' => '%',
                'nominalRange' => '< 70%',
            ],
            'secondary_metrics' => $secMetrics,
            'secondaryMetrics' => $secMetrics,
            'microgravity_adaptation' => 'Cephalad fluid redistribution increases intracranial pressure (ICP) and compresses the superior sagittal sinus. Neuro-vestibular sensory conflict induces sensorimotor recalibration, altered alpha/beta band synchrony during circadian shifts, and cognitive fatigue.',
            'microgravityAdaptation' => [
                'title' => 'Cephalad Venous Engorgement & ICP Elevation',
                'mechanism' => 'Loss of hydrostatic pressure column causes fluid redistribution into the cranium and cervical vasculature.',
                'description' => 'Cephalad fluid redistribution increases intracranial pressure (ICP) and compresses the superior sagittal sinus. Neuro-vestibular sensory conflict induces sensorimotor recalibration, altered alpha/beta band synchrony during circadian shifts, and cognitive fatigue.',
                'severity' => $isArya ? 'Moderate' : 'Nominal',
            ],
            'radiation_sensitivity' => 'moderate',
            'radiationSensitivity' => [
                'level' => 'Moderate',
                'details' => 'Hippocampal neurons and oligodendrocyte precursors exhibit vulnerability to cosmic heavy ions.',
            ],
            'countermeasures' => [
                'Melatonin circadian lighting adjustment (480nm blue-depleted spectrum)',
                'Cognitive workload duty-cycle throttling (maximum 6h complex tasking)',
                'Dual-frequency transcranial alternating current stimulation (tACS)',
                'Regular neuro-cognitive executive function battery testing',
            ],
            'historical_trend_24h' => $trendPoints,
            'trend24h' => $trendPoints,
            'trend' => $trendPoints,
        ];
    }

    /**
     * 2. Eyes (SANS Optic Chiasm)
     */
    protected function buildEyesRegion(string $profile): array
    {
        $isArya = ($profile === 'arya_patel');
        $healthScore = $isArya ? 90 : ($profile === 'elena_vance' ? 93 : ($profile === 'alexei_ivanov' ? 94 : 97));
        $onsd = $isArya ? 5.6 : ($profile === 'elena_vance' ? 5.4 : ($profile === 'alexei_ivanov' ? 5.3 : 5.1));
        $vascularCaliber = $isArya ? 198 : ($profile === 'elena_vance' ? 185 : ($profile === 'alexei_ivanov' ? 188 : 182));

        $trendPoints = $this->formatTrendPoints($this->generateTrend($healthScore, 1));

        $secMetrics = [
            [
                'label' => 'Optic Nerve Sheath Diameter (ONSD)',
                'name' => 'Optic Nerve Sheath Diameter (ONSD)',
                'value' => $onsd,
                'unit' => 'mm',
                'status' => 'nominal',
                'normalRange' => '< 5.8 mm',
            ],
            [
                'label' => 'Retinal Vascular Caliber (CRVE)',
                'name' => 'Retinal Vascular Caliber (CRVE)',
                'value' => $vascularCaliber,
                'unit' => 'um',
                'status' => 'nominal',
                'normalRange' => '170 - 210 um',
            ],
            [
                'label' => 'Posterior Globe Flattening',
                'name' => 'Posterior Globe Flattening',
                'value' => $isArya ? 'Grade 1 (Trace)' : 'Grade 0 (Absent)',
                'unit' => 'Scale',
                'status' => 'nominal',
                'normalRange' => 'Grade 0',
            ],
            [
                'label' => 'Choroidal Folds Index',
                'name' => 'Choroidal Folds Index',
                'value' => 0.0,
                'unit' => 'Score',
                'status' => 'nominal',
            ],
        ];

        return [
            'id' => 2,
            'slug' => 'eyes',
            'name' => 'Optic Chiasm & SANS Ocular Core',
            'system' => 'SANS Optic Chiasm',
            'layer' => 'neural',
            'category' => 'Ophthalmic',
            'health_score' => $healthScore,
            'score' => $healthScore,
            'healthScore' => $healthScore,
            'status' => 'nominal',
            'primary_metric_label' => 'Optic Nerve Sheath Diameter',
            'primary_metric_value' => $onsd,
            'primary_metric_unit' => 'mm',
            'primaryMetric' => [
                'name' => 'Optic Nerve Sheath Diameter',
                'label' => 'Optic Nerve Sheath Diameter',
                'value' => $onsd,
                'unit' => 'mm',
                'nominalRange' => '< 5.8 mm',
            ],
            'secondary_metrics' => $secMetrics,
            'secondaryMetrics' => $secMetrics,
            'microgravity_adaptation' => 'Spaceflight-Associated Neuro-ocular Syndrome (SANS) pathophysiology driven by loss of hydrostatic downward drainage. Optic nerve sheath diameter (ONSD) expansion, posterior globe flattening, choroidal folds, and hyperopic refractive shift.',
            'microgravityAdaptation' => [
                'title' => 'Spaceflight-Associated Neuro-Ocular Syndrome (SANS)',
                'mechanism' => 'Impaired ocular venous egress and optic nerve sheath cerebrospinal fluid sequestration.',
                'description' => 'Spaceflight-Associated Neuro-ocular Syndrome (SANS) pathophysiology driven by loss of hydrostatic downward drainage. Optic nerve sheath diameter (ONSD) expansion, posterior globe flattening, choroidal folds, and hyperopic refractive shift.',
                'severity' => 'Nominal',
            ],
            'radiation_sensitivity' => 'high',
            'radiationSensitivity' => [
                'level' => 'High',
                'details' => 'Lens epithelium and retinal microvasculature sensitivity to radiation cataractogenesis.',
            ],
            'countermeasures' => [
                'Lower Body Negative Pressure (LBNP Chibis suit) 30 mmHg for 45 min daily',
                'High-resolution Optical Coherence Tomography (OCT) bi-weekly scanning',
                'Hyperopic adjustable visual corrective lenses',
                'Venous return compression neck collar during high-G re-entry simulations',
            ],
            'historical_trend_24h' => $trendPoints,
            'trend24h' => $trendPoints,
            'trend' => $trendPoints,
        ];
    }

    /**
     * 3. Carotid & Jugular Vasculature (Neuro-Vascular)
     */
    protected function buildCarotidJugularRegion(string $profile): array
    {
        $isArya = ($profile === 'arya_patel');
        $healthScore = $isArya ? 88 : ($profile === 'elena_vance' ? 92 : ($profile === 'alexei_ivanov' ? 93 : 96));
        $fluidShift = $isArya ? 18.4 : ($profile === 'elena_vance' ? 14.5 : ($profile === 'alexei_ivanov' ? 13.0 : 11.2));
        $jvp = $isArya ? 13.9 : ($profile === 'elena_vance' ? 11.8 : ($profile === 'alexei_ivanov' ? 11.2 : 10.4));

        $trendPoints = $this->formatTrendPoints($this->generateTrend($healthScore, 1));

        $secMetrics = [
            [
                'label' => 'Jugular Venous Pressure (JVP)',
                'name' => 'Jugular Venous Pressure (JVP)',
                'value' => $jvp,
                'unit' => 'mmHg',
                'status' => 'nominal',
                'normalRange' => '6 - 12 mmHg',
            ],
            [
                'label' => 'Cephalic Fluid Shift',
                'name' => 'Cephalic Fluid Shift',
                'value' => $fluidShift,
                'unit' => '%',
                'status' => 'nominal',
                'normalRange' => '< 15%',
            ],
            [
                'label' => 'Internal Jugular Cross-Sectional Area',
                'name' => 'Internal Jugular Cross-Sectional Area',
                'value' => $isArya ? 1.62 : 1.35,
                'unit' => 'cm²',
                'status' => 'nominal',
            ],
            [
                'label' => 'Carotid Artery Resistive Index',
                'name' => 'Carotid Artery Resistive Index',
                'value' => 0.68,
                'unit' => 'Index',
                'status' => 'nominal',
            ],
        ];

        return [
            'id' => 3,
            'slug' => 'carotid_jugular',
            'name' => 'Carotid & Internal Jugular Vasculature',
            'system' => 'Neuro-Vascular',
            'layer' => 'vascular',
            'category' => 'Vascular',
            'health_score' => $healthScore,
            'score' => $healthScore,
            'healthScore' => $healthScore,
            'status' => 'nominal',
            'primary_metric_label' => 'Cephalic Fluid Shift',
            'primary_metric_value' => $fluidShift,
            'primary_metric_unit' => '%',
            'primaryMetric' => [
                'name' => 'Cephalic Fluid Shift',
                'label' => 'Cephalic Fluid Shift',
                'value' => $fluidShift,
                'unit' => '%',
                'nominalRange' => '< 15%',
            ],
            'secondary_metrics' => $secMetrics,
            'secondaryMetrics' => $secMetrics,
            'microgravity_adaptation' => 'Cephalic fluid shift of approximately 1.5 to 2.0 liters from lower extremities into upper thorax and head. Marked internal jugular vein engorgement, loss of gravity-assisted venous collapse, and periodic stasis or retrograde flow patterns.',
            'microgravityAdaptation' => [
                'title' => 'Internal Jugular Engorgement & Cephalic Pooling',
                'mechanism' => 'Cessation of caudally directed gravitational force leads to sustained jugular venous distension.',
                'description' => 'Cephalic fluid shift of approximately 1.5 to 2.0 liters from lower extremities into upper thorax and head. Marked internal jugular vein engorgement, loss of gravity-assisted venous collapse, and periodic stasis or retrograde flow patterns.',
                'severity' => 'Nominal',
            ],
            'radiation_sensitivity' => 'low',
            'radiationSensitivity' => [
                'level' => 'Low',
                'details' => 'Large conduit vessel endothelia exhibit robust micro-repair resistance.',
            ],
            'countermeasures' => [
                'Daily LBNP Chibis suit counter-fluid decompression',
                'Venous thigh occlusion cuffs during waking duty hours',
                'CEVIS cycle ergometer vascular flushing intervals',
                'Circadian head-down tilt avoidance protocols',
            ],
            'historical_trend_24h' => $trendPoints,
            'trend24h' => $trendPoints,
            'trend' => $trendPoints,
        ];
    }

    /**
     * 4. Heart (Cardiovascular)
     */
    protected function buildHeartRegion(string $profile): array
    {
        $isArya = ($profile === 'arya_patel');
        $isElena = ($profile === 'elena_vance');
        $isAlexei = ($profile === 'alexei_ivanov');

        $healthScore = $isArya ? 76 : ($isElena ? 95 : ($isAlexei ? 96 : 98));
        $status = $isArya ? 'warning' : 'nominal';
        $heartRate = $isArya ? 84 : ($isElena ? 74 : ($isAlexei ? 66 : 62));
        $cardiacOutput = $isArya ? 6.4 : ($isElena ? 5.8 : ($isAlexei ? 5.3 : 5.1));
        $strokeVolume = $isArya ? 76.0 : ($isElena ? 78.0 : ($isAlexei ? 80.0 : 82.0));
        $strokeWork = $isArya ? 74.5 : ($isElena ? 68.2 : ($isAlexei ? 65.0 : 64.0));

        $trendScores = $isArya
            ? [94, 93, 93, 91, 90, 88, 86, 84, 81, 79, 77, 76]
            : $this->generateTrend($healthScore, 1);

        $trendPoints = $this->formatTrendPoints($trendScores);

        $secMetrics = [
            [
                'label' => 'Cardiac Output',
                'name' => 'Cardiac Output',
                'value' => $cardiacOutput,
                'unit' => 'L/min',
                'status' => $isArya ? 'warning' : 'nominal',
                'normalRange' => '4.5 - 6.0 L/min',
            ],
            [
                'label' => 'Stroke Volume (SV)',
                'name' => 'Stroke Volume (SV)',
                'value' => $strokeVolume,
                'unit' => 'mL',
                'status' => 'nominal',
                'normalRange' => '60 - 100 mL',
            ],
            [
                'label' => 'Left Ventricular Stroke Work',
                'name' => 'Left Ventricular Stroke Work',
                'value' => $strokeWork,
                'unit' => 'g-m',
                'status' => $isArya ? 'warning' : 'nominal',
                'normalRange' => '50 - 70 g-m',
            ],
            [
                'label' => 'Cardiac Rhythm',
                'name' => 'Cardiac Rhythm',
                'value' => $isArya ? 'Sinus Tachycardia' : 'Normal Sinus Rhythm',
                'unit' => 'Rhythm',
                'status' => $isArya ? 'warning' : 'nominal',
                'normalRange' => 'Normal Sinus Rhythm',
            ],
        ];

        return [
            'id' => 4,
            'slug' => 'heart',
            'name' => 'Cardiovascular & Myocardial Core',
            'system' => 'Cardiovascular',
            'layer' => 'cardiovascular',
            'category' => 'Cardiovascular',
            'health_score' => $healthScore,
            'score' => $healthScore,
            'healthScore' => $healthScore,
            'status' => $status,
            'primary_metric_label' => 'Heart Rate',
            'primary_metric_value' => $heartRate,
            'primary_metric_unit' => 'BPM',
            'primaryMetric' => [
                'name' => 'Heart Rate',
                'label' => 'Heart Rate',
                'value' => $heartRate,
                'unit' => 'BPM',
                'nominalRange' => '55 - 80 BPM',
            ],
            'secondary_metrics' => $secMetrics,
            'secondaryMetrics' => $secMetrics,
            'microgravity_adaptation' => 'Reduction of total vascular hydrostatic resistance leading to progressive myocardial remodeling, left ventricular mass atrophy (~1% per week unmitigated), reduction in stroke work, and post-flight orthostatic intolerance risk.',
            'microgravityAdaptation' => [
                'title' => 'Myocardial Unloading & Left Ventricular Remodeling',
                'mechanism' => 'Decreased central blood volume post-adaptation diminishes cardiac pre-load and myocardial workload.',
                'description' => 'Reduction of total vascular hydrostatic resistance leading to progressive myocardial remodeling, left ventricular mass atrophy (~1% per week unmitigated), reduction in stroke work, and post-flight orthostatic intolerance risk.',
                'severity' => $isArya ? 'Moderate' : 'Nominal',
            ],
            'radiation_sensitivity' => 'moderate',
            'radiationSensitivity' => [
                'level' => 'Moderate',
                'details' => 'Coronary micro-calcification risk and cardiomyocyte oxidative stress under deep-space HZE particles.',
            ],
            'countermeasures' => [
                'ARED heavy resistance squats and deadlifts (daily 2.5h protocol)',
                'High-Intensity Interval Training (HIIT) on CEVIS cycle ergometer',
                'Pre-reentry electrolyte and isotonic fluid loading protocol (1.0 L saline)',
                'LBNP orthostatic vascular reconditioning training',
            ],
            'historical_trend_24h' => $trendPoints,
            'trend24h' => $trendPoints,
            'trend' => $trendPoints,
        ];
    }

    /**
     * 5. Lungs (Pulmonary)
     */
    protected function buildLungsRegion(string $profile): array
    {
        $isArya = ($profile === 'arya_patel');
        $healthScore = $isArya ? 92 : ($profile === 'elena_vance' ? 96 : ($profile === 'alexei_ivanov' ? 95 : 99));
        $spo2 = $isArya ? 97.4 : ($profile === 'elena_vance' ? 98.2 : ($profile === 'alexei_ivanov' ? 98.0 : 99.1));
        $respRate = $isArya ? 18 : ($profile === 'elena_vance' ? 15 : ($profile === 'alexei_ivanov' ? 14 : 13));
        $tidalVolume = $isArya ? 560 : 520;
        $compliance = $isArya ? 86.0 : 90.5;

        $trendPoints = $this->formatTrendPoints($this->generateTrend($healthScore, 1));

        $secMetrics = [
            [
                'label' => 'Blood Oxygenation (SpO2)',
                'name' => 'Blood Oxygenation (SpO2)',
                'value' => $spo2,
                'unit' => '%',
                'status' => 'nominal',
                'normalRange' => '96 - 100%',
            ],
            [
                'label' => 'Respiratory Rate',
                'name' => 'Respiratory Rate',
                'value' => $respRate,
                'unit' => 'breaths/min',
                'status' => 'nominal',
                'normalRange' => '12 - 18 bpm',
            ],
            [
                'label' => 'Tidal Volume',
                'name' => 'Tidal Volume',
                'value' => $tidalVolume,
                'unit' => 'mL',
                'status' => 'nominal',
                'normalRange' => '450 - 600 mL',
            ],
            [
                'label' => 'Dynamic Pulmonary Compliance',
                'name' => 'Dynamic Pulmonary Compliance',
                'value' => $compliance,
                'unit' => 'mL/cmH2O',
                'status' => 'nominal',
                'normalRange' => '70 - 100 mL/cmH2O',
            ],
        ];

        return [
            'id' => 5,
            'slug' => 'lungs',
            'name' => 'Pulmonary & Alveolar Gas Exchange',
            'system' => 'Pulmonary',
            'layer' => 'visceral',
            'category' => 'Pulmonary',
            'health_score' => $healthScore,
            'score' => $healthScore,
            'healthScore' => $healthScore,
            'status' => 'nominal',
            'primary_metric_label' => 'Blood Oxygenation (SpO2)',
            'primary_metric_value' => $spo2,
            'primary_metric_unit' => '%',
            'primaryMetric' => [
                'name' => 'Blood Oxygenation (SpO2)',
                'label' => 'Blood Oxygenation (SpO2)',
                'value' => $spo2,
                'unit' => '%',
                'nominalRange' => '96 - 100%',
            ],
            'secondary_metrics' => $secMetrics,
            'secondaryMetrics' => $secMetrics,
            'microgravity_adaptation' => 'Uniform ventilation-perfusion matching due to abolition of gravitational pleural pressure gradients. Slight reduction in functional residual capacity (FRC) and uniform pulmonary capillary volume; ECLSS hypercapnia sensitivity.',
            'microgravityAdaptation' => [
                'title' => 'Abolition of Gravitational V/Q Gradient',
                'mechanism' => 'Pulmonary capillary blood volume expands uniformly across upper and lower lobes.',
                'description' => 'Uniform ventilation-perfusion matching due to abolition of gravitational pleural pressure gradients. Slight reduction in functional residual capacity (FRC) and uniform pulmonary capillary volume; ECLSS hypercapnia sensitivity.',
                'severity' => 'Nominal',
            ],
            'radiation_sensitivity' => 'moderate',
            'radiationSensitivity' => [
                'level' => 'Moderate',
                'details' => 'Bronchial epithelium and alveolar type II pneumocyte radiation pneumonitis prophylaxis.',
            ],
            'countermeasures' => [
                'Daily resistive aerobic workout on T2 treadmill / CEVIS',
                'ECLSS cabin ppO2 maintenance at 21.3 kPa with low ppCO2 (<2.5 mmHg)',
                'Spirometric forced vital capacity (FVC) weekly surveillance',
                'Inspiratory muscle resistance training (IMT)',
            ],
            'historical_trend_24h' => $trendPoints,
            'trend24h' => $trendPoints,
            'trend' => $trendPoints,
        ];
    }

    /**
     * 6. Liver (Hepatic / Metabolic)
     */
    protected function buildLiverRegion(string $profile): array
    {
        $healthScore = $profile === 'marcus_chen' ? 98 : ($profile === 'alexei_ivanov' ? 96 : ($profile === 'elena_vance' ? 94 : 93));
        $altAstRatio = $profile === 'marcus_chen' ? 1.08 : ($profile === 'elena_vance' ? 1.15 : 1.22);
        $clearanceRate = $profile === 'marcus_chen' ? 97.0 : 94.0;
        $glucose = $profile === 'marcus_chen' ? 88.0 : 92.0;

        $trendPoints = $this->formatTrendPoints($this->generateTrend($healthScore, 1));

        $secMetrics = [
            [
                'label' => 'ALT/AST Ratio',
                'name' => 'ALT/AST Ratio',
                'value' => $altAstRatio,
                'unit' => 'Ratio',
                'status' => 'nominal',
                'normalRange' => '0.8 - 1.3',
            ],
            [
                'label' => 'Hepatic Clearance Rate',
                'name' => 'Hepatic Clearance Rate',
                'value' => $clearanceRate,
                'unit' => '%',
                'status' => 'nominal',
                'normalRange' => '85 - 100%',
            ],
            [
                'label' => 'Glucose Metabolism (Fasting)',
                'name' => 'Glucose Metabolism (Fasting)',
                'value' => $glucose,
                'unit' => 'mg/dL',
                'status' => 'nominal',
                'normalRange' => '70 - 100 mg/dL',
            ],
            [
                'label' => 'Cytochrome P450 Metabolic Index',
                'name' => 'Cytochrome P450 Metabolic Index',
                'value' => 96.2,
                'unit' => 'Score',
                'status' => 'nominal',
            ],
        ];

        return [
            'id' => 6,
            'slug' => 'liver',
            'name' => 'Liver & Hepatic Clearance Core',
            'system' => 'Hepatic / Metabolic',
            'layer' => 'visceral',
            'category' => 'Hepatic',
            'health_score' => $healthScore,
            'score' => $healthScore,
            'healthScore' => $healthScore,
            'status' => 'nominal',
            'primary_metric_label' => 'ALT/AST Ratio',
            'primary_metric_value' => $altAstRatio,
            'primary_metric_unit' => 'Ratio',
            'primaryMetric' => [
                'name' => 'ALT/AST Ratio',
                'label' => 'ALT/AST Ratio',
                'value' => $altAstRatio,
                'unit' => 'Ratio',
                'nominalRange' => '0.8 - 1.3',
            ],
            'secondary_metrics' => $secMetrics,
            'secondaryMetrics' => $secMetrics,
            'microgravity_adaptation' => 'Hepatosplanchnic blood flow alteration modifying cytochrome P450 enzymatic clearance of pharmaceuticals. Altered lipid deposition, mild glycogen turnover shifts, and increased cellular oxidative stress from galactic cosmic radiation (GCR).',
            'microgravityAdaptation' => [
                'title' => 'Hepatosplanchnic Hemodynamic Redistribution',
                'mechanism' => 'Portal venous pressure alteration and enzymatic phase I/II clearance kinetics drift.',
                'description' => 'Hepatosplanchnic blood flow alteration modifying cytochrome P450 enzymatic clearance of pharmaceuticals. Altered lipid deposition, mild glycogen turnover shifts, and increased cellular oxidative stress from galactic cosmic radiation (GCR).',
                'severity' => 'Nominal',
            ],
            'radiation_sensitivity' => 'high',
            'radiationSensitivity' => [
                'level' => 'High',
                'details' => 'Hepatic parenchymal oxidative lipid peroxidation risk during solar particle events (SPE).',
            ],
            'countermeasures' => [
                'Antioxidant nutritional regimen (glutathione, N-acetylcysteine, alpha-lipoic acid)',
                'Microgravity pharmacokinetics dose calibration algorithms',
                'Continuous transcutaneous metabolic biomarker monitoring',
                'Periodic hepatic ultrasound shear-wave elastography',
            ],
            'historical_trend_24h' => $trendPoints,
            'trend24h' => $trendPoints,
            'trend' => $trendPoints,
        ];
    }

    /**
     * 7. Kidneys (Renal)
     */
    protected function buildKidneysRegion(string $profile): array
    {
        $healthScore = $profile === 'marcus_chen' ? 97 : ($profile === 'alexei_ivanov' ? 95 : ($profile === 'elena_vance' ? 93 : 91));
        $hydrationIndex = $profile === 'marcus_chen' ? 95.4 : ($profile === 'alexei_ivanov' ? 92.8 : ($profile === 'elena_vance' ? 91.2 : 88.6));
        $gfr = $profile === 'marcus_chen' ? 114.0 : 108.0;
        $gravity = $profile === 'marcus_chen' ? 1.014 : 1.018;
        $sodium = $profile === 'marcus_chen' ? 152.0 : 144.0;

        $trendPoints = $this->formatTrendPoints($this->generateTrend($healthScore, 1));

        $secMetrics = [
            [
                'label' => 'Hydration Index',
                'name' => 'Hydration Index',
                'value' => $hydrationIndex,
                'unit' => '%',
                'status' => 'nominal',
                'normalRange' => '85 - 100%',
            ],
            [
                'label' => 'Glomerular Filtration Rate (GFR)',
                'name' => 'Glomerular Filtration Rate (GFR)',
                'value' => $gfr,
                'unit' => 'mL/min/1.73m²',
                'status' => 'nominal',
                'normalRange' => '> 90 mL/min',
            ],
            [
                'label' => 'Urine Specific Gravity',
                'name' => 'Urine Specific Gravity',
                'value' => $gravity,
                'unit' => 'sg',
                'status' => 'nominal',
                'normalRange' => '1.010 - 1.025',
            ],
            [
                'label' => 'Fractional Sodium Excretion',
                'name' => 'Fractional Sodium Excretion',
                'value' => $sodium,
                'unit' => 'mEq/24h',
                'status' => 'nominal',
                'normalRange' => '100 - 200 mEq/24h',
            ],
        ];

        return [
            'id' => 7,
            'slug' => 'kidneys',
            'name' => 'Kidneys & Renal Filtration Core',
            'system' => 'Renal',
            'layer' => 'visceral',
            'category' => 'Renal',
            'health_score' => $healthScore,
            'score' => $healthScore,
            'healthScore' => $healthScore,
            'status' => 'nominal',
            'primary_metric_label' => 'Hydration Index',
            'primary_metric_value' => $hydrationIndex,
            'primary_metric_unit' => '%',
            'primaryMetric' => [
                'name' => 'Hydration Index',
                'label' => 'Hydration Index',
                'value' => $hydrationIndex,
                'unit' => '%',
                'nominalRange' => '85 - 100%',
            ],
            'secondary_metrics' => $secMetrics,
            'secondaryMetrics' => $secMetrics,
            'microgravity_adaptation' => 'Initial cephalad fluid shift suppresses ADH (Gauer-Henry reflex), causing early natriuresis and chronic reduction in plasma volume. Bone demineralization-induced hypercalciuria combined with decreased urine output markedly elevates nephrolithiasis risk.',
            'microgravityAdaptation' => [
                'title' => 'Renal Endocrine Suppression & Hypercalciuria',
                'mechanism' => 'Central hypervolemia triggers Gauer-Henry natriuretic reflex accompanied by calcium bone unloading.',
                'description' => 'Initial cephalad fluid shift suppresses ADH (Gauer-Henry reflex), causing early natriuresis and chronic reduction in plasma volume. Bone demineralization-induced hypercalciuria combined with decreased urine output markedly elevates nephrolithiasis risk.',
                'severity' => 'Nominal',
            ],
            'radiation_sensitivity' => 'high',
            'radiationSensitivity' => [
                'level' => 'High',
                'details' => 'Renal tubular epithelial cell vulnerability to oxidative injury from radiation flux.',
            ],
            'countermeasures' => [
                'Target hydration protocol: minimum 2.8 L/day mineralized water',
                'Oral potassium citrate supplementation (10 mEq BID) to alkalinize urine',
                'Bi-weekly portable B-mode renal ultrasound nephrolithiasis screening',
                'Dietary sodium restriction (<2,300 mg/day) to mitigate calcium excretion',
            ],
            'historical_trend_24h' => $trendPoints,
            'trend24h' => $trendPoints,
            'trend' => $trendPoints,
        ];
    }

    /**
     * 8. Gastrointestinal (Visceral Core)
     */
    protected function buildGastrointestinalRegion(string $profile): array
    {
        $healthScore = $profile === 'marcus_chen' ? 98 : ($profile === 'alexei_ivanov' ? 95 : ($profile === 'elena_vance' ? 94 : 90));
        $smsScore = $profile === 'marcus_chen' ? 0.2 : ($profile === 'alexei_ivanov' ? 0.5 : ($profile === 'elena_vance' ? 0.8 : 1.6));
        $gutMotility = $profile === 'marcus_chen' ? 96.0 : ($profile === 'elena_vance' ? 92.0 : 88.0);
        $microbiome = $profile === 'marcus_chen' ? 94.0 : ($profile === 'elena_vance' ? 89.0 : 86.0);

        $trendPoints = $this->formatTrendPoints($this->generateTrend($healthScore, 1));

        $secMetrics = [
            [
                'label' => 'Space Motion Sickness (SMS) Score',
                'name' => 'Space Motion Sickness (SMS) Score',
                'value' => $smsScore,
                'unit' => 'Score (0-10)',
                'status' => 'nominal',
                'normalRange' => '< 2.0',
            ],
            [
                'label' => 'Gut Motility Index',
                'name' => 'Gut Motility Index',
                'value' => $gutMotility,
                'unit' => '%',
                'status' => 'nominal',
                'normalRange' => '> 80%',
            ],
            [
                'label' => 'Microbiome Diversity Stability',
                'name' => 'Microbiome Diversity Stability',
                'value' => $microbiome,
                'unit' => '%',
                'status' => 'nominal',
                'normalRange' => '> 85%',
            ],
            [
                'label' => 'Gastric Emptying Half-Time',
                'name' => 'Gastric Emptying Half-Time',
                'value' => 82.0,
                'unit' => 'min',
                'status' => 'nominal',
            ],
        ];

        return [
            'id' => 8,
            'slug' => 'gastrointestinal',
            'name' => 'Gastrointestinal & Enteric Core',
            'system' => 'Visceral Core',
            'layer' => 'visceral',
            'category' => 'Gastrointestinal',
            'health_score' => $healthScore,
            'score' => $healthScore,
            'healthScore' => $healthScore,
            'status' => 'nominal',
            'primary_metric_label' => 'Space Motion Sickness Score',
            'primary_metric_value' => $smsScore,
            'primary_metric_unit' => 'Score (0-10)',
            'primaryMetric' => [
                'name' => 'Space Motion Sickness Score',
                'label' => 'Space Motion Sickness Score',
                'value' => $smsScore,
                'unit' => 'Score (0-10)',
                'nominalRange' => '< 2.0',
            ],
            'secondary_metrics' => $secMetrics,
            'secondaryMetrics' => $secMetrics,
            'microgravity_adaptation' => 'Neuro-vestibular conflict causes space motion sickness (SMS) in 70% of crew during initial 72 hours. Delayed gastric emptying, reduced colonic motility, and intestinal mucosal thinning with gut microbiome taxon shifts (depletion of short-chain fatty acid producers).',
            'microgravityAdaptation' => [
                'title' => 'Neuro-Vestibular Sensory Mismatch & Peristalsis Delay',
                'mechanism' => 'Visual-otolith conflict triggers emetic autonomic cascades coupled with delayed gastric transit.',
                'description' => 'Neuro-vestibular conflict causes space motion sickness (SMS) in 70% of crew during initial 72 hours. Delayed gastric emptying, reduced colonic motility, and intestinal mucosal thinning with gut microbiome taxon shifts (depletion of short-chain fatty acid producers).',
                'severity' => 'Nominal',
            ],
            'radiation_sensitivity' => 'extreme',
            'radiationSensitivity' => [
                'level' => 'Extreme',
                'details' => 'Rapidly dividing crypt intestinal stem cells display highest radiosensitivity in deep-space environments.',
            ],
            'countermeasures' => [
                'Prophylactic transdermal promethazine / oral ondansetron during adaptation',
                'Daily synbiotic spore-forming probiotic diet supplement',
                'Enteric barrier micronutrient fortification (zinc carnosine, L-glutamine)',
                'Low-residue, high-digestibility vacuum-packed nutritional packs',
            ],
            'historical_trend_24h' => $trendPoints,
            'trend24h' => $trendPoints,
            'trend' => $trendPoints,
        ];
    }

    /**
     * 9. Spine (Skeletal Vertebrae)
     */
    protected function buildSpineRegion(string $profile): array
    {
        $isAlexei = ($profile === 'alexei_ivanov');
        $healthScore = $isAlexei ? 88 : ($profile === 'marcus_chen' ? 97 : ($profile === 'elena_vance' ? 92 : 93));
        $elongation = $isAlexei ? 52.0 : ($profile === 'marcus_chen' ? 28.0 : ($profile === 'elena_vance' ? 36.0 : 32.0));
        $unloadingStrain = $isAlexei ? 5.4 : 3.0;
        $postureScore = $isAlexei ? 88.0 : 94.0;

        $trendScores = $isAlexei
            ? [89, 89, 88, 88, 88, 88, 88, 88, 88, 88, 88, 88]
            : $this->generateTrend($healthScore, 1);

        $trendPoints = $this->formatTrendPoints($trendScores);

        $secMetrics = [
            [
                'label' => 'Microgravity Elongation',
                'name' => 'Microgravity Elongation',
                'value' => $elongation,
                'unit' => 'mm',
                'status' => 'nominal',
                'normalRange' => '< 60 mm',
            ],
            [
                'label' => 'Disc Unloading Strain',
                'name' => 'Disc Unloading Strain',
                'value' => $unloadingStrain,
                'unit' => '%',
                'status' => 'nominal',
                'normalRange' => '< 6.0%',
            ],
            [
                'label' => 'Posture Alignment Score',
                'name' => 'Posture Alignment Score',
                'value' => $postureScore,
                'unit' => '%',
                'status' => 'nominal',
                'normalRange' => '> 80%',
            ],
            [
                'label' => 'Lumbar Lordosis Reduction',
                'name' => 'Lumbar Lordosis Reduction',
                'value' => $isAlexei ? -4.8 : -2.6,
                'unit' => 'deg',
                'status' => 'nominal',
            ],
        ];

        return [
            'id' => 9,
            'slug' => 'spine',
            'name' => 'Skeletal Vertebrae & Intervertebral Discs',
            'system' => 'Skeletal Vertebrae',
            'layer' => 'skeletal',
            'category' => 'Skeletal',
            'health_score' => $healthScore,
            'score' => $healthScore,
            'healthScore' => $healthScore,
            'status' => 'nominal',
            'primary_metric_label' => 'Microgravity Elongation',
            'primary_metric_value' => $elongation,
            'primary_metric_unit' => 'mm',
            'primaryMetric' => [
                'name' => 'Microgravity Elongation',
                'label' => 'Microgravity Elongation',
                'value' => $elongation,
                'unit' => 'mm',
                'nominalRange' => '< 60 mm',
            ],
            'secondary_metrics' => $secMetrics,
            'secondaryMetrics' => $secMetrics,
            'microgravity_adaptation' => 'Absence of compressive gravitational vector allows intervertebral discs to hyper-hydrate and expand, causing total spinal column elongation (+40 to +70 mm). Flattening of lumbar lordosis and deep paraspinal muscle atrophy lead to microgravity back pain and post-flight herniation risk.',
            'microgravityAdaptation' => [
                'title' => 'Intervertebral Disc Hyper-Hydration & Axial Elongation',
                'mechanism' => 'Decompression of spinal column leads to osmotic fluid influx into nucleus pulposus.',
                'description' => 'Absence of compressive gravitational vector allows intervertebral discs to hyper-hydrate and expand, causing total spinal column elongation (+40 to +70 mm). Flattening of lumbar lordosis and deep paraspinal muscle atrophy lead to microgravity back pain and post-flight herniation risk.',
                'severity' => $isAlexei ? 'Mild Elongation' : 'Nominal',
            ],
            'radiation_sensitivity' => 'high',
            'radiationSensitivity' => [
                'level' => 'High',
                'details' => 'Vertebral red bone marrow hematopoietic stem cell niche susceptibility to heavy ion tracks.',
            ],
            'countermeasures' => [
                'Axial body compression loading via Skinsuit (1g-equivalent axial vector)',
                'ARED spinal axial loading (deadlifts, bent-over rows)',
                'Supine lumbar lordosis support cushion in crew sleep berth',
                'Deep multifidus and core isometric stability drills',
            ],
            'historical_trend_24h' => $trendPoints,
            'trend24h' => $trendPoints,
            'trend' => $trendPoints,
        ];
    }

    /**
     * 10. Muscular Core (Musculoskeletal)
     */
    protected function buildMuscularCoreRegion(string $profile): array
    {
        $healthScore = $profile === 'marcus_chen' ? 97 : ($profile === 'alexei_ivanov' ? 92 : ($profile === 'elena_vance' ? 92 : 91));
        $tone = $profile === 'marcus_chen' ? 94.0 : 88.5;
        $proteinBalance = $profile === 'marcus_chen' ? 0.35 : 0.22;
        $transversus = $profile === 'marcus_chen' ? 92.0 : 87.0;

        $trendPoints = $this->formatTrendPoints($this->generateTrend($healthScore, 1));

        $secMetrics = [
            [
                'label' => 'Core Muscle Tone',
                'name' => 'Core Muscle Tone',
                'value' => $tone,
                'unit' => '%',
                'status' => 'nominal',
                'normalRange' => '> 80%',
            ],
            [
                'label' => 'Protein Synthesis Balance',
                'name' => 'Protein Synthesis Balance',
                'value' => $proteinBalance,
                'unit' => 'Anabolic Index',
                'status' => 'nominal',
                'normalRange' => '> 0.10 Index',
            ],
            [
                'label' => 'Transversus Abdominis Activation',
                'name' => 'Transversus Abdominis Activation',
                'value' => $transversus,
                'unit' => '%',
                'status' => 'nominal',
                'normalRange' => '> 80%',
            ],
            [
                'label' => 'Multifidus Volume Retention',
                'name' => 'Multifidus Volume Retention',
                'value' => 93.4,
                'unit' => '% baseline',
                'status' => 'nominal',
            ],
        ];

        return [
            'id' => 10,
            'slug' => 'muscular_core',
            'name' => 'Musculoskeletal Core & Abdominal Wall',
            'system' => 'Musculoskeletal',
            'layer' => 'muscular',
            'category' => 'Muscular',
            'health_score' => $healthScore,
            'score' => $healthScore,
            'healthScore' => $healthScore,
            'status' => 'nominal',
            'primary_metric_label' => 'Core Muscle Tone',
            'primary_metric_value' => $tone,
            'primary_metric_unit' => '%',
            'primaryMetric' => [
                'name' => 'Core Muscle Tone',
                'label' => 'Core Muscle Tone',
                'value' => $tone,
                'unit' => '%',
                'nominalRange' => '> 80%',
            ],
            'secondary_metrics' => $secMetrics,
            'secondaryMetrics' => $secMetrics,
            'microgravity_adaptation' => 'Complete cessation of chronic tonic postural activation causes rapid selective atrophy of deep abdominal stabilizers (transversus abdominis, internal oblique, multifidus) and transition of slow-twitch oxidative fibers to fast-twitch glycolytic phenotypes.',
            'microgravityAdaptation' => [
                'title' => 'Postural Motor Unit De-Recruitment',
                'mechanism' => 'Disuse of antigravity postural motor units initiates ubiquitin-proteasome protein degradation.',
                'description' => 'Complete cessation of chronic tonic postural activation causes rapid selective atrophy of deep abdominal stabilizers (transversus abdominis, internal oblique, multifidus) and transition of slow-twitch oxidative fibers to fast-twitch glycolytic phenotypes.',
                'severity' => 'Nominal',
            ],
            'radiation_sensitivity' => 'low',
            'radiationSensitivity' => [
                'level' => 'Low',
                'details' => 'Differentiated mature skeletal myocytes possess high radioresistance.',
            ],
            'countermeasures' => [
                'ARED resistance exercise (isometric core brace, deadlift, Romanian deadlift)',
                'Nutritional leucine and branched-chain amino acid (BCAA) replenishment (1.6 g/kg/day)',
                'Neuromuscular electrical stimulation (NMES) core conditioning',
                'In-flight bio-impedance body composition assessment',
            ],
            'historical_trend_24h' => $trendPoints,
            'trend24h' => $trendPoints,
            'trend' => $trendPoints,
        ];
    }

    /**
     * 11. Upper Limbs (Muscular Upper)
     */
    protected function buildUpperLimbsRegion(string $profile): array
    {
        $isElena = ($profile === 'elena_vance');
        $healthScore = $isElena ? 86 : ($profile === 'marcus_chen' ? 98 : ($profile === 'alexei_ivanov' ? 95 : 94));
        $gripStrength = $isElena ? 415.0 : ($profile === 'marcus_chen' ? 480.0 : ($profile === 'alexei_ivanov' ? 450.0 : 365.0));
        $emgTone = $isElena ? 'High (EVA Glove Fatigue)' : 'Nominal (Resting)';
        $emgStatus = $isElena ? 'warning' : 'nominal';

        $trendScores = $isElena
            ? [95, 95, 94, 94, 93, 91, 89, 87, 86, 86, 86, 86]
            : $this->generateTrend($healthScore, 1);

        $trendPoints = $this->formatTrendPoints($trendScores);

        $secMetrics = [
            [
                'label' => 'Grip Strength',
                'name' => 'Grip Strength',
                'value' => $gripStrength,
                'unit' => 'N',
                'status' => 'nominal',
                'normalRange' => '> 350 N',
            ],
            [
                'label' => 'Forearm EMG Tone',
                'name' => 'Forearm EMG Tone',
                'value' => $emgTone,
                'unit' => 'State',
                'status' => $emgStatus,
                'normalRange' => 'Nominal (Resting)',
            ],
            [
                'label' => 'Grip Strength Endurance',
                'name' => 'Grip Strength Endurance',
                'value' => $isElena ? 78.4 : 94.0,
                'unit' => '%',
                'status' => $isElena ? 'warning' : 'nominal',
                'normalRange' => '> 85%',
            ],
            [
                'label' => 'Brachial Artery Peak Velocity',
                'name' => 'Brachial Artery Peak Velocity',
                'value' => 64.2,
                'unit' => 'cm/s',
                'status' => 'nominal',
            ],
        ];

        return [
            'id' => 11,
            'slug' => 'upper_limbs',
            'name' => 'Upper Limbs & Brachial Musculature',
            'system' => 'Muscular Upper',
            'layer' => 'muscular',
            'category' => 'Muscular',
            'health_score' => $healthScore,
            'score' => $healthScore,
            'healthScore' => $healthScore,
            'status' => 'nominal',
            'primary_metric_label' => 'Grip Strength',
            'primary_metric_value' => $gripStrength,
            'primary_metric_unit' => 'N',
            'primaryMetric' => [
                'name' => 'Grip Strength',
                'label' => 'Grip Strength',
                'value' => $gripStrength,
                'unit' => 'N',
                'nominalRange' => '> 350 N',
            ],
            'secondary_metrics' => $secMetrics,
            'secondaryMetrics' => $secMetrics,
            'microgravity_adaptation' => 'Upper limbs become primary locomotive appendages for translation between habitat modules. Sustained isometric grasp of handrails and high-resistance pressurization within EVA suit gloves cause forearm flexor muscle fatigue, thenar strain, and elevated EMG tone.',
            'microgravityAdaptation' => [
                'title' => 'Forearm Hyper-Recruitment & Glove Resistance Strain',
                'mechanism' => 'Habitation translation dynamics convert arms into primary propulsion elements.',
                'description' => 'Upper limbs become primary locomotive appendages for translation between habitat modules. Sustained isometric grasp of handrails and high-resistance pressurization within EVA suit gloves cause forearm flexor muscle fatigue, thenar strain, and elevated EMG tone.',
                'severity' => $isElena ? 'EVA Exertion' : 'Nominal',
            ],
            'radiation_sensitivity' => 'low',
            'radiationSensitivity' => [
                'level' => 'Low',
                'details' => 'Dense peripheral limb musculature exhibits low radiation vulnerability.',
            ],
            'countermeasures' => [
                'Dynamometric forearm grip endurance and finger flexor exercises',
                'EVA suit pressurized glove thermal and ergonomic custom molding',
                'Targeted handgrip recovery therapy with silicone resistance bands',
                'Post-EVA active forearm muscular compression wraps',
            ],
            'historical_trend_24h' => $trendPoints,
            'trend24h' => $trendPoints,
            'trend' => $trendPoints,
        ];
    }

    /**
     * 12. Lower Limbs (Muscular Lower)
     */
    protected function buildLowerLimbsRegion(string $profile): array
    {
        $isElena = ($profile === 'elena_vance');
        $healthScore = $isElena ? 88 : ($profile === 'marcus_chen' ? 98 : ($profile === 'alexei_ivanov' ? 94 : 92));
        $soleusRisk = $isElena ? 16.5 : ($profile === 'marcus_chen' ? 8.2 : ($profile === 'alexei_ivanov' ? 12.5 : 14.0));
        $calfDelta = $isElena ? -1.4 : ($profile === 'marcus_chen' ? -0.6 : -1.0);
        $plantarReflex = $isElena ? 34.0 : ($profile === 'marcus_chen' ? 29.0 : 31.5);

        $trendScores = $isElena
            ? [94, 94, 93, 93, 92, 90, 89, 88, 88, 88, 88, 88]
            : $this->generateTrend($healthScore, 1);

        $trendPoints = $this->formatTrendPoints($trendScores);

        $secMetrics = [
            [
                'label' => 'Soleus Deconditioning Risk',
                'name' => 'Soleus Deconditioning Risk',
                'value' => $soleusRisk,
                'unit' => '%',
                'status' => 'nominal',
                'normalRange' => '< 20%',
            ],
            [
                'label' => 'Calf Circumference Delta',
                'name' => 'Calf Circumference Delta',
                'value' => $calfDelta,
                'unit' => 'cm',
                'status' => 'nominal',
                'normalRange' => '> -2.5 cm',
            ],
            [
                'label' => 'Plantar Reflex Latency',
                'name' => 'Plantar Reflex Latency',
                'value' => $plantarReflex,
                'unit' => 'ms',
                'status' => 'nominal',
                'normalRange' => '25 - 38 ms',
            ],
            [
                'label' => 'Soleus Cross-Sectional Area',
                'name' => 'Soleus Cross-Sectional Area',
                'value' => $isElena ? 92.1 : 96.5,
                'unit' => '% baseline',
                'status' => 'nominal',
            ],
        ];

        return [
            'id' => 12,
            'slug' => 'lower_limbs',
            'name' => 'Lower Limbs & Soleus Complex',
            'system' => 'Muscular Lower',
            'layer' => 'muscular',
            'category' => 'Muscular',
            'health_score' => $healthScore,
            'score' => $healthScore,
            'healthScore' => $healthScore,
            'status' => 'nominal',
            'primary_metric_label' => 'Soleus Deconditioning Risk',
            'primary_metric_value' => $soleusRisk,
            'primary_metric_unit' => '%',
            'primaryMetric' => [
                'name' => 'Soleus Deconditioning Risk',
                'label' => 'Soleus Deconditioning Risk',
                'value' => $soleusRisk,
                'unit' => '%',
                'nominalRange' => '< 20%',
            ],
            'secondary_metrics' => $secMetrics,
            'secondaryMetrics' => $secMetrics,
            'microgravity_adaptation' => 'Profound microgravity unloading leads to accelerated atrophy of postural anti-gravity muscles (soleus and gastrocnemius volume loss up to 20% in long duration missions). Loss of calf circumference ("bird legs"), plantar cutaneous desensitization, and Achilles tendon stiffness decline.',
            'microgravityAdaptation' => [
                'title' => 'Soleus Unloading & Cephalad Muscle Volume Shift',
                'mechanism' => 'Loss of chronic weight-bearing stimulates preferential slow-to-fast fiber shifting and calpain activation.',
                'description' => 'Profound microgravity unloading leads to accelerated atrophy of postural anti-gravity muscles (soleus and gastrocnemius volume loss up to 20% in long duration missions). Loss of calf circumference ("bird legs"), plantar cutaneous desensitization, and Achilles tendon stiffness decline.',
                'severity' => $isElena ? 'EVA Exertion' : 'Nominal',
            ],
            'radiation_sensitivity' => 'low',
            'radiationSensitivity' => [
                'level' => 'Low',
                'details' => 'Low mitotic index in differentiated lower extremity myocytes.',
            ],
            'countermeasures' => [
                'ARED heavy eccentric calf heel raises (minimum 150 kg resistive load)',
                'T2 motorized treadmill with bungee subject loading harness (70% body weight)',
                'LBNP Chibis suit orthostatic vascular conditioning',
                'Calf neuromuscular electro-myostimulation (EMS) during recovery',
            ],
            'historical_trend_24h' => $trendPoints,
            'trend24h' => $trendPoints,
            'trend' => $trendPoints,
        ];
    }

    /**
     * Generate 12 baseline score values with minor variation.
     *
     * @return array<int, int>
     */
    protected function generateTrend(int $baseScore, int $variance): array
    {
        $trend = [];
        for ($i = 0; $i < 12; $i++) {
            $offset = ($i % 3 === 0) ? 0 : (($i % 2 === 0) ? $variance : -$variance);
            $score = max(0, min(100, $baseScore + $offset));
            $trend[] = $score;
        }

        return $trend;
    }

    /**
     * Format 12 trend points with time labels.
     *
     * @param  array<int, int>  $scores
     * @return array<int, array{time: string, score: int}>
     */
    protected function formatTrendPoints(array $scores): array
    {
        $points = [];
        for ($i = 0; $i < 12; $i++) {
            $hoursAgo = (11 - $i) * 2;
            $timeLabel = sprintf('T-%02dh', $hoursAgo);
            $points[] = [
                'time' => $timeLabel,
                'score' => $scores[$i] ?? 95,
            ];
        }

        return $points;
    }
}
