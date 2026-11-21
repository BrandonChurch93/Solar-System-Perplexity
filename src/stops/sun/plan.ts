import * as THREE from 'three'
import { config, type Segment } from '../../config'
import type { Pose } from '../../core/types'
import { StopPlan, type Fit, type MoveParams, type OrbitShot } from '../../director/moves'
import { coverWindow } from '../../director/timeline'
import { lookAt, mix, ramp, slerpDir, smooth } from '../../director/rig'
import fit from './fit.json'
import { stage } from './stage'

export const params: MoveParams = {
  hold: { orbitDeg: 6, axis: [0, 1, 0], push: 0 },
  spot: { x: 0.54, y: 0.39 },
  dive: { headingDeg: 0, altitude: 0.7, back: 0.05, ahead: 0.12, bow: 0.15, rollDeg: 0 },
  terrain: { vfov: 55, gather: -0.5, forward: 2.0, rise: -0.1, side: 0.7, yawDeg: 8, pitchDeg: 8, horizonDeg: 3.2, dipDeg: 17.5, entryHeight: 0.9, entryBack: 1.1, entryPitchDeg: 4.8, exitHeight: 1.6, exitForward: -0.6, exitPitchDeg: -12 },
  rise: { azimuthDeg: 0, elevationDeg: 0, distance: 4.6, offset: [0, 0], driftSpeed: 0.05, rollDeg: 0, settle: 2 },
  travel: { turnDeg: 26, side: 1 },
  light: { exposure: 1, skyExposure: 0.45, sunRadiusDeg: 5, sunGlare: 1, flare: 0.35 },
  cover: [2.8, 1.05, 0.28],
  spinDegPerSecond: 1.6,
  moonDegPerSecond: 0,
  tint: [1, 0.8, 0.4],
  skyAim: { orbit: [48.4075, -125.38185, -38.46336], terrain: [8.48669, -141.8932, 32.09218] },
}

export const climb = {
  peak: 0.4,
  early: 0,
  before: 0.11,
  after: 0.13,
  ends: [0.06, 0.25] as [number, number],
  limb: 3,
  lens: 3,
  level: 0.15,
  coast: 4,
  steps: 2048,
  ease: { over: 3, settle: 0.55, skew: 0.6, span: 0.8, lead: 1 / 120 },
}

interface Reading { out: THREE.Vector3; height: number; level: THREE.Vector3; limb: number; vfov: number; rest: THREE.Quaternion }

export class SunPlan extends StopPlan {
  readonly toGlobe: THREE.Quaternion
  readonly toStage: THREE.Quaternion
  readonly anchorStage: THREE.Vector3
  readonly anchorGlobe: THREE.Vector3
  readonly switchTime: number
  private readonly table: Float64Array
  private readonly eased: Float64Array

  constructor(id: string, f: Fit, p: MoveParams) {
    super(id, f, p)
    const seg = this.seg.rise
    this.switchTime = this.coverCenter(seg)
    const tq = this.turn(this.switchTime)
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
    const table = new Float64Array(climb.steps + 1)
    const rate = (x: number): number => {
      const s = x < climb.peak ? climb.before : climb.after
      const k = (x - climb.peak) / s
      const g = Math.exp(-0.5 * k * k)
      return (x < climb.peak ? climb.early + (1 - climb.early) * g : g) * smooth(x / climb.ends[0]) * smooth((1 - x) / climb.ends[1])
    }
    const step = 1 / climb.steps
    for (let i = 0; i < climb.steps; i++) table[i + 1] = table[i]! + (step / 6) * (rate(i * step) + 4 * rate((i + 0.5) * step) + rate((i + 1) * step))
    this.table = table
    const k = climb.ease
    const slow = (x: number): number => k.settle * x * x * x * (x * (x * 6 - 15) + 10)
    const swoop = (x: number): number => Math.pow(Math.sin(Math.PI * Math.pow(Math.min(x / k.span, 1), k.skew)), 2)
    const sum = (f: (x: number) => number): Float64Array => {
      const out = new Float64Array(climb.steps + 1)
      for (let i = 0; i < climb.steps; i++) out[i + 1] = out[i]! + (step / 6) * (f(i * step) + 4 * f((i + 0.5) * step) + f((i + 1) * step))
      return out
    }
    const calm = sum(slow)
    const fast = sum(swoop)
    const lead = k.lead / k.over
    const gain = (1 - lead - calm[climb.steps]!) / fast[climb.steps]!
    this.eased = calm.map((v, i) => lead + v + gain * fast[i]!)
  }

  private read(pose: Pose): Reading {
    const out = pose.position.clone().normalize()
    const height = pose.position.length() - 1
    const aim = new THREE.Vector3(0, 0, -1).applyQuaternion(pose.quaternion)
    const beta = Math.acos(Math.min(Math.max(-aim.dot(out), -1), 1))
    const top = new THREE.Vector3(0, 1, 0).applyQuaternion(pose.quaternion)
    const level = (beta > 0.2 ? aim : top).clone().addScaledVector(out, -(beta > 0.2 ? aim : top).dot(out)).normalize()
    const limb = Math.tan(Math.asin(1 / (1 + height)) - beta) / Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
    const rest = this.frame(out, height, level, limb, pose.vfov).invert().multiply(pose.quaternion)
    return { out, height, level, limb, vfov: pose.vfov, rest }
  }

  private frame(out: THREE.Vector3, height: number, level: THREE.Vector3, limb: number, vfov: number): THREE.Quaternion {
    const beta = Math.asin(1 / (1 + height)) - Math.atan(limb * Math.tan(THREE.MathUtils.degToRad(vfov) / 2))
    const aim = out.clone().multiplyScalar(-Math.cos(beta)).addScaledVector(level, Math.sin(beta))
    const top = out.clone().multiplyScalar(Math.sin(beta)).addScaledVector(level, Math.cos(beta))
    return lookAt(new THREE.Vector3(), aim, top)
  }

  globe(pose: Pose): Pose {
    return { position: pose.position.clone().sub(stage.centre).divideScalar(stage.radius).applyQuaternion(this.toGlobe), quaternion: this.toGlobe.clone().multiply(pose.quaternion), vfov: pose.vfov }
  }

  local(pose: Pose): Pose {
    return { position: pose.position.clone().applyQuaternion(this.toStage).multiplyScalar(stage.radius).add(stage.centre), quaternion: this.toStage.clone().multiply(pose.quaternion), vfov: pose.vfov }
  }

  progress(x: number): number {
    const at = Math.min(Math.max(x, 0), 1) * climb.steps
    const i = Math.min(Math.floor(at), climb.steps - 1)
    return mix(this.table[i]!, this.table[i + 1]!, at - i) / this.table[climb.steps]!
  }

  path(x: number): Pose {
    const seg = this.seg.rise
    const since = x * (seg.end - seg.start)
    const coast = seg.start + climb.coast * (1 - Math.exp(-since / climb.coast))
    const a = this.read(this.globe(this.terrain(coast - this.seg.terrain.start)))
    const b = this.read(this.hold(seg.start + since - this.seg.hold.start))
    const e = this.progress(x)
    const height = a.height * Math.pow(b.height / a.height, e)
    const out = slerpDir(a.out, b.out, (height - a.height) / (b.height - a.height))
    const position = out.clone().multiplyScalar(1 + height)
    const vfov = mix(a.vfov, b.vfov, Math.pow(e, climb.lens))
    const limb = mix(a.limb, b.limb, 1 - Math.pow(1 - e, climb.limb))
    const level = slerpDir(a.level, b.level, smooth(e))
    level.addScaledVector(out, -level.dot(out)).normalize()
    const quaternion = this.frame(out, height, level, limb, vfov)
    quaternion.multiply(new THREE.Quaternion().slerp(a.rest, 1 - smooth(ramp(0, climb.level, e))))
    quaternion.multiply(new THREE.Quaternion().slerp(b.rest, smooth(e)))
    return { position, quaternion, vfov }
  }

  private warp(x: number): number {
    const at = Math.min(Math.max(x, 0), 1) * climb.steps
    const i = Math.min(Math.floor(at), climb.steps - 1)
    return mix(this.eased[i]!, this.eased[i + 1]!, at - i)
  }

  override terrain(tRel: number): Pose {
    const k = climb.ease
    if (tRel <= 0) return super.terrain(k.lead + tRel)
    if (tRel >= k.over) return super.terrain(k.over + k.settle * (tRel - k.over))
    return super.terrain(k.over * this.warp(tRel / k.over))
  }

  override rise(time: number): OrbitShot {
    const seg = this.seg.rise
    const path = this.path((time - seg.start) / (seg.end - seg.start))
    return time < this.switchTime ? { pose: this.local(path), view: 'terrain' } : { pose: path, view: 'orbit' }
  }

  override coverAmount(seg: Segment, time: number): number {
    const w = coverWindow(seg)
    if (!w) return 0
    return time > w.firstFrame / config.fps && time < (w.lastFrame + 1) / config.fps ? 1e-4 : 0
  }
}

export const plan = new SunPlan('sun', fit as Fit, params)
