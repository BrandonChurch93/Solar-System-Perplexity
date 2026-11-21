import * as THREE from 'three'
import model from './closeModel.json'
import rings from './rings.json'

export const RING_PROFILE_GLSL = /* glsl */ `
uniform highp sampler2D uProf;
uniform int uProfN;
uniform int uProfLevels;
uniform int uHeroRow[16];
uniform int uCloseRow[16];
uniform vec2 uSpan;
uniform float uClose;
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
  for (int k = 0; k < (uClose < 1.0 ? 1 : 0); k++) h = mix(profLevel(uHeroRow[l0], uProfN >> l0, x), profLevel(uHeroRow[l1], uProfN >> l1, x), t);
  for (int k = 0; k < (uClose > 0.0 ? 1 : 0); k++) c = mix(profLevel(uCloseRow[l0], uProfN >> l0, x), profLevel(uCloseRow[l1], uProfN >> l1, x), t);
  return mix(h, c, uClose);
}
float ringRadius(float r) {
  return (r - uSpan.x) * uSpan.y;
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

export const RING_LAYOUT_GLSL = /* glsl */ `
uniform highp sampler2D uLayout;
uniform highp sampler2D uLayoutEven;
uniform float uGate;
uniform mat4 uLayoutM;
uniform vec2 uLayoutSize;
uniform vec4 uWarpH;
uniform vec4 uWarpC;
uniform vec4 uModelC;
uniform vec2 uModelR;
uniform vec4 uModelB;
uniform vec2 uSettle;
uniform float uJunction;
float warpSeg(float l, float c0, float c1, float h0, float h1) {
  return h0 + (l - c0) * (h1 - h0) / (c1 - c0);
}
float warpTo(float l) {
  return l < uWarpC.y ? warpSeg(l, uWarpC.x, uWarpC.y, uWarpH.x, uWarpH.y) : (l < uWarpC.z ? warpSeg(l, uWarpC.y, uWarpC.z, uWarpH.y, uWarpH.z) : warpSeg(l, uWarpC.z, uWarpC.w, uWarpH.z, uWarpH.w));
}
float circleAt(vec2 q, vec2 c1, float a, float b) {
  float A = dot(c1, c1) - b * b;
  float B = dot(q, c1) + a * b;
  return (B - sqrt(max(B * B - A * (dot(q, q) - a * a), 0.0))) / A;
}
float familyAt(vec3 p, float t) {
  vec2 c1 = uModelC.zw * t;
  vec2 q = vec2(dot(p.xz, uModelB.xy), dot(p.xz, uModelB.zw)) - uModelC.xy * t;
  vec3 slope = (uWarpH.yzw - uWarpH.xyz) / (uWarpC.yzw - uWarpC.xyz);
  float r1 = mix(uWarpH.y, uModelR.x + uModelR.y * uWarpC.y, t);
  float r2 = mix(uWarpH.z, uModelR.x + uModelR.y * uWarpC.z, t);
  bool first = length(q - c1 * uWarpC.y) < r1;
  bool second = length(q - c1 * uWarpC.z) < r2;
  float b = mix(first ? slope.x : (second ? slope.y : slope.z), uModelR.y, t);
  float a = first ? r1 - b * uWarpC.y : r2 - b * uWarpC.z;
  return circleAt(q, c1, a, b);
}
float layoutCut = 1.0;
float layoutOver = 0.0;
float layoutDist = 4000.0;
vec3 ringLayout(vec3 p, float r) {
  vec4 t = vec4(0.0, 1.0, 0.0, 4000.0);
  float rho = r;
  float inside = 0.0;
  for (int k = 0; k < (uClose > 0.0 ? 1 : 0); k++) {
    vec4 c = uLayoutM * vec4(p, 1.0);
    vec2 uv = c.xy / max(c.w, 1e-4) * vec2(0.5, -0.5) + 0.5;
    vec2 e = min(uv, 1.0 - uv);
    inside = c.w > 1e-3 ? smoothstep(0.0, 0.04, min(e.x, e.y)) : 0.0;
    for (int j = 0; j < (inside > 0.0 ? 1 : 0); j++) {
      vec2 f = clamp(uv * uLayoutSize - 0.5, vec2(0.0), uLayoutSize - 1.0);
      ivec2 i = ivec2(floor(f));
      ivec2 n = min(i + 1, ivec2(uLayoutSize) - 1);
      vec2 w = f - vec2(i);
      t = mix(mix(texelFetch(uLayout, i, 0), texelFetch(uLayout, ivec2(n.x, i.y), 0), w.x), mix(texelFetch(uLayout, ivec2(i.x, n.y), 0), texelFetch(uLayout, n, 0), w.x), w.y);
      for (int g = 0; g < (uGate < 1.0 ? 1 : 0); g++) t.g = mix(mix(mix(texelFetch(uLayoutEven, i, 0).r, texelFetch(uLayoutEven, ivec2(n.x, i.y), 0).r, w.x), mix(texelFetch(uLayoutEven, ivec2(i.x, n.y), 0).r, texelFetch(uLayoutEven, n, 0).r, w.x), w.y), t.g, uGate);
      layoutCut = mix(1.0, smoothstep(-uJunction, uJunction, t.a), inside);
      layoutOver = inside * smoothstep(-uJunction, uJunction, t.a);
      layoutDist = t.a;
    }
    rho = warpTo(familyAt(p, uClose) + inside * t.r * smoothstep(uSettle.x, uSettle.y, uClose));
  }
  float k = inside * uClose * t.b;
  return vec3(rho, mix(1.0, t.g, k), k);
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
  }
}

export function layoutUniforms(texture: THREE.DataTexture, even: THREE.DataTexture, gate: THREE.IUniform<number>, matrix: THREE.Matrix4, width: number, height: number, along: THREE.Vector3, across: THREE.Vector3): Record<string, THREE.IUniform> {
  return {
    uModelC: { value: new THREE.Vector4(model.c0[0]!, model.c0[1]!, model.c1[0]!, model.c1[1]!) },
    uModelR: { value: new THREE.Vector2(model.R[0]!, model.R[1]!) },
    uModelB: { value: new THREE.Vector4(along.x, along.z, across.x, across.z) },
    uSettle: { value: new THREE.Vector2(model.settle[0]!, model.settle[1]!) },
    uLayout: { value: texture },
    uLayoutEven: { value: even },
    uGate: gate,
    uLayoutM: { value: matrix },
    uLayoutSize: { value: new THREE.Vector2(width, height) },
    uWarpH: { value: new THREE.Vector4().fromArray(rings.warpHero) },
    uWarpC: { value: new THREE.Vector4().fromArray(rings.warpClose) },
  }
}
