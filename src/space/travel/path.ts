import * as THREE from 'three'

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
  follow: number
  cruise: number
  early: number
  point: number
  growRun: [number, number, number]
  pin: [number, number]
  pinEase: [number, number]
  turnRun: [number, number]
  window: number
  patchEnd: number
  pinFrames: number
}

const BASE: TravelLook = { pan: [2, 2], panSpan: [0, 0.97], lead: [0, 1], roll: [2, 2], rollSpan: [0, 0.97], bowDeg: 0, grow: [2, 3], swing: [0.1, 1], offset: [0.1, 1], settle: 0.5, clearDeg: 2, passBy: 0.3, passPower: 2, passKnee: 1, follow: 0, cruise: 0.3, early: 0.06, point: 0, growRun: [0, 0, 0], pin: [0, 0], pinEase: [2, 2], turnRun: [0, 0], window: 0, patchEnd: 0, pinFrames: 8 }

export const TRAVEL: Record<string, Partial<TravelLook>> = {
  sun: { panSpan: [0, 1], rollSpan: [0, 1], cruise: 0, window: 41, patchEnd: 0.7 },
  mercury: { growRun: [0.2818, 0.2, 0.3], point: 0.0015, early: 0.0933, passBy: 0.32, passPower: 3, passKnee: 0.6, pin: [0, 1], pinEase: [2, 9], turnRun: [0.36, 0.36], panSpan: [0, 1], window: 33 },
  venus: { growRun: [0.3672, 0.2, 0.3], point: 0.0015, early: 0.115, passBy: 0.275, passPower: 3, passKnee: 0.6, pin: [0, 1], pinEase: [2, 9], turnRun: [0.35, 0.35], panSpan: [0, 1], window: 33 },
  earth: { growRun: [0.3351, 0.2, 0.3], point: 0.0015, early: 0.15, passBy: 0.31, passPower: 3, pin: [0, 1], pinEase: [2, 9], turnRun: [0.4, 0.36], panSpan: [0, 1], window: 33 },
  mars: { growRun: [0.3, 0.2, 0.3], point: 0.0015, early: 0.1, pin: [0, 1], pinEase: [2, 9], turnRun: [0.36, 0.36], panSpan: [0, 1], window: 33 },
  jupiter: { growRun: [0.3, 0.2, 0.3], point: 0.0015, early: 0.1, passBy: 0.32, passPower: 3, passKnee: 0.6, follow: 1, pin: [0, 1], pinEase: [2, 9], turnRun: [0.36, 0.4], panSpan: [0, 1], window: 33 },
  saturn: { growRun: [0.26, 0.2, 0.3], point: 0.0015, early: 0.1, passBy: 0.42, passPower: 3, pin: [0, 1], pinEase: [2, 9], turnRun: [0.36, 0.36], panSpan: [0, 1], window: 30, pinFrames: 4 },
  uranus: { growRun: [0.3935, 0.2, 0.3], point: 0.0015, early: 0.1083, passBy: 0.228, passPower: 3, passKnee: 0.6, pin: [0, 1], pinEase: [2, 9], turnRun: [0.35, 0.36], panSpan: [0, 1], window: 33 },
}

export function travelLook(id: string): TravelLook {
  return { ...BASE, ...(TRAVEL[id] ?? {}) }
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

  from = 0
  until = 0
  open = 1

  constructor(id: string, over: Partial<TravelLook> = {}) {
    this.look = { ...travelLook(id), ...over }
    this.panEase = this.look.turnRun[0] > 0 ? slowEase(this.look.turnRun[0], this.look.turnRun[1]) : this.look.cruise > 0 ? cruiseEase(this.look.cruise) : betaEase(this.look.pan[0], this.look.pan[1])
    this.rollEase = this.look.cruise > 0 ? cruiseEase(this.look.cruise) : betaEase(this.look.roll[0], this.look.roll[1])
    this.pinEase = betaEase(this.look.pinEase[0], this.look.pinEase[1])
    const run = this.look.growRun
    const beta = betaEase(this.look.grow[0], this.look.grow[1])
    const ease = runEase(run[1], run[2])
    this.growEase = run[1] > 0 ? (x) => ease(span([run[0], 1], x)) : beta
  }

  pan(u: number): number {
    const main = this.panEase(span([Math.max(this.look.panSpan[0], this.from - this.look.early), this.look.panSpan[1]], u))
    const share = this.look.lead[0]
    return share > 0 ? share * this.leadEase(span([0, this.look.lead[1]], u)) + (1 - share) * main : main
  }

  roll(u: number): number {
    return this.rollEase(span([Math.max(this.look.rollSpan[0], this.from - this.look.early), this.look.rollSpan[1]], u))
  }

  pass(u: number): number {
    const t = Math.max(u, 0) / this.look.passBy
    const p = this.look.passPower
    const k = this.look.passKnee
    if (k >= 1) return Math.pow(t, p)
    const run = (v: number) => (v <= k ? Math.pow(v, p) : Math.pow(k, p) + p * Math.pow(k, p - 1) * (v - k))
    return run(t) / run(1)
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

export function inFrame(q: THREE.Quaternion, vfovDeg: number, aspect: number, to: THREE.Vector3, radius: number, marginDeg: number): boolean {
  const d = to.length()
  const v = to.clone().multiplyScalar(1 / d).applyQuaternion(q.clone().invert())
  const hy = THREE.MathUtils.degToRad(vfovDeg) / 2
  const hx = Math.atan(Math.tan(hy) * aspect)
  const need = Math.asin(Math.min(radius / d, 1)) + THREE.MathUtils.degToRad(marginDeg)
  const out = Math.max(v.x * Math.cos(hx) + v.z * Math.sin(hx), -v.x * Math.cos(hx) + v.z * Math.sin(hx), v.y * Math.cos(hy) + v.z * Math.sin(hy), -v.y * Math.cos(hy) + v.z * Math.sin(hy))
  return Math.asin(Math.min(Math.max(out, -1), 1)) < need
}
