import apiClient from './client';
import {
  AcademyCourse,
  AcademyLesson,
  AcademyMiniGame,
  Badge,
  MyProgress,
  LeaderboardEntry,
  QuizSubmissionResult,
  GameSubmissionResult,
} from '../types/academy.types';

export const academyApi = {
  /**
   * Fetch courses with optional audience filter ('kids' | 'adults' | 'all')
   */
  async getCourses(targetAudience?: 'kids' | 'adults' | 'all'): Promise<AcademyCourse[]> {
    const params: Record<string, string> = {};
    if (targetAudience && targetAudience !== 'all') {
      params.target_audience = targetAudience;
    }
    const res = await apiClient.get('/academy/courses', { params });
    return res.data.data;
  },

  /**
   * Fetch single course details with all lessons
   */
  async getCourseDetail(courseId: number): Promise<AcademyCourse> {
    const res = await apiClient.get(`/academy/courses/${courseId}`);
    return res.data.data;
  },

  /**
   * Fetch single lesson details with quizzes
   */
  async getLessonDetail(lessonId: number): Promise<AcademyLesson> {
    const res = await apiClient.get(`/academy/lessons/${lessonId}`);
    return res.data.data;
  },

  /**
   * Submit answers for a lesson's quizzes
   */
  async submitQuiz(
    lessonId: number,
    answers: Record<number, number>
  ): Promise<QuizSubmissionResult> {
    const res = await apiClient.post(`/academy/lessons/${lessonId}/submit-quiz`, { answers });
    return res.data.data;
  },

  /**
   * Fetch interactive mini-games
   */
  async getMiniGames(): Promise<AcademyMiniGame[]> {
    const res = await apiClient.get('/academy/mini-games');
    return res.data.data;
  },

  /**
   * Submit mini-game score and award XP
   */
  async submitGameScore(
    gameSlugOrId: string | number,
    score: number,
    maxScore: number = 100
  ): Promise<GameSubmissionResult> {
    const res = await apiClient.post(`/academy/mini-games/${gameSlugOrId}/submit-score`, {
      score,
      max_score: maxScore,
    });
    return res.data.data;
  },

  /**
   * Fetch badges catalog
   */
  async getBadges(): Promise<Badge[]> {
    const res = await apiClient.get('/academy/badges');
    return res.data.data;
  },

  /**
   * Fetch current user's academy progress, XP, and unlocked badges
   */
  async getMyProgress(): Promise<MyProgress> {
    const res = await apiClient.get('/academy/my-progress');
    return res.data.data;
  },

  /**
   * Fetch top 10 cadet leaderboard
   */
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const res = await apiClient.get('/academy/leaderboard');
    return res.data.data;
  },
};
