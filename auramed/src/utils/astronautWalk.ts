import gsap from 'gsap';

/**
 * Creates a calm, 4-phase biomechanical walking cycle for AstronautRunnerArt.
 * All limb pivots use SVG user-space coordinates matching viewBox="0 0 180 150".
 */
export function createAstronautWalkTimeline(
  svg: SVGSVGElement,
  quarterDuration: number = 0.32
): gsap.core.Timeline {
  const body = svg.querySelector('[data-limb="body"]');
  const head = svg.querySelector('[data-limb="head"]');
  const legFront = svg.querySelector('[data-limb="legFront"]');
  const shinFront = svg.querySelector('[data-limb="shinFront"]');
  const legBack = svg.querySelector('[data-limb="legBack"]');
  const shinBack = svg.querySelector('[data-limb="shinBack"]');
  const armFront = svg.querySelector('[data-limb="armFront"]');
  const armBack = svg.querySelector('[data-limb="armBack"]');
  const dustTrail = svg.querySelector('[data-limb="dustTrail"]');
  const thruster = svg.querySelector('[data-limb="thrusterPuff"]');

  // Set initial contact pose (Phase 0)
  gsap.set(body, { y: 0.8, rotation: 1.5, svgOrigin: '90 80' });
  gsap.set(head, { rotation: -1, svgOrigin: '92 52' });
  gsap.set(legFront, { rotation: -17, svgOrigin: '94 95' });
  gsap.set(shinFront, { rotation: 4, svgOrigin: '94 113' });
  gsap.set(legBack, { rotation: 15, svgOrigin: '86 95' });
  gsap.set(shinBack, { rotation: 14, svgOrigin: '86 113' });
  gsap.set(armFront, { rotation: 12, svgOrigin: '97 66' });
  gsap.set(armBack, { rotation: -12, svgOrigin: '83 66' });

  const tl = gsap.timeline({ repeat: -1 });
  const q = quarterDuration;

  // Phase 1: Passing (Front stance carries weight, back knee lifts cleanly)
  tl.to(body, { y: -2.4, rotation: 2.5, svgOrigin: '90 80', duration: q, ease: 'sine.inOut' }, 0)
    .to(head, { rotation: -1.6, svgOrigin: '92 52', duration: q, ease: 'sine.inOut' }, 0)
    .to(legFront, { rotation: 0, svgOrigin: '94 95', duration: q, ease: 'sine.in' }, 0)
    .to(shinFront, { rotation: 2, svgOrigin: '94 113', duration: q, ease: 'sine.inOut' }, 0)
    .to(legBack, { rotation: -2, svgOrigin: '86 95', duration: q, ease: 'sine.in' }, 0)
    .to(shinBack, { rotation: 26, svgOrigin: '86 113', duration: q, ease: 'sine.out' }, 0)
    .to(armFront, { rotation: 0, svgOrigin: '97 66', duration: q, ease: 'sine.in' }, 0)
    .to(armBack, { rotation: 0, svgOrigin: '83 66', duration: q, ease: 'sine.in' }, 0);

  // Phase 2: Opposite contact (Back leg reaches forward, front leg trails)
  tl.to(body, { y: 0.8, rotation: 1.5, svgOrigin: '90 80', duration: q, ease: 'sine.inOut' }, q)
    .to(head, { rotation: -1, svgOrigin: '92 52', duration: q, ease: 'sine.inOut' }, q)
    .to(legFront, { rotation: 15, svgOrigin: '94 95', duration: q, ease: 'sine.out' }, q)
    .to(shinFront, { rotation: 14, svgOrigin: '94 113', duration: q, ease: 'sine.in' }, q)
    .to(legBack, { rotation: -17, svgOrigin: '86 95', duration: q, ease: 'sine.out' }, q)
    .to(shinBack, { rotation: 4, svgOrigin: '86 113', duration: q, ease: 'sine.in' }, q)
    .to(armFront, { rotation: -12, svgOrigin: '97 66', duration: q, ease: 'sine.out' }, q)
    .to(armBack, { rotation: 12, svgOrigin: '83 66', duration: q, ease: 'sine.out' }, q);

  // Phase 3: Passing (Back stance carries weight, front knee lifts cleanly)
  tl.to(body, { y: -2.4, rotation: 2.5, svgOrigin: '90 80', duration: q, ease: 'sine.inOut' }, q * 2)
    .to(head, { rotation: -1.6, svgOrigin: '92 52', duration: q, ease: 'sine.inOut' }, q * 2)
    .to(legFront, { rotation: -2, svgOrigin: '94 95', duration: q, ease: 'sine.in' }, q * 2)
    .to(shinFront, { rotation: 26, svgOrigin: '94 113', duration: q, ease: 'sine.out' }, q * 2)
    .to(legBack, { rotation: 0, svgOrigin: '86 95', duration: q, ease: 'sine.in' }, q * 2)
    .to(shinBack, { rotation: 2, svgOrigin: '86 113', duration: q, ease: 'sine.inOut' }, q * 2)
    .to(armFront, { rotation: 0, svgOrigin: '97 66', duration: q, ease: 'sine.in' }, q * 2)
    .to(armBack, { rotation: 0, svgOrigin: '83 66', duration: q, ease: 'sine.in' }, q * 2);

  // Phase 4: Return to initial contact pose
  tl.to(body, { y: 0.8, rotation: 1.5, svgOrigin: '90 80', duration: q, ease: 'sine.inOut' }, q * 3)
    .to(head, { rotation: -1, svgOrigin: '92 52', duration: q, ease: 'sine.inOut' }, q * 3)
    .to(legFront, { rotation: -17, svgOrigin: '94 95', duration: q, ease: 'sine.out' }, q * 3)
    .to(shinFront, { rotation: 4, svgOrigin: '94 113', duration: q, ease: 'sine.in' }, q * 3)
    .to(legBack, { rotation: 15, svgOrigin: '86 95', duration: q, ease: 'sine.out' }, q * 3)
    .to(shinBack, { rotation: 14, svgOrigin: '86 113', duration: q, ease: 'sine.in' }, q * 3)
    .to(armFront, { rotation: 12, svgOrigin: '97 66', duration: q, ease: 'sine.out' }, q * 3)
    .to(armBack, { rotation: -12, svgOrigin: '83 66', duration: q, ease: 'sine.out' }, q * 3);

  if (dustTrail) {
    tl.to(
      dustTrail,
      {
        x: -5,
        opacity: 0.25,
        scale: 0.82,
        duration: q * 2,
        repeat: 1,
        yoyo: true,
        ease: 'sine.inOut',
      },
      0
    );
  }

  if (thruster) {
    tl.to(
      thruster,
      {
        opacity: 0.3,
        scaleX: 0.7,
        duration: q * 2,
        repeat: 1,
        yoyo: true,
        ease: 'sine.inOut',
      },
      0
    );
  }

  return tl;
}
