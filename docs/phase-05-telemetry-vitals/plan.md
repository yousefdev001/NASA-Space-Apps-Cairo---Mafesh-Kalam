# Phase 05 — Telemetry & Vitals (Mission Control)

## Goal
Build the core telemetry ingestion pipeline and Mission Control display layer. This phase handles receiving data from the mobile app (synced), storing it correctly, computing status/alerts, and displaying it in real-time HUD panels.

---

## Backend — Telemetry Ingestion

### 5.1 Ingestion Endpoint (Ground Controller only)
```
POST /api/telemetry/ingest
Permission: ingest_telemetry_data (ground_controller, sys_admin)
```

**Accepts a batch payload (mobile sync packet):**
```json
{
  "astronaut_uuid": "...",
  "mission_uuid": "...",
  "device_id": "AURAMED-PHONE-001",
  "session_type": "sync",
  "connection_quality": "good",
  "started_at": "2026-11-17T10:00:00.000Z",
  "ended_at": "2026-11-17T10:05:00.000Z",
  "vitals": [
    {
      "measured_at": "2026-11-17T10:00:00.123Z",
      "heart_rate_bpm": 62,
      "spo2_percent": 97.0,
      "core_temp_celsius": 36.7,
      "respiratory_rate_bpm": 16.2,
      "hrv_rmssd_ms": 42.5,
      "stress_index": 1.8,
      "blood_glucose_mgdl": 88.0,
      "raw_payload": {}
    }
  ],
  "organ_telemetry": [
    {
      "measured_at": "2026-11-17T10:00:00.000Z",
      "organ_slug": "heart",
      "health_score_percent": 92.0,
      "primary_metric_value": "62",
      "primary_metric_unit": "BPM",
      "status": "nominal",
      "raw_data": {}
    }
  ],
  "ecg_recordings": [],
  "eeg_recordings": [],
  "radiation_readings": [],
  "suit_telemetry": []
}
```

**Processing pipeline:**
```
1. Validate payload → 422 on error
2. Create TelemetrySession record
3. Bulk insert VitalReadings (chunked, 100 per batch)
4. Bulk insert OrganTelemetryReadings
5. Apply threshold checks → dispatch AlertCheckJob
6. Update TelemetryAggregate (hourly bucket)
7. Return session summary
```

### 5.2 TelemetryService — Core Logic
```php
class TelemetryService
{
    public function ingestBatch(array $data): TelemetrySession
    {
        return DB::transaction(function () use ($data) {
            $session = TelemetrySession::create([...]);
            
            // Bulk insert — NO N+1
            $vitalsData = collect($data['vitals'])->map(fn($v) => [
                ...$v,
                'session_id' => $session->id,
                'astronaut_id' => $session->astronaut_id,
                'received_at' => now(),
                'status' => $this->computeVitalStatus($v, $session->astronaut_id),
            ])->toArray();
            
            foreach (array_chunk($vitalsData, 100) as $chunk) {
                VitalReading::insert($chunk);
            }
            
            // Same for organ telemetry
            // Check thresholds → trigger alerts
            $this->alertService->checkThresholds($session);
            
            return $session;
        });
    }
    
    private function computeVitalStatus(array $vital, int $astronautId): string
    {
        // Load thresholds once (cached per astronaut)
        $thresholds = $this->thresholdService->getForAstronaut($astronautId);
        
        // Check each metric against thresholds
        // Return: 'nominal' | 'warning' | 'critical'
    }
}
```

### 5.3 Telemetry Read Endpoints

| Method | Route | Permission | Description |
|--------|-------|-----------|-------------|
| POST | `/api/telemetry/ingest` | `ingest_telemetry_data` | Mobile sync ingestion |
| GET | `/api/telemetry/{astronaut}/latest` | `view_vital_readings` | Latest vitals |
| GET | `/api/telemetry/{astronaut}/vitals` | `view_vital_readings` | Paginated vitals history |
| GET | `/api/telemetry/{astronaut}/organs` | `view_organ_telemetry` | Organ telemetry |
| GET | `/api/telemetry/{astronaut}/organs/latest` | `view_organ_telemetry` | Latest organ snapshot |
| GET | `/api/telemetry/{astronaut}/ecg` | `view_ecg_recordings` | ECG recordings |
| GET | `/api/telemetry/{astronaut}/eeg` | `view_eeg_recordings` | EEG recordings |
| GET | `/api/telemetry/{astronaut}/radiation` | `view_radiation_readings` | Radiation data |
| GET | `/api/telemetry/{astronaut}/suit` | `view_suit_telemetry` | EVA suit telemetry |
| GET | `/api/telemetry/{astronaut}/aggregates` | `view_vital_readings` | Hourly/daily aggregates |
| GET | `/api/telemetry/{astronaut}/timeline` | `view_vital_readings` | Multi-metric timeline |
| PUT | `/api/telemetry/thresholds/{astronaut}` | `update_thresholds` | Update thresholds |
| GET | `/api/telemetry/thresholds/{astronaut}` | `view_thresholds` | Get thresholds |
| GET | `/api/missions/{mission}/environment` | `view_vital_readings` | Cabin environment |
| GET | `/api/missions/{mission}/met` | `view_missions` | Mission elapsed time |
| GET | `/api/dashboard/mission-control` | `view_vital_readings` | Full MC dashboard data |

### 5.4 Mission Control Dashboard Endpoint
```
GET /api/dashboard/mission-control
```
Returns everything needed for the Mission Control screen in one call:
```json
{
  "active_missions": [...],
  "crew_status_summary": [
    {
      "astronaut_id": 1,
      "callsign": "CDR-01",
      "name": "Elena Vance",
      "photo_url": "...",
      "current_status": "nominal",
      "latest_vitals": {
        "heart_rate_bpm": 62,
        "spo2_percent": 97.0,
        "core_temp_celsius": 36.7,
        "status": "nominal",
        "measured_at": "..."
      },
      "organ_health_scores": {
        "heart": 92,
        "lungs": 96,
        "brain": 95,
        "liver": 92,
        "kidneys": 92,
        "whole_body": 94
      },
      "active_alerts_count": 0
    }
  ],
  "unresolved_alerts_count": 2,
  "pending_ai_reviews_count": 1,
  "environment": {...}
}
```

**Query Optimization:** This endpoint is cached for 60 seconds to avoid heavy joins on every poll.

---

## Frontend — Mission Control Dashboard

### 5.5 Page Layout: `/mission-control`
```
┌─────────────────────────────────────────────────┐
│  AURAMED MISSION CONTROL          MET: T+45:12   │
│  [Active Mission: Artemis IV]     [Alert: 2 ⚠️]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  CREW STATUS ROW (horizontal cards)             │
│  [CDR-01] [PLT-02] [SPC-03]                     │
│  NOMINAL   WARNING  NOMINAL                     │
│                                                 │
├───────────────────┬─────────────────────────────┤
│  SELECTED CREW    │  ORGAN TELEMETRY GRID        │
│  VITALS PANEL     │  (matches mobile app UI)     │
│  ─────────────    │  ┌──────┬──────┐             │
│  HR: 62 BPM  ✅   │  │Heart │Lungs │            │
│  SpO2: 97%  ✅    │  │ 92%  │ 96% │            │
│  Temp: 36.7°C ✅  │  ├──────┼──────┤            │
│  HRV: 42ms  ✅    │  │Brain │Liver │            │
│  Radiation: low ✅ │  │ 95%  │ 92% │            │
│                   │  ├──────┼──────┤            │
│  [ECG Chart]      │  │Kidnys│WhBdy │           │
│  ~~~waveform~~~   │  │ 92%  │ 94% │            │
│                   │  └──────┴──────┘            │
├───────────────────┴─────────────────────────────┤
│  ALERTS TRIAGE  │  ENVIRONMENT  │  MET EVENTS   │
│  [2 unresolved] │  Cabin: 101kPa│  Timeline     │
└─────────────────────────────────────────────────┘
```

### 5.6 Key Frontend Components

**`MissionControlDashboard`** — Main page, polls every 30s
**`CrewStatusCard`** — Per-astronaut compact status
**`VitalsPanel`** — Detailed vitals for selected astronaut
**`OrganTelemetryGrid`** — 6-card grid matching mobile app exactly:
  - Heart / Cardiovascular — BPM + status
  - Lungs / Respiratory — SpO2 + status
  - Brain / CNS — Hz Alpha + status
  - Liver / Hepatic — ALT/AST + status
  - Kidneys / Renal — Hydration % + status
  - Whole Body / Systemic — Core Temp + status
  
**`EcgChart`** — Animated ECG waveform (using canvas or ECharts)
**`MetClock`** — Live mission elapsed time (updates every second)
**`RadiationGauge`** — Circular gauge for radiation dose
**`AlertBadge`** — Count of unresolved alerts

### 5.7 OrganTelemetryGrid Component
```tsx
const ORGAN_CONFIGS = [
  { slug: 'heart', label: 'Heart', category: 'Cardiovascular', unit: 'BPM', icon: '❤️' },
  { slug: 'lungs', label: 'Lungs', category: 'Respiratory', unit: 'SpO2', icon: '🫁' },
  { slug: 'brain', label: 'Brain', category: 'Central Nervous', unit: 'Hz Alpha', icon: '🧠' },
  { slug: 'liver', label: 'Liver', category: 'Hepatic / Metabolic', unit: 'ALT/AST', icon: '🫀' },
  { slug: 'kidneys', label: 'Kidneys', category: 'Renal System', unit: 'Hydration %', icon: '💧' },
  { slug: 'whole-body', label: 'Whole Body', category: 'Systemic Bio-Scan', unit: '°C', icon: '🧍' },
];

function OrganCard({ organ, reading }: { organ: OrganConfig; reading: OrganReading }) {
  const statusColor = {
    nominal: 'text-hud-emerald border-hud-emerald',
    warning: 'text-hud-amber border-hud-amber',
    critical: 'text-hud-crimson border-hud-crimson animate-pulse',
  }[reading.status];
  
  return (
    <div className={`bg-cosmic-navy border ${statusColor} rounded-lg p-4 flex flex-col gap-2`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-hud-white font-semibold">{organ.label}</p>
          <p className="text-hud-muted text-xs">{organ.category}</p>
        </div>
        <span className="text-hud-cyan font-bold text-sm">{reading.health_score_percent}%</span>
      </div>
      <div className="text-3xl text-center">{organ.icon}</div>
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded border ${statusColor} uppercase font-mono`}>
          {reading.status}
        </span>
        <span className="text-hud-white font-mono text-sm">
          {reading.primary_metric_value} {reading.unit}
        </span>
      </div>
    </div>
  );
}
```

### 5.8 Polling Strategy
```ts
// React Query: poll latest telemetry every 30 seconds
const { data: crewStatus } = useQuery({
  queryKey: ['mission-control', 'crew-status'],
  queryFn: () => missionControlApi.getDashboard(),
  refetchInterval: 30_000,
  staleTime: 25_000,
});

// MET clock: local JS interval (no API call needed)
// ECG waveform: could be simulated/interpolated between real readings
```

---

## Deliverables for Phase 05
- [ ] `POST /api/telemetry/ingest` with batch processing + chunked inserts
- [ ] All telemetry read endpoints
- [ ] `TelemetryService` with threshold checking
- [ ] Threshold auto-population from `astronaut_medical_baselines` on astronaut creation
- [ ] `TelemetryAggregatesCommand` scheduled job (hourly + daily)
- [ ] `GET /api/dashboard/mission-control` with 60s cache
- [ ] Frontend: Mission Control page layout
- [ ] Frontend: `OrganTelemetryGrid` matching mobile app design
- [ ] Frontend: `EcgChart` (animated waveform)
- [ ] Frontend: `VitalsPanel` with all 6 primary metrics
- [ ] Frontend: `MetClock` live counter
- [ ] 30-second polling via React Query refetchInterval
