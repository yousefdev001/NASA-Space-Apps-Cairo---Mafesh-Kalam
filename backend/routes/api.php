<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\AstronautController;
use App\Http\Controllers\MissionControlController;
use App\Http\Controllers\TelemetryController;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\Request;
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
    return ApiResponse::success(DB::table('organ_systems')->get());
});

// Missions
Route::get('/missions', function () {
    return ApiResponse::success(
        DB::table('missions')->orderBy('launch_date', 'desc')->get()
    );
});

// Alerts Triage
Route::get('/alerts', function () {
    return ApiResponse::success(
        DB::table('alerts')->orderBy('triggered_at', 'desc')->get()
    );
});

// AI Insights HITL Queue
Route::get('/ai-insights', function () {
    return ApiResponse::success(
        DB::table('ai_insights')->orderBy('analyzed_at', 'desc')->get()
    );
});

// Reports
Route::get('/reports', function () {
    return ApiResponse::success(
        DB::table('reports')->orderBy('created_at', 'desc')->get()
    );
});

// Articles (Public)
Route::get('/public/articles', function (Request $request) {
    $query = DB::table('articles');
    if ($request->has('audience') && in_array($request->query('audience'), ['kids', 'adults'])) {
        $query->where('target_audience', $request->query('audience'));
    }
    return ApiResponse::success($query->get());
});
