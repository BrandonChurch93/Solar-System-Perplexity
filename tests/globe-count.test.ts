import { createHash } from 'node:crypto'
import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { capHeights, capVert, type CapOptions } from '../src/bodies/cap'
import { Planet, type PatchSet } from '../src/bodies/planet'
import * as look from '../src/stops/mars/look'
import { frozen } from './globe-frozen'

const KEPT = '81b0189383d53555c8623467df803b233644cf143249b11aa3e3a28f5548a308'
const hash = (text: string): string => createHash('sha256').update(frozen(text)).digest('hex')
const WIDTHS = [40, 10, 3]
const FULL = [4096, 3686, 2176]
const WEB = [2048, 1843, 1088]

const sized = (width: number): THREE.Texture => {
  const t = new THREE.Texture()
  t.image = { width, height: width } as unknown as HTMLImageElement
  return t
}

const patches = (sizes: number[], counts?: number[]): PatchSet => ({ textures: sizes.map(sized), widthsDeg: WIDTHS, spot: new THREE.Vector3(0, 0, 1), feather: 0.1, fade: [1.1, 1.7], nearDeg: 0, ...(counts ? { counts } : {}) })

const level = (widthDeg: number, size: number, count?: number): CapOptions['levels'][number] => ({ height: capHeights(new Uint16Array(size * size), size), size, widthDeg, low: -0.002, high: 0.001, ...(count !== undefined ? { count } : {}) })
const cap = (size: number, count?: number): CapOptions => ({ levels: [8.5, 3.8, 1.6].map((w) => level(w, size, count)), border: [0.065, 0.074], from: [2, 1.2], cells: 128, pixel: 2e-4 })

const planet = (mapWidth: number, p?: PatchSet, c?: CapOptions): Planet => {
  const t = new THREE.Texture()
  return new Planet({ map: t, mapWidth, height: t, heightWidth: 8, light: look.light, haze: look.haze, grazing: look.grazing, ...(p ? { patches: p } : {}), ...(c ? { cap: c } : {}) })
}

const sizes = (p: Planet): number[] => (p.material.uniforms.uPatchSize!.value as number[]).slice(0, WIDTHS.length)

describe('the texels a level is counted by', () => {
  it('are the loaded widths while a stop names none, with the text of the globe as it was', () => {
    const full = planet(8192, patches(FULL))
    const web = planet(4096, patches(WEB))
    expect(sizes(full)).toEqual(FULL)
    expect(sizes(web)).toEqual(WEB)
    expect(hash(planet(8).material.fragmentShader)).toBe(KEPT)
    expect(full.material.fragmentShader).toBe(web.material.fragmentShader)
    full.dispose()
    web.dispose()
  })

  it('are the widths the stop names in both sets, so the smaller set brings every colour level in at the height of the full one', () => {
    const full = planet(8192, patches(FULL, FULL))
    const web = planet(8192, patches(WEB, FULL))
    const plain = planet(8192, patches(FULL))
    expect(sizes(web)).toEqual(FULL)
    expect(sizes(full)).toEqual(sizes(plain))
    expect(web.material.uniforms.uMapWidth!.value).toBe(full.material.uniforms.uMapWidth!.value)
    expect(web.material.fragmentShader).toBe(plain.material.fragmentShader)
    for (const k of ['uPatchScale', 'uPatchFade', 'uFeather']) expect(web.material.uniforms[k]!.value).toEqual(plain.material.uniforms[k]!.value)
    for (const p of [full, web, plain]) p.dispose()
  })

  it('refuses counts that are not one width above 0 for each level', () => {
    expect(() => planet(8, patches(WEB, [4096, 3686]))).toThrow('one width above 0 per patch level')
    expect(() => planet(8, patches(WEB, [4096, 0, 2176]))).toThrow('one width above 0 per patch level')
  })

  it('leave the cap as it was while no height level names a count', () => {
    const p = planet(8, undefined, cap(4))
    const c = p.cap!
    expect(c.material.uniforms.uCapCount).toBeUndefined()
    expect(c.material.vertexShader).toBe(capVert([false, false, false], c.gridsDeg.length))
    expect(c.material.vertexShader).not.toContain('uCapCount')
    p.dispose()
  })

  it('bring a height level of the cap in by the named count and read its heights by the loaded size', () => {
    const web = planet(8, undefined, cap(4, 8))
    const plain = planet(8, undefined, cap(4))
    const c = web.cap!
    const text = c.material.vertexShader
    expect(c.material.uniforms.uCapCount!.value).toEqual([8, 8, 8])
    expect(c.material.uniforms.uCapSize!.value).toEqual([4, 4, 4])
    expect(text).toBe(capVert([false, false, false], c.gridsDeg.length, false, true))
    const off = plain.cap!.material.vertexShader
    const line = (j: number, name: string): string => `foot * uCapScale[${j}] * ${name}[${j}]);`
    expect(text.replace('\nuniform float uCapCount[3];', '').replace(line(0, 'uCapCount'), line(0, 'uCapSize')).replace(line(1, 'uCapCount'), line(1, 'uCapSize'))).toBe(off)
    for (let j = 0; j < 3; j++) expect(text).toContain(`float lod = log2(max(max(foot, cell) * uCapScale[${j}] * uCapSize[${j}], 1.0));`)
    expect(() => planet(8, undefined, cap(4, 0))).toThrow('a width above 0')
    web.dispose()
    plain.dispose()
  })
})
