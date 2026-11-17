import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { CheckCircle2, RotateCcw, Sparkles, Brain, Heart, Wind, ShieldAlert, Bone } from 'lucide-react';

interface OrganItem {
  id: string;
  name: string;
  targetZone: string;
  icon: React.ElementType;
  fact: string;
}

const ORGANS: OrganItem[] = [
  {
    id: 'brain',
    name: 'Brain (Cranial Vault)',
    targetZone: 'zone-head',
    icon: Brain,
    fact: 'Elevated intracranial pressure and cephalad fluid stasis expand the optic nerve sheath!',
  },
  {
    id: 'heart',
    name: 'Heart (Central Thorax)',
    targetZone: 'zone-heart',
    icon: Heart,
    fact: 'Shifts upward with diaphragm relaxation and accommodates 1.5–2.0 L of shifted venous fluid.',
  },
  {
    id: 'lungs',
    name: 'Lungs & Airways',
    targetZone: 'zone-lungs',
    icon: Wind,
    fact: 'Ventilation and perfusion balance changes; zero-G eliminates hydrostatic pleural pressure gradients.',
  },
  {
    id: 'liver',
    name: 'Liver (Upper Right Abdomen)',
    targetZone: 'zone-liver',
    icon: ShieldAlert,
    fact: 'Moves cephalad against the relaxed diaphragm; metabolic clearance rates adapt to spaceflight.',
  },
  {
    id: 'bones',
    name: 'Bones / Skeleton (Lower Body)',
    targetZone: 'zone-bones',
    icon: Bone,
    fact: 'Without gravity load, osteoclasts resorb ~1% bone mass per month unless mitigated by ARED workouts.',
  },
];

interface ZeroGOrganGameProps {
  onComplete: (score: number, maxScore: number) => void;
  isSubmitting?: boolean;
}

export const ZeroGOrganGame: React.FC<ZeroGOrganGameProps> = ({ onComplete, isSubmitting }) => {
  const [selectedOrgan, setSelectedOrgan] = useState<OrganItem | null>(null);
  const [placedOrgans, setPlacedOrgans] = useState<Record<string, OrganItem>>({});
  const [recentFact, setRecentFact] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const handleSelectOrgan = (organ: OrganItem) => {
    if (placedOrgans[organ.targetZone]) return;
    setSelectedOrgan(organ);
  };

  const handleTargetZoneClick = (zoneId: string) => {
    if (!selectedOrgan) return;

    if (selectedOrgan.targetZone === zoneId) {
      const updated = { ...placedOrgans, [zoneId]: selectedOrgan };
      setPlacedOrgans(updated);
      setRecentFact(selectedOrgan.fact);
      setSelectedOrgan(null);

      if (Object.keys(updated).length === ORGANS.length) {
        setIsFinished(true);
      }
    } else {
      // Wrong placement feedback
      setRecentFact('⚠️ Anatomical Mismatch! Check zero-g physiological alignment.');
    }
  };

  const handleReset = () => {
    setPlacedOrgans({});
    setSelectedOrgan(null);
    setRecentFact(null);
    setIsFinished(false);
  };

  const handleClaim = () => {
    onComplete(100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Instructions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-[#050B14] rounded-xl border border-[#1E3A5F]">
        <div className="flex items-center gap-2 text-xs font-mono">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-slate-300">
            Select an organ from the tray, then click its target zone in the astronaut body silhouette.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-amber-400">
            Placed: {Object.keys(placedOrgans).length} / {ORGANS.length}
          </span>
          <button
            onClick={handleReset}
            className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
            title="Reset puzzle"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Puzzle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Organs Tray */}
        <div className="md:col-span-5 space-y-2.5">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-1">
            ORGAN SYSTEMS INVENTORY
          </h4>
          {ORGANS.map((organ) => {
            const isPlaced = !!placedOrgans[organ.targetZone];
            const isSelected = selectedOrgan?.id === organ.id;
            const Icon = organ.icon;

            return (
              <button
                key={organ.id}
                disabled={isPlaced}
                onClick={() => handleSelectOrgan(organ)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all font-mono text-xs ${
                  isPlaced
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                    : 'bg-[#0B132B] border-[#1E3A5F] text-slate-300 hover:border-cyan-500/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="font-bold">{organ.name}</span>
                </div>
                {isPlaced ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <span className="text-[10px] text-cyan-400 uppercase font-bold">
                    {isSelected ? 'ACTIVE' : 'SELECT'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Astronaut Silhouette Target Zones */}
        <div className="md:col-span-7 flex flex-col items-center justify-center p-6 bg-[#050B14] rounded-2xl border border-[#1E3A5F] relative min-h-[360px]">
          {/* Astronaut Silhouette Visual Map */}
          <div className="w-64 space-y-3 relative z-10">
            {/* Zone Head / Brain */}
            <div
              onClick={() => handleTargetZoneClick('zone-head')}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                placedOrgans['zone-head']
                  ? 'bg-emerald-950/40 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : selectedOrgan?.targetZone === 'zone-head'
                  ? 'bg-cyan-500/20 border-cyan-400 animate-pulse text-cyan-300'
                  : 'bg-[#0B132B]/80 border-dashed border-[#1E3A5F] hover:border-cyan-500 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold">
                <Brain className="w-4 h-4" />
                <span>
                  {placedOrgans['zone-head'] ? 'Brain (Cephalad Engorged)' : 'CRANIAL ZONE (Head)'}
                </span>
              </div>
            </div>

            {/* Zone Heart / Thorax */}
            <div
              onClick={() => handleTargetZoneClick('zone-heart')}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                placedOrgans['zone-heart']
                  ? 'bg-emerald-950/40 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : selectedOrgan?.targetZone === 'zone-heart'
                  ? 'bg-cyan-500/20 border-cyan-400 animate-pulse text-cyan-300'
                  : 'bg-[#0B132B]/80 border-dashed border-[#1E3A5F] hover:border-cyan-500 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold">
                <Heart className="w-4 h-4" />
                <span>
                  {placedOrgans['zone-heart'] ? 'Heart (+2L Shift Adapted)' : 'THORACIC ZONE (Heart)'}
                </span>
              </div>
            </div>

            {/* Zone Lungs */}
            <div
              onClick={() => handleTargetZoneClick('zone-lungs')}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                placedOrgans['zone-lungs']
                  ? 'bg-emerald-950/40 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : selectedOrgan?.targetZone === 'zone-lungs'
                  ? 'bg-cyan-500/20 border-cyan-400 animate-pulse text-cyan-300'
                  : 'bg-[#0B132B]/80 border-dashed border-[#1E3A5F] hover:border-cyan-500 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold">
                <Wind className="w-4 h-4" />
                <span>
                  {placedOrgans['zone-lungs'] ? 'Lungs (Micro-G Perfusion)' : 'PULMONARY ZONE (Lungs)'}
                </span>
              </div>
            </div>

            {/* Zone Liver */}
            <div
              onClick={() => handleTargetZoneClick('zone-liver')}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                placedOrgans['zone-liver']
                  ? 'bg-emerald-950/40 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : selectedOrgan?.targetZone === 'zone-liver'
                  ? 'bg-cyan-500/20 border-cyan-400 animate-pulse text-cyan-300'
                  : 'bg-[#0B132B]/80 border-dashed border-[#1E3A5F] hover:border-cyan-500 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold">
                <ShieldAlert className="w-4 h-4" />
                <span>
                  {placedOrgans['zone-liver'] ? 'Liver (Hepatic Clearance)' : 'ABDOMINAL ZONE (Liver)'}
                </span>
              </div>
            </div>

            {/* Zone Bones / Skeleton */}
            <div
              onClick={() => handleTargetZoneClick('zone-bones')}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                placedOrgans['zone-bones']
                  ? 'bg-emerald-950/40 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : selectedOrgan?.targetZone === 'zone-bones'
                  ? 'bg-cyan-500/20 border-cyan-400 animate-pulse text-cyan-300'
                  : 'bg-[#0B132B]/80 border-dashed border-[#1E3A5F] hover:border-cyan-500 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold">
                <Bone className="w-4 h-4" />
                <span>
                  {placedOrgans['zone-bones'] ? 'Skeletal Base (ARED Protected)' : 'SKELETAL BASE (Bones)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fact & Educational Callout */}
      {recentFact && (
        <div className="p-3.5 bg-[#0B132B] rounded-xl border border-cyan-500/40 text-xs font-mono text-cyan-300 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>{recentFact}</span>
        </div>
      )}

      {/* Victory Celebration State */}
      {isFinished && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div>
            <h4 className="text-sm font-mono font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ZERO-G ANATOMY CALIBRATION SUCCESSFUL!
            </h4>
            <p className="text-xs text-slate-300 font-mono mt-1">
              All organ systems placed according to zero-gravity cephalad redistribution models.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleClaim}
            disabled={isSubmitting}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold px-6 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            {isSubmitting ? 'Logging to Mission Control...' : 'Claim +50 XP Reward'}
          </Button>
        </div>
      )}
    </div>
  );
};
