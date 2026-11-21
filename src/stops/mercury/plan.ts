import * as THREE from 'three'
import { config } from '../../config'
import { ramp, smoother } from '../../director/rig'
import { StopPlan, type Fit, type MoveParams, type OrbitShot } from '../../director/moves'
import fit from './fit.json'
import { spinRest } from './look'

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

export const launch = { frames: 30, start: 0.1 }
export const meet = { dive: { forward: 0.01448, frames: 30 }, rise: { frames: 26 } }

export class Plan extends StopPlan {
  constructor(p: MoveParams = params, private readonly tune = meet) {
    super('mercury', fit as Fit, p)
  }

  override dive(time: number): OrbitShot {
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

  override rise(time: number): OrbitShot {
    const from = this.coverCenter(this.seg.rise)
    if (time < from) return super.rise(time)
    const span = launch.frames / config.fps
    const t = (time - from) / span
    const at = t >= 1 ? time : from + span * ((launch.start - 1) * t * t * t + (2 - 2 * launch.start) * t * t + launch.start * t)
    const shot = super.rise(at)
    const lag = (time - spinRest * (from - this.coverCenter(this.seg.dive!)) - at) * (1 - smoother(ramp(from, from + this.tune.rise.frames / config.fps, time)))
    if (lag === 0 || shot.view !== 'orbit') return shot
    const q = this.turn(at + lag).multiply(this.turn(at).invert())
    return { pose: { position: shot.pose.position.clone().applyQuaternion(q), quaternion: q.multiply(shot.pose.quaternion), vfov: shot.pose.vfov }, view: 'orbit' }
  }
}

export const plan = new Plan()
