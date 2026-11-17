import React from 'react';
import { LeaderboardEntry } from '../../types/academy.types';
import { Trophy, Medal, Award, Flame } from 'lucide-react';

interface CadetLeaderboardProps {
  leaders: LeaderboardEntry[];
  currentUserId?: number;
}

export const CadetLeaderboard: React.FC<CadetLeaderboardProps> = ({ leaders, currentUserId }) => {
  return (
    <div className="p-5 bg-[#0B132B]/90 rounded-2xl border border-[#1E3A5F] space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#1E3A5F]">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-mono font-bold text-white tracking-wider uppercase">
            TOP 10 CADET & FLIGHT SURGEON ROSTER
          </h3>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-amber-400" /> Real-Time Downlink
        </span>
      </div>

      <div className="space-y-2">
        {leaders.map((entry) => {
          const isCurrentUser = currentUserId && entry.id === currentUserId;
          const isTop1 = entry.leaderboard_position === 1;
          const isTop2 = entry.leaderboard_position === 2;
          const isTop3 = entry.leaderboard_position === 3;

          return (
            <div
              key={entry.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all text-xs font-mono ${
                isCurrentUser
                  ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                  : 'bg-[#050B14]/70 border-[#1E3A5F]/70 text-slate-300 hover:border-cyan-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isTop1
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                      : isTop2
                      ? 'bg-slate-300 text-slate-950'
                      : isTop3
                      ? 'bg-amber-700 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isTop1 ? (
                    <Trophy className="w-3.5 h-3.5" />
                  ) : isTop2 || isTop3 ? (
                    <Medal className="w-3.5 h-3.5" />
                  ) : (
                    `#${entry.leaderboard_position}`
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white line-clamp-1">{entry.name}</span>
                    {isCurrentUser && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950 uppercase">
                        YOU
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-cyan-400">{entry.rank}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-1 text-[11px] text-amber-300">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>{entry.badge_count} Badges</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-cyan-300">{entry.total_xp}</span>
                  <span className="text-[10px] text-slate-400 ml-1">XP</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
