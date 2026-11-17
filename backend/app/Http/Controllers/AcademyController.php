<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use App\Models\AcademyCourse;
use App\Models\AcademyLesson;
use App\Models\AcademyMiniGame;
use App\Models\AcademyQuiz;
use App\Models\Badge;
use App\Models\UserAcademyProgress;
use App\Models\UserBadge;
use App\Models\UserXpRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AcademyController extends Controller
{
    /**
     * Get published academy courses.
     */
    public function courses(Request $request)
    {
        $query = AcademyCourse::withCount('lessons')
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
     * Get single course details with lessons outline.
     */
    public function courseDetail($id)
    {
        $course = AcademyCourse::with(['lessons' => function ($q) {
            $q->where('is_published', true)->orderBy('sort_order', 'asc');
        }])->findOrFail($id);

        return ApiResponse::success($course, 'Course details retrieved.');
    }

    /**
     * Get lesson details with attached interactive quizzes.
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
        $user = auth()->user() ?? \App\Models\User::first();

        $answers = $request->input('answers', []); // map of quiz_id => selected_option_index
        $totalQuizzes = $lesson->quizzes->count();
        $correctCount = 0;

        foreach ($lesson->quizzes as $quiz) {
            if (isset($answers[$quiz->id]) && (int)$answers[$quiz->id] === $quiz->correct_option_index) {
                $correctCount++;
            }
        }

        $scorePercent = $totalQuizzes > 0 ? round(($correctCount / $totalQuizzes) * 100, 2) : 100;
        $passed = $scorePercent >= 70;
        $xpAwarded = 0;

        if ($passed) {
            $xpAwarded = $lesson->xp_reward ?: 25;

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
            $this->evaluateBadges($user->id);
        }

        return ApiResponse::success([
            'passed' => $passed,
            'score_percent' => $scorePercent,
            'correct_count' => $correctCount,
            'total_questions' => $totalQuizzes,
            'xp_awarded' => $xpAwarded,
        ], $passed ? 'Congratulations! Quiz passed and XP awarded.' : 'Quiz completed. Keep training to improve your score.');
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
     * Get authenticated user's XP, current rank, and unlocked badges.
     */
    public function myProgress()
    {
        $user = auth()->user() ?? \App\Models\User::first();

        $totalXp = UserXpRecord::where('user_id', $user->id)->sum('xp_earned');

        $rank = 'Cadet';
        if ($totalXp >= 2000) $rank = 'Mission Director';
        elseif ($totalXp >= 1000) $rank = 'Flight Surgeon';
        elseif ($totalXp >= 600) $rank = 'Commander';
        elseif ($totalXp >= 300) $rank = 'Pilot';
        elseif ($totalXp >= 100) $rank = 'Specialist';

        $earnedBadges = UserBadge::with('badge')
            ->where('user_id', $user->id)
            ->get();

        $completedLessons = UserAcademyProgress::where('user_id', $user->id)
            ->where('status', 'completed')
            ->count();

        return ApiResponse::success([
            'total_xp' => $totalXp,
            'rank' => $rank,
            'completed_lessons' => $completedLessons,
            'badges' => $earnedBadges,
        ], 'User academy progress retrieved.');
    }

    /**
     * Public leaderboard ranking cadets and students.
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

        return ApiResponse::success($leaders, 'Academy leaderboard retrieved.');
    }

    private function evaluateBadges(int $userId): void
    {
        $totalXp = UserXpRecord::where('user_id', $userId)->sum('xp_earned');
        $eligibleBadges = Badge::where('xp_required', '<=', $totalXp)->get();

        foreach ($eligibleBadges as $badge) {
            UserBadge::firstOrCreate(
                ['user_id' => $userId, 'badge_id' => $badge->id],
                ['earned_at' => now()]
            );
        }
    }
}
