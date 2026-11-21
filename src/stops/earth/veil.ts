import * as THREE from 'three'
import type { CoverState } from '../../core/types'
import { NOISE_GLSL } from '../../terrain/relief'

const VERT = /* glsl */ `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

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
uniform vec4 uSun;
uniform vec4 uNadir;
uniform vec4 uNear;
uniform vec4 uGrain;
uniform vec3 uEye;
uniform mat3 uTurn;
uniform int uDiag;
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
float cloud(vec3 v) {
  v += 0.6 * (vec3(vnoise(v * 0.7 + 3.1), vnoise(v * 0.7 + 17.7), vnoise(v * 0.7 + 41.3)) - 0.5);
  return 0.5 * vnoise(v) + 0.3 * vnoise(v * 2.03 + 11.7) + 0.2 * vnoise(v * 4.1 + 5.3);
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
  if (uDiag >= 2) discard;
  vec2 p = (vUv * 2.0 - 1.0) * uTan;
  float s = dot(p, uHorizon.xy) + uHorizon.z;
  vec2 along = vec2(uHorizon.y, -uHorizon.x);
  vec2 q = vec2(dot(p, along), s);
  vec3 ray = normalize(vec3(p, -1.0));
  float reach = dot(uCentre, ray);
  float miss = reach > 0.0 ? sqrt(max(dot(uCentre, uCentre) - reach * reach, 0.0)) : length(uCentre);
  vec3 hit = ray * (reach - sqrt(max(1.0 - miss * miss, 0.0))) - uCentre;
  float streak = 0.0;
  float wisp = 0.0;
  float billow = 0.0;
  float fine = 0.0;
  for (int k = 0; k < (uNear.x < 0.5 || (uNear.x > 1.5 && uNear.z > 0.0) ? 1 : 0); k++) {
    streak = fbm(q * vec2(1.6, 5.0) + uFlow) - 0.47;
    wisp = fbm(q * vec2(4.0, 13.0) + uFlow * 2.3 + 5.0) - 0.47;
    billow = uContrast.x * rush(p, uBillow);
    fine = uContrast.y * rush(p, uStreak);
  }
  for (int k = 0; k < (uNear.x > 0.5 && uNear.x < 1.5 ? 1 : 0); k++) {
    vec3 w = uTurn * normalize(vec3(p, -1.0));
    float fall = 1.0 / max(-w.z, 0.03);
    billow = uGrain.z * (fbm((uEye.xy + w.xy * (uEye.z + uNear.y) * fall) * uGrain.x) - 0.47);
    fine = uGrain.w * (fbm((uEye.xy + w.xy * (uEye.z + uNear.z) * fall) * uGrain.y + 31.7) - 0.47);
    wisp = uNear.w * (fbm((uEye.xy + w.xy * (uEye.z + uNear.z) * fall) * uGrain.y * 3.1 + 7.9) - 0.47);
  }
  for (int k = 0; k < (uNear.x > 1.5 ? 1 : 0); k++) {
    vec3 g = uTurn * normalize(hit);
    streak *= uNear.z;
    billow = mix(uGrain.z * (cloud(g * uGrain.x) - 0.5), billow, uNear.z);
    fine = mix(uGrain.w * (cloud(g * uGrain.y + 31.7) - 0.5), fine, uNear.z);
    wisp = mix(uNear.w * (cloud(g * uNear.y + 7.9) - 0.5), wisp, uNear.z);
  }
  float band = smoothstep(-uSoft, uSoft, s + 0.12 * streak + 0.2 * billow);
  vec3 col = mix(uLow, uColor, band) * (1.0 + 0.5 * streak + 0.22 * wisp) * max(1.0 + billow + fine, 0.15);
  col *= mix(1.0, uTop, smoothstep(0.0, 0.22, s)) * mix(1.0, 0.7, smoothstep(0.0, -0.6, s));
  float a = smoothstep(0.0, 1.0, uAmount * (1.1 + 1.1 * streak + 0.5 * wisp + 1.6 * billow + 1.2 * fine) - 0.22 * (1.0 - uAmount));
  a *= 1.0 - smoothstep(uShell.x, uShell.y, miss);
  col *= mix(1.0, mix(0.03, 1.0, smoothstep(-0.1, 0.3, dot(normalize(hit), uSun.xyz))), uSun.w);
  float above = acos(clamp(dot(ray, uNadir.xyz), -1.0, 1.0)) - uNadir.w;
  a *= 1.0 - smoothstep(-0.05, -0.012, above);
  outColor = vec4(col, a);
}`

const OPEN = 1e9

export interface Deck { grain: [number, number, number]; gain: [number, number, number]; rush: number; shade: number; turn: THREE.Matrix3 }
export interface Near { depth: [number, number]; grain: [number, number]; gain: [number, number, number]; eye: THREE.Vector3; turn: THREE.Matrix3 }

export class Veil {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(diag: THREE.IUniform<number>) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uColor: { value: new THREE.Vector3(1, 1, 1) }, uLow: { value: new THREE.Vector3(1, 1, 1) }, uAmount: { value: 0 }, uHorizon: { value: new THREE.Vector3(0, 1, 0) }, uSoft: { value: 0.2 },
        uFlow: { value: new THREE.Vector2() }, uTan: { value: new THREE.Vector2(1, 1) }, uTop: { value: 0.3 },
        uFocus: { value: new THREE.Vector3() }, uBillow: { value: new THREE.Vector3(1, 1, 1) }, uStreak: { value: new THREE.Vector3(1, 1, 1) }, uContrast: { value: new THREE.Vector2() },
        uCentre: { value: new THREE.Vector3() }, uShell: { value: new THREE.Vector2(OPEN, 2 * OPEN) },
        uSun: { value: new THREE.Vector4(0, 0, 1, 0) }, uNadir: { value: new THREE.Vector4(0, -1, 0, 10) },
        uNear: { value: new THREE.Vector4() }, uGrain: { value: new THREE.Vector4() }, uEye: { value: new THREE.Vector3() }, uTurn: { value: new THREE.Matrix3() },
        uDiag: diag,
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 1000
    this.mesh.visible = false
  }

  update(cover: CoverState, amount: number, exposure: number, vfov: number, aspect: number, sun: THREE.Vector3 | null, sea: { nadir: THREE.Vector3; alpha: number } | null, rim: [number, number], near: Near | null = null, deck: Deck | null = null): void {
    this.mesh.visible = amount > 0 && cover.low !== undefined
    if (!this.mesh.visible) return
    const u = this.material.uniforms
    ;(u.uNear!.value as THREE.Vector4).set(near ? 1 : deck ? 2 : 0, near ? near.depth[0] : deck ? deck.grain[2] : 0, near ? near.depth[1] : deck ? deck.rush : 0, near ? near.gain[2] : deck ? deck.gain[2] : 0)
    if (near) {
      ;(u.uGrain!.value as THREE.Vector4).set(near.grain[0], near.grain[1], near.gain[0], near.gain[1])
      ;(u.uEye!.value as THREE.Vector3).copy(near.eye)
      ;(u.uTurn!.value as THREE.Matrix3).copy(near.turn)
    } else if (deck) {
      ;(u.uGrain!.value as THREE.Vector4).set(deck.grain[0], deck.grain[1], deck.gain[0], deck.gain[1])
      ;(u.uTurn!.value as THREE.Matrix3).copy(deck.turn)
    }
    ;(u.uColor!.value as THREE.Vector3).fromArray(cover.color).multiplyScalar(1 / exposure)
    ;(u.uLow!.value as THREE.Vector3).fromArray(cover.low ?? cover.color).multiplyScalar(1 / exposure)
    u.uAmount!.value = amount
    u.uTop!.value = cover.top ?? 0.3
    const h = cover.horizon
    const nadir = u.uNadir!.value as THREE.Vector4
    if (sea) {
      const n = sea.nadir
      const len = Math.hypot(n.x, n.y)
      const gap = Math.min(Math.max(Math.acos(Math.min(Math.max(-n.z, -1), 1)) - sea.alpha, -1.4), 1.4)
      ;(u.uHorizon!.value as THREE.Vector3).set(len > 1e-5 ? -n.x / len : 0, len > 1e-5 ? -n.y / len : 1, Math.tan(gap))
      nadir.set(n.x, n.y, n.z, sea.alpha)
    } else {
      ;(u.uHorizon!.value as THREE.Vector3).set(h ? h.normal[0] : 0, h ? h.normal[1] : 1, h ? h.offset : 0)
      nadir.set(0, -1, 0, 10)
    }
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
    ;(u.uShell!.value as THREE.Vector2).set(shell ? rim[0] : OPEN, shell ? rim[1] : 2 * OPEN)
    const sunAt = u.uSun!.value as THREE.Vector4
    if (sun) sunAt.set(sun.x, sun.y, sun.z, deck ? deck.shade : 1)
    else sunAt.w = 0
    const t = Math.tan(THREE.MathUtils.degToRad(vfov) / 2)
    ;(u.uTan!.value as THREE.Vector2).set(t * aspect, t)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
