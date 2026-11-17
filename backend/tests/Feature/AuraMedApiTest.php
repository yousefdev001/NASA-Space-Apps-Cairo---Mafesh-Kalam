<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuraMedApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }
    /**
     * Test system health endpoint.
     */
    public function test_health_endpoint_returns_operational(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'operational');
    }

    /**
     * Test operator authentication and Sanctum token generation.
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
     * Test Mission Control dashboard data endpoint.
     */
    public function test_mission_control_dashboard_returns_telemetry_payload(): void
    {
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
     * Test astronauts roster endpoint.
     */
    public function test_astronauts_roster_returns_crew(): void
    {
        $response = $this->getJson('/api/astronauts');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertGreaterThanOrEqual(1, count($response->json('data')));
    }

    /**
     * Test telemetry ingestion from mobile bio-scan.
     */
    public function test_telemetry_batch_ingestion(): void
    {
        $payload = [
            'astronaut_id' => 1,
            'mission_id' => 1,
            'device_id' => 'AURAMED-CREW-PAD-01',
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
}
