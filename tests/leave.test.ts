import * as THREE from 'three'
import { afterAll, describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { FilmDirector } from '../src/director/film'
import type { MoveParams, StopPlan } from '../src/director/moves'
import { plans } from '../src/director/plans'
import { CARRY_AGREED, farEndOf } from '../tools/lib/seam'
import { coveredPlan, filmWith, ownPath, restorePlans } from './lib/covered'

// MAIL 602: a rise and the travel after it are one flight. A stop may ask for a rise that ends on its pose without coming to rest:
// handover.rise.pullBack of its params (StopPlan.pullBack) lets the far end of the rise come out to the end pose along the line of the
// exit, so the eye ends on the same pose and flies drift + speed along that line, its turn at rest. The travel reads that speed from the
// path (the carry of src/space/travel) as it is read here: the end pose and the rise's own eye one and two steps before it.

const deg = THREE.MathUtils.radToDeg
const h = CARRY_AGREED.step
const pulled = (pullBack: object | null): Partial<MoveParams> => ({ handover: { dive: {}, rise: pullBack ? { pullBack } : {} } }) as Partial<MoveParams>

// The far end as the travel reads it.
function read(plan: StopPlan): { gap: number; turned: number; v: THREE.Vector3; excess: THREE.Vector3; along: number; turn: number; vfov: number } {
  const end = plan.seg.rise.end
  const eye = (time: number) => plan.eyeShot('rise', time, 'orbit').pose
  const p0 = plan.exitPose(end).position
  const p1 = eye(end - h).position
  const p2 = eye(end - 2 * h).position
  const v = p0.clone().multiplyScalar(3).addScaledVector(p1, -4).add(p2).multiplyScalar(1 / (2 * h))
  const a = p0.clone().addScaledVector(p1, -2).add(p2).multiplyScalar(1 / (h * h))
  const drift = plan.exitPose(end + h).position.sub(p0).multiplyScalar(1 / h)
  const last = eye(end - 1e-9)
  const before = eye(end - h)
  return { gap: last.position.distanceTo(plan.riseEnd.position), turned: last.quaternion.angleTo(plan.riseEnd.quaternion), v, excess: v.clone().sub(drift), along: a.dot(v) / v.length(), turn: before.quaternion.angleTo(last.quaternion) / h, vfov: (last.vfov - before.vfov) / h }
}

afterAll(() => {
  ownPath(false)
  restorePlans()
})

describe('the far end of a rise that a travel follows', () => {
  it('is the drift of the exit, to the bit, for every stop that does not ask for a pull back', () => {
    for (const plan of plans) {
      if (plan.p.handover?.rise?.pullBack) continue
      const { rise, hold } = plan.seg
      for (let i = 0; i <= 40; i++) {
        const time = rise.start + ((rise.end - rise.start) * i) / 40
        const far = plan.after(time)
        const drift = plan.riseIntoHold ? plan.hold(time - hold.start) : plan.exitPose(time)
        expect(plan.pullBack(time)).toBe(0)
        expect(far.position.toArray()).toEqual(drift.position.toArray())
        expect(far.quaternion.toArray()).toEqual(drift.quaternion.toArray())
        expect(far.vfov).toBe(drift.vfov)
      }
    }
  })

  it('stands back along the line of the exit and comes out to the end pose without a step in its speed', () => {
    const pull = { speed: 1.8, over: 1 }
    const plan = coveredPlan(pulled(pull))
    const { rise } = plan.seg
    const drift = plan.p.rise.driftSpeed
    // before the last `over` seconds: back by speed * over / 2, and drifting as before
    for (const time of [rise.start, rise.start + 0.7, rise.end - pull.over]) expect(plan.pullBack(time)).toBeCloseTo((pull.speed * pull.over) / 2, 12)
    expect(plan.pullBack(rise.end)).toBe(0)
    expect(plan.pullBack(rise.end + 1)).toBe(0)
    // only the place moves, and only along the line of the exit
    for (const time of [rise.start, rise.end - 0.6, rise.end - 0.01]) {
      const far = plan.after(time)
      const plain = plan.exitPose(time)
      expect(far.quaternion.toArray()).toEqual(plain.quaternion.toArray())
      expect(far.vfov).toBe(plain.vfov)
      const moved = plain.position.clone().sub(far.position)
      expect(moved.length()).toBeCloseTo(plan.pullBack(time), 12)
      expect(moved.angleTo(plan.riseOut)).toBeLessThan(1e-6)
    }
    // its speed along the line: the drift's where it leaves the drift, drift + speed at the end, never falling between, and no step in it
    const along = (time: number): number => (plan.after(time + 1e-5).position.dot(plan.riseOut) - plan.after(time - 1e-5).position.dot(plan.riseOut)) / 2e-5
    expect(along(rise.end - pull.over - 0.2)).toBeCloseTo(drift, 6)
    expect(along(rise.end - pull.over + 1e-4)).toBeCloseTo(drift, 5)
    expect(along(rise.end - 1e-4)).toBeCloseTo(drift + pull.speed, 5)
    let last = along(rise.end - pull.over - 0.1)
    let step = 0
    for (let i = 1; i <= 220; i++) {
      const now = along(rise.end - pull.over - 0.1 + ((pull.over + 0.1 - 1e-4) * i) / 220)
      expect(now).toBeGreaterThan(last - 1e-6)
      step = Math.max(step, now - last)
      last = now
    }
    // the steepest slope of the smooth step is 1.5 * speed / over: no step of the walk may pass it
    expect(step).toBeLessThan(((1.5 * pull.speed) / pull.over) * ((pull.over + 0.1) / 220) * 1.01)
  })

  it('lets the one move end on the same pose, flying the drift and the stated speed along the line of the exit, its turn at rest', () => {
    const plain = coveredPlan(pulled(null))
    expect(plain.engineMove).toBe(true)
    const rest = read(plain)
    expect(rest.excess.length()).toBeLessThan(CARRY_AGREED.from)
    for (const pull of [{ speed: 1.8, over: 1 }, { speed: 0.6, over: 0.5 }, { speed: 3.2, over: 1.25 }]) {
      const plan = coveredPlan(pulled(pull))
      const r = read(plan)
      // the same pose at the end
      expect(r.gap).toBeLessThan(1e-6)
      expect(deg(r.turned)).toBeLessThan(1e-4)
      const end = plan.eyeShot('rise', plan.seg.rise.end - 1e-9, 'orbit').pose
      const was = plain.eyeShot('rise', plain.seg.rise.end - 1e-9, 'orbit').pose
      expect(end.position.distanceTo(was.position)).toBeLessThan(1e-6)
      expect(end.vfov).toBeCloseTo(was.vfov, 9)
      // not at rest: the stated speed over the drift, along the drift's own line
      expect(r.excess.length()).toBeGreaterThan(CARRY_AGREED.from)
      expect(Math.abs(r.excess.length() - pull.speed)).toBeLessThan(2e-3)
      expect(deg(r.excess.angleTo(plan.riseOut))).toBeLessThan(0.1)
      // it brakes or coasts there, it does not speed up; and it brakes no harder than the move that comes to rest
      expect(r.along).toBeLessThan(1e-6)
      expect(r.along).toBeGreaterThan(rest.along - 0.05)
      // the camera's turn and its angle of view at rest, as without it
      expect(deg(r.turn)).toBeLessThan(0.01)
      expect(Math.abs(r.vfov)).toBeLessThan(0.01)
      // the eye does not come to rest on the way in: through the last 12 film frames its speed stays at or above the speed it ends on
      const ends = plan.p.rise.driftSpeed + pull.speed
      const speedAt = (time: number): number => plan.eyeShot('rise', time, 'orbit').pose.position.distanceTo(plan.eyeShot('rise', time - 1e-4, 'orbit').pose.position) / 1e-4
      expect(speedAt(plan.seg.rise.end - 1e-9)).toBeCloseTo(ends, 2)
      for (let i = 0; i <= 12; i++) expect(speedAt(plan.seg.rise.end - i / config.fps - 1e-9)).toBeGreaterThan(0.99 * ends)
      // and through the last `over` seconds the height never falls
      let height = 0
      for (let i = 0; i <= 60; i++) {
        const at = plan.eyeShot('rise', plan.seg.rise.end - pull.over + (pull.over * i) / 60 - 1e-9, 'orbit').pose.position
        expect(at.length()).toBeGreaterThan(height)
        height = at.length()
      }
    }
  })

  it('reaches a path of a stop\'s own through after(time)', () => {
    ownPath(true)
    try {
      const pull = { speed: 1.8, over: 1 }
      const plan = coveredPlan(pulled(pull))
      expect(plan.engineMove).toBe(false)
      const r = read(plan)
      expect(r.gap).toBeLessThan(1e-6)
      expect(Math.abs(r.excess.length() - pull.speed)).toBeLessThan(5e-3)
      expect(deg(r.excess.angleTo(plan.riseOut))).toBeLessThan(0.2)
      expect(r.along).toBeLessThan(1e-6)
      expect(deg(r.turn)).toBeLessThan(0.02)
    } finally {
      ownPath(false)
    }
  })

  it('is refused where it cannot hold', () => {
    const { rise } = coveredPlan(pulled(null)).seg
    const span = rise.end - rise.start
    const bad = (pullBack: object, why: RegExp): void => {
      const plan = coveredPlan(pulled(pullBack))
      expect(() => plan.after(rise.end - 0.1)).toThrow(why)
      expect(() => plan.eyeShot('rise', rise.end - 0.1, 'orbit')).toThrow(why)
    }
    bad({ speed: 0, over: 1 }, /both above 0/)
    bad({ speed: -1, over: 1 }, /both above 0/)
    bad({ speed: 1, over: 0 }, /both above 0/)
    bad({ speed: Number.NaN, over: 1 }, /both above 0/)
    bad({ speed: 1 }, /both above 0/)
    bad({ speed: 1, over: span + 0.1 }, /longer than the rise/)
    bad({ speed: 1, over: 0.5 / config.fps }, /shorter than a film frame/)
    bad({ speed: 100, over: 1 }, /must stay above it/)
    // a rise that goes into a hold and a rise that nothing follows come to rest
    for (const plan of plans.filter((p) => p.riseIntoHold || !p.seg.travel)) {
      const p = plan.p as { handover?: { rise?: object } }
      const was = p.handover
      p.handover = { ...(was ?? {}), rise: { ...(was?.rise ?? {}), pullBack: { speed: 1, over: 1 } } }
      try {
        expect(() => plan.after(plan.seg.rise.end - 0.1)).toThrow(/no travel follows/)
      } finally {
        p.handover = was
      }
      expect(plan.pullBack(plan.seg.rise.end - 0.1)).toBe(0)
    }
    expect(plans.filter((p) => p.riseIntoHold || !p.seg.travel).length).toBeGreaterThan(0)
  })
})

describe('the far end line of the seam tool', () => {
  it('reads every rise that a travel follows, and no other', () => {
    const film = new FilmDirector(plans)
    for (const plan of plans) {
      const r = farEndOf(film, plan)
      const follows = !plan.riseIntoHold && plan.seg.travel !== undefined && Math.abs(plan.seg.travel.start - plan.seg.rise.end) < 1e-9
      expect(r !== null).toBe(follows)
      if (!r) continue
      expect(r.seam).toBe(plan.seg.rise.endFrame)
      expect(r.gap).toBeLessThan(1e-6)
      expect(r.carried).toBe(r.excess >= r.from)
      expect(r.step).toBeGreaterThan(0)
      expect(r.rest.lowest).not.toBeNull()
      expect(r.centre).not.toBeNull()
    }
  })

  it('reads the pull back as the travel does', () => {
    const pull = { speed: 1.8, over: 1 }
    const plan = coveredPlan(pulled(pull))
    const r = farEndOf(filmWith(plan), plan)!
    const mine = read(plan)
    expect(r.speed).toBeCloseTo(mine.v.length(), 9)
    expect(r.excess).toBeCloseTo(mine.excess.length(), 9)
    expect(r.along).toBeCloseTo(mine.along, 6)
    expect(r.carried).toBe(true)
    expect(r.offLine).not.toBeNull()
    expect(r.offLine!).toBeLessThan(0.1)
    expect(Math.abs(r.drift - plan.p.rise.driftSpeed)).toBeLessThan(1e-6)
    expect(r.asked).toBe(pull.speed)
    expect(r.reached).toBe(true)
    const plain = coveredPlan(pulled(null))
    const p = farEndOf(filmWith(plain), plain)!
    expect(p.carried).toBe(false)
    expect(p.excess).toBeLessThan(p.from)
    expect(p.asked).toBeNull()
    expect(p.reached).toBeNull()
  })

  it('says so where a stated pull back does not reach the rise', () => {
    // a path that ends on the drift of the exit and not on the far end the engine moves: the option is set and nothing comes of it
    const plan = coveredPlan(pulled({ speed: 1.8, over: 1 }))
    plan.after = (time: number) => plan.exitPose(time)
    const r = farEndOf(filmWith(plan), plan)!
    expect(r.asked).toBe(1.8)
    expect(r.excess).toBeLessThan(r.from)
    expect(r.reached).toBe(false)
    expect(r.carried).toBe(false)
  })
})
