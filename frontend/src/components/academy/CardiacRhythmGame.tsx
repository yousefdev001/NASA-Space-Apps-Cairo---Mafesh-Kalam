import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { Activity, Heart, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';

interface CardiacRhythmGameProps {
  onComplete: (score: number, maxScore: number) => void;
  isSubmitting?: boolean;
}

export const CardiacRhythmGame: React.FC<CardiacRhythmGameProps> = ({ onComplete, isSubmitting }) => {
  const [bpm, setBpm] = useState<number>(142); // EVA Tachycardia
  const [targetBpm] = useState<number>(75); // Safe Sinus Rhythm
  const [stabilizedCount, setStabilizedCount] = useState<number>(0);
  const requiredHits = 5;
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('Astronaut Elena Vance experiencing EVA stress tachycardia! Match the rhythm to stabilize.');
  const [beatPhase, setBeatPhase] = useState<number>(0); // 0 to 1 cycle
  const [feedbackType, setFeedbackType] = useState<'info' | 'good' | 'miss'>('info');

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const beatIntervalMs = (60 / targetBpm) * 1000; // ~800ms per beat

  useEffect(() => {
    lastTimeRef.current = performance.now();
    const loop = (now: number) => {
      const delta = now - lastTimeRef.current;
      const phase = (delta % beatIntervalMs) / beatIntervalMs;
      setBeatPhase(phase);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [beatIntervalMs]);

  const handleTap = () => {
    if (isFinished) return;

    // Green hit window is when beatPhase is near 0.0 or near 1.0 (e.g. > 0.85 or < 0.15)
    const isPerfect = beatPhase < 0.18 || beatPhase > 0.82;
    const isGood = beatPhase < 0.28 || beatPhase > 0.72;

    if (isPerfect) {
      const nextCount = stabilizedCount + 1;
      setStabilizedCount(nextCount);
      const newBpm = Math.max(targetBpm, bpm - 15);
      setBpm(newBpm);
      setFeedbackType('good');
      setFeedback(`🎯 PERFECT TIMING! Heart rate decreasing: ${newBpm} BPM (${nextCount}/${requiredHits})`);

      if (nextCount >= requiredHits) {
        setIsFinished(true);
        setBpm(targetBpm);
        setFeedback('✅ SINUS RHYTHM RESTORED! EVA cardiac emergency resolved.');
      }
    } else if (isGood) {
      setFeedbackType('good');
      setFeedback('⚡ NEAR HIT: Good beat, keep pacing!');
    } else {
      setFeedbackType('miss');
      setFeedback('⚠️ OFF RHYTHM! Watch the glowing pulse marker and tap when it peaks!');
    }
  };

  const handleReset = () => {
    setBpm(142);
    setStabilizedCount(0);
    setIsFinished(false);
    setFeedbackType('info');
    setFeedback('Astronaut experiencing EVA stress tachycardia! Match the rhythm to stabilize.');
    lastTimeRef.current = performance.now();
  };

  return (
    <div className="space-y-6">
      {/* Vitals Telemetry HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-[#050B14] rounded-xl border border-[#1E3A5F]">
          <p className="text-[10px] font-mono text-slate-400">TELEMETRY SOURCE</p>
          <p className="text-xs font-mono font-bold text-cyan-400">EVA SUIT · CDR-01</p>
        </div>
        <div className="p-3 bg-[#050B14] rounded-xl border border-[#1E3A5F]">
          <p className="text-[10px] font-mono text-slate-400">CURRENT HEART RATE</p>
          <p
            className={`text-lg font-mono font-bold ${
              bpm <= 80 ? 'text-emerald-400' : bpm <= 105 ? 'text-amber-400' : 'text-rose-400 animate-pulse'
            }`}
          >
            {bpm} <span className="text-xs font-normal">BPM</span>
          </p>
        </div>
        <div className="p-3 bg-[#050B14] rounded-xl border border-[#1E3A5F]">
          <p className="text-[10px] font-mono text-slate-400">TARGET RESTING RHYTHM</p>
          <p className="text-lg font-mono font-bold text-emerald-400">75 BPM</p>
        </div>
        <div className="p-3 bg-[#050B14] rounded-xl border border-[#1E3A5F]">
          <p className="text-[10px] font-mono text-slate-400">STABILIZED PULSES</p>
          <p className="text-lg font-mono font-bold text-cyan-400">
            {stabilizedCount} / {requiredHits}
          </p>
        </div>
      </div>

      {/* Interactive Rhythm Visualizer */}
      <div className="p-8 bg-[#050B14] rounded-2xl border border-[#1E3A5F] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Animated ECG Pulse Waveform simulation */}
        <div className="w-full flex items-center justify-center gap-1.5 mb-8 h-12 opacity-80">
          <Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
          <div className="h-0.5 flex-1 bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500" />
          <Heart
            className={`w-10 h-10 transition-transform duration-75 ${
              beatPhase < 0.2 ? 'scale-125 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]' : 'scale-100 text-rose-800'
            }`}
          />
          <div className="h-0.5 flex-1 bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500" />
        </div>

        {/* Pulsing Target Target Ring */}
        <div className="relative w-40 h-40 flex items-center justify-center mb-6">
          {/* Target Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30" />
          {/* Expanding / Contracting Beat Ring */}
          <div
            className="absolute rounded-full border-4 border-cyan-400 transition-all duration-75"
            style={{
              width: `${Math.round(40 + (1 - beatPhase) * 110)}px`,
              height: `${Math.round(40 + (1 - beatPhase) * 110)}px`,
              opacity: beatPhase < 0.25 ? 1 : 0.4,
              borderColor: beatPhase < 0.2 ? '#10B981' : '#00E5FF',
            }}
          />
          <div className="z-10 text-center">
            <p className="text-xs font-mono font-bold text-slate-400">BEAT WINDOW</p>
            <p className="text-sm font-mono font-bold text-white">
              {beatPhase < 0.2 ? 'TAP NOW!' : 'WAIT...'}
            </p>
          </div>
        </div>

        {/* Tap Action Button */}
        {!isFinished ? (
          <button
            onClick={handleTap}
            className={`px-8 py-4 rounded-2xl font-mono text-base font-bold transition-all transform active:scale-95 shadow-lg ${
              beatPhase < 0.2
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-105'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(0,229,255,0.3)]'
            }`}
          >
            ⚡ STABILIZE PULSE (TAP)
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onComplete(100, 100)}
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold px-8 shadow-[0_0_25px_rgba(16,185,129,0.4)]"
            >
              {isSubmitting ? 'Recording XP...' : 'Claim +60 XP Reward'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-slate-400">
              <RotateCcw className="w-4 h-4 mr-1.5" /> Re-run Simulation
            </Button>
          </div>
        )}
      </div>

      {/* Real-time Feedback Banner */}
      <div
        className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between ${
          feedbackType === 'good'
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            : feedbackType === 'miss'
            ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            : 'bg-[#0B132B] border-[#1E3A5F] text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2">
          {feedbackType === 'good' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : feedbackType === 'miss' ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          <span>{feedback}</span>
        </div>
        <button onClick={handleReset} className="text-slate-500 hover:text-slate-300" title="Reset">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
