<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MissionControlController extends Controller
{
    /**
     * Return consolidated Mission Control dashboard telemetry for a selected astronaut or whole crew.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $selectedAstronautId = (int) $request->query('astronaut_id', 1);

        // 1. Primary active mission
        $mission = DB::table('missions')->where('is_primary', true)->first();
        if (! $mission) {
            $mission = DB::table('missions')->first();
        }

        // Zone mapping based on callsign / role
        $zoneMap = [
            'CDR-01' => 'Quest Airlock / EVA-1',
            'PLT-02' => 'Cupola Flight Deck',
            'SPC-03' => 'Columbus Lab Module',
            'ENG-04' => 'Node 3 Tranquility / ECLSS Bay',
        ];

        // 2. Dynamic Crew list with their real latest vitals
        $rawCrew = DB::table('astronauts')
            ->select('id', 'uuid', 'callsign', 'full_name', 'rank', 'specialization', 'total_eva_hours', 'is_active')
            ->where('is_active', true)
            ->orderBy('id', 'asc')
            ->get();

        $crew = $rawCrew->map(function ($member) use ($zoneMap) {
            $latestVital = DB::table('vital_readings')
                ->where('astronaut_id', $member->id)
                ->latest('measured_at')
                ->first();

            $status = $latestVital ? $latestVital->status : 'nominal';
            $hr = $latestVital ? (int) $latestVital->heart_rate_bpm : 68;
            $spo2 = $latestVital ? (float) $latestVital->spo2_percent : 97.5;

            return [
                'id' => $member->id,
                'uuid' => $member->uuid,
                'callsign' => $member->callsign,
                'name' => $member->full_name,
                'role' => $member->rank,
                'zone' => $zoneMap[$member->callsign] ?? 'Habitation Module',
                'hr' => $hr,
                'spo2' => $spo2,
                'status' => $status,
                'eva_hours' => (float) $member->total_eva_hours,
            ];
        });

        // Ensure selected astronaut exists in crew, otherwise default to first
        $selectedMember = $crew->firstWhere('id', $selectedAstronautId) ?? $crew->first();
        $targetAstronautId = $selectedMember ? $selectedMember['id'] : 1;

        // 3. Organ systems with latest readings for the TARGET astronaut
        $latestOrganReadings = DB::table('organ_telemetry_readings')
            ->join('organ_systems', 'organ_telemetry_readings.organ_system_id', '=', 'organ_systems.id')
            ->select(
                'organ_systems.id as organ_system_id',
                'organ_systems.slug',
                'organ_systems.name',
                'organ_systems.category',
                'organ_telemetry_readings.health_score_percent as score',
                'organ_telemetry_readings.primary_metric_value as metric_value',
                'organ_telemetry_readings.status'
            )
            ->where('organ_telemetry_readings.astronaut_id', $targetAstronautId)
            ->orderBy('organ_telemetry_readings.measured_at', 'desc')
            ->get()
            ->unique('organ_system_id')
            ->sortBy('organ_system_id')
            ->values();

        // Fallback to organ catalog if no readings exist for this astronaut
        if ($latestOrganReadings->isEmpty()) {
            $latestOrganReadings = DB::table('organ_systems')->orderBy('id', 'asc')->get()->map(function ($os) {
                return [
                    'organ_system_id' => $os->id,
                    'slug' => $os->slug,
                    'name' => $os->name,
                    'category' => $os->category,
                    'score' => 92,
                    'metric_value' => 'Nominal',
                    'status' => 'nominal',
                ];
            });
        }

        // 4. Time-series vitals history for stream chart (last 20 readings)
        $vitalsHistory = DB::table('vital_readings')
            ->where('astronaut_id', $targetAstronautId)
            ->latest('measured_at')
            ->limit(20)
            ->get()
            ->reverse()
            ->values()
            ->map(function ($row) {
                return [
                    'time' => date('H:i:s', strtotime($row->measured_at)),
                    'hr' => (int) $row->heart_rate_bpm,
                    'spo2' => (float) $row->spo2_percent,
                    'temp' => (float) $row->core_temp_celsius,
                    'status' => $row->status,
                ];
            });

        // 5. Radiation dosimetry for selected astronaut
        $radiationRecord = DB::table('radiation_readings')
            ->where('astronaut_id', $targetAstronautId)
            ->latest('measured_at')
            ->first();

        $radiation = [
            'dose_rate_msv_hr' => $radiationRecord ? (float) $radiationRecord->dose_rate_msv_hr : 0.042,
            'cumulative_dose_msv' => $radiationRecord ? (float) $radiationRecord->cumulative_dose_msv : 14.2,
            'shelter_recommended' => $radiationRecord ? (bool) $radiationRecord->shelter_recommended : false,
        ];

        // 6. Unresolved alerts count
        $unresolvedAlertsCount = DB::table('alerts')
            ->whereIn('status', ['triggered', 'acknowledged', 'escalated'])
            ->count();

        // 7. Spacesuit xEMU Life Support Telemetry
        $suitTelemetryData = [
            1 => [
                'suit_pressure_kpa' => 29.6,
                'suit_pressure_psi' => 4.30,
                'o2_partial_pressure_kpa' => 28.4,
                'co2_scrubber_efficiency' => 97.4,
                'suit_temp_inner_celsius' => 18.2,
                'battery_percent' => 88.5,
                'battery_margin_hours' => 4.6,
                'lcvg_water_temp_celsius' => 16.8,
                'lcvg_flow_rate_lpm' => 1.35,
                'metabolic_rate_btu_hr' => 860,
                'eva_duration_minutes' => 185,
                'mode' => 'EVA-1 Sortie · Active Excursion',
                'status' => 'nominal',
            ],
            2 => [
                'suit_pressure_kpa' => 101.3,
                'suit_pressure_psi' => 14.70,
                'o2_partial_pressure_kpa' => 21.4,
                'co2_scrubber_efficiency' => 99.1,
                'suit_temp_inner_celsius' => 21.0,
                'battery_percent' => 100.0,
                'battery_margin_hours' => 8.0,
                'lcvg_water_temp_celsius' => 20.0,
                'lcvg_flow_rate_lpm' => 0.0,
                'metabolic_rate_btu_hr' => 420,
                'eva_duration_minutes' => 0,
                'mode' => 'Intravehicular (IV) Standby',
                'status' => 'nominal',
            ],
            3 => [
                'suit_pressure_kpa' => 101.2,
                'suit_pressure_psi' => 14.68,
                'o2_partial_pressure_kpa' => 21.1,
                'co2_scrubber_efficiency' => 95.8,
                'suit_temp_inner_celsius' => 22.4,
                'battery_percent' => 94.0,
                'battery_margin_hours' => 7.2,
                'lcvg_water_temp_celsius' => 21.5,
                'lcvg_flow_rate_lpm' => 0.0,
                'metabolic_rate_btu_hr' => 640,
                'eva_duration_minutes' => 0,
                'mode' => 'Scientific Bio-Rack Ops',
                'status' => 'warning',
            ],
            4 => [
                'suit_pressure_kpa' => 101.3,
                'suit_pressure_psi' => 14.70,
                'o2_partial_pressure_kpa' => 21.3,
                'co2_scrubber_efficiency' => 98.7,
                'suit_temp_inner_celsius' => 20.6,
                'battery_percent' => 98.0,
                'battery_margin_hours' => 7.8,
                'lcvg_water_temp_celsius' => 19.2,
                'lcvg_flow_rate_lpm' => 0.0,
                'metabolic_rate_btu_hr' => 510,
                'eva_duration_minutes' => 0,
                'mode' => 'ECLSS Maintenance Harness',
                'status' => 'nominal',
            ],
        ];

        // 8. Neuro-Cognitive EEG & Deep-Space Predictive Risk Matrix
        $neuroRiskData = [
            1 => [
                'alpha_hz' => 10.4,
                'beta_hz' => 18.2,
                'theta_hz' => 5.2,
                'delta_hz' => 1.8,
                'cognitive_load_index' => 74.5,
                'fatigue_index' => 18.0,
                'readiness_score' => 94,
                'dcs_spencer_grade' => 'Grade 0 (Zero VGE)',
                'sans_optic_nerve_mm' => 4.75,
                'sans_risk' => 'Nominal (<5.8 mm)',
                'orthostatic_stability' => 95.2,
                'fluid_shift_jvp_mmhg' => 1.4,
            ],
            2 => [
                'alpha_hz' => 11.2,
                'beta_hz' => 15.6,
                'theta_hz' => 4.8,
                'delta_hz' => 2.0,
                'cognitive_load_index' => 58.0,
                'fatigue_index' => 12.0,
                'readiness_score' => 96,
                'dcs_spencer_grade' => 'Grade 0 (Clean Doppler)',
                'sans_optic_nerve_mm' => 4.60,
                'sans_risk' => 'Nominal',
                'orthostatic_stability' => 97.0,
                'fluid_shift_jvp_mmhg' => 1.2,
            ],
            3 => [
                'alpha_hz' => 8.1,
                'beta_hz' => 24.5,
                'theta_hz' => 6.5,
                'delta_hz' => 2.4,
                'cognitive_load_index' => 84.0,
                'fatigue_index' => 38.0,
                'readiness_score' => 82,
                'dcs_spencer_grade' => 'Grade 0',
                'sans_optic_nerve_mm' => 5.15,
                'sans_risk' => 'Borderline (Monitor 12h)',
                'orthostatic_stability' => 88.5,
                'fluid_shift_jvp_mmhg' => 2.3,
            ],
            4 => [
                'alpha_hz' => 10.8,
                'beta_hz' => 17.0,
                'theta_hz' => 5.0,
                'delta_hz' => 1.9,
                'cognitive_load_index' => 66.5,
                'fatigue_index' => 15.0,
                'readiness_score' => 92,
                'dcs_spencer_grade' => 'Grade 0 (Nominal)',
                'sans_optic_nerve_mm' => 4.80,
                'sans_risk' => 'Nominal',
                'orthostatic_stability' => 94.0,
                'fluid_shift_jvp_mmhg' => 1.6,
            ],
        ];

        return ApiResponse::success([
            'mission' => $mission,
            'selected_astronaut' => $selectedMember,
            'crew' => $crew,
            'organs' => $latestOrganReadings,
            'vitals_history' => $vitalsHistory,
            'radiation' => $radiation,
            'unresolved_alerts_count' => $unresolvedAlertsCount,
            'suit_telemetry' => $suitTelemetryData[$targetAstronautId] ?? $suitTelemetryData[1],
            'neuro_risk' => $neuroRiskData[$targetAstronautId] ?? $neuroRiskData[1],
            'cabin_environment' => [
                'cabin_pressure_kpa' => 101.3,
                'o2_percent' => 21.2,
                'co2_ppm' => 380,
                'temperature_celsius' => 22.4,
                'humidity_percent' => 46.0,
            ],
            'server_timestamp' => now()->toIso8601String(),
        ]);
    }
}
