# Phase 03 — Authentication & RBAC

## Goal
Implement complete authentication (login, logout, password reset, email verification) using Laravel Sanctum + SPA cookie mode, and a full role-based access control system using Spatie Permission with 10 roles and 50+ granular permissions.

---

## Backend Tasks

### 3.1 Sanctum SPA Configuration
```php
// config/sanctum.php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:5173')),
'expiration' => 60 * 24 * 7, // 7 days in minutes
```

### 3.2 Authentication Endpoints

| Method | Route | Controller | Auth |
|--------|-------|------------|------|
| GET | `/sanctum/csrf-cookie` | Sanctum built-in | Public |
| POST | `/api/auth/login` | `Auth\LoginController` | Public |
| POST | `/api/auth/logout` | `Auth\LogoutController` | Auth |
| POST | `/api/auth/forgot-password` | `Auth\ForgotPasswordController` | Public |
| POST | `/api/auth/reset-password` | `Auth\ResetPasswordController` | Public |
| GET | `/api/auth/me` | `Auth\MeController` | Auth |
| PUT | `/api/auth/profile` | `Auth\ProfileController` | Auth |
| PUT | `/api/auth/change-password` | `Auth\ChangePasswordController` | Auth |
| POST | `/api/admin/users` | `Admin\UserController@store` | admin |
| PUT | `/api/admin/users/{user}/role` | `Admin\UserController@assignRole` | admin |

**Note:** No public registration. Users are created by `system_administrator` only (invite-based).

### 3.3 Login Flow
```
1. Frontend: GET /sanctum/csrf-cookie (gets XSRF-TOKEN cookie)
2. Frontend: POST /api/auth/login {email, password}
3. Backend: validate → create Sanctum token → return {user, token, roles, permissions}
4. Frontend: store token in authStore + localStorage
5. Frontend: set Authorization: Bearer {token} header on all requests
```

### 3.4 Auth Response Shape
```json
{
  "success": true,
  "data": {
    "token": "1|abc...",
    "token_type": "Bearer",
    "user": {
      "id": 1,
      "uuid": "...",
      "name": "Dr. Henrik",
      "email": "...",
      "avatar_url": "...",
      "is_active": true,
      "last_login_at": "..."
    },
    "roles": ["flight_surgeon"],
    "permissions": ["view_vital_readings", "approve_ai_insights", ...]
  }
}
```

---

### 3.5 RBAC — 10 Roles & 50+ Permissions

#### Role Definitions

| Role | Description |
|------|-------------|
| `flight_surgeon` | Approves AI diagnoses, manages medical interventions |
| `mission_director` | Full mission oversight, crew decisions |
| `medical_officer` | Monitors vitals, adjusts thresholds |
| `biomedical_engineer` | Manages & calibrates medical devices |
| `astronaut_crew` | Views own profile + vitals + schedule |
| `ground_controller` | Data ingestion, sync monitoring |
| `cadet_student` | Academy access only |
| `educator_content_creator` | Manages courses, articles |
| `system_administrator` | Full system access, user management |
| `auditor_compliance` | Read-only audit trails, reports |

#### Permission Groups

**Astronaut Permissions (8)**
```
view_astronauts
view_own_astronaut_profile
create_astronauts
update_astronauts
delete_astronauts
view_medical_records
create_medical_records
view_astronaut_baselines
```

**Mission Permissions (7)**
```
view_missions
create_missions
update_missions
delete_missions
assign_crew_to_mission
view_mission_media
upload_mission_media
```

**Telemetry Permissions (8)**
```
view_vital_readings
view_own_vital_readings
view_organ_telemetry
view_ecg_recordings
view_eeg_recordings
view_radiation_readings
view_suit_telemetry
ingest_telemetry_data
```

**AI & Clinical Permissions (5)**
```
view_ai_insights
approve_ai_insights
reject_ai_insights
modify_ai_insights
view_ai_model_registry
```

**Alert Permissions (6)**
```
view_alerts
view_own_alerts
acknowledge_alerts
escalate_alerts
resolve_alerts
dismiss_alerts
```

**Report Permissions (8)**
```
view_reports
create_reports
update_reports
approve_reports
publish_reports
export_reports_pdf
export_reports_csv
view_forensic_timeline
```

**Academy Permissions (6)**
```
view_academy
view_own_progress
create_courses
update_courses
delete_courses
manage_quizzes
```

**Article Permissions (5)**
```
view_articles
create_articles
update_articles
delete_articles
publish_articles
```

**Admin Permissions (5)**
```
manage_users
assign_roles
view_audit_logs
verify_audit_chain
manage_system_settings
```

**Threshold Permissions (2)**
```
view_thresholds
update_thresholds
```

**Total: 60 permissions**

#### Role ↔ Permission Matrix

| Permission | flight_surgeon | mission_director | medical_officer | biomedical_engineer | astronaut_crew | ground_controller | cadet_student | educator | sys_admin | auditor |
|-----------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| view_astronauts | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| view_own_astronaut_profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| create_astronauts | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| update_astronauts | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| view_medical_records | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| view_vital_readings | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| view_own_vital_readings | - | - | - | - | ✅ | - | - | - | - | - |
| view_organ_telemetry | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| ingest_telemetry_data | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| approve_ai_insights | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| view_ai_insights | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| view_alerts | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| acknowledge_alerts | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| escalate_alerts | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| create_reports | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| approve_reports | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| view_audit_logs | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| manage_users | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| view_academy | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| create_courses | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| view_articles | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| create_articles | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| update_thresholds | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| verify_audit_chain | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

### 3.6 Middleware Stack

```php
// app/Http/Middleware/EnsureHasPermission.php
class EnsureHasPermission
{
    public function handle($request, Closure $next, string $permission)
    {
        if (!auth()->user()->can($permission)) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden: insufficient permissions',
                'required_permission' => $permission,
            ], 403);
        }
        return $next($request);
    }
}

// Usage in routes:
Route::middleware(['auth:sanctum', 'permission:approve_ai_insights'])
    ->post('/ai-insights/{id}/approve', [ClinicalReviewController::class, 'approve']);
```

### 3.7 Route Authorization Approach
```php
// routes/api.php — grouped by auth level
Route::prefix('api')->group(function () {
    // Public
    Route::post('/auth/login', ...);
    Route::post('/auth/forgot-password', ...);
    
    // Authenticated (any role)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', ...);
        Route::get('/articles', ...); // all roles can see articles
        
        // Role-specific
        Route::middleware('role:flight_surgeon|mission_director|medical_officer')
            ->prefix('vitals')
            ->group(function () {
                Route::get('/', ...);
                Route::get('/{astronaut}', ...);
            });
            
        Route::middleware('permission:approve_ai_insights')
            ->post('/ai-insights/{id}/approve', ...);
    });
});
```

### 3.8 Role-Based Dashboard Redirect (Frontend)
```ts
// After login, redirect based on primary role:
const ROLE_DASHBOARD_MAP = {
  flight_surgeon: '/mission-control',
  mission_director: '/mission-control',
  medical_officer: '/mission-control',
  biomedical_engineer: '/mission-control',
  astronaut_crew: '/my-profile',
  ground_controller: '/telemetry',
  cadet_student: '/academy',
  educator_content_creator: '/academy/manage',
  system_administrator: '/admin',
  auditor_compliance: '/audit',
};
```

### 3.9 Frontend Auth Guard (React Router)
```tsx
// components/guards/ProtectedRoute.tsx
function ProtectedRoute({ permissions, roles, children }) {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  if (roles && !roles.some(r => user.roles.includes(r))) {
    return <Navigate to="/unauthorized" />;
  }
  
  if (permissions && !permissions.some(p => user.permissions.includes(p))) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
}
```

---

## Deliverables for Phase 03
- [ ] Sanctum configured + `/sanctum/csrf-cookie` working
- [ ] Auth endpoints: login, logout, me, forgot-password, reset-password
- [ ] All 10 roles seeded via `RolePermissionSeeder`
- [ ] All 60 permissions seeded and correctly assigned to roles
- [ ] `EnsureHasPermission` and `EnsureHasRole` middleware registered
- [ ] Login history recorded on every auth attempt
- [ ] Audit log entry on every login/logout
- [ ] React `useAuthStore` (Zustand) with token persistence
- [ ] React `ProtectedRoute` component with role + permission guards
- [ ] Role-based redirect after login working
- [ ] 401/403 responses properly handled in Axios interceptor
