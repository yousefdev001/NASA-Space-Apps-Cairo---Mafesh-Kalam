<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use App\Models\AiAnalysisJob;
use App\Models\AiInsight;
use App\Models\AuditLog;
use App\Models\ClinicalReview;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AiInsightController extends Controller
{
    /**
     * Display a listing of AI insights.
     */
    public function index(Request $request)
    {
        $query = AiInsight::with(['astronaut:id,callsign,full_name', 'job:id,model_name,analysis_type'])
            ->orderBy('analyzed_at', 'desc');

        if ($request->has('review_status')) {
            $query->where('review_status', $request->query('review_status'));
        }

        if ($request->has('severity')) {
            $query->where('severity', $request->query('severity'));
        }

        if ($request->has('astronaut_id')) {
            $query->where('astronaut_id', $request->query('astronaut_id'));
        }

        $insights = $query->paginate($request->query('per_page', 20));

        return ApiResponse::paginated($insights, 'AI Insights retrieved successfully.');
    }

    /**
     * High-level statistical breakdown for Flight Surgeon triage.
     */
    public function stats()
    {
        $stats = [
            'total' => AiInsight::count(),
            'pending_review' => AiInsight::where('review_status', 'pending_review')->count(),
            'approved' => AiInsight::where('review_status', 'approved')->count(),
            'rejected' => AiInsight::where('review_status', 'rejected')->count(),
            'modified' => AiInsight::where('review_status', 'modified')->count(),
            'critical' => AiInsight::where('severity', 'critical')->count(),
            'high' => AiInsight::where('severity', 'high')->count(),
            'average_confidence' => round(AiInsight::avg('confidence_score') * 100, 1),
        ];

        return ApiResponse::success($stats, 'AI Insight statistics calculated.');
    }

    /**
     * Detailed view of a single AI insight including clinical review notes.
     */
    public function show($id)
    {
        $insight = AiInsight::with([
            'astronaut',
            'job',
            'review.reviewer:id,name,email',
        ])->findOrFail($id);

        return ApiResponse::success($insight, 'AI Insight detail retrieved.');
    }

    /**
     * Ingest batch from AI pipeline or ground inference bridge.
     */
    public function ingest(Request $request)
    {
        $data = $request->validate([
            'astronaut_id' => 'required|exists:astronauts,id',
            'model_name' => 'required|string|max:100',
            'analysis_type' => 'required|in:rhythm,stress,hypoxia,inflammation,cognitive,metabolic,comprehensive',
            'insights' => 'required|array|min:1',
            'insights.*.insight_type' => 'required|string',
            'insights.*.title' => 'required|string|max:255',
            'insights.*.description' => 'required|string',
            'insights.*.confidence_score' => 'required|numeric|between:0,1',
            'insights.*.severity' => 'required|in:info,low,medium,high,critical',
            'insights.*.recommended_action' => 'nullable|string',
        ]);

        $job = AiAnalysisJob::create([
            'uuid' => (string) Str::uuid(),
            'astronaut_id' => $data['astronaut_id'],
            'model_name' => $data['model_name'],
            'model_version' => $request->input('model_version', 'v2.4.0'),
            'analysis_type' => $data['analysis_type'],
            'status' => 'completed',
            'received_at' => now(),
            'processed_at' => now(),
        ]);

        $createdInsights = [];
        foreach ($data['insights'] as $item) {
            $insight = AiInsight::create([
                'job_id' => $job->id,
                'astronaut_id' => $data['astronaut_id'],
                'insight_type' => $item['insight_type'],
                'title' => $item['title'],
                'description' => $item['description'],
                'confidence_score' => $item['confidence_score'],
                'severity' => $item['severity'],
                'recommended_action' => $item['recommended_action'] ?? null,
                'analyzed_at' => now(),
                'review_status' => 'pending_review',
            ]);
            $createdInsights[] = $insight;
        }

        AuditLog::record(
            'ai_insights_ingested',
            'AiAnalysisJob',
            $job->id,
            "Ingested {$job->model_name} analysis batch containing ".count($createdInsights).' insights.'
        );

        return ApiResponse::created([
            'job' => $job,
            'insights' => $createdInsights,
        ], 'AI analysis batch ingested successfully.');
    }

    /**
     * Human-in-the-Loop Flight Surgeon approval.
     */
    public function approve(Request $request, $id)
    {
        $insight = AiInsight::findOrFail($id);

        $insight->update(['review_status' => 'approved']);

        $review = ClinicalReview::updateOrCreate(
            ['insight_id' => $insight->id],
            [
                'reviewer_id' => auth()->id() ?? 1,
                'decision' => 'approved',
                'reviewer_notes' => $request->input('reviewer_notes', 'Clinically verified and accepted by Flight Surgeon.'),
                'reviewed_at' => now(),
            ]
        );

        AuditLog::record(
            'ai_insight_approved',
            'AiInsight',
            $insight->id,
            "Insight [{$insight->title}] approved by Flight Surgeon.",
            ['status' => 'pending_review'],
            ['status' => 'approved']
        );

        return ApiResponse::success([
            'insight' => $insight->fresh(),
            'review' => $review,
        ], 'AI insight approved by Flight Surgeon.');
    }

    /**
     * Human-in-the-Loop Flight Surgeon rejection.
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'reviewer_notes' => 'required|string|min:5',
        ]);

        $insight = AiInsight::findOrFail($id);
        $insight->update(['review_status' => 'rejected']);

        $review = ClinicalReview::updateOrCreate(
            ['insight_id' => $insight->id],
            [
                'reviewer_id' => auth()->id() ?? 1,
                'decision' => 'rejected',
                'reviewer_notes' => $request->input('reviewer_notes'),
                'reviewed_at' => now(),
            ]
        );

        AuditLog::record(
            'ai_insight_rejected',
            'AiInsight',
            $insight->id,
            "Insight [{$insight->title}] rejected: {$request->input('reviewer_notes')}",
            ['status' => 'pending_review'],
            ['status' => 'rejected']
        );

        return ApiResponse::success([
            'insight' => $insight->fresh(),
            'review' => $review,
        ], 'AI insight rejected by Flight Surgeon.');
    }

    /**
     * Human-in-the-Loop Flight Surgeon modification.
     */
    public function modify(Request $request, $id)
    {
        $request->validate([
            'modified_description' => 'required|string|min:5',
            'reviewer_notes' => 'nullable|string',
        ]);

        $insight = AiInsight::findOrFail($id);
        $insight->update(['review_status' => 'modified']);

        $review = ClinicalReview::updateOrCreate(
            ['insight_id' => $insight->id],
            [
                'reviewer_id' => auth()->id() ?? 1,
                'decision' => 'modified',
                'modified_description' => $request->input('modified_description'),
                'reviewer_notes' => $request->input('reviewer_notes'),
                'reviewed_at' => now(),
            ]
        );

        AuditLog::record(
            'ai_insight_modified',
            'AiInsight',
            $insight->id,
            "Insight [{$insight->title}] modified by Flight Surgeon.",
            ['status' => 'pending_review'],
            ['status' => 'modified', 'modified_description' => $request->input('modified_description')]
        );

        return ApiResponse::success([
            'insight' => $insight->fresh(),
            'review' => $review,
        ], 'AI insight updated with Flight Surgeon clinical modifications.');
    }
}
