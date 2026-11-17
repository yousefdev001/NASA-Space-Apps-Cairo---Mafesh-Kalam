import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BookOpen, Clock, ArrowRight, Search } from 'lucide-react';

export const ArticlesPage: React.FC = () => {
  const [audience, setAudience] = useState<'all' | 'kids' | 'adults'>('all');
  const [search, setSearch] = useState('');

  const articles = [
    {
      id: 1,
      title: 'How Do Astronauts Sleep Without Floating Away? 🚀',
      audience: 'kids',
      category: 'Space Life',
      readTime: '3 min read',
      author: 'AuraBot Space Guide',
      excerpt:
        'Discover why astronauts have to strap themselves to walls in sleeping bags so they do not bump their heads into buttons and computer screens while dreaming in Zero-G!',
      date: 'Nov 14, 2026',
    },
    {
      id: 2,
      title: 'Why Does Your Heart Work Differently in Orbit? ❤️',
      audience: 'kids',
      category: 'Physiology',
      readTime: '4 min read',
      author: 'Dr. Henrik Lindqvist',
      excerpt:
        'On Earth, gravity pulls your blood down into your legs. In outer space, your blood floats upward into your chest and face, giving astronauts "puffy face bird legs" syndrome!',
      date: 'Nov 12, 2026',
    },
    {
      id: 3,
      title: 'Orthostatic Intolerance & Cardiovascular Remodeling in Microgravity',
      audience: 'adults',
      category: 'Cardiovascular',
      readTime: '8 min read',
      author: 'NASA Bio-Astronautics Working Group',
      excerpt:
        'A comprehensive review of the rapid reduction in plasma volume, resetting of carotid and aortic baroreceptors, and the clinical efficacy of lower body negative pressure (LBNP) countermeasures.',
      date: 'Nov 10, 2026',
    },
    {
      id: 4,
      title: 'Spaceflight-Associated Neuro-Ocular Syndrome (SANS) Clinical Management',
      audience: 'adults',
      category: 'Neuro-Ophthalmology',
      readTime: '12 min read',
      author: 'Dr. Sarah Connor, Flight Surgeon',
      excerpt:
        'Pathophysiological evaluation of prolonged venous hypertension, cerebrospinal fluid pressure dysregulation, and ultrasound imaging protocols during ISS Expedition rotations.',
      date: 'Nov 08, 2026',
    },
    {
      id: 5,
      title: 'Can Astronauts Grow Vegetables on Mars? 🌱',
      audience: 'kids',
      category: 'Biology',
      readTime: '5 min read',
      author: 'Cadet Academy Staff',
      excerpt:
        'Red Martian soil is tricky, but space scientists use LED lights, hydroponics, and recycled water to grow fresh crunchy lettuce and radishes in deep space!',
      date: 'Nov 05, 2026',
    },
    {
      id: 6,
      title: 'Galactic Cosmic Radiation Proton Spectra & Dosimetric Trigger Limits',
      audience: 'adults',
      category: 'Radiation Oncology',
      readTime: '11 min read',
      author: 'Space Radiation Protection Center',
      excerpt:
        'Quantitative modeling of solar particle events (SPE) versus isotropic galactic background, establishing automated telemetry escalation triggers for crew shelter lock-in.',
      date: 'Nov 01, 2026',
    },
  ];

  const filtered = articles.filter((a) => {
    const matchesAudience = audience === 'all' || a.audience === audience;
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase());
    return matchesAudience && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wide flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-cyan-400" />
            AURAMED EDUCATIONAL KNOWLEDGE PORTAL
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            PEER-REVIEWED BIO-ASTRONAUTICS RESEARCH & INTERACTIVE JUNIOR CADET GUIDES
          </p>
        </div>

        {/* Search & Filter Pills */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search space articles..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0B132B] border border-[#1E3A5F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 bg-[#0B132B] p-1 rounded-xl border border-[#1E3A5F]">
            <button
              onClick={() => setAudience('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                audience === 'all' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Articles
            </button>
            <button
              onClick={() => setAudience('kids')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                audience === 'kids'
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Junior Cadets (Kids)
            </button>
            <button
              onClick={() => setAudience('adults')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                audience === 'adults'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Clinical Flight Surgeons
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((article) => (
          <Card
            key={article.id}
            className={`flex flex-col justify-between transition-all duration-200 ${
              article.audience === 'kids'
                ? 'border-amber-500/30 hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] bg-[#0B132B]/80'
                : 'border-[#1E3A5F] hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,229,255,0.2)] bg-[#0B132B]/90'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-3">
                <span
                  className={
                    article.audience === 'kids' ? 'text-amber-400 font-bold' : 'text-cyan-400 font-bold'
                  }
                >
                  {article.category}
                </span>
                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {article.readTime}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2 leading-snug">{article.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{article.excerpt}</p>
            </div>

            <div className="mt-5 pt-3 border-t border-[#1E3A5F] flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 text-[11px]">{article.author}</span>
              <Button
                variant={article.audience === 'kids' ? 'secondary' : 'hud'}
                size="sm"
                className="text-[11px]"
              >
                Read <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
