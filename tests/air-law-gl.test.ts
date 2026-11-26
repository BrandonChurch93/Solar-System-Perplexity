import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium, type Browser, type Page } from 'playwright-core'
import { build } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { CHROME, CHROME_FLAGS } from '../tools/lib/browser'
import { airLaw, airLawDepth, airLawDepthOut, airLawFactor, airLawFactorSeen, airLawGather, airLawGatherOut, airLawHeld, airLawSeen, type AirVec } from '../src/terrain/air'
import { airLawKnots, airLawPoint, type ReliefAirLaw } from '../src/terrain/relief'

// The relief under the air law in a WebGL2 browser (ReliefMotion.airLaw): the pixels, read back as floats and held against the twins of
// src/terrain/air.ts. A small relief of one flat picture at one distance, with or without sky around it, is drawn over a flat back
// from the picture's eye and from other eyes. The law itself is tests/air-law.test.ts, the shader texts tests/air-law-relief.test.ts.

const ROOT = resolve(__dirname, '..')
const at = (path: string): string => JSON.stringify(resolve(ROOT, path))

const PAGE = `
import * as THREE from 'three'
import { Relief } from ${at('src/terrain/relief.ts')}
import { frameUniform } from ${at('src/core/frame.ts')}
import { setDiag } from ${at('src/diagnostics/diag.ts')}

const renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas') })

function flat(rgba, srgb) {
  const data = new Uint8Array(8 * 8 * 4)
  for (let i = 0; i < 64; i++) data.set(rgba, i * 4)
  const tex = new THREE.DataTexture(data, 8, 8, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.minFilter = tex.magFilter = THREE.LinearFilter
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

async function shot(o) {
  const ctx = {
    texture: async (path, options) => flat(o.files[path], !!(options && options.srgb)),
    buffer: async (path) => new Float32Array(4).fill(o.dist[path]).buffer,
  }
  const relief = await Relief.load(ctx, '', o.def, o.motion)
  if (o.presence) relief.presence(o.presence[0], o.presence.length > 1 ? { air: o.presence[1] } : {})
  frameUniform.value = 1
  const s = o.scale ?? 1
  const eye = o.eye ?? [0, 0, 0]
  const cam = new THREE.PerspectiveCamera(o.def.vfovDeg, o.width / o.height, 0.1 * s, 1000 * s)
  if (s !== 1) relief.group.scale.setScalar(s)
  relief.update(0, o.gain ?? 1, 0, { format: { width: o.width, height: o.height }, camera: cam })
  cam.position.set(eye[0] * s, eye[1] * s, eye[2] * s)
  cam.updateMatrixWorld(true)
  const scene = new THREE.Scene()
  scene.add(relief.group)
  const target = new THREE.WebGLRenderTarget(o.width, o.height, { type: THREE.FloatType })
  renderer.setRenderTarget(target)
  renderer.setClearColor(new THREE.Color(o.back[0], o.back[1], o.back[2]), 1)
  setDiag(o.diag ?? 'beauty')
  renderer.render(scene, cam)
  setDiag('beauty')
  const out = new Float32Array(o.width * o.height * 4)
  renderer.readRenderTargetPixels(target, 0, 0, o.width, o.height, out)
  renderer.setRenderTarget(null)
  target.dispose()
  let chunks = 0
  relief.group.traverse((x) => {
    if (x.material && x.material.fragmentShader.includes('float airLawDepth(vec3 a, vec3 b, float scaleHeight)')) chunks++
  })
  relief.dispose()
  return { pixels: Array.from(out), chunks }
}

window.airLawPage = { shot }
`

interface Shot { def: Record<string, unknown>; motion: Record<string, unknown>; files: Record<string, number[]>; dist: Record<string, number>; width: number; height: number; back: [number, number, number]; eye?: [number, number, number]; scale?: number; gain?: number; diag?: string; presence?: number[] }

const W = 32
const H = 16
const VFOV = 40
// The planet of the set: a ball of 50 under a picture's eye half a unit over it, level lens. The scale height is one unit.
const LAW: ReliefAirLaw = { light: [0.31, 0.52, 0.08], density: 12, scaleHeight: 0.02, radius: 50, eyeHeight: 0.5 }
// The same air with its light by height: whole from a scale height and a half over the datum, falling to three tenths a scale height
// under it. The picture's points stand from two scale heights under the datum to two and a half over it.
const KNOTS: ReliefAirLaw = { ...LAW, knots: [[-1, 0.3], [0.5, 0.7], [1.5, 1]] }
// The numbers of a place as large as the film's: a ball of 972.27 under an eye one unit over it, a scale height of a thousandth of
// the radius, the knots a scale height and a half and a scale height apart. What the shader's 32 bit keeps of heights that small.
const LARGE: ReliefAirLaw = { light: [0.31, 0.52, 0.08], density: 200, scaleHeight: 0.001, radius: 972.27, eyeHeight: 1, knots: [[-1, 0.3], [0.5, 0.7], [1.5, 1]] }
const PITCH = 0
const FAR = 6
const whole: Shot = {
  def: {
    imageSize: [W, H],
    vfovDeg: VFOV,
    layers: [{ color: 'far-color.jpg', dist: 'far.bin', box: [0, 0, W, H], distSize: [2, 2], tint: [1, 1, 1] }],
    masks: 'masks.png',
    maskBox: [0, 0, W, H],
    mistDir: [1, 0],
  },
  motion: { mistSpeed: 0, dustSpeed: 0, dustDir: [1, 0], mesh: 16, pitchDeg: PITCH },
  files: { 'far-color.jpg': [200, 120, 60, 255], 'masks.png': [0, 0, 0, 255] },
  dist: { 'far.bin': FAR },
  width: W,
  height: H,
  back: [0.2, 0.3, 0.4],
}
// The same picture as a patch in the middle, sky around it.
const patch: Shot = { ...whole, def: { ...whole.def, layers: [{ color: 'far-color.jpg', dist: 'far.bin', box: [8, 4, 16, 8], distSize: [2, 2], tint: [1, 1, 1] }] } }
const lawful = (s: Shot, law: ReliefAirLaw = LAW): Shot => ({ ...s, motion: { ...s.motion, airLaw: law } })

const pixel = (p: number[], x: number, y: number): number[] => p.slice((y * W + x) * 4, (y * W + x) * 4 + 4)
// The sight line of a pixel's centre in the relief's frame (the lens looks down -z, rows from the bottom).
const ray = (x: number, y: number): [number, number, number] => {
  const t = Math.tan((VFOV * Math.PI) / 360)
  const v: [number, number, number] = [(((x + 0.5) / W) * 2 - 1) * t * (W / H), (((y + 0.5) / H) * 2 - 1) * t, -1]
  const n = Math.hypot(v[0], v[1], v[2])
  return [v[0] / n, v[1] / n, v[2] / n]
}
// A fragment's place comes from the rasteriser's own interpolation over the triangle, which stands a little off the pixel's centre
// (measured in tests/relief-gl.test.ts: 0.013 of a pixel there; here up to 0.027). So a pixel is held against the twin within what the
// twin itself changes when the sight line moves by SHIFT of a pixel, a sixteenth, plus FLOAT for the 32 bit of the shader.
const SHIFT = 0.0625
const SHIFTS: [number, number][] = [[SHIFT, 0], [-SHIFT, 0], [0, SHIFT], [0, -SHIFT]]
const FLOAT = 2e-4
// The distance of a fragment from the lens out of the depth view (src/diagnostics/diag.ts: log2(1 + distance) / 14).
const distanceOf = (d: number): number => 2 ** (d * 14) - 1

const have = existsSync(CHROME)

describe.skipIf(!have)('the air law of a relief in a WebGL2 browser', () => {
  let browser: Browser
  let page: Page
  const errors: string[] = []
  const shoot = async (o: Shot): Promise<number[]> => {
    const out = await page.evaluate((x) => (window as unknown as { airLawPage: { shot(o: unknown): Promise<{ pixels: number[]; chunks: number }> } }).airLawPage.shot(x), o)
    // With the law every layer and the dome hold the chunk; without it nothing does.
    expect(out.chunks).toBe('airLaw' in o.motion ? (o.def as { layers: object[] }).layers.length + 1 : 0)
    return out.pixels
  }
  // What the twins give for the pixel of a layer: the plain pixel through the law, from the present eye, by the fragment's own place.
  const twin = (plain: number[], distance: number, x: number, y: number, eye: AirVec, law: ReliefAirLaw, gain: number): { colour: [number, number, number]; factor: number } => {
    const d = ray(x, y)
    const point = airLawPoint([eye[0] + d[0] * distance, eye[1] + d[1] * distance, eye[2] + d[2] * distance], law, PITCH)
    const depth = airLawDepth(airLawPoint(eye, law, PITCH), point, law.scaleHeight)
    const seen = airLawDepth(airLawPoint([0, 0, 0], law, PITCH), point, law.scaleHeight)
    const factor = airLawFactorSeen(depth, seen, law.density, law.least ?? 0)
    return { colour: airLaw([plain[0]!, plain[1]!, plain[2]!], [law.light[0] * gain, law.light[1] * gain, law.light[2] * gain], factor), factor }
  }

  beforeAll(async () => {
    const dir = resolve(ROOT, 'out/work/air-law-test')
    mkdirSync(dir, { recursive: true })
    const entry = resolve(dir, 'page.js')
    writeFileSync(entry, PAGE)
    const built = await build({
      root: ROOT, configFile: false, logLevel: 'silent',
      build: { write: false, minify: false, target: 'es2022', lib: { entry, formats: ['iife'], name: 'airLawPage', fileName: 'air-law-page' } },
    })
    const output = (Array.isArray(built) ? built[0]! : built) as { output: { type: string; code?: string }[] }
    const code = output.output.find((x) => x.type === 'chunk')!.code!
    browser = await chromium.launch({ executablePath: CHROME, headless: true, args: CHROME_FLAGS })
    page = await browser.newPage()
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    await page.route('http://airlaw.test/**', (route) => {
      const url = route.request().url()
      if (url.endsWith('/page.js')) return route.fulfill({ status: 200, contentType: 'text/javascript', body: code })
      if (url === 'http://airlaw.test/') return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><script src="./page.js"></script>' })
      return route.fulfill({ status: 404, body: '' })
    })
    await page.goto('http://airlaw.test/')
    await page.waitForFunction(() => 'airLawPage' in window, undefined, { timeout: 60000 })
    expect(errors).toEqual([])
  }, 180000)

  afterAll(async () => {
    await browser?.close()
  })

  it('from the picture own eye the picture comes back, for any three numbers', async () => {
    const plain = await shoot(whole)
    let worst = 0
    for (const law of [LAW, { ...LAW, density: 300, light: [3, 0.01, 0.5] as [number, number, number] }, { ...LAW, density: 0.2, scaleHeight: 0.1 }, { ...LAW, density: 5000, scaleHeight: 0.0005, eyeHeight: 0.01 }, { ...LAW, density: 40, scaleHeight: 0.004, eyeHeight: -0.2 }]) {
      const drawn = await shoot(lawful(whole, law))
      for (let i = 0; i < plain.length; i++) worst = Math.max(worst, Math.abs(drawn[i]! - plain[i]!) / Math.max(Math.abs(plain[i]!), 1e-3))
    }
    console.log('AIR-GL from the picture own eye, five sets of numbers: worst share off the plain picture ' + worst.toExponential(3))
    expect(worst).toBeLessThan(1e-5)
    expect(errors).toEqual([])
  }, 120000)

  it('from another eye a pixel is the plain pixel through the law, by the path from that eye and the path the picture saw', async () => {
    let worst = 0
    let share = 0
    let low = 1
    let high = 1
    let count = 0
    for (const [eye, gain] of [[[0.8, 0.6, 1.5], 1], [[-1.2, 3, 4], 2], [[0.4, -0.3, -2.5], 1], [[0, 14, 30], 1]] as [[number, number, number], number][]) {
      for (const law of [LAW, { ...LAW, least: 0.6 }]) {
        const plain = await shoot({ ...whole, eye, gain })
        const depth = await shoot({ ...whole, eye, gain, diag: 'depth', back: [0, 0, 0] })
        const drawn = await shoot({ ...lawful(whole, law), eye, gain })
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const p = pixel(plain, x, y)
            // Where the layer is not under the pixel there is no fragment to hold.
            if (pixel(depth, x, y)[0]! <= 0 || p[3]! < 1) continue
            const want = twin(p, distanceOf(pixel(depth, x, y)[0]!), x, y, eye, law, gain)
            const got = pixel(drawn, x, y)
            const room = SHIFTS.map(([i, j]) => twin(p, distanceOf(pixel(depth, x, y)[0]!), x + i, y + j, eye, law, gain).colour)
            for (let c = 0; c < 3; c++) {
              const off = Math.abs(got[c]! - want.colour[c]!)
              worst = Math.max(worst, off)
              share = Math.max(share, off / (FLOAT + Math.max(...room.map((r) => Math.abs(r[c]! - want.colour[c]!)))))
            }
            low = Math.min(low, want.factor)
            high = Math.max(high, want.factor)
            count++
          }
        }
      }
    }
    console.log('AIR-GL from four other eyes, with and without a least: ' + count + ' pixels, factor ' + low.toFixed(3) + ' to ' + high.toFixed(3) + ', worst off the twin ' + worst.toExponential(3) + ', ' + share.toFixed(3) + ' of what the ray moved by ' + SHIFT + ' of a pixel changes')
    expect(count).toBeGreaterThan(1500)
    // The eyes are farther and nearer than the picture's: the factor runs under and over 1.
    expect(low).toBeLessThan(0.7)
    expect(high).toBeGreaterThan(1.3)
    expect(share).toBeLessThan(1)
    expect(worst).toBeLessThan(0.01)
    expect(errors).toEqual([])
  }, 240000)

  it('where the present eye is the nearer one the law has a floor at black and no ceiling: nothing in the relief cuts it', async () => {
    // A light far brighter than the picture in green, none in red: nearer, red rises past the plain pixel and past 1, green falls to 0.
    const law: ReliefAirLaw = { ...LAW, density: 30, light: [0, 40, 0.08] }
    const eye: [number, number, number] = [0, -0.2, -3.5]
    const bright: Shot = { ...whole, files: { ...whole.files, 'far-color.jpg': [252, 120, 60, 255] } }
    const plain = await shoot({ ...bright, eye })
    const depth = await shoot({ ...bright, eye, diag: 'depth', back: [0, 0, 0] })
    const drawn = await shoot({ ...lawful(bright, law), eye })
    let over = 0
    let black = 0
    let most = 0
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const p = pixel(plain, x, y)
        if (pixel(depth, x, y)[0]! <= 0 || p[3]! < 1) continue
        const want = twin(p, distanceOf(pixel(depth, x, y)[0]!), x, y, eye, law, 1)
        const got = pixel(drawn, x, y)
        expect(want.factor).toBeGreaterThan(1)
        // No ceiling: red is the twin's number, over the plain pixel.
        const room = Math.max(...SHIFTS.map(([i, j]) => Math.abs(twin(p, distanceOf(pixel(depth, x, y)[0]!), x + i, y + j, eye, law, 1).colour[0] - want.colour[0])))
        expect(Math.abs(got[0]! - want.colour[0]!)).toBeLessThan(FLOAT * Math.max(want.colour[0], 1) + room)
        expect(got[0]!).toBeGreaterThan(p[0]!)
        if (got[0]! > 1) over++
        most = Math.max(most, got[0]!)
        // The floor: green would be under 0 and is 0, not a negative number and not a NaN.
        expect(p[1]! * want.factor + law.light[1] * (1 - want.factor)).toBeLessThan(0)
        expect(got[1]!).toBe(0)
        black++
      }
    }
    console.log('AIR-GL nearer than the picture: ' + black + ' pixels at the floor in green, ' + over + ' over 1 in red, the most ' + most.toFixed(3))
    expect(black).toBeGreaterThan(300)
    expect(over).toBeGreaterThan(300)
    expect(errors).toEqual([])
  }, 120000)

  it('the sky is a point behind air: the back is times the factor of the whole path out of the shell, plus the light times the rest', async () => {
    let worst = 0
    let share = 0
    let low = 1
    let high = 0
    let count = 0
    let under = 0
    for (const [eye, gain] of [[[0, 0, 0], 1], [[2, 1.5, 3], 2], [[-1, 9, 0], 1], [[0, 60, 10], 1], [[0.5, -0.3, 1], 1]] as [[number, number, number], number][]) {
      const depth = await shoot({ ...patch, eye, gain, diag: 'depth', back: [0, 0, 0] })
      const drawn = await shoot({ ...lawful(patch), eye, gain })
      const a = airLawPoint(eye, LAW, PITCH)
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          // The layer's own pixels, and one pixel around them, are not sky.
          let ground = false
          for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (x + i >= 0 && x + i < W && y + j >= 0 && y + j < H && pixel(depth, x + i, y + j)[0]! > 0) ground = true
          if (ground) continue
          const d = ray(x, y)
          const f = airLawFactor(airLawDepthOut(a, d, LAW.scaleHeight), LAW.density)
          const got = pixel(drawn, x, y)
          const room = SHIFTS.map(([i, j]) => airLawFactor(airLawDepthOut(a, ray(x + i, y + j), LAW.scaleHeight), LAW.density))
          for (let c = 0; c < 3; c++) {
            const span = Math.abs(patch.back[c]! - LAW.light[c]! * gain)
            const off = Math.abs(got[c]! - (patch.back[c]! * f + LAW.light[c]! * gain * (1 - f)))
            worst = Math.max(worst, off)
            share = Math.max(share, off / (FLOAT + span * Math.max(...room.map((r) => Math.abs(r - f)))))
          }
          // The alpha the next thing over it is given: what is left of what lies behind is the factor.
          low = Math.min(low, f)
          high = Math.max(high, f)
          // A sight line that goes a scale height into the ball: the whole chord, nothing of the back arrives.
          const b = a[0] * d[0] + a[1] * d[1] + a[2] * d[2]
          if (b < 0 && Math.hypot(a[0] - d[0] * b, a[1] - d[1] * b, a[2] - d[2] * b) < 1 - LAW.scaleHeight) {
            under++
            for (let c = 0; c < 3; c++) expect(Math.abs(got[c]! - LAW.light[c]! * gain)).toBeLessThan(1e-4)
          }
          count++
        }
      }
    }
    console.log('AIR-GL the sky from five eyes: ' + count + ' pixels, factor ' + low.toExponential(2) + ' to ' + high.toFixed(3) + ', ' + under + ' into the ball, worst off the twin ' + worst.toExponential(3) + ', ' + share.toFixed(3) + ' of what the ray moved by ' + SHIFT + ' of a pixel changes')
    expect(count).toBeGreaterThan(1200)
    expect(under).toBeGreaterThan(40)
    expect(low).toBeLessThan(0.01)
    expect(high).toBeGreaterThan(0.6)
    expect(share).toBeLessThan(1)
    expect(worst).toBeLessThan(0.01)
    expect(errors).toEqual([])
  }, 240000)

  it('a scaled group draws the same pixels, and the air apart gives the sky away while the ground keeps its law', async () => {
    const eye: [number, number, number] = [0.8, 0.6, 1.5]
    const one = await shoot({ ...lawful(patch), eye })
    const small = await shoot({ ...lawful(patch), eye, scale: 0.001 })
    let worst = 0
    for (let i = 0; i < one.length; i++) worst = Math.max(worst, Math.abs(small[i]! - one[i]!))
    console.log('AIR-GL a group at a thousandth: worst off the plain scale ' + worst.toExponential(3))
    expect(worst).toBeLessThan(2e-3)
    // presence(1, { air: 0 }): the dome draws nothing, so the sky's pixels are the back, and the layer's pixels are as before.
    const apart = await shoot({ ...lawful(patch), eye, presence: [1, 0] })
    const depth = await shoot({ ...patch, eye, diag: 'depth', back: [0, 0, 0] })
    let sky = 0
    let ground = 0
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let covered = 0
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (x + i >= 0 && x + i < W && y + j >= 0 && y + j < H && pixel(depth, x + i, y + j)[0]! > 0) covered++
        const got = pixel(apart, x, y)
        if (covered === 0) {
          for (let c = 0; c < 3; c++) expect(got[c]!).toBeCloseTo(patch.back[c]!, 6)
          sky++
        } else if (covered === 9) {
          for (let c = 0; c < 3; c++) expect(Math.abs(got[c]! - pixel(one, x, y)[c]!)).toBeLessThan(1e-6)
          ground++
        }
      }
    }
    expect(sky).toBeGreaterThan(200)
    expect(ground).toBeGreaterThan(30)
    expect(errors).toEqual([])
  }, 120000)

  it('the light by height: from the picture own eye the picture comes back, for any numbers and any knots', async () => {
    const plain = await shoot(whole)
    let worst = 0
    for (const law of [KNOTS, { ...KNOTS, density: 300, light: [3, 0.01, 0.5] as [number, number, number] }, { ...KNOTS, density: 40, scaleHeight: 0.004, eyeHeight: -0.2, knots: [[-0.6, 0.1], [0.4, 1.6]] as [number, number][] }, { ...KNOTS, density: 2, scaleHeight: 0.1, knots: [[-2, 0], [0, 0.5], [3, 1]] as [number, number][] }]) {
      const drawn = await shoot(lawful(whole, law))
      for (let i = 0; i < plain.length; i++) worst = Math.max(worst, Math.abs(drawn[i]! - plain[i]!) / Math.max(Math.abs(plain[i]!), 1e-3))
    }
    console.log('AIR-GL the light by height, from the picture own eye, four sets of numbers and knots: worst share off the plain picture ' + worst.toExponential(3))
    expect(worst).toBeLessThan(1e-5)
    expect(errors).toEqual([])
  }, 120000)

  it('the light by height: from another eye a pixel is the plain pixel through the law with what the two paths gather, and the sky is what the path out gathers', async () => {
    const light = (gain: number): AirVec => [KNOTS.light[0] * gain, KNOTS.light[1] * gain, KNOTS.light[2] * gain]
    const layer = (plain: number[], distance: number, x: number, y: number, eye: AirVec, law: ReliefAirLaw, gain: number): { colour: [number, number, number]; moved: number } => {
      const knots = airLawKnots(law)!
      const d = ray(x, y)
      const point = airLawPoint([eye[0] + d[0] * distance, eye[1] + d[1] * distance, eye[2] + d[2] * distance], law, PITCH)
      const a = airLawPoint(eye, law, PITCH)
      const was = airLawPoint([0, 0, 0], law, PITCH)
      const depth = airLawDepth(a, point, law.scaleHeight)
      const seen = airLawDepth(was, point, law.scaleHeight)
      const now = airLawGather(a, point, law.scaleHeight, law.density, knots.heights, knots.shares)
      const held = airLawHeld(airLawGather(was, point, law.scaleHeight, law.density, knots.heights, knots.shares), seen, law.density, law.least ?? 0)
      const factor = airLawFactorSeen(depth, seen, law.density, law.least ?? 0)
      // how far the light by height moves the pixel off the law with one light: the test must see the knots at work
      const flat = airLaw([plain[0]!, plain[1]!, plain[2]!], light(gain), factor)
      const colour = airLawSeen([plain[0]!, plain[1]!, plain[2]!], light(gain), factor, now, held)
      return { colour, moved: Math.max(Math.abs(colour[0] - flat[0]), Math.abs(colour[1] - flat[1]), Math.abs(colour[2] - flat[2])) }
    }
    let worst = 0
    let share = 0
    let moved = 0
    let count = 0
    let large = 0
    for (const [eye, gain] of [[[0.8, 0.6, 1.5], 1], [[-1.2, 3, 4], 2], [[0.4, -0.3, -2.5], 1], [[0, 14, 30], 1]] as [[number, number, number], number][]) {
      for (const law of [KNOTS, { ...KNOTS, least: 0.6 }, LARGE, { ...LARGE, least: 0.5 }]) {
        const plain = await shoot({ ...whole, eye, gain })
        const depth = await shoot({ ...whole, eye, gain, diag: 'depth', back: [0, 0, 0] })
        const drawn = await shoot({ ...lawful(whole, law), eye, gain })
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const p = pixel(plain, x, y)
            if (pixel(depth, x, y)[0]! <= 0 || p[3]! < 1) continue
            const distance = distanceOf(pixel(depth, x, y)[0]!)
            const want = layer(p, distance, x, y, eye, law, gain)
            const got = pixel(drawn, x, y)
            const room = SHIFTS.map(([i, j]) => layer(p, distance, x + i, y + j, eye, law, gain).colour)
            for (let c = 0; c < 3; c++) {
              const off = Math.abs(got[c]! - want.colour[c]!)
              worst = Math.max(worst, off)
              if (law.radius === LARGE.radius) large = Math.max(large, off)
              share = Math.max(share, off / (FLOAT + Math.max(...room.map((r) => Math.abs(r[c]! - want.colour[c]!)))))
            }
            moved = Math.max(moved, want.moved)
            count++
          }
        }
      }
    }
    console.log('AIR-GL the light by height from four other eyes, two sets of numbers, with and without a least: ' + count + ' pixels, the knots move a pixel by up to ' + moved.toFixed(3) + ', worst off the twin ' + worst.toExponential(3) + ' (with the radius ' + LARGE.radius + ': ' + large.toExponential(3) + '), ' + share.toFixed(3) + ' of what the ray moved by ' + SHIFT + ' of a pixel changes')
    expect(count).toBeGreaterThan(3000)
    expect(moved).toBeGreaterThan(0.02)
    expect(share).toBeLessThan(1)
    expect(worst).toBeLessThan(0.01)
    // the sky around a patch: the back times the factor of the whole path plus the light times what that path gathers
    let skyWorst = 0
    let skyShare = 0
    let skyMoved = 0
    let sky = 0
    for (const [eye, gain, law] of [[[0, 0, 0], 1, KNOTS], [[2, 1.5, 3], 2, KNOTS], [[-1, 9, 0], 1, KNOTS], [[0, 60, 10], 1, KNOTS], [[0.5, -0.3, 1], 1, KNOTS], [[0, 0, 0], 1, LARGE], [[2, 1.5, 3], 2, LARGE], [[-1, 9, 0], 1, LARGE], [[0.5, -0.3, 1], 1, LARGE]] as [[number, number, number], number, ReliefAirLaw][]) {
      const knots = airLawKnots(law)!
      const depth = await shoot({ ...patch, eye, gain, diag: 'depth', back: [0, 0, 0] })
      const drawn = await shoot({ ...lawful(patch, law), eye, gain })
      const a = airLawPoint(eye, law, PITCH)
      const want = (d: AirVec): [number, number, number] => {
        const f = airLawFactor(airLawDepthOut(a, d, law.scaleHeight), law.density)
        const g = airLawGatherOut(a, d, law.scaleHeight, law.density, knots.heights, knots.shares)
        skyMoved = Math.max(skyMoved, 1 - f - g)
        return [patch.back[0] * f + law.light[0] * gain * g, patch.back[1] * f + law.light[1] * gain * g, patch.back[2] * f + law.light[2] * gain * g]
      }
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          let ground = false
          for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (x + i >= 0 && x + i < W && y + j >= 0 && y + j < H && pixel(depth, x + i, y + j)[0]! > 0) ground = true
          if (ground) continue
          const w = want(ray(x, y))
          const got = pixel(drawn, x, y)
          const room = SHIFTS.map(([i, j]) => want(ray(x + i, y + j)))
          for (let c = 0; c < 3; c++) {
            const off = Math.abs(got[c]! - w[c]!)
            skyWorst = Math.max(skyWorst, off)
            skyShare = Math.max(skyShare, off / (FLOAT + Math.max(...room.map((r) => Math.abs(r[c]! - w[c]!)))))
          }
          sky++
        }
      }
    }
    console.log('AIR-GL the light by height, the sky from nine eyes, two sets of numbers: ' + sky + ' pixels, the knots take up to ' + skyMoved.toFixed(3) + ' of the light off a path, worst off the twin ' + skyWorst.toExponential(3) + ', ' + skyShare.toFixed(3) + ' of what the ray moved by ' + SHIFT + ' of a pixel changes')
    expect(sky).toBeGreaterThan(2400)
    expect(skyMoved).toBeGreaterThan(0.1)
    expect(skyShare).toBeLessThan(1)
    expect(skyWorst).toBeLessThan(0.01)
    expect(errors).toEqual([])
  }, 360000)
})
