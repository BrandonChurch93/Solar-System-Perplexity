import * as THREE from 'three'
import { config, type Segment } from '../../config'
import type { ViewKind } from '../../core/types'
import type { StopPlan } from '../../director/moves'
import { slerpDir, smooth } from '../../director/rig'
import { DIAG_GLSL, diagUniform } from '../../diagnostics/diag'
import { NOISE_GLSL } from '../../terrain/relief'

export interface PallLook { clear: number; gather: number; orbitClear: number; orbitGather: number; orbitThin?: number; orbitRays?: number; lit?: [number, number, number]; shell: [number, number]; morph: number }

export interface PallSeaShape { centre: [number, number, number]; radius: number; orbitShell: [number, number] }

export const PALL_GLSL = /* glsl */ `
uniform vec4 uPall;
uniform vec3 uPallFocus;
uniform vec4 uPallHorizon;
uniform vec2 uPallFlow;
uniform vec3 uPallColor;
uniform vec3 uPallLow;
uniform vec3 uPallBillow;
uniform vec3 uPallStreak;
uniform vec2 uPallContrast;
uniform vec2 uPallShell;
uniform vec4 uPallSea;
uniform vec3 uPallLit;
${NOISE_GLSL}
float pallHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float pallNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(pallHash(i), pallHash(i + vec2(1.0, 0.0)), f.x), mix(pallHash(i + vec2(0.0, 1.0)), pallHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float pallFbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * pallNoise(p);
    p = p * 2.03 + 11.7;
    a *= 0.5;
  }
  return s;
}
float pallRush(vec2 p, vec3 k) {
  vec2 r = p - uPallFocus.xy;
  float rad = length(r) + 1e-4;
  vec3 q = vec3(r / rad * k.x, log(rad) * k.y - uPallFocus.z * k.z);
  float n = 0.6 * vnoise(q) + 0.28 * vnoise(q * 2.07 + 4.3) + 0.12 * vnoise(q * 4.3 + 9.1);
  return (n - 0.5) * smoothstep(0.03, 0.3, rad);
}
vec4 pall(vec2 ndc) {
  vec2 p = ndc * uPall.yz;
  float s = dot(p, uPallHorizon.xy) + uPallHorizon.z;
  vec2 q = vec2(dot(p, vec2(uPallHorizon.y, -uPallHorizon.x)), s);
  float streak = pallFbm(q * vec2(1.6, 5.0) + uPallFlow) - 0.47;
  float wisp = pallFbm(q * vec2(4.0, 13.0) + uPallFlow * 2.3 + 5.0) - 0.47;
  float billow = uPallContrast.x * pallRush(p, uPallBillow);
  float fine = uPallContrast.y * pallRush(p, uPallStreak);
  float band = smoothstep(-uPallHorizon.w, uPallHorizon.w, s + 0.12 * streak + 0.2 * billow);
  vec3 col = mix(uPallLow, uPallColor, band) * (1.0 + 0.5 * streak + 0.22 * wisp) * max(1.0 + billow + fine, 0.15);
  col *= mix(1.0, uPall.w, smoothstep(0.0, 0.22, s)) * mix(1.0, 0.7, smoothstep(0.0, -0.6, s));
  float a = smoothstep(0.0, 1.0, uPall.x * (1.1 + 1.1 * streak + 0.5 * wisp + 1.6 * billow + 1.2 * fine) - 0.22 * (1.0 - uPall.x));
  return vec4(col, mix(a, 1.0, smoothstep(0.86, 1.0, uPall.x)));
}
float pallReach(vec2 ndc) {
  vec3 ray = normalize(vec3(ndc * uPall.yz, -1.0));
  float reach = dot(uPallSea.xyz, ray);
  float miss = reach > 0.0 ? sqrt(max(dot(uPallSea.xyz, uPallSea.xyz) - reach * reach, 0.0)) : length(uPallSea.xyz);
  return 1.0 - smoothstep(uPallShell.x, uPallShell.y, miss);
}`

const SEA_VERT = /* glsl */ `
out vec2 vNdc;
void main() {
  vNdc = position.xy;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

const SEA_FRAG = /* glsl */ `
precision highp float;
uniform float uGain;
in vec2 vNdc;
out vec4 outColor;
${DIAG_GLSL}
${PALL_GLSL}
void main() {
  vec4 cloud = vec4(0.0);
  for (int k = 0; k < (uPall.x > 0.0 ? 1 : 0); k++) {
    cloud = pall(vNdc);
    cloud.a *= pallReach(vNdc);
  }
  outColor = vec4(cloud.rgb * uGain * cloud.a, cloud.a);
  if (uDiag >= 2) discard;
}`

export function pallUniforms(shell: [number, number]): Record<string, THREE.IUniform> {
  return {
    uPall: { value: new THREE.Vector4(0, 1, 1, 0) }, uPallFocus: { value: new THREE.Vector3() }, uPallHorizon: { value: new THREE.Vector4(0, 1, 0, 0.22) }, uPallFlow: { value: new THREE.Vector2() },
    uPallColor: { value: new THREE.Vector3() }, uPallLow: { value: new THREE.Vector3() }, uPallBillow: { value: new THREE.Vector3(1, 1, 1) }, uPallStreak: { value: new THREE.Vector3(1, 1, 1) },
    uPallContrast: { value: new THREE.Vector2() }, uPallShell: { value: new THREE.Vector2(shell[0], shell[1]) }, uPallSea: { value: new THREE.Vector4(0, 0, -2, 0) }, uPallLit: { value: new THREE.Vector3(-2, -1, 1) },
  }
}

export class PallSea {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(uniforms: Record<string, THREE.IUniform>) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: SEA_VERT,
      fragmentShader: SEA_FRAG,
      uniforms: { ...uniforms, uGain: { value: 1 }, uDiag: diagUniform },
      transparent: true,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      depthTest: false,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 10
  }
}

export class Pall {
  private readonly focus: Record<'dive' | 'rise', [number, number]>
  private readonly cut: Record<'dive' | 'rise', THREE.Vector3>
  private readonly centre = new THREE.Vector3()
  private readonly c = new THREE.Vector3()
  private readonly q = new THREE.Quaternion()

  constructor(private readonly plan: StopPlan, private readonly look: PallLook, private readonly sea: PallSeaShape) {
    this.focus = { dive: this.aim(true), rise: this.aim(false) }
    this.centre.fromArray(sea.centre)
    const seen = (pose: { position: THREE.Vector3; quaternion: THREE.Quaternion }) => pose.position.clone().negate().applyQuaternion(pose.quaternion.clone().invert())
    this.cut = { dive: seen(plan.dive(plan.coverCenter(plan.seg.dive!) - 1e-6).pose), rise: seen(plan.rise(plan.coverCenter(plan.seg.rise)).pose) }
  }

  private aim(dive: boolean): [number, number] {
    const p = this.plan
    const k = p.p.coverRush
    if (!k) return [0, 0]
    const h = 0.125 / config.fps
    const sign = dive ? 1 : -1
    const c = p.coverCenter(dive ? p.seg.dive! : p.seg.rise)
    const at = (t: number) => (dive ? p.dive(t) : p.rise(t)).pose
    const from = at(sign > 0 ? c : c - 2 * h)
    const v = at(sign > 0 ? c + h : c - h).position.clone().sub(from.position).multiplyScalar(sign).applyQuaternion(from.quaternion.clone().invert())
    const flat = Math.hypot(v.x, v.y)
    const reach = v.z < 0 ? Math.min(flat / -v.z, k.reach) : k.reach
    return flat > 1e-9 ? [(v.x / flat) * reach, (v.y / flat) * reach] : [0, 0]
  }

  apply(u: Record<string, THREE.IUniform>, seg: Segment, time: number, view: ViewKind, vfov: number, aspect: number): void {
    const p = this.plan
    const state = u.uPall!.value as THREE.Vector4
    ;(u.uPallSea!.value as THREE.Vector4).w = 0
    const k = p.p.coverRush
    if (!k || seg.stop !== p.id || (seg.kind !== 'dive' && seg.kind !== 'rise')) {
      state.x = 0
      return
    }
    const dive = seg.kind === 'dive'
    const shot = dive ? p.dive(time) : p.rise(time)
    if (shot.view !== view) {
      state.x = 0
      return
    }
    const dt = time - p.coverCenter(seg)
    const l = this.look
    const span = view === 'terrain' ? (dive ? l.clear : l.gather) : dive ? l.orbitGather : l.orbitClear
    const side = p.coverSide(seg, time)
    const blend = (x: [number, number, number], y?: [number, number, number]): [number, number, number] => (y ? [x[0] + (y[0] - x[0]) * side, x[1] + (y[1] - x[1]) * side, x[2] + (y[2] - x[2]) * side] : x)
    const top = p.p.coverTop
    const t = Math.tan(THREE.MathUtils.degToRad(vfov) / 2)
    const open = Math.min(Math.abs(dt) / span, 1)
    state.set(view !== 'terrain' && !dive && l.orbitThin !== undefined ? 1 - Math.pow(open, l.orbitThin) : smooth(1 - open), t * aspect, t, top ? top[0] + (top[1] - top[0]) * side : 0.3)
    const hz = p.horizon(view === 'terrain' ? 'terrain' : 'orbit', shot.pose)
    ;(u.uPallHorizon!.value as THREE.Vector4).set(hz.normal[0], hz.normal[1], hz.offset, hz.soft)
    ;(u.uPallFlow!.value as THREE.Vector2).set(0.7 * dt, (dive ? -3 : 3) * dt)
    const f = this.focus[dive ? 'dive' : 'rise']
    ;(u.uPallFocus!.value as THREE.Vector3).set(f[0], f[1], (dive ? 1 : -1) * k.speed * dt)
    ;(u.uPallColor!.value as THREE.Vector3).fromArray(blend(p.p.cover, p.p.coverTerrain))
    ;(u.uPallLow!.value as THREE.Vector3).fromArray(blend(p.p.coverLow ?? p.p.cover, p.p.coverLowTerrain))
    ;(u.uPallBillow!.value as THREE.Vector3).fromArray(k.billow)
    ;(u.uPallStreak!.value as THREE.Vector3).fromArray(k.streak)
    ;(u.uPallContrast!.value as THREE.Vector2).set(k.contrast[0], k.contrast[1] * (view !== 'terrain' && !dive && l.orbitRays !== undefined ? 1 - smooth(Math.min(open / l.orbitRays, 1)) : 1))
    const shell = u.uPallShell!.value as THREE.Vector2
    if (view !== 'terrain') {
      shell.fromArray(this.sea.orbitShell)
      if (l.lit) (u.uPallLit!.value as THREE.Vector3).fromArray(l.lit)
      return
    }
    const c = this.c.copy(this.centre).sub(shot.pose.position).divideScalar(this.sea.radius).applyQuaternion(this.q.copy(shot.pose.quaternion).invert())
    const w = smooth(1 - Math.abs(dt) / l.morph)
    if (w > 0) {
      const o = this.cut[dive ? 'dive' : 'rise']
      const low = c.length() - 1
      const high = o.length() - 1
      const alt = low * Math.pow(high / low, w)
      c.copy(slerpDir(c.clone().normalize(), o.clone().normalize(), w)).multiplyScalar(1 + alt)
    }
    ;(u.uPallSea!.value as THREE.Vector4).set(c.x, c.y, c.z, w)
    shell.set(l.shell[0] + (this.sea.orbitShell[0] - l.shell[0]) * w, l.shell[1] + (this.sea.orbitShell[1] - l.shell[1]) * w)
  }
}
