import * as THREE from 'three'
import type { Pose } from '../../core/types'
import { StopPlan, type Fit, type MoveParams, type OrbitShot } from '../../director/moves'
import { lookAt, mix, ramp, smooth } from '../../director/rig'
import { coverWindow } from '../../director/timeline'
import fit from './fit.json'

export const climbOut = { bankDeg: -32, bankLead: 1.0, bankPower: 2.2, climb: 5, turn: 12, lens: 4 }
export const glide = { bankDeg: 7, lead: 0.8, arc: 1.0, swingDeg: 20 }

export const params: MoveParams = {
  hold: { orbitDeg: 3, axis: [0.25, 1, 0], push: -0.03 },
  spot: { x: 0.405, y: 0.605 },
  dive: { headingDeg: 80, altitude: 0.045, back: 0.08, ahead: 0.15, bow: 0.24, rollDeg: 4, swoop: true, surge: { glide: 0.1, rise: 8, fall: 0.8 } },
  terrain: { vfov: 64, horizonDeg: 17.72, dipDeg: 4.44, rollDeg: 17.09, gather: -0.1, forward: 1.0, rise: 0.22, side: -1.0, yawDeg: -5, pitchDeg: -5, entryHeight: 0.5, entryBack: 0.1, entryPitchDeg: 6, exitHeight: 2.5, exitForward: -0.15, exitPitchDeg: 9 },
  rise: { azimuthDeg: 44, elevationDeg: -12, distance: 5.6, offset: [0.34, 0.1], driftSpeed: 0.08, rollDeg: -6, ahead: 0.03, hug: 1.7, settle: 2, tilt: 0.5 },
  travel: { turnDeg: 74, side: 1 },
  arrive: { swingDeg: 46, axis: [0.2, 1, 0], power: 2.9, offset: [0.7, -0.15] },
  skyAim: { terrain: [0, -21.8, 31] },
  light: { exposure: 1, skyExposure: 0.5, terrainSkyGlow: 0.35, skyLow: [0.045, 1.0, 0], sunRadiusDeg: 0.5, sunGlare: 0.75, flare: 0.18 },
  cover: [0.42, 0.34, 0.26],
  coverLow: [0.3, 0.235, 0.17],
  coverTerrain: [0.21, 0.177, 0.14],
  coverLowTerrain: [0.205, 0.173, 0.138],
  coverTop: [0, 0],
  coverEdge: [0.5, 0.5],
  coverEdgeRise: [0.5, 0.5],
  coverShell: [1.0, 1.015],
  coverSea: { centre: [-90.618901, -294.74045, -125.576803], radius: 331.946319, edge: [0.955, 0.972] },
  coverRush: { speed: 2.4, reach: 2.5, billow: [2.2, 0.9, 1], streak: [9, 2.2, 1.6], contrast: [1.4, 0.8] },
  spinDegPerSecond: 1.6,
  moonDegPerSecond: 2.6,
  tint: [0.9, 0.75, 0.55],
}

const Z = new THREE.Vector3(0, 0, 1)
const Y = new THREE.Vector3(0, 1, 0)

export class JupiterPlan extends StopPlan {
  override turn(time: number): THREE.Quaternion {
    const low = time >= this.coverCenter(this.seg.dive!) && time < this.coverCenter(this.seg.rise)
    return super.turn(low ? (this.seg.terrain.start + this.seg.terrain.end) / 2 : time)
  }

  private lean(time: number): number {
    return glide.bankDeg * super.terrain(time - this.seg.terrain.start).position.z / -this.p.terrain.forward
  }

  override terrain(tRel: number): Pose {
    const pose = super.terrain(tRel)
    const u = pose.position.z / -this.p.terrain.forward
    pose.position.x += glide.arc * u * u
    const t = this.p.terrain
    const tilt = THREE.MathUtils.degToRad((t.horizonDeg ?? 0) + (t.dipDeg ?? 0))
    const axis = new THREE.Vector3(0, Math.cos(tilt), Math.sin(tilt)).applyAxisAngle(Z, -THREE.MathUtils.degToRad(t.rollDeg ?? 0))
    pose.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(glide.swingDeg) * Math.max(u, 0) ** 2))
    pose.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(Z, THREE.MathUtils.degToRad(this.lean(tRel + this.seg.terrain.start))))
    return pose
  }

  override dive(time: number): OrbitShot {
    const shot = super.dive(time)
    const c = this.coverCenter(this.seg.dive!)
    if (time >= c) return shot
    const lean = THREE.MathUtils.degToRad(this.lean(c))
    const entry = this.terrain(c - this.seg.terrain.start).quaternion.invert().multiply(super.dive(c).pose.quaternion)
    const roll = new THREE.Quaternion().setFromAxisAngle(Z, lean * smooth(ramp(c - glide.lead, c, time)))
    shot.pose.quaternion.multiply(entry.clone().invert()).multiply(roll).multiply(entry)
    return shot
  }

  override rise(time: number): OrbitShot {
    const seg = this.seg.rise
    const c = this.coverCenter(seg)
    const k = climbOut
    const bank = THREE.MathUtils.degToRad(k.bankDeg)
    if (time < c) {
      const shot = super.rise(time)
      shot.pose.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(Z, bank * Math.pow(ramp(c - k.bankLead, c, time), k.bankPower)))
      return shot
    }
    const t = this.p.terrain
    const r = this.p.rise
    const x = ramp(c, seg.end, time)
    const e = 1 - Math.pow(1 - x, k.climb)
    const end = this.after(time)
    const tq = this.turn(time)
    const spot = this.spot.clone().applyQuaternion(tq)
    const normal = this.normal.clone().applyQuaternion(tq)
    const heading = this.heading.clone().applyQuaternion(tq)
    const low = r.from ?? this.p.dive.altitude
    const from = spot.clone().addScaledVector(normal, low).addScaledVector(heading, r.ahead ?? this.p.dive.ahead)
    const span = end.position.clone().sub(from)
    const ratio = span.length() / low
    const m = (Math.pow(ratio, e) - 1) / (ratio - 1)
    const up1 = span.dot(normal)
    const across = span.clone().addScaledVector(normal, -up1)
    const position = from.clone().addScaledVector(normal, up1 * m).addScaledVector(across, Math.pow(m, r.hug ?? 1))
    const w = coverWindow(seg)!
    const carried = (t.horizonDeg ?? 0) - t.exitPitchDeg * Math.pow(ramp(0, w.lastFrame + 1 - seg.firstFrame, w.centerFrame - seg.firstFrame), 2.2) - (t.exitDipDeg ?? 0)
    const out = position.clone().normalize()
    const level = heading.clone().addScaledVector(out, -heading.dot(out)).normalize()
    const pitch = Math.acos(Math.min(1 / position.length(), 1)) + THREE.MathUtils.degToRad(carried)
    const aim = level.clone().multiplyScalar(Math.cos(pitch)).addScaledVector(out, -Math.sin(pitch))
    const low0 = lookAt(position, position.clone().add(aim), out.clone().add(level).normalize(), (t.rollDeg ?? 0) + this.lean(c) + k.bankDeg)
    const target = end.position.clone().addScaledVector(new THREE.Vector3(0, 0, -1).applyQuaternion(end.quaternion), end.position.length())
    const high = lookAt(position, target, Y.clone().applyQuaternion(end.quaternion))
    return { pose: { position, quaternion: low0.slerp(high, 1 - Math.pow(1 - x, k.turn)), vfov: mix(t.vfov, end.vfov, smooth(1 - Math.pow(1 - x, k.lens))) }, view: 'orbit' }
  }
}

export const plan: StopPlan = new JupiterPlan('jupiter', fit as Fit, params)
