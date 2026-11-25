import * as THREE from 'three'
import { config } from '../../config'
import type { Segment } from '../../config'
import { airAt } from '../../core/air'
import type { AirKnot, Pose, ViewKind } from '../../core/types'
import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import { drift, lookAt } from '../../director/rig'
import close from './close.json'
import fit from './fit.json'
import { triton } from './look'
import move from './move.json'
import { placeTurn } from './band'
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
  skyAim: { orbit: [-0.35387, -37.48986, 26.30965], terrain: [-111.84232, 28.36898, 9.4633] },
  cover: [0.27, 0.43, 0.8],
  handover: { dive: { at: move.dive.at, picture: false, skyFrames: 0, ...move.one.dive }, rise: { at: move.rise.at, picture: false, skyFrames: 0, ...move.one.rise } },
  spinDegPerSecond: 1.3,
  moonDegPerSecond: 0.3,
  tint: [0.3, 0.5, 1],
}

// THE LOW SKY'S KNOTS (sky_builder's patch, MAIL 1099 and MAIL 1112 point 3): the sky's level and the share of its turn by the height
// of the eye over the body, in radii, from the highest down: 0.65 (the hold's own level, light.skyExposure) at and above 2 radii, 0.27 at
// and under 0.03 radii, between them on the one air's own curve over the logarithm of the height (airAt, src/core/air.ts). The hold
// flies at 2.07 to 2.18 radii and keeps 0.65; the surface view flies at 0.0232 to 0.0247 and holds 0.27. Never the clock.
// They stand here and are read through airAt by skyTurnShare and skyGain below, not as params.air: nothing in the engine reads the
// air of a shot yet, and tests/air.test.ts asserts that no stop of the film names one ("is absent on every shot of the film as long
// as no stop names an air"), so the patch as written turned that unit red on the merge of main aed412aeb (25 Nov, 15:03 UTC). The
// first knot is made whole from the stop's light exactly as StopPlan.air makes it, so the numbers and the bytes are the same. When
// the engine's air law reads air.sky these knots go to params.air and the skyGain override below goes (MAIL 1112 point 3).
const light = params.light
export const lowSky: AirKnot[] = [
  { exposure: light.exposure, sky: light.skyExposure, stars: 1, sunRadius: light.sunRadiusDeg, glare: light.sunGlare, height: 2 },
  { height: 0.03, sky: 0.27 },
]
const deck = new THREE.Vector3().fromArray(close.nadir).multiplyScalar(close.radius + 1)
// The scene's frame on the globe: where the fit put it (place.json), turned to where the place stands (move.json, place; band.ts).
const onGlobe = new THREE.Quaternion().fromArray(place.toWorld).multiply(placeTurn)
const offGlobe = onGlobe.clone().invert()
const eye = new THREE.Vector3().fromArray(place.storm.atSpinZero).normalize()
const eyeEast = new THREE.Vector3(0, 1, 0).cross(eye).normalize()
const eyeNorth = eye.clone().cross(eyeEast)
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
  // One sky for both views. The close view's set stands on the globe in the frame its scene is laid in (onGlobe), not in the frame the
  // engine makes from the spot and the heading, which stood 78.669 degrees from it: with that one the same eye had two different skies
  // on the two sides of the change of view, and the stars were turned from one to the other. The scene itself reads this frame nowhere
  // (its eye is the set's own, its Sun comes by laid()). The turn of the sky is one too: skyAim.orbit above is solved so that this
  // stop's turn is the ending's own, and nothing turns the stars in the dive, the surface view or the rise but the eye.
  override readonly terrainFrame: THREE.Quaternion = onGlobe.clone()

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
      arc: a.arc + (b.arc - a.arc) * Math.pow(w, m.arc),
      azimuth: a.azimuth + wrapped(b.azimuth - a.azimuth) * w,
      turn: a.turn.clone().slerp(b.turn, w),
      field: a.field + (b.field - a.field) * w,
    })
  }

  override skyTurnShare(seg: Segment, time: number): number | null {
    if (seg.kind !== 'dive' && seg.kind !== 'rise') return super.skyTurnShare(seg, time)
    return smooth(airAt(lowSky, this.eyeHeight(time), this.id)!.share)
  }

  override skyGain(time: number): number {
    if (time < this.seg.hold.start || time >= this.seg.rise.end) return 1
    return airAt(lowSky, this.eyeHeight(time), this.id)!.sky / this.p.light.skyExposure
  }

  drawnBodies(view: ViewKind, _eye: THREE.Vector3, time: number): { id: string; place: number[]; turn: number[]; reach: number }[] {
    if (view !== 'orbit') return []
    const e = time - this.holdMid
    const land = this.seg.terrain
    const rate = THREE.MathUtils.degToRad(this.p.moonDegPerSecond)
    const up = new THREE.Vector3().fromArray(triton.up).normalize()
    const home = time < (land.start + land.end) / 2 ? new THREE.Vector3().fromArray(fit.moons[0]!.position) : new THREE.Vector3().fromArray(triton.stage).applyAxisAngle(this.axis, -rate * (this.seg.rise.end - this.holdMid))
    const turn = new THREE.Quaternion().setFromAxisAngle(up, THREE.MathUtils.degToRad(triton.spinDegPerSecond) * e).multiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up))
    return [{ id: 'triton', place: home.applyAxisAngle(this.axis, rate * e).toArray(), turn: turn.toArray(), reach: fit.moons[0]!.radius }]
  }

  twin(local: Pose, time: number): Pose {
    return this.spun(this.fromClose(local), time)
  }

  laid(time: number): THREE.Quaternion {
    return this.turn(time).multiply(onGlobe)
  }

  override divePose(time: number, view: ViewKind): Pose {
    const pose = this.flown('dive', time)
    return view === 'orbit' ? this.spun(pose, time) : this.toClose(pose)
  }

  override risePose(time: number, view: ViewKind): Pose {
    const pose = this.flown('rise', time)
    return view === 'orbit' ? this.spun(pose, time) : this.toClose(pose)
  }

  override hold(tRel: number): Pose {
    return this.steadied(super.hold(tRel), 'hold', tRel)
  }

  override terrain(tRel: number): Pose {
    return this.steadied(super.terrain(tRel), 'terrain', tRel)
  }
}

export const plan = new NeptunePlan('neptune', fit as Fit, params)
