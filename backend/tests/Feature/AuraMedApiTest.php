<?php

namespace Tests\Feature;

use App\Models\AiInsight;
use App\Models\Alert;
use App\Models\Article;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuraMedApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $flightSurgeon;

    protected User $cadet;

    protected User $auditor;

    protected User $groundController;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->flightSurgeon = User::where('email', 'flight_surgeon@auramed.nasa.gov')->firstOrFail();
        $this->cadet = User::where('email', 'cadet_student@auramed.nasa.gov')->firstOrFail();
        $this->auditor = User::where('email', 'system_administrator@auramed.nasa.gov')->firstOrFail();
        $this->groundController = User::where('email', 'ground_controller@auramed.nasa.gov')->firstOrFail();
    }

    /**
     * Test public health endpoint without authentication.
     */
    public function test_health_endpoint_returns_operational(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'operational');
    }

    /**
     * Test operator authentication and Sanctum bearer token creation.
     */
    public function test_flight_surgeon_can_login_and_receive_token(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'flight_surgeon@auramed.nasa.gov',
            'password' => 'Houston@2026!',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'token',
                    'token_type',
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'roles',
                        'permissions',
                    ],
                ],
            ]);
    }

    /**
     * Verify unauthenticated requests to protected endpoints return 401.
     */
    public function test_unauthenticated_requests_return_401(): void
    {
        $response = $this->getJson('/api/dashboard/mission-control');
        $response->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    /**
     * Verify RBAC permission separation: Cadet is forbidden (403) from approving AI insights.
     */
    public function test_cadet_forbidden_from_approving_ai_insights(): void
    {
        Sanctum::actingAs($this->cadet);
        $insight = AiInsight::first();

        $response = $this->postJson("/api/ai-insights/{$insight->id}/approve", [
            'reviewer_notes' => 'Attempt by cadet',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    /**
     * Verify RBAC permission separation: Cadet is forbidden (403) from generating clinical reports.
     */
    public function test_cadet_forbidden_from_generating_reports(): void
    {
        Sanctum::actingAs($this->cadet);

        $response = $this->postJson('/api/reports', [
            'title' => 'Unauthorized Report',
            'report_type' => 'crew_health_summary',
            'summary' => 'Cadet testing',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    /**
     * Test Mission Control dashboard access for authorized Flight Surgeon.
     */
    public function test_mission_control_dashboard_returns_telemetry_payload(): void
    {
        Sanctum::actingAs($this->flightSurgeon);

        $response = $this->getJson('/api/dashboard/mission-control');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'mission',
                    'crew',
                    'organs',
                    'unresolved_alerts_count',
                    'cabin_environment',
                    'radiation',
                ],
            ]);
    }

    /**
     * Test astronauts roster for authorized personnel.
     */
    public function test_astronauts_roster_returns_crew(): void
    {
        Sanctum::actingAs($this->flightSurgeon);

        $response = $this->getJson('/api/astronauts');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertGreaterThanOrEqual(1, count($response->json('data')));
    }

    /**
     * Test telemetry ingestion by authorized Ground Controller.
     */
    public function test_telemetry_batch_ingestion_by_ground_controller(): void
    {
        Sanctum::actingAs($this->groundController);

        $payload = [
            'astronaut_id' => 1,
            'mission_id' => 1,
            'device_id' => 'AURAMED-DOWNLINK-01',
            'session_type' => 'sync',
            'vitals' => [
                [
                    'heart_rate_bpm' => 64,
                    'spo2_percent' => 97.8,
                    'core_temp_celsius' => 36.8,
                ],
            ],
            'organs' => [
                [
                    'organ_system_id' => 1,
                    'health_score_percent' => 92.5,
                    'primary_metric_value' => '64 BPM',
                    'status' => 'nominal',
                ],
            ],
        ];

        $response = $this->postJson('/api/telemetry/ingest', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.packets_processed', 1);
    }

    /**
     * Test AI insights review lifecycle (HITL) by Flight Surgeon.
     */
    public function test_ai_insights_review_workflow_by_flight_surgeon(): void
    {
        Sanctum::actingAs($this->flightSurgeon);

        $insight = AiInsight::where('review_status', 'pending_review')->first();
        $this->assertNotNull($insight);

        // 1. Approve
        $approveRes = $this->postJson("/api/ai-insights/{$insight->id}/approve", [
            'reviewer_notes' => 'Clinically verified by ground flight surgeon.',
        ]);
        $approveRes->assertStatus(200)
            ->assertJsonPath('data.insight.review_status', 'approved');

        // 2. Reject
        $rejectRes = $this->postJson("/api/ai-insights/{$insight->id}/reject", [
            'reviewer_notes' => 'Artifact due to baseline sensor drift.',
        ]);
        $rejectRes->assertStatus(200)
            ->assertJsonPath('data.insight.review_status', 'rejected');

        // 3. Stats endpoint
        $statsRes = $this->getJson('/api/ai-insights/stats');
        $statsRes->assertStatus(200)
            ->assertJsonStructure(['data' => ['total', 'approved', 'rejected', 'average_confidence']]);
    }

    /**
     * Test Alert triage workflow (acknowledge, escalate, resolve).
     */
    public function test_alerts_triage_workflow(): void
    {
        Sanctum::actingAs($this->flightSurgeon);

        $alert = Alert::first();
        $this->assertNotNull($alert);

        // 1. Unresolved count
        $countRes = $this->getJson('/api/alerts/unresolved-count');
        $countRes->assertStatus(200)
            ->assertJsonStructure(['data' => ['total_unresolved', 'critical', 'high', 'medium']]);

        // 2. Acknowledge
        $ackRes = $this->postJson("/api/alerts/{$alert->id}/acknowledge", [
            'action_taken' => 'Oxygen mix checked and stabilized.',
        ]);
        $ackRes->assertStatus(200)
            ->assertJsonPath('data.alert.status', 'acknowledged');

        // 3. Escalate
        $escRes = $this->postJson("/api/alerts/{$alert->id}/escalate", [
            'escalated_to_role' => 'flight_surgeon',
            'reason' => 'Anomalous trend persists across 3 consecutive scans.',
        ]);
        $escRes->assertStatus(200)
            ->assertJsonPath('data.alert.status', 'escalated');

        // 4. Resolve
        $resRes = $this->postJson("/api/alerts/{$alert->id}/resolve", [
            'resolution_notes' => 'Vitals returned to standard baseline.',
        ]);
        $resRes->assertStatus(200)
            ->assertJsonPath('data.status', 'resolved');
    }

    /**
     * Test Report generation, DomPDF export, and forensic timeline.
     */
    public function test_reports_generation_and_export(): void
    {
        Sanctum::actingAs($this->flightSurgeon);

        // 1. Create Report
        $payload = [
            'title' => 'Artemis Crew Health EVA Debrief',
            'report_type' => 'eva_debrief',
            'astronaut_id' => 1,
            'summary' => 'Astronaut demonstrated nominal cardiopulmonary endurance during 6-hour lunar surface excursion.',
            'forensic_events' => [
                [
                    'event_time' => now()->toIso8601String(),
                    'event_type' => 'EVA Egress',
                    'title' => 'Suit Airlock Depressurization',
                    'related_metric' => 'Suit Pressure',
                    'metric_value' => '4.3 PSI',
                    'severity' => 'info',
                ],
            ],
        ];

        $createRes = $this->postJson('/api/reports', $payload);
        $createRes->assertStatus(201)
            ->assertJsonPath('success', true);

        $reportId = $createRes->json('data.id');

        // 2. Forensic timeline
        $forensicRes = $this->getJson("/api/reports/{$reportId}/forensic");
        $forensicRes->assertStatus(200)
            ->assertJsonPath('success', true);

        // 3. Export PDF
        $pdfRes = $this->get("/api/reports/{$reportId}/export/pdf");
        $pdfRes->assertStatus(200)
            ->assertHeader('content-type', 'application/pdf');

        // 4. Export CSV
        $csvRes = $this->get("/api/reports/{$reportId}/export/csv");
        $csvRes->assertStatus(200)
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }

    /**
     * Test Academy courses, quizzes, and XP reward logic.
     */
    public function test_space_academy_quiz_and_gamification(): void
    {
        // 1. Public courses list
        $courseRes = $this->getJson('/api/academy/courses');
        $courseRes->assertStatus(200)
            ->assertJsonPath('success', true);

        // 2. Quiz submission (Authenticated Cadet)
        Sanctum::actingAs($this->cadet);
        $lessonId = 1;
        $quizRes = $this->postJson("/api/academy/lessons/{$lessonId}/submit-quiz", [
            'answers' => [1 => 1], // Correct answer index
        ]);
        $quizRes->assertStatus(200)
            ->assertJsonPath('data.passed', true);

        // 3. Public Leaderboard
        $leadRes = $this->getJson('/api/academy/leaderboard');
        $leadRes->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    /**
     * Test Public Educational Articles system (Kids & Adults).
     */
    public function test_articles_public_and_slug_resolution(): void
    {
        // 1. Public List (No Auth)
        $listRes = $this->getJson('/api/public/articles?audience=kids');
        $listRes->assertStatus(200)
            ->assertJsonPath('success', true);

        // 2. Public Detail by slug (No Auth)
        $article = Article::where('target_audience', 'kids')->first();
        $this->assertNotNull($article);

        $detailRes = $this->getJson("/api/public/articles/{$article->slug}");
        $detailRes->assertStatus(200)
            ->assertJsonPath('data.article.slug', $article->slug);
    }

    /**
     * Test SHA-256 cryptographic non-repudiation audit trail.
     */
    public function test_audit_chain_cryptographic_verification(): void
    {
        Sanctum::actingAs($this->auditor);

        $verifyRes = $this->getJson('/api/audit-logs/verify');
        $verifyRes->assertStatus(200)
            ->assertJsonPath('data.is_valid', true)
            ->assertJsonPath('data.chain_status', 'CRYPTO_VERIFIED_SECURE');
    }
}
