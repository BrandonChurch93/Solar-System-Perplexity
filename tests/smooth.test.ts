import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { captureRate, setCapture, spanMid } from '../src/core/clock'
import type { Pose } from '../src/core/types'
import { shutterMid } from '../src/core/sampler'
import { FilmDirector } from '../src/director/film'
import { sideAt } from '../src/director/handover'
import { plans } from '../src/director/plans'
import { SEAM_OWN, SEAM_REACH, curves, eyeCurves, landingCurves, planeHit, ringPlane, sampleLanding, sampleLeave, sampleSeam, sampleWindow, seen, type SeamWindow } from '../tools/smooth/camera'
import { missing, partOwn, popSpan, sliceName, sliceNeed } from '../tools/smooth/slice'
import { changeNote, judgeCurve, judgeLanding, judgeLeave, judgeSeam, longestGap, parityFrames, peakRows, position, shown, table } from '../tools/smooth/path'

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

describe('a curve that is a mean over points', () => {
  const far = [1, 1, 1, 1, 1, 1, 4, 4]
  const rows = (n: number, lost: (i: number) => number[]): (number | null)[][] => Array.from({ length: n }, (_, i) => far.map((v, j) => (lost(i).includes(j) ? null : v * (1 + 0.5 * Math.sin((Math.PI * (i + 0.5)) / n)))))
  const plain = (values: (number | null)[][]): (number | null)[] => values.map((row) => {
    const got = row.filter((v): v is number => v !== null)
    return got.length >= 4 ? got.reduce((a, b) => a + b, 0) / got.length : null
  })

  it('does not step when the count of its points changes', () => {
    const values = rows(100, (i) => (i >= 60 ? [6, 7] : i >= 50 ? [7] : []))
    const raw = plain(values)
    const loose = judgeCurve('speed', 'px', raw, 0, 1, { first: 0, end: 100 }, limits)
    expect(rules(loose)).toContain('step')
    expect([50, 60]).toContain(loose.worstStep!.frame)
    const r = judgeCurve('speed', 'px', raw, 0, 1, { first: 0, end: 100 }, limits, 0, { values, min: 4 })
    expect(r.faults).toEqual([])
    expect(r.worstStep!.value).toBeLessThan(0.03)
    expect(r.points).toMatchObject({ of: 8, min: 4, fewest: 6, notMeasured: 0 })
    expect(r.points!.counts[49]).toBe(8)
    expect(r.points!.counts[60]).toBe(6)
    const tight = judgeCurve('speed', 'px', raw, 0, 1, { first: 0, end: 100 }, { ...limits, maxStep: 0 }, 0, { values, min: 4 }).faults.find((f) => f.rule === 'step' && f.first! <= 55 && f.last! >= 55)!
    expect(tight.text).toContain('(over ' + tight.points + ' points)')
    expect(tight.points).toBeLessThan(8)
  })

  it('compares a rebound over the points that have ground in all of its frames', () => {
    const values = rows(100, (i) => (i >= 70 && i < 80 ? [0, 1, 2] : []))
    const raw = plain(values)
    const loose = judgeCurve('speed', 'px', raw, 0, 1, { first: 0, end: 100 }, { ...limits, maxStep: 9 })
    expect(loose.faults.length).toBeGreaterThan(0)
    const r = judgeCurve('speed', 'px', raw, 0, 1, { first: 0, end: 100 }, { ...limits, maxStep: 9 }, 0, { values, min: 4 })
    expect(r.faults).toEqual([])
    expect(r.peak!.frame).toBe(49)
    expect(r.peak!.points).toBe(5)
    const dent = rows(100, () => [])
    for (let i = 70; i < 74; i++) dent[i] = dent[i]!.map((v) => v! * 0.7)
    const real = judgeCurve('speed', 'px', plain(dent), 0, 1, { first: 0, end: 100 }, { ...limits, maxStep: 9 }, 0, { values: dent, min: 4 })
    expect(rules(real)).toEqual(['climbAfterPeak'])
    expect(real.climbAfterPeak.points).toBe(8)
    expect(real.climbAfterPeak.frame).toBe(74)
  })

  it('does not read the fall of a wider set after its own largest value as a fall before the largest value', () => {
    const six = (i: number): number => 1 + 0.6 * Math.sin((Math.PI * (i + 0.5)) / 100) ** 2
    const two = (i: number): number => six(i) + 2 * Math.exp(-(((i - 20) / 12) ** 2))
    const values = Array.from({ length: 100 }, (_, i) => Array.from({ length: 8 }, (_, j) => (j < 6 ? six(i) : i < 40 ? two(i) : null)))
    const mean8 = (i: number): number => (6 * six(i) + 2 * two(i)) / 8
    expect(mean8(22)).toBeGreaterThan(mean8(39) + 0.1)
    const r = judgeCurve('speed', 'px', plain(values), 0, 1, { first: 0, end: 100 }, { ...limits, maxStep: 9 }, 0, { values, min: 4 })
    expect(r.peak!.frame).toBeGreaterThan(45)
    expect(r.peak!.points).toBe(6)
    expect(r.faults).toEqual([])
    expect(r.fallBeforePeak.value).toBeLessThan(0.001)
    const dent = values.map((row, i) => row.map((v) => (v !== null && i >= 60 && i < 64 ? v * 0.9 : v)))
    const real = judgeCurve('speed', 'px', plain(dent), 0, 1, { first: 0, end: 100 }, { ...limits, maxStep: 9 }, 0, { values: dent, min: 4 })
    expect(rules(real)).toEqual(['climbAfterPeak'])
    expect(real.climbAfterPeak.points).toBe(6)
  })

  it('shows and does not judge a row with fewer than five points, and counts those rows', () => {
    const values = rows(100, (i) => (i >= 40 && i < 43 ? [0, 1, 2, 3] : []))
    const r = judgeCurve('speed', 'px', plain(values), 0, 1, { first: 0, end: 100 }, limits, 0, { values, min: 5 })
    expect(r.faults).toEqual([])
    expect(r.points).toMatchObject({ min: 5, fewest: 4, notMeasured: 4, first: 40, last: 43 })
    expect(r.step[41]).toBeNull()
    const five = rows(100, (i) => (i >= 40 && i < 43 ? [0, 1, 2] : []))
    const kept = judgeCurve('speed', 'px', plain(five), 0, 1, { first: 0, end: 100 }, limits, 0, { values: five, min: 5 })
    expect(kept.points).toMatchObject({ fewest: 5, notMeasured: 0, first: null, last: null })
    const none = rows(100, () => [0, 1, 2, 3])
    expect(rules(judgeCurve('speed', 'px', none.map(() => null), 0, 1, { first: 0, end: 100 }, limits, 0, { values: none, min: 5 }))).toEqual(['mean'])
  })
})

describe('the ground of a place on the rings', () => {
  const g = { normal: new THREE.Vector3(0, 1, 0), inner: 1.2, outer: 2.3, centre: new THREE.Vector3(1.8, 0, 0) }
  const look = (from: THREE.Vector3, to: THREE.Vector3): Pose => ({ position: from, quaternion: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(from, to, new THREE.Vector3(0, 1, 0))), vfov: 30 })

  it('is the plane of the rings between their radii', () => {
    const p = look(new THREE.Vector3(1.8, 0.5, 1.5), g.centre)
    const hit = planeHit(p, 960, 540, 1920, 1080, g)!
    expect(hit.distanceTo(g.centre)).toBeLessThan(1e-9)
    const beyond = look(new THREE.Vector3(1.8, 0.5, 1.5), new THREE.Vector3(3, 0, 0))
    expect(planeHit(beyond, 960, 540, 1920, 1080, g)).toBeNull()
    const gap = look(new THREE.Vector3(1.8, 0.5, 1.5), new THREE.Vector3(1.1, 0, 0))
    expect(planeHit(gap, 960, 540, 1920, 1080, g)).toBeNull()
    expect(planeHit(look(new THREE.Vector3(1.8, 0.5, 1.5), new THREE.Vector3(1.8, 3, 1.5)), 960, 540, 1920, 1080, g)).toBeNull()
  })

  it('is not seen behind the globe', () => {
    const p = look(new THREE.Vector3(3, 0.4, 0), new THREE.Vector3(-1.8, 0, 0))
    expect(planeHit(p, 960, 540, 1920, 1080, g)).toBeNull()
    expect(seen(p, new THREE.Vector3(-1.8, 0, 0))).toBe(false)
    expect(seen(p, new THREE.Vector3(1.8, 0, 0))).toBe(true)
    expect(seen(p, new THREE.Vector3(0, 0, 1.8))).toBe(true)
  })

  it('carries the speed of Saturn, whose place lies on its rings, and of no other stop', () => {
    const film = new FilmDirector(plans)
    const S = config.raw.smooth
    const master = config.formats[config.formatKeys.master]!
    for (const q of plans) expect(ringPlane(q) !== null).toBe(q.id === 'saturn')
    const saturn = plans.find((q) => q.id === 'saturn')!
    const ground = ringPlane(saturn)!
    expect(Math.abs(ground.centre.dot(ground.normal))).toBeLessThan(1e-6)
    expect(ground.centre.length()).toBeGreaterThan(ground.inner)
    expect(ground.centre.length()).toBeLessThan(ground.outer)
    for (const kind of ['dive', 'rise'] as const) {
      const w = sampleWindow(config, film, saturn, kind, 1, S.reachFrames)!
      const c = curves(w, saturn, master.width, master.height, S.path.ringPx, 'picture', 8, ground)
      const last = kind === 'dive' ? w.own.end - 1 - w.k0 : w.own.first - w.k0
      expect(c.ring[last]!.filter((v) => v !== null).length).toBeGreaterThanOrEqual(5)
      expect(c.speed[last]).toBeGreaterThan(0)
    }
    setCapture(1)
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
      const own = side === 'orbit' ? plan.eye('dive', time, 'orbit') : plan.twin(plan.eye('dive', time, 'terrain'), time)
      expect(s.side).toBe(side)
      expect(s.pose.position.distanceTo(own.position)).toBeLessThan(1e-6 * (1 + own.position.length()))
    }
  })

  it('asks the camera at the half frame at rate 2, at the middle of the shorter shutter', () => {
    const w = sampleWindow(config, film, plan, 'dive', 2, S.reachFrames)!
    expect(captureRate()).toBe(2)
    expect(spanMid()).toBeCloseTo(shutterMid() / 2, 12)
    for (const k of [2 * w.seg.firstFrame + 7, 2 * w.seg.firstFrame + 81, 2 * w.seg.endFrame - 3]) {
      const s = w.samples[k - w.k0]!
      const time = (k / 2 + shutterMid() / 2) / config.fps
      expect(s.k).toBe(k)
      expect(s.frame).toBe((k - 1) / 2)
      expect(s.time).toBeCloseTo(time, 12)
      const side = sideAt(w.seg, time)
      const own = side === 'orbit' ? plan.eye('dive', time, 'orbit') : plan.twin(plan.eye('dive', time, 'terrain'), time)
      expect(s.side).toBe(side)
      expect(s.pose.position.distanceTo(own.position)).toBeLessThan(1e-6 * (1 + own.position.length()))
    }
    setCapture(1)
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

describe('the landing of a travel, judged', () => {
  const hold = 2
  const n = 24
  const own = { first: 13, end: 12 + n }
  const ease = (j: number): number => hold + 6 * (1 - j / n) ** 2
  const curve = (speed: (j: number) => number): number[] => Array.from({ length: 12 + n + 14 }, (_, i) => (i < 12 ? speed(0) : i >= 12 + n ? hold : speed(i - 12)))
  const judge = (raw: number[]): ReturnType<typeof judgeLanding> => judgeLanding('sky', 'px', raw, 0, 1, own, limits)

  it('passes a brake that eases into the speed of the hold', () => {
    const r = judge(curve(ease))
    expect(r.faults).toEqual([])
    expect(r.hold).toBeCloseTo(hold / r.mean, 9)
    expect(r.peakLoss!.frame).toBe(14)
    expect(r.hump.value).toBe(0)
    expect(r.seam!.value).toBeLessThan(0.01)
  })

  it('names a step at the seam into the hold', () => {
    expect(rules(judge(curve((j) => hold + 1 + 5 * (1 - j / n) ** 2)))).toContain('seam')
  })

  it('names a brake that grows into the last frames and then lets go', () => {
    const tail = [7.13, 6.42, 4.89, 2.82, 2.35]
    const raw = curve((j) => (j >= n - 5 ? tail[j - (n - 5)]! : 7.13 + 0.05 * (n - 5 - j)))
    raw[12 + n] = 2.35
    for (let i = 12 + n; i < raw.length; i++) raw[i] = 2.35
    const r = judge(raw)
    expect(rules(r)).toContain('lateBrake')
    expect(rules(r)).toContain('brakeGrows')
    expect(rules(r)).toContain('letGo')
    expect(r.peakLoss!.frame).toBe(12 + n - 2)
    expect(r.letGo!.frame).toBe(12 + n - 1)
  })

  it('names a climb after the speed has started to fall, and not a climb before the first fall', () => {
    const r = judge(curve((j) => ease(j) + (j >= 8 && j < 12 ? 1 : 0)))
    expect(rules(r)).toContain('hump')
    expect(r.hump.frame).toBe(12 + 8)
    const rising = judge(curve((j) => (j < 4 ? ease(4) - 0.3 * (4 - j) : ease(j))))
    expect(rising.faults).toEqual([])
  })

  it('names a dip under the speed of the hold', () => {
    const r = judge(curve((j) => (j >= n - 2 ? hold - 0.5 : ease(j))))
    expect(rules(r)).toContain('dip')
    expect(r.dip!.value).toBeCloseTo(0.5 / r.mean, 9)
  })

  it('finds a shake between capture frames at the seam', () => {
    const fine = Array.from({ length: 2 * (12 + n + 14) }, (_, i) => (i < 24 ? ease(0) : i >= 24 + 2 * n ? hold : ease((i - 24) / 2)))
    const span = { first: 25, end: 24 + 2 * n }
    expect(judgeLanding('sky', 'px', fine, 0, 2, span, limits).faults).toEqual([])
    fine[24 + 2 * n - 1] = fine[24 + 2 * n - 1]! + 0.5
    expect(rules(judgeLanding('sky', 'px', fine, 0, 2, span, limits))).toContain('halfSeam')
  })
})

describe('the landing of a stop, sampled', () => {
  const film = new FilmDirector(plans)
  const S = config.raw.smooth
  const master = config.formats[config.formatKeys.master]!

  it('is the last part of the travel that arrives at the stop, and the first stop has none', () => {
    expect(sampleLanding(config, film, plans[0]!, 1, S.reachFrames)).toBeNull()
    for (const plan of plans.slice(1)) {
      const w = sampleLanding(config, film, plan, 2, S.reachFrames)!
      const hold = config.segments.find((s) => s.stop === plan.id && s.kind === 'hold')!
      expect(w.travel.kind).toBe('travel')
      expect(w.travel.endFrame).toBe(hold.firstFrame)
      expect(w.landingFrame).toBe(w.travel.firstFrame + Math.ceil(0.68 * (w.travel.endFrame - w.travel.firstFrame) - 1e-9))
      if (w.travel.endFrame - w.travel.firstFrame === 75) expect(w.landingFrame).toBe(w.travel.firstFrame + 51)
      expect(w.own).toEqual({ first: w.landingFrame * 2 + 1, end: hold.firstFrame * 2 })
      expect(w.samples[0]!.k).toBe((w.landingFrame - S.reachFrames) * 2 - 1)
      expect(w.samples[w.samples.length - 1]!.k).toBe((hold.firstFrame + S.reachFrames) * 2 - 1)
      const c = landingCurves(w, master.width, master.height)
      expect(c.sky.length).toBe(w.samples.length)
      expect(c.sky[0]).toBeNull()
      for (let k = w.own.first; k < w.own.end; k++) {
        const i = k - w.k0
        expect(c.sky[i]).toBeGreaterThanOrEqual(0)
        expect(c.limb[i]).toBeCloseTo(c.centre[i]! + c.edge[i]!, 9)
      }
    }
    setCapture(1)
  })
})

describe('a number as it is printed', () => {
  it('gets more digits where the usual ones would print it as its limit', () => {
    expect(shown(1.2002331, 2, 1.2)).toBe('1.2002')
    expect(shown(1.196, 2, 1.2)).toBe('1.196')
    expect(shown(1.2, 2, 1.2)).toBe('1.20')
    expect(shown(1.31, 2, 1.2)).toBe('1.31')
    expect(shown(20.004, 1, 20)).toBe('20.004')
    expect(shown(0.0801, 3, 0.08)).toBe('0.0801')
    expect(shown(1.2002331, 2, null)).toBe('1.20')
  })
})

describe('the longest run of rows without a value', () => {
  it('is null where every row has one', () => {
    expect(longestGap([true, true, true])).toBeNull()
    expect(longestGap([])).toBeNull()
  })
  it('is the first of the longest runs', () => {
    expect(longestGap([true, false, true, false, false, true, false, false])).toEqual({ first: 3, last: 4 })
    expect(longestGap([false, false, false])).toEqual({ first: 0, last: 2 })
  })
})

describe('the rows of the panel of changes', () => {
  const row = (k: number, change: number | null, pattern: number | null): { k: number; change: number | null; pattern: number | null } => ({ k, change, pattern })

  it('takes a row with a pattern and no change in place, and writes its label', () => {
    const rows = [row(100, null, 0.31), row(101, null, 0.3), row(140, null, 0.52), row(180, null, null), row(200, 2.4, null)]
    const peaks = peakRows(rows, 16)
    expect(peaks.map((x) => x.k)).toEqual([100, 140, 200])
    expect(peaks.map(changeNote)).toEqual(['change not measured, pattern 0.31', 'change not measured, pattern 0.52', 'change 2.4, pattern not measured'])
  })

  it('picks the two largest patterns, then the largest changes up to four rows, none within the reach of another, in the order of the film', () => {
    const rows = [row(0, 1, 0.1), row(10, 9, 0.2), row(20, 3, 0.9), row(30, 4, 0.8), row(40, 8, 0.7), row(60, 7, null), row(80, 2, 0.05), row(100, 6, 0.01)]
    expect(peakRows(rows, 16).map((x) => x.k)).toEqual([20, 40, 60, 100])
    expect(peakRows(rows, 1).map((x) => x.k)).toEqual([10, 20, 30, 40])
    expect(changeNote(rows[1]!)).toBe('change 9.0, pattern 0.20')
    expect(peakRows([row(5, null, null)], 16)).toEqual([])
  })
})

describe('the frames of the parity part', () => {
  const at = { hold: [0.5], dive: [0.25, 0.5, 0.75], terrain: [0.5], rise: [0.25, 0.5, 0.75], travel: [0.5] }
  it('reads the hold and the travel that leaves the stop in a whole run', () => {
    const rows = parityFrames(config.segments, 'mercury', at, ['dive', 'rise'], true)
    expect(rows.map((r) => r.segment)).toEqual(['mercury.hold', 'mercury.dive', 'mercury.dive', 'mercury.dive', 'mercury.terrain', 'mercury.rise', 'mercury.rise', 'mercury.rise', 'mercury.travel'])
    expect(rows[0]!.frame).toBe(615)
    expect(rows[8]!.frame).toBe(1073)
  })
  it('leaves them out of a run of one move and where the config names no share', () => {
    expect(parityFrames(config.segments, 'mercury', at, ['dive'], false).map((r) => r.kind)).toEqual(['dive', 'dive', 'dive', 'terrain'])
    expect(parityFrames(config.segments, 'mercury', { dive: [0.5], terrain: [0.5], rise: [0.5] }, ['dive', 'rise'], true).map((r) => r.kind)).toEqual(['dive', 'terrain', 'rise'])
  })
  it('reads every travel leg once over the nine stops and no travel after the last', () => {
    const legs = config.stopIds.flatMap((id) => parityFrames(config.segments, id, at, ['dive', 'rise'], true).filter((r) => r.kind === 'travel').map((r) => r.segment))
    expect(legs).toEqual(config.segments.filter((s) => s.kind === 'travel').map((s) => s.id))
    expect(parityFrames(config.segments, 'sun', at, ['dive', 'rise'], true).map((r) => r.kind)).toEqual(['hold', 'terrain', 'rise', 'rise', 'rise', 'travel'])
  })
})

describe('the eye against the near ground at the seam with the surface view', () => {
  type P = { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }
  const still = { twin: (p: P) => p, untwin: (p: P) => p, seg: { terrain: { start: 0 } } } as unknown as (typeof plans)[number]
  const made = (ways: number[]): SeamWindow => {
    let h = 1
    const heights = [h, ...ways.map((v) => (h = h * (1 - v)))]
    const samples = heights.map((height, i) => ({ k: 100 + i, frame: Math.floor((100 + i) / 2), time: (100 + i) / 60, segment: 'x.terrain', side: 'terrain' as const, pose: { position: new THREE.Vector3(0, 1 + height, 0), quaternion: new THREE.Quaternion(), vfov: 40 }, height }))
    return { kind: 'rise', seg: config.segments[0]!, seam: 54, rate: 2, k0: 100, samples, own: { first: 101, end: 104 } }
  }
  it('reads 1 where the eye goes on as the surface view does, a dip where it stops and a negative part where it goes back', () => {
    const c = eyeCurves(made([0.01, 0.01, 0.01, 0.01, 0.01, 0.004, 0, -0.006, -0.02]), still)
    expect(c.speed[0]).toBeNull()
    for (const i of [1, 2, 3, 4, 5]) expect(c.speed[i]!).toBeCloseTo(1, 6)
    expect(c.speed[6]!).toBeCloseTo(0.4, 2)
    expect(c.speed[7]!).toBeCloseTo(0, 6)
    expect(c.speed[8]!).toBeCloseTo(0.6, 2)
    expect(c.along[8]!).toBeCloseTo(-0.6, 2)
    expect(c.along[9]!).toBeLessThan(-1.9)
    const r = judgeSeam(c.speed, c.along, 100, 2, 0.5)
    expect(r.lowest).toEqual({ value: c.speed[7], k: 107 })
    expect(r.inMove).toBeNull()
    expect(judgeSeam(c.speed, c.along, 100, 2, 0.5, { first: 108, end: 109 }).inMove).toEqual({ value: c.speed[8], k: 108 })
    expect(r.back!.k).toBe(109)
    expect(r.step!.k).toBe(109)
    expect(r.fault!.rule).toBe('eye')
    expect(r.fault!.text).toContain('at frame 53 + 1/2, limit 0.5')
    expect(judgeSeam(c.speed, c.along, 100, 2, null).fault).toBeNull()
    expect(judgeSeam(c.speed.slice(0, 6), c.along.slice(0, 6), 100, 2, 0.5).fault).toBeNull()
  })
  it('takes the ground as the twin of the stop holds it: an eye that stands over a turning place does not move', () => {
    const turn = (t: number): THREE.Quaternion => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), t)
    const turning = { twin: (p: P) => p, untwin: (p: P, t: number) => ({ ...p, position: p.position.clone().applyQuaternion(turn(t).invert()) }), seg: { terrain: { start: 0 } } } as unknown as (typeof plans)[number]
    const w = made([0.01, 0.01, 0.01, 0.01, 0.01, 0.01])
    for (const s of w.samples) s.pose.position.applyQuaternion(turn(s.time))
    const c = eyeCurves(w, turning)
    for (const i of [1, 2, 3, 4, 5, 6]) expect(c.speed[i]!).toBeCloseTo(1, 6)
  })
  it('samples every seam of the film: 17 seams, the reach to each side, the surface view next to the seam as its own', () => {
    const film = new FilmDirector(plans)
    let seams = 0
    for (const plan of plans) {
      for (const kind of ['dive', 'rise'] as const) {
        const w = sampleSeam(config, film, plan, kind, 2)
        if (!w) continue
        seams++
        expect(w.seam).toBe(kind === 'dive' ? w.seg.endFrame : w.seg.firstFrame)
        expect(w.samples[0]!.k).toBe((w.seam - SEAM_REACH) * 2 - 1)
        expect(w.samples[w.samples.length - 1]!.k).toBe((w.seam + SEAM_REACH) * 2 - 1)
        const own = w.samples.filter((s) => s.k >= w.own.first - 1 && s.k <= w.own.end)
        expect(own.filter((s) => s.segment !== plan.id + '.terrain').map((s) => s.k)).toEqual(kind === 'rise' ? [w.seam * 2] : [])
        expect(own.length).toBe(SEAM_OWN * 2 + 1)
        const c = eyeCurves(w, plan, ringPlane(plan))
        expect(c.own!).toBeGreaterThan(0)
        const mine = c.speed.filter((_, i) => w.k0 + i >= w.own.first && w.k0 + i <= w.own.end) as number[]
        expect(mine.reduce((n, v) => n + v, 0) / mine.length).toBeCloseTo(1, 9)
      }
    }
    expect(seams).toBe(17)
  })
})

describe('one move in slices', () => {
  const total = 228
  const window = 32
  const reach = 16

  it('places the window of the median as the image measure does: round the frame, moved inward at both ends', () => {
    expect(popSpan(100, total, window)).toEqual([84, 116])
    expect(popSpan(0, total, window)).toEqual([0, 32])
    expect(popSpan(10, total, window)).toEqual([0, 32])
    expect(popSpan(227, total, window)).toEqual([195, 227])
    expect(popSpan(220, total, window)).toEqual([195, 227])
    expect(popSpan(4, 10, window)).toEqual([0, 9])
  })

  it('gives every frame of the window to exactly one part', () => {
    for (const of of [1, 2, 4, 7, 8, 40]) {
      const owners = new Array<number>(total).fill(0)
      for (let part = 1; part <= of; part++) {
        const own = partOwn(part, of, total)
        for (let i = own.first; i < own.end; i++) owners[i]!++
      }
      expect(owners.every((n) => n === 1)).toBe(true)
    }
    expect(partOwn(2, 4, total)).toEqual({ first: 57, end: 114 })
  })

  it('holds for each of its frames both neighbours, the window of the median with the frame after it, and the frame the change is measured against', () => {
    for (const of of [1, 3, 4, 8, 40]) {
      for (let part = 1; part <= of; part++) {
        const own = partOwn(part, of, total)
        const [lo, hi] = sliceNeed(own, total, window, reach)
        const has = (i: number): boolean => i < 0 || i > total - 1 || (i >= lo && i <= hi)
        for (let i = own.first; i < own.end; i++) {
          const [a, b] = popSpan(i, total, window)
          expect([i - 1, i + 1, a, b + 1, i + reach].every(has)).toBe(true)
        }
        expect(lo).toBeGreaterThanOrEqual(0)
        expect(hi).toBeLessThanOrEqual(total - 1)
      }
    }
  })

  it('reaches 16 frames back and 17 on inside the window, and to the window of the median at its two ends', () => {
    expect(sliceNeed({ first: 57, end: 114 }, total, window, reach)).toEqual([41, 130])
    expect(sliceNeed({ first: 0, end: 57 }, total, window, reach)).toEqual([0, 73])
    expect(sliceNeed({ first: 171, end: 228 }, total, window, reach)).toEqual([155, 227])
    expect(sliceNeed({ first: 220, end: 228 }, total, window, reach)).toEqual([195, 227])
    expect(sliceNeed({ first: 0, end: 4 }, total, window, reach)).toEqual([0, 33])
    expect(sliceNeed({ first: 0, end: total }, total, window, reach)).toEqual([0, total - 1])
  })

  it('names a part by its number and a run of frames by its capture frames', () => {
    expect(sliceName(3, 8, 0, 0)).toBe('p3of8')
    expect(sliceName(null, null, 1380, 1436)).toBe('k1380-1436')
  })

  it('finds the runs of frames that no part owns', () => {
    expect(missing([{ first: 0, end: 57 }, { first: 114, end: 171 }], total)).toEqual([{ first: 57, end: 114 }, { first: 171, end: 228 }])
    expect(missing([{ first: 0, end: 120 }, { first: 100, end: 228 }], total)).toEqual([])
    expect(missing([], 3)).toEqual([{ first: 0, end: 3 }])
  })
})

describe('the picture between a rise and the travel that leaves the stop', () => {
  const flight = (low: number): number[] => Array.from({ length: 49 }, (_, i) => low + (40 - low) * Math.abs(i - 24) / 24 + (i > 24 ? (i - 24) * 2 : 0))

  it('reads the lowest speed over the slower of the two ends of the window', () => {
    const r = judgeLeave([null, ...flight(20)], 99, 2, null)
    expect(r.first).toEqual({ value: 40, k: 100 })
    expect(r.last).toEqual({ value: 88, k: 148 })
    expect(r.lowest).toEqual({ value: 20, k: 124 })
    expect(r.over).toBeCloseTo(0.5, 12)
    expect(r.fault).toBeNull()
  })

  it('shows a rest and does not judge it while there is no limit, and names it once there is one', () => {
    const speed = [null, ...flight(0.25)]
    expect(judgeLeave(speed, 99, 2, null).over).toBeCloseTo(0.00625, 12)
    expect(judgeLeave(speed, 99, 2, null).fault).toBeNull()
    const f = judgeLeave(speed, 99, 2, 0.3).fault!
    expect(f.rule).toBe('rest')
    expect(f.frame).toBe(62)
    expect(f.text).toBe('rest: the picture comes to rest between the rise and the travel: the fastest point of the body\'s edge moves 0.25 px a film frame at frame 62, 0.006 of the slower end of the window, limit 0.3')
    expect(judgeLeave([null, ...flight(20)], 99, 2, 0.3).fault).toBeNull()
  })

  it('is not measured where the path gives no speed', () => {
    const r = judgeLeave([null, null, null], 0, 2, 0.3)
    expect(r.over).toBeNull()
    expect(r.fault).toBeNull()
  })

  it('is sampled at the seven seams from a rise into a travel: not at the first stop, whose travel follows its hold, and not at the last', () => {
    const film = new FilmDirector(plans)
    const reach = config.raw.smooth.reachFrames
    const seams: string[] = []
    for (const plan of plans) {
      const w = sampleLeave(config, film, plan, 2, reach)
      if (!w) continue
      seams.push(plan.id)
      expect(w.seam).toBe(w.rise.endFrame)
      expect(w.travel.firstFrame).toBe(w.seam)
      expect(w.samples[0]!.k).toBe((w.seam - reach) * 2 - 1)
      expect(w.samples[w.samples.length - 1]!.k).toBe((w.seam + reach) * 2 - 1)
      expect(w.samples.filter((s) => s.k >= w.seam * 2).every((s) => s.segment === w.travel.id)).toBe(true)
      expect(w.samples.filter((s) => s.k < w.seam * 2).every((s) => s.segment === w.rise.id)).toBe(true)
    }
    expect(seams).toEqual(plans.slice(1, -1).map((p) => p.id))
  })
})
