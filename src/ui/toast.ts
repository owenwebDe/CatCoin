import { gsap } from './gsap';

let hideCall: gsap.core.Tween | null = null;

export function showToast(text: string): void {
  const el = document.getElementById('toast');
  if (!el) return;
  const label = el.querySelector('.toast__text');
  if (label) label.textContent = text;
  hideCall?.kill();
  gsap.killTweensOf(el);
  gsap.fromTo(
    el,
    { autoAlpha: 0, y: 20, xPercent: -50, x: 0 },
    { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out' },
  );
  const check = el.querySelector<SVGPathElement>('svg path');
  if (check && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.fromTo(check, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.4, ease: 'power2.inOut', delay: 0.1 });
  }
  hideCall = gsap.delayedCall(2.2, () => {
    gsap.to(el, { autoAlpha: 0, y: 20, duration: 0.4, ease: 'expo.out' });
  });
}
