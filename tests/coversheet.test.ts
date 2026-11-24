import { readFileSync } from 'node:fs'
import { afterAll, describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { handoverFrame, handoverOf } from '../src/director/handover'
import { plans } from '../src/director/plans'
import { sheetFrames } from '../tools/lib/render'
import { FilmDirector } from '../src/director/film'
import { coveredPlan, filmWith, restorePlans } from './lib/covered'

const limit = config.raw.critics.contactSheetFrames
const seg = (stop: string, kind: string): (typeof config.segments)[number] => config.segments.find((s) => s.stop === stop && s.kind === kind)!
const dive = seg('mars', 'dive')
const rise = seg('mars', 'rise')
const run = (s: typeof dive, placeWindow: boolean): number[] => sheetFrames(config, s, true, placeWindow).map((x) => x.frame)
const consecutive = (frames: number[]): void => frames.forEach((f, i) => expect(f).toBe(frames[0]! + i))
const viewOf = (film: FilmDirector, frame: number, stop = 'mars'): string => film.shotAt(frame, (frame + config.shutterFraction / 2) / config.fps).sets.filter((x) => x.id === stop).map((x) => x.view).join('+')

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

  it('centres the run on the middle of a window that is shorter than the sheet', () => {
    for (const placeFrames of [4, 5]) {
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

  it('keeps the change of view on the sheet where the window is longer than the sheet', () => {
    for (const placeFrames of [30, 31]) {
      coveredPlan({ handover: { dive: { placeFrames }, rise: { placeFrames } } })
      const down = run(dive, true)
      const up = run(rise, true)
      expect(down.length).toBe(limit)
      expect(up.length).toBe(limit)
      consecutive(down)
      consecutive(up)
      expect(down.at(-1)).toBe(handoverFrame(handoverOf('mars', 'dive')!))
      expect(up[0]).toBe(handoverFrame(handoverOf('mars', 'rise')!))
    }
  })

  it('puts the change of view in the middle where the move draws no place picture', () => {
    for (const placeFrames of [0, 12, 30]) {
      const plan = coveredPlan({ handover: { dive: { placeFrames, picture: false }, rise: { placeFrames, picture: false } } })
      const film = filmWith(plan)
      for (const s of [dive, rise]) {
        const t = handoverFrame(handoverOf('mars', s.kind as 'dive' | 'rise')!)
        const frames = run(s, true)
        expect(frames.length).toBe(limit)
        consecutive(frames)
        expect(frames[0]).toBe(s.kind === 'dive' ? t - limit / 2 : t + 1 - limit / 2)
        const views = frames.map((f) => viewOf(film, f))
        expect(views).toEqual(frames.map((_, i) => ((i < limit / 2) === (s.kind === 'dive') ? 'orbit' : 'terrain')))
      }
    }
  })

  it('crosses into the next segment where the change lies at the end of the move', () => {
    const plan = coveredPlan({ handover: { dive: { at: 0.999, placeFrames: 0, picture: false }, rise: { at: 0.001, placeFrames: 0, picture: false } } })
    const film = filmWith(plan)
    expect(handoverFrame(handoverOf('mars', 'dive')!)).toBe(dive.endFrame - 1)
    expect(handoverFrame(handoverOf('mars', 'rise')!)).toBe(rise.firstFrame)
    const down = run(dive, true)
    const up = run(rise, true)
    consecutive(down)
    consecutive(up)
    expect([down[0], down.at(-1)]).toEqual([dive.endFrame - 1 - limit / 2, dive.endFrame - 2 + limit / 2])
    expect([up[0], up.at(-1)]).toEqual([rise.firstFrame + 1 - limit / 2, rise.firstFrame + limit / 2])
    expect(down.filter((f) => f >= dive.endFrame).length).toBe(limit / 2 - 1)
    expect(up.filter((f) => f < rise.firstFrame).length).toBe(limit / 2 - 1)
    expect(down.map((f) => viewOf(film, f))).toEqual(down.map((_, i) => (i < limit / 2 ? 'orbit' : 'terrain')))
    expect(up.map((f) => viewOf(film, f))).toEqual(up.map((_, i) => (i < limit / 2 ? 'terrain' : 'orbit')))
  })

  it('holds both views of every move of the film, six frames of each where no place picture is drawn', () => {
    restorePlans()
    const film = new FilmDirector(plans)
    let moves = 0
    for (const p of plans) {
      for (const kind of ['dive', 'rise'] as const) {
        const s = seg(p.id, kind)
        const h = s ? handoverOf(p.id, kind) : null
        if (!s || !h) continue
        moves++
        const frames = run(s, true)
        expect(frames.length).toBe(limit)
        consecutive(frames)
        const old = frames.filter((f) => viewOf(film, f, p.id) === (kind === 'dive' ? 'orbit' : 'terrain')).length
        const next = frames.filter((f) => viewOf(film, f, p.id) === (kind === 'dive' ? 'terrain' : 'orbit')).length
        expect(old + next).toBe(limit)
        if (h.picture) expect(Math.min(old, next)).toBeGreaterThan(0)
        else expect([old, next]).toEqual([limit / 2, limit / 2])
      }
    }
    expect(moves).toBeGreaterThan(0)
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

  it('is asked for by every pack command of the round tool, stop rounds and whole film rounds alike', () => {
    const lines = readFileSync(new URL('../tools/round.py', import.meta.url), 'utf8').split('\n')
    const at = lines.findIndex((l) => l.startsWith('def tiers('))
    const body = lines.slice(at, lines.findIndex((l, i) => i > at && l.startsWith('def '))).join('\n')
    expect(body).toMatch(/if tool == 'pack':\n\s+return ' --place-window' \+/)
    expect(body.indexOf("if tool == 'pack'")).toBeLessThan(body.indexOf('if not t'))
    const commands = lines.filter((l) => /npm run (-s )?pack -- /.test(l))
    expect(commands.length).toBe(7)
    const extra = lines.filter((l) => /^\s+extra = tiers\(s, 'pack'\)/.test(l))
    expect(extra.length).toBe(1)
    for (const l of commands) expect(l.includes("tiers(s, 'pack')") || /% \(s\['phase'\], n, extra\)/.test(l)).toBe(true)
  })
})
