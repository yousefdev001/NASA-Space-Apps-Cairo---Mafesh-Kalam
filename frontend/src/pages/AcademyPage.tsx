import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  GraduationCap,
  Award,
  Gamepad2,
  BookOpen,
  Trophy,
  ChevronRight,
} from 'lucide-react';

export const AcademyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kids' | 'adults'>('kids');

  const miniGames = [
    {
      title: 'Zero-G Organ Placement Puzzle',
      desc: 'Drag and place the human heart, lungs, and liver into an astronaut silhouette adjusting for microgravity cephalad shift.',
      xp: '+50 XP',
      difficulty: 'Junior Cadet',
      badge: 'Zero-G Master',
    },
    {
      title: 'Cardiac Rhythm Simulator',
      desc: 'Tap along with orbital ECG pulses to stabilize an astronaut heart rate during high-stress EVA spacewalk reentry.',
      xp: '+40 XP',
      difficulty: 'Beginner',
      badge: 'Heart Stabilizer',
    },
    {
      title: 'Deep-Space SpO2 Breath Control',
      desc: 'Master the rhythmic breathing techniques used by Apollo and Artemis astronauts to preserve oxygen in emergency suit mode.',
      xp: '+45 XP',
      difficulty: 'Beginner',
      badge: 'Lung Champion',
    },
    {
      title: 'EVA Airlock Pre-Breathe Checklist',
      desc: 'Help Elena Vance complete the 100% pure oxygen pre-breathe sequence to prevent the bends (decompression sickness).',
      xp: '+60 XP',
      difficulty: 'Cadet Pro',
      badge: 'Airlock Specialist',
    },
  ];

  const clinicalTracks = [
    {
      title: 'Cardiovascular Remodeling in Microgravity',
      lessons: 6,
      duration: '4.5 Hours',
      level: 'Advanced',
      xp: '+300 XP',
    },
    {
      title: 'Neuro-Ocular Syndrome (SANS) Diagnostics',
      lessons: 8,
      duration: '6.0 Hours',
      level: 'Specialist',
      xp: '+450 XP',
    },
    {
      title: 'Deep-Space Galactic Cosmic Radiation Oncology',
      lessons: 5,
      duration: '3.8 Hours',
      level: 'Advanced',
      xp: '+350 XP',
    },
    {
      title: 'ECLSS Closed-Loop Atmosphere & Hypoxia Triage',
      lessons: 7,
      duration: '5.2 Hours',
      level: 'Intermediate',
      xp: '+400 XP',
    },
    {
      title: 'Microgravity Musculoskeletal Atrophy & Countermeasures',
      lessons: 6,
      duration: '4.0 Hours',
      level: 'Intermediate',
      xp: '+320 XP',
    },
    {
      title: 'Autonomous Clinical Decision Systems (HITL AI)',
      lessons: 9,
      duration: '7.5 Hours',
      level: 'Fellowship',
      xp: '+600 XP',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0B132B]/90 border border-[#1E3A5F]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-mono font-bold text-white tracking-wide">
              AURA<span className="text-cyan-400">MED</span> SPACE ACADEMY
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            INTERACTIVE ZERO-G BIO-ASTRONAUTICS GAMIFICATION & CLINICAL MEDICINE CURRICULA
          </p>
        </div>

        {/* Gamification Status Pill */}
        <div className="flex items-center gap-4 bg-[#050B14] p-3 rounded-xl border border-[#1E3A5F]">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-[10px] font-mono text-slate-400">YOUR RANK</p>
              <p className="text-sm font-mono font-bold text-amber-400">Flight Cadet</p>
            </div>
          </div>
          <div className="h-8 w-px bg-[#1E3A5F]" />
          <div>
            <p className="text-[10px] font-mono text-slate-400">TOTAL XP</p>
            <p className="text-sm font-mono font-bold text-cyan-400">450 / 600 XP</p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Kids Zone vs Adults Zone */}
      <div className="flex items-center gap-3 border-b border-[#1E3A5F] pb-3">
        <button
          onClick={() => setActiveTab('kids')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-mono font-bold transition-all ${
            activeTab === 'kids'
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'text-slate-400 hover:text-white bg-[#0B132B]'
          }`}
        >
          <Gamepad2 className="w-4 h-4" /> Junior Cadets Zone (4 Zero-G Mini-Games)
        </button>
        <button
          onClick={() => setActiveTab('adults')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-mono font-bold transition-all ${
            activeTab === 'adults'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
              : 'text-slate-400 hover:text-white bg-[#0B132B]'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Flight Surgeons Clinical Tracks
        </button>
      </div>

      {/* Content View */}
      {activeTab === 'kids' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {miniGames.map((game, idx) => (
            <Card
              key={idx}
              className="border-amber-500/30 hover:border-amber-400 transition-colors bg-[#0B132B]/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40">
                    {game.difficulty}
                  </span>
                  <span className="font-mono text-sm font-bold text-cyan-400">{game.xp}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{game.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{game.desc}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#1E3A5F] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-mono text-amber-300">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Badge: {game.badge}</span>
                </div>
                <Button variant="primary" size="sm" className="bg-amber-500 hover:bg-amber-400 text-slate-950">
                  Play Mini-Game <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clinicalTracks.map((track, idx) => (
            <Card key={idx} className="border-[#1E3A5F] hover:border-cyan-500/50 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge status="info">{track.level}</Badge>
                  <span className="font-mono text-xs font-bold text-cyan-400">{track.xp}</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{track.title}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {track.lessons} Accredited Modules · {track.duration}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-[#1E3A5F] flex justify-end">
                <Button variant="hud" size="sm" className="text-xs w-full">
                  Begin Curriculum <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
