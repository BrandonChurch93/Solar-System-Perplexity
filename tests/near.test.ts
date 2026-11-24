import { afterAll, afterEach, describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { config } from '../src/config'
import { setCapture, shutterSpan, spanMid } from '../src/core/clock'
import { framePlan, nearMotion, samplesNeeded, seenShare, type FramePlan } from '../src/core/motion'
import { sampleCount, shutterOffset } from '../src/core/sampler'
import type { NearBody, Shot } from '../src/core/types'
import { FilmDirector } from '../src/director/film'
import type { NearParams } from '../src/director/moves'
import { plans } from '../src/director/plans'
import { segmentAtFrame } from '../src/director/timeline'

// The near bodies a stop names to the motion measure (mail 411, ruling 1): the sample count of a frame follows the fastest named body that is
// in the frame. A stop that names none keeps every count; the count is a function of the frame, the tier and the config alone.
const fps = config.fps
const master = config.formats[config.formatKeys.master]!
const half = master.height / 2
const diagonal = Math.hypot(master.width, master.height)
const tiers = Object.keys(config.tiers)
const mars = plans.find((p) => p.id === 'mars')!
const kept = plans.map((p) => p.p.near)
const nobody = (): void => plans.forEach((p) => { delete p.p.near })
// The tests that walk the whole film at three tiers take seconds, more beside a render.
const LONG = 120000
// The count a frame gets for a motion, as the plan of a frame takes it: the tier's count of the segment's kind, raised by the motion to the
// tier's ceiling.
const countFor = (frame: number, tier: string, motion: number): number => {
  const base = sampleCount(tier, segmentAtFrame(frame).kind)
  const cap = config.tiers[tier]!.maxSamplesPerFrame
  return cap <= base ? base : samplesNeeded(base, cap, motion)
}

afterEach(() => setCapture(1, null))
afterAll(() => {
  plans.forEach((p, i) => {
    if (kept[i] === undefined) delete p.p.near
    else p.p.near = kept[i]
  })
  setCapture(1, null)
})

describe('nearMotion, on made shots', () => {
  const vfov = 40
  const k = half / Math.tan(THREE.MathUtils.degToRad(vfov) / 2)
  const still = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() }
  const shot = (bodies: NearBody[] | undefined, weight = 1, camera = still, origin = new THREE.Vector3(), rotation = new THREE.Quaternion()): Shot =>
    ({ camera: { position: camera.position, quaternion: camera.quaternion, vfov }, sets: [{ id: 'made', origin, rotation, weight, ...(bodies ? { near: bodies } : {}) }] }) as unknown as Shot
  const body = (x: number, y: number, z: number, radius = 0.1): NearBody[] => [{ centre: new THREE.Vector3(x, y, z), radius }]

  it('is the way of the body on the master in px: sideways the centre and the rim move alike', () => {
    expect(nearMotion(shot(body(0, 0, -10)), shot(body(0.25, 0, -10)), shot(body(0.5, 0, -10)))).toBeCloseTo(0.05 * k, 6)
    expect(nearMotion(shot(body(0, 0.3, -10)), shot(body(0, 0, -10)), shot(body(0, -0.3, -10)))).toBeCloseTo(0.06 * k, 6)
  })

  it('counts the rim: a body that comes straight at the camera grows though its centre stands', () => {
    expect(nearMotion(shot(body(0, 0, -10)), shot(body(0, 0, -7.5)), shot(body(0, 0, -5)))).toBeCloseTo((0.1 / 5 - 0.1 / 10) * k, 6)
  })

  it('does not depend on where the set and the camera stand in the world', () => {
    const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0.3, 0.8, -0.5).normalize(), 1.1)
    const origin = new THREE.Vector3(40, -7, 12)
    const camera = { position: origin.clone(), quaternion: rotation.clone() }
    const moved = (b: NearBody[]): Shot => shot(b, 1, camera, origin, rotation)
    expect(nearMotion(moved(body(0, 0, -10)), moved(body(0.25, 0.1, -9)), moved(body(0.5, 0.2, -8)))).toBeCloseTo(nearMotion(shot(body(0, 0, -10)), shot(body(0.25, 0.1, -9)), shot(body(0.5, 0.2, -8))), 6)
  })

  it('is 0 for a body that is out of the frame at the opening, the middle and the closing, and for one behind the camera', () => {
    expect(nearMotion(shot(body(100, 0, -10)), shot(body(101, 0, -10)), shot(body(102, 0, -10)))).toBe(0)
    expect(nearMotion(shot(body(0, 0, 10)), shot(body(0.5, 0, 10)), shot(body(1, 0, 10)))).toBe(0)
  })

  it('counts a body that is in the frame at one of the three times only', () => {
    expect(nearMotion(shot(body(100, 0, -10)), shot(body(50, 0, -10)), shot(body(0, 0, -10)))).toBeCloseTo(10 * k, 5)
    expect(nearMotion(shot(body(0, 0, -10)), shot(body(50, 0, -10)), shot(body(100, 0, -10)))).toBeCloseTo(10 * k, 5)
  })

  it('counts a body whose sphere reaches into the frame though its centre is outside, and not one whose sphere stays out', () => {
    const y = Math.tan(THREE.MathUtils.degToRad(22)) * 10
    expect(nearMotion(shot(body(0, y, -10, 0.5)), shot(body(0.1, y, -10, 0.5)), shot(body(0.2, y, -10, 0.5)))).toBeCloseTo(0.02 * k, 6)
    expect(nearMotion(shot(body(0, y, -10, 0.2)), shot(body(0.1, y, -10, 0.2)), shot(body(0.2, y, -10, 0.2)))).toBe(0)
  })

  it('takes a body that passes the plane of the camera inside the shutter as the diagonal of the master', () => {
    expect(nearMotion(shot(body(0.5, 0, -1)), shot(body(0.5, 0, 0)), shot(body(0.5, 0, 1)))).toBe(diagonal)
  })

  it('is 0 for a set without weight and for a set that names no body', () => {
    expect(nearMotion(shot(body(0, 0, -10), 0), shot(body(0.25, 0, -10), 0), shot(body(0.5, 0, -10), 0))).toBe(0)
    expect(nearMotion(shot(undefined), shot(undefined), shot(undefined))).toBe(0)
  })

  it('takes the fastest of several bodies', () => {
    const two = (a: number, b: number): NearBody[] => [...body(a, 0, -10), ...body(0, b, -10)]
    expect(nearMotion(shot(two(0, 0)), shot(two(0.1, 0.4)), shot(two(0.2, 0.8)))).toBeCloseTo(0.08 * k, 6)
  })
})

describe('a stop that names no near body', () => {
  it('gives none at any time, and no set of any frame carries one', () => {
    nobody()
    const film = new FilmDirector(plans)
    for (const p of plans) for (const t of [0, p.holdMid, p.holdMid + 7.3]) expect(p.nearBodies(t)).toEqual([])
    for (let f = 0; f < config.frameCount; f += 7) for (const s of film.shotAt(f, (f + spanMid()) / fps).sets) expect('near' in s).toBe(false)
  }, LONG)

  it('keeps the count of every frame at every tier: the plan has no near and the count follows the motion seen alone', () => {
    nobody()
    const film = new FilmDirector(plans)
    for (const tier of tiers) {
      for (let f = 0; f < config.frameCount; f++) {
        const plan = framePlan(film, f, tier)
        expect('near' in plan).toBe(false)
        expect(plan.samples).toBe(countFor(f, tier, plan.seen))
      }
    }
  }, LONG)
})

describe('a stop that names a near body', () => {
  // A rock that stands in the frame of Mars, dead ahead of the camera of one early frame of the dive, a quarter of the camera's height in front
  // of it: the camera dives past it. It is made here from the film's own camera, so the test holds whatever path the stop takes.
  const dive = config.segments.find((s) => s.stop === 'mars' && s.kind === 'dive')!
  const F = dive.firstFrame + 6
  const made = (): NearParams => {
    nobody()
    const mid = new FilmDirector(plans).shotAt(F, (F + spanMid()) / fps)
    const set = mid.sets.find((s) => s.id === 'mars' && s.view === 'orbit')!
    const inverse = set.rotation.clone().invert()
    const eye = mid.camera.position.clone().sub(set.origin).applyQuaternion(inverse)
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(inverse.clone().multiply(mid.camera.quaternion))
    const height = eye.length() - 1
    return { centre: eye.clone().addScaledVector(forward, 0.25 * height).toArray() as [number, number, number], radius: 0.02 * height, degPerSecond: 0 }
  }
  const all = (film: FilmDirector, tier: string, frames: number[]): FramePlan[] => frames.map((f) => framePlan(film, f, tier))
  const whole = Array.from({ length: config.frameCount }, (_, f) => f)

  it('turns the body about the axis of the stop with time, by its own rate or by the rate of the moon', () => {
    nobody()
    mars.p.near = [{ centre: [0.2, 0.1, 2.5], radius: 0.05 }, { centre: [0.2, 0.1, 2.5], radius: 0.05, degPerSecond: 3 }]
    const at = mars.nearBodies(mars.holdMid)
    expect(at[0]!.centre.toArray()).toEqual([0.2, 0.1, 2.5])
    expect(at[1]!.radius).toBe(0.05)
    const later = mars.nearBodies(mars.holdMid + 10)
    const turned = (deg: number): THREE.Vector3 => new THREE.Vector3(0.2, 0.1, 2.5).applyAxisAngle(mars.axis, THREE.MathUtils.degToRad(deg))
    expect(later[0]!.centre.distanceTo(turned(mars.p.moonDegPerSecond * 10))).toBeLessThan(1e-12)
    expect(later[1]!.centre.distanceTo(turned(30))).toBeLessThan(1e-12)
    expect(mars.nearBodies(mars.holdMid + 10)).toEqual(later)
  })

  it('changes the count only in frames with the body in the frame, never downward, never past the ceiling of the tier, and nothing else of the plan', () => {
    const rock = made()
    const film = new FilmDirector(plans)
    const before = tiers.map((tier) => all(film, tier, whole))
    mars.p.near = [rock]
    const named = new FilmDirector(plans)
    tiers.forEach((tier, ti) => {
      const t = config.tiers[tier]!
      const after = all(named, tier, whole)
      const changed = whole.filter((f) => after[f]!.samples !== before[ti]![f]!.samples)
      for (const f of whole) {
        const a = before[ti]![f]!
        const b = after[f]!
        const { near, ...rest } = b
        if (near === undefined) expect(b).toEqual(a)
        else {
          expect(near).toBeGreaterThan(0)
          expect({ ...rest, samples: a.samples }).toEqual(a)
          expect(b.samples).toBeGreaterThanOrEqual(a.samples)
          expect(b.samples).toBeLessThanOrEqual(Math.max(t.maxSamplesPerFrame, a.samples))
          expect(b.samples).toBe(countFor(f, tier, Math.max(b.seen, near)))
        }
      }
      // The body is in the frame of F by its making, and the camera dives past it, so at a tier with a ceiling above its count some frame
      // gets the ceiling.
      expect(after[F]!.near).toBeGreaterThan(0)
      if (t.maxSamplesPerFrame > t.fastSamplesPerFrame) {
        expect(changed.length).toBeGreaterThan(0)
        expect(Math.max(...changed.map((f) => after[f]!.samples))).toBe(t.maxSamplesPerFrame)
      } else expect(changed.length).toBe(0)
    })
  }, LONG)

  it('measures the body across the shutter that is open, at the capture rate 1 and across the half shutter of each capture frame at the rate 2', () => {
    const rock = made()
    mars.p.near = [rock]
    for (const rate of [1, 2]) {
      setCapture(rate)
      const film = new FilmDirector(plans)
      expect(shutterSpan()).toBeCloseTo(config.shutterFraction / rate, 12)
      let seen = 0
      for (let k = (F - 3) * rate; k <= (F + 6) * rate; k++) {
        const f = k / rate
        const plan = framePlan(film, f, 'final')
        if (plan.split) continue
        const at = (offset: number): Shot => film.shotAt(f, (f + offset) / fps)
        const direct = nearMotion(at(shutterOffset(0, plan.shutter)), at(spanMid()), at(shutterOffset(1, plan.shutter))) * seenShare(at(spanMid()))
        expect(plan.near ?? 0).toBe(direct)
        expect(plan.samples).toBe(countFor(f, 'final', Math.max(plan.seen, direct)))
        if (direct > 0) seen++
      }
      expect(seen).toBeGreaterThan(0)
    }
    // The half shutter of a capture frame at the rate 2 is half as long as the film's, so the body goes a shorter way across it.
    setCapture(1)
    const one = framePlan(new FilmDirector(plans), F, 'final').near!
    setCapture(2)
    const two = framePlan(new FilmDirector(plans), F, 'final').near!
    expect(two).toBeLessThan(one)
    expect(two).toBeGreaterThan(one * 0.3)
  }, LONG)

  it('is a function of the frame alone: the same answer twice, in any order, from any director', () => {
    const rock = made()
    mars.p.near = [rock]
    const frames = Array.from({ length: 24 }, (_, i) => F - 8 + i * 0.5)
    setCapture(2)
    const film = new FilmDirector(plans)
    const forward = frames.map((f) => framePlan(film, f, 'review'))
    const backward = [...frames].reverse().map((f) => framePlan(film, f, 'review')).reverse()
    const fresh = frames.map((f) => framePlan(new FilmDirector(plans), f, 'review'))
    expect(backward).toEqual(forward)
    expect(fresh).toEqual(forward)
  }, LONG)
})
