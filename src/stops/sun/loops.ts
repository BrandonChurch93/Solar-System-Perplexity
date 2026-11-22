import * as THREE from 'three'
import { diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { GRADE_GLSL } from './grade'
import { STAGE_GLSL, stage } from './stage'

export interface LoopsLook {
  grid: [number, number]
  lean: { outerDeg: number; innerDeg: number; from: number; to: number; late: [number, number] }
  gain: number
  far: number
  pin: { from: number; soft: number; lowDeg: number; highDeg: number }
  flow: { amount: number; lanes: number; along: number; speed: number; back: number; floor: number; inside: [number, number]; from: [number, number] }
  swell: { amount: number; speed: number; width: number; lanes: number; calm: number }
  burst: { surge: number; floor: number; reach: [number, number]; other: number; white: number; from: number }
}

export interface KnotsLook {
  knots: { amount: number; speed: number; every: number; width: number; jitter: number; white: number; inside: [number, number]; lanes: [number, number]; lead: number; pick: [number, number, number, number]; ends: [number, number] }
  feet: { amount: number; reach: number; over: number; lane: number; ground: number }
  surge: { from: number; land: number; lead: number; rise: number; fade: number; amount: number; width: number; tail: number; ragged: number; white: number; halo: number; level: number; lanes: [number, number, number]; glow: [number, number, number]; core: [number, number]; inner: [number, number, number]; crest: [number, number]; launch: number; flare: number; peak: number; early: number; end: number; settle: number; ground: number; reach: number; knee: number; bloom: number; veil: [number, number, number]; keep: number; hold: [number, number, number]; grow: [number, number]; kick: number }
}

const VERT = /* glsl */ `
in vec3 aLate;
in vec3 aGrow;
uniform float uLate;
uniform float uGrow;
out vec3 vStage;
out vec3 vClip;
void main() {
  vStage = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(mix(position, aLate, uLate) + aGrow * uGrow, 1.0);
  vClip = gl_Position.xyw;
}`

const frag = (knots: boolean): string => /* glsl */ `
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
uniform vec4 uFlowMask;
uniform vec4 uSwell;
uniform float uCalm;
uniform vec4 uBurst;
uniform vec3 uBurstMore;
uniform float uCut;${knots ? `
uniform vec4 uKnot;
uniform vec4 uKnotMore;
uniform vec4 uKnotLane;
uniform vec4 uKnotPick;
uniform vec2 uKnotEnds;
uniform vec4 uSurge;
uniform vec4 uSurgeMore;
uniform vec3 uSurgeLane;
uniform vec3 uSurgeGlow;
uniform vec2 uSurgeCore;
uniform vec3 uSurgeInner;
uniform vec2 uSurgeCrest;
uniform vec2 uFoot;
uniform vec4 uFlare;
uniform vec3 uHold;` : ''}
in vec3 vStage;
in vec3 vClip;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${STAGE_GLSL}
${GRADE_GLSL}
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
  vec3 lin = inverseFilmic(grade(textureGrad(uMap, uv, dx, dy).rgb, 1.0));
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
  float strand = (1.0 - smoothstep(uFlowMask.x, uFlowMask.y, arc)) * smoothstep(uFlowMask.z, uFlowMask.w, dot(lin, vec3(0.3, 0.5, 0.2)));
  float wave = strand * (uFlow.x * run + uSwell.x * swell);
  lin *= 1.0 + (wave < 0.0 ? -uFlowMore.y * (1.0 - exp(wave / uFlowMore.y)) : wave);${knots ? `
  for (int k = 0; k < (uKnot.x > 0.0 ? 1 : 0); k++) {
    vec2 ab = uFeet.zw - uFeet.xy;
    float apart = length(ab);
    ab /= apart;
    float s = acos(clamp(dot(pb, ab) / max(lb, 1e-6), -1.0, 1.0)) / max(3.14159265 - arc, 1e-3);
    float span = apart * (3.14159265 - arc) / max(sin(arc), 0.2);
    float bundle = 0.5 + 0.5 * sin(arc * uKnotLane.z + 1.3) * cos(arc * uKnotLane.w + 0.4);
    float gap = uKnot.y * uKnot.z;
    float phase = uKnotMore.x / uKnot.z - bundle * uKnotMore.y - s * span / gap;
    float nth = floor(phase + 0.5);
    float ds = (phase - nth) * gap;
    float pick = uKnotPick.w + (1.0 - uKnotPick.w) * smoothstep(uKnotPick.y, uKnotPick.z, textureLod(uNoise, vec2(arc * uKnotPick.x, fract(nth * 0.3183 + 0.17)), 0.0).r);
    float above = smoothstep(0.0, 0.02, ab.x * (p.y - uFeet.y) - ab.y * (p.x - uFeet.x));
    float shine = dot(lin, vec3(0.3, 0.5, 0.2));
    float seen = above * smoothstep(0.75, 1.0, arc) * smoothstep(uFlowMask.z, uFlowMask.w, shine);
    float knot = uKnot.x * pick * exp(-ds * ds / (uKnot.w * uKnot.w)) * smoothstep(uKnotEnds.x, uKnotEnds.y, s) * (1.0 - smoothstep(1.0 - uKnotEnds.y, 1.0 - uKnotEnds.x, s)) * (1.0 - smoothstep(uKnotLane.x, uKnotLane.y, arc)) * seen;
    knot += seen * (uFoot.x * exp(-s / uKnotMore.w) + uFoot.y * exp(-(1.0 - s) / uKnotMore.w));
    lin = lin * (1.0 + knot) + shine * knot * uKnotMore.z * vec3(1.0, 0.9, 0.66);
    for (int j = 0; j < (uSurge.y + uFlare.x + uFlare.y > 0.0 ? 1 : 0); j++) {
      float strandLag = textureLod(uNoise, vec2(arc * uSurgeLane.x, 0.83), 0.0).r;
      float lead = s - uSurge.x + uSurgeMore.x * (bundle + strandLag - 1.0);
      float ahead = max(lead, 0.0);
      float passed = exp(-ahead * ahead / (uSurge.z * uSurge.z));
      float trail = exp(min(lead, 0.0) / uSurge.w);
      float front = passed * trail + uSurgeCore.x * exp(-lead * lead / (uSurgeCore.y * uSurgeCore.y));
      float held = passed * (1.0 - trail) * uHold.x;
      float shaped = uSurge.y * above * smoothstep(0.75, 1.0, arc) * (1.0 - uSurgeInner.z * smoothstep(uSurgeInner.x, uSurgeInner.y, arc)) * (uSurgeCrest.x + uSurgeCrest.y * 4.0 * clamp(s * (1.0 - s), 0.0, 0.25));
      float onStrand = smoothstep(uFlowMask.z, uFlowMask.w, shine) * (uSurgeLane.y + uSurgeLane.z * strandLag);
      float wide = dot(inverseFilmic(grade(textureLod(uMap, uv, uSurgeMore.w).rgb, 1.0)), vec3(0.3, 0.5, 0.2));
      float pushed = shaped * front * onStrand;
      pushed /= 1.0 + uFlare.z * pushed * dot(lin, vec3(0.3, 0.5, 0.2));
      float kept = shaped * held * onStrand;
      lin = lin * (1.0 + pushed + kept) + shine * (pushed + kept * uHold.z) * uSurgeMore.y * vec3(1.0, 0.9, 0.66) + wide * uSurgeMore.z * uSurgeGlow * shaped * (front + held * uHold.y);
      float foot = uFlare.x * exp(-s / uKnotMore.w) + uFlare.y * exp(-(1.0 - s) / uKnotMore.w);
      float flared = seen * foot;
      flared /= 1.0 + uFlare.z * flared * dot(lin, vec3(0.3, 0.5, 0.2));
      lin = lin * (1.0 + flared) + shine * flared * uKnotMore.z * vec3(1.0, 0.9, 0.66) + wide * uFlare.w * uSurgeGlow * foot;
    }
  }` : ''}
  float climb = exp(-along / uBurst.z) + uBurstMore.x * exp(-(1.0 - along) / uBurst.z);
  float glow = dot(lin, vec3(0.3, 0.5, 0.2));
  for (int k = 0; k < (uCut > 0.0 ? 1 : 0); k++) lin *= clamp((glow - uCut) / (3.0 * uCut), 0.0, 1.0);
  float lit = uBurst.x * uBurst.y * (uBurst.w + (1.0 - uBurst.w) * min(climb, 1.0)) * smoothstep(uBurstMore.z, uBurstMore.z * 6.0, glow);
  lin = lin * (1.0 + lit) + glow * lit * uBurstMore.y * vec3(1.0, 0.9, 0.66);
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
  private readonly reach: [number, number]
  private readonly knots: KnotsLook | undefined
  private readonly across: number

  constructor(map: THREE.Texture, grade: THREE.Texture, noiseTexture: (data: Float32Array, size: number) => THREE.Texture, look: LoopsLook, knots?: KnotsLook) {
    this.gain = look.gain
    this.reach = look.burst.reach
    this.knots = knots
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
    const late = new Float32Array((nx + 1) * (ny + 1) * 3)
    const grow = new Float32Array((nx + 1) * (ny + 1) * 3)
    const lineDir = tb.clone().sub(ta).normalize()
    const lineNormal = new THREE.Vector2(-lineDir.y, lineDir.x)
    const feetApart = ta.distanceTo(tb)
    this.across = knots ? (feetApart * (Math.PI - knots.feet.lane)) / Math.sin(knots.feet.lane) : 0
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
        const share = smooth(arc, look.lean.from, look.lean.to)
        const hit = stage.groundDistance(ax, ay)
        const tGround = (hit > 0 ? hit : look.far) / r.length()
        const under = smooth(-(p.clone().sub(ta).dot(lineNormal)), 0.0, 0.05)
        const span = p.clone().sub(ta).dot(lineDir) / feetApart
        const above = THREE.MathUtils.radToDeg(Math.acos(Math.min(Math.max(r.clone().normalize().dot(stage.down), -1), 1)) - stage.alpha)
        const pin = smooth(span, look.pin.from, look.pin.from + look.pin.soft) * (1 - smooth(span, 1 - look.pin.from - look.pin.soft, 1 - look.pin.from)) * (1 - smooth(above, look.pin.lowDeg, look.pin.highDeg))
        const place = (outerDeg: number, innerDeg: number, into: Float32Array): number => {
          const lean = THREE.MathUtils.degToRad(outerDeg + (innerDeg - outerDeg) * share)
          lift.copy(up).multiplyScalar(Math.cos(lean)).addScaledVector(toward, Math.sin(lean))
          normal.copy(axis).cross(lift).normalize()
          const denom = r.dot(normal)
          let t = Math.abs(denom) > 1e-5 ? footA.dot(normal) / denom : tGround
          if (!(t > 0.3)) t = tGround
          t = Math.min(t, hit > 0 ? tGround * 1.15 : tGround)
          const held = t + ((hit > 0 ? tGround : horizon / r.length()) - t) * pin
          const k = held + (tGround - held) * under
          r.clone().multiplyScalar(k).toArray(into, (j * (nx + 1) + i) * 3)
          return k
        }
        const high = Math.max(p.clone().sub(ta).dot(lineNormal), 0) * place(look.lean.outerDeg, look.lean.innerDeg, positions)
        grow[(j * (nx + 1) + i) * 3] = lineNormal.x * high
        grow[(j * (nx + 1) + i) * 3 + 1] = lineNormal.y * high
        place(look.lean.late[0], look.lean.late[1], late)
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
    geometry.setAttribute('aLate', new THREE.BufferAttribute(late, 3))
    geometry.setAttribute('aGrow', new THREE.BufferAttribute(grow, 3))
    geometry.setIndex(index)
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: frag(knots !== undefined),
      uniforms: {
        uMap: { value: map }, uGrade: { value: grade }, uNoise: { value: noiseTexture(noise(256), 256) }, uDiag: diagUniform, uGrad: gradUniform,
        uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uTime: { value: 0 },
        uBox: { value: new THREE.Vector4(box[0], box[1], box[2], box[3]) },
        uFeet: { value: new THREE.Vector4(ta.x, ta.y, tb.x, tb.y) },
        uFlow: { value: new THREE.Vector4(look.flow.amount, look.flow.lanes, look.flow.along, look.flow.speed) },
        uFlowMore: { value: new THREE.Vector2(look.flow.back, look.flow.floor) },
        uFlowMask: { value: new THREE.Vector4(look.flow.inside[0], look.flow.inside[1], look.flow.from[0], look.flow.from[1]) },
        uSwell: { value: new THREE.Vector4(look.swell.amount, look.swell.speed, look.swell.width, look.swell.lanes) }, uCalm: { value: look.swell.calm },
        uBurst: { value: new THREE.Vector4(0, look.burst.surge, look.burst.reach[0], look.burst.floor) }, uBurstMore: { value: new THREE.Vector3(look.burst.other, look.burst.white, look.burst.from) }, uCut: { value: 0 }, uLate: { value: 0 }, uGrow: { value: 0 },
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
    if (knots) {
      const k = knots.knots
      this.material.uniforms.uKnot = { value: new THREE.Vector4(0, k.speed, k.every, k.width) }
      this.material.uniforms.uKnotMore = { value: new THREE.Vector4(0, k.jitter, k.white, knots.feet.reach) }
      this.material.uniforms.uKnotLane = { value: new THREE.Vector4(k.inside[0], k.inside[1], k.lanes[0], k.lanes[1]) }
      this.material.uniforms.uKnotPick = { value: new THREE.Vector4(k.pick[0], k.pick[1], k.pick[2], k.pick[3]) }
      this.material.uniforms.uKnotEnds = { value: new THREE.Vector2(k.ends[0], k.ends[1]) }
      this.material.uniforms.uFoot = { value: new THREE.Vector2() }
      this.material.uniforms.uHold = { value: new THREE.Vector3(...knots.surge.hold) }
      this.material.uniforms.uFlare = { value: new THREE.Vector4(0, 0, knots.surge.knee, knots.surge.bloom) }
      const g = knots.surge
      this.material.uniforms.uSurge = { value: new THREE.Vector4(0, 0, g.width, g.tail) }
      this.material.uniforms.uSurgeMore = { value: new THREE.Vector4(g.ragged, g.white, g.halo, g.level) }
      this.material.uniforms.uSurgeLane = { value: new THREE.Vector3(g.lanes[0], g.lanes[1], g.lanes[2]) }
      this.material.uniforms.uSurgeGlow = { value: new THREE.Vector3(g.glow[0], g.glow[1], g.glow[2]) }
      this.material.uniforms.uSurgeCore = { value: new THREE.Vector2(g.core[0], g.core[1]) }
      this.material.uniforms.uSurgeInner = { value: new THREE.Vector3(g.inner[0], g.inner[1], g.inner[2]) }
      this.material.uniforms.uSurgeCrest = { value: new THREE.Vector2(g.crest[0], g.crest[1]) }
    }
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.renderOrder = 5
    this.mesh.frustumCulled = false
  }

  pulse(since: number): [number, number] {
    const k = this.knots
    if (!k) return [0, 0]
    const beat = (x: number): number => {
      const d = ((x - Math.floor(x + 0.5)) * k.knots.every) / k.feet.over
      return Math.exp(-d * d)
    }
    const phase = (since + k.knots.lead) / k.knots.every - 0.5 * k.knots.jitter
    return [beat(phase), beat(phase - this.across / (k.knots.speed * k.knots.every))]
  }

  surge(since: number, open: number): [number, number, number, number, number] {
    const g = this.knots?.surge
    if (!g || open <= 0 || since <= g.from || since >= g.end) return [0, 0, 0, 0, 0]
    const ease = (x: number): number => {
      const t = Math.min(Math.max(x, 0), 1)
      return t * t * (3 - 2 * t)
    }
    const bump = (t: number): number => (t > 0 ? (t / g.peak) * Math.exp(1 - t / g.peak) : 0)
    const gone = open * (1 - ease((since - g.end + g.settle) / g.settle))
    const head = -g.lead + (1 + 2 * g.lead) * Math.min((since - g.from) / (g.land - g.from), 1)
    const amount = g.amount * ease((since - g.from) / g.rise) * (1 - ease((since - g.land - g.keep) / g.fade))
    const grow = g.grow[0] * (since < g.grow[1] ? ease((since - g.from) / (g.grow[1] - g.from)) : 1 - ease((since - g.grow[1]) / (g.end - g.grow[1])))
    return [head, amount * gone, g.launch * bump(since - g.from) * gone, g.flare * bump(since - g.land + g.early) * gone, grow]
  }

  update(time: number, gain: number, vignette: number, aspect: number, burst: number, cut = 0, late = 0, open = 0, since = 0): void {
    const u = this.material.uniforms
    if (this.knots) {
      const k = this.knots
      const [a, b] = this.pulse(since)
      const [head, amount, launch, flare, grow] = this.surge(since, open)
      u.uGrow!.value = grow
      ;(u.uKnot!.value as THREE.Vector4).x = k.knots.amount * open
      ;(u.uKnotMore!.value as THREE.Vector4).x = since + k.knots.lead
      ;(u.uFoot!.value as THREE.Vector2).set(k.feet.amount * open * a, k.feet.amount * open * b)
      const f = u.uFlare!.value as THREE.Vector4
      f.x = launch
      f.y = flare
      const v = u.uSurge!.value as THREE.Vector4
      v.x = head
      v.y = amount
    }
    const lit = u.uBurst!.value as THREE.Vector4
    lit.x = burst
    lit.z = this.reach[0] + (this.reach[1] - this.reach[0]) * burst
    u.uCut!.value = cut
    u.uLate!.value = late
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
