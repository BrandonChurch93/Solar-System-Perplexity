import * as THREE from 'three'
import { config } from '../../config'
import { ramp, smoother } from '../../director/rig'
import { StopPlan, type Fit, type MoveParams, type OrbitShot } from '../../director/moves'
import { anchor, closeRadius, type Anchor } from './close'
import fit from './fit.json'
import { close, spinRest } from './look'

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
  skyAim: { orbit: [77.38414, 172.96308, -53.87859], terrain: [12.8819, -127.45635, -55] },
  spinDegPerSecond: 0.6,
  moonDegPerSecond: 0,
  tint: [0.62, 0.56, 0.5],
}

export const launch = { frames: 30, start: 0.1, ease: [8, 0.019] as [number, number] }
export const meet = { dive: { forward: 0.01448, frames: 30 }, rise: { frames: 26 } }

interface Fix { position: THREE.Vector3; quaternion: THREE.Quaternion; turn: THREE.Quaternion }

export class Plan extends StopPlan {
  private anchored: Anchor | null = null
  private readonly fixes: { dive?: Fix; rise?: Fix } = {}

  constructor(p: MoveParams = params, private readonly tune = meet, private readonly near = close) {
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
    const high = (side === 'dive' ? this.diveBase(centre - 1e-6) : this.riseBase(centre)).pose
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

  private diveBase(time: number): OrbitShot {
    const shot = super.dive(time)
    if (shot.view !== 'orbit') return shot
    const centre = this.coverCenter(this.seg.dive!)
    const w = smoother(ramp(centre - this.tune.dive.frames / config.fps, centre, time))
    if (w <= 0 || this.tune.dive.forward === 0) return shot
    const out = shot.pose.position.clone().normalize()
    const axis = new THREE.Vector3().crossVectors(out, new THREE.Vector3(0, 0, -1).applyQuaternion(shot.pose.quaternion)).normalize()
    const q = new THREE.Quaternion().setFromAxisAngle(axis, this.tune.dive.forward * w)
    return { pose: { position: shot.pose.position.clone().applyQuaternion(q), quaternion: q.multiply(shot.pose.quaternion), vfov: shot.pose.vfov }, view: 'orbit' }
  }

  private riseBase(time: number): OrbitShot {
    const from = this.coverCenter(this.seg.rise)
    if (time < from) return super.rise(time)
    const span = launch.frames / config.fps
    const t = (time - from) / span
    const soft = launch.ease[0] / launch.frames
    const slow = launch.start - launch.ease[1]
    const held = t < soft ? (slow * t + (2 - 2 * launch.start + (3 * slow) / soft) * t * t) * Math.pow(1 - t / soft, 3) : 0
    const at = t >= 1 ? time : from + span * ((launch.start - 1) * t * t * t + (2 - 2 * launch.start) * t * t + launch.start * t - held)
    const shot = super.rise(at)
    const lag = (time - spinRest * (from - this.coverCenter(this.seg.dive!)) - at) * (1 - smoother(ramp(from, from + this.tune.rise.frames / config.fps, time)))
    if (lag === 0 || shot.view !== 'orbit') return shot
    const q = this.turn(at + lag).multiply(this.turn(at).invert())
    return { pose: { position: shot.pose.position.clone().applyQuaternion(q), quaternion: q.multiply(shot.pose.quaternion), vfov: shot.pose.vfov }, view: 'orbit' }
  }

  override dive(time: number): OrbitShot {
    const centre = this.coverCenter(this.seg.dive!)
    return this.meetAt('dive', this.diveBase(time), time, smoother(ramp(centre - this.near.frames[0] / config.fps, centre, time)))
  }

  override rise(time: number): OrbitShot {
    const centre = this.coverCenter(this.seg.rise)
    return this.meetAt('rise', this.riseBase(time), time, 1 - smoother(ramp(centre, centre + this.near.frames[1] / config.fps, time)))
  }
}

export const plan = new Plan()
