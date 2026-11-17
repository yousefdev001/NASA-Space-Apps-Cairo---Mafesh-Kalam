<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Roles and Permissions
        $this->call(RolePermissionSeeder::class);

        // 2. Seed Organ Systems
        $this->call(OrganSystemSeeder::class);

        // 3. Seed Missions and Astronauts
        $this->call(MissionAndAstronautSeeder::class);

        // 4. Create Standard Role Users for Development & Testing
        $defaultPassword = Hash::make('Houston@2026!');

        $users = [
            [
                'name' => 'Dr. Henrik Lindqvist',
                'email' => 'flight_surgeon@auramed.nasa.gov',
                'role' => 'flight_surgeon',
            ],
            [
                'name' => 'Director Gene Kranz',
                'email' => 'mission_director@auramed.nasa.gov',
                'role' => 'mission_director',
            ],
            [
                'name' => 'Dr. Sarah Connor',
                'email' => 'medical_officer@auramed.nasa.gov',
                'role' => 'medical_officer',
            ],
            [
                'name' => 'Elena Vance (CDR-01)',
                'email' => 'astronaut_crew@auramed.nasa.gov',
                'role' => 'astronaut_crew',
            ],
            [
                'name' => 'Houston Ground Controller',
                'email' => 'ground_controller@auramed.nasa.gov',
                'role' => 'ground_controller',
            ],
            [
                'name' => 'AuraMed System Administrator',
                'email' => 'system_administrator@auramed.nasa.gov',
                'role' => 'system_administrator',
            ],
            [
                'name' => 'Cadet Leo Armstrong',
                'email' => 'cadet_student@auramed.nasa.gov',
                'role' => 'cadet_student',
            ],
            [
                'name' => 'Eng. Marcus Vance',
                'email' => 'biomedical_engineer@auramed.nasa.gov',
                'role' => 'biomedical_engineer',
            ],
            [
                'name' => 'Prof. Maya Lin',
                'email' => 'educator_content_creator@auramed.nasa.gov',
                'role' => 'educator_content_creator',
            ],
            [
                'name' => 'Inspector Evelyn Reed',
                'email' => 'auditor_compliance@auramed.nasa.gov',
                'role' => 'auditor_compliance',
            ],
        ];

        foreach ($users as $userData) {
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'uuid' => (string) Str::uuid(),
                    'name' => $userData['name'],
                    'password' => $defaultPassword,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );

            $user->syncRoles([$userData['role']]);
        }

        // 5. Seed Complete AuraMed Domain (AI Insights, Alerts, Reports, Academy, Articles, Audit)
        $this->call(AuraMedFullSeeder::class);

        // 6. Enrich Space Academy Curricula, Mini-Games, Badges & Leaderboard
        $this->call(AcademyCurriculumSeeder::class);
    }
}
