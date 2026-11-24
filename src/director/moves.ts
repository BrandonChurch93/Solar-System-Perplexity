import * as THREE from 'three'
import { config, type Segment } from '../config'
import { airAt } from '../core/air'
import type { Air, AirKnot, CoverHorizon, NearBody, Pose, ViewKind } from '../core/types'
import { handoverOf, oneMoveForced, sideAt, type HandoverParams, type Sidestep, type SkyShares } from './handover'
import { Bend, type BendShape } from './bend'
import { bellShare, bellStep, checkFlanks, paceLimits, type Flanks } from './pace'
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
  terrain: { vfov: number; gather?: number; forward: number; rise: number; side: number; yawDeg: number; pitchDeg: number; entryHeight: number; entryBack: number; entryPitchDeg: number; entryYawDeg?: number; entryRollDeg?: number; entryDipDeg?: number; exitHeight: number; exitForward: number; exitPitchDeg: number; exitDipDeg?: number; horizonDeg?: number; dipDeg?: number; rollDeg?: number; ground?: number; bend?: BendShape & { frames: number } }
  rise: { azimuthDeg: number; elevationDeg: number; distance: number; offset: [number, number]; driftSpeed: number; rollDeg: number; ahead?: number; hug?: number; tilt?: number; settle?: number; level?: boolean; pan?: number; gentle?: boolean; from?: number }
  travel: { turnDeg: number; side: number; turnEnd?: number; start?: number }
  arrive?: { swingDeg: number; axis: [number, number, number]; power?: number; from?: number; offset?: [number, number] }
  light: { exposure: number; skyExposure: number; terrainSkyGlow?: number; skyLow?: [number, number, number]; skyLift?: { heights?: [number, number]; power?: number }; sunRadiusDeg: number; sunGlare: number; flare: number; sunDir?: [number, number, number]; glareCarry?: { dive?: number; rise?: number } }
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
  // PLAN F, the one air of the stop: knots from the highest down (AirKnot in src/core/types.ts). Absent: the stop has no air of this kind.
  air?: AirKnot[]
  skyTurnEase?: { dive?: boolean; rise?: boolean }
  coverShell?: [number, number]
  coverSea?: { centre: [number, number, number]; radius: number; edge: [number, number] }
  coverRush?: { speed: number; reach: number; billow: [number, number, number]; streak: [number, number, number]; contrast: [number, number] }
  spinDegPerSecond: number
  moonDegPerSecond: number
  // The near bodies the stop names to the motion measure (StopPlan.nearBodies): the centre at the middle of the hold in the frame of the globe and
  // the radius of the sphere that holds the body, in radii. The body goes round the stop's axis by degPerSecond, by moonDegPerSecond where
  // that is not given. Not set: the stop names no body and every frame keeps its sample count.
  near?: NearParams[]
  tint: [number, number, number]
  skyAim?: { orbit?: [number, number, number]; terrain?: [number, number, number] }
}

export interface NearParams { centre: [number, number, number]; radius: number; degPerSecond?: number }

export interface SegmentTimes { hold: Segment; dive?: Segment; terrain: Segment; rise: Segment; travel?: Segment }

export interface OrbitShot { pose: Pose; view: 'orbit' | 'terrain' }

export interface TwinFrame { rotation: THREE.Quaternion; origin: THREE.Vector3; scale: number }

interface Target { key: string; centre: THREE.Vector3; ahead: THREE.Vector3 }
interface Coast { key: string; position: THREE.Vector3; velocity: THREE.Vector3; quaternion: THREE.Quaternion; spin: THREE.Vector3; vfov: number }
interface Lean { key: string; front: boolean }
interface Reach { key: string; start: number; step: number; reach: number[]; weight: number[] }

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
  private readonly reaches: Reach[] = []
  private readonly paces: { key: string; law: { pace: Flanks; turn: Flanks; liftPower: number } }[] = []
  private readonly swings: { key: string; angle: number }[] = []
  private backs: { from: object } | null = null
  private airs: { from: AirKnot[]; knots: AirKnot[] } | null = null
  private lifts: { from: number; to: number; power: number } | null = null
  private bent: { key: number[]; bend: Bend } | null = null

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

  // The far end of a rise, the pose the rise comes to rest on: the hold, where the rise goes into one, else the drift of the exit carried
  // back in time (exitPose), less the pull back.
  after(time: number): Pose {
    const back = this.pullBack(time)
    if (this.riseIntoHold) return this.hold(time - this.seg.hold.start)
    const pose = this.exitPose(time)
    if (back > 0) pose.position.addScaledVector(this.riseOut, -back)
    return pose
  }

  // THE PULL BACK (MAIL 602), a stop's option for a rise that a travel follows (handover.rise.pullBack of its params): how far the far
  // end of the rise stands back along the line of the exit at a time, in radii. A rise and the travel after it are one flight, so the
  // rise may end on its pose without coming to rest: the far end is then not the drift carried back alone, it comes out to the end pose
  // along the line of the exit (riseOut, the line from the body's centre through the end pose, the line the drift itself takes) and
  // reaches it at `speed` radii a second above the drift. The rise comes to rest on its far end as it always did, so at its last
  // instant the eye is on the end pose (riseEnd) and flies drift + speed along that line; the travel reads that speed from the path and
  // gives it up after the seam (the carry of src/space/travel). Its excess over the drift comes in over the last `over` seconds as a
  // smooth step (1 - 3 s^2 + 2 s^3, s the time to the end over `over`), so the far end leaves the drift without a step in its speed
  // or in its acceleration, and at the end the acceleration is 0: the eye coasts into the travel and does not speed up. Before those
  // seconds the far end stands back by speed * over / 2 and drifts as before.
  // Only the place moves: the far end keeps the camera's turn and angle of view of the end pose, and it moves on a line through the
  // body's centre, so the turn of the sky is at rest at the end as before and the body's centre stands still in the picture while its
  // disc goes on shrinking. Every path that glides onto after(time) gets it, the engine's one move and a stop's own alike.
  // Without the option the far end is the drift, to the bit. Refused where it cannot hold: a rise that no travel follows, a speed or a
  // span that is not above 0, a span longer than the rise or shorter than a film frame, a far end that would stand in the body.
  pullBack(time: number): number {
    const own = this.p.handover?.rise?.pullBack
    if (!own) return 0
    const { rise, travel } = this.seg
    if (this.backs?.from !== own) {
      const who = 'the pull back of the rise of ' + this.id + ' (handover.rise.pullBack)'
      if (this.riseIntoHold || !travel || Math.abs(travel.start - rise.end) > 1e-9) throw new Error(who + ': no travel follows this rise, so it comes to rest on its far end')
      if (!(own.speed > 0) || !(own.over > 0) || !Number.isFinite(own.speed) || !Number.isFinite(own.over)) throw new Error(who + ' needs speed, in radii a second above the drift, and over, in seconds, both above 0')
      if (own.over > rise.end - rise.start + 1e-9) throw new Error(who + ': over (' + own.over + ' s) is longer than the rise (' + (rise.end - rise.start) + ' s)')
      if (own.over < 1 / config.fps - 1e-9) throw new Error(who + ': over (' + own.over + ' s) is shorter than a film frame, a jolt in the picture and a switch of the law inside the step the travel reads the speed with')
      const low = this.riseEnd.position.length() - this.p.rise.driftSpeed * (rise.end - rise.start) - (own.speed * own.over) / 2 - 1
      if (!(low > 0)) throw new Error(who + ': with ' + own.speed + ' radii a second over ' + own.over + ' s the far end would stand ' + low.toFixed(3) + ' radii over the body where the rise begins; it must stay above it')
      this.backs = { from: own }
    }
    const left = rise.end - time
    if (left <= 0) return 0
    const s = Math.min(left / own.over, 1)
    return own.speed * own.over * (s - s * s * s + (s * s * s * s) / 2)
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

  // The surface view. A stop that names terrain.bend flies the last frames of it on a bend (bend.ts): from that many film frames before
  // its end the eye leaves the straight line, keeps the share of its height it flies a second and turns its way as the stop says; the lens
  // stays the straight path's own. A stop that names none flies the straight path, to the bit as before.
  terrain(tRel: number): Pose {
    const pose = this.straight(tRel)
    if (!this.p.terrain.bend) return pose
    const bend = this.bend()
    return tRel > bend.time ? { position: bend.position(tRel), quaternion: pose.quaternion, vfov: pose.vfov } : pose
  }

  private bend(): Bend {
    const t = this.p.terrain
    const shape = t.bend!
    const key = [shape.frames, shape.acrossDeg[0], shape.acrossDeg[1], shape.turnDeg, t.side, t.rise, t.forward, t.gather ?? 0, this.seg.terrain.start, this.seg.terrain.end]
    if (!this.bent || this.bent.key.some((x, i) => x !== key[i])) {
      const dur = this.seg.terrain.end - this.seg.terrain.start
      const span = shape.frames / config.fps
      if (!(shape.frames > 0) || !(span < dur)) throw new Error(this.id + ': frames of terrain.bend must be above 0 and under the length of the surface view')
      if (!key.every((x) => Number.isFinite(x))) throw new Error(this.id + ': terrain.bend needs frames, acrossDeg (azimuth and elevation) and turnDeg as numbers')
      const time = dur - span
      const position = this.straight(time).position
      // The straight path is a line run on one curve of time, so its velocity is the line times the slope of that curve.
      const velocity = new THREE.Vector3(t.side, t.rise, -t.forward).multiplyScalar((1 + 2 * (t.gather ?? 0) * (time / dur - 0.5)) / dur)
      const ground = this.closeGround(position, this.seg.terrain.start + time)
      const carry = config.raw.handover.carry as { stepsPerFrame: number }
      try {
        this.bent = { key, bend: new Bend({ time, span, position, velocity, up: ground.up, height: ground.height, step: 1 / (config.fps * carry.stepsPerFrame) }, shape) }
      } catch (e) {
        throw new Error(this.id + ': ' + (e as Error).message)
      }
    }
    return this.bent!.bend
  }

  // The ground under a point of the close view: its up as a unit vector and the point's height above the unit sphere, in the close view's
  // own frame and units, read through the twin and back, so a stop with a twin of its own is read on that.
  closeGround(position: THREE.Vector3, time: number): { up: THREE.Vector3; height: number } {
    const vfov = this.p.terrain.vfov
    const globe = this.twin({ position, quaternion: new THREE.Quaternion(), vfov }, time)
    const radius = globe.position.length()
    const lifted = this.untwin({ position: globe.position.clone().multiplyScalar((2 * radius - 1) / radius), quaternion: globe.quaternion, vfov }, time)
    const up = lifted.position.sub(position)
    const height = up.length()
    return { up: height > 0 ? up.multiplyScalar(1 / height) : this.closeUp().up, height: radius > 1 ? height : 0 }
  }

  private straight(tRel: number): Pose {
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
    return this.eye(kind, time, 'terrain')
  }

  // The place the camera goes down to and comes up from, and the heading it flies there: the point of the ground the close view looks at,
  // no farther than a share of the way to its horizon. On a path of the stop's own it is taken from the close pose at T. On the engine's
  // one move (plan E) it is taken from the surface view's own pose at the seam, so it does not move when T moves.
  private target(kind: 'dive' | 'rise', at: number, time: number): { centre: THREE.Vector3; ahead: THREE.Vector3 } {
    const one = this.engineMove
    if (one) at = this.eyeSeamTime(kind)
    const key = (one ? 'seam|' : '') + kind + '|' + at
    let hit = this.targets.find((t) => t.key === key)
    if (!hit) {
      const tw = one ? this.twin(this.terrain(at - this.seg.terrain.start), at) : this.twin(this.closePose(kind, at), at)
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

  // one: the engine's one move. The swing is then the one measured where the move leaves the far end and it is given back by the share of
  // the move, not measured again at every time: a far end that stands near the zenith of the place changes its azimuth fast while it hardly
  // moves, and a swing that followed it was a second motion under the glide.
  // liftPower (the one move only): the height runs with the lift of the eye's direction, the sine of its elevation over the ground of the
  // place, raised to that power: ln(height / lift^power) follows the share instead of ln(height). See eyeLaw.
  private glide(kind: 'dive' | 'rise', time: number, far: Pose, low: Pose, share: number, turn: number, at: number, one?: { swing: number; liftPower: number }): Pose {
    if (share <= 0 && turn <= 0) return far
    if (share >= 1 && turn >= 1) return low
    const { centre, ahead } = this.target(kind, at, time)
    const seen = (p: Pose): { h: number; out: THREE.Vector3; rel: THREE.Quaternion } => {
      const out = p.position.clone().sub(centre)
      const look = lookAt(p.position, centre, ahead)
      return { h: p.position.length() - 1, out: out.normalize(), rel: look.invert().multiply(p.quaternion) }
    }
    const path = this.handoverPath(kind)
    const swing = one ? one.swing : path.level ? this.swing(kind, at, far, centre, ahead) : 0
    const back = new THREE.Quaternion().setFromAxisAngle(centre, -swing)
    const a = seen(swing ? { position: far.position.clone().applyQuaternion(back), quaternion: back.clone().multiply(far.quaternion), vfov: far.vfov } : far)
    const b = seen(low)
    const out = slerpDir(a.out, b.out, turn)
    const lift = centre.dot(out)
    const power = one ? one.liftPower : 0
    const lifted = (x: number): number => Math.pow(Math.max(x, 1e-9), power)
    const h = power > 0 ? Math.exp(mix(Math.log(Math.max(a.h, 1e-9) / lifted(centre.dot(a.out))), Math.log(Math.max(b.h, 1e-9) / lifted(centre.dot(b.out))), share)) * lifted(lift) : Math.exp(mix(Math.log(Math.max(a.h, 1e-9)), Math.log(Math.max(b.h, 1e-9)), share))
    const range = (h * (2 + h)) / (lift + Math.sqrt(lift * lift + h * (2 + h)))
    const position = centre.clone().addScaledVector(out, range)
    const upright = one ? turn : path.level ? smooth(turn / path.levelBy) : turn
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
    const key = (this.engineMove ? 'seam|' : '') + kind + '|' + at
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

  // Plan E, the engine's one move. A dive and a rise are one glide over the whole segment between the two poses the film stands on at its
  // ends: the hold (or the drift out of the stop) at the far end, the surface view's own pose at the near end. One share, the integral of
  // one bell shaped rate (pace.ts), carries the logarithm of the height, the direction from the place, the attitude and the lens, so the
  // fall, the turn of the camera and the speed of the picture rise once and fall once together. Both ends move on at their own speed under
  // the glide (the hold goes on turning, the surface view is carried back from the seam at its own velocity), and the bell has no rate at
  // either end: the move leaves and meets its neighbours with their speed and direction.
  // There is one eye. The globe draws it as it stands, the close view draws the same eye taken back through the twin, so the moment the
  // picture changes sides (T, handover.dive.at and handover.rise.at) moves nothing on the path.
  // It is the default of every stop that hands over. A stop named in handover.ownPath keeps the path of its own class until its builder
  // takes the name off the list. What a stop on the one move may still set: its two ends (hold, terrain, rise.distance and the like), its
  // place (spot), at, path.sidestep, path.level and the flanks of the pace (handover.dive.pace, handover.rise.pace). What is not read on the
  // one move: terrain.entry* and terrain.exit*, path.rise, fall, turnRise, turnFall, levelBy and fromDive, and a class's own divePose,
  // risePose, dive and rise.
  get engineMove(): boolean {
    return this.handsOver && (oneMoveForced() || !(config.raw.handover.ownPath as string[]).includes(this.id))
  }

  // The camera of a dive or a rise in the given view. On the one move both views are the one eye; on a path of the stop's own they are
  // its divePose and risePose.
  eye(kind: 'dive' | 'rise', time: number, view: ViewKind): Pose {
    if (!this.engineMove) return kind === 'dive' ? this.divePose(time, view) : this.risePose(time, view)
    const globe = this.eyeOrbit(kind, time)
    return view === 'orbit' ? globe : this.untwin(globe, time)
  }

  // The camera of a dive or a rise with the view the film draws at that time, or with the view the caller forces.
  eyeShot(kind: 'dive' | 'rise', time: number, forced?: ViewKind): OrbitShot {
    if (!this.engineMove) return forced ? { pose: kind === 'dive' ? this.divePose(time, forced) : this.risePose(time, forced), view: forced } : kind === 'dive' ? this.dive(time) : this.rise(time)
    const seg = kind === 'dive' ? this.seg.dive : this.seg.rise
    if (!seg) throw new Error(this.id + ' has no ' + kind)
    const view = forced ?? sideAt(seg, time)
    return { pose: this.eye(kind, time, view), view }
  }

  // PLAN F, the one air of this stop at a height of the lens over its body, in radii (SetState.height); null for a stop without knots.
  // It takes a height and nothing else, so it is the same in the dive and in the rise and on both sides of a change of view. What the
  // highest knot leaves out of exposure, sky, sunRadius and glare is the stop's light (light.exposure, light.skyExposure,
  // light.sunRadiusDeg, light.sunGlare), and stars left out is 1, the flight's stars as they are. A stop's class gives other knots through
  // airKnots; it cannot replace this.
  air(height: number): Air | null {
    const from = this.airKnots()
    if (!from) return null
    if (!Array.isArray(from) || from.length === 0) throw new Error(this.id + ': an air needs at least one knot')
    if (this.airs?.from !== from) {
      const l = this.p.light
      this.airs = { from, knots: [{ exposure: l.exposure, sky: l.skyExposure, stars: 1, sunRadius: l.sunRadiusDeg, glare: l.sunGlare, ...from[0]! }, ...from.slice(1)] }
    }
    return airAt(this.airs.knots, height, this.id)
  }

  // The knots of this stop's air, from the highest down, or null: the stop's params by default. A class that builds them from values of
  // its own gives the same array at every call. It gets no time: the air is a function of the height alone.
  protected airKnots(): AirKnot[] | null {
    return this.p.air ?? null
  }

  // The height of the eye above the unit sphere of the body, in radii, at a time of this stop's hold, dive, surface view or rise. On the
  // one move it is one number for both views; on a path of the stop's own it is the height of the view the film draws.
  eyeHeight(time: number): number {
    const high = (p: Pose): number => p.position.length() - 1
    const { dive, terrain, rise } = this.seg
    if (time >= terrain.start && time < terrain.end) return high(this.twin(this.terrain(time - terrain.start), time))
    for (const [kind, seg] of [['dive', dive], ['rise', rise]] as const) {
      if (!seg || time < seg.start || time >= seg.end) continue
      if (this.engineMove) return high(this.eyeOrbit(kind, time))
      const shot = this.eyeShot(kind, time)
      return high(shot.view === 'terrain' ? this.twin(shot.pose, time) : shot.pose)
    }
    return high(this.riseIntoHold || time < terrain.start ? this.hold(time - this.seg.hold.start) : this.exitPose(time))
  }

  // The lift of the stars of the open flight over this stop at a height of the lens over its body, in radii (SetState.height): 0 the
  // stop's own sky, 1 the sky of the open flight. It takes a height and nothing else, so it is the same on both sides of a change of view,
  // at every pace and at every fraction of a frame: a smooth step of the logarithm of the height between two heights, lifted to
  // 1 - (1 - step)^power. A power above 1 brings the stars early, one under 1 late; at one half or less the lift meets the upper height
  // with a corner, which shows unless the lens stands still there. The stop names the two heights and the power under light.skyLift of
  // its params. Without heights they are the highest height of its surface view and the lowest of its hold: nothing lifts over the
  // surface view, and the stars stand whole where the hold flies. Without a power it is handover.skyLift.power of the config.
  // The film scales the lift by the level of the sky the segment ends in (FilmDirector.shotAt): the open flight's after a rise, the
  // stop's own in a hold and a dive, where nothing lifts.
  skyLift(height: number): number {
    const k = this.liftSpan()
    return 1 - Math.pow(1 - smooth(ramp(k.from, k.to, Math.log(Math.max(height, 1e-12)))), k.power)
  }

  // The two heights of skyLift, as logarithms, and its power: read once, at the first height asked for. The upper height may not lie
  // over the height the rise ends at, else the stars would step where the open flight takes over.
  private liftSpan(): { from: number; to: number; power: number } {
    if (this.lifts) return this.lifts
    const own = this.p.light.skyLift
    const power = own?.power ?? config.raw.handover.skyLift.power
    const { hold, terrain, rise } = this.seg
    const over = (seg: Segment, pick: (a: number, b: number) => number, first: number): number => {
      const n = Math.max(1, Math.round((seg.end - seg.start) * config.fps))
      let out = first
      for (let i = 0; i <= n; i++) out = pick(out, this.eyeHeight(Math.min(seg.start + ((seg.end - seg.start) * i) / n, seg.end - 1e-9)))
      return out
    }
    const [from, to] = own?.heights ?? [over(terrain, Math.max, -Infinity), over(hold, Math.min, Infinity)]
    const whose = own?.heights ? '' : ', the highest of its surface view and the lowest of its hold: the stop names heights of its own under light.skyLift'
    if (!(from > 0) || !(to > from)) throw new Error(this.id + ': the heights of the star lift must be two heights over the body, in radii, the first above 0 and the second above the first (they are ' + from + ' and ' + to + whose + ')')
    if (!(power > 0)) throw new Error(this.id + ': the power of the star lift must be above 0 (it is ' + power + ')')
    // the rise ends in the globe view, whatever side the harness has forced
    const end = this.eyeShot('rise', rise.end - 1e-9, 'orbit').pose.position.length() - 1
    if (end < to * (1 - 1e-6)) throw new Error(this.id + ': the upper height of the star lift (' + to + whose + ') lies over the height the rise ends at (' + end + '), so the stars would step where the open flight takes over')
    this.lifts = { from: Math.log(from), to: Math.log(to), power }
    return this.lifts
  }

  // The close view's pose of a camera at the globe: the twin undone. The twin of the engine is a turn, a scale and a shift, and so are
  // those of the stops as far as they are measured here, so three poses through the twin give them back. A stop whose twin is anything
  // else gives the plan an untwin of its own.
  untwin(globe: Pose, time: number): Pose {
    const zero = this.twin({ position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), vfov: globe.vfov }, time)
    const unit = this.twin({ position: new THREE.Vector3(1, 0, 0), quaternion: new THREE.Quaternion(), vfov: globe.vfov }, time)
    const back = zero.quaternion.clone().invert()
    return { position: globe.position.clone().sub(zero.position).applyQuaternion(back).multiplyScalar(1 / unit.position.distanceTo(zero.position)), quaternion: back.multiply(globe.quaternion), vfov: globe.vfov }
  }

  // The law of a dive or a rise on the one move, three things. pace: the flanks of the bell the height runs on. turn: the flanks of the
  // bell the eye's direction from the place and the camera's uprightness run on. liftPower: the height runs with the lift of that
  // direction (the sine of the eye's elevation over the ground of the place) to this power, so ln(height / lift^power) follows the bell.
  // Why three: the picture at the place moves by the change of ln(height) less one and a half times the change of ln(lift), so an eye
  // that swings up from low over the ground opens the ground while it climbs, and on one share for all the speed of the picture was
  // steeper than the rate of fall by the growth of that term (the rise of Mars: 0.097 of the mean a frame where the rate had 0.073).
  // With a power between 0 and 1.5 the rate and the speed share the term, and with flanks of its own the turn is gentle where the eye is
  // low and the term is large.
  // Each is the stop's own (handover.KIND of its params) where it sets one, else the film's for that kind (handover.KIND of the config)
  // where it has one, else handover.pace for both bells and 0 for the power: one share and the height alone, the move as it was.
  // Flanks too short for the segment are refused here, where the number is read: the steepest slope of a bell may not pass the step the
  // harness allows from one film frame to the next (smooth.path.maxStep).
  // A stop may give a flank of either bell two corners in place of the one (pace.corners, turn.corners; Flanks in pace.ts). The film's
  // law has none, and a bell without them is computed as before.
  eyeLaw(kind: 'dive' | 'rise'): { pace: Flanks; turn: Flanks; liftPower: number } {
    const seg = kind === 'dive' ? this.seg.dive : this.seg.rise
    if (!seg) throw new Error(this.id + ' has no ' + kind)
    const own = this.p.handover?.[kind]
    const film = config.raw.handover[kind] as { pace?: Flanks; turn?: Flanks; liftPower?: number }
    const base = film.pace ?? config.raw.handover.pace
    const key = kind + '|' + JSON.stringify([own?.pace ?? null, own?.turn ?? null, own?.liftPower ?? null, base, film.turn ?? null, film.liftPower ?? null])
    let hit = this.paces.find((p) => p.key === key)
    if (!hit) {
      const limit = paceLimits().maxStep
      const checked = (flanks: Flanks, what: string): Flanks => {
        checkFlanks(flanks, 'the ' + kind + ' of ' + this.id)
        const step = bellStep(flanks, seg.frames)
        if (step > limit) throw new Error('the ' + kind + ' of ' + this.id + ': with flanks of ' + flanks.rise + ' and ' + flanks.fall + ' and a corner of ' + flanks.corner + (flanks.corners ? ' and corners of ' + JSON.stringify(flanks.corners) : '') + ' the ' + what + ' changes by ' + step.toFixed(4) + ' of its mean from one film frame to the next, the limit is ' + limit)
        return flanks
      }
      const two = (c: Flanks['corners']): { corners?: Flanks['corners'] } => (c ? { corners: c } : {})
      const pace = checked({ rise: own?.pace?.rise ?? base.rise, fall: own?.pace?.fall ?? base.fall, corner: own?.pace?.corner ?? base.corner, ...two(own?.pace?.corners) }, 'rate')
      const from = film.turn ?? pace
      const turn = own?.turn || film.turn ? checked({ rise: own?.turn?.rise ?? from.rise, fall: own?.turn?.fall ?? from.fall, corner: own?.turn?.corner ?? from.corner, ...two(own?.turn?.corners) }, 'turn') : pace
      const liftPower = own?.liftPower ?? film.liftPower ?? 0
      if (!(liftPower >= 0 && liftPower <= 2)) throw new Error('the ' + kind + ' of ' + this.id + ': liftPower must lie between 0 and 2')
      hit = { key, law: { pace, turn, liftPower } }
      if (this.paces.length > 8) this.paces.length = 0
      this.paces.push(hit)
    }
    return hit.law
  }

  // The flanks of the pace of a dive or a rise on the one move (eyeLaw).
  eyeFlanks(kind: 'dive' | 'rise'): Flanks {
    return this.eyeLaw(kind).pace
  }

  private eyeSeamTime(kind: 'dive' | 'rise'): number {
    return kind === 'dive' ? this.seg.terrain.start : this.seg.terrain.end
  }

  // The surface view's own pose at the seam, and how it moves there. The velocity and the spin are taken from inside the surface view
  // alone (a one sided difference over three poses), so a stop's terrain need not be defined beyond its own segment.
  private eyeSeam(kind: 'dive' | 'rise'): Coast {
    const key = 'seam|' + kind
    let hit = this.coasts.find((c) => c.key === key)
    if (!hit) {
      const sign = kind === 'dive' ? 1 : -1
      const step = (sign * config.shutterFraction) / (4 * config.fps)
      const from = this.eyeSeamTime(kind) - this.seg.terrain.start
      const at = this.terrain(from)
      const a = this.terrain(from + step)
      const b = this.terrain(from + 2 * step)
      const turned = (p: Pose): THREE.Vector3 => {
        const q = at.quaternion.clone().invert().multiply(p.quaternion)
        if (q.w < 0) q.set(-q.x, -q.y, -q.z, -q.w)
        const half = Math.hypot(q.x, q.y, q.z)
        return new THREE.Vector3(q.x, q.y, q.z).multiplyScalar(half > 1e-12 ? (2 * Math.atan2(half, q.w)) / half : 0)
      }
      const velocity = at.position.clone().multiplyScalar(-3).addScaledVector(a.position, 4).addScaledVector(b.position, -1).multiplyScalar(1 / (2 * step))
      const spin = turned(a).multiplyScalar(4).addScaledVector(turned(b), -1).multiplyScalar(1 / (2 * step))
      hit = { key, position: at.position.clone(), velocity, quaternion: at.quaternion.clone(), spin, vfov: at.vfov }
      if (this.coasts.length > 8) this.coasts.length = 0
      this.coasts.push(hit)
    }
    return hit
  }

  // How far the near end of the one move is carried on beyond the seam, in seconds of the surface view's own motion at the seam.
  // It is no count of frames: the surface view's motion goes out of the near end as the move itself goes on. Its carried part is the
  // share of the move that is still to do (1 at the seam, 0 at the far end) raised to handover.carry.power, and the reach is the sum of
  // that from the seam. So the eye leaves the seam at the surface view's own velocity and spin, keeps that drift under the move for as long
  // as the move is slow, and the drift is gone where the move is fast. A fixed span of frames let the drift die before the move had picked
  // up, and the speed of the picture fell before it rose (the rise of Earth forced onto the one move: 0.18 of the mean with 8 frames,
  // 0.07 with this). The sum is taken handover.carry.stepsPerFrame times a film frame; between those times the reach is a cubic through
  // the sums with the carried part as its slope, so it holds at any fraction of a frame.
  private eyeReach(kind: 'dive' | 'rise', time: number): number {
    const seg = kind === 'dive' ? this.seg.dive : this.seg.rise
    if (!seg) throw new Error(this.id + ' has no ' + kind)
    const carry = config.raw.handover.carry as { power: number; stepsPerFrame: number }
    const pace = this.eyeLaw(kind).pace
    const key = kind + '|' + JSON.stringify([pace, carry, seg.start, seg.end])
    let hit = this.reaches.find((r) => r.key === key)
    if (!hit) {
      const dive = kind === 'dive'
      const n = Math.max(Math.round(seg.frames * carry.stepsPerFrame), 2)
      const step = (seg.end - seg.start) / n
      const weight: number[] = []
      for (let i = 0; i <= n; i++) weight.push(Math.pow(bellShare(dive ? i / n : 1 - i / n, pace), carry.power))
      const reach: number[] = new Array<number>(n + 1).fill(0)
      if (dive) for (let i = n - 1; i >= 0; i--) reach[i] = reach[i + 1]! - ((weight[i]! + weight[i + 1]!) / 2) * step
      else for (let i = 1; i <= n; i++) reach[i] = reach[i - 1]! + ((weight[i - 1]! + weight[i]!) / 2) * step
      hit = { key, start: seg.start, step, reach, weight }
      if (this.reaches.length > 8) this.reaches.length = 0
      this.reaches.push(hit)
    }
    const u = Math.min(Math.max((time - hit.start) / hit.step, 0), hit.reach.length - 1)
    const i = Math.min(Math.floor(u), hit.reach.length - 2)
    const s = u - i
    const s2 = s * s
    const s3 = s2 * s
    return (2 * s3 - 3 * s2 + 1) * hit.reach[i]! + (s3 - 2 * s2 + s) * hit.weight[i]! * hit.step + (-2 * s3 + 3 * s2) * hit.reach[i + 1]! + (s3 - s2) * hit.weight[i + 1]! * hit.step
  }

  // The near end of the one move: the surface view's pose at the seam carried on beyond the seam at the velocity and the spin it has there,
  // as far as eyeReach says, so the end the glide lands on is already moving as the surface view will.
  private eyeCoast(kind: 'dive' | 'rise', time: number): Pose {
    const c = this.eyeSeam(kind)
    const reach = this.eyeReach(kind, time)
    const rate = c.spin.length()
    const turn = rate > 1e-12 ? new THREE.Quaternion().setFromAxisAngle(c.spin.clone().multiplyScalar(1 / rate), rate * reach) : new THREE.Quaternion()
    return { position: c.position.clone().addScaledVector(c.velocity, reach), quaternion: c.quaternion.clone().multiply(turn), vfov: c.vfov }
  }

  // The swing of the one move: how far the far end stands round the place from the vertical plane the close view flies in, measured once,
  // where the move leaves the far end (the last pose of the hold, the first of the drift out). 0 for a stop that sets path.level false.
  private eyeSwing(kind: 'dive' | 'rise'): number {
    if (!this.handoverPath(kind).level) return 0
    const key = 'seam|' + kind
    let hit = this.swings.find((w) => w.key === key)
    if (!hit) {
      const end = kind === 'dive' ? this.seg.dive!.start : this.seg.rise.end
      const far = kind === 'dive' ? this.hold(end - this.seg.hold.start) : this.after(end)
      const seam = this.eyeSeamTime(kind)
      const { centre, ahead } = this.target(kind, seam, end)
      hit = { key, angle: this.swing(kind, seam, far, centre, ahead) }
      if (this.swings.length > 8) this.swings.length = 0
      this.swings.push(hit)
    }
    return hit.angle
  }

  // The one eye at the globe.
  private eyeOrbit(kind: 'dive' | 'rise', time: number): Pose {
    const seg = kind === 'dive' ? this.seg.dive : this.seg.rise
    if (!seg) throw new Error(this.id + ' has no ' + kind)
    const dive = kind === 'dive'
    const x = dive ? (time - seg.start) / (seg.end - seg.start) : (seg.end - time) / (seg.end - seg.start)
    const far = dive ? this.hold(time - this.seg.hold.start) : this.after(time)
    if (x <= 0) return far
    if (x >= 1) return this.twin(this.terrain(time - this.seg.terrain.start), time)
    return this.eyeGlide(kind, time, x, far, this.eyeCoast(kind, time))
  }

  // The one move between its far end and a near end given in the close view's frame.
  private eyeGlide(kind: 'dive' | 'rise', time: number, x: number, far: Pose, low: Pose): Pose {
    const law = this.eyeLaw(kind)
    const share = bellShare(x, law.pace)
    const turn = law.turn === law.pace ? share : bellShare(x, law.turn)
    const seam = this.eyeSeamTime(kind)
    return this.glide(kind, time, this.sidestep(kind, far, x, seam, time), this.twin(low, time), share, turn, seam, { swing: this.eyeSwing(kind), liftPower: law.liftPower })
  }

  // The way the one move alone takes the eye from the seam with the surface view: the surface view held at rest in its pose at the seam,
  // and the eye one film frame on the move's side of it. A unit vector in the close view's frame that points away from the seam. A
  // surface view that leaves (or enters) along this line, at the speed it has, meets the move without a dent (ruling d196); nothing in
  // the picture reads it: it is a measure for the stop that shapes its surface view (tools/seam.ts prints it).
  eyeFirstWay(kind: 'dive' | 'rise'): THREE.Vector3 {
    const seg = kind === 'dive' ? this.seg.dive : this.seg.rise
    if (!seg) throw new Error(this.id + ' has no ' + kind)
    const dive = kind === 'dive'
    const c = this.eyeSeam(kind)
    const rest: Pose = { position: c.position, quaternion: c.quaternion, vfov: c.vfov }
    const time = this.eyeSeamTime(kind) + (dive ? -1 : 1) / config.fps
    const x = dive ? (time - seg.start) / (seg.end - seg.start) : (seg.end - time) / (seg.end - seg.start)
    const far = dive ? this.hold(time - this.seg.hold.start) : this.after(time)
    return this.untwin(this.eyeGlide(kind, time, x, far, rest), time).position.sub(rest.position).normalize()
  }

  private coverFractions(seg: Segment): { first: number; center: number; last: number } {
    const w = coverFrames(seg)!
    const h = seg.kind === 'dive' || seg.kind === 'rise' ? handoverOf(this.id, seg.kind) : null
    const center = h ? (h.time * config.fps - seg.firstFrame) / seg.frames : (w.centerFrame - seg.firstFrame) / seg.frames
    return { first: (w.firstFrame - seg.firstFrame) / seg.frames, center, last: (w.lastFrame + 1 - seg.firstFrame) / seg.frames }
  }

  // The near bodies of the stop at a time, for the motion measure of a frame: the sample count follows the fastest of them that is in the
  // frame (core/motion nearMotion), so a moon that crosses the picture far faster than the planet behind it is drawn as one clean smear. None
  // by default. A stop names them in its params (near), or gives this method itself where its body moves by another rule than a turn about
  // the stop's axis. The answer is a function of the time alone.
  nearBodies(time: number): NearBody[] {
    const named = this.p.near
    if (!named || !named.length) return []
    return named.map((n) => ({ centre: v3(n.centre).applyAxisAngle(this.axis, THREE.MathUtils.degToRad(n.degPerSecond ?? this.p.moonDegPerSecond) * (time - this.holdMid)), radius: n.radius }))
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

  // The star lift of a rise by the clock, as it was before skyLift: a time, in seconds of the film, the old course from the change of view
  // to the end of the rise is read at, in the globe view alone. Null: the lift is skyLift of the height of the lens, in both views. Kept
  // for the stops that still give a time; a stop moves to the heights of light.skyLift and drops its own.
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
