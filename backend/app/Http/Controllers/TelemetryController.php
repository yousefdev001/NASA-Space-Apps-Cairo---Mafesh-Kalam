<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TelemetryController extends Controller
{
    /**
     * Ingest batch telemetry packet synced from astronaut mobile application.
     */
    public function ingest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'astronaut_id' => 'required|integer|exists:astronauts,id',
            'mission_id' => 'nullable|integer|exists:missions,id',
            'device_id' => 'nullable|string|max:100',
            'session_type' => 'required|in:realtime,sync,manual',
            'vitals' => 'nullable|array',
            'organs' => 'nullable|array',
        ]);

        return DB::transaction(function () use ($validated) {
            // 1. Create Telemetry Session
            $sessionId = DB::table('telemetry_sessions')->insertGetId([
                'uuid' => (string) Str::uuid(),
                'astronaut_id' => $validated['astronaut_id'],
                'mission_id' => $validated['mission_id'] ?? null,
                'device_id' => $validated['device_id'] ?? 'AURAMED-CREW-PAD',
                'session_type' => $validated['session_type'],
                'connection_quality' => 'good',
                'started_at' => now(),
                'ended_at' => now(),
                'received_at' => now(),
                'packet_count' => count($validated['vitals'] ?? []),
                'is_complete' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 2. Insert Vitals Readings in batches (anti-N+1)
            if (!empty($validated['vitals'])) {
                $vitalRows = [];
                foreach ($validated['vitals'] as $v) {
                    $hr = $v['heart_rate_bpm'] ?? 62;
                    $status = $hr > 110 ? 'critical' : ($hr > 85 ? 'warning' : 'nominal');

                    $vitalRows[] = [
                        'session_id' => $sessionId,
                        'astronaut_id' => $validated['astronaut_id'],
                        'measured_at' => $v['measured_at'] ?? now(),
                        'received_at' => now(),
                        'heart_rate_bpm' => $hr,
                        'spo2_percent' => $v['spo2_percent'] ?? 97.2,
                        'core_temp_celsius' => $v['core_temp_celsius'] ?? 36.7,
                        'respiratory_rate_bpm' => $v['respiratory_rate_bpm'] ?? 16.0,
                        'status' => $status,
                        'created_at' => now(),
                    ];
                }

                foreach (array_chunk($vitalRows, 100) as $chunk) {
                    DB::table('vital_readings')->insert($chunk);
                }
            }

            // 3. Insert Organ Telemetry Readings
            if (!empty($validated['organs'])) {
                $organRows = [];
                foreach ($validated['organs'] as $o) {
                    $organRows[] = [
                        'session_id' => $sessionId,
                        'astronaut_id' => $validated['astronaut_id'],
                        'organ_system_id' => $o['organ_system_id'],
                        'measured_at' => now(),
                        'health_score_percent' => $o['health_score_percent'] ?? 92.0,
                        'primary_metric_value' => $o['primary_metric_value'] ?? 'Nominal',
                        'primary_metric_unit' => $o['primary_metric_unit'] ?? '',
                        'status' => $o['status'] ?? 'nominal',
                        'created_at' => now(),
                    ];
                }
                DB::table('organ_telemetry_readings')->insert($organRows);
            }

            return ApiResponse::success([
                'session_id' => $sessionId,
                'packets_processed' => count($validated['vitals'] ?? []),
                'synced_at' => now()->toIso8601String(),
            ], 'Telemetry batch ingested and validated successfully.', 201);
        });
    }

    /**
     * Retrieve latest vitals and ECG state for an astronaut.
     */
    public function latest(int $astronautId): JsonResponse
    {
        $vitals = DB::table('vital_readings')
            ->where('astronaut_id', $astronautId)
            ->latest('measured_at')
            ->limit(30)
            ->get();

        $organs = DB::table('organ_telemetry_readings')
            ->join('organ_systems', 'organ_telemetry_readings.organ_system_id', '=', 'organ_systems.id')
            ->where('organ_telemetry_readings.astronaut_id', $astronautId)
            ->select('organ_systems.slug', 'organ_systems.name', 'health_score_percent', 'primary_metric_value', 'status')
            ->latest('organ_telemetry_readings.measured_at')
            ->limit(6)
            ->get();

        return ApiResponse::success([
            'astronaut_id' => $astronautId,
            'vitals_history' => $vitals,
            'organs' => $organs,
        ]);
    }
}
