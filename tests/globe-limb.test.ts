import { createHash } from 'node:crypto'
import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { limbAirShare, type LimbAirParams } from '../src/bodies/limb'
import { Planet } from '../src/bodies/planet'
import * as look from '../src/stops/mars/look'
import { frozen } from './globe-frozen'

const KEPT = '81b0189383d53555c8623467df803b233644cf143249b11aa3e3a28f5548a308'
const hash = (text: string): string => createHash('sha256').update(frozen(text)).digest('hex')

function planetWith(limbAir?: LimbAirParams, grazing = true): Planet {
  const t = new THREE.Texture()
  return new Planet({ map: t, mapWidth: 8, height: t, heightWidth: 8, light: look.light, haze: look.haze, ...(grazing ? { grazing: look.grazing } : {}), ...(limbAir ? { limbAir } : {}) })
}

describe('the limb air of the planet', () => {
  it('is not there and changes nothing while a stop does not ask for it', () => {
    const p = planetWith()
    expect(p.limb).toBeUndefined()
    expect(p.mesh.children.length).toBe(0)
    expect(hash(p.material.fragmentShader)).toBe(KEPT)
  })

  it('leaves the text of the globe as it was and draws one more mesh over the sky and the shells', () => {
    const p = planetWith({ height: 0.004, top: 8 })
    expect(hash(p.material.fragmentShader)).toBe(KEPT)
    const limb = p.limb!
    expect(p.mesh.children).toEqual([limb.mesh])
    expect(limb.mesh.renderOrder).toBe(6)
    const m = limb.material
    expect(m.side).toBe(THREE.BackSide)
    expect(m.depthWrite).toBe(false)
    expect(m.depthTest).toBe(true)
    expect([m.blending, m.blendSrc, m.blendDst]).toEqual([THREE.CustomBlending, THREE.OneFactor, THREE.OneMinusSrcAlphaFactor])
    expect((limb.mesh.geometry as THREE.SphereGeometry).parameters.radius).toBeCloseTo(1 + 8 * 0.004, 12)
    expect(m.uniforms.uLimbHeight!.value).toBe(0.004)
  })

  it('reads the grazing air, the light and the gain of the globe from the globe\'s own uniforms', () => {
    const p = planetWith({ height: 0.004, top: 8 })
    const mine = p.limb!.material.uniforms
    for (const name of ['uSunW', 'uHazeForward', 'uGain', 'uWeight', 'uVignette', 'uAspect', 'uGrazingShape', 'uGrazingDay', 'uGrazingFill', 'uGrazingHighlight', 'uGrazingDusk', 'uGrazingSun', 'uGrazingRange', 'uGrazingSide', 'uGrazingSideRange']) {
      expect(mine[name], name).toBe(p.material.uniforms[name])
    }
    expect(mine.uDiag).toBe(p.material.uniforms.uDiag)
  })

  it('meets the share of the globe at the edge and falls by the height the stop sets', () => {
    const depth = look.grazing.depth
    for (const [day, side] of [[1, 1], [0.4, 1], [1, 0.3], [0, 1]] as const) {
      expect(limbAirShare(0, 0.004, depth, day, side)).toBeCloseTo(1 - Math.exp(-depth * day * side), 12)
      expect(limbAirShare(-0.01, 0.004, depth, day, side)).toBe(limbAirShare(0, 0.004, depth, day, side))
    }
    expect(limbAirShare(0.004, 0.004, depth, 1, 1)).toBeCloseTo(1 - Math.exp(-depth / Math.E), 12)
    expect(limbAirShare(0.008, 0.004, depth, 1, 1)).toBeLessThan(limbAirShare(0.004, 0.004, depth, 1, 1))
    expect(limbAirShare(0.004, 0.008, depth, 1, 1)).toBeGreaterThan(limbAirShare(0.004, 0.004, depth, 1, 1))
  })

  it('refuses a planet without grazing air and a height or a top that is not above 0', () => {
    expect(() => planetWith({ height: 0.004, top: 8 }, false)).toThrow('grazing air')
    expect(() => planetWith({ height: 0, top: 8 })).toThrow('height')
    expect(() => planetWith({ height: 0.004, top: 0 })).toThrow('height')
  })
})
