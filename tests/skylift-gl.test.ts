import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium, type Browser, type Page } from 'playwright-core'
import { build } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { CHROME, CHROME_FLAGS } from '../tools/lib/browser'
import { flightSwap } from '../src/space/sky'

const ROOT = resolve(__dirname, '..')
const at = (path: string): string => JSON.stringify(resolve(ROOT, path))
const MAPS = resolve(ROOT, 'public/assets/shared/full')
const NAMES = ['sky.jpg', 'skyband.jpg', 'skybandglow.png', 'skybandstars.bin']

const PAGE = `
import * as THREE from 'three'
import { Sky, nameSkyLook } from ${at('src/space/sky.ts')}
import { config } from ${at('src/config.ts')}

const W = 1920, H = 1080
const open = config.raw.travel.sky
const renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas') })
renderer.autoClear = false
const target = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType, format: THREE.RGBAFormat, depthBuffer: true, stencilBuffer: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false, colorSpace: THREE.LinearSRGBColorSpace })
const sky = new Sky(900000)
sky.setFlightStars(open.flightStars)
const out = new Float32Array(W * H * 4)
const luma = new Float32Array(W * H)
const sorted = new Float32Array(W * H)
const sun = { dir: new THREE.Vector3(0, 0, 1), color: new THREE.Color(1, 1, 1), intensity: 1, angularRadius: 0.004, glare: 0 }

async function map(name, smooth) {
  const res = await fetch('./maps/' + name)
  const bitmap = await createImageBitmap(await res.blob(), { imageOrientation: 'flipY', colorSpaceConversion: 'none' })
  const tex = new THREE.Texture(bitmap)
  tex.flipY = false
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.minFilter = smooth ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.generateMipmaps = !smooth
  tex.anisotropy = smooth ? 1 : Math.min(4, renderer.capabilities.getMaxAnisotropy())
  tex.needsUpdate = true
  renderer.initTexture(tex)
  bitmap.close()
  return tex
}

const filmic = (x) => Math.min(Math.max(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0), 1)

async function load() {
  const glow = await map('sky.jpg', false)
  const band = await map('skyband.jpg', false)
  const strip = await map('skybandglow.png', true)
  const points = await (await fetch('./maps/skybandstars.bin')).arrayBuffer()
  sky.setTexture(glow, band)
  sky.setFlightBand(strip, points, open.flightStrip)
  return true
}

function walk(view, lifts, marks) {
  const camera = new THREE.PerspectiveCamera(view.vfov, W / H, 0.1, 100)
  const q = new THREE.Quaternion().fromArray(view.q)
  const turn = new THREE.Quaternion().fromArray(view.turn)
  sky.setFrame(new THREE.Quaternion().fromArray(view.frame))
  sky.setPatches([])
  sky.setBandLook(view.look)
  const rows = []
  let over = null
  for (const lift of lifts) {
    sky.setStarLift(lift, open.starLevel / view.exposure, open.flightStars.level)
    renderer.setRenderTarget(target)
    renderer.clear(true, true, true)
    sky.render(renderer, target, camera, q, view.exposure, 1, turn, H, sun, 0.45, W / H, null)
    renderer.readRenderTargetPixels(target, 0, 0, W, H, out)
    let mean = 0
    for (let i = 0; i < W * H; i++) {
      const y = 0.2126 * out[i * 4] + 0.7152 * out[i * 4 + 1] + 0.0722 * out[i * 4 + 2]
      luma[i] = y
      mean += filmic(y)
    }
    sorted.set(luma)
    sorted.sort()
    const cuts = marks.map((m) => sorted[Math.min(Math.floor(m * W * H), W * H - 1)])
    if (!over) over = cuts.slice(2)
    const shares = over.map((t) => { let n = 0; for (let i = 0; i < W * H; i++) if (luma[i] > t) n++; return n })
    rows.push([mean / (W * H), ...cuts, ...shares])
  }
  renderer.setRenderTarget(null)
  return rows
}

function named(view, look, weight) {
  const camera = new THREE.PerspectiveCamera(view.vfov, W / H, 0.1, 100)
  const q = new THREE.Quaternion().fromArray(view.q)
  const turn = new THREE.Quaternion().fromArray(view.turn)
  sky.setFrame(new THREE.Quaternion().fromArray(view.frame))
  sky.setPatches([])
  sky.setStarLift(0, open.starLevel / view.exposure, open.flightStars.level)
  const shoot = () => {
    renderer.setRenderTarget(target)
    renderer.clear(true, true, true)
    sky.render(renderer, target, camera, q, view.exposure, 1, turn, H, sun, 0.45, W / H, null)
    renderer.readRenderTargetPixels(target, 0, 0, W, H, out)
    let sum = 0, red = 0, blue = 0, top = 0
    for (let i = 0; i < W * H; i++) {
      const y = 0.2126 * out[i * 4] + 0.7152 * out[i * 4 + 1] + 0.0722 * out[i * 4 + 2]
      sum += y
      red += out[i * 4]
      blue += out[i * 4 + 2]
      if (y > top) top = y
    }
    return [sum / (W * H), red / Math.max(blue, 1e-9), top]
  }
  sky.setBandLook(view.look)
  const plain = shoot()
  sky.setBandLook(view.look)
  nameSkyLook('test', look, weight)
  const told = shoot()
  const once = shoot()
  nameSkyLook('test', look, weight)
  sky.setBandLook(view.look)
  const cleared = shoot()
  renderer.setRenderTarget(null)
  return { plain, told, once, cleared }
}

function terrain(view, shares, low) {
  const camera = new THREE.PerspectiveCamera(view.vfov, W / H, 0.1, 100)
  const q = new THREE.Quaternion().fromArray(view.q)
  const turn = new THREE.Quaternion().fromArray(view.turn)
  sky.setFrame(new THREE.Quaternion().fromArray(view.frame))
  sky.setPatches([])
  sky.setBandLook(view.look)
  sky.setStarLift(0, open.starLevel / view.exposure, open.flightStars.level)
  const kept = new Float32Array(W * H * 4)
  const shoot = (weight, glow) => {
    sky.setTerrain(weight)
    renderer.setRenderTarget(target)
    renderer.clear(true, true, true)
    sky.render(renderer, target, camera, q, view.exposure, glow, turn, H, sun, 0.45, W / H, null)
    renderer.readRenderTargetPixels(target, 0, 0, W, H, out)
    let mean = 0
    for (let i = 0; i < W * H; i++) mean += filmic(0.2126 * out[i * 4] + 0.7152 * out[i * 4 + 1] + 0.0722 * out[i * 4 + 2])
    return mean / (W * H)
  }
  const differ = () => { let n = 0; for (let i = 0; i < W * H * 4; i++) if (out[i] !== kept[i]) n++; return n }
  const high = shoot(null, 1)
  kept.set(out)
  shoot(0, 1)
  const orbit = differ()
  const ground = shoot(null, low)
  kept.set(out)
  shoot(1, low)
  const surface = differ()
  const means = shares.map((s) => shoot(s, 1 + (low - 1) * s))
  sky.setTerrain(null)
  renderer.setRenderTarget(null)
  return { high, ground, orbit, surface, means }
}

window.skylift = { load, walk, named, terrain }
`

const FRAME = [0.883493, -0.063783, 0.25535, 0.387516]
const VIEWS = [
  { name: 'the band at the rise of Saturn (frame 3872)', q: [-0.731064, 0.250474, -0.609753, 0.176095], turn: [-0.298422, 0.285698, -0.769956, -0.486302], vfov: 30.7071, exposure: 0.53 },
  { name: 'the dark field off the band at the rise of Neptune (frame 5010)', q: [-0.35048, -0.079608, -0.66713, 0.652506], turn: [-0.312747, -0.312503, 0.457283, 0.771637], vfov: 30, exposure: 0.45 },
]
const MARKS = [0.1, 0.5, 0.9, 0.99, 0.999]
const LEVELS = ['mean of the toned picture', 'percentile 10', 'median', 'percentile 90', 'percentile 99', 'percentile 99.9']
const COUNTS = ['pixels over the first percentile 90', 'pixels over the first percentile 99', 'pixels over the first percentile 99.9']
const COUNT_SLACK = 0.005
const STEPS = Number(process.env.SKYLIFT_STEPS ?? 50)
const LIFTS = Array.from({ length: STEPS + 1 }, (_, k) => k / STEPS)
const POWER = 2

const have = existsSync(CHROME) && NAMES.every((n) => existsSync(resolve(MAPS, n)))

describe('the swap of the band by the lift', () => {
  it('is 0 at no lift, 1 at the full lift and never falls between', () => {
    for (const power of [1, POWER, 4]) {
      expect(flightSwap(0, power)).toBe(0)
      expect(flightSwap(1, power)).toBe(1)
      expect(flightSwap(-1, power)).toBe(0)
      expect(flightSwap(2, power)).toBe(1)
      let last = 0
      for (let k = 1; k <= 1000; k++) {
        const now = flightSwap(k / 1000, power)
        expect(now).toBeGreaterThanOrEqual(last)
        last = now
      }
    }
    expect(flightSwap(0.5, POWER)).toBeCloseTo(0.75, 12)
  })
})

describe.skipIf(!have)('the sky of the film under the lift of the stars in a WebGL2 browser', () => {
  let browser: Browser
  let page: Page

  beforeAll(async () => {
    const dir = resolve(ROOT, 'out/work/skylift-test')
    mkdirSync(dir, { recursive: true })
    const entry = resolve(dir, 'page.js')
    writeFileSync(entry, PAGE)
    const built = await build({
      root: ROOT, configFile: false, logLevel: 'silent',
      build: { write: false, minify: false, target: 'es2022', lib: { entry, formats: ['iife'], name: 'skyliftPage', fileName: 'skylift-page' } },
    })
    const output = (Array.isArray(built) ? built[0]! : built) as { output: { type: string; code?: string }[] }
    const code = output.output.find((x) => x.type === 'chunk')!.code!
    browser = await chromium.launch({ executablePath: CHROME, headless: true, args: CHROME_FLAGS })
    page = await browser.newPage()
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    await page.route('http://skylift.test/**', (route) => {
      const url = route.request().url()
      const name = NAMES.find((n) => url.endsWith('/maps/' + n))
      if (name) return route.fulfill({ status: 200, contentType: name.endsWith('.jpg') ? 'image/jpeg' : name.endsWith('.png') ? 'image/png' : 'application/octet-stream', body: readFileSync(resolve(MAPS, name)) })
      if (url.endsWith('/page.js')) return route.fulfill({ status: 200, contentType: 'text/javascript', body: code })
      if (url === 'http://skylift.test/') return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><script src="./page.js"></script>' })
      return route.fulfill({ status: 404, body: '' })
    })
    await page.goto('http://skylift.test/')
    await page.waitForFunction(() => 'skylift' in window, undefined, { timeout: 60000 })
    await page.evaluate(() => (window as unknown as { skylift: { load(): Promise<boolean> } }).skylift.load())
    expect(errors).toEqual([])
  }, 300000)

  afterAll(async () => {
    await browser?.close()
  })

  for (const view of VIEWS) {
    it('lets no pixel class fall as the lift walks from 0 to 1 over ' + view.name, async () => {
      const rows = await page.evaluate(([v, lifts, marks]) => (window as unknown as { skylift: { walk(v: unknown, lifts: number[], marks: number[]): number[][] } }).skylift.walk(v, lifts, marks), [{ ...view, frame: FRAME, look: 1 }, LIFTS, MARKS] as [unknown, number[], number[]])
      expect(rows.length).toBe(STEPS + 1)
      if (process.env.SKYLIFT_PRINT) for (let k = 0; k <= STEPS; k++) console.log((k / STEPS).toFixed(3), rows[k]!.map((x) => (x > 100 ? x.toFixed(0) : x.toPrecision(5))).join(' '))
      const falls: string[] = []
      for (let c = 0; c < LEVELS.length; c++) for (let k = 1; k <= STEPS; k++) if (rows[k]![c]! < rows[k - 1]![c]!) falls.push(LEVELS[c] + ' falls from ' + rows[k - 1]![c] + ' to ' + rows[k]![c] + ' at the lift ' + (k / STEPS).toFixed(3))
      for (let c = 0; c < COUNTS.length; c++) {
        let high = rows[0]![LEVELS.length + c]!
        for (let k = 1; k <= STEPS; k++) {
          const now = rows[k]![LEVELS.length + c]!
          if (now < high * (1 - COUNT_SLACK)) falls.push(COUNTS[c] + ' fall from ' + high + ' to ' + now + ' at the lift ' + (k / STEPS).toFixed(3))
          high = Math.max(high, now)
        }
      }
      if (falls.length) console.log(falls.join('\n'))
      expect(falls.length).toBe(0)
      for (let c = 0; c < LEVELS.length + COUNTS.length; c++) expect(rows[STEPS]![c]!).toBeGreaterThan(rows[0]![c]!)
    }, 900000)
  }

  it('draws the look a stop names for one picture and the plain sky again after it', async () => {
    const view = { ...VIEWS[0]!, frame: FRAME, look: 1 }
    type Shots = { plain: number[]; told: number[]; once: number[]; cleared: number[] }
    const run = async (look: unknown, weight: number): Promise<Shots> => {
      const shots = await page.evaluate(([v, l, w]) => (window as unknown as { skylift: { named(v: unknown, l: unknown, w: number): Shots } }).skylift.named(v, l, w), [view, look, weight] as [unknown, unknown, number])
      if (process.env.SKYLIFT_PRINT) console.log(JSON.stringify(look), weight, JSON.stringify(shots))
      return shots
    }
    const stars = await run({ stars: 3 }, 1)
    expect(stars.told[0]!).toBeGreaterThan(stars.plain[0]!)
    expect(stars.once).toEqual(stars.plain)
    expect(stars.cleared).toEqual(stars.plain)
    const none = await run({ stars: 3, band: 0.2, map: 3, even: 1, look: 0, cap: 0.5 }, 0)
    expect(none.told).toEqual(none.plain)
    const cool = await run({ look: 0 }, 1)
    expect(cool.told[1]!).toBeLessThan(cool.plain[1]!)
    const dim = await run({ band: 0.5 }, 1)
    expect(dim.told[0]!).toBeLessThan(dim.plain[0]!)
    const map = await run({ map: 2 }, 1)
    expect(map.told[0]!).toBeGreaterThan(map.plain[0]!)
    const cap = await run({ cap: 0.5 }, 1)
    expect(cap.told[0]!).toBeLessThan(cap.plain[0]!)
    const even = await run({ even: 1 }, 1)
    expect(even.told[0]!).not.toBe(even.plain[0]!)
    const half = await run({ stars: 3 }, 0.5)
    expect(half.told[0]!).toBeGreaterThan(stars.plain[0]!)
    expect(half.told[0]!).toBeLessThan(stars.told[0]!)
  }, 300000)

  it('brings the law of the sky seen from a surface in by the share of that sky, with no step where the share begins', async () => {
    const view = { ...VIEWS[0]!, frame: FRAME, look: 1 }
    const shares = [0, 0.0005, 0.001, 0.0013, 0.0014, 0.002, 0.005, ...Array.from({ length: 20 }, (_, k) => (k + 1) / 20)]
    type Run = { high: number; ground: number; orbit: number; surface: number; means: number[] }
    const run = await page.evaluate(([v, list, low]) => (window as unknown as { skylift: { terrain(v: unknown, list: number[], low: number): Run } }).skylift.terrain(v, list, low), [view, shares, 0.25] as [unknown, number[], number])
    if (process.env.SKYLIFT_PRINT) console.log(JSON.stringify(run))
    expect(run.orbit).toBe(0)
    expect(run.surface).toBe(0)
    expect(run.means[0]!).toBe(run.high)
    expect(run.means[shares.length - 1]!).toBe(run.ground)
    for (let k = 1; k < shares.length; k++) expect(Math.abs(run.means[k]! - run.means[k - 1]!)).toBeLessThan(run.high * Math.max(1.5 * (shares[k]! - shares[k - 1]!), 0.002))
  }, 300000)
})
