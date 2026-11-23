import * as THREE from 'three'
import { config } from '../../config'
import type { Pose, ViewKind } from '../../core/types'
import { StopPlan, trapeze, type Fit, type MoveParams } from '../../director/moves'
import { drift, mix, ramp, smooth } from '../../director/rig'
import fit from './fit.json'
import skimJson from './skim.json'

export const params: MoveParams = {
  hold: { orbitDeg: 7, axis: [-0.2, 1, 0.1], push: -0.03 },
  spot: { x: 0.256, y: 0.856, on: 'rings' },
  dive: { headingDeg: -35, altitude: 0.03, back: 0.1, ahead: 0.3, bow: -0.12, rollDeg: -4 },
  terrain: { vfov: skimJson.pose.vfov, forward: skimJson.path.forward, rise: -skimJson.pose.height * (Math.sqrt(skimJson.path.descent) - 1 / Math.sqrt(skimJson.path.descent)), side: skimJson.path.side, yawDeg: skimJson.path.yawDeg, pitchDeg: skimJson.path.pitchDeg, entryHeight: 0.72, entryBack: 1.1, entryPitchDeg: 3.6, exitHeight: 1.6, exitForward: 1.5, exitPitchDeg: 6, ground: 0 },
  rise: { azimuthDeg: -14, elevationDeg: 6, distance: 6.6, offset: [-0.28, -0.12], driftSpeed: 0.08, rollDeg: 0 },
  travel: { turnDeg: 88, side: -1, turnEnd: 0.5 },
  arrive: { swingDeg: -23.5, axis: [-0.866, 0.216, -0.027], power: 3, from: 0.35, offset: [-0.25, 0.1] },
  light: { exposure: 1, skyExposure: 0.55, sunRadiusDeg: 0.32, sunGlare: 0.7, flare: 0.1 },
  cover: [0.9, 0.82, 0.66],
  spinDegPerSecond: 1.4,
  moonDegPerSecond: 0.3,
  tint: [0.92, 0.82, 0.6],
  skyAim: { orbit: [-14, 153, -7.3] },
  handover: {
    dive: { at: skimJson.handover.dive.at, skyFrames: skimJson.handover.dive.skyFrames, picture: false },
    rise: { at: skimJson.handover.rise.at, skyFrames: skimJson.handover.rise.skyFrames, picture: false },
  },
}

export const skim = { skyNear: 0.35, seatIn: 0.8 }

export class SaturnPlan extends StopPlan {
  readonly ringNormal: THREE.Vector3
  readonly skimPosition: THREE.Vector3
  readonly skimQuaternion: THREE.Quaternion
  readonly skimForward: THREE.Vector3
  readonly skimRight: THREE.Vector3
  private readonly toTerrain: THREE.Quaternion

  constructor(id: string, f: Fit, p: MoveParams) {
    super(id, f, p)
    const rad = THREE.MathUtils.degToRad
    const pose = skimJson.pose
    const n = this.normal.clone()
    this.ringNormal = n
    const sun = this.lightDir.clone()
    const flat = sun.clone().addScaledVector(n, -sun.dot(n)).normalize()
    const out = new THREE.Vector3().crossVectors(n, flat).normalize().applyAxisAngle(n, rad(pose.azimuthDeg))
    const tilt = rad(pose.tiltDeg)
    const roll = rad(pose.rollDeg)
    const yaw = rad(pose.yawDeg)
    const nc = new THREE.Vector3(-Math.sin(roll) * Math.cos(tilt), Math.cos(roll) * Math.cos(tilt), Math.sin(tilt))
    const fp = new THREE.Vector3(0, 0, -1).addScaledVector(nc, nc.z).normalize()
    const left = new THREE.Vector3().crossVectors(nc, fp)
    const toGlobe = fp.clone().multiplyScalar(Math.cos(yaw)).addScaledVector(left, -Math.sin(yaw))
    const inward = out.clone().negate()
    const cam = new THREE.Matrix4().makeBasis(nc, toGlobe, new THREE.Vector3().crossVectors(nc, toGlobe))
    const world = new THREE.Matrix4().makeBasis(n, inward, new THREE.Vector3().crossVectors(n, inward))
    this.skimQuaternion = new THREE.Quaternion().setFromRotationMatrix(world.multiply(cam.transpose()))
    this.skimPosition = out.clone().multiplyScalar(pose.foot).addScaledVector(n, pose.height)
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.skimQuaternion)
    this.skimForward = fwd.addScaledVector(n, -fwd.dot(n)).normalize()
    this.skimRight = new THREE.Vector3().crossVectors(this.skimForward, n).normalize()
    this.toTerrain = this.terrainFrame.clone().invert()
  }

  // The skim: the height falls by the same share in every frame and the speed over the plane goes with the
  // height, so the sheet passes under the lens at a steady number of pixels a frame. u is the time from the
  // middle of the skim over its length; along is the share of the way done since the middle.
  skimAt(time: number): Pose {
    const path = skimJson.path
    const seg = this.seg.terrain
    const dur = seg.end - seg.start
    const u = (time - seg.start) / dur - 0.5 - config.shutterFraction / (2 * config.fps * dur)
    const k = Math.log(path.descent)
    const fall = Math.exp(-k * u)
    const along = k === 0 ? u : (1 - fall) / (2 * Math.sinh(k / 2))
    const position = this.skimPosition.clone().addScaledVector(this.skimForward, path.forward * along).addScaledVector(this.skimRight, path.side * along).addScaledVector(this.ringNormal, skimJson.pose.height * (fall - 1))
    const quaternion = new THREE.Quaternion().setFromAxisAngle(this.ringNormal, THREE.MathUtils.degToRad(path.yawDeg) * u).multiply(this.skimQuaternion)
    quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(path.pitchDeg) * u))
    return { position, quaternion, vfov: skimJson.pose.vfov }
  }

  private local(pose: Pose): Pose {
    return { position: pose.position.clone().sub(this.spot).applyQuaternion(this.toTerrain), quaternion: this.toTerrain.clone().multiply(pose.quaternion), vfov: pose.vfov }
  }

  // The pose the share w of the way from a to b, both in the frame of the globe. On that way the foot on the
  // plane goes straight from one to the other while the height over the plane changes by the same factor for
  // the same step, and the picture of the globe (where it stands in the view, how it leans, how large it is)
  // goes from one to the other with it. How far along that way the lens is, is set so that its distance to the
  // globe's surface changes by the same factor for the same step of w: a steady share of w a frame is a steady
  // descent or climb.
  private join(a: Pose, b: Pose, w: number, reach?: number): Pose {
    if (w <= 0) return a
    if (w >= 1) return b
    const n = this.ringNormal
    const ha = a.position.dot(n)
    const hb = b.position.dot(n)
    const fa = a.position.clone().addScaledVector(n, -ha)
    const fb = b.position.clone().addScaledVector(n, -hb)
    const at = (v: number): THREE.Vector3 => fa.clone().lerp(fb, v).addScaledVector(n, ha > 1e-4 && hb > 1e-4 ? ha * Math.pow(hb / ha, v) : mix(ha, hb, v))
    const da = Math.max(a.position.length() - 1, 1e-6)
    const db = Math.max(b.position.length() - 1, 1e-6)
    const want = reach === undefined ? da * Math.pow(db / da, w) : Math.min(Math.max(reach, Math.min(da, db)), Math.max(da, db))
    let lo = 0
    let hi = 1
    for (let i = 0; i < 48; i++) {
      const mid = (lo + hi) / 2
      if ((at(mid).length() - 1 - want) * (db - da) < 0) lo = mid
      else hi = mid
    }
    const v = db === da ? w : (lo + hi) / 2
    const ka = this.framing(a)
    const kb = this.framing(b)
    const turn = Math.atan2(Math.sin(kb[2] - ka[2]), Math.cos(kb[2] - ka[2]))
    return this.framed(at(v), mix(ka[0], kb[0], v), mix(ka[1], kb[1], v), ka[2] + turn * v, ka[3] * Math.pow(kb[3] / ka[3], v))
  }

  private framing(pose: Pose): [number, number, number, number] {
    const inv = pose.quaternion.clone().invert()
    const d = pose.position.clone().negate().normalize().applyQuaternion(inv)
    const tan = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
    const e = this.ringNormal.clone().applyQuaternion(inv)
    e.addScaledVector(d, -e.dot(d))
    const px = (e.x * -d.z + d.x * e.z) / (d.z * d.z)
    const py = (e.y * -d.z + d.y * e.z) / (d.z * d.z)
    return [d.x / -d.z / tan, d.y / -d.z / tan, Math.atan2(py, px), 1 / (tan * pose.position.length())]
  }

  private framed(position: THREE.Vector3, sx: number, sy: number, psi: number, size: number): Pose {
    const tan = 1 / (size * position.length())
    const dc = new THREE.Vector3(sx * tan, sy * tan, -1).normalize()
    const ec = new THREE.Vector3(sx * tan + 1e-3 * Math.cos(psi), sy * tan + 1e-3 * Math.sin(psi), -1).normalize()
    ec.addScaledVector(dc, -ec.dot(dc)).normalize()
    const dw = position.clone().negate().normalize()
    const ew = this.ringNormal.clone().addScaledVector(dw, -this.ringNormal.dot(dw)).normalize()
    const cam = new THREE.Matrix4().makeBasis(dc, ec, new THREE.Vector3().crossVectors(dc, ec))
    const world = new THREE.Matrix4().makeBasis(dw, ew, new THREE.Vector3().crossVectors(dw, ew))
    return { position, quaternion: new THREE.Quaternion().setFromRotationMatrix(world.multiply(cam.transpose())), vfov: THREE.MathUtils.radToDeg(2 * Math.atan(tan)) }
  }

  // The distance of the lens to the globe's surface at a time of the dive. Its rate (the factor a frame)
  // goes from the hold's own rate up to a steady rate over the first share of the dive (rise), keeps it, and
  // comes to the skim's own rate over the last share (fall): a steady descent that meets the hold and the
  // skim without a step in speed.
  private diveLaw: { l0: number; l1: number; s0: number; s1: number; p: number } | null = null

  private diveReach(time: number): number {
    const seg = this.seg.dive!
    const d = skimJson.handover.dive
    const dur = seg.end - seg.start
    if (!this.diveLaw) {
      const reach = (pose: Pose): number => Math.log(Math.max(pose.position.length() - 1, 1e-6))
      const e = 0.5 / config.fps
      const h = this.seg.hold.start
      const l0 = reach(this.hold(seg.start - h))
      const l1 = reach(this.skimAt(seg.end))
      const s0 = ((reach(this.hold(seg.start + e - h)) - reach(this.hold(seg.start - e - h))) / (2 * e)) * dur
      const s1 = ((reach(this.skimAt(seg.end + e)) - reach(this.skimAt(seg.end - e))) / (2 * e)) * dur
      this.diveLaw = { l0, l1, s0, s1, p: (l1 - l0 - 0.5 * d.rise * s0 - 0.5 * d.fall * s1) / (1 - 0.5 * d.rise - 0.5 * d.fall) }
    }
    const { l0, l1, s0, s1, p } = this.diveLaw
    const u = Math.min(Math.max((time - seg.start) / dur, 0), 1)
    const area = (y: number): number => y * y * y - 0.5 * y * y * y * y
    let done: number
    if (u <= d.rise) done = s0 * u + (p - s0) * d.rise * area(d.rise > 0 ? u / d.rise : 1)
    else if (u <= 1 - d.fall) done = 0.5 * d.rise * (s0 + p) + p * (u - d.rise)
    else done = l1 - l0 - s1 * (1 - u) - (p - s1) * d.fall * area((1 - u) / d.fall)
    return Math.exp(l0 + done)
  }

  // How much of the dive is done at a time (0 in the hold, 1 in the skim), and how much of the rise: a ramp
  // up, a steady middle, a ramp down, so the speed of the skim and of the way out is met without a step.
  private diveShare(time: number): number {
    const seg = this.seg.dive!
    const d = skimJson.handover.dive
    return trapeze((time - seg.start) / (seg.end - seg.start), d.rise, d.fall)
  }

  private riseShare(time: number): number {
    const seg = this.seg.rise
    const d = skimJson.handover.rise
    return trapeze((time - seg.start) / (seg.end - seg.start), d.rise, d.fall)
  }

  // how near the skim the lens is at a time: 0 in the hold and after the rise, 1 in the skim
  private nearness(time: number): number {
    const d = this.seg.dive!
    const r = this.seg.rise
    if (time < d.start || time >= r.end) return 0
    return time < d.end ? this.diveShare(time) : time < r.start ? 1 : 1 - this.riseShare(time)
  }

  override terrain(tRel: number): Pose {
    return this.local(this.skimAt(this.seg.terrain.start + tRel))
  }

  // No cover is drawn at this stop: the dive and the rise are one flight through one world.
  override coverAmount(): number {
    return 0
  }

  // Where the lens is in the frame of the globe at any time from the hold to the end of the rise: one path.
  flight(time: number): Pose {
    const d = this.seg.dive!
    const r = this.seg.rise
    if (time < d.start) return this.hold(time - this.seg.hold.start)
    if (time < d.end) return this.join(this.hold(time - this.seg.hold.start), this.skimAt(time), this.diveShare(time), this.diveReach(time))
    if (time < r.start) return this.skimAt(time)
    return this.join(this.skimAt(time), this.after(time), this.riseShare(time))
  }

  // The two views of the handover show the same world from the same lens: the close view is the flight seen in
  // the frame of the skim, and its twin in the frame of the globe is the flight itself.
  override divePose(time: number, view: ViewKind): Pose {
    const pose = this.flight(time)
    return view === 'terrain' ? this.local(pose) : pose
  }

  override risePose(time: number, view: ViewKind): Pose {
    const pose = this.flight(time)
    return view === 'terrain' ? this.local(pose) : pose
  }

  override twin(local: Pose, _time: number): Pose {
    return { position: local.position.clone().applyQuaternion(this.terrainFrame).add(this.spot), quaternion: this.terrainFrame.clone().multiply(local.quaternion), vfov: local.vfov }
  }

  // The place the dive goes to and the rise leaves: a point of the ring plane ahead of the lens of the skim.
  // The ground of this stop is the plane of the rings, not the sphere.
  override place(_kind: 'dive' | 'rise', _time: number): THREE.Vector3 {
    const foot = this.skimPosition.clone().addScaledVector(this.ringNormal, -this.skimPosition.dot(this.ringNormal))
    return foot.addScaledVector(this.skimForward, skimJson.handover.place.ahead)
  }

  override skyGain(time: number): number {
    return mix(1, skim.skyNear, smooth(this.nearness(time)))
  }

  seat(time: number): THREE.Quaternion {
    const h = this.seg.hold
    const d = this.seg.dive!
    const t = this.seg.terrain
    const r = this.seg.rise
    const out = new THREE.Quaternion()
    if (time <= h.start || time >= r.end) return out
    const fractions = config.raw.judged.fractions as Record<string, number>
    const at = (s: typeof h): THREE.Quaternion => drift((s.firstFrame + Math.floor((fractions[s.kind] ?? 0.5) * s.frames + 1e-9)) / config.fps)
    if (time < d.start) return out.slerp(at(h), smooth(ramp(h.start, mix(h.start, this.holdMid, skim.seatIn), time)))
    if (time < d.end) return at(h).slerp(at(t), smooth(this.diveShare(time)))
    if (time < r.start) return at(t)
    return at(t).slerp(out, smooth(this.riseShare(time)))
  }
}

export const plan = new SaturnPlan('saturn', fit as Fit, params)
