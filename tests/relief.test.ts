import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import type { RenderView, SetContext } from '../src/core/types'
import { EDGE_AIR_GLSL, EDGE_GLSL, Relief, edgeShareAt, withEdge, withEdgeEye, withEyeScale, withPresence, type ReliefAir, type ReliefDef, type ReliefMotion } from '../src/terrain/relief'

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
