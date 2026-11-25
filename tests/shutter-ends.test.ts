import { afterAll, describe, expect, it } from 'vitest'
import raw from '../config/showcase.json'
import { buildConfig, config } from '../src/config'
import { setCapture } from '../src/core/clock'
import { framePlan, shutterEndsOf } from '../src/core/motion'
import { samplesFor, shutterOffset, shutterOpen, shutterWeights } from '../src/core/sampler'
import { FilmDirector } from '../src/director/film'
import { handoverOf } from '../src/director/handover'
import { plans } from '../src/director/plans'

// The plan of every frame of every dive and rise at three tiers and two rates, beside the tests of the other files.
const LONG = 240000

// A shutter that is open at once and shut at once draws a small light that moves as a bar with hard ends: every sample of the frame lays
// the same light along the path. A field of such lights is a mosaic of bars, and a coast a stair (seen at Earth's 1857 and 2156 at the
// review tier, a path of 14 px). With ends the shutter opens and closes over a share of its time: a sample weighs as far as the shutter is
// open at its time, the bar fades in and out, and the light of the frame is the light it had.
const film = new FilmDirector(plans)
// The ends by stop (handover.shutterEnds). A test that writes other ends puts the film's own back.
const numbers = config.raw.handover as unknown as { shutterEnds: Record<string, number> }
const kept = numbers.shutterEnds
const all = config.segments.filter((s) => s.kind === 'dive' || s.kind === 'rise')
const moving = all.filter((s) => handoverOf(s.stop, s.kind as 'dive' | 'rise') !== null)
const counts = [...new Set([2, 3, 4, 8, 16, 24, 26, 49, 64, 128, 256, ...Object.values(config.tiers).flatMap((t) => [t.samplesPerFrame, t.fastSamplesPerFrame, t.maxSamplesPerFrame])])].filter((n) => n > 1).sort((a, b) => a - b)
const shares = [0.1, 0.25, 0.4, 0.5]
const sum = (v: number[]): number => v.reduce((a, x) => a + x, 0)

afterAll(() => {
  numbers.shutterEnds = kept
  setCapture(1)
})

describe('how far the shutter is open', () => {
  it('is wide open all the time with no ends', () => {
    for (const p of [0, 0.01, 0.25, 0.5, 0.75, 0.99, 1]) expect(shutterOpen(p, 0)).toBe(1)
  })
  it('opens from shut at its start to wide open after the share, stays so, and closes the same way', () => {
    for (const ends of shares) {
      expect(shutterOpen(0, ends)).toBe(0)
      expect(shutterOpen(1, ends)).toBe(0)
      expect(shutterOpen(ends / 2, ends)).toBeCloseTo(0.5, 12)
      expect(shutterOpen(1 - ends / 2, ends)).toBeCloseTo(0.5, 12)
      expect(shutterOpen(ends, ends)).toBe(1)
      expect(shutterOpen(0.5, ends)).toBe(1)
      let last = -1
      for (let i = 0; i <= 200; i++) {
        const p = i / 400
        const open = shutterOpen(p, ends)
        // It only ever opens up to the middle, and what it does before the middle it does after it.
        expect(open).toBeGreaterThanOrEqual(last)
        expect(open).toBeGreaterThanOrEqual(0)
        expect(open).toBeLessThanOrEqual(1)
        expect(shutterOpen(1 - p, ends)).toBeCloseTo(open, 12)
        if (p >= ends) expect(open).toBe(1)
        last = open
      }
    }
  })
  it('opens and closes without a rest at a share of a half', () => {
    for (let i = 0; i <= 100; i++) {
      const p = i / 100
      expect(shutterOpen(p, 0.5)).toBeCloseTo(0.5 - 0.5 * Math.cos(2 * Math.PI * p), 12)
    }
  })
})

describe('the samples of a frame under a shutter with ends', () => {
  it('are the list they always were with no ends, to the bit', () => {
    for (const n of [1, ...counts]) {
      for (const share of [1, 0.85, 0.5]) {
        const was = samplesFor(n, share)
        const now = samplesFor(n, share, 0)
        expect(now.length).toBe(n)
        now.forEach((x, i) => {
          expect(x.jitterX).toBe(was[i]!.jitterX)
          expect(x.jitterY).toBe(was[i]!.jitterY)
          expect(x.timeOffset).toBe(was[i]!.timeOffset)
          expect(x.weight).toBe(1 / n)
        })
      }
    }
  })
  it('keep their times at every ends: the shutter is open as long as it was', () => {
    for (const n of [1, ...counts]) {
      for (const share of [1, 0.85, 0.5]) {
        const was = samplesFor(n, share)
        for (const ends of shares) {
          samplesFor(n, share, ends).forEach((x, i) => {
            expect(x.timeOffset).toBe(was[i]!.timeOffset)
            if (share !== 1) expect(x.timeOffset).toBe(shutterOffset((i + 0.5) / n, share))
          })
        }
      }
    }
  })
  it('weigh as far as the shutter is open at their time, and add up to the light of the frame', () => {
    for (const n of counts) {
      for (const ends of shares) {
        const s = samplesFor(n, 1, ends)
        const open = Array.from({ length: n }, (_, i) => shutterOpen((i + 0.5) / n, ends))
        const whole = sum(open)
        expect(sum(s.map((x) => x.weight))).toBeCloseTo(1, 12)
        s.forEach((x, i) => {
          expect(x.weight).toBeGreaterThan(0)
          expect(x.weight).toBeCloseTo(open[i]! / whole, 14)
          // What the shutter does before its middle it does after it.
          expect(x.weight).toBeCloseTo(s[n - 1 - i]!.weight, 14)
        })
        expect(shutterWeights(n, ends)).toEqual(s.map((x) => x.weight))
        // The share of the shutter the frame keeps does not change the weights: they follow the position inside it.
        expect(samplesFor(n, 0.5, ends).map((x) => x.weight)).toEqual(s.map((x) => x.weight))
      }
    }
  })
  it('fade the bar of a moving light in and out: no step from one sample to the next, and none at its two ends', () => {
    for (const n of counts.filter((c) => c >= 16)) {
      // Open at once: the first sample lays the whole level at the end of the bar.
      const box = samplesFor(n).map((x) => x.weight)
      expect(box[0]! / Math.max(...box)).toBe(1)
      for (const ends of [0.25, 0.5]) {
        const w = samplesFor(n, 1, ends).map((x) => x.weight)
        const top = Math.max(...w)
        // The weights as shares of a shutter that is wide open: the step from nothing to the first sample, from each to the next, and from
        // the last to nothing.
        const open = Array.from({ length: n }, (_, i) => shutterOpen((i + 0.5) / n, ends))
        const steps = [open[0]!, ...open.slice(1).map((x, i) => Math.abs(x - open[i]!)), open[n - 1]!]
        // The steepest the opening gets is pi over twice the share, to one position; a sample is 1 / n of it.
        expect(Math.max(...steps)).toBeLessThanOrEqual(Math.PI / (2 * ends * n) + 1e-12)
        expect(w[0]! / top).toBeLessThan(0.05)
        expect(w[n - 1]! / top).toBeLessThan(0.05)
      }
    }
    // Earth's 2156 at the review tier, 24 samples: the first sample weighs 0.4 of a hundredth of the middle one.
    const w = samplesFor(24, 1, 0.5).map((x) => x.weight)
    expect(w[0]! / Math.max(...w)).toBeCloseTo(Math.sin(Math.PI / 48) ** 2 / Math.sin((Math.PI * 23) / 48) ** 2, 12)
    expect(w[0]! / Math.max(...w)).toBeLessThan(0.005)
  })
  it('count for two thirds of their number at a share of a half, and for more at a smaller share', () => {
    const counted = (w: number[]): number => 1 / sum(w.map((x) => x * x))
    for (const n of counts.filter((c) => c >= 3)) {
      expect(counted(samplesFor(n, 1, 0.5).map((x) => x.weight))).toBeCloseTo((2 * n) / 3, 9)
      expect(counted(samplesFor(n).map((x) => x.weight))).toBeCloseTo(n, 9)
    }
    for (const n of counts.filter((c) => c >= 16)) {
      const a = counted(samplesFor(n, 1, 0.5).map((x) => x.weight))
      const b = counted(samplesFor(n, 1, 0.25).map((x) => x.weight))
      const c = counted(samplesFor(n, 1, 0.1).map((x) => x.weight))
      expect(b).toBeGreaterThan(a)
      expect(c).toBeGreaterThan(b)
      expect(c).toBeLessThan(n)
    }
  })
  it('keep the picture where it sat: the places of the samples have no weighed middle, at every count up to the largest a tier may take', () => {
    const most = Math.max(...counts)
    for (const ends of shares) {
      for (let n = 2; n <= most; n++) {
        const s = samplesFor(n, 1, ends)
        expect(Math.abs(sum(s.map((x) => x.weight * x.jitterX)))).toBeLessThanOrEqual(1e-12)
        expect(Math.abs(sum(s.map((x) => x.weight * x.jitterY)))).toBeLessThanOrEqual(1e-12)
      }
    }
  })
  it('keep their places as they lay to one another, near the pixel: the whole list is moved, by a quarter of a pixel at most', () => {
    const most = Math.max(...counts)
    for (const ends of shares) {
      for (let n = 2; n <= most; n++) {
        const was = samplesFor(n)
        const s = samplesFor(n, 1, ends)
        const dx = s[0]!.jitterX - was[0]!.jitterX
        const dy = s[0]!.jitterY - was[0]!.jitterY
        // The weighed middle of the places as they were: 0.24 px at three samples and a share of a half, 0.05 px at most from 16 samples
        // on. Left in, the picture of a frame that stands still would step by it wherever the count changes.
        expect(Math.hypot(dx, dy)).toBeLessThan(0.25)
        if (n >= 16) expect(Math.hypot(dx, dy)).toBeLessThan(0.06)
        s.forEach((x, i) => {
          expect(x.jitterX - was[i]!.jitterX).toBeCloseTo(dx, 12)
          expect(x.jitterY - was[i]!.jitterY).toBeCloseTo(dy, 12)
          expect(Math.abs(x.jitterX)).toBeLessThanOrEqual(0.62)
          expect(Math.abs(x.jitterY)).toBeLessThanOrEqual(0.62)
        })
      }
    }
  })
  it('leave a frame of one sample as it was at every ends: the draft tier does not change by a byte', () => {
    const one = samplesFor(1)[0]!
    for (const ends of shares) {
      for (const share of [1, 0.5]) {
        const s = samplesFor(1, share, ends)
        expect(s.length).toBe(1)
        expect([s[0]!.jitterX, s[0]!.jitterY, s[0]!.weight]).toEqual([0, 0, 1])
        expect(s[0]!.timeOffset).toBe(samplesFor(1, share)[0]!.timeOffset)
      }
    }
    expect([one.jitterX, one.jitterY, one.weight]).toEqual([0, 0, 1])
  })
  it('are the same list each time', () => {
    expect(samplesFor(24, 0.85, 0.5)).toEqual(samplesFor(24, 0.85, 0.5))
  })
})

describe('the ends handover.shutterEnds', () => {
  it('name stops, each with a share from 0 (off) to a half, and are never absent', () => {
    for (const [id, share] of Object.entries(kept)) {
      expect(config.stops.some((s) => s.id === id), id).toBe(true)
      expect(share).toBeGreaterThanOrEqual(0)
      expect(share).toBeLessThanOrEqual(0.5)
      expect(shutterEndsOf(id)).toBe(share)
    }
    const none = JSON.parse(JSON.stringify(raw)) as { handover: Record<string, unknown> }
    delete none.handover.shutterEnds
    expect(() => buildConfig(none)).toThrow(/missing key handover.shutterEnds/)
    for (const wrong of [0.5, 'yes', [0.5], { earth: -0.1 }, { earth: 0.6 }, { earth: 'yes' }, { nowhere: 0.5 }]) {
      const other = JSON.parse(JSON.stringify(raw)) as { handover: Record<string, unknown> }
      other.handover.shutterEnds = wrong
      expect(() => buildConfig(other), JSON.stringify(wrong)).toThrow(/handover.shutterEnds must name stops, each with a share of 0 \(off\) to 0.5/)
    }
    const empty = JSON.parse(JSON.stringify(raw)) as { handover: Record<string, unknown> }
    empty.handover.shutterEnds = {}
    expect(() => buildConfig(empty)).not.toThrow()
  })
  it('give a stop that is not named a shutter that is open at once', () => {
    const named = Object.keys(kept)
    expect(named.length).toBeGreaterThan(0)
    for (const s of config.stops) if (!named.includes(s.id)) expect(shutterEndsOf(s.id), s.id).toBe(0)
    expect(shutterEndsOf('nowhere')).toBe(0)
  })
  it('give every frame of every dive and rise of a named stop its ends, and no frame of any other stop, at both rates and at every tier', () => {
    let named = 0
    let plain = 0
    let weighed = 0
    for (const rate of [1, 2]) {
      setCapture(rate)
      for (const tier of ['draft', 'review', 'final']) {
        for (const s of moving) {
          const ends = shutterEndsOf(s.stop)
          for (let i = 0; i < (s.endFrame - s.firstFrame) * rate; i++) {
            const f = s.firstFrame + i / rate
            const plan = framePlan(film, f, tier)
            if (!(ends > 0)) {
              // A stop that did not ask: the key is not there, and its samples are the list they were.
              expect('ends' in plan, tier + ' ' + f).toBe(false)
              plain++
              continue
            }
            named++
            expect(plan.ends, tier + ' ' + f).toBe(ends)
            const list = samplesFor(plan.samples, plan.shutter, plan.ends)
            expect(list.length).toBe(plan.samples)
            expect(sum(list.map((x) => x.weight))).toBeCloseTo(1, 12)
            // One sample: the frame is the frame it was.
            if (plan.samples === 1) expect(list).toEqual(samplesFor(1, plan.shutter))
            else weighed++
          }
        }
      }
    }
    expect(named).toBeGreaterThan(0)
    expect(plain).toBeGreaterThan(0)
    // The law acts: frames of more than one sample are weighed.
    expect(weighed).toBeGreaterThan(0)
    setCapture(1)
  }, LONG)
  it('change nothing else of the plan of a frame: with the ends emptied every other number is the one it is with them', () => {
    const frames = moving.flatMap((s) => [s.firstFrame, Math.floor((s.firstFrame + s.endFrame) / 2), s.endFrame - 1])
    const withEnds = frames.map((f) => framePlan(film, f, 'review'))
    numbers.shutterEnds = {}
    const without = frames.map((f) => framePlan(film, f, 'review'))
    numbers.shutterEnds = kept
    withEnds.forEach((plan, i) => {
      const { ends: _ends, ...rest } = plan
      expect(rest, String(frames[i])).toEqual(without[i])
      expect('ends' in without[i]!).toBe(false)
    })
  }, LONG)
  it('follow the stop that is named: another stop named in its place gets the ends, and with no stop named no plan has them', () => {
    const sample = (s: (typeof moving)[number]): number[] => [s.firstFrame, Math.floor((s.firstFrame + s.endFrame) / 2), s.endFrame - 1]
    const first = moving.find((s) => !(shutterEndsOf(s.stop) > 0))
    expect(first).toBeDefined()
    numbers.shutterEnds = { [first!.stop]: 0.25 }
    for (const s of moving) {
      for (const f of sample(s)) {
        const plan = framePlan(film, f, 'review')
        if (s.stop === first!.stop) expect(plan.ends, s.stop + ' ' + f).toBe(0.25)
        else expect(plan.ends, s.stop + ' ' + f).toBeUndefined()
      }
    }
    numbers.shutterEnds = {}
    for (const s of moving) for (const f of sample(s)) expect(framePlan(film, f, 'review').ends).toBeUndefined()
    numbers.shutterEnds = kept
  }, LONG)
  it('touch no frame outside a dive or a rise that hands over', () => {
    const others = config.segments.filter((s) => !moving.includes(s))
    expect(others.length).toBeGreaterThan(0)
    for (const s of others) for (const f of [s.firstFrame, Math.floor((s.firstFrame + s.endFrame) / 2), s.endFrame - 1]) expect(framePlan(film, f, 'review').ends, s.kind + ' ' + f).toBeUndefined()
  }, LONG)
})
