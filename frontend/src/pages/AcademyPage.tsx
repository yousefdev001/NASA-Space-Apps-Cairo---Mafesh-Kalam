import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
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
import { useThemeStore } from '../store/themeStore';
import {
  getWobblyStyle,
  Tape,
  PushPin,
  SquiggleUnderline,
  SketchBadge,
} from '../components/sketchbook';

export const AcademyPage: React.FC = () => {
  const { mode } = useThemeStore();
  const isPaper = mode === 'paper';
  const isDark = mode === 'dark';
  const isSketch = isPaper || isDark;

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
      {/* Header Banner - Field Manual / Textbook Cover Header */}
      <div
        style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
        className={clsx(
          'relative flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-6 transition-all',
          isPaper
            ? 'bg-white text-[#2d2d2d] border-[3px] border-[#2d2d2d] sketch-shadow-lg'
            : isDark
              ? 'bg-[#0c0c10] text-white border-[3px] border-[#FF4D00] sketch-shadow-orange-lg'
              : 'rounded-2xl bg-[#0B132B]/90 border border-[#1E3A5F] shadow-[0_0_30px_rgba(5,11,20,0.8)]'
        )}
      >
        {isSketch && (
          <div className="absolute -top-3.5 left-10 z-10">
            <Tape isDark={isDark} />
          </div>
        )}

        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <div
              style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
              className={clsx(
                'w-9 h-9 flex items-center justify-center border transition-all',
                isPaper
                  ? 'bg-[#fff9c4] border-2 border-[#2d2d2d] text-[#2d2d2d] shadow-sm'
                  : isDark
                    ? 'bg-black border-2 border-[#FF4D00] text-[#FF4D00]'
                    : 'rounded-lg bg-cyan-950 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
              )}
            >
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className={clsx(
                    'text-2xl sm:text-3xl font-bold tracking-wide',
                    isSketch ? 'font-display-kalam' : 'font-mono text-white'
                  )}
                >
                  AURA<span className={isPaper ? 'text-[#ff4d00]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'}>MED</span> SPACE ACADEMY
                </h1>
                {isSketch && (
                  <span
                    style={getWobblyStyle('wobblyTag')}
                    className={clsx(
                      'text-[10px] uppercase font-sketch-hand px-2 py-0.5 border-2 font-bold tracking-wider',
                      isPaper
                        ? 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d]'
                        : 'bg-[#FF4D00] text-black border-white'
                    )}
                  >
                    FIELD MANUAL v4.2
                  </span>
                )}
              </div>
              {isSketch && (
                <div className="w-48 text-[#ff4d00]">
                  <SquiggleUnderline />
                </div>
              )}
            </div>
          </div>
          <p
            className={clsx(
              'text-xs tracking-wide',
              isSketch ? 'font-sketch-hand text-sm font-semibold opacity-85 mt-1' : 'font-mono text-slate-400'
            )}
          >
            INTERACTIVE ZERO-G BIO-ASTRONAUTICS GAMIFICATION &amp; CLINICAL MEDICINE CURRICULA
          </p>
        </div>

        {/* Gamification Status Pill & User Rank */}
        <div
          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
          className={clsx(
            'relative flex flex-wrap items-center gap-4 p-3.5 border transition-all',
            isPaper
              ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] shadow-sm'
              : isDark
                ? 'bg-black border-2 border-[#FF4D00]'
                : 'bg-[#050B14] rounded-xl border-[#1E3A5F]'
          )}
        >
          {isSketch && (
            <div className="absolute -top-2.5 right-6 z-10">
              <PushPin isDark={isDark} />
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <div
              style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
              className={clsx(
                'w-8 h-8 border flex items-center justify-center',
                isPaper
                  ? 'bg-[#fff9c4] border-[#2d2d2d] text-[#2d2d2d]'
                  : isDark
                    ? 'bg-[#FF4D00]/20 border-[#FF4D00] text-[#FF4D00]'
                    : 'rounded-lg bg-amber-950/70 border-amber-500/40 text-amber-400'
              )}
            >
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <p
                className={clsx(
                  'text-[10px] uppercase',
                  isSketch ? 'font-sketch-hand text-xs font-bold opacity-75' : 'font-mono text-slate-400'
                )}
              >
                CADET RANK
              </p>
              <p
                className={clsx(
                  'text-sm font-bold',
                  isSketch
                    ? 'font-display-kalam text-base ' + (isDark ? 'text-[#FF4D00]' : 'text-[#ff4d00]')
                    : 'font-mono text-amber-400'
                )}
              >
                {myProgress?.rank || 'Cadet'}
              </p>
            </div>
          </div>

          <div
            className={clsx(
              'h-8 w-px hidden sm:block',
              isPaper ? 'bg-[#2d2d2d]/30' : isDark ? 'bg-[#FF4D00]/40' : 'bg-[#1E3A5F]'
            )}
          />

          {/* XP Progress Bar */}
          <div className="min-w-[140px] space-y-1">
            <div
              className={clsx(
                'flex items-center justify-between text-[10px]',
                isSketch ? 'font-sketch-hand text-xs font-bold' : 'font-mono'
              )}
            >
              <span className={isSketch ? 'opacity-80' : 'text-slate-400'}>XP PROGRESS</span>
              <span
                className={
                  isPaper
                    ? 'text-[#2d5da1] font-bold'
                    : isDark
                      ? 'text-[#FF4D00] font-bold'
                      : 'text-cyan-300 font-bold'
                }
              >
                {totalXp} / {nextRankXp} XP
              </span>
            </div>
            <div
              style={isSketch ? getWobblyStyle('wobblySm') : undefined}
              className={clsx(
                'w-full h-2.5 overflow-hidden border',
                isPaper
                  ? 'bg-[#e5e0d8] border-[#2d2d2d]'
                  : isDark
                    ? 'bg-black border-[#FF4D00]'
                    : 'rounded-full bg-slate-800 border-slate-700'
              )}
            >
              <div
                className={clsx(
                  'h-full transition-all duration-500',
                  isPaper
                    ? 'bg-[#ff4d00]'
                    : isDark
                      ? 'bg-[#FF4D00]'
                      : 'bg-gradient-to-r from-cyan-500 to-amber-400 shadow-[0_0_8px_rgba(0,229,255,0.5)]'
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div
            className={clsx(
              'h-8 w-px hidden sm:block',
              isPaper ? 'bg-[#2d2d2d]/30' : isDark ? 'bg-[#FF4D00]/40' : 'bg-[#1E3A5F]'
            )}
          />

          {/* Leaderboard Quick Toggle Button */}
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
            className={clsx(
              'px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer',
              isSketch
                ? showLeaderboard
                  ? isDark
                    ? 'bg-[#FF4D00] text-black border-2 border-white sketch-btn-orange'
                    : 'bg-[#fff9c4] text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn'
                  : isDark
                    ? 'bg-black text-white border-2 border-[#FF4D00] hover:bg-[#FF4D00]/20'
                    : 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] hover:bg-[#fdfbf7] sketch-btn'
                : showLeaderboard
                  ? 'rounded-lg bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'rounded-lg bg-[#0B132B] text-slate-300 border border-[#1E3A5F] hover:text-white hover:border-cyan-500/40'
            )}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className={isSketch ? 'font-sketch-hand' : 'font-mono'}>Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Kids Zone vs Flight Surgeons Clinical Tracks */}
      <div
        className={clsx(
          'flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2',
          isPaper
            ? 'border-[#2d2d2d]/30 border-dashed'
            : isDark
              ? 'border-[#FF4D00]/40 border-dashed'
              : 'border-[#1E3A5F]'
        )}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setActiveTab('kids')}
            style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
            className={clsx(
              'flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer',
              isSketch
                ? activeTab === 'kids'
                  ? isDark
                    ? 'bg-[#FF4D00] text-black border-2 border-white sketch-btn-orange font-sketch-hand text-base'
                    : 'bg-[#fff9c4] text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand text-base'
                  : isDark
                    ? 'bg-black text-white/80 border-2 border-[#FF4D00]/60 hover:border-[#FF4D00] font-sketch-hand text-base'
                    : 'bg-white text-[#2d2d2d]/70 border-2 border-[#2d2d2d]/60 hover:text-[#2d2d2d] font-sketch-hand text-base'
                : activeTab === 'kids'
                  ? 'rounded-lg bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] font-mono'
                  : 'rounded-lg text-slate-400 hover:text-white bg-[#0B132B] border border-[#1E3A5F] font-mono'
            )}
          >
            <Gamepad2 className="w-4 h-4" /> Junior Cadets Zone (Kids)
          </button>
          <button
            onClick={() => setActiveTab('adults')}
            style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
            className={clsx(
              'flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer',
              isSketch
                ? activeTab === 'adults'
                  ? isDark
                    ? 'bg-[#FF4D00] text-black border-2 border-white sketch-btn-orange font-sketch-hand text-base'
                    : 'bg-[#2d5da1]/20 text-[#2d5da1] border-2 border-[#2d5da1] sketch-btn font-sketch-hand text-base'
                  : isDark
                    ? 'bg-black text-white/80 border-2 border-[#FF4D00]/60 hover:border-[#FF4D00] font-sketch-hand text-base'
                    : 'bg-white text-[#2d2d2d]/70 border-2 border-[#2d2d2d]/60 hover:text-[#2d2d2d] font-sketch-hand text-base'
                : activeTab === 'adults'
                  ? 'rounded-lg bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(0,229,255,0.35)] font-mono'
                  : 'rounded-lg text-slate-400 hover:text-white bg-[#0B132B] border border-[#1E3A5F] font-mono'
            )}
          >
            <BookOpen className="w-4 h-4" /> Flight Surgeons Clinical Tracks (Adults)
          </button>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={isLoading}
          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
          className={clsx(
            'flex items-center gap-1.5 self-end sm:self-auto transition-colors cursor-pointer text-xs font-bold',
            isSketch
              ? isDark
                ? 'text-[#FF4D00] hover:text-white font-sketch-hand text-sm'
                : 'text-[#2d5da1] hover:text-black font-sketch-hand text-sm'
              : 'font-mono text-slate-400 hover:text-cyan-400'
          )}
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
            <h2
              className={clsx(
                'text-base font-bold tracking-wide uppercase',
                isSketch ? 'font-display-kalam text-lg text-[#2d2d2d] dark:text-white' : 'font-mono text-white'
              )}
            >
              INTERACTIVE MISSION SIMULATORS &amp; PHYSIOLOGY MINI-GAMES
            </h2>
          </div>
          <span
            className={clsx(
              'text-xs',
              isSketch ? 'font-sketch-hand text-sm font-semibold opacity-75' : 'font-mono text-slate-400'
            )}
          >
            Award Instant XP &amp; Medals
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredMiniGames.map((game, idx) => (
            <Card
              key={game.id}
              themeMode={mode}
              decoration={isSketch ? (idx % 2 === 0 ? 'tape' : 'pin') : 'none'}
              className={clsx(
                'flex flex-col justify-between group transition-all',
                isSketch
                  ? isDark
                    ? 'hover:-translate-y-1'
                    : 'hover:-translate-y-1'
                  : 'border-amber-500/30 hover:border-amber-400 bg-[#0B132B]/80 shadow-sm hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]'
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  {isSketch ? (
                    <SketchBadge variant="warning" mode={mode}>
                      {game.game_type.replace(/_/g, ' ')}
                    </SketchBadge>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 uppercase">
                      {game.game_type.replace(/_/g, ' ')}
                    </span>
                  )}
                  {isSketch ? (
                    <SketchBadge variant="accent" mode={mode}>
                      +{game.xp_reward} XP
                    </SketchBadge>
                  ) : (
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      +{game.xp_reward} XP
                    </span>
                  )}
                </div>
                <h3
                  className={clsx(
                    'text-base font-bold mb-2 leading-snug transition-colors',
                    isSketch ? 'font-display-kalam text-lg' : 'font-mono text-white group-hover:text-amber-300'
                  )}
                >
                  {game.title}
                </h3>
                <p
                  className={clsx(
                    'text-xs leading-relaxed line-clamp-3',
                    isSketch
                      ? isDark
                        ? 'text-white/75 font-sketch-hand text-sm'
                        : 'text-[#2d2d2d]/80 font-sketch-hand text-sm'
                      : 'text-slate-300 font-sans'
                  )}
                >
                  {game.description}
                </p>
              </div>

              <div
                className={clsx(
                  'mt-5 pt-3 flex items-center justify-between border-t',
                  isSketch
                    ? isDark
                      ? 'border-[#FF4D00]/40 border-dashed'
                      : 'border-[#2d2d2d]/30 border-dashed'
                    : 'border-[#1E3A5F]'
                )}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span
                    className={
                      isSketch ? 'font-sketch-hand text-xs' : 'font-mono text-amber-300'
                    }
                  >
                    Cadet Cert
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenGame(game)}
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'font-bold text-xs',
                    isSketch
                      ? isDark
                        ? 'bg-[#FF4D00] text-black border-2 border-white sketch-btn-orange font-sketch-hand'
                        : 'bg-[#fff9c4] text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  )}
                >
                  Play Simulator <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* SECTION 2: CURRICULUM COURSES & CLINICAL MODULES - FIELD MANUAL CHAPTERS */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2
              className={clsx(
                'text-base font-bold tracking-wide uppercase',
                isSketch ? 'font-display-kalam text-lg text-[#2d2d2d] dark:text-white' : 'font-mono text-white'
              )}
            >
              {activeTab === 'kids'
                ? 'JUNIOR SPACE MEDICINE DISCOVERY CURRICULA'
                : 'BIO-ASTRONAUTICS & CLINICAL MEDICINE FELLOWSHIP MODULES'}
            </h2>
          </div>
          <span
            className={clsx(
              'text-xs',
              isSketch ? 'font-sketch-hand text-sm font-semibold opacity-75' : 'font-mono text-slate-400'
            )}
          >
            {courses.length} Accredited Tracks Available
          </span>
        </div>

        {isLoading ? (
          <div
            className={clsx(
              'p-12 text-center text-xs flex items-center justify-center gap-2',
              isSketch ? 'font-sketch-hand text-base' : 'font-mono text-slate-400'
            )}
          >
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>DOWNLINKING ACADEMY CURRICULUM DATABASE...</span>
          </div>
        ) : courses.length === 0 ? (
          <div
            style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
            className={clsx(
              'p-8 text-center text-xs border',
              isPaper
                ? 'bg-white border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-base'
                : isDark
                  ? 'bg-[#0c0c10] border-2 border-[#FF4D00] text-white font-sketch-hand text-base'
                  : 'bg-[#0B132B] rounded-xl border-[#1E3A5F] font-mono text-slate-500'
            )}
          >
            No courses found for the selected category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course, idx) => (
              <Card
                key={course.id}
                themeMode={mode}
                decoration={isSketch ? (idx % 2 === 0 ? 'pin' : 'tape') : 'none'}
                className={clsx(
                  'flex flex-col justify-between group transition-all',
                  isSketch
                    ? isDark
                      ? 'hover:-translate-y-1'
                      : 'hover:-translate-y-1'
                    : 'border-[#1E3A5F] hover:border-cyan-500/50 bg-[#0B132B]/75 hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]'
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    {isSketch ? (
                      <SketchBadge variant="info" mode={mode}>
                        {course.category}
                      </SketchBadge>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 uppercase font-bold">
                        {course.category}
                      </span>
                    )}
                    {isSketch ? (
                      <SketchBadge variant="accent" mode={mode}>
                        +{course.xp_reward} XP
                      </SketchBadge>
                    ) : (
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        +{course.xp_reward} XP
                      </span>
                    )}
                  </div>

                  <h3
                    className={clsx(
                      'text-base font-bold mb-2 leading-snug transition-colors',
                      isSketch ? 'font-display-kalam text-lg' : 'font-mono text-white group-hover:text-cyan-300'
                    )}
                  >
                    {course.title}
                  </h3>

                  <p
                    className={clsx(
                      'text-xs leading-relaxed line-clamp-3 mb-4',
                      isSketch
                        ? isDark
                          ? 'text-white/75 font-sketch-hand text-sm'
                          : 'text-[#2d2d2d]/80 font-sketch-hand text-sm'
                        : 'text-slate-400 font-sans'
                    )}
                  >
                    {course.description}
                  </p>

                  <div className="flex items-center gap-2 text-[11px]">
                    {isSketch ? (
                      <>
                        <span
                          style={getWobblyStyle('wobblyTag')}
                          className={clsx(
                            'px-2 py-0.5 border text-xs font-sketch-hand font-bold uppercase',
                            isDark
                              ? 'bg-black text-white/80 border-[#FF4D00]/50'
                              : 'bg-[#fdfbf7] text-[#2d2d2d] border-[#2d2d2d]'
                          )}
                        >
                          {course.difficulty}
                        </span>
                        <span className="font-sketch-hand font-bold">·</span>
                        <span className="font-sketch-hand text-xs font-bold">
                          {course.lessons_count || course.lessons?.length || 0} Lessons
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="px-1.5 py-0.5 rounded bg-[#050B14] border border-[#1E3A5F] uppercase font-mono text-slate-400">
                          {course.difficulty}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-slate-400">
                          {course.lessons_count || course.lessons?.length || 0} Lessons
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div
                  className={clsx(
                    'mt-5 pt-3 flex items-center justify-between border-t',
                    isSketch
                      ? isDark
                        ? 'border-[#FF4D00]/40 border-dashed'
                        : 'border-[#2d2d2d]/30 border-dashed'
                      : 'border-[#1E3A5F]'
                  )}
                >
                  <span
                    className={clsx(
                      'text-[10px] uppercase',
                      isSketch
                        ? 'font-sketch-hand text-xs font-bold opacity-75'
                        : 'font-mono text-slate-500'
                    )}
                  >
                    Interactive Quizzes Included
                  </span>
                  <Button
                    variant={isSketch ? 'secondary' : 'hud'}
                    size="sm"
                    onClick={() => handleOpenCourse(course.id)}
                    style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                    className={clsx(
                      'text-xs font-bold transition-all',
                      isSketch
                        ? isDark
                          ? 'bg-black text-[#FF4D00] border-2 border-[#FF4D00] hover:bg-[#FF4D00] hover:text-black sketch-btn-orange font-sketch-hand'
                          : 'bg-white text-[#2d2d2d] border-2 border-[#2d2d2d] hover:bg-[#2d2d2d] hover:text-white sketch-btn font-sketch-hand'
                        : 'font-mono hover:bg-cyan-500 hover:text-slate-950'
                    )}
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
      <div
        className={clsx(
          'pt-6 border-t',
          isSketch
            ? isDark
              ? 'border-[#FF4D00]/40 border-dashed'
              : 'border-[#2d2d2d]/30 border-dashed'
            : 'border-[#1E3A5F]'
        )}
      >
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
