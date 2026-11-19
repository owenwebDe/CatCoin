export type Tier = 'high' | 'low';

const params = new URLSearchParams(location.search);

export function isMobileDevice(): boolean {
  return window.matchMedia('(max-width: 767px)').matches || window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

/** Decide on load; FpsProbe may downgrade after the first 120 frames. */
export function initialTier(): Tier {
  const forced = params.get('tier');
  if (forced === 'low' || forced === 'high') return forced;
  if (isMobileDevice()) return 'low';
  if ((navigator.hardwareConcurrency ?? 8) <= 4) return 'low';
  return 'high';
}

export const tierSettings = {
  high: { bloom: true, particlesPerCoin: 2400, maxDpr: 2, octaves: 3 },
  low: { bloom: false, particlesPerCoin: 800, maxDpr: 1.25, octaves: 2 },
} as const;

/** Mobile is Tier LOW but keeps its own antialias/DPR rules from the renderer spec. */
export function maxDpr(tier: Tier, mobile: boolean): number {
  if (tier === 'low') return mobile ? Math.min(1.5, tierSettings.low.maxDpr) : tierSettings.low.maxDpr;
  return mobile ? 1.5 : 2;
}

/** Average FPS over the first 120 rendered frames (after a short warm-up). */
export class FpsProbe {
  private frames = 0;
  private start = 0;
  private warm = 0;
  done = false;
  constructor(private onResult: (fps: number) => void) {}
  tick(now: number) {
    if (this.done) return;
    if (this.warm < 20) {
      this.warm++;
      this.start = now;
      return;
    }
    this.frames++;
    if (this.frames >= 120) {
      this.done = true;
      this.onResult((this.frames * 1000) / (now - this.start));
    }
  }
}
