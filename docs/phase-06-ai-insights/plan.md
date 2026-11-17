# Phase 06 — AI Insights & Clinical Review

## Goal
Implement the Human-in-the-Loop AI review workflow. The web system **receives** AI analysis results (never runs models), and Flight Surgeons review/approve/reject/modify them before they are finalized.

---

## Backend Tasks

### 6.1 API Endpoints

| Method | Route | Permission | Description |
|--------|-------|-----------|-------------|
| POST | `/api/ai-insights/ingest` | `ingest_telemetry_data` | Receive AI batch from pipeline |
| GET | `/api/ai-insights` | `view_ai_insights` | Paginated list |
| GET | `/api/ai-insights/pending` | `view_ai_insights` | Pending review queue |
| GET | `/api/ai-insights/stats` | `view_ai_insights` | Stats dashboard |
| GET | `/api/ai-insights/{id}` | `view_ai_insights` | Detail + related context |
| POST | `/api/ai-insights/{id}/approve` | `approve_ai_insights` | Approve |
| POST | `/api/ai-insights/{id}/reject` | `reject_ai_insights` | Reject with reason |
| POST | `/api/ai-insights/{id}/modify` | `modify_ai_insights` | Modify + approve |
| GET | `/api/ai-models` | `view_ai_model_registry` | Model registry |

### 6.2 Clinical Review Workflow
```
AI sends batch → AiAnalysisJob + AiInsight records (review_status='pending_review')
                           ↓
         Flight Surgeon sees pending queue in /ai-insights
                           ↓
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
      APPROVE          REJECT            MODIFY
         ↓                ↓                 ↓
  ClinicalReview    ClinicalReview    ClinicalReview
  (decision=        (decision=        (decision=modified,
   approved)         rejected)        modified_description)
         ↓                                  ↓
  If severity=high/critical: dispatch AlertFromInsightJob
```

### 6.3 Insight Detail Response (includes context)
```json
{
  "insight": { "id": 1, "title": "...", "severity": "high", "confidence_score": 0.94 },
  "job": { "model_name": "CardiacAI-v2", "analysis_type": "rhythm" },
  "astronaut": { "callsign": "CDR-01", "name": "Elena Vance" },
  "related_telemetry": {
    "vital_readings_in_window": [...],
    "organ_telemetry": {...},
    "ecg_recording": null
  },
  "review": null
}
```

## Frontend: `/ai-insights`
- Split view: pending queue (left) + detail drawer (right)
- Severity color coding: critical=crimson, high=orange, medium=amber
- Confidence score: circular progress gauge
- Action buttons: Approve ✅ | Reject ❌ | Modify ✏️
- Modify form: text editor for surgeon's modified description + notes
- History tab: reviewed insights with decision + reviewer + timestamp
