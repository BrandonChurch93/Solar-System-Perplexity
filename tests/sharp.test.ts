import { afterAll, describe, expect, it } from 'vitest'
import raw from '../config/showcase.json'
import { buildConfig, config } from '../src/config'
import { setCapture } from '../src/core/clock'
import { framePlan, pathSamples, sharpCount, sharpCoverOf } from '../src/core/motion'
import { gradUniform, setSamples } from '../src/diagnostics/diag'
import { FilmDirector } from '../src/director/film'
import { handoverOf } from '../src/director/handover'
import { plans } from '../src/director/plans'

// The plan of every frame of every dive and rise at three tiers and two rates, beside the tests of the other files.
const LONG = 240000

// The sharpness of a sample follows the samples that see one pixel of the path. The lookups of a sample are read finer than the pixel where
// the samples of a frame lie over one another and add up to the pixel. In a frame that moves they are spread along the path, and a light
// smaller than the footprint is met only by the samples whose footprint lies on it: read at half a pixel with 1.7 samples to a pixel of the
// path, its streak is a row of dots (seen at Earth's 2156 at the review tier, 24 samples over 14.3 px).
const film = new FilmDirector(plans)
// The covers by stop (handover.sharpCover). A test that writes other covers puts the film's own back.
const numbers = config.raw.handover as unknown as { sharpCover: Record<string, number> }
const kept = numbers.sharpCover
// The floor of the engine on the footprint of a lookup (GRAD_FLOOR of src/core/engine.ts): half a pixel, reached at four samples.
const FLOOR = 0.5
const all = config.segments.filter((s) => s.kind === 'dive' || s.kind === 'rise')
const moving = all.filter((s) => handoverOf(s.stop, s.kind as 'dive' | 'rise') !== null)
const drawn = (segments: typeof all, rate: number): number[] => segments.flatMap((s) => Array.from({ length: (s.endFrame - s.firstFrame) * rate }, (_, i) => s.firstFrame + i / rate))
// The footprint of the lookups of a sample that the engine sets from a count: 1 at one sample, 1 / sqrt(count) down to the floor.
const footprint = (count: number): number => {
  setSamples(count, FLOOR)
  return gradUniform.value
}
// How many samples lie with their footprint on one point of the path: the samples that see one pixel of it times the footprint's area.
const lying = (plan: { samples: number; seen: number }, cover: number): number => pathSamples(plan) * footprint(sharpCount(plan, cover)) ** 2

afterAll(() => {
  numbers.sharpCover = kept
  setCapture(1)
  setSamples(1, FLOOR)
})

describe('the samples that see one pixel of the path', () => {
  it('are the samples of the frame where it moves by less than a pixel, and the samples over the px of the path where it moves', () => {
    expect(pathSamples({ samples: 16, seen: 0 })).toBe(16)
    expect(pathSamples({ samples: 16, seen: 0.4 })).toBe(16)
    expect(pathSamples({ samples: 16, seen: 1 })).toBe(16)
    expect(pathSamples({ samples: 24, seen: 14.3 })).toBeCloseTo(24 / 14.3, 12)
    expect(pathSamples({ samples: 64, seen: 14.3 })).toBeCloseTo(64 / 14.3, 12)
  })
})

describe('the count that sharpens the lookups of a sample', () => {
  it('is the samples that see one pixel of the path over the cover', () => {
    expect(sharpCount({ samples: 16, seen: 0 }, 2)).toBe(8)
    expect(sharpCount({ samples: 24, seen: 14.3 }, 2)).toBeCloseTo(24 / 14.3 / 2, 12)
    expect(sharpCount({ samples: 64, seen: 14.3 }, 4)).toBeCloseTo(64 / 14.3 / 4, 12)
  })
  it('never passes the count of the frame, whatever the cover', () => {
    expect(sharpCount({ samples: 16, seen: 0 }, 0.5)).toBe(16)
    expect(sharpCount({ samples: 1, seen: 0 }, 0.25)).toBe(1)
    for (const cover of [0.25, 0.5, 1, 2, 4]) for (const samples of [1, 4, 16, 64]) for (const seen of [0, 0.5, 3, 14.3, 90]) expect(footprint(sharpCount({ samples, seen }, cover))).toBeGreaterThanOrEqual(footprint(samples))
  })
  it('leaves a frame of one sample as it was at every cover: its lookups are the pixel\'s own', () => {
    for (const cover of [0.5, 1, 2, 4]) {
      expect(footprint(sharpCount({ samples: 1, seen: 0 }, cover))).toBe(1)
      expect(footprint(sharpCount({ samples: 1, seen: 58 }, cover))).toBe(1)
    }
    expect(footprint(1)).toBe(1)
  })
  it('lays the cover on every point of the path, or reads at the pixel\'s own footprint where the samples do not give it', () => {
    for (const cover of [1, 2, 4]) {
      for (const [samples, seen] of [[24, 14.3], [26, 15.6], [49, 29], [64, 14.3], [64, 29], [128, 90.1], [16, 2.6], [64, 2.6], [16, 0], [64, 0.5], [256, 31]] as const) {
        const plan = { samples, seen }
        const g = footprint(sharpCount(plan, cover))
        expect(g).toBeGreaterThanOrEqual(FLOOR)
        expect(g).toBeLessThanOrEqual(1)
        if (g < 1) expect(lying(plan, cover)).toBeGreaterThanOrEqual(cover - 1e-9)
        else expect(pathSamples(plan)).toBeLessThanOrEqual(cover + 1e-9)
        // Never finer than the count of the whole frame read it.
        expect(g).toBeGreaterThanOrEqual(footprint(samples))
        // The half is kept exactly where four times the cover see one pixel of the path.
        if (pathSamples(plan) >= 4 * cover) expect(g).toBe(FLOOR)
        else expect(g).toBeGreaterThan(FLOOR)
      }
    }
    // Earth's 2156 at the review tier, 24 samples over 14.3 px: the frame count read it at a half, where 0.42 of a sample lay on a point of
    // the path. A cover of 1 reads it at 0.77 of a pixel, a cover of 2 at the pixel's own footprint (1.68 samples see one pixel).
    expect(pathSamples({ samples: 24, seen: 14.3 }) * footprint(24) ** 2).toBeCloseTo(0.4196, 4)
    expect(footprint(sharpCount({ samples: 24, seen: 14.3 }, 1))).toBeCloseTo(Math.sqrt(14.3 / 24), 12)
    expect(footprint(sharpCount({ samples: 24, seen: 14.3 }, 2))).toBe(1)
    // The same frame at the final tier, 64 samples: 4.48 to a pixel; a cover of 2 reads it at 0.67 of a pixel.
    expect(footprint(sharpCount({ samples: 64, seen: 14.3 }, 2))).toBeCloseTo(Math.sqrt(2 * 14.3 / 64), 12)
  })
  it('never reads coarser than the pixel, also where a tier runs out of samples', () => {
    expect(pathSamples({ samples: 128, seen: 300 })).toBeLessThan(1)
    expect(footprint(sharpCount({ samples: 128, seen: 300 }, 2))).toBe(1)
  })
})

describe('the covers handover.sharpCover', () => {
  it('name stops, each with a cover from 0 (off) to 4, and are never absent', () => {
    for (const [id, cover] of Object.entries(kept)) {
      expect(config.stops.some((s) => s.id === id), id).toBe(true)
      expect(cover).toBeGreaterThanOrEqual(0)
      expect(cover).toBeLessThanOrEqual(4)
      expect(sharpCoverOf(id)).toBe(cover)
    }
    const none = JSON.parse(JSON.stringify(raw)) as { handover: Record<string, unknown> }
    delete none.handover.sharpCover
    expect(() => buildConfig(none)).toThrow(/missing key handover.sharpCover/)
    for (const wrong of [2, 'yes', [2], { earth: -1 }, { earth: 4.5 }, { earth: 'yes' }, { nowhere: 2 }]) {
      const other = JSON.parse(JSON.stringify(raw)) as { handover: Record<string, unknown> }
      other.handover.sharpCover = wrong
      expect(() => buildConfig(other), JSON.stringify(wrong)).toThrow(/handover.sharpCover must name stops, each with a cover of 0 \(off\) to 4/)
    }
    const empty = JSON.parse(JSON.stringify(raw)) as { handover: Record<string, unknown> }
    empty.handover.sharpCover = {}
    expect(() => buildConfig(empty)).not.toThrow()
  })
  it('give a stop that is not named no cover', () => {
    const named = Object.keys(kept)
    expect(named.length).toBeGreaterThan(0)
    for (const s of config.stops) if (!named.includes(s.id)) expect(sharpCoverOf(s.id), s.id).toBe(0)
    expect(sharpCoverOf('nowhere')).toBe(0)
  })
  it('keep a frame that stands still as the frame count read it, at every tier of the film', () => {
    for (const cover of Object.values(kept)) {
      if (!(cover > 0)) continue
      for (const tier of Object.keys(config.tiers)) {
        const samples = config.tiers[tier]!.fastSamplesPerFrame
        for (const seen of [0, 0.5, 1]) expect(footprint(sharpCount({ samples, seen }, cover)), tier + ' ' + seen).toBe(footprint(samples))
      }
    }
  })
  it('give every frame of every dive and rise of a named stop its count, and no frame of any other stop, at both rates and at every tier', () => {
    let softer = 0
    let named = 0
    let plain = 0
    for (const rate of [1, 2]) {
      setCapture(rate)
      for (const tier of ['draft', 'review', 'final']) {
        for (const s of moving) {
          const cover = sharpCoverOf(s.stop)
          for (const f of drawn([s], rate)) {
            const plan = framePlan(film, f, tier)
            // No softening by the length of the blur in a dive or a rise: what is left is the sharpness the samples can carry.
            expect(plan.soft).toBe(0)
            if (!(cover > 0)) {
              // A stop that did not ask: the frame count sharpens, as before.
              expect(plan.sharp, tier + ' ' + f).toBeUndefined()
              plain++
              continue
            }
            named++
            expect(plan.sharp, tier + ' ' + f).toBe(sharpCount(plan, cover))
            const g = footprint(plan.sharp!)
            // One sample: the lookups are the pixel's own, the draft tier does not change by a byte.
            if (plan.samples === 1) expect(g).toBe(1)
            // The footprint only ever grows against the frame count's, and stays within a pixel.
            expect(g).toBeGreaterThanOrEqual(footprint(plan.samples))
            expect(g).toBeLessThanOrEqual(1)
            // The cover lies on every point of the path wherever the lookups are finer than the pixel.
            if (g < 1) expect(lying(plan, cover), tier + ' ' + f).toBeGreaterThanOrEqual(cover - 1e-9)
            if (g > footprint(plan.samples)) softer++
          }
        }
      }
    }
    expect(named).toBeGreaterThan(0)
    expect(plain).toBeGreaterThan(0)
    // The law acts: frames that move fast are read coarser than the frame count read them.
    expect(softer).toBeGreaterThan(0)
    setCapture(1)
  }, LONG)
  it('follow the stop that is named: another stop named in its place gets the count, and with no stop named no plan has one', () => {
    const sample = (s: (typeof moving)[number]): number[] => [s.firstFrame, Math.floor((s.firstFrame + s.endFrame) / 2), s.endFrame - 1]
    const first = moving.find((s) => !(sharpCoverOf(s.stop) > 0))
    expect(first).toBeDefined()
    numbers.sharpCover = { [first!.stop]: 2 }
    for (const s of moving) {
      for (const f of sample(s)) {
        const plan = framePlan(film, f, 'review')
        if (s.stop === first!.stop) expect(plan.sharp, s.stop + ' ' + f).toBe(sharpCount(plan, 2))
        else expect(plan.sharp, s.stop + ' ' + f).toBeUndefined()
      }
    }
    numbers.sharpCover = {}
    for (const s of moving) for (const f of sample(s)) expect(framePlan(film, f, 'review').sharp).toBeUndefined()
    numbers.sharpCover = kept
  }, LONG)
  it('touch no frame outside a dive or a rise that hands over', () => {
    const others = config.segments.filter((s) => !moving.includes(s))
    expect(others.length).toBeGreaterThan(0)
    for (const s of others) for (const f of [s.firstFrame, Math.floor((s.firstFrame + s.endFrame) / 2), s.endFrame - 1]) expect(framePlan(film, f, 'review').sharp, s.kind + ' ' + f).toBeUndefined()
  }, LONG)
})
