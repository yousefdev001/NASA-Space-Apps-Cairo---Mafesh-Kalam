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

        if ($request->has('search') && ! empty($request->query('search'))) {
            $search = '%'.$request->query('search').'%';
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', $search)
                    ->orWhere('callsign', 'like', $search)
                    ->orWhere('specialization', 'like', $search);
            });
        }

        $astronauts = $query->orderBy('id')->get()->map(function ($a) {
            $latestVital = DB::table('vital_readings')
                ->where('astronaut_id', $a->id)
                ->latest('measured_at')
                ->first();

            $mission = DB::table('mission_crew_assignments')
                ->join('missions', 'mission_crew_assignments.mission_id', '=', 'missions.id')
                ->where('mission_crew_assignments.astronaut_id', $a->id)
                ->select('missions.mission_code', 'missions.name')
                ->first();

            $a->status = $latestVital ? $latestVital->status : 'nominal';
            $a->latest_hr = $latestVital ? (int) $latestVital->heart_rate_bpm : 68;
            $a->mission_name = $mission ? ($mission->mission_code.' · '.$mission->name) : 'Orbital Reserve';

            return $a;
        });

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
            ->select('missions.*', 'mission_crew_assignments.crew_role', 'mission_crew_assignments.is_primary_crew')
            ->get();

        return ApiResponse::success([
            'astronaut' => $astronaut,
            'baselines' => $baselines,
            'missions' => $missions,
        ]);
    }
}
