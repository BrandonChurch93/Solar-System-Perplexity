import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { plans } from '../src/director/plans'
import type { StripDef } from '../src/space/travel/field'
import { sunStar } from '../src/space/sky'

const sun = (config.raw.travel.sky.flightStrip as StripDef).sun

describe('the glare of the Sun as a star', () => {
  it('stands whole at Neptune and at no other stop', () => {
    for (const plan of plans) {
      const share = sunStar(THREE.MathUtils.degToRad(plan.p.light.sunRadiusDeg), 0, sun.star.radiusDeg)
      expect(share, plan.id).toBe(plan.id === 'neptune' ? 1 : 0)
    }
  })
  it('follows the radius alone and leaves the ending its own Sun', () => {
    const [lo, hi] = sun.star.radiusDeg as [number, number]
    let last = 1
    for (let i = 0; i <= 40; i++) {
      const share = sunStar(THREE.MathUtils.degToRad(lo + ((hi - lo) * i) / 40), 0, sun.star.radiusDeg)
      expect(share).toBeLessThanOrEqual(last)
      last = share
    }
    expect(last).toBe(0)
    expect(sunStar(THREE.MathUtils.degToRad(0.14), 1, sun.star.radiusDeg)).toBe(0)
    expect(sunStar(THREE.MathUtils.degToRad(0.14), 0.25, sun.star.radiusDeg)).toBeCloseTo(0.75, 12)
  })
  it('names no more rays than the shader holds, each inside the turn', () => {
    expect(sun.star.rays.at.length).toBeLessThanOrEqual(12)
    for (const [deg, gain] of sun.star.rays.at) {
      expect(deg).toBeGreaterThanOrEqual(0)
      expect(deg).toBeLessThan(360)
      expect(gain).toBeGreaterThan(0)
    }
    expect(sun.star.rays.end[1]).toBeLessThan(sun.star.glow[3]!)
  })
})
