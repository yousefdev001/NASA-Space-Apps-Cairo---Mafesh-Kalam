# Phase 08 — Reports & Forensic Timeline

## Goal
Report generation engine for 9 report types with PDF/CSV export, plus a multi-scale forensic event timeline for correlating vitals changes with health events.

## 9 Report Types (RPT-01 to RPT-09)
| Code | Type | Roles |
|------|------|-------|
| RPT-01 | Crew Health Summary | flight_surgeon, mission_director, medical_officer |
| RPT-02 | Equipment Performance | biomedical_engineer, mission_director |
| RPT-03 | Mission Analysis | mission_director, flight_surgeon |
| RPT-04 | Forensic Timeline | flight_surgeon, auditor |
| RPT-05 | AI Model Validation | flight_surgeon, auditor |
| RPT-06 | Alert Summary | medical_officer, mission_director |
| RPT-07 | Medication Log | flight_surgeon, medical_officer |
| RPT-08 | EVA Debrief | flight_surgeon, biomedical_engineer |
| RPT-09 | Post-Mission | flight_surgeon, mission_director |

## Key Endpoints
```
GET    /api/reports               → Paginated list
POST   /api/reports               → Create (select type, period, subject)
GET    /api/reports/{id}          → Detail
PUT    /api/reports/{id}/approve  → Approve (flight_surgeon / mission_director)
GET    /api/reports/{id}/export/pdf
GET    /api/reports/{id}/export/csv
GET    /api/reports/{id}/forensic → Forensic timeline events
```

## Forensic Timeline Design
- Horizontal scrollable timeline component (canvas-based for performance)
- Multi-layer: Vitals track | Alerts track | AI Insights track | EVA Activities track
- Zoom: 1hr / 6hr / 24hr / 7day views
- Click event → drill-down panel with full data at that moment
- Pre/post selection: select event → highlight 30min before/after on all tracks

## PDF Generation (DomPDF)
```php
class ReportPdfService
{
    public function generate(Report $report): string
    {
        $data = $this->reportBuilder->build($report);
        $pdf = Pdf::loadView("reports.{$report->report_type}", $data);
        $path = "reports/{$report->uuid}.pdf";
        Storage::put($path, $pdf->output());
        return $path;
    }
}
```
