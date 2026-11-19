import { gsap, ScrollTrigger } from './gsap';

/**
 * Hand-authored icon family: 24x24 viewBox, 1.5 stroke, round caps/joins, no fill.
 * Every icon has an Enter (DrawSVG) and a Hover/tap micro-animation.
 */
const SVG_ATTRS =
  'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';

export const PATHS = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  copyFront: 'M5.5 8h9A1.5 1.5 0 0 1 16 9.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 18.5v-9A1.5 1.5 0 0 1 5.5 8z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M12 12h0M18 6L6 18',
};

const ICONS: Record<string, string> = {
  copy: `<path class="i-back" d="M8 8V5.5A1.5 1.5 0 0 1 9.5 4h9A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H16"/><path class="i-front" d="${PATHS.copyFront}"/>`,
  check: `<path class="i-check" d="${PATHS.check}"/>`,
  wallet: `<path class="i-body" d="M4 8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5v10a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path class="i-flap" d="M5.5 7l9.7-2.9a1 1 0 0 1 1.3 1V7"/><path class="i-clasp" d="M20 11.5h-3.5a1.75 1.75 0 0 0 0 3.5H20"/>`,
  coin: `<g class="i-coin"><circle cx="12" cy="12" r="8.25"/><circle cx="12" cy="12" r="5.5"/><path d="M14.3 10.1a2.9 2.9 0 1 0 0 3.8"/></g>`,
  swap: `<path class="i-a1" d="M4 8.5h14.5M15 5l3.5 3.5L15 12"/><path class="i-a2" d="M20 15.5H5.5M9 12l-3.5 3.5L9 19"/>`,
  cateye: `<g class="i-eye"><path class="i-outline" d="M2.5 12C5.5 7.2 8.8 5 12 5s6.5 2.2 9.5 7c-3 4.8-6.3 7-9.5 7s-6.5-2.2-9.5-7z"/><path class="i-pupil" d="M12 8.2c1.2 1.3 1.2 6.3 0 7.6c-1.2-1.3-1.2-6.3 0-7.6z"/></g>`,
  x: `<path class="i-s1" d="M5 5l14 14"/><path class="i-s2" d="M19 5L5 19"/>`,
  plane: `<g class="i-plane"><path d="M20.5 3.5L3.5 10.3l6.3 2.4 2.4 6.3z"/><path d="M9.8 12.7l4.4-4.4"/></g>`,
  chart: `<path class="i-axis" d="M3.5 20.5h17"/><path class="i-line" d="M3.5 16.5l5-5 4 3 7.5-8"/><circle class="i-dot" cx="3.5" cy="16.5" r="1.4"/>`,
  arrow: `<path class="i-arrow" d="M5 12h14M14 7l5 5-5 5"/>`,
  menu: `<path class="i-menu" d="${PATHS.menu}"/>`,
};

const SCROLLCUE = `<svg viewBox="0 0 2 40" fill="none" aria-hidden="true" focusable="false"><line x1="1" y1="0" x2="1" y2="40" stroke="rgba(246,213,142,0.14)" stroke-width="1"/><line class="i-seg" x1="1" y1="0" x2="1" y2="12" stroke="#E8B04B" stroke-width="1"/></svg>`;

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function drawables(svg: Element) {
  return Array.from(svg.querySelectorAll<SVGGeometryElement>('path, circle, line, rect')).filter(
    (el) => !el.classList.contains('i-dot') && !el.classList.contains('i-seg'),
  );
}

type Hover = (svg: SVGSVGElement) => void;

const busy = new WeakSet<Element>();
function once(svg: SVGSVGElement, build: () => gsap.core.Timeline) {
  if (busy.has(svg)) return;
  busy.add(svg);
  build().eventCallback('onComplete', () => busy.delete(svg));
}

const HOVERS: Record<string, Hover> = {
  copy: (svg) =>
    once(svg, () =>
      gsap.timeline().to(svg.querySelector('.i-back'), { x: 2, y: -2, duration: 0.25, ease: 'power2.out' }).to(svg.querySelector('.i-back'), { x: 0, y: 0, duration: 0.35, ease: 'power2.inOut' }),
    ),
  check: (svg) =>
    once(svg, () => gsap.timeline().fromTo(svg.querySelector('.i-check'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.4, ease: 'power2.inOut' })),
  wallet: (svg) =>
    once(svg, () =>
      gsap
        .timeline()
        .to(svg.querySelector('.i-flap'), { rotation: -18, svgOrigin: '16.5 7', duration: 0.3, ease: 'power2.out' })
        .to(svg.querySelector('.i-flap'), { rotation: 0, svgOrigin: '16.5 7', duration: 0.3, ease: 'power2.in' }),
    ),
  coin: (svg) =>
    once(svg, () =>
      gsap
        .timeline()
        .to(svg.querySelector('.i-coin'), { scaleX: 0, svgOrigin: '12 12', duration: 0.35, ease: 'power1.in' })
        .to(svg.querySelector('.i-coin'), { scaleX: 1, svgOrigin: '12 12', duration: 0.35, ease: 'power1.out' }),
    ),
  swap: (svg) =>
    once(svg, () =>
      gsap
        .timeline({ defaults: { duration: 0.28, ease: 'power2.inOut' } })
        .to(svg.querySelector('.i-a1'), { x: 3 }, 0)
        .to(svg.querySelector('.i-a2'), { x: -3 }, 0)
        .to(svg.querySelector('.i-a1'), { x: 0 }, 0.3)
        .to(svg.querySelector('.i-a2'), { x: 0 }, 0.3),
    ),
  cateye: (svg) => once(svg, () => catEyeBlink(svg)),
  x: (svg) =>
    once(svg, () =>
      gsap
        .timeline()
        .fromTo(svg.querySelectorAll('.i-s1, .i-s2'), { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 0.6, ease: 'power2.inOut', stagger: 0.06 }),
    ),
  plane: (svg) =>
    once(svg, () =>
      gsap
        .timeline()
        .to(svg.querySelector('.i-plane'), { x: 4, y: -4, rotation: -8, svgOrigin: '12 12', duration: 0.3, ease: 'power2.out' })
        .to(svg.querySelector('.i-plane'), { x: 0, y: 0, rotation: 0, svgOrigin: '12 12', duration: 0.35, ease: 'power2.inOut' }),
    ),
  chart: (svg) => {
    const line = svg.querySelector<SVGPathElement>('.i-line');
    const dot = svg.querySelector<SVGCircleElement>('.i-dot');
    if (!line || !dot) return;
    once(svg, () =>
      gsap
        .timeline()
        .fromTo(line, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.7, ease: 'power2.inOut' }, 0)
        .fromTo(
          dot,
          { x: 0, y: 0 },
          { motionPath: { path: line, align: line, alignOrigin: [0.5, 0.5] }, duration: 0.7, ease: 'power2.inOut' },
          0,
        ),
    );
  },
  arrow: (svg) =>
    once(svg, () =>
      gsap
        .timeline()
        .to(svg.querySelector('.i-arrow'), { x: 4, duration: 0.3, ease: 'power2.out' })
        .to(svg.querySelector('.i-arrow'), { x: 0, duration: 0.3, ease: 'power2.inOut' }),
    ),
};

export function catEyeBlink(svg: Element): gsap.core.Timeline {
  const eye = svg.querySelector('.i-eye');
  const pupil = svg.querySelector('.i-pupil');
  return gsap
    .timeline()
    .to(pupil, { scaleX: 0.4, svgOrigin: '12 12', duration: 0.25, ease: 'power2.inOut' })
    .to(pupil, { scaleX: 1, svgOrigin: '12 12', duration: 0.25, ease: 'power2.inOut' })
    .to(eye, { scaleY: 0.1, svgOrigin: '12 12', duration: 0.09, ease: 'power2.in' }, 0.12)
    .to(eye, { scaleY: 1, svgOrigin: '12 12', duration: 0.12, ease: 'power2.out' }, 0.21);
}

/** Inject SVG markup for every [data-icon]. Called synchronously at boot. */
export function mountIcons(): void {
  document.querySelectorAll<HTMLElement>('[data-icon]').forEach((host) => {
    const name = host.dataset.icon!;
    if (name === 'scrollcue') {
      host.innerHTML = SCROLLCUE;
      return;
    }
    const inner = ICONS[name];
    if (!inner) throw new Error(`Unknown icon: ${name}`);
    host.innerHTML = `<svg ${SVG_ATTRS} class="i i--${name}">${inner}</svg>`;
    if (name === 'chart') {
      // Dot sits at the line's end at rest.
      gsap.set(host.querySelector('.i-dot'), { x: 16.5, y: -10 });
    }
  });

  if (reduced()) return;

  // Enter states hidden until armed
  document.querySelectorAll<HTMLElement>('[data-icon]').forEach((host) => {
    if (host.hasAttribute('data-icon-manual') || host.dataset.icon === 'scrollcue') return;
    const svg = host.querySelector('svg');
    if (svg) gsap.set(drawables(svg), { drawSVG: '0%' });
    if (host.dataset.icon === 'chart') gsap.set(host.querySelector('.i-dot'), { autoAlpha: 0 });
  });

  // Hover / tap bindings
  document.querySelectorAll<HTMLElement>('[data-icon]').forEach((host) => {
    const name = host.dataset.icon!;
    const fn = HOVERS[name];
    if (!fn || host.hasAttribute('data-icon-manual')) return;
    const svg = host.querySelector('svg') as SVGSVGElement;
    const target = host.closest<HTMLElement>('[data-icon-host], a, button, .glass-card') ?? host;
    const run = () => fn(svg);
    target.addEventListener('mouseenter', run);
    target.addEventListener('touchstart', run, { passive: true });
  });
}

/** Arm the one-shot Enter draw for all icons (called after the loader leaves). */
export function armIconEnters(): void {
  if (reduced()) return;
  document.querySelectorAll<HTMLElement>('[data-icon]').forEach((host) => {
    if (host.hasAttribute('data-icon-manual') || host.dataset.icon === 'scrollcue') return;
    const svg = host.querySelector('svg');
    if (!svg) return;
    ScrollTrigger.create({
      trigger: host,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to(drawables(svg), { drawSVG: '100%', duration: 0.9, ease: 'power2.inOut', stagger: 0.08 });
        if (host.dataset.icon === 'chart') gsap.to(host.querySelector('.i-dot'), { autoAlpha: 1, duration: 0.3, delay: 0.7 });
      },
    });
  });

  // ScrollCue: gold segment loops top -> bottom every 1600ms
  document.querySelectorAll('.i-seg').forEach((seg) => {
    gsap.fromTo(seg, { y: -12 }, { y: 40, duration: 1.6, ease: 'power2.inOut', repeat: -1 });
  });
}
