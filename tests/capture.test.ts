import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { captureFrames, captureRate, setCapture, shutterSeconds, shutterSpan, spanMid, wholeFrame } from '../src/core/clock'
import { framePlan } from '../src/core/motion'
import { samplesFor, shutterMid, shutterOffset, shutterPosition } from '../src/core/sampler'
import type { Shot } from '../src/core/types'
import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'
import { judgedFrames, segmentAtFrame } from '../src/director/timeline'
import { Flow, FLOW } from '../src/space/travel/flow'

const fps = config.fps
const film = new FilmDirector(plans)
const judged = judgedFrames().map((j) => j.frame)
const spread = Array.from({ length: 36 }, (_, i) => 7 + i * 151).filter((f) => f < config.frameCount)
const frames = [...new Set([...judged, ...spread])].sort((a, b) => a - b)

const camera = (s: Shot): number[] => [...s.camera.position.toArray(), ...s.camera.quaternion.toArray(), s.camera.vfov]
const digest = (s: Shot): unknown => ({
  frame: s.frame,
  time: s.time,
  segment: s.segment.id,
  camera: camera(s),
  sky: [s.skyExposure, ...s.skyQuaternion.toArray()],
  sun: [...s.sun.dir.toArray(), s.sun.glare, s.sun.angularRadius],
  post: s.post,
  cover: s.cover,
  dust: s.dust,
  sets: s.sets.map((x) => [x.id, x.view, x.weight, x.time, ...x.origin.toArray(), ...x.rotation.toArray()]),
})
const drawn = (frame: number, tier: string): unknown => {
  const plan = framePlan(film, frame, tier)
  const times = samplesFor(plan.samples, plan.shutter).map((s) => (frame + s.timeOffset) / fps)
  return { plan, times, mid: digest(film.shotAt(frame, (frame + spanMid()) / fps)), shots: times.slice(0, 3).map((t) => digest(film.shotAt(frame, t))) }
}

afterEach(() => setCapture(1, null))
afterAll(() => setCapture(1, null))

describe('the capture clock', () => {
  it('is the film at rate 1', () => {
    expect(captureRate()).toBe(1)
    expect(captureFrames()).toBe(config.frameCount)
    expect(shutterSpan()).toBe(config.shutterFraction)
    expect(spanMid()).toBe(shutterMid())
    expect(shutterSeconds()).toBe(config.shutterFraction / config.fps)
    for (const n of [1, 4, 16, 64]) samplesFor(n).forEach((s, i) => expect(s.timeOffset).toBe(((i + 0.5) / n) * config.shutterFraction))
    for (const share of [0.2, 0.5, 1]) for (const x of [0, 0.3, 1]) expect(shutterOffset(x, share)).toBe((0.5 + (x - 0.5) * share) * config.shutterFraction)
    for (const o of [0, 0.1, 0.25, 0.4]) expect(shutterPosition(o, 1)).toBe(o / config.shutterFraction)
  })

  it('gives a capture frame film.shutterDegrees of its own length', () => {
    for (const rate of [2, 3, 4]) {
      setCapture(rate)
      expect(captureFrames()).toBe(config.frameCount * rate)
      expect(shutterSpan()).toBeCloseTo(config.shutterFraction / rate, 15)
      expect(shutterSeconds()).toBeCloseTo(config.raw.film.shutterDegrees / 360 / (fps * rate), 15)
      const s = samplesFor(16)
      expect(Math.min(...s.map((x) => x.timeOffset))).toBeGreaterThan(0)
      expect(Math.max(...s.map((x) => x.timeOffset))).toBeLessThan(config.shutterFraction / rate)
    }
  })

  it('refuses a rate that is not a whole multiple', () => {
    expect(() => setCapture(1.5)).toThrow()
    expect(() => setCapture(0)).toThrow()
    expect(() => setCapture(2, 400)).toThrow()
  })

  it('keeps a frame inside one segment', () => {
    for (const rate of [2, 3]) {
      setCapture(rate)
      for (const s of config.segments) {
        const last = s.endFrame - 1 / rate
        expect(segmentAtFrame(last).id).toBe(s.id)
        expect(segmentAtFrame(wholeFrame(last)).id).toBe(s.id)
        expect((last + shutterSpan()) / fps).toBeLessThan(s.end)
      }
    }
  })
})

describe('rate 2 with a 360 degree shutter of the capture frame', () => {
  it('draws film frame k as capture frame 2k: the same plan, the same sample times, the same shots', () => {
    for (const tier of ['draft', 'review']) {
      for (const k of frames) {
        setCapture(1, null)
        const own = JSON.stringify(drawn(k, tier))
        setCapture(2, 360)
        expect(JSON.stringify(drawn((2 * k) / captureRate(), tier))).toBe(own)
      }
    }
  })
})

describe('a shutter of zero', () => {
  it('draws frame rate times k at the film time of frame k, at any rate', () => {
    for (const rate of [1, 2, 3]) {
      setCapture(rate, 0)
      expect(spanMid()).toBe(0)
      expect(samplesFor(1)[0]!.timeOffset).toBe(0)
      for (const k of frames.slice(0, 12)) expect(((rate * k) / rate + spanMid()) / fps).toBe(k / fps)
    }
  })
})

describe('the film at rate 2', () => {
  it('is the same film between the frames: the camera of a capture frame is the film camera at that time', () => {
    for (const k of frames) {
      if (k >= config.frameCount - 1) continue
      for (const p of [k, k + 0.5]) {
        setCapture(2)
        const t = (p + spanMid()) / fps
        const got = film.shotAt(p, t)
        setCapture(1, 0)
        const want = film.shotAt(k, t)
        expect(got.segment.id).toBe(want.segment.id)
        expect(camera(got)).toEqual(camera(want))
        expect(got.skyExposure).toBe(want.skyExposure)
        expect(got.post).toEqual(want.post)
      }
    }
  })

  it('does not hold a moving camera for two capture frames', () => {
    setCapture(2)
    let moving = 0
    for (const k of frames) {
      const s = segmentAtFrame(k)
      if (k + 1 >= s.endFrame) continue
      const at = (p: number): Shot => film.shotAt(p, (p + spanMid()) / fps)
      const a = at(k)
      const b = at(k + 0.5)
      const c = at(k + 1)
      const moved = (x: Shot, y: Shot): number => x.camera.position.distanceTo(y.camera.position) + x.camera.quaternion.angleTo(y.camera.quaternion)
      const whole = moved(a, c)
      if (whole < 1e-9) continue
      moving++
      const first = moved(a, b)
      const second = moved(b, c)
      expect(first).toBeGreaterThan(0.2 * whole)
      expect(second).toBeGreaterThan(0.2 * whole)
    }
    expect(moving).toBeGreaterThan(10)
  })

  it('gives the same plan twice and out of order', () => {
    setCapture(2)
    const order = frames.slice(0, 16).flatMap((k) => [k, k + 0.5])
    const first = order.map((p) => JSON.stringify(drawn(p, 'review')))
    const back = [...order].reverse().map((p) => JSON.stringify(drawn(p, 'review'))).reverse()
    expect(back).toEqual(first)
  })

  it('falls to black without a step: the fade is a function of time and is black from two film frames before the end', () => {
    setCapture(2)
    const fade = (p: number): number => film.shotAt(p, (p + spanMid()) / fps).post.fade
    let last = fade(5325)
    let worst = 0
    for (let k = 5325 * 2 + 1; k < config.frameCount * 2; k++) {
      const now = fade(k / 2)
      expect(now).toBeLessThanOrEqual(last)
      worst = Math.max(worst, last - now)
      last = now
    }
    expect(worst).toBeLessThan(0.02)
    expect(fade(5397.5)).toBeGreaterThan(0)
    for (const p of [5398, 5398.5, 5399, 5399.5]) expect(fade(p)).toBe(0)
  })

  it('reads the position inside its own shutter in both capture frames of a film frame', () => {
    setCapture(2)
    samplesFor(16).forEach((s, i) => {
      expect(shutterPosition(s.timeOffset, 1)).toBeCloseTo((i + 0.5) / 16, 10)
      expect(shutterPosition(0.5 + s.timeOffset, 1)).toBeCloseTo((i + 0.5) / 16, 10)
    })
  })
})

describe('the flow of the dust and the belt', () => {
  const flight = config.segments.filter((s) => FLOW.kinds.includes(s.kind))
  it('is a function of time that passes through its knots', () => {
    const flow = new Flow(film, FLOW.ease)
    const a = film.shotAt(0, 0).camera.position.clone()
    const b = a.clone()
    const m = a.clone()
    for (const seg of flight) {
      for (const f of [seg.firstFrame, seg.firstFrame + 20, seg.endFrame - 2]) {
        for (let step = 0; step < FLOW.stepsPerFrame; step++) {
          flow.at(seg, f, step, a)
          flow.at(seg, f, step + 1, b)
          flow.at(seg, f + step / FLOW.stepsPerFrame, 0, m)
          expect(m.toArray()).toEqual(a.toArray())
          flow.at(seg, f, step + 0.5, m)
          expect(m.distanceTo(a.clone().lerp(b, 0.5))).toBeLessThan(1e-12 + 1e-9 * a.distanceTo(b))
          flow.at(seg, f, step + 1 - 1e-7, m)
          expect(m.distanceTo(b)).toBeLessThan(1e-6 * (a.distanceTo(b) + 1e-9) + 1e-12)
        }
      }
      flow.at(seg, seg.endFrame - 1, FLOW.stepsPerFrame, a)
      flow.at(seg, seg.endFrame, 3, b)
      expect(b.toArray()).toEqual(a.toArray())
    }
  })
})
