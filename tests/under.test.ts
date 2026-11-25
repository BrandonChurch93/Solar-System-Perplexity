import * as THREE from 'three'
import { afterAll, describe, expect, it } from 'vitest'
import { config, type Segment } from '../src/config'
import type { Shot } from '../src/core/types'
import { FilmDirector } from '../src/director/film'
import { StopPlan } from '../src/director/moves'
import { plans } from '../src/director/plans'
import { drift } from '../src/director/rig'
import { segmentAtFrame } from '../src/director/timeline'
import { COVERED, coveredFit, coveredParams, coveredPlan, filmWith, restorePlans } from './lib/covered'

// The globe under the surface view (Shot.under, StopPlan.under): what the film puts into a shot. What the engine draws with it is
// proven by pictures (the notebook of the engine, the under pass).

const fps = config.fps
const handing = { handover: { dive: {}, rise: {} } }
const at = (f: number): number => (f + config.shutterFraction / 2) / fps

// What the plan below answers: set by each test.
const answer: { under: (seg: Segment, time: number) => boolean } = { under: () => true }

class Under extends StopPlan {
  override under(seg: Segment, time: number): boolean {
    return answer.under(seg, time)
  }
}

const under = (more: object = handing): Under => new Under(COVERED, coveredFit, { ...coveredParams(), ...more })

// The frames of a stop in which the film may show its surface view: its dive, its surface segment and its rise.
const frames = (plan: StopPlan): { f: number; seg: Segment }[] => {
  const out: { f: number; seg: Segment }[] = []
  for (const seg of [plan.seg.dive, plan.seg.terrain, plan.seg.rise]) {
    if (!seg) continue
    for (let f = seg.firstFrame; f < seg.endFrame; f++) out.push({ f, seg })
  }
  return out
}

const close = (a: THREE.Vector3 | THREE.Quaternion, b: THREE.Vector3 | THREE.Quaternion, digits: number): void => {
  const x = a.toArray()
  const y = b.toArray()
  for (let i = 0; i < x.length; i++) expect(x[i]).toBeCloseTo(y[i]!, digits)
}

const text = (shot: Shot): string => {
  const { under: _, ...rest } = shot
  return JSON.stringify(rest)
}

describe('the globe under the surface view', () => {
  afterAll(() => restorePlans())

  it('is asked for by no plan that does not say so: the answer of a plan is false in every segment', () => {
    for (const p of plans) {
      if (p.under !== StopPlan.prototype.under) continue
      for (const seg of config.segments) expect(p.under(seg, (seg.start + seg.end) / 2)).toBe(false)
    }
    const plain = coveredPlan(handing)
    for (const { f, seg } of frames(plain)) expect(plain.under(seg, at(f))).toBe(false)
  })

  it('is in a shot of the film exactly where the shot is a surface view and its stop asks for it, and in no other frame', () => {
    const film = new FilmDirector(plans)
    let with_ = 0
    for (let f = 0; f < config.frameCount; f++) {
      const seg = segmentAtFrame(f)
      const shot = film.shotAt(f, at(f))
      const p = plans.find((q) => q.id === seg.stop)
      const asked = !!p && shot.sets.length === 1 && shot.sets[0]!.id === p.id && shot.sets[0]!.view === 'terrain' && p.under(seg, at(f))
      expect(shot.under !== undefined).toBe(asked)
      if (asked) with_++
      if (!p || p.under === StopPlan.prototype.under) expect('under' in shot).toBe(false)
    }
    expect(with_).toBe(plans.reduce((n, p) => n + (p.under === StopPlan.prototype.under ? 0 : frames(p).filter(({ f, seg }) => film.shotAt(f, at(f)).sets[0]!.view === 'terrain' && p.under(seg, at(f))).length), 0))
  }, 240000)

  it('leaves every other number of the shot as it is, and the globe view without it', () => {
    answer.under = () => true
    const plan = under()
    const film = filmWith(plan)
    const plain = filmWith(coveredPlan(handing))
    let seen = 0
    for (const { f, seg } of frames(plan)) {
      for (const view of ['terrain', 'orbit'] as const) {
        if (view === 'orbit' && seg.kind === 'terrain') continue
        const shot = film.shotAt(f, at(f), view)
        const base = plain.shotAt(f, at(f), view)
        expect('under' in base).toBe(false)
        expect(shot.under !== undefined).toBe(view === 'terrain')
        expect(text(shot)).toBe(text(base))
        seen++
      }
      const own = film.shotAt(f, at(f))
      expect(own.under !== undefined).toBe(own.sets[0]!.view === 'terrain')
    }
    expect(seen).toBeGreaterThan(400)
  }, 240000)

  it('follows the answer of the plan time by time', () => {
    const plan = under()
    const film = filmWith(plan)
    const dive = plan.seg.dive!
    const half = (dive.start + dive.end) / 2
    const asked: [string, number][] = []
    answer.under = (seg, time) => {
      asked.push([seg.id, time])
      return seg.kind === 'dive' && time >= half
    }
    for (const { f, seg } of frames(plan)) {
      asked.length = 0
      const shot = film.shotAt(f, at(f), 'terrain')
      expect(asked).toEqual([[seg.id, at(f)]])
      expect(shot.under !== undefined).toBe(seg.kind === 'dive' && at(f) >= half)
      asked.length = 0
      if (seg.kind !== 'terrain') {
        film.shotAt(f, at(f), 'orbit')
        expect(asked).toEqual([])
      }
    }
    answer.under = () => true
  }, 240000)

  it('is the globe view of that time: its state, the twin of the lens, the range of a globe lens there, the same drift and the one height', () => {
    answer.under = () => true
    const plan = under()
    const film = filmWith(plan)
    const index = config.stopIds.indexOf(plan.id)
    const frame = film.frames[index]!
    expect(plan.engineMove).toBe(true)
    let seen = 0
    for (const { f, seg } of frames(plan)) {
      const time = at(f)
      const shot = film.shotAt(f, time, 'terrain')
      const u = shot.under!
      const s = shot.sets[0]!
      // The state is the globe's: the stop's frame as it stands, not turned and not at the spot.
      expect(u.set.id).toBe(plan.id)
      expect(u.set.view).toBe('orbit')
      expect(u.set.weight).toBe(1)
      expect(u.set.time).toBe(time)
      expect(u.set.local).toBe(s.local)
      expect(u.set.segment).toBe(seg)
      expect(u.set.u).toBe(s.u)
      expect(u.set.ground).toBe(plan.ground)
      expect(u.set.origin.toArray()).toEqual(frame.origin.toArray())
      expect(u.set.rotation.toArray()).toEqual(frame.rotation.toArray())
      expect(u.set.origin).not.toBe(frame.origin)
      // The lens is the twin of the shot's: the shot's lens in the terms of its set, less the drift, through the plan's twin.
      const back = s.rotation.clone().invert()
      const local = { position: shot.camera.position.clone().sub(s.origin).applyQuaternion(back), quaternion: back.clone().multiply(shot.camera.quaternion).multiply(drift(time).invert()), vfov: shot.camera.vfov }
      const twin = plan.twin(local, time)
      close(u.camera.position, twin.position.clone().applyQuaternion(frame.rotation).add(frame.origin), 9)
      close(u.camera.quaternion, frame.rotation.clone().multiply(twin.quaternion).multiply(drift(time)), 9)
      expect(u.camera.vfov).toBe(shot.camera.vfov)
      // The range is the globe view's for a lens at that height, and the height is the one both views count.
      const d = Math.abs(twin.position.length() - 1)
      expect(u.near).toBeCloseTo(Math.min(Math.max(0.02 * d, Math.min(0.0004, 0.2 * d)), 1), 12)
      expect(u.near).toBeGreaterThan(0)
      expect(u.far).toBe(80000)
      expect(u.set.height).toBeCloseTo(twin.position.length() - 1, 9)
      expect(u.set.height).toBeCloseTo(s.height, 9)
      // In a dive and a rise on the engine's one move the globe view exists at the same time, and it is that view to rounding.
      if (seg.kind !== 'terrain') {
        const globe = film.shotAt(f, time, 'orbit')
        const g = globe.sets[0]!
        expect(u.set.origin.toArray()).toEqual(g.origin.toArray())
        expect(u.set.rotation.toArray()).toEqual(g.rotation.toArray())
        expect(u.far).toBe(globe.far)
        if (plan.engineMove) {
          close(u.camera.position, globe.camera.position, 8)
          close(u.camera.quaternion, globe.camera.quaternion, 8)
          expect(u.near / globe.near).toBeCloseTo(1, 6)
          expect(u.set.height / g.height).toBeCloseTo(1, 6)
        }
      }
      seen++
    }
    expect(seen).toBeGreaterThan(250)
  }, 240000)

  it('is given to a stop that does not hand over as well, with the near plane of its own globe view', () => {
    answer.under = () => true
    const plan = under({})
    expect(plan.handsOver).toBe(false)
    const film = filmWith(plan)
    const seg = plan.seg.terrain
    let seen = 0
    for (let f = seg.firstFrame; f < seg.endFrame; f += 7) {
      const shot = film.shotAt(f, at(f), 'terrain')
      const u = shot.under!
      const d = Math.abs(u.camera.position.clone().sub(u.set.origin).length() - 1)
      expect(u.near).toBeCloseTo(Math.min(Math.max(0.02 * d, 0.0004), 1), 9)
      expect(u.far).toBe(80000)
      expect(u.set.view).toBe('orbit')
      seen++
    }
    expect(seen).toBeGreaterThan(10)
  })
})
