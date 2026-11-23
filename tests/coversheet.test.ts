import { afterAll, describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { handoverFrame, handoverOf } from '../src/director/handover'
import { plans } from '../src/director/plans'
import { sheetFrames } from '../tools/lib/render'
import { coveredPlan, restorePlans } from './lib/covered'

const limit = config.raw.critics.contactSheetFrames
const seg = (stop: string, kind: string): (typeof config.segments)[number] => config.segments.find((s) => s.stop === stop && s.kind === kind)!
const dive = seg('mars', 'dive')
const rise = seg('mars', 'rise')
const run = (s: typeof dive, placeWindow: boolean): number[] => sheetFrames(config, s, true, placeWindow).map((x) => x.frame)
const consecutive = (frames: number[]): void => frames.forEach((f, i) => expect(f).toBe(frames[0]! + i))

afterAll(() => restorePlans())

describe('the cover sheet of a stop round', () => {
  it('shows a dive whose place window ends at T up to T', () => {
    coveredPlan({ handover: {} })
    const h = handoverOf('mars', 'dive')!
    expect(h.placeLastFrame).toBe(handoverFrame(h))
    expect(h.placeLastFrame - h.placeFirstFrame + 1).toBe(limit + 1)
    const frames = run(dive, true)
    expect(frames.length).toBe(limit)
    consecutive(frames)
    expect(frames[0]).toBe(h.placeFirstFrame + 1)
    expect(frames.at(-1)).toBe(h.placeLastFrame)
  })

  it('shows a rise whose place window starts at T from T on', () => {
    coveredPlan({ handover: {} })
    const h = handoverOf('mars', 'rise')!
    expect(h.placeFirstFrame).toBe(handoverFrame(h))
    expect(h.placeLastFrame - h.placeFirstFrame + 1).toBe(limit + 1)
    const frames = run(rise, true)
    expect(frames.length).toBe(limit)
    consecutive(frames)
    expect(frames[0]).toBe(h.placeFirstFrame)
    expect(frames.at(-1)).toBe(h.placeLastFrame - 1)
  })

  it('centres the run on the middle of a window that is longer or shorter than the sheet', () => {
    for (const placeFrames of [30, 31, 4, 5]) {
      coveredPlan({ handover: { dive: { placeFrames }, rise: { placeFrames } } })
      for (const s of [dive, rise]) {
        const h = handoverOf('mars', s.kind as 'dive' | 'rise')!
        const frames = run(s, true)
        expect(frames.length).toBe(limit)
        consecutive(frames)
        const off = frames[0]! + frames.at(-1)! - (h.placeFirstFrame + h.placeLastFrame)
        expect(off).toBe((placeFrames + 1 - limit) % 2 === 0 ? 0 : s.kind === 'dive' ? 1 : -1)
      }
    }
  })

  it('stays inside the segment', () => {
    coveredPlan({ handover: { rise: { at: 0.02, placeFrames: 2 } } })
    const frames = run(rise, true)
    expect(frames.length).toBe(limit)
    expect(frames[0]).toBe(rise.firstFrame)
  })

  it('keeps the old frames for a stop with a cover and for every sheet made without the place window', () => {
    coveredPlan()
    expect(handoverOf('mars', 'dive')).toBeNull()
    for (const s of [dive, rise]) expect(run(s, true)).toEqual(run(s, false))
    coveredPlan({ handover: {} })
    for (const s of [dive, rise]) {
      const h = handoverOf('mars', s.kind as 'dive' | 'rise')!
      expect(run(s, false)[0]).toBe(handoverFrame(h) - Math.floor((limit - 1) / 2))
      expect(sheetFrames(config, s, true)).toEqual(sheetFrames(config, s, true, false))
      expect(sheetFrames(config, s, false, true)).toEqual(sheetFrames(config, s, false))
    }
    restorePlans()
    for (const p of plans) {
      for (const kind of ['dive', 'rise']) {
        const s = seg(p.id, kind)
        if (s && !p.handsOver) expect(run(s, true)).toEqual(run(s, false))
      }
    }
  })
})
