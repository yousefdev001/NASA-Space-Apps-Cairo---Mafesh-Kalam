import React from 'react';
import { Badge as BadgeType, UserBadge } from '../../types/academy.types';
import { Award, Lock, Sparkles } from 'lucide-react';

interface BadgesShelfProps {
  allBadges: BadgeType[];
  userBadges: UserBadge[];
}

export const BadgesShelf: React.FC<BadgesShelfProps> = ({ allBadges, userBadges }) => {
  const earnedBadgeMap = new Map<number, UserBadge>();
  userBadges.forEach((ub) => earnedBadgeMap.set(ub.badge_id, ub));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-mono font-bold text-white tracking-wider uppercase">
            ASTRONAUT INSIGNIA & CLINICAL BADGES ({earnedBadgeMap.size} / {allBadges.length} UNLOCKED)
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">Awarded via bio-astronautics mastery</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {allBadges.map((badge) => {
          const isUnlocked = earnedBadgeMap.has(badge.id);

          return (
            <div
              key={badge.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isUnlocked
                  ? 'bg-[#0B132B]/90 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:border-amber-400'
                  : 'bg-[#050B14]/70 border-[#1E3A5F]/70 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isUnlocked
                        ? 'bg-amber-950/70 border border-amber-500/60 text-amber-400'
                        : 'bg-slate-900 border border-slate-700 text-slate-500'
                    }`}
                  >
                    {isUnlocked ? (
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      isUnlocked
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isUnlocked ? 'EARNED' : `${badge.xp_required} XP`}
                  </span>
                </div>

                <h4 className="text-xs font-mono font-bold text-white mb-1 leading-snug">
                  {badge.name}
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans line-clamp-3">
                  {badge.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#1E3A5F]/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="uppercase">{badge.category}</span>
                {isUnlocked && <span className="text-amber-400 font-bold">ACTIVE</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
