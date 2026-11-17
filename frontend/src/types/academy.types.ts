export interface AcademyQuiz {
  id: number;
  lesson_id: number;
  question: string;
  options: string[];
  correct_option_index: number;
  explanation?: string;
  sort_order: number;
}

export interface AcademyLesson {
  id: number;
  course_id: number;
  title: string;
  content: string;
  lesson_type: 'text' | 'video' | 'quiz' | 'game';
  sort_order: number;
  xp_reward: number;
  duration_minutes: number;
  is_published: boolean;
  quizzes?: AcademyQuiz[];
}

export interface AcademyCourse {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  target_audience: 'kids' | 'adults' | 'both';
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  thumbnail_path?: string | null;
  xp_reward: number;
  is_published: boolean;
  sort_order: number;
  lessons_count?: number;
  lessons?: AcademyLesson[];
}

export interface AcademyMiniGame {
  id: number;
  title: string;
  slug: string;
  game_type: string;
  target_audience: 'kids' | 'all';
  description: string;
  xp_reward: number;
  is_active: boolean;
}

export interface Badge {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon_path?: string | null;
  xp_required: number;
  category: string;
}

export interface UserBadge {
  id: number;
  user_id: number;
  badge_id: number;
  earned_at: string;
  badge: Badge;
}

export interface MyProgress {
  user: {
    id: number;
    name: string;
    email: string;
  };
  total_xp: number;
  rank: string;
  next_rank: string;
  next_rank_xp: number;
  completed_lessons: number;
  badges: UserBadge[];
}

export interface LeaderboardEntry {
  id: number;
  name: string;
  total_xp: number;
  rank: string;
  leaderboard_position: number;
  badge_count: number;
}

export interface QuizSubmissionResult {
  passed: boolean;
  score_percent: number;
  correct_count: number;
  total_questions: number;
  xp_awarded: number;
  total_xp: number;
  rank: string;
  new_badges: Badge[];
  quiz_results: {
    quiz_id: number;
    user_choice: number | null;
    correct_option_index: number;
    is_correct: boolean;
    explanation: string;
  }[];
}

export interface GameSubmissionResult {
  game_id: number;
  game_title: string;
  score: number;
  xp_awarded: number;
  total_xp: number;
  rank: string;
  new_badges: Badge[];
}
