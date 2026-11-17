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

// Health & System Info
Route::get('/health', function () {
    return ApiResponse::success([
        'status' => 'operational',
        'tier' => 'Tier 4 Web Ground Station',
        'database' => 'connected',
        'time' => now()->toIso8601String(),
    ], 'AuraMed Ground Station is fully operational.');
});

// Authentication Routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// Mission Control Dashboard Telemetry
Route::get('/dashboard/mission-control', [MissionControlController::class, 'dashboard']);

// Astronauts Roster & Medical Dossiers
Route::get('/astronauts', [AstronautController::class, 'index']);
Route::get('/astronauts/{id}', [AstronautController::class, 'show']);

// Telemetry & Bio-Scan
Route::prefix('telemetry')->group(function () {
    Route::post('/ingest', [TelemetryController::class, 'ingest']);
    Route::get('/{astronautId}/latest', [TelemetryController::class, 'latest']);
});

// Organ Systems Reference
Route::get('/organ-systems', function () {
    return ApiResponse::success(DB::table('organ_systems')->orderBy('sort_order')->get());
});

// Missions
Route::get('/missions', function () {
    return ApiResponse::success(
        DB::table('missions')->orderBy('launch_date', 'desc')->get()
    );
});

// AI Insights HITL Queue & Review Workflow
Route::prefix('ai-insights')->group(function () {
    Route::get('/', [AiInsightController::class, 'index']);
    Route::get('/stats', [AiInsightController::class, 'stats']);
    Route::post('/ingest', [AiInsightController::class, 'ingest']);
    Route::get('/{id}', [AiInsightController::class, 'show']);
    Route::post('/{id}/approve', [AiInsightController::class, 'approve']);
    Route::post('/{id}/reject', [AiInsightController::class, 'reject']);
    Route::post('/{id}/modify', [AiInsightController::class, 'modify']);
});

// Alerts Triage System
Route::prefix('alerts')->group(function () {
    Route::get('/', [AlertController::class, 'index']);
    Route::get('/unresolved-count', [AlertController::class, 'unresolvedCount']);
    Route::get('/{id}', [AlertController::class, 'show']);
    Route::post('/{id}/acknowledge', [AlertController::class, 'acknowledge']);
    Route::post('/{id}/escalate', [AlertController::class, 'escalate']);
    Route::post('/{id}/resolve', [AlertController::class, 'resolve']);
    Route::post('/{id}/dismiss', [AlertController::class, 'dismiss']);
});

// Reports & Forensic Timeline
Route::prefix('reports')->group(function () {
    Route::get('/', [ReportController::class, 'index']);
    Route::post('/', [ReportController::class, 'store']);
    Route::get('/{id}', [ReportController::class, 'show']);
    Route::post('/{id}/approve', [ReportController::class, 'approve']);
    Route::get('/{id}/export/pdf', [ReportController::class, 'exportPdf']);
    Route::get('/{id}/export/csv', [ReportController::class, 'exportCsv']);
    Route::get('/{id}/forensic', [ReportController::class, 'forensicTimeline']);
});

// Space Academy & Gamification
Route::prefix('academy')->group(function () {
    Route::get('/courses', [AcademyController::class, 'courses']);
    Route::get('/courses/{id}', [AcademyController::class, 'courseDetail']);
    Route::get('/courses/{courseId}/lessons/{lessonId}', [AcademyController::class, 'lessonDetail']);
    Route::post('/lessons/{lessonId}/submit-quiz', [AcademyController::class, 'submitQuiz']);
    Route::get('/mini-games', [AcademyController::class, 'miniGames']);
    Route::get('/badges', [AcademyController::class, 'badges']);
    Route::get('/my-progress', [AcademyController::class, 'myProgress']);
    Route::get('/leaderboard', [AcademyController::class, 'leaderboard']);
});

// Educational Articles (Public & Management)
Route::get('/public/articles', [ArticleController::class, 'publicArticles']);
Route::get('/public/articles/{slug}', [ArticleController::class, 'publicArticleDetail']);
Route::prefix('articles')->group(function () {
    Route::get('/', [ArticleController::class, 'index']);
    Route::post('/', [ArticleController::class, 'store']);
    Route::post('/{id}/publish', [ArticleController::class, 'publish']);
    Route::delete('/{id}', [ArticleController::class, 'destroy']);
});

// Security & Cryptographic Audit Trail
Route::prefix('audit-logs')->group(function () {
    Route::get('/', [AuditController::class, 'index']);
    Route::get('/verify', [AuditController::class, 'verifyIntegrity']);
});
