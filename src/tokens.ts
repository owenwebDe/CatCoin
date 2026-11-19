/** Mirror of the CSS custom properties, for GL and JS-driven motion. */
export const colors = {
  bg: '#07070A',
  navy: '#0B1020',
  ink: '#121624',
  gold: '#E8B04B',
  goldHi: '#F6D58E',
  goldLo: '#8C6420',
  amber: '#FF8A1F',
  text: '#F3EEE4',
  muted: '#8A8578',
  dogGold: '#B8925A',
} as const;

export const motion = {
  easeOut: 'expo.out',
  easeInOut: 'power3.inOut',
  dFast: 0.24,
  dBase: 0.6,
  dSlow: 1.1,
  staggerWord: 0.045,
  staggerChar: 0.018,
  scrub: 0.8,
} as const;

export const breakpoints = { tablet: 768, desktop: 1200 } as const;

export const mq = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1199px)',
  desktop: '(min-width: 1200px)',
  reduced: '(prefers-reduced-motion: reduce)',
  finePointer: '(hover: hover) and (pointer: fine)',
} as const;

export const isReducedMotion = () => window.matchMedia(mq.reduced).matches;
export const isMobile = () => window.matchMedia(mq.mobile).matches;
