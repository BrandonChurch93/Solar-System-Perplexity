import * as THREE from 'three'
import { smoother } from '../../director/rig'

export interface TravelLook {
  pan: [number, number]
  panSpan: [number, number]
  lead: [number, number]
  roll: [number, number]
  rollSpan: [number, number]
  bowDeg: number
  grow: [number, number]
  swing: [number, number]
  offset: [number, number]
  settle: number
  clearDeg: number
  passBy: number
  passPower: number
  passKnee: number
  passLead: number
  passRound: number
  passStart: [number, number]
  carry: number
  ahead: [number, number, number, number]
  follow: number
  cruise: number
  early: number
  point: number
  growRun: [number, number, number]
  pin: [number, number]
  pinEase: [number, number]
  turnRun: [number, number]
  land: number
  landTurn: Landing
  landGrow: Landing
  window: number
  patchEnd: number
  pinFrames: number
  steady: [number, number]
  herald: number
  disc: [number, number, number]
}

const BASE: TravelLook = { pan: [2, 2], panSpan: [0, 0.97], lead: [0, 1], roll: [2, 2], rollSpan: [0, 0.97], bowDeg: 0, grow: [2, 3], swing: [0.1, 1], offset: [0.1, 1], settle: 0.5, clearDeg: 2, passBy: 0.3, passPower: 2, passKnee: 1, passLead: 0.5, passRound: 0.2, passStart: [0, 0], carry: 0.4, ahead: [0.6, 0.03, 0.5, 0], land: 0, landTurn: [0, 0, 0, 0, 0], landGrow: [0, 0, 0, 0, 0], follow: 0, cruise: 0.3, early: 0.06, point: 0, growRun: [0, 0, 0], pin: [0, 0], pinEase: [2, 2], turnRun: [0, 0], window: 0, patchEnd: 0, pinFrames: 8, steady: [0, 0], herald: 0, disc: [0, 0, 0] }

export const TRAVEL: Record<string, Partial<TravelLook>> = {
  sun: { panSpan: [0, 1], rollSpan: [0, 1], cruise: 0, window: 41, patchEnd: 0.7, disc: [0.31, 0.136, 0.1] },
  mercury: { land: 0.68, landTurn: [60, 0.052, 0.107, 30, 58], landGrow: [70, 0.3, 0.07, 40, 58], growRun: [0.2818, 0.2, 0.3], point: 0.0015, early: 0.0933, passBy: 0.32, passPower: 3, passKnee: 0.6, passStart: [0.03, 1], ahead: [0.6, 0.008, 0.5, 0], pin: [0, 1], pinEase: [2, 9], turnRun: [0.36, 0.36], panSpan: [0, 1], window: 51, pinFrames: 2, steady: [60, 200], herald: 2, disc: [0.42, 0.231, 0.076] },
  venus: { land: 0.68, landTurn: [60, 0.052, 0.107, 30, 58], landGrow: [70, 0.3, 0.07, 40, 58], growRun: [0.3672, 0.2, 0.3], point: 0.0015, early: 0.115, passBy: 0.275, passPower: 3, passKnee: 0.6, passStart: [0.03, 1], pin: [0, 1], pinEase: [2, 9], turnRun: [0.35, 0.35], panSpan: [0, 1], window: 51, pinFrames: 2, steady: [60, 200], disc: [0.107, 0.19, 0.254], ahead: [0.6, 0.014, 0.5, 0] },
  earth: { land: 0.68, landTurn: [60, 0.04, 0.107, 30, 58], landGrow: [70, 0.3, 0.07, 40, 58], growRun: [0.3351, 0.2, 0.3], point: 0.0015, early: 0.15, passBy: 0.31, passPower: 3, pin: [0, 1], pinEase: [2, 9], turnRun: [0.4, 0.36], panSpan: [0, 1], window: 48, pinFrames: 2, steady: [60, 200], disc: [0.16, 0.067, 0.045], ahead: [0.6, 0.002, 0.5, 0] },
  mars: { land: 0.68, landTurn: [60, 0.058, 0.107, 24, 58], landGrow: [95, 0.41, 0.07, 50, 58], growRun: [0.3, 0.2, 0.3], point: 0.0015, early: 0.1, pin: [0, 1], pinEase: [2, 9], turnRun: [0.36, 0.36], panSpan: [0, 1], window: 33, disc: [0.16, 0.072, 0.035] },
  jupiter: { land: 0.68, landTurn: [60, 0.1, 0.107, 30, 58], landGrow: [70, 0.3, 0.07, 40, 58], growRun: [0.3, 0.2, 0.3], point: 0.0015, early: 0.1, passBy: 0.32, passPower: 3, passKnee: 0.6, follow: 1, passStart: [0, 1], ahead: [0.6, 0.035, 0.5, -0.3], pin: [0, 1], pinEase: [2, 9], turnRun: [0.36, 0.4], panSpan: [0, 1], window: 49, pinFrames: 2, steady: [60, 200], disc: [0.77, 0.485, 0.32] },
  saturn: { land: 0.68, landTurn: [60, 0.062, 0.107, 24, 58], landGrow: [95, 0.41, 0.07, 50, 58], growRun: [0.26, 0.2, 0.3], point: 0.0015, early: 0.1, passBy: 0.42, passPower: 3, ahead: [0.6, 0.006, 0.5, -0.3], pin: [0, 1], pinEase: [2, 9], turnRun: [0.36, 0.36], panSpan: [0, 1], window: 30, pinFrames: 4, disc: [0.275, 0.54, 0.54] },
  uranus: { land: 0.68, landTurn: [60, 0.105, 0.107, 30, 58], landGrow: [70, 0.3, 0.07, 40, 58], growRun: [0.3935, 0.2, 0.3], point: 0.0015, early: 0.1083, passBy: 0.228, passPower: 3, passKnee: 0.6, passLead: 0.6, passStart: [0.07, 1], pin: [0, 1], pinEase: [2, 9], turnRun: [0.35, 0.36], panSpan: [0, 1], window: 47, steady: [60, 200], disc: [0.06, 0.17, 0.7], ahead: [0.6, 0.014, 0.5, 0] },
}

export const CARRY = { from: 0.02, step: 1 / 600 }

export function carryWay(s: number): number {
  const x = Math.min(Math.max(s, 0), 1)
  const q = x * x * x * x
  return x - q * (x * (x - 3) + 2.5)
}

export function carryBend(s: number): number {
  const x = Math.min(Math.max(s, 0), 1)
  return x * x * (0.5 + x * (x * (0.75 - 0.2 * x) - 1))
}

export function travelLook(id: string): TravelLook {
  return { ...BASE, ...(TRAVEL[id] ?? {}) }
}

export const WORLD_MISS = 1

export type WorldAnswer = 'least' | 'open' | 'close'

export const WORLD_ANSWER: Record<string, WorldAnswer> = { mercury: 'open', earth: 'open', jupiter: 'close', uranus: 'open' }

export const WORLD_CORNER: readonly string[] = ['mercury']

export function worldCosts(angles: number[], bare: number[], answer: WorldAnswer): number[] {
  if (answer === 'least') return bare
  const n = angles.length
  return bare.map((c, k) => (angles[(k + 1) % n]! > angles[(k + n - 1) % n]!) === (answer === 'open') ? c : Infinity)
}

export function worldLead(costs: number[], taken: number): number {
  const n = costs.length
  let lead = Infinity
  for (let k = 0; k < n; k++) {
    const away = Math.min((k - taken + n) % n, (taken - k + n) % n)
    if (away < 3 || !(costs[k]! <= costs[(k + n - 1) % n]!) || !(costs[k]! < costs[(k + 1) % n]!)) continue
    lead = Math.min(lead, costs[k]! - costs[taken]!)
  }
  return lead
}

const choose = (n: number, k: number): number => {
  let c = 1
  for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1)
  return c
}

export function betaEase(a: number, b: number): (t: number) => number {
  const terms: { p: number; c: number }[] = []
  for (let k = 0; k <= b; k++) terms.push({ p: a + k + 1, c: (choose(b, k) * (k % 2 === 0 ? 1 : -1)) / (a + k + 1) })
  const total = terms.reduce((s, t) => s + t.c, 0)
  return (t) => {
    const x = Math.min(Math.max(t, 0), 1)
    if (x > 0.5) {
      let s = 0
      const y = 1 - x
      for (let k = 0; k <= a; k++) s += ((choose(a, k) * (k % 2 === 0 ? 1 : -1)) / (b + k + 1)) * Math.pow(y, b + k + 1)
      return 1 - s / total
    }
    let s = 0
    for (const term of terms) s += term.c * Math.pow(x, term.p)
    return s / total
  }
}

export function cruiseEase(share: number): (t: number) => number {
  const a = Math.min(Math.max(share, 1e-6), 0.5)
  const up = (x: number): number => a * x * x * x * (1 - x / 2)
  return (t) => {
    const x = Math.min(Math.max(t, 0), 1)
    const done = x < a ? up(x / a) : x > 1 - a ? 1 - a - up((1 - x) / a) : x - a / 2
    return done / (1 - a)
  }
}

export function runEase(lead: number, tail: number): (t: number) => number {
  const up = (x: number): number => x * x * x * (1 - x / 2)
  const total = 1 - lead / 2 - tail / 2
  return (t) => {
    const x = Math.min(Math.max(t, 0), 1)
    return (x < lead ? lead * up(x / lead) : x > 1 - tail ? total - tail * up((1 - x) / tail) : x - lead / 2) / total
  }
}

export function slowEase(lead: number, tail: number): (t: number) => number {
  const up = (x: number): number => x * x * x * x * (1 - 0.6 * x)
  const total = 1 - 0.6 * lead - 0.6 * tail
  return (t) => {
    const x = Math.min(Math.max(t, 0), 1)
    return (x < lead ? lead * up(x / lead) : x > 1 - tail ? total - tail * up((1 - x) / tail) : x - 0.6 * lead) / total
  }
}

type Poly = number[]
const polyMul = (a: Poly, b: Poly): Poly => {
  const out = new Array<number>(a.length + b.length - 1).fill(0)
  a.forEach((x, i) => b.forEach((y, j) => (out[i + j]! += x * y)))
  return out
}
const polyAt = (a: Poly, x: number): number => {
  let s = 0
  for (let i = a.length - 1; i >= 0; i--) s = s * x + a[i]!
  return s
}
const polyOf = (a: Poly, scale: number, shift: number): Poly => {
  let out: Poly = [0]
  for (let i = a.length - 1; i >= 0; i--) {
    out = polyMul(out, [shift, scale])
    out[0]! += a[i]!
  }
  return out
}
const polySum = (a: Poly, first: number): Poly => [first, ...a.map((c, i) => c / (i + 1))]
const STEP: Poly = [0, 0, 3, -2]
const SOFT: Poly = [0, 0, 0, 10, -15, 6]

export function passCurve(power: number, knee: number, lead: number, round: number, start: [number, number] = [0, 0]): (t: number) => number {
  const p = Math.max(2, Math.round(power))
  const half = knee < 1 ? Math.min(round, knee) : 0
  const cuts = [0, ...(lead > 0 ? [lead] : []), ...(knee < 1 ? [knee - half, knee + half] : [])].sort((a, b) => a - b).filter((c, i, all) => i === 0 || c > all[i - 1]!)
  const pieces: { from: number; place: Poly; speed: Poly }[] = []
  let speed = 0
  let place = 0
  cuts.forEach((from, i) => {
    const mid = i + 1 < cuts.length ? (from + cuts[i + 1]!) / 2 : from + 1
    const up: Poly = lead > 0 && mid < lead ? polyOf(SOFT, 1 / lead, from / lead) : [1]
    const down: Poly = knee >= 1 || mid < knee - half ? [1] : mid > knee + half ? [0] : polyOf(STEP, -1 / (2 * half), (knee + half - from) / (2 * half))
    let push: Poly = [p * (p - 1)]
    for (let k = 2; k < p; k++) push = polyMul(push, [from, 1])
    const v = polySum(polyMul(polyMul(push, up), down), speed)
    const x = polySum(v, place)
    pieces.push({ from, place: x, speed: v })
    if (i + 1 < cuts.length) {
      speed = polyAt(v, cuts[i + 1]! - from)
      place = polyAt(x, cuts[i + 1]! - from)
    }
  })
  const raw = (t: number): number => {
    let at = pieces[0]!
    for (const piece of pieces) if (t >= piece.from) at = piece
    return polyAt(at.place, t - at.from)
  }
  const whole = raw(1)
  const [a, b] = start
  const flat = pieces[pieces.length - 1]!
  const v = flat.speed[0]!
  const m = (7 * (1 - whole / v) - 2 * (a + b)) / 3
  if (!(b > a) || knee + half > b || flat.speed.some((c, i) => i > 0 && c !== 0) || !(m > a && m < b)) return (t) => raw(Math.max(t, 0)) / whole
  const top = (2 * v) / (b - a)
  const up = polySum(polyOf(SOFT, 1 / (m - a), 0), 0).map((c) => c * top)
  const upPlace = polySum(up, 0)
  const down = polySum(polyOf(SOFT, -1 / (b - m), 1), 0).map((c, i) => c * top + (i === 0 ? polyAt(up, m - a) : 0))
  const downPlace = polySum(down, polyAt(upPlace, m - a))
  return (t) => (t >= b ? raw(t) : t > m ? polyAt(downPlace, t - m) : t > a ? polyAt(upPlace, t - a) : 0) / whole
}

export type Landing = [number, number, number, number, number]

const brake = (rate: number, knee: number, fix: number) => {
  const sig = (x: number): number => 1 / (1 + Math.exp(-x))
  const low = sig(-rate * knee)
  const a = rate * (1 - low) + fix
  return {
    at: (z: number): number => sig(rate * (z - knee)) - low * Math.exp(-fix * z) * (1 + a * z),
    sum: (z: number): number => Math.log1p(low * Math.expm1(rate * z)) / rate - low * (-Math.expm1(-fix * z) / fix + (a * (1 - Math.exp(-fix * z) * (1 + fix * z))) / (fix * fix)),
    bend: (z: number): number => {
      const s = sig(rate * (z - knee))
      return rate * s * (1 - s) - low * Math.exp(-fix * z) * (a - fix * (1 + a * z))
    },
  }
}

export function landing(left: number, speed: number, bend: number, law: Landing): (z: number) => number {
  const [fall, share, knee, ease, fix] = law
  const tail = share > 0 ? brake(ease, knee, fix) : null
  const glide = tail ? (share * speed) / tail.at(1) : 0
  const fit = (at: number) => {
    const main = brake(fall, at, fall)
    const scale = (speed * (1 - (tail ? share : 0))) / main.at(1)
    const bump = bend - scale * main.bend(1) - (tail ? glide * tail.bend(1) : 0)
    return { main, scale, bump, miss: scale * main.sum(1) + (tail ? glide * tail.sum(1) : 0) - bump / 56 - left }
  }
  let near = 0.05
  let far = 2
  for (let i = 0; i < 60; i++) {
    const mid = (near + far) / 2
    if (fit(mid).miss > 0) near = mid
    else far = mid
  }
  const got = fit((near + far) / 2)
  return (z) => {
    const x = Math.min(Math.max(z, 0), 1)
    const x6 = x * x * x * x * x * x
    return got.scale * got.main.sum(x) + (tail ? glide * tail.sum(x) : 0) + got.bump * x6 * x * (x / 8 - 1 / 7)
  }
}

const span = (r: [number, number], t: number): number => Math.min(Math.max((t - r[0]) / (r[1] - r[0]), 0), 1)

export class TravelShape {
  readonly look: TravelLook
  private readonly panEase: (t: number) => number
  private readonly rollEase: (t: number) => number
  private readonly growEase: (t: number) => number
  private readonly swingEase = betaEase(2, 3)
  private readonly settleEase = betaEase(2, 2)
  private readonly leadEase = betaEase(2, 2)
  private readonly pinEase: (t: number) => number
  private readonly passRun: (t: number) => number
  private landed: { from: number; open: number; turn: (z: number) => number; grow: ((z: number) => number) | null; at: number } | null = null

  from = 0
  until = 0
  open = 1

  lead = 0

  constructor(id: string, over: Partial<TravelLook> = {}) {
    this.look = { ...travelLook(id), ...over }
    this.panEase = this.look.turnRun[0] > 0 ? slowEase(this.look.turnRun[0], this.look.turnRun[1]) : this.look.cruise > 0 ? cruiseEase(this.look.cruise) : betaEase(this.look.pan[0], this.look.pan[1])
    this.rollEase = this.look.cruise > 0 ? cruiseEase(this.look.cruise) : betaEase(this.look.roll[0], this.look.roll[1])
    this.pinEase = betaEase(this.look.pinEase[0], this.look.pinEase[1])
    const run = this.look.growRun
    const beta = betaEase(this.look.grow[0], this.look.grow[1])
    const ease = runEase(run[1], run[2])
    this.growEase = run[1] > 0 ? (x) => ease(span([run[0], 1], x)) : beta
    this.passRun = passCurve(this.look.passPower, this.look.passKnee, this.look.passLead, this.look.passRound, this.look.passStart)
  }

  private landings(): NonNullable<TravelShape['landed']> {
    if (this.landed && this.landed.from === this.from && this.landed.open === this.open) return this.landed
    const u = this.look.land
    const h = 1e-3
    const w = 1 - u
    const law = (l: Landing, unit: number): Landing => [l[0] * unit, l[1], l[2] / unit, l[3] * unit, l[4] * unit]
    const turn = landing(1 - this.cruised(u), ((this.cruised(u + h) - this.cruised(u - h)) / (2 * h)) * w, (-(this.cruised(u + h) - 2 * this.cruised(u) + this.cruised(u - h)) / (h * h)) * w * w, law(this.look.landTurn, w))
    const at = Math.max((u - this.open) / (1 - this.open), 0.5)
    const grow = at < 0.98 ? landing(1 - smoother(at), 30 * at * at * (1 - at) * (1 - at) * (1 - at), -60 * at * (1 - at) * (1 - 2 * at) * (1 - at) * (1 - at), law(this.look.landGrow, (1 - at) * (1 - this.open))) : null
    this.landed = { from: this.from, open: this.open, turn, grow, at }
    return this.landed
  }

  pan(u: number): number {
    return this.look.land > 0 && u > this.look.land ? 1 - this.landings().turn((1 - u) / (1 - this.look.land)) : this.cruised(u)
  }

  arrive(t: number): number {
    if (this.look.land <= 0) return smoother(t)
    const l = this.landings()
    return l.grow && t > l.at ? 1 - l.grow((1 - t) / (1 - l.at)) : smoother(t)
  }

  private cruised(u: number): number {
    const main = this.panEase(span([Math.max(this.look.panSpan[0], this.from - this.look.early), this.look.panSpan[1]], u))
    const share = this.look.lead[0]
    return share > 0 ? share * this.leadEase(span([0, this.look.lead[1]], u)) + (1 - share) * main : main
  }

  roll(u: number): number {
    return this.rollEase(span([Math.max(this.look.rollSpan[0], this.from - this.look.early), this.look.rollSpan[1]], u))
  }

  pass(u: number): number {
    const by = this.look.passBy
    const own = this.passRun(Math.max(u, 0) / by)
    if (!(this.lead > 0) || u >= by || u <= -this.lead) return own
    const [, part, share, late] = this.look.ahead
    const way = (s: number): number => s * s * s * s * (2.5 + s * (s - 3))
    const soft = (s: number): number => s * s * s * (10 + s * (6 * s - 15))
    const span = share * by
    const peak = late * by
    const rise = this.lead + peak
    const back = -peak / (span - peak)
    const top = part / (peak > 0 ? rise * way(this.lead / rise) : rise / 2 + (span - peak) * (back - way(back)))
    if (u < peak) return own + top * rise * way((u + this.lead) / rise)
    if (u < span) return own + (top * rise) / 2 + top * (span - peak) * ((u - peak) / (span - peak) - way((u - peak) / (span - peak)))
    return own + ((top * (this.lead + span)) / 2) * (1 - soft((u - span) / (by - span)))
  }

  grow(x: number): number {
    return this.growEase(x)
  }

  grown(e: number): number {
    let low = 0
    let high = 1
    for (let k = 0; k < 40; k++) {
      const mid = (low + high) / 2
      if (this.growEase(mid) < e) low = mid
      else high = mid
    }
    return low
  }

  pinned(u: number): number {
    return this.look.pin[1] > 0 ? this.pinEase(span(this.look.pin, span([this.from, this.until], u))) : 0
  }

  spin(qa: THREE.Quaternion, qb: THREE.Quaternion, u: number): THREE.Quaternion {
    return qa.clone().slerp(qb, this.pan(u))
  }

  swingLeft(x: number): number {
    return 1 - this.swingEase(span(this.look.swing, x))
  }

  offsetLeft(x: number): number {
    return 1 - this.swingEase(span(this.look.offset, x))
  }

  settleLeft(x: number): number {
    return 1 - this.settleEase(span([0, this.look.settle], x))
  }

  turn(qa: THREE.Quaternion, qb: THREE.Quaternion, u: number): THREE.Quaternion {
    const fa = new THREE.Vector3(0, 0, -1).applyQuaternion(qa)
    const fb = new THREE.Vector3(0, 0, -1).applyQuaternion(qb)
    const w = this.pan(u)
    const ang = Math.acos(Math.min(Math.max(fa.dot(fb), -1), 1))
    let f: THREE.Vector3
    if (ang < 1e-6) f = fa.clone()
    else {
      const s = Math.sin(ang)
      f = fa.clone().multiplyScalar(Math.sin((1 - w) * ang) / s).addScaledVector(fb, Math.sin(w * ang) / s)
      if (this.look.bowDeg !== 0) {
        const n = new THREE.Vector3().crossVectors(fa, fb).normalize()
        const lift = Math.sin(Math.PI * w)
        const beta = THREE.MathUtils.degToRad(this.look.bowDeg) * lift * lift * Math.min(ang / 1.2, 1)
        f.multiplyScalar(Math.cos(beta)).addScaledVector(n, Math.sin(beta)).normalize()
      }
    }
    const a = new THREE.Quaternion().setFromUnitVectors(fa, f).multiply(qa)
    const b = new THREE.Quaternion().setFromUnitVectors(fb, f).multiply(qb)
    return a.slerp(b, this.roll(u))
  }
}

export function outsideFrame(q: THREE.Quaternion, vfovDeg: number, aspect: number, to: THREE.Vector3): number {
  const v = to.clone().multiplyScalar(1 / to.length()).applyQuaternion(q.clone().invert())
  const hy = THREE.MathUtils.degToRad(vfovDeg) / 2
  const hx = Math.atan(Math.tan(hy) * aspect)
  const out = Math.max(v.x * Math.cos(hx) + v.z * Math.sin(hx), -v.x * Math.cos(hx) + v.z * Math.sin(hx), v.y * Math.cos(hy) + v.z * Math.sin(hy), -v.y * Math.cos(hy) + v.z * Math.sin(hy))
  return Math.asin(Math.min(Math.max(out, -1), 1))
}

export function inFrame(q: THREE.Quaternion, vfovDeg: number, aspect: number, to: THREE.Vector3, radius: number, marginDeg: number): boolean {
  return outsideFrame(q, vfovDeg, aspect, to) < Math.asin(Math.min(radius / to.length(), 1)) + THREE.MathUtils.degToRad(marginDeg)
}
