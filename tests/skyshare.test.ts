import { afterAll, describe, expect, it } from 'vitest'
import { config, type Segment } from '../src/config'
import type { Shot } from '../src/core/types'
import { handoverOf, skyTurnWeight, skyWeight, type SkyShares } from '../src/director/handover'
import { sharedSkyWeight } from '../src/core/skyfloor'
import { StopPlan } from '../src/director/moves'
import { COVERED, coveredFit, coveredParams, coveredPlan, filmWith, restorePlans } from './lib/covered'

const fps = config.fps
const handing = { handover: { dive: {}, rise: {} } }

class OwnSky extends StopPlan {
  override skyShare(seg: Segment, time: number): SkyShares | null {
    if (seg.kind !== 'dive' && seg.kind !== 'rise') return null
    const k = Math.min(Math.max((time - seg.start) / (seg.end - seg.start), 0), 1)
    return { low: k * k, high: 1 - 0.5 * k }
  }
}

class WrongSky extends StopPlan {
  override skyShare(): SkyShares | null {
    return { low: 1.5, high: 0 }
  }
}

class LowAlone extends StopPlan {
  override skyShare(seg: Segment): SkyShares | null {
    return seg.kind === 'dive' || seg.kind === 'rise' ? { low: 0.25 } : null
  }
}

// What the plan below answers: set by each test.
const answers: { carry: (seg: Segment, time: number) => number | null; lift: (seg: Segment, time: number) => number | null } = { carry: () => null, lift: () => null }

class OwnClock extends StopPlan {
  override skyCarryShare(seg: Segment, time: number): number | null {
    return answers.carry(seg, time)
  }
  override skyLiftAt(seg: Segment, time: number): number | null {
    return answers.lift(seg, time)
  }
}

const sky = (shot: Shot): string => JSON.stringify([shot.skyQuaternion.toArray(), shot.skyTurn.toArray(), shot.skyExposure, shot.skyGlow, shot.skyStars ?? null, shot.skyShare ?? null, shot.skyShareHigh ?? null, shot.camera.quaternion.toArray()])

describe('the sky shares of a stop that hands over', () => {
  afterAll(() => restorePlans())

  it('are the engine\'s own when the plan gives none', () => {
    const plan = coveredPlan(handing)
    const film = filmWith(plan)
    for (const kind of ['dive', 'rise'] as const) {
      const s = plan.seg[kind]!
      expect(handoverOf(plan.id, kind)).not.toBeNull()
      for (let f = s.firstFrame; f < s.endFrame; f++) {
        const time = (f + config.shutterFraction / 2) / fps
        expect(plan.skyShare(s, time)).toBeNull()
        const globe = film.shotAt(f, time, 'orbit')
        expect(globe.skyShare).toBe(skyWeight(s, time))
        expect(globe.skyShareHigh).toBeUndefined()
        const close = film.shotAt(f, time, 'terrain')
        expect(close.skyShare).toBeUndefined()
        expect(close.skyShareHigh).toBeUndefined()
      }
    }
  })

  it('are the plan\'s on the globe side when it gives them, and only there', () => {
    const plan = new OwnSky(COVERED, coveredFit, { ...coveredParams(), ...handing })
    const film = filmWith(plan)
    for (const kind of ['dive', 'rise'] as const) {
      const s = plan.seg[kind]!
      for (let f = s.firstFrame; f < s.endFrame; f++) {
        const time = (f + config.shutterFraction / 2) / fps
        const own = plan.skyShare(s, time)!
        const globe = film.shotAt(f, time, 'orbit')
        expect(globe.skyShare).toBe(own.low)
        expect(globe.skyShareHigh).toBe(own.high)
        const close = film.shotAt(f, time, 'terrain')
        expect(close.skyShare).toBeUndefined()
        expect(close.skyShareHigh).toBeUndefined()
      }
    }
    const hold = plan.seg.hold
    const shot = film.shotAt(hold.firstFrame + 3, (hold.firstFrame + 3.25) / fps)
    expect(shot.skyShare).toBeUndefined()
    expect(shot.skyShareHigh).toBeUndefined()
  })

  it('must lie from 0 to 1', () => {
    const plan = new WrongSky(COVERED, coveredFit, { ...coveredParams(), ...handing })
    const film = filmWith(plan)
    const s = plan.seg.dive!
    expect(() => film.shotAt(s.firstFrame + 2, (s.firstFrame + 2.25) / fps, 'orbit')).toThrow(/skyShare/)
  })

  it('may be the low one alone: the sky of the globe view then keeps the engine\'s rule', () => {
    const plan = new LowAlone(COVERED, coveredFit, { ...coveredParams(), ...handing })
    const film = filmWith(plan)
    for (const kind of ['dive', 'rise'] as const) {
      const s = plan.seg[kind]!
      for (let f = s.firstFrame; f < s.endFrame; f += 5) {
        const globe = film.shotAt(f, (f + config.shutterFraction / 2) / fps, 'orbit')
        expect(globe.skyShare).toBe(0.25)
        expect(globe.skyShareHigh).toBeUndefined()
      }
    }
  })

  it('weigh the two sky layers as before when the plan gives none, and as the plan says when it does', () => {
    for (const low of [0, 0.25, 0.5, 1]) {
      expect(sharedSkyWeight('terrain', 'orbit', 'dive', low, undefined)).toBe(low)
      expect(sharedSkyWeight('terrain', 'orbit', 'rise', low, undefined)).toBe(low)
      expect(sharedSkyWeight('orbit', 'orbit', 'dive', low, undefined)).toBe(1 - low)
      expect(sharedSkyWeight('orbit', 'orbit', 'rise', low, undefined)).toBe(0)
      expect(sharedSkyWeight('orbit', 'terrain', 'dive', low, undefined)).toBe(0)
      for (const high of [0, 0.3, 1]) {
        expect(sharedSkyWeight('terrain', 'orbit', 'dive', low, high)).toBe(low)
        expect(sharedSkyWeight('orbit', 'orbit', 'dive', low, high)).toBe(high)
        expect(sharedSkyWeight('orbit', 'orbit', 'rise', low, high)).toBe(high)
        expect(sharedSkyWeight('orbit', 'terrain', 'rise', low, high)).toBe(0)
      }
    }
  })
})

describe('the clock of the sky of a stop that hands over', () => {
  const lifts = config.raw.travel.sky.riseLift as Record<string, number>
  const kept = lifts[COVERED]!
  afterAll(() => {
    lifts[COVERED] = kept
    answers.carry = () => null
    answers.lift = () => null
    restorePlans()
  })
  const own = (): StopPlan => new OwnClock(COVERED, coveredFit, { ...coveredParams(), ...handing })
  const each = (plan: StopPlan, run: (s: Segment, f: number, time: number) => void): void => {
    for (const kind of ['dive', 'rise'] as const) {
      const s = plan.seg[kind]!
      for (let f = s.firstFrame; f < s.endFrame; f++) run(s, f, (f + config.shutterFraction / 2) / fps)
    }
  }

  it('is the engine\'s when the plan gives none: no hook answers by default, and a plan that answers with the engine\'s own schedule gets the same shots', () => {
    const plain = coveredPlan(handing)
    const base = filmWith(plain)
    each(plain, (s, _f, time) => {
      expect(plain.skyCarryShare(s, time)).toBeNull()
      expect(plain.skyLiftAt(s, time)).toBeNull()
      expect(plain.skyShare(s, time)).toBeNull()
    })
    lifts[COVERED] = 1
    answers.carry = (s, time) => skyTurnWeight(s, time)
    answers.lift = (_s, time) => time
    const plan = own()
    const film = filmWith(plan)
    let lifted = 0
    each(plan, (_s, f, time) => {
      for (const side of ['orbit', 'terrain'] as const) expect(sky(film.shotAt(f, time, side))).toBe(sky(base.shotAt(f, time, side)))
      if ((film.shotAt(f, time, 'orbit').skyStars ?? 0) > 0) lifted++
    })
    expect(lifted).toBeGreaterThan(0)
  })

  it('takes the weight of the carry from the plan', () => {
    const base = filmWith(coveredPlan(handing))
    answers.lift = () => null
    answers.carry = () => 0
    let plan = own()
    let film = filmWith(plan)
    let carried = 0
    each(plan, (_s, f, time) => {
      const shot = film.shotAt(f, time, 'orbit')
      expect(shot.skyQuaternion.toArray()).toEqual(shot.camera.quaternion.toArray())
      const engine = base.shotAt(f, time, 'orbit')
      if (JSON.stringify(engine.skyQuaternion.toArray()) !== JSON.stringify(engine.camera.quaternion.toArray())) carried++
    })
    expect(carried).toBeGreaterThan(0)
    answers.carry = () => 1
    plan = own()
    film = filmWith(plan)
    each(plan, (_s, f, time) => expect(film.shotAt(f, time, 'orbit').skyTurn.toArray()).toEqual(film.shotAt(f, time, 'terrain').skyTurn.toArray()))
    answers.carry = () => 1.2
    plan = own()
    film = filmWith(plan)
    const s = plan.seg.dive!
    expect(() => film.shotAt(s.firstFrame + 2, (s.firstFrame + 2.25) / fps, 'orbit')).toThrow(/skyCarryShare/)
    expect(() => film.shotAt(s.firstFrame + 2, (s.firstFrame + 2.25) / fps, 'terrain')).not.toThrow()
  })

  it('reads the star lift of a rise at the time the plan gives', () => {
    lifts[COVERED] = 1
    answers.carry = () => null
    answers.lift = (s) => s.end
    let plan = own()
    let film = filmWith(plan)
    const rise = plan.seg.rise
    const base = filmWith(coveredPlan(handing))
    let below = 0
    for (let f = rise.firstFrame; f < rise.endFrame; f++) {
      const time = (f + config.shutterFraction / 2) / fps
      expect(film.shotAt(f, time, 'orbit').skyStars).toBe(1)
      if ((base.shotAt(f, time, 'orbit').skyStars ?? 0) < 1) below++
    }
    expect(below).toBeGreaterThan(0)
    const dive = plan.seg.dive!
    expect(film.shotAt(dive.firstFrame + 2, (dive.firstFrame + 2.25) / fps, 'orbit').skyStars ?? 0).toBe(0)
    answers.lift = () => Number.NaN
    plan = own()
    film = filmWith(plan)
    expect(() => film.shotAt(rise.firstFrame + 2, (rise.firstFrame + 2.25) / fps, 'orbit')).toThrow(/skyLiftAt/)
  })
})
