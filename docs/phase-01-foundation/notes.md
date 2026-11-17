# Phase 01 — Notes & Decisions

## Architecture Decisions

### Why MVC not DDD?
Per requirements: clean MVC with Controllers → Services → Models. Services hold business logic to keep controllers thin.

### Why Sanctum over Passport?
Sanctum is lighter, SPA-friendly, and sufficient for this platform. Token-based auth for API + cookie-based for SPA.

### Why Spatie Permission?
Most battle-tested RBAC package for Laravel. Supports roles + direct permissions, caching, and multiple guards.

### Why TanStack Query?
Server state management with caching, refetching, optimistic updates — ideal for real-time telemetry polling.

### Why Zustand over Redux?
Lightweight, boilerplate-free client state for auth tokens, alert counts, active mission context.

## Color Decision: HUD vs Sketch Reference
The reference UI (`C:\Users\Khalid\Downloads\auramed`) uses a "hand-drawn sketch" aesthetic (paper textures, wobbly borders). **For the AuraMed web system, we adopt the NASA HUD dark mode** described in the spec (`Deep Void #050B14`, `Cosmic Navy #0B132B`, cyan/emerald/amber/crimson accents) since this is mission-critical ground control software — not the sketch landing page. The landing page public section can use elements of the sketch style as inspiration.

## API Versioning
No versioning for now (v1 implicit). All routes under `/api/`. Prefix with `/api/v1/` only if multi-version need arises.

## File Upload Strategy
Medical images, mission photos, article thumbnails → stored in `storage/app/public` with symbolic link. URLs returned as full public URLs from API.

## Caching Strategy (Phase 01 baseline)
- Spatie Permission roles/permissions: cached by Spatie internally (60 min)  
- Dashboard stats: 5-min cache  
- Article lists: 10-min cache  
- Live telemetry: NO cache (always fresh)

## Open Questions
- [ ] Will there be a real-time WebSocket connection (Laravel Reverb/Pusher) for live telemetry, or polling only?
- [ ] What is the production server environment? (PHP version, MySQL version confirmed)
- [ ] Email provider for notifications? (Mailtrap for dev)
- [ ] PDF generation: DomPDF vs Snappy? (DomPDF chosen for simplicity)
