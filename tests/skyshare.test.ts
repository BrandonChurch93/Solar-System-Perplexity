import { afterAll, describe, expect, it } from 'vitest'
import { config, type Segment } from '../src/config'
import type { Shot } from '../src/core/types'
import { forceSide, handoverOf, skyTurnWeight, skyWeight, type SkyShares } from '../src/director/handover'
import { ownSkyWeight, sharedSkyWeight } from '../src/core/skyfloor'
import { StopPlan, type MoveParams } from '../src/director/moves'
import { mix, ramp, smooth } from '../src/director/rig'
import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'
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

describe('the weight of a stop sky patch where no dive or rise shares the sky', () => {
  // What the engine did before a patch could say how it arrives, written out as it stood in its frame loop.
  const before = (kind: string, setView: string, arriving: boolean, ending: boolean, clock: number): number => (ending ? 0 : kind === 'travel' ? (arriving ? clock : 0) : kind === 'rise' && setView === 'orbit' ? 0 : 1)
  const kinds = ['hold', 'dive', 'terrain', 'rise', 'travel', 'retreat', 'lookback', 'fade']
  const clocks = [0, 0.09, 0.31, 0.53, 0.83, 1]

  it('is the engine own for a patch that says nothing, in every kind of segment, to the bit', () => {
    for (const kind of kinds) {
      for (const view of ['orbit', 'terrain']) {
        for (const arriving of [false, true]) {
          for (const ending of [false, true]) {
            for (const clock of clocks) expect(ownSkyWeight(kind, view, arriving, ending, clock, undefined)).toBe(before(kind, view, arriving, ending, clock))
          }
        }
      }
    }
    // The cases by name: a travel gives the stop that arrives the clock and the stop that is left nothing; a rise gives the globe
    // view nothing; the ending has none.
    expect(ownSkyWeight('travel', 'orbit', true, false, 0.31, undefined)).toBe(0.31)
    expect(ownSkyWeight('travel', 'orbit', false, false, 0.31, undefined)).toBe(0)
    expect(ownSkyWeight('rise', 'orbit', false, false, 0.31, undefined)).toBe(0)
    expect(ownSkyWeight('rise', 'terrain', false, false, 0.31, undefined)).toBe(1)
    expect(ownSkyWeight('hold', 'orbit', false, false, 0.31, undefined)).toBe(1)
    expect(ownSkyWeight('travel', 'orbit', true, true, 0.31, undefined)).toBe(0)
  })

  it('is whole on every frame of the travel for a patch that arrives whole, whatever the clock says, and moves nothing else', () => {
    for (const clock of clocks) {
      expect(ownSkyWeight('travel', 'orbit', true, false, clock, 'whole')).toBe(1)
      // The stop that is left, the ending and every other kind of segment are as without the word.
      expect(ownSkyWeight('travel', 'orbit', false, false, clock, 'whole')).toBe(0)
      expect(ownSkyWeight('travel', 'orbit', true, true, clock, 'whole')).toBe(0)
      for (const kind of kinds) {
        if (kind === 'travel') continue
        for (const view of ['orbit', 'terrain']) expect(ownSkyWeight(kind, view, false, false, clock, 'whole')).toBe(before(kind, view, false, false, clock))
      }
    }
  })

  it('finds the stop that arrives in the shot on every frame of every travel, from the first: a patch that arrives whole is whole on all of them, and the director\'s own weight is not', () => {
    restorePlans()
    const film = new FilmDirector(plans)
    let travels = 0
    for (const segment of config.segments) {
      const index = plans.findIndex((p) => p.id === segment.stop)
      if (segment.kind !== 'travel' || index + 1 >= plans.length) continue
      travels++
      const next = plans[index + 1]!.id
      let least = 1
      for (let f = segment.firstFrame; f < segment.endFrame; f++) {
        const shot = film.shotAt(f, (f + config.shutterFraction / 2) / fps)
        const arriving = shot.sets.filter((set) => set.id !== segment.stop)
        expect(arriving.map((set) => set.id)).toEqual([next])
        const clock = shot.skyPatch!
        least = Math.min(least, clock)
        expect(ownSkyWeight(segment.kind, arriving[0]!.view, true, false, clock, undefined)).toBe(clock)
        expect(ownSkyWeight(segment.kind, arriving[0]!.view, true, false, clock, 'whole')).toBe(1)
      }
      // The director's weight goes by the travel's clock and starts at none, so the word changes what the travel's frames get.
      expect(least).toBe(0)
    }
    expect(travels).toBeGreaterThan(0)
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

  it('is the engine\'s when the plan gives none: no hook answers by default, and a plan that answers the carry with the engine\'s own schedule gets the same shots', () => {
    const plain = coveredPlan(handing)
    const base = filmWith(plain)
    each(plain, (s, _f, time) => {
      expect(plain.skyCarryShare(s, time)).toBeNull()
      expect(plain.skyLiftAt(s, time)).toBeNull()
      expect(plain.skyShare(s, time)).toBeNull()
    })
    lifts[COVERED] = 1
    answers.carry = (s, time) => skyTurnWeight(s, time)
    answers.lift = () => null
    const plan = own()
    const film = filmWith(plan)
    let lifted = 0
    each(plan, (_s, f, time) => {
      for (const side of ['orbit', 'terrain'] as const) expect(sky(film.shotAt(f, time, side))).toBe(sky(base.shotAt(f, time, side)))
      if ((film.shotAt(f, time, 'orbit').skyStars ?? 0) > 0) lifted++
    })
    expect(lifted).toBeGreaterThan(0)
  })

  it('keeps the course by the clock for a plan that gives a time: the old step from the change of view to the end of the rise, in the globe view alone', () => {
    lifts[COVERED] = 1
    answers.carry = () => null
    answers.lift = (_s, time) => time
    const plan = own()
    const film = filmWith(plan)
    const rise = plan.seg.rise
    const from = handoverOf(plan.id, 'rise')!.time
    let between = 0
    for (let f = rise.firstFrame; f < rise.endFrame; f++) {
      for (const o of [0, config.shutterFraction / 2, 0.5]) {
        const time = (f + o) / fps
        const x = smooth(ramp(from, rise.end, time))
        const globe = film.shotAt(f, time, 'orbit')
        expect(globe.skyStars).toBe(1 - (1 - x) * (1 - x))
        expect(film.shotAt(f, time, 'terrain').skyStars ?? 0).toBe(0)
        if (globe.skyStars! > 0 && globe.skyStars! < 1) between++
      }
    }
    expect(between).toBeGreaterThan(rise.frames)
    const dive = plan.seg.dive!
    for (let f = dive.firstFrame; f < dive.endFrame; f++) for (const side of ['orbit', 'terrain'] as const) expect(film.shotAt(f, (f + 0.25) / fps, side).skyStars ?? 0).toBe(0)
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

describe('the lift of the stars by the height of the lens', () => {
  const lifts = config.raw.travel.sky.riseLift as Record<string, number>
  const kept = lifts[COVERED]!
  const power = config.raw.handover.skyLift.power
  afterAll(() => {
    lifts[COVERED] = kept
    config.raw.handover.skyLift.power = power
    restorePlans()
  })
  const lit = (skyLift: NonNullable<MoveParams['light']['skyLift']>): StopPlan => {
    const params = coveredParams()
    return new StopPlan(COVERED, coveredFit, { ...params, ...handing, light: { ...params.light, skyLift } })
  }
  // The heights a plan flies in a segment, at the borders of its film frames.
  const heights = (plan: StopPlan, kind: 'hold' | 'terrain'): number[] => {
    const s = plan.seg[kind]
    const out: number[] = []
    for (let f = s.firstFrame; f <= s.endFrame; f++) out.push(plan.eyeHeight(Math.min(f / fps, s.end - 1e-9)))
    return out
  }

  it('is one function of the height: nothing over the surface view, whole where the hold flies, never falling as the lens climbs', () => {
    const plan = coveredPlan(handing)
    const low = Math.max(...heights(plan, 'terrain'))
    const high = Math.min(...heights(plan, 'hold'))
    expect(high).toBeGreaterThan(low)
    for (const h of heights(plan, 'terrain')) expect(plan.skyLift(h)).toBe(0)
    for (const h of heights(plan, 'hold')) expect(plan.skyLift(h)).toBe(1)
    expect(plan.skyLift(0)).toBe(0)
    expect(plan.skyLift(-1)).toBe(0)
    expect(plan.skyLift(1e6)).toBe(1)
    // the default: a smooth step of the logarithm of the height between the two, to the power of the config
    expect(plan.skyLift(Math.sqrt(low * high))).toBeCloseTo(1 - Math.pow(0.5, power), 12)
    let last = 0
    let between = 0
    for (let i = 0; i <= 400; i++) {
      const lift = plan.skyLift(low * Math.pow(high / low, i / 400))
      expect(lift).toBeGreaterThanOrEqual(last)
      if (lift > 0 && lift < 1) between++
      last = lift
    }
    expect(last).toBe(1)
    expect(between).toBeGreaterThan(390)
  })

  it('gives both views of a rise the same lift at the same height, at every fraction of a frame, and the exposure of the sky with it', () => {
    lifts[COVERED] = 1
    const plan = coveredPlan(handing)
    const film = filmWith(plan)
    const rise = plan.seg.rise
    const open = config.raw.travel.sky.openExposure
    let between = 0
    let close = 0
    for (let f = rise.firstFrame; f < rise.endFrame; f++) {
      for (const o of [0, config.shutterFraction / 2, 0.5, 0.75]) {
        const time = (f + o) / fps
        const sides = (['orbit', 'terrain'] as const).map((side) => film.shotAt(f, time, side))
        for (const shot of sides) expect(shot.skyStars).toBe(plan.skyLift(shot.sets[0]!.height))
        expect(sides[0]!.skyStars!).toBeCloseTo(sides[1]!.skyStars!, 9)
        expect(sides[1]!.skyExposure).toBeCloseTo(mix(plan.p.light.skyExposure, open, sides[1]!.skyStars!) * plan.skyGain(time), 12)
        if (sides[1]!.skyStars! > 0 && sides[1]!.skyStars! < 1) between++
        if (sides[1]!.skyStars! > 0) close++
      }
    }
    expect(between).toBeGreaterThan(rise.frames)
    expect(close).toBeGreaterThan(rise.frames)
    // the last frame of the rise stands at the level the open flight takes over with
    expect(film.shotAt(rise.endFrame - 1, (rise.endFrame - 1 + config.shutterFraction) / fps, 'orbit').skyStars).toBe(1)
  })

  it('lifts nothing in a hold, a dive or a surface view, nor in a rise whose far sky is the stop\'s own', () => {
    lifts[COVERED] = 1
    const plan = coveredPlan(handing)
    let film = filmWith(plan)
    for (const kind of ['hold', 'dive', 'terrain'] as const) {
      const s = plan.seg[kind]!
      for (let f = s.firstFrame; f < s.endFrame; f++) {
        expect(film.shotAt(f, (f + 0.25) / fps).skyStars ?? 0).toBe(0)
        if (kind === 'dive') for (const side of ['orbit', 'terrain'] as const) expect(film.shotAt(f, (f + 0.25) / fps, side).skyStars ?? 0).toBe(0)
      }
    }
    lifts[COVERED] = 0
    film = filmWith(coveredPlan(handing))
    const rise = plan.seg.rise
    for (let f = rise.firstFrame; f < rise.endFrame; f++) for (const side of ['orbit', 'terrain'] as const) expect(film.shotAt(f, (f + 0.25) / fps, side).skyStars ?? 0).toBe(0)
  })

  it('takes the heights and the power of the stop, and the power of the config where the stop names none', () => {
    const own = lit({ heights: [0.01, 1], power: 2 })
    expect(own.skyLift(0.01)).toBe(0)
    expect(own.skyLift(0.005)).toBe(0)
    expect(own.skyLift(1)).toBe(1)
    expect(own.skyLift(0.1)).toBeCloseTo(0.75, 12)
    expect(own.skyLift(Math.pow(10, -1.5))).toBeCloseTo(1 - Math.pow(1 - smooth(0.25), 2), 12)
    const plain = coveredPlan(handing)
    const strong = lit({ power: 3 })
    const span = lit({ heights: [0.01, 1] })
    for (const h of [0.002, 0.02, 0.1, 0.5, 0.9, 2]) {
      expect(strong.skyLift(h)).toBeCloseTo(1 - Math.pow(1 - plain.skyLift(h), 3 / power), 12)
      expect(span.skyLift(h)).toBeCloseTo(1 - Math.pow(1 - smooth(ramp(Math.log(0.01), 0, Math.log(h))), power), 12)
    }
    config.raw.handover.skyLift.power = 2 * power
    const other = coveredPlan(handing)
    for (const h of [0.002, 0.02, 0.1, 0.5, 0.9, 2]) expect(other.skyLift(h)).toBeCloseTo(1 - Math.pow(1 - plain.skyLift(h), 2), 12)
    config.raw.handover.skyLift.power = power
  })

  it('refuses heights out of order, a power that is not above 0 and an upper height over the end of the rise', () => {
    expect(() => lit({ heights: [1, 0.01] }).skyLift(0.1)).toThrow(/heights of the star lift/)
    expect(() => lit({ heights: [0, 1] }).skyLift(0.1)).toThrow(/heights of the star lift/)
    expect(() => lit({ heights: [0.5, 0.5] }).skyLift(0.1)).toThrow(/heights of the star lift/)
    expect(() => lit({ power: 0 }).skyLift(0.1)).toThrow(/power of the star lift/)
    expect(() => lit({ power: -1 }).skyLift(0.1)).toThrow(/power of the star lift/)
    const plan = coveredPlan(handing)
    const end = plan.eyeHeight(plan.seg.rise.end - 1e-9)
    expect(() => lit({ heights: [0.01, end * 1.01] }).skyLift(0.1)).toThrow(/rise ends at/)
    expect(() => lit({ heights: [0.01, end] }).skyLift(0.1)).not.toThrow()
  })
})

describe('the lift of the stars over the stops of the film', () => {
  const lifts = config.raw.travel.sky.riseLift as Record<string, number>

  it('climbs with the lens through every rise that ends in the open flight, is the same on both sides where the view changes and stands whole where the flight takes over', () => {
    restorePlans()
    const film = new FilmDirector(plans)
    let byHeight = 0
    for (const p of plans) {
      const rise = p.seg.rise
      const level = config.stopIds.indexOf(p.id) > 0 ? lifts[p.id] ?? 0 : 0
      const clock = p.skyLiftAt(rise, (rise.start + rise.end) / 2) !== null
      let last = 0
      for (let f = rise.firstFrame; f < rise.endFrame; f++) {
        for (const o of [0, config.shutterFraction / 2, 0.5]) {
          const time = (f + o) / fps
          const shot = film.shotAt(f, time)
          const stars = shot.skyStars ?? 0
          if (level === 0) expect(stars).toBe(0)
          if (level === 0 || clock) continue
          expect(stars).toBe(level * p.skyLift(shot.sets[0]!.height))
          // the lens of a rise may sink for a frame or two where it leaves the surface view: the lift follows the height, not the clock
          if (shot.sets[0]!.height >= p.eyeHeight(Math.max(time - 1 / fps, rise.start))) expect(stars).toBeGreaterThanOrEqual(last - 1e-12)
          last = stars
        }
      }
      if (level === 0) continue
      // where the open flight takes over: the last moment of the rise and the first of the travel
      const end = film.shotAt(rise.endFrame - 1, rise.end - 1e-9).skyStars!
      const next = film.shotAt(rise.endFrame, rise.end + 1e-9).skyStars!
      expect(end).toBeCloseTo(level, 6)
      expect(next).toBeCloseTo(end, 6)
      if (clock) continue
      byHeight++
      const h = handoverOf(p.id, 'rise')
      if (h) {
        const frame = Math.floor(h.time * fps + 1e-9)
        // each side reads the height of its own lens, and a plan may find its twin by a numeric solve: the two agree as far as the heights do
        const [globe, close] = [film.shotAt(frame, h.time, 'orbit'), film.shotAt(frame, h.time, 'terrain')]
        expect(globe.skyStars!).toBe(level * p.skyLift(globe.sets[0]!.height))
        expect(close.skyStars!).toBe(level * p.skyLift(close.sets[0]!.height))
        expect(globe.skyStars!).toBeCloseTo(close.skyStars!, 6)
      }
      // nothing lifts in the hold, the dive and the surface view
      for (const s of [p.seg.hold, p.seg.dive, p.seg.terrain]) {
        if (!s || s.start >= rise.end) continue
        for (let f = s.firstFrame; f < s.endFrame; f += 7) expect(film.shotAt(f, (f + 0.25) / fps).skyStars ?? 0).toBe(0)
      }
    }
    expect(byHeight).toBeGreaterThan(0)
  })

  it('reads the same heights whatever side the harness forces: a plan whose forced close view stays low at the end of the rise lifts as it does on the film\'s path', () => {
    restorePlans()
    const fresh = (p: StopPlan): void => {
      ;(p as unknown as { lifts?: unknown }).lifts = undefined
    }
    let low = 0
    try {
      for (const p of plans) {
        const rise = p.seg.rise
        const level = config.stopIds.indexOf(p.id) > 0 ? lifts[p.id] ?? 0 : 0
        if (level === 0 || p.skyLiftAt(rise, (rise.start + rise.end) / 2) !== null) continue
        const end = p.eyeHeight(rise.end - 1e-9)
        const at = [0.001, 0.01, 0.03, 0.1, 0.3, 1, 2, 3, end]
        fresh(p)
        const film = at.map((h) => p.skyLift(h))
        for (const side of ['terrain', 'orbit'] as const) {
          forceSide(side)
          fresh(p)
          if (side === 'terrain' && p.eyeHeight(rise.end - 1e-9) < 0.5 * end) low++
          expect(at.map((h) => p.skyLift(h))).toEqual(film)
        }
        forceSide(null)
        fresh(p)
        expect(film[film.length - 1]).toBe(1)
      }
    } finally {
      forceSide(null)
      for (const p of plans) fresh(p)
    }
    // the case that failed in the harness: a close view that does not climb with the globe's camera when it is forced past the change of view
    expect(low).toBeGreaterThan(0)
  })
})
