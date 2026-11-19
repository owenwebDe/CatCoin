import { ACESFilmicToneMapping, SRGBColorSpace, WebGLRenderer } from 'three';

/**
 * Renderer factory. WebGL2 + GLSL ShaderMaterial (no WebGPU/TSL in v1).
 * Kept isolated so the renderer can be swapped later.
 */
export function createRenderer(canvas: HTMLCanvasElement, opts: { mobile: boolean; dpr: number }) {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: !opts.mobile,
    powerPreference: 'high-performance',
    alpha: false,
    stencil: false,
  });
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.dpr));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x07070a, 1);
  return renderer;
}
