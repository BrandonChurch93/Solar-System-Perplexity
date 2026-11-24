import { lookbackLight, smooth, smoother, softSmooth } from '../src/director/rig'
import { describe, expect, it } from 'vitest'
import { landing, passCurve, TRAVEL, TravelShape, travelLook } from '../src/space/travel/path'

const looks = ['base', ...Object.keys(TRAVEL)].map((id) => ({ id, look: travelLook(id) }))

describe('the slide of a travel', () => {
  it('is the old power without a lead and without a knee', () => {
    for (const p of [2, 3]) {
      const f = passCurve(p, 1, 0, 0)
      for (const t of [0, 0.1, 0.37, 1, 1.6]) expect(f(t)).toBeCloseTo(Math.pow(t, p), 12)
    }
  })

  it('ends its pass at 1 for every stop', () => {
    for (const { look } of looks) expect(passCurve(look.passPower, look.passKnee, look.passLead, look.passRound, look.passStart)(1)).toBeCloseTo(1, 12)
  })

  it('starts with no speed, no acceleration and no jerk', () => {
    for (const { id, look } of looks) {
      const f = passCurve(look.passPower, look.passKnee, look.passLead, look.passRound, look.passStart)
      const h = 1e-3
      expect(f(0), id).toBe(0)
      expect(f(h) / h, id).toBeLessThan(1e-8)
      expect((f(2 * h) - 2 * f(h)) / (h * h), id).toBeLessThan(1e-5)
      expect((f(3 * h) - 3 * f(2 * h) + 3 * f(h)) / (h * h * h), id).toBeLessThan(1e-2)
    }
  })

  it('never slows and has no step in its acceleration', () => {
    for (const { id, look } of looks) {
      const f = passCurve(look.passPower, look.passKnee, look.passLead, look.passRound, look.passStart)
      const h = 1 / 400
      const acc: number[] = []
      for (let i = 1; i < 800; i++) acc.push((f((i + 1) * h) - 2 * f(i * h) + f((i - 1) * h)) / (h * h))
      const most = Math.max(...acc)
      for (let i = 0; i < acc.length; i++) {
        expect(acc[i]!, id + ' at ' + i).toBeGreaterThan(-1e-6)
        if (i > 0) expect(Math.abs(acc[i]! - acc[i - 1]!), id + ' at ' + i).toBeLessThan(0.03 * most)
      }
    }
  })
  it('spreads its start over the given span and keeps the old curve to the bit from the end of the span on', () => {
    const was = passCurve(3, 0.6, 0.6, 0.2)
    expect(passCurve(3, 0.6, 0.6, 0.2, [0, 0])(0.37)).toBe(was(0.37))
    expect(passCurve(3, 1, 0, 0, [0.07, 1])(0.37)).toBe(passCurve(3, 1, 0, 0)(0.37))
    expect(passCurve(3, 0.6, 0.6, 0.2, [0.07, 0.6])(0.37)).toBe(was(0.37))
    for (const span of [[0.07, 1], [0, 1], [0.1, 0.9]] as [number, number][]) {
      const now = passCurve(3, 0.6, 0.6, 0.2, span)
      const [a, b] = span
      const h = 1 / 2000
      for (const t of [b, b + 0.01, 1, 1.3, 2]) expect(now(t), 'at ' + t).toBe(was(t))
      for (const t of [0, a / 2, a]) expect(now(t), 'at ' + t).toBe(0)
      expect(Math.abs(now(b - h) - (was(b) - (was(b + h) - was(b))))).toBeLessThan(1e-7)
      const bend = (f: (t: number) => number, i: number) => (f((i + 1) * h) - 2 * f(i * h) + f((i - 1) * h)) / (h * h)
      let most = 0
      let old = 0
      for (let i = 1; i < 2400; i++) {
        most = Math.max(most, bend(now, i))
        old = Math.max(old, bend(was, i))
      }
      expect(most).toBeLessThan(0.82 * old)
      for (let i = 1; i < 2400; i++) {
        expect(bend(now, i), 'at ' + i).toBeGreaterThan(-1e-6)
        if (i > 1) expect(Math.abs(bend(now, i) - bend(now, i - 1)), 'at ' + i).toBeLessThan(0.01 * most)
      }
    }
  })

  it('has the spread start on Uranus alone', () => {
    for (const { id, look } of looks) expect(look.passStart[1] > look.passStart[0], id).toBe(id === 'uranus')
  })
})

describe('softSmooth', () => {
  it('is smooth to the bit from the lead on and starts with no acceleration', () => {
    for (let x = 0.3; x <= 1.2; x += 0.0173) expect(softSmooth(x, 0.3)).toBe(smooth(x))
    const h = 1e-3
    expect((softSmooth(2 * h, 0.3) - 2 * softSmooth(h, 0.3)) / (h * h)).toBeLessThan(0.4)
    expect((smooth(2 * h) - 2 * smooth(h)) / (h * h)).toBeGreaterThan(5.9)
    for (let u = 0.2; u <= 1; u += 0.0131) expect(lookbackLight(u)).toBe(smooth(u * 1.5))
    let last = 0
    for (let x = h; x <= 1; x += h) {
      const v = softSmooth(x, 0.3)
      expect(v).toBeGreaterThanOrEqual(last)
      last = v
    }
  })
})

describe('the landing of a travel', () => {
  const legs = Object.keys(TRAVEL).filter((id) => travelLook(id).land > 0)
  const shapeOf = (id: string, over = {}): TravelShape => {
    const shape = new TravelShape(id, over)
    shape.from = 0.3
    shape.open = 1 - shape.look.window / 75
    return shape
  }

  it('is set on the seven legs mercury to uranus and enters in the last third', () => {
    expect(legs).toEqual(['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus'])
    for (const id of legs) expect(travelLook(id).land, id).toBeGreaterThan(2 / 3)
  })

  it('takes over the distance, the speed and the acceleration and ends at rest', () => {
    const h = 1e-4
    for (const [left, speed, bend] of [[0.45, 0.9, 1.5], [1, 1.9, 0], [0.2, 0.4, 3]] as const) {
      for (const law of [[19, 0.05, 0.34, 9.6, 18.5], [30, 0.2, 0.16, 16, 18.5], [20, 0, 0, 0, 0]] as const) {
        const f = landing(left, speed, bend, [...law])
        expect(f(1)).toBeCloseTo(left, 9)
        expect((3 * f(1) - 4 * f(1 - h) + f(1 - 2 * h)) / (2 * h)).toBeCloseTo(speed, 4)
        expect((f(1) - 2 * f(1 - h) + f(1 - 2 * h)) / (h * h)).toBeCloseTo(bend, 1)
        expect(f(0)).toBe(0)
        expect(f(h) / h).toBeLessThan(1e-5)
        expect(Math.abs(f(2 * h) - 2 * f(h)) / (h * h)).toBeLessThan(1e-2)
      }
    }
  })

  it('joins the old curve with no step in place, speed or acceleration and ends on the hold', () => {
    const h = 1e-3
    for (const id of legs) {
      const shape = shapeOf(id)
      const old = shapeOf(id, { land: 0 })
      const u = shape.look.land
      const t = Math.max((u - shape.open) / (1 - shape.open), 0.5)
      for (const [now, was, at] of [[(x: number) => shape.pan(x), (x: number) => old.pan(x), u], [(x: number) => shape.arrive(x), (x: number) => old.arrive(x), t]] as const) {
        const speed = (f: (x: number) => number, x: number): number => (f(x + h) - f(x - h)) / (2 * h)
        const bend = (f: (x: number) => number, x: number): number => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h)
        const top = Math.abs(speed(was, at))
        expect(now(at - h), id).toBe(was(at - h))
        expect(Math.abs(now(at + 2 * h) - was(at + 2 * h)), id).toBeLessThan(1e-6)
        expect(Math.abs(speed(now, at + 2 * h) - speed(was, at + 2 * h)), id).toBeLessThan(2e-3 * top)
        expect(Math.abs(bend(now, at + 2 * h) - bend(was, at + 2 * h)), id).toBeLessThan(0.3 * top)
        expect(now(1), id).toBe(1)
        expect(speed(now, 1 - h) / top, id).toBeLessThan(1e-3)
        expect(Math.abs(bend(now, 1 - h)) / top, id).toBeLessThan(0.1)
        expect(Math.abs(bend(now, 1 - h)), id).toBeLessThan(0.6 * Math.abs(bend(now, 1 - 2 * h)))
        let last = now(at)
        for (let k = 1; k <= 600; k++) {
          const x = at + ((1 - at) * k) / 600
          expect(now(x), id + ' at ' + x).toBeGreaterThanOrEqual(last)
          last = now(x)
        }
      }
    }
  })

  it('keeps the old curves to the bit when it is off', () => {
    const shape = shapeOf('sun')
    expect(shape.look.land).toBe(0)
    for (const t of [0, 0.2, 0.5, 0.77, 0.99, 1]) expect(shape.arrive(t)).toBe(smoother(t))
    for (const id of legs) {
      const off = shapeOf(id, { land: 0 })
      const on = shapeOf(id)
      for (const u of [0, 0.1, 0.33, 0.5, 0.66]) expect(on.pan(u), id).toBe(off.pan(u))
    }
  })
})
