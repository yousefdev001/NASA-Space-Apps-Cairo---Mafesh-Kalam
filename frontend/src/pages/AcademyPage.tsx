import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  GraduationCap,
  Award,
  Gamepad2,
  BookOpen,
  Trophy,
  ChevronRight,
  RefreshCw,
  Flame,
} from 'lucide-react';
import {
  AcademyCourse,
  AcademyMiniGame,
  Badge,
  MyProgress,
  LeaderboardEntry,
  QuizSubmissionResult,
  GameSubmissionResult,
} from '../types/academy.types';
import { academyApi } from '../api/academyApi';
import { LessonViewerModal } from '../components/academy/LessonViewerModal';
import { MiniGameModal } from '../components/academy/MiniGameModal';
import { BadgesShelf } from '../components/academy/BadgesShelf';
import { CadetLeaderboard } from '../components/academy/CadetLeaderboard';

export const AcademyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kids' | 'adults'>('kids');
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [miniGames, setMiniGames] = useState<AcademyMiniGame[]>([]);
  const [myProgress, setMyProgress] = useState<MyProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [selectedCourse, setSelectedCourse] = useState<AcademyCourse | null>(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState<boolean>(false);
  const [selectedGame, setSelectedGame] = useState<AcademyMiniGame | null>(null);
  const [isGameModalOpen, setIsGameModalOpen] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  // Load Academy Data effect
  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      try {
        const [coursesRes, gamesRes, progressRes, leaderboardRes, badgesRes] =
          await Promise.all([
            academyApi.getCourses(activeTab),
            academyApi.getMiniGames(),
            academyApi.getMyProgress(),
            academyApi.getLeaderboard(),
            academyApi.getBadges(),
          ]);

        if (isMounted) {
          setCourses(coursesRes);
          setMiniGames(gamesRes);
          setMyProgress(progressRes);
          setLeaderboard(leaderboardRes);
          setAllBadges(badgesRes);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading Space Academy data:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleManualRefresh = async () => {
    setIsLoading(true);
    try {
      const [coursesRes, gamesRes, progressRes, leaderboardRes, badgesRes] =
        await Promise.all([
          academyApi.getCourses(activeTab),
          academyApi.getMiniGames(),
          academyApi.getMyProgress(),
          academyApi.getLeaderboard(),
          academyApi.getBadges(),
        ]);

      setCourses(coursesRes);
      setMiniGames(gamesRes);
      setMyProgress(progressRes);
      setLeaderboard(leaderboardRes);
      setAllBadges(badgesRes);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Course Click -> Fetch full details with lessons & quizzes
  const handleOpenCourse = async (courseId: number) => {
    try {
      const detailedCourse = await academyApi.getCourseDetail(courseId);
      setSelectedCourse(detailedCourse);
      setIsCourseModalOpen(true);
    } catch (err) {
      console.error('Failed to load course details:', err);
    }
  };

  // Handle Mini-Game Click
  const handleOpenGame = (game: AcademyMiniGame) => {
    setSelectedGame(game);
    setIsGameModalOpen(true);
  };

  // Handle Quiz Completed
  const handleQuizCompleted = (result: QuizSubmissionResult) => {
    if (result.passed) {
      academyApi.getMyProgress().then(setMyProgress).catch(console.error);
      academyApi.getLeaderboard().then(setLeaderboard).catch(console.error);
    }
  };

  // Handle Game Completed
  const handleGameCompleted = (_result: GameSubmissionResult) => {
    academyApi.getMyProgress().then(setMyProgress).catch(console.error);
    academyApi.getLeaderboard().then(setLeaderboard).catch(console.error);
  };

  // Filter mini-games for the active tab (kids see kid-friendly; adults see all simulators)
  const filteredMiniGames = miniGames.filter((g) => {
    if (activeTab === 'kids') return g.target_audience === 'kids' || g.target_audience === 'all';
    return true; // adults see all simulators
  });

  // Calculate XP progress bar percentage
  const totalXp = myProgress?.total_xp || 0;
  const nextRankXp = myProgress?.next_rank_xp || 1000;
  const progressPercent = Math.min(100, Math.round((totalXp / nextRankXp) * 100));

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-4">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-6 rounded-2xl bg-[#0B132B]/90 border border-[#1E3A5F] shadow-[0_0_30px_rgba(5,11,20,0.8)]">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wide">
              AURA<span className="text-cyan-400">MED</span> SPACE ACADEMY
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono tracking-wide">
            INTERACTIVE ZERO-G BIO-ASTRONAUTICS GAMIFICATION & CLINICAL MEDICINE CURRICULA
          </p>
        </div>

        {/* Gamification Status Pill & User Rank */}
        <div className="flex flex-wrap items-center gap-4 bg-[#050B14] p-3.5 rounded-xl border border-[#1E3A5F]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/70 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-400 uppercase">CADET RANK</p>
              <p className="text-sm font-mono font-bold text-amber-400">
                {myProgress?.rank || 'Cadet'}
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-[#1E3A5F] hidden sm:block" />

          {/* XP Progress Bar */}
          <div className="min-w-[140px] space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400">XP PROGRESS</span>
              <span className="text-cyan-300 font-bold">
                {totalXp} / {nextRankXp} XP
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 transition-all duration-500 shadow-[0_0_8px_rgba(0,229,255,0.5)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="h-8 w-px bg-[#1E3A5F] hidden sm:block" />

          {/* Leaderboard Quick Toggle Button */}
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              showLeaderboard
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'bg-[#0B132B] text-slate-300 border border-[#1E3A5F] hover:text-white hover:border-cyan-500/40'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Kids Zone vs Flight Surgeons Clinical Tracks */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E3A5F] pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('kids')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-mono font-bold transition-all ${
              activeTab === 'kids'
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                : 'text-slate-400 hover:text-white bg-[#0B132B] border border-[#1E3A5F]'
            }`}
          >
            <Gamepad2 className="w-4 h-4" /> Junior Cadets Zone (Kids)
          </button>
          <button
            onClick={() => setActiveTab('adults')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-mono font-bold transition-all ${
              activeTab === 'adults'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(0,229,255,0.35)]'
                : 'text-slate-400 hover:text-white bg-[#0B132B] border border-[#1E3A5F]'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Flight Surgeons Clinical Tracks (Adults)
          </button>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={isLoading}
          className="text-xs font-mono text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 self-end sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Optional Top 10 Cadet Leaderboard Dropdown */}
      {showLeaderboard && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-200">
          <CadetLeaderboard leaders={leaderboard} currentUserId={myProgress?.user?.id} />
        </div>
      )}

      {/* SECTION 1: INTERACTIVE ZERO-G MINI-GAMES SIMULATORS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-mono font-bold text-white tracking-wide uppercase">
              INTERACTIVE MISSION SIMULATORS & PHYSIOLOGY MINI-GAMES
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Award Instant XP & Medals</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredMiniGames.map((game) => (
            <Card
              key={game.id}
              className="border-amber-500/30 hover:border-amber-400 transition-all bg-[#0B132B]/80 flex flex-col justify-between group shadow-sm hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 uppercase">
                    {game.game_type.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono text-xs font-bold text-cyan-400">
                    +{game.xp_reward} XP
                  </span>
                </div>
                <h3 className="text-base font-mono font-bold text-white mb-2 leading-snug group-hover:text-amber-300 transition-colors">
                  {game.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3">
                  {game.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#1E3A5F] flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cadet Cert</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenGame(game)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                >
                  Play Simulator <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* SECTION 2: CURRICULUM COURSES & CLINICAL MODULES */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-mono font-bold text-white tracking-wide uppercase">
              {activeTab === 'kids'
                ? 'JUNIOR SPACE MEDICINE DISCOVERY CURRICULA'
                : 'BIO-ASTRONAUTICS & CLINICAL MEDICINE FELLOWSHIP MODULES'}
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {courses.length} Accredited Tracks Available
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>DOWNLINKING ACADEMY CURRICULUM DATABASE...</span>
          </div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs bg-[#0B132B] rounded-xl border border-[#1E3A5F]">
            No courses found for the selected category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="border-[#1E3A5F] hover:border-cyan-500/50 transition-all flex flex-col justify-between group bg-[#0B132B]/75 hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 uppercase font-bold">
                      {course.category}
                    </span>
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      +{course.xp_reward} XP
                    </span>
                  </div>

                  <h3 className="text-base font-mono font-bold text-white mb-2 leading-snug group-hover:text-cyan-300 transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans line-clamp-3 mb-4">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-[#050B14] border border-[#1E3A5F] uppercase">
                      {course.difficulty}
                    </span>
                    <span>·</span>
                    <span>{course.lessons_count || course.lessons?.length || 0} Lessons</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#1E3A5F] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    Interactive Quizzes Included
                  </span>
                  <Button
                    variant="hud"
                    size="sm"
                    onClick={() => handleOpenCourse(course.id)}
                    className="text-xs font-mono font-bold hover:bg-cyan-500 hover:text-slate-950 transition-colors"
                  >
                    Begin Curriculum <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: UNLOCKED BADGES SHELF */}
      <div className="pt-6 border-t border-[#1E3A5F]">
        <BadgesShelf allBadges={allBadges} userBadges={myProgress?.badges || []} />
      </div>

      {/* MODAL 1: LESSON VIEWER & QUIZ MODAL */}
      <LessonViewerModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        course={selectedCourse}
        onQuizCompleted={handleQuizCompleted}
      />

      {/* MODAL 2: INTERACTIVE MINI-GAME MODAL */}
      <MiniGameModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
        game={selectedGame}
        onGameSuccess={handleGameCompleted}
      />
    </div>
  );
};
