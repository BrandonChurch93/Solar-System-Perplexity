import * as THREE from 'three'
import { config } from '../../config'
import type { Pose, ViewKind } from '../../core/types'
import { StopPlan, type Fit, type MoveParams, type OrbitShot } from '../../director/moves'
import { drift, mix, ramp, smooth, smoother } from '../../director/rig'
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
}

export const skim = { diveBow: 0, diveSwitch: 0.5, riseSwitch: 0.47, riseBow: 0, riseEnd: 0.96, divePower: 1.5, risePower: 1.5, skyNear: 0.35, seatIn: 0.8 }

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
    const ka = this.framing(a)
    const kb = this.framing(b)
    const turn = Math.atan2(Math.sin(kb[2] - ka[2]), Math.cos(kb[2] - ka[2]))
    return this.framed(position, mix(ka[0], kb[0], w), mix(ka[1], kb[1], w), ka[2] + turn * w, ka[3] * Math.pow(kb[3] / ka[3], w))
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

  private diveX(u: number): number {
    return Math.pow(Math.min(Math.max(u, 0), 1), skim.divePower)
  }

  private riseX(u: number): number {
    return 1 - Math.pow(1 - Math.min(Math.max(u / skim.riseEnd, 0), 1), skim.risePower)
  }

  override terrain(tRel: number): Pose {
    return this.local(this.skimAt(this.seg.terrain.start + tRel))
  }

  override coverAmount(): number {
    return 0
  }

  // Where the lens is in the frame of the globe at any time from the hold to the end of the rise: one path.
  flight(time: number): Pose {
    const d = this.seg.dive!
    const r = this.seg.rise
    if (time < d.start) return this.hold(time - this.seg.hold.start)
    if (time < d.end) return this.join(this.hold(time - this.seg.hold.start), this.skimAt(time), this.diveX((time - d.start) / (d.end - d.start)), skim.diveBow)
    if (time < r.start) return this.skimAt(time)
    return this.join(this.skimAt(time), this.after(time), this.riseX((time - r.start) / (r.end - r.start)), skim.riseBow)
  }

  override dive(time: number): OrbitShot {
    const seg = this.seg.dive!
    const x = this.diveX((time - seg.start) / (seg.end - seg.start))
    const pose = this.flight(time)
    return x < skim.diveSwitch ? { pose, view: 'orbit' } : { pose: this.local(pose), view: 'terrain' }
  }

  override rise(time: number): OrbitShot {
    const seg = this.seg.rise
    const x = this.riseX((time - seg.start) / (seg.end - seg.start))
    const pose = this.flight(time)
    return x < skim.riseSwitch ? { pose: this.local(pose), view: 'terrain' } : { pose, view: 'orbit' }
  }

  override skyGain(time: number): number {
    const d = this.seg.dive!
    const r = this.seg.rise
    if (time < d.start || time >= r.end) return 1
    const near = time < d.end ? smooth(this.diveX((time - d.start) / (d.end - d.start))) : time < r.start ? 1 : 1 - smooth(this.riseX((time - r.start) / (r.end - r.start)))
    return mix(1, skim.skyNear, near)
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
    if (time < d.end) return at(h).slerp(at(t), smooth(this.diveX((time - d.start) / (d.end - d.start))))
    if (time < r.start) return at(t)
    return at(t).slerp(out, smooth(this.riseX((time - r.start) / (r.end - r.start))))
  }

  patchWeight(time: number, view: ViewKind): number {
    const d = this.seg.dive!
    const r = this.seg.rise
    if (time >= d.start && time < d.end) {
      const x = this.diveX((time - d.start) / (d.end - d.start))
      return view === 'orbit' ? 1 - smooth(ramp(0, skim.diveSwitch - 0.05, x)) : smooth(ramp(skim.diveSwitch + 0.05, 1, x))
    }
    if (time >= r.start && time < r.end && view === 'terrain') return 1 - smooth(ramp(0, skim.riseSwitch - 0.05, this.riseX((time - r.start) / (r.end - r.start))))
    return 1
  }
}

export const plan = new SaturnPlan('saturn', fit as Fit, params)
