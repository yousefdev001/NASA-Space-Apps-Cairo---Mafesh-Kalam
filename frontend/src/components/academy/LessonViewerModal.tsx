import React, { useState } from 'react';
import {
  AcademyCourse,
  AcademyLesson,
  QuizSubmissionResult,
} from '../../types/academy.types';
import { academyApi } from '../../api/academyApi';
import {
  X,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Award,
  Sparkles,
  HelpCircle,
  Clock,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface LessonViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: AcademyCourse | null;
  onQuizCompleted: (result: QuizSubmissionResult) => void;
}

export const LessonViewerModal: React.FC<LessonViewerModalProps> = ({
  isOpen,
  onClose,
  course,
  onQuizCompleted,
}) => {
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizSubmissionResult | null>(null);

  if (!isOpen || !course) return null;

  const lessons = course.lessons || [];
  const currentLesson: AcademyLesson | undefined = lessons[selectedLessonIndex];
  const quizzes = currentLesson?.quizzes || [];

  const handleLessonSwitch = (index: number) => {
    setSelectedLessonIndex(index);
    setUserAnswers({});
    setQuizResult(null);
  };

  const handleSelectAnswer = (quizId: number, optionIndex: number) => {
    if (quizResult?.passed) return; // Locked once passed
    setUserAnswers((prev) => ({ ...prev, [quizId]: optionIndex }));
  };

  const handleSubmitQuiz = async () => {
    if (!currentLesson) return;
    try {
      setIsSubmitting(true);
      const res = await academyApi.submitQuiz(currentLesson.id, userAnswers);
      setQuizResult(res);
      onQuizCompleted(res);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setQuizResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#050B14]/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-[#0B132B] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.2)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E3A5F] bg-[#050B14]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase font-bold">
                  {course.category}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                  {course.difficulty}
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">+{course.xp_reward} Course XP</span>
              </div>
              <h2 className="text-lg font-mono font-bold text-white tracking-wide">{course.title}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E3A5F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body Grid: Lesson Sidebar + Main Content */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left: Lessons Navigator */}
          <div className="md:col-span-4 border-r border-[#1E3A5F] bg-[#050B14]/60 overflow-y-auto p-4 space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-3 px-1">
              CURRICULUM LESSONS ({lessons.length})
            </p>
            {lessons.map((lesson, idx) => {
              const isSelected = idx === selectedLessonIndex;

              return (
                <button
                  key={lesson.id}
                  onClick={() => handleLessonSwitch(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs font-mono flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                      : 'bg-[#0B132B]/80 border-[#1E3A5F] text-slate-300 hover:border-cyan-500/40 hover:text-white'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] text-cyan-400 font-bold">MODULE {idx + 1}</span>
                    <p className="font-bold line-clamp-2">{lesson.title}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {lesson.duration_minutes || 10}m
                      </span>
                      <span className="text-amber-400 font-bold">+{lesson.xp_reward} XP</span>
                    </div>
                  </div>
                  {isSelected && <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>

          {/* Right: Active Lesson Details & Interactive Quiz */}
          <div className="md:col-span-8 overflow-y-auto p-6 space-y-8 bg-[#0B132B]/95">
            {currentLesson ? (
              <>
                {/* Lesson Title & Metadata */}
                <div className="space-y-3 pb-6 border-b border-[#1E3A5F]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider uppercase">
                      LESSON {selectedLessonIndex + 1} OF {lessons.length}
                    </span>
                    <span className="text-xs font-mono text-amber-400 font-bold">
                      +{currentLesson.xp_reward} XP Reward
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-mono font-bold text-white leading-tight">
                    {currentLesson.title}
                  </h3>
                </div>

                {/* Lesson Medical & Space Content */}
                <div className="space-y-4 text-slate-300 leading-relaxed font-sans text-sm sm:text-base">
                  {currentLesson.content.split('\n\n').map((paragraph, pIdx) => (
                    <p key={pIdx} className="leading-relaxed bg-[#050B14]/40 p-4 rounded-xl border border-[#1E3A5F]/60">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Interactive Quiz Section */}
                {quizzes.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-[#1E3A5F]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-cyan-400" />
                        <h4 className="text-base font-mono font-bold text-white tracking-wide">
                          FLIGHT SURGEON KNOWLEDGE CHECK ({quizzes.length} QUESTIONS)
                        </h4>
                      </div>
                      <span className="text-xs font-mono text-slate-400">Passing Score: 60%</span>
                    </div>

                    {/* Quiz Questions List */}
                    <div className="space-y-6">
                      {quizzes.map((quiz, qIdx) => {
                        const selectedOption = userAnswers[quiz.id];
                        const resultDetails = quizResult?.quiz_results?.find(
                          (r) => r.quiz_id === quiz.id
                        );

                        return (
                          <div
                            key={quiz.id}
                            className={`p-5 rounded-2xl border transition-all ${
                              resultDetails
                                ? resultDetails.is_correct
                                  ? 'bg-emerald-950/20 border-emerald-500/40'
                                  : 'bg-rose-950/20 border-rose-500/40'
                                : 'bg-[#050B14] border-[#1E3A5F]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <p className="text-sm font-mono font-bold text-white">
                                <span className="text-cyan-400 mr-2">Q{qIdx + 1}.</span>
                                {quiz.question}
                              </p>
                              {resultDetails && (
                                <span
                                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                                    resultDetails.is_correct
                                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                                      : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                                  }`}
                                >
                                  {resultDetails.is_correct ? 'CORRECT' : 'INCORRECT'}
                                </span>
                              )}
                            </div>

                            {/* Radio Options */}
                            <div className="space-y-2.5">
                              {quiz.options.map((option, optIdx) => {
                                const isChecked = selectedOption === optIdx;
                                const isCorrectAnswer =
                                  resultDetails && resultDetails.correct_option_index === optIdx;
                                const isUserWrongAnswer =
                                  resultDetails &&
                                  !resultDetails.is_correct &&
                                  resultDetails.user_choice === optIdx;

                                return (
                                  <label
                                    key={optIdx}
                                    onClick={() => handleSelectAnswer(quiz.id, optIdx)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                                      isCorrectAnswer
                                        ? 'bg-emerald-950/40 border-emerald-400 text-emerald-200'
                                        : isUserWrongAnswer
                                        ? 'bg-rose-950/40 border-rose-400 text-rose-200'
                                        : isChecked
                                        ? 'bg-cyan-500/20 border-cyan-400 text-white'
                                        : 'bg-[#0B132B] border-[#1E3A5F] text-slate-300 hover:border-cyan-500/40'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`quiz-${quiz.id}`}
                                      checked={isChecked}
                                      onChange={() => handleSelectAnswer(quiz.id, optIdx)}
                                      className="text-cyan-400 focus:ring-0"
                                    />
                                    <span>{option}</span>
                                  </label>
                                );
                              })}
                            </div>

                            {/* Explanation Reveal */}
                            {resultDetails && resultDetails.explanation && (
                              <div className="mt-4 p-3 bg-[#0B132B] rounded-xl border border-cyan-500/30 text-xs font-mono text-cyan-300">
                                <span className="font-bold uppercase text-slate-400 block mb-1">
                                  Clinical Rationale:
                                </span>
                                {resultDetails.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Result Banner or Submit Button */}
                    {quizResult ? (
                      <div className="space-y-4">
                        <div
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                            quizResult.passed
                              ? 'bg-emerald-950/30 border-emerald-500/50'
                              : 'bg-amber-950/30 border-amber-500/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {quizResult.passed ? (
                              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                            ) : (
                              <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
                            )}
                            <div>
                              <p className="text-sm font-mono font-bold text-white">
                                {quizResult.passed ? 'QUIZ PASSED!' : 'TRAINING INCOMPLETE'}
                              </p>
                              <p className="text-xs font-mono text-slate-300 mt-0.5">
                                Score: {quizResult.score_percent}% ({quizResult.correct_count} of{' '}
                                {quizResult.total_questions} correct) ·{' '}
                                {quizResult.passed
                                  ? `+${quizResult.xp_awarded} XP Awarded`
                                  : 'Achieve 60% or higher to earn XP'}
                              </p>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetQuiz}
                            className="text-slate-300 font-mono text-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Retake Quiz
                          </Button>
                        </div>

                        {/* Unlocked Badges */}
                        {quizResult.new_badges && quizResult.new_badges.length > 0 && (
                          <div className="p-4 bg-amber-950/40 border border-amber-500/50 rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                              <Award className="w-4 h-4 text-amber-400 animate-spin" />
                              <span>NEW BADGE UNLOCKED!</span>
                            </div>
                            {quizResult.new_badges.map((b) => (
                              <p key={b.id} className="text-xs font-mono text-white">
                                ⭐ <span className="font-bold text-amber-300">{b.name}</span>: {b.description}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-end">
                        <Button
                          variant="primary"
                          size="md"
                          onClick={handleSubmitQuiz}
                          disabled={
                            isSubmitting || Object.keys(userAnswers).length < quizzes.length
                          }
                          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold px-8 shadow-[0_0_20px_rgba(0,229,255,0.3)]"
                        >
                          {isSubmitting ? (
                            'Evaluating Answers...'
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" /> Submit Answers to Flight Surgeon
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-slate-500 font-mono text-sm">
                No lesson selected.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
