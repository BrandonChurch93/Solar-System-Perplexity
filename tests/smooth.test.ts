import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { shutterMid } from '../src/core/sampler'
import { FilmDirector } from '../src/director/film'
import { sideAt } from '../src/director/handover'
import { plans } from '../src/director/plans'
import { curves, sampleWindow } from '../tools/smooth/camera'
import { judgeCurve, position, table } from '../tools/smooth/path'

const limits = { maxStep: 0.08, maxRebound: 0.03, seamFrames: 2 }
const bell = (n: number, edge = 0): number[] => Array.from({ length: n }, (_, i) => edge + 1 - Math.cos((2 * Math.PI * (i + 0.5)) / n))
const rules = (r: { faults: { rule: string }[] }): string[] => r.faults.map((f) => f.rule)

describe('the curve of a move, judged', () => {
  it('passes one rise and one fall with small steps and gives the values over the mean of the move', () => {
    const raw = [0, 0, 0, ...bell(100), 0, 0, 0]
    const r = judgeCurve('rate', 'u', raw, 100, 1, { first: 103, end: 203 }, limits)
    expect(r.faults).toEqual([])
    expect(r.mean).toBeCloseTo(1, 6)
    expect(r.peak!.value).toBeCloseTo(2, 2)
    expect(r.worstStep!.value).toBeLessThan(0.08)
    const own = r.over.slice(3, 103) as number[]
    expect(own.reduce((a, b) => a + b, 0) / own.length).toBeCloseTo(1, 9)
  })

  it('names a dent after the largest value and a dent before it', () => {
    const after = bell(100)
    for (let i = 70; i < 74; i++) after[i] = after[i]! - 0.3
    const a = judgeCurve('rate', 'u', after, 0, 1, { first: 0, end: 100 }, { ...limits, maxStep: 1 })
    expect(rules(a)).toEqual(['climbAfterPeak'])
    expect(a.climbAfterPeak.value).toBeGreaterThan(0.03)
    expect(a.climbAfterPeak.frame).toBe(74)
    const before = bell(100)
    for (let i = 20; i < 24; i++) before[i] = before[i]! - 0.3
    const b = judgeCurve('rate', 'u', before, 0, 1, { first: 0, end: 100 }, { ...limits, maxStep: 1 })
    expect(rules(b)).toEqual(['fallBeforePeak'])
    expect(b.fallBeforePeak.frame).toBeGreaterThanOrEqual(20)
    expect(b.fallBeforePeak.frame).toBeLessThan(24)
    const slight = bell(100)
    slight[70] = slight[70]! - 0.02
    expect(judgeCurve('rate', 'u', slight, 0, 1, { first: 0, end: 100 }, { ...limits, maxStep: 1 }).faults).toEqual([])
  })

  it('holds the step limit across both seams and only shows a step further into a neighbour', () => {
    const own = bell(100)
    const seam = judgeCurve('rate', 'u', [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, ...own, 0, 0, 0, 0, 0, 0], 0, 1, { first: 6, end: 106 }, limits)
    expect(rules(seam)).toEqual(['step'])
    expect(seam.faults[0]!.frame).toBe(6)
    expect(seam.seams[0]!.step).toBeGreaterThan(0.08)
    expect(seam.seams[1]!.step).toBeLessThan(0.08)
    const beyond = judgeCurve('rate', 'u', [0.5, 0, 0, 0, 0, 0, ...own, 0, 0, 0, 0, 0, 0.5], 0, 1, { first: 6, end: 106 }, limits)
    expect(beyond.faults).toEqual([])
    expect(beyond.worstBeyond!.value).toBeGreaterThan(0.4)
  })

  it('joins the steps that follow one another into one line', () => {
    const raw = bell(100)
    for (let i = 20; i < 100; i++) raw[i] = raw[i]! + Math.min(i - 19, 3) * 0.2
    const r = judgeCurve('rate', 'u', raw, 0, 1, { first: 0, end: 100 }, { ...limits, maxRebound: 9 })
    expect(r.faults.length).toBe(1)
    expect(r.faults[0]!.count).toBe(3)
    expect(r.faults[0]!.first).toBe(20)
    expect(r.faults[0]!.last).toBe(22)
  })

  it('finds a shake between capture frames that whole film frames do not show', () => {
    const raw = bell(200).map((v, i) => v + (i % 2 ? 0.06 : -0.06))
    const r = judgeCurve('turn', 'u', raw, 0, 2, { first: 0, end: 200 }, { ...limits, maxRebound: 9 })
    expect(new Set(rules(r))).toEqual(new Set(['halfStep']))
    expect(r.worstStep!.value).toBeLessThan(0.08)
    expect(r.worstHalfStep!.value).toBeGreaterThan(0.08)
    expect(position(7, 2)).toBe('3 + 1/2')
    expect(position(8, 2)).toBe('4')
  })

  it('judges a curve whose mean is under its floor against the floor, and skips what could not be measured', () => {
    const raw = bell(100).map((v) => v * 0.001)
    const loose = judgeCurve('turn', 'deg', raw, 0, 1, { first: 0, end: 100 }, limits, 0.05)
    expect(loose.floored).toBe(true)
    expect(loose.faults).toEqual([])
    expect(loose.peak!.value).toBeCloseTo(0.04, 3)
    const holes: (number | null)[] = bell(100)
    holes[30] = null
    holes[31] = null
    const h = judgeCurve('speed', 'px', holes, 0, 1, { first: 0, end: 100 }, limits)
    expect(h.missing).toBe(2)
    expect(h.step[31]).toBeNull()
    expect(h.faults).toEqual([])
    const still = judgeCurve('rate', 'u', new Array<number>(20).fill(0), 0, 1, { first: 0, end: 20 }, limits)
    expect(rules(still)).toEqual(['mean'])
  })

  it('lays one row for every film frame, with the largest step of its capture frames', () => {
    const whole = judgeCurve('rate', 'u', bell(10), 50, 1, { first: 50, end: 60 }, limits)
    const fineRaw = bell(20)
    fineRaw[9] = fineRaw[9]! + 0.5
    const fine = judgeCurve('rate', 'u', fineRaw, 100, 2, { first: 100, end: 120 }, limits)
    const rows = table([whole], [fine], 50, 10, 100, 2)
    expect(rows.length).toBe(10)
    expect(rows[0]!.frame).toBe(50)
    expect(rows[4]!.values.rate!.over).toBeCloseTo(whole.over[4]!, 12)
    expect(rows[4]!.values.rate!.fine).toBeCloseTo(Math.max(fine.step[8]!, fine.step[9]!), 12)
    expect(rows[4]!.values.rate!.fine).toBeGreaterThan(0.2)
  })
})

describe('the camera of a move, sampled', () => {
  const film = new FilmDirector(plans)
  const plan = plans.find((p) => p.id === 'mars')!
  const S = config.raw.smooth
  const master = config.formats[config.formatKeys.master]!

  it('reaches into both neighbours and gives the plan\'s own camera inside the move', () => {
    const w = sampleWindow(config, film, plan, 'dive', 1, S.reachFrames)!
    expect(w.firstFrame).toBe(w.seg.firstFrame - S.reachFrames)
    expect(w.frames).toBe(w.seg.endFrame - w.seg.firstFrame + 2 * S.reachFrames)
    expect(w.samples[0]!.k).toBe(w.firstFrame - 1)
    expect(w.samples.at(-1)!.segment).toBe('mars.terrain')
    expect(w.samples[1]!.segment).toBe('mars.hold')
    for (const f of [w.seg.firstFrame + 3, w.seg.firstFrame + 40, w.seg.endFrame - 2]) {
      const s = w.samples[f - w.k0]!
      const time = (f + shutterMid()) / config.fps
      expect(s.time).toBeCloseTo(time, 12)
      const side = sideAt(w.seg, time)
      const own = side === 'orbit' ? plan.divePose(time, 'orbit') : plan.twin(plan.divePose(time, 'terrain'), time)
      expect(s.side).toBe(side)
      expect(s.pose.position.distanceTo(own.position)).toBeLessThan(1e-6 * (1 + own.position.length()))
    }
  })

  it('counts the curves per film frame at every rate', () => {
    for (const kind of ['dive', 'rise'] as const) {
      const one = sampleWindow(config, film, plan, kind, 1, S.reachFrames)!
      const two = sampleWindow(config, film, plan, kind, 2, S.reachFrames)!
      expect(two.samples.length).toBe(2 * one.frames + 1)
      const sum = (w: typeof one): number => {
        const c = curves(w, plan, master.width, master.height, S.path.ringPx)
        let total = 0
        for (let k = w.own.first; k < w.own.end; k++) total += c.fall[k - w.k0]!
        return total / w.rate
      }
      const ends = (w: typeof one): number => Math.abs(Math.log(w.samples[w.own.first - 1 - w.k0]!.height / w.samples[w.own.end - 1 - w.k0]!.height))
      expect(sum(one)).toBeCloseTo(ends(one), 9)
      expect(sum(two)).toBeCloseTo(ends(two), 9)
      expect(sum(one)).toBeGreaterThan(1)
      const c = curves(one, plan, master.width, master.height, S.path.ringPx)
      expect(c.turn.filter((v) => v !== null).every((v) => v! >= 0)).toBe(true)
      expect(c.speed.filter((v) => v !== null).length).toBeGreaterThan(one.seg.endFrame - one.seg.firstFrame - 5)
    }
  })
})
