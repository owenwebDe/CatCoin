import { config, hasContract } from '../config';
import { gsap } from './gsap';
import { PATHS } from './icons';
import { showToast } from './toast';

export function initContract(reduced: boolean) {
  document.querySelectorAll<HTMLElement>('[data-contract]').forEach((bar) => {
    const btn = bar.querySelector<HTMLButtonElement>('.contract__copy')!;
    if (!hasContract()) {
      btn.disabled = true;
      return;
    }
    const svg = btn.querySelector('svg')!;
    const front = svg.querySelector<SVGPathElement>('.i-front')!;
    const back = svg.querySelector<SVGPathElement>('.i-back')!;
    let revert: gsap.core.Tween | null = null;

    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(config.CA);
      } catch {
        // Clipboard API blocked (insecure context / permissions): fall back to a hidden textarea.
        const ta = document.createElement('textarea');
        ta.value = config.CA;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      showToast('Contract address copied');
      revert?.kill();
      if (reduced) {
        front.setAttribute('d', PATHS.check);
        back.style.opacity = '0';
      } else {
        gsap.to(front, { morphSVG: PATHS.check, duration: 0.4, ease: 'power3.inOut' });
        gsap.to(back, { autoAlpha: 0, duration: 0.2 });
      }
      revert = gsap.delayedCall(2, () => {
        if (reduced) {
          front.setAttribute('d', PATHS.copyFront);
          back.style.opacity = '1';
        } else {
          gsap.to(front, { morphSVG: PATHS.copyFront, duration: 0.4, ease: 'power3.inOut' });
          gsap.to(back, { autoAlpha: 1, duration: 0.3, delay: 0.15 });
        }
      });
    });
  });
}
