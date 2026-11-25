import type * as THREE from 'three'

export const DIAG_VIEWS = ['beauty', 'ungraded', 'nograin', 'texels', 'layers', 'depth', 'flow', 'range'] as const
export type DiagView = (typeof DIAG_VIEWS)[number]

const CODES: Record<string, number> = { beauty: 0, ungraded: 0, nograin: 0, texels: 2, layers: 3, depth: 4, flow: 5, range: 6 }

export const diagUniform: THREE.IUniform<number> = { value: 0 }

export const gradUniform: THREE.IUniform<number> = { value: 1 }

export const fineUniform: THREE.IUniform<number> = { value: 1 }

export const biasUniform: THREE.IUniform<number> = { value: 0 }

export function setFine(scale: number): void {
  fineUniform.value = scale
  biasUniform.value = Math.log2(scale)
}

export function setSamples(count: number, floor: number, soft = 0): void {
  const sharp = Math.max(1 / Math.sqrt(Math.max(count, 1)), floor)
  gradUniform.value = soft > 0 ? sharp + (1 - sharp) * soft : sharp
}

// The footprint of a lookup by the way of its own point (gradAt of GRAD_GLSL). uGrad is one number for the whole sample. In a frame that
// moves, the middle the lens flies to stands nearly still while the rim runs, and one number is wrong for one of the two. A shader that
// puts GRAD_GLSL in and spreads gradUniforms into its material reads gradAt(vView) in place of uGrad, with vView the point of the fragment
// in view space, (modelViewMatrix * vec4(position, 1.0)).xyz: the factor of setSamples with the count the point's own way gives,
// count = samples / max(way, 1) / cover, never above samples, where way is how far the point moves across the open shutter in px of the
// master. A point that stands still gets the count of the frame over the cover, the fastest point of the frame what sharpCount of
// src/core/motion.ts gives the frame, and a point that leaves the half space in front of the lens inside the shutter counts as fastest.
// uWay is (samples, cover, floor, soft); uWayOpen and uWayClose take the view space point of this sample to where the lens sees it as the
// shutter opens and as it closes: (x px, y px, unused, 1) times the distance in front of the lens (wayMatrix of src/core/motion.ts).
// Off, with samples 0, gradAt returns uGrad itself: outside the dives and rises of the stops handover.sharpCover names, at one sample, with
// the shutter shut, and in a pass with a lens of its own.
export const wayUniform: THREE.IUniform<Float32Array> = { value: new Float32Array(4) }
export const wayOpenUniform: THREE.IUniform<Float32Array> = { value: new Float32Array(16) }
export const wayCloseUniform: THREE.IUniform<Float32Array> = { value: new Float32Array(16) }

export const gradUniforms = { uGrad: gradUniform, uWay: wayUniform, uWayOpen: wayOpenUniform, uWayClose: wayCloseUniform }

export interface Way { cover: number; open: ArrayLike<number>; close: ArrayLike<number> }

export function setWay(way: Way | null, samples = 0, floor = 0, soft = 0): void {
  const u = wayUniform.value
  if (!way || !(samples > 1) || !(way.cover > 0)) {
    u[0] = 0
    return
  }
  u[0] = samples
  u[1] = way.cover
  u[2] = floor
  u[3] = soft
  wayOpenUniform.value.set(way.open)
  wayCloseUniform.value.set(way.close)
}

export const GRAD_GLSL = /* glsl */ `
uniform float uGrad;
uniform vec4 uWay;
uniform mat4 uWayOpen;
uniform mat4 uWayClose;
float gradAt(vec3 view) {
  if (uWay.x <= 0.0) return uGrad;
  vec4 a = uWayOpen * vec4(view, 1.0);
  vec4 b = uWayClose * vec4(view, 1.0);
  float way = a.w > 1e-9 && b.w > 1e-9 ? distance(a.xy / a.w, b.xy / b.w) : 1e9;
  float count = min(uWay.x / (max(way, 1.0) * uWay.y), uWay.x);
  float sharp = max(inversesqrt(max(count, 1.0)), uWay.z);
  return sharp + (1.0 - sharp) * uWay.w;
}`

export function setDiag(view: string): number {
  diagUniform.value = CODES[view] ?? 0
  return diagUniform.value
}

export function isRaw(view: string): boolean {
  return (CODES[view] ?? 0) >= 2
}

export const RANGE_LOW = -20
export const RANGE_OCTAVES = 32

export function rangeOf(r: number, g: number, b: number): number | null {
  const n = r * 65536 + g * 256 + b
  return n > 0 ? 2 ** (RANGE_LOW + ((n - 1) / 16777214) * RANGE_OCTAVES) : null
}

export const DIAG_GLSL = /* glsl */ `
uniform int uDiag;
const float RANGE_LOW = ${RANGE_LOW}.0;
const float RANGE_OCTAVES = ${RANGE_OCTAVES}.0;
float diagTexels(vec2 uvTexels) {
  vec2 dx = dFdx(uvTexels);
  vec2 dy = dFdy(uvTexels);
  return sqrt(max(dot(dx, dx), dot(dy, dy)));
}
float diagTexelsDir(vec3 dir, float mapWidth) {
  vec3 dx = dFdx(dir);
  vec3 dy = dFdy(dir);
  return sqrt(max(dot(dx, dx), dot(dy, dy))) * mapWidth / 6.283185307;
}
vec4 diagOut(vec4 beauty, float texels, float counted, vec3 layer, vec2 flow, float viewDepth) {
  if (uDiag == 2) return vec4(clamp(texels * 0.5, 0.0, 1.0), counted, 0.0, 1.0);
  if (uDiag == 3) return vec4(layer, 1.0);
  if (uDiag == 4) {
    float d = clamp(log2(1.0 + viewDepth) / 14.0, 0.0, 1.0);
    return vec4(d, d, d, 1.0);
  }
  if (uDiag == 5) return vec4(0.5 + flow * 0.5, 0.0, 1.0);
  if (uDiag == 6) {
    float n = 1.0 + floor(clamp((log2(max(viewDepth, 1e-30)) - RANGE_LOW) / RANGE_OCTAVES, 0.0, 1.0) * 16777214.0);
    float high = floor(n / 65536.0);
    float mid = floor((n - high * 65536.0) / 256.0);
    return vec4(high / 255.0, mid / 255.0, (n - high * 65536.0 - mid * 256.0) / 255.0, 1.0);
  }
  return beauty;
}`
