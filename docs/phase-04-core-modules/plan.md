# Phase 04 — Core Modules: Astronauts & Missions

## Goal
Build the core CRUD modules for astronauts and missions — the central data entities of the system. All endpoints must be paginated, properly authorized, eager-loaded, and return consistent API responses.

---

## Backend — Astronaut Module

### 4.1 API Endpoints

| Method | Route | Permission | Description |
|--------|-------|-----------|-------------|
| GET | `/api/astronauts` | `view_astronauts` | Paginated list with filters |
| GET | `/api/astronauts/{id}` | `view_astronauts` | Single astronaut detail |
| POST | `/api/astronauts` | `create_astronauts` | Create new astronaut |
| PUT | `/api/astronauts/{id}` | `update_astronauts` | Update astronaut |
| DELETE | `/api/astronauts/{id}` | `delete_astronauts` | Soft delete |
| GET | `/api/astronauts/{id}/medical-records` | `view_medical_records` | Medical records |
| POST | `/api/astronauts/{id}/medical-records` | `create_medical_records` | Add medical record |
| GET | `/api/astronauts/{id}/baselines` | `view_astronaut_baselines` | Baseline measurements |
| POST | `/api/astronauts/{id}/baselines` | `create_medical_records` | Add baseline |
| GET | `/api/astronauts/{id}/certifications` | `view_astronauts` | Certifications list |
| GET | `/api/astronauts/{id}/missions` | `view_astronauts` | Missions history |
| GET | `/api/astronauts/me` | `view_own_astronaut_profile` | Current astronaut's own profile |

### 4.2 AstronautController (thin — delegates to AstronautService)
```php
class AstronautController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $astronauts = $this->astronautService->listAstronauts($request->validated());
        return ApiResponse::paginated(AstronautResource::collection($astronauts));
    }
    
    public function show(Astronaut $astronaut): JsonResponse
    {
        $this->authorize('view', $astronaut);
        $astronaut->load(['user', 'missionCrewAssignments.mission', 'latestVitals', 'certifications']);
        return ApiResponse::success(new AstronautDetailResource($astronaut));
    }
}
```

### 4.3 Astronaut Eager Loading Strategy
```php
// List (lightweight):
Astronaut::with(['user:id,name,email,avatar_path'])
    ->withCount(['missions', 'medicalRecords'])
    ->paginate(15);

// Detail (full):
Astronaut::with([
    'user',
    'certifications' => fn($q) => $q->where('is_valid', true),
    'missionCrewAssignments.mission:id,name,status,launch_date',
    'latestVitals',  // hasOne with latestOfMany()
    'latestOrganTelemetry', // hasMany scoped to latest session
])->findOrFail($id);
```

### 4.4 Astronaut Filters (Query Builder)
```
?search=Elena           → name/callsign LIKE
?is_active=true
?eva_certified=true
?nationality=US
?mission_status=active  → has active mission
?sort_by=total_space_days&sort_dir=desc
?per_page=15
```

### 4.5 AstronautResource (API Transformer)
```php
class AstronautResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'callsign' => $this->callsign,
            'full_name' => $this->full_name,
            'nationality' => $this->nationality,
            'blood_type' => $this->blood_type,
            'rank' => $this->rank,
            'specialization' => $this->specialization,
            'photo_url' => $this->photo_path ? Storage::url($this->photo_path) : null,
            'is_active' => $this->is_active,
            'eva_certified' => $this->eva_certified,
            'total_eva_hours' => $this->total_eva_hours,
            'total_space_days' => $this->total_space_days,
            'missions_count' => $this->whenCounted('missions'),
            'current_status' => $this->when_loaded('latestVitals', 
                fn() => $this->latestVitals?->status ?? 'unknown'
            ),
        ];
    }
}
```

---

## Backend — Mission Module

### 4.6 API Endpoints

| Method | Route | Permission | Description |
|--------|-------|-----------|-------------|
| GET | `/api/missions` | `view_missions` | Paginated list |
| GET | `/api/missions/{id}` | `view_missions` | Mission detail |
| POST | `/api/missions` | `create_missions` | Create mission |
| PUT | `/api/missions/{id}` | `update_missions` | Update mission |
| DELETE | `/api/missions/{id}` | `delete_missions` | Archive mission |
| GET | `/api/missions/{id}/crew` | `view_missions` | Crew roster |
| POST | `/api/missions/{id}/crew` | `assign_crew_to_mission` | Assign astronaut |
| DELETE | `/api/missions/{id}/crew/{astronaut}` | `assign_crew_to_mission` | Remove crew |
| GET | `/api/missions/{id}/phases` | `view_missions` | Mission phases |
| PUT | `/api/missions/{id}/phases/{phase}` | `update_missions` | Update phase |
| GET | `/api/missions/{id}/media` | `view_mission_media` | Mission photos/videos |
| POST | `/api/missions/{id}/media` | `upload_mission_media` | Upload media |
| GET | `/api/missions/{id}/notes` | `view_missions` | Mission notes |
| POST | `/api/missions/{id}/notes` | `update_missions` | Add note |
| GET | `/api/missions/{id}/met` | `view_missions` | Mission elapsed time |
| GET | `/api/missions/active` | `view_missions` | Currently active missions |

### 4.7 Mission Eager Loading
```php
// List:
Mission::with(['createdBy:id,name', 'activeCrew:id,callsign,full_name,photo_path'])
    ->withCount(['crewAssignments', 'alerts', 'media'])
    ->where('status', '!=', 'aborted')
    ->latest('launch_date')
    ->paginate(10);

// Detail:
Mission::with([
    'createdBy',
    'crewAssignments.astronaut:id,uuid,callsign,full_name,photo_path,specialization',
    'phases' => fn($q) => $q->orderBy('phase_order'),
    'media' => fn($q) => $q->latest()->limit(20),
    'notes' => fn($q) => $q->with('author:id,name')->latest()->limit(10),
    'environmentTelemetry' => fn($q) => $q->latest()->first(),
])->findOrFail($id);
```

### 4.8 Mission Elapsed Time (MET)
```php
// MET calculation (real-time, not stored — computed from launch_date):
class MissionService
{
    public function getMissionElapsedTime(Mission $mission): array
    {
        if (!$mission->launch_date || $mission->status === 'planned') {
            return ['seconds' => 0, 'formatted' => 'T+00:00:00:00'];
        }
        
        $elapsed = now()->diffInSeconds($mission->launch_date);
        $days = intdiv($elapsed, 86400);
        $hours = intdiv($elapsed % 86400, 3600);
        $minutes = intdiv($elapsed % 3600, 60);
        $seconds = $elapsed % 60;
        
        return [
            'seconds' => $elapsed,
            'formatted' => sprintf('T+%02d:%02d:%02d:%02d', $days, $hours, $minutes, $seconds),
            'days' => $days,
            'hours' => $hours,
            'minutes' => $minutes,
            'seconds' => $seconds,
        ];
    }
}
```

---

## Frontend — Astronaut Pages

### 4.9 Pages & Components

**`/astronauts`** — Crew Roster
- Grid of AstronautCard components
- Filters: active/all, EVA certified, search
- Each card: photo, callsign, name, role, status badge, quick vitals snapshot

**`/astronauts/:id`** — Astronaut Detail
- Hero section: photo, callsign, full name, rank, nationality
- Tabs: Overview | Medical Records | Baselines | Certifications | Missions | Documents
- Overview tab: bio, current status, latest vitals mini-panel, active mission
- Medical Records: timeline of records (paginated, sorted by date)
- Baselines: chart of baseline measurements over time

### 4.10 AstronautCard Component
```tsx
interface AstronautCardProps {
  astronaut: AstronautSummary;
}
// Shows: photo, callsign, name, status badge (NOMINAL/WARNING/CRITICAL)
// Click → /astronauts/:id
// Status color from latest vitals status
```

---

## Frontend — Mission Pages

**`/missions`** — Missions List
- Tabs: Active | Planned | Completed | All
- MissionCard: mission code, name, type badge, crew count, launch date, status
- Active missions show live MET clock (polling every second)

**`/missions/:id`** — Mission Detail
- Header: mission name, code, status badge, MET clock
- Crew section: crew photos + roles
- Phases: horizontal timeline stepper
- Media gallery: photos/videos grid
- Notes: chronological log
- Environment stats: cabin pressure, O2, CO2

### 4.11 MET Clock (Frontend)
```tsx
function MissionElapsedTimeClock({ launchDate }: { launchDate: string }) {
  const [elapsed, setElapsed] = useState(calcElapsed(launchDate));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(calcElapsed(launchDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [launchDate]);
  
  return (
    <div className="font-mono text-hud-cyan text-2xl tracking-widest">
      T+{elapsed.formatted}
    </div>
  );
}
```

---

## Deliverables for Phase 04
- [ ] All astronaut API endpoints working + tested
- [ ] All mission API endpoints working + tested
- [ ] AstronautResource + AstronautDetailResource transformers
- [ ] MissionResource + MissionDetailResource transformers
- [ ] AstronautService + MissionService with clean business logic
- [ ] All Form Request validation classes
- [ ] AstronautPolicy + MissionPolicy for `astronaut_crew` scoping
- [ ] Eager loading strategy applied — zero N+1 confirmed
- [ ] Pagination on all list endpoints
- [ ] Frontend: AstronautCard, AstronautDetail page (tabs)
- [ ] Frontend: MissionCard, MissionDetail page
- [ ] Frontend: MET Clock component (live countdown)
- [ ] React Query hooks: `useAstronauts`, `useMission`, `useMissionCrew`
