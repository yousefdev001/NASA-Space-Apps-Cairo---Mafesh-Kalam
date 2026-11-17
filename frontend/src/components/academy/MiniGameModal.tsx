import React, { useState } from 'react';
import { AcademyMiniGame, GameSubmissionResult } from '../../types/academy.types';
import { academyApi } from '../../api/academyApi';
import { ZeroGOrganGame } from './ZeroGOrganGame';
import { CardiacRhythmGame } from './CardiacRhythmGame';
import { Spo2BreathGame } from './Spo2BreathGame';
import { AirlockChecklistGame } from './AirlockChecklistGame';
import { X, Award, Sparkles, Gamepad2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface MiniGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: AcademyMiniGame | null;
  onGameSuccess: (result: GameSubmissionResult) => void;
}

export const MiniGameModal: React.FC<MiniGameModalProps> = ({
  isOpen,
  onClose,
  game,
  onGameSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<GameSubmissionResult | null>(null);

  if (!isOpen || !game) return null;

  const handleGameComplete = async (score: number, maxScore: number = 100) => {
    try {
      setIsSubmitting(true);
      const res = await academyApi.submitGameScore(game.slug || game.id, score, maxScore);
      setSuccessResult(res);
      onGameSuccess(res);
    } catch (err) {
      console.error('Failed to submit mini-game score:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccessResult(null);
    onClose();
  };

  const renderActiveSimulator = () => {
    switch (game.slug) {
      case 'zero-g-organ-puzzle':
        return <ZeroGOrganGame onComplete={handleGameComplete} isSubmitting={isSubmitting} />;
      case 'cardiac-rhythm-simulator':
      case 'heart-rhythm-hero':
        return <CardiacRhythmGame onComplete={handleGameComplete} isSubmitting={isSubmitting} />;
      case 'deep-space-spo2-breath-control':
        return <Spo2BreathGame onComplete={handleGameComplete} isSubmitting={isSubmitting} />;
      case 'eva-airlock-pre-breathe':
        return <AirlockChecklistGame onComplete={handleGameComplete} isSubmitting={isSubmitting} />;
      default:
        // Default to Zero-G Organ Game if unknown
        return <ZeroGOrganGame onComplete={handleGameComplete} isSubmitting={isSubmitting} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B14]/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-[#0B132B] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.2)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E3A5F] bg-[#050B14]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase font-bold">
                  INTERACTIVE SIMULATOR
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">+{game.xp_reward} XP</span>
              </div>
              <h2 className="text-lg font-mono font-bold text-white tracking-wide">{game.title}</h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E3A5F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {successResult ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-5 animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.5)]">
                <Sparkles className="w-10 h-10 animate-bounce" />
              </div>

              <div>
                <h3 className="text-2xl font-mono font-bold text-white">MISSION SIMULATOR PASSED!</h3>
                <p className="text-sm font-mono text-emerald-400 font-bold mt-1">
                  +{successResult.xp_awarded} XP Awarded · Total Cadet XP: {successResult.total_xp}
                </p>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  Current Rank: <span className="text-amber-400 font-bold">{successResult.rank}</span>
                </p>
              </div>

              {/* Newly Unlocked Badges */}
              {successResult.new_badges && successResult.new_badges.length > 0 && (
                <div className="p-4 bg-amber-950/40 border border-amber-500/50 rounded-xl space-y-2 max-w-md w-full">
                  <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-amber-400">
                    <Award className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>NEW CADET BADGE UNLOCKED!</span>
                  </div>
                  {successResult.new_badges.map((b) => (
                    <div key={b.id} className="text-xs font-mono text-white">
                      ⭐ <span className="font-bold text-amber-300">{b.name}</span>: {b.description}
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="primary"
                size="md"
                onClick={handleClose}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold px-8 shadow-[0_0_20px_rgba(0,229,255,0.4)]"
              >
                Return to Academy Curriculum
              </Button>
            </div>
          ) : (
            renderActiveSimulator()
          )}
        </div>
      </div>
    </div>
  );
};
