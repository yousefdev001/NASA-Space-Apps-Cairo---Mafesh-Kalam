import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useAuraMedGsap(
  scopeRef: RefObject<HTMLElement | null>,
  ready: boolean = true
) {
  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope || !ready) {
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      // Hero pro entrance timeline synchronized with loader completion
      const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      heroTl
        .from('[data-gsap="hero-kicker"]', {
          y: 18,
          opacity: 0,
          duration: 0.4,
          clearProps: 'transform,opacity',
        })
        .from(
          '[data-gsap="hero-title"]',
          {
            y: 34,
            opacity: 0,
            duration: 0.65,
            clearProps: 'transform,opacity',
          },
          '-=0.22'
        )
        .from(
          '[data-gsap="hero-bang"]',
          {
            scale: 0.2,
            rotation: -35,
            opacity: 0,
            duration: 0.55,
            ease: 'back.out(2.2)',
            clearProps: 'transform,opacity',
          },
          '-=0.35'
        )
        .from(
          '[data-gsap="hero-meta"]',
          {
            y: 22,
            opacity: 0,
            duration: 0.45,
            clearProps: 'transform,opacity',
          },
          '-=0.38'
        )
        .from(
          '[data-gsap="hero-stat"]',
          {
            y: 26,
            scale: 0.88,
            opacity: 0,
            duration: 0.48,
            stagger: 0.08,
            ease: 'back.out(1.6)',
            clearProps: 'transform,opacity',
          },
          '-=0.3'
        );

      // Hand-drawn arrow SVG stroke draw animation in Hero
      const arrowPath = scope.querySelector<SVGPathElement>('[data-gsap="hero-arrow-path"]');
      if (arrowPath) {
        const len = arrowPath.getTotalLength();
        gsap.set(arrowPath, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(arrowPath, {
          strokeDashoffset: 0,
          duration: 0.85,
          delay: 0.25,
          ease: 'power2.out',
          clearProps: 'strokeDasharray,strokeDashoffset',
        });
      }

      // Scroll-linked top progress sketch bar
      const progressBar = scope.querySelector<HTMLElement>('[data-gsap="scroll-progress"]');
      if (progressBar) {
        gsap.fromTo(
          progressBar,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: scope,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.2,
            },
          }
        );
      }

      // Scroll-triggered section reveals
      gsap.utils.toArray<HTMLElement>('[data-gsap="reveal"]').forEach((el) => {
        gsap.from(el, {
          y: 34,
          opacity: 0,
          duration: 0.62,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: el,
            start: 'top 86%',
            once: true,
          },
        });
      });

      // Squiggly connector draw on scroll in #protocols
      const squiggle = scope.querySelector<SVGPathElement>('[data-gsap="squiggle-path"]');
      if (squiggle) {
        const len = squiggle.getTotalLength();
        gsap.set(squiggle, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(squiggle, {
          strokeDashoffset: 0,
          duration: 1.1,
          ease: 'power2.out',
          clearProps: 'strokeDasharray,strokeDashoffset',
          scrollTrigger: {
            trigger: squiggle,
            start: 'top 85%',
            once: true,
          },
        });
      }

      // Staggered protocol step badges
      const protocolCards = gsap.utils.toArray<HTMLElement>('[data-gsap="protocol-card"]');
      if (protocolCards.length > 0) {
        gsap.from(protocolCards, {
          scale: 0.6,
          rotation: -18,
          opacity: 0,
          duration: 0.55,
          stagger: 0.14,
          ease: 'back.out(1.8)',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: protocolCards[0],
            start: 'top 86%',
            once: true,
          },
        });
      }

      // Service rows playful tilted slide-in on scroll
      const serviceRows = gsap.utils.toArray<HTMLElement>('[data-gsap="service-row"]');
      if (serviceRows.length > 0) {
        gsap.from(serviceRows, {
          x: -28,
          y: 16,
          opacity: 0,
          duration: 0.52,
          stagger: 0.1,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: serviceRows[0],
            start: 'top 85%',
            once: true,
          },
        });
      }
    }, scope);

    return () => {
      ctx.revert();
    };
  }, [scopeRef, ready]);
}
