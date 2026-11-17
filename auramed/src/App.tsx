/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppFeaturesSection } from './components/AppFeaturesSection';
import { AppScreenshotsSection } from './components/AppScreenshotsSection';
import { CtaFooter } from './components/CtaFooter';
import { DeploymentModal } from './components/DeploymentModal';
import { FloatingNav } from './components/FloatingNav';
import { HandDrawnLoader } from './components/HandDrawnLoader';
import { HeroSection } from './components/HeroSection';
import { OrbitalSceneSection } from './components/OrbitalSceneSection';
import { RunningAstronautOverlay } from './components/RunningAstronautOverlay';
import { ServiceList } from './components/ServiceList';
import { SkewedMarquee } from './components/SkewedMarquee';
import { TelemetryMatrix } from './components/TelemetryMatrix';
import { resolveNextTheme, type ThemeMode } from './styles/handDrawnTokens';
import { useAuraMedGsap } from './utils/gsapAnimations';

export default function App() {
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [loaderDone, setLoaderDone] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [theme]);

  useAuraMedGsap(rootRef, loaderDone);

  const handleToggleTheme = () => {
    setTheme((prev) => resolveNextTheme(prev));
  };

  const handleLoaderComplete = useCallback(() => {
    setLoaderDone(true);
  }, []);

  return (
    <div
      ref={rootRef}
      data-theme={theme}
      className="min-h-screen paper-grain text-[#2d2d2d] dark:text-white"
    >
      <HandDrawnLoader onComplete={handleLoaderComplete} />
      <FloatingNav onOpenBriefing={() => setBriefingOpen(true)} />
      <main>
        <HeroSection
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenBriefing={() => setBriefingOpen(true)}
        />
        <SkewedMarquee />
        <AppFeaturesSection />
        <AppScreenshotsSection />
        <OrbitalSceneSection />
        <TelemetryMatrix />
        <ServiceList />
        <CtaFooter
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenBriefing={() => setBriefingOpen(true)}
        />
      </main>
      <RunningAstronautOverlay />
      <DeploymentModal
        isOpen={briefingOpen}
        onClose={() => setBriefingOpen(false)}
      />
    </div>
  );
}
