uniform vec3 uGold;
uniform vec3 uGoldHi;
uniform vec3 uAmber;
uniform float uForm;
uniform float uAlpha;

varying float vKind;
varying float vFade;

void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  float a = smoothstep(0.5, 0.0, r);
  vec3 formed = vKind > 0.5 ? uAmber : uGoldHi;
  vec3 col = mix(uGold, formed, uForm) * (1.0 + 0.6 * uForm);
  gl_FragColor = vec4(col, a * uAlpha * vFade);
  #include <colorspace_fragment>
}
