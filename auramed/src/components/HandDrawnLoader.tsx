import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { getWobblyBorderStyle } from '../styles/handDrawnTokens';
import { createAstronautWalkTimeline } from '../utils/astronautWalk';
import { getLoaderStage, shouldBypassLoader } from '../utils/loaderConfig';
import { AstronautRunnerArt } from './AstronautRunnerArt';
import { TapeStrip } from './HandDrawnDecor';

interface HandDrawnLoaderProps {
  onComplete: () => void;
}

export function HandDrawnLoader({ onComplete }: HandDrawnLoaderProps) {
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return !shouldBypassLoader(window.location.search, reduced);
  });
  const [progress, setProgress] = useState<number>(0);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const runnerWrapRef = useRef<HTMLDivElement | null>(null);
  const runnerSvgRef = useRef<SVGSVGElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const ecgLineRef = useRef<SVGPathElement | null>(null);
  const completedRef = useRef<boolean>(false);

  const finishLoader = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    const overlay = overlayRef.current;
    if (!overlay) {
      setVisible(false);
      onComplete();
      return;
    }

    gsap.to(overlay, {
      yPercent: -102,
      rotate: -1.2,
      duration: 0.62,
      ease: 'power4.inOut',
      onComplete: () => {
        setVisible(false);
        onComplete();
      },
    });
  };

  useEffect(() => {
    if (!visible) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
      return;
    }

    const overlay = overlayRef.current;
    const svg = runnerSvgRef.current;
    if (!overlay || !svg) return;

    const ctx = gsap.context(() => {
      if (cardRef.current) {
        gsap.from(cardRef.current, {
          y: 26,
          scale: 0.94,
          rotate: -3,
          opacity: 0,
          duration: 0.45,
          ease: 'back.out(1.6)',
        });
      }

      // Smooth grounded lunar walk cycle
      createAstronautWalkTimeline(svg, 0.26);

      // Measure stage width so astronaut walks safely inside stage on every screen width
      if (runnerWrapRef.current && stageRef.current) {
        const stageWidth = stageRef.current.clientWidth || 320;
        const runnerWidth = runnerWrapRef.current.clientWidth || 96;
        const maxTravel = Math.max(90, stageWidth - runnerWidth - 20);
        gsap.fromTo(
          runnerWrapRef.current,
          { x: 6 },
          { x: maxTravel, duration: 1.85, ease: 'power1.inOut' }
        );
      }

      // Live ECG stroke draw
      if (ecgLineRef.current) {
        const len = ecgLineRef.current.getTotalLength();
        gsap.set(ecgLineRef.current, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(ecgLineRef.current, {
          strokeDashoffset: 0,
          duration: 1.55,
          ease: 'power2.out',
        });
      }

      // Progress tween (0 -> 100)
      const tracker = { val: 0 };
      gsap.to(tracker, {
        val: 100,
        duration: 1.85,
        ease: 'power2.inOut',
        onUpdate: () => {
          const pct = Math.round(tracker.val);
          setProgress(pct);
          if (fillRef.current) {
            fillRef.current.style.transform = `scaleX(${tracker.val / 100})`;
          }
        },
        onComplete: finishLoader,
      });
    }, overlay);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) {
    return null;
  }

  const stage = getLoaderStage(progress);

  return (
    <div
      ref={overlayRef}
      data-testid="auramed-loader"
      role="status"
      aria-live="polite"
      aria-label="Loading AuraMed Orbital Sketchbook"
      className="fixed inset-0 z-[100] paper-grain text-[#2d2d2d] dark:text-white flex flex-col items-center justify-center p-4 sm:p-6"
    >
      <div
        ref={cardRef}
        style={getWobblyBorderStyle('wobblyMd')}
        className="relative w-full max-w-lg bg-white dark:bg-[#0c0c10] border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] p-5 sm:p-8 sketch-shadow-lg -rotate-1"
      >
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <TapeStrip />
        </div>

        <div className="flex items-center justify-between gap-4 mb-3 sm:mb-4">
          <span className="font-display font-bold text-2xl sm:text-3xl text-[#2d2d2d] dark:text-white">
            AuraMed
          </span>
          <span
            style={getWobblyBorderStyle('wobblyTag')}
            className="bg-[#fff9c4] dark:bg-[#FF4D00] text-[#2d2d2d] dark:text-black border-2 border-[#2d2d2d] dark:border-white px-3 py-0.5 font-sans text-sm font-bold tabular-nums"
          >
            {progress}%
          </span>
        </div>

        {/* Sketchbook Runner Horizon Stage */}
        <div
          ref={stageRef}
          style={getWobblyBorderStyle('wobblySm')}
          className="relative h-36 sm:h-44 bg-[#fdfbf7] dark:bg-black border-2 border-dashed border-[#2d2d2d] dark:border-[#FF4D00]/70 overflow-hidden mb-4 sm:mb-5 px-3 sm:px-4"
        >
          {/* Floating background sketched stars + ECG horizon line */}
          <svg
            viewBox="0 0 400 160"
            fill="none"
            aria-hidden="true"
            className="absolute inset-0 w-full h-full opacity-45"
          >
            <path d="M 45 28 L 49 38 L 59 42 L 49 46 L 45 56 L 41 46 L 31 42 L 41 38 Z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M 330 22 L 333 29 L 340 32 L 333 35 L 330 42 L 327 35 L 320 32 L 327 29 Z" stroke="#ff4d4d" strokeWidth="1.8" />
            <circle cx="195" cy="26" r="3" fill="currentColor" />
            <path
              ref={ecgLineRef}
              d="M 16 132 L 95 132 L 112 118 L 124 144 L 138 96 L 152 146 L 166 122 L 180 132 L 384 132"
              stroke="#ff4d4d"
              className="dark:stroke-[#FF4D00]"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div
            ref={runnerWrapRef}
            className="absolute bottom-2.5 sm:bottom-3 left-0 z-10 w-24 h-20 sm:w-28 sm:h-24"
          >
            <AstronautRunnerArt ref={runnerSvgRef} className="w-full h-full" />
          </div>
        </div>

        {/* Handwritten Stage Label */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 font-sans text-sm sm:text-base">
          <span className="text-[#2d5da1] dark:text-[#FF4D00] font-bold">
            Step {stage.step} of 4 · {stage.label}
          </span>
          <span className="text-xs sm:text-sm opacity-75">LEO 408 km</span>
        </div>

        {/* Wobbly Sketch Progress Bar */}
        <div
          style={getWobblyBorderStyle('wobbly')}
          className="w-full h-5 bg-[#e5e0d8] dark:bg-black border-[3px] border-[#2d2d2d] dark:border-[#FF4D00] overflow-hidden p-0.5"
        >
          <div
            ref={fillRef}
            style={getWobblyBorderStyle('wobbly')}
            className="w-full h-full bg-[#ff4d4d] dark:bg-[#FF4D00] origin-left scale-x-0"
          />
        </div>
      </div>

      <button
        type="button"
        data-testid="skip-loader"
        onClick={finishLoader}
        style={getWobblyBorderStyle('wobbly')}
        className="mt-5 sm:mt-6 h-11 px-5 bg-white dark:bg-black text-[#2d2d2d] dark:text-white border-2 border-[#2d2d2d] dark:border-[#FF4D00] font-sans text-base hover:bg-[#fff9c4] dark:hover:bg-[#FF4D00] dark:hover:text-black sketch-btn cursor-pointer"
      >
        Skip Intro →
      </button>
    </div>
  );
}
