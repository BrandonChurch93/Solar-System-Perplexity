import { afterAll, afterEach, describe, expect, it } from 'vitest'
import * as THREE from 'three'
import raw from '../config/showcase.json'
import { buildConfig, config } from '../src/config'
import { shutterSpan, spanMid } from '../src/core/clock'
import { framePlan, rawMotion } from '../src/core/motion'
import type { Pose, SetState, Shot, ViewKind } from '../src/core/types'
import { FilmDirector } from '../src/director/film'
import { drawnMeasured, drawnWord, forceSide, handoverOf } from '../src/director/handover'
import { plans } from '../src/director/plans'

// The measure that reads what a stop draws (handover.drawnMeasure). The surface view of a stop was measured on the plane y = -ground of
// its set, one number of the plan for a height and the set's own y axis for an up. The ground a surface view shows is the globe: at the
// handover the two views are one picture, and the plan's twin says where the globe lies in the surface set. Measured on the plane the
// surface side read from 0.45 to 1.41 times what the globe side read at the borders of the film (Earth's rise 0.97 px for 1.99, Neptune's
// rise 11.85 for 26.51, the Sun's 54.60 for 38.61), so the count and the shutter of a frame stepped there, and no one number in a plan
// cures it: the two borders of a stop ask for two heights. For a named stop the measure takes its points on the twin's globe, and the
// globe side of its dive and its rise is read by the turn the stop draws its body by.
const LONG = 240000
const film = new FilmDirector(plans)
const numbers = config.raw.handover as unknown as { drawnMeasure: string[] }
const kept = numbers.drawnMeasure
// Saturn's surface view is the plane of its rings, so the plane is its ground and the twin's globe is not.
const NAMED = plans.map((p) => p.id).filter((id) => id !== 'saturn')
const offsets = (): [number, number, number] => [0, spanMid(), shutterSpan()]
const same = (a: THREE.Quaternion | undefined, b: THREE.Quaternion): void => expect(a?.toArray()).toEqual(b.toArray())
const three = (f: number, side?: ViewKind): [Shot, Shot, Shot] => offsets().map((o) => film.shotAt(f, (f + o) / config.fps, side)) as [Shot, Shot, Shot]
const localOf = (shot: Shot): Pose => {
  const s = shot.sets[0]!
  const back = s.rotation.clone().invert()
  return { position: shot.camera.position.clone().sub(s.origin).applyQuaternion(back), quaternion: back.clone().multiply(shot.camera.quaternion), vfov: shot.camera.vfov }
}
const surfaceFrames = (stop: string): number[] => {
  const out: number[] = []
  for (const seg of config.segments.filter((s) => s.stop === stop)) {
    for (let f = seg.firstFrame; f < seg.endFrame; f++) {
      const shot = film.shotAt(f, (f + spanMid()) / config.fps)
      if (shot.sets.length === 1 && shot.sets[0]!.id === stop && shot.sets[0]!.view === 'terrain') out.push(f)
    }
  }
  return out
}

afterEach(() => {
  numbers.drawnMeasure = kept
  forceSide(null)
})
afterAll(() => {
  numbers.drawnMeasure = kept
  forceSide(null)
})

describe('the switch', () => {
  it('names stops, and a film that names none gives no state a globe and every globe side the turn of its plan', () => {
    numbers.drawnMeasure = []
    expect(drawnWord()).toBe('')
    for (const p of plans) {
      expect(drawnMeasured(p.id)).toBe(false)
      const frames = surfaceFrames(p.id)
      expect(frames.length).toBeGreaterThan(0)
      for (const f of [frames[0]!, frames[Math.floor(frames.length / 2)]!, frames[frames.length - 1]!]) expect(film.shotAt(f, (f + spanMid()) / config.fps).sets[0]!.ball).toBeUndefined()
      for (const kind of ['dive', 'rise'] as const) {
        const seg = config.segments.find((s) => s.stop === p.id && s.kind === kind)
        if (!seg || !handoverOf(p.id, kind)) continue
        for (let f = seg.firstFrame; f < seg.endFrame; f += 7) {
          const time = (f + spanMid()) / config.fps
          const s = film.shotAt(f, time, 'orbit').sets[0]!
          same(s.turn, p.turn(time))
        }
      }
    }
    numbers.drawnMeasure = ['mars', 'venus']
    expect(drawnWord()).toBe('mars,venus')
    expect(drawnMeasured('mars') && drawnMeasured('venus')).toBe(true)
    expect(drawnMeasured('earth')).toBe(false)
  }, LONG)
  it('is a list of stops, each once, and the film names none', () => {
    expect(raw.handover.drawnMeasure).toEqual([])
    for (const bad of [['pluto'], ['mars', 'mars'], 'mars', { mars: true }]) {
      const off = JSON.parse(JSON.stringify(raw)) as typeof raw
      ;(off.handover as { drawnMeasure: unknown }).drawnMeasure = bad
      expect(() => buildConfig(off)).toThrow(/handover.drawnMeasure/)
    }
    const gone = JSON.parse(JSON.stringify(raw)) as typeof raw
    delete (gone.handover as { drawnMeasure?: unknown }).drawnMeasure
    expect(() => buildConfig(gone)).toThrow(/missing key handover.drawnMeasure/)
    const named = JSON.parse(JSON.stringify(raw)) as typeof raw
    ;(named.handover as { drawnMeasure: unknown }).drawnMeasure = NAMED
    expect(() => buildConfig(named)).not.toThrow()
  })
})

describe('the globe in the surface set', () => {
  it('is the unit sphere as the twin of the plan has it: a point of the set stands as high over the one as its twin over the other', () => {
    const probes = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.7, 0.2, -1.3), new THREE.Vector3(-2.5, 1.1, 0.4), new THREE.Vector3(0.3, -0.6, 3.2), new THREE.Vector3(-0.2, 4, -0.9)]
    for (const p of plans) {
      const frames = surfaceFrames(p.id)
      for (const f of [frames[0]!, frames[Math.floor(frames.length / 3)]!, frames[Math.floor((2 * frames.length) / 3)]!, frames[frames.length - 1]!]) {
        const time = (f + spanMid()) / config.fps
        const ball = p.ballIn(time)
        expect(ball.radius).toBeGreaterThan(0)
        for (const q of probes) {
          const high = p.twin({ position: q.clone(), quaternion: new THREE.Quaternion(), vfov: p.p.terrain.vfov }, time).position.length() - 1
          // To seven places of a radius: the twins of Jupiter and of Neptune are similarities to four parts in a thousand million.
          expect((q.distanceTo(ball.centre) - ball.radius) / ball.radius).toBeCloseTo(high, 7)
        }
      }
    }
  })
  it('is in the state of the surface view of a named stop and of no other state, and the lens stands over it in every frame', () => {
    numbers.drawnMeasure = NAMED
    let surface = 0
    let frames = 0
    for (const p of plans) {
      for (const f of surfaceFrames(p.id)) {
        if (NAMED.includes(p.id)) frames++
        // At the border the two ends of the shutter may stand on the globe side.
        for (const shot of three(f)) {
          const s = shot.sets[0]!
          if (s.view !== 'terrain' || !NAMED.includes(p.id)) {
            expect(s.ball).toBeUndefined()
            continue
          }
          surface++
          const ball = p.ballIn(s.time)
          expect(s.ball!.radius).toBe(ball.radius)
          expect(s.ball!.centre.toArray()).toEqual(ball.centre.toArray())
          // A lens under the globe would see none of it and the frame would read no motion.
          expect(localOf(shot).position.distanceTo(ball.centre)).toBeGreaterThan(ball.radius)
        }
      }
      // The globe side of the dive and of the rise never carries it.
      for (const kind of ['dive', 'rise'] as const) {
        const seg = config.segments.find((x) => x.stop === p.id && x.kind === kind)
        if (!seg) continue
        for (let f = seg.firstFrame; f < seg.endFrame; f += 5) expect(film.shotAt(f, (f + spanMid()) / config.fps, 'orbit').sets.every((s) => s.ball === undefined)).toBe(true)
      }
    }
    expect(frames).toBeGreaterThan(0)
    expect(surface).toBeGreaterThanOrEqual(frames)
  }, LONG)
})

describe('the measure of a surface view', () => {
  const hold = config.segments.find((s) => s.stop === 'mars' && s.kind === 'terrain')!
  const at = hold.firstFrame + Math.floor(hold.frames / 2)
  const moved = (shot: Shot, by: THREE.Vector3, set: Partial<SetState>): Shot => {
    const s = shot.sets[0]!
    return { ...shot, camera: { ...shot.camera, position: shot.camera.position.clone().add(by.clone().applyQuaternion(s.rotation)) }, sets: [{ ...s, ...set }] }
  }
  it('on a globe far larger than the view reads what the plane under the lens reads', () => {
    numbers.drawnMeasure = []
    const mid = film.shotAt(at, (at + spanMid()) / config.fps)
    expect(mid.sets[0]!.view).toBe('terrain')
    const lens = localOf(mid)
    for (const ground of [0.4, 1, 2.5]) {
      for (const by of [new THREE.Vector3(0.01, 0, 0), new THREE.Vector3(0, 0.004, -0.02), new THREE.Vector3(-0.006, -0.003, 0.008)]) {
        const radius = 1e7
        const plane = { ground }
        const ball = { ground, ball: { centre: new THREE.Vector3(lens.position.x, -ground - radius, lens.position.z), radius } }
        const flat = rawMotion(moved(mid, by.clone().multiplyScalar(-1), plane), moved(mid, new THREE.Vector3(), plane), moved(mid, by, plane))
        const round = rawMotion(moved(mid, by.clone().multiplyScalar(-1), ball), moved(mid, new THREE.Vector3(), ball), moved(mid, by, ball))
        expect(flat).toBeGreaterThan(0)
        expect(Math.abs(round / flat - 1)).toBeLessThan(1e-4)
      }
    }
  })
  it('reads more motion over a globe that stands nearer under the lens, and none where the lens looks past it', () => {
    numbers.drawnMeasure = []
    const mid = film.shotAt(at, (at + spanMid()) / config.fps)
    const lens = localOf(mid)
    const by = new THREE.Vector3(0.01, 0, 0)
    const read = (height: number, radius: number): number => {
      const set = { ball: { centre: new THREE.Vector3(lens.position.x, lens.position.y - height - radius, lens.position.z), radius } }
      return rawMotion(moved(mid, by.clone().multiplyScalar(-1), set), moved(mid, new THREE.Vector3(), set), moved(mid, by, set))
    }
    let last = Infinity
    for (const height of [0.25, 0.5, 1, 2, 4]) {
      const px = read(height, 500)
      expect(px).toBeGreaterThan(0)
      expect(px).toBeLessThan(last)
      last = px
    }
    // A globe behind the lens: no ray of the frame meets it.
    const behind = { ball: { centre: lens.position.clone().add(new THREE.Vector3(0, 0, 50).applyQuaternion(lens.quaternion)), radius: 1 } }
    expect(rawMotion(moved(mid, by.clone().multiplyScalar(-1), behind), moved(mid, new THREE.Vector3(), behind), moved(mid, by, behind))).toBe(0)
  })
})

describe('the two sides of a handover', () => {
  it('read the same motion at the border in every named stop, where the plane read up to twice or down to half of it', () => {
    let borders = 0
    let apart = 0
    for (const id of NAMED) {
      for (const kind of ['dive', 'rise'] as const) {
        const h = handoverOf(id, kind)
        if (!h) continue
        for (let f = h.firstFrame; f <= h.lastFrame; f++) {
          numbers.drawnMeasure = NAMED
          const globe = rawMotion(...three(f, 'orbit'))
          const surface = rawMotion(...three(f, 'terrain'))
          const plan = framePlan(film, f, 'review')
          numbers.drawnMeasure = []
          const plane = rawMotion(...three(f, 'terrain'))
          borders++
          expect(globe).toBeGreaterThan(0)
          // Earth's two views stand two parts in a thousand apart at its borders; in every other stop the sides agree to a millionth.
          expect(Math.abs(surface / globe - 1)).toBeLessThan(0.005)
          expect(plan.split).toBe(true)
          expect(plan.raw).toBe(Math.max(globe, surface))
          apart = Math.max(apart, Math.abs(plane / globe - 1))
        }
      }
    }
    expect(borders).toBeGreaterThanOrEqual(2 * NAMED.length - 1)
    // What the law is for: on the plane the sides stood far apart.
    expect(apart).toBeGreaterThan(0.3)
  }, LONG)
})

describe('the turn of the globe side', () => {
  it('is the turn the stop draws its body by for a named stop, and the turn of its plan for any other', () => {
    const p = plans.find((x) => x.id === 'mars')!
    const seg = config.segments.find((s) => s.stop === 'mars' && s.kind === 'dive')!
    const own = Object.getOwnPropertyDescriptor(p, 'drawn')
    // A stop whose body comes to rest: it draws half the turn of its plan.
    p.drawn = (time: number): THREE.Quaternion => new THREE.Quaternion().slerp(p.turn(time), 0.5)
    try {
      let apart = 0
      for (let f = seg.firstFrame; f < seg.endFrame; f += 11) {
        const time = (f + spanMid()) / config.fps
        numbers.drawnMeasure = ['mars']
        same(film.shotAt(f, time, 'orbit').sets[0]!.turn, p.drawn(time))
        numbers.drawnMeasure = ['venus']
        same(film.shotAt(f, time, 'orbit').sets[0]!.turn, p.turn(time))
        numbers.drawnMeasure = []
        same(film.shotAt(f, time, 'orbit').sets[0]!.turn, p.turn(time))
        apart = Math.max(apart, p.drawn(time).angleTo(p.turn(time)))
      }
      expect(apart).toBeGreaterThan(0)
    } finally {
      if (own) Object.defineProperty(p, 'drawn', own)
      else delete (p as unknown as { drawn?: unknown }).drawn
    }
    same(p.drawn(1), p.turn(1))
  })
  it('is the turn of the plan in a plan that draws no other, so naming such a stop leaves its globe side as it was read', () => {
    let plain = 0
    for (const p of plans) {
      let other = 0
      for (const seg of config.segments.filter((s) => s.stop === p.id)) {
        for (let f = seg.firstFrame; f < seg.endFrame; f += 3) other = Math.max(other, ...p.drawn(f / config.fps).toArray().map((x, i) => Math.abs(x - p.turn(f / config.fps).toArray()[i]!)))
      }
      if (other > 0) continue
      plain++
      for (const kind of ['dive', 'rise'] as const) {
        const seg = config.segments.find((s) => s.stop === p.id && s.kind === kind)
        if (!seg || !handoverOf(p.id, kind)) continue
        for (let f = seg.firstFrame; f < seg.endFrame; f += 9) {
          numbers.drawnMeasure = []
          const off = rawMotion(...three(f, 'orbit'))
          numbers.drawnMeasure = plans.map((x) => x.id)
          expect(rawMotion(...three(f, 'orbit'))).toBe(off)
        }
      }
    }
    expect(plain).toBeGreaterThanOrEqual(plans.length - 2)
  }, LONG)
})
