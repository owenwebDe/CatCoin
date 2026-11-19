import {
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  TorusGeometry,
  type Texture,
  Color,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  LinearFilter,
  Mesh,
  MeshPhysicalMaterial,
  RingGeometry,
  Shape,
  SRGBColorSpace,
  Vector2,
} from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { colors } from '../tokens';

/* ------------------------------------------------------------------ */
/* Coin body: lathe profile                                            */
/* radius 1.6, thickness 0.28, bevel 0.06, raised rim 0.08 wide        */
/* ------------------------------------------------------------------ */
export const COIN = {
  radius: 1.6,
  half: 0.14, // thickness 0.28
  face: 0.11, // recessed face level inside the raised rim
  rim: 0.08,
  bevel: 0.06,
  segments: 128,
};

export function createCoinGeometry(): BufferGeometry {
  const { radius: R, half: h, face: f, rim, bevel: b } = COIN;
  const rimIn = R - rim; // 1.52
  const slopeIn = rimIn - 0.06; // inner wall of the rim
  const pts: Vector2[] = [];
  const P = (x: number, y: number) => pts.push(new Vector2(x, y));
  const arc = (cx: number, cy: number, a0: number, a1: number, n: number) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      P(cx + b * Math.cos(a), cy + b * Math.sin(a));
    }
  };
  // Duplicated points give crisp creases (LatheGeometry averages normals per point).
  P(0, -f);
  P(slopeIn, -f);
  P(slopeIn, -f);
  P(rimIn, -h);
  P(rimIn, -h);
  arc(R - b, -h + b, -Math.PI / 2, 0, 10);
  arc(R - b, h - b, 0, Math.PI / 2, 10);
  P(rimIn, h);
  P(rimIn, h);
  P(slopeIn, f);
  P(slopeIn, f);
  P(0, f);
  const geo = new LatheGeometry(pts, COIN.segments);
  geo.rotateX(Math.PI / 2); // faces now point along +/- z
  return geo;
}

/* ------------------------------------------------------------------ */
/* Silhouettes (hand-drawn, 200x200 space)                             */
/* ------------------------------------------------------------------ */
const DOG_HEAD =
  'M70 50 Q100 38 130 50 C150 40 172 48 176 70 C180 100 172 126 160 132 C152 134 148 124 146 112 ' +
  'C150 130 146 150 132 160 Q118 172 100 172 Q82 172 68 160 C54 150 50 130 54 112 C52 124 48 134 40 132 ' +
  'C28 126 20 100 24 70 C28 48 50 40 70 50 Z ' +
  'M80 100 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 Z ' +
  'M108 100 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 Z ' +
  'M92 138 Q100 148 108 138 Q100 132 92 138 Z';

function parseShapes(d: string): Shape[] {
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="${d}"/></svg>`);
  return data.paths.flatMap((p) => p.toShapes());
}

/**
 * Extrude a silhouette (SVG units) into an emboss sitting on z = 0 and rising toward +z.
 * height = target height in world units.
 */
function embossGeometry(shapes: Shape[], height: number, depth: number, bevelT: number) {
  const s = height / 156;
  const geo = new ExtrudeGeometry(shapes, {
    depth: depth / s,
    bevelEnabled: true,
    bevelThickness: bevelT / s,
    bevelSize: (bevelT * 0.9) / s,
    bevelSegments: 3,
    curveSegments: 28,
  });
  geo.translate(-100, -100, 0);
  geo.scale(s, s, s);
  geo.rotateX(Math.PI); // SVG y-down -> y-up, keeps winding (det > 0)
  geo.translate(0, 0, depth + bevelT); // now spans z in [0, depth + 2*bevelT]
  geo.computeVertexNormals();
  return { geo, scale: s };
}

/* ------------------------------------------------------------------ */
/* Rim text texture: "CATCOIN · {{TICKER}} · " repeated                */
/* ------------------------------------------------------------------ */
const RING_IN = 1.2;
const RING_OUT = 1.42;

function rimTextTexture(ticker: string): CanvasTexture {
  const size = 2048;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  const rWorld = (RING_IN + RING_OUT) / 2;
  const rPx = (size / 2) * (rWorld / RING_OUT);
  const fontPx = 64;
  ctx.font = `${fontPx}px 'Luckiest Guy', 'Arial Black', sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const unit = `CATCOIN · ${ticker} · `;
  const tracking = fontPx * 0.18;
  const widths = Array.from(unit).map((ch) => ctx.measureText(ch).width + tracking);
  const unitW = widths.reduce((a, b) => a + b, 0);
  const circ = Math.PI * 2 * rPx;
  const reps = Math.max(1, Math.floor(circ / unitW));
  const stretch = circ / (unitW * reps);
  let angle = -Math.PI / 2;
  ctx.translate(size / 2, size / 2);
  for (let r = 0; r < reps; r++) {
    Array.from(unit).forEach((ch, i) => {
      const w = widths[i] * stretch;
      const a = angle + w / 2 / rPx;
      ctx.save();
      ctx.rotate(a);
      ctx.translate(0, -rPx);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      angle += w / rPx;
    });
  }
  // the canvas is drawn with +angle clockwise from 12 o'clock; rotate so it reads clockwise on the coin
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearFilter;
  tex.generateMipmaps = false;
  tex.anisotropy = 4;
  return tex;
}

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */
export function createGoldMaterial(color: string, roughness: number) {
  return new MeshPhysicalMaterial({
    color: new Color(color),
    metalness: 1,
    roughness,
    clearcoat: 0.6,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.35,
  });
}

/* ------------------------------------------------------------------ */
/* CatCoin                                                             */
/* ------------------------------------------------------------------ */
export function createCatCoin(coinGeo: BufferGeometry, ticker: string, faceTex: Texture) {
  const group = new Group(); // receives position/scale from the state timeline
  const spinner = new Group(); // idle spin + cursor tilt
  group.add(spinner);

  const body = createGoldMaterial(colors.gold, 0.26);
  const emboss = createGoldMaterial(colors.gold, 0.18);
  spinner.add(new Mesh(coinGeo, body));

  // Face artwork: the CatCoin brand logo, set into the coin like a glossy enamel inlay.
  const FACE_R = 1.16;
  const faceGeo = new CircleGeometry(FACE_R, 128);
  const faceMat = new MeshPhysicalMaterial({
    map: faceTex,
    metalness: 0.1,
    roughness: 0.34,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 0.9,
  });
  // Raised gold bezel around the artwork
  const bezelGeo = new TorusGeometry(FACE_R + 0.015, 0.03, 20, 160);

  const rimTex = rimTextTexture(ticker);
  const rimMat = new MeshPhysicalMaterial({
    color: new Color(colors.gold),
    metalness: 1,
    roughness: 0.42,
    clearcoat: 0.3,
    clearcoatRoughness: 0.3,
    envMapIntensity: 1.35,
    alphaMap: rimTex,
    alphaTest: 0.5,
    bumpMap: rimTex,
    bumpScale: 0.6,
  });
  const ringGeo = new RingGeometry(RING_IN, RING_OUT, 128, 1);

  const faceZ = COIN.face;
  for (const side of [1, -1]) {
    const face = new Group();
    if (side === -1) face.rotation.y = Math.PI;
    face.position.z = side * (faceZ - 0.002);
    const art = new Mesh(faceGeo, faceMat);
    art.position.z = 0.004;
    face.add(art);
    const bezel = new Mesh(bezelGeo, emboss);
    bezel.position.z = 0.004;
    face.add(bezel);
    const ring = new Mesh(ringGeo, rimMat);
    ring.position.z = 0.004;
    ring.rotation.z = Math.PI; // start text at the bottom so it reads around the top
    face.add(ring);
    spinner.add(face);
  }

  const baseRough = { body: 0.26, emboss: 0.18, rim: 0.42 };
  const setRoughness = (r: number) => {
    const k = r / baseRough.body;
    body.roughness = r;
    emboss.roughness = Math.min(1, baseRough.emboss * k);
    rimMat.roughness = Math.min(1, baseRough.rim * k);
  };

  return { group, spinner, setRoughness, materials: [body, emboss, faceMat, rimMat], geometries: [faceGeo, bezelGeo, ringGeo], textures: [rimTex, faceTex] };
}

/* ------------------------------------------------------------------ */
/* Dog coin face (generic floppy-ear dog, not any real logo)           */
/* ------------------------------------------------------------------ */
export function createDogFaceGeometry() {
  return embossGeometry(parseShapes(DOG_HEAD), 1.9, 0.05, 0.012).geo;
}
