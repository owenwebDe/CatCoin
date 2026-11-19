uniform sampler2D uTex0;
uniform sampler2D uTex1;
uniform sampler2D uTex2;
uniform sampler2D uTex3;
uniform vec4 uAspect;   // image aspect (w/h) per texture
uniform vec4 uWeight;   // crossfade weights, sum = 1
uniform vec2 uRes;
uniform float uDim;     // flat darkening so text and the coin read on top
uniform float uTime;
uniform vec3 uBase;
varying vec2 vUv;

vec2 coverUv(vec2 uv, float imgAspect, float drift) {
  float screenAspect = uRes.x / uRes.y;
  vec2 scale = screenAspect > imgAspect ? vec2(1.0, imgAspect / screenAspect) : vec2(screenAspect / imgAspect, 1.0);
  // slight zoom + slow drift so the photo feels alive behind the 3D scene
  scale *= 0.94;
  return (uv - 0.5) * scale + 0.5 + vec2(sin(drift) * 0.01, cos(drift * 0.8) * 0.008);
}

void main() {
  float d = uTime * 0.05;
  vec3 c = vec3(0.0);
  if (uWeight.x > 0.001) c += texture2D(uTex0, coverUv(vUv, uAspect.x, d)).rgb * uWeight.x;
  if (uWeight.y > 0.001) c += texture2D(uTex1, coverUv(vUv, uAspect.y, d)).rgb * uWeight.y;
  if (uWeight.z > 0.001) c += texture2D(uTex2, coverUv(vUv, uAspect.z, d)).rgb * uWeight.z;
  if (uWeight.w > 0.001) c += texture2D(uTex3, coverUv(vUv, uAspect.w, d)).rgb * uWeight.w;
  c = mix(c, uBase, uDim);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}
