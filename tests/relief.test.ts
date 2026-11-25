import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import type { RenderView, SetContext } from '../src/core/types'
import { frameUniform } from '../src/core/frame'
import { DETAIL_GLSL, EDGE_AIR_GLSL, EDGE_GLSL, LAW_GLSL, Relief, detailShareAt, edgeShareAt, lawUniforms, withDetail, withEdge, withEdgeEye, withEyeScale, withLaw, withPresence, type ReliefAir, type ReliefDef, type ReliefMotion } from '../src/terrain/relief'

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

// The eye of the layers under a scaled group (Relief.update): off until a relief finds its group scaled, then the same vertex shader with
// the eye times 1 over the square of the scale. The pixels are tests/relief-gl.test.ts.

const EYE = 'vEye = -transpose(mat3(modelViewMatrix)) * modelViewMatrix[3].xyz;'
const view = { format: { width: 1920, height: 1080 } } as unknown as RenderView
const layersOf = (r: Relief): THREE.ShaderMaterial[] => materials(r).filter((m) => m.vertexShader.includes('vEye'))

describe('the eye of a relief under a scaled group', () => {
  it('a relief whose group is never scaled keeps its shaders to the letter, turned, moved and under a turned parent alike', async () => {
    for (const withAir of [false, true]) {
      const plain = materials(await Relief.load(ctx, '', def, motion(withAir)))
      const r = await Relief.load(ctx, '', def, motion(withAir))
      const all = materials(r)
      const versions = all.map((m) => m.version)
      const parent = new THREE.Group()
      parent.add(r.group)
      r.update(0, 1, 0, view)
      parent.position.set(3, -2, 7)
      parent.quaternion.setFromAxisAngle(new THREE.Vector3(1, 2, 3).normalize(), 1.1)
      r.group.position.set(-0.4, 0.2, 5)
      r.group.quaternion.setFromAxisAngle(new THREE.Vector3(-2, 1, 0.5).normalize(), -2.3)
      r.update(1, 1, 0, view)
      all.forEach((m, i) => {
        expect(m.vertexShader).toBe(plain[i]!.vertexShader)
        expect(m.fragmentShader).toBe(plain[i]!.fragmentShader)
        expect(m.uniforms.uEyeScale).toBeUndefined()
        expect(m.version).toBe(versions[i])
      })
      expect(layersOf(r).length).toBe(2)
      expect(layersOf(r).every((m) => m.vertexShader.split(EYE).length === 2)).toBe(true)
    }
  })

  it('the first update under a scale gives every layer the eye over the square of the scale, one uniform for all, and leaves the air alone', async () => {
    const plain = materials(await Relief.load(ctx, '', def, motion(true)))
    const r = await Relief.load(ctx, '', def, motion(true))
    const all = materials(r)
    const versions = all.map((m) => m.version)
    r.group.scale.setScalar(0.001)
    r.update(0, 1, 0, view)
    let layers = 0
    all.forEach((m, i) => {
      const before = plain[i]!.vertexShader
      expect(m.fragmentShader).toBe(plain[i]!.fragmentShader)
      if (!before.includes('vEye')) {
        expect(m.vertexShader).toBe(before)
        expect(m.uniforms.uEyeScale).toBeUndefined()
        expect(m.version).toBe(versions[i])
        return
      }
      layers++
      expect(m.vertexShader).toBe(withEyeScale(before))
      expect(m.vertexShader.length).toBe(before.length + '\nuniform float uEyeScale;'.length + ' * uEyeScale'.length)
      expect(m.vertexShader.includes(EYE)).toBe(false)
      expect(m.vertexShader.includes(EYE.slice(0, -1) + ' * uEyeScale;')).toBe(true)
      expect(m.uniforms.uEyeScale).toBe(layersOf(r)[0]!.uniforms.uEyeScale)
      expect(m.uniforms.uEyeScale!.value / 1e6).toBeCloseTo(1, 12)
      expect(m.version).toBe(versions[i]! + 1)
    })
    expect(layers).toBe(2)
    const texts = all.map((m) => m.vertexShader)
    const after = all.map((m) => m.version)
    r.group.scale.setScalar(0.25)
    r.update(0, 1, 0, view)
    expect(layersOf(r)[0]!.uniforms.uEyeScale!.value).toBeCloseTo(16, 12)
    r.group.scale.setScalar(1)
    r.update(0, 1, 0, view)
    expect(layersOf(r)[0]!.uniforms.uEyeScale!.value).toBe(1)
    all.forEach((m, i) => {
      expect(m.vertexShader).toBe(texts[i])
      expect(m.version).toBe(after[i])
    })
  })

  it('takes the scale of the whole chain above the group and is 1 to the bit where the chain has none', async () => {
    const r = await Relief.load(ctx, '', def, motion(false))
    const world = new THREE.Group()
    const side = new THREE.Group()
    world.add(side)
    side.add(r.group)
    world.scale.setScalar(0.5)
    side.quaternion.setFromAxisAngle(new THREE.Vector3(0.3, 1, -0.2).normalize(), 0.7)
    side.position.set(1, 2, 3)
    r.group.scale.setScalar(0.1)
    r.update(0, 1, 0, view)
    expect(layersOf(r)[0]!.uniforms.uEyeScale!.value).toBeCloseTo(400, 9)
    world.scale.setScalar(1)
    r.group.scale.setScalar(1)
    world.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0.4, 0.9).normalize(), 2.9)
    r.update(0, 1, 0, view)
    expect(layersOf(r)[0]!.uniforms.uEyeScale!.value).toBe(1)
  })

  it('goes with a presence: the share in the fragment shader, the scale in the vertex shader', async () => {
    const plain = materials(await Relief.load(ctx, '', def, motion(false)))
    const r = await Relief.load(ctx, '', def, motion(false))
    r.presence(0.5)
    r.group.scale.setScalar(0.002)
    r.update(0, 1, 0, view)
    materials(r).forEach((m, i) => {
      expect(m.fragmentShader).toBe(withPresence(plain[i]!.fragmentShader, LIT))
      expect(m.vertexShader).toBe(withEyeScale(plain[i]!.vertexShader))
      expect(m.uniforms.uPresence!.value).toBe(0.5)
      expect(m.uniforms.uEyeScale!.value / 250000).toBeCloseTo(1, 12)
    })
  })

  it('the shader with the scale needs one place for it and refuses none or two', () => {
    const one = 'out vec3 vEye;\nvoid main() {\n  ' + EYE + '\n}'
    expect(withEyeScale(one)).toBe('out vec3 vEye;\nuniform float uEyeScale;\nvoid main() {\n  vEye = -transpose(mat3(modelViewMatrix)) * modelViewMatrix[3].xyz * uEyeScale;\n}')
    expect(() => withEyeScale(one.replace(EYE, 'vEye = vec3(0.0);'))).toThrow(/no single place/)
    expect(() => withEyeScale(one + EYE)).toThrow(/no single place/)
    expect(() => withEyeScale(one.replace('out vec3 vEye;', ''))).toThrow(/no single place/)
    expect(() => withEyeScale(withEyeScale(one))).toThrow(/no single place/)
  })
})

// The edge of a relief (Relief.presenceEdge): off until a set asks, then the same shaders with their premultiplied output times a share by
// the place in the whole source picture, and no shield inside the feather. The pixels are tests/relief-gl.test.ts.

const THIN = 'if (alpha < 0.004) discard;'
const wide: ReliefDef = {
  ...def,
  layers: [
    { color: 'far-color.jpg', dist: 'far.bin', box: [-8, 0, 48, 20], distSize: [2, 2], tint: [1, 1, 1] },
    { color: 'near-color.jpg', alpha: 'near-alpha.png', dist: 'near.bin', box: [-8, 4, 24, 16], distSize: [2, 2], tint: [1, 1, 1] },
    { color: 'mid-color.jpg', alpha: 'mid-alpha.png', dist: 'mid.bin', box: [16, 4, 24, 8], distSize: [2, 2], tint: [1, 1, 1] },
  ],
}
const grids = (r: Relief): { nx: number; ny: number; cols: number; left: number; image: Float32Array; inside: Uint8Array | null }[] =>
  (r as unknown as { layers: { grid: { nx: number; ny: number; cols: number; left: number; image: Float32Array; inside: Uint8Array | null } }[] }).layers.map((l) => l.grid)

describe('the edge of a relief', () => {
  it('is off until a set asks: no edge in any shader, no uniform, no cell kept from the shield', async () => {
    for (const withAir of [false, true]) {
      const r = await Relief.load(ctx, '', def, motion(withAir))
      r.presence(0.5)
      r.update(1.5, 2, 0.3, view)
      for (const m of materials(r)) {
        expect(m.fragmentShader.includes('edgeShare')).toBe(false)
        expect(m.fragmentShader.includes('uEdge')).toBe(false)
        expect(m.vertexShader.includes('vEdgeEye')).toBe(false)
        expect(Object.keys(m.uniforms).some((k) => k.startsWith('uEdge'))).toBe(false)
      }
      for (const g of grids(r)) expect(g.inside).toBe(null)
    }
  })

  it('the first call gives every layer and the air the shader with the edge and one pair of numbers for all; later calls change numbers only', async () => {
    for (const withAir of [false, true]) {
      const plain = materials(await Relief.load(ctx, '', def, motion(withAir)))
      const r = await Relief.load(ctx, '', def, motion(withAir))
      const all = materials(r)
      const versions = all.map((m) => m.version)
      r.presenceEdge([0, 8, 4, 0])
      all.forEach((m, i) => {
        const air = litOf(plain[i]!) === AIR_LIT
        expect(m.fragmentShader).toBe(withEdge(plain[i]!.fragmentShader, litOf(plain[i]!)))
        expect(m.fragmentShader.includes(air ? AIR_LIT + ' * edgeShare(edgeAirImage(d))' : LIT + ' * edgeShare(vImage)')).toBe(true)
        expect(m.fragmentShader.includes(EDGE_GLSL)).toBe(true)
        expect(m.fragmentShader.includes(EDGE_AIR_GLSL)).toBe(air)
        expect(m.fragmentShader.includes('if (alpha < 0.004 || edgeShare(vImage) <= 0.0) discard;')).toBe(!air)
        expect(m.vertexShader).toBe(air ? withEdgeEye(plain[i]!.vertexShader) : plain[i]!.vertexShader)
        expect(m.uniforms.uEdgeSide).toBe(all[0]!.uniforms.uEdgeSide)
        expect(m.uniforms.uEdgeOver).toBe(all[0]!.uniforms.uEdgeOver)
        expect(m.uniforms.uEdgeFar === undefined).toBe(!air)
        expect(m.uniforms.uEyeScale === undefined).toBe(!air)
        expect(m.version).toBe(versions[i]! + 1)
      })
      // The sides are those of the layers' boxes together, as places in the picture (0 to 1 over the image size); the feathers are in
      // its pixels: 8 of 32 across is a quarter, 4 of 16 down is a quarter.
      expect((all[0]!.uniforms.uEdgeSide!.value as THREE.Vector4).toArray()).toEqual([0, 1, 1, 0])
      expect((all[0]!.uniforms.uEdgeOver!.value as THREE.Vector4).toArray()).toEqual([0, 4, 4, 0])
      const texts = all.map((m) => m.fragmentShader + m.vertexShader)
      r.presenceEdge([16, 0, 0, 2])
      r.presenceEdge([0, 0, 0, 0])
      r.presenceEdge([4, 2, 1, 8])
      all.forEach((m, i) => {
        expect(m.fragmentShader + m.vertexShader).toBe(texts[i])
        expect(m.version).toBe(versions[i]! + 1)
      })
      expect((all[0]!.uniforms.uEdgeOver!.value as THREE.Vector4).toArray()).toEqual([8, 16, 16, 2])
      // The air stands for its edge at the farthest distance of the layers (5 in every picture of this relief), with the picture's own lens.
      if (withAir) {
        const far = all.find((m) => m.uniforms.uEdgeFar)!.uniforms.uEdgeFar!.value as THREE.Vector3
        const th = Math.tan((40 * Math.PI) / 360)
        expect(far.x).toBeCloseTo(5, 6)
        expect(far.y).toBeCloseTo(1 / (th * 2), 12)
        expect(far.z).toBeCloseTo(1 / th, 12)
      }
    }
  })

  it('leaves the air whole when the set says so: the layers get the edge, the air keeps its shaders and its uniforms to the letter', async () => {
    const plain = materials(await Relief.load(ctx, '', def, motion(true)))
    const r = await Relief.load(ctx, '', def, motion(true))
    const all = materials(r)
    const versions = all.map((m) => m.version)
    r.presenceEdge([0, 8, 4, 0], { air: false })
    const ground = all.find((_, i) => litOf(plain[i]!) !== AIR_LIT)!
    let airs = 0
    all.forEach((m, i) => {
      if (litOf(plain[i]!) === AIR_LIT) {
        airs++
        expect(m.fragmentShader).toBe(plain[i]!.fragmentShader)
        expect(m.vertexShader).toBe(plain[i]!.vertexShader)
        expect(Object.keys(m.uniforms).sort()).toEqual(Object.keys(plain[i]!.uniforms).sort())
        expect(m.version).toBe(versions[i])
      } else {
        expect(m.fragmentShader).toBe(withEdge(plain[i]!.fragmentShader, LIT))
        expect(m.uniforms.uEdgeSide).toBe(ground.uniforms.uEdgeSide)
        expect(m.version).toBe(versions[i]! + 1)
      }
    })
    expect(airs).toBe(1)
    // The numbers and the shield are those of the edge that ends the air too.
    const both = await Relief.load(ctx, '', def, motion(true))
    both.presenceEdge([0, 8, 4, 0])
    expect((ground.uniforms.uEdgeSide!.value as THREE.Vector4).toArray()).toEqual((materials(both).find((m) => m.uniforms.uEdgeSide)!.uniforms.uEdgeSide!.value as THREE.Vector4).toArray())
    expect((ground.uniforms.uEdgeOver!.value as THREE.Vector4).toArray()).toEqual((materials(both).find((m) => m.uniforms.uEdgeOver)!.uniforms.uEdgeOver!.value as THREE.Vector4).toArray())
    expect(grids(r).map((g) => Array.from(g.inside!))).toEqual(grids(both).map((g) => Array.from(g.inside!)))
    // The choice is the first call's: a later call may leave it out or name it again, and changes numbers only.
    const texts = all.map((m) => m.fragmentShader + m.vertexShader)
    r.presenceEdge([4, 2, 1, 8])
    r.presenceEdge([4, 2, 1, 8], { air: false })
    r.presenceEdge([0, 0, 0, 0], {})
    all.forEach((m, i) => expect(m.fragmentShader + m.vertexShader).toBe(texts[i]))
    // The other choice is another program: it throws, and leaves the numbers as they were.
    const before = (ground.uniforms.uEdgeOver!.value as THREE.Vector4).toArray()
    expect(() => r.presenceEdge([16, 16, 16, 16], { air: true })).toThrow(/chosen by the first call.*stays whole/)
    expect((ground.uniforms.uEdgeOver!.value as THREE.Vector4).toArray()).toEqual(before)
    expect(() => both.presenceEdge([16, 16, 16, 16], { air: false })).toThrow(/chosen by the first call.*ends with the ground/)
    both.presenceEdge([16, 16, 16, 16], { air: true })
    // A relief without air takes either word and has nothing to leave whole.
    const bare = await Relief.load(ctx, '', def, motion(false))
    bare.presenceEdge([0, 8, 4, 0], { air: false })
    for (const m of materials(bare)) expect(m.fragmentShader.includes('edgeShare(vImage)')).toBe(true)
  })

  it('takes its sides from the boxes of all layers together, margins and all', async () => {
    const r = await Relief.load(ctx, '', wide, motion(true))
    r.presenceEdge([4, 8, 2, 0])
    const m = materials(r)[0]!
    // Boxes: x from -8 to 40, y from 0 to 20, in a picture of 32 by 16.
    expect((m.uniforms.uEdgeSide!.value as THREE.Vector4).toArray()).toEqual([-8 / 32, 40 / 32, 20 / 16, 0])
    expect((m.uniforms.uEdgeOver!.value as THREE.Vector4).toArray()).toEqual([8, 4, 8, 0])
  })

  it('the share is 0 at a side and beyond it, 1 one feather inside, a half at half a feather, and never falls on the way in', () => {
    const side = [-0.25, 1.25, 1.25, 0]
    const over = [8, 4, 8, 0]
    // Right side at 1.25 with a feather of a quarter.
    expect(edgeShareAt(1.25, 0.5, side, over)).toBe(0)
    expect(edgeShareAt(1.4, 0.5, side, over)).toBe(0)
    expect(edgeShareAt(1.0, 0.5, side, over)).toBe(1)
    expect(edgeShareAt(0.5, 0.5, side, over)).toBe(1)
    expect(edgeShareAt(1.125, 0.5, side, over)).toBeCloseTo(0.5, 12)
    // Left side at -0.25 with a feather of an eighth, bottom side at 1.25 with an eighth.
    expect(edgeShareAt(-0.25, 0.5, side, over)).toBe(0)
    expect(edgeShareAt(-0.3, 0.5, side, over)).toBe(0)
    expect(edgeShareAt(-0.125, 0.5, side, over)).toBe(1)
    expect(edgeShareAt(-0.1875, 0.5, side, over)).toBeCloseTo(0.5, 12)
    expect(edgeShareAt(0.5, 1.25, side, over)).toBe(0)
    expect(edgeShareAt(0.5, 1.6, side, over)).toBe(0)
    expect(edgeShareAt(0.5, 1.125, side, over)).toBe(1)
    // The top does not fade: 1 on it and beyond it.
    expect(edgeShareAt(0.5, 0, side, over)).toBe(1)
    expect(edgeShareAt(0.5, -3, side, over)).toBe(1)
    // A corner is the product of its two sides.
    expect(edgeShareAt(1.125, 1.1875, side, over)).toBeCloseTo(0.25, 12)
    let last = 0
    for (let k = 0; k <= 400; k++) {
      const v = edgeShareAt(1.25 - (k / 400) * 0.25, 0.5, side, over)
      expect(v).toBeGreaterThanOrEqual(last)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
      last = v
    }
    expect(last).toBe(1)
    // No side fades: 1 everywhere.
    for (const [x, y] of [[-9, 0.5], [9, 0.5], [0.5, 9], [0.5, -9]]) expect(edgeShareAt(x!, y!, side, [0, 0, 0, 0])).toBe(1)
  })

  it('refuses feathers that are none and changes nothing by it', async () => {
    const r = await Relief.load(ctx, '', def, motion(true))
    const texts = materials(r).map((m) => m.fragmentShader)
    for (const bad of [[-1, 0, 0, 0], [0, Number.NaN, 0, 0], [0, 0, Number.POSITIVE_INFINITY, 0], [0, 0, 0], [0, 0, 0, 0, 0]]) {
      expect(() => r.presenceEdge(bad as unknown as [number, number, number, number])).toThrow(/four feathers of 0 or more pixels/)
    }
    expect(materials(r).map((m) => m.fragmentShader)).toEqual(texts)
    for (const g of grids(r)) expect(g.inside).toBe(null)
  })

  it('goes with a presence in either order: the two shares multiply', async () => {
    for (const first of ['edge', 'presence']) {
      const plain = materials(await Relief.load(ctx, '', def, motion(true)))
      const r = await Relief.load(ctx, '', def, motion(true))
      if (first === 'edge') r.presenceEdge([4, 4, 4, 0])
      r.presence(0.5)
      if (first !== 'edge') r.presenceEdge([4, 4, 4, 0])
      materials(r).forEach((m, i) => {
        const lit = litOf(plain[i]!)
        const edge = lit === AIR_LIT ? ' * edgeShare(edgeAirImage(d))' : ' * edgeShare(vImage)'
        expect(m.fragmentShader.includes(lit + (first === 'edge' ? ' * uPresence' + edge : edge + ' * uPresence'))).toBe(true)
        expect(m.uniforms.uPresence!.value).toBe(0.5)
        expect(m.uniforms.uEdgeSide).toBeDefined()
      })
    }
  })

  it('keeps from the shield every cell that does not stand whole inside the feather, and none without a feather', async () => {
    const r = await Relief.load(ctx, '', wide, motion(false))
    r.presenceEdge([0, 12, 0, 0])
    const m = materials(r)[0]!
    const side = (m.uniforms.uEdgeSide!.value as THREE.Vector4).toArray()
    const over = (m.uniforms.uEdgeOver!.value as THREE.Vector4).toArray()
    let kept = 0
    let whole = 0
    for (const g of grids(r)) {
      expect(g.inside!.length).toBe(g.nx * g.ny)
      for (let cj = 0; cj < g.ny; cj++) {
        for (let bi = 0; bi < g.nx; bi++) {
          const a = cj * g.cols + bi + g.left
          const least = Math.min(...[a, a + 1, a + g.cols, a + g.cols + 1].map((n) => edgeShareAt(g.image[n * 2]!, g.image[n * 2 + 1]!, side, over)))
          expect(g.inside![cj * g.nx + bi]).toBe(least < 1 ? 0 : 1)
          // The right side stands at x 40 of 32 and the feather is 12 wide: a cell is whole when its right end is at 28 of 32 or left of it.
          expect(g.inside![cj * g.nx + bi]).toBe(g.image[(a + 1) * 2]! <= 28 / 32 + 1e-9 ? 1 : 0)
          if (least < 1) kept++
          else whole++
        }
      }
    }
    expect(kept).toBeGreaterThan(0)
    expect(whole).toBeGreaterThan(0)
    r.presenceEdge([0, 0, 0, 0])
    for (const g of grids(r)) expect([...g.inside!].every((v) => v === 1)).toBe(true)
  })

  it('the shader with the edge needs one place for it and refuses none or two', () => {
    const one = 'precision highp float;\nin vec2 vImage;\nout vec4 outColor;\nvoid main() { if (alpha < 0.004) discard; outColor = vec4(col * alpha, alpha); }'
    const made = withEdge(one, LIT)
    expect(made).toBe('precision highp float;\nin vec2 vImage;' + EDGE_GLSL + '\nout vec4 outColor;\nvoid main() { if (alpha < 0.004 || edgeShare(vImage) <= 0.0) discard; outColor = vec4(col * alpha, alpha) * edgeShare(vImage); }')
    expect(() => withEdge(one.replace(LIT, 'vec4(1.0)'), LIT)).toThrow(/no single place/)
    expect(() => withEdge(one + ' vec4(col * alpha, alpha)', LIT)).toThrow(/no single place/)
    expect(() => withEdge(one.replace('in vec2 vImage;', ''), LIT)).toThrow(/no single place/)
    expect(() => withEdge(one.replace(THIN, ''), LIT)).toThrow(/no single place/)
    expect(() => withEdge(made, LIT)).toThrow(/no single place/)
    const sky = 'precision highp float;\nin vec3 vDir;\nout vec4 outColor;\nvoid main() { vec3 d = normalize(vDir); outColor = vec4(glow * uGain * vig, cut); }'
    expect(withEdge(sky, AIR_LIT)).toBe('precision highp float;\nin vec3 vDir;' + EDGE_GLSL + EDGE_AIR_GLSL + '\nout vec4 outColor;\nvoid main() { vec3 d = normalize(vDir); outColor = vec4(glow * uGain * vig, cut) * edgeShare(edgeAirImage(d)); }')
    expect(() => withEdge(sky.replace('in vec3 vDir;', ''), AIR_LIT)).toThrow(/no single place/)
    expect(() => withEdge(withEdge(sky, AIR_LIT), AIR_LIT)).toThrow(/no single place/)
    const vert = 'out vec3 vDir;\nvoid main() {\n  vDir = position;\n}'
    expect(withEdgeEye(vert)).toBe('out vec3 vDir;\nout vec3 vEdgeEye;\nuniform float uEyeScale;\nvoid main() {\n  vDir = position;\n  vEdgeEye = -transpose(mat3(modelViewMatrix)) * modelViewMatrix[3].xyz * uEyeScale;\n}')
    expect(() => withEdgeEye(vert.replace('vDir = position;', ''))).toThrow(/no single place/)
    expect(() => withEdgeEye(withEdgeEye(vert))).toThrow(/no single place/)
  })
})

// The air of a relief apart from its layers (Relief.presence with { air }): until a call names it one number serves both, as before;
// from then the air has a number of its own. The pixels are tests/relief-gl.test.ts.

describe('the presence of the air of a relief apart from its layers', () => {
  it('until a call names it one number serves layers and air, and the shaders are those of a presence to the letter', async () => {
    const plain = materials(await Relief.load(ctx, '', def, motion(true)))
    const r = await Relief.load(ctx, '', def, motion(true))
    const all = materials(r)
    r.presence(0.4)
    const one = all[0]!.uniforms.uPresence
    for (const m of all) expect(m.uniforms.uPresence).toBe(one)
    const texts = all.map((m) => m.fragmentShader)
    const versions = all.map((m) => m.version)
    r.presence(0.6, { air: 0.2 })
    all.forEach((m, i) => {
      const isAir = litOf(plain[i]!) === AIR_LIT
      expect(m.fragmentShader).toBe(texts[i])
      expect(m.fragmentShader).toBe(withPresence(plain[i]!.fragmentShader, litOf(plain[i]!)))
      expect(m.version).toBe(versions[i])
      expect(m.uniforms.uPresence!.value).toBe(isAir ? 0.2 : 0.6)
      expect(m.uniforms.uPresence === one).toBe(!isAir)
    })
    expect(all.filter((m) => m.uniforms.uPresence !== one).length).toBe(1)
  })

  it('names it at the first call as well, a later call without it sets both again, and 0 and 1 are shares', async () => {
    const r = await Relief.load(ctx, '', def, motion(true))
    const all = materials(r)
    const airs = all.filter((m) => m.fragmentShader.includes(AIR_LIT))
    const layers = all.filter((m) => m.fragmentShader.includes(LIT))
    expect(airs.length).toBe(1)
    expect(layers.length).toBe(2)
    r.presence(1, { air: 0 })
    expect(layers.map((m) => m.uniforms.uPresence!.value)).toEqual([1, 1])
    expect(airs[0]!.uniforms.uPresence!.value).toBe(0)
    r.presence(0, { air: 1 })
    expect(layers.map((m) => m.uniforms.uPresence!.value)).toEqual([0, 0])
    expect(airs[0]!.uniforms.uPresence!.value).toBe(1)
    r.presence(0.3)
    expect(all.map((m) => m.uniforms.uPresence!.value)).toEqual([0.3, 0.3, 0.3])
  })

  it('refuses an air share that is no share and changes nothing by it, and a relief without air takes the option and has nothing to give it to', async () => {
    const r = await Relief.load(ctx, '', def, motion(true))
    r.presence(0.5, { air: 0.25 })
    for (const bad of [-0.01, 1.01, Number.NaN, Number.POSITIVE_INFINITY]) expect(() => r.presence(0.9, { air: bad })).toThrow(/air of a relief is a share from 0 to 1/)
    expect(() => r.presence(2, { air: 0.5 })).toThrow(/share from 0 to 1/)
    expect(materials(r).map((m) => m.uniforms.uPresence!.value).sort()).toEqual([0.25, 0.5, 0.5])
    const bare = await Relief.load(ctx, '', def, motion(false))
    bare.presence(0.5, { air: 0.25 })
    expect(materials(bare).map((m) => m.uniforms.uPresence!.value)).toEqual([0.5, 0.5])
  })

  it('the shield follows the share of the layers alone', async () => {
    const r = await Relief.load(ctx, '', def, motion(true))
    let asked = 0
    const renderer = { getContext: () => { asked++; throw new Error('the shield reads its alpha') } } as unknown as THREE.WebGLRenderer
    const camera = new THREE.PerspectiveCamera(40, 2, 0.1, 100)
    r.presence(0.999, { air: 1 })
    expect(r.screen(renderer, camera, 32, 16, 8)).toBe(false)
    expect(asked).toBe(0)
    r.presence(1, { air: 0 })
    expect(() => r.screen(renderer, camera, 32, 16, 8)).toThrow(/the shield reads its alpha/)
    expect(asked).toBe(1)
  })
})

// The share of a relief by the eye (Relief.presenceDetail): off until a set asks, then the layers' shader with its premultiplied output
// times a share by the size of the picture's own texel on the screen. The pixels are tests/relief-gl.test.ts.

const MAIN = 'void main() {'
const VIG = 'vec2 q = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);'

describe('the share of a relief by the eye', () => {
  it('is off until a set asks: no share by the eye in any shader, no uniform', async () => {
    for (const withAir of [false, true]) {
      const r = await Relief.load(ctx, '', def, motion(withAir))
      for (const m of materials(r)) {
        expect(m.fragmentShader.includes('detail')).toBe(false)
        expect(m.fragmentShader.includes('uFrame')).toBe(false)
        expect(m.uniforms.uDetailRange).toBeUndefined()
        expect(m.uniforms.uDetailSize).toBeUndefined()
        expect(m.uniforms.uFrame).toBeUndefined()
      }
    }
  })

  it('the first call gives every layer the shader with the share, one range and one size for all and the frame factor of the engine, and leaves the air to the letter; later calls change numbers only', async () => {
    const plain = materials(await Relief.load(ctx, '', def, motion(true)))
    const r = await Relief.load(ctx, '', def, motion(true))
    const all = materials(r)
    const versions = all.map((m) => m.version)
    r.presenceDetail([0.6, 1.4])
    const layers = all.filter((m) => m.fragmentShader.includes(LIT))
    expect(layers.length).toBe(2)
    all.forEach((m, i) => {
      const before = plain[i]!
      expect(m.vertexShader).toBe(before.vertexShader)
      if (litOf(before) === AIR_LIT) {
        expect(m.fragmentShader).toBe(before.fragmentShader)
        expect(m.version).toBe(versions[i])
        expect(Object.keys(m.uniforms)).toEqual(Object.keys(before.uniforms))
        return
      }
      expect(m.fragmentShader).toBe(withDetail(before.fragmentShader))
      expect(m.fragmentShader.includes(DETAIL_GLSL)).toBe(true)
      expect(m.fragmentShader.includes(LIT + ' * detail')).toBe(true)
      expect(m.fragmentShader.includes(MAIN + '\n  float detail = detailShare(vImage);')).toBe(true)
      expect(m.fragmentShader.includes('if (detail <= 0.0) discard;\n  ' + VIG)).toBe(true)
      expect(m.version).toBe(versions[i]! + 1)
      expect(m.uniforms.uDetailRange).toBe(layers[0]!.uniforms.uDetailRange)
      expect(m.uniforms.uDetailSize).toBe(layers[0]!.uniforms.uDetailSize)
      expect(m.uniforms.uFrame).toBe(frameUniform)
      expect((m.uniforms.uDetailRange!.value as THREE.Vector2).toArray()).toEqual([0.6, 1.4])
      expect((m.uniforms.uDetailSize!.value as THREE.Vector2).toArray()).toEqual([32, 16])
    })
    const texts = all.map((m) => m.fragmentShader)
    const made = all.map((m) => m.version)
    r.presenceDetail([1, 3], { size: [5632, 3168] })
    r.presenceDetail([0, 0.5])
    for (const m of layers) {
      expect((m.uniforms.uDetailRange!.value as THREE.Vector2).toArray()).toEqual([0, 0.5])
      expect((m.uniforms.uDetailSize!.value as THREE.Vector2).toArray()).toEqual([5632, 3168])
    }
    r.presenceDetail(null)
    for (const m of layers) expect((m.uniforms.uDetailRange!.value as THREE.Vector2).toArray()).toEqual([0, 0])
    expect(all.map((m) => m.fragmentShader)).toEqual(texts)
    expect(all.map((m) => m.version)).toEqual(made)
  })

  it('refuses a range that is none and a size that is none and changes nothing by it', async () => {
    const r = await Relief.load(ctx, '', def, motion(true))
    const texts = materials(r).map((m) => m.fragmentShader)
    for (const bad of [[1, 1], [2, 1], [-0.1, 1], [0, Number.POSITIVE_INFINITY], [Number.NaN, 1], [0, Number.NaN], [1], [1, 2, 3]]) {
      expect(() => r.presenceDetail(bad as unknown as [number, number])).toThrow(/whole at or under a texel size and gone at or over a larger one/)
    }
    for (const bad of [[0, 16], [32, -1], [Number.NaN, 16], [32, Number.POSITIVE_INFINITY], [32]]) {
      expect(() => r.presenceDetail([1, 2], { size: bad as unknown as [number, number] })).toThrow(/two numbers of pixels above 0/)
    }
    expect(materials(r).map((m) => m.fragmentShader)).toEqual(texts)
    r.presenceDetail([1, 2])
    expect(() => r.presenceDetail([3, 2])).toThrow(/whole at or under/)
    expect((materials(r).find((m) => m.uniforms.uDetailRange)!.uniforms.uDetailRange!.value as THREE.Vector2).toArray()).toEqual([1, 2])
  })

  it('is no shield while a range stands, and the shield it was when the share is held at 1', async () => {
    const r = await Relief.load(ctx, '', def, motion(false))
    let asked = 0
    const renderer = { getContext: () => { asked++; throw new Error('the shield reads its alpha') } } as unknown as THREE.WebGLRenderer
    const camera = new THREE.PerspectiveCamera(40, 2, 0.1, 100)
    r.presenceDetail([0.5, 1.5])
    expect(r.screen(renderer, camera, 32, 16, 8)).toBe(false)
    r.presence(1)
    expect(r.screen(renderer, camera, 32, 16, 8)).toBe(false)
    expect(asked).toBe(0)
    r.presenceDetail(null)
    expect(() => r.screen(renderer, camera, 32, 16, 8)).toThrow(/the shield reads its alpha/)
    expect(asked).toBe(1)
  })

  it('goes with a presence and with an edge in any order: the shares multiply, and each shader is made once', async () => {
    const orders = [['detail', 'presence', 'edge'], ['presence', 'edge', 'detail'], ['edge', 'detail', 'presence'], ['edge', 'presence', 'detail'], ['detail', 'edge', 'presence']]
    for (const order of orders) {
      const r = await Relief.load(ctx, '', def, motion(true))
      for (const step of order) {
        if (step === 'detail') r.presenceDetail([0.5, 1.5])
        if (step === 'presence') r.presence(0.5, { air: 0.75 })
        if (step === 'edge') r.presenceEdge([4, 4, 4, 0], { air: false })
      }
      const parts: Record<string, string> = { detail: ' * detail', presence: ' * uPresence', edge: ' * edgeShare(vImage)' }
      for (const m of materials(r)) {
        if (m.fragmentShader.includes(AIR_LIT)) {
          expect(m.fragmentShader.includes(AIR_LIT + ' * uPresence')).toBe(true)
          expect(m.fragmentShader.includes('detail')).toBe(false)
          expect(m.uniforms.uPresence!.value).toBe(0.75)
          continue
        }
        expect(m.fragmentShader.includes(LIT + [...order].reverse().map((step) => parts[step]).join(''))).toBe(true)
        expect(m.fragmentShader.split('float detail = detailShare(vImage);').length).toBe(2)
        expect(m.fragmentShader.includes('if (alpha < 0.004 || edgeShare(vImage) <= 0.0) discard;')).toBe(true)
        expect(m.fragmentShader.includes('if (detail <= 0.0) discard;')).toBe(true)
        expect(m.uniforms.uPresence!.value).toBe(0.5)
        expect(m.uniforms.uEdgeSide).toBeDefined()
        expect(m.uniforms.uDetailRange).toBeDefined()
      }
    }
  })

  it('the share is whole at or under the first size, gone at or over the second and a half midway, by the longest side of a texel in pixels of the master', () => {
    // From the picture's own eye a picture of 5632 by 3168 on a frame of 1920 by 1080 has 2.9333 texels a pixel: a texel is 0.3409 pixels.
    const own: [[number, number], [number, number]] = [[5632 / 1920, 0], [0, -3168 / 1080]]
    expect(detailShareAt(own[0], own[1], [0.5, 1.5])).toBe(1)
    expect(detailShareAt(own[0], own[1], [0.1, 0.3])).toBe(0)
    expect(detailShareAt(own[0], own[1], [0.3409, 1])).toBeCloseTo(1, 6)
    // Twice as near the texel is twice as long: 0.6818 pixels.
    const near: [[number, number], [number, number]] = [[5632 / 3840, 0], [0, -3168 / 2160]]
    expect(detailShareAt(near[0], near[1], [0.5, 1.5])).toBeCloseTo(1 - ((t) => t * t * (3 - 2 * t))(0.6818181818 - 0.5), 9)
    expect(detailShareAt([1, 0], [0, 1], [0.5, 1.5])).toBeCloseTo(0.5, 12)
    expect(detailShareAt([1, 0], [0, 1], [1, 2])).toBe(1)
    expect(detailShareAt([1, 0], [0, 1], [0.5, 1])).toBe(0)
    // The worst direction counts: a ground seen flat, four times shorter in one direction, has a texel four pixels long, whatever the turn.
    for (const deg of [0, 17, 45, 90, 133]) {
      const c = Math.cos(deg * Math.PI / 180)
      const s = Math.sin(deg * Math.PI / 180)
      const tx: [number, number] = [c * 1, s * 0.25]
      const ty: [number, number] = [-s * 1, c * 0.25]
      expect(detailShareAt(tx, ty, [3.5, 4.5])).toBeCloseTo(0.5, 9)
      expect(detailShareAt(tx, ty, [1, 4])).toBeCloseTo(0, 9)
      expect(detailShareAt(tx, ty, [4.0001, 8])).toBe(1)
      // The turn of the picture on the screen does not count either.
      expect(detailShareAt([c, s * 0.25].map((v) => -v) as [number, number], ty, [3.5, 4.5])).toBeCloseTo(0.5, 9)
    }
    // A sheet seen edge on has no texel across it: gone.
    expect(detailShareAt([1, 0], [2, 0], [0.5, 100])).toBe(0)
    expect(detailShareAt([0, 0], [0, 0], [0.5, 100])).toBe(0)
    // Never rises with the size of the texel.
    let last = 1
    for (let k = 0; k <= 200; k++) {
      const size = 0.2 + k * 0.01
      const share = detailShareAt([1 / size, 0], [0, 1 / size], [0.6, 1.8])
      expect(share).toBeLessThanOrEqual(last)
      last = share
    }
    expect(last).toBe(0)
  })

  it('counts in pixels of the master: in a frame of twice the height, and in a place picture of twice the scale, the same texel has the same share', () => {
    const master = detailShareAt([1.25, 0], [0, -1.25], [0.5, 1.5])
    expect(master).toBeGreaterThan(0)
    expect(master).toBeLessThan(1)
    expect(detailShareAt([0.625, 0], [0, -0.625], [0.5, 1.5], 2)).toBeCloseTo(master, 12)
    expect(detailShareAt([0.3125, 0], [0, -0.3125], [0.5, 1.5], 4)).toBeCloseTo(master, 12)
    expect(detailShareAt([0.625, 0], [0, -0.625], [0.5, 1.5])).not.toBeCloseTo(master, 3)
    // A range held at 1 is 1 whatever the texel.
    expect(detailShareAt([0, 0], [0, 0], [0, 0])).toBe(1)
    expect(DETAIL_GLSL.includes('det / big * uFrame * uFine')).toBe(true)
    expect(DETAIL_GLSL.includes('if (uDetailRange.y <= 0.0) return 1.0;')).toBe(true)
  })

  it('the shader with the share needs one place for it and refuses none or two', () => {
    const one = 'precision highp float;\nin vec2 vImage;\nout vec4 outColor;\nvoid main() {\n  if (alpha < 0.004) discard;\n  ' + VIG + '\n  outColor = vec4(col * alpha, alpha);\n}'
    const made = withDetail(one)
    expect(made).toBe('precision highp float;\nin vec2 vImage;' + DETAIL_GLSL + '\nout vec4 outColor;\nvoid main() {\n  float detail = detailShare(vImage);\n  if (alpha < 0.004) discard;\n  if (detail <= 0.0) discard;\n  ' + VIG + '\n  outColor = vec4(col * alpha, alpha) * detail;\n}')
    expect(() => withDetail(one.replace(LIT, 'vec4(1.0)'))).toThrow(/no single place/)
    expect(() => withDetail(one + ' vec4(col * alpha, alpha)')).toThrow(/no single place/)
    expect(() => withDetail(one.replace('in vec2 vImage;', ''))).toThrow(/no single place/)
    expect(() => withDetail(one.replace(VIG, ''))).toThrow(/no single place/)
    expect(() => withDetail(one + '\nvoid main() {')).toThrow(/no single place/)
    expect(() => withDetail(made)).toThrow(/no single place/)
    // The share is read before the first branch of the shader, so its derivatives are whole.
    expect(made.indexOf('float detail = detailShare(vImage);')).toBeLessThan(made.indexOf('discard'))
  })
})

// The law of a stop on its relief (Relief.presenceLaw): off until a set asks, then the layers' shader with its premultiplied output
// times a share the stop's own GLSL gives by the ground point, the eye and the place in the picture. The pixels are
// tests/relief-gl.test.ts.

const LAW = 'uniform float uLawNear;\nuniform vec2 uLawRange;\nfloat lawSide(vec3 P) { return length(P) / uLawNear; }\nfloat lawShare(vec3 P, vec3 E, vec2 image) {\n  return 1.0 - smoothstep(uLawRange.x, uLawRange.y, lawSide(P) * uLawFocal / distance(P, E));\n}'
const lawGiven = (): Record<string, THREE.IUniform> => ({ uLawNear: { value: 2743.568 }, uLawRange: { value: new THREE.Vector2(1, 3) } })
const lens = (fov: number, height: number, placeScale?: number): RenderView => ({ format: { width: height * 2, height }, camera: { fov }, ...(placeScale ? { placeScale } : {}) }) as unknown as RenderView

describe('the law of a stop on its relief', () => {
  it('is off until a set asks: no law in any shader, no uniform', async () => {
    for (const withAir of [false, true]) {
      const r = await Relief.load(ctx, '', def, motion(withAir))
      for (const m of materials(r)) {
        expect(m.fragmentShader.includes('law')).toBe(false)
        expect(m.fragmentShader.includes('Law')).toBe(false)
        expect(m.fragmentShader.includes('reliefTone')).toBe(false)
        expect(Object.keys(m.uniforms).some((k) => k.startsWith('uLaw'))).toBe(false)
      }
    }
  })

  it('the call gives every layer the shader with the law, the stop own uniforms and the two numbers of the engine, and leaves the air to the letter', async () => {
    const plain = materials(await Relief.load(ctx, '', def, motion(true)))
    const r = await Relief.load(ctx, '', def, motion(true))
    const all = materials(r)
    const versions = all.map((m) => m.version)
    const given = lawGiven()
    r.presenceLaw(LAW, given)
    const layers = all.filter((m) => m.fragmentShader.includes(LIT))
    expect(layers.length).toBe(2)
    all.forEach((m, i) => {
      const before = plain[i]!
      expect(m.vertexShader).toBe(before.vertexShader)
      if (litOf(before) === AIR_LIT) {
        expect(m.fragmentShader).toBe(before.fragmentShader)
        expect(m.version).toBe(versions[i])
        expect(Object.keys(m.uniforms)).toEqual(Object.keys(before.uniforms))
        return
      }
      expect(m.fragmentShader).toBe(withLaw(before.fragmentShader, LAW))
      expect(m.fragmentShader.includes(LAW_GLSL.slice(1) + '\n' + LAW + '\n' + MAIN + '\n  float reliefLaw = clamp(lawShare(vLocal, vEye, vImage), 0.0, 1.0);')).toBe(true)
      expect(m.fragmentShader.includes(LIT + ' * reliefLaw')).toBe(true)
      expect(m.fragmentShader.includes('if (reliefLaw <= 0.0) discard;\n  ' + VIG)).toBe(true)
      expect(m.version).toBe(versions[i]! + 1)
      expect(m.uniforms.uLawNear).toBe(given.uLawNear)
      expect(m.uniforms.uLawRange).toBe(given.uLawRange)
      expect(m.uniforms.uLawFocal).toBe(layers[0]!.uniforms.uLawFocal)
      expect(m.uniforms.uLawFrame).toBe(layers[0]!.uniforms.uLawFrame)
      expect(Object.keys(m.uniforms).filter((k) => k.startsWith('uLaw')).sort()).toEqual(['uLawFocal', 'uLawFrame', 'uLawNear', 'uLawRange'])
    })
    // The values are the stop's to change: the shaders stay.
    const texts = all.map((m) => m.fragmentShader)
    given.uLawNear!.value = 100
    expect(layers.every((m) => m.uniforms.uLawNear!.value === 100)).toBe(true)
    expect(all.map((m) => m.fragmentShader)).toEqual(texts)
  })

  it('is given once, and refuses a text that is no law or uniforms that do not fit it, and changes nothing by it', async () => {
    const r = await Relief.load(ctx, '', def, motion(true))
    const texts = materials(r).map((m) => m.fragmentShader)
    const share = 'float lawShare(vec3 P, vec3 E, vec2 image) { return 1.0; }'
    expect(() => r.presenceLaw('float share(vec3 P, vec3 E, vec2 image) { return 1.0; }')).toThrow(/defines float lawShare/)
    expect(() => r.presenceLaw('float lawShare(vec3 P, vec3 E) { return 1.0; }')).toThrow(/defines float lawShare/)
    expect(() => r.presenceLaw(share + '\n' + share)).toThrow(/defines float lawShare/)
    expect(() => r.presenceLaw('float lawShare(vec3 P, vec3 E, vec2 image) { if (P.z > 0.0) discard; return 1.0; }')).toThrow(/has no discard/)
    expect(() => r.presenceLaw(share + '\nvoid main() {}')).toThrow(/has no void main/)
    expect(() => r.presenceLaw('float lawShare(vec3 P, vec3 E, vec2 image) { outColor = vec4(1.0); return 1.0; }')).toThrow(/has no outColor/)
    expect(() => r.presenceLaw('uniform float uNear;\n' + share, { uNear: { value: 1 } })).toThrow(/named uLaw and a name of its own, not uNear/)
    expect(() => r.presenceLaw('uniform float uLawFocal;\n' + share, { uLawFocal: { value: 1 } })).toThrow(/named uLaw and a name of its own, not uLawFocal/)
    expect(() => r.presenceLaw('uniform float uLawFrame;\n' + share, { uLawFrame: { value: 1 } })).toThrow(/not uLawFrame/)
    expect(() => r.presenceLaw('uniform float uLaw;\n' + share, { uLaw: { value: 1 } })).toThrow(/not uLaw/)
    expect(() => r.presenceLaw('uniform float uLawA;\nuniform float uLawA;\n' + share, { uLawA: { value: 1 } })).toThrow(/declares uLawA twice/)
    expect(() => r.presenceLaw('uniform float uLawA, uLawB;\n' + share, { uLawA: { value: 1 } })).toThrow(/each uniform on a line of its own kind/)
    expect(() => r.presenceLaw('uniform float uLawA;\n' + share)).toThrow(/declares uLawA and the set gives no such uniform/)
    expect(() => r.presenceLaw(share, { uLawA: { value: 1 } })).toThrow(/gives the law of a relief uLawA, which its text does not declare/)
    expect(materials(r).map((m) => m.fragmentShader)).toEqual(texts)
    expect(materials(r).every((m) => !Object.keys(m.uniforms).some((k) => k.startsWith('uLaw')))).toBe(true)
    r.presenceLaw(LAW, lawGiven())
    expect(() => r.presenceLaw(LAW, lawGiven())).toThrow(/given once/)
    expect(() => r.presenceLaw(share)).toThrow(/given once/)
    expect(lawUniforms(LAW)).toEqual(['uLawNear', 'uLawRange'])
    expect(lawUniforms('uniform highp sampler2D uLawMap;\nuniform vec3 uLawTaps[4];\n' + share)).toEqual(['uLawMap', 'uLawTaps'])
    expect(lawUniforms(share)).toEqual([])
    // What a note says is no part of the law.
    expect(lawUniforms('uniform vec4 uLawTexel; // the uniform of the texel, with a float lawShare(vec3 a, vec3 b, vec2 c) { in it\n/* uniform float uOld;\n discard */\n' + share)).toEqual(['uLawTexel'])
  })

  it('is no shield from the call on', async () => {
    const r = await Relief.load(ctx, '', def, motion(false))
    let asked = 0
    const renderer = { getContext: () => { asked++; throw new Error('the shield reads its alpha') } } as unknown as THREE.WebGLRenderer
    const camera = new THREE.PerspectiveCamera(40, 2, 0.1, 100)
    expect(() => r.screen(renderer, camera, 32, 16, 8)).toThrow(/the shield reads its alpha/)
    expect(asked).toBe(1)
    const bare = await Relief.load(ctx, '', def, motion(false))
    bare.presenceLaw('float lawShare(vec3 P, vec3 E, vec2 image) { return 1.0; }')
    expect(bare.screen(renderer, camera, 32, 16, 8)).toBe(false)
    bare.presence(1)
    expect(bare.screen(renderer, camera, 32, 16, 8)).toBe(false)
    expect(asked).toBe(1)
  })

  it('shields again while the set says its law is whole, and is asked each time', async () => {
    let asked = 0
    let whole = false
    let said = 0
    const renderer = { getContext: () => { asked++; throw new Error('the shield reads its alpha') } } as unknown as THREE.WebGLRenderer
    const camera = new THREE.PerspectiveCamera(40, 2, 0.1, 100)
    const text = 'uniform float uLawOn;\nfloat lawShare(vec3 P, vec3 E, vec2 image) { return uLawOn < 0.5 ? 1.0 : 0.5; }'
    const made = async (): Promise<Relief> => {
      const r = await Relief.load(ctx, '', def, motion(false))
      r.presenceLaw(text, { uLawOn: { value: 1 } }, { whole: () => { said++; return whole } })
      return r
    }
    const r = await made()
    expect(r.screen(renderer, camera, 32, 16, 8)).toBe(false)
    expect(r.screen(renderer, camera, 32, 16, 8)).toBe(false)
    expect([asked, said]).toEqual([0, 2])
    whole = true
    expect(() => r.screen(renderer, camera, 32, 16, 8)).toThrow(/the shield reads its alpha/)
    expect([asked, said]).toEqual([1, 3])
    // A presence under 1 or a range by the eye is no shield whatever the law says.
    const other = await made()
    other.presence(0.5)
    expect(other.screen(renderer, camera, 32, 16, 8)).toBe(false)
    other.presence(1)
    other.presenceDetail([1, 3])
    expect(other.screen(renderer, camera, 32, 16, 8)).toBe(false)
    expect(asked).toBe(1)
    other.presenceDetail(null)
    expect(() => other.screen(renderer, camera, 32, 16, 8)).toThrow(/the shield reads its alpha/)
    expect(asked).toBe(2)
    // Whole is the word true and nothing like it.
    const loose = await Relief.load(ctx, '', def, motion(false))
    loose.presenceLaw(text, { uLawOn: { value: 0 } }, { whole: () => 1 as unknown as boolean })
    expect(loose.screen(renderer, camera, 32, 16, 8)).toBe(false)
    expect(asked).toBe(2)
  })

  it('the update gives the law the focal length of the lens in pixels of the master and the buffer pixels a pixel of the master takes, in the frame, in a larger format and in a place picture', async () => {
    const r = await Relief.load(ctx, '', def, motion(true))
    r.presenceLaw(LAW, lawGiven())
    const u = materials(r).find((m) => m.uniforms.uLawFocal)!.uniforms
    const focal = 540 / Math.tan(THREE.MathUtils.degToRad(60) / 2)
    expect(focal).toBeCloseTo(935.307, 3)
    try {
      frameUniform.value = 1
      r.update(0, 1, 0, lens(60, 1080))
      expect(u.uLawFocal!.value).toBeCloseTo(focal, 9)
      expect(u.uLawFrame!.value).toBe(1)
      // A place picture of three times the scale: the same lens, three buffer pixels a pixel of the master.
      r.update(0, 1, 0, lens(60, 3240, 3))
      expect(u.uLawFocal!.value).toBeCloseTo(focal, 9)
      expect(u.uLawFrame!.value).toBe(3)
      // The frame of twice the height, and its place picture.
      frameUniform.value = 2
      r.update(0, 1, 0, lens(60, 2160))
      expect(u.uLawFocal!.value).toBeCloseTo(focal, 9)
      expect(u.uLawFrame!.value).toBe(2)
      r.update(0, 1, 0, lens(60, 4320, 2))
      expect(u.uLawFocal!.value).toBeCloseTo(focal, 9)
      expect(u.uLawFrame!.value).toBe(4)
      // Another lens.
      r.update(0, 1, 0, lens(34, 2160))
      expect(u.uLawFocal!.value).toBeCloseTo(540 / Math.tan(THREE.MathUtils.degToRad(34) / 2), 9)
    } finally {
      frameUniform.value = 1
    }
    // A relief without a law asks no lens of its view.
    const bare = await Relief.load(ctx, '', def, motion(true))
    expect(() => bare.update(0, 1, 0, { format: { width: 1920, height: 1080 } } as unknown as RenderView)).not.toThrow()
  })

  it('goes with a presence, an edge and the share by the eye in any order: the shares multiply, and both are read before the first branch', async () => {
    const orders = [['law', 'detail', 'presence', 'edge'], ['presence', 'edge', 'detail', 'law'], ['edge', 'law', 'presence', 'detail'], ['detail', 'law', 'edge', 'presence']]
    for (const order of orders) {
      const r = await Relief.load(ctx, '', def, motion(true))
      for (const step of order) {
        if (step === 'law') r.presenceLaw(LAW, lawGiven())
        if (step === 'detail') r.presenceDetail([0.5, 1.5])
        if (step === 'presence') r.presence(0.5, { air: 0.75 })
        if (step === 'edge') r.presenceEdge([4, 4, 4, 0], { air: false })
      }
      const parts: Record<string, string> = { law: ' * reliefLaw', detail: ' * detail', presence: ' * uPresence', edge: ' * edgeShare(vImage)' }
      for (const m of materials(r)) {
        if (m.fragmentShader.includes(AIR_LIT)) {
          expect(m.fragmentShader.includes('law')).toBe(false)
          expect(m.fragmentShader.includes('Law')).toBe(false)
          expect(m.fragmentShader.includes('detail')).toBe(false)
          continue
        }
        const text = m.fragmentShader
        expect(text.includes(LIT + [...order].reverse().map((step) => parts[step]).join(''))).toBe(true)
        expect(text.split('float reliefLaw = clamp(lawShare(vLocal, vEye, vImage), 0.0, 1.0);').length).toBe(2)
        expect(text.split('float detail = detailShare(vImage);').length).toBe(2)
        const first = text.indexOf('discard', text.indexOf(MAIN))
        expect(text.indexOf('float reliefLaw = clamp(')).toBeLessThan(first)
        expect(text.indexOf('float detail = detailShare(')).toBeLessThan(first)
        expect(text.indexOf('float reliefLaw = clamp(')).toBeGreaterThan(text.indexOf(MAIN))
        expect(text.indexOf('float lawShare(')).toBeLessThan(text.indexOf(MAIN))
        expect(text.includes('if (reliefLaw <= 0.0) discard;')).toBe(true)
        expect(text.includes('if (detail <= 0.0) discard;')).toBe(true)
      }
    }
  })

  it('with the tone asked for the text gives the factor on the colour of the layers too, read at the top and set where the colour is made, and the air is left to the letter', async () => {
    const COL = 'vec3 col = inverseFilmic(texel.rgb) * uGain * vig;'
    const toned = LAW + '\nuniform vec3 uLawHue;\nvec3 lawTone(vec3 P, vec3 E, vec2 image) { return uLawHue; }'
    const plain = materials(await Relief.load(ctx, '', def, motion(true)))
    const r = await Relief.load(ctx, '', def, motion(true))
    const given = { ...lawGiven(), uLawHue: { value: new THREE.Vector3(1, 1, 1) } }
    r.presenceLaw(toned, given, { tone: true })
    let layers = 0
    materials(r).forEach((m, i) => {
      const before = plain[i]!
      if (litOf(before) === AIR_LIT) {
        expect(m.fragmentShader).toBe(before.fragmentShader)
        expect(Object.keys(m.uniforms)).toEqual(Object.keys(before.uniforms))
        return
      }
      layers++
      expect(before.fragmentShader.split(COL).length).toBe(2)
      expect(m.fragmentShader).toBe(withLaw(before.fragmentShader, toned, true))
      expect(m.fragmentShader.includes(MAIN + '\n  float reliefLaw = clamp(lawShare(vLocal, vEye, vImage), 0.0, 1.0);\n  vec3 reliefTone = max(lawTone(vLocal, vEye, vImage), vec3(0.0));\n')).toBe(true)
      expect(m.fragmentShader.includes('vec3 col = inverseFilmic(texel.rgb) * uGain * vig * reliefTone;')).toBe(true)
      expect(m.fragmentShader.includes(COL)).toBe(false)
      expect(m.fragmentShader.split('reliefTone').length).toBe(3)
      // The mist of the valley keeps its own colour.
      expect(m.fragmentShader.includes('col = mix(col, uValleyColor * uGain * vig, f);')).toBe(true)
      expect(m.uniforms.uLawHue).toBe(given.uLawHue)
      // Both are read before the first branch of main.
      const first = m.fragmentShader.indexOf('discard', m.fragmentShader.indexOf(MAIN))
      expect(m.fragmentShader.indexOf('vec3 reliefTone = ')).toBeLessThan(first)
    })
    expect(layers).toBe(2)
    // Without the option the shader has no tone, and the text may not bring one; with it the text has to.
    const bare = await Relief.load(ctx, '', def, motion(true))
    const texts = materials(bare).map((m) => m.fragmentShader)
    expect(() => bare.presenceLaw(toned, given)).toThrow(/has a lawTone and the set did not ask for the tone/)
    expect(() => bare.presenceLaw(toned, given, { tone: false })).toThrow(/did not ask for the tone/)
    expect(() => bare.presenceLaw(LAW, lawGiven(), { tone: true })).toThrow(/with a tone defines vec3 lawTone/)
    expect(() => bare.presenceLaw(LAW + '\nfloat lawTone(vec3 P, vec3 E, vec2 image) { return 1.0; }', lawGiven(), { tone: true })).toThrow(/with a tone defines vec3 lawTone/)
    expect(() => bare.presenceLaw(LAW + '\nvec3 lawTone(vec3 P) { return vec3(1.0); }', lawGiven())).toThrow(/did not ask for the tone/)
    expect(materials(bare).map((m) => m.fragmentShader)).toEqual(texts)
    bare.presenceLaw(LAW, lawGiven())
    for (const m of materials(bare)) {
      expect(m.fragmentShader.includes('reliefTone')).toBe(false)
      expect(m.fragmentShader.includes('lawTone')).toBe(false)
      if (litOf(m) !== AIR_LIT) expect(m.fragmentShader.includes(COL)).toBe(true)
    }
    expect(lawUniforms(toned, true)).toEqual(['uLawNear', 'uLawRange', 'uLawHue'])
  })

  it('the shader with the law needs one place for it and refuses none or two', () => {
    const one = 'precision highp float;\nin vec2 vImage;\nout vec4 outColor;\nvoid main() {\n  if (alpha < 0.004) discard;\n  ' + VIG + '\n  outColor = vec4(col * alpha, alpha);\n}'
    const share = 'float lawShare(vec3 P, vec3 E, vec2 image) { return 0.5; }'
    const made = withLaw(one, '\n' + share + '\n\n')
    expect(made).toBe('precision highp float;\nin vec2 vImage;\nout vec4 outColor;\nuniform float uLawFocal;\nuniform float uLawFrame;\n' + share + '\nvoid main() {\n  float reliefLaw = clamp(lawShare(vLocal, vEye, vImage), 0.0, 1.0);\n  if (alpha < 0.004) discard;\n  if (reliefLaw <= 0.0) discard;\n  ' + VIG + '\n  outColor = vec4(col * alpha, alpha) * reliefLaw;\n}')
    expect(() => withLaw(one.replace(LIT, 'vec4(1.0)'), share)).toThrow(/no single place/)
    expect(() => withLaw(one + ' vec4(col * alpha, alpha)', share)).toThrow(/no single place/)
    expect(() => withLaw(one.replace(VIG, ''), share)).toThrow(/no single place/)
    expect(() => withLaw(one + '\nvoid main() {', share)).toThrow(/no single place/)
    expect(() => withLaw(made, share)).toThrow(/no single place/)
    expect(() => withLaw(one, 'float share() { return 1.0; }')).toThrow(/defines float lawShare/)
    // The tone needs the line the colour is made on.
    const tone = share + '\nvec3 lawTone(vec3 P, vec3 E, vec2 image) { return vec3(0.5); }'
    expect(() => withLaw(one, tone, true)).toThrow(/no single place/)
    const colour = one.replace('  outColor', '  vec3 col = inverseFilmic(texel.rgb) * uGain * vig;\n  outColor')
    expect(withLaw(colour, tone, true)).toBe('precision highp float;\nin vec2 vImage;\nout vec4 outColor;\nuniform float uLawFocal;\nuniform float uLawFrame;\n' + tone + '\nvoid main() {\n  float reliefLaw = clamp(lawShare(vLocal, vEye, vImage), 0.0, 1.0);\n  vec3 reliefTone = max(lawTone(vLocal, vEye, vImage), vec3(0.0));\n  if (alpha < 0.004) discard;\n  if (reliefLaw <= 0.0) discard;\n  ' + VIG + '\n  vec3 col = inverseFilmic(texel.rgb) * uGain * vig * reliefTone;\n  outColor = vec4(col * alpha, alpha) * reliefLaw;\n}')
    expect(withLaw(colour, share)).toBe(withLaw(one, share).replace('  outColor', '  vec3 col = inverseFilmic(texel.rgb) * uGain * vig;\n  outColor'))
  })
})
