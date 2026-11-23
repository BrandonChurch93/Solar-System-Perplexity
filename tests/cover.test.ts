import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { FilmDirector } from '../src/director/film'
import { StopPlan, type Fit } from '../src/director/moves'
import { plans } from '../src/director/plans'
import { coverTiming, coverWindow, setCoverWindow } from '../src/director/timeline'
import { coveredFit as fit, coveredParams, coveredPlan, restorePlans } from './lib/covered'

const c = config.raw.cover
const seg = (kind: string): (typeof config.segments)[number] => config.segments.find((s) => s.stop === 'mars' && s.kind === kind)!
const dive = seg('dive')
const rise = seg('rise')
const params = coveredParams()
const own = coveredPlan().p.coverWindow

afterAll(() => restorePlans())
const amounts = (plan: StopPlan, s: typeof rise): number[] => Array.from({ length: s.frames }, (_, i) => plan.coverAmount(s, (s.firstFrame + i) / config.fps))

describe('cover window of a stop', () => {
  afterEach(() => setCoverWindow('mars', own))

  it('takes the film wide numbers when the plan sets nothing', () => {
    setCoverWindow('mars', undefined)
    expect(coverTiming(dive)).toEqual({ seconds: c.seconds, center: dive.start + c.diveCenterFraction * (dive.end - dive.start) })
    expect(coverTiming(rise)).toEqual({ seconds: c.seconds, center: rise.start + c.riseCenterFraction * (rise.end - rise.start) })
    for (const s of [dive, rise]) {
      const w = coverWindow(s)!
      expect(w.lastFrame - w.firstFrame).toBe(Math.round(c.seconds * config.fps))
    }
    expect(coverTiming(seg('hold'))).toBeNull()
    expect(coverWindow(seg('terrain'))).toBeNull()
  })

  it('grows about the same centre when the plan asks for more seconds', () => {
    setCoverWindow('mars', undefined)
    const before = { dive: coverWindow(dive)!, rise: coverWindow(rise)! }
    setCoverWindow('mars', { rise: { seconds: 2 * c.seconds } })
    const w = coverWindow(rise)!
    expect(w.centerFrame).toBe(before.rise.centerFrame)
    expect(w.lastFrame - w.firstFrame).toBe(Math.round(2 * c.seconds * config.fps))
    expect(w.firstFrame).toBeLessThan(before.rise.firstFrame)
    expect(w.lastFrame).toBeGreaterThan(before.rise.lastFrame)
    expect(Math.abs(w.centerFrame - w.firstFrame - (w.lastFrame - w.centerFrame))).toBeLessThanOrEqual(1)
    expect(coverWindow(dive)).toEqual(before.dive)
    expect(coverWindow(seg('rise'))).toEqual(w)
    for (const other of config.segments.filter((s) => s.stop !== 'mars')) {
      const t = coverTiming(other)
      if (t) expect(t.seconds).toBe(plans.find((p) => p.id === other.stop)!.p.coverWindow?.[other.kind as 'dive' | 'rise']?.seconds ?? c.seconds)
    }
  })

  it('moves the centre and stays inside the segment', () => {
    setCoverWindow('mars', { dive: { center: 0.5 }, rise: { seconds: 100 } })
    expect(coverWindow(dive)!.centerFrame).toBe(Math.floor((dive.start + 0.5 * (dive.end - dive.start)) * config.fps + 1e-9))
    expect(coverTiming(dive)!.seconds).toBe(c.seconds)
    const w = coverWindow(rise)!
    expect(w.firstFrame).toBe(rise.firstFrame)
    expect(w.lastFrame).toBe(rise.endFrame - 1)
  })

  it('refuses a window without length or a centre outside the segment', () => {
    expect(() => setCoverWindow('mars', { rise: { seconds: 0 } })).toThrow()
    expect(() => setCoverWindow('mars', { dive: { center: 1 } })).toThrow()
    expect(() => setCoverWindow('mars', { dive: { center: 0 } })).toThrow()
  })

  it('carries the plan field into the cover amount, the view switch and the shots of the film', () => {
    const plain = new StopPlan('mars', fit as Fit, { ...params, coverWindow: undefined })
    const base = amounts(plain, rise)
    const centre = coverWindow(rise)!.centerFrame
    const wide = new StopPlan('mars', fit as Fit, { ...params, coverWindow: { rise: { seconds: 2 * c.seconds } } })
    const w = coverWindow(rise)!
    const grown = amounts(wide, rise)
    const count = (a: number[]): number => a.filter((x) => x > 0).length
    expect(count(grown)).toBeGreaterThan(count(base) + Math.round(c.seconds * config.fps) - 3)
    grown.forEach((x, i) => expect(x > 0).toBe(rise.firstFrame + i > w.firstFrame && rise.firstFrame + i <= w.lastFrame))
    expect(w.centerFrame).toBe(centre)
    expect(wide.rise((centre - 1) / config.fps).view).toBe('terrain')
    expect(wide.rise(centre / config.fps).view).toBe('orbit')
    const director = new FilmDirector(plans.map((p) => (p.id === 'mars' ? wide : p)))
    for (const f of [w.firstFrame + 1, centre, w.lastFrame]) {
      const shot = director.shotAt(f, f / config.fps)
      expect(shot.cover.amount).toBe(grown[f - rise.firstFrame])
      expect(shot.cover.amount).toBeGreaterThan(0)
      expect(shot.sets.find((s) => s.id === 'mars')!.view).toBe(f < centre ? 'terrain' : 'orbit')
    }
    expect(director.shotAt(w.firstFrame, w.firstFrame / config.fps).cover.amount).toBe(0)
  })

  it('dims the sky under the cover by the square of what the cover leaves, unless the plan says otherwise', () => {
    const floor = 0.25
    class Floored extends StopPlan {
      override skyUnderCover(amount: number): number {
        return Math.max(floor, Math.pow(1 - amount, 2))
      }
    }
    const base = new StopPlan('mars', fit as Fit, { ...params })
    const kept = new Floored('mars', fit as Fit, { ...params })
    for (const a of [0, 0.3, 0.94, 1]) expect(base.skyUnderCover(a, 0)).toBe(Math.pow(1 - a, 2))
    const plain = new FilmDirector(plans.map((p) => (p.id === 'mars' ? base : p)))
    const other = new FilmDirector(plans.map((p) => (p.id === 'mars' ? kept : p)))
    const w = coverWindow(rise)!
    const outside = rise.endFrame - 1
    expect(other.shotAt(outside, outside / config.fps).skyExposure).toBe(plain.shotAt(outside, outside / config.fps).skyExposure)
    let lifted = 0
    for (let f = w.firstFrame + 1; f <= w.lastFrame; f++) {
      const a = plain.shotAt(f, f / config.fps)
      const b = other.shotAt(f, f / config.fps)
      const open = a.skyExposure / Math.pow(1 - a.cover.amount, 2)
      if (a.cover.amount < 1) expect(b.skyExposure).toBeCloseTo(open * Math.max(floor, Math.pow(1 - a.cover.amount, 2)), 12)
      if (b.skyExposure > a.skyExposure) lifted++
      expect(b.cover.amount).toBe(a.cover.amount)
    }
    expect(lifted).toBeGreaterThan(0)
  })
})
