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
  filter: number
  halfWidth: number
  gain: number
  glint: [number, number]
  forward: [number, number]
  back: [number, number]
  shadowFloor: number
  flat: boolean
  vary: number
  far: number
  near: [number, number]
  shade: [number, number]
  air: [number, number]
  hair: { normal: [number, number, number]; count: number; from: number; to: number; amp: [number, number]; tiltDeg: number }
}

const VERT = /* glsl */ `
in float aS;
in float aAmp;
in vec3 aTan;
out float vS;
out float vAmp;
out vec3 vTan;
out vec3 vLocal;
void main() {
  vS = aS;
  vAmp = aAmp;
  vTan = aTan;
  vLocal = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
uniform float uFilter;
uniform vec2 uNearArc;
uniform vec2 uAir;
uniform int uDiag;
in float vS;
in float vAmp;
in vec3 vTan;
in vec3 vLocal;
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
  float fw = length(vec2(dFdx(vS), dFdy(vS)));
  float sig = sqrt(uSigma * uSigma + fw * fw * uFilter);
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
  float air = 1.0;
  float cut = 0.0;
  for (int k = 0; k < (uNearArc.x > 0.0 ? 1 : 0); k++) {
    vec3 rd = vLocal - uCamL;
    float span = length(rd);
    rd /= span;
    air = smoothstep(uAir.x, uAir.y, length(uCamL + rd * clamp(-dot(uCamL, rd), 0.0, span)));
    cut = uNearArc.x * exp(-0.5 * vS * vS / (sig * sig)) * min(2.5 * uSigma / sig, 1.0) * clamp(vAmp * uNearArc.y, 0.0, 1.0);
  }
  outColor = vec4(uColor * (vAmp * line * glint * forward * shadow * uGain * air), cut);
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

export function fullLines(lines: RingLine[], normal: [number, number, number], vary: number, gain: number): RingLine[] {
  const m = 720
  return lines.map((line, k) => {
    let mean = 0
    for (const r of line.radius) mean += r / line.radius.length
    const sorted = Array.from(line.amp).sort((a, b) => b - a)
    const half = Math.max(1, sorted.length >> 1)
    let level = 0
    for (let i = 0; i < half; i++) level += (gain * sorted[i]!) / half
    const amp: number[] = []
    for (let i = 0; i < m; i++) {
      const a = (i / m) * 2 * Math.PI
      amp.push(level * Math.max(1 + vary * (0.6 * Math.sin(a * 2 + k * 1.3) + 0.3 * Math.sin(a * 5 + k * 2.9) + 0.2 * Math.sin(a * 11 + k * 4.1)), 0.1))
    }
    return { normal, closed: true, theta0: 0, step: (2 * Math.PI) / m, radius: new Array<number>(m).fill(mean), amp }
  })
}

export function ringProfile(lines: RingLine[], range: [number, number], sigma: number): THREE.DataTexture {
  const w = 1024
  const dens = new Float32Array(w)
  let top = 0
  for (const line of lines) {
    let level = 0
    for (const a of line.amp) level += a / line.amp.length
    const r = line.radius[0]!
    for (let i = 0; i < w; i++) {
      const d = (range[0] + ((i + 0.5) / w) * (range[1] - range[0]) - r) / sigma
      dens[i] = dens[i]! + level * Math.exp(-0.5 * d * d)
    }
  }
  for (const d of dens) top = Math.max(top, d)
  const data = new Uint8Array(w * 4)
  for (let i = 0; i < w; i++) data.fill(Math.round((255 * dens[i]!) / Math.max(top, 1e-9)), i * 4, i * 4 + 4)
  const t = new THREE.DataTexture(data, w, 1, THREE.RGBAFormat, THREE.UnsignedByteType)
  t.generateMipmaps = true
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.magFilter = THREE.LinearFilter
  t.needsUpdate = true
  return t
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

export function strandLines(lines: RingLine[], look: { count: number; spread: number; amp: [number, number]; minSpan: number }): RingLine[] {
  const long = lines.filter((l) => l.step * l.radius.length > look.minSpan)
  const out: RingLine[] = []
  for (let k = 0; k < (long.length > 0 ? look.count : 0); k++) {
    const src = long[k % long.length]!
    const f = (k * 0.6180339887 + 0.31) % 1
    const g = (k * 0.7548776662 + 0.11) % 1
    const offset = (f * 2 - 1) * look.spread
    const level = look.amp[0] + (look.amp[1] - look.amp[0]) * g * g
    const m = src.radius.length
    let top = 0
    for (const a of src.amp) top = Math.max(top, a)
    const radius = new Float32Array(m)
    const amp = new Float32Array(m)
    for (let i = 0; i < m; i++) {
      const a = src.theta0 + i * src.step
      const taper = THREE.MathUtils.smoothstep(Math.min(i, m - 1 - i) / m, 0, 0.1)
      const broken = 0.6 + 0.25 * Math.sin(a * 7 + k * 1.3) + 0.15 * Math.sin(a * 17 + k * 2.9)
      radius[i] = src.radius[i]! + offset * (1 + 0.2 * Math.sin(a * 3 + k * 0.9))
      amp[i] = level * broken * taper * (0.35 + 0.65 * Math.sqrt(src.amp[i]! / top))
    }
    out.push({ normal: src.normal, closed: false, theta0: src.theta0, step: src.step, radius, amp })
  }
  return out
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

  constructor(geometry: THREE.BufferGeometry, look: RingLook, holdCamera: THREE.Vector3, far = false) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uSigma: { value: look.sigma }, uColor: { value: new THREE.Vector3().fromArray(look.color) },
        uSunL: { value: new THREE.Vector3(1, 0, 0) }, uCamL: { value: new THREE.Vector3(0, 0, 5) }, uHoldCamL: { value: holdCamera.clone() },
        uGlint: { value: new THREE.Vector2().fromArray(look.glint) }, uForward: { value: new THREE.Vector2().fromArray(look.forward) }, uBack: { value: new THREE.Vector2().fromArray(look.back) },
        uShadowFloor: { value: look.shadowFloor }, uGain: { value: 1 }, uDiag: diagUniform, uFilter: { value: look.filter },
        uNearArc: { value: new THREE.Vector2().fromArray(far ? look.near : [0, 0]) }, uAir: { value: new THREE.Vector2().fromArray(look.air) },
      },
      side: THREE.DoubleSide,
      blending: far ? THREE.CustomBlending : THREE.AdditiveBlending,
      blendSrc: THREE.OneFactor,
      blendDst: far ? THREE.OneMinusSrcAlphaFactor : THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      premultipliedAlpha: true,
      transparent: true,
      depthWrite: false,
    })
    this.level = look.gain
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 3
  }

  get sunLocal(): THREE.Vector3 {
    return this.material.uniforms.uSunL!.value as THREE.Vector3
  }

  update(sunWorld: THREE.Vector3, gain: number): void {
    const u = this.material.uniforms
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
