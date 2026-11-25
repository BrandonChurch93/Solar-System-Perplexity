import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium, type Browser, type Page } from 'playwright-core'
import { build } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { CHROME, CHROME_FLAGS } from '../tools/lib/browser'

// The presence of a relief in a WebGL2 browser (Relief.presence): the pixels. A small relief of flat pictures is drawn over a flat
// ground at several shares and read back as floats. The shaders and the shield are tests/relief.test.ts.

const ROOT = resolve(__dirname, '..')
const at = (path: string): string => JSON.stringify(resolve(ROOT, path))

const PAGE = `
import * as THREE from 'three'
import { Relief } from ${at('src/terrain/relief.ts')}

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
    buffer: async (path) => new Float32Array((o.sizes && o.sizes[path]) || 4).fill(o.dist[path]).buffer,
  }
  const relief = await Relief.load(ctx, '', o.def, o.motion)
  if (o.presence !== null) relief.presence(o.presence)
  if (o.edge) relief.presenceEdge(o.edge, o.wholeAir ? { air: false } : {})
  const s = o.scale ?? 1
  const eye = o.eye ?? [0, 0, 0]
  if (o.early) relief.update(0, 1, 0, { format: { width: o.width, height: o.height } })
  if (s !== 1) relief.group.scale.setScalar(s)
  if (!o.early) relief.update(0, 1, 0, { format: { width: o.width, height: o.height } })
  const cam = new THREE.PerspectiveCamera(o.def.vfovDeg, o.width / o.height, 0.1 * s, 100 * s)
  cam.position.set(eye[0] * s, eye[1] * s, eye[2] * s)
  cam.updateMatrixWorld(true)
  const scene = new THREE.Scene()
  if (o.drawn) scene.add(relief.group)
  const target = new THREE.WebGLRenderTarget(o.width, o.height, { type: THREE.FloatType })
  renderer.setRenderTarget(target)
  renderer.setClearColor(new THREE.Color(o.back[0], o.back[1], o.back[2]), 1)
  renderer.render(scene, cam)
  const out = new Float32Array(o.width * o.height * 4)
  renderer.readRenderTargetPixels(target, 0, 0, o.width, o.height, out)
  renderer.setRenderTarget(null)
  target.dispose()
  let shared = true
  let texts = 0
  let eyes = 0
  let edges = 0
  relief.group.traverse((x) => {
    if (!x.material) return
    if (x.material.fragmentShader.includes('uPresence')) texts++
    if (x.material.fragmentShader.includes('edgeShare(')) edges++
    if (x.material.vertexShader.includes('uEyeScale')) eyes++
  })
  relief.dispose()
  return { pixels: Array.from(out), texts, eyes, edges, shared }
}

window.relief = { shot }
`

interface Shot { wholeAir?: boolean; def: object; motion: object; files: Record<string, number[]>; dist: Record<string, number>; presence: number | null; drawn: boolean; width: number; height: number; back: [number, number, number]; scale?: number; eye?: [number, number, number]; early?: boolean; edge?: [number, number, number, number]; sizes?: Record<string, number> }

const W = 32
const H = 16
const ALPHA = 128 / 255
const base: Shot = {
  def: {
    imageSize: [W, H],
    vfovDeg: 40,
    layers: [
      { color: 'far-color.jpg', dist: 'far.bin', box: [0, 0, W, H], distSize: [2, 2], tint: [1, 1, 1] },
      { color: 'near-color.jpg', alpha: 'near-alpha.png', dist: 'near.bin', box: [8, 4, 16, 8], distSize: [2, 2], tint: [1, 1, 1] },
    ],
    masks: 'masks.png',
    maskBox: [0, 0, W, H],
    mistDir: [1, 0],
  },
  motion: { mistSpeed: 0, dustSpeed: 0, dustDir: [1, 0], mesh: 4 },
  files: { 'far-color.jpg': [200, 120, 60, 255], 'near-color.jpg': [40, 160, 220, 255], 'near-alpha.png': [128, 128, 128, 255], 'masks.png': [0, 0, 0, 255] },
  dist: { 'far.bin': 6, 'near.bin': 4 },
  presence: null,
  drawn: true,
  width: W,
  height: H,
  back: [0.2, 0.3, 0.4],
}
const air = { pitchDeg: 0, dipDeg: 0, cool: [0.1, 0.2, 0.3], coolScaleDeg: 30, warm: [0.3, 0.2, 0.1], warmScaleDeg: 20, side: [1, 1], warmSide: [1, 1, 0, 1], starScaleDeg: 10, starCut: 0.5, veil: 0.2 }
const aired: Shot = { ...base, def: { ...base.def, layers: [(base.def as { layers: object[] }).layers[1]!] }, motion: { ...base.motion, air } }
// The eye of the layers under a scaled group: a valley mist whose density goes with the height alone (the cut lets all of the noise through),
// seen from an eye off the picture's own eye.
const valley = { top: 0.5, soft: 0.5, strength: 1, color: [0.9, 0.8, 0.7], wind: [1, 0], speed: 0, scale: 1, stretch: 1, churn: 0, mask: [0.5, 1], cut: [-1, -0.5] }
const misted: Shot = { ...base, motion: { ...base.motion, valley }, eye: [0.8, 0.6, 1.5] }
const SCALE = 0.001
// The edge of a relief: a far layer that ends at x 24 of 32 with an apron of 8 pixels beyond its right side (the apron's own flat picture, so
// that it can be told from the layer), on a fine mesh, and the layer with a part alpha over it, which ends at the same side.
const FAR = [200, 120, 60, 255]
const APRON = [90, 200, 120, 255]
const sided: Shot = {
  ...base,
  def: {
    ...base.def,
    layers: [
      { color: 'relief-far-color.jpg', dist: 'far.bin', box: [0, 0, 24, H], distSize: [2, 2], tint: [1, 1, 1] },
      { color: 'near-color.jpg', alpha: 'near-alpha.png', dist: 'near.bin', box: [8, 4, 16, 8], distSize: [2, 2], tint: [1, 1, 1] },
    ],
  },
  motion: {
    ...base.motion, mesh: 48,
    apron: { padding: 0, fullWidth: W, mips: false, baseAlphaNoMips: [], resolution: { full: 1, web: 1 }, layers: [{ layer: 'far', atlas: 'far-apron.webp', depth: 'far-apron.bin', edges: [0, 8, 0], bottomColorShear: [0, 0, 1], rightColorShear: [0, 0, 0.5, 0.9] }] },
  },
  files: { ...base.files, 'relief-far-color.jpg': FAR, 'far-apron.webp': APRON },
  dist: { ...base.dist, 'far-apron.bin': 6 },
  sizes: { 'far-apron.bin': 16 },
}
const RIGHT: [number, number, number, number] = [0, 8, 0, 0]
// The air's ray comes from the rasteriser's own interpolation over a few large triangles: measured 0.0024 of a share at most here
// (0.013 of a pixel of the picture), so the margin is twice that.
const WORST_AIR = 0.005
const smoothStep = (t: number): number => { const c = Math.min(Math.max(t, 0), 1); return c * c * (3 - 2 * c) }
// The share of a pixel under a feather of 8 pixels at a right side that stands at x SIDE of the picture: by the pixel's own place.
const shareAt = (x: number, sideAt: number): number => smoothStep((sideAt - (x + 0.5)) / 8)

const pixel = (p: number[], x: number, y: number): number[] => p.slice((y * W + x) * 4, (y * W + x) * 4 + 4)
const CENTRE: [number, number] = [16, 8]
const CORNER: [number, number] = [1, 1]

const have = existsSync(CHROME)

describe.skipIf(!have)('the presence of a relief in a WebGL2 browser', () => {
  let browser: Browser
  let page: Page
  const errors: string[] = []
  const shoot = async (o: Shot): Promise<number[]> => {
    const out = await page.evaluate((x) => (window as unknown as { relief: { shot(o: unknown): Promise<{ pixels: number[]; texts: number; eyes: number; edges: number }> } }).relief.shot(x), o)
    expect(out.edges).toBe(o.edge ? (o.def as { layers: object[] }).layers.length + ('air' in o.motion && !o.wholeAir ? 1 : 0) : 0)
    expect(out.texts).toBe(o.presence === null ? 0 : (o.def as { layers: object[] }).layers.length + ('air' in o.motion ? 1 : 0))
    // The air of a relief with an edge has the lens in its vertex shader too (where its ray meets the far distance).
    expect(out.eyes).toBe(((o.scale ?? 1) !== 1 && !o.early ? (o.def as { layers: object[] }).layers.length : 0) + (o.edge && 'air' in o.motion && !o.wholeAir ? 1 : 0))
    return out.pixels
  }

  beforeAll(async () => {
    const dir = resolve(ROOT, 'out/work/relief-test')
    mkdirSync(dir, { recursive: true })
    const entry = resolve(dir, 'page.js')
    writeFileSync(entry, PAGE)
    const built = await build({
      root: ROOT, configFile: false, logLevel: 'silent',
      build: { write: false, minify: false, target: 'es2022', lib: { entry, formats: ['iife'], name: 'reliefPage', fileName: 'relief-page' } },
    })
    const output = (Array.isArray(built) ? built[0]! : built) as { output: { type: string; code?: string }[] }
    const code = output.output.find((x) => x.type === 'chunk')!.code!
    browser = await chromium.launch({ executablePath: CHROME, headless: true, args: CHROME_FLAGS })
    page = await browser.newPage()
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    await page.route('http://relief.test/**', (route) => {
      const url = route.request().url()
      if (url.endsWith('/page.js')) return route.fulfill({ status: 200, contentType: 'text/javascript', body: code })
      if (url === 'http://relief.test/') return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><script src="./page.js"></script>' })
      return route.fulfill({ status: 404, body: '' })
    })
    await page.goto('http://relief.test/')
    await page.waitForFunction(() => 'relief' in window, undefined, { timeout: 60000 })
    expect(errors).toEqual([])
  }, 180000)

  afterAll(async () => {
    await browser?.close()
  })

  it('at 1 it is the relief that never asked, to the bit, and at 0 the ground alone', async () => {
    for (const set of [base, aired]) {
      const plain = await shoot(set)
      const back = await shoot({ ...set, drawn: false })
      expect(await shoot({ ...set, presence: 1 })).toEqual(plain)
      expect(await shoot({ ...set, presence: 0 })).toEqual(back)
      for (let c = 0; c < 3; c++) {
        expect(pixel(back, ...CORNER)[c]).toBeCloseTo(set.back[c]!, 6)
        expect(Math.abs(pixel(plain, ...CORNER)[c]! - set.back[c]!)).toBeGreaterThan(0.01)
        expect(Math.abs(pixel(plain, ...CENTRE)[c]! - pixel(plain, ...CORNER)[c]!)).toBeGreaterThan(0.01)
      }
    }
    expect(errors).toEqual([])
  }, 120000)

  it('where one part covers a pixel the picture is the one with the relief times the share plus the ground times the rest', async () => {
    for (const set of [base, aired]) {
      const plain = await shoot(set)
      const back = await shoot({ ...set, drawn: false })
      for (const share of [0.25, 0.5, 0.9]) {
        const got = await shoot({ ...set, presence: share })
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            if (x >= 7 && x <= 24 && y >= 3 && y <= 12) continue
            for (let c = 0; c < 4; c++) expect(pixel(got, x, y)[c]).toBeCloseTo(share * pixel(plain, x, y)[c]! + (1 - share) * pixel(back, x, y)[c]!, 5)
          }
        }
      }
    }
    expect(errors).toEqual([])
  }, 120000)

  it('where a layer lies over another the one behind shows through it by what the share leaves', async () => {
    const plain = await shoot(base)
    const far = pixel(plain, ...CORNER)
    const near = pixel(plain, ...CENTRE).map((v, c) => v - far[c]! * (1 - ALPHA))
    for (const share of [0.25, 0.5, 0.9]) {
      const got = pixel(await shoot({ ...base, presence: share }), ...CENTRE)
      for (let c = 0; c < 3; c++) {
        const behind = far[c]! * share + base.back[c]! * (1 - share)
        expect(got[c]).toBeCloseTo(near[c]! * share + behind * (1 - ALPHA * share), 5)
      }
    }
    expect(errors).toEqual([])
  }, 120000)

  it('an edge with no feather is the relief that never asked, to the bit', async () => {
    for (const set of [base, aired, sided]) {
      expect(await shoot({ ...set, edge: [0, 0, 0, 0] })).toEqual(await shoot(set))
    }
    expect(errors).toEqual([])
  }, 120000)

  it('beyond a side that fades nothing of the relief is drawn, a feather inside it the relief is whole, and between the picture is the relief times one share plus the ground times the rest', async () => {
    const plain = await shoot(sided)
    const back = await shoot({ ...sided, drawn: false })
    const got = await shoot({ ...sided, edge: RIGHT })
    // Without the edge the apron stands beyond the side: its own colour, not the layer's and not the ground's.
    for (let c = 0; c < 3; c++) expect(Math.abs(pixel(plain, 28, 1)[c]! - pixel(plain, 4, 1)[c]!) + Math.abs(pixel(plain, 28, 1)[c]! - sided.back[c]!)).toBeGreaterThan(0.05)
    for (let y = 0; y < H; y++) {
      let last = 1
      for (let x = 0; x < W; x++) {
        const g = pixel(got, x, y)
        const p = pixel(plain, x, y)
        const b = pixel(back, x, y)
        // Beyond the side (the apron): the ground alone, to the bit. More than a feather inside: the relief that never asked, to the bit.
        if (x >= 24) expect(g).toEqual(b)
        else if (x < 16) expect(g).toEqual(p)
        else if (!(x >= 7 && y >= 3 && y <= 12)) {
          // In the feather, where the far layer alone covers the pixel: one share for all channels, the share of the pixel's place.
          const share = (g[0]! - b[0]!) / (p[0]! - b[0]!)
          for (let c = 0; c < 4; c++) expect(g[c]).toBeCloseTo(share * p[c]! + (1 - share) * b[c]!, 5)
          expect(Math.abs(share - shareAt(x, 24))).toBeLessThan(0.02)
          expect(share).toBeLessThanOrEqual(last + 1e-6)
          expect(share).toBeGreaterThan(0)
          expect(share).toBeLessThan(1)
          last = share
        }
      }
    }
    expect(errors).toEqual([])
  }, 120000)

  it('every layer ends along one line: where a layer lies over another both carry the share of the place', async () => {
    const plain = await shoot(sided)
    const got = await shoot({ ...sided, edge: RIGHT })
    for (const x of [17, 19, 21, 22]) {
      const far = pixel(plain, x, 1)
      const near = pixel(plain, x, 8).map((v, c) => v - far[c]! * (1 - ALPHA))
      const share = (pixel(got, x, 1)[0]! - sided.back[0]!) / (far[0]! - sided.back[0]!)
      expect(Math.abs(share - shareAt(x, 24))).toBeLessThan(0.02)
      for (let c = 0; c < 3; c++) {
        const behind = far[c]! * share + sided.back[c]! * (1 - share)
        expect(Math.abs(pixel(got, x, 8)[c]! - (near[c]! * share + behind * (1 - ALPHA * share)))).toBeLessThan(0.004)
      }
    }
    expect(errors).toEqual([])
  }, 120000)

  it('the air ends with the layers: from the picture own eye it carries the share of the pixel place, and none beyond the side', async () => {
    // The one layer of this relief ends at x 24 of 32, so that is the side; the air fills the frame.
    const plain = await shoot(aired)
    const back = await shoot({ ...aired, drawn: false })
    const got = await shoot({ ...aired, edge: RIGHT })
    let between = 0
    let worst = 0
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (x >= 7 && x <= 24 && y >= 3 && y <= 12) continue
        const g = pixel(got, x, y)
        const p = pixel(plain, x, y)
        const b = pixel(back, x, y)
        // The air is there to be seen: it differs from the ground behind it.
        expect(Math.abs(p[0]! - b[0]!)).toBeGreaterThan(0.01)
        if (x >= 24) expect(g).toEqual(b)
        else if (x < 16) expect(g).toEqual(p)
        else {
          // One share for all channels, and it is the share of the pixel's own place (the ray is the rasteriser's, hence the margin).
          const share = (g[0]! - b[0]!) / (p[0]! - b[0]!)
          for (let c = 0; c < 4; c++) expect(g[c]).toBeCloseTo(share * p[c]! + (1 - share) * b[c]!, 5)
          worst = Math.max(worst, Math.abs(share - shareAt(x, 24)))
          if (share > 0.05 && share < 0.95) between++
        }
      }
    }
    expect(between).toBeGreaterThan(20)
    expect(worst).toBeLessThan(WORST_AIR)
    expect(errors).toEqual([])
  }, 120000)

  it('with the air left whole the layers end at the side and the air is the air of the relief that never asked, to the bit', async () => {
    const plain = await shoot(aired)
    const ended = await shoot({ ...aired, edge: RIGHT })
    const got = await shoot({ ...aired, edge: RIGHT, wholeAir: true })
    let aside = 0
    let faded = 0
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const g = pixel(got, x, y)
        const p = pixel(plain, x, y)
        const e = pixel(ended, x, y)
        const layer = x >= 7 && x <= 24 && y >= 3 && y <= 12
        // Outside the layer the frame shows the air alone: all of it, also beyond the side, where the edge that ends the air leaves none.
        if (!layer) {
          expect(g).toEqual(p)
          if (x >= 24) {
            aside++
            expect(Math.abs(g[0]! - e[0]!)).toBeGreaterThan(0.01)
          }
        } else if (x < 16) expect(g).toEqual(p)
        else if (x > 17 && x < 23 && y > 3 && y < 12) {
          // Inside the feather the layer is on its way out, over the whole air: the pixel has left the picture with the layer.
          faded++
          expect(Math.abs(g[0]! - p[0]!) + Math.abs(g[1]! - p[1]!) + Math.abs(g[2]! - p[2]!)).toBeGreaterThan(0.001)
        }
      }
    }
    expect(aside).toBeGreaterThan(50)
    expect(faded).toBeGreaterThan(20)
    expect(errors).toEqual([])
  }, 120000)

  it('the air reads its edge where its ray meets the far distance of the relief: it moves with the lens, and under a scaled group it is the picture of the group without a scale', async () => {
    const most = (a: number[], b: number[]): number => a.reduce((m, v, i) => Math.max(m, Math.abs(v - b[i]!)), 0)
    const eye: [number, number, number] = [1.5, 0.2, 0.5]
    const home = await shoot({ ...aired, edge: RIGHT })
    const moved = await shoot({ ...aired, edge: RIGHT, eye })
    const movedPlain = await shoot({ ...aired, eye })
    const back = await shoot({ ...aired, drawn: false })
    // The air without an edge does not know where the lens stands (it is drawn about the lens); with one it does. Top row: air alone.
    for (let x = 0; x < W; x++) expect(pixel(movedPlain, x, H - 1)).toEqual(pixel(await shoot(aired), x, H - 1))
    expect(most(moved, home)).toBeGreaterThan(0.01)
    // The far distance of this relief is 4 (its one layer). A lens 1.5 to the right sees the side, which stands 0.364 right of the axis at
    // that distance, left of where the picture own eye sees it: the air has gone where it still stood from the picture own eye.
    let gone = 0
    for (let x = 0; x < W; x++) {
      const m = pixel(moved, x, H - 1)
      const h = pixel(home, x, H - 1)
      const b = pixel(back, x, H - 1)
      const shareMoved = (m[0]! - b[0]!) / (pixel(movedPlain, x, H - 1)[0]! - b[0]!)
      const shareHome = (h[0]! - b[0]!) / (pixel(movedPlain, x, H - 1)[0]! - b[0]!)
      expect(shareMoved).toBeLessThanOrEqual(shareHome + 1e-5)
      if (shareHome > 0.5 && shareMoved < 0.01) gone++
    }
    expect(gone).toBeGreaterThan(2)
    const scaled = await shoot({ ...aired, edge: RIGHT, eye, scale: SCALE })
    expect(most(scaled, moved)).toBeLessThan(2e-4)
    expect(errors).toEqual([])
  }, 120000)

  it('under a scaled group the valley mist is seen from the camera: the picture of the group without a scale, and not the one of the old line', async () => {
    const most = (a: number[], b: number[]): number => a.reduce((m, v, i) => Math.max(m, Math.abs(v - b[i]!)), 0)
    const plain = await shoot(misted)
    const clear = await shoot({ ...misted, motion: base.motion })
    expect(most(plain, clear)).toBeGreaterThan(0.05)
    const scaled = await shoot({ ...misted, scale: SCALE })
    expect(most(scaled, plain)).toBeLessThan(2e-4)
    const old = await shoot({ ...misted, scale: SCALE, early: true })
    expect(most(old, plain)).toBeGreaterThan(0.02)
    const far = await shoot({ ...misted, scale: SCALE, presence: 1 })
    expect(most(far, plain)).toBeLessThan(2e-4)
    const half = await shoot({ ...misted, scale: SCALE, presence: 0.5 })
    const halfPlain = await shoot({ ...misted, presence: 0.5 })
    expect(most(half, halfPlain)).toBeLessThan(2e-4)
    const clearScaled = await shoot({ ...misted, motion: base.motion, scale: SCALE })
    expect(most(clearScaled, clear)).toBeLessThan(2e-4)
    expect(errors).toEqual([])
  }, 120000)
})
