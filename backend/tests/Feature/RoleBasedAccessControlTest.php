<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoleBasedAccessControlTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    /**
     * Verify all 10 roles are seeded with their required emails and password.
     */
    public function test_all_ten_roles_are_properly_seeded_with_users(): void
    {
        $expectedRoles = [
            'flight_surgeon@auramed.nasa.gov' => 'flight_surgeon',
            'mission_director@auramed.nasa.gov' => 'mission_director',
            'medical_officer@auramed.nasa.gov' => 'medical_officer',
            'biomedical_engineer@auramed.nasa.gov' => 'biomedical_engineer',
            'astronaut_crew@auramed.nasa.gov' => 'astronaut_crew',
            'ground_controller@auramed.nasa.gov' => 'ground_controller',
            'cadet_student@auramed.nasa.gov' => 'cadet_student',
            'educator_content_creator@auramed.nasa.gov' => 'educator_content_creator',
            'auditor_compliance@auramed.nasa.gov' => 'auditor_compliance',
            'system_administrator@auramed.nasa.gov' => 'system_administrator',
        ];

        foreach ($expectedRoles as $email => $roleName) {
            $user = User::where('email', $email)->first();
            $this->assertNotNull($user, "User {$email} must exist.");
            $this->assertTrue($user->hasRole($roleName), "User {$email} must possess role {$roleName}.");

            // Test authentication with default password
            $loginResponse = $this->postJson('/api/auth/login', [
                'email' => $email,
                'password' => 'Houston@2026!',
            ]);
            $loginResponse->assertStatus(200);
            $this->assertContains($roleName, $loginResponse->json('data.user.roles'));
        }
    }

    /**
     * AI Clinical Review (/api/ai-insights) must be accessible ONLY to
     * Flight Surgeon, Medical Officer, Mission Director, System Administrator.
     * Cadet, Educator, Biomedical Engineer, and Astronaut Crew must receive 403 Forbidden.
     */
    public function test_ai_clinical_review_restricted_to_clinical_roles_only(): void
    {
        // 1. Authorized roles
        $authorizedEmails = [
            'flight_surgeon@auramed.nasa.gov',
            'medical_officer@auramed.nasa.gov',
            'mission_director@auramed.nasa.gov',
            'system_administrator@auramed.nasa.gov',
        ];

        foreach ($authorizedEmails as $email) {
            $user = User::where('email', $email)->firstOrFail();
            Sanctum::actingAs($user);

            $response = $this->getJson('/api/ai-insights');
            $response->assertStatus(200);
        }

        // 2. Strictly Forbidden roles
        $forbiddenEmails = [
            'biomedical_engineer@auramed.nasa.gov',
            'cadet_student@auramed.nasa.gov',
            'educator_content_creator@auramed.nasa.gov',
            'astronaut_crew@auramed.nasa.gov',
            'auditor_compliance@auramed.nasa.gov',
        ];

        foreach ($forbiddenEmails as $email) {
            $user = User::where('email', $email)->firstOrFail();
            Sanctum::actingAs($user);

            $response = $this->getJson('/api/ai-insights');
            $response->assertStatus(403);
            $response->assertJsonPath('success', false);
        }
    }

    /**
     * Mission Control telemetry (/api/dashboard/mission-control) access separation.
     * Allowed: flight_surgeon, biomedical_engineer, auditor_compliance, etc.
     * Forbidden: cadet_student, educator_content_creator.
     */
    public function test_mission_control_access_separation(): void
    {
        // Authorized: Flight Surgeon & Biomedical Engineer
        $biomed = User::where('email', 'biomedical_engineer@auramed.nasa.gov')->firstOrFail();
        Sanctum::actingAs($biomed);
        $this->getJson('/api/dashboard/mission-control')->assertStatus(200);

        // Forbidden: Cadet Student
        $cadet = User::where('email', 'cadet_student@auramed.nasa.gov')->firstOrFail();
        Sanctum::actingAs($cadet);
        $this->getJson('/api/dashboard/mission-control')
            ->assertStatus(403)
            ->assertJsonPath('success', false);

        // Forbidden: Educator Content Creator
        $educator = User::where('email', 'educator_content_creator@auramed.nasa.gov')->firstOrFail();
        Sanctum::actingAs($educator);
        $this->getJson('/api/dashboard/mission-control')
            ->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    /**
     * Audit log ledger (/api/audit-logs) must be restricted to auditor and system admin.
     * Flight surgeon and cadet student must be forbidden (403).
     */
    public function test_audit_logs_restricted_to_auditor_and_admin(): void
    {
        // Allowed: Auditor
        $auditor = User::where('email', 'auditor_compliance@auramed.nasa.gov')->firstOrFail();
        Sanctum::actingAs($auditor);
        $this->getJson('/api/audit-logs')->assertStatus(200);

        // Allowed: System Administrator
        $admin = User::where('email', 'system_administrator@auramed.nasa.gov')->firstOrFail();
        Sanctum::actingAs($admin);
        $this->getJson('/api/audit-logs')->assertStatus(200);

        // Forbidden: Flight Surgeon (cannot audit own records)
        $surgeon = User::where('email', 'flight_surgeon@auramed.nasa.gov')->firstOrFail();
        Sanctum::actingAs($surgeon);
        $this->getJson('/api/audit-logs')->assertStatus(403);

        // Forbidden: Cadet
        $cadet = User::where('email', 'cadet_student@auramed.nasa.gov')->firstOrFail();
        Sanctum::actingAs($cadet);
        $this->getJson('/api/audit-logs')->assertStatus(403);
    }

    /**
     * Alerts triage (/api/alerts) permission separation.
     * Allowed: Flight Surgeon, Biomedical Engineer.
     * Forbidden: Cadet Student, Auditor.
     */
    public function test_alerts_triage_permission_separation(): void
    {
        // Allowed: Flight Surgeon
        $surgeon = User::where('email', 'flight_surgeon@auramed.nasa.gov')->firstOrFail();
        Sanctum::actingAs($surgeon);
        $this->getJson('/api/alerts')->assertStatus(200);

        // Allowed: Biomedical Engineer
        $biomed = User::where('email', 'biomedical_engineer@auramed.nasa.gov')->firstOrFail();
        Sanctum::actingAs($biomed);
        $this->getJson('/api/alerts')->assertStatus(200);

        // Forbidden: Cadet Student
        $cadet = User::where('email', 'cadet_student@auramed.nasa.gov')->firstOrFail();
        Sanctum::actingAs($cadet);
        $this->getJson('/api/alerts')->assertStatus(403);

        // Forbidden: Auditor
        $auditor = User::where('email', 'auditor_compliance@auramed.nasa.gov')->firstOrFail();
        Sanctum::actingAs($auditor);
        $this->getJson('/api/alerts')->assertStatus(403);
    }

    /**
     * Space Academy authenticated progress is accessible to Cadet.
     */
    public function test_space_academy_accessible_to_cadet(): void
    {
        $cadet = User::where('email', 'cadet_student@auramed.nasa.gov')->firstOrFail();
        Sanctum::actingAs($cadet);

        $this->getJson('/api/academy/badges')->assertStatus(200);
        $this->getJson('/api/academy/my-progress')->assertStatus(200);
    }
}
