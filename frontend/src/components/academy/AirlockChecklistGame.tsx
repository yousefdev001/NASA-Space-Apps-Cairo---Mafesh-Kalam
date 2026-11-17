import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { CheckCircle2, RotateCcw, ShieldCheck, ArrowRight, Activity } from 'lucide-react';

interface AirlockChecklistGameProps {
  onComplete: (score: number, maxScore: number) => void;
  isSubmitting?: boolean;
}

interface ChecklistStep {
  id: number;
  title: string;
  actionLabel: string;
  description: string;
  telemetryChange: {
    suitO2: string;
    lockPsi: string;
    nitrogenLoad: string;
  };
  clinicalInsight: string;
}

const CHECKLIST_STEPS: ChecklistStep[] = [
  {
    id: 1,
    title: 'EMU Suit Seal & 100% Pure O2 Purge',
    actionLabel: 'Initiate Pure O2 Washout',
    description: 'Lock astronaut helmet visor and flush ambient 78% nitrogen gas from suit atmosphere.',
    telemetryChange: { suitO2: '99.8% O2', lockPsi: '14.7 psi', nitrogenLoad: '100% baseline' },
    clinicalInsight: 'Breathing 100% O2 establishes a steep alveolar-arterial nitrogen gradient, driving dissolved N2 out of capillary blood.',
  },
  {
    id: 2,
    title: 'In-Suit Light Ergometer Exercise',
    actionLabel: 'Start 10-Min Cycle Exercise',
    description: 'Astronaut performs light cycling (75% VO2 max) to dilate peripheral microvasculature.',
    telemetryChange: { suitO2: '99.9% O2', lockPsi: '14.7 psi', nitrogenLoad: '68% (rapid drop)' },
    clinicalInsight: 'Light exercise doubles cardiac output and peripheral capillary recruitment, accelerating N2 clearance from adipose and muscle tissues.',
  },
  {
    id: 3,
    title: 'Airlock Depress to 10.2 psi Staging',
    actionLabel: 'Vent Airlock to 10.2 psi',
    description: 'Step-down pressure reduces whole-body nitrogen partial pressure without inducing bubble nucleation.',
    telemetryChange: { suitO2: '100% O2', lockPsi: '10.2 psi', nitrogenLoad: '45%' },
    clinicalInsight: 'Campout protocol at 10.2 psi provides a safe intermediate isobaric plateau before final depressurization to vacuum.',
  },
  {
    id: 4,
    title: 'Pre-Breathe Rest & Suit Pressure Check',
    actionLabel: 'Verify Glove & Ring Seals',
    description: 'Astronaut rests quietly for final 40 minutes while telemetry verifies zero suit pressure leaks (< 0.05 psi/min).',
    telemetryChange: { suitO2: '100% O2', lockPsi: '10.2 psi', nitrogenLoad: '18%' },
    clinicalInsight: 'Resting prevents musculoskeletal micro-trauma which could serve as heterogeneous nucleation sites for gas bubbles.',
  },
  {
    id: 5,
    title: 'Acoustic Doppler Bubble Scan & EVA Go',
    actionLabel: 'Authorize Outer Hatch Egress',
    description: 'Perform precordial Doppler ultrasound scan; verify Grade 0 (zero venous nitrogen bubbles) and depress to 0.0 psi.',
    telemetryChange: { suitO2: '100% O2', lockPsi: '0.0 psi (Vacuum)', nitrogenLoad: '0.05 (Safe)' },
    clinicalInsight: 'Zero bubbles detected in pulmonary artery! astronaut is fully protected against decompression sickness (the bends).',
  },
];

export const AirlockChecklistGame: React.FC<AirlockChecklistGameProps> = ({ onComplete, isSubmitting }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const currentStep = CHECKLIST_STEPS[currentStepIdx];
  const activeTelemetry = currentStepIdx > 0
    ? CHECKLIST_STEPS[currentStepIdx - 1].telemetryChange
    : { suitO2: '21.0% O2', lockPsi: '14.7 psi', nitrogenLoad: '100% (Ambient)' };

  const handleStepAction = () => {
    const nextCompleted = [...completedSteps, currentStep.id];
    setCompletedSteps(nextCompleted);

    if (currentStepIdx + 1 < CHECKLIST_STEPS.length) {
      setCurrentStepIdx(currentStepIdx + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleReset = () => {
    setCurrentStepIdx(0);
    setCompletedSteps([]);
    setIsFinished(false);
  };

  return (
    <div className="space-y-6">
      {/* Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-[#050B14] rounded-xl border border-[#1E3A5F]">
          <p className="text-[10px] font-mono text-slate-400">AIRLOCK PRESSURE</p>
          <p className="text-lg font-mono font-bold text-cyan-400">
            {isFinished ? '0.0 psi (Vacuum)' : activeTelemetry.lockPsi}
          </p>
        </div>
        <div className="p-3 bg-[#050B14] rounded-xl border border-[#1E3A5F]">
          <p className="text-[10px] font-mono text-slate-400">EMU SUIT ATMOSPHERE</p>
          <p className="text-lg font-mono font-bold text-emerald-400">
            {isFinished ? '100% O2' : activeTelemetry.suitO2}
          </p>
        </div>
        <div className="p-3 bg-[#050B14] rounded-xl border border-[#1E3A5F]">
          <p className="text-[10px] font-mono text-slate-400">TISSUE NITROGEN LOAD</p>
          <p
            className={`text-lg font-mono font-bold ${
              isFinished || currentStepIdx >= 4 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {isFinished ? '0.05 (Safe)' : activeTelemetry.nitrogenLoad}
          </p>
        </div>
        <div className="p-3 bg-[#050B14] rounded-xl border border-[#1E3A5F]">
          <p className="text-[10px] font-mono text-slate-400">PRE-BREATHE STEP</p>
          <p className="text-lg font-mono font-bold text-cyan-400">
            {isFinished ? '5/5 (COMPLETE)' : `${currentStepIdx + 1} / ${CHECKLIST_STEPS.length}`}
          </p>
        </div>
      </div>

      {/* Main Checklist Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Step List Progression (Left) */}
        <div className="md:col-span-5 space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">
            PRE-BREATHE PROTOCOL STEPS
          </h4>
          {CHECKLIST_STEPS.map((step, idx) => {
            const isDone = completedSteps.includes(step.id);
            const isCurrent = idx === currentStepIdx && !isFinished;

            return (
              <div
                key={step.id}
                className={`p-3 rounded-xl border text-xs font-mono transition-all flex items-center justify-between ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : isCurrent
                    ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                    : 'bg-[#0B132B]/60 border-[#1E3A5F] text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#050B14] border border-current flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-semibold line-clamp-1">{step.title}</span>
                </div>
                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Current Active Step Execution Panel (Right) */}
        <div className="md:col-span-7 p-6 bg-[#050B14] rounded-2xl border border-[#1E3A5F] flex flex-col justify-between min-h-[300px]">
          {!isFinished ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                  STEP {currentStepIdx + 1} OF {CHECKLIST_STEPS.length}
                </span>
                <span className="text-xs font-mono text-slate-400">FLIGHT SURGEON DIRECTIVE</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-1.5">{currentStep.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{currentStep.description}</p>
              </div>

              <div className="p-3 bg-[#0B132B] rounded-xl border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-start gap-2">
                <Activity className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Physiological Goal: {currentStep.clinicalInsight}</span>
              </div>

              <div className="pt-4 border-t border-[#1E3A5F] flex items-center justify-between">
                <button onClick={handleReset} className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleStepAction}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold px-6 shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                >
                  {currentStep.actionLabel} <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-mono font-bold text-emerald-400">
                  EVA PRE-BREATHE SEQUENCE COMPLETE
                </h3>
                <p className="text-xs text-slate-300 font-mono max-w-md mx-auto mt-1">
                  100% pure oxygen nitrogen washout verified. Elena Vance cleared for airlock depress and spacewalk ingress.
                </p>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => onComplete(100, 100)}
                  disabled={isSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold px-8 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                >
                  {isSubmitting ? 'Logging...' : 'Claim +75 XP Reward'}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-slate-400">
                  <RotateCcw className="w-4 h-4 mr-1" /> Replay
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
