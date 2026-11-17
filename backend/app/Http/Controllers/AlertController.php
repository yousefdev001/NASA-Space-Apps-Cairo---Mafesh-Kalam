<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use App\Models\Alert;
use App\Models\AlertAcknowledgement;
use App\Models\AlertEscalation;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    /**
     * Display a paginated listing of triage alerts.
     */
    public function index(Request $request)
    {
        $query = Alert::with([
            'astronaut:id,callsign,full_name',
            'mission:id,name,mission_code',
            'acknowledgements.user:id,name',
            'escalations.user:id,name',
        ])->orderBy('triggered_at', 'desc');

        if ($request->has('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('severity') && $request->query('severity') !== 'all') {
            $query->where('severity', $request->query('severity'));
        }

        if ($request->has('astronaut_id')) {
            $query->where('astronaut_id', $request->query('astronaut_id'));
        }

        $alerts = $query->paginate($request->query('per_page', 25));

        return ApiResponse::paginated($alerts, 'Alerts retrieved successfully.');
    }

    /**
     * Get count of active unresolved alerts for badge counters.
     */
    public function unresolvedCount()
    {
        $counts = [
            'total_unresolved' => Alert::whereIn('status', ['triggered', 'escalated'])->count(),
            'critical' => Alert::whereIn('status', ['triggered', 'escalated'])->where('severity', 'critical')->count(),
            'high' => Alert::whereIn('status', ['triggered', 'escalated'])->where('severity', 'high')->count(),
            'medium' => Alert::whereIn('status', ['triggered', 'escalated'])->where('severity', 'medium')->count(),
        ];

        return ApiResponse::success($counts, 'Unresolved alert counts retrieved.');
    }

    /**
     * Display single alert with full escalation/acknowledgement history.
     */
    public function show($id)
    {
        $alert = Alert::with([
            'astronaut',
            'mission',
            'acknowledgements.user',
            'escalations.user',
        ])->findOrFail($id);

        return ApiResponse::success($alert, 'Alert details retrieved.');
    }

    /**
     * Acknowledge an alert (Ground Controller / Medical Officer).
     */
    public function acknowledge(Request $request, $id)
    {
        $alert = Alert::findOrFail($id);

        $alert->update([
            'status' => 'acknowledged',
            'acknowledged_at' => now(),
        ]);

        $ack = AlertAcknowledgement::create([
            'alert_id' => $alert->id,
            'acknowledged_by' => auth()->id() ?? 1,
            'action_taken' => $request->input('action_taken', 'Telemetry verified. Monitoring vitals trend.'),
            'acknowledged_at' => now(),
            'created_at' => now(),
        ]);

        AuditLog::record(
            'alert_acknowledged',
            'Alert',
            $alert->id,
            "Alert [{$alert->alert_code}: {$alert->title}] acknowledged.",
            ['status' => 'triggered'],
            ['status' => 'acknowledged']
        );

        return ApiResponse::success([
            'alert' => $alert->fresh(['acknowledgements.user']),
            'acknowledgement' => $ack,
        ], 'Alert acknowledged successfully.');
    }

    /**
     * Escalate an alert to a higher command role (Flight Surgeon or Mission Director).
     */
    public function escalate(Request $request, $id)
    {
        $request->validate([
            'escalated_to_role' => 'required|string|in:flight_surgeon,mission_director,medical_officer',
            'reason' => 'required|string|min:5',
        ]);

        $alert = Alert::findOrFail($id);

        $alert->update([
            'status' => 'escalated',
        ]);

        $escalation = AlertEscalation::create([
            'alert_id' => $alert->id,
            'escalated_by' => auth()->id() ?? 1,
            'escalated_to_role' => $request->input('escalated_to_role'),
            'reason' => $request->input('reason'),
            'escalated_at' => now(),
            'created_at' => now(),
        ]);

        AuditLog::record(
            'alert_escalated',
            'Alert',
            $alert->id,
            "Alert [{$alert->alert_code}] escalated to {$request->input('escalated_to_role')}: {$request->input('reason')}",
            ['status' => $alert->getOriginal('status')],
            ['status' => 'escalated']
        );

        return ApiResponse::success([
            'alert' => $alert->fresh(['escalations.user']),
            'escalation' => $escalation,
        ], 'Alert escalated to commanding officer.');
    }

    /**
     * Resolve an alert.
     */
    public function resolve(Request $request, $id)
    {
        $alert = Alert::findOrFail($id);

        $alert->update([
            'status' => 'resolved',
            'resolved_at' => now(),
        ]);

        AuditLog::record(
            'alert_resolved',
            'Alert',
            $alert->id,
            "Alert [{$alert->alert_code}] marked as resolved. Notes: ".$request->input('resolution_notes', 'Vitals stabilized back to nominal parameters.'),
            ['status' => $alert->getOriginal('status')],
            ['status' => 'resolved']
        );

        return ApiResponse::success($alert->fresh(), 'Alert resolved.');
    }

    /**
     * Dismiss an alert as false positive or baseline anomaly.
     */
    public function dismiss(Request $request, $id)
    {
        $alert = Alert::findOrFail($id);

        $alert->update([
            'status' => 'dismissed',
            'resolved_at' => now(),
        ]);

        AuditLog::record(
            'alert_dismissed',
            'Alert',
            $alert->id,
            "Alert [{$alert->alert_code}] dismissed. Reason: ".$request->input('reason', 'Artifact in bio-sensor telemetry.'),
            ['status' => $alert->getOriginal('status')],
            ['status' => 'dismissed']
        );

        return ApiResponse::success($alert->fresh(), 'Alert dismissed.');
    }
}
