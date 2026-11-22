import * as THREE from 'three'
import { Pass } from '../core/pass'
import type { CoverState } from '../core/types'
import { NOISE_GLSL } from './relief'

const FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform vec3 uLow;
uniform float uAmount;
uniform vec3 uHorizon;
uniform float uSoft;
uniform vec2 uFlow;
uniform vec2 uTan;
uniform float uTop;
uniform vec3 uFocus;
uniform vec3 uBillow;
uniform vec3 uStreak;
uniform vec2 uContrast;
uniform vec3 uCentre;
uniform vec2 uShell;
in vec2 vUv;
out vec4 outColor;
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
${NOISE_GLSL}
float rush(vec2 p, vec3 k) {
  vec2 r = p - uFocus.xy;
  float rad = length(r) + 1e-4;
  vec3 q = vec3(r / rad * k.x, log(rad) * k.y - uFocus.z * k.z);
  float n = 0.6 * vnoise(q) + 0.28 * vnoise(q * 2.07 + 4.3) + 0.12 * vnoise(q * 4.3 + 9.1);
  return (n - 0.5) * smoothstep(0.03, 0.3, rad);
}
float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * noise(p);
    p = p * 2.03 + 11.7;
    a *= 0.5;
  }
  return s;
}
void main() {
  vec2 p = (vUv * 2.0 - 1.0) * uTan;
  float s = dot(p, uHorizon.xy) + uHorizon.z;
  vec2 along = vec2(uHorizon.y, -uHorizon.x);
  vec2 q = vec2(dot(p, along), s);
  float streak = fbm(q * vec2(1.6, 5.0) + uFlow) - 0.47;
  float wisp = fbm(q * vec2(4.0, 13.0) + uFlow * 2.3 + 5.0) - 0.47;
  float billow = uContrast.x * rush(p, uBillow);
  float fine = uContrast.y * rush(p, uStreak);
  float band = smoothstep(-uSoft, uSoft, s + 0.12 * streak + 0.2 * billow);
  vec3 col = mix(uLow, uColor, band) * (1.0 + 0.5 * streak + 0.22 * wisp) * max(1.0 + billow + fine, 0.15);
  col *= mix(1.0, uTop, smoothstep(0.0, 0.22, s)) * mix(1.0, 0.7, smoothstep(0.0, -0.6, s));
  float a = smoothstep(0.0, 1.0, uAmount * (1.1 + 1.1 * streak + 0.5 * wisp + 1.6 * billow + 1.2 * fine) - 0.22 * (1.0 - uAmount));
  a = mix(a, 1.0, smoothstep(0.86, 1.0, uAmount));
  vec3 ray = normalize(vec3(p, -1.0));
  float reach = dot(uCentre, ray);
  float miss = reach > 0.0 ? sqrt(max(dot(uCentre, uCentre) - reach * reach, 0.0)) : length(uCentre);
  a *= 1.0 - smoothstep(uShell.x, uShell.y, miss);
  outColor = vec4(col, a);
}`

const OPEN = 1e9
const NOISE_MOST = 0.47
const RUSH_MOST = 0.5
const SLACK = 1e-3

export function coverReaches(cover: CoverState, vfov: number, aspect: number): boolean {
  const amount = cover.amount
  if (!(amount > 0)) return false
  const k = cover.rush
  const most = 1.1 + (1.1 + 0.5) * NOISE_MOST + RUSH_MOST * (1.6 * Math.abs(k ? k.contrast[0] : 0) + 1.2 * Math.abs(k ? k.contrast[1] : 0))
  if (amount < 0.86 - SLACK && amount * most - 0.22 * (1 - amount) < -SLACK) return false
  const shell = cover.shell
  if (!shell || !(shell.inner < shell.outer)) return true
  if (shell.outer < 0) return false
  const [x, y, z] = shell.centre
  const far = Math.hypot(x, y, z)
  if (!(far > 0)) return true
  const ty = Math.tan(THREE.MathUtils.degToRad(vfov) / 2)
  const tx = ty * aspect
  if (z < 0 && Math.abs(x) <= -z * tx && Math.abs(y) <= -z * ty) return true
  const cos = (px: number, py: number): number => (x * px + y * py - z) / Math.hypot(px, py, 1) / far
  let best = -1
  for (const px of [-tx, tx]) {
    for (const py of [-ty, ty]) best = Math.max(best, cos(px, py))
    const lead = x * px - z
    const at = lead !== 0 ? (y * (px * px + 1)) / lead : NaN
    if (Math.abs(at) < ty) best = Math.max(best, cos(px, at))
  }
  for (const py of [-ty, ty]) {
    const lead = y * py - z
    const at = lead !== 0 ? (x * (py * py + 1)) / lead : NaN
    if (Math.abs(at) < tx) best = Math.max(best, cos(at, py))
  }
  const miss = best > 0 ? far * Math.sqrt(Math.max(1 - best * best, 0)) : far
  return !(miss > shell.outer + SLACK + (1e-5 * far * far) / Math.max(miss, SLACK))
}

export class Cover {
  private readonly pass = new Pass(FRAG, {
    uColor: { value: new THREE.Vector3(1, 1, 1) }, uLow: { value: new THREE.Vector3(1, 1, 1) }, uAmount: { value: 0 }, uHorizon: { value: new THREE.Vector3(0, 1, 0) }, uSoft: { value: 0.2 }, uFlow: { value: new THREE.Vector2() }, uTan: { value: new THREE.Vector2(1, 1) }, uTop: { value: 0.3 },
    uFocus: { value: new THREE.Vector3() }, uBillow: { value: new THREE.Vector3(1, 1, 1) }, uStreak: { value: new THREE.Vector3(1, 1, 1) }, uContrast: { value: new THREE.Vector2() },
    uCentre: { value: new THREE.Vector3() }, uShell: { value: new THREE.Vector2(OPEN, 2 * OPEN) },
  }, {
    transparent: true,
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
  })

  render(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget, cover: CoverState, exposure: number, vfov: number, aspect: number): void {
    const u = this.pass.material.uniforms
    ;(u.uColor!.value as THREE.Vector3).fromArray(cover.color).multiplyScalar(1 / exposure)
    ;(u.uLow!.value as THREE.Vector3).fromArray(cover.low ?? cover.color).multiplyScalar(1 / exposure)
    u.uAmount!.value = cover.amount
    u.uTop!.value = cover.top ?? 0.3
    const h = cover.horizon
    ;(u.uHorizon!.value as THREE.Vector3).set(h ? h.normal[0] : 0, h ? h.normal[1] : 1, h ? h.offset : 0)
    u.uSoft!.value = h ? h.soft : 4
    ;(u.uFlow!.value as THREE.Vector2).set(cover.flow?.[0] ?? 0, cover.flow?.[1] ?? 0)
    const k = cover.rush
    ;(u.uFocus!.value as THREE.Vector3).set(k ? k.focus[0] : 0, k ? k.focus[1] : 0, k ? k.phase : 0)
    if (k) {
      ;(u.uBillow!.value as THREE.Vector3).fromArray(k.billow)
      ;(u.uStreak!.value as THREE.Vector3).fromArray(k.streak)
    }
    ;(u.uContrast!.value as THREE.Vector2).set(k ? k.contrast[0] : 0, k ? k.contrast[1] : 0)
    const shell = cover.shell
    ;(u.uCentre!.value as THREE.Vector3).set(shell ? shell.centre[0] : 0, shell ? shell.centre[1] : 0, shell ? shell.centre[2] : 0)
    ;(u.uShell!.value as THREE.Vector2).set(shell ? shell.inner : OPEN, shell ? shell.outer : 2 * OPEN)
    const t = Math.tan(THREE.MathUtils.degToRad(vfov) / 2)
    ;(u.uTan!.value as THREE.Vector2).set(t * aspect, t)
    this.pass.render(renderer, target)
  }
}
