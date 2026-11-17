# AuraMed — Full Build Plan

**AuraMed Space Health, Telemetry & Bio-Astronautics Platform**

> Ground-control web system for NASA mission teams. MVC architecture — Laravel 13 backend REST API + React 19 (Vite + TypeScript) frontend. Dark-mode HUD design inspired by NASA mission control rooms.

---

## Project Overview

| Item | Detail |
|------|--------|
| Platform Name | **AuraMed** |
| Architecture | MVC — Laravel 13 REST API + React 19 (Vite + TS) |
| Auth | Laravel Sanctum + Spatie Permission (10 Roles, 50+ Permissions) |
| Database | MySQL 8.0+ (56 tables, fully indexed, N+1-free) |
| Design System | NASA Deep Space HUD dark mode — CSS variables, Tailwind |
| Primary Language | English only |
| Offline Support | Mobile app handles offline; web ingests synced data |

---

## Build Phases Overview

| Phase | Folder | Focus | Est. Effort |
|-------|--------|-------|-------------|
| 01 | `phase-01-foundation` | Project scaffolding, config, design system | High |
| 02 | `phase-02-database` | Full 56-table schema, migrations, models, relationships | Very High |
| 03 | `phase-03-auth-rbac` | Sanctum auth, 10 roles, 50+ permissions, RBAC guards | High |
| 04 | `phase-04-core-modules` | Astronauts, Missions, Crew management | High |
| 05 | `phase-05-telemetry-vitals` | Live vitals ingestion, organ telemetry, MET clock | Very High |
| 06 | `phase-06-ai-insights` | AI result ingestion, clinical review workflow | High |
| 07 | `phase-07-alerts` | Alert triage system, escalation, deduplication | Medium |
| 08 | `phase-08-reports` | Forensic timeline, RPT-01→09 report engine, PDF/CSV | High |
| 09 | `phase-09-academy` | Space Academy, gamification, XP, kids/adults zones | High |
| 10 | `phase-10-landing-articles` | Public landing page, article system (kids/adults) | Medium |
| 11 | `phase-11-testing` | E2E tests, edge cases, full layer validation | Very High |
| 12 | `phase-12-cicd` | CI/CD pipelines, production deployment | High |

---

## Key Design Principles

1. **No N+1 Queries** — All relationships eager-loaded with `with()`, scoped selects
2. **Full Indexing** — Composite indexes on all foreign keys + frequently queried fields
3. **Performance First** — Query optimization, caching, pagination everywhere
4. **Security Audit Trail** — SHA-256 hash-chained logs, encrypted medical notes
5. **RBAC Everywhere** — Every API endpoint protected by role + permission guards
6. **CSS Variables** — All colors in `:root` vars for easy theming
7. **MVC Strict** — No DDD, clean Controllers → Services → Models flow

---

## Color System (Design Tokens)

```css
/* Space HUD Dark Mode (Primary) */
--deep-void: #050B14;        /* Main background */
--cosmic-navy: #0B132B;      /* Cards, panels */
--hud-cyan: #00E5FF;         /* Primary accent, vitals */
--hud-emerald: #10B981;      /* Nominal / healthy status */
--hud-amber: #F59E0B;        /* Warning / elevated */
--hud-crimson: #EF4444;      /* Critical / alert */
--hud-white: #E2E8F0;        /* Primary text */
--hud-muted: #64748B;        /* Secondary text */
--hud-border: #1E3A5F;       /* Panel borders */
--hud-glass: rgba(11,19,43,0.8); /* Glass morphism panels */

/* AuraMed Reference (from auramed UI) */
--aura-orange: #FF4D00;      /* Brand accent (dark mode) */
--aura-dark-card: #0c0c10;   /* Card bg in dark */
--aura-muted-dark: #16161a;  /* Muted dark bg */
```

---

## Mobile App Telemetry Reference (from uploaded image)

The mobile app tracks these organ systems — all must be represented in the DB and displayed in the web system:

| System | Key Metric | Mobile Label |
|--------|-----------|-------------|
| Heart / Cardiovascular | BPM | `62 BPM` |
| Lungs / Respiratory | SpO2 | `97% SpO2` |
| Brain / Central Nervous | EEG Alpha | `8.4 Hz Alpha` |
| Liver / Hepatic-Metabolic | ALT/AST | `ALT/AST Nominal` |
| Kidneys / Renal | Hydration | `Hydration 92%` |
| Whole Body / Systemic Bio-Scan | Core Temp | `36.7 °C` |

Each organ also carries a **Health Score %** (92%, 96%, 95%, 92%, 92%, 94%) and a **Status badge** (NOMINAL / WARNING / CRITICAL).

---

## Folder Navigation

- [`phase-01-foundation/`](./phase-01-foundation/) — Project setup & design system
- [`phase-02-database/`](./phase-02-database/) — Full schema & data model
- [`phase-03-auth-rbac/`](./phase-03-auth-rbac/) — Authentication & authorization
- [`phase-04-core-modules/`](./phase-04-core-modules/) — Astronauts & missions
- [`phase-05-telemetry-vitals/`](./phase-05-telemetry-vitals/) — Live telemetry & vitals
- [`phase-06-ai-insights/`](./phase-06-ai-insights/) — AI ingestion & clinical review
- [`phase-07-alerts/`](./phase-07-alerts/) — Alert triage system
- [`phase-08-reports/`](./phase-08-reports/) — Reports & forensic timeline
- [`phase-09-academy/`](./phase-09-academy/) — Space Academy & gamification
- [`phase-10-landing-articles/`](./phase-10-landing-articles/) — Public pages & articles
- [`phase-11-testing/`](./phase-11-testing/) — Full E2E & layer testing
- [`phase-12-cicd/`](./phase-12-cicd/) — CI/CD & deployment
