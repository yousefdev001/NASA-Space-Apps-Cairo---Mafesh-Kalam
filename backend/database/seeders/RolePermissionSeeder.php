<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 60 Granular Permissions
        $permissions = [
            // Astronauts
            'view_astronauts',
            'view_own_astronaut_profile',
            'create_astronauts',
            'update_astronauts',
            'delete_astronauts',
            'view_medical_records',
            'create_medical_records',
            'view_astronaut_baselines',

            // Missions
            'view_missions',
            'create_missions',
            'update_missions',
            'delete_missions',
            'assign_crew_to_mission',
            'view_mission_media',
            'upload_mission_media',

            // Telemetry
            'view_vital_readings',
            'view_own_vital_readings',
            'view_organ_telemetry',
            'view_ecg_recordings',
            'view_eeg_recordings',
            'view_radiation_readings',
            'view_suit_telemetry',
            'ingest_telemetry_data',

            // AI & Clinical
            'view_ai_insights',
            'approve_ai_insights',
            'reject_ai_insights',
            'modify_ai_insights',
            'view_ai_model_registry',

            // Alerts
            'view_alerts',
            'view_own_alerts',
            'acknowledge_alerts',
            'escalate_alerts',
            'resolve_alerts',
            'dismiss_alerts',

            // Reports
            'view_reports',
            'create_reports',
            'update_reports',
            'approve_reports',
            'publish_reports',
            'export_reports_pdf',
            'export_reports_csv',
            'view_forensic_timeline',

            // Academy
            'view_academy',
            'view_own_progress',
            'create_courses',
            'update_courses',
            'delete_courses',
            'manage_quizzes',

            // Articles
            'view_articles',
            'create_articles',
            'update_articles',
            'delete_articles',
            'publish_articles',

            // Admin & Security
            'manage_users',
            'assign_roles',
            'view_audit_logs',
            'verify_audit_chain',
            'manage_system_settings',

            // Thresholds
            'view_thresholds',
            'update_thresholds',
        ];

        foreach ($permissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName, 'guard_name' => 'web']);
        }

        // 10 Distinct Roles
        $roles = [
            'flight_surgeon' => [
                'view_astronauts',
                'view_medical_records',
                'create_medical_records',
                'view_astronaut_baselines',
                'view_missions',
                'view_vital_readings',
                'view_organ_telemetry',
                'view_ecg_recordings',
                'view_eeg_recordings',
                'view_radiation_readings',
                'view_suit_telemetry',
                'view_ai_insights',
                'approve_ai_insights',
                'reject_ai_insights',
                'modify_ai_insights',
                'view_alerts',
                'acknowledge_alerts',
                'escalate_alerts',
                'resolve_alerts',
                'view_reports',
                'create_reports',
                'update_reports',
                'approve_reports',
                'export_reports_pdf',
                'export_reports_csv',
                'view_forensic_timeline',
                'view_academy',
                'view_articles',
                'view_thresholds',
                'update_thresholds',
            ],
            'mission_director' => [
                'view_astronauts',
                'create_astronauts',
                'update_astronauts',
                'view_missions',
                'create_missions',
                'update_missions',
                'assign_crew_to_mission',
                'view_mission_media',
                'upload_mission_media',
                'view_vital_readings',
                'view_organ_telemetry',
                'view_ai_insights',
                'view_alerts',
                'acknowledge_alerts',
                'escalate_alerts',
                'resolve_alerts',
                'view_reports',
                'create_reports',
                'approve_reports',
                'export_reports_pdf',
                'view_academy',
                'view_articles',
            ],
            'medical_officer' => [
                'view_astronauts',
                'view_medical_records',
                'view_astronaut_baselines',
                'view_vital_readings',
                'view_organ_telemetry',
                'view_ecg_recordings',
                'view_radiation_readings',
                'view_ai_insights',
                'view_alerts',
                'acknowledge_alerts',
                'resolve_alerts',
                'view_reports',
                'create_reports',
                'view_thresholds',
                'update_thresholds',
                'view_academy',
                'view_articles',
            ],
            'biomedical_engineer' => [
                'view_astronauts',
                'view_vital_readings',
                'view_organ_telemetry',
                'view_suit_telemetry',
                'view_radiation_readings',
                'view_alerts',
                'view_reports',
                'create_reports',
                'view_thresholds',
                'update_thresholds',
                'view_academy',
                'view_articles',
            ],
            'astronaut_crew' => [
                'view_own_astronaut_profile',
                'view_own_vital_readings',
                'view_own_alerts',
                'view_missions',
                'view_academy',
                'view_articles',
            ],
            'ground_controller' => [
                'view_astronauts',
                'view_missions',
                'view_vital_readings',
                'view_organ_telemetry',
                'ingest_telemetry_data',
                'view_alerts',
                'acknowledge_alerts',
                'view_academy',
                'view_articles',
            ],
            'cadet_student' => [
                'view_academy',
                'view_own_progress',
                'view_articles',
            ],
            'educator_content_creator' => [
                'view_academy',
                'create_courses',
                'update_courses',
                'delete_courses',
                'manage_quizzes',
                'view_articles',
                'create_articles',
                'update_articles',
                'delete_articles',
                'publish_articles',
            ],
            'system_administrator' => $permissions, // All permissions
            'auditor_compliance' => [
                'view_astronauts',
                'view_missions',
                'view_vital_readings',
                'view_organ_telemetry',
                'view_reports',
                'view_forensic_timeline',
                'view_audit_logs',
                'verify_audit_chain',
                'view_academy',
                'view_articles',
            ],
        ];

        foreach ($roles as $roleName => $rolePermissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($rolePermissions);
        }
    }
}
