import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import type { RenderView, SetContext } from '../src/core/types'
import { Relief, withPresence, type ReliefAir, type ReliefDef, type ReliefMotion } from '../src/terrain/relief'

// The presence of a relief (Relief.presence): off until a set asks, then the same shader with its premultiplied output times a share,
// and no shield under 1. The pixels are tests/relief-gl.test.ts.

const LIT = 'vec4(col * alpha, alpha)'
const AIR_LIT = 'vec4(glow * uGain * vig, cut)'

const picture = (): THREE.Texture => {
  const t = new THREE.Texture()
  t.image = { width: 8, height: 8 }
  return t
}

const ctx = {
  texture: async () => picture(),
  buffer: async () => new Float32Array(4).fill(5).buffer,
} as unknown as SetContext

const def: ReliefDef = {
  imageSize: [32, 16],
  vfovDeg: 40,
  layers: [
    { color: 'far-color.jpg', dist: 'far.bin', box: [0, 0, 32, 16], distSize: [2, 2], tint: [1, 1, 1] },
    { color: 'near-color.jpg', alpha: 'near-alpha.png', dist: 'near.bin', box: [8, 4, 16, 8], distSize: [2, 2], tint: [1, 1, 1] },
  ],
  masks: 'masks.png',
  maskBox: [0, 0, 32, 16],
  mistDir: [1, 0],
}

const air: ReliefAir = { pitchDeg: 0, dipDeg: 0, cool: [0.1, 0.2, 0.3], coolScaleDeg: 10, warm: [0.3, 0.2, 0.1], warmScaleDeg: 5, side: [1, 1], warmSide: [1, 1, 0, 1], starScaleDeg: 10, starCut: 0.5, veil: 0.2 }
const motion = (withAir: boolean): ReliefMotion => ({ mistSpeed: 0, dustSpeed: 0, dustDir: [1, 0], mesh: 4, ...(withAir ? { air } : {}) })

const materials = (r: Relief): THREE.ShaderMaterial[] => {
  const out: THREE.ShaderMaterial[] = []
  r.group.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined
    if (m) out.push(m)
  })
  return out
}

const litOf = (m: THREE.ShaderMaterial): string => (m.fragmentShader.includes(LIT) ? LIT : AIR_LIT)

describe('the presence of a relief', () => {
  it('is off until a set asks: no share in any shader, no uniform', async () => {
    for (const withAir of [false, true]) {
      const r = await Relief.load(ctx, '', def, motion(withAir))
      const all = materials(r)
      expect(all.length).toBe(withAir ? 3 : 2)
      for (const m of all) {
        expect(m.fragmentShader.includes('uPresence')).toBe(false)
        expect(m.uniforms.uPresence).toBeUndefined()
      }
    }
  })

  it('the first call gives every layer and the air the same shader with the share, and one uniform for all', async () => {
    for (const withAir of [false, true]) {
      const plain = materials(await Relief.load(ctx, '', def, motion(withAir)))
      const r = await Relief.load(ctx, '', def, motion(withAir))
      const all = materials(r)
      const versions = all.map((m) => m.version)
      r.presence(0.4)
      all.forEach((m, i) => {
        const before = plain[i]!.fragmentShader
        expect(m.fragmentShader).toBe(withPresence(before, litOf(plain[i]!)))
        expect(m.fragmentShader.length).toBe(before.length + '\nuniform float uPresence;'.length + ' * uPresence'.length)
        expect(m.fragmentShader.includes(litOf(plain[i]!) + ' * uPresence')).toBe(true)
        expect(m.vertexShader).toBe(plain[i]!.vertexShader)
        expect(m.uniforms.uPresence).toBe(all[0]!.uniforms.uPresence)
        expect(m.uniforms.uPresence!.value).toBe(0.4)
        expect(m.version).toBe(versions[i]! + 1)
      })
      const texts = all.map((m) => m.fragmentShader)
      r.presence(0.7)
      r.presence(1)
      r.presence(0)
      all.forEach((m, i) => {
        expect(m.fragmentShader).toBe(texts[i])
        expect(m.version).toBe(versions[i]! + 1)
        expect(m.uniforms.uPresence!.value).toBe(0)
      })
    }
  })

  it('refuses a share that is no share and changes nothing by it', async () => {
    const r = await Relief.load(ctx, '', def, motion(true))
    const texts = materials(r).map((m) => m.fragmentShader)
    for (const bad of [-0.01, 1.01, Number.NaN, Number.POSITIVE_INFINITY]) expect(() => r.presence(bad)).toThrow(/share from 0 to 1/)
    expect(materials(r).map((m) => m.fragmentShader)).toEqual(texts)
    r.presence(0.5)
    expect(() => r.presence(2)).toThrow(/share from 0 to 1/)
    expect(materials(r)[0]!.uniforms.uPresence!.value).toBe(0.5)
  })

  it('is no shield under 1 and the shield it was at 1', async () => {
    const r = await Relief.load(ctx, '', def, motion(false))
    let asked = 0
    const renderer = { getContext: () => { asked++; throw new Error('the shield reads its alpha') } } as unknown as THREE.WebGLRenderer
    const camera = new THREE.PerspectiveCamera(40, 2, 0.1, 100)
    r.presence(0.999)
    expect(r.screen(renderer, camera, 32, 16, 8)).toBe(false)
    r.presence(0)
    expect(r.screen(renderer, camera, 32, 16, 8)).toBe(false)
    expect(asked).toBe(0)
    r.presence(1)
    expect(() => r.screen(renderer, camera, 32, 16, 8)).toThrow(/the shield reads its alpha/)
    expect(asked).toBe(1)
  })

  it('a relief that never asks is the shield it was', async () => {
    const r = await Relief.load(ctx, '', def, motion(false))
    let asked = 0
    const renderer = { getContext: () => { asked++; throw new Error('the shield reads its alpha') } } as unknown as THREE.WebGLRenderer
    expect(() => r.screen(renderer, new THREE.PerspectiveCamera(40, 2, 0.1, 100), 32, 16, 8)).toThrow(/the shield reads its alpha/)
    expect(asked).toBe(1)
  })

  it('the update of a relief with a presence leaves the share alone', async () => {
    const r = await Relief.load(ctx, '', def, motion(true))
    r.presence(0.25)
    r.update(1.5, 2, 0.3, { format: { width: 1920, height: 1080 } } as unknown as RenderView)
    for (const m of materials(r)) expect(m.uniforms.uPresence!.value).toBe(0.25)
  })

  it('the shader with the share needs one place for it and refuses none or two', () => {
    const one = 'precision highp float;\nout vec4 outColor;\nvoid main() { outColor = vec4(col * alpha, alpha); }'
    expect(withPresence(one, LIT)).toBe('precision highp float;\nout vec4 outColor;\nuniform float uPresence;\nvoid main() { outColor = vec4(col * alpha, alpha) * uPresence; }')
    expect(() => withPresence(one.replace(LIT, 'vec4(1.0)'), LIT)).toThrow(/no single place/)
    expect(() => withPresence(one + ' vec4(col * alpha, alpha)', LIT)).toThrow(/no single place/)
    expect(() => withPresence(one.replace('out vec4 outColor;', ''), LIT)).toThrow(/no single place/)
    expect(() => withPresence(withPresence(one, LIT), LIT)).toThrow(/no single place/)
  })
})
