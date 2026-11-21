import * as THREE from 'three'
import { config } from '../../config'
import { ramp, smoother } from '../../director/rig'
import { StopPlan, type Fit, type MoveParams, type OrbitShot } from '../../director/moves'
import { anchor, closeRadius, type Anchor } from './close'
import fit from './fit.json'
import { close, pace, spinRest } from './look'
import { curve, hermite, integrate, last, read, sampled, solve, type Knot, type Track } from './pace'

export const params: MoveParams = {
  hold: { orbitDeg: 7, axis: [0.2, 1, 0], push: -0.04 },
  spot: { x: 0.5144, y: 0.65436 },
  dive: { headingDeg: 278, altitude: 0.03234, back: 0.06, ahead: 0.12, bow: 0.2, rollDeg: 6, swoop: true, surge: { glide: 0.1, rise: 16, fall: 2, swell: [0.35, 5, 2] } },
  terrain: { vfov: 60, gather: 0.2, forward: 0.5, rise: 0.05, side: -0.1, yawDeg: 3, pitchDeg: 0.5, entryHeight: 1, entryBack: 0.6, entryPitchDeg: -4, entryDipDeg: -4.07, horizonDeg: 19.8, dipDeg: 10.25, rollDeg: 11.27, exitHeight: 0.3, exitForward: 0.25, exitPitchDeg: 1.5, exitDipDeg: 1.54 },
  rise: { azimuthDeg: 12, elevationDeg: 14, distance: 4.8, offset: [-0.3, -0.06], driftSpeed: 0.08, rollDeg: 0, ahead: 0.01174, from: 0.02085, hug: 1.7, settle: 8, level: true, pan: 0.3 },
  travel: { turnDeg: 78, side: 1 },
  arrive: { swingDeg: 0, axis: [0, 1, 0], offset: [0.5, -0.1] },
  light: { exposure: 1, skyExposure: 0.25, sunRadiusDeg: 9.2, sunGlare: 0.012, flare: 1 },
  cover: [1, 0.95, 0.86],
  coverEdge: [4, 4],
  coverHides: 0,
  skyAim: { orbit: [77.38414, 172.96308, -53.87859], terrain: [12.8819, -127.45635, -55] },
  spinDegPerSecond: 0.6,
  moonDegPerSecond: 0,
  tint: [0.62, 0.56, 0.5],
}

export const meet = { dive: { forward: 0.01448, frames: 30 }, rise: { frames: 26 } }

interface Fix { position: THREE.Vector3; quaternion: THREE.Quaternion; turn: THREE.Quaternion }
interface Gap { v: THREE.Vector3; w: THREE.Vector3; lens: number }
interface Local { p: THREE.Vector3; q: THREE.Quaternion; vfov: number }
interface DivePace { first: number; still: number; rho: number; track: Track; top: number }
interface RisePace { track: Track; top: number }

export class Plan extends StopPlan {
  private anchored: Anchor | null = null
  private readonly fixes: { dive?: Fix; rise?: Fix } = {}
  private readonly gaps: { dive?: Gap; rise?: Gap } = {}
  private diving: DivePace | null = null
  private rising: RisePace | null = null

  constructor(p: MoveParams = params, private readonly tune = meet, private readonly near = close, private readonly tempo = pace) {
    super('mercury', fit as Fit, p)
  }

  get anchor(): Anchor {
    return (this.anchored ??= anchor(this.normal, this.heading, this.near.shift))
  }

  drawn(time: number): THREE.Quaternion {
    const c0 = this.coverCenter(this.seg.dive!)
    const c1 = this.coverCenter(this.seg.rise)
    return this.turn(time - spinRest * Math.min(Math.max(time - c0, 0), c1 - c0))
  }

  private fix(side: 'dive' | 'rise'): Fix {
    const kept = this.fixes[side]
    if (kept) return kept
    const centre = this.coverCenter(side === 'dive' ? this.seg.dive! : this.seg.rise)
    const low = (side === 'dive' ? super.dive(centre) : super.rise(centre - 1e-6)).pose
    const high = (side === 'dive' ? this.diveRaw(centre - 1e-6, centre - 1e-6) : this.riseRaw(centre, centre)).pose
    const a = this.anchor
    const turn = this.drawn(centre)
    const position = a.origin.clone().addScaledVector(low.position.clone().applyQuaternion(a.frame), 1 / closeRadius).applyQuaternion(turn).sub(high.position)
    const quaternion = turn.clone().multiply(a.frame).multiply(low.quaternion).multiply(high.quaternion.clone().invert())
    return (this.fixes[side] = { position, quaternion, turn })
  }

  private meetAt(side: 'dive' | 'rise', shot: OrbitShot, time: number, w: number): OrbitShot {
    if (w <= 0 || shot.view !== 'orbit' || !this.near.meet) return shot
    const f = this.fix(side)
    const carry = this.drawn(time).multiply(f.turn.clone().invert())
    const q = new THREE.Quaternion().slerp(carry.clone().multiply(f.quaternion).multiply(carry.clone().invert()), w)
    return { pose: { position: shot.pose.position.clone().addScaledVector(f.position.clone().applyQuaternion(carry), w), quaternion: q.multiply(shot.pose.quaternion), vfov: shot.pose.vfov }, view: 'orbit' }
  }

  private diveRaw(time: number, at: number): OrbitShot {
    const shot = super.dive(at)
    if (shot.view !== 'orbit') return shot
    const centre = this.coverCenter(this.seg.dive!)
    const w = smoother(ramp(centre - this.tune.dive.frames / config.fps, centre, at))
    const pose = { position: shot.pose.position.clone(), quaternion: shot.pose.quaternion.clone(), vfov: shot.pose.vfov }
    if (w > 0 && this.tune.dive.forward !== 0) {
      const out = pose.position.clone().normalize()
      const axis = new THREE.Vector3().crossVectors(out, new THREE.Vector3(0, 0, -1).applyQuaternion(pose.quaternion)).normalize()
      const q = new THREE.Quaternion().setFromAxisAngle(axis, this.tune.dive.forward * w)
      pose.position.applyQuaternion(q)
      pose.quaternion.premultiply(q)
    }
    if (time !== at) {
      const q = this.turn(time).multiply(this.turn(at).invert())
      pose.position.applyQuaternion(q)
      pose.quaternion.premultiply(q)
    }
    return { pose, view: 'orbit' }
  }

  private riseRaw(time: number, at: number): OrbitShot {
    const from = this.coverCenter(this.seg.rise)
    const shot = super.rise(at)
    const lag = (time - spinRest * (from - this.coverCenter(this.seg.dive!)) - at) * (1 - smoother(ramp(from, from + this.tune.rise.frames / config.fps, at)))
    if (lag === 0 || shot.view !== 'orbit') return shot
    const q = this.turn(at + lag).multiply(this.turn(at).invert())
    return { pose: { position: shot.pose.position.clone().applyQuaternion(q), quaternion: q.multiply(shot.pose.quaternion), vfov: shot.pose.vfov }, view: 'orbit' }
  }

  private diveAt(time: number, at: number): OrbitShot {
    const centre = this.coverCenter(this.seg.dive!)
    return this.meetAt('dive', this.diveRaw(time, at), time, smoother(ramp(centre - this.near.frames[0] / config.fps, centre, at)))
  }

  private riseAt(time: number, at: number): OrbitShot {
    const centre = this.coverCenter(this.seg.rise)
    return this.meetAt('rise', this.riseRaw(time, at), time, 1 - smoother(ramp(centre, centre + this.near.frames[1] / config.fps, at)))
  }

  private local(shot: OrbitShot, time: number): Local {
    if (shot.view === 'orbit') {
      const g = this.drawn(time).invert()
      return { p: shot.pose.position.clone().applyQuaternion(g), q: g.multiply(shot.pose.quaternion), vfov: shot.pose.vfov }
    }
    const a = this.anchor
    return { p: a.origin.clone().addScaledVector(shot.pose.position.clone().applyQuaternion(a.frame), 1 / closeRadius), q: a.frame.clone().multiply(shot.pose.quaternion), vfov: shot.pose.vfov }
  }

  motion(at: (time: number) => OrbitShot, time: number, span: number): number {
    const master = config.formats[config.formatKeys.master]!
    const half = master.height / 2
    const aspect = master.width / master.height
    const [cols, rows] = config.motion.probeGrid
    const open = this.local(at(time - span / 2), time - span / 2)
    const mid = this.local(at(time), time)
    const shut = this.local(at(time + span / 2), time + span / 2)
    const seen = (c: Local, x: THREE.Vector3): THREE.Vector2 | null => {
      const v = x.clone().sub(c.p).applyQuaternion(c.q.clone().invert())
      if (v.z > -1e-9) return null
      const k = half / Math.tan(THREE.MathUtils.degToRad(c.vfov) / 2) / -v.z
      return new THREE.Vector2(v.x * k, v.y * k)
    }
    const tan = Math.tan(THREE.MathUtils.degToRad(mid.vfov) / 2)
    let most = 0
    const track = (p: THREE.Vector3): void => {
      const a = seen(open, p)
      const b = seen(shut, p)
      if (a && b) most = Math.max(most, a.distanceTo(b))
    }
    const distance = mid.p.length()
    const radius = distance > 1 ? (half / tan) * Math.tan(Math.asin(1 / distance)) : Infinity
    const centre = seen(mid, new THREE.Vector3())
    if (centre && Math.abs(centre.x) <= half * aspect + radius && Math.abs(centre.y) <= half + radius) track(new THREE.Vector3())
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const ray = new THREE.Vector3(((x / (cols - 1)) * 2 - 1) * tan * aspect, ((y / (rows - 1)) * 2 - 1) * tan, -1).normalize().applyQuaternion(mid.q)
        const along = -mid.p.dot(ray)
        const disc = along * along - mid.p.lengthSq() + 1
        if (disc <= 0 || along - Math.sqrt(disc) <= 0) continue
        track(mid.p.clone().addScaledVector(ray, along - Math.sqrt(disc)))
      }
    }
    return most
  }

  private judged(kind: 'dive' | 'rise'): number {
    const seg = kind === 'dive' ? this.seg.dive! : this.seg.rise
    return seg.firstFrame + Math.floor((config.raw.judged.fractions as Record<string, number>)[kind]! * seg.frames + 1e-9)
  }

  private divePace(): DivePace {
    if (this.diving) return this.diving
    const fps = config.fps
    const t = this.tempo.dive
    const end = this.coverCenter(this.seg.dive!) * fps
    const still = this.judged('dive') + config.shutterFraction / 2
    const span = config.shutterFraction
    const per = config.shutterFraction / span
    const m = sampled((w) => per * this.motion((s) => this.diveAt(s, s), Math.min(w, end - span / 2 - 0.005) / fps, span / fps), still - 0.5, end, 0.125)
    const shape = curve(t.shape.map(([x, y]) => [still + x, y] as Knot))
    const base = curve([[still, t.still], [still + t.shape[t.shape.length - 2]![0], t.still], [end, t.end]])
    const run = (top: number): Track => integrate((x, w) => (base(x) + top * shape(x)) / Math.max(m(w), 0.5), still, still, end, 1 / 16)
    const top = solve((x) => last(run(x)).value - end, 10, 600)
    return (this.diving = { first: this.seg.dive!.firstFrame, still, rho: Math.min(t.still / m(still), 1), track: run(top), top })
  }

  private risePace(): RisePace {
    if (this.rising) return this.rising
    const fps = config.fps
    const t = this.tempo.rise
    const from = this.coverCenter(this.seg.rise) * fps
    const end = this.seg.rise.end * fps
    const span = config.shutterFraction
    const per = config.shutterFraction / span
    const m = sampled((w) => per * this.motion((s) => this.riseAt(s, s), Math.min(Math.max(w, from + span / 2 + 0.005), end - span / 2 - 0.005) / fps, span / fps), from, end, 0.125)
    let rest = from + t.shape[1]![0]
    while (rest < end - 1 && m(rest) >= t.floor) rest += 0.125
    const shape = curve(t.shape.map(([x, y]) => [from + x, y] as Knot))
    const tail = curve(t.tail.map(([x, y]) => [from + x, y] as Knot))
    const run = (top: number): Track => integrate((x, w) => (tail(x) + top * shape(x)) / Math.max(m(w), 0.5 * t.floor), from, from, from + t.until, 1 / 16)
    const top = solve((x) => last(run(x)).value - rest, 10, 900)
    return (this.rising = { track: run(top), top })
  }

  paced(side: 'dive' | 'rise', time: number): number {
    if (!this.tempo.on) return time
    const fps = config.fps
    const f = time * fps
    if (side === 'dive') {
      const p = this.divePace()
      if (f <= p.first) return time
      if (f < p.still) {
        const s = (f - p.first) / (p.still - p.first)
        const b1 = 16 * (s * s * s / 3 - s * s * s * s / 2 + s * s * s * s * s / 5)
        const b2 = s * s * s * s * (s * s - 3 * s + 2.5)
        return (p.first + (p.still - p.first) * (s + 0.9375 * (1 - p.rho) * b1 + (p.rho - 1) * b2)) / fps
      }
      return Math.min(read(p.track, f), this.coverCenter(this.seg.dive!) * fps - 1e-7) / fps
    }
    const from = this.coverCenter(this.seg.rise) * fps
    const end = this.seg.rise.end * fps
    if (f <= from || f >= end) return time
    const p = this.risePace()
    const l = last(p.track)
    if (f <= l.t) return read(p.track, f) / fps
    return hermite((f - l.t) / (end - l.t), l.value, l.slope, end, 1, end - l.t) / fps
  }

  private gap(side: 'dive' | 'rise'): Gap {
    const kept = this.gaps[side]
    if (kept) return kept
    const c = this.coverCenter(side === 'dive' ? this.seg.dive! : this.seg.rise)
    const h = 0.05 / config.fps
    const e = 1e-7
    const sky = (time: number): Local => this.local(side === 'dive' ? this.diveAt(time, this.paced('dive', time)) : this.riseAt(time, this.paced('rise', time)), time)
    const ground = (time: number): Local => this.local(side === 'dive' ? super.dive(time) : super.rise(time), time)
    const rate = (a: Local, b: Local): Gap => {
      const d = b.q.clone().multiply(a.q.clone().invert())
      if (d.w < 0) d.set(-d.x, -d.y, -d.z, -d.w)
      const sin = Math.sqrt(Math.max(1 - d.w * d.w, 0))
      const angle = 2 * Math.atan2(sin, d.w)
      const w = sin > 1e-12 ? new THREE.Vector3(d.x, d.y, d.z).multiplyScalar(angle / sin / h) : new THREE.Vector3()
      return { v: b.p.clone().sub(a.p).divideScalar(h), w, lens: (b.vfov - a.vfov) / h }
    }
    const above = side === 'dive' ? rate(sky(c - e - h), sky(c - e)) : rate(sky(c), sky(c + h))
    const below = side === 'dive' ? rate(ground(c), ground(c + h)) : rate(ground(c - e - h), ground(c - e))
    return (this.gaps[side] = { v: below.v.sub(above.v), w: below.w.sub(above.w), lens: below.lens - above.lens })
  }

  private flow(side: 'dive' | 'rise', shot: OrbitShot, time: number): OrbitShot {
    if (shot.view !== 'orbit' || !this.tempo.on) return shot
    const c = this.coverCenter(side === 'dive' ? this.seg.dive! : this.seg.rise)
    const n = this.tempo.flow[side === 'dive' ? 0 : 1] / config.fps
    const k = side === 'dive' ? smoother(ramp(c - n, c, time)) : 1 - smoother(ramp(c, c + n, time))
    if (k <= 0) return shot
    const g = this.gap(side)
    const s = (time - c) * k
    const turn = this.drawn(time)
    const angle = g.w.length()
    const q = angle > 1e-12 ? new THREE.Quaternion().setFromAxisAngle(g.w.clone().divideScalar(angle).applyQuaternion(turn), angle * s) : new THREE.Quaternion()
    return { pose: { position: shot.pose.position.clone().add(g.v.clone().multiplyScalar(s).applyQuaternion(turn)), quaternion: q.multiply(shot.pose.quaternion), vfov: shot.pose.vfov + g.lens * s }, view: 'orbit' }
  }

  tempoOf(side: 'dive' | 'rise'): number {
    return side === 'dive' ? this.divePace().top : this.risePace().top
  }

  override dive(time: number): OrbitShot {
    if (time >= this.coverCenter(this.seg.dive!)) return super.dive(time)
    return this.flow('dive', this.diveAt(time, this.paced('dive', time)), time)
  }

  override rise(time: number): OrbitShot {
    if (time < this.coverCenter(this.seg.rise)) return super.rise(time)
    return this.flow('rise', this.riseAt(time, this.paced('rise', time)), time)
  }
}

export const plan = new Plan()
