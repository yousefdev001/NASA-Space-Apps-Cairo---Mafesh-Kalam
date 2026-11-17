import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Wind, CheckCircle2, RotateCcw, Play, Pause } from 'lucide-react';

interface Spo2BreathGameProps {
  onComplete: (score: number, maxScore: number) => void;
  isSubmitting?: boolean;
}

type BreathPhase = 'INHALE' | 'HOLD_IN' | 'EXHALE' | 'HOLD_OUT';

export const Spo2BreathGame: React.FC<Spo2BreathGameProps> = ({ onComplete, isSubmitting }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [phase, setPhase] = useState<BreathPhase>('INHALE');
  const [timer, setTimer] = useState<number>(4);
  const [cyclesCompleted, setCyclesCompleted] = useState<number>(0);
  const targetCycles = 4;
  const [spo2, setSpo2] = useState<number>(91);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    if (!isActive || isFinished) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        // Advance phase when timer hits 1
        setPhase((currPhase) => {
          if (currPhase === 'INHALE') {
            return 'HOLD_IN';
          } else if (currPhase === 'HOLD_IN') {
            return 'EXHALE';
          } else if (currPhase === 'EXHALE') {
            return 'HOLD_OUT';
          } else {
            // Completed 1 full 4-4-4-4 cycle!
            setCyclesCompleted((c) => {
              const nextCycle = c + 1;
              const nextSpo2 = Math.min(99, 91 + nextCycle * 2);
              setSpo2(nextSpo2);

              if (nextCycle >= targetCycles) {
                setIsFinished(true);
                setIsActive(false);
              }
              return nextCycle;
            });
            return 'INHALE';
          }
        });

        return 4; // Reset timer to 4 seconds
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isFinished]);

  const handleReset = () => {
    setIsActive(false);
    setPhase('INHALE');
    setTimer(4);
    setCyclesCompleted(0);
    setSpo2(91);
    setIsFinished(false);
  };

  const getPhaseInstruction = () => {
    switch (phase) {
      case 'INHALE':
        return { text: 'INHALE OXYGEN DEEPLY', color: 'text-cyan-400', desc: 'Slow, steady diaphragmatic intake' };
      case 'HOLD_IN':
        return { text: 'HOLD BREATH (O2 ABSORPTION)', color: 'text-amber-400', desc: 'Allow alveoli capillary diffusion' };
      case 'EXHALE':
        return { text: 'EXHALE SLOWLY & SMOOTHLY', color: 'text-emerald-400', desc: 'Flush expired CO2 from suit dead-space' };
      case 'HOLD_OUT':
        return { text: 'REST & EQUALIZE', color: 'text-indigo-400', desc: 'Maintain metabolic calm state' };
    }
  };

  const currentInfo = getPhaseInstruction();

  return (
    <div className="space-y-6">
      {/* Vitals Telemetry HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-[#050B14] rounded-xl border border-[#1E3A5F]">
          <p className="text-[10px] font-mono text-slate-400">PULSE OXIMETRY</p>
          <p
            className={`text-lg font-mono font-bold ${
              spo2 >= 98 ? 'text-emerald-400' : spo2 >= 95 ? 'text-amber-400' : 'text-rose-400 animate-pulse'
            }`}
          >
            {spo2}% <span className="text-xs font-normal">SpO2</span>
          </p>
        </div>
        <div className="p-3 bg-[#050B14] rounded-xl border border-[#1E3A5F]">
          <p className="text-[10px] font-mono text-slate-400">OXYGEN CONSUMPTION</p>
          <p className="text-lg font-mono font-bold text-cyan-400">
            {isActive ? '0.32 L/min' : '0.58 L/min'}
          </p>
        </div>
        <div className="p-3 bg-[#050B14] rounded-xl border border-[#1E3A5F]">
          <p className="text-[10px] font-mono text-slate-400">CYCLE PROGRESS</p>
          <p className="text-lg font-mono font-bold text-emerald-400">
            {cyclesCompleted} / {targetCycles} Cycles
          </p>
        </div>
        <div className="p-3 bg-[#050B14] rounded-xl border border-[#1E3A5F]">
          <p className="text-[10px] font-mono text-slate-400">BREATH INTERVAL</p>
          <p className="text-lg font-mono font-bold text-cyan-400">4s · 4s · 4s · 4s</p>
        </div>
      </div>

      {/* Main Breathing Circle */}
      <div className="p-8 bg-[#050B14] rounded-2xl border border-[#1E3A5F] flex flex-col items-center justify-center relative overflow-hidden min-h-[340px]">
        {/* Animated Breathing Ring */}
        <div className="relative w-56 h-56 flex items-center justify-center mb-6">
          <div
            className={`absolute rounded-full border-4 transition-all duration-1000 ease-in-out ${
              phase === 'INHALE'
                ? 'w-52 h-52 border-cyan-400 shadow-[0_0_35px_rgba(0,229,255,0.4)]'
                : phase === 'HOLD_IN'
                ? 'w-52 h-52 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.4)]'
                : phase === 'EXHALE'
                ? 'w-24 h-24 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : 'w-24 h-24 border-indigo-400 opacity-60'
            }`}
          />

          <div className="z-10 text-center space-y-1">
            <span className="text-4xl font-mono font-black text-white">{timer}</span>
            <p className={`text-xs font-mono font-bold tracking-wider ${currentInfo.color}`}>
              {currentInfo.text}
            </p>
            <p className="text-[10px] text-slate-400 font-sans">{currentInfo.desc}</p>
          </div>
        </div>

        {/* Action Controls */}
        {!isFinished ? (
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsActive(!isActive)}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold px-6"
            >
              {isActive ? (
                <>
                  <Pause className="w-4 h-4 mr-2" /> Pause Cadence
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" /> Start 4-4-4-4 Paced Breathing
                </>
              )}
            </Button>
            <button
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div>
              <p className="text-sm font-mono font-bold text-emerald-400 flex items-center justify-center sm:justify-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> OXYGEN SATURATION NOMINAL (99% SpO2)
              </p>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                Metabolic baseline preserved; hyperventilation emergency averted.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => onComplete(100, 100)}
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold px-6 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              {isSubmitting ? 'Logging...' : 'Claim +45 XP Reward'}
            </Button>
          </div>
        )}
      </div>

      {/* Protocol Note */}
      <div className="p-3 bg-[#0B132B] rounded-xl border border-[#1E3A5F] text-xs font-mono text-slate-400 flex items-center gap-2">
        <Wind className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          NASA Protocol: Box breathing reduces sympathetic nervous outflow, dropping myocardial oxygen demand by 28%.
        </span>
      </div>
    </div>
  );
};
