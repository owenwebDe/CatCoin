import { gsap } from './gsap';

const INTERACTIVE = 'a, button, [data-cursor], input, label';

/** Custom cursor: 10px dot + 36px ring (lerp 0.15). Desktop fine pointer only. */
export function initCursor(reduced: boolean) {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!fine.matches) return;
  const root = document.querySelector<HTMLElement>('.cursor');
  if (!root) return;
  const dot = root.querySelector<HTMLElement>('.cursor__dot')!;
  const ring = root.querySelector<HTMLElement>('.cursor__ring')!;
  document.documentElement.classList.add('has-cursor');
  root.classList.add('is-hidden');

  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { ...pos };
  const setDotX = gsap.quickSetter(dot, 'x', 'px');
  const setDotY = gsap.quickSetter(dot, 'y', 'px');
  const setRingX = gsap.quickSetter(ring, 'x', 'px');
  const setRingY = gsap.quickSetter(ring, 'y', 'px');

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      pos.x = e.clientX;
      pos.y = e.clientY;
      root.classList.remove('is-hidden');
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => root.classList.add('is-hidden'));
  document.addEventListener('pointerover', (e) => {
    const t = e.target as Element | null;
    root.classList.toggle('is-hover', !!t?.closest(INTERACTIVE));
  });

  gsap.ticker.add(() => {
    const k = reduced ? 1 : 0.15;
    ringPos.x += (pos.x - ringPos.x) * k;
    ringPos.y += (pos.y - ringPos.y) * k;
    setDotX(pos.x);
    setDotY(pos.y);
    setRingX(ringPos.x);
    setRingY(ringPos.y);
  });
}

/** Magnetic hover: moves toward the cursor up to 10px (strength 0.3), returns with elastic.out(1, 0.4). */
export function initMagnetic(reduced: boolean) {
  if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * 0.3;
      const dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
      const len = Math.hypot(dx, dy);
      const k = len > 10 ? 10 / len : 1;
      xTo(dx * k);
      yTo(dy * k);
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)', overwrite: true });
    });
  });
}

/** GlassCard pointer-follow highlight (CSS vars --mx / --my). */
export function initGlassHighlight() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll<HTMLElement>('.glass-card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}
