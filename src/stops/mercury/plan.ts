import * as THREE from 'three'
import { config } from '../../config'
import { mix, slerpDir } from '../../director/rig'
import type { Pose, ViewKind } from '../../core/types'
import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import { anchor, closeAhead, closeRadius, closeUp, type Anchor } from './close'
import fit from './fit.json'
import { close, flight, path, spinRest } from './look'

const shareOf = (kind: 'dive' | 'rise'): number => {
  const seg = config.segments.find((x) => x.stop === 'mercury' && x.kind === kind)!
  return (path[kind].at + 0.5 - seg.firstFrame) / seg.frames
}

export const params: MoveParams = {
  hold: { orbitDeg: 7, axis: [0.2, 1, 0], push: -0.04 },
  spot: { x: 0.5144, y: 0.65436 },
  dive: { headingDeg: 278, altitude: 0.03234, back: 0.06, ahead: 0.12, bow: 0.2, rollDeg: 6, swoop: true, surge: { glide: 0.1, rise: 16, fall: 2, swell: [0.35, 5, 2] } },
  terrain: { vfov: 60, gather: 0.2, forward: 0.5, rise: 0.05, side: -0.1, yawDeg: 3, pitchDeg: 0.5, entryHeight: 1, entryBack: 0.6, entryPitchDeg: -4, entryDipDeg: -4.07, horizonDeg: 19.8, dipDeg: 10.25, rollDeg: 11.27, exitHeight: 0.3, exitForward: 0.25, exitPitchDeg: 1.5, exitDipDeg: 1.54 },
  rise: { azimuthDeg: 0, elevationDeg: 0, distance: 4.8, offset: [-0.002, -0.189], driftSpeed: 0.08, rollDeg: 80, ahead: 0.01174, from: 0.02085, hug: 1.7, settle: 8, level: true, pan: 0.3 },
  travel: { turnDeg: 78, side: 1 },
  arrive: { swingDeg: 0, axis: [0, 1, 0], offset: [0.5, -0.1] },
  light: { exposure: 1, skyExposure: 0.25, sunRadiusDeg: 9.2, sunGlare: 0.012, flare: 1 },
  handover: { dive: { at: shareOf('dive'), place: { valid: [0.004, 0.004, 0.0045, 0.125], seen: 1, maxEnlarge: 3, enlargeSoft: 0.95, edgeIn: [0.4, 0.4, 0.4, 0.25] } }, rise: { at: shareOf('rise'), place: { valid: [0.03, 0.03, 0.05, 0.125], seen: 1, maxEnlarge: 1.2, enlargeSoft: 0.4, edgeIn: [0.4, 0.4, 0.4, 0.25] } } },
  cover: [1, 0.95, 0.86],
  coverEdge: [4, 4],
  coverHides: 0,
  skyAim: { orbit: [77.38414, 172.96308, -53.87859], terrain: [12.8819, -127.45635, -55] },
  spinDegPerSecond: 0.6,
  moonDegPerSecond: 0,
  tint: [0.62, 0.56, 0.5],
}

interface Leg { lo: number; hi: number; top: number; from: number; rates: [number, number, number]; round: number; near: number; far: number; place: THREE.Vector3; pose: Pose; out: THREE.Vector3; seen: THREE.Vector3; outRate: THREE.Vector3; seenRate: THREE.Vector3; turn: THREE.Vector3 }

function eased(x: number, b: number): number {
  if (x <= 0) return 0
  if (x >= 1) return x - 0.5
  const k = 6 * b * (1 - b)
  if (x < b) return (x * x * x) / k
  if (x <= 1 - b) return (b * b * b) / k + ((x - b) * (x - b) + b * (x - b)) / (2 * (1 - b))
  return 0.5 - (1 - x) + ((1 - x) * (1 - x) * (1 - x)) / k
}

function swell(x: number, lo: number, top: number, hi: number, a: number, p: number, c: number, b: number): number {
  const t = Math.min(Math.max(x, lo), hi)
  const up = top - lo
  const down = hi - top
  if (t <= top) return up * (a * ((t - lo) / up) + (p - a) * eased((t - lo) / up, b))
  const y = (hi - t) / down
  return (up * (a + p)) / 2 + (down * (p + c)) / 2 - down * (c * y + (p - c) * eased(y, b))
}

export class Plan extends StopPlan {
  private anchored: Anchor | null = null
  private readonly legs: { dive?: Leg; rise?: Leg } = {}

  constructor(p: MoveParams = params, private readonly near = close, private readonly fly = flight, private readonly way = path) {
    super('mercury', fit as Fit, p)
  }

  private cruise(time: number): Pose {
    const f = time * config.fps
    const seg = this.seg.terrain
    const pivot = seg.firstFrame + Math.floor((config.raw.judged.fractions as Record<string, number>).terrain! * seg.frames + 1e-9) + config.shutterFraction / 2
    const x = this.fly.lift
    const b = Math.pow(Math.max(1 - (x.at - f) / x.frames, 0), x.power)
    const u = (2 * (f - pivot)) / seg.frames
    const along = (this.fly.travel / (2 + (2 * this.fly.gather) / 3)) * (u + (this.fly.gather * u * u * u) / 3) + x.forward * b
    return { position: closeAhead.clone().multiplyScalar(along).addScaledVector(closeUp, this.fly.swoop * u * u + x.height * b), quaternion: new THREE.Quaternion(), vfov: this.p.terrain.vfov }
  }

  low(time: number): Pose {
    if (time < this.seg.terrain.start) return this.untwin(this.path('dive', time), time)
    if (time > this.seg.terrain.end) return this.untwin(this.path('rise', time), time)
    return this.cruise(time)
  }

  private untwin(pose: Pose, time: number): Pose {
    const a = this.anchor
    const back = this.drawn(time).invert()
    const frame = a.frame.clone().invert()
    return { position: pose.position.clone().applyQuaternion(back).sub(a.origin).applyQuaternion(frame).multiplyScalar(closeRadius), quaternion: frame.multiply(back).multiply(pose.quaternion), vfov: pose.vfov }
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

  rested(time: number): number {
    const c0 = this.fly.rest[0] / config.fps
    const c1 = this.fly.rest[1] / config.fps
    const w = this.fly.knee / config.fps
    if (time >= c1 + w) return c1 - c0
    const knee = (x: number): number => (x <= -w ? 0 : x >= w ? x : ((x + w) * (x + w)) / (4 * w))
    return knee(time - c0) - knee(time - c1)
  }

  drawn(time: number): THREE.Quaternion {
    return this.turn(time - spinRest * this.rested(time))
  }

  private onGround(time: number): Pose {
    const low = this.cruise(time)
    const a = this.anchor
    return { position: a.origin.clone().addScaledVector(low.position.clone().applyQuaternion(a.frame), 1 / closeRadius), quaternion: a.frame.clone().multiply(low.quaternion), vfov: low.vfov }
  }

  private aloft(kind: 'dive' | 'rise', time: number): Pose {
    const pose = kind === 'dive' ? this.hold(time - this.seg.hold.start) : this.after(time)
    const g = this.drawn(time).invert()
    return { position: pose.position.clone().applyQuaternion(g), quaternion: g.multiply(pose.quaternion), vfov: pose.vfov }
  }

  private leg(kind: 'dive' | 'rise'): Leg {
    const kept = this.legs[kind]
    if (kept) return kept
    const fps = config.fps
    const seg = kind === 'dive' ? this.seg.dive! : this.seg.rise
    const w = this.way[kind]
    const near = kind === 'dive' ? this.seg.terrain.start : this.seg.terrain.end
    const far = kind === 'dive' ? seg.start : seg.end
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
    const rateFar = (height(this.aloft(kind, far + e)) - height(this.aloft(kind, far - e))) / (2 * e)
    const lo = Math.min(near, far)
    const hi = Math.max(near, far)
    const top = lo + w.peak * (hi - lo)
    const first = kind === 'dive' ? rateFar : rateNear
    const last = kind === 'dive' ? rateNear : rateFar
    const from = kind === 'dive' ? height(this.aloft(kind, far)) : height(pose)
    const to = kind === 'dive' ? height(pose) : height(this.aloft(kind, far))
    const most = (2 * (to - from) - first * (top - lo) - last * (hi - top)) / (hi - lo)
    return (this.legs[kind] = {
      lo, hi, top, from, rates: [first, most, last], round: w.round, near, far, place, pose,
      out: out(pose), seen: seen(pose), outRate: out(after).sub(out(before)).divideScalar(2 * e), seenRate: seen(after).sub(seen(before)).divideScalar(2 * e), turn,
    })
  }

  private heightAt(l: Leg, time: number): number {
    return l.from + swell(time, l.lo, l.top, l.hi, l.rates[0], l.rates[1], l.rates[2], l.round)
  }

  private path(kind: 'dive' | 'rise', time: number): Pose {
    const l = this.leg(kind)
    const w = this.way[kind]
    const t = Math.min(Math.max(time, l.lo), l.hi)
    const high = this.aloft(kind, t)
    const log = this.heightAt(l, t)
    const share = swell(t, l.lo, l.top, l.hi, 0, 1, 0, l.round) / ((l.hi - l.lo) / 2)
    const k = kind === 'dive' ? share : 1 - share
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
    return time >= this.seg.terrain.start ? this.twin(this.cruise(time), time) : this.path('dive', time)
  }

  override risePose(time: number, view: ViewKind): Pose {
    if (view === 'terrain') return this.low(time)
    return time <= this.seg.terrain.end ? this.twin(this.cruise(time), time) : this.path('rise', time)
  }

  placeOf(kind: 'dive' | 'rise'): THREE.Vector3 {
    return this.leg(kind).place.clone()
  }
}

export const plan = new Plan()
