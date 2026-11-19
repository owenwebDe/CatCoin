import { gsap } from './gsap';

type Part = 'env' | 'fonts' | 'compile';

const MIN_MS = 1200;
const MAX_MS = 6000;

/**
 * PageLoader. Progress = average of three real signals:
 *   env     - THREE.LoadingManager around RoomEnvironment / PMREM generation
 *   fonts   - document.fonts.ready
 *   compile - the GL scene's first compiled frame (renderer.compile)
 */
export function createLoader(reduced: boolean) {
  const root = document.getElementById('loader')!;
  const num = document.getElementById('loader-num')!;
  const svg = root.querySelector('svg')!;
  const strokes = svg.querySelectorAll('path');
  const parts: Record<Part, number> = { env: 0, fonts: 0, compile: 0 };
  const shown = { p: 0 };
  const start = performance.now();
  let resolveDone!: () => void;
  const done = new Promise<void>((r) => (resolveDone = r));
  let finished = false;

  gsap.set(strokes, { drawSVG: '0%' });

  const render = () => {
    num.textContent = String(Math.round(shown.p * 100)).padStart(3, '0');
    gsap.set(strokes, { drawSVG: `${shown.p * 100}%` });
  };

  const target = () => (parts.env + parts.fonts + parts.compile) / 3;

  const tick = () => {
    if (finished) return;
    const elapsed = performance.now() - start;
    let t = target();
    if (elapsed >= MAX_MS) t = 1; // force-complete
    // Ease the displayed value toward the real one, never ahead of the minimum-time line.
    const goal = Math.min(t, elapsed / MIN_MS);
    shown.p += (goal - shown.p) * 0.12;
    if (t >= 1 && elapsed >= MIN_MS && shown.p > 0.97) {
      shown.p = 1;
      finished = true;
      render();
      gsap.ticker.remove(tick);
      resolveDone();
      return;
    }
    render();
  };
  gsap.ticker.add(tick);

  return {
    set(part: Part, value: number) {
      parts[part] = Math.max(parts[part], Math.min(1, value));
    },
    done,
    /** Blink, then wipe up. Calls onReveal at 60% of the exit. */
    exit(onReveal: () => void): Promise<void> {
      return new Promise((resolve) => {
        const eye = svg.querySelector('.i-eye');
        const tl = gsap.timeline({
          onComplete: () => {
            root.style.display = 'none';
            resolve();
          },
        });
        if (!reduced) {
          tl.to(eye, { scaleY: 0.08, svgOrigin: '12 12', duration: 0.16, ease: 'power2.in' }).to(eye, {
            scaleY: 1,
            svgOrigin: '12 12',
            duration: 0.16,
            ease: 'power2.out',
          });
        }
        const exitDur = reduced ? 0.3 : 0.9;
        tl.fromTo(
          root,
          { clipPath: 'inset(0% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 100% 0%)', duration: exitDur, ease: 'expo.out' },
        );
        tl.call(onReveal, [], `-=${exitDur * 0.4}`);
      });
    },
  };
}
