import * as THREE from 'three'

export interface TravelLook {
  pan: [number, number]
  panSpan: [number, number]
  roll: [number, number]
  rollSpan: [number, number]
  bowDeg: number
  grow: [number, number]
  swing: [number, number]
  offset: [number, number]
  settle: number
  clearDeg: number
}

const BASE: TravelLook = { pan: [2, 4], panSpan: [0, 1], roll: [2, 2], rollSpan: [0.04, 0.9], bowDeg: 0, grow: [2, 3], swing: [0.1, 1], offset: [0.1, 1], settle: 0.5, clearDeg: 2 }

export const TRAVEL: Record<string, Partial<TravelLook>> = {
  sun: { pan: [2, 3], roll: [2, 2], rollSpan: [0, 1], grow: [2, 3] },
  mercury: { pan: [2, 4], bowDeg: 9, rollSpan: [0.1, 0.92], grow: [2, 3] },
  venus: { pan: [2, 5], bowDeg: -12, rollSpan: [0.05, 0.8], grow: [3, 3] },
  earth: { pan: [2, 4], panSpan: [0, 0.94], bowDeg: -7, rollSpan: [0.02, 0.86], grow: [2, 4] },
  mars: { pan: [2, 4], bowDeg: 10, roll: [2, 2], rollSpan: [0.02, 0.98], grow: [2, 3] },
  jupiter: { pan: [2, 5], bowDeg: -10, rollSpan: [0.08, 0.9], grow: [3, 4] },
  saturn: { pan: [2, 3], panSpan: [0, 0.96], bowDeg: 8, rollSpan: [0.05, 0.85], grow: [2, 3] },
  uranus: { pan: [2, 4], bowDeg: -6, rollSpan: [0.1, 0.95], grow: [3, 3] },
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

const span = (r: [number, number], t: number): number => Math.min(Math.max((t - r[0]) / (r[1] - r[0]), 0), 1)

export class TravelShape {
  readonly look: TravelLook
  private readonly panEase: (t: number) => number
  private readonly rollEase: (t: number) => number
  private readonly growEase: (t: number) => number
  private readonly swingEase = betaEase(2, 3)
  private readonly settleEase = betaEase(2, 2)

  constructor(id: string) {
    this.look = travelLook(id)
    this.panEase = betaEase(this.look.pan[0], this.look.pan[1])
    this.rollEase = betaEase(this.look.roll[0], this.look.roll[1])
    this.growEase = betaEase(this.look.grow[0], this.look.grow[1])
  }

  pan(u: number): number {
    return this.panEase(span(this.look.panSpan, u))
  }

  roll(u: number): number {
    return this.rollEase(span(this.look.rollSpan, u))
  }

  grow(x: number): number {
    return this.growEase(x)
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
