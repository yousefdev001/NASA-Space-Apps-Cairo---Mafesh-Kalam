<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MissionAndAstronautSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Missions
        $missions = [
            [
                'id' => 1,
                'uuid' => (string) Str::uuid(),
                'mission_code' => 'ARTEMIS-IV',
                'name' => 'Artemis IV Lunar Gateway Habitat Assembly',
                'description' => 'First mission to utilize the I-Hab international habitation module on Gateway, executing autonomous bio-astronautics telemetry recording.',
                'mission_type' => 'LUNAR',
                'status' => 'active',
                'launch_date' => now()->subDays(42)->toDateTimeString(),
                'expected_return_date' => now()->addDays(60)->toDateTimeString(),
                'vehicle_name' => 'Orion Spacecraft & SLS Block 1B',
                'destination' => 'Lunar Distant Retrograde Orbit (DRO)',
                'is_primary' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'uuid' => (string) Str::uuid(),
                'mission_code' => 'EXPEDITION-74',
                'name' => 'ISS Microgravity Long-Duration Cellular Study',
                'description' => 'Continuous cardiovascular baseline collection and circadian rhythm adjustment in the Columbus and Kibo modules.',
                'mission_type' => 'ISS',
                'status' => 'active',
                'launch_date' => now()->subDays(95)->toDateTimeString(),
                'expected_return_date' => now()->addDays(85)->toDateTimeString(),
                'vehicle_name' => 'Crew Dragon C212',
                'destination' => 'Low Earth Orbit (408 km)',
                'is_primary' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 3,
                'uuid' => (string) Str::uuid(),
                'mission_code' => 'ARES-PATHFINDER',
                'name' => 'Deep-Space Mars Habitat Transit Simulation',
                'description' => 'High-fidelity 18-month isolation simulation verifying autonomous offline clinical triage without real-time Houston voice uplink.',
                'mission_type' => 'MARS',
                'status' => 'planned',
                'launch_date' => now()->addMonths(6)->toDateTimeString(),
                'expected_return_date' => now()->addMonths(24)->toDateTimeString(),
                'vehicle_name' => 'Deep Space Transport Prototype',
                'destination' => 'Deep Space Transit Trajectory',
                'is_primary' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($missions as $mission) {
            DB::table('missions')->updateOrInsert(['id' => $mission['id']], $mission);
        }

        // 2. Create Astronauts
        $astronauts = [
            [
                'id' => 1,
                'uuid' => (string) Str::uuid(),
                'callsign' => 'CDR-01',
                'full_name' => 'Elena Vance',
                'nationality' => 'United States (NASA)',
                'date_of_birth' => '1988-06-14',
                'blood_type' => 'O+',
                'gender' => 'female',
                'rank' => 'Mission Commander / Flight Surgeon',
                'specialization' => 'Cardiothoracic Surgery & Bio-Astronautics',
                'total_eva_hours' => 28.5,
                'total_space_days' => 194,
                'eva_certified' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'uuid' => (string) Str::uuid(),
                'callsign' => 'PLT-02',
                'full_name' => 'Marcus Chen',
                'nationality' => 'Canada (CSA)',
                'date_of_birth' => '1990-11-22',
                'blood_type' => 'A+',
                'gender' => 'male',
                'rank' => 'Orbital Pilot / Systems Commander',
                'specialization' => 'Propulsion, Robotics & Orbital Navigation',
                'total_eva_hours' => 14.0,
                'total_space_days' => 112,
                'eva_certified' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 3,
                'uuid' => (string) Str::uuid(),
                'callsign' => 'SPC-03',
                'full_name' => 'Arya Patel',
                'nationality' => 'ESA / Germany',
                'date_of_birth' => '1992-04-18',
                'blood_type' => 'B+',
                'gender' => 'female',
                'rank' => 'Biomedical Payload Specialist',
                'specialization' => 'Molecular Biology, Microgravity Genomics',
                'total_eva_hours' => 6.2,
                'total_space_days' => 85,
                'eva_certified' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 4,
                'uuid' => (string) Str::uuid(),
                'callsign' => 'ENG-04',
                'full_name' => 'Alexei Ivanov',
                'nationality' => 'ESA / France',
                'date_of_birth' => '1985-09-30',
                'blood_type' => 'AB-',
                'gender' => 'male',
                'rank' => 'Lead Life Support Systems Engineer',
                'specialization' => 'ECLSS Closed-Loop Systems & Thermodynamics',
                'total_eva_hours' => 32.0,
                'total_space_days' => 240,
                'eva_certified' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($astronauts as $astro) {
            DB::table('astronauts')->updateOrInsert(['id' => $astro['id']], $astro);
        }

        // 3. Mission Crew Assignments
        $assignments = [
            ['mission_id' => 1, 'astronaut_id' => 1, 'crew_role' => 'Mission Commander', 'assigned_at' => now()->subDays(60), 'is_primary_crew' => true, 'created_at' => now(), 'updated_at' => now()],
            ['mission_id' => 1, 'astronaut_id' => 2, 'crew_role' => 'Orbital Pilot', 'assigned_at' => now()->subDays(60), 'is_primary_crew' => true, 'created_at' => now(), 'updated_at' => now()],
            ['mission_id' => 1, 'astronaut_id' => 3, 'crew_role' => 'Biomed Specialist', 'assigned_at' => now()->subDays(60), 'is_primary_crew' => true, 'created_at' => now(), 'updated_at' => now()],
            ['mission_id' => 2, 'astronaut_id' => 4, 'crew_role' => 'Lead Systems Engineer', 'assigned_at' => now()->subDays(120), 'is_primary_crew' => true, 'created_at' => now(), 'updated_at' => now()],
        ];

        foreach ($assignments as $assign) {
            DB::table('mission_crew_assignments')->updateOrInsert(
                ['mission_id' => $assign['mission_id'], 'astronaut_id' => $assign['astronaut_id']],
                $assign
            );
        }

        // 3b. Mission Operational Phases
        $phases = [
            // Artemis IV
            ['mission_id' => 1, 'phase_order' => 1, 'phase_name' => 'Trans-Lunar Injection', 'status' => 'completed', 'started_at' => now()->subDays(42), 'completed_at' => now()->subDays(39), 'description' => 'Translunar burn executed by SLS Block 1B second stage. High-gain tracking acquired.'],
            ['mission_id' => 1, 'phase_order' => 2, 'phase_name' => 'Gateway Docking', 'status' => 'completed', 'started_at' => now()->subDays(39), 'completed_at' => now()->subDays(35), 'description' => 'Soft capture and autonomous hard-docking with Lunar Gateway HALO module.'],
            ['mission_id' => 1, 'phase_order' => 3, 'phase_name' => 'Habitat Pressurization', 'status' => 'active', 'started_at' => now()->subDays(35), 'completed_at' => null, 'description' => 'I-Hab internal atmospheric equalization and closed-loop life support system validation.'],
            ['mission_id' => 1, 'phase_order' => 4, 'phase_name' => 'Lunar South Pole EVA', 'status' => 'pending', 'started_at' => null, 'completed_at' => null, 'description' => 'Crew surface descent in Human Landing System (HLS) to Shackleton Crater permanently shadowed region.'],
            ['mission_id' => 1, 'phase_order' => 5, 'phase_name' => 'Earth Return & Recovery', 'status' => 'pending', 'started_at' => null, 'completed_at' => null, 'description' => 'Trans-Earth injection burn, atmospheric entry interface, and Pacific Ocean retrieval.'],

            // Expedition-74
            ['mission_id' => 2, 'phase_order' => 1, 'phase_name' => 'Launch & Rendezvous', 'status' => 'completed', 'started_at' => now()->subDays(95), 'completed_at' => now()->subDays(94), 'description' => 'Autonomous Falcon 9 launch from LC-39A and docking to Node 2 Harmony forward port.'],
            ['mission_id' => 2, 'phase_order' => 2, 'phase_name' => 'Science Payload Activation', 'status' => 'active', 'started_at' => now()->subDays(94), 'completed_at' => null, 'description' => 'Cellular microgravity bioreactor deployment and continuous cardiovascular telemetry downlink.'],
            ['mission_id' => 2, 'phase_order' => 3, 'phase_name' => 'EVA Radiator Inspection', 'status' => 'pending', 'started_at' => null, 'completed_at' => null, 'description' => 'Scheduled robotic arm inspection and ammonia loop pressure survey of starboard radiators.'],
            ['mission_id' => 2, 'phase_order' => 4, 'phase_name' => 'Crew Rotation Handover', 'status' => 'pending', 'started_at' => null, 'completed_at' => null, 'description' => 'Orbital handover briefing and cold-stowage sample transfer for Expedition 75 arrival.'],

            // Ares-Pathfinder
            ['mission_id' => 3, 'phase_order' => 1, 'phase_name' => 'Hab Integration', 'status' => 'pending', 'started_at' => null, 'completed_at' => null, 'description' => 'Hermetic seal integrity and autonomous life-support closed-loop baseline validation.'],
            ['mission_id' => 3, 'phase_order' => 2, 'phase_name' => 'Comms Latency Protocol', 'status' => 'pending', 'started_at' => null, 'completed_at' => null, 'description' => 'Simulating 22-minute bidirectional Mars-Earth radio communication delay.'],
            ['mission_id' => 3, 'phase_order' => 3, 'phase_name' => 'Solar Storm Protocol', 'status' => 'pending', 'started_at' => null, 'completed_at' => null, 'description' => 'Deep-space storm shelter deployment and heavy ion dosimeter calibration.'],
            ['mission_id' => 3, 'phase_order' => 4, 'phase_name' => 'Autonomous Clinical Triage', 'status' => 'pending', 'started_at' => null, 'completed_at' => null, 'description' => 'AuraMed offline Edge-AI diagnostic validation without ground station guidance.'],
        ];

        foreach ($phases as $phase) {
            DB::table('mission_phases')->updateOrInsert(
                ['mission_id' => $phase['mission_id'], 'phase_order' => $phase['phase_order']],
                array_merge($phase, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        // 4. Seed Astronaut Baselines
        foreach ($astronauts as $astro) {
            DB::table('astronaut_medical_baselines')->updateOrInsert(
                ['astronaut_id' => $astro['id']],
                [
                    'astronaut_id' => $astro['id'],
                    'measured_at' => now()->subDays(15),
                    'heart_rate_bpm' => $astro['id'] === 3 ? 78 : 62,
                    'spo2_percent' => 98.5,
                    'core_temp_celsius' => 36.7,
                    'systolic_bp' => 118,
                    'diastolic_bp' => 76,
                    'respiratory_rate' => 15,
                    'weight_kg' => 72.5,
                    'height_cm' => 176.0,
                    'vo2_max' => 54.2,
                    'notes' => 'Nominal pre-flight clinical bio-baseline certified under NASA STD-3001.',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // 5. Seed Telemetry Session & Organ Telemetry for Astronaut Elena Vance (CDR-01)
        $sessionId = DB::table('telemetry_sessions')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'astronaut_id' => 1,
            'mission_id' => 1,
            'device_id' => 'AURAMED-CREW-PAD-01',
            'session_type' => 'sync',
            'connection_quality' => 'excellent',
            'started_at' => now()->subMinutes(15),
            'ended_at' => now(),
            'received_at' => now(),
            'packet_count' => 60,
            'is_complete' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Seed the 6 Organ Telemetry rows (matching the image)
        $organRecords = [
            ['session_id' => $sessionId, 'astronaut_id' => 1, 'organ_system_id' => 1, 'measured_at' => now(), 'health_score_percent' => 92.0, 'primary_metric_value' => '62 BPM', 'primary_metric_unit' => 'BPM', 'status' => 'nominal', 'created_at' => now()],
            ['session_id' => $sessionId, 'astronaut_id' => 1, 'organ_system_id' => 2, 'measured_at' => now(), 'health_score_percent' => 96.0, 'primary_metric_value' => '97% SpO2', 'primary_metric_unit' => '% SpO2', 'status' => 'nominal', 'created_at' => now()],
            ['session_id' => $sessionId, 'astronaut_id' => 1, 'organ_system_id' => 3, 'measured_at' => now(), 'health_score_percent' => 95.0, 'primary_metric_value' => '8.4 Hz Alpha', 'primary_metric_unit' => 'Hz Alpha', 'status' => 'nominal', 'created_at' => now()],
            ['session_id' => $sessionId, 'astronaut_id' => 1, 'organ_system_id' => 4, 'measured_at' => now(), 'health_score_percent' => 92.0, 'primary_metric_value' => 'ALT/AST Nominal', 'primary_metric_unit' => '', 'status' => 'nominal', 'created_at' => now()],
            ['session_id' => $sessionId, 'astronaut_id' => 1, 'organ_system_id' => 5, 'measured_at' => now(), 'health_score_percent' => 92.0, 'primary_metric_value' => 'Hydration 92%', 'primary_metric_unit' => 'Hydration %', 'status' => 'nominal', 'created_at' => now()],
            ['session_id' => $sessionId, 'astronaut_id' => 1, 'organ_system_id' => 6, 'measured_at' => now(), 'health_score_percent' => 94.0, 'primary_metric_value' => '36.7 °C', 'primary_metric_unit' => '°C', 'status' => 'nominal', 'created_at' => now()],
        ];

        DB::table('organ_telemetry_readings')->insert($organRecords);

        // Seed 10 Vital readings
        for ($i = 0; $i < 10; $i++) {
            DB::table('vital_readings')->insert([
                'session_id' => $sessionId,
                'astronaut_id' => 1,
                'measured_at' => now()->subMinutes(10 - $i),
                'received_at' => now(),
                'heart_rate_bpm' => 62 + ($i % 3),
                'spo2_percent' => 97.2 + (($i % 2) * 0.4),
                'core_temp_celsius' => 36.7,
                'respiratory_rate_bpm' => 15.8,
                'hrv_rmssd_ms' => 42.5,
                'status' => 'nominal',
                'created_at' => now(),
            ]);
        }
    }
}
