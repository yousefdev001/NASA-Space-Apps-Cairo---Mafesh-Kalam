<?php

use App\Http\Controllers\AcademyController;
use App\Http\Controllers\AiInsightController;
use App\Http\Controllers\AlertController;
use App\Http\Controllers\ArticleController;
use App\Http\Controllers\AstronautController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\MissionControlController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TelemetryController;
use App\Http\Responses\ApiResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes (No Authentication Required)
|--------------------------------------------------------------------------
*/

// Ground Station Health & Protocol Handshake
Route::get('/health', function () {
    return ApiResponse::success([
        'status' => 'operational',
        'tier' => 'Tier 4 Web Ground Station',
        'database' => 'connected',
        'time' => now()->toIso8601String(),
    ], 'AuraMed Ground Station is fully operational.');
});

// Authentication: Login & Sanctum Token Generation
Route::post('/auth/login', [AuthController::class, 'login']);

// Public Educational Space Articles
Route::get('/public/articles', [ArticleController::class, 'publicArticles']);
Route::get('/public/articles/{slug}', [ArticleController::class, 'publicArticleDetail']);

// Space Academy (Curricula, Lessons, Quizzes, Mini-Games, Leaderboard & Badges)
Route::prefix('academy')->group(function () {
    Route::get('/courses', [AcademyController::class, 'courses']);
    Route::get('/courses/{id}', [AcademyController::class, 'courseDetail']);
    Route::get('/courses/{courseId}/lessons/{lessonId}', [AcademyController::class, 'lessonDetail']);
    Route::get('/lessons/{lessonId}', [AcademyController::class, 'singleLessonDetail']);
    Route::post('/lessons/{lessonId}/submit-quiz', [AcademyController::class, 'submitQuiz']);
    Route::get('/mini-games', [AcademyController::class, 'miniGames']);
    Route::post('/mini-games/{id}/submit-score', [AcademyController::class, 'submitGameScore']);
    Route::get('/badges', [AcademyController::class, 'badges']);
    Route::get('/my-progress', [AcademyController::class, 'myProgress']);
    Route::get('/leaderboard', [AcademyController::class, 'leaderboard']);
});

/*
|--------------------------------------------------------------------------
| Protected Mission Systems (Sanctum Auth + Spatie RBAC Granular Permissions)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Identity & Session Management
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    // Mission Control Live Telemetry
    Route::get('/dashboard/mission-control', [MissionControlController::class, 'dashboard'])
        ->middleware('permission:view_vital_readings');

    // Astronauts Roster & Medical Records
    Route::prefix('astronauts')->group(function () {
        Route::get('/', [AstronautController::class, 'index'])
            ->middleware('permission:view_astronauts');
        Route::get('/{id}', [AstronautController::class, 'show'])
            ->middleware('permission:view_astronauts');
    });

    // Missions & Crew Readiness
    Route::get('/missions', function () {
        return ApiResponse::success(
            DB::table('missions')->orderBy('launch_date', 'desc')->get()
        );
    })->middleware('permission:view_missions');

    // Organ Systems Reference Catalog
    Route::get('/organ-systems', function () {
        return ApiResponse::success(DB::table('organ_systems')->orderBy('sort_order')->get());
    })->middleware('permission:view_organ_telemetry');

    // Telemetry Sync & Bio-Scan Downlink
    Route::prefix('telemetry')->group(function () {
        Route::post('/ingest', [TelemetryController::class, 'ingest'])
            ->middleware('permission:ingest_telemetry_data');
        Route::get('/{astronautId}/latest', [TelemetryController::class, 'latest'])
            ->middleware('permission:view_vital_readings');
    });

    // AI Insights HITL Queue & Review Workflow
    Route::prefix('ai-insights')->group(function () {
        Route::get('/', [AiInsightController::class, 'index'])
            ->middleware('permission:view_ai_insights');
        Route::get('/stats', [AiInsightController::class, 'stats'])
            ->middleware('permission:view_ai_insights');
        Route::post('/ingest', [AiInsightController::class, 'ingest'])
            ->middleware('permission:ingest_telemetry_data');
        Route::get('/{id}', [AiInsightController::class, 'show'])
            ->middleware('permission:view_ai_insights');
        Route::post('/{id}/approve', [AiInsightController::class, 'approve'])
            ->middleware('permission:approve_ai_insights');
        Route::post('/{id}/reject', [AiInsightController::class, 'reject'])
            ->middleware('permission:reject_ai_insights');
        Route::post('/{id}/modify', [AiInsightController::class, 'modify'])
            ->middleware('permission:modify_ai_insights');
    });

    // Alerts Triage & Incident Workflow
    Route::prefix('alerts')->group(function () {
        Route::get('/', [AlertController::class, 'index'])
            ->middleware('permission:view_alerts');
        Route::get('/unresolved-count', [AlertController::class, 'unresolvedCount'])
            ->middleware('permission:view_alerts');
        Route::get('/{id}', [AlertController::class, 'show'])
            ->middleware('permission:view_alerts');
        Route::post('/{id}/acknowledge', [AlertController::class, 'acknowledge'])
            ->middleware('permission:acknowledge_alerts');
        Route::post('/{id}/escalate', [AlertController::class, 'escalate'])
            ->middleware('permission:escalate_alerts');
        Route::post('/{id}/resolve', [AlertController::class, 'resolve'])
            ->middleware('permission:resolve_alerts');
        Route::post('/{id}/dismiss', [AlertController::class, 'dismiss'])
            ->middleware('permission:dismiss_alerts');
    });

    // Medical Reports & Forensic Timelines (RPT-01 to RPT-09)
    Route::prefix('reports')->group(function () {
        Route::get('/', [ReportController::class, 'index'])
            ->middleware('permission:view_reports');
        Route::post('/', [ReportController::class, 'store'])
            ->middleware('permission:create_reports');
        Route::get('/{id}', [ReportController::class, 'show'])
            ->middleware('permission:view_reports');
        Route::post('/{id}/approve', [ReportController::class, 'approve'])
            ->middleware('permission:approve_reports');
        Route::get('/{id}/export/pdf', [ReportController::class, 'exportPdf'])
            ->middleware('permission:export_reports_pdf');
        Route::get('/{id}/export/csv', [ReportController::class, 'exportCsv'])
            ->middleware('permission:export_reports_csv');
        Route::get('/{id}/forensic', [ReportController::class, 'forensicTimeline'])
            ->middleware('permission:view_forensic_timeline');
    });

    // Content Management (Educational Articles)
    Route::prefix('articles')->group(function () {
        Route::get('/', [ArticleController::class, 'index'])
            ->middleware('permission:view_articles');
        Route::post('/', [ArticleController::class, 'store'])
            ->middleware('permission:create_articles');
        Route::post('/{id}/publish', [ArticleController::class, 'publish'])
            ->middleware('permission:publish_articles');
        Route::delete('/{id}', [ArticleController::class, 'destroy'])
            ->middleware('permission:delete_articles');
    });

    // Security & Non-Repudiation Audit Ledger
    Route::prefix('audit-logs')->group(function () {
        Route::get('/', [AuditController::class, 'index'])
            ->middleware('permission:view_audit_logs');
        Route::get('/verify', [AuditController::class, 'verifyIntegrity'])
            ->middleware('permission:verify_audit_chain');
    });
});
