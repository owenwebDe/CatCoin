import { BufferGeometry, Group, Matrix4, Mesh, Object3D } from 'three';
import { createGoldMaterial, createDogFaceGeometry, COIN } from './catcoin';
import { colors } from '../tokens';

export const DOG = { count: 5, scale: 0.55, orbitRadius: 3.0, orbitSpeed: 0.35, tilt: (18 * Math.PI) / 180 };

/**
 * Five dull dog coins orbiting the origin. Each has an "anchor" (orbit transform at the
 * fixed 0.55 scale) used by the particle system, and a visible coin whose scale animates.
 */
export function createDogCoins(coinGeo: BufferGeometry) {
  const ring = new Group();
  ring.rotation.x = DOG.tilt;
  const material = createGoldMaterial(colors.dogGold, 0.42);
  material.clearcoat = 0.25;
  const faceGeo = createDogFaceGeometry();

  const anchors: Object3D[] = [];
  const coins: Group[] = [];
  for (let i = 0; i < DOG.count; i++) {
    const anchor = new Object3D();
    anchor.scale.setScalar(DOG.scale);
    const coin = new Group();
    coin.add(new Mesh(coinGeo, material));
    for (const side of [1, -1]) {
      const face = new Mesh(faceGeo, material);
      face.position.z = side * (COIN.face - 0.002);
      if (side === -1) face.rotation.y = Math.PI;
      coin.add(face);
    }
    anchor.add(coin);
    ring.add(anchor);
    anchors.push(anchor);
    coins.push(coin);
  }

  const matrices = Array.from({ length: DOG.count }, () => new Matrix4());
  let angle = 0;

  function update(dt: number, t: number, visibleScale: number, animate: boolean) {
    if (animate) angle += DOG.orbitSpeed * dt;
    anchors.forEach((a, i) => {
      const th = angle + (i / DOG.count) * Math.PI * 2;
      a.position.set(Math.cos(th) * DOG.orbitRadius, 0, Math.sin(th) * DOG.orbitRadius);
      // counter the ring tilt so faces look toward the camera, plus a slow wobble
      a.rotation.set(-DOG.tilt, animate ? Math.sin(t * 0.6 + i) * 0.5 : 0, 0);
    });
    const s = visibleScale / DOG.scale;
    coins.forEach((c) => c.scale.setScalar(Math.max(s, 0.0001)));
    ring.visible = visibleScale > 0.001;
    ring.updateMatrixWorld(true);
    anchors.forEach((a, i) => matrices[i].copy(a.matrixWorld));
  }

  return { ring, update, matrices, material, faceGeo };
}
