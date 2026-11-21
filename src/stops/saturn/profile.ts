import * as THREE from 'three'
import rings from './rings.json'

export const RING_PROFILE_GLSL = /* glsl */ `
uniform highp sampler2D uProf;
uniform int uProfN;
uniform int uProfLevels;
uniform int uHeroRow[16];
uniform int uCloseRow[16];
uniform vec2 uSpan;
uniform float uClose;
uniform vec4 uWarpH;
uniform vec4 uWarpC;
float warpSeg(float r, float c0, float c1, float h0, float h1) {
  return h0 + (r - c0) * (h1 - h0) / (c1 - c0);
}
float ringWarp(float r) {
  float w = r < uWarpC.y ? warpSeg(r, uWarpC.x, uWarpC.y, uWarpH.x, uWarpH.y) : (r < uWarpC.z ? warpSeg(r, uWarpC.y, uWarpC.z, uWarpH.y, uWarpH.z) : warpSeg(r, uWarpC.z, uWarpC.w, uWarpH.z, uWarpH.w));
  return mix(r, w, uClose);
}
vec4 profLevel(int row, int n, float x) {
  float f = clamp(x * float(n) - 0.5, 0.0, float(n - 1));
  int i = int(floor(f));
  int j = min(i + 1, n - 1);
  vec4 a = texelFetch(uProf, ivec2(i & 8191, row + (i >> 13)), 0);
  vec4 b = texelFetch(uProf, ivec2(j & 8191, row + (j >> 13)), 0);
  return mix(a, b, f - float(i));
}
vec4 profAt(float x, float texels) {
  float lod = clamp(log2(max(texels, 1.0)), 0.0, float(uProfLevels - 1));
  int l0 = int(floor(lod));
  int l1 = min(l0 + 1, uProfLevels - 1);
  float t = lod - float(l0);
  vec4 h = vec4(0.0);
  vec4 c = vec4(0.0);
  if (uClose < 1.0) h = mix(profLevel(uHeroRow[l0], uProfN >> l0, x), profLevel(uHeroRow[l1], uProfN >> l1, x), t);
  if (uClose > 0.0) c = mix(profLevel(uCloseRow[l0], uProfN >> l0, x), profLevel(uCloseRow[l1], uProfN >> l1, x), t);
  return mix(h, c, uClose);
}
float ringRadius(float r) {
  return (ringWarp(r) - uSpan.x) * uSpan.y;
}
float ringTexels(float perPixel) {
  return perPixel * uSpan.y * float(uProfN);
}
float ringShadowAt(vec3 P, vec3 sunL, vec3 soft, float grad) {
  float t = -P.y / (abs(sunL.y) > 1e-4 ? sunL.y : 1e-4);
  float rho = length(P.xz + sunL.xz * t);
  float fp = max(length(vec2(dFdx(rho), dFdy(rho))) * grad, soft.x + soft.y * max(t, 0.0));
  float x = ringRadius(rho);
  if (t <= 0.0 || x <= 0.0 || x >= 1.0) return 0.0;
  float a = profAt(x, ringTexels(fp)).a;
  return 1.0 - pow(1.0 - min(a, 0.999), soft.z);
}`

export interface RingProfile { texture: THREE.DataTexture; uniforms: Record<string, THREE.IUniform>; close: THREE.IUniform<number> }

export function profileUniforms(texture: THREE.DataTexture, key: 'full' | 'web', close: THREE.IUniform<number>): Record<string, THREE.IUniform> {
  const set = rings.sets[key]
  const pad = (rows: number[]): number[] => Array.from({ length: 16 }, (_, i) => rows[Math.min(i, rows.length - 1)]!)
  return {
    uProf: { value: texture },
    uProfN: { value: set.n },
    uProfLevels: { value: set.hero.length },
    uHeroRow: { value: pad(set.hero) },
    uCloseRow: { value: pad(set.close) },
    uSpan: { value: new THREE.Vector2(rings.span[0]!, 1 / (rings.span[1]! - rings.span[0]!)) },
    uClose: close,
    uWarpH: { value: new THREE.Vector4().fromArray(rings.warpHero) },
    uWarpC: { value: new THREE.Vector4().fromArray(rings.warpClose) },
  }
}
