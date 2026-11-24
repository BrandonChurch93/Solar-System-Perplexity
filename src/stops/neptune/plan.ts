import * as THREE from 'three'
import { config, type Segment } from '../../config'
import type { Pose, ViewKind } from '../../core/types'
import { handoverOf } from '../../director/handover'
import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
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
  handover: { dive: { at: move.dive.at, picture: false, skyFrames: 0, ...move.one.dive }, rise: { at: move.rise.at, picture: false, skyFrames: 0, ...move.one.rise } },
  spinDegPerSecond: 1.3,
  moonDegPerSecond: 0.3,
  tint: [0.3, 0.5, 1],
}

const deck = new THREE.Vector3().fromArray(close.nadir).multiplyScalar(close.radius + 1)
const onGlobe = new THREE.Quaternion().fromArray(place.toWorld)
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

  // The sky on the globe side by the eye's height, never by the clock (move.json, sky.height): the sky of the hold stays on the Sun while
  // the Sun and the sky are in the frame; between the two heights, where the globe fills the frame but for one corner, it turns to the
  // sky of the close view (dive). The same law holds between two frames of the film and at any rate of capture.
  private skyLow(kind: 'dive' | 'rise', time: number): number {
    const high = this.eye(kind, time, 'orbit').position.length() - 1
    return 1 - smooth(Math.log(Math.max(high, 1e-6) / move.sky.height[1]!) / Math.log(move.sky.height[0]! / move.sky.height[1]!))
  }

  // The share of the close view's sky layer on the globe side: by the same height law when sky.own is set, else the engine's (with
  // skyFrames 0 that one changes in one frame at the change of view).
  override skyShare(seg: Segment, time: number): { low: number } | null {
    return move.sky.own && (seg.kind === 'dive' || seg.kind === 'rise') ? { low: this.skyLow(seg.kind, time) } : null
  }

  // The carry of the sky in the rise, where the sky stays in the frame from the change of view to the travel: the stars turn back from
  // the sky of the close view to the sky of the travel with the eye's own turn, by the angle its line of sight still has to go to the
  // direction the rise ends on (the eye turns one way through the whole rise, about 96 degrees). Past the first share of that turn
  // (move.json sky.back), over which it sets in softly, the stars' turn is in step with the eye's own, so the stars come to rest as
  // the eye does and never go back the other way. Two laws tried and left (assets-src/neptune/NOTES.md, 24 Nov 10:15): by the
  // logarithm of the height the turn was over ten frames before the eye had come to rest, and the stars went back in those frames;
  // by the square of the angle done they ran half as fast again at the judged frame. Nothing here reads the clock.
  private skyBack(time: number): number {
    const ahead = (t: number): THREE.Vector3 => new THREE.Vector3(0, 0, -1).applyQuaternion(this.eye('rise', t, 'orbit').quaternion)
    const end = ahead(this.seg.rise.end)
    const whole = ahead((handoverOf(this.id, 'rise')!.lastFrame + 1) / config.fps).angleTo(end)
    const done = 1 - Math.min(ahead(time).angleTo(end) / whole, 1)
    const soft = move.sky.back
    return 1 - (done < soft ? (done * done) / (2 * soft) : done - soft / 2) / (1 - soft / 2)
  }

  override skyCarryShare(seg: Segment, time: number): number | null {
    return seg.kind === 'dive' ? this.skyLow('dive', time) : seg.kind === 'rise' ? this.skyBack(time) : null
  }

  // The turn of the rise is the carry above (the engine gives no turn of its own to a stop without skyTurnEase).
  override skyTurnShare(seg: Segment, time: number): number | null {
    return seg.kind === 'dive' ? this.skyLow('dive', time) : super.skyTurnShare(seg, time)
  }

  override hold(tRel: number): Pose {
    return this.steadied(super.hold(tRel), 'hold', tRel)
  }

  override terrain(tRel: number): Pose {
    return this.steadied(super.terrain(tRel), 'terrain', tRel)
  }
}

export const plan = new NeptunePlan('neptune', fit as Fit, params)
