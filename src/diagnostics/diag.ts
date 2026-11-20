import type * as THREE from 'three'

export const DIAG_VIEWS = ['beauty', 'ungraded', 'nograin', 'texels', 'layers', 'depth', 'flow'] as const
export type DiagView = (typeof DIAG_VIEWS)[number]

const CODES: Record<string, number> = { beauty: 0, ungraded: 0, nograin: 0, texels: 2, layers: 3, depth: 4, flow: 5 }

export const diagUniform: THREE.IUniform<number> = { value: 0 }

export const gradUniform: THREE.IUniform<number> = { value: 1 }

export function setSamples(count: number, floor: number): void {
  gradUniform.value = Math.max(1 / Math.sqrt(Math.max(count, 1)), floor)
}

export function setDiag(view: string): number {
  diagUniform.value = CODES[view] ?? 0
  return diagUniform.value
}

export function isRaw(view: string): boolean {
  return (CODES[view] ?? 0) >= 2
}

export const DIAG_GLSL = /* glsl */ `
uniform int uDiag;
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
  return beauty;
}`
