import * as THREE from 'three'
import { diagUniform } from '../../diagnostics/diag'

export interface RingLine {
  normal: [number, number, number]
  closed: boolean
  theta0: number
  step: number
  radius: Float32Array | number[]
  amp: Float32Array | number[]
}

export interface RingLook {
  color: [number, number, number]
  sigma: number
  halfWidth: number
  gain: number
  glint: [number, number]
  forward: [number, number]
  back: [number, number]
  shadowFloor: number
  flat: boolean
  even: number
  smear: number
  hair: { normal: [number, number, number]; count: number; from: number; to: number; amp: [number, number]; tiltDeg: number }
}

const VERT = /* glsl */ `
uniform mat4 uDelta;
in float aS;
in float aAmp;
in vec3 aTan;
out float vS;
out float vAmp;
out vec3 vTan;
out vec3 vLocal;
out vec4 vNow;
out vec4 vNext;
void main() {
  vS = aS;
  vAmp = aAmp;
  vTan = aTan;
  vLocal = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  vNow = gl_Position;
  vNext = projectionMatrix * (uDelta * mv);
}`

const FRAG = /* glsl */ `
precision highp float;
uniform float uSigma;
uniform vec3 uColor;
uniform vec3 uSunL;
uniform vec3 uCamL;
uniform vec3 uHoldCamL;
uniform vec2 uGlint;
uniform vec2 uForward;
uniform vec2 uBack;
uniform float uShadowFloor;
uniform float uGain;
uniform vec3 uMotion;
uniform float uReach;
uniform int uDiag;
in float vS;
in float vAmp;
in vec3 vTan;
in vec3 vLocal;
in vec4 vNow;
in vec4 vNext;
out vec4 outColor;
float strand(vec3 t, vec3 v) {
  float tl = dot(t, uSunL);
  float tv = dot(t, v);
  return pow(max(sqrt(max(1.0 - tl * tl, 0.0)) * sqrt(max(1.0 - tv * tv, 0.0)) - tl * tv, 0.0), uGlint.y);
}
float toward(vec3 v) {
  return pow(max(dot(-v, uSunL), 0.0), uForward.y);
}
float away(vec3 v) {
  return pow(max(dot(v, uSunL), 0.0), uBack.y);
}
void main() {
  if (uDiag >= 2) discard;
  vec2 across = vec2(dFdx(vS), dFdy(vS));
  float fw = length(across);
  vec2 move = (vNext.xy / max(vNext.w, 1e-5) - vNow.xy / max(vNow.w, 1e-5)) * uMotion.xy;
  float smear = min(abs(dot(move, across)) * uMotion.z, uReach);
  float sig = sqrt(uSigma * uSigma + fw * fw * 0.11 + smear * smear);
  float line = exp(-0.5 * vS * vS / (sig * sig)) * uSigma / sig;
  vec3 t = normalize(vTan);
  vec3 v = normalize(uCamL - vLocal);
  vec3 vh = normalize(uHoldCamL - vLocal);
  float glint = (1.0 + uGlint.x * strand(t, v)) / (1.0 + uGlint.x * strand(t, vh));
  float forward = (1.0 + uForward.x * toward(v)) / (1.0 + uForward.x * toward(vh));
  forward *= (1.0 + uBack.x * away(v)) / (1.0 + uBack.x * away(vh));
  float ps = dot(vLocal, uSunL);
  float perp = length(vLocal - ps * uSunL);
  float shadow = ps < 0.0 ? mix(uShadowFloor, 1.0, smoothstep(0.96, 1.04, perp)) : 1.0;
  outColor = vec4(uColor * (vAmp * line * glint * forward * shadow * uGain), 0.0);
}`

export function parseLines(buffer: ArrayBuffer): RingLine[] {
  const f = new Float32Array(buffer)
  const lines: RingLine[] = []
  let at = 1
  for (let i = 0; i < f[0]!; i++) {
    const m = f[at + 6]!
    const start = at + 7
    lines.push({
      normal: [f[at]!, f[at + 1]!, f[at + 2]!], closed: f[at + 3]! > 0.5, theta0: f[at + 4]!, step: f[at + 5]!,
      radius: f.subarray(start, start + m), amp: f.subarray(start + m, start + 2 * m),
    })
    at = start + 2 * m
  }
  return lines
}

export function evenLines(lines: RingLine[], normal: [number, number, number], keep: number): RingLine[] {
  return lines.map((line) => {
    let mean = 0
    for (const r of line.radius) mean += r / line.radius.length
    return { ...line, normal, radius: Array.from(line.radius, (r) => mean + (r - mean) * keep) }
  })
}

export function hairLines(look: RingLook): RingLine[] {
  const h = look.hair
  const n0 = new THREE.Vector3().fromArray(h.normal).normalize()
  const e1 = new THREE.Vector3(0, 0, 1).cross(n0).normalize()
  const e2 = n0.clone().cross(e1)
  const node = new THREE.Vector3()
  const n = new THREE.Vector3()
  const lines: RingLine[] = []
  const m = 360
  for (let k = 0; k < h.count; k++) {
    const f = (k * 0.6180339887 + 0.31) % 1
    const g = (k * 0.7548776662 + 0.11) % 1
    const cluster = 0.5 + 0.5 * Math.sin(f * 21 + 1.3)
    const level = h.amp[0] + (h.amp[1] - h.amp[0]) * g * cluster
    const nodeAngle = k * 2.399963
    node.copy(e1).multiplyScalar(Math.cos(nodeAngle)).addScaledVector(e2, Math.sin(nodeAngle))
    n.copy(n0).applyAxisAngle(node, THREE.MathUtils.degToRad(h.tiltDeg * (0.5 + 0.5 * Math.sin(k * 1.7))))
    const base = h.from + (h.to - h.from) * f
    const radius: number[] = []
    const amp: number[] = []
    for (let i = 0; i < m; i++) {
      const a = (i / m) * 2 * Math.PI
      const broken = 0.55 + 0.25 * Math.sin(a * 2 + k * 1.3) + 0.2 * Math.sin(a * 5 + k * 2.9) + 0.12 * Math.sin(a * 11 + k * 4.1)
      radius.push(base * (1 + 0.012 * Math.sin(a + k * 0.9) + 0.004 * Math.sin(a * 2 + k * 2.1)))
      amp.push(level * Math.max(broken, 0.08))
    }
    lines.push({ normal: [n.x, n.y, n.z], closed: true, theta0: 0, step: (2 * Math.PI) / m, radius, amp })
  }
  return lines
}

export function ringGeometry(look: RingLook, lines: RingLine[], flat?: { eye: THREE.Vector3; normal: THREE.Vector3 }): THREE.BufferGeometry {
  let count = 0
  for (const line of lines) count += (line.radius.length + (line.closed ? 1 : 0)) * 2
  const position = new Float32Array(count * 3)
  const side = new Float32Array(count)
  const amp = new Float32Array(count)
  const tan = new Float32Array(count * 3)
  const index: number[] = []
  const n = new THREE.Vector3()
  const u1 = new THREE.Vector3()
  const u2 = new THREE.Vector3()
  const p = new THREE.Vector3()
  const q = new THREE.Vector3()
  const t = new THREE.Vector3()
  const out = new THREE.Vector3()
  const ray = new THREE.Vector3()
  let v = 0
  for (const line of lines) {
    n.fromArray(line.normal).normalize()
    u1.set(0, 0, 1).cross(n).normalize()
    u2.copy(n).cross(u1)
    const m = line.radius.length
    const total = m + (line.closed ? 1 : 0)
    const point = (k: number, target: THREE.Vector3): THREE.Vector3 => {
      const i = line.closed ? ((k % m) + m) % m : Math.min(Math.max(k, 0), m - 1)
      const a = line.theta0 + k * line.step
      target.copy(u1).multiplyScalar(Math.cos(a) * line.radius[i]!).addScaledVector(u2, Math.sin(a) * line.radius[i]!)
      if (!flat) return target
      ray.copy(target).sub(flat.eye)
      return target.copy(flat.eye).addScaledVector(ray, -flat.eye.dot(flat.normal) / ray.dot(flat.normal))
    }
    const start = v
    for (let k = 0; k < total; k++) {
      const i = line.closed ? k % m : k
      point(k, p)
      t.copy(point(k + 1, q)).sub(point(k - 1, q)).normalize()
      out.copy(t).cross(flat ? flat.normal : n).normalize()
      for (const s of [-1, 1]) {
        position.set([p.x + out.x * s * look.halfWidth, p.y + out.y * s * look.halfWidth, p.z + out.z * s * look.halfWidth], v * 3)
        tan.set([t.x, t.y, t.z], v * 3)
        side[v] = s * look.halfWidth
        amp[v] = line.amp[i]!
        v++
      }
      if (k < total - 1) {
        const j = start + k * 2
        index.push(j, j + 1, j + 2, j + 1, j + 3, j + 2)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
  geometry.setAttribute('aS', new THREE.BufferAttribute(side, 1))
  geometry.setAttribute('aAmp', new THREE.BufferAttribute(amp, 1))
  geometry.setAttribute('aTan', new THREE.BufferAttribute(tan, 3))
  geometry.setIndex(index)
  return geometry
}

export class Rings {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly inverse = new THREE.Matrix4()
  private readonly rotation = new THREE.Matrix3()
  private readonly level: number
  private readonly smear: number

  constructor(geometry: THREE.BufferGeometry, look: RingLook, holdCamera: THREE.Vector3) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uSigma: { value: look.sigma }, uColor: { value: new THREE.Vector3().fromArray(look.color) },
        uSunL: { value: new THREE.Vector3(1, 0, 0) }, uCamL: { value: new THREE.Vector3(0, 0, 5) }, uHoldCamL: { value: holdCamera.clone() },
        uGlint: { value: new THREE.Vector2().fromArray(look.glint) }, uForward: { value: new THREE.Vector2().fromArray(look.forward) }, uBack: { value: new THREE.Vector2().fromArray(look.back) },
        uShadowFloor: { value: look.shadowFloor }, uGain: { value: 1 }, uDiag: diagUniform,
        uDelta: { value: new THREE.Matrix4() }, uMotion: { value: new THREE.Vector3() }, uReach: { value: look.halfWidth * 0.4 },
      },
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      transparent: true,
      depthWrite: false,
    })
    this.level = look.gain
    this.smear = look.smear
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 3
  }

  update(sunWorld: THREE.Vector3, gain: number, delta?: THREE.Matrix4, half?: [number, number]): void {
    const u = this.material.uniforms
    if (delta && half) {
      ;(u.uDelta!.value as THREE.Matrix4).copy(delta)
      ;(u.uMotion!.value as THREE.Vector3).set(half[0], half[1], this.smear)
    } else (u.uMotion!.value as THREE.Vector3).set(0, 0, 0)
    this.mesh.updateWorldMatrix(true, false)
    this.inverse.copy(this.mesh.matrixWorld).invert()
    ;(u.uCamL!.value as THREE.Vector3).set(0, 0, 0).applyMatrix4(this.inverse)
    this.rotation.setFromMatrix4(this.inverse)
    ;(u.uSunL!.value as THREE.Vector3).copy(sunWorld).applyMatrix3(this.rotation).normalize()
    u.uGain!.value = gain * this.level
  }

  dispose(): void {
    this.material.dispose()
  }
}
