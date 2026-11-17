# Phase 01 — Foundation & Project Scaffolding

## Goal
Set up the complete project skeleton for both backend (Laravel) and frontend (React + TypeScript), establish the design system, and ensure all tooling is configured correctly before any feature work begins.

---

## Backend Tasks

### 1.1 Laravel Configuration
- [ ] Clean up default Laravel boilerplate (remove unused routes, views, controllers)
- [ ] Configure `config/app.php` — timezone (`UTC`), locale (`en`)
- [ ] Set up `config/cors.php` — allow frontend origin (localhost:5173 dev, production domain)
- [ ] Configure `.env.example` with all required keys documented
- [ ] Set up `database/` to use MySQL 8.0+ driver (not SQLite for production)
- [ ] Configure `config/sanctum.php` — stateful domains, token expiry
- [ ] Set up `config/logging.php` — daily log channel, max 30 days
- [ ] Configure `config/cache.php` — file driver (can upgrade to Redis later)
- [ ] Configure `config/queue.php` — sync driver for now (database later in Phase 05)
- [ ] Install and configure **Spatie Laravel Permission**: `composer require spatie/laravel-permission`

### 1.2 Folder Structure (MVC)
```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/
│   │   │   ├── Admin/
│   │   │   ├── Mission/
│   │   │   ├── Astronaut/
│   │   │   ├── Telemetry/
│   │   │   ├── Alert/
│   │   │   ├── Report/
│   │   │   ├── Academy/
│   │   │   ├── Article/
│   │   │   └── Api/
│   │   ├── Middleware/
│   │   │   ├── EnsureHasRole.php
│   │   │   ├── EnsureHasPermission.php
│   │   │   └── AuditLogger.php
│   │   ├── Requests/          ← Form Request Validation classes
│   │   └── Resources/         ← API Resource transformers
│   ├── Models/
│   ├── Services/              ← Business logic layer
│   ├── Observers/             ← Model observers for audit trail
│   ├── Events/
│   ├── Listeners/
│   ├── Notifications/
│   └── Exceptions/
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
└── routes/
    ├── api.php                ← All API routes
    └── web.php                ← Minimal (health check only)
```

### 1.3 Packages to Install
```bash
composer require spatie/laravel-permission
composer require barryvdh/laravel-dompdf          # PDF reports
composer require league/csv                        # CSV export
composer require intervention/image               # Image handling
composer require spatie/laravel-query-builder     # Advanced filtering
composer require spatie/laravel-data              # DTOs
```

### 1.4 API Response Standard
All API responses follow this envelope:
```json
{
  "success": true,
  "data": {},
  "message": "...",
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 100
  }
}
```
Error responses:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "field": ["error message"]
  }
}
```

### 1.5 Global API Middleware Stack
```
api → throttle:api → ForceJsonResponse → EnsureAuthenticated (Sanctum)
```

---

## Frontend Tasks

### 1.6 React + TypeScript + Vite Configuration
- [ ] Convert existing `frontend/` from JS to TypeScript (`.jsx` → `.tsx`)
- [ ] Install core dependencies:
```bash
npm install @tanstack/react-query zustand react-router-dom axios
npm install tailwindcss @tailwindcss/vite
npm install lucide-react
npm install recharts        # or echarts-for-react for ECG/vitals charts
npm install react-hook-form @hookform/resolvers zod
npm install date-fns
npm install clsx tailwind-merge
npm install -D @types/react @types/react-dom typescript vitest @testing-library/react
```

### 1.7 Frontend Folder Structure
```
frontend/src/
├── api/                    ← Axios instances & API call functions
│   ├── client.ts           ← Axios base config with interceptors
│   ├── auth.api.ts
│   ├── astronaut.api.ts
│   ├── mission.api.ts
│   ├── telemetry.api.ts
│   ├── alert.api.ts
│   ├── report.api.ts
│   ├── academy.api.ts
│   └── article.api.ts
├── components/
│   ├── ui/                 ← Reusable base components (Button, Card, Badge, etc.)
│   ├── layout/             ← Layouts (MissionControlLayout, AuthLayout, PublicLayout)
│   ├── charts/             ← ECG, vitals, SpO2, timeline charts
│   ├── telemetry/          ← Telemetry-specific display components
│   └── shared/             ← Cross-feature shared components
├── hooks/                  ← Custom React hooks
├── pages/
│   ├── public/             ← Landing, Articles
│   ├── auth/               ← Login, Register
│   └── dashboard/          ← All protected pages by role
├── store/                  ← Zustand state stores
│   ├── authStore.ts
│   ├── telemetryStore.ts
│   └── alertStore.ts
├── types/                  ← TypeScript interfaces & types
│   ├── auth.types.ts
│   ├── astronaut.types.ts
│   ├── telemetry.types.ts
│   └── ...
├── utils/                  ← Helper functions
├── constants/              ← App-wide constants
└── styles/
    ├── globals.css         ← CSS variables, Tailwind base
    └── tokens.ts           ← Design tokens (colors, spacing)
```

### 1.8 Design System — CSS Variables
```css
/* frontend/src/styles/globals.css */
:root {
  /* Space HUD Palette */
  --color-deep-void: #050B14;
  --color-cosmic-navy: #0B132B;
  --color-hud-cyan: #00E5FF;
  --color-hud-emerald: #10B981;
  --color-hud-amber: #F59E0B;
  --color-hud-crimson: #EF4444;
  --color-hud-white: #E2E8F0;
  --color-hud-muted: #64748B;
  --color-hud-border: #1E3A5F;
  --color-glass: rgba(11, 19, 43, 0.8);
  
  /* AuraMed Brand */
  --color-aura-orange: #FF4D00;
  --color-aura-dark-card: #0c0c10;
  --color-aura-muted: #16161a;

  /* Typography */
  --font-display: 'Orbitron', 'Space Grotesk', sans-serif;
  --font-sans: 'Inter', 'Space Grotesk', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### 1.9 Tailwind Config (extends with CSS vars)
```js
// tailwind.config.js
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'deep-void': 'var(--color-deep-void)',
        'cosmic-navy': 'var(--color-cosmic-navy)',
        'hud-cyan': 'var(--color-hud-cyan)',
        'hud-emerald': 'var(--color-hud-emerald)',
        'hud-amber': 'var(--color-hud-amber)',
        'hud-crimson': 'var(--color-hud-crimson)',
        'hud-white': 'var(--color-hud-white)',
        'hud-muted': 'var(--color-hud-muted)',
        'hud-border': 'var(--color-hud-border)',
        'aura-orange': 'var(--color-aura-orange)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
    },
  },
};
```

### 1.10 Axios Client Configuration
```ts
// frontend/src/api/client.ts
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

// Request interceptor: attach Bearer token from authStore
// Response interceptor: handle 401 (logout), 403 (unauthorized), 422 (validation)
```

### 1.11 Route Architecture
```
/ (public)                → Landing Page
/articles                 → Articles list (kids + adults)
/articles/:slug           → Article detail
/login                    → Auth page
/register                 → Register (admin-invite only)

/dashboard                → Role-based redirect
/mission-control          → Flight Surgeon, Mission Director, Medical Officer
/astronauts               → Crew roster + profiles
/missions                 → Mission management
/telemetry/:astronautId   → Live vitals for specific astronaut
/alerts                   → Alert triage panel
/reports                  → Reports center
/ai-insights              → AI clinical review workflow
/academy                  → Space Academy
/admin                    → System admin panel
/audit                    → Audit trail (Auditor role)
```

---

## Notes

> [!IMPORTANT]
> All environment secrets must be in `.env` only — never committed. The `.env.example` documents every required key.

> [!TIP]
> The `frontend/src/api/client.ts` Axios interceptor should handle the Sanctum CSRF cookie request (`/sanctum/csrf-cookie`) before the first mutating request.

> [!NOTE]
> TypeScript strict mode must be enabled from day one. All `any` types are forbidden — use proper interfaces defined in `src/types/`.

---

## Deliverables for Phase 01
- [ ] Clean Laravel project with correct folder structure
- [ ] All composer packages installed and configured
- [ ] Spatie Permission provider registered and published
- [ ] React + TypeScript project with strict mode
- [ ] All npm packages installed
- [ ] CSS design tokens and Tailwind config ready
- [ ] Axios client with interceptors working
- [ ] React Router routes skeleton (all routes defined, pages are empty stubs)
- [ ] API base response envelope implemented in Laravel
- [ ] `.env.example` fully documented
