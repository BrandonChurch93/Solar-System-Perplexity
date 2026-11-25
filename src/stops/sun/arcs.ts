import * as THREE from 'three'
import { config } from '../../config'
import { diagUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { formatUniform, setFormat } from './format'
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
 * A strand thinner than a pixel keeps a pixel's width and gives less light by the same share; the thinner it is, the
 * more its light lies as one soft bell over its band and the less as a line. So the arcade seen from far is the same
 * body with the same light, filtered: a glow in the shape of its lines, not a wire.
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
out vec3 vAt;
void main() {
  vec3 across = cross(aTan, uCam - position);
  across /= max(length(across), 1e-6);
  vec4 mid = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  // the half width in pixels of the buffer (uLeast.y: the rows of the master's frame)
  float px = aStrand.y * length(mat3(modelViewMatrix) * across) * projectionMatrix[1][1] / max(mid.w, 1e-6) * 0.5 * uLeast.y * uFormat;
  float shown = max(px, uLeast.x);
  // the band is as wide as the tube's thin sheath (uHalo.x times the tube's width)
  vAt = position + across * (aAcross.x * aStrand.y * uHalo.x * shown / max(px, 1e-6));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vAt, 1.0);
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
uniform float uThick;
uniform vec2 uTone;
uniform vec2 uHalo;
uniform vec2 uThin;
uniform vec3 uCam;
uniform vec4 uBall;
in vec4 vAcross;
in vec4 vStrand;
in vec2 vFlow;
in vec3 vClip;
in vec3 vAt;
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
  // where the ball is not in the depth buffer (the far Sun's pass draws no depth): a strand behind the ball, as the
  // eye sees it, gives no light. uBall: the ball's centre and radius in the stage's frame, radius 0 for no test
  if (uBall.w > 0.0) {
    vec3 d = vAt - uCam;
    float far = length(d);
    vec3 dir = d / max(far, 1e-6);
    vec3 f = uCam - uBall.xyz;
    float along = -dot(f, dir);
    vec3 nearest = f + dir * along;
    float off = dot(nearest, nearest);
    if (along > 0.0 && off < uBall.w * uBall.w && along - sqrt(uBall.w * uBall.w - off) < far) discard;
  }
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
  vec3 base = mix(uCool, uHot, gives / (gives + uTone.x)) * (gives * uPlasmaMore.z);
  vec3 lit = inverseFilmic(min(base * tube, vec3(uTone.y)));
  // a strand thinner than a pixel is not a line any more: the light of its tube and sheath, summed across the band
  // in linear light (three points over the tube, two over the sheath beyond it), is laid as one bell over the whole
  // band. The sum across is the same as the tube's own, so the strand gives the pixel the share of it that its true
  // width covers and nothing more; many of them over each other are a glow in the shape of their lines
  float soft = 1.0 - smoothstep(uThin.x, uThin.y, vStrand.y);
  if (soft > 0.0) {
    float edge = 1.0 / uHalo.x;
    vec3 sum = vec3(0.0);
    for (int k = 0; k < 3; k++) {
      float a = edge * (k == 0 ? 0.1127017 : k == 1 ? 0.5 : 0.8872983);
      float s = 1.0 - a * a;
      float t = a * uHalo.x;
      sum += edge * (k == 1 ? 0.4444444 : 0.2777778) * inverseFilmic(min(base * (1.0 - t * t + uHalo.y * s * s), vec3(uTone.y)));
    }
    for (int k = 0; k < 2; k++) {
      float a = edge + (1.0 - edge) * (k == 0 ? 0.2113249 : 0.7886751);
      float s = 1.0 - a * a;
      sum += (1.0 - edge) * 0.5 * inverseFilmic(min(base * (uHalo.y * s * s), vec3(uTone.y)));
    }
    lit = mix(lit, sum * (1.875 * sheath * sheath), soft);
  }
  vec3 col = lit * (vStrand.y * uKeep);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  // the thick limit: gas that lies over gas does not add without end. Each layer covers what is behind it, the face
  // too, by the share its own light has of the most a body of this heat can give (uThick times the white of the heat's
  // curve), so a bundle burns up to that white and no further, at every distance, and the bloom has no more to spread
  float cover = min(max(col.r, max(col.g, col.b)) / (inverseFilmic(vec3(uTone.y)).r * uThick), 1.0);
  outColor = vec4(col, cover);
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
  /** How it leaves: by its own height in pixels of a frame of `lines` rows, gone under px[0], whole from px[1].
   *  under: how far under the ball's radius the ball stands that hides a strand where no depth is drawn (stage units). */
  readonly leave: { lines: number; px: number[]; under: number } = data.leave
  private readonly keep: THREE.IUniform<number> = { value: 1 }
  private readonly time: THREE.IUniform<number> = { value: 0 }
  private readonly ball: THREE.IUniform<THREE.Vector4> = { value: new THREE.Vector4() }
  private readonly seatQuat = new THREE.Quaternion()
  private readonly seatAt = new THREE.Vector3()
  private seatScale = 1
  private start = 0
  private readonly eye = new THREE.Vector3()
  private readonly back = new THREE.Matrix4()

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
      const bundled = rnd(id, 6) < m.inBundle
      if (bundled) {
        // a strand of a bundle: the bundle's arch, a little off it. The bundles are of unlike size: the first ones
        // hold the most strands, and a bundle of many strands is wider than one of few
        const n = Math.min(Math.floor(Math.pow(rnd(id, 7), m.unlike) * m.bundles), m.bundles - 1)
        const g = mainArch(100 + n)
        const wide = between(m.spread.wide, n / Math.max(m.bundles - 1, 1))
        p = {
          h: g.h * (1 + wide * m.spread.height * (2 * rnd(id, 8) - 1)),
          lean: g.lean + deg(wide * m.spread.leanDeg) * (2 * rnd(id, 9) - 1),
          a: foot(g.a, id, 10, [wide * m.spread.feet, wide * m.spread.feet]),
          b: foot(g.b, id, 12, [wide * m.spread.feet, wide * m.spread.feet]),
        }
      }
      const thick = Math.pow(rnd(id, 14), 2)
      all.push({
        line: arch(p.a, p.b, p.h, p.lean, m.segments, id),
        seed: rnd(id, 15),
        // a strand of no bundle is thinner and dimmer than one of a rope
        radius: between(m.radius, thick) * (bundled ? 1 : m.loose.radius),
        gain: between(m.gain, rnd(id, 16)) * (0.7 + 0.3 * thick) * (bundled ? 1 : m.loose.gain),
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
        uKeep: this.keep, uTime: this.time, uBall: this.ball,
        uLeast: { value: new THREE.Vector2(data.least, config.raw.formats.master.height) },
        uHalo: { value: new THREE.Vector2(l.sheath[0]!, l.sheath[1]!) },
        uThin: { value: new THREE.Vector2(data.thin[0]!, data.thin[1]!) },
        uPlasma: { value: new THREE.Vector4(l.floor, l.blobs[0]!, l.blobs[1]!, l.sparks[0]!) },
        uPlasmaMore: { value: new THREE.Vector4(l.fine, l.sparks[1]!, l.level, 0) },
        uFoot: { value: new THREE.Vector4(l.foot[0]!, l.foot[1]!, l.ends, 0) },
        uCool: { value: new THREE.Vector3().fromArray(l.cool) },
        uHot: { value: new THREE.Vector3().fromArray(l.hot) },
        uTone: { value: new THREE.Vector2(l.knee, l.most) },
        uThick: { value: l.thick },
      },
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
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
  update(time: number, eye: THREE.Vector3, keep: number, gain: number, vignette: number, aspect: number, ball = false): void {
    const u = this.material.uniforms
    this.time.value = time
    this.keep.value = keep
    this.ball.value.set(stage.centre.x, stage.centre.y, stage.centre.z, ball ? stage.radius - data.leave.under : 0)
    ;(u.uCam!.value as THREE.Vector3).copy(eye)
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
    this.mesh.visible = keep > 0
  }

  /** Where the stage stands in the body's own frame at spin 0 (origin the ball's centre, unit its radius), and the
   *  film's time at which the stop's clock starts. Told once by the set. */
  body(quaternion: THREE.Quaternion, at: THREE.Vector3, scale: number, start: number): void {
    this.seatQuat.copy(quaternion)
    this.seatAt.copy(at)
    this.seatScale = scale
    this.start = start
  }

  /** The mesh's own seat under whoever holds it: in the body's frame at spin 0 (under the far Sun's group, which
   *  stands at the ball's centre and turns with it), or none (under the stop's own group, which seats it itself). */
  seat(onBody: boolean): void {
    if (onBody) {
      this.mesh.quaternion.copy(this.seatQuat)
      this.mesh.position.copy(this.seatAt)
      this.mesh.scale.setScalar(this.seatScale)
    } else {
      this.mesh.quaternion.identity()
      this.mesh.position.set(0, 0, 0)
      this.mesh.scale.setScalar(1)
    }
  }

  /** Drawn by the far Sun (MAIL 1070 point 2, FarSunHold gas.arcade): the mesh hangs in the far Sun's group in the
   *  body's frame. The eye is read from the camera through the mesh's world matrix, the leaving by size is applied
   *  here, the light is the arcade's own times `wear` (the weight the far Sun gives all it wears of the stop), and a
   *  strand behind the ball gives no light (that pass draws no depth). time: the film's time in seconds. */
  draw(view: { time: number; camera: THREE.PerspectiveCamera; gain: number; vignette: number; aspect: number; height: number; wear: number }): void {
    setFormat()
    // the holder's world matrix is taken as the holder left it (no parent is updated from here)
    this.mesh.updateMatrix()
    if (this.mesh.parent) this.mesh.matrixWorld.multiplyMatrices(this.mesh.parent.matrixWorld, this.mesh.matrix)
    else this.mesh.matrixWorld.copy(this.mesh.matrix)
    const eye = view.camera.getWorldPosition(this.eye).applyMatrix4(this.back.copy(this.mesh.matrixWorld).invert())
    this.update(view.time - this.start, eye, view.wear * this.sized(eye, view.camera.fov), view.gain, view.vignette, view.aspect, true)
  }

  /** The share left by the arcade's own size: its height in pixels of a frame of leave.lines rows as the eye (in the
   *  stage's frame) sees it under the field given; gone under leave.px[0], whole from leave.px[1]. */
  sized(eye: THREE.Vector3, vfovDeg: number): number {
    const px = this.tall / Math.max(eye.distanceTo(this.place), 1e-6) * this.leave.lines / (2 * Math.tan(THREE.MathUtils.degToRad(vfovDeg) / 2))
    return THREE.MathUtils.smoothstep(px, this.leave.px[0]!, this.leave.px[1]!)
  }

  dispose(): void {
    this.mesh.removeFromParent()
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
