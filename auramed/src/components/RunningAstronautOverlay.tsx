import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createAstronautWalkTimeline } from '../utils/astronautWalk';
import { computeRunnerTimeScale } from '../utils/loaderConfig';
import { AstronautRunnerArt } from './AstronautRunnerArt';

gsap.registerPlugin(ScrollTrigger);

export function RunningAstronautOverlay() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const runnerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    const runner = runnerRef.current;
    const svg = svgRef.current;
    if (!track || !runner || !svg) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      // Calm, unhurried lunar walk gait (1.28s per full left+right stride cycle)
      const walkTl = createAstronautWalkTimeline(svg, 0.32);

      const getEndX = () => (typeof window !== 'undefined' ? window.innerWidth + 80 : 1520);

      // Gentle stroll across the bottom of the screen (~32s)
      const strollTl = gsap.fromTo(
        runner,
        { x: -76 },
        {
          x: getEndX,
          duration: 32,
          repeat: -1,
          ease: 'none',
          repeatRefresh: true,
        }
      );

      // Subtle, smooth walking pace response on active scroll
      let resetTimer: number | undefined;
      ScrollTrigger.create({
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const boost = computeRunnerTimeScale(self.getVelocity());
          gsap.to([walkTl, strollTl], {
            timeScale: boost,
            duration: 0.35,
            overwrite: true,
          });
          if (resetTimer) window.clearTimeout(resetTimer);
          resetTimer = window.setTimeout(() => {
            gsap.to([walkTl, strollTl], {
              timeScale: 1,
              duration: 0.75,
              ease: 'power2.out',
            });
          }, 260);
        },
      });
    }, track);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={trackRef}
      data-testid="running-astronaut-overlay"
      aria-hidden="true"
      className="fixed bottom-0.5 left-0 right-0 h-16 sm:h-[72px] z-30 pointer-events-none overflow-hidden select-none"
    >
      <div
        ref={runnerRef}
        className="absolute bottom-0 left-0 w-14 h-12 sm:w-16 sm:h-14 will-change-transform"
      >
        <AstronautRunnerArt ref={svgRef} className="w-full h-full drop-shadow-none" />
      </div>
    </div>
  );
}
