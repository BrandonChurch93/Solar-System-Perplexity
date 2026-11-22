import type * as THREE from 'three'

export const implicitUniform: THREE.IUniform<number> = { value: 0 }

export function bindImplicit(root: THREE.Object3D | undefined): void {
  root?.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
    for (const x of Array.isArray(m) ? m : m ? [m] : []) {
      const s = x as THREE.ShaderMaterial
      if (s.uniforms && typeof s.fragmentShader === 'string' && s.fragmentShader.includes('uImplicit')) s.uniforms.uImplicit = implicitUniform
    }
  })
}

export const TEXEL_GLSL = /* glsl */ `
#ifndef TEXEL_GLSL
#define TEXEL_GLSL
uniform float uImplicit;
bool quadFlat(vec2 a, vec2 b, float cap) {
  float m = max(dot(a, a), dot(b, b));
  return m < cap && m < 1.4 * abs(a.x * b.y - a.y * b.x);
}
vec2 texelPlan(sampler2D tex, vec2 uv, vec2 dx, vec2 dy) {
  vec2 size = vec2(textureSize(tex, 0));
  vec2 ix = dFdx(uv);
  vec2 iy = dFdy(uv);
  bool mag = quadFlat(dx * size, dy * size, 0.9) && quadFlat(ix * size, iy * size, 1e8);
  bool plain = uImplicit > 0.5 && (mag || (dx == ix && dy == iy));
  return vec2(plain ? 1.0 : 0.0, mag ? -15.0 : 0.0);
}
vec4 gradTexel(sampler2D tex, vec2 uv, vec2 dx, vec2 dy) {
  vec2 plan = texelPlan(tex, uv, dx, dy);
  vec4 r = vec4(0.0);
  for (int k = 0; k < (plan.x > 0.5 ? 1 : 0); k++) r = texture(tex, uv, plan.y);
  for (int k = 0; k < (plan.x > 0.5 ? 0 : 1); k++) r = textureGrad(tex, uv, dx, dy);
  return r;
}
#endif
`
