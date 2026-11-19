import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Matrix4,
  Mesh,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import vert from './shaders/particles.vert?raw';
import frag from './shaders/particles.frag?raw';
import { colors } from '../tokens';
import { DOG } from './dogcoins';

const EMBLEM_W = 3.2;

/** Lens (vesica) half-height at x for a lens of half-width a and half-height h. */
function lensCircle(a: number, h: number) {
  const R = (a * a + h * h) / (2 * h);
  const c = R - h;
  return { R, c };
}

/** Sample a point on/inside the cat-eye emblem. kind: 0 = outline/iris (gold-hi), 1 = pupil (amber). */
function emblemPoint(out: Vector3): number {
  const a = EMBLEM_W / 2; // 1.6
  const h = 0.72;
  const { R, c } = lensCircle(a, h);
  const phi0 = Math.acos(a / R);
  const r = Math.random();
  const jitter = (s: number) => (Math.random() - 0.5) * s;

  if (r < 0.42) {
    // almond outline (two arcs), slight thickness
    const upper = Math.random() < 0.5;
    const phi = phi0 + Math.random() * (Math.PI - 2 * phi0);
    const rr = R + jitter(0.035);
    const x = rr * Math.cos(phi);
    const y = rr * Math.sin(phi) - c;
    out.set(x, upper ? y : -y, jitter(0.03));
    return 0;
  }
  if (r < 0.57) {
    // iris circle, clipped to the almond
    for (;;) {
      const t = Math.random() * Math.PI * 2;
      const ir = 0.64 + jitter(0.03);
      const x = Math.cos(t) * ir;
      const y = Math.sin(t) * ir;
      if (Math.hypot(x, Math.abs(y) + c) < R - 0.04) {
        out.set(x, y, jitter(0.03));
        return 0;
      }
    }
  }
  if (r < 0.87) {
    // vertical slit pupil, filled (denser toward its edge)
    const pa = 0.62; // half-height
    const pw = 0.17; // half-width
    const lens = lensCircle(pa, pw);
    for (;;) {
      const x = (Math.random() * 2 - 1) * pw;
      const y = (Math.random() * 2 - 1) * pa;
      if (Math.hypot(Math.abs(x) + lens.c, y) <= lens.R) {
        out.set(x, y, jitter(0.03));
        return 1;
      }
    }
  }
  // sparse fill inside the almond
  for (;;) {
    const x = (Math.random() * 2 - 1) * a;
    const y = (Math.random() * 2 - 1) * h;
    if (Math.hypot(x, Math.abs(y) + c) < R) {
      out.set(x, y, jitter(0.05));
      return 0;
    }
  }
}

export function createParticles(coinGeo: BufferGeometry, perCoin: number, pixelRatio: number) {
  const total = perCoin * DOG.count;
  const start = new Float32Array(total * 3);
  const target = new Float32Array(total * 3);
  const random = new Float32Array(total * 3);
  const ambient = new Float32Array(total * 3);
  const coin = new Float32Array(total);
  const kind = new Float32Array(total);

  const sampler = new MeshSurfaceSampler(new Mesh(coinGeo)).build();
  const p = new Vector3();
  for (let i = 0; i < total; i++) {
    // interleave coins so any prefix (drawRange) covers all five evenly
    coin[i] = i % DOG.count;
    sampler.sample(p);
    p.toArray(start, i * 3);
    kind[i] = emblemPoint(p);
    p.toArray(target, i * 3);
    random[i * 3] = Math.random() * 2 - 1;
    random[i * 3 + 1] = Math.random() * 2 - 1;
    random[i * 3 + 2] = Math.random() * 2 - 1;
    ambient[i * 3] = (Math.random() - 0.5) * 14;
    ambient[i * 3 + 1] = (Math.random() - 0.5) * 10;
    ambient[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(start.slice(), 3));
  geo.setAttribute('aStart', new BufferAttribute(start, 3));
  geo.setAttribute('aTarget', new BufferAttribute(target, 3));
  geo.setAttribute('aRandom', new BufferAttribute(random, 3));
  geo.setAttribute('aAmbient', new BufferAttribute(ambient, 3));
  geo.setAttribute('aCoin', new BufferAttribute(coin, 1));
  geo.setAttribute('aKind', new BufferAttribute(kind, 1));

  const material = new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uCoinMatrix: { value: Array.from({ length: DOG.count }, () => new Matrix4()) },
      uDisperse: { value: 0 },
      uForm: { value: 0 },
      uAmbient: { value: 0 },
      uEmblemZ: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: 3.0 },
      uPixelRatio: { value: pixelRatio },
      uAlpha: { value: 0 },
      uGold: { value: new Color(colors.gold) },
      uGoldHi: { value: new Color(colors.goldHi) },
      uAmber: { value: new Color(colors.amber) },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });

  const points = new Points(geo, material);
  points.frustumCulled = false;

  return {
    points,
    material,
    geometry: geo,
    total,
    setCount(n: number) {
      geo.setDrawRange(0, Math.min(n, total));
    },
  };
}
