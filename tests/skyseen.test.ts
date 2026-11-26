import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { config } from '../src/config'
import type { Shot } from '../src/core/types'
import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'

type Plan = (typeof plans)[number]
type Aim = Plan['p']['skyAim']
const SECOND: [number, number, number] = [50, -15, 50]
const deg = (a: THREE.Quaternion, b: THREE.Quaternion): number => THREE.MathUtils.radToDeg(a.clone().normalize().angleTo(b.clone().normalize()))
// An angle between two quaternions is read through an arc cosine near 1, where one unit in the last place of their dot is 1.7e-6 degrees.
// Two skies that stand still therefore agree to a floor and not to the last digit: under STILL degrees an angle counts as none.
const STILL = 1e-4

describe('a turn between two sky aims that is seen', () => {
  const law = config.raw.handover.skySeen
  const limitKept = law.maxDegPerFrame
  // A film in which one stop has the sky aims given here and, where named, the law another limit. No other stop says the word in it,
  // whatever its plan says, so these tests read the stop they name. The plans and the limit are put back.
  const build = (plan: Plan, aim: Aim, limit = limitKept): FilmDirector => {
    const kept = plans.map((p) => p.p.skyAim)
    plans.forEach((p) => {
      if (p.p.skyAim?.seen) p.p.skyAim = { ...p.p.skyAim, seen: false }
    })
    plan.p.skyAim = aim
    law.maxDegPerFrame = limit
    try {
      return new FilmDirector(plans)
    } finally {
      plans.forEach((p, i) => {
        p.p.skyAim = kept[i]
      })
      law.maxDegPerFrame = limitKept
    }
  }
  const first = plans[0]!
  const base = new FilmDirector(plans)
  // The last stop that names a low aim and no second one, as in the tests of the two aims: it has a dive, a surface view and a rise.
  const plan = [...plans].reverse().find((p) => p.p.skyAim?.terrain && !p.p.skyAim.dive && p.seg.dive && base.sky.turns[p.id])!
  const id = plan.id
  const index = plans.indexOf(plan)
  const from = plan.seg.dive!.firstFrame
  const last = plan.seg.rise.endFrame - 1
  const surface = plan.seg.terrain
  const judged = surface.firstFrame + Math.floor(config.raw.judged.fractions.terrain * surface.frames + 1e-9)
  const span: [number, number] = [judged - 6, judged + 6]
  const two: Aim = { ...plan.p.skyAim, dive: SECOND, turn: span, seen: false }
  const plain = build(plan, two)
  const shot = (film: FilmDirector, f: number): Shot => film.shotAt(f, f / config.fps)
  // The sky's turn in the film's world from each frame to the next, frames a to b of the stop of index i, as the film counts it.
  const steps = (film: FilmDirector, i: number, a: number, b: number): number[] => {
    const out: number[] = []
    let before = film.skyInWorld(i, a)
    for (let f = a + 1; f <= b; f++) {
      const now = film.skyInWorld(i, f)
      out.push(THREE.MathUtils.radToDeg(before.angleTo(now)))
      before = now
    }
    return out
  }
  const sum = (x: number[]): number => x.reduce((a, b) => a + b, 0)
  const counted = steps(plain, index, from, last)
  const largest = Math.max(...counted)

  it('the first stop has no dive and may turn its sky from the first frame of its surface view to the last of its rise', () => {
    expect(first.seg.dive).toBeUndefined()
    const a = first.seg.terrain.firstFrame
    const b = first.seg.rise.endFrame - 1
    const aim = (turn: [number, number]): Aim => ({ ...first.p.skyAim, dive: SECOND, turn, seen: false })
    const film = build(first, aim([a, b]))
    const d = film.sky.dives[first.id]!
    expect(d.from).toBeCloseTo(a / config.fps, 12)
    expect(d.to).toBeCloseTo((b + 1) / config.fps, 12)
    expect(shot(film, a).skyTurn.toArray()).toEqual(d.turn.toArray())
    expect(shot(film, a + 1).skyPlate!.turning).toBe(true)
    expect(shot(film, b).skyPlate!.turning).toBe(true)
    expect(() => build(first, aim([a - 1, b]))).toThrow(/second sky aim/)
    expect(() => build(first, aim([a, b + 1]))).toThrow(/second sky aim/)
    expect(() => build(first, aim([b, a]))).toThrow(/second sky aim/)
  })

  it('a stop with a dive reads the frames of its turn as before: from the first frame of its dive', () => {
    expect(() => build(plan, { ...two, turn: [from, last] })).not.toThrow()
    expect(() => build(plan, { ...two, turn: [from - 1, last] })).toThrow(/second sky aim/)
  })

  it('the word without a second aim to turn from is refused when the film is built', () => {
    expect(() => build(plan, { ...plan.p.skyAim, seen: true })).toThrow(/seen needs a second sky aim/)
    expect(() => build(plan, { seen: true })).toThrow(/seen needs a second sky aim/)
    expect(() => build(first, { ...first.p.skyAim, dive: undefined, turn: undefined, seen: true })).toThrow(/seen needs a second sky aim/)
  })

  it('a stop that does not say the word has plates as they were and asks the film for no count', () => {
    for (let f = from; f <= last; f += 7) expect(Object.keys(shot(plain, f).skyPlate!).sort()).toEqual(['aim', 'turning'])
    const count = vi.spyOn(FilmDirector.prototype, 'skyInWorld')
    try {
      new FilmDirector(plans)
      expect(count.mock.calls.every(([i]) => plans[i]!.p.skyAim?.seen === true)).toBe(true)
      count.mockClear()
      build(plan, two)
      expect(count).not.toHaveBeenCalled()
    } finally {
      count.mockRestore()
    }
  })

  it('with the word every plate of the stop says so, and nothing else of any shot moves', () => {
    const film = build(plan, { ...two, seen: true }, 360)
    const bare = (s: Shot): string => {
      const o = JSON.parse(JSON.stringify(s)) as { skyPlate?: { seen?: boolean } }
      delete o.skyPlate?.seen
      return JSON.stringify(o)
    }
    for (let f = from; f <= last; f += 2.75) {
      const a = plain.shotAt(Math.floor(f), f / config.fps)
      const b = film.shotAt(Math.floor(f), f / config.fps)
      expect(b.skyPlate!.seen).toBe(true)
      expect(bare(b)).toBe(JSON.stringify(a))
    }
    for (const other of plans) {
      if (other === plan) continue
      const f = other.seg.terrain.firstFrame + 3
      expect(shot(film, f).skyPlate?.seen).toBeUndefined()
      expect(JSON.stringify(shot(film, f))).toBe(JSON.stringify(shot(plain, f)))
    }
  })

  it('on the globe side the count is the lens of the shot in the world against the sky the shot gives it', () => {
    let read = 0
    for (let f = from; f <= last; f++) {
      const s = shot(plain, f)
      if (s.sets[0]!.view === 'terrain') continue
      read++
      expect(deg(plain.skyInWorld(index, f), s.camera.quaternion.clone().multiply(s.skyQuaternion.clone().invert()).multiply(s.skyTurn))).toBeLessThan(STILL)
    }
    expect(read).toBeGreaterThan(10)
  })

  it('in the surface view the lens is read through its twin, in the world of the stop\'s globe', () => {
    const globe = shot(plain, from).sets.find((s) => s.id === id)!
    expect(globe.view).toBe('orbit')
    let read = 0
    let apart = 0
    for (let f = from; f <= last; f++) {
      const s = shot(plain, f)
      const set = s.sets[0]!
      if (set.view !== 'terrain') continue
      read++
      const back = set.rotation.clone().invert()
      const local = { position: s.camera.position.clone().sub(set.origin).applyQuaternion(back), quaternion: back.clone().multiply(s.camera.quaternion), vfov: s.camera.vfov }
      const lens = globe.rotation.clone().multiply(plan.twin(local, f / config.fps).quaternion)
      expect(deg(plain.skyInWorld(index, f), lens.clone().multiply(s.skyQuaternion.clone().invert()).multiply(s.skyTurn))).toBeLessThan(STILL)
      apart = Math.max(apart, deg(lens, s.camera.quaternion))
    }
    expect(read).toBeGreaterThan(10)
    // The two worlds of this film's stops stand apart (the surface set turns with the place), so the reading through the twin is not idle.
    const gap = plans.map((p, i) => {
      const f = p.seg.terrain.firstFrame + 1
      const s = shot(plain, f)
      const own = s.camera.quaternion.clone().multiply(s.skyQuaternion.clone().invert()).multiply(s.skyTurn)
      return deg(plain.skyInWorld(i, f), own)
    })
    expect(Math.max(apart, ...gap)).toBeGreaterThan(1)
  })

  it('the count has no step where the view changes', () => {
    for (const p of [first, plan]) {
      const i = plans.indexOf(p)
      const a = (p.seg.dive ?? p.seg.terrain).firstFrame
      const b = p.seg.rise.endFrame - 1
      const film = p === plan ? plain : build(first, { ...first.p.skyAim, seen: false })
      const turn = steps(film, i, a, b)
      let changes = 0
      for (let f = a; f < b; f++) {
        if (shot(film, f).sets[0]!.view === shot(film, f + 1).sets[0]!.view) continue
        changes++
        const near = [turn[f - a - 1], turn[f - a + 1]].filter((x): x is number => x !== undefined)
        expect(turn[f - a]!).toBeLessThan(Math.max(...near) + 0.05)
      }
      expect(changes).toBeGreaterThan(0)
    }
  })

  it('the count takes in the turn between the two aims', () => {
    // The sky of the two aims is the sky of the one aim with the turn between the aims laid on it, so over the frames of the turn the
    // count adds up to the whole turn, give or take what the sky of the one aim turns by in those frames.
    const one = steps(build(plan, { ...plan.p.skyAim, seen: false }), index, span[0] - 1, span[1] + 2)
    const both = steps(plain, index, span[0] - 1, span[1] + 2)
    const whole = deg(plain.sky.dives[id]!.turn, plain.sky.turns[id]!)
    expect(whole).toBeGreaterThan(1)
    expect(sum(both)).toBeGreaterThan(whole - sum(one) - 1e-3)
    expect(sum(both)).toBeLessThan(whole + sum(one) + 1e-3)
    expect(Math.abs(both[0]! - one[0]!)).toBeLessThan(STILL)
    expect(Math.abs(both[both.length - 1]! - one[one.length - 1]!)).toBeLessThan(STILL)
  })

  it('a stop under the limit is built, a stop over it is refused with the two frames and the angle named', () => {
    expect(largest).toBeGreaterThan(0)
    expect(() => build(plan, { ...two, seen: true }, largest * 1.001)).not.toThrow()
    const limit = largest * 0.999
    const at = from + counted.findIndex((x) => x > limit)
    let said = ''
    try {
      build(plan, { ...two, seen: true }, limit)
    } catch (e) {
      said = (e as Error).message
    }
    expect(said).toContain(id + ': the sky turns by ' + counted[at - from]!.toFixed(3) + ' degrees in the film\'s world from frame ' + at + ' to frame ' + (at + 1))
    expect(said).toContain('handover.skySeen.maxDegPerFrame')
    // The first pair over the limit is the one named, not the largest: a limit under every pair that turns names the first of them.
    const low = Math.min(...counted.filter((x) => x > STILL)) * 0.5
    const firstOver = from + counted.findIndex((x) => x > low)
    expect(() => build(plan, { ...two, seen: true }, low)).toThrow(new RegExp('from frame ' + firstOver + ' to frame ' + (firstOver + 1)))
  })

  it('the limit of the law is the film\'s: above 0, from the handover block', () => {
    expect(limitKept).toBeGreaterThan(0)
    expect(() => build(plan, { ...two, seen: true }, 0)).toThrow(/handover\.skySeen\.maxDegPerFrame must be above 0/)
    expect(() => build(plan, two, 0)).not.toThrow()
  })
})
