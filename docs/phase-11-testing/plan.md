# Phase 11 — Full Testing Layer

## Goal
Complete E2E test coverage using Pest PHP for backend, Vitest + RTL for frontend. All edge cases covered. Zero failing tests before any deployment.

---

## Backend Tests (Pest PHP)

### Test File Structure
```
backend/tests/
├── Feature/
│   ├── Auth/
│   │   ├── LoginTest.php
│   │   ├── LogoutTest.php
│   │   ├── ForgotPasswordTest.php
│   │   └── RateLimitTest.php
│   ├── Rbac/
│   │   ├── RolePermissionTest.php
│   │   └── RbacEnforcementTest.php
│   ├── Astronaut/
│   │   ├── AstronautCrudTest.php
│   │   ├── AstronautOwnershipTest.php
│   │   └── MedicalRecordTest.php
│   ├── Mission/
│   │   ├── MissionCrudTest.php
│   │   ├── CrewAssignmentTest.php
│   │   └── MetCalculationTest.php
│   ├── Telemetry/
│   │   ├── TelemetryIngestionTest.php
│   │   ├── ThresholdCheckTest.php
│   │   └── AlertDeduplicationTest.php
│   ├── Alert/
│   │   └── AlertStateMachineTest.php
│   ├── AiInsight/
│   │   └── ClinicalReviewWorkflowTest.php
│   ├── Report/
│   │   ├── ReportCreationTest.php
│   │   └── ReportExportTest.php
│   ├── Academy/
│   │   ├── CourseProgressTest.php
│   │   └── XpBadgeTest.php
│   ├── Article/
│   │   └── ArticleCrudTest.php
│   └── Audit/
│       └── AuditChainTest.php
└── Unit/
    ├── TelemetryServiceTest.php
    ├── AlertServiceTest.php
    ├── MetCalculationTest.php
    └── AuditHashTest.php
```

### Sample Tests
```php
// Feature/Telemetry/ThresholdCheckTest.php
test('telemetry ingestion creates critical alert when heart rate exceeds threshold', function () {
    $astronaut = Astronaut::factory()->create();
    TelemetryThreshold::factory()->create([
        'astronaut_id' => $astronaut->id,
        'metric_name' => 'heart_rate_bpm',
        'critical_max' => 120,
    ]);
    
    $response = $this->actingAs($groundController, 'sanctum')
        ->postJson('/api/telemetry/ingest', [
            'astronaut_uuid' => $astronaut->uuid,
            'vitals' => [['heart_rate_bpm' => 145, 'measured_at' => now()]],
        ]);
    
    $response->assertOk();
    expect(Alert::where('astronaut_id', $astronaut->id)
        ->where('severity', 'critical')
        ->exists()
    )->toBeTrue();
});

// Feature/Auth/RateLimitTest.php
test('login is rate limited after 5 failed attempts', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/auth/login', ['email' => 'x@x.com', 'password' => 'wrong']);
    }
    
    $response = $this->postJson('/api/auth/login', ['email' => 'x@x.com', 'password' => 'wrong']);
    $response->assertStatus(429);
});

// Feature/Rbac/RbacEnforcementTest.php
test('cadet cannot access mission control endpoint', function () {
    $cadet = User::factory()->create();
    $cadet->assignRole('cadet_student');
    
    $this->actingAs($cadet, 'sanctum')
        ->getJson('/api/dashboard/mission-control')
        ->assertForbidden();
});
```

### Edge Cases Covered
- Telemetry ingestion with 0 vital readings → success, session created with packet_count=0
- Duplicate packet (same astronaut, same measured_at) → deduplicated, no duplicate rows
- Alert deduplication within same hour → first created, second silently skipped
- Clinical review of already-reviewed insight → 409 Conflict
- Astronaut crew viewing another astronaut's vitals → 403
- Cadet accessing mission control → 403
- Report approval by user without approve_reports permission → 403
- Article with published_at in future → not in public listing
- MET clock with null launch_date → returns 0 seconds, 'T+00:00:00:00'
- Pagination with page > total → empty data array, not 404
- Audit hash chain verification with tampered log → returns is_valid: false

---

## Frontend Tests (Vitest + RTL)

### Test File Structure
```
frontend/src/
├── components/
│   ├── ui/Button.test.tsx
│   ├── telemetry/OrganTelemetryGrid.test.tsx
│   ├── telemetry/VitalsPanel.test.tsx
│   └── alerts/AlertBadge.test.tsx
├── hooks/
│   ├── useAuthStore.test.ts
│   └── useTelemetry.test.ts
└── pages/
    └── guards/ProtectedRoute.test.tsx
```

### Sample Frontend Tests
```tsx
// OrganTelemetryGrid.test.tsx
it('shows critical status as crimson color', () => {
  const mockData = createOrganData({ status: 'critical' });
  render(<OrganTelemetryGrid data={mockData} />);
  expect(screen.getByText('CRITICAL')).toHaveClass('text-hud-crimson');
});

it('renders all 6 organ systems', () => {
  render(<OrganTelemetryGrid data={mockAllOrgansData} />);
  ['Heart', 'Lungs', 'Brain', 'Liver', 'Kidneys', 'Whole Body'].forEach(organ => {
    expect(screen.getByText(organ)).toBeInTheDocument();
  });
});

// ProtectedRoute.test.tsx
it('redirects unauthenticated user to login', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/mission-control']}>
      <ProtectedRoute requiredRoles={['flight_surgeon']}><div>Protected</div></ProtectedRoute>
    </MemoryRouter>
  );
  expect(container.textContent).not.toContain('Protected');
});
```

---

## Deliverables for Phase 11
- [ ] All Pest feature tests passing
- [ ] All Pest unit tests passing
- [ ] All edge cases covered (see list above)
- [ ] All Vitest component tests passing
- [ ] Zero N+1 queries confirmed (Laravel Telescope assertions)
- [ ] All API responses match documented shapes
- [ ] Audit chain verification test passing
- [ ] 403/401/422 error responses properly tested
