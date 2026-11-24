import { describe, expect, it } from 'vitest'
import { pairRuling, placeReadings, type PlaceFrame } from '../tools/smooth/place'

const L = { bodyShare: 0.05, levelStep: 3.2, colourStep: 4, inPlaceShare: 0.5 }
const frame = (k: number, bodyLevel: number, inPlace: PlaceFrame['inPlace'], over: Partial<PlaceFrame> = {}): PlaceFrame => ({ k, level: bodyLevel / 2, colour: [bodyLevel / 2, bodyLevel / 2, bodyLevel / 2], bodyShare: 0.6, bodyLevel, bodyColour: [bodyLevel + 1, bodyLevel, bodyLevel - 1], flatShare: 0, inPlace, ...over })
const seen = (share: number, level: number, colour: number[] = [level, level, level]): PlaceFrame['inPlace'] => ({ seen: share, level, colour })

describe('the two readings of a step in the place part', () => {
  const frames = [
    frame(200, 100, null),
    frame(201, 95, seen(0.9, -0.3)),
    frame(202, 95.5, seen(0.8, 3.5, [3, 3.6, 4.4])),
    frame(203, 99.5, seen(0.3, -9)),
    frame(204, 99.6, seen(0.95, 0.1), { bodyShare: 0.01 }),
    frame(205, 99.7, seen(0.95, 0.2)),
    frame(206, 102.7, seen(0.7, -3)),
  ]
  const r = placeReadings(frames, L)

  it('reads every pair both ways: on the mean of the body, and in place where the frame before shows enough of the body', () => {
    expect(r.pairs[0]).toEqual({ bodyLevelStep: null, bodyColourStep: null, seen: null, placeLevelStep: null, placeColourStep: null })
    expect(r.pairs[1]).toEqual({ bodyLevelStep: 5, bodyColourStep: 5, seen: 0.9, placeLevelStep: 0.3, placeColourStep: 0.3 })
    expect(r.pairs[2]!.bodyLevelStep).toBeCloseTo(0.5, 12)
    expect(r.pairs[2]!.placeLevelStep).toBe(3.5)
    expect(r.pairs[2]!.placeColourStep).toBe(4.4)
    expect(r.pairs[3]).toEqual({ bodyLevelStep: 4, bodyColourStep: 4, seen: 0.3, placeLevelStep: null, placeColourStep: null })
    expect(r.pairs[4]).toEqual({ bodyLevelStep: null, bodyColourStep: null, seen: null, placeLevelStep: null, placeColourStep: null })
    expect(r.pairs[5]).toEqual({ bodyLevelStep: null, bodyColourStep: null, seen: null, placeLevelStep: null, placeColourStep: null })
    expect(r.pairs[6]!.bodyLevelStep).toBeCloseTo(3, 12)
    expect(r.pairs[6]!.placeLevelStep).toBe(3)
  })

  it('names the largest steps of each reading by the capture frame, the least ground shared and the pairs that cannot be read in place', () => {
    expect(r.body.level).toEqual({ frame: 201, step: 5 })
    expect(r.body.colour).toEqual({ frame: 201, step: 5 })
    expect(r.inPlace.level).toEqual({ frame: 202, step: 3.5 })
    expect(r.inPlace.colour).toEqual({ frame: 202, step: 4.4 })
    expect(r.inPlace.least).toEqual({ frame: 203, share: 0.3 })
    expect(r.inPlace.read).toBe(3)
    expect(r.inPlace.unread).toBe(1)
    expect(r.inPlace.unreadLevel).toEqual({ frame: 203, step: 4 })
    expect(r.fails.body).toHaveLength(2)
    expect(r.fails.inPlace).toHaveLength(3)
  })

  it('rules a pair by both readings, the one in place at limits scaled, and says where they part', () => {
    const rule = (i: number) => pairRuling(r.pairs[i]!, L, 5 / 6)
    expect(rule(0)).toBeNull()
    expect(rule(1)).toEqual({ body: true, inPlace: false, differs: true })
    expect(rule(2)).toEqual({ body: false, inPlace: true, differs: true })
    expect(rule(3)).toEqual({ body: true, inPlace: true, differs: false })
    expect(rule(4)).toBeNull()
    expect(rule(6)).toEqual({ body: false, inPlace: true, differs: true })
    expect(pairRuling(r.pairs[6]!, L, 1)).toEqual({ body: false, inPlace: false, differs: false })
    expect(pairRuling({ bodyLevelStep: 1, bodyColourStep: 3.4, seen: 0.2, placeLevelStep: null, placeColourStep: null }, L, 5 / 6)).toEqual({ body: false, inPlace: true, differs: true })
  })

  it('gives the mean of the body the numbers the place part has judged so far', () => {
    const old = frames.map((f, i) => {
      const p = frames[i - 1]
      const ok = p !== undefined && Math.min(f.bodyShare, p.bodyShare) >= L.bodyShare
      return ok ? Math.abs(f.bodyLevel - p.bodyLevel) : null
    })
    expect(r.pairs.map((p) => p.bodyLevelStep)).toEqual(old)
    expect(Math.max(...(old.filter((v) => v !== null) as number[]))).toBe(r.body.level.step)
  })
})
