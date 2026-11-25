import { afterAll, describe, expect, it } from 'vitest'
import raw from '../config/showcase.json'
import { buildConfig, config } from '../src/config'
import { setCapture } from '../src/core/clock'
import { endsBy, endsLawOf, framePlan, shutterEndsOf, type EndsLaw, type FramePlan } from '../src/core/motion'
import { samplesFor, shutterOffset, shutterOpen, shutterWeights } from '../src/core/sampler'
import { FilmDirector } from '../src/director/film'
import { dissolveWeight, forceSide, handoverOf } from '../src/director/handover'
import { segmentAtFrame } from '../src/director/timeline'
import { plans } from '../src/director/plans'

// The plan of every frame of every dive and rise at three tiers and two rates, beside the tests of the other files.
const LONG = 240000

// A shutter that is open at once and shut at once draws a small light that moves as a bar with hard ends: every sample of the frame lays
// the same light along the path. A field of such lights is a mosaic of bars, and a coast a stair (seen at Earth's 1857 and 2156 at the
// review tier, a path of 14 px). With ends the shutter opens and closes over a share of its time: a sample weighs as far as the shutter is
// open at its time, the bar fades in and out, and the light of the frame is the light it had.
const film = new FilmDirector(plans)
// The ends by stop (handover.shutterEnds). A test that writes other ends puts the film's own back.
const numbers = config.raw.handover as unknown as { shutterEnds: Record<string, number | EndsLaw> }
const kept = numbers.shutterEnds
const all = config.segments.filter((s) => s.kind === 'dive' || s.kind === 'rise')
const moving = all.filter((s) => handoverOf(s.stop, s.kind as 'dive' | 'rise') !== null)
const counts = [...new Set([2, 3, 4, 8, 16, 24, 26, 49, 64, 128, 256, ...Object.values(config.tiers).flatMap((t) => [t.samplesPerFrame, t.fastSamplesPerFrame, t.maxSamplesPerFrame])])].filter((n) => n > 1).sort((a, b) => a - b)
const shares = [0.1, 0.25, 0.4, 0.5]
const sum = (v: number[]): number => v.reduce((a, x) => a + x, 0)

afterAll(() => {
  numbers.shutterEnds = kept
  forceSide(null)
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
  }, LONG)
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
    for (const [id, own] of Object.entries(kept)) {
      expect(config.stops.some((s) => s.id === id), id).toBe(true)
      // A stop named with a law has its share inside the law, and no share of its own for its dive and rise as such.
      const share = typeof own === 'number' ? own : own.share
      expect(share).toBeGreaterThanOrEqual(0)
      expect(share).toBeLessThanOrEqual(0.5)
      expect(shutterEndsOf(id)).toBe(typeof own === 'number' ? own : 0)
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
  it('give every frame of every dive and rise of a stop named with a share its ends, and no frame of any other stop, at both rates and at every tier', () => {
    // The film may name every stop with a law (those have their own tests, below), so the test names one itself: the first stop
    // that hands over in its dive, with a share of a half, and no other.
    const own = moving.find((s) => s.kind === 'dive')!.stop
    numbers.shutterEnds = { [own]: 0.5 }
    let named = 0
    let plain = 0
    let weighed = 0
    for (const rate of [1, 2]) {
      setCapture(rate)
      for (const tier of ['draft', 'review', 'final']) {
        for (const s of moving) {
          const ends = shutterEndsOf(s.stop)
          expect(ends, s.id).toBe(s.stop === own ? 0.5 : 0)
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
    numbers.shutterEnds = kept
  }, LONG)
  it('change nothing else of the plan of a frame: with the ends emptied every other number is the one it is with them', () => {
    const frames = moving.flatMap((s) => [s.firstFrame, Math.floor((s.firstFrame + s.endFrame) / 2), s.endFrame - 1])
    const withEnds = frames.map((f) => framePlan(film, f, 'review'))
    numbers.shutterEnds = {}
    const without = frames.map((f) => framePlan(film, f, 'review'))
    numbers.shutterEnds = kept
    withEnds.forEach((plan, i) => {
      const { ends: _ends, sides: _sides, ...rest } = plan
      expect(rest, String(frames[i])).toEqual(without[i])
      expect('ends' in without[i]!).toBe(false)
      expect('sides' in without[i]!).toBe(false)
    })
  }, LONG)
  it('follow the stop that is named: another stop named in its place gets the ends, and with no stop named no plan has them', () => {
    const sample = (s: (typeof moving)[number]): number[] => [s.firstFrame, Math.floor((s.firstFrame + s.endFrame) / 2), s.endFrame - 1]
    // Any stop will do: the test names it alone, whatever the film names.
    const first = moving[0]
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
  it('touch no frame outside a dive or a rise that hands over, where the stop is named with a share', () => {
    const others = config.segments.filter((s) => !moving.includes(s) && !endsLawOf(s.stop))
    expect(others.length).toBeGreaterThan(0)
    for (const s of others) for (const f of [s.firstFrame, Math.floor((s.firstFrame + s.endFrame) / 2), s.endFrame - 1]) expect(framePlan(film, f, 'review').ends, s.kind + ' ' + f).toBeUndefined()
  }, LONG)
})

// A share by stop gives the first frame of a dive the whole share and the last frame of the hold before it none: where the picture moves
// by some px across that border the streaks of the one frame are 0.63 as long as those of the other, and the border is seen (Mars 2669
// to 2670 at 4.3 px, Saturn 3809 to 3810 at 6.7 px). A law of the frame's own motion has no border in it: the share is one function of
// the px the frame shows, so it steps only where the px steps.
const LAW: EndsLaw = { share: 0.5, fromPx: 6, toPx: 14 }
// A law every kind of frame reaches, the slow hold included.
const LOW: EndsLaw = { share: 0.4, fromPx: 0.05, toPx: 0.6 }
const NAMED = 'mars'
const everyFrame = Array.from({ length: config.frameCount }, (_, f) => f)
const planOf = (frames: number[], tier: string): FramePlan[] => frames.map((f) => framePlan(film, f, tier))
const handing = (f: number): boolean => {
  const s = segmentAtFrame(f)
  return (s.kind === 'dive' || s.kind === 'rise') && handoverOf(s.stop, s.kind) !== null
}

describe('the ends as a law of the motion of the frame', () => {
  it('are named for a stop with {share, fromPx, toPx} in place of a share', () => {
    const build = (ends: unknown): unknown => {
      const other = JSON.parse(JSON.stringify(raw)) as { handover: Record<string, unknown> }
      other.handover.shutterEnds = ends
      return buildConfig(other)
    }
    for (const right of [{ mars: LAW }, { mars: LOW }, { mars: { share: 0.5, fromPx: 0, toPx: 1 } }, { earth: 0.5, mars: LAW, mercury: LAW }, { mars: LAW, venus: 0 }]) expect(() => build(right), JSON.stringify(right)).not.toThrow()
    const wrong = [
      { mars: { share: 0, fromPx: 6, toPx: 14 } },
      { mars: { share: 0.6, fromPx: 6, toPx: 14 } },
      { mars: { share: 0.5, fromPx: -1, toPx: 14 } },
      { mars: { share: 0.5, fromPx: 14, toPx: 14 } },
      { mars: { share: 0.5, fromPx: 14, toPx: 6 } },
      { mars: { share: 0.5, fromPx: 6 } },
      { mars: { fromPx: 6, toPx: 14 } },
      { mars: { share: '0.5', fromPx: 6, toPx: 14 } },
      { mars: { share: 0.5, fromPx: 6, toPx: 14, kind: 'dive' } },
      { mars: { share: 0.5, fromPx: 6, toPx: 14, fromFrame: 2400 } },
      { mars: null },
      { mars: [0.5, 6, 14] },
      { nowhere: LAW },
    ]
    for (const ends of wrong) expect(() => build(ends), JSON.stringify(ends)).toThrow(/handover.shutterEnds must name stops, each with a share of 0 \(off\) to 0.5 or with \{share, fromPx, toPx\}/)
  })
  it('leave a stop named with a share its share, and give a stop named with a law the law', () => {
    numbers.shutterEnds = { earth: 0.5, venus: 0, [NAMED]: LAW }
    expect(shutterEndsOf('earth')).toBe(0.5)
    expect(endsLawOf('earth')).toBeNull()
    expect(shutterEndsOf('venus')).toBe(0)
    expect(endsLawOf('venus')).toBeNull()
    expect(shutterEndsOf(NAMED)).toBe(0)
    expect(endsLawOf(NAMED)).toEqual(LAW)
    expect(endsLawOf('saturn')).toBeNull()
    expect(endsLawOf('nowhere')).toBeNull()
    numbers.shutterEnds = kept
  })
  it('are a smooth step of the px and of nothing else: none up to fromPx, the whole share from toPx on, and no step between', () => {
    for (const law of [LAW, LOW, { share: 0.25, fromPx: 0, toPx: 2 }]) {
      const wide = law.toPx - law.fromPx
      expect(endsBy(law, 0)).toBe(0)
      expect(endsBy(law, law.fromPx)).toBe(0)
      expect(endsBy(law, law.fromPx - 1e-9)).toBe(0)
      expect(endsBy(law, law.toPx)).toBe(law.share)
      expect(endsBy(law, law.toPx + 1e-9)).toBe(law.share)
      expect(endsBy(law, 1e6)).toBe(law.share)
      expect(endsBy(law, (law.fromPx + law.toPx) / 2)).toBeCloseTo(law.share / 2, 12)
      const n = 4000
      let last = 0
      for (let i = 0; i <= n; i++) {
        const px = law.fromPx + (wide * i) / n
        const ends = endsBy(law, px)
        expect(ends).toBeGreaterThanOrEqual(last)
        expect(ends).toBeLessThanOrEqual(law.share)
        // The steepest it gets is one and a half times the share over the width, in the middle.
        expect(ends - last).toBeLessThanOrEqual((1.5 * law.share) / n + 1e-12)
        // What it does on the way up from fromPx it does on the way down from toPx.
        expect(ends + endsBy(law, law.toPx - (wide * i) / n)).toBeCloseTo(law.share, 12)
        last = ends
      }
      // It leaves fromPx and reaches toPx without a corner: a hundredth of the width in, a 3 in ten thousand of the share.
      expect(endsBy(law, law.fromPx + wide / 100) / law.share).toBeLessThan(0.0003)
      expect(1 - endsBy(law, law.toPx - wide / 100) / law.share).toBeLessThan(0.0003)
    }
  })
  it('change the plan of no frame of the film where no stop is named with a law: all of its frames at every tier, key for key', () => {
    // The stops the film names with a share, as before the law was there: every frame of their dives and rises has the share, no other
    // frame of the film has the key, and no frame has sides.
    const shares = Object.fromEntries(Object.entries(kept).filter(([, own]) => typeof own === 'number')) as Record<string, number>
    let withEnds = 0
    for (const tier of ['draft', 'review', 'final']) {
      numbers.shutterEnds = shares
      const now = planOf(everyFrame, tier)
      numbers.shutterEnds = {}
      const bare = planOf(everyFrame, tier)
      numbers.shutterEnds = kept
      everyFrame.forEach((f) => {
        const own = shares[segmentAtFrame(f).stop] ?? 0
        expect('ends' in bare[f]!, tier + ' ' + f).toBe(false)
        expect('sides' in bare[f]!, tier + ' ' + f).toBe(false)
        if (handing(f) && own > 0) {
          expect(now[f], tier + ' ' + f).toStrictEqual({ ...bare[f]!, ends: own })
          withEnds++
        } else expect(now[f], tier + ' ' + f).toStrictEqual(bare[f])
      })
    }
    const want = config.segments.filter((s) => moving.includes(s) && (shares[s.stop] ?? 0) > 0).reduce((n, s) => n + s.endFrame - s.firstFrame, 0)
    expect(withEnds).toBe(3 * want)
  }, LONG)
  it('give every frame of a stop named with a law its ends by the px the frame shows, in its hold, its dive, its surface view, its rise and the flight that leaves it', () => {
    numbers.shutterEnds = {}
    const bare = planOf(everyFrame, 'review')
    for (const law of [LAW, LOW]) {
      numbers.shutterEnds = { [NAMED]: law }
      const now = planOf(everyFrame, 'review')
      const got: Record<string, number> = {}
      let whole = 0
      let part = 0
      everyFrame.forEach((f) => {
        const s = segmentAtFrame(f)
        // The flight is the stop's it leaves: its segment names that stop.
        const mine = s.stop === NAMED
        const want = mine ? endsBy(law, bare[f]!.seen) : 0
        const { ends, sides: _sides, ...rest } = now[f]!
        // Every other number of the plan is the one it was, in every frame of the film.
        expect(rest, s.id + ' ' + f).toStrictEqual(bare[f])
        if (want > 0) {
          expect(ends, s.id + ' ' + f).toBe(want)
          got[s.kind] = (got[s.kind] ?? 0) + 1
          if (want === law.share) whole++
          else part++
        } else {
          // Under fromPx and at every other stop: the plan is the plan it was, key for key.
          expect(now[f], s.id + ' ' + f).toStrictEqual(bare[f])
        }
      })
      // The slow law reaches every kind of frame of the stop, the film's own px its dive, its rise and its flight.
      expect(got.dive).toBeGreaterThan(0)
      expect(got.rise).toBeGreaterThan(0)
      expect(got.travel).toBeGreaterThan(0)
      if (law === LOW) {
        expect(got.hold).toBeGreaterThan(0)
        expect(got.terrain).toBeGreaterThan(0)
      }
      expect(whole).toBeGreaterThan(0)
      expect(part).toBeGreaterThan(0)
    }
    numbers.shutterEnds = kept
  }, LONG)
  it('step from one frame to the next only as far as the px steps, across every border of the stop as inside its parts', () => {
    // The hold, the dive, the surface view, the rise and the flight: four borders, the last one between the rise and its flight.
    const segs = config.segments.filter((s) => s.stop === NAMED)
    expect(segs[segs.length - 1]!.kind).toBe('travel')
    const first = segs[0]!.firstFrame
    const end = segs[segs.length - 1]!.endFrame
    const borders = segs.slice(1).map((s) => s.firstFrame)
    expect(borders.length).toBe(4)
    for (const law of [LAW, LOW]) {
      numbers.shutterEnds = { [NAMED]: law }
      const frames = Array.from({ length: end - first }, (_, i) => first + i)
      const now = planOf(frames, 'review')
      let crossed = 0
      for (let i = 1; i < now.length; i++) {
        const step = Math.abs((now[i]!.ends ?? 0) - (now[i - 1]!.ends ?? 0))
        const px = Math.abs(now[i]!.seen - now[i - 1]!.seen)
        expect(step, String(frames[i])).toBeLessThanOrEqual((1.5 * law.share * px) / (law.toPx - law.fromPx) + 1e-12)
        if (borders.includes(frames[i]!)) crossed++
      }
      expect(crossed).toBe(4)
    }
    numbers.shutterEnds = kept
  }, LONG)
  it('give the first frame of a flight the ends of the last frame of its rise where the two move alike, at every stop that has a flight', () => {
    // A rise does not come to rest before its flight: the two are one move. With the flight outside the law the look stepped there in
    // one frame wherever the border moved by more than fromPx (Earth 2174 and 2175: 9.70 and 9.44 px, the one with ends, the other a box).
    let above = 0
    for (const s of config.segments.filter((x) => x.kind === 'travel')) {
      numbers.shutterEnds = { [s.stop]: LAW }
      const [rise, flight] = planOf([s.firstFrame - 1, s.firstFrame], 'review')
      expect(segmentAtFrame(s.firstFrame - 1).stop, s.id).toBe(s.stop)
      expect(rise!.ends ?? 0, s.id).toBe(endsBy(LAW, rise!.seen))
      expect(flight!.ends ?? 0, s.id).toBe(endsBy(LAW, flight!.seen))
      expect(Math.abs((flight!.ends ?? 0) - (rise!.ends ?? 0)), s.id).toBeLessThanOrEqual((1.5 * LAW.share * Math.abs(flight!.seen - rise!.seen)) / (LAW.toPx - LAW.fromPx) + 1e-12)
      if (rise!.seen > LAW.fromPx && flight!.seen > LAW.fromPx) above++
    }
    // The film has such borders: without them the flight would not need the law.
    expect(above).toBeGreaterThan(0)
    numbers.shutterEnds = kept
  }, LONG)
  it('reach from the first frame of a stop to the last frame of its flight, and are at 0 at both for every law the film names', () => {
    // A law is one stop's. The stop before it and the stop after it may have none, or another: where the first frame of the stop and
    // the last frame of its flight move under fromPx, the law is at 0 on both sides of both borders and nothing steps there.
    const laws = Object.entries(kept).filter(([, own]) => typeof own === 'object') as [string, EndsLaw][]
    for (const [stop, law] of [...laws, [NAMED, LAW] as [string, EndsLaw]]) {
      const segs = config.segments.filter((s) => s.stop === stop)
      const first = segs[0]!.firstFrame
      const last = segs[segs.length - 1]!.endFrame - 1
      // A border is there where the film has a frame on its other side.
      const borders = [[first - 1, first], [last, last + 1]].filter(([a, b]) => a! >= 0 && b! < config.frameCount)
      expect(borders.length, stop).toBeGreaterThan(0)
      numbers.shutterEnds = { [stop]: law }
      for (const plan of planOf(borders.flat() as number[], 'review')) {
        expect(plan.seen, stop).toBeLessThan(law.fromPx)
        expect('ends' in plan, stop).toBe(false)
      }
    }
    numbers.shutterEnds = kept
  }, LONG)
  it('share the samples of a frame that draws two views by the light they bring, each view over the whole shutter', () => {
    let seen = 0
    for (const stop of [...new Set(moving.map((s) => s.stop))]) {
      numbers.shutterEnds = { [stop]: LOW }
      for (const tier of ['review', 'final']) {
        for (const s of moving.filter((m) => m.stop === stop)) {
          const h = handoverOf(s.stop, s.kind as 'dive' | 'rise')!
          for (let f = s.firstFrame; f < s.endFrame; f++) {
            const plan = framePlan(film, f, tier)
            if (!plan.split || !((plan.ends ?? 0) > 0) || plan.samples < 2) {
              expect('sides' in plan, tier + ' ' + f).toBe(false)
              continue
            }
            seen++
            const sides = plan.sides!
            expect(sides.length, tier + ' ' + f).toBe(plan.samples)
            const w = samplesFor(plan.samples, plan.shutter, plan.ends).map((x) => x.weight)
            const share = dissolveWeight(h, s.kind as 'dive' | 'rise', f)
            const close = sum(w.filter((_, i) => sides[i] === 'terrain'))
            // The surface view has its share of the light of the frame, to half a sample at the worst.
            expect(Math.abs(close - share), tier + ' ' + f).toBeLessThanOrEqual(Math.max(...w) / 2 + 1e-12)
            // And so far at every time inside the shutter: neither view waits for the other.
            let had = 0
            let whole = 0
            w.forEach((x, i) => {
              whole += x
              if (sides[i] === 'terrain') had += x
              expect(Math.abs(had - share * whole), tier + ' ' + f + ' ' + i).toBeLessThanOrEqual(Math.max(...w) / 2 + 1e-12)
            })
            if (share === 0.5) {
              // Half and half: every other sample, and with an even count one half of the light each, to the last bit of the sum.
              const flips = sides.filter((side, i) => i > 0 && side !== sides[i - 1]).length
              expect(flips, tier + ' ' + f).toBeGreaterThanOrEqual(plan.samples - 3)
              if (plan.samples % 2 === 0) {
                sides.forEach((side, i) => expect(side).toBe(i % 2 === 0 ? 'terrain' : 'orbit'))
                expect(close).toBeCloseTo(0.5, 12)
              }
            }
          }
        }
      }
    }
    // One frame of two views in every dive and every rise that hands over, at both tiers.
    expect(seen).toBe(2 * moving.length)
    numbers.shutterEnds = kept
  }, LONG)
  it('name the views of the samples only where the law gives the frame ends: not at one sample, not for a stop named with a share, not under fromPx, and not where the harness forces a view', () => {
    const split = (stop: string, tier: string): { f: number; plan: FramePlan }[] =>
      moving.filter((m) => m.stop === stop).flatMap((s) => Array.from({ length: s.endFrame - s.firstFrame }, (_, i) => s.firstFrame + i).map((f) => ({ f, plan: framePlan(film, f, tier) })).filter((x) => x.plan.split))
    numbers.shutterEnds = { [NAMED]: LOW }
    const review = split(NAMED, 'review')
    expect(review.length).toBe(2)
    for (const x of review) expect(x.plan.sides, String(x.f)).toBeDefined()
    // The draft tier draws one sample: the frame has one view, the one of its time, as it had.
    for (const x of split(NAMED, 'draft')) {
      expect(x.plan.samples).toBe(1)
      expect('sides' in x.plan, String(x.f)).toBe(false)
    }
    // A view the harness forces is every sample's.
    for (const view of ['orbit', 'terrain'] as const) {
      forceSide(view)
      for (const x of review) expect('sides' in framePlan(film, x.f, 'review'), view + ' ' + x.f).toBe(false)
      forceSide(null)
    }
    for (const x of review) expect(framePlan(film, x.f, 'review').sides).toEqual(x.plan.sides)
    // Named with a share the stop keeps the views of its samples by their times.
    numbers.shutterEnds = { [NAMED]: 0.5 }
    for (const x of split(NAMED, 'review')) {
      expect(x.plan.ends).toBe(0.5)
      expect('sides' in x.plan, String(x.f)).toBe(false)
    }
    // A law the frame of two views does not reach leaves it as it was.
    numbers.shutterEnds = { [NAMED]: { share: 0.5, fromPx: 1000, toPx: 2000 } }
    for (const x of split(NAMED, 'review')) {
      expect('ends' in x.plan, String(x.f)).toBe(false)
      expect('sides' in x.plan, String(x.f)).toBe(false)
    }
    numbers.shutterEnds = kept
  }, LONG)
})
