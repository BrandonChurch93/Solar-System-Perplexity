import * as THREE from 'three'
import { afterEach, describe, expect, it } from 'vitest'
import { FarPoint } from '../src/bodies/farpoint'
import { Planet } from '../src/bodies/planet'
import { config } from '../src/config'
import { bufferFrame, frameUniform, setFrame, setPass } from '../src/core/frame'
import type { RenderView } from '../src/core/types'
import * as look from '../src/stops/mars/look'

const MASTER = config.raw.formats.master.height

function planet(): Planet {
  const t = new THREE.Texture()
  return new Planet({
    map: t, mapWidth: 8, height: t, heightWidth: 8, light: look.light, haze: look.haze, grazing: look.grazing,
    patches: { textures: [new THREE.Texture(), new THREE.Texture()], widthsDeg: [40, 10], spot: new THREE.Vector3(0, 0, 1), feather: 0.1, fade: [1.1, 1.7], nearDeg: 0 },
  })
}

const view = (id: string, farLight?: number): RenderView => ({ camera: new THREE.PerspectiveCamera(), diag: 'beauty', format: config.formats[id]!, sample: 0, samples: 1, cameraPosition: new THREE.Vector3(), ...(farLight === undefined ? {} : { farLight }) })

const fade = (p: Planet): number[] => {
  p.update(new THREE.Vector3(0, 0, 3), new THREE.Vector3(1, 0, 0), 0, 1, 1)
  return (p.material.uniforms.uPatchFade!.value as THREE.Vector2).toArray()
}

const point = (f: FarPoint): { wide: number; colour: number[] } => {
  const u = (f.points.material as THREE.ShaderMaterial).uniforms
  return { wide: u.uWide!.value as number, colour: (u.uColor!.value as THREE.Vector3).toArray() }
}

describe('the frame factor of the globe', () => {
  afterEach(() => {
    setFrame(MASTER, MASTER)
    setPass(1)
  })

  it('is the height of the format over the height of the master: 1 at 16 by 9, 2 at uhd, 0.5 at preview', () => {
    expect(frameUniform.value).toBe(1)
    for (const [id, f] of [[config.formatKeys.master, 1], [config.formatKeys.uhd, 2], [config.formatKeys.preview, 0.5]] as const) {
      setFrame(config.formats[id]!.height, MASTER)
      expect(frameUniform.value).toBe(f)
    }
    expect(() => setFrame(0, MASTER)).toThrow('no height')
  })

  it('takes the scale of a place picture against the master\'s into the factor of what is drawn into it: a uhd picture of half the scale has the master\'s pixels and the master\'s fade', () => {
    const p = planet()
    setFrame(2160, MASTER)
    setPass(0.5)
    expect(bufferFrame()).toBe(1)
    expect(frameUniform.value).toBe(2)
    expect(fade(p)).toEqual(new THREE.Vector2(1.1, 1.7).toArray())
    const f = new FarPoint()
    f.update(3, view(config.formatKeys.uhd, 0.7), [0.5, 0.4, 0.3], 2)
    const there = point(f)
    setFrame(MASTER, MASTER)
    setPass(1)
    f.update(3, view(config.formatKeys.master, 0.7), [0.5, 0.4, 0.3], 2)
    expect(point(f).wide).toBe(there.wide)
    setFrame(2160, MASTER)
    expect(fade(p)).toEqual([0.55, 0.85])
    expect(() => setPass(0)).toThrow('above 0')
    f.dispose()
    p.dispose()
  })

  it('leaves the fade of the colour levels as the stop gave it at 16 by 9 and divides it by the factor elsewhere, so a level comes in at the same height in every format', () => {
    const p = planet()
    expect(fade(p)).toEqual(new THREE.Vector2(1.1, 1.7).toArray())
    setFrame(2160, MASTER)
    expect(fade(p)).toEqual([0.55, 0.85])
    setFrame(540, MASTER)
    expect(fade(p)).toEqual([2.2, 3.4])
    setFrame(MASTER, MASTER)
    expect(fade(p)).toEqual([1.1, 1.7])
    p.dispose()
  })

  it('draws the far point of a body with the numbers of today at 16 by 9', () => {
    const f = new FarPoint()
    for (const r of [0.3, 0.8, 2.5, 6]) {
      f.update(r, view(config.formatKeys.master), [0.5, 0.4, 0.3], 2)
      const far = point(f)
      expect(far.wide).toBe(0)
      const smooth = (x: number): number => { const t = Math.min(Math.max(x, 0), 1); return t * t * (3 - 2 * t) }
      const k = (1 - smooth((r - 0.0015 * 1080) / (0.014 * 1080))) * 2 * (5 + 9 * Math.min(r, 1))
      expect(far.colour).toEqual(new THREE.Vector3(0.5, 0.4, 0.3).addScalar(0.35).multiplyScalar(k).toArray())
      f.update(r, view(config.formatKeys.master, 0.7), [0.5, 0.4, 0.3], 2)
      expect(point(f).wide).toBe(0.9 + 0.3 * r * r)
    }
    f.dispose()
  })

  it('draws the far point at uhd as at 16 by 9, only finer: the same light for the same angle and a core of the same angle', () => {
    const f = new FarPoint()
    for (const lit of [undefined, 0.7]) for (const r of [0.3, 0.8, 2.5, 6]) {
      setFrame(MASTER, MASTER)
      f.update(r, view(config.formatKeys.master, lit), [0.5, 0.4, 0.3], 2)
      const one = point(f)
      setFrame(2160, MASTER)
      f.update(2 * r, view(config.formatKeys.uhd, lit), [0.5, 0.4, 0.3], 2)
      const two = point(f)
      two.colour.forEach((v, c) => expect(v).toBeCloseTo(one.colour[c]!, 12))
      expect(two.wide).toBeCloseTo(4 * (lit === undefined ? 0.9 : one.wide), 12)
      setFrame(540, MASTER)
      f.update(0.5 * r, view(config.formatKeys.preview, lit), [0.5, 0.4, 0.3], 2)
      const half = point(f)
      half.colour.forEach((v, c) => expect(v).toBeCloseTo(one.colour[c]!, 12))
      expect(half.wide).toBeCloseTo(one.wide, 12)
    }
    f.dispose()
  })
})
