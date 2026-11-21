import * as THREE from 'three'
import { config } from '../../config'
import { smooth } from '../../director/rig'
import { StopPlan, type Fit, type MoveParams, type OrbitShot } from '../../director/moves'
import fit from './fit.json'

export const params: MoveParams = {
  hold: { orbitDeg: 0, axis: [0.1, 1, 0], push: -0.035 },
  spot: { x: 0.52, y: 0.46 },
  dive: { headingDeg: 52.25, altitude: 0.030751, back: 0.06, ahead: 0.12, bow: 0.2, rollDeg: 5, swoop: true, level: 0.62, surge: { glide: 0.03, rise: 85, fall: 4, swell: [0.38, 13, 2.4] } },
  terrain: { vfov: 45, gather: 0.4, forward: 0.44, rise: 0.237, side: 0.3, yawDeg: 0, pitchDeg: 0, entryHeight: 0, entryBack: 0, entryPitchDeg: 1.2, entryRollDeg: -3, entryDipDeg: 0.42, exitHeight: 2.3, exitForward: 1.4, exitPitchDeg: -13, exitDipDeg: 7.85, horizonDeg: 14.3175, dipDeg: 14.0305, rollDeg: -2.0044 },
  rise: { azimuthDeg: 0, elevationDeg: 0, distance: 4.87, offset: [0, 0], driftSpeed: 0.2, rollDeg: 0, ahead: 0.03, hug: 1.7, settle: 3, gentle: true, tilt: 0.4, from: 0.0565 },
  travel: { turnDeg: 70, side: 1, turnEnd: 0.42 },
  arrive: { swingDeg: 20, axis: [0.15, 1, 0], from: 0.2, offset: [0.4, 0.3] },
  light: { exposure: 1, skyExposure: 0.42, sunRadiusDeg: 1.8, sunGlare: 0.85, flare: 0.45, sunDir: [-0.692237, 0.508, 0.512586] },
  cover: [0.22, 0.34, 0.6],
  coverLow: [0.9, 0.95, 1.02],
  coverTerrain: [0.22, 0.34, 0.6],
  coverLowTerrain: [0.9, 0.95, 1.02],
  coverTop: [0.06, 0.012],
  coverEdge: [0.2, 0.5],
  coverEdgeRise: [0.5, 0.5],
  coverShell: [1, 1.0012],
  coverSea: { centre: [1.031837, -29.481955, -15.916028], radius: 32.5197, edge: [1, 1.003] },
  coverRush: { speed: 2.4, reach: 1, billow: [2.2, 0.9, 1], streak: [9, 2.2, 1.6], contrast: [0.7, 0.55] },
  spinDegPerSecond: 1.1,
  moonDegPerSecond: 0.13,
  tint: [0.55, 0.7, 1],
  skyAim: { orbit: [90, -21, 4], terrain: [36.77227, -52.29257, 2.15534] },
}

export interface Approach { ease: number; cruise: number; swell: [number, number, number]; cap: [number, number]; until: number }
export interface Retreat { lead: number; peak: number; turn: [number, number, number] }
export interface Tune { dive: Approach | null; rise: Retreat | null }

export const timing: Tune = {
  dive: { ease: 12, cruise: 0.6, swell: [16, 30, 0.12], cap: [7.3, 8], until: 47.5 },
  rise: { lead: 3.5, peak: 21, turn: [0.75, 1.3, 1.5] },
}

const STEPS = 16

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
  private handover = { quaternion: new THREE.Quaternion(), out: new THREE.Vector3(), off: 0, under: 0 }

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
      const floor = Math.pow(q, frames - t.lead)
      const fall = (y: number): number => Math.pow(q, y - t.lead) - floor * (1 + k * (y - frames))
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
    this.handover = { quaternion: first.quaternion.clone(), out, off, under: Math.asin(Math.min(1 / first.position.length(), 1)) - off }
    return this.warps.rise
  }

  private look(table: Float64Array, from: number, to: number, time: number): number {
    const n = table.length - 1
    const x = ((time - from) / (to - from)) * n
    const i = Math.min(Math.floor(x), n - 1)
    return from + ((table[i]! + (table[i + 1]! - table[i]!) * (x - i)) / n) * (to - from)
  }

  override dive(time: number): OrbitShot {
    const seg = this.seg.dive!
    const centre = this.coverCenter(seg)
    if (!this.tune.dive || time <= seg.start || time >= centre) return super.dive(time)
    return super.dive(Math.min(this.look(this.diveTable(this.tune.dive), seg.start, centre, time), centre - 1e-9))
  }

  override rise(time: number): OrbitShot {
    const seg = this.seg.rise
    const centre = this.coverCenter(seg)
    const t = this.tune.rise
    if (!t || time < centre) return super.rise(time)
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
    const off = (1 - w) * (Math.asin(Math.min(1 / shot.pose.position.length(), 1)) - from.under)
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
