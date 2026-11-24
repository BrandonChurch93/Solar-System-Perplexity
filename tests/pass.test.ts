import { lookbackLight, smooth, softSmooth } from '../src/director/rig'
import { describe, expect, it } from 'vitest'
import { passCurve, TRAVEL, travelLook } from '../src/space/travel/path'

const looks = ['base', ...Object.keys(TRAVEL)].map((id) => ({ id, look: travelLook(id) }))

describe('the slide of a travel', () => {
  it('is the old power without a lead and without a knee', () => {
    for (const p of [2, 3]) {
      const f = passCurve(p, 1, 0, 0)
      for (const t of [0, 0.1, 0.37, 1, 1.6]) expect(f(t)).toBeCloseTo(Math.pow(t, p), 12)
    }
  })

  it('ends its pass at 1 for every stop', () => {
    for (const { look } of looks) expect(passCurve(look.passPower, look.passKnee, look.passLead, look.passRound)(1)).toBeCloseTo(1, 12)
  })

  it('starts with no speed, no acceleration and no jerk', () => {
    for (const { id, look } of looks) {
      const f = passCurve(look.passPower, look.passKnee, look.passLead, look.passRound)
      const h = 1e-3
      expect(f(0), id).toBe(0)
      expect(f(h) / h, id).toBeLessThan(1e-8)
      expect((f(2 * h) - 2 * f(h)) / (h * h), id).toBeLessThan(1e-5)
      expect((f(3 * h) - 3 * f(2 * h) + 3 * f(h)) / (h * h * h), id).toBeLessThan(1e-2)
    }
  })

  it('never slows and has no step in its acceleration', () => {
    for (const { id, look } of looks) {
      const f = passCurve(look.passPower, look.passKnee, look.passLead, look.passRound)
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
