import { afterAll, describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { config, type Segment } from '../src/config'
import { framePlan, rawMotion, seenShare, softness } from '../src/core/motion'
import { samplesFor, shutterMid } from '../src/core/sampler'
import type { Pose, Shot, ViewKind } from '../src/core/types'
import { FilmDirector } from '../src/director/film'
import { dissolveWeight, forceSide, handoverFrame, handoverOf, judgedWindow, placeWeight, shutterThreshold, sideAt } from '../src/director/handover'
import type { MoveParams, StopPlan } from '../src/director/moves'
import { plans } from '../src/director/plans'
import { coverFrames, coverWindow } from '../src/director/timeline'
import { cuesOf, swapOf } from '../tools/lib/cues'
import { detailFrames, sheetFrames } from '../tools/lib/render'
import { COVERED, coveredPlan, filmWith, restorePlans } from './lib/covered'

const fps = config.fps
const seg = (stop: string, kind: string): Segment => config.segments.find((s) => s.stop === stop && s.kind === kind)!
const dive = seg('mars', 'dive')
const rise = seg('mars', 'rise')
const moves = [dive, rise]
const sampleTimes = (frame: number, count: number): number[] => samplesFor(count).map((s) => (frame + s.timeOffset) / fps)
const closeShare = (s: Segment, frame: number, count: number): number => sampleTimes(frame, count).filter((t) => sideAt(s, t) === 'terrain').length / count
const finite = (p: Pose): boolean => [...p.position.toArray(), ...p.quaternion.toArray(), p.vfov].every(Number.isFinite)
const flat = (shot: Shot): string => JSON.stringify({ c: shot.camera, s: shot.sets, sky: [shot.skyQuaternion, shot.skyExposure, shot.skyGlow, shot.skyTurn, shot.skyStars, shot.skyPatch, shot.skyLook], sun: shot.sun, post: shot.post, cover: shot.cover, near: shot.near, far: shot.far, dust: shot.dust })
const opt = (h: MoveParams['handover']): StopPlan => coveredPlan({ handover: h })
const off = (): StopPlan => coveredPlan()
const withMars = (plan: StopPlan): FilmDirector => filmWith(plan)
const others = plans.filter((p) => p.id !== COVERED)
const other = others.find((p) => p.id === 'earth')!

afterAll(() => {
  forceSide(null)
  restorePlans()
})

describe('a stop that did not opt in', () => {
  it('has no handover, no place weight and the sides of today', () => {
    for (const p of [off(), ...others]) {
      if (p.handsOver) continue
      for (const s of [p.seg.dive, p.seg.rise]) {
        if (!s) continue
        const kind = s.kind as 'dive' | 'rise'
        expect(handoverOf(p.id, kind)).toBeNull()
        const w = coverWindow(s)!
        expect(w).toEqual(coverFrames(s))
        expect(judgedWindow(s)).toEqual(w)
        const centre = w.centerFrame / fps
        for (let f = s.firstFrame; f < s.endFrame; f++) {
          for (const t of [f / fps, ...sampleTimes(f, 1), ...sampleTimes(f, 16), (f + config.shutterFraction) / fps]) {
            const want: ViewKind = kind === 'dive' ? (t >= centre ? 'terrain' : 'orbit') : t < centre ? 'terrain' : 'orbit'
            expect(sideAt(s, t)).toBe(want)
            expect(placeWeight(s, t)).toBe(0)
          }
        }
      }
    }
  })
  it('gets the same shots and the same frame plan whether or not another stop opted in', () => {
    const before = withMars(off())
    const old = (f: number): { raw: number; soft: number } => {
      const at = (o: number): Shot => before.shotAt(f, (f + o) / fps)
      const raw = rawMotion(at(0), at(shutterMid()), at(config.shutterFraction))
      return { raw, soft: softness(raw) }
    }
    const plansBefore: Record<number, { raw: number; soft: number; samples: number; seen: number }> = {}
    const shotsBefore: Record<string, string> = {}
    const frames: number[] = []
    const plain = new Set<number>()
    for (const q of others) {
      for (const kind of ['hold', 'dive', 'terrain', 'rise', 'travel']) {
        const s = seg(q.id, kind)
        if (!s) continue
        const own: number[] = []
        for (let f = s.firstFrame; f < s.endFrame; f += 5) own.push(f)
        const w = coverFrames(s)
        if (w) own.push(w.centerFrame - 1, w.centerFrame, w.centerFrame + 1)
        frames.push(...own)
        if (!q.handsOver) for (const f of own) plain.add(f)
      }
    }
    // The fixture stop never opts in: its frames keep this test meaningful when every stop of the film has opted in.
    const fixture: number[] = []
    for (const kind of ['hold', 'dive', 'terrain', 'rise', 'travel']) {
      const s = seg(COVERED, kind)
      if (!s) continue
      for (let f = s.firstFrame; f < s.endFrame; f += 5) fixture.push(f)
      const w = coverFrames(s)
      if (w) fixture.push(w.centerFrame - 1, w.centerFrame, w.centerFrame + 1)
    }
    expect(fixture.length).toBeGreaterThan(0)
    const same = (f: number): void => {
      const p = framePlan(before, f, 'review')
      expect(p.raw).toBe(old(f).raw)
      expect(p.soft).toBe(old(f).soft)
      expect(p.split).toBe(false)
      expect(p.seen).toBe(p.raw * seenShare(before.shotAt(f, (f + shutterMid()) / fps)))
    }
    for (const f of fixture) same(f)
    for (const f of frames) {
      const p = framePlan(before, f, 'review')
      if (plain.has(f)) same(f)
      plansBefore[f] = { raw: p.raw, soft: p.soft, samples: p.samples, seen: p.seen }
      for (const o of [0, shutterMid(), 0.4]) shotsBefore[f + ':' + o] = flat(before.shotAt(f, (f + o) / fps))
    }
    const after = withMars(opt({}))
    for (const f of frames) {
      const p = framePlan(after, f, 'review')
      expect({ raw: p.raw, soft: p.soft, samples: p.samples, seen: p.seen }).toEqual(plansBefore[f])
      for (const o of [0, shutterMid(), 0.4]) expect(flat(after.shotAt(f, (f + o) / fps))).toBe(shotsBefore[f + ':' + o])
    }
    off()
  })
})

describe('a stop that opted in', () => {
  it('places T, the dissolve and the place window from its times and the defaults', () => {
    opt({})
    const d = handoverOf('mars', 'dive')!
    const r = handoverOf('mars', 'rise')!
    const c = config.raw.handover
    expect(d.firstFrame).toBe(Math.floor((dive.start + c.dive.at * (dive.end - dive.start)) * fps + 1e-9))
    expect(d.firstFrame).toBe(coverFrames(dive)!.centerFrame)
    expect(r.firstFrame).toBe(coverFrames(rise)!.centerFrame)
    expect(d.lastFrame - d.firstFrame + 1).toBe(c.dive.dissolveFrames)
    expect(d.placeFirstFrame).toBe(d.firstFrame - c.dive.placeFrames)
    expect(d.placeLastFrame).toBe(d.lastFrame)
    expect(r.placeFirstFrame).toBe(r.firstFrame)
    expect(r.placeLastFrame).toBe(r.lastFrame + c.rise.placeFrames)
    expect(d.time).toBeCloseTo((d.firstFrame + shutterMid()) / fps, 12)
    expect(handoverFrame(d)).toBe(d.firstFrame)
    opt({ dive: { at: 0.5, dissolveFrames: 4, placeFrames: 20 }, rise: { dissolveFrames: 3, placeFrames: 6 } })
    const d4 = handoverOf('mars', 'dive')!
    const r3 = handoverOf('mars', 'rise')!
    const centre = dive.firstFrame + dive.frames / 2
    expect([d4.firstFrame, d4.lastFrame]).toEqual([centre - 1, centre + 2])
    expect(d4.time).toBeCloseTo((centre + 0.5 + shutterMid()) / fps, 12)
    expect(d4.placeFirstFrame).toBe(centre - 21)
    expect([r3.firstFrame, r3.lastFrame, r3.placeLastFrame]).toEqual([r.firstFrame - 1, r.firstFrame + 1, r.firstFrame + 7])
    expect(r3.time).toBeCloseTo((r.firstFrame + shutterMid()) / fps, 12)
    expect(handoverOf('mars', 'dive')).toBe(d4)
    for (const q of others) for (const kind of ['dive', 'rise'] as const) if (q.seg[kind]) expect(handoverOf(q.id, kind) === null).toBe(!q.handsOver)
    expect(() => opt({ dive: { at: 0 } })).toThrow()
    expect(() => opt({ dive: { dissolveFrames: 0 } })).toThrow()
    expect(() => opt({ rise: { placeFrames: -1 } })).toThrow()
    expect(() => opt({ rise: { dissolveFrames: 1.5 } })).toThrow()
    opt({ dive: { at: 0.02, placeFrames: 30 } })
    expect(() => handoverOf('mars', 'dive')).toThrow()
    off()
    expect(handoverOf('mars', 'dive')).toBeNull()
  })
  it('has no cover: no window, no amount, nothing hidden, no added softness', () => {
    const plan = opt({})
    const film = withMars(plan)
    for (const s of moves) {
      expect(coverWindow(s)).toBeNull()
      expect(coverFrames(s)).not.toBeNull()
      for (let f = s.firstFrame; f < s.endFrame; f++) {
        expect(plan.coverAmount(s, (f + 0.25) / fps)).toBe(0)
        for (const t of sampleTimes(f, 4)) {
          const shot = film.shotAt(f, t)
          expect(shot.cover.amount).toBe(0)
          expect(shot.cover.hidden).toBeUndefined()
          expect(shot.cover.hides).toBeUndefined()
          expect(seenShare(shot)).toBe(1)
        }
        for (const tier of ['draft', 'review', 'final']) expect(framePlan(film, f, tier).soft).toBe(0)
      }
    }
    for (const q of others) for (const kind of ['dive', 'rise'] as const) if (q.seg[kind]) expect(coverWindow(q.seg[kind]!) === null).toBe(q.handsOver)
    off()
    expect(coverWindow(dive)).not.toBeNull()
  })
  it('swaps sides in the dissolve only, with both sides in every part of the shutter', () => {
    opt({})
    const d = handoverOf('mars', 'dive')!
    const r = handoverOf('mars', 'rise')!
    for (let f = dive.firstFrame; f < dive.endFrame; f++) {
      if (f >= d.firstFrame && f <= d.lastFrame) continue
      for (const n of [1, 16, 64]) expect(closeShare(dive, f, n)).toBe(f < d.firstFrame ? 0 : 1)
      expect(sideAt(dive, f / fps)).toBe(f < d.firstFrame ? 'orbit' : 'terrain')
      expect(sideAt(dive, (f + config.shutterFraction) / fps)).toBe(f < d.firstFrame ? 'orbit' : 'terrain')
    }
    for (let f = rise.firstFrame; f < rise.endFrame; f++) {
      if (f >= r.firstFrame && f <= r.lastFrame) continue
      for (const n of [1, 16, 64]) expect(closeShare(rise, f, n)).toBe(f < r.firstFrame ? 1 : 0)
    }
    for (const [s, h] of [[dive, d], [rise, r]] as const) {
      const f = h.firstFrame
      expect(closeShare(s, f, 16)).toBe(0.5)
      expect(closeShare(s, f, 64)).toBe(0.5)
      expect(closeShare(s, f, 1)).toBe(1)
      const times = sampleTimes(f, 16)
      for (let cell = 0; cell < 8; cell++) {
        const pair = times.slice(cell * 2, cell * 2 + 2).map((t) => sideAt(s, t))
        expect(pair.sort()).toEqual(['orbit', 'terrain'])
      }
      for (const t of times) expect(sideAt(s, t)).toBe(sideAt(s, t))
    }
  })
  it('runs the weight up through a longer dissolve in a dive and down in a rise', () => {
    opt({ dive: { dissolveFrames: 3 }, rise: { dissolveFrames: 3 } })
    const d = handoverOf('mars', 'dive')!
    const r = handoverOf('mars', 'rise')!
    const want = [0.15625, 0.5, 0.84375]
    for (let k = 0; k < 3; k++) {
      expect(dissolveWeight(d, 'dive', d.firstFrame + k)).toBeCloseTo(want[k]!, 12)
      expect(dissolveWeight(r, 'rise', r.firstFrame + k)).toBeCloseTo(1 - want[k]!, 12)
      expect(Math.abs(closeShare(dive, d.firstFrame + k, 64) - want[k]!)).toBeLessThanOrEqual(2 / 64)
      expect(Math.abs(closeShare(rise, r.firstFrame + k, 64) - (1 - want[k]!))).toBeLessThanOrEqual(2 / 64)
      for (let cell = 0; cell < 8; cell++) {
        const part = sampleTimes(d.firstFrame + k, 64).slice(cell * 8, cell * 8 + 8).filter((t) => sideAt(dive, t) === 'terrain').length
        expect(Math.abs(part / 8 - want[k]!)).toBeLessThanOrEqual(1 / 8 + 1e-9)
      }
    }
    expect(dissolveWeight(d, 'dive', d.firstFrame - 1)).toBe(0)
    expect(dissolveWeight(d, 'dive', d.lastFrame + 1)).toBe(1)
    expect(dissolveWeight(r, 'rise', r.firstFrame - 1)).toBe(1)
    expect(dissolveWeight(r, 'rise', r.lastFrame + 1)).toBe(0)
    off()
  })
  it('spreads the threshold over each eighth of the shutter and is steady at the cell edges', () => {
    for (let cell = 0; cell < 8; cell++) {
      const got = Array.from({ length: 64 }, (_, i) => shutterThreshold((cell + (i + 0.5) / 64) / 8)).sort((a, b) => a - b)
      got.forEach((v, i) => expect(Math.abs(v - (i + 0.5) / 64)).toBeLessThan(1 / 64))
    }
    for (const count of [1, 2, 4, 8]) {
      for (let i = 0; i < count; i++) {
        const s = (i + 0.5) / count
        const noisy = [s - 1e-12, s, s + 1e-12].map(shutterThreshold)
        expect(Math.abs(noisy[0]! - noisy[1]!)).toBeLessThan(1e-9)
        expect(Math.abs(noisy[2]! - noisy[1]!)).toBeLessThan(1e-9)
      }
    }
    expect(shutterThreshold(0.5)).toBeCloseTo(0.472, 5)
  })
  it('raises the place weight to 1 at the dissolve of a dive and lets it fall after the dissolve of a rise', () => {
    opt({ dive: { placeFrames: 10, dissolveFrames: 2 }, rise: { placeFrames: 10, dissolveFrames: 2 } })
    const d = handoverOf('mars', 'dive')!
    const r = handoverOf('mars', 'rise')!
    expect(placeWeight(dive, (d.placeFirstFrame - 0.01) / fps)).toBe(0)
    expect(placeWeight(dive, d.placeFirstFrame / fps)).toBe(0)
    expect(placeWeight(dive, d.firstFrame / fps)).toBe(1)
    expect(placeWeight(dive, (d.lastFrame + 0.5) / fps)).toBe(1)
    expect(placeWeight(dive, (d.lastFrame + 1) / fps)).toBe(0)
    expect(placeWeight(rise, (r.firstFrame - 0.01) / fps)).toBe(0)
    expect(placeWeight(rise, r.firstFrame / fps)).toBe(1)
    expect(placeWeight(rise, (r.lastFrame + 1) / fps)).toBe(1)
    expect(placeWeight(rise, (r.placeLastFrame + 1) / fps)).toBe(0)
    let last = 0
    for (let f = d.placeFirstFrame; f <= d.firstFrame; f += 0.25) {
      const w = placeWeight(dive, f / fps)
      expect(w).toBeGreaterThanOrEqual(last)
      last = w
      expect(placeWeight(rise, (r.placeLastFrame + 1 - (f - d.placeFirstFrame)) / fps)).toBeCloseTo(w, 9)
    }
    expect(last).toBe(1)
    expect(placeWeight(seg('mars', 'hold'), seg('mars', 'hold').start + 1)).toBe(0)
    for (const q of others) if (q.seg.dive && !q.handsOver) for (let f = q.seg.dive.firstFrame; f < q.seg.dive.endFrame; f++) expect(placeWeight(q.seg.dive, (f + 0.25) / fps)).toBe(0)
    off()
  })
  it('gives a valid pose on both sides across the windows and builds dive and rise from them', () => {
    const plan = opt({ dive: { dissolveFrames: 3 }, rise: { dissolveFrames: 3 } })
    const d = handoverOf('mars', 'dive')!
    const r = handoverOf('mars', 'rise')!
    for (const view of ['orbit', 'terrain'] as const) {
      for (let f = d.placeFirstFrame; f <= d.lastFrame; f++) for (const t of sampleTimes(f, 4)) expect(finite(plan.divePose(t, view))).toBe(true)
      for (let f = r.firstFrame; f <= r.placeLastFrame; f++) for (const t of sampleTimes(f, 4)) expect(finite(plan.risePose(t, view))).toBe(true)
    }
    for (let f = dive.firstFrame; f < dive.endFrame; f++) {
      for (const t of sampleTimes(f, 4)) {
        const shot = plan.dive(t)
        expect(shot.view).toBe(sideAt(dive, t))
        expect(JSON.stringify(shot.pose)).toBe(JSON.stringify(plan.divePose(t, shot.view)))
      }
    }
    for (let f = rise.firstFrame; f < rise.endFrame; f++) {
      for (const t of sampleTimes(f, 4)) {
        const shot = plan.rise(t)
        expect(shot.view).toBe(sideAt(rise, t))
        expect(JSON.stringify(shot.pose)).toBe(JSON.stringify(plan.risePose(t, shot.view)))
      }
    }
    off()
  })
  it('measures motion per side in a frame whose shutter spans both, and takes a side by argument', () => {
    const film = withMars(opt({ dive: { dissolveFrames: 2 }, rise: { dissolveFrames: 2 } }))
    for (const s of moves) {
      const h = handoverOf('mars', s.kind as 'dive' | 'rise')!
      for (let f = s.firstFrame; f < s.endFrame; f++) {
        const p = framePlan(film, f, 'review')
        const inside = f >= h.firstFrame && f <= h.lastFrame
        expect(p.split).toBe(inside)
        if (!inside) continue
        const per = (['orbit', 'terrain'] as const).map((side) => rawMotion(film.shotAt(f, f / fps, side), film.shotAt(f, (f + shutterMid()) / fps, side), film.shotAt(f, (f + config.shutterFraction) / fps, side)))
        expect(p.raw).toBe(Math.max(...per))
        expect(p.seen).toBe(p.raw)
        for (const side of ['orbit', 'terrain'] as const) {
          for (const t of sampleTimes(f, 4)) {
            const shot = film.shotAt(f, t, side)
            expect(shot.sets[0]!.view).toBe(side)
            expect(shot.cover.amount).toBe(0)
          }
        }
      }
    }
    off()
  })
  it('keeps its hold and its terrain view as they were', () => {
    const before = withMars(off())
    const want: Record<string, string> = {}
    const frames: number[] = []
    for (const kind of ['hold', 'terrain']) for (let f = seg('mars', kind).firstFrame; f < seg('mars', kind).endFrame; f += 3) frames.push(f)
    for (const f of frames) for (const o of [0, shutterMid(), config.shutterFraction]) want[f + ':' + o] = flat(before.shotAt(f, (f + o) / fps))
    const after = withMars(opt({}))
    for (const f of frames) for (const o of [0, shutterMid(), config.shutterFraction]) expect(flat(after.shotAt(f, (f + o) / fps))).toBe(want[f + ':' + o])
    off()
  })
})

describe('the forced side', () => {
  it('overrides the side of a dive and a rise until it is cleared', () => {
    for (const plan of [off(), opt({})]) {
      for (const view of ['orbit', 'terrain'] as const) {
        forceSide(view)
        for (const s of moves) for (let f = s.firstFrame; f < s.endFrame; f += 4) expect(sideAt(s, (f + 0.25) / fps)).toBe(view)
        expect(plan.dive(dive.start + 0.1).view).toBe(view)
        expect(plan.rise(rise.end - 0.1).view).toBe(view)
        expect(sideAt(seg('mars', 'hold'), seg('mars', 'hold').start + 1)).toBe('orbit')
        expect(sideAt(seg('mars', 'terrain'), seg('mars', 'terrain').start + 1)).toBe('terrain')
      }
      forceSide(null)
      expect(sideAt(dive, dive.start + 0.1)).toBe('orbit')
      expect(sideAt(rise, rise.end - 0.1)).toBe('orbit')
    }
    off()
  })
  it('is called from nowhere on the film path', () => {
    const root = join(__dirname, '../src')
    const allowed = ['director/handover.ts', 'diagnostics/probe.ts']
    const files: string[] = []
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name)
        if (statSync(full).isDirectory()) walk(full)
        else if (name.endsWith('.ts')) files.push(full)
      }
    }
    walk(root)
    expect(files.length).toBeGreaterThan(50)
    const users = files.filter((f) => /\bforceSide\b/.test(readFileSync(f, 'utf8'))).map((f) => f.slice(root.length + 1).replace(/\\/g, '/'))
    for (const u of users) expect(allowed).toContain(u)
  })
})

describe('the tools around a handover', () => {
  it('centres the cover sheet of a stop that opted in on T and leaves the others as they are', () => {
    off()
    const limit = config.raw.critics.contactSheetFrames
    const earth = seg(other.id, 'dive')
    const earthSheet = sheetFrames(config, earth, true)
    const marsBefore = sheetFrames(config, dive, true)
    expect(marsBefore.length).toBe(limit)
    opt({})
    for (const s of moves) {
      const h = handoverOf('mars', s.kind as 'dive' | 'rise')!
      const w = judgedWindow(s)!
      expect(w.centerFrame).toBe(handoverFrame(h))
      expect(w).toEqual(coverFrames(s))
      const frames = sheetFrames(config, s, true).map((x) => x.frame)
      expect(frames.length).toBe(limit)
      frames.forEach((f, i) => expect(f).toBe(frames[0]! + i))
      expect(frames[0]).toBe(h.firstFrame - Math.floor((limit - 1) / 2))
      expect(frames).toContain(h.firstFrame)
    }
    expect(sheetFrames(config, dive, true)).toEqual(marsBefore)
    expect(sheetFrames(config, earth, true)).toEqual(earthSheet)
    opt({ dive: { at: 0.7 } })
    const moved = handoverOf('mars', 'dive')!
    expect(sheetFrames(config, dive, true).map((x) => x.frame)).toContain(moved.firstFrame)
    expect(sheetFrames(config, dive, true)[0]!.frame).toBe(moved.firstFrame - Math.floor((limit - 1) / 2))
    expect(() => sheetFrames(config, seg('mars', 'hold'), true)).toThrow()
    off()
  })
  it('counts every frame of the dives and rises of a stop that opted in for the detail gate', () => {
    off()
    const kinds = ['hold', 'dive', 'terrain', 'rise']
    const of = (stop: string): Segment[] => config.segments.filter((s) => s.stop === stop && kinds.includes(s.kind))
    const total = (stop: string): number => of(stop).reduce((n, s) => n + s.frames, 0)
    const covered = (stop: string): number => of(stop).reduce((n, s) => n + (coverFrames(s) ? coverFrames(s)!.lastFrame - coverFrames(s)!.firstFrame + 1 : 0), 0)
    expect(detailFrames(of('mars'), false).length).toBe(total('mars') - covered('mars'))
    expect(detailFrames(of('mars'), true).length).toBe(total('mars'))
    const earth = detailFrames(of(other.id), false)
    opt({})
    expect(detailFrames(of('mars'), false).length).toBe(total('mars'))
    expect(detailFrames(of('mars'), false)).toEqual(detailFrames(of('mars'), true))
    expect(detailFrames(of(other.id), false)).toEqual(earth)
    expect(earth.length).toBe(other.handsOver ? total(other.id) : total(other.id) - covered(other.id))
    off()
  })
  it('lists T in the cues and the shots of a stop that opted in and the cover for the others', () => {
    off()
    const marsSegs = config.segments.filter((s) => s.stop === 'mars')
    const earthSegs = config.segments.filter((s) => s.stop === other.id)
    const before = cuesOf(marsSegs)
    const earth = cuesOf(earthSegs)
    expect(before.filter((c) => c.what === 'center of the cover').length).toBe(2)
    expect(before.filter((c) => c.what === 'the handover').length).toBe(0)
    expect(swapOf(dive)).toEqual({ move: 'Cover from frame ' + coverFrames(dive)!.firstFrame + ' to ' + coverFrames(dive)!.lastFrame, seen: 'cover' })
    opt({})
    const after = cuesOf(marsSegs)
    expect(after.length).toBe(before.length)
    expect(after.filter((c) => c.what === 'center of the cover').length).toBe(0)
    const cues = after.filter((c) => c.what === 'the handover')
    expect(cues.map((c) => c.segment)).toEqual(['mars.dive', 'mars.rise'])
    for (const c of cues) {
      const h = handoverOf('mars', c.segment.endsWith('dive') ? 'dive' : 'rise')!
      expect(c.frame).toBe(h.firstFrame)
      expect(c.seconds).toBe(h.time)
      expect(c.sound).toContain('in frame ' + h.firstFrame)
    }
    after.forEach((c, i) => {
      expect(c.segment).toBe(before[i]!.segment)
      if (c.what !== 'the handover') expect(c.frame).toBe(before[i]!.frame)
    })
    expect(swapOf(dive)).toEqual({ move: 'Handover in frame ' + handoverOf('mars', 'dive')!.firstFrame + ', no cover', seen: 'handover' })
    expect(swapOf(seg(other.id, 'rise')).seen).toBe(other.handsOver ? 'handover' : 'cover')
    expect(cuesOf(earthSegs)).toEqual(earth)
    opt({ rise: { dissolveFrames: 2 } })
    const r = handoverOf('mars', 'rise')!
    expect(swapOf(rise).move).toBe('Handover from frame ' + r.firstFrame + ' to ' + r.lastFrame + ', no cover')
    off()
  })
})
