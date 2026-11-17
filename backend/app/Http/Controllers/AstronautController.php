<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AstronautController extends Controller
{
    /**
     * List all astronauts with baseline and mission summary.
     */
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('astronauts')
            ->select(
                'astronauts.id',
                'astronauts.uuid',
                'astronauts.callsign',
                'astronauts.full_name',
                'astronauts.nationality',
                'astronauts.rank',
                'astronauts.specialization',
                'astronauts.blood_type',
                'astronauts.gender',
                'astronauts.total_eva_hours',
                'astronauts.total_space_days',
                'astronauts.eva_certified',
                'astronauts.is_active'
            );

        if ($request->has('search')) {
            $search = '%'.$request->query('search').'%';
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', $search)
                    ->orWhere('callsign', 'like', $search)
                    ->orWhere('specialization', 'like', $search);
            });
        }

        $astronauts = $query->orderBy('id')->get();

        return ApiResponse::success($astronauts);
    }

    /**
     * Show single astronaut dossier.
     */
    public function show(int $id): JsonResponse
    {
        $astronaut = DB::table('astronauts')->where('id', $id)->first();

        if (! $astronaut) {
            return ApiResponse::error('Astronaut not found.', 404);
        }

        $baselines = DB::table('astronaut_medical_baselines')
            ->where('astronaut_id', $id)
            ->latest('measured_at')
            ->first();

        $missions = DB::table('mission_crew_assignments')
            ->join('missions', 'mission_crew_assignments.mission_id', '=', 'missions.id')
            ->where('mission_crew_assignments.astronaut_id', $id)
            ->select('missions.id', 'missions.mission_code', 'missions.name', 'missions.status', 'mission_crew_assignments.crew_role')
            ->get();

        return ApiResponse::success([
            'astronaut' => $astronaut,
            'baselines' => $baselines,
            'missions' => $missions,
        ]);
    }
}
