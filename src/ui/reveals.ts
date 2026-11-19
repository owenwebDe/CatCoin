import { gsap, ScrollTrigger, SplitText } from './gsap';

const EXPO = 'expo.out';

function splitChars(el: HTMLElement) {
  const split = SplitText.create(el, {
    type: 'lines,chars',
    mask: 'lines',
    linesClass: 'line',
    charsClass: 'char',
  });
  if (el.classList.contains('gold-text')) el.classList.add('is-split');
  return split;
}

/** Hide hero elements up-front so the intro can play after the loader. */
export function prepareHero(reduced: boolean) {
  if (reduced) return { play: () => undefined };
  const lines = Array.from(document.querySelectorAll<HTMLElement>('.hero [data-split-chars]'));
  const splits = lines.map(splitChars);
  const chars = splits.flatMap((s) => s.chars);
  const fades = document.querySelectorAll('[data-hero-fade]');
  gsap.set(chars, { yPercent: 110, rotateX: -40, transformOrigin: '50% 100%' });
  gsap.set(fades, { autoAlpha: 0, y: 24 });
  return {
    play() {
      const tl = gsap.timeline();
      tl.to(chars, { yPercent: 0, rotateX: 0, duration: 1.1, ease: EXPO, stagger: 0.018 }, 0);
      tl.to(fades, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, 0.3);
      return tl;
    },
  };
}

export function initReveals(reduced: boolean) {
  if (reduced) {
    document.documentElement.classList.add('reduced');
    return;
  }

  // SectionHeading: eyebrow + H2 lines slide up in masks
  document.querySelectorAll<HTMLElement>('[data-heading]').forEach((head) => {
    const h2 = head.querySelector<HTMLElement>('.h2')!;
    const eyebrow = head.querySelector('.eyebrow');
    const split = SplitText.create(h2, { type: 'lines', mask: 'lines', linesClass: 'line' });
    gsap.set(split.lines, { yPercent: 100 });
    gsap.set(eyebrow, { autoAlpha: 0, y: 12 });
    ScrollTrigger.create({
      trigger: head,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.6, ease: EXPO });
        gsap.to(split.lines, { yPercent: 0, duration: 1, ease: EXPO, stagger: 0.08 });
      },
    });
  });

  // GlassCard enter
  gsap.utils.toArray<HTMLElement>('[data-glass]').forEach((card) => {
    gsap.fromTo(
      card,
      { y: 40, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.9, ease: EXPO, scrollTrigger: { trigger: card, start: 'top 85%', once: true } },
    );
  });

  // Total supply count-up
  const supply = document.querySelector<HTMLElement>('[data-count]');
  if (supply) {
    const raw = supply.dataset.count ?? '';
    const numeric = /^[\d,.\s]+$/.test(raw.trim()) ? Number(raw.replace(/[,\s]/g, '')) : NaN;
    if (Number.isFinite(numeric)) {
      const fmt = new Intl.NumberFormat('en-US');
      const o = { v: 0 };
      supply.textContent = '0';
      ScrollTrigger.create({
        trigger: supply,
        start: 'top 85%',
        once: true,
        onEnter: () =>
          gsap.to(o, {
            v: numeric,
            duration: 1.8,
            ease: EXPO,
            onUpdate: () => (supply.textContent = fmt.format(Math.round(o.v))),
          }),
      });
    }
  }

  // Cats vs Dogs rows
  gsap.utils.toArray<HTMLElement>('.vs__row').forEach((row, i) => {
    const strike = row.querySelector<HTMLElement>('.vs__strike')!;
    const cat = row.querySelector('.vs__cell--cat');
    gsap.set(strike, { '--strike': 0 });
    gsap.set(cat, { x: 24, autoAlpha: 0 });
    ScrollTrigger.create({
      trigger: row,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        const d = i * 0.08;
        gsap.to(strike, { '--strike': 1, duration: 0.6, ease: EXPO, delay: d });
        gsap.to(cat, { x: 0, autoAlpha: 1, duration: 0.8, ease: EXPO, delay: d + 0.05 });
      },
    });
  });

  // HowToBuy connector draws left -> right, scrubbed over the section
  const connector = document.querySelector('.steps__connector line');
  if (connector) {
    gsap.fromTo(
      connector,
      { drawSVG: '0%' },
      {
        drawSVG: '100%',
        ease: 'none',
        scrollTrigger: { trigger: '#how-to-buy', start: 'top 70%', end: 'bottom 60%', scrub: 0.8 },
      },
    );
  }
  gsap.utils.toArray<HTMLElement>('.step').forEach((step, i) => {
    gsap.fromTo(
      step.querySelectorAll('.step__num, .step__title, .step__body'),
      { y: 24, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.8,
        ease: EXPO,
        stagger: 0.06,
        delay: i * 0.08,
        scrollTrigger: { trigger: step, start: 'top 85%', once: true },
      },
    );
  });

  // Community: char reveal like the hero
  const commChars = gsap.utils
    .toArray<HTMLElement>('.community [data-split-chars]')
    .flatMap((el) => splitChars(el).chars);
  gsap.set(commChars, { yPercent: 110, rotateX: -40, transformOrigin: '50% 100%' });
  ScrollTrigger.create({
    trigger: '.community__title',
    start: 'top 70%',
    once: true,
    onEnter: () => gsap.to(commChars, { yPercent: 0, rotateX: 0, duration: 1.1, ease: EXPO, stagger: 0.018 }),
  });
  gsap.fromTo(
    '.socials .btn',
    { y: 24, autoAlpha: 0 },
    {
      y: 0,
      autoAlpha: 1,
      duration: 0.8,
      ease: EXPO,
      stagger: 0.08,
      scrollTrigger: { trigger: '.socials', start: 'top 90%', once: true },
    },
  );

  // Footer giant wordmark rises 15% (scrub)
  gsap.fromTo(
    '.footer__giant-text',
    { yPercent: 15 },
    {
      yPercent: 0,
      ease: 'none',
      scrollTrigger: { trigger: '.footer__giant', start: 'top bottom', end: 'bottom bottom', scrub: 0.8 },
    },
  );
}

/** Pinned sections. Created before the GL master timeline so its marks can read them. */
export function initPins(reduced: boolean) {
  if (reduced) return;

  // ---- DogEra: 250vh pin, three statements ----
  const statements = gsap.utils.toArray<HTMLElement>('[data-statement]');
  gsap.set(statements, { autoAlpha: 0, filter: 'blur(12px)', y: 30 });
  const inS = { autoAlpha: 1, filter: 'blur(0px)', y: 0, duration: 0.06 };
  const outS = { autoAlpha: 0, filter: 'blur(12px)', y: -30, duration: 0.06 };
  const dogTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      id: 'dogEra',
      trigger: '#dog-era',
      start: 'top top',
      end: () => `+=${window.innerHeight * 2.5}`,
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
    },
  });
  dogTl
    .to(statements[0], inS, 0)
    .to(statements[0], outS, 0.27)
    .to(statements[1], inS, 0.33)
    .to(statements[1], outS, 0.6)
    .to(statements[2], inS, 0.66)
    .to('.progress-line__fill', { scaleY: 1, duration: 1 }, 0)
    .set({}, {}, 1);

  // ---- Rebellion: 200vh pin, word-by-word scrub then body ----
  const title = document.querySelector<HTMLElement>('[data-split-words]')!;
  const words = SplitText.create(title, { type: 'words', wordsClass: 'word' }).words;
  const body = document.querySelector('.rebellion__body');
  const eyebrow = document.querySelector('.rebellion__eyebrow');
  gsap.set(body, { autoAlpha: 0, y: 20 });
  gsap.set(eyebrow, { autoAlpha: 0 });
  const rebTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      id: 'rebellion',
      trigger: '#manifesto',
      start: 'top top',
      end: () => `+=${window.innerHeight * 2}`,
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
    },
  });
  rebTl
    .to(eyebrow, { autoAlpha: 1, duration: 0.05 }, 0)
    .to(words, { opacity: 1, duration: 0.6 / words.length, stagger: 0.6 / words.length }, 0)
    .to(body, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.6)
    .set({}, {}, 1);

  // ---- Roadmap: horizontal track on desktop ----
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1200px)', () => {
    const track = document.querySelector<HTMLElement>('.roadmap__track')!;
    const panels = gsap.utils.toArray<HTMLElement>('[data-phase]');
    const overflow = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const setActive = () => {
      const cx = window.innerWidth / 2;
      let best = panels[0];
      let bestD = Infinity;
      panels.forEach((p) => {
        const r = p.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - cx);
        if (d < bestD) {
          bestD = d;
          best = p;
        }
      });
      panels.forEach((p) => p.classList.toggle('is-active', p === best));
    };
    gsap.to(track, {
      x: () => -overflow(),
      ease: 'none',
      scrollTrigger: {
        id: 'roadmap',
        trigger: '#roadmap',
        start: 'center center',
        end: () => `+=${overflow() + window.innerHeight * 0.2}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: setActive,
        onRefresh: setActive,
      },
    });
    return () => panels.forEach((p) => p.classList.remove('is-active'));
  });
  mm.add('(max-width: 1199px)', () => {
    const panels = gsap.utils.toArray<HTMLElement>('[data-phase]');
    const triggers = panels.map((p) =>
      ScrollTrigger.create({
        trigger: p,
        start: 'top 55%',
        end: 'bottom 45%',
        onToggle: (self) => p.classList.toggle('is-active', self.isActive),
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  });
}
