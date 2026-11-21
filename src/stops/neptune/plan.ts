import * as THREE from 'three'
import { config, type Segment } from '../../config'
import type { CoverHorizon, Pose } from '../../core/types'
import { StopPlan, type Fit, type MoveParams, type OrbitShot } from '../../director/moves'
import { drift } from '../../director/rig'
import { coverWindow } from '../../director/timeline'
import close from './close.json'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 7, axis: [-0.25, 1, 0], push: -0.035 },
  spot: { x: 0.55, y: 0.52 },
  dive: { headingDeg: -70, altitude: 0.0331, back: 0.07, ahead: 0.14, bow: -0.22, rollDeg: -5, swoop: true, level: 0.5, surge: { glide: 0.14, rise: 60, fall: 2, swell: [0.3, 9, 1.2] } },
  terrain: { vfov: 30, forward: 0.42, rise: 0.33, side: -0.6, yawDeg: -5, pitchDeg: 0.6, entryHeight: 0.6, entryBack: 1.4, entryPitchDeg: 3, exitHeight: 0.45, exitForward: -2.6, exitPitchDeg: 0, exitDipDeg: 3.35, horizonDeg: 8.22, dipDeg: 12.41, rollDeg: 9.54 },
  rise: { azimuthDeg: -26, elevationDeg: 17.5, distance: 5.2, offset: [-0.3, 0.1], driftSpeed: 0.1, rollDeg: 4, ahead: 0, hug: 1.2, settle: 5, gentle: true, level: true, pan: 0.3, from: 0.3 },
  travel: { turnDeg: 0, side: 1 },
  arrive: { swingDeg: -34, axis: [0.1, 1, 0.2], from: 0.25, offset: [0.5, 0.2] },
  light: { exposure: 1, skyExposure: 0.65, sunRadiusDeg: 0.14, sunGlare: 0.6, flare: 0 },
  skyAim: { orbit: [25.78793, 56.89437, -50.63077], terrain: [180, -12, 40] },
  cover: [0.27, 0.43, 0.8],
  coverLow: [0.03, 0.075, 0.22],
  coverTerrain: [0.4, 0.56, 0.85],
  coverLowTerrain: [0.03, 0.065, 0.19],
  coverTop: [0.3, 0.06],
  coverEdge: [0.2, 0.5],
  coverEdgeRise: [0.4, 0.5],
  coverShell: [1.005, 1.03],
  coverRush: { speed: 2.4, reach: 2.5, billow: [2.2, 0.9, 1], streak: [9, 2.2, 1.6], contrast: [0.6, 0.45] },
  spinDegPerSecond: 1.3,
  moonDegPerSecond: 0.3,
  tint: [0.3, 0.5, 1],
}

const veil: { air: [number, number]; sea: [number, number]; clear: number; full: number } = { air: [1.005, 1.03], sea: [1.002, 1.012], clear: 0.55, full: 0.93 }
const deck = new THREE.Vector3().fromArray(close.nadir).multiplyScalar(close.radius + 1)
const rim: [number, number][] = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]
const hides = 0.4
const closed = 0.98
export const descent = { onset: 3, pin: 4707.25, settleDeg: 2, settlePower: 2.2, from: 4707.5, bankOver: 5, bankKneeDeg: 1, turnDeg: 45, turnTo: 4730, place: [0, 0.1] as [number, number], placeOver: 14 }
export const ascent = { turnDeg: 49, turnFrames: 24, place: [0.18, -0.26] as [number, number], placeFrames: 20, pace: { start: 0.04, ramp: 5, hold: 16, rest: 26, late: 0.006 } }
export const steady = { hold: 0.5, terrain: 1 }
const smooth = (x: number): number => {
  const t = Math.min(Math.max(x, 0), 1)
  return t * t * (3 - 2 * t)
}
const smoother = (x: number): number => {
  const t = Math.min(Math.max(x, 0), 1)
  return t * t * t * (t * (6 * t - 15) + 10)
}
const bankOf = (pose: Pose): number => {
  const n = pose.position.clone().normalize().negate().applyQuaternion(pose.quaternion.clone().invert())
  return Math.atan2(n.x, -n.y)
}

interface Climb { from: number; span: number; h0: number; top: number; out: number }
interface Fall { start: number; join: number; span: number; h0: number; drift: number; accel: number; knee: number; late: number; power: number }

class NeptunePlan extends StopPlan {
  private amount = 0
  private fall: Fall | null = null
  private last: { time: number; at: number } | null = null
  private entryBank: number | null = null
  private climbed: Climb | null = null
  private lastUp: { time: number; at: number } | null = null

  private high(time: number): number {
    return super.dive(time).pose.position.length() - 1
  }

  private ramped(t: number): { v: number; s: number } {
    const n = descent.onset
    if (t >= n) return { v: t - n / 2, s: 0.5 * t * t - 0.5 * n * t + 0.15 * n * n }
    const k = t / n
    return { v: n * (k * k * k - 0.5 * k * k * k * k), s: n * n * (0.25 * k * k * k * k - 0.1 * k * k * k * k * k) }
  }

  private eased(): Fall {
    if (this.fall) return this.fall
    const seg = this.seg.dive!
    const fps = config.fps
    const start = seg.start
    const join = coverWindow(seg)!.firstFrame / fps
    const span = (join - start) * fps
    const dt = 0.01 / fps
    const h0 = this.high(start)
    const drift = -Math.log(this.high(start + dt) / h0) / (dt * fps)
    const hJ = this.high(join)
    const vJ = -Math.log(this.high(join + dt) / this.high(join - dt)) / (2 * dt * fps)
    const pin = descent.pin / fps
    const knee = (pin - start) * fps
    const pace = -Math.log(this.high(pin + dt) / this.high(pin - dt)) / (2 * dt * fps)
    const accel = (pace - drift) / this.ramped(knee).v
    const late = vJ - drift - accel * this.ramped(span).v
    const power = (late * (span - knee)) / (Math.log(h0 / hJ) - drift * span - accel * this.ramped(span).s) - 1
    this.fall = { start, join, span, h0, drift, accel, knee, late, power }
    return this.fall
  }

  private placed(pose: Pose, time: number, place: [number, number], w: number, psi: number): Pose {
    const spot = this.spot.clone().applyQuaternion(this.turn(time)).normalize()
    const r = new THREE.Quaternion()
    if (w > 0) {
      const th = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
      const wide = th * this.fit.aspect
      const s = spot.clone().sub(pose.position).applyQuaternion(pose.quaternion.clone().invert())
      const x = s.x / -s.z / wide
      const y = s.y / -s.z / th
      const d = new THREE.Vector3((x + (place[0] - x) * w) * wide, (y + (place[1] - y) * w) * th, -1).normalize().applyQuaternion(pose.quaternion)
      const b = pose.position.dot(d)
      const disc = b * b - (pose.position.lengthSq() - 1)
      if (disc > 0) r.setFromUnitVectors(pose.position.clone().addScaledVector(d, -b - Math.sqrt(disc)).normalize(), spot)
    }
    if (psi !== 0) r.premultiply(new THREE.Quaternion().setFromAxisAngle(spot, psi))
    return { position: pose.position.clone().applyQuaternion(r), quaternion: r.multiply(pose.quaternion), vfov: pose.vfov }
  }

  private steadied(pose: Pose, kind: 'hold' | 'terrain', tRel: number): Pose {
    const s = this.seg[kind]
    const fractions = config.raw.judged.fractions as Record<string, number>
    const frame = Math.min(s.endFrame - 1, s.firstFrame + Math.floor((fractions[kind] ?? 0.5) * s.frames + 1e-9))
    const at = (frame + config.shutterFraction / 2) / config.fps
    const time = s.start + tRel
    const w = smooth((time - s.start - steady[kind]) / (at - s.start - steady[kind])) * (1 - smooth((time - at) / (s.end - steady[kind] - at)))
    if (w <= 0) return pose
    return { ...pose, quaternion: pose.quaternion.clone().multiply(new THREE.Quaternion().slerp(drift(at).invert(), w)) }
  }

  override hold(tRel: number): Pose {
    return this.steadied(super.hold(tRel), 'hold', tRel)
  }

  override terrain(tRel: number): Pose {
    return this.steadied(super.terrain(tRel), 'terrain', tRel)
  }

  override dive(time: number): OrbitShot {
    const flown = this.flown(time)
    const frame = time * config.fps
    if (flown.view !== 'orbit' || frame <= descent.from) return flown
    const pose = this.placed(flown.pose, time, descent.place, smoother((frame - descent.from) / descent.placeOver), THREE.MathUtils.degToRad(descent.turnDeg) * smoother((frame - descent.from) / (descent.turnTo - descent.from)))
    if (this.entryBank === null) {
      const n = this.horizon('terrain', super.dive(this.coverCenter(this.seg.dive!)).pose).normal
      this.entryBank = Math.atan2(-n[0], n[1])
    }
    const bank = bankOf(pose)
    const knee = THREE.MathUtils.degToRad(descent.bankKneeDeg)
    const held = 0.5 * (bank + this.entryBank + Math.sqrt((bank - this.entryBank) ** 2 + knee * knee))
    const roll = (bank - held) * smooth((frame - descent.from) / descent.bankOver)
    pose.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll))
    return { pose, view: flown.view }
  }

  private lift(time: number): number {
    return super.rise(time).pose.position.length() - 1
  }

  private paced(time: number): number {
    const seg = this.seg.rise
    const fps = config.fps
    const k = ascent.pace
    if (!this.climbed) {
      const from = this.coverCenter(seg)
      const span = (seg.end - from) * fps
      const h0 = this.lift(from)
      const dt = 0.01 / fps
      const far = this.exitPose(seg.end).position.length() - 1
      const out = Math.log((this.exitPose(seg.end + dt).position.length() - 1) / far) / (dt * fps)
      const top = (Math.log(far / h0) - 0.5 * k.start * k.ramp - 0.5 * k.late * (k.rest - k.hold) - 0.5 * (k.late + out) * (span - k.rest)) / (0.5 * k.ramp + k.hold - k.ramp + 0.5 * (k.rest - k.hold))
      this.climbed = { from, span, h0, top, out }
    }
    const c = this.climbed
    if (this.lastUp?.time === time) return this.lastUp.at
    const t = (time - c.from) * fps
    const part = (x: number): number => {
      const y = Math.min(Math.max(x, 0), 1)
      return y * y * y - 0.5 * y * y * y * y
    }
    const gone = k.start * Math.min(t, k.ramp) + (c.top - k.start) * k.ramp * part(t / k.ramp) + c.top * Math.max(t - k.ramp, 0) - (c.top - k.late) * (k.rest - k.hold) * part((t - k.hold) / (k.rest - k.hold)) - (t > k.rest ? (c.top - k.late) * (t - k.rest) + (k.late - c.out) * (c.span - k.rest) * part((t - k.rest) / (c.span - k.rest)) : 0)
    const want = c.h0 * Math.exp(gone)
    let a = c.from
    let b = seg.end
    for (let i = 0; i < 36; i++) {
      const mid = 0.5 * (a + b)
      if (this.lift(mid) < want) a = mid
      else b = mid
    }
    this.lastUp = { time, at: 0.5 * (a + b) }
    return this.lastUp.at
  }

  override rise(time: number): OrbitShot {
    if (time < this.coverCenter(this.seg.rise)) return super.rise(time)
    const shot = super.rise(this.paced(time))
    const since = (time - this.coverCenter(this.seg.rise)) * config.fps
    return { pose: this.placed(shot.pose, time, ascent.place, 1 - smoother(since / ascent.placeFrames), THREE.MathUtils.degToRad(ascent.turnDeg) * (1 - smoother(since / ascent.turnFrames))), view: shot.view }
  }

  private flown(time: number): OrbitShot {
    const seg = this.seg.dive!
    const c = this.eased()
    if (time >= this.coverCenter(seg)) {
      const shot = super.dive(time)
      const x = Math.min(Math.max((seg.end - time) / (seg.end - c.join), 0), 1)
      const settle = new THREE.Quaternion().setFromEuler(new THREE.Euler(-THREE.MathUtils.degToRad(descent.settleDeg) * Math.pow(x, descent.settlePower), 0, 0))
      return { pose: { position: shot.pose.position, quaternion: shot.pose.quaternion.clone().multiply(settle), vfov: shot.pose.vfov }, view: shot.view }
    }
    if (time <= c.start || time >= c.join) return super.dive(time)
    const t = (time - c.start) * config.fps
    const want = c.h0 * Math.exp(-(c.drift * t + c.accel * this.ramped(t).s + ((c.late * (c.span - c.knee)) / (c.power + 1)) * Math.pow(Math.max(t - c.knee, 0) / (c.span - c.knee), c.power + 1)))
    if (this.last?.time !== time) {
      let a = c.start
      let b = c.join
      for (let i = 0; i < 36; i++) {
        const mid = 0.5 * (a + b)
        if (this.high(mid) > want) a = mid
        else b = mid
      }
      this.last = { time, at: 0.5 * (a + b) }
    }
    return super.dive(this.last.at)
  }

  override coverAmount(seg: Segment, time: number): number {
    const amount = super.coverAmount(seg, time)
    this.amount = amount
    this.p.coverHides = amount < closed ? hides : undefined
    return amount
  }

  override horizon(view: 'orbit' | 'terrain', local: Pose): CoverHorizon {
    const c = (view === 'orbit' ? local.position.clone().negate() : deck.clone().sub(local.position).divideScalar(close.radius)).applyQuaternion(local.quaternion.clone().invert())
    const th = Math.tan(THREE.MathUtils.degToRad(local.vfov) / 2)
    let far = 0
    for (const [x, y] of rim) {
      const reach = c.dot(new THREE.Vector3(x * th * this.fit.aspect, y * th, -1).normalize())
      far = Math.max(far, reach > 0 ? Math.sqrt(Math.max(c.lengthSq() - reach * reach, 0)) : c.length())
    }
    const w = smooth((this.amount - veil.clear) / (veil.full - veil.clear))
    const tight = view === 'orbit' ? veil.air : veil.sea
    const lift = Math.max(far - tight[0], 0) * w
    const edge: [number, number] = [tight[0] + lift * w, tight[1] + lift]
    if (view === 'orbit') this.p.coverShell = edge
    else this.p.coverSea = { centre: [deck.x, deck.y, deck.z], radius: close.radius, edge }
    return super.horizon(view, local)
  }
}

export const plan = new NeptunePlan('neptune', fit as Fit, params)
