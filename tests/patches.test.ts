import { createHash } from 'node:crypto'
import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { BASE_PATCHES, MAX_PATCHES, Planet, patchSlots } from '../src/bodies/planet'
import { config } from '../src/config'
import { needs } from '../src/core/caps'
import * as look from '../src/stops/mars/look'
import { frozen } from './globe-frozen'

const KEPT = '81b0189383d53555c8623467df803b233644cf143249b11aa3e3a28f5548a308'

function planetWith(levels: number): Planet {
  const t = new THREE.Texture()
  return new Planet({
    map: t, mapWidth: 8, height: t, heightWidth: 8, light: look.light, haze: look.haze, grazing: look.grazing,
    patches: { textures: Array.from({ length: levels }, () => t), widthsDeg: Array.from({ length: levels }, (_, i) => 96 / 2 ** i), spot: new THREE.Vector3(0, 0, 1), feather: 0.1, fade: [1, 2], nearDeg: 3 },
  })
}

const hash = (p: Planet): string => createHash('sha256').update(frozen(p.material.fragmentShader)).digest('hex')

describe('the patch levels of the planet', () => {
  it('keeps the shader text of the frozen build for a pyramid of up to six levels', () => {
    expect(BASE_PATCHES).toBe(6)
    for (const levels of [0, 1, 5, 6]) expect(hash(planetWith(levels)), levels + ' levels').toBe(KEPT)
  })

  it('grows the shader by one sampler per level beyond six, up to the limit', () => {
    for (let levels = BASE_PATCHES + 1; levels <= MAX_PATCHES; levels++) {
      const p = planetWith(levels)
      expect(patchSlots(levels)).toBe(levels)
      expect(hash(p)).not.toBe(KEPT)
      expect(p.material.fragmentShader).toContain('uniform sampler2D uPatch' + (levels - 1) + ';')
      expect(p.material.fragmentShader).not.toContain('uniform sampler2D uPatch' + levels + ';')
      expect((p.material.uniforms.uPatchScale!.value as number[]).length).toBe(levels)
      expect(p.material.uniforms.uPatchCount!.value).toBe(levels)
    }
    expect(() => planetWith(MAX_PATCHES + 1)).toThrow('too many patch levels')
  })

  it('stays inside the texture units the film asks of a device with every level bound', () => {
    const units = needs('full', config.formatKeys.master).limits.MAX_TEXTURE_IMAGE_UNITS!
    const p = planetWith(MAX_PATCHES)
    const samplers = (p.material.fragmentShader.match(/^uniform sampler\w+ \w+;$/gm) ?? []).length + (p.material.vertexShader.match(/^uniform sampler\w+ \w+;$/gm) ?? []).length
    const bound = Object.values(p.material.uniforms).filter((u) => (u.value as { isTexture?: boolean } | null)?.isTexture).length
    expect(samplers).toBe(3 + MAX_PATCHES)
    expect(bound).toBe(samplers)
    expect(samplers).toBeLessThanOrEqual(units)
  })
})
