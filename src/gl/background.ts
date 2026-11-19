import { Color, DataTexture, Mesh, PlaneGeometry, ShaderMaterial, SRGBColorSpace, Texture, TextureLoader, Vector2, Vector4, type LoadingManager } from 'three';
import vert from './shaders/background.vert?raw';
import frag from './shaders/background.frag?raw';
import { colors } from '../tokens';

/**
 * Optional photo backdrops, one per story beat: hero, dog era, rebellion, everything after.
 * Drop JPGs into public/bg/ and list them here (null = flat navy). They crossfade on scroll.
 */
export const BG_IMAGES: (string | null)[] = ['/bg/hero.jpg', '/bg/dogs.jpg', '/bg/rebellion.jpg', '/bg/ambient.jpg'];

function solid(hex: string): Texture {
  const c = new Color(hex);
  const t = new DataTexture(new Uint8Array([c.r * 255, c.g * 255, c.b * 255, 255]), 1, 1);
  t.needsUpdate = true;
  return t;
}

export async function createBackground(manager: LoadingManager, maxAnisotropy: number) {
  const loader = new TextureLoader(manager);
  const textures = await Promise.all(
    BG_IMAGES.map((src) =>
      !src
        ? Promise.resolve(solid(colors.navy))
        : loader
        .loadAsync(src)
        .then((t: Texture) => {
          t.colorSpace = SRGBColorSpace;
          t.anisotropy = Math.min(4, maxAnisotropy);
          return t;
        })
        .catch(() => solid(colors.navy)), // a missing photo must never take the 3D scene down
    ),
  );
  const aspect = (t: Texture) => {
    const img = t.image as { width: number; height: number };
    return img.width / img.height;
  };
  const material = new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uTex0: { value: textures[0] },
      uTex1: { value: textures[1] },
      uTex2: { value: textures[2] },
      uTex3: { value: textures[3] },
      uAspect: { value: new Vector4(...textures.map(aspect)) },
      uWeight: { value: new Vector4(1, 0, 0, 0) },
      uRes: { value: new Vector2(window.innerWidth, window.innerHeight) },
      uDim: { value: BG_IMAGES.some(Boolean) ? 0.62 : 0 },
      uTime: { value: 0 },
      uBase: { value: new Color(colors.bg) },
    },
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
  const mesh = new Mesh(new PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  return { mesh, material, textures };
}
