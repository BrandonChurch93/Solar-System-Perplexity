import { describe, expect, it } from 'vitest'
import { IN_PLACE, frameSteps, type StepLimits, type StepRow } from '../tools/lib/steps'

// The steps between two frames of a dive or a rise (tools/lib/steps.ts): on the mean of the body, and in place on the ground both frames show.

// The limits of the film (handover.limits), the same for both readings.
const LIMITS: StepLimits = { bodyShare: 0.05, levelStep: 6, colourStep: 8, flatShare: 0.6, inPlaceShare: IN_PLACE.share, inPlace: false }
const IN_PLACE_LIMITS: StepLimits = { ...LIMITS, inPlace: true }

function row(frame: number, bodyLevel: number, inPlace?: { seen: number; level: number }, more: Partial<StepRow> = {}): StepRow {
  return {
    frame, level: bodyLevel * 0.5, colour: [bodyLevel * 0.5, bodyLevel * 0.5, bodyLevel * 0.5], bodyShare: 0.5, bodyLevel, bodyColour: [bodyLevel, bodyLevel, bodyLevel], flatShare: 0.1,
    ...(inPlace ? { inPlace: { seen: inPlace.seen, level: inPlace.level, colour: [inPlace.level, inPlace.level, inPlace.level] } } : {}),
    ...more,
  }
}

// A rise whose eye swings toward the night side: the mean of the body falls by 7 into frame 12, no ground changes its look.
const opens = [row(10, 120), row(11, 116, { seen: 0.95, level: 0.2 }), row(12, 109, { seen: 0.9, level: -0.3 }), row(13, 105, { seen: 0.92, level: 0.1 })]
// A wash over the ground for one frame that darker new ground hides in the mean of the body.
const wash = [row(20, 70), row(21, 71, { seen: 0.8, level: 1 }), row(22, 73.4, { seen: 0.75, level: 6.5 }), row(23, 74, { seen: 0.75, level: 0.5 })]

describe('the steps between two frames', () => {
  it('are judged on the mean of the body, to the letter as before, where the reading in place is not the judged one', () => {
    const s = frameSteps(opens, LIMITS)
    expect(s.why).toEqual(['the mean level of the body steps by 7 into frame 12, limit 6'])
    expect(s.level).toEqual({ frame: 12, step: 7 })
    expect(s.colour).toEqual({ frame: 12, step: 7 })
    expect(s.whole).toEqual({ frame: 12, step: 3.5 })
    expect(s.inPlace.judged).toBe(false)
    expect(s.inPlace.level).toEqual({ frame: 12, step: 0.3 })
    expect(s.inPlace.least).toEqual({ frame: 12, share: 0.9 })
    expect(s.inPlace.unread).toBe(0)
    expect(frameSteps(wash, LIMITS).why).toEqual([])
  })

  it('tell what each reading would rule, whichever is judged', () => {
    for (const limits of [LIMITS, IN_PLACE_LIMITS]) {
      expect(frameSteps(opens, limits).fails).toEqual({ body: ['the mean level of the body steps by 7 into frame 12, limit 6'], inPlace: [] })
      expect(frameSteps(wash, limits).fails).toEqual({ body: [], inPlace: ['the level of the ground two frames both show steps by 6.5 into frame 22, limit 6'] })
    }
  })

  it('are judged in place, with the same limits, where that reading is the judged one: a frame that opens on darker ground is no step', () => {
    const s = frameSteps(opens, IN_PLACE_LIMITS)
    expect(s.inPlace.judged).toBe(true)
    expect(s.why).toEqual([])
    // The mean of the body is still reported.
    expect(s.level).toEqual({ frame: 12, step: 7 })
  })

  it('and a change of the look that the mean of the body hides is one', () => {
    const s = frameSteps(wash, IN_PLACE_LIMITS)
    expect(s.level.step).toBeCloseTo(2.4, 9)
    expect(s.why).toEqual(['the level of the ground two frames both show steps by 6.5 into frame 22, limit 6'])
    const colour = wash.map((r) => (r.frame === 22 ? { ...r, inPlace: { seen: 0.75, level: 2, colour: [9, 1, -1] } } : r))
    expect(frameSteps(colour, IN_PLACE_LIMITS).why).toEqual(['the colour of the ground two frames both show steps by 9 into frame 22, limit 8'])
  })

  it('read a step of the whole picture the same in both readings where the frame does not open', () => {
    // Every ground of the frame was in the frame before and the light of the whole picture steps: the mean of the body and the ground in place
    // move by the same 6.4 levels, and both readings fail it with the same number.
    const lit = [row(40, 100), row(41, 100.1, { seen: 1, level: 0.1 }), row(42, 106.5, { seen: 1, level: 6.4 }), row(43, 106.6, { seen: 1, level: 0.1 })]
    const s = frameSteps(lit, IN_PLACE_LIMITS)
    expect(s.level.step).toBeCloseTo(6.4, 9)
    expect(s.inPlace.level).toEqual({ frame: 42, step: 6.4 })
    expect(s.fails.body).toEqual(['the mean level of the body steps by 6.4 into frame 42, limit 6'])
    expect(s.fails.inPlace).toEqual(['the level of the ground two frames both show steps by 6.4 into frame 42, limit 6'])
  })

  it('catch in place a step of the light that a frame opening on darker ground hides in the mean of the body', () => {
    // The light steps up by 6.4 levels while the frame opens on dark ground that pulls the mean of the body down by 7: the mean moves by 0.6.
    const hidden = [row(50, 100), row(51, 100.1, { seen: 0.9, level: 0.1 }), row(52, 99.5, { seen: 0.9, level: 6.4 }), row(53, 99.6, { seen: 0.9, level: 0.1 })]
    const s = frameSteps(hidden, LIMITS)
    expect(s.why).toEqual([])
    expect(s.fails.body).toEqual([])
    expect(s.fails.inPlace).toEqual(['the level of the ground two frames both show steps by 6.4 into frame 52, limit 6'])
    expect(frameSteps(hidden, IN_PLACE_LIMITS).why).toEqual(s.fails.inPlace)
  })

  it('keep the mean of the body as the judge of a pair that cannot be read in place', () => {
    // Frame 12 shares a third of its ground with frame 11, and frame 13 comes without a reading: neither is read in place.
    const jump = [opens[0]!, opens[1]!, row(12, 109, { seen: 0.33, level: 0.1 }), row(13, 99.5)]
    const s = frameSteps(jump, IN_PLACE_LIMITS)
    expect(s.inPlace.unread).toBe(2)
    expect(s.inPlace.unreadLevel).toEqual({ frame: 13, step: 9.5 })
    expect(s.inPlace.level).toEqual({ frame: 11, step: 0.2 })
    expect(s.inPlace.least).toEqual({ frame: 12, share: 0.33 })
    expect(s.why).toEqual([
      'the mean level of the body steps by 9.5 into frame 13 (a frame that shares too little ground with the one before to be read in place), limit 6',
      'the mean colour of the body steps by 9.5 into frame 13 (a frame that shares too little ground with the one before to be read in place), limit 8',
    ])
    // The share is the limit's: with a third allowed, frame 12 is read in place again.
    expect(frameSteps(jump, { ...IN_PLACE_LIMITS, inPlaceShare: 0.3 }).inPlace.unread).toBe(1)
  })

  it('leave out a pair where either frame holds too little of the body, in both readings', () => {
    const small = [row(30, 120), row(31, 60, { seen: 0.9, level: -20 }, { bodyShare: 0.03 }), row(32, 10, { seen: 0.9, level: -20 })]
    for (const limits of [LIMITS, IN_PLACE_LIMITS]) {
      const s = frameSteps(small, limits)
      expect(s.why).toEqual([])
      expect(s.level.frame).toBe(-1)
      expect(s.inPlace.level.frame).toBe(-1)
      expect(s.inPlace.unread).toBe(0)
      // The whole frame is still reported.
      expect(s.whole).toEqual({ frame: 31, step: 30 })
    }
  })

  it('judge the flat share of the body in both readings', () => {
    const flat = opens.map((r) => (r.frame === 13 ? { ...r, flatShare: 0.71 } : r))
    expect(frameSteps(flat, IN_PLACE_LIMITS).why).toEqual(['frame 13 has 71 percent of the body flat, limit 60'])
    expect(frameSteps(flat, LIMITS).why).toEqual(['the mean level of the body steps by 7 into frame 12, limit 6', 'frame 13 has 71 percent of the body flat, limit 60'])
  })

  it('read the pictures at a quarter of their size, ask for half of the body in both frames, and leave the mean of the body the judged reading', () => {
    expect(IN_PLACE).toEqual({ scale: 0.25, share: 0.5, judged: false })
  })
})
