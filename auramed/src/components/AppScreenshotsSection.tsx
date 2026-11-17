import { useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Brain,
  Download,
  Eye,
  Gamepad2,
  Maximize2,
  Smartphone,
  UserCheck,
  X,
} from 'lucide-react';
import { getWobblyBorderStyle } from '../styles/handDrawnTokens';
import { TapeStrip, ThumbtackPin } from './HandDrawnDecor';

export interface ScreenshotItem {
  id: string;
  number: string;
  title: string;
  arabicTitle: string;
  subtitle: string;
  category: 'telemetry' | 'training' | 'games' | 'profile';
  badge: string;
  src: string;
  description: string;
}

export const SCREENSHOTS: ScreenshotItem[] = [
  {
    id: 'vital-dashboard',
    number: '01',
    title: 'Vital Telemetry Dashboard',
    arabicTitle: 'لوحة القياسات الحيوية الحية',
    subtitle: 'Live 6-vital streaming & Astro-Bot AI assistant',
    category: 'telemetry',
    badge: 'Live Biometrics',
    src: '/screens/screen-1.jpeg',
    description:
      'Continuous biometric monitoring: Heart Rate, BP, SpO2, Core Temp, Respiration with Astro-Bot conversational AI recommendations.',
  },
  {
    id: 'body-atlas',
    number: '02',
    title: 'Interactive 2D Body Atlas',
    arabicTitle: 'أطلس الجسد التفاعلي 2D',
    subtitle: '14 physiological systems with 2.4× focal zoom & triage',
    category: 'telemetry',
    badge: 'NASA STD-3001',
    src: '/screens/screen-2.jpeg',
    description:
      'Tap any organ to zoom 2.4×, review NASA STD-3001 medical standards, live telemetry readings, and emergency clinical triage sheets.',
  },
  {
    id: 'organ-telemetry',
    number: '03',
    title: 'Organ Health Matrix',
    arabicTitle: 'مصفوفة صحة الأعضاء الفسيولوجية',
    subtitle: 'Heart, lungs, brain, liver & systemic status scan',
    category: 'telemetry',
    badge: 'Organ Analytics',
    src: '/screens/screen-3.jpeg',
    description:
      'Multi-organ telemetry dashboard indicating nominal status, EEG frequency, hydration levels, and systemic bio-scan percentages.',
  },
  {
    id: 'training-hub',
    number: '04',
    title: 'Astronaut Training & Games Hub',
    arabicTitle: 'أكاديمية التدريب والألعاب الفضائية',
    subtitle: 'Space Reflex, Alien Memory & Earth Time Capsule',
    category: 'training',
    badge: 'Neuro-Cognitive',
    src: '/screens/screen-4.jpeg',
    description:
      'Commander XP progression ladder, daily cognitive calibration games, and emotional resilience digital time capsules.',
  },
  {
    id: 'quests-overview',
    number: '05',
    title: 'Cognitive Quests & Missions',
    arabicTitle: 'المهام المعرفية ورفع الكفاءة الذهنية',
    subtitle: 'Daily mental resilience & XP progression ladder',
    category: 'training',
    badge: 'Mission XP',
    src: '/screens/screen-5.jpeg',
    description:
      'Track streak days, rank tiers (Bronze to Master Astronaut), and quick-launch neurological reflex and memory assessments.',
  },
  {
    id: 'alien-memory',
    number: '06',
    title: 'Alien Memory Campaign',
    arabicTitle: 'حملة الذاكرة الفضائية (100 قطاع)',
    subtitle: '100-stage visual recall sectors for deep space transit',
    category: 'games',
    badge: '100 Sectors',
    src: '/screens/screen-6.jpeg',
    description:
      'Cognitive recall training designed to counteract isolation and microgravity-induced cognitive slowdown across 100 tactical sectors.',
  },
  {
    id: 'space-reflex',
    number: '07',
    title: 'Deep Space Reflex Academy',
    arabicTitle: 'أكاديمية تدريب سرعة الاستجابة (HUD)',
    subtitle: 'Neural millisecond response trainer on Visor HUD',
    category: 'games',
    badge: 'Visor HUD',
    src: '/screens/screen-7.jpeg',
    description:
      'Real-time HUD visor reaction test recording response speeds in milliseconds (ms), 3-star rating benchmarks, and false start tracking.',
  },
  {
    id: 'memory-gameplay',
    number: '08',
    title: 'Memory Card Gameplay',
    arabicTitle: 'لعبة الذاكرة والربط المعرفي',
    subtitle: 'Tactical pattern recognition with space crew avatars',
    category: 'games',
    badge: 'Active Game',
    src: '/screens/screen-8.jpeg',
    description:
      'Match pairs of space exploration icons under timed pressure to sharpen memory retention and stress recovery in long missions.',
  },
  {
    id: 'astronaut-profile',
    number: '09',
    title: 'Crew Dossier & Telemetry Uplink',
    arabicTitle: 'ملف رائد الفضاء وإعدادات الاتصال',
    subtitle: 'Operational flight dossier, biometrics & server uplink',
    category: 'profile',
    badge: 'Flight Dossier',
    src: '/screens/screen-9.jpeg',
    description:
      'Astronaut biometric records (blood type, BMI, flight status), active mission deployment info, and ground station telemetry connection.',
  },
];

type CategoryFilter = 'all' | 'telemetry' | 'training' | 'games' | 'profile';

const CATEGORY_TABS: { id: CategoryFilter; label: string; icon: typeof Activity }[] = [
  { id: 'all', label: 'All Screens (9)', icon: Smartphone },
  { id: 'telemetry', label: 'Medical & Telemetry', icon: Activity },
  { id: 'training', label: 'Training & Quests', icon: Brain },
  { id: 'games', label: 'Space Mini-Games', icon: Gamepad2 },
  { id: 'profile', label: 'Astronaut Profile', icon: UserCheck },
];

export function AppScreenshotsSection() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const filteredScreens =
    selectedCategory === 'all'
      ? SCREENSHOTS
      : SCREENSHOTS.filter((s) => s.category === selectedCategory);

  const activeScreen = filteredScreens[activeIdx] || filteredScreens[0] || SCREENSHOTS[0];

  const handlePrev = () => {
    setActiveIdx((prev) => (prev > 0 ? prev - 1 : filteredScreens.length - 1));
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev < filteredScreens.length - 1 ? prev + 1 : 0));
  };

  return (
    <section
      id="screenshots"
      aria-labelledby="screenshots-heading"
      className="scroll-mt-24 py-16 sm:py-24 px-4 sm:px-6 text-[#2d2d2d] dark:text-white"
    >
      <div data-gsap="reveal" className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-[3px] border-dashed border-[#2d2d2d] dark:border-[#FF4D00] pb-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#fff9c4] dark:bg-[#18110c] text-[#2d2d2d] dark:text-[#FF4D00] border-2 border-[#2d2d2d] dark:border-[#FF4D00] px-3 py-1 font-sans text-xs sm:text-sm font-semibold mb-2">
              <Smartphone className="w-4 h-4 text-[#ff4d4d] dark:text-[#FF4D00]" />
              <span>AuraMed Android Mobile Cockpit · Live App Gallery</span>
            </div>
            <h2
              id="screenshots-heading"
              className="font-display font-bold text-3xl sm:text-4xl md:text-5xl leading-tight"
            >
              Real App Interface & Screens
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <a
              href="/AuraMed.apk"
              download="AuraMed.apk"
              style={getWobblyBorderStyle('wobblySm')}
              className="inline-flex items-center gap-2 h-11 sm:h-12 bg-[#2d5da1] dark:bg-[#FF4D00] text-white dark:text-black border-[3px] border-[#2d2d2d] dark:border-white px-5 font-sans font-bold text-base sm:text-lg hover:bg-[#ff4d4d] dark:hover:bg-white dark:hover:text-black sketch-btn cursor-pointer whitespace-nowrap shadow-md"
            >
              <Download className="w-5 h-5" strokeWidth={2.5} />
              <span>Download AuraMed APK (111 MB)</span>
            </a>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-8">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === selectedCategory;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(tab.id);
                  setActiveIdx(0);
                }}
                style={getWobblyBorderStyle('wobblySm')}
                className={`h-10 sm:h-11 px-3 sm:px-4 font-sans text-xs sm:text-sm border-[2.5px] border-[#2d2d2d] dark:border-[#FF4D00] flex items-center gap-2 cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#ff4d4d] dark:bg-[#FF4D00] text-white dark:text-black font-bold shadow-md'
                    : 'bg-white dark:bg-[#0c0c10] text-[#2d2d2d] dark:text-white hover:bg-[#fff9c4] dark:hover:bg-[#FF4D00]/20'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Device Showcase Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Realistic Device Mockup Frame */}
          <div className="lg:col-span-5 flex justify-center relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
              <TapeStrip />
            </div>

            {/* Smartphone Outer Shell */}
            <div
              style={getWobblyBorderStyle('wobblyMd')}
              className="relative w-full max-w-[320px] sm:max-w-[340px] bg-[#111625] border-[4px] border-[#2d2d2d] dark:border-[#FF4D00] p-3 pt-5 pb-6 rounded-[2.5rem] shadow-2xl sketch-shadow-lg"
            >
              {/* Speaker & Camera Notch */}
              <div className="w-24 h-4 bg-black/60 rounded-full mx-auto mb-3 flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400/80 animate-pulse" />
                <div className="w-8 h-1 rounded-full bg-white/20" />
              </div>

              {/* Screen Container */}
              <div className="relative overflow-hidden rounded-[1.75rem] bg-black border-2 border-white/10 aspect-[575/1280] group">
                <img
                  src={activeScreen.src}
                  alt={activeScreen.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                  onClick={() => setLightboxSrc(activeScreen.src)}
                />

                {/* Quick Expand Button Overlay */}
                <button
                  type="button"
                  onClick={() => setLightboxSrc(activeScreen.src)}
                  aria-label="View full resolution image"
                  className="absolute bottom-3 right-3 bg-black/70 hover:bg-[#ff4d4d] dark:hover:bg-[#FF4D00] text-white p-2 rounded-full border border-white/30 transition-colors shadow-lg cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Home Indicator Bar */}
              <div className="w-28 h-1 bg-white/30 rounded-full mx-auto mt-3" />
            </div>
          </div>

          {/* Right: Screen Details & Tactical Controller */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div
              style={getWobblyBorderStyle('wobblyMd')}
              className="bg-white dark:bg-[#0c0c10] border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] p-6 sm:p-8 sketch-shadow-lg relative"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <span
                  style={getWobblyBorderStyle('wobblyTag')}
                  className="bg-[#fff9c4] dark:bg-[#FF4D00] text-[#2d2d2d] dark:text-black border-2 border-[#2d2d2d] dark:border-white px-3 py-1 font-mono font-bold text-xs sm:text-sm"
                >
                  SCREEN {activeScreen.number} / 09 · {activeScreen.badge}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous screen"
                    style={getWobblyBorderStyle('wobblySm')}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-black text-[#2d2d2d] dark:text-white border-2 border-[#2d2d2d] dark:border-[#FF4D00] hover:bg-[#ff4d4d] hover:text-white dark:hover:bg-[#FF4D00] dark:hover:text-black sketch-btn cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next screen"
                    style={getWobblyBorderStyle('wobblySm')}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-black text-[#2d2d2d] dark:text-white border-2 border-[#2d2d2d] dark:border-[#FF4D00] hover:bg-[#ff4d4d] hover:text-white dark:hover:bg-[#FF4D00] dark:hover:text-black sketch-btn cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#2d2d2d] dark:text-white mb-1">
                {activeScreen.title}
              </h3>
              <p className="font-sans text-sm sm:text-base font-semibold text-[#2d5da1] dark:text-[#FF4D00] mb-3">
                {activeScreen.arabicTitle}
              </p>

              <p className="font-sans text-base text-[#2d2d2d]/85 dark:text-white/85 leading-relaxed mb-6">
                {activeScreen.description}
              </p>

              {/* Quick Spec Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t-2 border-dashed border-[#2d2d2d]/20 dark:border-[#FF4D00]/30 pt-4 mb-6">
                <div className="bg-[#fdfbf7] dark:bg-black/50 p-2.5 rounded border border-[#2d2d2d]/20 dark:border-white/10">
                  <span className="block text-xs text-[#2d2d2d]/60 dark:text-white/60">Module</span>
                  <span className="font-bold text-xs sm:text-sm">{activeScreen.badge}</span>
                </div>
                <div className="bg-[#fdfbf7] dark:bg-black/50 p-2.5 rounded border border-[#2d2d2d]/20 dark:border-white/10">
                  <span className="block text-xs text-[#2d2d2d]/60 dark:text-white/60">Format</span>
                  <span className="font-bold text-xs sm:text-sm">Native Android</span>
                </div>
                <div className="bg-[#fdfbf7] dark:bg-black/50 p-2.5 rounded border border-[#2d2d2d]/20 dark:border-white/10 col-span-2 sm:col-span-1">
                  <span className="block text-xs text-[#2d2d2d]/60 dark:text-white/60">Telemetry</span>
                  <span className="font-bold text-xs sm:text-sm">NASA STD-3001</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/AuraMed.apk"
                  download="AuraMed.apk"
                  style={getWobblyBorderStyle('wobbly')}
                  className="flex-1 sm:flex-initial h-11 sm:h-12 inline-flex items-center justify-center gap-2 bg-[#ff4d4d] dark:bg-[#FF4D00] text-white dark:text-black font-sans font-bold text-base px-6 border-[2.5px] border-[#2d2d2d] dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black sketch-btn cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>Download App (.APK)</span>
                </a>

                <button
                  type="button"
                  onClick={() => setLightboxSrc(activeScreen.src)}
                  style={getWobblyBorderStyle('wobblyAlt')}
                  className="h-11 sm:h-12 inline-flex items-center justify-center gap-2 bg-white dark:bg-black text-[#2d2d2d] dark:text-white font-sans text-base px-4 border-[2.5px] border-[#2d2d2d] dark:border-[#FF4D00] hover:bg-[#fff9c4] dark:hover:bg-[#FF4D00]/20 sketch-btn cursor-pointer whitespace-nowrap"
                >
                  <Eye className="w-4 h-4" />
                  <span>Inspect Full Size</span>
                </button>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div>
              <p className="font-sans text-xs uppercase tracking-wider text-[#2d2d2d]/70 dark:text-white/70 mb-2">
                Click any screen to view details:
              </p>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                {filteredScreens.map((screen, idx) => {
                  const isCur = idx === activeIdx;
                  return (
                    <button
                      key={screen.id}
                      type="button"
                      onClick={() => setActiveIdx(idx)}
                      style={getWobblyBorderStyle('wobblySm')}
                      className={`relative w-14 sm:w-16 aspect-[575/1280] shrink-0 overflow-hidden border-2 cursor-pointer transition-all ${
                        isCur
                          ? 'border-[#ff4d4d] dark:border-[#FF4D00] scale-105 shadow-md -translate-y-1'
                          : 'border-[#2d2d2d]/50 dark:border-white/30 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={screen.src}
                        alt={screen.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/80 text-white font-mono text-[9px] text-center py-0.5">
                        {screen.number}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxSrc(null)}
        >
          <div
            className="relative max-w-sm sm:max-w-md max-h-[92vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxSrc(null)}
              aria-label="Close full size view"
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white text-black font-bold flex items-center justify-center hover:bg-[#ff4d4d] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxSrc}
              alt="AuraMed App Full Screenshot"
              className="max-h-[85vh] w-auto rounded-2xl border-2 border-white/20 shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
}
