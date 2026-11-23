import * as THREE from 'three'
import { config, type Segment } from '../../config'
import type { CoverHorizon, Pose } from '../../core/types'
import { StopPlan, type Fit, type MoveParams, type OrbitShot } from '../../director/moves'
import { drift, lookAt } from '../../director/rig'
import close from './close.json'
import fit from './fit.json'
import move from './move.json'
import place from './place.json'

export const params: MoveParams = {
  hold: { orbitDeg: 7, axis: [-0.25, 1, 0], push: -0.035 },
  spot: { x: 0.55, y: 0.52 },
  dive: { headingDeg: -70, altitude: 0.0331, back: 0.07, ahead: 0.14, bow: -0.22, rollDeg: -5, swoop: true, level: 0.5, surge: { glide: 0.14, rise: 60, fall: 2, swell: [0.3, 9, 1.2] } },
  terrain: { vfov: 30, forward: 0.42, rise: 0.33, side: -0.6, yawDeg: -5, pitchDeg: 0.6, entryHeight: 0.6, entryBack: 1.4, entryPitchDeg: 3, exitHeight: 0.45, exitForward: -2.6, exitPitchDeg: 0, exitDipDeg: 3.35, horizonDeg: 8.22, dipDeg: 12.41, rollDeg: 9.54 },
  rise: { azimuthDeg: -26, elevationDeg: 17.5, distance: 5.2, offset: [-0.3, 0.1], driftSpeed: 0.1, rollDeg: 4, ahead: 0, hug: 1.2, settle: 5, gentle: true, level: true, pan: 0.3, from: 0.3 },
  travel: { turnDeg: 0, side: 1 },
  arrive: { swingDeg: 0, axis: [0.1, 1, 0.2], from: 0.25, offset: [0.5, 0.2] },
  light: { exposure: 1, skyExposure: 0.65, sunRadiusDeg: 0.14, sunGlare: 0.6, flare: 0 },
  skyAim: { orbit: [25.78793, 56.89437, -50.63077], terrain: [180, -12, 40] },
  cover: [0.27, 0.43, 0.8],
  coverLow: [0.03, 0.075, 0.22],
  coverTerrain: [0.4, 0.56, 0.85],
  coverLowTerrain: [0.03, 0.065, 0.19],
  coverTop: [0.3, 0.06],
  coverEdge: [0.48, 0.5],
  coverEdgeRise: [0.4, 0.5],
  coverShell: [1.005, 1.03],
  coverWindow: { dive: { seconds: 1, center: 0.7 } },
  coverRush: { speed: 2.4, reach: 2.5, billow: [2.2, 0.9, 1], streak: [9, 2.2, 1.6], contrast: [0.6, 0.45] },
  spinDegPerSecond: 1.3,
  moonDegPerSecond: 0.3,
  tint: [0.3, 0.5, 1],
}

const veil: { air: [number, number]; sea: [number, number]; clear: number; full: number } = { air: [1.005, 1.03], sea: [1.002, 1.012], clear: 0.15, full: 0.93 }
const deck = new THREE.Vector3().fromArray(close.nadir).multiplyScalar(close.radius + 1)
const onGlobe = new THREE.Quaternion().fromArray(place.toWorld)
const offGlobe = onGlobe.clone().invert()
const eye = new THREE.Vector3().fromArray(place.storm.atSpinZero).normalize()
const eyeEast = new THREE.Vector3(0, 1, 0).cross(eye).normalize()
const eyeNorth = eye.clone().cross(eyeEast)
const rim: [number, number][] = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]
const hides = 0.4
const closed = 0.98
const emerge = 1
export const steady = { hold: 0.5, terrain: 1 }
const smooth = (x: number): number => {
  const t = Math.min(Math.max(x, 0), 1)
  return t * t * (3 - 2 * t)
}
const part = (x: number): number => {
  const t = Math.min(Math.max(x, 0), 1)
  return t * t * t - 0.5 * t * t * t * t
}
const paced = (u: number, rampIn: number, rampOut: number): number => {
  const x = Math.min(Math.max(u, 0), 1)
  const top = 1 / (1 - 0.5 * (rampIn + rampOut))
  if (x < rampIn) return top * rampIn * part(x / rampIn)
  if (x <= 1 - rampOut) return top * (0.5 * rampIn + x - rampIn)
  return 1 - top * rampOut * part((1 - x) / rampOut)
}
const wrapped = (a: number): number => a - 2 * Math.PI * Math.round(a / (2 * Math.PI))

interface About { height: number; arc: number; azimuth: number; turn: THREE.Quaternion; field: number }

function about(pose: Pose): About {
  const under = pose.position.clone().normalize()
  return {
    height: Math.log(pose.position.length() - 1),
    arc: under.angleTo(eye),
    azimuth: Math.atan2(under.dot(eyeEast), under.dot(eyeNorth)),
    turn: lookAt(pose.position, eye, eye).invert().multiply(pose.quaternion),
    field: Math.log(Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)),
  }
}

function posed(a: About): Pose {
  const flat = eyeEast.clone().multiplyScalar(Math.sin(a.azimuth)).addScaledVector(eyeNorth, Math.cos(a.azimuth))
  const position = eye.clone().multiplyScalar(Math.cos(a.arc)).addScaledVector(flat, Math.sin(a.arc)).multiplyScalar(1 + Math.exp(a.height))
  return { position, quaternion: lookAt(position, eye, eye).multiply(a.turn), vfov: THREE.MathUtils.radToDeg(2 * Math.atan(Math.exp(a.field))) }
}

class NeptunePlan extends StopPlan {
  private amount = 0

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

  private still(pose: Pose, time: number): Pose {
    const back = this.turn(time).invert()
    return { position: pose.position.clone().applyQuaternion(back), quaternion: back.multiply(pose.quaternion), vfov: pose.vfov }
  }

  private spun(pose: Pose, time: number): Pose {
    const q = this.turn(time)
    return { position: pose.position.clone().applyQuaternion(q), quaternion: q.multiply(pose.quaternion), vfov: pose.vfov }
  }

  private fromClose(local: Pose): Pose {
    return { position: local.position.clone().sub(deck).divideScalar(close.radius).applyQuaternion(onGlobe), quaternion: onGlobe.clone().multiply(local.quaternion), vfov: local.vfov }
  }

  private toClose(pose: Pose): Pose {
    return { position: pose.position.clone().applyQuaternion(offGlobe).multiplyScalar(close.radius).add(deck), quaternion: offGlobe.clone().multiply(pose.quaternion), vfov: pose.vfov }
  }

  private holdTrack(time: number): Pose {
    return this.still(super.hold(time - this.seg.hold.start), time)
  }

  private closeTrack(time: number): Pose {
    return this.fromClose(super.terrain(time - this.seg.terrain.start))
  }

  private exitTrack(time: number): Pose {
    return this.still(this.exitPose(time), time)
  }

  private flown(kind: 'dive' | 'rise', time: number): Pose {
    const seg = kind === 'dive' ? this.seg.dive! : this.seg.rise
    const m = move[kind]
    const w = paced((time - seg.start) / (seg.end - seg.start), m.rampIn, m.rampOut)
    const a = about(kind === 'dive' ? this.holdTrack(time) : this.closeTrack(time))
    const b = about(kind === 'dive' ? this.closeTrack(time) : this.exitTrack(time))
    return posed({
      height: a.height + (b.height - a.height) * w,
      arc: a.arc + (b.arc - a.arc) * w,
      azimuth: a.azimuth + wrapped(b.azimuth - a.azimuth) * w,
      turn: a.turn.clone().slerp(b.turn, w),
      field: a.field + (b.field - a.field) * w,
    })
  }

  private sideOf(kind: 'dive' | 'rise', time: number): 'orbit' | 'terrain' {
    const seg = kind === 'dive' ? this.seg.dive! : this.seg.rise
    const low = time >= seg.start + move[kind].at * (seg.end - seg.start)
    return (kind === 'dive') === low ? 'terrain' : 'orbit'
  }

  twin(local: Pose, time: number): Pose {
    return this.spun(this.fromClose(local), time)
  }

  diveAt(time: number, view: 'orbit' | 'terrain'): Pose {
    const pose = this.flown('dive', time)
    return view === 'orbit' ? this.spun(pose, time) : this.toClose(pose)
  }

  riseAt(time: number, view: 'orbit' | 'terrain'): Pose {
    const pose = this.flown('rise', time)
    return view === 'orbit' ? this.spun(pose, time) : this.toClose(pose)
  }

  override hold(tRel: number): Pose {
    return this.steadied(super.hold(tRel), 'hold', tRel)
  }

  override terrain(tRel: number): Pose {
    return this.steadied(super.terrain(tRel), 'terrain', tRel)
  }

  override dive(time: number): OrbitShot {
    const view = this.sideOf('dive', time)
    return { pose: this.diveAt(time, view), view }
  }

  override rise(time: number): OrbitShot {
    const view = this.sideOf('rise', time)
    return { pose: this.riseAt(time, view), view }
  }

  override coverAmount(seg: Segment, time: number): number {
    const amount = super.coverAmount(seg, time)
    this.amount = amount
    this.p.coverHides = amount < closed ? hides : undefined
    return amount
  }

  override skyUnderCover(amount: number, time: number): number {
    const seg = this.seg.dive
    if (!seg || time < this.coverCenter(seg) || time >= seg.end) return super.skyUnderCover(amount, time)
    return Math.pow(1 - amount, emerge)
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
    const base = super.horizon(view, local)
    if (view === 'orbit') {
      this.p.coverShell = edge
      return base
    }
    this.p.coverSea = { centre: [deck.x, deck.y, deck.z], radius: close.radius, edge }
    const nadir = c.clone().normalize()
    const flat = Math.hypot(nadir.x, nadir.y)
    const gap = Math.acos(Math.min(Math.max(-nadir.z, -1), 1)) - Math.asin(Math.min(1 / c.length(), 1))
    return { normal: flat > 1e-5 ? [-nadir.x / flat, -nadir.y / flat] : [0, 1], offset: Math.tan(Math.min(Math.max(gap, -1.4), 1.4)), soft: base.soft }
  }
}

export const plan = new NeptunePlan('neptune', fit as Fit, params)
