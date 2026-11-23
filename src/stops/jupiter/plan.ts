import * as THREE from 'three'
import { config } from '../../config'
import type { Pose, ViewKind } from '../../core/types'
import { handoverOf, type HandoverParams } from '../../director/handover'
import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import { lookAt, smooth } from '../../director/rig'
import deck from './deck.json'
import fields from './deck-fields.json'
import fit from './fit.json'
import place from './place.json'
import relief from './relief.json'

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
  handover: place.handover as HandoverParams,
  spinDegPerSecond: 1.6,
  moonDegPerSecond: 2.6,
  tint: [0.9, 0.75, 0.55],
}

const up0 = new THREE.Vector3().fromArray(relief.nadir).negate()
const centre = up0.clone().multiplyScalar(-(relief.radius + 1))
const ahead0 = new THREE.Vector3().fromArray(fields.chart.ey).addScaledVector(up0, -new THREE.Vector3().fromArray(fields.chart.ey).dot(up0)).normalize()
const chartOrigin = new THREE.Vector3().fromArray(fields.chart.origin)
const vortexLow = Math.sqrt(relief.radius * relief.radius - place.vortex[0]! * place.vortex[0]! - place.vortex[1]! * place.vortex[1]!) - relief.radius
const vortex = chartOrigin.clone().addScaledVector(new THREE.Vector3().fromArray(fields.chart.ex), place.vortex[0]!).addScaledVector(new THREE.Vector3().fromArray(fields.chart.ey), place.vortex[1]!).addScaledVector(new THREE.Vector3().fromArray(fields.chart.en), vortexLow)
const s = place.solved.toSurface as number[][]
const toSurface = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().set(s[0]![0]!, s[0]![1]!, s[0]![2]!, 0, s[1]![0]!, s[1]![1]!, s[1]![2]!, 0, s[2]![0]!, s[2]![1]!, s[2]![2]!, 0, 0, 0, 0, 1))
const toGlobe = new THREE.Quaternion().fromArray(fit.globe.quaternion).multiply(toSurface)

export function flight(seconds: number, vfov: number, back = 0, lift = 0): Pose {
  const f = deck.flight
  const gain = f.endUnitsPerSecond - f.startUnitsPerSecond
  const run = (u: number): number => f.seconds * (f.startUnitsPerSecond * u + gain * Math.pow(Math.max(u, 0), f.power + 1) / (f.power + 1))
  const along = run(seconds / f.seconds + 0.5) - run(0.5)
  const behind = Math.max(-along, 0) / run(0.5)
  const high = relief.radius + 1 + f.startAbove * Math.pow(behind, f.sinkPower) + lift
  const up = up0.clone().multiplyScalar(relief.radius + 1).addScaledVector(ahead0, along - back).normalize()
  const position = centre.clone().addScaledVector(up, high)
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up0, up)
  return { position, quaternion, vfov }
}

export function exposure(seconds: number): number {
  const f = deck.flight
  return Math.pow(2, f.exposureStops * smooth((seconds / f.seconds + 0.5 - f.exposureFrom) / (1 - f.exposureFrom)))
}

function hermite(x: number, from: number, to: number, slopeFrom: number, slopeTo: number): number {
  const x2 = x * x
  const x3 = x2 * x
  return (2 * x3 - 3 * x2 + 1) * from + (x3 - 2 * x2 + x) * slopeFrom + (-2 * x3 + 3 * x2) * to + (x3 - x2) * slopeTo
}

export class JupiterPlan extends StopPlan {
  private readonly holds: Partial<Record<'dive' | 'rise', THREE.Quaternion>> = {}

  override spin(time: number): number {
    const dive = this.seg.dive!
    const land = this.seg.terrain
    const rise = this.seg.rise
    if (time <= dive.start || time >= rise.end) return super.spin(time)
    const rate = THREE.MathUtils.degToRad(this.p.spinDegPerSecond)
    const still = super.spin((land.start + land.end) / 2)
    if (time < land.start) return hermite((time - dive.start) / (land.start - dive.start), super.spin(dive.start), still, rate * (land.start - dive.start), 0)
    if (time > land.end) return hermite((time - land.end) / (rise.end - land.end), still, super.spin(rise.end), 0, rate * (rise.end - land.end))
    return still
  }

  override turn(time: number): THREE.Quaternion {
    return new THREE.Quaternion().setFromAxisAngle(this.axis, this.spin(time))
  }

  override terrain(tRel: number): Pose {
    const dur = this.seg.terrain.end - this.seg.terrain.start
    return flight(tRel - dur / 2 - config.shutterFraction / (2 * config.fps), this.p.terrain.vfov)
  }

  private close(kind: 'dive' | 'rise', time: number): Pose {
    const land = this.seg.terrain
    const dur = land.end - land.start
    const k = place.approach[kind]
    const out = kind === 'dive' ? land.start - time : time - land.end
    const at = (t: number, more: number): Pose => flight(t - land.start - dur / 2 - config.shutterFraction / (2 * config.fps), this.p.terrain.vfov, k.back * more, k.height * more)
    if (out <= 0) return at(time, 0)
    const pose = at(time, Math.pow(out / k.seconds, k.power))
    const aim = (p: Pose): THREE.Quaternion => lookAt(p.position, vortex, p.position.clone().sub(centre).normalize())
    let hold = this.holds[kind]
    if (!hold) {
      const edge = at(kind === 'dive' ? land.start : land.end, 0)
      hold = aim(edge).invert().multiply(edge.quaternion)
      this.holds[kind] = hold
    }
    pose.quaternion.slerp(aim(pose).multiply(hold), smooth(out / k.track))
    return pose
  }

  override twin(local: Pose, time: number): Pose {
    const q = this.turn(time).multiply(toGlobe)
    return { position: local.position.clone().sub(centre).multiplyScalar(1 / relief.radius).applyQuaternion(q), quaternion: q.clone().multiply(local.quaternion), vfov: local.vfov }
  }

  override divePose(time: number, view: ViewKind): Pose {
    if (view === 'terrain') return this.close('dive', time)
    const h = handoverOf(this.id, 'dive')
    if (h && time >= h.time) return this.twin(this.close('dive', time), time)
    return super.divePose(time, view)
  }

  override risePose(time: number, view: ViewKind): Pose {
    if (view === 'terrain') return this.close('rise', time)
    return super.risePose(time, view)
  }
}

export const plan: StopPlan = new JupiterPlan('jupiter', fit as Fit, params)
