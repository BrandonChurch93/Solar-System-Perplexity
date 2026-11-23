import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { deflateSync } from 'node:zlib'
import { chromium, type Browser, type Page } from 'playwright-core'
import { build } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { CHROME, CHROME_FLAGS } from '../tools/lib/browser'

const ROOT = resolve(__dirname, '..')
const at = (path: string): string => JSON.stringify(resolve(ROOT, path))

const PAGE = `
import * as THREE from 'three'
import { Planet } from ${at('src/bodies/planet.ts')}
import { SetLoader } from ${at('src/core/sets.ts')}
import { config } from ${at('src/config.ts')}
import { diagUniform } from ${at('src/diagnostics/diag.ts')}

const renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas') })
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  glslVersion: THREE.GLSL3,
  uniforms: { uTex: { value: null }, uLod: { value: 0 } },
  vertexShader: 'out vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: 'precision highp float; uniform sampler2D uTex; uniform float uLod; in vec2 vUv; out vec4 outColor; void main() { outColor = textureLod(uTex, vUv, uLod); }',
}))
const scene = new THREE.Scene()
scene.add(quad)

function read(tex, lod, width, height) {
  const target = new THREE.WebGLRenderTarget(width, height, { depthBuffer: false })
  quad.material.uniforms.uTex.value = tex
  quad.material.uniforms.uLod.value = lod
  renderer.setRenderTarget(target)
  renderer.render(scene, camera)
  const out = new Uint8Array(width * height * 4)
  renderer.readRenderTargetPixels(target, 0, 0, width, height, out)
  renderer.setRenderTarget(null)
  target.dispose()
  return Array.from(out)
}

async function mask(path, width, height, options) {
  const loader = new SetLoader(renderer, () => config.formats[config.formatKeys.master], renderer.capabilities.getMaxAnisotropy())
  let tex
  loader.register('one', async (ctx) => {
    tex = await ctx.texture(path, options)
    return { id: 'one', world: new THREE.Group(), update() {}, dispose() {} }
  })
  await loader.ensure(['one'], 'full')
  const levels = []
  for (let lod = 0; (width >> lod) >= 1 && (height >> lod) >= 1; lod++) levels.push(read(tex, lod, width >> lod, height >> lod))
  const out = { bytes: loader.bytesOf('one'), format: tex.format, colorSpace: tex.colorSpace, levels, between: read(tex, 0, 37, 23), small: read(tex, 0, 5, 3) }
  loader.freeAll()
  return out
}

function flat(rgb, size, anisotropy) {
  const data = new Uint8Array(8 * 8 * 4)
  for (let i = 0; i < 64; i++) data.set([rgb[0], rgb[1], rgb[2], 255], i * 4)
  const tex = new THREE.DataTexture(data, 8, 8, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.minFilter = tex.magFilter = THREE.LinearFilter
  tex.anisotropy = anisotropy
  tex.needsUpdate = true
  renderer.initTexture(tex)
  tex.image = { width: size, height: size }
  return tex
}

function levels(o) {
  const height = new THREE.DataTexture(new Float32Array([0.5, 0.5, 0.5, 0.5]), 2, 2, THREE.RedFormat, THREE.FloatType)
  height.minFilter = height.magFilter = THREE.LinearFilter
  height.needsUpdate = true
  const map = flat(o.map, o.mapWidth, o.anisotropy)
  const textures = o.levels.map((l) => flat(l.rgb, l.size, o.anisotropy))
  const planet = new Planet({
    map, mapWidth: o.mapWidth, height, heightWidth: 2048, segments: o.segments,
    light: { wrap: 0.2, power: 1, gain: 1, night: [0, 0, 0], sun: [0.2, 0.15, 0.1], relief: 0, reliefNear: 0, limb: 0 },
    haze: { scaleHeight: 0.01, depth: 0, day: [0, 0, 0], twilight: [0, 0, 0], strength: 0, extinction: 1, forward: 0, top: 1 },
    patches: { textures, widthsDeg: o.levels.map((l) => l.widthDeg), spot: new THREE.Vector3(0, 0, 1), feather: o.feather, fade: [1, 2], nearDeg: 0, ...(o.own ? { own: o.own } : {}), ...(o.fadeMinor ? { fadeMinor: true } : {}) },
  })
  const cam = new THREE.PerspectiveCamera(o.vfov, o.width / o.height, o.near, 10)
  cam.position.fromArray(o.position)
  cam.up.fromArray(o.up)
  cam.lookAt(new THREE.Vector3().fromArray(o.target))
  cam.updateMatrixWorld(true)
  const world = new THREE.Scene()
  world.add(planet.mesh)
  planet.update(cam.position, new THREE.Vector3(0.3, 0.2, 1).normalize(), 0, 1, 1)
  const target = new THREE.WebGLRenderTarget(o.width, o.height, { type: THREE.FloatType })
  diagUniform.value = o.diag
  renderer.setRenderTarget(target)
  renderer.render(world, cam)
  const out = new Float32Array(o.width * o.height * 4)
  renderer.readRenderTargetPixels(target, 0, 0, o.width, o.height, out)
  renderer.setRenderTarget(null)
  diagUniform.value = 0
  target.dispose()
  planet.dispose()
  height.dispose()
  for (const t of [map, ...textures]) t.dispose()
  return { pixels: Array.from(out), text: planet.material.fragmentShader.length }
}

window.globe = { mask, levels, anisotropy: renderer.capabilities.getMaxAnisotropy() }
`

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc(data: Buffer): number {
  let c = 0xffffffff
  for (const b of data) c = crcTable[(c ^ b) & 255]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(4)
  head.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data])
  const tail = Buffer.alloc(4)
  tail.writeUInt32BE(crc(body))
  return Buffer.concat([head, body, tail])
}

function greyPng(width: number, height: number, value: (x: number, y: number) => number): Buffer {
  const raw = Buffer.alloc((width + 1) * height)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) raw[y * (width + 1) + 1 + x] = value(x, y)
  const head = Buffer.alloc(13)
  head.writeUInt32BE(width, 0)
  head.writeUInt32BE(height, 4)
  head[8] = 8
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

const W = 64
const H = 32
const maskValue = (x: number, y: number): number => (x * 37 + y * 91 + ((x * y) % 7) * 23 + (x === y ? 255 : 0)) % 256

interface MaskRead { bytes: number; format: number; colorSpace: string; levels: number[][]; between: number[]; small: number[] }
interface LevelDef { rgb: [number, number, number]; size: number; widthDeg: number }
interface LevelShot { map: [number, number, number]; mapWidth: number; anisotropy: number; levels: LevelDef[]; feather: number; own?: boolean[]; fadeMinor?: boolean; vfov: number; width: number; height: number; near: number; position: number[]; up: number[]; target: number[]; diag: number; segments: number }

const filmicInverse = (v: number): number => {
  const y = Math.min(Math.max(v, 0), 0.985)
  const a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14
  const k = d * y - b
  return (-k - Math.sqrt(Math.max(k * k - 4 * (c * y - a) * e * y, 0))) / (2 * (c * y - a))
}

const have = existsSync(CHROME)

describe.skipIf(!have)('the globe options in a WebGL2 browser', () => {
  let browser: Browser
  let page: Page
  const call = <T>(name: 'mask' | 'levels', ...args: unknown[]): Promise<T> => page.evaluate(([n, a]) => (window as unknown as { globe: Record<string, (...x: unknown[]) => unknown> }).globe[n as string]!(...(a as unknown[])) as T, [name, args] as [string, unknown[]])

  beforeAll(async () => {
    const dir = resolve(ROOT, 'out/work/globe-test')
    mkdirSync(dir, { recursive: true })
    const entry = resolve(dir, 'page.js')
    writeFileSync(entry, PAGE)
    const built = await build({
      root: ROOT, configFile: false, logLevel: 'silent',
      build: { write: false, minify: false, target: 'es2022', lib: { entry, formats: ['iife'], name: 'globePage', fileName: 'globe-page' } },
    })
    const output = (Array.isArray(built) ? built[0]! : built) as { output: { type: string; code?: string }[] }
    const code = output.output.find((x) => x.type === 'chunk')!.code!
    const png = greyPng(W, H, maskValue)
    browser = await chromium.launch({ executablePath: CHROME, headless: true, args: CHROME_FLAGS })
    page = await browser.newPage()
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    await page.route('http://globe.test/**', (route) => {
      const url = route.request().url()
      if (url.endsWith('/assets/mask.png')) return route.fulfill({ status: 200, contentType: 'image/png', body: png })
      if (url.endsWith('/page.js')) return route.fulfill({ status: 200, contentType: 'text/javascript', body: code })
      if (url === 'http://globe.test/') return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><script src="./page.js"></script>' })
      return route.fulfill({ status: 404, body: '' })
    })
    await page.goto('http://globe.test/')
    await page.waitForFunction(() => 'globe' in window, undefined, { timeout: 60000 })
    expect(errors).toEqual([])
  }, 180000)

  afterAll(async () => {
    await browser?.close()
  })

  it('reads the same values from a mask loaded as one channel, at every mip level and between texels', async () => {
    const four = await call<MaskRead>('mask', 'mask.png', W, H, { srgb: false })
    const one = await call<MaskRead>('mask', 'mask.png', W, H, { srgb: false, channels: 1 })
    expect(four.bytes).toBe(W * H * 4 * 4 / 3)
    expect(one.bytes).toBe(W * H * 4 / 3)
    expect(four.format).toBe(1023)
    expect(one.format).toBe(1028)
    expect(four.levels.length).toBe(6)
    const top = four.levels[0]!
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) expect(top[(y * W + x) * 4]).toBe(maskValue(x, H - 1 - y))
    const reads: [number[], number[]][] = [...four.levels.map((l, i) => [l, one.levels[i]!] as [number[], number[]]), [four.between, one.between], [four.small, one.small]]
    for (const [a, b] of reads) {
      expect(b.length).toBe(a.length)
      for (let i = 0; i < a.length; i += 4) {
        expect(b[i]).toBe(a[i])
        expect([a[i + 1], a[i + 2], a[i + 3]]).toEqual([a[i], a[i], 255])
        expect([b[i + 1], b[i + 2], b[i + 3]]).toEqual([0, 0, 255])
      }
    }
  }, 120000)

  it('keeps the default path at four channels and refuses a one channel texture with the sRGB decode', async () => {
    const plain = await call<MaskRead>('mask', 'mask.png', W, H, {})
    expect(plain.bytes).toBe(W * H * 4 * 4 / 3)
    expect(plain.format).toBe(1023)
    expect(plain.colorSpace).toBe('srgb')
    const flat = await call<MaskRead>('mask', 'mask.png', W, H, { srgb: false, mips: false, channels: 1 })
    expect(flat.bytes).toBe(W * H)
    await expect(call<MaskRead>('mask', 'mask.png', W, H, { channels: 1 })).rejects.toThrow('one channel')
    await expect(call<MaskRead>('mask', 'mask.png', W, H, { srgb: true, channels: 1 })).rejects.toThrow('one channel')
  }, 120000)

  const top: LevelShot = {
    map: [128, 128, 128], mapWidth: 8, anisotropy: 16, feather: 0.4, vfov: 30, width: 128, height: 128, near: 0.1, position: [0, 0, 3], up: [0, 1, 0], target: [0, 0, 0], diag: 0, segments: 320,
    levels: [{ rgb: [230, 204, 178], size: 8, widthDeg: 60 }, { rgb: [77, 64, 51], size: 8, widthDeg: 30 }],
  }
  const row = (pixels: number[], shot: LevelShot, y: number): number[][] => Array.from({ length: shot.width }, (_, x) => pixels.slice((y * shot.width + x) * 4, (y * shot.width + x) * 4 + 3))

  it('shows an own level as its scene values and mixes it with the lit ground by its weight', async () => {
    const own = row((await call<{ pixels: number[] }>('levels', { ...top, own: [false, true] })).pixels, top, 64)
    const lit = row((await call<{ pixels: number[] }>('levels', { ...top, levels: [top.levels[0]!] })).pixels, top, 64)
    const both = row((await call<{ pixels: number[] }>('levels', top)).pixels, top, 64)
    const scene = top.levels[1]!.rgb.map((b) => filmicInverse(b / 255))
    for (let c = 0; c < 3; c++) expect(own[64]![c]).toBeCloseTo(scene[c]!, 5)
    expect(Math.abs(both[64]![0]! - scene[0]!)).toBeGreaterThan(0.01)
    let inside = 0
    let outside = 0
    let feather = 0
    let last = 1
    for (let x = 64; x < 128; x++) {
      const w = [0, 1, 2].map((c) => (own[x]![c]! - lit[x]![c]!) / (scene[c]! - lit[x]![c]!))
      if (lit[x]![0] === 0) continue
      expect(Math.abs(w[0]! - w[1]!)).toBeLessThan(2e-4)
      expect(Math.abs(w[0]! - w[2]!)).toBeLessThan(2e-4)
      expect(w[0]!).toBeGreaterThanOrEqual(-1e-6)
      expect(w[0]!).toBeLessThanOrEqual(last + 1e-6)
      for (let c = 0; c < 3; c++) {
        expect(own[x]![c]!).toBeGreaterThanOrEqual(Math.min(lit[x]![c]!, scene[c]!) - 1e-6)
        expect(own[x]![c]!).toBeLessThanOrEqual(Math.max(lit[x]![c]!, scene[c]!) + 1e-6)
      }
      last = w[0]!
      if (w[0]! > 0.999) inside++
      else if (w[0]! > 0.2 && w[0]! < 0.8) feather++
      else if (w[0]! === 0) {
        outside++
        expect(own[x]).toEqual(lit[x])
      }
    }
    expect(inside).toBeGreaterThan(3)
    expect(feather).toBeGreaterThan(1)
    expect(outside).toBeGreaterThan(3)
  }, 120000)

  it('lets a lit level drawn over an own level take the pixel back', async () => {
    const stack = { ...top, feather: 0.1, levels: [{ ...top.levels[1]!, widthDeg: 60 }, { ...top.levels[0]!, widthDeg: 30 }] }
    const mixed = row((await call<{ pixels: number[] }>('levels', { ...stack, own: [true, false] })).pixels, stack, 64)
    const lit = row((await call<{ pixels: number[] }>('levels', stack)).pixels, stack, 64)
    expect(mixed[64]).toEqual(lit[64])
    expect(mixed[64]![0]).toBeGreaterThan(0)
    const scene = stack.levels[0]!.rgb.map((b) => filmicInverse(b / 255))
    const ring = mixed.findIndex((p, x) => x > 64 && Math.abs(p[0]! - scene[0]!) < 1e-5)
    expect(ring).toBeGreaterThan(64)
  }, 120000)

  const h = 0.005
  const pitch = (20 * Math.PI) / 180
  const graze: LevelShot = {
    map: [128, 128, 128], mapWidth: 16384, anisotropy: 16, feather: 0.1, vfov: 60, width: 256, height: 144, near: 0.0005, position: [0, 0, 1 + h], up: [0, 0, 1], target: [0, Math.cos(pitch), 1 + h - Math.sin(pitch)], diag: 0, segments: 1280,
    levels: [{ rgb: [128, 0, 0], size: 4096, widthDeg: 60 }, { rgb: [0, 128, 0], size: 4096, widthDeg: 30 }, { rgb: [0, 0, 128], size: 4096, widthDeg: 15 }],
  }

  function footprint(shot: LevelShot, x: number, y: number, level: LevelDef): { major: number; minor: number } {
    const t = Math.tan((shot.vfov * Math.PI) / 360)
    const f = [0, Math.cos(pitch), -Math.sin(pitch)]
    const r = [1, 0, 0]
    const u = [0, Math.sin(pitch), Math.cos(pitch)]
    const g = (px: number, py: number): [number, number] => {
      const sx = ((px + 0.5) / shot.width * 2 - 1) * t * shot.width / shot.height
      const sy = ((py + 0.5) / shot.height * 2 - 1) * t
      const d = [0, 1, 2].map((i) => f[i]! + r[i]! * sx + u[i]! * sy)
      const n = Math.hypot(d[0]!, d[1]!, d[2]!)
      const dir = d.map((v) => v / n)
      const o = shot.position
      const b = o[0]! * dir[0]! + o[1]! * dir[1]! + o[2]! * dir[2]!
      const c = o[0]! * o[0]! + o[1]! * o[1]! + o[2]! * o[2]! - 1
      const s = -b - Math.sqrt(b * b - c)
      const p = [0, 1, 2].map((i) => o[i]! + dir[i]! * s)
      return [p[0]! / p[2]!, p[1]! / p[2]!]
    }
    const x0 = x - (x % 2)
    const y0 = y - (y % 2)
    const gx = [g(x0 + 1, y)[0] - g(x0, y)[0], g(x0 + 1, y)[1] - g(x0, y)[1]]
    const gy = [g(x, y0 + 1)[0] - g(x, y0)[0], g(x, y0 + 1)[1] - g(x, y0)[1]]
    const k = level.size / (2 * Math.tan((level.widthDeg * Math.PI) / 360))
    const major = Math.sqrt(Math.max(gx[0]! * gx[0]! + gx[1]! * gx[1]!, gy[0]! * gy[0]! + gy[1]! * gy[1]!))
    const minor = Math.abs(gx[0]! * gy[1]! - gx[1]! * gy[0]!) / major
    return { major: major * k, minor: minor * k }
  }

  it('brings the finer level in on a grazing view only with the flag, and reports the fine axis in blue', async () => {
    const own = [true, true, true]
    const cx = 128
    const cy = 72
    const at = (pixels: number[], shot: LevelShot): number[] => pixels.slice((cy * shot.width + cx) * 4, (cy * shot.width + cx) * 4 + 4)
    const far = footprint(graze, cx, cy, graze.levels[1]!)
    const fine = footprint(graze, cx, cy, graze.levels[2]!)
    expect(far.major).toBeGreaterThan(2)
    expect(far.minor).toBeLessThan(1)
    const before = at((await call<{ pixels: number[] }>('levels', { ...graze, own })).pixels, graze)
    const after = at((await call<{ pixels: number[] }>('levels', { ...graze, own, fadeMinor: true })).pixels, graze)
    expect(before[2]).toBe(0)
    expect(before[1]).toBeGreaterThan(0.1)
    expect(after[0]).toBe(0)
    expect(after[1]).toBe(0)
    expect(after[2]).toBeCloseTo(filmicInverse(128 / 255), 5)
    const texelsBefore = at((await call<{ pixels: number[] }>('levels', { ...graze, diag: 2 })).pixels, graze)
    const texelsAfter = at((await call<{ pixels: number[] }>('levels', { ...graze, diag: 2, fadeMinor: true })).pixels, graze)
    expect(texelsBefore[2]).toBe(0)
    expect(texelsBefore[0]! / (Math.min(far.major, 2) * 0.5)).toBeCloseTo(1, 1)
    expect(texelsAfter[0]).toBe(1)
    expect(texelsAfter[1]).toBe(1)
    expect(fine.minor).toBeGreaterThan(1)
    expect(fine.minor).toBeLessThan(2)
    expect(texelsAfter[2]! / (fine.minor * 0.5)).toBeGreaterThan(0.94)
    expect(texelsAfter[2]! / (fine.minor * 0.5)).toBeLessThan(1.06)
    const capped = at((await call<{ pixels: number[] }>('levels', { ...graze, diag: 2, fadeMinor: true, anisotropy: 2 })).pixels, graze)
    const drawn = fine.minor / Math.max(fine.major / 2, 1)
    expect(fine.major / 2).toBeGreaterThan(fine.minor)
    expect(capped[2]! / (drawn * 0.5)).toBeGreaterThan(0.94)
    expect(capped[2]! / (drawn * 0.5)).toBeLessThan(1.06)
  }, 120000)
})
