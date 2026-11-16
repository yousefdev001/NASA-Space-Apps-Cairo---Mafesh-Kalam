export interface LoaderStage {
  step: number;
  label: string;
}

export function shouldBypassLoader(
  searchString: string,
  reducedMotion: boolean
): boolean {
  if (reducedMotion) {
    return true;
  }
  if (!searchString) {
    return false;
  }
  const params = new URLSearchParams(searchString);
  return params.get('autostart') === '1';
}

export function getLoaderStage(progress: number): LoaderStage {
  const clamped = Math.max(0, Math.min(100, progress));
  if (clamped < 34) {
    return { step: 1, label: 'Sketching EVA Suit Layers' };
  }
  if (clamped < 68) {
    return { step: 2, label: 'Syncing 500Hz Cardiac Trace' };
  }
  if (clamped < 95) {
    return { step: 3, label: 'Calibrating NASA Orbital Rig' };
  }
  return { step: 4, label: 'Flight Deck Ready' };
}

export function computeRunnerTimeScale(scrollVelocityPx: number): number {
  const absVel = Math.abs(scrollVelocityPx);
  const boost = absVel / 1500;
  return Number(Math.max(1, Math.min(1.8, 1 + boost)).toFixed(2));
}

