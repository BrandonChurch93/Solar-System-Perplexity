import * as THREE from 'three'
import { config } from '../../config'
import { mix, slerpDir } from '../../director/rig'
import type { Pose, ViewKind } from '../../core/types'
import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import { anchor, closeAhead, closeRadius, closeUp, type Anchor } from './close'
import fit from './fit.json'
import { close, flight, path, spinRest } from './look'

export const params: MoveParams = {
  hold: { orbitDeg: 7, axis: [0.2, 1, 0], push: -0.04 },
  spot: { x: 0.5144, y: 0.65436 },
  dive: { headingDeg: 278, altitude: 0.03234, back: 0.06, ahead: 0.12, bow: 0.2, rollDeg: 6, swoop: true, surge: { glide: 0.1, rise: 16, fall: 2, swell: [0.35, 5, 2] } },
  terrain: { vfov: 60, gather: 0.2, forward: 0.5, rise: 0.05, side: -0.1, yawDeg: 3, pitchDeg: 0.5, entryHeight: 1, entryBack: 0.6, entryPitchDeg: -4, entryDipDeg: -4.07, horizonDeg: 19.8, dipDeg: 10.25, rollDeg: 11.27, exitHeight: 0.3, exitForward: 0.25, exitPitchDeg: 1.5, exitDipDeg: 1.54 },
  rise: { azimuthDeg: 0, elevationDeg: 0, distance: 4.8, offset: [-0.002, -0.189], driftSpeed: 0.08, rollDeg: 80, ahead: 0.01174, from: 0.02085, hug: 1.7, settle: 8, level: true, pan: 0.3 },
  travel: { turnDeg: 78, side: 1 },
  arrive: { swingDeg: 0, axis: [0, 1, 0], offset: [0.5, -0.1] },
  light: { exposure: 1, skyExposure: 0.25, sunRadiusDeg: 9.2, sunGlare: 0.012, flare: 1 },
  handover: { dive: { place: { valid: [0.03, 0.03, 0.05, 0.125], seen: 1, maxEnlarge: 3, enlargeSoft: 0.95 } }, rise: { place: { valid: [0.03, 0.03, 0.05, 0.125], seen: 1, maxEnlarge: 1.2, enlargeSoft: 0.4 } } },
  cover: [1, 0.95, 0.86],
  coverEdge: [4, 4],
  coverHides: 0,
  skyAim: { orbit: [77.38414, 172.96308, -53.87859], terrain: [12.8819, -127.45635, -55] },
  spinDegPerSecond: 0.6,
  moonDegPerSecond: 0,
  tint: [0.62, 0.56, 0.5],
}

interface Leg { lo: number; hi: number; from: number; rates: [number, number, number]; eases: [number, number]; near: number; span: number; place: THREE.Vector3; pose: Pose; out: THREE.Vector3; seen: THREE.Vector3; outRate: THREE.Vector3; seenRate: THREE.Vector3; turn: THREE.Vector3 }

const run = (y: number): number => y * y * y * y * (y * y - 3 * y + 2.5)

function glide(x: number, a: number, b: number): number {
  const whole = 1 - a / 2 - b / 2
  if (x <= 0) return 0
  if (x >= 1) return 1
  if (x < a) return (a * run(x / a)) / whole
  if (x <= 1 - b) return (a / 2 + x - a) / whole
  return 1 - (b * run((1 - x) / b)) / whole
}

export class Plan extends StopPlan {
  private anchored: Anchor | null = null
  private readonly legs: { dive?: Leg; rise?: Leg } = {}

  constructor(p: MoveParams = params, private readonly near = close, private readonly fly = flight, private readonly way = path) {
    super('mercury', fit as Fit, p)
  }

  low(time: number): Pose {
    const fps = config.fps
    const f = time * fps
    const seg = this.seg.terrain
    const pivot = seg.firstFrame + Math.floor((config.raw.judged.fractions as Record<string, number>).terrain! * seg.frames + 1e-9) + config.shutterFraction / 2
    const e = this.fly.entry
    const x = this.fly.exit
    const a = Math.pow(Math.max(1 - (f - e.at) / e.frames, 0), e.power)
    const b = Math.pow(Math.max(1 - (x.at - f) / x.frames, 0), x.power)
    const u = (2 * (f - pivot)) / seg.frames
    const along = (this.fly.travel / (2 + (2 * this.fly.gather) / 3)) * (u + (this.fly.gather * u * u * u) / 3) - e.back * a + x.forward * b
    const position = closeAhead.clone().multiplyScalar(along).addScaledVector(closeUp, this.fly.swoop * u * u + e.height * a + x.height * b)
    const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(THREE.MathUtils.degToRad(e.pitchDeg * a + x.pitchDeg * b), 0, THREE.MathUtils.degToRad(e.rollDeg * a), 'YXZ'))
    return { position, quaternion, vfov: this.p.terrain.vfov }
  }

  override terrain(tRel: number): Pose {
    return this.low(tRel + this.seg.terrain.start)
  }

  override twin(local: Pose, time: number): Pose {
    const a = this.anchor
    const turn = this.drawn(time)
    return { position: a.origin.clone().addScaledVector(local.position.clone().applyQuaternion(a.frame), 1 / closeRadius).applyQuaternion(turn), quaternion: turn.clone().multiply(a.frame).multiply(local.quaternion), vfov: local.vfov }
  }

  get anchor(): Anchor {
    return (this.anchored ??= anchor(this.normal, this.heading, this.near.shift))
  }

  drawn(time: number): THREE.Quaternion {
    const c0 = this.fly.entry.at / config.fps
    const c1 = this.fly.exit.at / config.fps
    return this.turn(time - spinRest * Math.min(Math.max(time - c0, 0), c1 - c0))
  }

  private onGround(time: number): Pose {
    const low = this.low(time)
    const a = this.anchor
    return { position: a.origin.clone().addScaledVector(low.position.clone().applyQuaternion(a.frame), 1 / closeRadius), quaternion: a.frame.clone().multiply(low.quaternion), vfov: low.vfov }
  }

  private above(kind: 'dive' | 'rise', time: number): Pose {
    const pose = kind === 'dive' ? this.hold(time - this.seg.hold.start) : this.after(time)
    const g = this.drawn(time).invert()
    return { position: pose.position.clone().applyQuaternion(g), quaternion: g.multiply(pose.quaternion), vfov: pose.vfov }
  }

  private leg(kind: 'dive' | 'rise'): Leg {
    const kept = this.legs[kind]
    if (kept) return kept
    const fps = config.fps
    const seg = kind === 'dive' ? this.seg.dive! : this.seg.rise
    const near = this.coverCenter(seg)
    const far = kind === 'dive' ? seg.start : seg.end
    const w = this.way[kind]
    const e = 1e-3 / fps
    const pose = this.onGround(near)
    const ray = new THREE.Vector3(0, 0, -1).applyQuaternion(pose.quaternion)
    const along = -pose.position.dot(ray)
    const place = pose.position.clone().addScaledVector(ray, along - Math.sqrt(Math.max(along * along - pose.position.lengthSq() + 1, 0)))
    const height = (p: Pose): number => Math.log(p.position.length() - 1)
    const out = (p: Pose): THREE.Vector3 => p.position.clone().sub(place).normalize()
    const seen = (p: Pose): THREE.Vector3 => place.clone().sub(p.position).applyQuaternion(p.quaternion.clone().invert()).normalize()
    const before = this.onGround(near - e)
    const after = this.onGround(near + e)
    const d = after.quaternion.clone().multiply(before.quaternion.clone().invert())
    if (d.w < 0) d.set(-d.x, -d.y, -d.z, -d.w)
    const sin = Math.sqrt(Math.max(1 - d.w * d.w, 0))
    const turn = sin > 1e-12 ? new THREE.Vector3(d.x, d.y, d.z).multiplyScalar((2 * Math.atan2(sin, d.w)) / sin / (2 * e)) : new THREE.Vector3()
    const rateNear = (height(after) - height(before)) / (2 * e)
    const rateFar = (height(this.above(kind, far + e)) - height(this.above(kind, far - e))) / (2 * e)
    const easeNear = w.easeNear / fps
    const easeFar = w.easeFar / fps
    const span = Math.abs(near - far)
    const rise = kind === 'dive' ? height(pose) - height(this.above(kind, far)) : height(this.above(kind, far)) - height(pose)
    const first = kind === 'dive' ? rateFar : rateNear
    const last = kind === 'dive' ? rateNear : rateFar
    const eases: [number, number] = kind === 'dive' ? [easeFar, easeNear] : [easeNear, easeFar]
    const level = (rise - (first * eases[0]) / 2 - (last * eases[1]) / 2) / (span - eases[0] / 2 - eases[1] / 2)
    return (this.legs[kind] = {
      lo: Math.min(near, far), hi: Math.max(near, far), from: kind === 'dive' ? height(this.above(kind, far)) : height(pose), rates: [first, level, last], eases, near, span, place, pose,
      out: out(pose), seen: seen(pose), outRate: out(after).sub(out(before)).divideScalar(2 * e), seenRate: seen(after).sub(seen(before)).divideScalar(2 * e), turn,
    })
  }

  private heightAt(l: Leg, time: number): number {
    const x = Math.min(Math.max(time - l.lo, 0), l.span)
    const [first, level, last] = l.rates
    const [a, b] = l.eases
    if (x <= a) return l.from + first * x + (level - first) * a * run(x / a)
    const base = first * a + ((level - first) * a) / 2
    if (x <= l.span - b) return base + l.from + level * (x - a)
    const y = (x - (l.span - b)) / b
    return l.from + base + level * (l.span - a - b) + level * b * y + (last - level) * b * run(y)
  }

  private path(kind: 'dive' | 'rise', time: number): Pose {
    const l = this.leg(kind)
    const w = this.way[kind]
    const t = Math.min(Math.max(time, l.lo), l.hi)
    const high = this.above(kind, t)
    const log = this.heightAt(l, t)
    const ends = [this.heightAt(l, kind === 'dive' ? l.lo : l.hi), this.heightAt(l, l.near)]
    const k = glide((log - ends[0]!) / (ends[1]! - ends[0]!), w.blend[0], w.blend[1])
    const tau = w.settle / config.fps
    const x = t - l.near
    const g = Math.sign(x) * tau * (1 - Math.exp(-Math.abs(x) / tau))
    const out = slerpDir(high.position.clone().sub(l.place).normalize(), l.out.clone().addScaledVector(l.outRate, g).normalize(), k)
    const b = l.place.dot(out)
    const r = 1 + Math.exp(log)
    const position = l.place.clone().addScaledVector(out, -b + Math.sqrt(b * b + r * r - 1))
    const angle = l.turn.length() * g
    const low = angle !== 0 ? new THREE.Quaternion().setFromAxisAngle(l.turn.clone().normalize(), angle).multiply(l.pose.quaternion) : l.pose.quaternion
    const q = high.quaternion.clone().slerp(low, k)
    const seenHigh = l.place.clone().sub(high.position).applyQuaternion(high.quaternion.clone().invert()).normalize()
    const want = slerpDir(seenHigh, l.seen.clone().addScaledVector(l.seenRate, g).normalize(), k)
    const is = l.place.clone().sub(position).applyQuaternion(q.clone().invert()).normalize()
    q.multiply(new THREE.Quaternion().setFromUnitVectors(want, is))
    const lens = mix(Math.log(Math.tan(THREE.MathUtils.degToRad(high.vfov) / 2)), Math.log(Math.tan(THREE.MathUtils.degToRad(l.pose.vfov) / 2)), k)
    const turn = this.drawn(t)
    return { position: position.applyQuaternion(turn), quaternion: turn.multiply(q), vfov: THREE.MathUtils.radToDeg(2 * Math.atan(Math.exp(lens))) }
  }

  override divePose(time: number, view: ViewKind): Pose {
    if (view === 'terrain') return this.low(time)
    return time >= this.coverCenter(this.seg.dive!) ? this.twin(this.low(time), time) : this.path('dive', time)
  }

  override risePose(time: number, view: ViewKind): Pose {
    if (view === 'terrain') return this.low(time)
    return time <= this.coverCenter(this.seg.rise) ? this.twin(this.low(time), time) : this.path('rise', time)
  }

  placeOf(kind: 'dive' | 'rise'): THREE.Vector3 {
    return this.leg(kind).place.clone()
  }
}

export const plan = new Plan()
