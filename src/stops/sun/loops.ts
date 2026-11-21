import * as THREE from 'three'
import { diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { STAGE_GLSL, stage } from './stage'

export interface LoopsLook {
  grid: [number, number]
  lean: { outerDeg: number; innerDeg: number; from: number; to: number }
  gain: number
  far: number
  pin: { from: number; soft: number; lowDeg: number; highDeg: number }
  flow: { amount: number; lanes: number; along: number; speed: number; back: number; floor: number }
  swell: { amount: number; speed: number; width: number; lanes: number; calm: number }
}

const VERT = /* glsl */ `
out vec3 vStage;
out vec3 vClip;
void main() {
  vStage = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform sampler2D uNoise;
uniform int uDiag;
uniform float uGrad;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform float uTime;
uniform vec4 uBox;
uniform vec4 uFeet;
uniform vec4 uFlow;
uniform vec2 uFlowMore;
uniform vec4 uSwell;
uniform float uCalm;
in vec3 vStage;
in vec3 vClip;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${STAGE_GLSL}
float packets(vec2 q, float t) {
  float a = textureLod(uNoise, vec2(q.x - t * uFlow.w, fract(q.y)), 0.0).r;
  float b = textureLod(uNoise, vec2(q.x * 2.3 - t * uFlow.w * 1.9, fract(q.y * 1.7 + 0.37)), 0.0).r;
  float c = textureLod(uNoise, vec2(q.x * 1.4 + t * uFlowMore.x, fract(q.y * 1.3 + 0.61)), 0.0).r;
  return a * a * a * 2.6 + b * b * b * 1.6 + c * c * c * 1.2;
}
void main() {
  if (uDiag >= 2) discard;
  vec2 a = stImage(vStage);
  vec2 uv = vec2((a.x - uBox.x) / (uBox.z - uBox.x), 1.0 - (a.y - uBox.y) / (uBox.w - uBox.y));
  vec2 dx = dFdx(uv) * uGrad;
  vec2 dy = dFdy(uv) * uGrad;
  vec3 lin = inverseFilmic(textureGrad(uMap, uv, dx, dy).rgb);
  vec2 p = vec2((a.x - 0.5) * 2.0 * ST_TAN.x, (0.5 - a.y) * 2.0 * ST_TAN.y);
  vec2 pa = uFeet.xy - p;
  vec2 pb = uFeet.zw - p;
  float la = length(pa);
  float lb = length(pb);
  float arc = acos(clamp(dot(pa, pb) / max(la * lb, 1e-6), -1.0, 1.0));
  float along = la / max(la + lb, 1e-6);
  vec2 q = vec2(along * uFlow.z, arc * uFlow.y);
  float run = packets(q, uTime) - packets(q, 0.0);
  float lane = textureLod(uNoise, vec2(arc * uSwell.w, 0.37), 0.0).r;
  float ds = fract(along - uTime * uSwell.y * (0.75 + 0.5 * lane) - lane * 3.0) - 0.5;
  float swell = exp(-ds * ds / (uSwell.z * uSwell.z)) * smoothstep(0.0, 0.14, along) * (1.0 - smoothstep(0.86, 1.0, along)) * (1.0 - exp(-uTime * uTime / (uCalm * uCalm)));
  lin *= max(1.0 + uFlow.x * run + uSwell.x * swell, uFlowMore.y);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  lin *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = vec4(lin, 0.0);
}`

function noise(size: number): Float32Array {
  const data = new Float32Array(size * size)
  let seed = 0x2f6e2b1
  const next = (): number => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const knots = 24
  const row = new Float32Array(knots)
  for (let y = 0; y < size; y++) {
    for (let k = 0; k < knots; k++) row[k] = next()
    const shift = next()
    for (let x = 0; x < size; x++) {
      const at = ((x / size + shift) % 1) * knots
      const i = Math.floor(at)
      const t = at - i
      const s = t * t * (3 - 2 * t)
      data[y * size + x] = row[i % knots]! * (1 - s) + row[(i + 1) % knots]! * s
    }
  }
  return data
}

export class Loops {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly gain: number

  constructor(map: THREE.Texture, noiseTexture: (data: Float32Array, size: number) => THREE.Texture, look: LoopsLook) {
    this.gain = look.gain
    const [fa, fb] = stage.feet as [[number, number], [number, number]]
    const tan = (f: [number, number]): THREE.Vector2 => new THREE.Vector2((f[0] - 0.5) * 2 * stage.tan[0], (0.5 - f[1]) * 2 * stage.tan[1])
    const ta = tan(fa)
    const tb = tan(fb)
    const footA = stage.onGround(fa[0], fa[1])
    const footB = stage.onGround(fb[0], fb[1])
    const axis = footB.clone().sub(footA).normalize()
    const mid = footA.clone().add(footB).multiplyScalar(0.5)
    const up = mid.clone().sub(stage.centre).normalize()
    const toward = up.clone().cross(axis).normalize()
    if (toward.dot(mid) > 0) toward.negate()
    const box = stage.loopsBox
    const [nx, ny] = look.grid
    const positions = new Float32Array((nx + 1) * (ny + 1) * 3)
    const lineDir = tb.clone().sub(ta).normalize()
    const lineNormal = new THREE.Vector2(-lineDir.y, lineDir.x)
    const feetApart = ta.distanceTo(tb)
    const horizon = Math.sqrt((stage.radius + 1) ** 2 - stage.radius ** 2)
    const smooth = (x: number, lo: number, hi: number): number => {
      const t = Math.min(Math.max((x - lo) / (hi - lo), 0), 1)
      return t * t * (3 - 2 * t)
    }
    const normal = new THREE.Vector3()
    const lift = new THREE.Vector3()
    for (let j = 0; j <= ny; j++) {
      for (let i = 0; i <= nx; i++) {
        const ax = box[0] + ((box[2] - box[0]) * i) / nx
        const ay = box[1] + ((box[3] - box[1]) * j) / ny
        const r = stage.ray(ax, ay)
        const p = new THREE.Vector2(r.x, r.y)
        const pa = ta.clone().sub(p)
        const pb = tb.clone().sub(p)
        const arc = Math.acos(Math.min(Math.max(pa.dot(pb) / Math.max(pa.length() * pb.length(), 1e-9), -1), 1))
        const lean = THREE.MathUtils.degToRad(look.lean.outerDeg + (look.lean.innerDeg - look.lean.outerDeg) * smooth(arc, look.lean.from, look.lean.to))
        lift.copy(up).multiplyScalar(Math.cos(lean)).addScaledVector(toward, Math.sin(lean))
        normal.copy(axis).cross(lift).normalize()
        const denom = r.dot(normal)
        const hit = stage.groundDistance(ax, ay)
        const tGround = (hit > 0 ? hit : look.far) / r.length()
        let t = Math.abs(denom) > 1e-5 ? footA.dot(normal) / denom : tGround
        if (!(t > 0.3)) t = tGround
        t = Math.min(t, hit > 0 ? tGround * 1.15 : tGround)
        const under = smooth(-(p.clone().sub(ta).dot(lineNormal)), 0.0, 0.05)
        const span = p.clone().sub(ta).dot(lineDir) / feetApart
        const above = THREE.MathUtils.radToDeg(Math.acos(Math.min(Math.max(r.clone().normalize().dot(stage.down), -1), 1)) - stage.alpha)
        const pin = smooth(span, look.pin.from, look.pin.from + look.pin.soft) * (1 - smooth(span, 1 - look.pin.from - look.pin.soft, 1 - look.pin.from)) * (1 - smooth(above, look.pin.lowDeg, look.pin.highDeg))
        const held = t + ((hit > 0 ? tGround : horizon / r.length()) - t) * pin
        const k = held + (tGround - held) * under
        r.multiplyScalar(k).toArray(positions, (j * (nx + 1) + i) * 3)
      }
    }
    const index: number[] = []
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const a = j * (nx + 1) + i
        index.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2)
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setIndex(index)
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: map }, uNoise: { value: noiseTexture(noise(256), 256) }, uDiag: diagUniform, uGrad: gradUniform,
        uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uTime: { value: 0 },
        uBox: { value: new THREE.Vector4(box[0], box[1], box[2], box[3]) },
        uFeet: { value: new THREE.Vector4(ta.x, ta.y, tb.x, tb.y) },
        uFlow: { value: new THREE.Vector4(look.flow.amount, look.flow.lanes, look.flow.along, look.flow.speed) },
        uFlowMore: { value: new THREE.Vector2(look.flow.back, look.flow.floor) },
        uSwell: { value: new THREE.Vector4(look.swell.amount, look.swell.speed, look.swell.width, look.swell.lanes) }, uCalm: { value: look.swell.calm },
      },
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    })
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.renderOrder = 5
    this.mesh.frustumCulled = false
  }

  update(time: number, gain: number, vignette: number, aspect: number): void {
    const u = this.material.uniforms
    u.uTime!.value = time
    u.uGain!.value = this.gain * gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
