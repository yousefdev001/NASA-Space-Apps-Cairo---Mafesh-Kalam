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

        return ApiResponse::success([
            'mission' => $mission,
            'selected_astronaut' => $selectedMember,
            'crew' => $crew,
            'organs' => $latestOrganReadings,
            'vitals_history' => $vitalsHistory,
            'radiation' => $radiation,
            'unresolved_alerts_count' => $unresolvedAlertsCount,
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
