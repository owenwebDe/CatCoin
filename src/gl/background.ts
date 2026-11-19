import { Color, Mesh, PlaneGeometry, ShaderMaterial, SRGBColorSpace, Texture, TextureLoader, Vector2, Vector4, type LoadingManager } from 'three';
import vert from './shaders/background.vert?raw';
import frag from './shaders/background.frag?raw';
import { colors } from '../tokens';

/** Photo backdrops, one per story beat: hero, dog era, rebellion, everything after. */
export const BG_IMAGES = ['/bg/hero.jpg', '/bg/dogs.jpg', '/bg/rebellion.jpg', '/bg/ambient.jpg'];

export async function createBackground(manager: LoadingManager, maxAnisotropy: number) {
  const loader = new TextureLoader(manager);
  const textures = await Promise.all(
    BG_IMAGES.map((src) =>
      loader.loadAsync(src).then((t: Texture) => {
        t.colorSpace = SRGBColorSpace;
        t.anisotropy = Math.min(4, maxAnisotropy);
        return t;
      }),
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
      uDim: { value: 0.58 },
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
