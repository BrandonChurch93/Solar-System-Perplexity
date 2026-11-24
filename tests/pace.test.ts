import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { FilmDirector } from '../src/director/film'
import { bellPeak, bellRate, bellShare, bellStep, checkFlanks, flank, flankArea, flankAreaOf, flankOf, flankWhole, paceLimits, paceOf, type Flanks } from '../src/director/pace'
import { plans } from '../src/director/plans'

// Plan E, the measure. The bell is the one rate curve of a dive and a rise; paceOf is the plan check that mirrors the harness's judge
// (npm run smooth) on the film's own camera.

const SHAPES: Flanks[] = [
  { rise: 0.4, fall: 0.4, corner: 0.2 },
  { rise: 0.5, fall: 0.5, corner: 0.5 },
  { rise: 0.3, fall: 0.45, corner: 0.1 },
  { rise: 0.25, fall: 0.6, corner: 0.35 },
]

describe('the bell, the one rate curve of a move', () => {
  it('rises once and falls once, from no rate to no rate, and its share is its integral', () => {
    for (const f of SHAPES) {
      checkFlanks(f, 'test')
      expect(bellRate(0, f)).toBe(0)
      expect(bellRate(1, f)).toBe(0)
      expect(bellShare(0, f)).toBe(0)
      expect(bellShare(1, f)).toBe(1)
      const n = 20000
      let sum = 0
      let last = 0
      let rising = true
      let turns = 0
      for (let i = 1; i <= n; i++) {
        const x = i / n
        const r = bellRate(x - 0.5 / n, f)
        sum += r / n
        expect(Math.abs(bellShare(x, f) - sum)).toBeLessThan(2e-7)
        if (rising && r < last - 1e-12) {
          rising = false
          turns++
        } else if (!rising && r > last + 1e-12) {
          rising = true
          turns++
        }
        expect(r).toBeLessThanOrEqual(bellPeak(f) + 1e-12)
        last = r
      }
      expect(turns).toBe(1)
      expect(sum).toBeCloseTo(1, 6)
    }
  })

  it('has no kink: the flank and its slope meet their neighbours, and the area of a flank is a half', () => {
    for (const j of [0.05, 0.2, 0.35, 0.5]) {
      const e = 1e-7
      for (const u of [j, 1 - j]) {
        expect(flank(u + e, j) - flank(u - e, j)).toBeLessThan(1e-5)
        const before = (flank(u, j) - flank(u - e, j)) / e
        const after = (flank(u + e, j) - flank(u, j)) / e
        expect(Math.abs(before - after)).toBeLessThan(1e-4)
        expect(Math.abs(flankArea(u + e, j) - flankArea(u - e, j))).toBeLessThan(1e-5)
      }
      expect(flank(1e-9, j)).toBeLessThan(1e-12)
      expect(flank(1 - 1e-9, j)).toBeGreaterThan(1 - 1e-12)
      expect(flankArea(1 - 1e-12, j)).toBeCloseTo(0.5, 9)
    }
  })

  it('never changes by more over one frame than bellStep says, at whole and half frames, and the default shape stays inside the limit', () => {
    const limit = paceLimits().maxStep
    for (const frames of [75, 90]) {
      for (const f of SHAPES) {
        let worst = 0
        for (let k = -4; k <= frames * 2 + 4; k++) {
          const a = bellRate(k / 2 / frames, f)
          const b = bellRate((k - 2) / 2 / frames, f)
          worst = Math.max(worst, Math.abs(a - b))
        }
        expect(worst).toBeLessThanOrEqual(bellStep(f, frames) + 1e-12)
        expect(worst).toBeGreaterThan(bellStep(f, frames) * 0.8)
      }
      expect(bellStep(SHAPES[0]!, frames)).toBeLessThan(limit)
    }
    expect(() => checkFlanks({ rise: 0.7, fall: 0.4, corner: 0.2 }, 'test')).toThrow()
    expect(() => checkFlanks({ rise: 0.4, fall: 0.4, corner: 0 }, 'test')).toThrow()
    expect(() => checkFlanks({ rise: 0.4, fall: 0.4, corner: 0.6 }, 'test')).toThrow()
  })
})

// A stop's option: two corners a flank, the foot's and the top's.
const CORNERED: Flanks[] = [
  { rise: 0.55, fall: 0.4, corner: 0.2, corners: { rise: [0.6, 0.1], fall: [0.05, 0.2] } },
  { rise: 0.4, fall: 0.45, corner: 0.2, corners: { rise: [0.05, 0.9] } },
  { rise: 0.5, fall: 0.5, corner: 0.1, corners: { fall: [0.7, 0.3] } },
  { rise: 0.3, fall: 0.3, corner: 0.5, corners: { rise: [0.5, 0.5], fall: [0.2, 0.05] } },
]

describe('the bell with two corners a flank', () => {
  it('still rises once and falls once from no rate to no rate, and its share is its integral', () => {
    for (const f of CORNERED) {
      checkFlanks(f, 'test')
      expect(bellRate(0, f)).toBe(0)
      expect(bellRate(1, f)).toBe(0)
      expect(bellShare(0, f)).toBe(0)
      expect(bellShare(1, f)).toBe(1)
      const n = 20000
      let sum = 0
      let last = 0
      let rising = true
      let turns = 0
      for (let i = 1; i <= n; i++) {
        const x = i / n
        const r = bellRate(x - 0.5 / n, f)
        sum += r / n
        expect(Math.abs(bellShare(x, f) - sum)).toBeLessThan(2e-7)
        if (rising && r < last - 1e-12) {
          rising = false
          turns++
        } else if (!rising && r > last + 1e-12) {
          rising = true
          turns++
        }
        expect(r).toBeLessThanOrEqual(bellPeak(f) + 1e-12)
        last = r
      }
      expect(turns).toBe(1)
      expect(sum).toBeCloseTo(1, 6)
    }
  })

  it('has no kink where a corner ends, and the area of a flank is what flankWhole says', () => {
    for (const [a, b] of [[0.6, 0.1], [0.05, 0.9], [0.7, 0.3], [0.2, 0.05], [0.5, 0.5]] as [number, number][]) {
      const e = 1e-7
      for (const u of [a, 1 - b]) {
        expect(Math.abs(flankOf(u + e, a, b) - flankOf(u - e, a, b))).toBeLessThan(1e-5)
        const before = (flankOf(u, a, b) - flankOf(u - e, a, b)) / e
        const after = (flankOf(u + e, a, b) - flankOf(u, a, b)) / e
        expect(Math.abs(before - after)).toBeLessThan(1e-4)
        expect(Math.abs(flankAreaOf(u + e, a, b) - flankAreaOf(u - e, a, b))).toBeLessThan(1e-5)
      }
      expect(flankOf(1e-9, a, b)).toBeLessThan(1e-12)
      expect(flankOf(1 - 1e-9, a, b)).toBeGreaterThan(1 - 1e-12)
      expect(flankAreaOf(1 - 1e-12, a, b)).toBeCloseTo(flankWhole(a, b), 9)
      const n = 20000
      let sum = 0
      for (let i = 0; i < n; i++) sum += flankOf((i + 0.5) / n, a, b) / n
      expect(sum).toBeCloseTo(flankWhole(a, b), 7)
    }
    // The soft end is the long one: with a long foot the flank stays low for long and climbs late.
    expect(flankOf(0.5, 0.8, 0.1)).toBeLessThan(flankOf(0.5, 0.1, 0.1))
    expect(flankOf(0.5, 0.1, 0.8)).toBeGreaterThan(flankOf(0.5, 0.1, 0.1))
  })

  it('is the plain bell where both corners of both flanks are the corner', () => {
    for (const f of SHAPES) {
      const named: Flanks = { ...f, corners: { rise: [f.corner, f.corner], fall: [f.corner, f.corner] } }
      expect(bellPeak(named)).toBeCloseTo(bellPeak(f), 12)
      expect(bellStep(named, 75)).toBeCloseTo(bellStep(f, 75), 12)
      for (let i = 0; i <= 400; i++) {
        expect(bellRate(i / 400, named)).toBeCloseTo(bellRate(i / 400, f), 12)
        expect(bellShare(i / 400, named)).toBeCloseTo(bellShare(i / 400, f), 12)
      }
    }
  })

  it('never changes by more over one frame than bellStep says, and refuses corners that leave a flank no room', () => {
    for (const frames of [75, 90]) {
      for (const f of CORNERED) {
        let worst = 0
        for (let k = -4; k <= frames * 2 + 4; k++) {
          const a = bellRate(k / 2 / frames, f)
          const b = bellRate((k - 2) / 2 / frames, f)
          worst = Math.max(worst, Math.abs(a - b))
        }
        expect(worst).toBeLessThanOrEqual(bellStep(f, frames) + 1e-12)
        expect(worst).toBeGreaterThan(bellStep(f, frames) * 0.8)
      }
    }
    expect(() => checkFlanks({ rise: 0.4, fall: 0.4, corner: 0.2, corners: { rise: [0.6, 0.5] } }, 'test')).toThrow(/two corners of the rise flank/)
    expect(() => checkFlanks({ rise: 0.4, fall: 0.4, corner: 0.2, corners: { fall: [0, 0.5] } }, 'test')).toThrow(/two corners of the fall flank/)
    expect(() => checkFlanks({ rise: 0.4, fall: 0.4, corner: 0.2, corners: { fall: [0.3, Number.NaN] } }, 'test')).toThrow()
    expect(() => checkFlanks({ rise: 0.4, fall: 0.4, corner: 0.2, corners: {} }, 'test')).not.toThrow()
  })
})

describe('the plan check of a move', () => {
  const film = new FilmDirector(plans)
  const limits = paceLimits()

  it('reads the fall, the turn and the speed of every dive and rise of the film at whole and half frames', () => {
    let moves = 0
    for (const plan of plans) {
      for (const kind of ['dive', 'rise'] as const) {
        const seg = config.segments.find((s) => s.stop === plan.id && s.kind === kind)
        const pace = paceOf(film, plan, kind)
        if (!seg) {
          expect(pace).toBeNull()
          continue
        }
        moves++
        expect(pace!.rate).toBe(limits.rate)
        for (const name of ['fall', 'turn', 'speed'] as const) {
          const c = pace!.curves[name]
          expect(Number.isFinite(c.mean)).toBe(true)
          expect(c.mean).toBeGreaterThan(0)
          expect(c.worstStep).not.toBeNull()
          expect(c.worstHalfStep).not.toBeNull()
          expect(c.peak!.frame).toBeGreaterThanOrEqual(seg.firstFrame)
          expect(c.peak!.frame).toBeLessThan(seg.endFrame)
        }
        // The fall is the log of the height: its mean over the segment times the frames is the log of the ratio of the heights at its ends.
        const fall = pace!.curves.fall
        const first = seg.firstFrame * pace!.rate + 1
        const end = seg.endFrame * pace!.rate
        const k0 = Math.max(pace!.firstFrame * pace!.rate - 1, 0)
        let sum = 0
        for (let k = first; k < end; k++) sum += fall.over[k - k0]! * fall.mean
        expect(sum / (end - first)).toBeCloseTo(fall.mean, 9)
        expect(pace!.ok).toBe(pace!.faults.length === 0)
      }
    }
    expect(moves).toBe(17)
  })

  it('names a move that jumps: the same film at one capture frame a film frame hides the half steps, never the whole ones', () => {
    const mars = plans.find((p) => p.id === 'mars')!
    const two = paceOf(film, mars, 'dive', 2)!
    const one = paceOf(film, mars, 'dive', 1)!
    expect(one.curves.fall.worstHalfStep).toBeNull()
    expect(Math.abs(one.curves.fall.mean - two.curves.fall.mean)).toBeLessThan(two.curves.fall.mean * 0.02)
    expect(one.curves.fall.worstStep!.value).toBeGreaterThan(0)
    expect(two.curves.fall.worstStep!.value).toBeGreaterThanOrEqual(two.curves.fall.worstHalfStep!.value)
  })
})
