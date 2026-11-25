import { afterAll, describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { blurAllowed, framePlan, rawMotion, samplesNeeded, seenShare, shutterScale, softness } from '../src/core/motion'
import { sampleCount, samplesFor, shutterMid, shutterOffset, shutterPosition } from '../src/core/sampler'
import type { ViewKind } from '../src/core/types'
import { FilmDirector } from '../src/director/film'
import { dissolveWeight, forceSide, handoverOf, shutterThreshold, sideAt } from '../src/director/handover'
import { plans } from '../src/director/plans'
import { segmentAtFrame } from '../src/director/timeline'

// The tests that make the plan of every frame of every dive and rise take seconds, more beside the tests of the other files.
const LONG = 60000

// E6, the capped shutter of a dive or a rise that hands over (decision d129).
const fps = config.fps
const film = new FilmDirector(plans)
const numbers = config.raw.handover
const kept = { maxBlurPx: numbers.maxBlurPx, blurEaseFrames: numbers.blurEaseFrames, minShutter: numbers.minShutter }
// The cap is tested alone, with the floor off; the floor has its own tests at the end of this file and sets the shares it needs.
numbers.minShutter = 0
// It is tested with the film's own number, and with 6 px where the film runs without a cap (handover.maxBlurPx 0), so these tests hold for
// whatever the film is set to.
const CAP = kept.maxBlurPx > 0 ? kept.maxBlurPx : 6
numbers.maxBlurPx = CAP
const inFile = { ...kept, maxBlurPx: CAP, minShutter: 0 }
// And without the near bodies a stop may name to the motion measure: they raise the count of a frame past what the cap leaves and have their
// own tests (tests/near.test.ts).
const named = plans.map((p) => p.p.near)
plans.forEach((p) => { delete p.p.near })
const SIDES: ViewKind[] = ['orbit', 'terrain']
const moving = config.segments.filter((s) => (s.kind === 'dive' || s.kind === 'rise') && handoverOf(s.stop, s.kind) !== null)
const hands = (frame: number): boolean => moving.includes(segmentAtFrame(frame))
// The motion of a frame between two times inside it, measured here as the film's plan of a frame measures it: on both sides in the frame that
// swaps them, the larger one.
const motionOf = (frame: number, from: number, to: number): number => {
  const s = segmentAtFrame(frame)
  const h = handoverOf(s.stop, s.kind as 'dive' | 'rise')!
  const at = (offset: number, side?: ViewKind) => film.shotAt(frame, (frame + offset) / fps, side)
  if (frame >= h.firstFrame && frame <= h.lastFrame) return Math.max(...SIDES.map((side) => rawMotion(at(from, side), at(shutterMid(), side), at(to, side))))
  return rawMotion(at(from), at(shutterMid()), at(to))
}

afterAll(() => {
  Object.assign(numbers, kept)
  forceSide(null)
  plans.forEach((p, i) => {
    if (named[i] !== undefined) p.p.near = named[i]
  })
})

describe('the samples of a shutter that keeps a share of the film\'s shutter', () => {
  it('are the samples of before, to the bit, when the share is 1', () => {
    for (const n of [1, 4, 16, 64, 128]) {
      const full = samplesFor(n)
      expect(samplesFor(n, 1)).toEqual(full)
      full.forEach((x, i) => expect(x.timeOffset).toBe(((i + 0.5) / n) * config.shutterFraction))
    }
  })
  it('keep the middle of the shutter, the jitter and the weights, and span the share', () => {
    for (const n of [4, 16, 64]) {
      const full = samplesFor(n)
      for (const share of [0.9999, 0.5, 0.0409, 0.001]) {
        const cut = samplesFor(n, share)
        expect(cut.length).toBe(n)
        cut.forEach((x, i) => {
          expect(x.jitterX).toBe(full[i]!.jitterX)
          expect(x.jitterY).toBe(full[i]!.jitterY)
          expect(x.weight).toBe(full[i]!.weight)
          expect(x.timeOffset - shutterMid()).toBeCloseTo((full[i]!.timeOffset - shutterMid()) * share, 14)
          expect(x.timeOffset).toBeGreaterThan(shutterOffset(0, share))
          expect(x.timeOffset).toBeLessThan(shutterOffset(1, share))
          expect(shutterPosition(x.timeOffset, share)).toBeCloseTo((i + 0.5) / n, 10)
        })
        expect(cut.reduce((a, x) => a + x.timeOffset, 0) / n).toBeCloseTo(shutterMid(), 14)
        expect(shutterOffset(1, share) - shutterOffset(0, share)).toBeCloseTo(share * config.shutterFraction, 14)
        expect((shutterOffset(0, share) + shutterOffset(1, share)) / 2).toBeCloseTo(shutterMid(), 14)
      }
    }
  })
  it('are one sample at the middle, to the bit, whatever the share: the draft tier is what it was', () => {
    for (const share of [1, 0.9999, 0.5, 0.0409, 0.001]) {
      const [one] = samplesFor(1, share)
      expect(one!.timeOffset).toBe(shutterMid())
      expect(one!.timeOffset).toBe(samplesFor(1)[0]!.timeOffset)
      expect([one!.jitterX, one!.jitterY, one!.weight]).toEqual([0, 0, 1])
    }
    for (const s of moving) for (let f = s.firstFrame; f < s.endFrame; f++) expect(framePlan(film, f, 'draft').samples).toBe(1)
  }, LONG)
})

describe('the share of the shutter a frame keeps', () => {
  it('is all of it in every hold, terrain, travel and the ending, and in the dives and rises of a stop that does not hand over', () => {
    // The segments this is about: every one that is not a dive or a rise that hands over. Where every stop hands over none of them is a
    // dive or a rise, and the rest of the film is still held to the whole shutter.
    const rest = config.segments.filter((s) => !moving.includes(s))
    const left = plans.filter((p) => !p.handsOver && p.seg.rise).map((p) => p.id).sort()
    const kinds = new Set<string>()
    const covered = new Set<string>()
    let seen = 0
    for (let f = 0; f < config.frameCount; f++) {
      if (hands(f)) continue
      const s = segmentAtFrame(f)
      seen++
      kinds.add(s.kind)
      if (s.kind === 'dive' || s.kind === 'rise') covered.add(s.stop)
      expect(shutterScale(film, f)).toBe(1)
      expect(blurAllowed(film, f)).toBe(Infinity)
    }
    // Every frame outside a handover was looked at, and so was every kind of segment that has such frames.
    expect(seen).toBeGreaterThan(0)
    expect(seen).toBe(rest.reduce((a, s) => a + s.endFrame - s.firstFrame, 0))
    expect([...kinds].sort()).toEqual([...new Set<string>(rest.map((s) => s.kind))].sort())
    for (const s of config.segments) if (s.kind !== 'dive' && s.kind !== 'rise') expect(kinds.has(s.kind)).toBe(true)
    // The dives and rises among them are those of the stops that do not hand over: all of those stops, and none where no such stop is left.
    expect([...covered].sort()).toEqual(left)
    expect(kinds.has('dive') || kinds.has('rise')).toBe(left.length > 0)
  })
  it('leaves the plan of every such frame the formula it was', () => {
    for (let f = 0; f < config.frameCount; f += 5) {
      if (hands(f)) continue
      const kind = segmentAtFrame(f).kind
      const at = (offset: number) => film.shotAt(f, (f + offset) / fps)
      const mid = at(shutterMid())
      const raw = rawMotion(at(0), mid, at(config.shutterFraction))
      const seen = raw * seenShare(mid)
      for (const tier of ['draft', 'review', 'final']) {
        const base = sampleCount(tier, kind)
        const cap = config.tiers[tier]!.maxSamplesPerFrame
        expect(framePlan(film, f, tier)).toEqual({ samples: cap <= base ? base : samplesNeeded(base, cap, seen), raw, seen, soft: softness(raw), split: false, shutter: 1 })
      }
    }
  })
  it('leaves the allowed motion across the shutter of every frame of a dive or a rise that hands over, and the full shutter where less moves', () => {
    // Counted over the film: a slow dive under a high cap has no frame that moves more than the cap allows.
    let capped = 0
    for (const s of moving) {
      const h = handoverOf(s.stop, s.kind as 'dive' | 'rise')!
      for (let f = s.firstFrame; f < s.endFrame; f++) {
        const split = f >= h.firstFrame && f <= h.lastFrame
        const raw = motionOf(f, 0, config.shutterFraction)
        const allowed = blurAllowed(film, f)
        const share = shutterScale(film, f)
        const plan = framePlan(film, f, 'review')
        expect(allowed).toBeGreaterThanOrEqual(numbers.maxBlurPx)
        expect(plan.raw).toBe(raw)
        expect(plan.shutter).toBe(share)
        expect(plan.split).toBe(split)
        expect(plan.soft).toBe(0)
        const share1 = split ? 1 : seenShare(film.shotAt(f, (f + shutterMid()) / fps))
        if (raw <= allowed) {
          expect(share).toBe(1)
          expect(plan.seen).toBe(raw * share1)
        } else {
          capped++
          expect(share).toBeGreaterThan(0)
          expect(share).toBeLessThan(1)
          const left = motionOf(f, shutterOffset(0, share), shutterOffset(1, share))
          expect(Math.abs(left / allowed - 1)).toBeLessThan(1e-4)
          expect(Math.abs(share / (allowed / raw) - 1)).toBeLessThan(0.1)
          expect(plan.seen).toBe(left * share1)
        }
        const base = sampleCount('review', s.kind)
        expect(plan.samples).toBe(samplesNeeded(base, config.tiers.review!.maxSamplesPerFrame, plan.seen))
      }
    }
    expect(capped).toBeGreaterThan(0)
    expect(moving.length).toBeGreaterThan(0)
  })
  it('follows the path the harness forces', () => {
    const s = moving.find((x) => x.kind === 'dive')!
    const h = handoverOf(s.stop, 'dive')!
    const f = Math.min(h.lastFrame + 2, s.endFrame - 1)
    const own = motionOf(f, 0, config.shutterFraction)
    try {
      forceSide('orbit')
      const forced = motionOf(f, 0, config.shutterFraction)
      expect(forced).not.toBe(own)
      expect(framePlan(film, f, 'review').raw).toBe(forced)
      expect(shutterScale(film, f)).toBe(forced > blurAllowed(film, f) ? framePlan(film, f, 'review').shutter : 1)
      if (forced > blurAllowed(film, f)) expect(Math.abs(motionOf(f, shutterOffset(0, shutterScale(film, f)), shutterOffset(1, shutterScale(film, f))) / blurAllowed(film, f) - 1)).toBeLessThan(1e-4)
    } finally {
      forceSide(null)
    }
    expect(framePlan(film, f, 'review').raw).toBe(own)
  })
})

describe('the ease of the cap at a seam', () => {
  // The seam of a dive or a rise that moves most across the full shutter, with the cap out of the way.
  const fastest = (): { edge: number; away: number; raw: number } => {
    let best = { edge: -1, away: 1, raw: 0 }
    for (const s of moving) {
      for (const [edge, away] of [[s.firstFrame, 1], [s.endFrame - 1, -1]] as const) {
        const raw = motionOf(edge, 0, config.shutterFraction)
        if (raw > best.raw) best = { edge, away, raw }
      }
    }
    return best
  }
  it('is no ramp at a seam that moves no more than the cap, and the cap in the middle of every dive and rise', () => {
    const ease = numbers.blurEaseFrames
    for (const s of moving) {
      for (const [edge, away] of [[s.firstFrame, 1], [s.endFrame - 1, -1]] as const) {
        if (motionOf(edge, 0, config.shutterFraction) > numbers.maxBlurPx) continue
        for (let k = 0; k <= ease; k++) expect(blurAllowed(film, edge + away * k)).toBe(numbers.maxBlurPx)
        expect(shutterScale(film, edge)).toBe(1)
      }
      for (let f = s.firstFrame + ease; f <= s.endFrame - 1 - ease; f++) expect(blurAllowed(film, f)).toBe(numbers.maxBlurPx)
    }
  })
  it('lets the blur rise to the motion of a seam that moves more than the cap, smoothly over the ease frames, so that frame keeps its full shutter', () => {
    const seam = fastest()
    expect(seam.raw).toBeGreaterThan(0)
    try {
      for (const ease of [kept.blurEaseFrames, 5]) {
        numbers.blurEaseFrames = ease
        numbers.maxBlurPx = seam.raw / 3
        const max = numbers.maxBlurPx
        expect(blurAllowed(film, seam.edge)).toBe(seam.raw)
        expect(shutterScale(film, seam.edge)).toBe(1)
        expect(framePlan(film, seam.edge, 'review').shutter).toBe(1)
        expect(blurAllowed(film, seam.edge + seam.away * ease)).toBe(max)
        for (let k = 0; k < ease; k++) {
          const near = blurAllowed(film, seam.edge + seam.away * k)
          const far = blurAllowed(film, seam.edge + seam.away * (k + 1))
          expect(far).toBeLessThan(near)
          expect(near - far).toBeLessThanOrEqual((1.5 * (seam.raw - max)) / ease + 1e-9)
          expect(near).toBeLessThanOrEqual(seam.raw)
          expect(far).toBeGreaterThanOrEqual(max)
        }
        // A frame inside the ramp that moves more than it may keeps exactly what the ramp allows.
        for (let k = 1; k < ease; k++) {
          const f = seam.edge + seam.away * k
          const allowed = blurAllowed(film, f)
          const share = shutterScale(film, f)
          if (motionOf(f, 0, config.shutterFraction) > allowed) expect(Math.abs(motionOf(f, shutterOffset(0, share), shutterOffset(1, share)) / allowed - 1)).toBeLessThan(1e-4)
          else expect(share).toBe(1)
        }
      }
      // No ease frames: no ramp, the seam frame is capped like every other.
      numbers.blurEaseFrames = 0
      expect(blurAllowed(film, seam.edge)).toBe(numbers.maxBlurPx)
      expect(shutterScale(film, seam.edge)).toBeLessThan(1)
    } finally {
      Object.assign(numbers, inFile)
    }
    expect(blurAllowed(film, seam.edge)).toBe(Math.max(CAP, seam.raw > CAP ? seam.raw : 0))
  })
})

describe('the side of a sample in the frame that swaps sides', () => {
  it('goes by the place of the sample in the shutter that is open, so the pattern and the share of each side are the ones of the full shutter', () => {
    let shortened = 0
    for (const s of moving) {
      const kind = s.kind as 'dive' | 'rise'
      const h = handoverOf(s.stop, kind)!
      for (let f = h.firstFrame; f <= h.lastFrame; f++) {
        const weight = dissolveWeight(h, kind, f)
        const share = framePlan(film, f, 'review').shutter
        if (share < 1) shortened++
        for (const n of [1, 16, 64]) {
          const sides = samplesFor(n, share).map((x) => {
            const time = (f + x.timeOffset) / fps
            const side = film.shotAt(f, time).sets.find((set) => set.id === s.stop)!.view
            expect(sideAt(s, time)).toBe(side)
            return side
          })
          sides.forEach((side, i) => expect(side).toBe(weight > shutterThreshold((i + 0.5) / n) ? 'terrain' : 'orbit'))
          if (n > 1) expect(Math.abs(sides.filter((side) => side === 'terrain').length / n - weight)).toBeLessThanOrEqual(2 / n)
        }
      }
    }
    expect(shortened).toBeGreaterThan(0)
  })
})

describe('the floor of the share (handover.minShutter)', () => {
  const step = config.motion.maxStepPx
  const floors = [...new Set([0.25, 0.5, 1, kept.minShutter])].filter((x) => x > 0)
  const shares = (): Map<number, number> => {
    const out = new Map<number, number>()
    for (const s of moving) for (let f = s.firstFrame; f < s.endFrame; f++) out.set(f, shutterScale(film, f))
    return out
  }
  it('lifts a capped frame that would run with less to the floor and leaves every other frame its share, the seams included', () => {
    try {
      numbers.minShutter = 0
      const alone = shares()
      for (const floor of floors) {
        numbers.minShutter = floor
        let lifted = 0
        for (const s of moving) {
          const h = handoverOf(s.stop, s.kind as 'dive' | 'rise')!
          for (let f = s.firstFrame; f < s.endFrame; f++) {
            const was = alone.get(f)!
            const share = shutterScale(film, f)
            expect(share).toBe(was < 1 ? Math.max(was, floor) : 1)
            const plan = framePlan(film, f, 'review')
            expect(plan.shutter).toBe(share)
            expect(plan.soft).toBe(0)
            const split = f >= h.firstFrame && f <= h.lastFrame
            const share1 = split ? 1 : seenShare(film.shotAt(f, (f + shutterMid()) / fps))
            const left = share === 1 ? plan.raw : motionOf(f, shutterOffset(0, share), shutterOffset(1, share))
            expect(plan.seen).toBe(left * share1)
            const allowed = blurAllowed(film, f)
            if (was < floor) {
              // At the floor: more than the cap allows, by design, and less than the full shutter keeps unless the floor is the full shutter.
              lifted++
              expect(left).toBeGreaterThan(allowed)
              if (floor < 1) expect(left).toBeLessThan(plan.raw)
              else expect(left).toBe(plan.raw)
            } else if (was < 1) expect(Math.abs(left / allowed - 1)).toBeLessThan(1e-4)
            else expect(left).toBeLessThanOrEqual(allowed)
          }
          for (const edge of [s.firstFrame, s.endFrame - 1]) expect(shutterScale(film, edge)).toBe(1)
        }
        expect(lifted).toBeGreaterThan(0)
      }
      numbers.minShutter = 0
      expect(shares()).toEqual(alone)
    } finally {
      numbers.minShutter = 0
    }
  }, LONG)
  it('lets the sample count follow the blur that results, one sample for every step of motion.maxStepPx, within the most the tier may take', () => {
    try {
      for (const floor of floors) {
        numbers.minShutter = floor
        for (const tier of ['review', 'final']) {
          const most = config.tiers[tier]!.maxSamplesPerFrame
          let raised = 0
          for (const s of moving) {
            const base = sampleCount(tier, s.kind)
            for (let f = s.firstFrame; f < s.endFrame; f++) {
              const plan = framePlan(film, f, tier)
              const need = Math.ceil(plan.seen / step - 1e-9)
              expect(plan.samples).toBe(Math.min(Math.max(need, base), Math.max(most, base)))
              if (plan.samples > base && plan.samples < most) {
                raised++
                expect(plan.seen / plan.samples).toBeLessThanOrEqual(step + 1e-9)
                expect(plan.seen / (plan.samples - 1)).toBeGreaterThan(step - 1e-9)
              }
              expect(framePlan(film, f, 'draft').samples).toBe(1)
            }
          }
          // The review tier starts low enough that the blur at every one of these floors asks for more than its base count.
          if (tier === 'review') expect(raised).toBeGreaterThan(0)
        }
      }
    } finally {
      numbers.minShutter = 0
    }
  }, LONG)
  it('keeps the pattern of the sides in the frame that swaps them', () => {
    try {
      for (const floor of floors) {
        numbers.minShutter = floor
        for (const s of moving) {
          const kind = s.kind as 'dive' | 'rise'
          const h = handoverOf(s.stop, kind)!
          for (let f = h.firstFrame; f <= h.lastFrame; f++) {
            const weight = dissolveWeight(h, kind, f)
            const share = framePlan(film, f, 'review').shutter
            samplesFor(16, share).forEach((x, i) => {
              const time = (f + x.timeOffset) / fps
              const side = film.shotAt(f, time).sets.find((set) => set.id === s.stop)!.view
              expect(sideAt(s, time)).toBe(side)
              expect(side).toBe(weight > shutterThreshold((i + 0.5) / 16) ? 'terrain' : 'orbit')
            })
          }
        }
      }
    } finally {
      numbers.minShutter = 0
    }
  })
})

describe('the cap switched off (handover.maxBlurPx 0)', () => {
  const tiers = ['draft', 'review', 'final']
  // The cover of a stop (handover.sharpCover) gives the plan of its frames a count for their lookups, the ends of its shutter
  // (handover.shutterEnds) the share over which it opens and closes. Both came after the cap and are laws of their own (tests/sharp.test.ts,
  // tests/shutter-ends.test.ts), so they are emptied here with the cap: the plan is read as it was before all three.
  const covers = numbers as unknown as { sharpCover: Record<string, number>; shutterEnds: Record<string, number> }
  const coverKept = covers.sharpCover
  const endsKept = covers.shutterEnds
  const off = (run: () => void): void => {
    try {
      numbers.maxBlurPx = 0
      covers.sharpCover = {}
      covers.shutterEnds = {}
      run()
    } finally {
      Object.assign(numbers, inFile)
      covers.sharpCover = coverKept
      covers.shutterEnds = endsKept
    }
  }
  // The plan of a frame as it was before the capped shutter (framePlan of core/motion.ts on main fdf97b8), written out: the motion across the
  // film's whole shutter, on both sides inside the dissolve; the count of a tier follows from seen.
  const before = (f: number): { raw: number; seen: number; soft: number; split: boolean } => {
    const segment = segmentAtFrame(f)
    const at = (offset: number, side?: ViewKind) => film.shotAt(f, (f + offset) / fps, side)
    const h = segment.kind === 'dive' || segment.kind === 'rise' ? handoverOf(segment.stop, segment.kind) : null
    if (h && f >= h.firstFrame && f <= h.lastFrame) {
      const raw = Math.max(...SIDES.map((side) => rawMotion(at(0, side), at(shutterMid(), side), at(config.shutterFraction, side))))
      return { raw, seen: raw, soft: 0, split: true }
    }
    const mid = at(shutterMid())
    const raw = rawMotion(at(0), mid, at(config.shutterFraction))
    return { raw, seen: raw * seenShare(mid), soft: h ? 0 : softness(raw), split: false }
  }
  it('gives every frame of the film its full shutter, whatever the floor and the ease are set to', () => {
    off(() => {
      for (const [floor, ease] of [[0, kept.blurEaseFrames], [0.5, kept.blurEaseFrames], [1, 0]] as const) {
        numbers.minShutter = floor
        numbers.blurEaseFrames = ease
        for (let f = 0; f < config.frameCount; f++) {
          expect(shutterScale(film, f)).toBe(1)
          expect(blurAllowed(film, f)).toBe(Infinity)
        }
      }
    })
  })
  it('leaves the plan of every frame of the film the formula it was before the cap, at the three tiers', () => {
    off(() => {
      let handing = 0
      let split = 0
      for (let f = 0; f < config.frameCount; f++) {
        const kind = segmentAtFrame(f).kind
        const old = before(f)
        if (hands(f)) handing++
        if (old.split) split++
        for (const tier of tiers) {
          const base = sampleCount(tier, kind)
          const most = config.tiers[tier]!.maxSamplesPerFrame
          expect(framePlan(film, f, tier)).toEqual({ samples: most <= base ? base : samplesNeeded(base, most, old.seen), ...old, shutter: 1 })
        }
      }
      expect(handing).toBe(moving.reduce((a, s) => a + s.endFrame - s.firstFrame, 0))
      expect(split).toBeGreaterThan(0)
    })
  }, LONG)
  it('leaves the samples of every frame the old ones: their times inside the frame, and in a frame that swaps sides the side of each', () => {
    off(() => {
      const counts = new Set<number>()
      for (let f = 0; f < config.frameCount; f++) for (const tier of tiers) counts.add(framePlan(film, f, tier).samples)
      expect(counts.size).toBeGreaterThan(3)
      for (const n of counts) {
        expect(samplesFor(n, 1)).toEqual(samplesFor(n))
        samplesFor(n).forEach((x, i) => expect(x.timeOffset).toBe(((i + 0.5) / n) * config.shutterFraction))
      }
      let swapped = 0
      for (const s of moving) {
        const kind = s.kind as 'dive' | 'rise'
        const h = handoverOf(s.stop, kind)!
        for (let f = h.firstFrame; f <= h.lastFrame; f++) {
          const weight = dissolveWeight(h, kind, f)
          for (const tier of tiers) {
            const plan = framePlan(film, f, tier)
            for (const x of samplesFor(plan.samples, plan.shutter)) {
              // The rule of before: the place of the time inside the film's whole shutter against the threshold.
              const time = (f + x.timeOffset) / fps
              const place = (time * fps - Math.floor(time * fps + 1e-9)) / config.shutterFraction
              expect(sideAt(s, time)).toBe(weight > shutterThreshold(place) ? 'terrain' : 'orbit')
              swapped++
            }
          }
        }
      }
      expect(swapped).toBeGreaterThan(0)
    })
  }, LONG)
})
