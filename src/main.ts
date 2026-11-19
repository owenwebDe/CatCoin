import './styles/reset.css';
import './styles/tokens.css';
import './styles/components.css';
import './styles/sections.css';
import 'lenis/dist/lenis.css';

import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './ui/gsap';
import { mountIcons, armIconEnters } from './ui/icons';
import { createLoader } from './ui/loader';
import { initHeader } from './ui/header';
import { initCursor, initMagnetic, initGlassHighlight } from './ui/cursor';
import { initContract } from './ui/contract';
import { initReveals, initPins, prepareHero } from './ui/reveals';
import { isReducedMotion } from './tokens';
import type { GLApi } from './gl/scene';

const reduced = isReducedMotion();
const params = new URLSearchParams(location.search);

function webgl2Available(): boolean {
  if (params.get('gl') === 'off') return false;
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

function boot() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  mountIcons();
  const loader = createLoader(reduced);

  // Single RAF: the GSAP ticker drives Lenis, ScrollTrigger and the WebGL render.
  let lenis: Lenis | null = null;
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9, anchors: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    lenis.stop(); // locked while the loader is up
  }
  gsap.ticker.lagSmoothing(0);

  initHeader(lenis, reduced);
  initCursor(reduced);
  initMagnetic(reduced);
  initGlassHighlight();
  initContract(reduced);
  initPins(reduced);
  initReveals(reduced);
  const hero = prepareHero(reduced);

  // (b) fonts
  document.fonts.ready.then(() => {
    loader.set('fonts', 1);
    ScrollTrigger.refresh();
  });

  // (a) env + (c) compile come from the deferred GL module
  let gl: GLApi | null = null;
  const canvas = document.getElementById('gl') as HTMLCanvasElement;
  if (webgl2Available()) {
    import('./gl/scene')
      .then(({ createGL }) =>
        createGL({
          canvas,
          reduced,
          onEnvProgress: (p) => loader.set('env', p),
          onCompiled: () => loader.set('compile', 1),
          onFail: fallback,
        }),
      )
      .then((api) => {
        gl = api;
      })
      .catch((err) => {
        console.error(err);
        fallback();
      });
  } else {
    fallback();
  }

  function fallback() {
    document.documentElement.classList.add('no-gl');
    loader.set('env', 1);
    loader.set('compile', 1);
  }

  loader.done.then(() =>
    loader.exit(() => {
      hero.play();
      gl?.intro();
      armIconEnters();
      lenis?.start();
      ScrollTrigger.refresh();
    }),
  );

  window.scrollTo(0, 0);
}

boot();
