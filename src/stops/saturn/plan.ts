import * as THREE from 'three'
import { config } from '../../config'
import type { Pose, ViewKind } from '../../core/types'
import { StopPlan, type Fit, type MoveParams, type OrbitShot } from '../../director/moves'
import { mix, ramp, smooth, smoother } from '../../director/rig'
import close from './close.json'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 7, axis: [-0.2, 1, 0.1], push: -0.03 },
  spot: { x: 0.256, y: 0.856, on: 'rings' },
  dive: { headingDeg: -35, altitude: 0.03, back: 0.1, ahead: 0.3, bow: -0.12, rollDeg: -4 },
  terrain: { vfov: close.vfov, forward: 0.5, rise: -0.12, side: -0.04, yawDeg: -3, pitchDeg: 1.5, entryHeight: 0.72, entryBack: 1.1, entryPitchDeg: 3.6, exitHeight: 1.6, exitForward: 1.5, exitPitchDeg: 6 },
  rise: { azimuthDeg: -14, elevationDeg: 6, distance: 6.6, offset: [-0.28, -0.12], driftSpeed: 0.08, rollDeg: 0 },
  travel: { turnDeg: 88, side: -1, turnEnd: 0.5 },
  arrive: { swingDeg: -23.5, axis: [-0.866, 0.216, -0.027], power: 3, from: 0.35, offset: [-0.25, 0.1] },
  light: { exposure: 1, skyExposure: 0.55, sunRadiusDeg: 0.32, sunGlare: 0.7, flare: 0.1 },
  cover: [0.9, 0.82, 0.66],
  spinDegPerSecond: 1.4,
  moonDegPerSecond: 0.3,
  tint: [0.92, 0.82, 0.6],
  skyAim: { orbit: [34.43338, 66.84025, 41.06902] },
}

export const skim = { azimuthDeg: -2, heightScale: 1, distanceScale: 1, diveBow: 0.35, diveSwitch: 0.5, riseSwitch: 0.45, riseBow: 0, riseEnd: 0.96 }

export class SaturnPlan extends StopPlan {
  readonly ringNormal: THREE.Vector3
  readonly skimPosition: THREE.Vector3
  readonly skimQuaternion: THREE.Quaternion
  readonly skimForward: THREE.Vector3
  readonly skimRight: THREE.Vector3
  private readonly toTerrain: THREE.Quaternion

  constructor(id: string, f: Fit, p: MoveParams) {
    super(id, f, p)
    const n = this.normal.clone()
    this.ringNormal = n
    const sun = this.lightDir.clone()
    const flat = sun.clone().addScaledVector(n, -sun.dot(n)).normalize()
    const out = new THREE.Vector3().crossVectors(n, flat).normalize().applyAxisAngle(n, THREE.MathUtils.degToRad(skim.azimuthDeg))
    const tilt = THREE.MathUtils.degToRad(close.tiltDeg)
    const roll = THREE.MathUtils.degToRad(close.rollDeg)
    const nc = new THREE.Vector3(-Math.sin(roll) * Math.cos(tilt), Math.cos(roll) * Math.cos(tilt), Math.sin(tilt))
    const c = new THREE.Vector3().fromArray(close.centre)
    const height = -c.dot(nc)
    const hc = c.clone().negate().addScaledVector(nc, -height)
    const reach = hc.length()
    hc.normalize()
    const cam = new THREE.Matrix4().makeBasis(nc, hc, new THREE.Vector3().crossVectors(nc, hc))
    const world = new THREE.Matrix4().makeBasis(n, out, new THREE.Vector3().crossVectors(n, out))
    this.skimQuaternion = new THREE.Quaternion().setFromRotationMatrix(world.multiply(cam.transpose()))
    this.skimPosition = out.clone().multiplyScalar(reach * skim.distanceScale).addScaledVector(n, height * skim.heightScale)
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.skimQuaternion)
    this.skimForward = fwd.addScaledVector(n, -fwd.dot(n)).normalize()
    this.skimRight = new THREE.Vector3().crossVectors(this.skimForward, n).normalize()
    this.toTerrain = this.terrainFrame.clone().invert()
  }

  skimAt(time: number): Pose {
    const t = this.p.terrain
    const seg = this.seg.terrain
    const dur = seg.end - seg.start
    const u = (time - seg.start) / dur - 0.5 - config.shutterFraction / (2 * config.fps * dur)
    const position = this.skimPosition.clone().addScaledVector(this.skimForward, t.forward * u).addScaledVector(this.skimRight, t.side * u).addScaledVector(this.ringNormal, t.rise * u)
    const quaternion = new THREE.Quaternion().setFromAxisAngle(this.ringNormal, THREE.MathUtils.degToRad(t.yawDeg) * u).multiply(this.skimQuaternion)
    quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(t.pitchDeg) * u))
    return { position, quaternion, vfov: t.vfov }
  }

  private local(pose: Pose): Pose {
    return { position: pose.position.clone().sub(this.spot).applyQuaternion(this.toTerrain), quaternion: this.toTerrain.clone().multiply(pose.quaternion), vfov: pose.vfov }
  }

  private join(a: Pose, b: Pose, x: number, bow: number): Pose {
    const n = this.ringNormal
    const w = smoother(x)
    const ha = a.position.dot(n)
    const hb = b.position.dot(n)
    const fa = a.position.clone().addScaledVector(n, -ha)
    const fb = b.position.clone().addScaledVector(n, -hb)
    const h = ha > 1e-4 && hb > 1e-4 ? ha * Math.pow(hb / ha, w) : mix(ha, hb, w)
    const chord = fb.clone().sub(fa)
    const side = new THREE.Vector3().crossVectors(n, chord)
    const s = Math.sin(Math.PI * w)
    const position = fa.lerp(fb, w).addScaledVector(side, bow * s * s).addScaledVector(n, h)
    return { position, quaternion: a.quaternion.clone().slerp(b.quaternion, w), vfov: mix(a.vfov, b.vfov, w) }
  }

  override terrain(tRel: number): Pose {
    return this.local(this.skimAt(this.seg.terrain.start + tRel))
  }

  override coverAmount(): number {
    return 0
  }

  override dive(time: number): OrbitShot {
    const seg = this.seg.dive!
    const u = (time - seg.start) / (seg.end - seg.start)
    const pose = this.join(this.hold(time - this.seg.hold.start), this.skimAt(time), u, skim.diveBow)
    return u < skim.diveSwitch ? { pose, view: 'orbit' } : { pose: this.local(pose), view: 'terrain' }
  }

  override rise(time: number): OrbitShot {
    const seg = this.seg.rise
    const u = (time - seg.start) / (seg.end - seg.start)
    const pose = this.join(this.skimAt(time), this.after(time), Math.min(u / skim.riseEnd, 1), skim.riseBow)
    return u < skim.riseSwitch ? { pose: this.local(pose), view: 'terrain' } : { pose, view: 'orbit' }
  }

  patchWeight(time: number, view: ViewKind): number {
    const d = this.seg.dive!
    const r = this.seg.rise
    if (time >= d.start && time < d.end) {
      const u = (time - d.start) / (d.end - d.start)
      return view === 'orbit' ? 1 - smooth(ramp(0, skim.diveSwitch - 0.05, u)) : smooth(ramp(skim.diveSwitch + 0.05, 1, u))
    }
    if (time >= r.start && time < r.end && view === 'terrain') return 1 - smooth(ramp(0, skim.riseSwitch - 0.05, (time - r.start) / (r.end - r.start)))
    return 1
  }
}

export const plan = new SaturnPlan('saturn', fit as Fit, params)
