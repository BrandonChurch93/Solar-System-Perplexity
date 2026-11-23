import { createHash } from 'node:crypto'
import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { Planet, type PatchSet } from '../src/bodies/planet'
import { config } from '../src/config'
import { needs } from '../src/core/caps'
import * as look from '../src/stops/mars/look'

const KEPT = '81b0189383d53555c8623467df803b233644cf143249b11aa3e3a28f5548a308'

function planetWith(levels: number, more: Partial<PatchSet> = {}, anisotropy = 16): Planet {
  const t = new THREE.Texture()
  const level = (): THREE.Texture => {
    const x = new THREE.Texture()
    x.anisotropy = anisotropy
    return x
  }
  return new Planet({
    map: t, mapWidth: 8, height: t, heightWidth: 8, light: look.light, haze: look.haze, grazing: look.grazing,
    patches: { textures: Array.from({ length: levels }, level), widthsDeg: Array.from({ length: levels }, (_, i) => 96 / 2 ** i), spot: new THREE.Vector3(0, 0, 1), feather: 0.1, fade: [1, 2], nearDeg: 3, ...more },
  })
}

const hash = (p: Planet): string => createHash('sha256').update(p.material.fragmentShader).digest('hex')
const count = (text: string, part: string): number => text.split(part).length - 1

describe('the options of the patch levels', () => {
  it('keeps the shader text and the uniforms of the frozen build while no option is on', () => {
    const plain = planetWith(5)
    const names = Object.keys(plain.material.uniforms).sort()
    for (const more of [{}, { own: [false, false, false, false, false] }, { fadeMinor: false }, { own: [false, false, false, false, false], fadeMinor: false }]) {
      const p = planetWith(5, more)
      expect(hash(p)).toBe(KEPT)
      expect(Object.keys(p.material.uniforms).sort()).toEqual(names)
    }
    expect(names).not.toContain('uPatchOwn')
    expect(names).not.toContain('uPatchAniso')
    expect(names).not.toContain('uMapAniso')
  })

  it('shows a level in its own light only for a stop that marks one', () => {
    const p = planetWith(4, { own: [false, false, true, true] })
    const text = p.material.fragmentShader
    expect(hash(p)).not.toBe(KEPT)
    expect(text).toContain('uniform float uPatchOwn[6];')
    for (let i = 0; i < 6; i++) expect(text).toContain('float o = uPatchOwn[' + i + '];')
    expect(count(text, 'albedo = mix(albedo, t, w * (1.0 - o));')).toBe(6)
    expect(count(text, 'ownSum = ownSum * (1.0 - w) + t * (w * o);')).toBe(6)
    expect(count(text, 'own = own * (1.0 - w) + w * o;')).toBe(6)
    expect(text).toContain('vec3 col = lin * shade * uTint;\n  if (own > 0.0) col = mix(col, inverseFilmic(ownSum / own), own);')
    expect(text).not.toContain('uPatchAniso')
    expect(p.material.uniforms.uPatchOwn!.value).toEqual([0, 0, 1, 1, 0, 0])
    expect(() => planetWith(4, { own: [true] })).toThrow('own needs one entry per patch level')
  })

  it('leaves the haze, the gain and the texels view of an own level as they are', () => {
    const plain = planetWith(4).material.fragmentShader
    const own = planetWith(4, { own: [false, false, true, true] }).material.fragmentShader
    const tail = (text: string): string => text.slice(text.indexOf('  vec3 at;\n  float tau = hazeDepth'))
    expect(tail(own)).toBe(tail(plain))
    expect(count(own, 'texels = mix(texels, parent, step(0.5, w));')).toBe(6)
    expect(count(own, 'near = max(near, w * uPatchNear[')).toBe(6)
  })

  it('fades the levels on the fine axis of the pixel footprint only for a stop that asks for it', () => {
    const p = planetWith(8, { fadeMinor: true })
    const text = p.material.fragmentShader
    expect(hash(p)).not.toBe(KEPT)
    expect(text).toContain('uniform float uPatchAniso[8];')
    expect(text).toContain('uniform float uMapAniso;')
    expect(text).toContain('float ga = abs(gx.x * gy.y - gx.y * gy.x) / max(gd, 1e-20);')
    for (let i = 0; i < 8; i++) expect(text).toContain('float cap = gd / uPatchAniso[' + i + '] * uPatchScale[' + i + '] * uPatchSize[' + i + '];')
    expect(count(text, 'fine = max(thin, cap);')).toBe(9)
    expect(count(text, 'drawn = mix(drawn, thin / max(cap, 1.0), step(0.5, w));')).toBe(8)
    expect(count(text, 'smoothstep(uPatchFade.x, uPatchFade.y, fine)')).toBe(8)
    expect(count(text, 'smoothstep(uPatchFade.x, uPatchFade.y, parent)')).toBe(0)
    expect(count(text, 'texels = mix(texels, parent, step(0.5, w));')).toBe(8)
    expect(text).toContain('if (uDiag == 2 && uPatchCount > 0.5) outColor.b = clamp(drawn * 0.5, 0.0, 1.0);')
    expect(text).not.toContain('uPatchOwn')
  })

  it('caps the fine axis by the anisotropy each texture really has', () => {
    const p = planetWith(7, { fadeMinor: true }, 4)
    expect(p.material.uniforms.uPatchAniso!.value).toEqual([4, 4, 4, 4, 4, 4, 4])
    expect(p.material.uniforms.uMapAniso!.value).toBe(1)
    const short = planetWith(3, { fadeMinor: true }, 16)
    expect(short.material.uniforms.uPatchAniso!.value).toEqual([16, 16, 16, 1, 1, 1])
  })

  it('adds no sampler with either option', () => {
    const units = needs('full', config.formatKeys.master).limits.MAX_TEXTURE_IMAGE_UNITS!
    const p = planetWith(10, { own: Array.from({ length: 10 }, (_, i) => i > 4), fadeMinor: true })
    const samplers = (p.material.fragmentShader.match(/^uniform sampler\w+ \w+;$/gm) ?? []).length
    expect(samplers).toBe(13)
    expect(samplers).toBeLessThanOrEqual(units)
  })
})
