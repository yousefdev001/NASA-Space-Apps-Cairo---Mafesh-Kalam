# Phase 07 — Alert Triage System

## Goal
Automated alert generation from threshold violations with a multi-state triage workflow and escalation chains.

## Alert State Machine
```
TRIGGERED → ACKNOWLEDGED → ESCALATED → RESOLVED
         ↘                              ↗
           → DISMISSED (by medical_officer+)
```

## Key Endpoints
| Method | Route | Permission |
|--------|-------|-----------|
| GET | `/api/alerts` | `view_alerts` |
| GET | `/api/alerts/unresolved-count` | `view_alerts` |
| GET | `/api/alerts/my-role` | `view_alerts` |
| GET | `/api/alerts/{id}` | `view_alerts` |
| POST | `/api/alerts/{id}/acknowledge` | `acknowledge_alerts` |
| POST | `/api/alerts/{id}/escalate` | `escalate_alerts` |
| POST | `/api/alerts/{id}/resolve` | `resolve_alerts` |
| POST | `/api/alerts/{id}/dismiss` | `dismiss_alerts` |

## Deduplication Logic
```php
$dedupHash = sha1($astronautId . $alertCode . now()->format('Y-m-d-H'));
Alert::firstOrCreate(['dedup_hash' => $dedupHash], [...alert data...]);
```
Same alert condition within the same hour window → one alert, not spam.

## Frontend: Alert Panel
- Nav badge: unresolved count (polls every 60s)
- Alert list: color-coded rows (crimson=critical, orange=high, amber=medium)
- One-click acknowledge from list row
- Detail panel: full context + action timeline
- Filters: severity, astronaut, status, date range
