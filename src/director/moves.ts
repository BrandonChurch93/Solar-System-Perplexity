import * as THREE from 'three'
import { config, type Segment } from '../config'
import type { CoverHorizon, Pose, ViewKind } from '../core/types'
import { handoverOf, sideAt, type HandoverParams, type Sidestep, type SkyShares } from './handover'
import { coverFrames, coverWindow, setCoverWindow, setHandover, withoutHandover, type CoverTimings } from './timeline'
import { blendPose, ease, lookAt, mix, ramp, slerpDir, smooth, smoother } from './rig'

export interface FitMoon { id: string; position: number[]; radius: number }
export interface Fit {
  vfovDeg: number
  aspect: number
  camera: { position: number[] }
  sunDir?: number[] | null
  sunInFrame?: { directionFromCamera: number[]; r?: number }
  moons?: FitMoon[]
  rings?: { normal: number[]; inner: number; outer: number } | null
  globe: { quaternion: number[]; scale: number[] }
}

export interface Surge { glide: number; rise: number; fall: number; swell?: [number, number, number] }

export interface MoveParams {
  hold: { orbitDeg: number; axis: [number, number, number]; push: number }
  spot: { x: number; y: number; on?: 'globe' | 'rings' }
  dive: { headingDeg: number; altitude: number; back: number; ahead: number; bow: number; rollDeg: number; swoop?: boolean; surge?: Surge; level?: number }
  terrain: { vfov: number; gather?: number; forward: number; rise: number; side: number; yawDeg: number; pitchDeg: number; entryHeight: number; entryBack: number; entryPitchDeg: number; entryYawDeg?: number; entryRollDeg?: number; entryDipDeg?: number; exitHeight: number; exitForward: number; exitPitchDeg: number; exitDipDeg?: number; horizonDeg?: number; dipDeg?: number; rollDeg?: number; ground?: number }
  rise: { azimuthDeg: number; elevationDeg: number; distance: number; offset: [number, number]; driftSpeed: number; rollDeg: number; ahead?: number; hug?: number; tilt?: number; settle?: number; level?: boolean; pan?: number; gentle?: boolean; from?: number }
  travel: { turnDeg: number; side: number; turnEnd?: number; start?: number }
  arrive?: { swingDeg: number; axis: [number, number, number]; power?: number; from?: number; offset?: [number, number] }
  light: { exposure: number; skyExposure: number; terrainSkyGlow?: number; skyLow?: [number, number, number]; skyLiftFrom?: number; sunRadiusDeg: number; sunGlare: number; flare: number; sunDir?: [number, number, number]; glareCarry?: { dive?: number; rise?: number } }
  cover: [number, number, number]
  coverLow?: [number, number, number]
  coverTerrain?: [number, number, number]
  coverLowTerrain?: [number, number, number]
  coverTop?: [number, number]
  coverEdge?: [number, number]
  coverEdgeRise?: [number, number]
  coverHides?: number
  coverWindow?: CoverTimings
  handover?: HandoverParams
  skyTurnEase?: { dive?: boolean; rise?: boolean }
  coverShell?: [number, number]
  coverSea?: { centre: [number, number, number]; radius: number; edge: [number, number] }
  coverRush?: { speed: number; reach: number; billow: [number, number, number]; streak: [number, number, number]; contrast: [number, number] }
  spinDegPerSecond: number
  moonDegPerSecond: number
  tint: [number, number, number]
  skyAim?: { orbit?: [number, number, number]; terrain?: [number, number, number] }
}

export interface SegmentTimes { hold: Segment; dive?: Segment; terrain: Segment; rise: Segment; travel?: Segment }

export interface OrbitShot { pose: Pose; view: 'orbit' | 'terrain' }

export interface TwinFrame { rotation: THREE.Quaternion; origin: THREE.Vector3; scale: number }

interface Target { key: string; centre: THREE.Vector3; ahead: THREE.Vector3 }
interface Coast { key: string; position: THREE.Vector3; velocity: THREE.Vector3; quaternion: THREE.Quaternion; spin: THREE.Vector3; vfov: number }
interface Lean { key: string; front: boolean }

const Y = new THREE.Vector3(0, 1, 0)
const SURGE_STEPS = 2048
const SURGE_TAIL = 8
const SURGE_LEAD = 0.25
const surgeTables = new Map<string, Float64Array>()

function hermite(x: number, m1: number): number {
  return 3 * x * x - 2 * x * x * x + m1 * (x * x * x - x * x)
}

function unhermite(e: number, m1: number): number {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 48; i++) {
    const mid = 0.5 * (lo + hi)
    if (hermite(mid, m1) < e) lo = mid
    else hi = mid
  }
  return 0.5 * (lo + hi)
}

function surgeTable(rise: number, fall: number): Float64Array {
  const key = rise + '|' + fall
  const hit = surgeTables.get(key)
  if (hit) return hit
  const table = new Float64Array(SURGE_STEPS + 1)
  const f = (t: number): number => Math.pow(t, rise) * Math.pow(1 - t, fall)
  const h = 1 / SURGE_STEPS
  for (let i = 0; i < SURGE_STEPS; i++) {
    const a = i * h
    table[i + 1] = table[i]! + (h / 6) * (f(a) + 4 * f(a + 0.5 * h) + f(a + h))
  }
  surgeTables.set(key, table)
  return table
}

function bumpAt(rise: number, fall: number, x: number): number {
  const table = surgeTable(rise, fall)
  const at = x * SURGE_STEPS
  const i = Math.min(Math.floor(at), SURGE_STEPS - 1)
  return mix(table[i]!, table[i + 1]!, at - i) / table[SURGE_STEPS]!
}

function surge(s: Surge, m1: number, x: number): number {
  const k = Math.min(x / SURGE_LEAD, 1)
  const lead = SURGE_LEAD * (k * k * k - 0.5 * k * k * k * k) + Math.max(x - SURGE_LEAD, 0)
  const swell = s.swell ? s.swell[0] * bumpAt(s.swell[1], s.swell[2], x) : 0
  const tail = (m1 - s.glide) / (SURGE_TAIL + 1)
  const gain = 1 - s.glide * (1 - 0.5 * SURGE_LEAD) - (s.swell ? s.swell[0] : 0) - tail
  return s.glide * lead + swell + gain * bumpAt(s.rise, s.fall, x) + tail * Math.pow(x, SURGE_TAIL + 1)
}
const easeIn = ease('power2.in')
const easeOut = ease('power3.out')
const easeRise = ease('sine.out')
const easeInOut = ease('power2.inOut')

export function trapeze(x: number, rise: number, fall: number): number {
  const k = Math.min(Math.max(x, 0), 1)
  const area = (y: number): number => (y >= 1 ? y - 0.5 : y * y * y - 0.5 * y * y * y * y)
  const total = 1 - 0.5 * rise - 0.5 * fall
  const done = k <= 1 - fall ? (rise > 0 ? rise * area(k / rise) : k) : total - fall * area((1 - k) / fall)
  return done / total
}

function v3(a: number[]): THREE.Vector3 {
  return new THREE.Vector3(a[0], a[1], a[2])
}

export class StopPlan {
  readonly id: string
  readonly fit: Fit
  readonly p: MoveParams
  readonly seg: SegmentTimes
  readonly holdPos: THREE.Vector3
  readonly spot: THREE.Vector3
  readonly normal: THREE.Vector3
  readonly heading: THREE.Vector3
  readonly terrainFrame: THREE.Quaternion
  readonly sunDir: THREE.Vector3
  readonly lightDir: THREE.Vector3
  readonly axis: THREE.Vector3
  readonly holdMid: number
  readonly riseEnd: Pose
  readonly riseOut: THREE.Vector3
  private readonly targets: Target[] = []
  private readonly coasts: Coast[] = []
  private readonly leans: Lean[] = []

  constructor(id: string, fit: Fit, p: MoveParams) {
    this.id = id
    this.fit = fit
    this.p = p
    setCoverWindow(id, p.coverWindow)
    setHandover(id, p.handover)
    const find = (kind: string): Segment | undefined => config.segments.find((s) => s.stop === id && s.kind === kind)
    const hold = find('hold')
    const terrain = find('terrain')
    const rise = find('rise')
    if (!hold || !terrain || !rise) throw new Error('stop ' + id + ' lacks a segment')
    this.seg = { hold, dive: find('dive'), terrain, rise, travel: find('travel') }
    this.holdPos = v3(fit.camera.position)
    const t = Math.tan(THREE.MathUtils.degToRad(fit.vfovDeg) / 2)
    const ray = new THREE.Vector3((2 * p.spot.x - 1) * t * fit.aspect, (1 - 2 * p.spot.y) * t, -1).normalize()
    const rings = fit.rings ? v3(fit.rings.normal).normalize() : null
    if (p.spot.on === 'rings' && rings) {
      const n = rings.clone()
      if (n.dot(this.holdPos) < 0) n.negate()
      const k = -this.holdPos.dot(n) / ray.dot(n)
      this.spot = this.holdPos.clone().addScaledVector(ray, k)
      this.normal = n
    } else {
      const b = this.holdPos.dot(ray)
      const c = this.holdPos.lengthSq() - 1
      const disc = b * b - c
      const k = disc > 0 ? -b - Math.sqrt(disc) : -b
      this.spot = this.holdPos.clone().addScaledVector(ray, k).normalize()
      this.normal = this.spot.clone()
    }
    const ref = Y.clone().addScaledVector(this.normal, -Y.dot(this.normal))
    if (ref.lengthSq() < 1e-6) ref.set(1, 0, 0).addScaledVector(this.normal, -this.normal.x)
    ref.normalize().applyAxisAngle(this.normal, THREE.MathUtils.degToRad(p.dive.headingDeg))
    this.heading = ref
    const right = new THREE.Vector3().crossVectors(this.heading, this.normal).normalize()
    this.terrainFrame = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, this.normal, this.heading.clone().negate()))
    this.lightDir = v3(fit.sunDir ?? [-0.7, 0.5, 0.5]).normalize()
    this.sunDir = p.light.sunDir ? v3(p.light.sunDir).normalize() : fit.sunInFrame ? v3(fit.sunInFrame.directionFromCamera).normalize() : this.lightDir.clone()
    this.axis = Y.clone().applyQuaternion(new THREE.Quaternion().fromArray(fit.globe.quaternion)).normalize()
    this.holdMid = (hold.start + hold.end) / 2
    const dir = this.holdPos.clone().normalize()
    const side = new THREE.Vector3().crossVectors(Y, dir).normalize()
    dir.applyAxisAngle(side, -THREE.MathUtils.degToRad(p.rise.elevationDeg)).applyAxisAngle(Y, THREE.MathUtils.degToRad(p.rise.azimuthDeg))
    const pos = dir.clone().multiplyScalar(p.rise.distance)
    const q0 = lookAt(pos, new THREE.Vector3(), Y, p.rise.rollDeg)
    const half = Math.tan(THREE.MathUtils.degToRad(fit.vfovDeg) / 2) * p.rise.distance
    const target = new THREE.Vector3(-p.rise.offset[0] * half * fit.aspect, -p.rise.offset[1] * half, 0).applyQuaternion(q0)
    this.riseEnd = { position: pos, quaternion: lookAt(pos, target, Y, p.rise.rollDeg), vfov: fit.vfovDeg }
    this.riseOut = dir
    if (p.rise.level) this.riseEnd.quaternion = this.climb(pos, this.heading.clone().applyQuaternion(this.turn(rise.end)), 1)
  }

  turn(time: number): THREE.Quaternion {
    if (this.p.spot.on === 'rings') return new THREE.Quaternion()
    return new THREE.Quaternion().setFromAxisAngle(this.axis, THREE.MathUtils.degToRad(this.p.spinDegPerSecond) * (time - this.holdMid))
  }

  spin(time: number): number {
    return THREE.MathUtils.degToRad(this.p.spinDegPerSecond) * (time - this.holdMid)
  }

  get riseIntoHold(): boolean {
    return this.seg.hold.start >= this.seg.rise.end
  }

  after(time: number): Pose {
    return this.riseIntoHold ? this.hold(time - this.seg.hold.start) : this.exitPose(time)
  }

  get firstSegment(): Segment {
    return config.segments.find((s) => s.stop === this.id)!
  }

  get ground(): number {
    return this.p.terrain.ground ?? config.motion.terrainGround
  }

  hold(tRel: number): Pose {
    const u = tRel / (this.seg.hold.end - this.seg.hold.start) - 0.5
    const q = new THREE.Quaternion().setFromAxisAngle(v3(this.p.hold.axis).normalize(), THREE.MathUtils.degToRad(this.p.hold.orbitDeg) * u)
    return { position: this.holdPos.clone().applyQuaternion(q).multiplyScalar(1 + this.p.hold.push * u), quaternion: q, vfov: this.fit.vfovDeg }
  }

  terrain(tRel: number): Pose {
    const t = this.p.terrain
    const dur = this.seg.terrain.end - this.seg.terrain.start
    const lin = tRel / dur - 0.5
    const pivot = config.shutterFraction / (2 * config.fps * dur)
    const u = lin - pivot + (t.gather ?? 0) * (lin * lin - pivot * pivot)
    const tilt = THREE.MathUtils.degToRad((t.horizonDeg ?? 0) + (t.dipDeg ?? 0))
    const axis = new THREE.Vector3(0, Math.cos(tilt), Math.sin(tilt))
    if (t.rollDeg) axis.applyAxisAngle(new THREE.Vector3(0, 0, 1), -THREE.MathUtils.degToRad(t.rollDeg))
    const quaternion = new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(t.yawDeg) * u)
    quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(t.pitchDeg) * u))
    return { position: new THREE.Vector3(t.side * u, t.rise * u, -t.forward * u), quaternion, vfov: t.vfov }
  }

  private climb(position: THREE.Vector3, heading: THREE.Vector3, e: number): THREE.Quaternion {
    const t = this.p.terrain
    const r = this.p.rise
    const f = this.coverFractions(this.seg.rise)
    const out = position.clone().normalize()
    const level = heading.clone().addScaledVector(out, -heading.dot(out)).normalize()
    const th = Math.tan(THREE.MathUtils.degToRad(this.fit.vfovDeg) / 2)
    const carried = THREE.MathUtils.degToRad((t.horizonDeg ?? 0) - t.exitPitchDeg * Math.pow(ramp(0, f.last, f.center), 2.2) - (t.exitDipDeg ?? 0))
    const framed = Math.asin(1 / r.distance) + Math.atan(r.offset[1] * th)
    const pitch = Math.acos(Math.min(1 / position.length(), 1)) + mix(carried, framed, smooth(e))
    const aim = level.clone().multiplyScalar(Math.cos(pitch)).addScaledVector(out, -Math.sin(pitch))
    const w = smoother(ramp(r.pan ?? 0, 1, e))
    const q = lookAt(position, position.clone().add(aim), out.clone().add(level).normalize())
    q.multiply(new THREE.Quaternion().setFromAxisAngle(Y, Math.atan(r.offset[0] * th * this.fit.aspect) * w))
    return q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(r.rollDeg) * w + THREE.MathUtils.degToRad(t.rollDeg ?? 0) * (1 - w)))
  }

  exit(tRel: number): Pose {
    const r = this.riseEnd
    return { position: r.position.clone().addScaledVector(this.riseOut, this.p.rise.driftSpeed * tRel), quaternion: r.quaternion.clone(), vfov: r.vfov }
  }

  get handsOver(): boolean {
    return this.p.handover !== undefined
  }

  coverBare(seg: Segment | undefined): boolean {
    if (!seg) return false
    return withoutHandover(this.id, () => !!coverWindow(seg) && this.coverAmount(seg, this.coverCenter(seg)) === 0)
  }

  closeUp(): { up: THREE.Vector3; dip: number } {
    const t = this.p.terrain
    const dip = THREE.MathUtils.degToRad(t.dipDeg ?? 2)
    const tilt = THREE.MathUtils.degToRad(t.horizonDeg ?? 0) + dip
    const up = new THREE.Vector3(0, Math.cos(tilt), Math.sin(tilt))
    if (t.rollDeg) up.applyAxisAngle(new THREE.Vector3(0, 0, 1), -THREE.MathUtils.degToRad(t.rollDeg))
    return { up, dip }
  }

  twinFrame(time: number): TwinFrame {
    const { up, dip } = this.closeUp()
    const rho = this.ground / (1 / Math.cos(dip) - 1)
    const tq = this.turn(time)
    const rotation = tq.clone().multiply(this.terrainFrame).multiply(new THREE.Quaternion().setFromUnitVectors(up, Y))
    const origin = this.normal.clone().applyQuaternion(tq).multiplyScalar(1 + this.ground / rho)
    return { rotation, origin, scale: 1 / rho }
  }

  twin(local: Pose, time: number): Pose {
    const f = this.twinFrame(time)
    return { position: local.position.clone().multiplyScalar(f.scale).applyQuaternion(f.rotation).add(f.origin), quaternion: f.rotation.clone().multiply(local.quaternion), vfov: local.vfov }
  }

  closePose(kind: 'dive' | 'rise', time: number): Pose {
    return kind === 'dive' ? this.divePose(time, 'terrain') : this.risePose(time, 'terrain')
  }

  private target(kind: 'dive' | 'rise', at: number, time: number): { centre: THREE.Vector3; ahead: THREE.Vector3 } {
    const key = kind + '|' + at
    let hit = this.targets.find((t) => t.key === key)
    if (!hit) {
      const tw = this.twin(this.closePose(kind, at), at)
      const eye = tw.position
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(tw.quaternion)
      const out = eye.clone().normalize()
      const level = dir.clone().addScaledVector(out, -dir.dot(out))
      if (level.lengthSq() < 1e-12) level.copy(this.heading).applyQuaternion(this.turn(at)).addScaledVector(out, -this.heading.clone().applyQuaternion(this.turn(at)).dot(out))
      level.normalize()
      const b = eye.dot(dir)
      const c = eye.lengthSq() - 1
      const disc = b * b - c
      const reach = Math.acos(Math.min(1 / eye.length(), 1)) * config.raw.handover.descent.targetReach
      let arc = reach
      if (disc > 0 && b < 0) {
        const p = eye.clone().addScaledVector(dir, c / (-b + Math.sqrt(disc))).normalize()
        arc = Math.min(Math.acos(Math.min(Math.max(p.dot(out), -1), 1)), reach)
      }
      const centre = out.clone().multiplyScalar(Math.cos(arc)).addScaledVector(level, Math.sin(arc))
      const ahead = level.clone().multiplyScalar(Math.cos(arc)).addScaledVector(out, -Math.sin(arc))
      const back = this.turn(at).invert()
      hit = { key, centre: centre.applyQuaternion(back), ahead: ahead.applyQuaternion(back) }
      if (this.targets.length > 8) this.targets.length = 0
      this.targets.push(hit)
    }
    const tq = this.turn(time)
    return { centre: hit.centre.clone().applyQuaternion(tq), ahead: hit.ahead.clone().applyQuaternion(tq) }
  }

  place(kind: 'dive' | 'rise', time: number): THREE.Vector3 {
    const seg = kind === 'dive' ? this.seg.dive : this.seg.rise
    if (!seg) throw new Error(this.id + ' has no ' + kind)
    return this.target(kind, this.coverCenter(seg), time).centre
  }

  // The harness's top down view: a camera straight above the place at the height and with the field of the given pose, looking down, the close
  // side's heading up in the picture. It turns with the body, so a sheet of it shows one place coming closer.
  topDown(kind: 'dive' | 'rise', time: number, pose: Pose): Pose {
    const seg = kind === 'dive' ? this.seg.dive : this.seg.rise
    if (!seg) throw new Error(this.id + ' has no ' + kind)
    const t = this.target(kind, this.coverCenter(seg), time)
    const position = t.centre.clone().multiplyScalar(pose.position.length())
    return { position, quaternion: lookAt(position, new THREE.Vector3(0, 0, 0), t.ahead), vfov: pose.vfov }
  }

  handoverPath(kind: 'dive' | 'rise'): { rise: number; fall: number; turnRise: number; turnFall: number; level: boolean; levelBy: number; sidestep?: Sidestep } {
    const base = kind === 'dive' ? config.raw.handover.descent : config.raw.handover.ascent
    const own = this.p.handover?.[kind]?.path
    const out = { rise: own?.rise ?? base.rise, fall: own?.fall ?? base.fall, turnRise: own?.turnRise ?? base.turnRise, turnFall: own?.turnFall ?? base.turnFall, level: own?.level ?? base.level, levelBy: own?.levelBy ?? base.levelBy, sidestep: own?.sidestep }
    if (!(out.rise >= 0) || !(out.fall > 0) || !(out.rise + out.fall <= 1) || !(out.turnRise >= 0) || !(out.turnFall > 0) || !(out.turnRise + out.turnFall <= 1) || !(out.levelBy > 0 && out.levelBy <= 1)) throw new Error('the handover path of ' + this.id + ' needs rise and turnRise of 0 or more, fall and turnFall above 0, each pair adding up to at most 1, and levelBy above 0 and at most 1')
    const s = out.sidestep
    if (s && (!Number.isFinite(s.right) || !Number.isFinite(s.up) || !(s.by > 0 && s.by <= 1))) throw new Error('the sidestep of ' + this.id + ' needs right and up in radii and by above 0 and at most 1')
    return out
  }

  private sidestep(kind: 'dive' | 'rise', far: Pose, x: number, at: number, time: number): Pose {
    const s = this.handoverPath(kind).sidestep
    const w = s ? smoother(x / s.by) : 0
    if (!s || w <= 0) return far
    const { centre } = this.target(kind, at, time)
    const rel = far.position.clone().sub(centre)
    const range = rel.length()
    const move = new THREE.Vector3(s.right, s.up, 0).applyQuaternion(far.quaternion)
    move.addScaledVector(rel, -move.dot(rel) / (range * range))
    const amount = move.length()
    if (amount < 1e-12 || range < 1e-9) return far
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3().crossVectors(rel, move).normalize(), (amount / range) * w)
    return { position: centre.clone().add(rel.applyQuaternion(q)), quaternion: q.clone().multiply(far.quaternion), vfov: far.vfov }
  }

  private glide(kind: 'dive' | 'rise', time: number, far: Pose, low: Pose, share: number, turn: number, at: number): Pose {
    if (share <= 0 && turn <= 0) return far
    if (share >= 1 && turn >= 1) return low
    const { centre, ahead } = this.target(kind, at, time)
    const seen = (p: Pose): { h: number; out: THREE.Vector3; rel: THREE.Quaternion } => {
      const out = p.position.clone().sub(centre)
      const look = lookAt(p.position, centre, ahead)
      return { h: p.position.length() - 1, out: out.normalize(), rel: look.invert().multiply(p.quaternion) }
    }
    const path = this.handoverPath(kind)
    const swing = path.level ? this.swing(kind, at, far, centre, ahead) : 0
    const back = new THREE.Quaternion().setFromAxisAngle(centre, -swing)
    const a = seen(swing ? { position: far.position.clone().applyQuaternion(back), quaternion: back.clone().multiply(far.quaternion), vfov: far.vfov } : far)
    const b = seen(low)
    const h = Math.exp(mix(Math.log(Math.max(a.h, 1e-9)), Math.log(Math.max(b.h, 1e-9)), share))
    const out = slerpDir(a.out, b.out, turn)
    const lift = centre.dot(out)
    const range = (h * (2 + h)) / (lift + Math.sqrt(lift * lift + h * (2 + h)))
    const position = centre.clone().addScaledVector(out, range)
    const upright = path.level ? smooth(turn / path.levelBy) : turn
    const quaternion = lookAt(position, centre, ahead).multiply(a.rel.slerp(b.rel, upright))
    if (swing) {
      const on = new THREE.Quaternion().setFromAxisAngle(centre, swing * (1 - upright))
      position.applyQuaternion(on)
      quaternion.premultiply(on)
    }
    return { position, quaternion, vfov: mix(far.vfov, low.vfov, share) }
  }

  private swing(kind: 'dive' | 'rise', at: number, far: Pose, centre: THREE.Vector3, ahead: THREE.Vector3): number {
    const upright = this.unrolled(far, centre, ahead)
    const side = new THREE.Vector3().crossVectors(centre, ahead)
    const rel = far.position.clone().sub(centre)
    const along = rel.dot(ahead)
    const across = rel.dot(side)
    const [from, to] = config.raw.handover.zenithDeg as [number, number]
    const weight = smooth((THREE.MathUtils.radToDeg(Math.atan2(Math.hypot(along, across), rel.dot(centre))) - from) / (to - from))
    if (weight <= 0) return upright
    const azimuth = Math.atan2(across, along)
    const key = kind + '|' + at
    let hit = this.leans.find((l) => l.key === key)
    if (!hit) {
      const end = kind === 'dive' ? this.seg.dive!.start : this.seg.rise.end
      const pose = kind === 'dive' ? this.hold(end - this.seg.hold.start) : this.after(end)
      const t = this.target(kind, at, end)
      const off = pose.position.clone().sub(t.centre)
      hit = { key, front: Math.cos(this.unrolled(pose, t.centre, t.ahead) - Math.atan2(off.dot(new THREE.Vector3().crossVectors(t.centre, t.ahead)), off.dot(t.ahead))) > 0 }
      if (this.leans.length > 8) this.leans.length = 0
      this.leans.push(hit)
    }
    const flat = (hit.front ? azimuth : azimuth - Math.PI) - upright
    return upright + weight * Math.atan2(Math.sin(flat), Math.cos(flat))
  }

  private unrolled(far: Pose, centre: THREE.Vector3, ahead: THREE.Vector3): number {
    const look = lookAt(far.position, centre, ahead)
    const rel = look.clone().invert().multiply(far.quaternion)
    const twist = 2 * Math.atan2(rel.z, rel.w)
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(look)
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(look)
    const side = new THREE.Vector3().crossVectors(centre, ahead)
    const gx = -Math.sin(twist)
    const gy = Math.cos(twist)
    const ax = ahead.dot(right)
    const ay = ahead.dot(up)
    const bx = side.dot(right)
    const by = side.dot(up)
    const angle = Math.atan2(-(ax * gy - ay * gx), bx * gy - by * gx)
    const along = (Math.cos(angle) * ax + Math.sin(angle) * bx) * gx + (Math.cos(angle) * ay + Math.sin(angle) * by) * gy
    const turnBy = along >= 0 ? angle : angle + Math.PI
    return Math.atan2(Math.sin(turnBy), Math.cos(turnBy))
  }

  coast(kind: 'dive' | 'rise', time: number): Pose {
    const h = handoverOf(this.id, kind)!
    const key = kind + '|' + h.time
    let hit = this.coasts.find((c) => c.key === key)
    if (!hit) {
      const step = config.shutterFraction / (4 * config.fps)
      const at = this.closePose(kind, h.time)
      const a = this.closePose(kind, h.time - step)
      const b = this.closePose(kind, h.time + step)
      const turned = a.quaternion.clone().invert().multiply(b.quaternion)
      if (turned.w < 0) turned.set(-turned.x, -turned.y, -turned.z, -turned.w)
      const half = Math.hypot(turned.x, turned.y, turned.z)
      const angle = 2 * Math.atan2(half, turned.w)
      const spin = new THREE.Vector3(turned.x, turned.y, turned.z).multiplyScalar(half > 1e-12 ? angle / half / (2 * step) : 0)
      hit = { key, position: at.position.clone(), velocity: b.position.clone().sub(a.position).multiplyScalar(1 / (2 * step)), quaternion: at.quaternion.clone(), spin, vfov: at.vfov }
      if (this.coasts.length > 8) this.coasts.length = 0
      this.coasts.push(hit)
    }
    const span = config.raw.handover.coastFrames / config.fps
    const reach = span > 0 ? span * Math.tanh((time - h.time) / span) : 0
    const rate = hit.spin.length()
    const turn = rate > 1e-12 ? new THREE.Quaternion().setFromAxisAngle(hit.spin.clone().multiplyScalar(1 / rate), rate * reach) : new THREE.Quaternion()
    return { position: hit.position.clone().addScaledVector(hit.velocity, reach), quaternion: hit.quaternion.clone().multiply(turn), vfov: hit.vfov }
  }

  private descent(time: number): Pose {
    const seg = this.seg.dive!
    const h = handoverOf(this.id, 'dive')!
    if (time >= h.time) return this.twin(this.diveTerrain(time), time)
    const d = this.handoverPath('dive')
    const x = (time - seg.start) / (h.time - seg.start)
    return this.glide('dive', time, this.sidestep('dive', this.hold(time - this.seg.hold.start), x, h.time, time), this.twin(this.coast('dive', time), time), trapeze(x, d.rise, d.fall), trapeze(x, d.turnRise, d.turnFall), h.time)
  }

  private ascent(time: number): Pose {
    const seg = this.seg.rise
    const h = handoverOf(this.id, 'rise')!
    if (time <= h.time) return this.twin(this.risePose(time, 'terrain'), time)
    const d = this.handoverPath('rise')
    const x = (seg.end - time) / (seg.end - h.time)
    return this.glide('rise', time, this.sidestep('rise', this.after(time), x, h.time, time), this.twin(this.coast('rise', time), time), trapeze(x, d.rise, d.fall), trapeze(x, d.turnRise, d.turnFall), h.time)
  }

  private coverFractions(seg: Segment): { first: number; center: number; last: number } {
    const w = coverFrames(seg)!
    const h = seg.kind === 'dive' || seg.kind === 'rise' ? handoverOf(this.id, seg.kind) : null
    const center = h ? (h.time * config.fps - seg.firstFrame) / seg.frames : (w.centerFrame - seg.firstFrame) / seg.frames
    return { first: (w.firstFrame - seg.firstFrame) / seg.frames, center, last: (w.lastFrame + 1 - seg.firstFrame) / seg.frames }
  }

  skyGain(_time: number): number {
    return 1
  }

  skyUnderCover(amount: number, _time: number): number {
    return Math.pow(1 - amount, 2)
  }

  coverHidden(_seg: Segment, _time: number): number | undefined {
    return undefined
  }

  // Three schedules of the sky on the globe side of a dive or rise that hands over run on the film's clock. A stop whose path runs at a pace of
  // its own may give each of them itself. Every one returns null by default, and then the engine's own schedule is taken.

  // The share of each sky layer: low is the weight of the sky of the close view (it also sets the floor, the glow and the exposure the sky
  // takes from the close view), high the weight of the sky of the globe view. Null leaves both to the engine: low is skyWeight of the
  // handover, high is 1 minus low in a dive and 0 in a rise. A stop may give low alone.
  skyShare(_seg: Segment, _time: number): SkyShares | null {
    return null
  }

  // The weight, 0 to 1, of the carry: how far the sky has turned from the globe view's frame to the close view's (the carry of the stars and
  // the turn towards the low turn). Null: skyTurnWeight of the handover.
  skyCarryShare(_seg: Segment, _time: number): number | null {
    return null
  }

  // The time the star lift of a rise is read at, in seconds of the film. Null: the time of the shot.
  skyLiftAt(_seg: Segment, _time: number): number | null {
    return null
  }

  skyTurnShare(seg: Segment, time: number): number | null {
    const w = coverWindow(seg)
    if (!w || (seg.kind !== 'dive' && seg.kind !== 'rise') || !this.p.skyTurnEase?.[seg.kind]) return null
    const k = smoother(ramp(w.firstFrame / config.fps, (w.lastFrame + 1) / config.fps, time))
    return seg.kind === 'dive' ? k : 1 - k
  }

  glareCarry(seg: Segment, time: number): number {
    if (seg.kind !== 'dive' && seg.kind !== 'rise') return 0
    const span = this.p.light.glareCarry?.[seg.kind]
    if (!span || !coverWindow(seg)) return 0
    const since = seg.kind === 'dive' ? this.coverCenter(seg) - time : time - this.coverCenter(seg)
    return 1 - smoother(ramp(0, span, since))
  }

  coverAmount(seg: Segment, time: number): number {
    const w = coverWindow(seg)
    if (!w) return 0
    const a = w.firstFrame / config.fps
    const b = (w.lastFrame + 1) / config.fps
    if (time <= a || time >= b) return 0
    const edge = this.p.coverEdge
    if (!edge) {
      const c = w.centerFrame / config.fps
      return time < c ? smooth((time - a) / (c - a)) : smooth((b - time) / (b - c))
    }
    const x = (time - a) / (b - a)
    const [first, last] = seg.kind === 'dive' ? edge : this.p.coverEdgeRise ?? [edge[1], edge[0]]
    return Math.min(smooth(x / first), smooth((1 - x) / last))
  }

  coverSide(seg: Segment, time: number): number {
    const w = coverWindow(seg)
    if (!w) return 0
    const a = w.firstFrame / config.fps
    const b = (w.lastFrame + 1) / config.fps
    const k = smooth(ramp(0.25, 0.75, (time - a) / (b - a)))
    return seg.kind === 'dive' ? k : 1 - k
  }

  coverCenter(seg: Segment): number {
    const h = seg.kind === 'dive' || seg.kind === 'rise' ? handoverOf(this.id, seg.kind) : null
    return h ? h.time : coverFrames(seg)!.centerFrame / config.fps
  }

  horizon(view: 'orbit' | 'terrain', local: Pose): CoverHorizon {
    let nadir: THREE.Vector3
    let alpha: number
    if (view === 'orbit') {
      nadir = local.position.clone().normalize().negate()
      alpha = Math.asin(Math.min(1 / local.position.length(), 1))
    } else {
      const t = this.p.terrain
      alpha = Math.PI / 2 - THREE.MathUtils.degToRad(t.dipDeg ?? 2)
      const e = THREE.MathUtils.degToRad(t.horizonDeg ?? 0) - alpha
      nadir = new THREE.Vector3(0, Math.sin(e), -Math.cos(e))
      if (t.rollDeg) nadir.applyAxisAngle(new THREE.Vector3(0, 0, 1), -THREE.MathUtils.degToRad(t.rollDeg))
    }
    nadir.applyQuaternion(local.quaternion.clone().invert())
    const theta = Math.acos(Math.min(Math.max(-nadir.z, -1), 1))
    const len = Math.hypot(nadir.x, nadir.y)
    const normal: [number, number] = len > 1e-5 ? [-nadir.x / len, -nadir.y / len] : [0, 1]
    const gap = Math.min(Math.max(theta - alpha, -1.4), 1.4)
    return { normal, offset: Math.tan(gap), soft: 0.22 }
  }

  private entry(time: number): { g: number; rate: number } {
    const seg = this.seg.dive!
    const dur = seg.end - seg.start
    const f = this.coverFractions(seg)
    const u = (time - seg.start) / dur
    const x = Math.min(Math.max((1 - u) / (1 - f.first), 0), 1)
    return { g: Math.pow(x, 2.2), rate: (2.2 * Math.pow(x, 1.2)) / ((1 - f.first) * dur) }
  }

  private diveTerrain(time: number): Pose {
    const t = this.p.terrain
    const base = this.terrain(time - this.seg.terrain.start)
    const { g } = this.entry(time)
    const yaw = THREE.MathUtils.degToRad(t.entryYawDeg ?? 0)
    const turn = new THREE.Quaternion().setFromEuler(new THREE.Euler(-THREE.MathUtils.degToRad(t.entryPitchDeg) * g, yaw * g, THREE.MathUtils.degToRad(t.entryRollDeg ?? 0) * g, 'YXZ'))
    return {
      position: base.position.clone().add(new THREE.Vector3(0.5 * t.entryBack * yaw * g * g, t.entryHeight * g, t.entryBack * g)),
      quaternion: base.quaternion.clone().multiply(turn),
      vfov: t.vfov,
    }
  }

  private swoop(time: number): Pose {
    const seg = this.seg.dive!
    const t = this.p.terrain
    const d = this.p.dive
    const center = this.coverCenter(seg)
    const span = center - seg.start
    const xr = Math.min(Math.max((time - seg.start) / span, 0), 1)
    const tau = center - time
    const at = this.entry(center)
    const unit = d.altitude / (1 + t.entryHeight * at.g)
    const start = this.hold(this.seg.hold.end - this.seg.hold.start)
    const h0 = start.position.length() - 1
    const h1 = d.altitude
    const endRate = (t.entryHeight * at.rate) / (1 + t.entryHeight * at.g)
    const m1 = (endRate * span) / Math.log(h0 / h1)
    const e = d.surge ? surge(d.surge, m1, xr) : hermite(xr, m1)
    const x = d.surge ? unhermite(e, m1) : xr
    const h = h0 * Math.pow(h1 / h0, e)
    const k = (h - h1) / (h0 - h1)
    const tq = this.turn(time)
    const spot = this.spot.clone().applyQuaternion(tq)
    const normal = this.normal.clone().applyQuaternion(tq)
    const heading = this.heading.clone().applyQuaternion(tq)
    const right = new THREE.Vector3().crossVectors(heading, normal)
    const uc = (center - this.seg.terrain.start) / (this.seg.terrain.end - this.seg.terrain.start) - 0.5
    const s1 = unit * (t.entryBack * at.g - t.forward * uc)
    const v = unit * (t.entryBack * at.rate + t.forward / (this.seg.terrain.end - this.seg.terrain.start))
    const yaw = THREE.MathUtils.degToRad(t.entryYawDeg ?? 0)
    const thetaC = yaw * at.g
    const thetaRate = yaw * at.rate
    const b = smooth(ramp(0.2, 0.8, x))
    const endDir = spot.clone().addScaledVector(heading, -s1).normalize()
    const ground = slerpDir(start.position.clone().normalize(), endDir, 1 - k)
    const side = new THREE.Vector3().crossVectors(start.position, endDir).normalize()
    ground.addScaledVector(heading, -v * tau * b).addScaledVector(right, v * (thetaC * tau + 0.5 * thetaRate * tau * tau) * b).addScaledVector(side, d.bow * Math.sin(Math.PI * e) * k).normalize()
    const position = ground.clone().multiplyScalar(1 + h)
    const up0 = Y.clone().applyQuaternion(start.quaternion)
    const far = start.position.clone().addScaledVector(new THREE.Vector3(0, 0, -1).applyQuaternion(start.quaternion), start.position.length())
    const target = far.lerp(spot.clone().addScaledVector(heading, d.ahead), smooth(x * 1.2))
    const toTarget = target.sub(position).normalize()
    const level = heading.clone().addScaledVector(ground, -heading.dot(ground)).normalize().applyAxisAngle(ground, thetaC + thetaRate * tau * b)
    const dip = Math.acos(1 / (1 + h))
    const pitch = dip + THREE.MathUtils.degToRad((t.horizonDeg ?? 0) + t.entryPitchDeg * at.g + (t.entryDipDeg ?? 0))
    const final = level.clone().multiplyScalar(Math.cos(pitch)).addScaledVector(ground, -Math.sin(pitch))
    const w = smoother(ramp(0, d.level ?? 0.97, x))
    const aim = slerpDir(toTarget, final, w)
    const up = slerpDir(up0, ground.clone().add(level).normalize(), smooth(x))
    const roll = ((t.entryRollDeg ?? 0) * at.g + (t.rollDeg ?? 0)) * smooth(ramp(0.3, 0.92, x)) + d.rollDeg * Math.sin(Math.PI * Math.min(x * 1.15, 1))
    return { position, quaternion: lookAt(position, position.clone().add(aim), up, roll), vfov: mix(start.vfov, t.vfov, smooth(x)) }
  }

  dive(time: number): OrbitShot {
    const view = sideAt(this.seg.dive!, time)
    return { pose: this.divePose(time, view), view }
  }

  rise(time: number): OrbitShot {
    const view = sideAt(this.seg.rise, time)
    return { pose: this.risePose(time, view), view }
  }

  divePose(time: number, view: ViewKind): Pose {
    const seg = this.seg.dive!
    const dur = seg.end - seg.start
    const u = (time - seg.start) / dur
    const f = this.coverFractions(seg)
    if (view === 'terrain') return this.diveTerrain(time)
    if (this.handsOver) return this.descent(time)
    const held = this.hold(time - this.seg.hold.start)
    if (this.p.dive.swoop) return blendPose(held, this.swoop(time), smooth(u / 0.22))
    const start = this.hold(this.seg.hold.end - this.seg.hold.start)
    const e = easeIn(ramp(0, f.last, u))
    const d = this.p.dive
    const tq = this.turn(time)
    const spot = this.spot.clone().applyQuaternion(tq)
    const normal = this.normal.clone().applyQuaternion(tq)
    const heading = this.heading.clone().applyQuaternion(tq)
    const arrive = spot.clone().addScaledVector(normal, d.altitude).addScaledVector(heading, -d.back)
    const span = start.position.clone().sub(arrive)
    const k = Math.pow(d.altitude / span.length(), e)
    const bow = new THREE.Vector3().crossVectors(span, normal).normalize().multiplyScalar(Math.sin(Math.PI * e) * d.bow * span.length() * k)
    const position = arrive.clone().addScaledVector(span, k).add(bow)
    if (this.p.spot.on !== 'rings' && position.length() < 1 + d.altitude * 0.6) position.setLength(1 + d.altitude * 0.6)
    const far = start.position.clone().addScaledVector(new THREE.Vector3(0, 0, -1).applyQuaternion(start.quaternion), start.position.length())
    const target = far.lerp(spot.clone().addScaledVector(heading, d.ahead), smooth(e * 1.4))
    const up = slerpDir(Y.clone().applyQuaternion(start.quaternion), normal, smooth(e * 1.2))
    const path: Pose = { position, quaternion: lookAt(position, target, up, d.rollDeg * Math.sin(Math.PI * e)), vfov: mix(start.vfov, this.p.terrain.vfov, smooth(e)) }
    return blendPose(held, path, smooth(u / 0.3))
  }

  // The close view of a rise that leaves from the eye of the dive (handover.rise.path.fromDive, off unless the stop asks): the stop's own close
  // path is led over to the close pose the dive handed over at, complete at the T of the rise and carried on beyond it at the same rate, so the
  // coast and the glide after T go on in the direction the camera was moving. Without the option the pose comes back untouched.
  private fromDive(own: Pose, time: number): Pose {
    const power = this.p.handover?.rise?.path?.fromDive
    if (power === undefined) return own
    const h = handoverOf(this.id, 'rise')
    const d = handoverOf(this.id, 'dive')
    if (!h || !d) return own
    const start = this.seg.rise.start
    const s = (time - start) / (h.time - start)
    if (!(s > 0)) return own
    const w = Math.pow(s, power)
    const to = this.divePose(d.time, 'terrain')
    const turn = own.quaternion.clone().invert().multiply(to.quaternion)
    if (turn.w < 0) turn.set(-turn.x, -turn.y, -turn.z, -turn.w)
    const half = Math.hypot(turn.x, turn.y, turn.z)
    const angle = 2 * Math.atan2(half, turn.w)
    const quaternion = own.quaternion.clone()
    if (half > 1e-12) quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(turn.x, turn.y, turn.z).multiplyScalar(1 / half), angle * w))
    return { position: own.position.clone().lerp(to.position, w), quaternion, vfov: own.vfov + (to.vfov - own.vfov) * Math.min(w, 1) }
  }

  risePose(time: number, view: ViewKind): Pose {
    const seg = this.seg.rise
    const dur = seg.end - seg.start
    const u = (time - seg.start) / dur
    const f = this.coverFractions(seg)
    const t = this.p.terrain
    if (view === 'terrain') {
      const base = this.terrain(time - this.seg.terrain.start)
      const g = Math.pow(ramp(0, f.last, u), 2.2)
      return this.fromDive({
        position: base.position.clone().add(new THREE.Vector3(0, t.exitHeight * g, -t.exitForward * g)),
        quaternion: base.quaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(t.exitPitchDeg) * g)),
        vfov: t.vfov,
      }, time)
    }
    if (this.handsOver) return this.ascent(time)
    const settle = this.p.rise.settle
    const x = ramp(f.center, 1, u)
    const e = settle ? 1 - Math.pow(1 - x, settle) * (this.p.rise.gentle ? 1 + settle * x : 1) : easeRise(ramp(f.first, 1, u))
    const d = this.p.dive
    const end = this.after(seg.end)
    const tq = this.turn(time)
    const spot = this.spot.clone().applyQuaternion(tq)
    const normal = this.normal.clone().applyQuaternion(tq)
    const heading = this.heading.clone().applyQuaternion(tq)
    const ahead = this.p.rise.ahead ?? d.ahead
    const low = this.p.rise.from ?? d.altitude
    const from = spot.clone().addScaledVector(normal, low).addScaledVector(heading, ahead)
    const span = end.position.clone().sub(from)
    const ratio = span.length() / low
    const m = (Math.pow(ratio, e) - 1) / (ratio - 1)
    const up1 = span.dot(normal)
    const across = span.clone().addScaledVector(normal, -up1)
    const position = from.clone().addScaledVector(normal, up1 * m).addScaledVector(across, Math.pow(m, this.p.rise.hug ?? 1))
    const ground = spot.clone().addScaledVector(heading, ahead * 2)
    const aim = end.position.clone().addScaledVector(new THREE.Vector3(0, 0, -1).applyQuaternion(end.quaternion), end.position.length())
    const target = ground.lerp(aim, smooth(e * 1.15))
    const up = slerpDir(normal, Y.clone().applyQuaternion(end.quaternion), smooth(e))
    const path: Pose = { position, quaternion: lookAt(position, target, up), vfov: mix(t.vfov, end.vfov, smooth(e)) }
    const tilt = this.p.rise.tilt ?? 0
    const since = time - this.coverCenter(seg)
    if (this.p.rise.level) path.quaternion = this.climb(position, heading, e)
    else if (since < tilt) {
      const out = position.clone().normalize()
      const level = heading.clone().addScaledVector(out, -heading.dot(out)).normalize()
      const pitch = Math.acos(Math.min(1 / position.length(), 1)) + THREE.MathUtils.degToRad((t.horizonDeg ?? 0) - t.exitPitchDeg * Math.pow(ramp(0, f.last, f.center), 2.2) - (t.exitDipDeg ?? 0))
      const aim = level.clone().multiplyScalar(Math.cos(pitch)).addScaledVector(out, -Math.sin(pitch))
      const level0 = lookAt(position, position.clone().add(aim), out.clone().add(level).normalize(), t.rollDeg ?? 0)
      path.quaternion = level0.slerp(path.quaternion, smoother(since / tilt))
    }
    return blendPose(path, this.after(time), smooth(ramp(0.6, 1, u)))
  }

  exitPose(time: number): Pose {
    return this.exit(time - this.seg.rise.end)
  }
}

export { easeIn, easeInOut, easeOut }
