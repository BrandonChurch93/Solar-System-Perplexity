import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium, type Browser, type Page } from 'playwright-core'
import * as THREE from 'three'
import { build } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { CHROME, CHROME_FLAGS } from '../tools/lib/browser'
import { CAP_PATCHES, ReliefCap, capCells, capFinest, capGrids, capHeightBytes, capHeights, capOverlap, capVert, type CapOptions } from '../src/bodies/cap'
import { Planet, planetFrag } from '../src/bodies/planet'
import * as look from '../src/stops/mars/look'

const hash = (text: string): string => createHash('sha256').update(text).digest('hex')
const KEPT = '81b0189383d53555c8623467df803b233644cf143249b11aa3e3a28f5548a308'
const MARS = [8.5, 3.8, 1.6, 0.7, 0.3]
const scaleOf = (deg: number): number => 1 / (2 * Math.tan((deg * Math.PI) / 360))
const level = (widthDeg: number, size = 4): CapOptions['levels'][number] => ({ height: capHeights(new Uint16Array(size * size), size), size, widthDeg, low: -0.002, high: 0.001 })
const options = (o: Partial<CapOptions> = {}): CapOptions => ({ levels: MARS.map((w) => level(w)), border: [0.065, 0.074], from: [2, 1.2], cells: 128, pixel: 2e-4, ...o })
const planet = (cap?: CapOptions): Planet => {
  const t = new THREE.Texture()
  return new Planet({ map: t, mapWidth: 8, height: t, heightWidth: 8, light: look.light, haze: look.haze, grazing: look.grazing, ...(cap ? { cap } : {}) })
}

describe('the relief cap of the globe', () => {
  it('leaves the text of a globe without a cap as it was, and adds one uniform and one line to a globe with one', () => {
    const off = planet()
    const on = planet(options())
    expect(hash(off.material.fragmentShader)).toBe(KEPT)
    expect(off.cap).toBeUndefined()
    expect(off.mesh.children.length).toBe(0)
    expect(Object.keys(off.material.uniforms).filter((k) => k.includes('Cap'))).toEqual([])
    const cut = '\n  if (uCapCut > 0.0 && dn > 0.3 && max(abs(dot(d, uSpotE)), abs(dot(d, uSpotU))) < uCapCut * dn) discard;'
    expect(on.material.fragmentShader.replace('\nuniform float uCapCut;', '').replace(cut, '')).toBe(off.material.fragmentShader)
    expect(on.material.fragmentShader.length - off.material.fragmentShader.length).toBe(('\nuniform float uCapCut;' + cut).length)
    const capText = on.cap!.material.fragmentShader
    expect(capText).toBe(planetFrag({ slots: 6, own: false, gain: false, minor: false, glow: false, cap: true }))
    expect(capText).toContain('in float vCapH;')
    expect(capText).toContain('float tau = capDepth(dir, n, vCapH);')
    expect(capText).not.toContain('hazeDepth(dir, true, at)')
    expect(capText).not.toContain('vCapN')
    expect(capText).not.toContain('uCapLight')
    expect(capText).not.toContain('uCapCut')
    expect(on.cap!.material.uniforms.uCapLight).toBeUndefined()
    expect(() => on.cap!.setLight(1, 1)).toThrow('no light of its own')
    expect(planetFrag({ slots: 6, own: false, gain: false, minor: false, glow: false })).toBe(off.material.fragmentShader)
    off.dispose()
    on.dispose()
  })

  it('draws with the uniforms of the globe itself, so what a stop sets on the globe holds on the cap', () => {
    const p = planet(options())
    const cap = p.cap!
    for (const [k, u] of Object.entries(p.material.uniforms)) if (k !== 'uCapCut') expect(cap.material.uniforms[k]).toBe(u)
    expect(cap.material.uniforms.uCapCut).toBeUndefined()
    p.setAir({ limb: 0.3, tint: [0.5, 0.6, 0.7], haze: { depth: 2, scaleHeight: 0.003, day: [1, 2, 3], twilight: [0, 0, 0], night: [0, 0, 0], edge: [-0.1, 0.2], strength: 1, extinction: 1, forward: 0 } })
    expect(cap.material.uniforms.uHazeTau!.value).toBe(2)
    expect(cap.material.uniforms.uLimb!.value).toBe(0.3)
    expect(cap.mesh.parent).toBe(p.mesh)
    p.dispose()
  })

  it('stays out above its band, comes in over the log of the height and cuts the sphere only while it is drawn', () => {
    const p = planet(options({ from: [2, 1.2] }))
    const cap = p.cap!
    const at = (height: number): number => {
      p.update(new THREE.Vector3(0, 0, 1 + height), new THREE.Vector3(1, 0, 0), 0, 1, 1)
      return cap.material.uniforms.uCapOn!.value as number
    }
    expect(cap.mesh.visible).toBe(false)
    expect(p.material.uniforms.uCapCut!.value).toBe(0)
    for (const h of [50, 3, 2]) {
      expect(at(h)).toBe(0)
      expect(cap.mesh.visible).toBe(false)
      expect(p.material.uniforms.uCapCut!.value).toBe(0)
    }
    expect(at(Math.sqrt(2 * 1.2))).toBeCloseTo(0.5, 12)
    expect(cap.mesh.visible).toBe(true)
    expect(p.material.uniforms.uCapCut!.value).toBe(cap.cut)
    let last = 0
    for (let h = 2; h >= 1.2; h -= 0.01) {
      const s = at(h)
      expect(s).toBeGreaterThanOrEqual(last)
      last = s
    }
    for (const h of [1.2, 1.1, 0.0017]) expect(at(h)).toBe(1)
    expect(cap.share(0)).toBe(1)
    p.dispose()
  })

it('knows the foot of the eye in the frame of its plates, whatever the turn of the globe and its spin', () => {
    const t = new THREE.Texture()
    const spot = new THREE.Vector3(0.3, -0.2, 0.9).normalize()
    const p = new Planet({ map: t, mapWidth: 8, height: t, heightWidth: 8, light: look.light, haze: look.haze, cap: options(), patches: { textures: [t], widthsDeg: [8.5], spot, feather: 0.12, fade: [1, 2], nearDeg: 0 } })
    p.mesh.quaternion.set(0.1, 0.5, -0.2, 0.8).normalize()
    const east = new THREE.Vector3(0, 1, 0).cross(spot).normalize()
    const north = spot.clone().cross(east)
    const spin = 0.7
    const foot = p.cap!.material.uniforms.uCapFoot!.value as THREE.Vector2
    for (const [x, y] of [[0, 0], [0.01, 0], [0, -0.02], [0.03, 0.04]] as [number, number][]) {
      const body = spot.clone().addScaledVector(east, x).addScaledVector(north, y).normalize()
      const world = body.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spin).applyQuaternion(p.mesh.quaternion).multiplyScalar(1.5)
      p.update(world, new THREE.Vector3(1, 0, 0), spin, 1, 1)
      expect(foot.x).toBeCloseTo(x, 9)
      expect(foot.y).toBeCloseTo(y, 9)
    }
    p.dispose()
  })

  it('refuses levels out of order, a band or a border the wrong way round and too many samplers', () => {
    expect(() => planet(options({ levels: [level(3.8), level(8.5)] }))).toThrow('coarse to fine')
    expect(() => planet(options({ levels: [] }))).toThrow('needs a height level')
    expect(() => planet(options({ from: [1.2, 2] }))).toThrow('higher first')
    expect(() => planet(options({ border: [0.074, 0.065] }))).toThrow('[inner, outer]')
    expect(() => planet(options({ cells: 100 }))).toThrow('multiple of ' + CAP_PATCHES)
    const mask = new THREE.Texture()
    expect(() => planet(options({ levels: [20, 10, 5, 2, 1, 0.5].map((w) => ({ ...level(w), mask })) }))).toThrow('too many')
  })

  it('keeps the heights as 16 bit integers with a box filtered mip chain and counts their bytes', () => {
    const size = 8
    const data = new Uint16Array(size * size)
    for (let i = 0; i < data.length; i++) data[i] = (i * 7919 + 13) % 65536
    const tex = capHeights(data, size)
    expect(tex.format).toBe(THREE.RedIntegerFormat)
    expect(tex.type).toBe(THREE.UnsignedShortType)
    expect(tex.internalFormat).toBe('R16UI')
    expect(tex.minFilter).toBe(THREE.NearestMipmapNearestFilter)
    expect(tex.magFilter).toBe(THREE.NearestFilter)
    expect(tex.generateMipmaps).toBe(false)
    const mips = tex.mipmaps as unknown as { data: Uint16Array; width: number; height: number }[]
    expect(mips.map((m) => m.width)).toEqual([8, 4, 2, 1])
    expect(mips[0]!.data).toBe(data)
    for (let l = 1; l < mips.length; l++) {
      const a = mips[l - 1]!
      const b = mips[l]!
      for (let y = 0; y < b.height; y++) for (let x = 0; x < b.width; x++) {
        const sum = a.data[2 * y * a.width + 2 * x]! + a.data[2 * y * a.width + 2 * x + 1]! + a.data[(2 * y + 1) * a.width + 2 * x]! + a.data[(2 * y + 1) * a.width + 2 * x + 1]!
        expect(b.data[y * b.width + x]).toBe(Math.floor((sum + 2) / 4))
      }
    }
    expect(capHeightBytes(8)).toBe(2 * (64 + 16 + 4 + 1))
    expect(capHeightBytes(2048) / 2 ** 20).toBeCloseTo(10.667, 2)
    expect(() => capHeights(new Uint16Array(12), 4)).toThrow('square')
    const full = capHeights(new Uint16Array(4).fill(65535), 2)
    expect((full.mipmaps as unknown as { data: Uint16Array }[])[1]!.data[0]).toBe(65535)
  })

  it('lays grids of one lattice from the reach down to the finest level, each covering what the finer one leaves', () => {
    expect(capGrids(MARS, 4.25)).toEqual(MARS)
    expect(capGrids(MARS, 30)).toEqual([60, 34, 17, 8.5, 3.8, 1.6, 0.7, 0.3])
    const cells = 256
    const grids = capGrids(MARS, 30)
    const inst = capCells(grids, cells)
    const patch = cells / CAP_PATCHES
    const kept = grids.map(() => new Set<number>())
    for (let i = 0; i < inst.length; i += 3) {
      expect(inst[i]! % patch).toBe(0)
      expect(inst[i + 1]! % patch).toBe(0)
      kept[inst[i + 2]!]!.add((inst[i + 1]! / patch) * CAP_PATCHES + inst[i]! / patch)
    }
    expect(kept[grids.length - 1]!.size).toBe(CAP_PATCHES * CAP_PATCHES)
    for (let k = 0; k < grids.length - 1; k++) expect(kept[k]!.size).toBeLessThan(CAP_PATCHES * CAP_PATCHES)
    const reach = 0.5 / scaleOf(grids[0]!)
    const overlap = capOverlap(grids, cells)
    expect(overlap).toBeLessThan(0.12)
    let both = 0
    for (let a = 0; a < 20000; a++) {
      const g = [(((a * 0.6180339887) % 1) * 2 - 1) * reach * 0.999 * ((a % 97) / 96) ** 3, (((a * 0.7548776662) % 1) * 2 - 1) * reach * 0.999 * ((a % 97) / 96) ** 3]
      let drawn = 0
      for (let k = 0; k < grids.length; k++) {
        const q = [g[0]! * scaleOf(grids[k]!), g[1]! * scaleOf(grids[k]!)]
        const lo = 0.5 / cells - 0.5
        const hi = (cells - 0.5) / cells - 0.5
        if (q[0]! < lo || q[0]! > hi || q[1]! < lo || q[1]! > hi) continue
        const i = Math.min(Math.floor((q[0]! + 0.5) * cells - 0.5), cells - 2)
        const j = Math.min(Math.floor((q[1]! + 0.5) * cells - 0.5), cells - 2)
        if (!kept[k]!.has(Math.floor(j / patch) * CAP_PATCHES + Math.floor(i / patch))) continue
        drawn++
        if (k > 0 && drawn > 1) expect(Math.max(Math.abs(q[0]!), Math.abs(q[1]!))).toBeGreaterThan(0.5 - overlap - 1 / cells)
      }
      if (Math.max(Math.abs(g[0]!), Math.abs(g[1]!)) < reach * (1 - 1 / cells)) expect(drawn).toBeGreaterThanOrEqual(1)
      if (drawn > 1) both++
    }
    expect(both).toBeGreaterThan(0)
  })

  it('draws no grid whose parent already has cells under `fine` pixels at the nearest ground, and the finest drawn grid whole', () => {
    const grids = capGrids(MARS, 34)
    const cells = 2048
    const cellG = grids.map((w) => 1 / (cells * scaleOf(w)))
    const halfG = grids.map((w) => 0.5 / scaleOf(w))
    const pixel = (2 * Math.tan(Math.PI / 12)) / 1080
    let last = 0
    for (let a = 0; a <= 400; a++) {
      const height = 3 * Math.exp(-a * 0.02)
      const k = capFinest(cellG, halfG, 1, pixel, height, 0, 0)
      expect(k).toBeGreaterThanOrEqual(last)
      expect(k - last).toBeLessThanOrEqual(1)
      if (k > 0) expect(cellG[k - 1]! / (pixel * height)).toBeGreaterThan(1)
      if (k < grids.length - 1) expect(cellG[k]! / (pixel * height)).toBeLessThanOrEqual(1)
      last = k
    }
    expect(capFinest(cellG, halfG, 1, pixel, 2.4, 0, 0)).toBe(0)
    expect(last).toBe(grids.length - 1)
    expect(capFinest(cellG, halfG, 0.5, pixel, 0.5, 0, 0)).toBeGreaterThanOrEqual(capFinest(cellG, halfG, 1, pixel, 0.5, 0, 0))
    expect(capFinest(cellG, halfG, 1, pixel, 0.001, 0.05, 0)).toBeLessThan(capFinest(cellG, halfG, 1, pixel, 0.001, 0, 0))
    const small = capGrids(MARS, 30)
    for (let k = 0; k < small.length; k++) {
      const inst = capCells(small, 256, k)
      const count = small.map(() => 0)
      for (let i = 0; i < inst.length; i += 3) count[inst[i + 2]!]!++
      expect(count[k]).toBe(CAP_PATCHES * CAP_PATCHES)
      for (let j = 0; j < small.length; j++) {
        if (j > k) expect(count[j]).toBe(0)
        if (j < k) expect(count[j]).toBeGreaterThan(0)
      }
    }
    const cap = new ReliefCap('void main() {}', {}, options({ levels: [level(8.5), level(3.8)], pixel: 1e-3 }))
    const geometry = cap.mesh.geometry as THREE.InstancedBufferGeometry
    expect(cap.grids).toBe(2)
    cap.update(1.5, new THREE.Vector2())
    expect(cap.grids).toBe(1)
    expect(geometry.instanceCount).toBe(CAP_PATCHES * CAP_PATCHES)
    cap.update(1e-4, new THREE.Vector2())
    expect(cap.grids).toBe(2)
    expect(geometry.instanceCount).toBe(capCells([8.5, 3.8], 128).length / 3)
    cap.dispose()
    const all = new ReliefCap('void main() {}', {}, options({ levels: [level(8.5), level(3.8)], pixel: 1e-3, fine: 0 }))
    all.update(1.5, new THREE.Vector2())
    expect(all.grids).toBe(2)
    all.dispose()
  })

  it('takes the normal of its own heights only when a stop sets `light`, with the two strengths as numbers of the stop', () => {
    const plain = planet(options())
    const lit = planet(options({ light: { relief: 0.8, own: 0.4 } }))
    const reads = (text: string): number => text.slice(text.indexOf('void main()')).split('capHeight(').length - 1
    expect(reads(plain.cap!.material.vertexShader)).toBe(1)
    expect(reads(lit.cap!.material.vertexShader)).toBe(5)
    expect(plain.cap!.material.vertexShader).not.toContain('vCapN')
    expect(lit.cap!.material.vertexShader).toContain('out vec3 vCapN;')
    expect(lit.cap!.material.vertexShader).toBe(capVert([false, false, false, false, false], lit.cap!.gridsDeg.length, true))
    const text = lit.cap!.material.fragmentShader
    expect(text).toBe(planetFrag({ slots: 6, own: false, gain: false, minor: false, glow: false, cap: true, capLight: true }))
    expect(text).toContain('np = normalize(np + nc * uCapLight.x);')
    expect(planetFrag({ slots: 6, own: true, gain: true, minor: false, glow: false, cap: true, capLight: true })).toContain('* uOwnGain * (1.0 + clamp((dot(normalize(n + nc * uCapLight.y), uSunW) - ndl0) / max(ndl0 + uWrap, 0.06), -0.85, 1.6)), own);')
    expect(lit.material.fragmentShader).toBe(plain.material.fragmentShader)
    expect((lit.cap!.material.uniforms.uCapLight!.value as THREE.Vector2).toArray()).toEqual([0.8, 0.4])
    lit.cap!.setLight(0.5, 0.25)
    expect((lit.cap!.material.uniforms.uCapLight!.value as THREE.Vector2).toArray()).toEqual([0.5, 0.25])
    expect(lit.material.uniforms.uCapLight).toBeUndefined()
    plain.dispose()
    lit.dispose()
  })

  it('reads the heights in the vertex shader only, by the pixel footprint as an angle and not by a format', () => {
    const cap = new ReliefCap('void main() {}', {}, options({ levels: [{ ...level(8.5), mask: new THREE.Texture() }, level(3.8)] }))
    const text = cap.material.vertexShader
    expect(text).toBe(capVert([true, false], 2))
    expect(text).toContain('uniform highp usampler2D uCapH0;')
    expect(text).toContain('uniform sampler2D uCapM0;')
    expect(text).not.toContain('uCapM1')
    expect(text).toContain('float foot = uCapPixel * length((modelMatrix * vec4(local, 1.0)).xyz);')
    for (const word of ['dFdx', 'fwidth', 'uAspect', 'uTime', 'uFrame', 'gl_FragCoord']) expect(text).not.toContain(word)
    expect((cap.material.uniforms.uCapSink!.value as THREE.Vector2).toArray()).toEqual([0, 1])
    cap.setSink(2e-5, 0.005)
    expect((cap.material.uniforms.uCapSink!.value as THREE.Vector2).toArray()).toEqual([2e-5, 0.005])
    expect(() => cap.setSink(2e-5, 0)).toThrow('radius above 0')
    expect(text).toContain('t -= sink * textureLod(uCapM0, q + 0.5, lod).r;')
    expect(cap.material.uniforms.uCapPixel!.value).toBe(2e-4)
    cap.setPixel(1e-4)
    expect(cap.material.uniforms.uCapPixel!.value).toBe(1e-4)
    expect(cap.material.uniforms.uCapOff!.value).toEqual([16, 16])
    expect(cap.cut).toBeCloseTo(2 * Math.tan((8.5 * Math.PI) / 360) * (0.5 - 17 / 128), 12)
    const fine = new ReliefCap('void main() {}', {}, options({ levels: [level(8.5, 256), level(3.8, 128), level(1.6, 64)], cells: 128 }))
    expect(fine.material.uniforms.uCapOff!.value).toEqual([0.5, 0.5, 1])
    expect(fine.cut).toBeCloseTo(2 * Math.tan((8.5 * Math.PI) / 360) * (0.5 - 1.5 / 128), 12)
    fine.dispose()
    cap.dispose()
  })
})

const ROOT = resolve(__dirname, '..')
const at = (path: string): string => JSON.stringify(resolve(ROOT, path))

const PAGE = `
import * as THREE from 'three'
import { Planet } from ${at('src/bodies/planet.ts')}
import { SetLoader, heightTexture } from ${at('src/core/sets.ts')}
import { config } from ${at('src/config.ts')}

const renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas') })

function flat(rgb, size) {
  const data = new Uint8Array(8 * 8 * 4)
  for (let i = 0; i < 64; i++) data.set([rgb[0], rgb[1], rgb[2], 255], i * 4)
  const tex = new THREE.DataTexture(data, 8, 8, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.minFilter = tex.magFilter = THREE.LinearFilter
  tex.needsUpdate = true
  renderer.initTexture(tex)
  tex.image = { width: size, height: size }
  return tex
}

function heights(h) {
  const data = new Uint16Array(h.size * h.size)
  const deg = (i) => ((i + 0.5) / h.size - 0.5) * h.widthDeg
  for (let r = 0; r < h.size; r++) for (let c = 0; c < h.size; c++) {
    const north = -deg(r)
    const east = deg(c)
    let v = h.base
    for (const b of h.boxes) if (north >= b.north[0] && north <= b.north[1] && east >= b.east[0] && east <= b.east[1]) v = b.value
    data[r * h.size + c] = v
  }
  return data
}

async function shot(o) {
  const loader = new SetLoader(renderer, () => config.formats[config.formatKeys.master], renderer.capabilities.getMaxAnisotropy())
  let levels
  loader.register('one', async (ctx) => {
    levels = (o.heights ?? []).map((h) => ({ height: heightTexture({ ...ctx }, heights(h), h.size), size: h.size, widthDeg: h.widthDeg, low: h.low, high: h.high }))
    return { id: 'one', world: new THREE.Group(), update() {}, dispose() {} }
  })
  await loader.ensure(['one'], 'full')
  const bytes = loader.bytesOf('one')
  const height = new THREE.DataTexture(new Float32Array([0.5, 0.5, 0.5, 0.5]), 2, 2, THREE.RedFormat, THREE.FloatType)
  height.minFilter = height.magFilter = THREE.LinearFilter
  height.needsUpdate = true
  const map = flat(o.map, 8)
  const textures = o.levels.map((l) => flat(l.rgb, l.size))
  const planet = new Planet({
    map, mapWidth: 8, height, heightWidth: 2048,
    light: { wrap: 0.2, power: 1, gain: 1, night: [0, 0, 0], sun: [0.2, 0.15, 0.1], relief: 0, reliefNear: 0, limb: 0 },
    haze: o.haze ?? { scaleHeight: 0.01, depth: 0, day: [0, 0, 0], twilight: [0, 0, 0], strength: 0, extinction: 1, forward: 0, top: 1 },
    patches: { textures, widthsDeg: o.levels.map((l) => l.widthDeg), spot: new THREE.Vector3(0, 0, 1), feather: 0.01, fade: [1, 2], nearDeg: 0, own: o.levels.map(() => o.own ?? true) },
    ...(levels.length ? { cap: { levels, border: o.border, from: o.from, cells: o.cells, pixel: o.pixel, ...(o.reachDeg ? { reachDeg: o.reachDeg } : {}), ...(o.light ? { light: o.light } : {}) } } : {}),
  })
  const cam = new THREE.PerspectiveCamera(o.vfov, o.width / o.height, o.near, 10)
  cam.position.fromArray(o.position)
  cam.up.fromArray(o.up)
  cam.lookAt(new THREE.Vector3().fromArray(o.target))
  const from = cam.position.clone()
  planet.mesh.position.copy(from).negate()
  cam.position.set(0, 0, 0)
  cam.updateMatrixWorld(true)
  const world = new THREE.Scene()
  world.add(planet.mesh)
  planet.update(from, new THREE.Vector3().fromArray(o.sun ?? [0.3, 0.2, 1]).normalize(), 0, 1, 1)
  const target = new THREE.WebGLRenderTarget(o.width, o.height, { type: THREE.FloatType })
  renderer.setRenderTarget(target)
  renderer.setClearColor(0x000000, 0)
  renderer.clear()
  renderer.render(world, cam)
  const out = new Float32Array(o.width * o.height * 4)
  renderer.readRenderTargetPixels(target, 0, 0, o.width, o.height, out)
  renderer.setRenderTarget(null)
  const drawn = planet.cap ? planet.cap.mesh.visible : false
  const triangles = renderer.info.render.triangles
  target.dispose()
  planet.dispose()
  height.dispose()
  for (const t of [map, ...textures]) t.dispose()
  loader.freeAll()
  return { pixels: Array.from(out), bytes, drawn, triangles }
}

window.cap = { shot }
`

interface Box { north: [number, number]; east: [number, number]; value: number }
interface HeightDef { size: number; widthDeg: number; low: number; high: number; base: number; boxes: Box[] }
interface HazeDef { scaleHeight: number; depth: number; day: [number, number, number]; twilight: [number, number, number]; strength: number; extinction: number; forward: number; top: number }
interface CapShot { light?: { relief: number; own: number }; haze?: HazeDef; sun?: [number, number, number]; own?: boolean; map: [number, number, number]; levels: { rgb: [number, number, number]; size: number; widthDeg: number }[]; heights?: HeightDef[]; border: [number, number]; from: [number, number]; cells: number; pixel: number; reachDeg?: number; vfov: number; width: number; height: number; near: number; position: number[]; up: number[]; target: number[] }
interface CapRead { pixels: number[]; bytes: number; drawn: boolean; triangles: number }

const filmicInverse = (v: number): number => {
  const y = Math.min(Math.max(v, 0), 0.985)
  const a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14
  const k = d * y - b
  return (-k - Math.sqrt(Math.max(k * k - 4 * (c * y - a) * e * y, 0))) / (2 * (c * y - a))
}

const have = existsSync(CHROME)

describe.skipIf(!have)('the relief cap in a WebGL2 browser', () => {
  let browser: Browser
  let page: Page
  const errors: string[] = []
  const call = (o: CapShot): Promise<CapRead> => page.evaluate((a) => (window as unknown as { cap: { shot(x: unknown): Promise<unknown> } }).cap.shot(a) as Promise<CapRead>, o)

  beforeAll(async () => {
    const dir = resolve(ROOT, 'out/work/globe-test')
    mkdirSync(dir, { recursive: true })
    const entry = resolve(dir, 'cap-page.js')
    writeFileSync(entry, PAGE)
    const built = await build({
      root: ROOT, configFile: false, logLevel: 'silent',
      build: { write: false, minify: false, target: 'es2022', lib: { entry, formats: ['iife'], name: 'capPage', fileName: 'cap-page' } },
    })
    const output = (Array.isArray(built) ? built[0]! : built) as { output: { type: string; code?: string }[] }
    const code = output.output.find((x) => x.type === 'chunk')!.code!
    browser = await chromium.launch({ executablePath: CHROME, headless: true, args: CHROME_FLAGS })
    page = await browser.newPage()
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()) })
    await page.route('http://cap.test/**', (route) => {
      const url = route.request().url()
      if (url.endsWith('/page.js')) return route.fulfill({ status: 200, contentType: 'text/javascript', body: code })
      if (url === 'http://cap.test/') return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><script src="./page.js"></script>' })
      return route.fulfill({ status: 404, body: '' })
    })
    await page.goto('http://cap.test/')
    await page.waitForFunction(() => 'cap' in window, undefined, { timeout: 60000 })
    expect(errors).toEqual([])
  }, 180000)

  afterAll(async () => {
    await browser?.close()
  })

  const RED: [number, number, number] = [200, 40, 30]
  const GREEN: [number, number, number] = [40, 180, 60]
  const scene = (rgb: [number, number, number]): number[] => rgb.map((b) => filmicInverse(b / 255))
  const is = (p: number[], rgb: [number, number, number]): boolean => scene(rgb).every((v, c) => Math.abs(p[c]! - v) < 2e-3)
  const px = (r: CapRead, o: CapShot, x: number, y: number): number[] => r.pixels.slice((y * o.width + x) * 4, (y * o.width + x) * 4 + 4)
  const rad = (deg: number): number => (deg * Math.PI) / 180
  const flatLevel = (widthDeg: number, size = 128): HeightDef => ({ size, widthDeg, low: 0, high: 0.04, base: 0, boxes: [] })
  const ridge = (value: number): HeightDef => ({ ...flatLevel(12), boxes: [{ north: [1.5, 2], east: [-4, 4], value }] })
  const low: CapShot = {
    map: [128, 128, 128], levels: [{ rgb: RED, size: 8, widthDeg: 30 }, { rgb: GREEN, size: 8, widthDeg: 6 }], border: [0.09, 0.1], from: [2, 1], cells: 128, pixel: 1e-4,
    vfov: 40, width: 96, height: 96, near: 0.001, position: [0, 1.02 * Math.sin(rad(-3.2)), 1.02 * Math.cos(rad(-3.2))], up: [0, 0, 1], target: [0, Math.sin(rad(2)), Math.cos(rad(2))],
  }
  const top: CapShot = { ...low, vfov: 30, near: 0.1, position: [0, 0, 3], up: [0, 1, 0], target: [0, 0, 0], from: [8, 4] }

  it('draws the sphere itself where every height is 0, from above and from close to the ground', async () => {
    for (const view of [top, low]) {
      const off = await call(view)
      const on = await call({ ...view, heights: [flatLevel(12)] })
      expect(off.drawn).toBe(false)
      expect(on.drawn).toBe(true)
      expect(on.triangles).toBeGreaterThan(off.triangles)
      let worst = 0
      let moved = 0
      for (let i = 0; i < on.pixels.length; i++) {
        const d = Math.abs(on.pixels[i]! - off.pixels[i]!)
        worst = Math.max(worst, d)
        if (d > 1e-4) moved++
      }
      expect(moved / on.pixels.length).toBeLessThan(view === top ? 1e-9 : 0.01)
      if (view === top) expect(worst).toBeLessThan(1e-6)
    }
    expect(errors).toEqual([])
  }, 120000)

  it('keeps the picture of the globe to the last bit above its band', async () => {
    const view = { ...top, position: [0, 0, 9.5] }
    const off = await call(view)
    const on = await call({ ...view, heights: [ridge(49151)] })
    expect(on.drawn).toBe(false)
    expect(on.triangles).toBe(off.triangles)
    expect(on.pixels).toEqual(off.pixels)
    expect(on.bytes - off.bytes).toBe(2 * (128 * 128 + 64 * 64 + 32 * 32 + 16 * 16 + 64 + 16 + 4 + 1))
  }, 120000)

  it('raises a ridge as geometry: it hides the ground behind it and stands against the sky above the horizon of the sphere', async () => {
    const off = await call(low)
    const flatCap = await call({ ...low, heights: [flatLevel(12)] })
    const on = await call({ ...low, heights: [ridge(49151)] })
    const x = 48
    const column = (r: CapRead): string => Array.from({ length: low.height }, (_, y) => {
      const p = px(r, low, x, y)
      return is(p, GREEN) ? 'g' : is(p, RED) ? 'r' : p[3] === 0 ? '.' : '?'
    }).join('')
    const a = column(off)
    const b = column(flatCap)
    const c = column(on)
    expect(a).toMatch(/^g+\??r+\.+$/)
    expect(b).toBe(a)
    expect(c).toMatch(/^g+\.+$/)
    const horizon = a.indexOf('.')
    const crest = c.indexOf('.')
    expect(crest).toBeGreaterThan(horizon + 4)
    const eye = 0.02
    const far = Math.atan2(0.03 - eye - (1 - Math.cos(rad(5.2))) * 1.03, Math.sin(rad(5.2)) * 1.03)
    const aim = Math.atan2(-(1.02 - Math.cos(rad(5.2))), Math.sin(rad(5.2)))
    const row = low.height / 2 + (Math.tan(far - aim) / Math.tan(rad(low.vfov / 2))) * (low.height / 2)
    expect(Math.abs(crest - row)).toBeLessThan(2.5)
    expect(errors).toEqual([])
  }, 120000)

  it('sinks a trough below the sphere, and the sphere does not close it', async () => {
    const pit: HeightDef = { ...flatLevel(12), low: -0.04, high: 0, base: 65535, boxes: [{ north: [1, 5], east: [-4, 4], value: 0 }] }
    const off = await call(low)
    const on = await call({ ...low, heights: [pit] })
    const x = 48
    const green = (r: CapRead): number => Array.from({ length: low.height }, (_, y) => (is(px(r, low, x, y), GREEN) ? 1 : 0)).reduce((a: number, b) => a + b, 0)
    expect(green(off) - green(on)).toBeGreaterThan(3)
    for (let y = 0; y < low.height; y++) for (let xx = 0; xx < low.width; xx++) if (px(off, low, xx, y)[3] === 1) expect(px(on, low, xx, y)[3]).toBe(1)
  }, 120000)

  it('leaves no gap between its rim and the sphere, with or without a skirt, from any side', async () => {
    const bump: HeightDef = { ...flatLevel(12), boxes: [{ north: [-2, 2], east: [-2, 2], value: 30000 }] }
    for (const reachDeg of [0, 20]) {
      for (const turn of [0, 1, 2, 3]) {
        const a = rad(7.5)
        const c = Math.cos((turn * Math.PI) / 2 + 0.3)
        const s = Math.sin((turn * Math.PI) / 2 + 0.3)
        const view: CapShot = { ...low, width: 128, height: 128, position: [1.01 * Math.sin(a) * c, 1.01 * Math.sin(a) * s, 1.01 * Math.cos(a)], target: [0, 0, 1], up: [0, 0, 1], ...(reachDeg ? { reachDeg } : {}) }
        const off = await call(view)
        const on = await call({ ...view, heights: [bump] })
        let covered = 0
        for (let i = 3; i < off.pixels.length; i += 4) {
          if (off.pixels[i] !== 1) continue
          covered++
          expect(on.pixels[i]).toBe(1)
        }
        expect(covered).toBeGreaterThan(128 * 128 * 0.3)
      }
    }
    expect(errors).toEqual([])
  }, 240000)

  it('chooses the level of the heights by the pixel as an angle: the same ridge in a picture of twice the rows, a blunter one for a wider pixel', async () => {
    const thin: HeightDef = { ...flatLevel(12, 256), boxes: [{ north: [1.7, 1.75], east: [-4, 4], value: 49151 }] }
    const crest = (r: CapRead, o: CapShot): number => {
      let y = 0
      while (y < o.height && px(r, o, o.width / 2, y)[3] === 1) y++
      return y / o.height
    }
    const small = { ...low, cells: 256, heights: [thin] }
    const big = { ...small, width: 192, height: 192 }
    const a = crest(await call(small), small)
    const b = crest(await call(big), big)
    expect(Math.abs(a - b)).toBeLessThanOrEqual(1 / 96)
    const wide = { ...small, pixel: 4e-2 }
    const flatCrest = crest(await call({ ...low, cells: 256 }), low)
    const c = crest(await call(wide), wide)
    expect(a - flatCrest).toBeGreaterThan(4 / 96)
    expect(c - flatCrest).toBeLessThan((a - flatCrest) * 0.6)
  }, 120000)

  it('lights a slope by the normal of its own heights when `light` is set: brighter toward the Sun, darker away, the level ground as it was', async () => {
    const mesa: HeightDef = { ...flatLevel(12), boxes: [{ north: [-1.5, 1.5], east: [-1.5, 1.5], value: 16384 }] }
    const view: CapShot = { ...top, vfov: 10, sun: [1, 0, 1], levels: [{ rgb: [128, 128, 128], size: 8, widthDeg: 30 }], heights: [mesa] }
    const row = (r: CapRead): number[] => Array.from({ length: 50 }, (_, i) => px(r, view, 23 + i, 48)[1]!)
    for (const own of [true, false]) {
      const plain = row(await call({ ...view, own }))
      const lit = row(await call({ ...view, own, light: own ? { relief: 0, own: 1 } : { relief: 1, own: 0 } })).map((v, i) => v / plain[i]!)
      const other = row(await call({ ...view, own, light: own ? { relief: 1, own: 0 } : { relief: 0, own: 1 } })).map((v, i) => v / plain[i]!)
      expect(Math.min(...plain)).toBeGreaterThan(0.01)
      expect(Math.max(...lit.slice(29, 36))).toBeGreaterThan(1.1)
      expect(Math.min(...lit.slice(14, 21))).toBeLessThan(0.8)
      for (const i of [0, 5, 10, 23, 24, 25, 26, 27, 39, 44, 49]) expect(Math.abs(lit[i]! - 1)).toBeLessThan(0.01)
      for (const v of other) expect(Math.abs(v - 1)).toBeLessThan(0.01)
    }
    expect(errors).toEqual([])
  }, 240000)

  it('measures the haze to its own surface: the sphere\'s depth where the height is 0, more air over a pit, less over a mesa', async () => {
    const haze: HazeDef = { scaleHeight: 0.01, depth: 0.4, day: [1, 1, 1], twilight: [0, 0, 0], strength: 1, extinction: 1, forward: 0, top: 1 }
    const dark: CapShot = { ...top, vfov: 10, map: [10, 10, 10], levels: [{ rgb: [10, 10, 10], size: 8, widthDeg: 30 }], haze }
    const land: HeightDef = { size: 128, widthDeg: 12, low: -0.02, high: 0.02, base: 32768, boxes: [{ north: [-1, 1], east: [-2.5, -0.5], value: 0 }, { north: [-1, 1], east: [0.5, 2.5], value: 65535 }] }
    const level: HeightDef = { ...land, boxes: [] }
    const off = await call(dark)
    const flatCap = await call({ ...dark, heights: [level] })
    const on = await call({ ...dark, heights: [land] })
    expect(flatCap.drawn).toBe(true)
    let worst = 0
    for (let i = 0; i < off.pixels.length; i++) worst = Math.max(worst, Math.abs(flatCap.pixels[i]! - off.pixels[i]!))
    expect(worst).toBeLessThan(2e-5)
    const at = (r: CapRead, eastDeg: number): number => px(r, dark, Math.round(48 + (Math.sin(rad(eastDeg)) / (3 - Math.cos(rad(eastDeg))) / Math.tan(rad(5))) * 48), 48)[1]!
    const datum = at(off, 0)
    expect(datum).toBeGreaterThan(0.05)
    expect(Math.abs(at(on, 0) - datum)).toBeLessThan(datum * 0.01)
    expect(at(on, -1.5)).toBeGreaterThan(datum * 1.5)
    expect(at(on, 1.5)).toBeLessThan(datum * 0.5)
    expect(errors).toEqual([])
  }, 240000)
})
