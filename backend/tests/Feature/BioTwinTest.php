<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BioTwinTest extends TestCase
{
    use RefreshDatabase;

    protected User $flightSurgeon;

    protected User $cadet;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->flightSurgeon = User::where('email', 'flight_surgeon@auramed.nasa.gov')->firstOrFail();
        $this->cadet = User::where('email', 'cadet_student@auramed.nasa.gov')->firstOrFail();
    }

    /**
     * Unauthenticated request must return 401.
     */
    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/api/bio-twin/1');

        $response->assertStatus(401);
    }

    /**
     * User without view_vital_readings permission must return 403.
     */
    public function test_user_without_permission_is_forbidden(): void
    {
        Sanctum::actingAs($this->cadet);

        $response = $this->getJson('/api/bio-twin/1');

        $response->assertStatus(403);
    }

    /**
     * Nonexistent astronaut ID returns 404.
     */
    public function test_nonexistent_astronaut_returns_404(): void
    {
        Sanctum::actingAs($this->flightSurgeon);

        $response = $this->getJson('/api/bio-twin/9999');

        $response->assertStatus(404)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Astronaut not found.');
    }

    /**
     * Test Elena Vance (CDR-01): EVA exertion in upper/lower limbs, heart nominal, all 12 regions present.
     */
    public function test_elena_vance_telemetry_structure_and_eva_exertion(): void
    {
        Sanctum::actingAs($this->flightSurgeon);

        $response = $this->getJson('/api/bio-twin/1');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'astronaut' => [
                        'id',
                        'uuid',
                        'callsign',
                        'name',
                        'rank',
                        'specialization',
                        'blood_type',
                        'gender',
                        'total_eva_hours',
                        'total_space_days',
                        'status',
                    ],
                    'overall_health_score',
                    'overall_status',
                    'regions',
                ],
            ]);

        $regions = $response->json('data.regions');
        $this->assertCount(12, $regions);

        $expectedSlugs = [
            'brain',
            'eyes',
            'carotid_jugular',
            'heart',
            'lungs',
            'liver',
            'kidneys',
            'gastrointestinal',
            'spine',
            'muscular_core',
            'upper_limbs',
            'lower_limbs',
        ];

        $slugs = array_column($regions, 'slug');
        $this->assertEquals($expectedSlugs, $slugs);

        // Verify structure of every region
        foreach ($regions as $region) {
            $this->assertArrayHasKey('id', $region);
            $this->assertArrayHasKey('slug', $region);
            $this->assertArrayHasKey('name', $region);
            $this->assertArrayHasKey('system', $region);
            $this->assertArrayHasKey('health_score', $region);
            $this->assertArrayHasKey('status', $region);
            $this->assertArrayHasKey('primary_metric_label', $region);
            $this->assertArrayHasKey('primary_metric_value', $region);
            $this->assertArrayHasKey('primary_metric_unit', $region);
            $this->assertArrayHasKey('secondary_metrics', $region);
            $this->assertArrayHasKey('microgravity_adaptation', $region);
            $this->assertArrayHasKey('radiation_sensitivity', $region);
            $this->assertArrayHasKey('countermeasures', $region);
            $this->assertArrayHasKey('historical_trend_24h', $region);

            $this->assertGreaterThanOrEqual(0, $region['health_score']);
            $this->assertLessThanOrEqual(100, $region['health_score']);
            $this->assertContains($region['status'], ['nominal', 'warning', 'critical']);
            $this->assertContains($region['radiation_sensitivity'], ['low', 'moderate', 'high', 'extreme']);
            $this->assertNotEmpty($region['microgravity_adaptation']);
            $this->assertIsArray($region['countermeasures']);
            $this->assertNotEmpty($region['countermeasures']);

            // Secondary metrics assertions
            $this->assertIsArray($region['secondary_metrics']);
            $this->assertNotEmpty($region['secondary_metrics']);
            foreach ($region['secondary_metrics'] as $sec) {
                $this->assertArrayHasKey('label', $sec);
                $this->assertArrayHasKey('value', $sec);
                $this->assertArrayHasKey('unit', $sec);
                $this->assertArrayHasKey('status', $sec);
                $this->assertContains($sec['status'], ['nominal', 'warning', 'critical']);
            }

            // Historical trend assertions
            $this->assertCount(12, $region['historical_trend_24h']);
            foreach ($region['historical_trend_24h'] as $pt) {
                $this->assertArrayHasKey('time', $pt);
                $this->assertArrayHasKey('score', $pt);
            }
        }

        // Elena Vance specific checks: Heart nominal (74 BPM), EVA exertion in limbs
        $regionMap = collect($regions)->keyBy('slug');

        $heart = $regionMap['heart'];
        $this->assertEquals('nominal', $heart['status']);
        $this->assertEquals(74, $heart['primary_metric_value']);
        $this->assertEquals('BPM', $heart['primary_metric_unit']);
        $this->assertEquals(95, $heart['health_score']);

        $upperLimbs = $regionMap['upper_limbs'];
        $this->assertEquals(86, $upperLimbs['health_score']);
        $emgMetric = collect($upperLimbs['secondary_metrics'])->firstWhere('label', 'Forearm EMG Tone');
        $this->assertNotNull($emgMetric);
        $this->assertEquals('warning', $emgMetric['status']);

        $lowerLimbs = $regionMap['lower_limbs'];
        $this->assertEquals(88, $lowerLimbs['health_score']);

        // Check callsign resolution works
        $callsignResponse = $this->getJson('/api/bio-twin/CDR-01');
        $callsignResponse->assertStatus(200)
            ->assertJsonPath('data.astronaut.callsign', 'CDR-01');
    }

    /**
     * Test Marcus Chen (PLT-02): All nominal resting.
     */
    public function test_marcus_chen_telemetry_all_nominal_resting(): void
    {
        Sanctum::actingAs($this->flightSurgeon);

        $response = $this->getJson('/api/bio-twin/2');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.astronaut.callsign', 'PLT-02')
            ->assertJsonPath('data.overall_status', 'nominal');

        $regions = $response->json('data.regions');
        foreach ($regions as $region) {
            $this->assertEquals('nominal', $region['status'], "Organ {$region['slug']} should be nominal.");
            $this->assertGreaterThanOrEqual(95, $region['health_score']);
        }

        $regionMap = collect($regions)->keyBy('slug');
        $heart = $regionMap['heart'];
        $this->assertEquals(62, $heart['primary_metric_value']);
        $this->assertEquals('nominal', $heart['status']);

        $brain = $regionMap['brain'];
        $this->assertEquals(32, $brain['primary_metric_value']);
        $this->assertEquals('nominal', $brain['status']);
    }

    /**
     * Test Arya Patel (SPC-03): Tachycardia (Heart warning, 84 BPM), elevated Beta brainwaves (Brain warning, cognitive load 84%).
     */
    public function test_arya_patel_telemetry_tachycardia_and_elevated_beta_brainwaves(): void
    {
        Sanctum::actingAs($this->flightSurgeon);

        $response = $this->getJson('/api/bio-twin/3');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.astronaut.callsign', 'SPC-03')
            ->assertJsonPath('data.overall_status', 'warning');

        $regions = $response->json('data.regions');
        $regionMap = collect($regions)->keyBy('slug');

        // Heart warning, 84 BPM
        $heart = $regionMap['heart'];
        $this->assertEquals('warning', $heart['status']);
        $this->assertEquals(84, $heart['primary_metric_value']);
        $this->assertEquals('BPM', $heart['primary_metric_unit']);
        $this->assertEquals(76, $heart['health_score']);

        // Brain warning, cognitive load 84%, elevated Beta brainwaves
        $brain = $regionMap['brain'];
        $this->assertEquals('warning', $brain['status']);
        $this->assertEquals(84, $brain['primary_metric_value']);
        $this->assertEquals('%', $brain['primary_metric_unit']);
        $this->assertEquals(74, $brain['health_score']);

        $betaMetric = collect($brain['secondary_metrics'])->firstWhere('label', 'EEG Beta Power');
        $this->assertNotNull($betaMetric);
        $this->assertEquals('warning', $betaMetric['status']);
        $this->assertEquals(24.8, $betaMetric['value']);
    }

    /**
     * Test Alexei Ivanov (ENG-04): Nominal with mild spine elongation (Spine score 88%).
     */
    public function test_alexei_ivanov_telemetry_mild_spine_elongation(): void
    {
        Sanctum::actingAs($this->flightSurgeon);

        $response = $this->getJson('/api/bio-twin/4');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.astronaut.callsign', 'ENG-04');

        $regions = $response->json('data.regions');
        $regionMap = collect($regions)->keyBy('slug');

        $spine = $regionMap['spine'];
        $this->assertEquals(88, $spine['health_score']);
        $this->assertEquals('nominal', $spine['status']);
        $this->assertEquals(52.0, $spine['primary_metric_value']);
        $this->assertEquals('mm', $spine['primary_metric_unit']);

        // Other organs are nominal
        $heart = $regionMap['heart'];
        $this->assertEquals('nominal', $heart['status']);

        $brain = $regionMap['brain'];
        $this->assertEquals('nominal', $brain['status']);
    }
}
