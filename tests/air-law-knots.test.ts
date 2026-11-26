import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import type { SetContext } from '../src/core/types'
import { AIR_LAW_GLSL, AIR_LAW_KNOTS_GLSL, AIR_LAW_KNOT_HALF, AIR_LAW_KNOT_RATE, AIR_LAW_KNOT_STEP, AIR_LAW_TOP, airLawDepth, airLawDepthOut, airLawFactor, airLawFactorSeen, airLawGather, airLawGatherError, airLawGatherOut, airLawHeld, airLawPathShare, airLawSeen, airLawShare, type AirKnots, type AirVec } from '../src/terrain/air'
import { AIR_LAW_FRAG, AIR_LAW_FRAG_KNOTS, AIR_LAW_KNOT_LEAST, AIR_LAW_KNOT_UNIFORMS, AIR_LAW_LAYER, AIR_LAW_LAYER_KNOTS, AIR_LAW_SHARE, AIR_LAW_SHARE_IN, AIR_LAW_SHARE_OUT, Relief, airLawKnots, withAirLaw, withAirLawShare, type ReliefAirLaw, type ReliefDef, type ReliefMotion } from '../src/terrain/relief'

// The air's light by height (MAIL 1117): three knots, and what a path gathers where each stretch of air shines with the share of its
// own height. The twins of src/terrain/air.ts against the numerical integral, the picture term with it, and the relief's field. The
// law itself is tests/air-law.test.ts; the pixels are tests/air-law-gl.test.ts.

// The canyon of the order: the rim 0.0005 radii over the datum, the floor 0.0015 under it; the light whole over the rim, falling under.
const HEIGHTS: AirKnots = [-0.0015, -0.0005, 0.0005]
const SHARES: AirKnots = [0.3, 0.6, 1]

// The numerical integral along the line from a along d, with the heights as they are (no second order): the share of the light at each
// step times what the step takes from the factor.
function integral(a: AirVec, d: AirVec, len: number, H: number, density: number, heights: AirKnots, shares: AirKnots, n = 16000): { gathered: number; factor: number } {
  const mid = -(a[0] * d[0] + a[1] * d[1] + a[2] * d[2])
  const low2 = a[0] * a[0] + a[1] * a[1] + a[2] * a[2] - mid * mid
  const top = 1 + Math.max(heights[2], 0) + 45 * H
  const reach = Math.sqrt(Math.max(top * top - low2, 0))
  const s0 = Math.max(0, mid - reach)
  const s1 = Math.min(len, mid + reach)
  if (!(s1 > s0)) return { gathered: 0, factor: 1 }
  const ds = (s1 - s0) / n
  let factor = 1
  let gathered = 0
  for (let i = 0; i < n; i++) {
    const s = s0 + (i + 0.5) * ds
    const r = Math.hypot(a[0] + d[0] * s, a[1] + d[1] * s, a[2] + d[2] * s)
    const next = factor * Math.exp(-density * Math.exp((1 - r) / H) * ds)
    gathered += airLawShare(r, heights, shares) * (factor - next)
    factor = next
  }
  return { gathered, factor }
}

interface Path { a: AirVec; b: AirVec; d: AirVec; len: number; out: boolean; what: string }

// Paths of the dive and of the place: the eye from half a radius up down into the canyon, points on the canyon's floor, walls and
// rim near and far, and sight lines out of the shell from under the horizon to straight up. A line that goes more than three scale
// heights under the lowest knot through the ball is left out.
function paths(H: number): Path[] {
  const out: Path[] = []
  for (const eyeH of [0.5, 0.05, 0.01, 0.003, 0.001, 0.0003, -0.0008]) {
    const a: AirVec = [0, 1 + eyeH, 0]
    const deep = (d: AirVec, len: number): boolean => {
      const mid = -(a[0] * d[0] + a[1] * d[1])
      return mid > 0 && mid < len && Math.sqrt(Math.max(a[1] * a[1] - mid * mid, 0)) < 1 + HEIGHTS[0] - 3 * H
    }
    for (const pointH of [-0.0015, -0.0012, -0.0008, -0.0003, 0, 0.0004, 0.001]) {
      for (const angle of [0, 0.0005, 0.002, 0.01, 0.03, 0.08, 0.2, 0.5]) {
        const b: AirVec = [(1 + pointH) * Math.sin(angle), (1 + pointH) * Math.cos(angle), 0]
        const len = Math.hypot(b[0] - a[0], b[1] - a[1])
        if (!(len > 0)) continue
        const d: AirVec = [(b[0] - a[0]) / len, (b[1] - a[1]) / len, 0]
        if (deep(d, len)) continue
        out.push({ a, b, d, len, out: false, what: 'eye ' + eyeH + ' point ' + pointH + ' angle ' + angle })
      }
    }
    for (const elevation of [-0.05, -0.02, -0.005, 0, 0.005, 0.02, 0.1, 0.5, 1.5]) {
      const d: AirVec = [Math.cos(elevation), Math.sin(elevation), 0]
      if (deep(d, 1e9)) continue
      out.push({ a, b: a, d, len: 1e9, out: true, what: 'eye ' + eyeH + ' elevation ' + elevation })
    }
  }
  return out
}

describe('the light by height: the share', () => {
  it('is the knot at a knot, a straight line between two, and held under the lowest and over the highest', () => {
    for (let i = 0; i < 3; i++) expect(airLawShare(1 + HEIGHTS[i]!, HEIGHTS, SHARES)).toBeCloseTo(SHARES[i]!, 12)
    expect(airLawShare(1 - 0.001, HEIGHTS, SHARES)).toBeCloseTo(0.45, 12)
    expect(airLawShare(1, HEIGHTS, SHARES)).toBeCloseTo(0.8, 12)
    expect(airLawShare(1 - 0.5, HEIGHTS, SHARES)).toBe(0.3)
    expect(airLawShare(1 + 0.0006, HEIGHTS, SHARES)).toBe(1)
    expect(airLawShare(50, HEIGHTS, SHARES)).toBe(1)
    // no step at a knot
    for (const h of HEIGHTS) expect(Math.abs(airLawShare(1 + h + 1e-9, HEIGHTS, SHARES) - airLawShare(1 + h - 1e-9, HEIGHTS, SHARES))).toBeLessThan(1e-5)
    // two knots at one height (a third knot given to two): the share of the upper one from there on, no division by nothing
    expect(airLawShare(1 + 0.0005, [-0.0005, 0.0005, 0.0005], [0.3, 1, 1])).toBeCloseTo(1, 10)
    expect(airLawShare(1 + 0.00051, [-0.0005, 0.0005, 0.0005], [0.3, 1, 1])).toBe(1)
    expect(Number.isFinite(airLawShare(1 + 0.0005 - 1e-12, [-0.0005, 0.0005, 0.0005], [0.3, 1, 1]))).toBe(true)
  })
})

describe('the light by height: what a path gathers', () => {
  it('with every share at 1 it is one minus the factor of the path, and with one share at every height that share of it', () => {
    let worst = 0
    for (const H of [0.001, 0.0045, 0.02]) {
      for (const p of paths(H)) {
        for (const density of [5, 45, 400]) {
          const factor = airLawFactor(p.out ? airLawDepthOut(p.a, p.d, H) : airLawDepth(p.a, p.b, H), density)
          const one = p.out ? airLawGatherOut(p.a, p.d, H, density, HEIGHTS, [1, 1, 1]) : airLawGather(p.a, p.b, H, density, HEIGHTS, [1, 1, 1])
          const part = p.out ? airLawGatherOut(p.a, p.d, H, density, HEIGHTS, [0.37, 0.37, 0.37]) : airLawGather(p.a, p.b, H, density, HEIGHTS, [0.37, 0.37, 0.37])
          worst = Math.max(worst, Math.abs(one - (1 - factor)), Math.abs(part - 0.37 * (1 - factor)))
        }
      }
    }
    console.log('AIR-KNOTS every share alike: worst off that share of one minus the factor ' + worst.toExponential(3))
    expect(worst).toBeLessThan(1e-9)
  })

  // The canyon at the scale heights from the least the law takes to the most, and other knots: two of them two scale heights apart,
  // a wide canyon whose floor has no light, and a steep step of the share. Every density at the three middle scale heights.
  const CASES: { H: number; heights: AirKnots; shares: AirKnots; densities: number[] }[] = [
    { H: 0.0005, heights: HEIGHTS, shares: SHARES, densities: [45, 120] },
    { H: 0.001, heights: HEIGHTS, shares: SHARES, densities: [5, 20, 45, 120, 400] },
    { H: 0.0045, heights: HEIGHTS, shares: SHARES, densities: [5, 20, 45, 120, 400] },
    { H: 0.02, heights: HEIGHTS, shares: SHARES, densities: [5, 20, 45, 120, 400] },
    { H: 0.1, heights: HEIGHTS, shares: SHARES, densities: [45, 120] },
    { H: 0.001, heights: [-0.002, 0, 1e-7], shares: [0.2, 1, 1], densities: [45, 120] },
    { H: 0.0045, heights: [-0.006, -0.002, 0.002], shares: [0, 0.3, 1], densities: [45, 120] },
    { H: 0.001, heights: HEIGHTS, shares: [0.1, 0.9, 1], densities: [45, 120] },
  ]
  for (const [index, { H, heights, shares, densities }] of CASES.entries()) {
    it('case ' + index + ', scale height ' + H + ', knots ' + JSON.stringify(heights) + ' with ' + JSON.stringify(shares) + ': it is the numerical integral within airLawGatherError, and lies between the least and the most share of what the path takes', () => {
      let n = 0
      const worst: Record<number, number> = {}
      let where = ''
      let most = 0
      for (const density of densities) {
        worst[density] = 0
        for (const p of paths(H)) {
          const want = integral(p.a, p.d, p.len, H, density, heights, shares)
          const got = p.out ? airLawGatherOut(p.a, p.d, H, density, heights, shares) : airLawGather(p.a, p.b, H, density, heights, shares)
          const factor = airLawFactor(p.out ? airLawDepthOut(p.a, p.d, H) : airLawDepth(p.a, p.b, H), density)
          expect(got).toBeGreaterThanOrEqual(Math.min(...shares) * (1 - factor) - 1e-9)
          expect(got).toBeLessThanOrEqual(Math.max(...shares) * (1 - factor) + 1e-9)
          const off = Math.abs(got - want.gathered)
          worst[density] = Math.max(worst[density]!, off)
          if (off > most) {
            most = off
            where = 'density ' + density + ' ' + p.what
          }
          n++
        }
      }
      const bound = airLawGatherError(H, heights, shares)
      console.log('AIR-KNOTS scale height ' + H + ', knots ' + JSON.stringify(heights) + ' shares ' + JSON.stringify(shares) + ', ' + n + ' paths: worst off the integral, of the light, by density ' + Object.entries(worst).map(([k, v]) => k + ': ' + v.toExponential(2)).join(', ') + ' (' + where + '), the bound ' + bound.toExponential(2))
      expect(n).toBeGreaterThan(600)
      expect(most).toBeLessThan(bound)
    }, 240000)
  }

  it('has no step where the end of a path, its eye or its lowest point crosses the sphere of a knot', () => {
    const H = 0.0045
    const density = 60
    // What the sweep may do from one step to the next: a kink, not a step. A step is a change more than three times both its
    // neighbours and more than a thousandth of the whole sweep.
    const stands = (values: number[]): { whole: number; worst: number } => {
      const steps = values.slice(1).map((v, i) => v - values[i]!)
      const whole = Math.max(...values) - Math.min(...values)
      let worst = 0
      for (let i = 1; i < steps.length - 1; i++) {
        const around = Math.max(Math.abs(steps[i - 1]!), Math.abs(steps[i + 1]!))
        const over = Math.abs(steps[i]!) - 3 * around
        worst = Math.max(worst, over / whole)
      }
      return { whole, worst }
    }
    const hold = (values: number[], name: string): number => {
      const { whole, worst } = stands(values)
      expect(whole, name).toBeGreaterThan(0.01)
      expect(worst, name).toBeLessThan(0.001)
      return worst
    }
    // the measure sees a step: a smooth sweep with a jump of a two hundredth of its range at one place
    expect(stands(Array.from({ length: 1600 }, (_, i) => Math.sin(i / 1600) + (i > 700 ? 0.005 * Math.sin(1) : 0))).worst).toBeGreaterThan(0.001)
    expect(stands(Array.from({ length: 1600 }, (_, i) => Math.sin(i / 1600))).worst).toBe(0)
    const N = 1600
    // the point seen sinks from over the rim to under the floor, seen from above
    const sink = Array.from({ length: N }, (_, i) => airLawGather([0, 1.01, 0], [(1 + 0.001 - (0.003 * i) / N) * Math.sin(0.01), (1 + 0.001 - (0.003 * i) / N) * Math.cos(0.01), 0], H, density, HEIGHTS, SHARES))
    // the eye dives from over the rim to the floor, a point in the canyon ahead
    const dive = Array.from({ length: N }, (_, i) => airLawGather([0, 1 + 0.003 - (0.0042 * i) / N, 0], [(1 - 0.0009) * Math.sin(0.02), (1 - 0.0009) * Math.cos(0.02), 0], H, density, HEIGHTS, SHARES))
    // a level line over the canyon whose lowest point sinks through the three spheres: a far point, eye and point sinking together
    const graze = Array.from({ length: N }, (_, i) => {
      const h = 0.004 - (0.0045 * i) / N
      return airLawGather([0, 1 + h, 0], [(1 + h) * Math.sin(0.12), (1 + h) * Math.cos(0.12), 0], H, density, HEIGHTS, SHARES)
    })
    // a sight line out of the shell that swings from under the horizon to over it, from an eye in the canyon
    const swing = Array.from({ length: N }, (_, i) => {
      const e = -0.04 + (0.1 * i) / N
      return airLawGatherOut([0, 1 - 0.0008, 0], [Math.cos(e), Math.sin(e), 0], H, density, HEIGHTS, SHARES)
    })
    console.log('AIR-KNOTS no step: the most a step stands over three times its neighbours, as a share of the sweep: the point sinking ' + hold(sink, 'sink').toExponential(2) + ', the eye diving ' + hold(dive, 'dive').toExponential(2) + ', the lowest point sinking ' + hold(graze, 'graze').toExponential(2) + ', the sight line swinging ' + hold(swing, 'swing').toExponential(2))
  })

  it('a path cut in two adds up: the first part, and the second through the factor of the first', () => {
    const H = 0.0045
    let worst = 0
    let n = 0
    for (const density of [5, 45, 120]) {
      for (const p of paths(H)) {
        if (p.out) continue
        for (const t of [0.2, 0.5, 0.9]) {
          const m: AirVec = [p.a[0] + p.d[0] * p.len * t, p.a[1] + p.d[1] * p.len * t, 0]
          const whole = airLawGather(p.a, p.b, H, density, HEIGHTS, SHARES)
          const parts = airLawGather(p.a, m, H, density, HEIGHTS, SHARES) + airLawFactor(airLawDepth(p.a, m, H), density) * airLawGather(m, p.b, H, density, HEIGHTS, SHARES)
          worst = Math.max(worst, Math.abs(whole - parts))
          n++
        }
      }
    }
    console.log('AIR-KNOTS a path cut in two, ' + n + ' cuts: worst off the whole, of the light ' + worst.toExponential(3))
    expect(n).toBeGreaterThan(2000)
    expect(worst).toBeLessThan(2 * airLawGatherError(H, HEIGHTS, SHARES))
  })

  it('never an inf or a NaN: a line through the ball, a path of no length, an eye far out, no air, knots at one height', () => {
    const H = 0.0045
    const lines: [AirVec, AirVec][] = [[[0, 1.2, 0], [0, -1.2, 0]], [[0, 1.2, 0], [0.3, -1.1, 0.2]], [[0, 50, 0], [0, 0.999, 0]], [[30, 40, 0], [0.001, 0.9995, 0]], [[0, 1.0001, 0], [0, 1.0001, 0]], [[0, 0, 0], [0, 1, 0]], [[0, 0.4, 0], [0.1, 0.5, 0]]]
    for (const [a, b] of lines) {
      for (const density of [0, 1, 1e4]) {
        for (const heights of [HEIGHTS, [-0.0005, 0.0005, 0.0005] as AirKnots, [0.01, 0.02, 0.5] as AirKnots]) {
          const g = airLawGather(a, b, H, density, heights, SHARES)
          expect(Number.isFinite(g)).toBe(true)
          expect(g).toBeGreaterThanOrEqual(0)
          expect(g).toBeLessThanOrEqual(1 + 1e-12)
          const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
          if (len > 0) {
            const o = airLawGatherOut(a, [(b[0] - a[0]) / len, (b[1] - a[1]) / len, (b[2] - a[2]) / len], H, density, heights, SHARES)
            expect(Number.isFinite(o)).toBe(true)
            expect(o).toBeGreaterThanOrEqual(0)
            expect(o).toBeLessThanOrEqual(1 + 1e-12)
          }
        }
      }
    }
    expect(airLawGather([0, 1.0001, 0], [0, 1.0001, 0], H, 45, HEIGHTS, SHARES)).toBe(0)
    expect(airLawGather([0, 1.2, 0], [0.4, 1.3, 0], H, 0, HEIGHTS, SHARES)).toBe(0)
    // the twins refuse a scale height the law was not measured for
    expect(() => airLawGather([0, 1.2, 0], [0, 1, 0], 0.2, 1, HEIGHTS, SHARES)).toThrow('measured')
    expect(() => airLawGatherOut([0, 1.2, 0], [0, 1, 0], 0.0001, 1, HEIGHTS, SHARES)).toThrow('measured')
  })

  it('the share of the light along a path is what the path gathers over what it takes from the factor, between the lowest and the highest share', () => {
    let worst = 0
    let alike = 0
    let low = 1
    let high = 0
    let count = 0
    for (const H of [0.001, 0.0045, 0.02]) {
      for (const p of paths(H)) {
        if (p.out) continue
        for (const density of [5, 45, 400]) {
          const took = 1 - airLawFactor(airLawDepth(p.a, p.b, H), density)
          const share = airLawPathShare(p.a, p.b, H, density, HEIGHTS, SHARES)
          expect(share).toBeGreaterThanOrEqual(SHARES[0])
          expect(share).toBeLessThanOrEqual(SHARES[2])
          // times what the path takes it is the gather again, to the float: the mesh carries the share and the fragment its own factor
          worst = Math.max(worst, Math.abs(share * took - airLawGather(p.a, p.b, H, density, HEIGHTS, SHARES)))
          alike = Math.max(alike, Math.abs(airLawPathShare(p.a, p.b, H, density, HEIGHTS, [0.37, 0.37, 0.37]) - 0.37))
          low = Math.min(low, share)
          high = Math.max(high, share)
          count++
        }
      }
    }
    console.log('AIR-KNOTS the share of the light along ' + count + ' paths: from ' + low.toFixed(4) + ' to ' + high.toFixed(4) + ', times one minus the factor off the gather by up to ' + worst.toExponential(3) + ', every share alike off that share by up to ' + alike.toExponential(3))
    expect(count).toBeGreaterThan(900)
    expect(worst).toBeLessThan(1e-9)
    expect(alike).toBeLessThan(1e-9)
    // the paths reach from the canyon's floor to over its rim, so the share goes nearly from the lowest knot to the highest
    expect(low).toBeLessThan(0.35)
    expect(high).toBeGreaterThan(0.95)
    // a path of no length and a path through no air take nothing: the share is a number in the range, never an inf or a NaN
    for (const [a, b, density] of [[[0, 1.0001, 0], [0, 1.0001, 0], 45], [[0, 1.2, 0], [0.4, 1.3, 0], 0], [[0, 50, 0], [0, 40, 0], 45]] as [AirVec, AirVec, number][]) {
      const share = airLawPathShare(a, b, 0.0045, density, HEIGHTS, SHARES)
      expect(Number.isFinite(share)).toBe(true)
      expect(share).toBeGreaterThanOrEqual(SHARES[0])
      expect(share).toBeLessThanOrEqual(SHARES[2])
    }
  })
})

describe('the light by height: a picture that holds its air', () => {
  const H = 0.0045
  const light: AirVec = [0.27, 0.19, 0.14]
  const body: AirVec = [0.6, 0.35, 0.2]
  const pictureEye: AirVec = [0, 1 + 0.0003, 0]
  const points: AirVec[] = [[0.0005, 1 - 0.0012, 0.0002], [0.004, 1 - 0.0004, 0.001], [0.02, 1 + 0.0002, 0], [0.09, 1 - 0.0001, 0.01]]
  const eyes: AirVec[] = [[0, 1.3, 0.1], [0.01, 1.02, 0], [0, 1.004, 0], [-0.001, 1.0012, 0.0004], [0.0002, 1 + 0.0003, 0], [0.0003, 1 - 0.0006, 0]]

  it('seen from another eye is the frame a globe draws from that eye: the body through the present path plus what that path gathers', () => {
    let worst = 0
    let n = 0
    for (const density of [5, 45, 120]) {
      for (const b of points) {
        const seen = airLawDepth(pictureEye, b, H)
        const was = airLawGather(pictureEye, b, H, density, HEIGHTS, SHARES)
        const painted: AirVec = [0, 1, 2].map((c) => body[c]! * airLawFactor(seen, density) + light[c]! * was) as unknown as AirVec
        for (const eye of eyes) {
          const depth = airLawDepth(eye, b, H)
          const now = airLawGather(eye, b, H, density, HEIGHTS, SHARES)
          const got = airLawSeen(painted, light, airLawFactorSeen(depth, seen, density, 0), now, airLawHeld(was, seen, density, 0))
          for (let c = 0; c < 3; c++) worst = Math.max(worst, Math.abs(got[c]! - (body[c]! * airLawFactor(depth, density) + light[c]! * now)) / (body[c]! * airLawFactor(depth, density) + light[c]! * now))
          n++
        }
        // from the picture's own eye: the painted colour to the last bit, for any numbers
        expect(airLawSeen(painted, light, airLawFactorSeen(seen, seen, density, 0), was, airLawHeld(was, seen, density, 0))).toEqual([painted[0], painted[1], painted[2]])
      }
    }
    console.log('AIR-KNOTS the picture from other eyes, ' + n + ' paths: worst share off the globe frame ' + worst.toExponential(3))
    expect(worst).toBeLessThan(1e-9)
  })

  it('with a least the colour holds the least of the body and that much less of the gathered light, and the frame is the same', () => {
    let worst = 0
    let bound = 0
    for (const least of [0.05, 0.4, 1]) {
      for (const density of [45, 120]) {
        for (const b of points) {
          const seen = airLawDepth(pictureEye, b, H)
          const was = airLawGather(pictureEye, b, H, density, HEIGHTS, SHARES)
          const kept = Math.max(airLawFactor(seen, density), least)
          const held = airLawHeld(was, seen, density, least)
          if (kept > airLawFactor(seen, density)) bound++
          // what the baker lays in the texel: the body times what is kept, plus the gathered light less the share the least takes off
          expect(held).toBeCloseTo((was * (1 - kept)) / Math.max(1 - airLawFactor(seen, density), 1e-30), 12)
          const painted: AirVec = [0, 1, 2].map((c) => body[c]! * kept + light[c]! * held) as unknown as AirVec
          for (const eye of eyes) {
            const depth = airLawDepth(eye, b, H)
            const now = airLawGather(eye, b, H, density, HEIGHTS, SHARES)
            const got = airLawSeen(painted, light, airLawFactorSeen(depth, seen, density, least), now, held)
            for (let c = 0; c < 3; c++) worst = Math.max(worst, Math.abs(got[c]! - (body[c]! * airLawFactor(depth, density) + light[c]! * now)) / (body[c]! * airLawFactor(depth, density) + light[c]! * now))
          }
        }
      }
    }
    console.log('AIR-KNOTS the picture with a least: worst share off the globe frame ' + worst.toExponential(3) + ', the least bound in ' + bound + ' texels')
    expect(bound).toBeGreaterThan(6)
    expect(worst).toBeLessThan(1e-9)
    // least 1: the colour holds no air
    expect(airLawHeld(0.3, 0.02, 45, 1)).toBe(0)
    // no least: all of it
    expect(airLawHeld(0.3, 0.02, 45, 0)).toBe(0.3)
  })

  it('has the floor at black and no ceiling of its own, like the law', () => {
    expect(airLawSeen([0.1, 0.5, 2], [0.4, 0.4, 0.4], 1.5, 0.2, 0.3)).toEqual([0.1 * 1.5 + 0.4 * (0.2 - 1.5 * 0.3), 0.5 * 1.5 + 0.4 * (0.2 - 1.5 * 0.3), 2 * 1.5 + 0.4 * (0.2 - 1.5 * 0.3)])
    expect(airLawSeen([0.01, 0.5, 2], [0.4, 0.4, 0.4], 3, 0.1, 0.5)[0]).toBe(0)
    expect(airLawSeen([40, 40, 40], [0.4, 0.4, 0.4], 9, 0, 0)[0]).toBe(360)
    expect(AIR_LAW_KNOTS_GLSL.includes('return max(point * factor + light * (gathered - factor * held), vec3(0.0));')).toBe(true)
    expect(/min\(point|min\(max\(point/.test(AIR_LAW_KNOTS_GLSL)).toBe(false)
  })
})

describe('the light by height: the second chunk', () => {
  it('is pure functions after the first chunk: no uniform, no varying, no texture, one loop of a fixed count, and the numbers of the twin', () => {
    for (const name of ['float airLawShare(float r, vec3 heights, vec3 shares)', 'float airLawGather(vec3 a, vec3 b, float scaleHeight, float density, vec3 heights, vec3 shares)', 'float airLawGatherOut(vec3 a, vec3 dir, float scaleHeight, float density, vec3 heights, vec3 shares)', 'float airLawHeld(float gathered, float seen, float density, float least)', 'vec3 airLawSeen(vec3 point, vec3 light, float factor, float gathered, float held)']) expect(AIR_LAW_KNOTS_GLSL.split(name).length).toBe(2)
    for (const word of ['uniform', 'precision', 'in vec', 'out vec', 'while', 'texture', 'void main', 'NaN', 'undefined']) expect(AIR_LAW_KNOTS_GLSL.includes(word)).toBe(false)
    expect(AIR_LAW_KNOTS_GLSL.split('for (').length).toBe(2)
    expect(AIR_LAW_KNOTS_GLSL.includes('for (int i = 0; i < 12; i++)')).toBe(true)
    expect(AIR_LAW_KNOTS_GLSL.includes(String(AIR_LAW_TOP) + '.0 * scaleHeight')).toBe(true)
    expect(AIR_LAW_KNOTS_GLSL.includes('b > ' + String(AIR_LAW_KNOT_HALF) + ' * a')).toBe(true)
    expect(AIR_LAW_KNOTS_GLSL.includes('-' + String(AIR_LAW_KNOT_RATE) + '.0, ' + String(AIR_LAW_KNOT_RATE) + '.0)')).toBe(true)
    expect(AIR_LAW_KNOTS_GLSL.split(String(AIR_LAW_KNOT_STEP)).length).toBe(3)
    // the first chunk holds none of it, and the second uses the first one's column
    expect(/airLawShare|airLawGather|airLawHeld|airLawSeen/.test(AIR_LAW_GLSL)).toBe(false)
    expect(AIR_LAW_KNOTS_GLSL.includes('airLawUp(')).toBe(true)
    expect(AIR_LAW_KNOTS_GLSL.includes('float airLawUp(')).toBe(false)
  })
})

describe('the light by height in a relief', () => {
  const picture = (): THREE.Texture => {
    const t = new THREE.Texture()
    t.image = { width: 8, height: 8 }
    return t
  }
  const ctx = { texture: async () => picture(), buffer: async () => new Float32Array(4).fill(5).buffer } as unknown as SetContext
  const def: ReliefDef = {
    imageSize: [32, 16],
    vfovDeg: 40,
    layers: [
      { color: 'far-color.jpg', dist: 'far.bin', box: [0, 0, 32, 16], distSize: [2, 2], tint: [1, 1, 1] },
      { color: 'near-color.jpg', alpha: 'near-alpha.png', dist: 'near.bin', box: [8, 4, 16, 8], distSize: [2, 2], tint: [1, 1, 1] },
    ],
    masks: 'masks.png',
    maskBox: [0, 0, 32, 16],
    mistDir: [1, 0],
  }
  const law: ReliefAirLaw = { light: [0.5, 0.3, 0.2], density: 30, scaleHeight: 0.0045, radius: 972.27, eyeHeight: 1 }
  const motion = (airLaw?: ReliefAirLaw): ReliefMotion => ({ mistSpeed: 0, dustSpeed: 0, dustDir: [1, 0], mesh: 4, pitchDeg: 21.028, ...(airLaw ? { airLaw } : {}) })
  const materials = (r: Relief): THREE.ShaderMaterial[] => {
    const out: THREE.ShaderMaterial[] = []
    r.group.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined
      if (m) out.push(m)
    })
    return out
  }
  const count = (text: string, part: string): number => text.split(part).length - 1
  const LIT = 'vec4(col * alpha, alpha)'

  it('the knots are given in the unit of the relief and taken in radii; two knots get a third one step higher with the upper share', () => {
    expect(airLawKnots(law)).toBe(null)
    const three = airLawKnots({ ...law, knots: [[-1.5, 0.3], [-0.5, 0.6], [0.5, 1]] })!
    for (let i = 0; i < 3; i++) expect(three.heights[i]).toBeCloseTo([-1.5, -0.5, 0.5][i]! / 972.27, 15)
    expect(three.shares).toEqual([0.3, 0.6, 1])
    const two = airLawKnots({ ...law, knots: [[-1.5, 0.3], [0.5, 1]] })!
    expect(two.heights[2]).toBeCloseTo(2.5 / 972.27, 15)
    expect(two.shares).toEqual([0.3, 1, 1])
    // the third knot changes nothing: the share is held over the upper one either way
    for (const h of [-0.004, -0.001, 0.0002, 0.0005, 0.003]) expect(airLawShare(1 + h, two.heights, two.shares)).toBeCloseTo(airLawShare(1 + h, [two.heights[0], two.heights[1], two.heights[1]], [0.3, 1, 1]), 12)
  })

  it('refuses knots that are not two or three, not rising or under 0, by name', async () => {
    const bad = async (knots: unknown): Promise<string> => {
      try {
        await Relief.load(ctx, '', def, motion({ ...law, knots: knots as [number, number][] }))
      } catch (e) {
        return (e as Error).message
      }
      return ''
    }
    expect(await bad([[-1, 0.3]])).toContain('knots')
    expect(await bad([[-1, 0.3], [0, 0.5], [1, 0.7], [2, 1]])).toContain('knots')
    expect(await bad([[0.5, 0.3], [-0.5, 1]])).toContain('knots')
    expect(await bad([[0.5, 0.3], [0.5, 1]])).toContain('knots')
    expect(await bad([[-1, -0.1], [0.5, 1]])).toContain('knots')
    expect(await bad([[-1, 0.3], [0.5, Number.NaN]])).toContain('knots')
    expect(await bad([[-1, 0.3], [-1 + 0.5 * AIR_LAW_KNOT_LEAST * 972.27, 1]])).toContain('knots')
    expect(await bad('high')).toContain('knots')
    expect(await bad([[-1.5, 0.3], [0.5, 1]])).toBe('')
    expect(await bad([[-1.5, 0.3], [-0.5, 0.6], [0.5, 1]])).toBe('')
    // a share over 1 is a light brighter than the number, not an error
    expect(await bad([[-1.5, 0.3], [0.5, 1.4]])).toBe('')
  })

  it('with knots every layer takes the second chunk and its one line, and the dome gathers; without knots no shader holds a word of it', async () => {
    const plain = materials(await Relief.load(ctx, '', def, motion())).filter((m) => m.fragmentShader.includes(LIT))
    const one = materials(await Relief.load(ctx, '', def, motion(law)))
    for (const m of one) {
      expect(/airLawGather|airLawShare|airLawHeld|airLawSeen|uAirHeights|uAirShares/.test(m.fragmentShader + m.vertexShader)).toBe(false)
      expect('uAirHeights' in m.uniforms || 'uAirShares' in m.uniforms).toBe(false)
    }
    const all = materials(await Relief.load(ctx, '', def, motion({ ...law, knots: [[-1.5, 0.3], [-0.5, 0.6], [0.5, 1]] })))
    expect(all.length).toBe(3)
    const layers = all.filter((m) => m.fragmentShader.includes(LIT))
    expect(layers.length).toBe(2)
    layers.forEach((m, i) => {
      expect(m.fragmentShader).toBe(withAirLaw(plain[i]!.fragmentShader, true))
      expect(count(m.fragmentShader, AIR_LAW_GLSL)).toBe(1)
      expect(count(m.fragmentShader, AIR_LAW_KNOTS_GLSL)).toBe(1)
      expect(count(m.fragmentShader, AIR_LAW_LAYER_KNOTS)).toBe(1)
      expect(count(m.fragmentShader, AIR_LAW_LAYER)).toBe(0)
      expect(m.fragmentShader.indexOf(AIR_LAW_KNOTS_GLSL)).toBeGreaterThan(m.fragmentShader.indexOf(AIR_LAW_GLSL))
      // the fragment: the first chunk's three uniforms, the share from the vertices, the two chunks and the one line; no knot of its own
      expect(m.fragmentShader.length).toBe(plain[i]!.fragmentShader.length + AIR_LAW_GLSL.length + AIR_LAW_KNOTS_GLSL.length + AIR_LAW_LAYER_KNOTS.length + '\nuniform vec4 uAirCentre;\nuniform vec3 uAirLight;\nuniform vec3 uAirNumbers;'.length + '\n'.length + AIR_LAW_SHARE_IN.length)
      expect(count(m.fragmentShader, AIR_LAW_SHARE_IN)).toBe(1)
      expect(/uAirHeights|uAirShares/.test(m.fragmentShader)).toBe(false)
      // the vertices: the plain vertex shader with the knots' uniforms, the two chunks and the one line of the share
      expect(m.vertexShader).toBe(withAirLawShare(plain[i]!.vertexShader))
      expect(count(m.vertexShader, AIR_LAW_SHARE)).toBe(1)
      expect(count(m.vertexShader, AIR_LAW_SHARE_OUT)).toBe(1)
      expect(count(m.vertexShader, AIR_LAW_KNOT_UNIFORMS)).toBe(1)
      expect(count(m.vertexShader, AIR_LAW_GLSL)).toBe(1)
      expect(count(m.vertexShader, AIR_LAW_KNOTS_GLSL)).toBe(1)
      expect(m.vertexShader.length).toBe(plain[i]!.vertexShader.length + '\n'.length + AIR_LAW_SHARE_OUT.length + '\nuniform vec4 uAirCentre;\nuniform vec3 uAirLight;\nuniform vec3 uAirNumbers;'.length + AIR_LAW_KNOT_UNIFORMS.length + AIR_LAW_GLSL.length + AIR_LAW_KNOTS_GLSL.length + '\n  '.length + AIR_LAW_SHARE.length)
      expect((m.uniforms.uAirHeights!.value as THREE.Vector3).toArray().map((v) => v * 972.27)).toEqual([-1.5, -0.5, 0.5].map((v) => (v / 972.27) * 972.27))
      expect((m.uniforms.uAirShares!.value as THREE.Vector3).toArray()).toEqual([0.3, 0.6, 1])
    })
    const dome = all.find((m) => !m.fragmentShader.includes(LIT))!
    expect(dome.fragmentShader).toBe(AIR_LAW_FRAG_KNOTS)
    expect(dome.uniforms.uAirHeights && dome.uniforms.uAirShares).toBeTruthy()
    // the dome: the light times what the path out gathers, the cover as before, nothing else changed
    expect(AIR_LAW_FRAG_KNOTS.includes('vec3 glow = uAirLight * airLawGatherOut((vAirEye - uAirCentre.xyz) * uAirCentre.w, d, uAirNumbers.y, uAirNumbers.x, uAirHeights, uAirShares);')).toBe(true)
    expect(AIR_LAW_FRAG_KNOTS.includes('vec3 glow = uAirLight * cut;')).toBe(false)
    expect(AIR_LAW_FRAG_KNOTS.includes('float cut = 1.0 - airLawFactor(airLawDepthOut((vAirEye - uAirCentre.xyz) * uAirCentre.w, d, uAirNumbers.y), uAirNumbers.x);')).toBe(true)
    expect(AIR_LAW_FRAG_KNOTS.length).toBe(AIR_LAW_FRAG.length + AIR_LAW_KNOT_UNIFORMS.length + AIR_LAW_KNOTS_GLSL.length + 'airLawGatherOut((vAirEye - uAirCentre.xyz) * uAirCentre.w, d, uAirNumbers.y, uAirNumbers.x, uAirHeights, uAirShares)'.length - 'cut'.length)
    // the vertices' line: the share of the light along the two paths to the same point, by the two eyes
    expect(AIR_LAW_SHARE.includes('airLawPathShare((vEye - uAirCentre.xyz) * uAirCentre.w, airPoint, uAirNumbers.y, uAirNumbers.x, uAirHeights, uAirShares)')).toBe(true)
    expect(AIR_LAW_SHARE.includes('airLawPathShare(-uAirCentre.xyz * uAirCentre.w, airPoint, uAirNumbers.y, uAirNumbers.x, uAirHeights, uAirShares)')).toBe(true)
    expect(AIR_LAW_SHARE.includes('vec3 airPoint = (vLocal - uAirCentre.xyz) * uAirCentre.w;')).toBe(true)
    // the layer's line: each share times what the fragment's own path takes, the two depths by the two eyes at the fragment, and
    // nothing by the clock or by a height alone in either line
    expect(AIR_LAW_LAYER_KNOTS.includes('float airSeen = airLawDepth(-uAirCentre.xyz * uAirCentre.w, airPoint, uAirNumbers.y);')).toBe(true)
    expect(AIR_LAW_LAYER_KNOTS.includes('float airNow = airLawDepth((vEye - uAirCentre.xyz) * uAirCentre.w, airPoint, uAirNumbers.y);')).toBe(true)
    expect(AIR_LAW_LAYER_KNOTS.includes('vAirShare.x * (1.0 - airLawFactor(airNow, uAirNumbers.x))')).toBe(true)
    expect(AIR_LAW_LAYER_KNOTS.includes('airLawHeld(vAirShare.y * (1.0 - airLawFactor(airSeen, uAirNumbers.x)), airSeen, uAirNumbers.x, uAirNumbers.z)')).toBe(true)
    expect(AIR_LAW_LAYER_KNOTS.includes('airLawFactorSeen(airNow, airSeen, uAirNumbers.x, uAirNumbers.z)')).toBe(true)
    for (const word of ['uUpL', 'uUp', 'uTime', 'smoothstep', 'clamp', 'mix(', 'airLawGather']) expect((AIR_LAW_LAYER_KNOTS + AIR_LAW_SHARE).includes(word)).toBe(false)
  })
})
