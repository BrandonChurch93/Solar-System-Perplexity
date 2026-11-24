import * as THREE from 'three'
import { config } from '../../config'
import type { Pose, ViewKind } from '../../core/types'
import { handoverOf, sideAt } from '../../director/handover'
import { forward, lookAt, mix, ramp, slerpDir, smooth } from '../../director/rig'
import { StopPlan, type Fit, type MoveParams, type OrbitShot } from '../../director/moves'
import fit from './fit.json'
import placeJson from './place.json'
import { side, twin } from './place'

export interface Leg { ease: number[]; round: number[]; hold: number; bank?: { deg: number } }
export interface Path { handover: NonNullable<MoveParams['handover']>; dive: Leg; rise: Leg; bend: { frames: number; acrossDeg: number[]; turnDeg: number }; rewind: number }

export const path: Path = placeJson.path

export const params: MoveParams = {
  hold: { orbitDeg: 0, axis: [0.1, 1, 0], push: -0.035 },
  spot: { x: 0.52, y: 0.46 },
  dive: { headingDeg: 52.25, altitude: 0.030751, back: 0.06, ahead: 0.12, bow: 0.2, rollDeg: 5 },
  terrain: { vfov: 45, gather: 0.4, forward: 0.44, rise: 0.237, side: 0.3, yawDeg: 0, pitchDeg: 0, entryHeight: 0, entryBack: 0, entryPitchDeg: 0, exitHeight: 0, exitForward: 0, exitPitchDeg: 0, horizonDeg: 14.3175, dipDeg: 14.0305, rollDeg: -2.0044, bend: { frames: path.bend.frames, acrossDeg: [path.bend.acrossDeg[0]!, path.bend.acrossDeg[1]!], turnDeg: path.bend.turnDeg } },
  rise: { azimuthDeg: 0, elevationDeg: 0, distance: 4.56, offset: [0, 0], driftSpeed: 0.5, rollDeg: 0 },
  travel: { turnDeg: 93, side: 1, turnEnd: 0.42 },
  arrive: { swingDeg: 20, axis: [0.15, 1, 0], from: 0.2, offset: [0.4, 0.3] },
  light: { exposure: 1, skyExposure: 0.42, sunRadiusDeg: 1.8, sunGlare: 0.85, flare: 0.45, sunDir: [-0.692237, 0.508, 0.512586] },
  cover: [0.22, 0.34, 0.6],
  handover: path.handover,
  spinDegPerSecond: 1.1,
  moonDegPerSecond: 0.13,
  tint: [0.55, 0.7, 1],
  skyAim: { orbit: [90, -21, 4], terrain: [36.77227, -52.29257, 2.15534] },
}

interface Law { frames: number; total: number; at: (x: number) => number; rate: (x: number) => number }

const STEPS = 64

function shape(u: number, c: number): number {
  const x = Math.min(Math.max(u, 0), 1)
  const h = 1 / (1 - c)
  if (x < c) return (h * x * x) / (2 * c)
  if (x <= 1 - c) return h * (x - c / 2)
  return 1 - (h * (1 - x) * (1 - x)) / (2 * c)
}

function area(u: number, c: number): number {
  const x = Math.min(Math.max(u, 0), 1)
  const h = 1 / (1 - c)
  if (x < c) return (h * x * x * x) / (6 * c)
  if (x <= 1 - c) return (h * c * c) / 6 + (h * (x - c) * x) / 2
  return x - 0.5 + (h * (1 - x) * (1 - x) * (1 - x)) / (6 * c)
}

function law(frames: number, ease: number[], round: number[], total: number, last: number): Law {
  const a = ease[0]!
  const b = ease[1]!
  const ca = round[0]!
  const cb = round[1]!
  const cruise = (total - 0.5 * last * b) / (frames - 0.5 * (a + b))
  const rate = (x: number): number => (x < a ? cruise * shape(x / a, ca) : cruise + (last - cruise) * shape((x - (frames - b)) / b, cb))
  const at = (x: number): number => {
    if (x <= 0) return 0
    if (x >= frames) return total + last * (x - frames)
    const head = cruise * a * area(x / a, ca)
    const body = cruise * Math.max(x - a, 0)
    const tail = (last - cruise) * b * area((x - (frames - b)) / b, cb)
    return head + body + tail
  }
  return { frames, total, at, rate }
}

function size(pose: Pose): number {
  return Math.log(Math.tan(Math.asin(Math.min(1 / pose.position.length(), 1))) / Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2))
}

export class Plan extends StopPlan {
  private laws: { dive?: Law; rise?: Law } = {}

  constructor(p: MoveParams = params, readonly way: Path = path) {
    super('earth', fit as Fit, p)
    this.riseEnd.quaternion.copy(this.hold(this.seg.hold.end - this.seg.hold.start).quaternion)
  }

  private handoverTime(kind: 'dive' | 'rise'): number {
    return handoverOf(this.id, kind)!.time
  }

  clock(time: number): number {
    const seg = this.seg.rise
    return time - (seg.end - this.seg.hold.end) * smooth(ramp(this.handoverTime('rise') + this.way.rewind / config.fps, seg.end, time))
  }

  override turn(time: number): THREE.Quaternion {
    return super.turn(this.clock(time))
  }

  override spin(time: number): number {
    return super.spin(this.clock(time))
  }

  override twin(local: Pose, time: number): Pose {
    return twin(this, local, time)
  }

  pace(kind: 'dive' | 'rise', time: number): number {
    const h = 0.25 / config.fps
    const at = (t: number): Pose => this.eye(kind, t, 'orbit')
    return Math.abs(size(at(time + h)) - size(at(time - h))) / (2 * h * config.fps)
  }

  private low(time: number): Pose {
    return this.terrain(time - this.seg.terrain.start)
  }

  private far(kind: 'dive' | 'rise', time: number): Pose {
    return kind === 'dive' ? this.hold(time - this.seg.hold.start) : this.after(time)
  }

  private lawOf(kind: 'dive' | 'rise'): Law {
    const known = this.laws[kind]
    if (known) return known
    const seg = kind === 'dive' ? this.seg.dive! : this.seg.rise
    const fps = config.fps
    const at = this.handoverTime(kind)
    const end = kind === 'dive' ? seg.start : seg.end
    const sign = kind === 'dive' ? -1 : 1
    const h = 0.5 / fps
    const lift = (t: number): number => Math.log((this.far(kind, t).position.length() - 1) / (this.twin(this.low(t), t).position.length() - 1))
    const made = law(Math.abs(end - at) * fps, this.way[kind].ease, this.way[kind].round, lift(end), (sign * (lift(end + h) - lift(end - h))) / (2 * h * fps))
    this.laws[kind] = made
    return made
  }

  private attitude(from: THREE.Quaternion, to: THREE.Quaternion, k: number, bankDeg: number): THREE.Quaternion {
    if (bankDeg === 0) return from.clone().slerp(to, k)
    const rel = from.clone().invert().multiply(to)
    if (rel.w < 0) rel.set(-rel.x, -rel.y, -rel.z, -rel.w)
    const theta = 2 * Math.acos(Math.min(rel.w, 1))
    const sine = Math.sqrt(Math.max(1 - rel.w * rel.w, 0))
    const about = sine > 1e-9 ? rel.z / sine : 0
    const bank = THREE.MathUtils.degToRad(bankDeg)
    const rate = (u: number): number => {
      const roll = bank * Math.PI * Math.sin(2 * Math.PI * u)
      return Math.sqrt(Math.max(theta * theta + roll * roll + 2 * theta * roll * about, 1e-12))
    }
    const length = (u: number): number => {
      const h = u / STEPS
      let sum = 0
      for (let i = 0; i < STEPS; i++) sum += ((rate(i * h) + 4 * rate((i + 0.5) * h) + rate((i + 1) * h)) * h) / 6
      return sum
    }
    const total = length(1)
    let u = k
    for (let i = 0; i < 12; i++) u = Math.min(Math.max(u - (length(u) - k * total) / rate(u), 0), 1)
    return from.clone().slerp(to, u).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), bank * Math.sin(Math.PI * u) ** 2))
  }

  private fly(kind: 'dive' | 'rise', time: number): Pose {
    const leg = this.way[kind]
    const l = this.lawOf(kind)
    const x = Math.min(Math.abs(time - this.handoverTime(kind)) * config.fps, l.frames)
    const anchor = this.twin(this.low(time), time)
    const lift = l.at(x)
    if (lift <= 0) return anchor
    const k = lift / l.total
    const far = this.far(kind, time)
    const axis = forward(anchor.quaternion)
    const b = anchor.position.dot(axis)
    const place = anchor.position.clone().addScaledVector(axis, -b - Math.sqrt(Math.max(b * b - anchor.position.lengthSq() + 1, 0)))
    const height = (anchor.position.length() - 1) * Math.exp(lift)
    const quaternion = this.attitude(anchor.quaternion, far.quaternion, k, leg.bank?.deg ?? 0)
    const seen = place.clone().sub(far.position).normalize().applyQuaternion(far.quaternion.clone().invert())
    const ray = slerpDir(new THREE.Vector3(0, 0, -1), seen, Math.pow(k, leg.hold)).applyQuaternion(quaternion)
    const along = place.dot(ray)
    const position = place.clone().addScaledVector(ray, -along - Math.sqrt(along * along + height * (2 + height)))
    return { position, quaternion, vfov: mix(anchor.vfov, far.vfov, k) }
  }

  private route(kind: 'dive' | 'rise', time: number): Pose {
    const at = this.handoverTime(kind)
    return (kind === 'dive' ? time >= at : time <= at) ? this.twin(this.low(time), time) : this.fly(kind, time)
  }

  override divePose(time: number, view: ViewKind): Pose {
    if (view === 'terrain') return this.low(time)
    return this.route('dive', time)
  }

  override risePose(time: number, view: ViewKind): Pose {
    if (view === 'terrain') return this.low(time)
    return this.route('rise', time)
  }

  private down(kind: 'dive' | 'rise', time: number): Pose {
    const real = kind === 'dive' ? this.divePose(time, 'orbit') : this.risePose(time, 'orbit')
    const anchor = this.twin(this.low(time), time)
    const axis = forward(anchor.quaternion)
    const b = anchor.position.dot(axis)
    const position = anchor.position.clone().addScaledVector(axis, -b - Math.sqrt(Math.max(b * b - anchor.position.lengthSq() + 1, 0))).normalize().multiplyScalar(real.position.length())
    return { position, quaternion: lookAt(position, new THREE.Vector3(), new THREE.Vector3(0, 0, -1).applyQuaternion(anchor.quaternion)), vfov: real.vfov }
  }

  override dive(time: number): OrbitShot {
    if (side() === 'down') return { pose: this.down('dive', time), view: 'orbit' }
    const view = sideAt(this.seg.dive!, time)
    return { pose: this.divePose(time, view), view }
  }

  override rise(time: number): OrbitShot {
    if (side() === 'down') return { pose: this.down('rise', time), view: 'orbit' }
    const view = sideAt(this.seg.rise, time)
    return { pose: this.risePose(time, view), view }
  }
}

export const plan = new Plan()
