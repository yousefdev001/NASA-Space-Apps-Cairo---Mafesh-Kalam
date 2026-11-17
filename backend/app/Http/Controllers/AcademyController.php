<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use App\Models\AcademyCourse;
use App\Models\AcademyLesson;
use App\Models\AcademyMiniGame;
use App\Models\Badge;
use App\Models\User;
use App\Models\UserAcademyProgress;
use App\Models\UserBadge;
use App\Models\UserXpRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AcademyController extends Controller
{
    /**
     * Get published academy courses with lesson counts.
     */
    public function courses(Request $request)
    {
        $query = AcademyCourse::withCount('lessons')
            ->with(['lessons' => function ($q) {
                $q->where('is_published', true)->orderBy('sort_order', 'asc');
            }])
            ->where('is_published', true)
            ->orderBy('sort_order', 'asc');

        if ($request->has('target_audience') && $request->query('target_audience') !== 'all') {
            $query->whereIn('target_audience', [$request->query('target_audience'), 'both']);
        }

        if ($request->has('difficulty') && $request->query('difficulty') !== 'all') {
            $query->where('difficulty', $request->query('difficulty'));
        }

        if ($request->has('category')) {
            $query->where('category', $request->query('category'));
        }

        $courses = $query->get();

        return ApiResponse::success($courses, 'Academy courses retrieved.');
    }

    /**
     * Get single course details with all lessons and attached quizzes.
     */
    public function courseDetail($id)
    {
        $course = AcademyCourse::with(['lessons' => function ($q) {
            $q->where('is_published', true)->orderBy('sort_order', 'asc')->with('quizzes');
        }])->findOrFail($id);

        return ApiResponse::success($course, 'Course details retrieved.');
    }

    /**
     * Get single lesson details directly with quizzes.
     */
    public function singleLessonDetail($lessonId)
    {
        $lesson = AcademyLesson::with(['quizzes', 'course'])->findOrFail($lessonId);

        return ApiResponse::success($lesson, 'Lesson details retrieved.');
    }

    /**
     * Get lesson details with attached interactive quizzes scoped to course.
     */
    public function lessonDetail($courseId, $lessonId)
    {
        $lesson = AcademyLesson::with('quizzes')
            ->where('course_id', $courseId)
            ->findOrFail($lessonId);

        return ApiResponse::success($lesson, 'Lesson details retrieved.');
    }

    /**
     * Submit answers for a lesson quiz and award XP.
     */
    public function submitQuiz(Request $request, $lessonId)
    {
        $lesson = AcademyLesson::with('quizzes')->findOrFail($lessonId);
        $user = auth('sanctum')->user()
            ?? auth()->user()
            ?? User::where('email', 'cadet_student@auramed.nasa.gov')->first()
            ?? User::first();

        $answers = $request->input('answers', []); // map of quiz_id => selected_option_index
        $totalQuizzes = $lesson->quizzes->count();
        $correctCount = 0;
        $quizResults = [];

        foreach ($lesson->quizzes as $quiz) {
            $userChoice = isset($answers[$quiz->id]) ? (int) $answers[$quiz->id] : null;
            $isCorrect = $userChoice !== null && $userChoice === (int) $quiz->correct_option_index;
            if ($isCorrect) {
                $correctCount++;
            }
            $quizResults[] = [
                'quiz_id' => $quiz->id,
                'user_choice' => $userChoice,
                'correct_option_index' => $quiz->correct_option_index,
                'is_correct' => $isCorrect,
                'explanation' => $quiz->explanation,
            ];
        }

        $scorePercent = $totalQuizzes > 0 ? round(($correctCount / $totalQuizzes) * 100, 2) : 100;
        $passed = $scorePercent >= 60;
        $xpAwarded = 0;
        $newBadges = [];

        if ($passed) {
            $xpAwarded = $lesson->xp_reward ?: 40;

            UserXpRecord::create([
                'user_id' => $user->id,
                'source_type' => 'quiz',
                'source_id' => $lesson->id,
                'xp_earned' => $xpAwarded,
                'earned_at' => now(),
                'created_at' => now(),
            ]);

            UserAcademyProgress::updateOrCreate(
                ['user_id' => $user->id, 'course_id' => $lesson->course_id, 'lesson_id' => $lesson->id],
                [
                    'status' => 'completed',
                    'completed_at' => now(),
                    'score_percent' => $scorePercent,
                ]
            );

            // Check if user unlocked any new badges
            $newBadges = $this->evaluateBadges($user->id);
        }

        $totalXp = (int) UserXpRecord::where('user_id', $user->id)->sum('xp_earned');
        $rank = $this->calculateRank($totalXp);

        return ApiResponse::success([
            'passed' => $passed,
            'score_percent' => $scorePercent,
            'correct_count' => $correctCount,
            'total_questions' => $totalQuizzes,
            'xp_awarded' => $xpAwarded,
            'total_xp' => $totalXp,
            'rank' => $rank,
            'new_badges' => $newBadges,
            'quiz_results' => $quizResults,
        ], $passed ? 'Congratulations! Quiz passed and '.$xpAwarded.' XP awarded.' : 'Quiz completed. Keep training to achieve 60% or higher.');
    }

    /**
     * Submit score from interactive mini-game and award XP.
     */
    public function submitGameScore(Request $request, $id)
    {
        $game = is_numeric($id)
            ? AcademyMiniGame::findOrFail($id)
            : AcademyMiniGame::where('slug', $id)->firstOrFail();

        $user = auth('sanctum')->user()
            ?? auth()->user()
            ?? User::where('email', 'cadet_student@auramed.nasa.gov')->first()
            ?? User::first();

        $score = (int) $request->input('score', 100);
        $maxScore = max((int) $request->input('max_score', 100), 1);
        $ratio = min(max($score / $maxScore, 0), 1);
        $xpAwarded = max((int) round($ratio * ($game->xp_reward ?: 50)), 15);

        UserXpRecord::create([
            'user_id' => $user->id,
            'source_type' => 'game',
            'source_id' => $game->id,
            'xp_earned' => $xpAwarded,
            'earned_at' => now(),
            'created_at' => now(),
        ]);

        $newBadges = $this->evaluateBadges($user->id);
        $totalXp = (int) UserXpRecord::where('user_id', $user->id)->sum('xp_earned');
        $rank = $this->calculateRank($totalXp);

        return ApiResponse::success([
            'game_id' => $game->id,
            'game_title' => $game->title,
            'score' => $score,
            'xp_awarded' => $xpAwarded,
            'total_xp' => $totalXp,
            'rank' => $rank,
            'new_badges' => $newBadges,
        ], 'Mission simulator complete! '.$xpAwarded.' XP awarded.');
    }

    /**
     * Get active interactive mini-games.
     */
    public function miniGames()
    {
        $games = AcademyMiniGame::where('is_active', true)->get();

        return ApiResponse::success($games, 'Academy mini-games retrieved.');
    }

    /**
     * Get all available badges.
     */
    public function badges()
    {
        $badges = Badge::orderBy('xp_required', 'asc')->get();

        return ApiResponse::success($badges, 'Badges catalog retrieved.');
    }

    /**
     * Get user's XP, current rank, next threshold, and unlocked badges.
     */
    public function myProgress()
    {
        $user = auth('sanctum')->user()
            ?? auth()->user()
            ?? User::where('email', 'cadet_student@auramed.nasa.gov')->first()
            ?? User::first();

        $totalXp = (int) UserXpRecord::where('user_id', $user->id)->sum('xp_earned');
        $rank = $this->calculateRank($totalXp);

        $earnedBadges = UserBadge::with('badge')
            ->where('user_id', $user->id)
            ->get();

        $completedLessons = UserAcademyProgress::where('user_id', $user->id)
            ->where('status', 'completed')
            ->count();

        $ranks = [
            ['name' => 'Cadet', 'min_xp' => 0, 'max_xp' => 100],
            ['name' => 'Specialist', 'min_xp' => 100, 'max_xp' => 300],
            ['name' => 'Pilot', 'min_xp' => 300, 'max_xp' => 600],
            ['name' => 'Commander', 'min_xp' => 600, 'max_xp' => 1000],
            ['name' => 'Flight Surgeon', 'min_xp' => 1000, 'max_xp' => 2000],
            ['name' => 'Mission Director', 'min_xp' => 2000, 'max_xp' => 5000],
        ];

        $nextRank = $ranks[1];
        foreach ($ranks as $i => $tier) {
            if ($totalXp >= $tier['min_xp']) {
                $nextRank = $ranks[$i + 1] ?? null;
            }
        }

        return ApiResponse::success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'total_xp' => $totalXp,
            'rank' => $rank,
            'next_rank' => $nextRank ? $nextRank['name'] : 'Apex Astronaut',
            'next_rank_xp' => $nextRank ? $nextRank['min_xp'] : 5000,
            'completed_lessons' => $completedLessons,
            'badges' => $earnedBadges,
        ], 'User academy progress retrieved.');
    }

    /**
     * Public leaderboard ranking cadets and flight surgeons.
     */
    public function leaderboard()
    {
        $leaders = DB::table('user_xp_records')
            ->join('users', 'user_xp_records.user_id', '=', 'users.id')
            ->select('users.id', 'users.name', DB::raw('SUM(user_xp_records.xp_earned) as total_xp'))
            ->groupBy('users.id', 'users.name')
            ->orderBy('total_xp', 'desc')
            ->limit(10)
            ->get();

        $leaders = $leaders->map(function ($cadet, $index) {
            $cadet->rank = $this->calculateRank((int) $cadet->total_xp);
            $cadet->leaderboard_position = $index + 1;
            $cadet->badge_count = UserBadge::where('user_id', $cadet->id)->count();

            return $cadet;
        });

        return ApiResponse::success($leaders, 'Academy leaderboard retrieved.');
    }

    private function calculateRank(int $totalXp): string
    {
        if ($totalXp >= 2000) {
            return 'Mission Director';
        } elseif ($totalXp >= 1000) {
            return 'Flight Surgeon';
        } elseif ($totalXp >= 600) {
            return 'Commander';
        } elseif ($totalXp >= 300) {
            return 'Pilot';
        } elseif ($totalXp >= 100) {
            return 'Specialist';
        }

        return 'Cadet';
    }

    private function evaluateBadges(int $userId): array
    {
        $totalXp = (int) UserXpRecord::where('user_id', $userId)->sum('xp_earned');
        $eligibleBadges = Badge::where('xp_required', '<=', $totalXp)->get();
        $newBadges = [];

        foreach ($eligibleBadges as $badge) {
            $alreadyHas = UserBadge::where('user_id', $userId)
                ->where('badge_id', $badge->id)
                ->exists();

            if (! $alreadyHas) {
                UserBadge::create([
                    'user_id' => $userId,
                    'badge_id' => $badge->id,
                    'earned_at' => now(),
                ]);
                $newBadges[] = $badge;
            }
        }

        return $newBadges;
    }
}
