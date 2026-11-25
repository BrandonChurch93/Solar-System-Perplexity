import * as THREE from 'three'
import { config } from '../../config'
import { diagUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { formatUniform } from './format'
import { stage } from './stage'
import data from './arcs.json'

/**
 * The arcade as bodies in space. Every strand is a fixed line in the stage with a place and a depth of its own: an
 * arch from one foot to the other in its own plane, a short arc thrown out of a foot, or a line that hangs from an
 * arch down to the ground. A strand is drawn as a band along its line that turns about the line to face the eye and
 * carries the light of a thin round tube; the ground in front of it hides it by depth.
 *
 * One law lights all of them: what a strand gives is its plasma (a fixed pattern along its length that is carried
 * along the line at the strand's steady speed, no period in it) times a share that grows toward the ground, and
 * its colour follows from how much it gives. Nothing of a strand comes or goes with the clock; the lines stand
 * still and only the plasma on them moves.
 *
 * A strand thinner than a pixel keeps a pixel's width and gives less light by the same share, so the arcade seen
 * from far is the same body with the same light, only smaller.
 */

const VERT = /* glsl */ `
precision highp float;
in vec3 aTan;
in vec4 aAcross;
in vec4 aStrand;
in vec2 aFlow;
uniform vec3 uCam;
uniform float uFormat;
uniform vec2 uLeast;
uniform vec2 uHalo;
out vec4 vAcross;
out vec4 vStrand;
out vec2 vFlow;
out vec3 vClip;
void main() {
  vec3 across = cross(aTan, uCam - position);
  across /= max(length(across), 1e-6);
  vec4 mid = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  // the half width in pixels of the buffer (uLeast.y: the rows of the master's frame)
  float px = aStrand.y * length(mat3(modelViewMatrix) * across) * projectionMatrix[1][1] / max(mid.w, 1e-6) * 0.5 * uLeast.y * uFormat;
  float shown = max(px, uLeast.x);
  // the band is as wide as the tube's thin sheath (uHalo.x times the tube's width)
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position + across * (aAcross.x * aStrand.y * uHalo.x * shown / max(px, 1e-6)), 1.0);
  vAcross = aAcross;
  vStrand = vec4(aStrand.x, px / shown, aStrand.z, aStrand.w);
  vFlow = aFlow;
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform int uDiag;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform float uKeep;
uniform float uTime;
uniform vec4 uPlasma;
uniform vec4 uPlasmaMore;
uniform vec4 uFoot;
uniform vec3 uCool;
uniform vec3 uHot;
uniform vec2 uTone;
uniform vec2 uHalo;
in vec4 vAcross;
in vec4 vStrand;
in vec2 vFlow;
in vec3 vClip;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
float ah(float n, float seed) {
  vec2 p = fract(vec2(n, seed * 419.2) * vec2(0.1031, 0.1030));
  p += dot(p, p.yx + 33.33);
  return fract((p.x + p.y) * p.x);
}
// a fixed pattern along the strand: values at whole steps, smooth between, no period
float an(float x, float seed) {
  float i = floor(x);
  float f = x - i;
  f = f * f * (3.0 - 2.0 * f);
  return mix(ah(i, seed), ah(i + 1.0, seed), f);
}
void main() {
  if (uDiag >= 2) discard;
  // the light of a thin round tube across its width, and of the thin sheath around it
  float x = vAcross.x * uHalo.x;
  float sheath = 1.0 - vAcross.x * vAcross.x;
  float tube = max(1.0 - x * x, 0.0) + uHalo.y * sheath * sheath;
  // the plasma: the pattern is laid along the length and carried at the strand's own steady speed
  float q = (vAcross.y - vStrand.w * uTime) / vFlow.x + vStrand.x * 251.0;
  float blobs = pow(an(q, vStrand.x), uPlasma.z);
  float sparks = pow(an(q * uPlasmaMore.x + 17.0, vStrand.x + 0.37), uPlasmaMore.y);
  float plasma = uPlasma.x + uPlasma.y * blobs + uPlasma.w * sparks;
  float low = 1.0 + uFoot.x * exp(-max(vAcross.z, 0.0) / uFoot.y);
  float ends = smoothstep(0.0, uFoot.z, vAcross.w) * smoothstep(0.0, uFoot.z, 1.0 - vAcross.w);
  float gives = vStrand.z * plasma * low * mix(1.0, ends, vFlow.y);
  vec3 shown = mix(uCool, uHot, gives / (gives + uTone.x)) * (gives * tube * uPlasmaMore.z);
  vec3 col = inverseFilmic(min(shown, vec3(uTone.y))) * (vStrand.y * uKeep);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = vec4(col, 0.0);
}`

/** A whole number and a slot give one fixed value from 0 to 1: the same at every run. */
function fixed(seed: number): (id: number, slot: number) => number {
  const mix = (a: number): number => {
    a = Math.imul(a ^ (a >>> 16), 0x7feb352d)
    a = Math.imul(a ^ (a >>> 15), 0x846ca68b)
    return (a ^ (a >>> 16)) >>> 0
  }
  return (id, slot) => mix((mix((id + seed) | 0) + Math.imul(slot + 1, 0x9e3779b9)) | 0) / 4294967296
}

interface Strand {
  line: THREE.Vector3[]
  seed: number
  radius: number
  gain: number
  speed: number
  clump: number
  /** 1: the strand ends in the air and fades toward its ends; 0: both ends stand in the ground. */
  open: number
}

export class Arcade {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  /** The arcade's own place: the middle between its feet on the ground, in the stage's frame. */
  readonly place: THREE.Vector3
  /** How many strands stand. */
  readonly strands: number
  /** The arcade's greatest height over the ball, in stage units. */
  readonly tall: number
  /** How it leaves: by its own height in pixels of a frame of `lines` rows, gone under px[0], whole from px[1]. */
  readonly leave: { lines: number; px: number[] } = data.leave
  private readonly keep: THREE.IUniform<number> = { value: 1 }
  private readonly time: THREE.IUniform<number> = { value: 0 }

  constructor() {
    const rnd = fixed(data.seed)
    const between = (r: number[], x: number): number => r[0]! + (r[1]! - r[0]!) * x
    const feet = stage.feet as [[number, number], [number, number]]
    const footA = stage.onGround(feet[0][0], feet[0][1])
    const footB = stage.onGround(feet[1][0], feet[1][1])
    this.place = footA.clone().add(footB).multiplyScalar(0.5)
    const up = this.place.clone().sub(stage.centre).normalize()
    const axis = footB.clone().sub(footA)
    axis.addScaledVector(up, -axis.dot(up)).normalize()
    // toward the eye of the close view (the stage's origin)
    const toward = up.clone().cross(axis).normalize()
    if (toward.dot(this.place) > 0) toward.negate()
    const onBall = (p: THREE.Vector3, sink = 0): THREE.Vector3 => p.clone().sub(stage.centre).setLength(stage.radius - sink).add(stage.centre)
    const height = (p: THREE.Vector3): number => p.distanceTo(stage.centre) - stage.radius
    const s = data.shape

    /** An arch from a to b on the ground: h its height, lean how far its plane tips toward the eye, id its number. */
    const arch = (a: THREE.Vector3, b: THREE.Vector3, h: number, lean: number, segments: number, id: number): THREE.Vector3[] => {
      const span = b.clone().sub(a)
      const length = span.length()
      const mid = a.clone().add(b).multiplyScalar(0.5)
      const along = span.clone().normalize()
      const out = mid.clone().sub(stage.centre).normalize()
      const side = out.clone().cross(along).normalize()
      if (side.dot(toward) < 0) side.negate()
      const lift = out.clone().multiplyScalar(Math.cos(lean)).addScaledVector(side, Math.sin(lean))
      const off = along.clone().cross(lift).normalize()
      const bulge = between(s.bulge, rnd(id, 20))
      const skew = between(s.skew, rnd(id, 21))
      const power = between(s.power, rnd(id, 26))
      const wave = [rnd(id, 22) * 6.2831853, rnd(id, 23) * 6.2831853, 1.5 + 2 * rnd(id, 24), 4 + 4 * rnd(id, 25)]
      const line: THREE.Vector3[] = []
      for (let i = 0; i <= segments; i++) {
        const th = (Math.PI * i) / segments
        const w = Math.max(Math.sin(th), 0)
        const x = -Math.cos(th) * 0.5 * length * (1 + bulge * w * w) + skew * h * w * w
        const y = h * Math.pow(w, power) - s.sink * (1 - w)
        const z = w * (s.wave[0]! * Math.sin(wave[2]! * th + wave[0]!) + s.wave[1]! * Math.sin(wave[3]! * th + wave[1]!)) * Math.min(h / s.height, 1)
        line.push(mid.clone().addScaledVector(along, x).addScaledVector(lift, y).addScaledVector(off, z))
      }
      return line
    }
    const foot = (base: THREE.Vector3, id: number, slot: number, wide: number[], scale = 1): THREE.Vector3 => {
      const r = Math.sqrt(rnd(id, slot))
      const a = rnd(id, slot + 1) * 6.2831853
      return onBall(base.clone().addScaledVector(axis, wide[0]! * scale * r * Math.cos(a)).addScaledVector(toward, wide[1]! * scale * r * Math.sin(a)))
    }

    const all: Strand[] = []
    const m = data.main
    const deg = THREE.MathUtils.degToRad
    // an arch of the arcade: its height (many near the outer shell), its lean and where its two feet stand
    const mainArch = (id: number): { h: number; lean: number; a: THREE.Vector3; b: THREE.Vector3 } => ({
      h: s.height * between(m.heights, 1 - Math.pow(rnd(id, 0), 1 / m.shell)),
      lean: deg(between(m.leanDeg, rnd(id, 1))),
      a: foot(footA, id, 2, m.feet),
      b: foot(footB, id, 4, m.feet),
    })
    for (let k = 0; k < m.count; k++) {
      const id = 1000 + k
      let p = mainArch(id)
      if (rnd(id, 6) < m.inBundle) {
        // a strand of a bundle: the bundle's arch, a little off it
        const g = mainArch(100 + Math.floor(rnd(id, 7) * m.bundles))
        p = {
          h: g.h * (1 + m.spread.height * (2 * rnd(id, 8) - 1)),
          lean: g.lean + deg(m.spread.leanDeg) * (2 * rnd(id, 9) - 1),
          a: foot(g.a, id, 10, [m.spread.feet, m.spread.feet]),
          b: foot(g.b, id, 12, [m.spread.feet, m.spread.feet]),
        }
      }
      const thick = Math.pow(rnd(id, 14), 2)
      all.push({
        line: arch(p.a, p.b, p.h, p.lean, m.segments, id),
        seed: rnd(id, 15),
        radius: between(m.radius, thick),
        gain: between(m.gain, rnd(id, 16)) * (0.7 + 0.3 * thick),
        speed: between(m.speed, rnd(id, 17)) * (rnd(id, 18) < m.back ? -1 : 1),
        clump: between(m.clump, rnd(id, 19)),
        open: 0,
      })
    }
    // lines that hang from an arch down to the ground: each starts on an arch of its own, leaves along it and falls
    const d = data.drips
    for (let k = 0; k < d.count; k++) {
      const id = 5000 + k
      const h = s.height * between(d.heights, rnd(id, 0))
      const over = arch(foot(footA, id, 2, m.feet), foot(footB, id, 4, m.feet), h, deg(between(d.leanDeg, rnd(id, 1))), m.segments, id)
      const at = Math.round(between(d.from, rnd(id, 6)) * m.segments)
      const from = over[at]!
      const downhill = at < m.segments / 2 ? -1 : 1
      const tangent = over[at + downhill]!.clone().sub(from).normalize()
      const under = onBall(from.clone().lerp(this.place, d.inward * rnd(id, 7)), s.sink)
      const fall = from.distanceTo(under)
      const c1 = from.clone().addScaledVector(tangent, 0.3 * fall)
      const c2 = under.clone().addScaledVector(under.clone().sub(stage.centre).normalize(), 0.45 * fall)
      const curve = new THREE.CubicBezierCurve3(from, c1, c2, under)
      all.push({
        line: curve.getPoints(d.segments),
        seed: rnd(id, 15),
        radius: between(d.radius, rnd(id, 14)),
        gain: between(d.gain, rnd(id, 16)),
        speed: between(d.speed, rnd(id, 17)),
        clump: between(d.clump, rnd(id, 19)),
        open: 1,
      })
    }
    // short arcs thrown out of a foot and falling back to the ground near it
    data.fountains.forEach((f, n) => {
      const base = f.foot === 0 ? footA : footB
      const outward = f.foot === 0 ? axis.clone().negate() : axis.clone()
      const round = base.clone().sub(stage.centre).normalize()
      const sideways = round.clone().cross(outward).normalize()
      for (let k = 0; k < f.count; k++) {
        const id = 8000 + 1000 * n + k
        const turn = deg(between(f.turnDeg, rnd(id, 0)))
        const reach = between(f.reach, Math.pow(rnd(id, 1), 1.6))
        const a = foot(base, id, 2, [f.feet, f.feet])
        // turn 0: along the axis, away from the other foot
        const dir = outward.clone().multiplyScalar(Math.cos(turn)).addScaledVector(sideways, Math.sin(turn))
        const b = onBall(a.clone().addScaledVector(dir, reach))
        const h = Math.min(reach * between(f.tall, rnd(id, 4)), f.most)
        all.push({
          line: arch(a, b, h, deg(20 * (2 * rnd(id, 5) - 1)), f.segments, id),
          seed: rnd(id, 15),
          radius: between(f.radius, Math.pow(rnd(id, 14), 2)),
          gain: between(f.gain, rnd(id, 16)),
          speed: between(f.speed, rnd(id, 17)),
          clump: between(f.clump, rnd(id, 19)),
          open: 0,
        })
      }
    })
    this.strands = all.length
    let tall = 0
    for (const st of all) for (const p of st.line) tall = Math.max(tall, height(p))
    this.tall = tall

    let points = 0
    for (const st of all) points += st.line.length
    const position = new Float32Array(points * 2 * 3)
    const tan = new Float32Array(points * 2 * 3)
    const across = new Float32Array(points * 2 * 4)
    const strand = new Float32Array(points * 2 * 4)
    const flow = new Float32Array(points * 2 * 2)
    const index: number[] = []
    let v = 0
    const t = new THREE.Vector3()
    for (const st of all) {
      const n = st.line.length
      let run = 0
      for (let i = 0; i < n; i++) {
        const p = st.line[i]!
        if (i > 0) run += p.distanceTo(st.line[i - 1]!)
        t.copy(st.line[Math.min(i + 1, n - 1)]!).sub(st.line[Math.max(i - 1, 0)]!).normalize()
        for (let e = 0; e < 2; e++) {
          p.toArray(position, v * 3)
          t.toArray(tan, v * 3)
          across.set([e === 0 ? -1 : 1, run, height(p), i / (n - 1)], v * 4)
          strand.set([st.seed, st.radius, st.gain, st.speed], v * 4)
          flow.set([st.clump, st.open], v * 2)
          v++
        }
        if (i < n - 1) index.push(v - 2, v - 1, v, v - 1, v + 1, v)
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
    geometry.setAttribute('aTan', new THREE.BufferAttribute(tan, 3))
    geometry.setAttribute('aAcross', new THREE.BufferAttribute(across, 4))
    geometry.setAttribute('aStrand', new THREE.BufferAttribute(strand, 4))
    geometry.setAttribute('aFlow', new THREE.BufferAttribute(flow, 2))
    geometry.setIndex(index)
    const l = data.light
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uDiag: diagUniform, uFormat: formatUniform,
        uCam: { value: new THREE.Vector3() }, uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
        uKeep: this.keep, uTime: this.time,
        uLeast: { value: new THREE.Vector2(data.least, config.raw.formats.master.height) },
        uHalo: { value: new THREE.Vector2(l.sheath[0]!, l.sheath[1]!) },
        uPlasma: { value: new THREE.Vector4(l.floor, l.blobs[0]!, l.blobs[1]!, l.sparks[0]!) },
        uPlasmaMore: { value: new THREE.Vector4(l.fine, l.sparks[1]!, l.level, 0) },
        uFoot: { value: new THREE.Vector4(l.foot[0]!, l.foot[1]!, l.ends, 0) },
        uCool: { value: new THREE.Vector3().fromArray(l.cool) },
        uHot: { value: new THREE.Vector3().fromArray(l.hot) },
        uTone: { value: new THREE.Vector2(l.knee, l.most) },
      },
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.renderOrder = 5
    this.mesh.frustumCulled = false
  }

  /** What the arcade throws on the ground under its feet: a steady share, no event in it. */
  get ground(): number {
    return data.ground.beat
  }

  /** time: the stop's clock in seconds (it only carries the plasma along the lines). eye: the eye in the stage's
   *  frame. keep: the share of the picture the stop holds (1 while the stop is the picture). */
  update(time: number, eye: THREE.Vector3, keep: number, gain: number, vignette: number, aspect: number): void {
    const u = this.material.uniforms
    this.time.value = time
    this.keep.value = keep
    ;(u.uCam!.value as THREE.Vector3).copy(eye)
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
    this.mesh.visible = keep > 0
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
