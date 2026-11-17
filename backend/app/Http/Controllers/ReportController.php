<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use App\Models\AuditLog;
use App\Models\Report;
use App\Models\ReportForensicEvent;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReportController extends Controller
{
    /**
     * Display a paginated listing of generated clinical and operational reports.
     */
    public function index(Request $request)
    {
        $query = Report::with([
            'astronaut:id,callsign,full_name',
            'mission:id,name,mission_code',
            'author:id,name',
            'approver:id,name',
        ])->orderBy('created_at', 'desc');

        if ($request->has('report_type')) {
            $type = $request->query('report_type');
            $query->where('report_type', $type);
        }

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('astronaut_id')) {
            $query->where('astronaut_id', $request->query('astronaut_id'));
        }

        $reports = $query->paginate($request->query('per_page', 15));

        return ApiResponse::paginated($reports, 'Reports retrieved successfully.');
    }

    /**
     * Show report detail with full forensic event correlation timeline.
     */
    public function show($id)
    {
        $report = Report::with([
            'astronaut',
            'mission',
            'author:id,name,email',
            'approver:id,name,email',
            'forensicEvents',
        ])->findOrFail($id);

        $dossierHash = hash('sha256', $report->uuid.'|'.$report->created_at.'|'.$report->report_code);
        $prevHash = $dossierHash;
        $report->forensicEvents->each(function ($event) use (&$prevHash) {
            $eventHash = hash('sha256', implode('|', [
                $prevHash,
                $event->id,
                $event->event_time,
                $event->event_type,
                $event->title,
                $event->related_metric ?? '',
                $event->metric_value ?? '',
                $event->severity ?? 'info',
            ]));
            $prevHash = $eventHash;
            $event->setAttribute('sha256_hash', $eventHash);
        });

        return ApiResponse::success($report, 'Report details retrieved.');
    }

    /**
     * Create a new formal report (RPT-01 to RPT-09, clinical and operational).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'report_type' => 'required|string|in:crew_health_summary,equipment_performance,mission_analysis,forensic_timeline,ai_validation,alert_summary,medication_log,eva_debrief,post_mission,post-eva,post_eva,decompression,solar particle event,solar_particle_event,daily telemetry,daily_telemetry',
            'astronaut_id' => 'nullable|exists:astronauts,id',
            'mission_id' => 'nullable|exists:missions,id',
            'period_start' => 'nullable|date',
            'period_end' => 'nullable|date',
            'summary' => 'required|string',
            'forensic_events' => 'nullable|array',
            'forensic_events.*.event_time' => 'required|date',
            'forensic_events.*.event_type' => 'required|string',
            'forensic_events.*.title' => 'required|string',
            'forensic_events.*.description' => 'nullable|string',
            'forensic_events.*.related_metric' => 'nullable|string',
            'forensic_events.*.metric_value' => 'nullable|string',
            'forensic_events.*.severity' => 'nullable|in:info,low,medium,high,critical',
        ]);

        $reportCode = 'RPT-'.strtoupper(Str::random(5));

        $report = Report::create([
            'uuid' => (string) Str::uuid(),
            'report_code' => $reportCode,
            'title' => $data['title'],
            'report_type' => $data['report_type'],
            'astronaut_id' => $data['astronaut_id'] ?? null,
            'mission_id' => $data['mission_id'] ?? null,
            'generated_by' => auth()->id() ?? 1,
            'period_start' => $data['period_start'] ?? now()->subDays(7),
            'period_end' => $data['period_end'] ?? now(),
            'status' => 'pending_review',
            'summary' => $data['summary'],
        ]);

        if (! empty($data['forensic_events'])) {
            foreach ($data['forensic_events'] as $index => $eventData) {
                ReportForensicEvent::create([
                    'report_id' => $report->id,
                    'event_time' => $eventData['event_time'],
                    'event_type' => $eventData['event_type'],
                    'title' => $eventData['title'],
                    'description' => $eventData['description'] ?? null,
                    'related_metric' => $eventData['related_metric'] ?? null,
                    'metric_value' => $eventData['metric_value'] ?? null,
                    'severity' => $eventData['severity'] ?? 'info',
                    'sort_order' => $index,
                    'created_at' => now(),
                ]);
            }
        }

        AuditLog::record(
            'report_generated',
            'Report',
            $report->id,
            "Report [{$report->report_code}] generated by Flight Surgeon/Officer."
        );

        return ApiResponse::created(
            $report->load('forensicEvents'),
            'Report successfully generated and queued for approval.'
        );
    }

    /**
     * Approve a report (Flight Surgeon or Mission Director).
     */
    public function approve(Request $request, $id)
    {
        $report = Report::findOrFail($id);

        $report->update([
            'status' => 'approved',
            'approved_by' => auth()->id() ?? 1,
            'approved_at' => now(),
        ]);

        AuditLog::record(
            'report_approved',
            'Report',
            $report->id,
            "Report [{$report->report_code}] approved and finalized.",
            ['status' => 'pending_review'],
            ['status' => 'approved']
        );

        return ApiResponse::success($report->fresh(['approver']), 'Report approved and verified.');
    }

    /**
     * Export report to PDF via DomPDF.
     */
    public function exportPdf($id)
    {
        $report = Report::with(['astronaut', 'mission', 'author', 'approver', 'forensicEvents'])->findOrFail($id);

        $pdf = Pdf::loadView('reports.pdf', compact('report'));

        return $pdf->download("AuraMed_{$report->report_code}.pdf");
    }

    /**
     * Export report forensic timeline events to CSV.
     */
    public function exportCsv($id)
    {
        $report = Report::with('forensicEvents')->findOrFail($id);

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"AuraMed_{$report->report_code}_events.csv\"",
        ];

        $callback = function () use ($report) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Event Time', 'Event Type', 'Title', 'Description', 'Metric', 'Value', 'Severity', 'SHA-256 Hash']);

            $dossierHash = hash('sha256', $report->uuid.'|'.$report->created_at.'|'.$report->report_code);
            $prevHash = $dossierHash;

            foreach ($report->forensicEvents as $event) {
                $eventHash = hash('sha256', implode('|', [
                    $prevHash,
                    $event->id,
                    $event->event_time,
                    $event->event_type,
                    $event->title,
                    $event->related_metric ?? '',
                    $event->metric_value ?? '',
                    $event->severity ?? 'info',
                ]));
                $prevHash = $eventHash;

                fputcsv($handle, [
                    $event->id,
                    $event->event_time,
                    $event->event_type,
                    $event->title,
                    $event->description,
                    $event->related_metric,
                    $event->metric_value,
                    $event->severity,
                    $eventHash,
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Retrieve isolated forensic timeline dataset for interactive frontend charting.
     */
    public function forensicTimeline($id)
    {
        $report = Report::with('forensicEvents')->findOrFail($id);

        // Compute immutable cryptographic hash for this report dossier
        $dossierHash = hash('sha256', $report->uuid.'|'.$report->created_at.'|'.$report->report_code);

        // Retrieve linked audit log chain for non-repudiation
        $auditLogs = AuditLog::where('auditable_type', 'Report')
            ->where('auditable_id', $report->id)
            ->orderBy('id', 'asc')
            ->get(['id', 'event_type', 'previous_hash', 'current_hash', 'created_at']);

        // Attach deterministic SHA-256 hash to each forensic event in the sequence
        $previousEventHash = $dossierHash;
        $eventsWithHashes = $report->forensicEvents->map(function ($event) use (&$previousEventHash) {
            $eventHash = hash('sha256', implode('|', [
                $previousEventHash,
                $event->id,
                $event->event_time,
                $event->event_type,
                $event->title,
                $event->related_metric ?? '',
                $event->metric_value ?? '',
                $event->severity ?? 'info',
            ]));
            $previousEventHash = $eventHash;

            $eventArray = $event->toArray();
            $eventArray['sha256_hash'] = $eventHash;

            return $eventArray;
        });

        return ApiResponse::success([
            'report_id' => $report->id,
            'report_code' => $report->report_code,
            'title' => $report->title,
            'period_start' => $report->period_start,
            'period_end' => $report->period_end,
            'status' => $report->status,
            'dossier_hash' => $dossierHash,
            'audit_chain' => $auditLogs,
            'events' => $eventsWithHashes,
        ], 'Forensic timeline events retrieved.');
    }
}
