import { afterAll, describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { airAt, resolveAir } from '../src/core/air'
import type { Air, AirKnot, HazeAir, Shot } from '../src/core/types'
import { FilmDirector } from '../src/director/film'
import { StopPlan } from '../src/director/moves'
import { plans } from '../src/director/plans'
import { coveredPlan, filmWith, restorePlans } from './lib/covered'

// PLAN F, the one air: a function of the height of the lens and of nothing else.

const haze: HazeAir = { depth: 0.6, scaleHeight: 0.004, day: [0.8, 0.6, 0.4], twilight: [0.5, 0.2, 0.1], night: [0, 0, 0.02], edge: [-0.16, 0.34], strength: 1.2, extinction: 0.3, forward: 0.7 }
const top: AirKnot = { height: 0.02, exposure: 1, sky: 0.5, stars: 1, sunRadius: 0.35, glare: 0.2, limb: 0.6, tint: [1, 0.9, 0.8], haze, shell: { ...haze, depth: 0.2 } }
const two = (): AirKnot[] => [top, { height: 0.002, exposure: 0.7, sky: 2, stars: 0, glare: 0.9, tint: [0.7, 0.8, 1], haze: { depth: 1.8, day: [1, 0.7, 0.5] } }]
const three = (): AirKnot[] => [top, { height: 0.008, exposure: 0.9, stars: 0.8, haze: { depth: 0.9 } }, { height: 0.002, exposure: 0.7, stars: 0, haze: { depth: 1.8 } }]
const numbers = (a: Air): number[] => [a.exposure, a.sky, a.stars, a.sunRadius, a.glare, a.limb ?? NaN, ...(a.tint ?? []), ...(a.haze ? [a.haze.depth, a.haze.scaleHeight, a.haze.strength, a.haze.extinction, a.haze.forward, ...a.haze.day, ...a.haze.twilight, ...a.haze.night, ...a.haze.edge] : []), ...(a.shell ? [a.shell.depth, ...a.shell.day] : [])]

afterAll(() => restorePlans())

describe('the one air, the mix of the knots', () => {
  it('is null without knots and writes nothing', () => {
    expect(airAt(null, 1)).toBeNull()
    expect(airAt(undefined, 1)).toBeNull()
  })

  it('fills a knot from the knot above it, field by field inside the haze too', () => {
    const [a, b] = resolveAir(two())
    expect(a!.share).toBe(0)
    expect(b!.share).toBe(1)
    expect(b!.sunRadius).toBe(0.35)
    expect(b!.limb).toBe(0.6)
    expect(b!.haze).toEqual({ ...haze, depth: 1.8, day: [1, 0.7, 0.5] })
    expect(b!.shell).toEqual({ ...haze, depth: 0.2 })
    expect(a!.haze).toEqual(haze)
  })

  it('is the knot own object at and beyond either end, the same object at every call', () => {
    const knots = two()
    const high = airAt(knots, 0.02)!
    expect(airAt(knots, 5)).toBe(high)
    expect(airAt(knots, 0.020001)).toBe(high)
    expect(high.height).toBe(0.02)
    expect(high.exposure).toBe(1)
    const low = airAt(knots, 0.002)!
    expect(airAt(knots, 0.0001)).toBe(low)
    expect(airAt(knots, 0)).toBe(low)
    expect(airAt(knots, -0.003)).toBe(low)
    expect(low.share).toBe(1)
    expect(Object.isFrozen(high) && Object.isFrozen(high.haze) && Object.isFrozen(high.tint) && Object.isFrozen(high.haze!.day)).toBe(true)
    expect(() => airAt(knots, NaN)).toThrow(/not a number/)
  })

  it('between two knots is a + (b - a) * s with s = u * u * (3 - 2 * u) over the logarithm of the height, number by number', () => {
    const knots = two()
    const [a, b] = resolveAir(knots)
    for (const height of [0.019, 0.0123, 0.00632455532, 0.004, 0.0021]) {
      const u = (Math.log(0.02) - Math.log(height)) / (Math.log(0.02) - Math.log(0.002))
      const s = u * u * (3 - 2 * u)
      const air = airAt(knots, height)!
      expect(air.height).toBe(height)
      expect(air.share).toBeCloseTo(u, 12)
      const want = numbers(a!).map((x, i) => x + (numbers(b!)[i]! - x) * s)
      numbers(air).forEach((x, i) => expect(Math.abs(x - want[i]!)).toBeLessThan(1e-13))
      expect(air.sunRadius).toBe(0.35)
      expect(air.limb).toBe(0.6)
      expect(air.haze!.night).toEqual([0, 0, 0.02])
    }
    expect(airAt(knots, 0.00632455532)!.exposure).toBeCloseTo(0.85, 9)
  })

  it('takes the height alone: the same height gives the same air whatever was asked before it', () => {
    const knots = three()
    const heights = [0.015, 0.003, 0.0081, 0.0079, 0.011]
    const down = heights.map((h) => JSON.stringify(airAt(knots, h)))
    const up = [...heights].reverse().map((h) => JSON.stringify(airAt(knots, h))).reverse()
    expect(up).toEqual(down)
    expect(JSON.stringify(airAt(three(), 0.0079))).toBe(down[3])
  })

  it('passes a middle knot with its exact values, without a step, without a rest and without a turn back', () => {
    const knots = three()
    const [, mid] = resolveAir(knots)
    const at = airAt(knots, 0.008)!
    expect(at.exposure).toBe(0.9)
    expect(at.stars).toBe(0.8)
    expect(at.haze!.depth).toBe(0.9)
    expect(at.share).toBeCloseTo(mid!.share, 12)
    const just = 1e-9
    const over = airAt(knots, 0.008 * (1 + just))!
    const under = airAt(knots, 0.008 * (1 - just))!
    expect(Math.abs(over.exposure - 0.9)).toBeLessThan(1e-8)
    expect(Math.abs(under.exposure - 0.9)).toBeLessThan(1e-8)
    // The slope over the logarithm of the height is the same on both sides of the middle knot and is not 0 there.
    const d = 1e-4
    const slope = (h0: number, h1: number): number => (airAt(knots, h1)!.exposure - airAt(knots, h0)!.exposure) / (Math.log(h1) - Math.log(h0))
    const above = slope(0.008, 0.008 * Math.exp(d))
    const below = slope(0.008 * Math.exp(-d), 0.008)
    expect(above).toBeGreaterThan(0.05)
    expect(Math.abs(above - below)).toBeLessThan(1e-3)
    // Flat at both ends.
    expect(Math.abs(slope(0.02 * Math.exp(-d), 0.02))).toBeLessThan(1e-3)
    expect(Math.abs(slope(0.002, 0.002 * Math.exp(d)))).toBeLessThan(1e-3)
    // Every value that only falls through the knots only falls on the way down, at steps of a thousandth of the span.
    let last = airAt(knots, 0.02)!
    for (let i = 1; i <= 1000; i++) {
      const air = airAt(knots, 0.02 * Math.pow(0.1, i / 1000))!
      expect(air.exposure).toBeLessThanOrEqual(last.exposure)
      expect(air.stars).toBeLessThanOrEqual(last.stars)
      expect(air.haze!.depth).toBeGreaterThanOrEqual(last.haze!.depth)
      expect(air.share).toBeGreaterThan(last.share - 1e-12)
      expect(Math.abs(air.exposure - last.exposure)).toBeLessThan(0.002)
      last = air
    }
  })

  it('holds a value that turns between the knots inside the knots: no value leaves the range of its two neighbours', () => {
    const knots: AirKnot[] = [{ ...top, glare: 0.2 }, { height: 0.01, glare: 0.9 }, { height: 0.005, glare: 0.3 }, { height: 0.002, glare: 0.3 }]
    for (let i = 0; i <= 600; i++) {
      const height = 0.02 * Math.pow(0.1, i / 600)
      const g = airAt(knots, height)!.glare
      const [lo, hi] = height >= 0.01 ? [0.2, 0.9] : height >= 0.005 ? [0.3, 0.9] : [0.3, 0.3]
      expect(g).toBeGreaterThanOrEqual(lo - 1e-12)
      expect(g).toBeLessThanOrEqual(hi + 1e-12)
    }
  })

  it('leaves out what the highest knot does not have and refuses a part that comes in lower down', () => {
    const bare: AirKnot[] = [{ height: 0.02, exposure: 1, sky: 0.5, stars: 1, sunRadius: 0.5, glare: 0.1 }, { height: 0.002, sky: 1.5 }]
    const air = airAt(bare, 0.006)!
    expect(Object.keys(air).sort()).toEqual(['exposure', 'glare', 'height', 'share', 'sky', 'stars', 'sunRadius'])
    expect(() => resolveAir([bare[0]!, { height: 0.002, limb: 0.4 }], 'mars')).toThrow(/mars: knot 1 of its air names limb, which the highest knot does not/)
    expect(() => resolveAir([bare[0]!, { height: 0.002, haze }], 'mars')).toThrow(/names haze, which the highest knot does not/)
  })

  it('refuses knots out of order, a height of 0, a name it does not hold, a number left open and a haze that is not whole', () => {
    expect(() => resolveAir([], 'mars')).toThrow(/at least one knot/)
    expect(() => resolveAir([top, { height: 0.03 }], 'mars')).toThrow(/run from the highest down, and knot 1 of its air at 0.03 is not under the knot before it at 0.02/)
    expect(() => resolveAir([top, { height: 0.02 }], 'mars')).toThrow(/run from the highest down/)
    expect(() => resolveAir([{ ...top, height: 0 }], 'mars')).toThrow(/needs a height above 0/)
    expect(() => resolveAir([{ ...top, colour: 1 } as unknown as AirKnot], 'mars')).toThrow(/names colour, which an air does not hold/)
    expect(() => resolveAir([{ height: 0.02, exposure: 1, sky: 0.5, stars: 1, sunRadius: 0.5 }], 'mars')).toThrow(/mars: the highest knot of its air must name glare/)
    expect(() => resolveAir([{ ...top, haze: { depth: 1 } }], 'mars')).toThrow(/the haze of knot 0 of its air must name scaleHeight/)
    expect(() => resolveAir([top, { height: 0.002, haze: { fog: 1 } as unknown as Partial<HazeAir> }], 'mars')).toThrow(/names fog, which a haze does not hold/)
    expect(() => resolveAir([top, { height: 0.002, tint: [1, 2] as unknown as [number, number, number] }], 'mars')).toThrow(/must name tint as three numbers/)
  })
})

describe('the one air on the shot', () => {
  const film = new FilmDirector(plans)
  const at = (d: FilmDirector, f: number): Shot => d.shotAt(Math.floor(f), f / config.fps)
  const master = config.raw.formats.master.height

  it('gives every shot the angle of one row of the master format, whatever is drawn', () => {
    for (const f of [0, 90, 700, 1900, 2475, 2475.5, 2600, 2700, 2800, 5399]) {
      const shot = at(film, f)
      expect(shot.pixel).toBe((2 * Math.tan((shot.camera.vfov * Math.PI) / 360)) / master)
      expect(shot.pixel).toBeGreaterThan(0)
    }
  })

  it('is absent on every shot of the film as long as no stop names an air', () => {
    for (const p of plans) expect(p.p.air, p.id).toBeUndefined()
    for (let f = 0; f < config.frameCount; f += 7) expect(at(film, f).air, 'frame ' + f).toBeUndefined()
    for (const p of plans) expect(p.air(0.01)).toBeNull()
  })

  it('cannot be replaced by the class of a stop: a stop gives knots, never the air', () => {
    for (const p of plans) {
      for (let proto = Object.getPrototypeOf(p) as object | null; proto && proto !== StopPlan.prototype; proto = Object.getPrototypeOf(proto) as object | null) {
        expect(Object.prototype.hasOwnProperty.call(proto, 'air'), p.id + ' defines air').toBe(false)
      }
    }
  })

  it('takes from the light of the stop what the highest knot leaves out, and the stars as the flight shows them', () => {
    const plan = coveredPlan({ air: [{ height: 0.02 }, { height: 0.002, exposure: 0.5, stars: 0 }] })
    const l = plan.p.light
    const high = plan.air(3)!
    expect([high.exposure, high.sky, high.stars, high.sunRadius, high.glare]).toEqual([l.exposure, l.skyExposure, 1, l.sunRadiusDeg, l.sunGlare])
    expect(plan.air(0.02)).toBe(high)
    expect(plan.air(0.001)!.exposure).toBe(0.5)
    expect(plan.air(0.001)!.sky).toBe(l.skyExposure)
    const named = coveredPlan({ air: [{ height: 0.02, exposure: 2, stars: 0.4 }] })
    expect([named.air(1)!.exposure, named.air(1)!.stars, named.air(1)!.glare]).toEqual([2, 0.4, l.sunGlare])
  })

  it('is on the shot in the hold, the dive, the surface view and the rise of a stop that names an air, by the height of the lens, and nowhere else', () => {
    const plan = coveredPlan({ air: [{ height: 0.02 }, { height: 0.002, exposure: 0.5, stars: 0 }] })
    const d = filmWith(plan)
    const s = plan.seg
    const frame = (t: number): number => Math.round(t * config.fps)
    const hold = at(d, frame(s.hold.start) + 20)
    expect(hold.air).toBe(plan.air(3))
    for (const f of [frame(s.dive!.start) + 1, frame(s.dive!.start) + 44.5, frame(s.dive!.end) - 1, frame(s.terrain.start) + 30, frame(s.rise.start) + 1, frame(s.rise.start) + 40.25, frame(s.rise.end) - 1]) {
      const shot = at(d, f)
      const own = shot.sets.find((x) => x.id === plan.id)!
      expect(shot.air, 'frame ' + f).toEqual(plan.air(own.height))
    }
    expect(at(d, frame(s.rise.end) + 10).air).toBeUndefined()
    expect(at(d, frame(s.hold.start) - 10).air).toBeUndefined()
  })

  it('is one air for both views of one moment on the one move, and the same air at the same height in the dive and in the rise', () => {
    const mars = plans.find((p) => p.id === 'mars')!
    const knots: AirKnot[] = [{ height: 0.02 }, { height: 0.002, exposure: 0.5, stars: 0 }]
    const l = mars.p.light
    const whole: AirKnot[] = [{ exposure: l.exposure, sky: l.skyExposure, stars: 1, sunRadius: l.sunRadiusDeg, glare: l.sunGlare, height: 0.02 }, knots[1]!]
    ;(mars.p as { air?: AirKnot[] }).air = knots
    try {
      const s = mars.seg
      let between = 0
      for (const kind of ['dive', 'rise'] as const) {
        const first = Math.round(s[kind]!.start * config.fps)
        const end = Math.round(s[kind]!.end * config.fps)
        for (let f = first; f < end; f += 0.5) {
          const orbit = film.shotAt(Math.floor(f), f / config.fps, 'orbit')
          const close = film.shotAt(Math.floor(f), f / config.fps, 'terrain')
          const h = orbit.sets.find((x) => x.id === 'mars')!.height
          expect(Math.abs(close.sets.find((x) => x.id === 'mars')!.height - h), kind + ' ' + f).toBeLessThan(1e-9)
          expect(orbit.air, kind + ' ' + f).toEqual(airAt(whole, h))
          if (h < 0.02 && h > 0.002) {
            between++
            expect(Math.abs(orbit.air!.exposure - close.air!.exposure)).toBeLessThan(1e-7)
            expect(Math.abs(orbit.air!.stars - close.air!.stars)).toBeLessThan(1e-7)
          } else expect(close.air).toBe(orbit.air)
        }
      }
      expect(between).toBeGreaterThan(20)
    } finally {
      delete (mars.p as { air?: AirKnot[] }).air
    }
    expect(at(film, 2475).air).toBeUndefined()
  })
})
