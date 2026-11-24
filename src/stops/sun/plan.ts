import * as THREE from 'three'
import { config } from '../../config'
import type { Pose, ViewKind } from '../../core/types'
import { StopPlan, type Fit, type MoveParams } from '../../director/moves'
import { handoverOf } from '../../director/handover'
import { coverFrames } from '../../director/timeline'
import { lookAt, mix, slerpDir, smooth } from '../../director/rig'
import fit from './fit.json'
import place from './place.json'
import { stage } from './stage'

export const params: MoveParams = {
  hold: { orbitDeg: 6, axis: [0, 1, 0], push: 0 },
  spot: { x: 0.57, y: 0.39 },
  dive: { headingDeg: 0, altitude: 0.7, back: 0.05, ahead: 0.12, bow: 0.15, rollDeg: 0 },
  terrain: { vfov: 55, gather: -0.5, forward: 2.0, rise: -0.1, side: 0.7, yawDeg: 8, pitchDeg: 8, horizonDeg: 3.2, dipDeg: 17.5, entryHeight: 0.9, entryBack: 1.1, entryPitchDeg: 4.8, exitHeight: 1.6, exitForward: -0.6, exitPitchDeg: -12, ground: 0.6 },
  rise: { azimuthDeg: 0, elevationDeg: 0, distance: 4.6, offset: [0, 0], driftSpeed: 0.05, rollDeg: 0, settle: 2 },
  travel: { turnDeg: 26, side: 1 },
  light: { exposure: 1, skyExposure: 0.45, sunRadiusDeg: 5, sunGlare: 1, flare: 0.35 },
  cover: [2.8, 1.05, 0.28],
  handover: { rise: { at: place.rise.at, dissolveFrames: place.rise.dissolveFrames, placeFrames: place.rise.placeFrames, picture: place.rise.picture } },
  spinDegPerSecond: 3.4,
  moonDegPerSecond: 0,
  tint: [1, 0.8, 0.4],
  skyAim: { orbit: [48.4075, -125.38185, -38.46336], terrain: [8.48669, -141.8932, 32.09218] },
}

export const climb = { ease: { over: 1.3, speed: 0.095 } }

export const opening = { on: true, level: 0.9, until: 2 }

const spotOnStage = stage.onGround(stage.spot[0], stage.spot[1])

export class SunPlan extends StopPlan {
  readonly toGlobe: THREE.Quaternion
  readonly toStage: THREE.Quaternion
  readonly anchorStage: THREE.Vector3
  readonly anchorGlobe: THREE.Vector3
  readonly anchorTime: number
  readonly handoverTime: number
  private readonly table: Float64Array

  constructor(id: string, f: Fit, p: MoveParams) {
    super(id, f, p)
    const seg = this.seg.rise
    this.anchorTime = coverFrames(seg)!.firstFrame / config.fps
    this.handoverTime = handoverOf(id, 'rise')?.time ?? this.anchorTime
    const tq = this.turn(this.anchorTime)
    const n = this.normal.clone().applyQuaternion(tq)
    const north = this.heading.clone().applyQuaternion(tq)
    const g = stage.onGround(stage.spot[0], stage.spot[1])
    const gs = g.clone().sub(stage.centre).normalize()
    const fs = new THREE.Vector3(0, 0, -1)
    fs.addScaledVector(gs, -fs.dot(gs)).normalize()
    const a = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(fs, gs), gs, fs.clone().negate())
    const b = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(north, n), n, north.clone().negate())
    this.toGlobe = new THREE.Quaternion().setFromRotationMatrix(b.multiply(a.transpose()))
    this.toStage = this.toGlobe.clone().invert()
    this.anchorStage = g
    this.anchorGlobe = n
    const r = place.rise
    const table = new Float64Array(r.steps + 1)
    const rate = (x: number): number => smooth(x / r.easeIn) * smooth((1 - x) / r.easeOut)
    const step = 1 / r.steps
    for (let i = 0; i < r.steps; i++) table[i + 1] = table[i]! + (step / 6) * (rate(i * step) + 4 * rate((i + 0.5) * step) + rate((i + 1) * step))
    this.table = table
  }

  globe(pose: Pose): Pose {
    return { position: pose.position.clone().sub(stage.centre).divideScalar(stage.radius).applyQuaternion(this.toGlobe), quaternion: this.toGlobe.clone().multiply(pose.quaternion), vfov: pose.vfov }
  }

  local(pose: Pose): Pose {
    return { position: pose.position.clone().applyQuaternion(this.toStage).multiplyScalar(stage.radius).add(stage.centre), quaternion: this.toStage.clone().multiply(pose.quaternion), vfov: pose.vfov }
  }

  progress(x: number): number {
    const steps = place.rise.steps
    const at = Math.min(Math.max(x, 0), 1) * steps
    const i = Math.min(Math.floor(at), steps - 1)
    return mix(this.table[i]!, this.table[i + 1]!, at - i) / this.table[steps]!
  }

  carried(pose: Pose, time: number): Pose {
    const c = this.carry(time)
    return { position: pose.position.clone().applyQuaternion(c), quaternion: c.multiply(pose.quaternion), vfov: pose.vfov }
  }

  uncarried(pose: Pose, time: number): Pose {
    const c = this.carry(time).invert()
    return { position: pose.position.clone().applyQuaternion(c), quaternion: c.multiply(pose.quaternion), vfov: pose.vfov }
  }

  path(time: number): Pose {
    const seg = this.seg.rise
    const r = place.rise
    const since = Math.min(Math.max(time, seg.start), seg.end) - seg.start
    const coast = seg.start + r.coast * (1 - Math.exp(-since / r.coast))
    const a = this.carried(this.globe(this.terrain(coast - this.seg.terrain.start)), seg.start + since)
    const b = this.hold(seg.start + since - this.seg.hold.start)
    const e = this.progress(since / (seg.end - seg.start))
    const ha = a.position.length() - 1
    const hb = b.position.length() - 1
    const height = ha * Math.pow(hb / ha, e)
    const out = slerpDir(a.position.clone().normalize(), b.position.clone().normalize(), (height - ha) / (hb - ha))
    const position = out.multiplyScalar(1 + height)
    const tq = this.turn(seg.start + since)
    const spot = this.normal.clone().applyQuaternion(tq)
    const north = this.heading.clone().applyQuaternion(tq)
    const ra = lookAt(a.position, spot, north).invert().multiply(a.quaternion)
    const rb = lookAt(b.position, spot, north).invert().multiply(b.quaternion)
    const quaternion = lookAt(position, spot, north).multiply(ra.slerp(rb, 1 - Math.pow(1 - e, r.turn)))
    const ta = Math.tan(THREE.MathUtils.degToRad(a.vfov) / 2)
    const tb = Math.tan(THREE.MathUtils.degToRad(b.vfov) / 2)
    const vfov = 2 * THREE.MathUtils.radToDeg(Math.atan(ta * Math.pow(tb / ta, e)))
    return { position, quaternion, vfov }
  }

  private run(t: number): number {
    const k = climb.ease
    if (opening.on && t < opening.until) return this.push(t)
    if (t <= 0) return 0
    if (t >= k.over) return t - k.over / 2
    const x = t / k.over
    return k.over * x * x * x * x * (x * (x - 3) + 2.5)
  }

  private push(t: number): number {
    const o = opening
    const lead = config.shutterFraction / (2 * config.fps)
    const tail = (o.until - o.level) / 2
    const speed = (o.until - climb.ease.over / 2 - tail) / (o.until - lead - tail)
    const x = Math.min(Math.max((t - o.level) / (o.until - o.level), 0), 1)
    return speed * (t - lead) + (1 - speed) * 2 * tail * x * x * x * (1 - x / 2)
  }

  // The bend of the surface view before its rise (ruling d196): the glide pushes in, a part of its way goes toward
  // the ground. From place.bend.from seconds on that part is taken out by a lift along the line from the ball's
  // centre, and the glide runs faster by place.bend.speed, both by one share that comes in smoothly until the end
  // of the surface view and stays whole after it (the rise coasts on along this path). So the eye flies level
  // where the rise takes it, at no loss of speed over its height. Returned: the seconds the share has summed to.
  private bend(tRel: number): number {
    const from = place.bend.from
    if (tRel <= from) return 0
    const wide = this.seg.terrain.end - this.seg.terrain.start - from
    const x = Math.min((tRel - from) / wide, 1)
    return wide * x * x * x * (1 - x / 2) + Math.max(tRel - from - wide, 0)
  }

  override terrain(tRel: number): Pose {
    const dur = this.seg.terrain.end - this.seg.terrain.start
    const pivot = config.shutterFraction / (2 * config.fps * dur)
    const g = this.p.terrain.gather ?? 0
    const bend = this.bend(tRel)
    const u = climb.ease.speed * (this.run(tRel) + place.bend.speed * bend - this.run(dur * (0.5 + pivot)))
    const c = u + pivot + g * pivot * pivot
    const lin = g === 0 ? c : (-1 + Math.sqrt(Math.max(1 + 4 * g * c, 0))) / (2 * g)
    const pose = super.terrain((lin + 0.5) * dur)
    if (bend > 0) {
      // the lens keeps the spot where the glide alone would have it in the picture (place.bend.hold of the way): the
      // lift is a crane's, it does not let the place run through the frame
      const to = spotOnStage.clone().sub(pose.position).normalize()
      pose.position.addScaledVector(pose.position.clone().sub(stage.centre).normalize(), place.bend.lift * stage.radius * bend)
      const now = spotOnStage.clone().sub(pose.position).normalize()
      pose.quaternion.premultiply(new THREE.Quaternion().slerp(new THREE.Quaternion().setFromUnitVectors(to, now), place.bend.hold))
    }
    return pose
  }

  override twin(local: Pose, time: number): Pose {
    return this.carried(this.globe(local), time)
  }

  override risePose(time: number, view: ViewKind): Pose {
    const path = this.path(time)
    return view === 'terrain' ? this.local(this.uncarried(path, time)) : path
  }

  carry(time: number): THREE.Quaternion {
    return this.turn(time).multiply(this.turn(this.anchorTime).invert())
  }
}

export const plan = new SunPlan('sun', fit as Fit, params)
