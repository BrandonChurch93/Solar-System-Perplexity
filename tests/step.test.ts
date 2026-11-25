import { afterAll, describe, expect, it } from 'vitest'
import raw from '../config/showcase.json'
import { buildConfig, config } from '../src/config'
import { setCapture } from '../src/core/clock'
import { blurAllowed, capConflict, framePlan, sampleStep, samplesNeeded } from '../src/core/motion'
import { FilmDirector } from '../src/director/film'
import { handoverOf } from '../src/director/handover'
import { plans } from '../src/director/plans'

// The plan of every frame of every dive and rise at two tiers and two rates takes a minute, more beside the tests of the other files.
const LONG = 240000

// The samples follow the blur (the Builder's mail 824, ruling 2): in every frame of every dive and rise the step from one sample to the next
// stays under handover.limits.sampleStepPx at every tier that takes more than one sample, so that no edge can stand as a row of copies
// inside a frame. The shutter itself is the law the film has (ruling 1): the cap handover.maxBlurPx asks a share, the floor
// handover.minShutter holds; this file tests it with the film's own numbers and changes them only where it says so.
const film = new FilmDirector(plans)
const numbers = config.raw.handover
const limit = numbers.limits.sampleStepPx!
const kept = { maxBlurPx: numbers.maxBlurPx, minShutter: numbers.minShutter }
const tiers = { review: { ...config.tiers.review! }, final: { ...config.tiers.final! } }
const all = config.segments.filter((s) => s.kind === 'dive' || s.kind === 'rise')
const moving = all.filter((s) => handoverOf(s.stop, s.kind as 'dive' | 'rise') !== null)
// The frames that are drawn at a capture rate: the film's frames at rate 1, and the half frames between them too at rate 2.
const drawn = (segments: typeof all, rate: number): number[] => segments.flatMap((s) => Array.from({ length: (s.endFrame - s.firstFrame) * rate }, (_, i) => s.firstFrame + i / rate))
const JUDGED = ['review', 'final']

afterAll(() => {
  Object.assign(numbers, kept)
  Object.assign(config.tiers.review!, tiers.review)
  Object.assign(config.tiers.final!, tiers.final)
  setCapture(1)
})

describe('the step from one sample of a frame to the next', () => {
  it('is the motion in view across the open shutter over the samples, for the picture and for a named near body', () => {
    expect(sampleStep({ samples: 64, seen: 14.3 })).toEqual({ own: 14.3 / 64, near: 0 })
    expect(sampleStep({ samples: 256, seen: 31, near: 392 })).toEqual({ own: 31 / 256, near: 392 / 256 })
  })
  it('is 0 in a frame of one sample: one sharp picture has no copies', () => {
    expect(sampleStep({ samples: 1, seen: 58 })).toEqual({ own: 0, near: 0 })
    expect(sampleStep({ samples: 1, seen: 58, near: 300 })).toEqual({ own: 0, near: 0 })
  })
  it('is held by a limit that is a number of the film, above the step the count aims at', () => {
    expect(limit).toBeGreaterThan(0)
    // A film without the number, or with one that is not above 0, does not load: the judge never runs against nothing.
    const none = JSON.parse(JSON.stringify(raw)) as { handover: { limits: Record<string, number> } }
    delete none.handover.limits.sampleStepPx
    expect(() => buildConfig(none)).toThrow(/missing key handover.limits.sampleStepPx/)
    const zero = JSON.parse(JSON.stringify(raw)) as { handover: { limits: Record<string, number> } }
    zero.handover.limits.sampleStepPx = 0
    expect(() => buildConfig(zero)).toThrow(/handover.limits.sampleStepPx must be above 0/)
    // The count aims at motion.maxStepPx a sample; a limit under that could be met by no tier.
    expect(limit).toBeGreaterThanOrEqual(config.motion.maxStepPx)
  })
  it('stays at the step the count aims at while the tier has samples left, and grows only where the count ends', () => {
    const step = config.motion.maxStepPx
    for (const motion of [0, 0.3, 6, 14, 31.2, 58, 76]) {
      const samples = samplesNeeded(16, 128, motion)
      expect(samples).toBeLessThan(128)
      expect(sampleStep({ samples, seen: motion }).own).toBeLessThanOrEqual(step + 1e-9)
    }
    // 128 samples carry 76.8 px at 0.6 px a sample; 90 px is past it and steps by more.
    expect(samplesNeeded(16, 128, 90)).toBe(128)
    expect(sampleStep({ samples: 128, seen: 90 }).own).toBeCloseTo(90 / 128, 12)
    expect(sampleStep({ samples: 128, seen: 90 }).own).toBeGreaterThan(step)
  })
})

describe('the samples of the dives and rises', () => {
  it('take one sample at the draft tier in every frame, so a draft frame is one sharp picture at the middle of its shutter', () => {
    for (const f of drawn(all, 1)) {
      const plan = framePlan(film, f, 'draft')
      expect(plan.samples).toBe(1)
      expect(sampleStep(plan)).toEqual({ own: 0, near: 0 })
    }
  }, LONG)

  it('step by no more than handover.limits.sampleStepPx in any frame at the review and the final tier, at the film rate and at twice the rate', () => {
    const worst: string[] = []
    for (const rate of [1, 2]) {
      setCapture(rate)
      for (const tier of JUDGED) {
        const most = config.tiers[tier]!.maxSamplesPerFrame
        let top = { frame: 0, px: 0, samples: 0 }
        for (const f of drawn(all, rate)) {
          const plan = framePlan(film, f, tier)
          const step = sampleStep(plan)
          // While the tier has samples left the count follows the larger of the picture and a near body at the step it aims at.
          if (plan.samples < most) expect(Math.max(step.own, step.near)).toBeLessThanOrEqual(config.motion.maxStepPx + 1e-9)
          if (step.own > limit) worst.push('rate ' + rate + ' ' + tier + ' frame ' + f + ': ' + step.own.toFixed(3) + ' px a sample at ' + plan.samples + ' samples')
          if (step.own > top.px) top = { frame: f, px: step.own, samples: plan.samples }
        }
        // The number of the report: the largest step of the film at this rate and tier.
        expect(top.px).toBeGreaterThan(0)
      }
    }
    setCapture(1)
    expect(worst).toEqual([])
  }, LONG)

  it('are found over the limit when a tier ends its count too early', () => {
    // The same judge with a review tier that may take no more than 16 samples: the fast frames of the film step by more than the limit.
    config.tiers.review!.maxSamplesPerFrame = 16
    const over = drawn(moving, 1).filter((f) => sampleStep(framePlan(film, f, 'review')).own > limit)
    Object.assign(config.tiers.review!, tiers.review)
    expect(over.length).toBeGreaterThan(0)
    // And with the tier as the film has it, none of those frames is over.
    for (const f of over) expect(sampleStep(framePlan(film, f, 'review')).own).toBeLessThanOrEqual(limit)
  }, LONG)
})

describe('the floor of the shutter over the cap of the blur', () => {
  it('is reported for exactly the frames that run at the floor, with what each keeps past the cap', () => {
    const floor = numbers.minShutter
    const frames = drawn(moving, 1)
    let found = 0
    for (const f of frames) {
      const plan = framePlan(film, f, 'final')
      const over = capConflict(film, f)
      if (floor > 0 && plan.shutter < 1 && plan.shutter <= floor) {
        expect(over).toBeGreaterThan(0)
        // What the frame keeps past the cap is what its plan says it keeps, less the cap (in a frame nothing covers).
        if (plan.split) expect(over).toBeCloseTo(plan.seen - blurAllowed(film, f), 6)
        found++
      } else expect(over).toBe(0)
    }
    // With a floor and a cap in the film some frames are fast enough to sit at the floor; without either, none can.
    if (floor > 0 && numbers.maxBlurPx > 0) expect(found).toBeGreaterThan(0)
    else expect(found).toBe(0)
  }, LONG)

  it('is 0 in every frame without a floor, without a cap, and outside the dives and rises', () => {
    const frames = drawn(moving, 1)
    numbers.minShutter = 0
    numbers.maxBlurPx = kept.maxBlurPx > 0 ? kept.maxBlurPx : 14
    for (const f of frames) expect(capConflict(film, f)).toBe(0)
    numbers.minShutter = kept.minShutter > 0 ? kept.minShutter : 0.5
    numbers.maxBlurPx = 0
    for (const f of frames) expect(capConflict(film, f)).toBe(0)
    Object.assign(numbers, kept)
    for (const s of config.segments) if (!moving.includes(s)) expect(capConflict(film, s.firstFrame)).toBe(0)
  }, LONG)

  it('holds in a frame that is fast by its path: the floor stays, the frame keeps more than the cap, and the count follows what it keeps', () => {
    numbers.maxBlurPx = 14
    numbers.minShutter = 0.5
    const frames = drawn(moving, 1)
    const fast = frames.filter((f) => capConflict(film, f) > 0)
    expect(fast.length).toBeGreaterThan(0)
    for (const f of fast) {
      const plan = framePlan(film, f, 'final')
      expect(plan.shutter).toBe(0.5)
      expect(sampleStep(plan).own).toBeLessThanOrEqual(limit)
    }
    Object.assign(numbers, kept)
  }, LONG)
})
