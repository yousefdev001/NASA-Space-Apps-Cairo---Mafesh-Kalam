<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class MissionControlController extends Controller
{
    /**
     * Return consolidated Mission Control dashboard telemetry.
     */
    public function dashboard(): JsonResponse
    {
        // 1. Primary active mission
        $mission = DB::table('missions')->where('is_primary', true)->first();

        // 2. Crew list with latest vitals
        $crew = DB::table('astronauts')
            ->select('id', 'uuid', 'callsign', 'full_name', 'rank', 'specialization', 'total_eva_hours', 'is_active')
            ->where('is_active', true)
            ->get();

        // 3. Organs data
        $organs = DB::table('organ_systems')->get();

        // 4. Latest organ telemetry readings
        $latestOrganReadings = DB::table('organ_telemetry_readings')
            ->join('organ_systems', 'organ_telemetry_readings.organ_system_id', '=', 'organ_systems.id')
            ->select(
                'organ_systems.slug',
                'organ_systems.name',
                'organ_systems.category',
                'organ_telemetry_readings.health_score_percent as score',
                'organ_telemetry_readings.primary_metric_value as metric_value',
                'organ_telemetry_readings.status'
            )
            ->where('organ_telemetry_readings.astronaut_id', 1)
            ->get();

        // 5. Unresolved alerts count
        $unresolvedAlertsCount = DB::table('alerts')
            ->whereIn('status', ['triggered', 'acknowledged', 'escalated'])
            ->count();

        return ApiResponse::success([
            'mission' => $mission,
            'crew' => $crew,
            'organs' => $latestOrganReadings->isEmpty() ? $organs : $latestOrganReadings,
            'unresolved_alerts_count' => $unresolvedAlertsCount,
            'cabin_environment' => [
                'cabin_pressure_kpa' => 101.3,
                'o2_percent' => 21.2,
                'co2_ppm' => 380,
                'temperature_celsius' => 22.4,
                'humidity_percent' => 46.0,
            ],
            'radiation' => [
                'dose_rate_msv_hr' => 0.042,
                'cumulative_dose_msv' => 42.1,
                'shelter_recommended' => false,
            ],
        ]);
    }
}
