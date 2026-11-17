# Phase 05 — Notes & Telemetry Design

## Polling vs WebSockets
- **Decision: Polling (30s interval)** via React Query `refetchInterval`
- WebSockets (Laravel Reverb) is future upgrade path if real-time needs increase
- 30s is acceptable for ground-based monitoring (not safety-critical real-time)

## Telemetry Bulk Insert Performance
- Use `Model::insert([...])` NOT `Model::create()` in loops (avoids N+1 on inserts)
- Chunk at 100 records per INSERT statement to avoid packet size limits
- Skip model events/observers during bulk insert (they don't fire on `insert()`)
- Alert checking runs AFTER all records are inserted, not per-row

## Aggregate Jobs Schedule
```php
// routes/console.php
Schedule::command('telemetry:aggregate hourly')->hourly();
Schedule::command('telemetry:aggregate daily')->dailyAt('00:05');
```

## Threshold Loading (Anti N+1)
```php
// WRONG (N+1):
foreach ($vitals as $vital) {
    $threshold = TelemetryThreshold::where('astronaut_id', $vital->astronaut_id)
        ->where('metric_name', 'heart_rate_bpm')->first(); // N queries!
}

// CORRECT (eager load once):
$thresholds = TelemetryThreshold::where('astronaut_id', $astronautId)
    ->orWhere('is_global', true)
    ->get()
    ->keyBy('metric_name'); // Single query, keyed for O(1) lookup

foreach ($vitals as $vital) {
    $threshold = $thresholds->get('heart_rate_bpm'); // O(1), no query
}
```

## Mission Control Dashboard Cache
```php
Cache::remember("mission_control_dashboard", 60, function () {
    return $this->buildDashboardData();
});

// Invalidate cache when new telemetry arrives:
Cache::forget("mission_control_dashboard");
```

## ECG Waveform Display
- Raw ECG data stored as JSON array of amplitude values
- Frontend renders using HTML5 Canvas API (not a chart library — too slow for ECG)
- Waveform is animated by shifting the array and redrawing each frame
- Sample rate: 500Hz (500 points per second stored)
- Display: show last 5 seconds = 2500 points, downsampled to 500 for display
