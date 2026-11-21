import * as THREE from 'three'
import { config } from '../../config'
import type { Pose } from '../../core/types'
import { ramp, smooth, smoother } from '../../director/rig'
import { StopPlan, type Fit, type MoveParams, type OrbitShot } from '../../director/moves'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 0, axis: [0.1, 1, 0], push: -0.035 },
  spot: { x: 0.52, y: 0.46 },
  dive: { headingDeg: 52.25, altitude: 0.030751, back: 0.06, ahead: 0.12, bow: 0.2, rollDeg: 5, swoop: true, level: 0.62, surge: { glide: 0.03, rise: 85, fall: 4, swell: [0.38, 13, 2.4] } },
  terrain: { vfov: 45, gather: 0.4, forward: 0.44, rise: 0.237, side: 0.3, yawDeg: 0, pitchDeg: 0, entryHeight: 0, entryBack: 0, entryPitchDeg: 1.2, entryRollDeg: -3, entryDipDeg: 0.42, exitHeight: 2.3, exitForward: 1.4, exitPitchDeg: -13, exitDipDeg: 7.85, horizonDeg: 14.3175, dipDeg: 14.0305, rollDeg: -2.0044 },
  rise: { azimuthDeg: 0, elevationDeg: 0, distance: 4.56, offset: [0, 0], driftSpeed: 0.5, rollDeg: 0, ahead: 0.03, hug: 1.7, settle: 3, gentle: true, tilt: 0.4, from: 0.0565 },
  travel: { turnDeg: 93, side: 1, turnEnd: 0.42 },
  arrive: { swingDeg: 20, axis: [0.15, 1, 0], from: 0.2, offset: [0.4, 0.3] },
  light: { exposure: 1, skyExposure: 0.42, sunRadiusDeg: 1.8, sunGlare: 0.85, flare: 0.45, sunDir: [-0.692237, 0.508, 0.512586] },
  cover: [0.22, 0.34, 0.6],
  coverLow: [0.9, 0.95, 1.02],
  coverTerrain: [0.22, 0.34, 0.6],
  coverLowTerrain: [0.9, 0.95, 1.02],
  coverTop: [0.06, 0.012],
  coverEdge: [0.2, 0.5],
  coverEdgeRise: [0.5, 0.5],
  coverHides: 0.875,
  coverShell: [1, 1.0012],
  coverSea: { centre: [1.031837, -29.481955, -15.916028], radius: 32.5197, edge: [1, 1.003] },
  coverRush: { speed: 2.4, reach: 1, billow: [2.2, 0.9, 1], streak: [9, 2.2, 1.6], contrast: [0.7, 0.55] },
  spinDegPerSecond: 1.1,
  moonDegPerSecond: 0.13,
  tint: [0.55, 0.7, 1],
  skyAim: { orbit: [90, -21, 4], terrain: [36.77227, -52.29257, 2.15534] },
}

export interface Approach { ease: number; cruise: number; swell: [number, number, number]; cap: [number, number]; until: number }
export interface Retreat { lead: number; peak: number; tail: [number, number]; turn: [number, number, number] }
export interface Entry { free: [number, number]; hide: [number, number]; drop: [number, number, number]; bend: number; lean: number }
export interface Leave { from: number; ramp: number; rate: number; gain: number; soft: number }
export interface Tune { dive: Approach | null; rise: Retreat | null; entry: Entry | null; leave: Leave | null }

export const timing: Tune = {
  dive: { ease: 12, cruise: 0.6, swell: [16, 30, 0.12], cap: [7.3, 8], until: 47.5 },
  rise: { lead: 2.5, peak: 30, tail: [0.4, 4], turn: [0.75, 1.3, 1.5] },
  entry: { free: [26, 14], hide: [5.5, 4], drop: [0.111, -1.33, 0.75], bend: 0.0556, lean: 0.4 },
  leave: { from: 6.5, ramp: 3, rate: 0.085, gain: 0.17, soft: 1 },
}

const STEPS = 16
const Z = new THREE.Vector3(0, 0, 1)

interface Skyline { nadir: THREE.Vector3; height: number; tilt: number }
interface Seen { shot: OrbitShot; down: THREE.Vector3; ahead: THREE.Vector3; head: number; alpha: number }
interface Join { land: Skyline; pitch: [number, number]; tilt: [number, number, number, number] }

function hermite(s: number, v0: number, m0: number, v1: number, m1: number): number {
  const s2 = s * s
  const s3 = s2 * s
  return (2 * s3 - 3 * s2 + 1) * v0 + (s3 - 2 * s2 + s) * m0 + (3 * s2 - 2 * s3) * v1 + (s3 - s2) * m1
}

function retime(size: Float64Array, rate: (frames: number) => number, until: number): Float64Array {
  const n = size.length - 1
  for (let i = 0; i < n; i++) if (size[i + 1]! <= size[i]!) throw new Error('earth: the base path stands still at step ' + i)
  const at = new Float64Array(n + 1)
  const m = Math.min(Math.round(until * STEPS), n - 2)
  let goal = size[0]!
  let j = 0
  for (let i = 1; i <= m; i++) {
    const a = (i - 1) / STEPS
    const b = i / STEPS
    goal += ((b - a) / 6) * (rate(a) + 4 * rate(0.5 * (a + b)) + rate(b))
    while (j < n - 1 && size[j + 1]! < goal) j++
    at[i] = j + Math.min((goal - size[j]!) / (size[j + 1]! - size[j]!), 1)
  }
  const slope = at[m]! - at[m - 1]!
  const span = n - m
  for (let i = m + 1; i <= n; i++) {
    const x = (i - m) / span
    const x2 = x * x
    const x3 = x2 * x
    at[i] = (2 * x3 - 3 * x2 + 1) * at[m]! + (x3 - 2 * x2 + x) * span * slope + (3 * x2 - 2 * x3) * n + (x3 - x2) * span
  }
  for (let i = 0; i < n; i++) if (at[i + 1]! < at[i]!) throw new Error('earth: the retimed path runs backward at step ' + i)
  return at
}

function size(pose: OrbitShot['pose']): number {
  return Math.log(Math.tan(Math.asin(Math.min(1 / pose.position.length(), 1))) / Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2))
}

export class Plan extends StopPlan {
  private warps: { dive?: Float64Array; rise?: Float64Array } = {}
  private span: [number, number] = [0, 0]
  private handover = { quaternion: new THREE.Quaternion(), out: new THREE.Vector3(), off: 0, under: 0, height: 0 }
  private join: Join | null = null

  constructor(p: MoveParams = params, readonly tune: Tune = timing) {
    super('earth', fit as Fit, p)
    this.risePose.quaternion.copy(this.hold(this.seg.hold.end - this.seg.hold.start).quaternion)
  }

  clock(time: number): number {
    return time < this.coverCenter(this.seg.rise) ? time : time - (this.seg.rise.end - this.seg.hold.end)
  }

  override turn(time: number): THREE.Quaternion {
    return super.turn(this.clock(time))
  }

  override spin(time: number): number {
    return super.spin(this.clock(time))
  }

  pace(kind: 'dive' | 'rise', time: number): number {
    const centre = this.coverCenter(kind === 'dive' ? this.seg.dive! : this.seg.rise)
    const h = 0.25 / config.fps
    const a = kind === 'dive' ? Math.min(time - h, centre - 3 * h) : Math.max(time - h, centre)
    const b = a + 2 * h
    const from = kind === 'dive' ? this.dive(a) : this.rise(a)
    const to = kind === 'dive' ? this.dive(b) : this.rise(b)
    return Math.abs(size(to.pose) - size(from.pose)) / (2 * h * config.fps)
  }

  private diveTable(t: Approach): Float64Array {
    if (this.warps.dive) return this.warps.dive
    const seg = this.seg.dive!
    const centre = this.coverCenter(seg)
    const n = Math.round((centre - seg.start) * config.fps * STEPS)
    const h = (centre - seg.start) / n
    const base = new Float64Array(n + 1)
    for (let i = 0; i <= n; i++) base[i] = size(super.dive(Math.min(seg.start + i * h, centre - 1e-9)).pose)
    const first = (base[1]! - base[0]!) * STEPS
    const rate = (frames: number): number => {
      const cruise = first + (t.cruise / 100 - first) * smooth(frames / t.ease)
      const k = Math.min(Math.max((frames - t.swell[0]) / (t.swell[1] - t.swell[0]), 0), 1)
      const grown = t.swell[2] * ((t.swell[1] - t.swell[0]) * (k * k * k - 0.5 * k * k * k * k) + Math.max(frames - t.swell[1], 0))
      const free = cruise * Math.exp(grown)
      const cap = t.cap[0] / 100
      return free / Math.pow(1 + Math.pow(free / cap, t.cap[1]), 1 / t.cap[1])
    }
    this.warps.dive = retime(base, rate, t.until)
    return this.warps.dive
  }

  private riseTable(t: Retreat): Float64Array {
    if (this.warps.rise) return this.warps.rise
    const seg = this.seg.rise
    const centre = this.coverCenter(seg)
    const n = Math.round((seg.end - centre) * config.fps * STEPS)
    const h = (seg.end - centre) / n
    const base = new Float64Array(n + 1)
    for (let i = 0; i <= n; i++) base[i] = -size(super.rise(Math.min(centre + i * h, seg.end - 1e-9)).pose)
    const step = 1 / (config.fps * STEPS)
    const last = (size(this.exitPose(seg.end - step)) - size(this.exitPose(seg.end))) * STEPS
    const total = base[n]! - base[0]!
    const frames = n / STEPS
    const peak = t.peak / 100
    const shape = (q: number) => (x: number): number => {
      if (x < t.lead) return peak * (1 - Math.pow(1 - x / t.lead, 2))
      const k = Math.log(q)
      const span = frames - t.lead
      const slow = t.tail[0] * Math.pow(q, span)
      const fast = (1 - t.tail[0]) * Math.pow(q, span * t.tail[1])
      const fall = (y: number): number => t.tail[0] * Math.pow(q, y - t.lead) + (1 - t.tail[0]) * Math.pow(q, (y - t.lead) * t.tail[1]) - (slow + fast) - k * (slow + t.tail[1] * fast) * (y - frames)
      return last + ((peak - last) * fall(x)) / fall(t.lead)
    }
    const sum = (q: number): number => {
      const f = shape(q)
      let acc = 0
      const w = frames / n
      for (let i = 0; i < n; i++) acc += (w / 6) * (f(i * w) + 4 * f((i + 0.5) * w) + f((i + 1) * w))
      return acc
    }
    let lo = 0.3
    let hi = 0.9999
    for (let i = 0; i < 50; i++) {
      const mid = 0.5 * (lo + hi)
      if (sum(mid) < total) lo = mid
      else hi = mid
    }
    this.warps.rise = retime(base, shape(0.5 * (lo + hi)), frames)
    this.span = [-base[0]!, -base[n]!]
    const first = super.rise(centre).pose
    const out = first.position.clone().normalize()
    const off = Math.acos(THREE.MathUtils.clamp(-out.dot(new THREE.Vector3(0, 0, -1).applyQuaternion(first.quaternion)), -1, 1))
    this.handover = { quaternion: first.quaternion.clone(), out, off, under: Math.asin(Math.min(1 / first.position.length(), 1)) - off, height: this.skyline(this.rise(centre - 1e-7).pose).height }
    return this.warps.rise
  }

  private look(table: Float64Array, from: number, to: number, time: number): number {
    const n = table.length - 1
    const x = ((time - from) / (to - from)) * n
    const i = Math.min(Math.floor(x), n - 1)
    return from + ((table[i]! + (table[i + 1]! - table[i]!) * (x - i)) / n) * (to - from)
  }

  private skyline(pose: Pose): Skyline {
    const sea = this.p.coverSea!
    const to = new THREE.Vector3().fromArray(sea.centre).sub(pose.position)
    const alpha = Math.asin(Math.min(sea.radius / to.length(), 1))
    const nadir = to.normalize().applyQuaternion(pose.quaternion.clone().invert())
    const under = alpha - Math.acos(THREE.MathUtils.clamp(-nadir.z, -1, 1))
    return { nadir, height: Math.tan(under) / Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2), tilt: Math.atan2(nadir.x, -nadir.y) }
  }

  private lower(pose: Pose, more: number, roll: number): void {
    const s = this.skyline(pose)
    const th = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
    const len = Math.hypot(s.nadir.x, s.nadir.y)
    pose.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(s.nadir.y / len, -s.nadir.x / len, 0), Math.atan((s.height + more) * th) - Math.atan(s.height * th)))
    if (roll !== 0) pose.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(Z, -roll))
  }

  private approach(time: number): Seen {
    const seg = this.seg.dive!
    const centre = this.coverCenter(seg)
    const at = this.tune.dive ? Math.min(this.look(this.diveTable(this.tune.dive), seg.start, centre, time), centre - 1e-9) : time
    const shot = super.dive(at)
    const down = shot.pose.position.clone().normalize().negate()
    const ahead = this.heading.clone().applyQuaternion(this.turn(at))
    ahead.addScaledVector(down, -ahead.dot(down)).normalize()
    const h = ahead.clone().applyQuaternion(shot.pose.quaternion.clone().invert())
    return { shot, down, ahead, head: Math.atan2(h.x, h.y), alpha: Math.asin(Math.min(1 / shot.pose.position.length(), 1)) }
  }

  private landing(e: Entry, land: Skyline, seen: Seen, x: number): [number, number] {
    const a = -Math.log(e.drop[2])
    const th = Math.tan(THREE.MathUtils.degToRad(seen.shot.pose.vfov) / 2)
    return [seen.alpha - Math.atan((land.height + e.drop[0] * Math.exp(a * x + e.bend * x * x)) * th), land.tilt + THREE.MathUtils.degToRad(e.drop[1]) * Math.exp(a * x)]
  }

  private entryJoin(e: Entry): Join {
    if (this.join) return this.join
    const centre = this.coverCenter(this.seg.dive!)
    const land = this.skyline(super.dive(centre).pose)
    const d = 1 / STEPS
    const span = e.hide[0] - e.hide[1]
    const at = (x: number): Seen => this.approach(centre - x / config.fps)
    const from = at(e.hide[0])
    const to = this.landing(e, land, at(e.hide[1]), e.hide[1])
    const next = this.landing(e, land, at(e.hide[1] - d), e.hide[1] - d)
    this.join = { land, pitch: [to[0], ((next[0] - to[0]) / d) * span], tilt: [-from.head, (-(at(e.hide[0] - d).head - from.head) / d) * span, to[1], ((next[1] - to[1]) / d) * span] }
    return this.join
  }

  override dive(time: number): OrbitShot {
    const seg = this.seg.dive!
    const centre = this.coverCenter(seg)
    const e = this.tune.entry
    if (time >= centre) {
      const shot = super.dive(time)
      if (e) {
        const k = Math.pow(e.drop[2], (time - centre) * config.fps)
        this.lower(shot.pose, e.drop[0] * k, THREE.MathUtils.degToRad(e.drop[1]) * k)
      }
      return shot
    }
    if (time <= seg.start) return super.dive(time)
    const seen = this.approach(time)
    const x = (centre - time) * config.fps
    if (!e || x >= e.free[0]) return seen.shot
    const j = this.entryJoin(e)
    const lean = THREE.MathUtils.degToRad(e.lean)
    let pitch = lean
    let tilt = -seen.head
    if (x <= e.hide[1]) [pitch, tilt] = this.landing(e, j.land, seen, x)
    else if (x < e.hide[0]) {
      const s = (e.hide[0] - x) / (e.hide[0] - e.hide[1])
      pitch = hermite(s, lean, 0, j.pitch[0], j.pitch[1])
      tilt = hermite(s, j.tilt[0], j.tilt[1], j.tilt[2], j.tilt[3])
    }
    const axis = seen.down.clone().multiplyScalar(Math.cos(pitch)).addScaledVector(seen.ahead, Math.sin(pitch))
    const up = seen.ahead.clone().multiplyScalar(Math.cos(pitch)).addScaledVector(seen.down, -Math.sin(pitch))
    const aimed = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(axis, up), up, axis.clone().negate()))
    aimed.multiply(new THREE.Quaternion().setFromAxisAngle(Z, -tilt))
    seen.shot.pose.quaternion.slerp(aimed, smoother(ramp(e.free[0], e.free[1], x)))
    return seen.shot
  }

  override rise(time: number): OrbitShot {
    const seg = this.seg.rise
    const centre = this.coverCenter(seg)
    const t = this.tune.rise
    const l = this.tune.leave
    if (!t || time < centre) {
      const shot = super.rise(time)
      const f = l ? l.from - (centre - time) * config.fps : 0
      if (l && f > 0) {
        const u = Math.min(f / l.ramp, 1)
        this.lower(shot.pose, l.rate * (l.ramp * (u * u * u - 0.5 * u * u * u * u) + Math.max(f - l.ramp, 0)), 0)
      }
      return shot
    }
    const table = this.riseTable(t)
    const at = time >= seg.end ? time : Math.max(this.look(table, centre, seg.end, time), centre)
    const shot = super.rise(at)
    const glue = this.turn(time).multiply(this.turn(at).invert())
    const s = Math.min(Math.max((this.span[0] - size(shot.pose)) / ((this.span[0] - this.span[1]) * t.turn[0]), 0), 1)
    const w = 1 - Math.pow(1 - Math.pow(s, t.turn[1]), t.turn[2])
    const from = this.handover
    const end = this.after(seg.end).quaternion
    const carry = this.turn(time).multiply(this.turn(centre).invert())
    shot.pose.position.applyQuaternion(glue)
    const out = shot.pose.position.clone().normalize()
    const level = new THREE.Quaternion().setFromUnitVectors(from.out.clone().applyQuaternion(carry), out).multiply(carry).multiply(from.quaternion)
    const alpha = Math.asin(Math.min(1 / shot.pose.position.length(), 1))
    let off = (1 - w) * (alpha - from.under)
    if (l) {
      const x = (time - centre) * config.fps
      const d = alpha - Math.atan((from.height + l.rate * x + l.gain * x * x * x) * Math.tan(THREE.MathUtils.degToRad(shot.pose.vfov) / 2))
      const soft = THREE.MathUtils.degToRad(l.soft)
      off = 0.5 * (d + Math.sqrt(d * d + soft * soft))
    }
    const X = new THREE.Vector3(1, 0, 0)
    const top = new THREE.Vector3(0, 1, 0).applyQuaternion(level.clone().multiply(new THREE.Quaternion().setFromAxisAngle(X, -from.off)))
    const north = new THREE.Vector3(0, 1, 0).applyQuaternion(end)
    north.addScaledVector(out, -north.dot(out)).normalize()
    const around = Math.atan2(out.dot(new THREE.Vector3().crossVectors(top, north)), top.dot(north))
    const pitched = level.multiply(new THREE.Quaternion().setFromAxisAngle(X, off - from.off))
    shot.pose.quaternion.copy(new THREE.Quaternion().setFromAxisAngle(out, around * w).multiply(pitched).slerp(end, w * w))
    return shot
  }
}

export const plan = new Plan()
