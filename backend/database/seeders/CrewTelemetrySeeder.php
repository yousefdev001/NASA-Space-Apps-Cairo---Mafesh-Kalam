<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CrewTelemetrySeeder extends Seeder
{
    public function run(): void
    {
        $crewData = [
            1 => [
                'callsign' => 'CDR-01',
                'name' => 'Elena Vance',
                'zone' => 'Quest Airlock / EVA-1',
                'status' => 'nominal',
                'hr_base' => 62,
                'spo2_base' => 97.2,
                'temp_base' => 36.7,
                'resp_base' => 14.5,
                'dose_rate' => 0.042,
                'cum_dose' => 14.2,
                'organs' => [
                    1 => ['score' => 92.0, 'metric' => '62 BPM', 'unit' => 'BPM', 'status' => 'nominal'],
                    2 => ['score' => 96.0, 'metric' => '97% SpO2', 'unit' => '% SpO2', 'status' => 'nominal'],
                    3 => ['score' => 95.0, 'metric' => '8.4 Hz Alpha', 'unit' => 'Hz Alpha', 'status' => 'nominal'],
                    4 => ['score' => 92.0, 'metric' => 'ALT/AST Nominal', 'unit' => '', 'status' => 'nominal'],
                    5 => ['score' => 92.0, 'metric' => 'Hydration 92%', 'unit' => 'Hydration %', 'status' => 'nominal'],
                    6 => ['score' => 94.0, 'metric' => '36.7 °C', 'unit' => '°C', 'status' => 'nominal'],
                ],
            ],
            2 => [
                'callsign' => 'PLT-02',
                'name' => 'Marcus Chen',
                'zone' => 'Cupola Flight Deck',
                'status' => 'nominal',
                'hr_base' => 74,
                'spo2_base' => 98.4,
                'temp_base' => 36.6,
                'resp_base' => 16.0,
                'dose_rate' => 0.038,
                'cum_dose' => 18.7,
                'organs' => [
                    1 => ['score' => 89.0, 'metric' => '74 BPM', 'unit' => 'BPM', 'status' => 'nominal'],
                    2 => ['score' => 98.0, 'metric' => '98.4% SpO2', 'unit' => '% SpO2', 'status' => 'nominal'],
                    3 => ['score' => 94.0, 'metric' => '9.8 Hz Alpha/Beta', 'unit' => 'Hz', 'status' => 'nominal'],
                    4 => ['score' => 94.0, 'metric' => 'ALT/AST Nominal', 'unit' => '', 'status' => 'nominal'],
                    5 => ['score' => 95.0, 'metric' => 'Hydration 95%', 'unit' => 'Hydration %', 'status' => 'nominal'],
                    6 => ['score' => 95.0, 'metric' => '36.6 °C', 'unit' => '°C', 'status' => 'nominal'],
                ],
            ],
            3 => [
                'callsign' => 'SPC-03',
                'name' => 'Arya Patel',
                'zone' => 'Columbus Lab Module',
                'status' => 'warning',
                'hr_base' => 84,
                'spo2_base' => 95.8,
                'temp_base' => 37.1,
                'resp_base' => 18.2,
                'dose_rate' => 0.055,
                'cum_dose' => 22.4,
                'organs' => [
                    1 => ['score' => 81.0, 'metric' => '84 BPM Elevated', 'unit' => 'BPM', 'status' => 'warning'],
                    2 => ['score' => 94.0, 'metric' => '95.8% SpO2', 'unit' => '% SpO2', 'status' => 'nominal'],
                    3 => ['score' => 88.0, 'metric' => '12.2 Hz Beta (Stress)', 'unit' => 'Hz Beta', 'status' => 'warning'],
                    4 => ['score' => 91.0, 'metric' => 'ALT/AST Nominal', 'unit' => '', 'status' => 'nominal'],
                    5 => ['score' => 88.0, 'metric' => 'Hydration 88%', 'unit' => 'Hydration %', 'status' => 'warning'],
                    6 => ['score' => 90.0, 'metric' => '37.1 °C Mild Temp', 'unit' => '°C', 'status' => 'nominal'],
                ],
            ],
            4 => [
                'callsign' => 'ENG-04',
                'name' => 'Alexei Ivanov',
                'zone' => 'Node 3 / ECLSS Bay',
                'status' => 'nominal',
                'hr_base' => 68,
                'spo2_base' => 97.8,
                'temp_base' => 36.8,
                'resp_base' => 15.0,
                'dose_rate' => 0.040,
                'cum_dose' => 16.1,
                'organs' => [
                    1 => ['score' => 93.0, 'metric' => '68 BPM', 'unit' => 'BPM', 'status' => 'nominal'],
                    2 => ['score' => 97.0, 'metric' => '97.8% SpO2', 'unit' => '% SpO2', 'status' => 'nominal'],
                    3 => ['score' => 92.0, 'metric' => '8.9 Hz Alpha', 'unit' => 'Hz Alpha', 'status' => 'nominal'],
                    4 => ['score' => 93.0, 'metric' => 'ALT/AST Nominal', 'unit' => '', 'status' => 'nominal'],
                    5 => ['score' => 91.0, 'metric' => 'Hydration 91%', 'unit' => 'Hydration %', 'status' => 'nominal'],
                    6 => ['score' => 93.0, 'metric' => '36.8 °C', 'unit' => '°C', 'status' => 'nominal'],
                ],
            ],
        ];

        foreach ($crewData as $astroId => $data) {
            // Create a session for this astronaut if not exists
            $sessionId = DB::table('telemetry_sessions')->insertGetId([
                'uuid' => (string) Str::uuid(),
                'astronaut_id' => $astroId,
                'mission_id' => 1,
                'device_id' => 'AURAMED-BIO-PAD-'.str_pad((string) $astroId, 2, '0', STR_PAD_LEFT),
                'session_type' => 'sync',
                'connection_quality' => 'excellent',
                'started_at' => now()->subHours(2),
                'ended_at' => now(),
                'received_at' => now(),
                'packet_count' => 60,
                'is_complete' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Clear old organ telemetry and vital readings for fresh realistic data
            DB::table('organ_telemetry_readings')->where('astronaut_id', $astroId)->delete();
            DB::table('vital_readings')->where('astronaut_id', $astroId)->delete();
            DB::table('radiation_readings')->where('astronaut_id', $astroId)->delete();

            // 6 Organ readings
            $organRows = [];
            foreach ($data['organs'] as $organSysId => $org) {
                $organRows[] = [
                    'session_id' => $sessionId,
                    'astronaut_id' => $astroId,
                    'organ_system_id' => $organSysId,
                    'measured_at' => now(),
                    'health_score_percent' => $org['score'],
                    'primary_metric_value' => $org['metric'],
                    'primary_metric_unit' => $org['unit'],
                    'status' => $org['status'],
                    'created_at' => now(),
                ];
            }
            DB::table('organ_telemetry_readings')->insert($organRows);

            // 20 time-series vital readings (1 reading per minute for the last 20 minutes)
            $vitalRows = [];
            for ($m = 20; $m >= 0; $m--) {
                $jitterHr = ($m % 4) - 2;
                $jitterSpo2 = (($m % 3) - 1) * 0.2;
                $vitalRows[] = [
                    'session_id' => $sessionId,
                    'astronaut_id' => $astroId,
                    'measured_at' => now()->subMinutes($m),
                    'received_at' => now()->subMinutes($m),
                    'heart_rate_bpm' => $data['hr_base'] + $jitterHr,
                    'spo2_percent' => round($data['spo2_base'] + $jitterSpo2, 1),
                    'core_temp_celsius' => $data['temp_base'],
                    'respiratory_rate_bpm' => $data['resp_base'],
                    'hrv_rmssd_ms' => 45.0,
                    'status' => $data['status'],
                    'created_at' => now()->subMinutes($m),
                ];
            }
            DB::table('vital_readings')->insert($vitalRows);

            // Radiation record
            DB::table('radiation_readings')->insert([
                'session_id' => $sessionId,
                'astronaut_id' => $astroId,
                'measured_at' => now(),
                'dose_rate_msv_hr' => $data['dose_rate'],
                'cumulative_dose_msv' => $data['cum_dose'],
                'particle_type' => 'Protons & HZE ions',
                'energy_spectra' => '100 - 450 MeV',
                'shelter_recommended' => false,
                'created_at' => now(),
            ]);
        }
    }
}
