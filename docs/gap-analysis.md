# Gap Analysis — Prompt vs Docs Review

## ✅ Covered (Confirmed)
- MVC architecture (Laravel 13 + React 19)
- Full 54-table database with indexes, N+1 prevention, relationships
- 10 roles + 60 permissions (Spatie)
- Astronaut management (CRUD, medical records, baselines, certs)
- Mission management (CRUD, crew, phases, media, notes, MET)
- Telemetry ingestion + 6-organ display matching mobile app screenshot
- AI insights clinical review (Human-in-the-Loop)
- Alert triage state machine (triggered → ack → escalate → resolve)
- 9 Report types (RPT-01→09) + PDF/CSV export
- Forensic timeline (multi-layer)
- Space Academy (kids 4 games + adults 8 tracks) + XP/badges
- Public landing page with platform overview
- Article system (kids + adults audiences, distinct designs)
- Encrypted medical notes (AES-256 / Laravel Crypt)
- SHA-256 hash-chained audit logs
- E2E tests (Pest PHP + Vitest)
- 4 GitHub Actions CI/CD workflows
- CSS variables for all colors
- English-only system

## ❌ Gaps Found (Must Fix)

### 1. ADVANCED CHARTS — Missing Entirely
The prompt says "في رسومات بيانيه وبشكل متقدم جدا وفورمل وبشكل عصري وحديث" (advanced formal modern charts in dashboards). This needs a dedicated phase/section with:
- Library choice & setup (Apache ECharts recommended)
- Chart types per dashboard section
- Chart data API endpoints
- Chart component architecture
→ **Fix: Expand Phase 05 + add charts section to Phase 04 and Phase 08**

### 2. Admin Panel — Underspecified
Phase 03 defines `/admin` route but has no plan for:
- User management UI (create, assign role, deactivate)
- System settings panel
- Audit log viewer
- Encryption key management UI
→ **Fix: Add admin panel to Phase 04**

### 3. Astronaut Vitals History Charts — Missing
The astronaut detail page needs:
- Baseline trend charts (weight, HR, SpO2 over time)
- Comparison to population norms
→ **Fix: Add to Phase 04**

### 4. `telemetry_aggregate` Scheduled Command — Not in Phase 05
The command `telemetry:aggregate` is mentioned but not spec'd:
- Command signature, arguments
- Job scheduling code
→ **Fix: Add detail to Phase 05**

### 5. CORS Configuration — Missing Detail
Phase 01 mentions CORS but no specific config code
→ **Fix: Add CORS config to Phase 01**

### 6. Article CMS — Underspecified in Phase 10
Phase 10 mentions CMS but no editor detail:
- Rich text editor (TipTap/Quill)
- Image upload in article
- Draft/schedule publish
→ **Fix: Expand Phase 10**

### 7. Academy Progress Charts — Missing
The `/academy/progress` page needs charts:
- XP timeline chart
- Completion radar chart
- Badge collection display
→ **Fix: Add to Phase 09**

### 8. `report_forensic_events` table — Missing from DB seeders/model
The table exists in schema but no model relationship defined in Phase 02
→ Already in schema, just needs model note

### 9. Missing: `GET /api/admin/users` endpoints spec
Admin user management endpoints not documented

### 10. Environment Telemetry Display — Not in Frontend
Phase 05 mentions `environment_telemetry` table but no frontend panel
→ **Fix: Add cabin environment panel to Phase 05**
