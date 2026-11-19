import { gsap, ScrollTrigger } from '../ui/gsap';

/** Every animated scene value. Interpolated by the master scroll timeline. */
export interface SceneState {
  coinX: number;
  coinY: number;
  coinZ: number;
  coinScale: number;
  coinRough: number;
  spin: number;
  dogScale: number;
  pAlpha: number;
  disperse: number;
  form: number;
  emblemZ: number;
  ambient: number;
  camX: number;
  camY: number;
  camZ: number;
}

/** State A: Throne */
export const STATE_A: SceneState = {
  coinX: 0,
  coinY: 0,
  coinZ: 0,
  coinScale: 1,
  coinRough: 0.26,
  spin: 0,
  dogScale: 0,
  pAlpha: 0,
  disperse: 0,
  form: 0,
  emblemZ: 0,
  ambient: 0,
  camX: 0,
  camY: 0,
  camZ: 6,
};

export interface Marks {
  dogStart: number;
  dogEnd: number;
  rebStart: number;
  rebEnd: number;
  ambEnd: number;
}

/** Read page positions (0..1 of total scroll) from the pin ScrollTriggers. */
export function readMarks(): Marks {
  const max = Math.max(1, ScrollTrigger.maxScroll(window));
  const vh = window.innerHeight;
  const dog = ScrollTrigger.getById('dogEra');
  const reb = ScrollTrigger.getById('rebellion');
  const sectionTop = (sel: string) => {
    const el = document.querySelector<HTMLElement>(sel);
    return el ? el.getBoundingClientRect().top + window.scrollY : 0;
  };
  // Without pins (reduced motion) fall back to the sections' own extents.
  const dogStart = dog ? dog.start : sectionTop('#dog-era');
  const dogEnd = dog ? dog.end : dogStart + vh;
  const rebStart = reb ? reb.start : sectionTop('#manifesto');
  const rebEnd = reb ? reb.end : rebStart + vh;
  const ambEnd = rebEnd + vh * 0.8;
  const f = (v: number) => Math.min(1, Math.max(0, v / max));
  return { dogStart: f(dogStart), dogEnd: f(dogEnd), rebStart: f(rebStart), rebEnd: f(rebEnd), ambEnd: f(ambEnd) };
}

/**
 * Master timeline. Duration 1 == whole document; keys placed at the measured section fractions.
 * States: A Throne -> B Dog Era -> C Shatter -> D Rebellion -> E Return -> F Ambient.
 */
export function buildStateTimeline(state: SceneState, m: Marks, mobile: boolean) {
  Object.assign(state, STATE_A);
  // Portrait phones: lift the hero coin above the headline so text never sits on bright gold.
  if (mobile) Object.assign(state, { coinY: 1.15, coinScale: 0.78 });
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  const dogLen = Math.max(0.0001, m.dogEnd - m.dogStart);
  const rebLen = Math.max(0.0001, m.rebEnd - m.rebStart);
  const ambLen = Math.max(0.0001, m.ambEnd - m.rebEnd);

  // A -> B: CatCoin recedes and dims, camera pulls back (hero scroll into DogEra pin 0-30%)
  const abStart = m.dogStart * 0.3;
  tl.to(
    state,
    { coinY: 0.2, coinZ: -2.5, coinScale: 0.6, coinRough: 0.5, camY: 0.4, camZ: 7.5, duration: m.dogStart + dogLen * 0.3 - abStart },
    abStart,
  );
  // B: dog coins grow in (DogEra pin 0-60%)
  tl.to(state, { dogScale: 0.55, duration: dogLen * 0.6 }, m.dogStart);

  // C: shatter (DogEra pin 60-100%)
  const c0 = m.dogStart + dogLen * 0.6;
  tl.to(state, { dogScale: 0, duration: dogLen * 0.2 }, c0);
  tl.to(state, { pAlpha: 1, duration: dogLen * 0.06 }, c0);
  tl.to(state, { disperse: 1, camZ: 6.8, duration: dogLen * 0.4 }, c0);

  // D: cat-eye forms (Rebellion pin 0-70%)
  tl.to(state, { form: 1, camY: 0, camZ: 6, duration: rebLen * 0.7 }, m.rebStart);

  // E: CatCoin returns (Rebellion pin 70-100%)
  tl.to(
    state,
    {
      coinX: 0,
      coinY: 0,
      coinZ: 0.5,
      coinScale: 1.15,
      coinRough: 0.26,
      spin: Math.PI * 2,
      pAlpha: 0.25,
      emblemZ: -3,
      duration: rebLen * 0.3,
    },
    m.rebStart + rebLen * 0.7,
  );

  // F: ambient (CatsVsDogs -> Footer)
  tl.to(
    state,
    {
      coinX: mobile ? 0 : 2.6,
      coinY: mobile ? 2.2 : 1.3,
      coinZ: mobile ? -3 : -1.5,
      coinScale: 0.7,
      ambient: 1,
      pAlpha: 0.35,
      camZ: 9,
      duration: ambLen,
    },
    m.rebEnd,
  );

  tl.set({}, {}, 1);
  return tl;
}

/** Timeline progress that represents each still state (reduced motion). */
export function stillProgress(m: Marks) {
  const dogLen = m.dogEnd - m.dogStart;
  const rebLen = m.rebEnd - m.rebStart;
  return {
    A: 0,
    B: m.dogStart + dogLen * 0.6,
    D: m.rebStart + rebLen * 0.7,
    F: 1,
  };
}
