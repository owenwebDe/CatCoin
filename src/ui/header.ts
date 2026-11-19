import type Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';
import { PATHS } from './icons';

const OFFSET = -72;

export function scrollToTarget(lenis: Lenis | null, hash: string) {
  const el = hash === '#top' ? document.body : document.querySelector<HTMLElement>(hash);
  if (!el) return;
  if (lenis) {
    lenis.scrollTo(hash === '#top' ? 0 : el, { offset: OFFSET, duration: 1.4 });
  } else {
    const y = hash === '#top' ? 0 : el.getBoundingClientRect().top + window.scrollY + OFFSET;
    window.scrollTo({ top: y, behavior: 'auto' });
  }
}

export function initHeader(lenis: Lenis | null, reduced: boolean) {
  const header = document.getElementById('header')!;
  const menu = document.getElementById('menu')!;
  const btn = document.getElementById('menu-btn')!;
  const menuPath = btn.querySelector<SVGPathElement>('.i-menu')!;
  const links = menu.querySelectorAll<HTMLElement>('.menu__link');
  let open = false;

  // Scroll state: glass after 40px; hide when scrolling down past 160px; show on any upward scroll.
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const y = self.scroll();
      header.classList.toggle('is-scrolled', y > 40);
      if (open) return;
      if (self.direction === 1 && y > 160) header.classList.add('is-hidden');
      else if (self.direction === -1) header.classList.remove('is-hidden');
    },
  });
  // Keyboard users: never leave focus inside a hidden header
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  const setMenu = (next: boolean) => {
    open = next;
    btn.setAttribute('aria-expanded', String(next));
    btn.setAttribute('aria-label', next ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', next);
    menu.setAttribute('aria-hidden', String(!next));
    if (next) menu.removeAttribute('inert');
    else menu.setAttribute('inert', '');
    if (next) {
      header.classList.remove('is-hidden');
      lenis?.stop();
    } else lenis?.start();

    if (reduced) {
      menuPath.setAttribute('d', next ? PATHS.close : PATHS.menu);
      gsap.set(links, { y: 0, autoAlpha: 1 });
      return;
    }
    gsap.to(menuPath, { morphSVG: next ? PATHS.close : PATHS.menu, duration: 0.4, ease: 'power3.inOut' });
    if (next) {
      gsap.fromTo(
        links,
        { y: 40, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', stagger: 0.06, delay: 0.08 },
      );
    }
  };

  btn.addEventListener('click', () => setMenu(!open));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) {
      setMenu(false);
      btn.focus();
    }
  });
  window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => {
    if (e.matches && open) setMenu(false);
  });

  // Anchor links: Lenis scrollTo with offset -72, duration 1.4
  document.querySelectorAll<HTMLAnchorElement>('a[data-scroll-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href');
      if (!hash || !hash.startsWith('#')) return;
      e.preventDefault();
      e.stopPropagation(); // keep Lenis' own anchor handler from double-scrolling
      const wasOpen = open;
      if (wasOpen) setMenu(false);
      scrollToTarget(lenis, hash);
      if (hash !== '#top') history.replaceState(null, '', hash);
    });
  });
}
