import {
  Color,
  DirectionalLight,
  FogExp2,
  HalfFloatType,
  LoadingManager,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  type Material,
  type BufferGeometry,
  type Texture,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { gsap, ScrollTrigger } from '../ui/gsap';
import { config } from '../config';
import { colors } from '../tokens';
import { createRenderer } from './renderer';
import { createBackground } from './background';
import { createCoinGeometry, createCatCoin } from './catcoin';
import { createDogCoins } from './dogcoins';
import { createParticles } from './particles';
import { buildStateTimeline, readMarks, stillProgress, STATE_A, type SceneState } from './states';
import { FpsProbe, initialTier, isMobileDevice, maxDpr, tierSettings, type Tier } from './tiers';

export interface GLOptions {
  canvas: HTMLCanvasElement;
  reduced: boolean;
  onEnvProgress: (p: number) => void;
  onCompiled: () => void;
  onFail: () => void;
}

export interface GLApi {
  intro: () => void;
}

const CURSOR_PLANE_Z = 2.5;
const FOV = 35;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([p, new Promise<undefined>((r) => setTimeout(() => r(undefined), ms))]);
}

export async function createGL(opts: GLOptions): Promise<GLApi> {
  const { canvas, reduced } = opts;
  const mobile = isMobileDevice();
  let tier: Tier = initialTier();
  let settings = tierSettings[tier];

  const renderer = createRenderer(canvas, { mobile, dpr: maxDpr(tier, mobile) });
  const scene = new Scene();
  scene.fog = new FogExp2(new Color(colors.navy), 0.055);

  const camera = new PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 6);

  // ---- (a) Environment via LoadingManager ----
  const manager = new LoadingManager();
  manager.onProgress = (_url, loaded, total) => opts.onEnvProgress(loaded / total);
  manager.itemStart('room-environment');
  manager.itemStart('pmrem');
  manager.itemStart('coin-face'); // keeps progress honest until the texture request registers
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  manager.itemEnd('room-environment');
  await new Promise((r) => requestAnimationFrame(r));
  const envRT = pmrem.fromScene(room, 0.04);
  scene.environment = envRT.texture;
  room.dispose();
  pmrem.dispose();
  manager.itemEnd('pmrem');
  const faceTexPromise = new TextureLoader(manager).loadAsync('/coin-face.jpg').then((t) => {
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
  });

  // ---- Objects ----
  manager.itemStart('backgrounds');
  const bg = await createBackground(manager, renderer.capabilities.getMaxAnisotropy());
  manager.itemEnd('backgrounds');
  scene.add(bg.mesh);

  await withTimeout(document.fonts.load('64px "Luckiest Guy"'), 2500);
  const coinGeo = createCoinGeometry();
  const faceTex = await faceTexPromise;
  manager.itemEnd('coin-face');
  const cat = createCatCoin(coinGeo, config.TICKER, faceTex);
  scene.add(cat.group);

  const dogs = createDogCoins(coinGeo);
  scene.add(dogs.ring);

  const pixelRatio = () => renderer.getPixelRatio();
  const particles = createParticles(coinGeo, tierSettings.high.particlesPerCoin, pixelRatio());
  particles.setCount(settings.particlesPerCoin * 5);
  particles.material.uniforms.uCoinMatrix.value = dogs.matrices;
  scene.add(particles.points);

  // ---- Lights ----
  const key = new DirectionalLight(0xffffff, 1.2);
  key.position.set(4, 6, 5);
  scene.add(key);
  const rim = new PointLight(new Color(colors.goldHi), 18, 9);
  rim.position.set(1.2, 1, CURSOR_PLANE_Z);
  scene.add(rim);

  // ---- Post (Tier HIGH only) ----
  let composer: EffectComposer | null = null;
  let bloom: UnrealBloomPass | null = null;
  const buildComposer = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const rt = new WebGLRenderTarget(w, h, { type: HalfFloatType, samples: mobile ? 0 : 4 });
    composer = new EffectComposer(renderer, rt);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new Vector2(w, h), 0.55, 0.4, 0.82);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  };
  if (settings.bloom) buildComposer();

  // ---- State + master timeline ----
  const state: SceneState = { ...STATE_A };
  const intro = { scale: reduced ? 1 : 0.8, rot: reduced ? 0 : -0.6 };
  let stateTl = buildStateTimeline(state, readMarks(), mobile);
  const proxy = { p: 0 };
  let needsRender = true;

  let marks = readMarks();
  const smooth = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  /** Crossfade the photo backdrops: hero -> dogs (DogEra) -> cat eyes (Rebellion) -> ambient. */
  const bgWeights = (p: number, out: Vector4) => {
    const w = 0.025;
    const toDogs = smooth(marks.dogStart - w * 2, marks.dogStart, p);
    const toReb = smooth(marks.dogEnd - w, marks.dogEnd + w * 0.5, p);
    const toAmb = smooth(marks.rebEnd - w * 0.5, marks.rebEnd + w, p);
    out.set((1 - toDogs), toDogs * (1 - toReb), toReb * (1 - toAmb), toAmb);
  };
  const rebuild = () => {
    marks = readMarks();
    const p = stateTl.progress();
    stateTl.kill();
    stateTl = buildStateTimeline(state, readMarks(), mobile);
    stateTl.progress(reduced ? p : proxy.p);
    needsRender = true;
  };

  if (!reduced) {
    gsap.to(proxy, {
      p: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8,
        onRefresh: rebuild,
      },
    });
  } else {
    // Reduced motion: one still frame per state, 600ms crossfade when a section enters.
    let current = 'A';
    const go = (keyName: 'A' | 'B' | 'D' | 'F') => {
      if (keyName === current) return;
      current = keyName;
      const target = stillProgress(readMarks())[keyName];
      gsap
        .timeline()
        .to(canvas, { opacity: 0, duration: 0.3, ease: 'power1.inOut' })
        .add(() => {
          stateTl.progress(target);
          proxy.p = target;
          needsRender = true;
        })
        .to(canvas, { opacity: 1, duration: 0.3, ease: 'power1.inOut' });
    };
    const sections: [string, 'A' | 'B' | 'D' | 'F'][] = [
      ['#top', 'A'],
      ['#dog-era', 'B'],
      ['#manifesto', 'D'],
      ['#cats-vs-dogs', 'F'],
    ];
    sections.forEach(([sel, k], i) => {
      ScrollTrigger.create({
        trigger: sel,
        start: 'top 50%',
        end: i === sections.length - 1 ? 'max' : 'bottom 50%',
        onToggle: (self) => self.isActive && go(k),
      });
    });
    ScrollTrigger.addEventListener('refresh', rebuild);
  }

  // ---- Pointer / orientation ----
  const ndc = new Vector2(0, 0);
  const hasFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let pointerActive = false;
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      ndc.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
      pointerActive = true;
      if (reduced) needsRender = true;
    },
    { passive: true },
  );
  const tiltMax = hasFine ? 0.35 : 0.2;
  if (!hasFine && !reduced) {
    window.addEventListener(
      'deviceorientation',
      (e) => {
        if (e.beta == null || e.gamma == null) return;
        ndc.set(Math.max(-1, Math.min(1, e.gamma / 30)), Math.max(-1, Math.min(1, (e.beta - 45) / 30)));
        pointerActive = true;
      },
      { passive: true },
    );
  }
  const tilt = { x: 0, y: 0 };
  const lightPos = new Vector3(1.2, 1, CURSOR_PLANE_Z);
  const lightTarget = new Vector3();

  // ---- Resize ----
  const applyCameraFit = () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;
    // Portrait screens: zoom out so the coin is not cropped by the narrow width.
    camera.zoom = Math.min(1, aspect / 0.8);
    camera.updateProjectionMatrix();
  };
  applyCameraFit();
  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    composer?.setPixelRatio(renderer.getPixelRatio());
    composer?.setSize(w, h);
    bg.material.uniforms.uRes.value.set(w, h);
    applyCameraFit();
    needsRender = true;
  };
  window.addEventListener('resize', onResize);

  // ---- Tier downgrade ----
  const downgrade = () => {
    if (tier === 'low') return;
    tier = 'low';
    settings = tierSettings.low;
    if (composer) {
      composer.dispose();
      composer.renderTarget1.dispose();
      composer.renderTarget2.dispose();
      bloom?.dispose();
      composer = null;
      bloom = null;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr('low', mobile)));
    particles.setCount(settings.particlesPerCoin * 5);
    particles.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    onResize();
  };
  const probe = new FpsProbe((fps) => {
    if (fps < 45) downgrade();
  });

  // ---- (c) First compiled frame ----
  stateTl.progress(0);
  dogs.update(0, 0, 0, false);
  await renderer.compileAsync(scene, camera);
  if (composer) (composer as EffectComposer).render();
  else renderer.render(scene, camera);
  opts.onCompiled();

  // ---- Loop (on the shared GSAP ticker) ----
  let idle = 0;
  let disposed = false;
  let last = performance.now();
  let visible = true;
  const io = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
  });
  io.observe(canvas);

  const tick = (time: number) => {
    if (disposed) return;
    const now = performance.now();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (document.hidden || !visible) return;
    if (reduced && !needsRender) return;
    needsRender = false;

    if (!reduced) stateTl.progress(proxy.p);

    // CatCoin
    if (!reduced) idle += 0.25 * dt;
    const floatY = reduced ? 0 : Math.sin(time * 0.9) * 0.08;
    cat.group.position.set(state.coinX, state.coinY + floatY, state.coinZ);
    cat.group.scale.setScalar(state.coinScale * intro.scale);
    cat.setRoughness(state.coinRough);
    const tx = pointerActive && !reduced ? -ndc.y * tiltMax : 0;
    const ty = pointerActive && !reduced ? ndc.x * tiltMax : 0;
    tilt.x += (tx - tilt.x) * 0.07;
    tilt.y += (ty - tilt.y) * 0.07;
    cat.spinner.rotation.set(tilt.x, idle + state.spin + intro.rot + tilt.y, 0);

    // Dog coins + particles
    dogs.update(dt, time, state.dogScale, !reduced);
    const u = particles.material.uniforms;
    u.uTime.value = reduced ? 0 : time;
    u.uDisperse.value = state.disperse;
    u.uForm.value = state.form;
    u.uAmbient.value = state.ambient;
    u.uEmblemZ.value = state.emblemZ;
    u.uAlpha.value = state.pAlpha;
    particles.points.visible = state.pAlpha > 0.001;

    // Camera
    camera.position.set(state.camX, state.camY, state.camZ);
    camera.lookAt(0, state.camY * 0.5, 0);

    // Cursor rim light: sweeps across the metal in the z = 2.5 plane
    const dist = Math.max(0.5, state.camZ - CURSOR_PLANE_Z);
    const halfH = (dist * Math.tan(((FOV / 2) * Math.PI) / 180)) / camera.zoom;
    const halfW = halfH * camera.aspect;
    if (pointerActive) lightTarget.set(ndc.x * halfW, state.camY + ndc.y * halfH, CURSOR_PLANE_Z);
    else lightTarget.set(halfW * 0.45, state.camY + halfH * 0.5, CURSOR_PLANE_Z);
    lightPos.lerp(lightTarget, reduced ? 1 : 0.08);
    rim.position.copy(lightPos);

    // Background
    bg.material.uniforms.uTime.value = reduced ? 0 : time;
    bgWeights(proxy.p, bg.material.uniforms.uWeight.value);

    if (composer) composer.render();
    else renderer.render(scene, camera);
    probe.tick(now);
  };
  gsap.ticker.add(tick);

  // ---- Context loss -> CSS fallback ----
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    gsap.ticker.remove(tick);
    io.disconnect();
    window.removeEventListener('resize', onResize);
    const mats = new Set<Material>([...cat.materials, dogs.material, particles.material, bg.material]);
    mats.forEach((m) => m.dispose());
    const geos = new Set<BufferGeometry>([coinGeo, ...cat.geometries, dogs.faceGeo, particles.geometry, bg.mesh.geometry]);
    geos.forEach((g) => g.dispose());
    cat.textures.forEach((t: Texture) => t.dispose());
    bg.textures.forEach((t: Texture) => t.dispose());
    envRT.dispose();
    composer?.dispose();
    renderer.dispose();
  };
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    dispose();
    opts.onFail();
  });

  // Re-measure once layout/fonts settle
  ScrollTrigger.refresh();

  return {
    intro() {
      if (reduced) return;
      gsap.fromTo(intro, { scale: 0.8, rot: -0.6 }, { scale: 1, rot: 0, duration: 1.6, ease: 'expo.out' });
    },
  };
}
