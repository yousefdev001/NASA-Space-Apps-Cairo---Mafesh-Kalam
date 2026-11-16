import { useState } from 'react';
import {
  Activity,
  Bot,
  Brain,
  CheckCircle2,
  HeartPulse,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import {
  FEATURE_CATEGORIES,
  filterAppFeatures,
  type FeatureCategory,
} from '../data/appFeatures';
import { getWobblyBorderStyle } from '../styles/handDrawnTokens';
import { TapeStrip, ThumbtackPin } from './HandDrawnDecor';

const FEATURE_ICONS: Record<string, typeof Activity> = {
  'two-min-checkin': HeartPulse,
  'interactive-body-atlas': Activity,
  'clinical-decision-engine': ShieldCheck,
  'offline-rag-houston-comms': Radio,
  'health-quests-cognitive': Brain,
  'earth-memories-aurabot': Bot,
};

export function AppFeaturesSection() {
  const [activeCategory, setActiveCategory] = useState<FeatureCategory>('all');
  const visibleFeatures = filterAppFeatures(activeCategory);

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="scroll-mt-24 py-14 sm:py-20 px-4 sm:px-6 text-[#2d2d2d] dark:text-white"
    >
      <div data-gsap="reveal" className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 border-b-[3px] border-dashed border-[#2d2d2d] dark:border-[#FF4D00] pb-5 sm:pb-6 mb-7 sm:mb-8">
          <div>
            <p className="font-sans text-sm sm:text-base text-[#2d5da1] dark:text-[#FF4D00] mb-1">
              Full Mission Suite · NASA STD-3001 Clinical Architecture
            </p>
            <h2
              id="features-heading"
              className="font-display font-bold text-3xl sm:text-4xl md:text-5xl leading-tight"
            >
              Inside the AuraMed App
            </h2>
          </div>
          <p className="font-sans text-base sm:text-lg max-w-md text-[#2d2d2d]/85 dark:text-white/85 leading-relaxed">
            Built for astronauts crossing 20+ minute Earth–Mars signal delays—combining
            self-assessment, 14-organ triage, offline AI, and mental resilience.
          </p>
        </div>

        {/* Category Filter Tabs + Visual Triage Legend */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 sm:gap-4 mb-8">
          <div
            className="flex flex-wrap items-center gap-2 sm:gap-2.5"
            role="group"
            aria-label="Filter AuraMed app modules"
          >
            {FEATURE_CATEGORIES.map((cat) => {
              const isActive = cat.id === activeCategory;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  aria-pressed={isActive}
                  style={getWobblyBorderStyle('wobblySm')}
                  className={`h-10 sm:h-11 px-3 sm:px-3.5 font-sans text-sm border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] sketch-btn cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#ff4d4d] dark:bg-[#FF4D00] text-white dark:text-black font-bold'
                      : 'bg-white dark:bg-black text-[#2d2d2d] dark:text-white hover:bg-[#fff9c4] dark:hover:bg-[#FF4D00]/20'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* 3-Color Atlas Risk Legend */}
          <div
            style={getWobblyBorderStyle('wobblyTag')}
            className="inline-flex flex-wrap items-center gap-x-3 gap-y-1.5 bg-[#fdfbf7] dark:bg-[#0c0c10] border-2 border-dashed border-[#2d2d2d] dark:border-[#FF4D00]/70 px-3.5 py-2 font-sans text-xs sm:text-sm self-start xl:self-auto whitespace-nowrap"
          >
            <span className="font-bold text-[#2d5da1] dark:text-[#FF4D00]">
              Atlas Triage:
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#2d2d2d] dark:border-white" />
              Green · Nominal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-[#2d2d2d] dark:border-white" />
              Yellow · Action
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d4d] border border-[#2d2d2d] dark:border-white" />
              Red · Surgeon
            </span>
          </div>
        </div>

        {/* Interactive Feature Modules Grid */}
        <div
          data-testid="app-features-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7"
        >
          {visibleFeatures.map((feature, idx) => {
            const Icon = FEATURE_ICONS[feature.id] ?? Activity;
            return (
              <article
                key={feature.id}
                style={getWobblyBorderStyle(idx % 2 === 0 ? 'wobblyMd' : 'wobblyAlt')}
                className={`relative border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] ${feature.cardBg} ${feature.tilt} hover:rotate-0 transition-transform duration-150 sketch-shadow p-5 sm:p-6 flex flex-col justify-between`}
              >
                {idx === 0 && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <TapeStrip />
                  </div>
                )}
                {idx === 3 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <ThumbtackPin />
                  </div>
                )}

                <div>
                  {/* Card Top Row */}
                  <div className="flex items-center justify-between gap-2 mb-4 pt-1">
                    <div className="flex items-center gap-2.5">
                      <span
                        style={getWobblyBorderStyle('wobblyCircle')}
                        className="w-10 h-10 shrink-0 flex items-center justify-center bg-[#ff4d4d] dark:bg-[#FF4D00] text-white dark:text-black border-2 border-[#2d2d2d] dark:border-white"
                      >
                        <Icon className="w-5 h-5" strokeWidth={2.3} aria-hidden="true" />
                      </span>
                      <span className="font-display font-bold text-base text-[#2d5da1] dark:text-[#FF4D00]">
                        #{feature.index}
                      </span>
                    </div>
                    <span
                      style={getWobblyBorderStyle('wobblyTag')}
                      className="bg-white dark:bg-black text-[#2d2d2d] dark:text-[#FF4D00] border-2 border-[#2d2d2d] dark:border-[#FF4D00] px-2.5 py-0.5 font-sans text-xs font-bold whitespace-nowrap"
                    >
                      {feature.badge}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="font-display font-bold text-xl sm:text-2xl leading-snug text-[#2d2d2d] dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="font-sans text-xs sm:text-sm font-bold text-[#2d5da1] dark:text-[#FF4D00] mt-0.5 mb-2.5">
                    {feature.subtitle}
                  </p>

                  {/* Concise Description */}
                  <p className="font-sans text-sm sm:text-base leading-relaxed text-[#2d2d2d]/85 dark:text-white/85 mb-4">
                    {feature.description}
                  </p>

                  {/* Key Highlights */}
                  <ul className="space-y-1.5 mb-5">
                    {feature.highlights.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2 font-sans text-xs sm:text-sm text-[#2d2d2d] dark:text-white/90 leading-snug"
                      >
                        <CheckCircle2
                          className="w-4 h-4 shrink-0 text-[#ff4d4d] dark:text-[#FF4D00] mt-0.5"
                          strokeWidth={2.4}
                          aria-hidden="true"
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Metric Footer Strip */}
                <div className="border-t-2 border-dashed border-[#2d2d2d]/35 dark:border-white/25 pt-3 flex items-center justify-between gap-2 font-sans">
                  <span className="text-xs sm:text-sm text-[#2d2d2d]/75 dark:text-white/75">
                    {feature.metricLabel}
                  </span>
                  <span className="font-display font-bold text-base sm:text-lg text-[#ff4d4d] dark:text-[#FF4D00] tabular-nums">
                    {feature.metricValue}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
