import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { plans } from '../src/director/plans'
import type { StripDef } from '../src/space/travel/field'
import type { SunState } from '../src/core/types'
import { limbShare, nameSunPicture, showSunPicture, sunPictureLay, sunPictureShare, sunStar } from '../src/space/sky'

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

describe('the Sun of a stop as a picture', () => {
  const state = (far: boolean): SunState => ({ dir: new THREE.Vector3(0, 0, -1), color: new THREE.Color(1, 1, 1), intensity: 3, angularRadius: 0.0024, glare: 0.6, ...(far ? { far: { share: 1 } as SunState['far'] } : {}) })

  it('lays the texel named under the Sun, upright, one texel per its measure in the frame', () => {
    const lay = sunPictureLay(456, 456, [229.9, 228.3], 1920 / 2816, sun.star.glow[3]!, sun.star.fade)
    expect(lay.at[0]).toBeCloseTo(229.9 / 456, 12)
    expect(lay.at[1]).toBeCloseTo(1 - 228.3 / 456, 12)
    expect(lay.at[0] + 10 * lay.at[2]).toBeCloseTo((229.9 + 10 * 2816 / 1920) / 456, 12)
    expect(lay.at[1] + 10 * lay.at[3]).toBeCloseTo(1 - (228.3 - 10 * 2816 / 1920) / 456, 12)
  })

  it('ends inside the crop and inside the reach of the law', () => {
    const lay = sunPictureLay(456, 456, [229.9, 228.3], 1920 / 2816, sun.star.glow[3]!, sun.star.fade)
    expect(lay.reach[1]).toBeCloseTo((456 - 229.9) * 1920 / 2816, 9)
    expect(lay.reach[0]).toBeCloseTo(sun.star.fade * lay.reach[1], 9)
    expect(sun.star.fade).toBeGreaterThan(0)
    expect(sun.star.fade).toBeLessThan(1)
    expect(sunPictureLay(4000, 4000, [2000, 2000], 1, sun.star.glow[3]!, sun.star.fade).reach[1]).toBe(sun.star.glow[3])
  })

  it('is shown only in the sample whose Sun the stop named, and never without a picture', () => {
    const a = state(true)
    const b = state(true)
    nameSunPicture(null)
    showSunPicture(1, a)
    expect(sunPictureShare(a)).toBe(-1)
    nameSunPicture({ texture: new THREE.Texture(), at: [1, 1], texelPx: 1, gain: 1 })
    expect(sunPictureShare(a)).toBe(1)
    expect(sunPictureShare({ ...a, dir: new THREE.Vector3(1, 0, 0) })).toBe(1)
    expect(sunPictureShare(b)).toBe(-1)
    showSunPicture(0.25, b)
    expect(sunPictureShare(b)).toBe(0.25)
    expect(sunPictureShare(a)).toBe(-1)
    const near = state(false)
    showSunPicture(2, near)
    expect(sunPictureShare(near)).toBe(1)
    expect(sunPictureShare({ ...near })).toBe(-1)
    nameSunPicture(null)
    expect(sunPictureShare(near)).toBe(-1)
  })

  it('sets with the disc behind the limb', () => {
    const centre = new THREE.Vector3(0, -3, -4)
    const radius = 2.5
    const limb = Math.asin(radius / 5)
    const sunAt = (lift: number): THREE.Vector3 => new THREE.Vector3(0, -3, -4).normalize().applyAxisAngle(new THREE.Vector3(1, 0, 0), limb + lift)
    const r = 0.0024
    expect(limbShare(sunAt(2 * r), centre, radius, r)).toBe(1)
    expect(limbShare(sunAt(r), centre, radius, r)).toBeCloseTo(1, 6)
    expect(limbShare(sunAt(0), centre, radius, r)).toBeCloseTo(0.5, 6)
    expect(limbShare(sunAt(-r), centre, radius, r)).toBeCloseTo(0, 6)
    expect(limbShare(sunAt(-2 * r), centre, radius, r)).toBe(0)
    let last = 0
    for (let i = -10; i <= 10; i++) {
      const share = limbShare(sunAt(i * r / 10), centre, radius, r)
      expect(share).toBeGreaterThanOrEqual(last)
      last = share
    }
    expect(limbShare(sunAt(0.5 * r), centre, radius, r) + limbShare(sunAt(-0.5 * r), centre, radius, r)).toBeCloseTo(1, 9)
  })
})
