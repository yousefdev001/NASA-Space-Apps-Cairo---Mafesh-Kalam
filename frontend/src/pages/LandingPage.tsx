import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  ArrowRight,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { OrganTelemetryGrid } from '../components/telemetry/OrganTelemetryGrid';
import { EcgCanvas } from '../components/charts/EcgCanvas';

export const LandingPage: React.FC = () => {
  const [articleAudience, setArticleAudience] = useState<'kids' | 'adults'>('adults');

  const stats = [
    { label: 'Monitored Organ Systems', value: '14 Systems' },
    { label: 'Check-In Completion', value: '2 min' },
    { label: 'Mars Comms Delay Safe', value: '> 20 min' },
    { label: 'Specialized NASA Roles', value: '10 Roles' },
  ];

  const kidsArticles = [
    {
      title: 'How Do Astronauts Sleep Without Floating Away? 🚀',
      excerpt: 'Discover why astronauts have to strap themselves to walls in sleeping bags so they do not bump their heads in Zero-G!',
      readTime: '3 min read · Fun Science',
      category: 'Space Life',
    },
    {
      title: 'Why Does Your Heart Work Differently in Orbit? ❤️',
      excerpt: 'Without gravity pulling your blood down to your feet, your heart does not need to pump as hard! Meet the space heart trick.',
      readTime: '4 min read · Physiology',
      category: 'Kids Health',
    },
    {
      title: 'Can Astronauts Grow Vegetables on Mars? 🌱',
      excerpt: 'Astronauts are already eating space lettuce! Learn how plants know which way is up when there is no gravity.',
      readTime: '5 min read · Biology',
      category: 'Space Farming',
    },
  ];

  const adultArticles = [
    {
      title: 'Orthostatic Intolerance & Cardiovascular Remodeling in Microgravity',
      excerpt: 'Clinical analysis of cephalad fluid shifts, baroreceptor resetting, and post-flight stroke volume reduction under NASA STD-3001.',
      readTime: '8 min read · Clinical Medicine',
      category: 'Cardiovascular',
    },
    {
      title: 'Spaceflight-Associated Neuro-Ocular Syndrome (SANS) Management',
      excerpt: 'Pathophysiology of optic disc edema, posterior globe flattening, and hyperopic refractive shift during long-duration orbital missions.',
      readTime: '12 min read · Neuro-Ophthalmology',
      category: 'Neurology',
    },
    {
      title: 'Galactic Cosmic Radiation (GCR) Proton Energy Spectra & Cell Repair',
      excerpt: 'Assessment of cumulative tissue dose equivalent and dosimetric threshold triggers for crew shelter deployment during solar particle events.',
      readTime: '10 min read · Bio-Astronautics',
      category: 'Radiation Oncology',
    },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 px-4 sm:px-6 max-w-7xl mx-auto text-center">
        {/* Glow ambient circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B132B] border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium mb-6 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>NASA STD-3001 · Deep-Space Medical Telemetry & Ground Station</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-mono font-black tracking-tight text-white max-w-5xl mx-auto leading-tight">
          AURA<span className="text-cyan-400">MED</span> SPACE HEALTH PLATFORM
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          High-criticality telemetry, real-time physiological biometrics, clinical AI validation,
          and ground control mission management for deep-space exploration crews.
        </p>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to="/login">
            <Button variant="primary" size="lg" className="shadow-[0_0_25px_rgba(0,229,255,0.4)]">
              Enter Mission Control <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/academy">
            <Button variant="secondary" size="lg">
              Explore Space Academy <BookOpen className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-[#0B132B]/80 border border-[#1E3A5F] text-center backdrop-blur-sm"
            >
              <p className="font-mono text-2xl sm:text-3xl font-extrabold text-cyan-400">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1 font-mono">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live Telemetry Preview Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wide">
            Real-Time Organ Systems Bio-Scan
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
            Directly mirroring the offline-first astronaut mobile health application. Synced to Houston Ground Control
            the moment orbital telemetry downlink is restored.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8">
            <OrganTelemetryGrid />
          </div>

          <div className="lg:col-span-4 space-y-4">
            <Card title="Live Holographic ECG" subtitle="Continuous Lead II Cardiac Array">
              <EcgCanvas height={130} bpm={62} />
              <div className="mt-4 pt-4 border-t border-[#1E3A5F] space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">RHYTHM:</span>
                  <span className="text-emerald-400 font-bold">NORMAL SINUS (62 BPM)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">QTC INTERVAL:</span>
                  <span>412 ms (NOMINAL)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">HRV RMSSD:</span>
                  <span className="text-cyan-400">42.5 ms</span>
                </div>
              </div>
            </Card>

            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold uppercase">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Zero Blackout Architecture</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Buffers up to 72 hours of raw biometric waveforms locally on the crew device. Automatically performs
                differential sync and automated alert deduplication upon network re-establishment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Educational Articles Section (Kids vs Adults Dual Tracks) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1E3A5F] pb-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-xs uppercase tracking-wider text-cyan-400 font-bold">
                AuraMed Space Medicine Articles
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono font-bold text-white mt-1">
              Astronaut Health & Spaceflight Knowledge
            </h2>
          </div>

          {/* Toggle Audience Tabs */}
          <div className="flex items-center p-1 bg-[#0B132B] border border-[#1E3A5F] rounded-lg">
            <button
              onClick={() => setArticleAudience('kids')}
              className={`px-4 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                articleAudience === 'kids'
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Junior Cadets (Kids)
            </button>
            <button
              onClick={() => setArticleAudience('adults')}
              className={`px-4 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                articleAudience === 'adults'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Flight Surgeons (Adults)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(articleAudience === 'kids' ? kidsArticles : adultArticles).map((article, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-xl border transition-all duration-200 group flex flex-col justify-between ${
                articleAudience === 'kids'
                  ? 'bg-amber-950/15 border-amber-500/30 hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-[#0B132B]/80 border-[#1E3A5F] hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,229,255,0.2)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-3">
                  <span
                    className={
                      articleAudience === 'kids' ? 'text-amber-400 font-bold' : 'text-cyan-400 font-bold'
                    }
                  >
                    {article.category}
                  </span>
                  <span className="text-slate-400">{article.readTime}</span>
                </div>
                <h3 className="font-bold text-lg text-white group-hover:text-cyan-300 transition-colors leading-snug">
                  {article.title}
                </h3>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">{article.excerpt}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1E3A5F]/60 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Read Article</span>
                <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 10 Roles Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wide">
            10 Tailored Ground Control & Orbit Roles
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
            Granular Role-Based Access Control (RBAC) ensuring precise medical data privacy and clinical workflow
            separation.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {[
            { role: 'Flight Surgeon', desc: 'Clinical approvals & intervention authority' },
            { role: 'Mission Director', desc: 'Holistic mission status & crew readiness' },
            { role: 'Medical Officer', desc: 'Threshold calibrations & telemetry triage' },
            { role: 'Biomed Engineer', desc: 'Hardware arrays, EVA suits, sensor calibration' },
            { role: 'Astronaut Crew', desc: 'Personal check-ins, baselines, wellness' },
            { role: 'Ground Controller', desc: 'Data packet ingestion & downlink sync' },
            { role: 'Cadet / Student', desc: 'Interactive academy, quizzes, Zero-G mini-games' },
            { role: 'Content Creator', desc: 'Curricula authoring & article publishing' },
            { role: 'Sys Administrator', desc: 'User RBAC, system config, security policies' },
            { role: 'Compliance Auditor', desc: 'SHA-256 hash chains & forensic logs' },
          ].map((r, i) => (
            <div key={i} className="p-3.5 rounded-lg bg-[#0B132B]/60 border border-[#1E3A5F]">
              <p className="font-mono text-xs font-bold text-cyan-400">{r.role}</p>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
