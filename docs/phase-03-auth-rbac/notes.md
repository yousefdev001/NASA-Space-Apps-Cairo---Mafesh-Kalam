# Phase 03 — Auth & RBAC Notes

## Security Considerations

### Token Storage
- Sanctum token stored in `localStorage` (simple SPA approach)
- Alternative: HTTP-only cookie (more secure but requires CORS/session config)
- **Decision: localStorage + Bearer token for simplicity** — can migrate to cookie-based later
- Clear token on logout + window close option for high-security mode

### Brute Force Protection
- Laravel's built-in rate limiting: `throttle:5,1` on login route (5 attempts per minute)
- Failed attempts logged to `login_history`
- After 5 consecutive failures: account temporarily locked (15 min), admin notified

### Password Requirements
- Minimum 12 characters
- Must contain: uppercase, lowercase, digit, special character
- Validation via `Password::min(12)->letters()->mixedCase()->numbers()->symbols()`
- Password history not tracked (overkill for this system)

### Sanctum Token Expiry
- Token expiry: 7 days (`60 * 24 * 7` minutes)
- Frontend checks expiry and prompts re-login
- No refresh token mechanism needed (simplicity)

## RBAC Caching
Spatie Permission caches role/permission assignments. Clear cache on:
- Role assignment changes
- Permission changes
- Use `app(PermissionRegistrar::class)->forgetCachedPermissions()` in observers

## Admin-Only User Creation
No public registration endpoint. System admin creates users via POST `/api/admin/users` with:
- Temporary password (auto-generated)
- Welcome email with password reset link
- Initial role assignment in same request

## "Astronaut Crew" Role Special Case
- `astronaut_crew` role users are linked to their astronaut record via `astronauts.user_id`
- They can only view **their own** data, not other astronauts'
- Backend scoping: `where('astronaut_id', auth()->user()->astronaut->id)`
- Route policy enforces this: `AstronautPolicy::view()`
