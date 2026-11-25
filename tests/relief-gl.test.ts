import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium, type Browser, type Page } from 'playwright-core'
import * as THREE from 'three'
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
import { frameUniform } from ${at('src/core/frame.ts')}

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
  if (o.presence !== null) relief.presence(o.presence, o.airShare === undefined ? {} : { air: o.airShare })
  if (o.edge) relief.presenceEdge(o.edge, o.wholeAir ? { air: false } : {})
  if (o.detail !== undefined) relief.presenceDetail(o.detail, o.detailSize ? { size: o.detailSize } : {})
  if (o.law) relief.presenceLaw(o.law.text, Object.fromEntries(Object.entries(o.law.uniforms || {}).map(([k, v]) => [k, { value: !Array.isArray(v) ? v : v.length === 2 ? new THREE.Vector2(...v) : v.length === 3 ? new THREE.Vector3(...v) : new THREE.Vector4(...v) }])))
  frameUniform.value = o.frame ?? 1
  const s = o.scale ?? 1
  const eye = o.eye ?? [0, 0, 0]
  const cam = new THREE.PerspectiveCamera(o.def.vfovDeg, o.width / o.height, 0.1 * s, 100 * s)
  if (o.early) relief.update(0, 1, 0, { format: { width: o.width, height: o.height }, camera: cam })
  if (s !== 1) relief.group.scale.setScalar(s)
  if (!o.early) relief.update(0, 1, 0, { format: { width: o.width, height: o.height }, camera: cam })
  cam.position.set(eye[0] * s, eye[1] * s, eye[2] * s)
  cam.updateMatrixWorld(true)
  const scene = new THREE.Scene()
  if (o.drawn) scene.add(relief.group)
  const target = new THREE.WebGLRenderTarget(o.width, o.height, { type: THREE.FloatType })
  renderer.setRenderTarget(target)
  renderer.setClearColor(new THREE.Color(o.back[0], o.back[1], o.back[2]), 1)
  renderer.render(scene, cam)
  if (o.again) {
    relief.presence(o.again.presence, o.again.airShare === undefined ? {} : { air: o.again.airShare })
    renderer.render(scene, cam)
  }
  frameUniform.value = 1
  const out = new Float32Array(o.width * o.height * 4)
  renderer.readRenderTargetPixels(target, 0, 0, o.width, o.height, out)
  renderer.setRenderTarget(null)
  target.dispose()
  let shared = true
  let texts = 0
  let eyes = 0
  let edges = 0
  let details = 0
  let laws = 0
  relief.group.traverse((x) => {
    if (!x.material) return
    if (x.material.fragmentShader.includes('uPresence')) texts++
    if (x.material.fragmentShader.includes('edgeShare(')) edges++
    if (x.material.fragmentShader.includes('detailShare(vImage)')) details++
    if (x.material.fragmentShader.includes('lawShare(vLocal, vEye, vImage)')) laws++
    if (x.material.vertexShader.includes('uEyeScale')) eyes++
  })
  relief.dispose()
  return { pixels: Array.from(out), texts, eyes, edges, details, laws, shared }
}

window.relief = { shot }
`

interface Shot { law?: { text: string; uniforms?: Record<string, number | number[]> }; airShare?: number; again?: { presence: number; airShare?: number }; detail?: [number, number] | null; detailSize?: [number, number]; frame?: number; wholeAir?: boolean; def: object; motion: object; files: Record<string, number[]>; dist: Record<string, number>; presence: number | null; drawn: boolean; width: number; height: number; back: [number, number, number]; scale?: number; eye?: [number, number, number]; early?: boolean; edge?: [number, number, number, number]; sizes?: Record<string, number> }

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
// The share by the eye: a relief with a lens so narrow that its layers of one distance are planes across the axis to 5 parts in 100000,
// so every texel of a layer has one size on the screen (under a wide lens the flat triangles of the mesh lean against the view at the
// sides, and the place in the picture, which the rasteriser carries across a triangle in space, runs a few percent off the screen's own).
const NARROW = 0.5
const narrow: Shot = { ...base, def: { ...base.def, vfovDeg: NARROW } }
const narrowSided: Shot = { ...sided, def: { ...sided.def, vfovDeg: NARROW } }
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
    const out = await page.evaluate((x) => (window as unknown as { relief: { shot(o: unknown): Promise<{ pixels: number[]; texts: number; eyes: number; edges: number; details: number; laws: number }> } }).relief.shot(x), o)
    expect(out.laws).toBe(o.law ? (o.def as { layers: object[] }).layers.length : 0)
    expect(out.details).toBe(o.detail !== undefined ? (o.def as { layers: object[] }).layers.length : 0)
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

  // The air apart from the layers (Relief.presence with { air }) and the share by the eye (Relief.presenceDetail).

  it('the air has a share of its own when a set names it: at 0 the picture is the relief without air to the bit, and layers and air go by their own shares', async () => {
    const plain = await shoot(aired)
    const back = await shoot({ ...aired, drawn: false })
    const bare = await shoot({ ...aired, motion: base.motion })
    expect(await shoot({ ...aired, presence: 1, airShare: 1 })).toEqual(plain)
    expect(await shoot({ ...aired, presence: 1, airShare: 0 })).toEqual(bare)
    expect(await shoot({ ...aired, presence: 0, airShare: 0 })).toEqual(back)
    // The layer alone (premultiplied) and the air over the ground under it, at the centre, from the three pictures.
    const layer = pixel(bare, ...CENTRE).map((v, c) => v - pixel(back, ...CENTRE)[c]! * (1 - ALPHA))
    const airOver = pixel(plain, ...CENTRE).map((v, c) => (v - layer[c]!) / (1 - ALPHA))
    for (let c = 0; c < 3; c++) expect(Math.abs(airOver[c]! - aired.back[c]!)).toBeGreaterThan(0.01)
    for (const [L, A] of [[0, 1], [0.5, 0.25], [0.25, 0.9], [1, 0.5]] as [number, number][]) {
      const got = await shoot({ ...aired, presence: L, airShare: A })
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (x >= 7 && x <= 24 && y >= 3 && y <= 12) continue
          for (let c = 0; c < 4; c++) expect(pixel(got, x, y)[c]).toBeCloseTo(A * pixel(plain, x, y)[c]! + (1 - A) * pixel(back, x, y)[c]!, 5)
        }
      }
      for (let c = 0; c < 3; c++) {
        const under = A * airOver[c]! + (1 - A) * aired.back[c]!
        expect(pixel(got, ...CENTRE)[c]).toBeCloseTo(layer[c]! * L + under * (1 - ALPHA * L), 5)
      }
    }
    expect(errors).toEqual([])
  }, 120000)

  it('the air gets its own share after the relief was drawn with one share for both, without a new shader', async () => {
    const want = await shoot({ ...aired, presence: 0.5, airShare: 0.25 })
    expect(await shoot({ ...aired, presence: 0.8, again: { presence: 0.5, airShare: 0.25 } })).toEqual(want)
    expect(await shoot({ ...aired, presence: 0.8, airShare: 0.1, again: { presence: 0.5 } })).toEqual(await shoot({ ...aired, presence: 0.5 }))
    expect(errors).toEqual([])
  }, 120000)

  it('a share by the eye held at 1 is the relief that never asked, to the bit', async () => {
    for (const set of [base, aired, sided]) {
      expect(await shoot({ ...set, detail: null })).toEqual(await shoot(set))
    }
    expect(errors).toEqual([])
  }, 120000)

  it('from the picture own eye every texel has one size: at or under the first size the relief is whole to the bit, at or over the second no layer is drawn, between the picture is the relief times one share plus the ground times the rest', async () => {
    const plain = await shoot(narrow)
    const back = await shoot({ ...narrow, drawn: false })
    // The picture of 32 by 16 on a frame of 32 by 16: a texel is one pixel.
    expect(await shoot({ ...narrow, detail: [2, 4] })).toEqual(plain)
    expect(await shoot({ ...narrow, detail: [1.01, 1.5] })).toEqual(plain)
    expect(await shoot({ ...narrow, detail: [0.25, 0.5] })).toEqual(back)
    expect(await shoot({ ...narrow, detail: [0.5, 0.99] })).toEqual(back)
    const far = pixel(plain, ...CORNER)
    const near = pixel(plain, ...CENTRE).map((v, c) => v - far[c]! * (1 - ALPHA))
    for (const [range, share] of [[[0.5, 1.5], 0.5], [[0.75, 1.75], 1 - smoothStep(0.25)], [[0.2, 1.2], 1 - smoothStep(0.8)]] as [[number, number], number][]) {
      const got = await shoot({ ...narrow, detail: range })
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (x >= 7 && x <= 24 && y >= 3 && y <= 12) continue
          for (let c = 0; c < 4; c++) expect(pixel(got, x, y)[c]).toBeCloseTo(share * pixel(plain, x, y)[c]! + (1 - share) * pixel(back, x, y)[c]!, 3)
        }
      }
      // Where a layer lies over another both carry the share, and the one behind shows through.
      for (let c = 0; c < 3; c++) {
        const behind = far[c]! * share + narrow.back[c]! * (1 - share)
        expect(pixel(got, ...CENTRE)[c]).toBeCloseTo(near[c]! * share + behind * (1 - ALPHA * share), 3)
      }
    }
    // Under a wide lens too the ends are whole and gone, with room for the lean of the mesh at the sides.
    expect(await shoot({ ...base, detail: [1.3, 2] })).toEqual(await shoot(base))
    expect(await shoot({ ...base, detail: [0.25, 0.7] })).toEqual(await shoot({ ...base, drawn: false }))
    // The air is left alone: with every layer gone the air of the relief is whole.
    const airPlain = await shoot(aired)
    const airGone = await shoot({ ...aired, detail: [0.25, 0.5] })
    expect(airGone).toEqual(await shoot({ ...aired, presence: 0, airShare: 1 }))
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!(x >= 7 && x <= 24 && y >= 3 && y <= 12)) expect(pixel(airGone, x, y)).toEqual(pixel(airPlain, x, y))
    expect(errors).toEqual([])
  }, 120000)

  it('the size a set names is the size of the picture the numbers are meant for, and the numbers are pixels of the master whatever the frame', async () => {
    const plain = await shoot(narrow)
    const back = await shoot({ ...narrow, drawn: false })
    // Named twice as large the texel is half a pixel, named half as large it is two.
    expect(await shoot({ ...narrow, detail: [0.6, 1.5], detailSize: [64, 32] })).toEqual(plain)
    expect(await shoot({ ...narrow, detail: [0.6, 1.5], detailSize: [16, 8] })).toEqual(back)
    expect(await shoot({ ...narrow, detail: [0.6, 1.5], detailSize: [32, 16] })).not.toEqual(plain)
    // A frame of twice the height: the texel takes two pixels of the buffer and is one pixel of the master as before.
    const big = { ...narrow, width: 2 * W, height: 2 * H }
    const at2 = (p: number[], x: number, y: number): number[] => p.slice((y * 2 * W + x) * 4, (y * 2 * W + x) * 4 + 4)
    const plain2 = await shoot(big)
    const back2 = await shoot({ ...big, drawn: false })
    expect(await shoot({ ...big, detail: [1.01, 1.5], frame: 2 })).toEqual(plain2)
    expect(await shoot({ ...big, detail: [1.01, 1.5] })).toEqual(back2)
    const got = await shoot({ ...big, detail: [0.5, 1.5], frame: 2 })
    let read = 0
    for (let y = 0; y < 2 * H; y++) {
      for (let x = 0; x < 2 * W; x++) {
        if (x >= 14 && x <= 49 && y >= 6 && y <= 25) continue
        read++
        for (let c = 0; c < 4; c++) expect(at2(got, x, y)[c]).toBeCloseTo(0.5 * at2(plain2, x, y)[c]! + 0.5 * at2(back2, x, y)[c]!, 3)
      }
    }
    expect(read).toBeGreaterThan(1000)
    expect(errors).toEqual([])
  }, 120000)

  it('by the eye: nearer than the picture saw it the texel stands larger and the relief gives way, a little nearer a part of it, much nearer all of it', async () => {
    const range: [number, number] = [1.1, 1.4]
    for (const set of [narrow]) {
      expect(await shoot({ ...set, detail: range })).toEqual(await shoot(set))
      // Half way to the far layer every texel in view is about two pixels or more: nothing of the relief is drawn.
      const close: [number, number, number] = [0, 0, -3]
      const backClose = await shoot({ ...set, drawn: false, eye: close })
      expect(await shoot({ ...set, detail: range, eye: close })).toEqual(backClose)
      expect(await shoot({ ...set, detail: null, eye: close })).not.toEqual(backClose)
    }
    // On the way there the far layer, 6 from the picture's eye and seen alone at the first pixel, has texels of 6 over its distance
    // pixels: one share in all colours, the share of that size. The rasteriser sets a corner of the mesh on a part of a pixel, so
    // on a cell of 8 pixels the size reads up to a third of a percent off, which the steep range here makes a hundredth of the share.
    let last = 1
    for (const z of [-0.6, -0.9, -1.2, -1.6]) {
      const eye: [number, number, number] = [0, 0, z]
      const plain = pixel(await shoot({ ...narrow, eye }), 0, 0)
      const back = pixel(await shoot({ ...narrow, drawn: false, eye }), 0, 0)
      const got = pixel(await shoot({ ...narrow, detail: range, eye }), 0, 0)
      const want = 1 - smoothStep((6 / (6 + z) - range[0]) / (range[1] - range[0]))
      const shares = [0, 1, 2].map((c) => (got[c]! - back[c]!) / (plain[c]! - back[c]!))
      for (const share of shares) {
        expect(Math.abs(share - want)).toBeLessThan(0.02)
        expect(share).toBeCloseTo(shares[0]!, 4)
        expect(share).toBeLessThan(last)
      }
      last = shares[0]!
    }
    expect(last).toBeLessThan(0.1)
    expect(last).toBeGreaterThan(0)
    expect(errors).toEqual([])
  }, 120000)

  it('goes with a presence and an edge: the three shares multiply', async () => {
    const edged = await shoot({ ...narrowSided, edge: RIGHT })
    const back = await shoot({ ...narrowSided, drawn: false })
    const got = await shoot({ ...narrowSided, presence: 0.5, edge: RIGHT, detail: [0.5, 1.5] })
    let read = 0
    let feathered = 0
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (x >= 7 && x <= 24 && y >= 3 && y <= 12) continue
        // Beyond the side: the ground alone, to the bit. Inside it, where the far layer alone covers the pixel: the share of the edge
        // times a half of the presence times a half by the eye (a texel of one pixel between a half and one and a half).
        if (x >= 24) {
          expect(pixel(got, x, y)).toEqual(pixel(back, x, y))
          continue
        }
        read++
        if (x >= 17 && Math.abs(pixel(edged, x, y)[0]! - pixel(back, x, y)[0]!) > 0.01) feathered++
        for (let c = 0; c < 4; c++) expect(pixel(got, x, y)[c]).toBeCloseTo(0.25 * pixel(edged, x, y)[c]! + 0.75 * pixel(back, x, y)[c]!, 3)
      }
    }
    expect(read).toBeGreaterThan(100)
    expect(feathered).toBeGreaterThan(10)
    expect(errors).toEqual([])
  }, 120000)

  // The law of a stop (Relief.presenceLaw).

  it('a law of 1 is the relief that never asked, to the bit, a law of 0 draws no layer and leaves the air whole, and the share is held to 0..1', async () => {
    const law = (value: string): { text: string } => ({ text: 'float lawShare(vec3 P, vec3 E, vec2 image) { return ' + value + '; }' })
    for (const set of [base, aired, sided]) {
      const plain = await shoot(set)
      expect(await shoot({ ...set, law: law('1.0') })).toEqual(plain)
      expect(await shoot({ ...set, law: law('7.5') })).toEqual(plain)
    }
    const back = await shoot({ ...base, drawn: false })
    expect(await shoot({ ...base, law: law('0.0') })).toEqual(back)
    expect(await shoot({ ...base, law: law('-3.0') })).toEqual(back)
    expect(await shoot({ ...aired, law: law('0.0') })).toEqual(await shoot({ ...aired, presence: 0, airShare: 1 }))
    expect(errors).toEqual([])
  }, 120000)

  it('the law is given the ground point, the eye and the place in the picture, and its own uniforms', async () => {
    const plain = await shoot(base)
    const back = await shoot({ ...base, drawn: false })
    const mixed = (got: number[], share: (x: number, y: number) => number, digits: number): number => {
      let read = 0
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (x >= 7 && x <= 24 && y >= 3 && y <= 12) continue
          read++
          const k = share(x, y)
          for (let c = 0; c < 4; c++) expect(pixel(got, x, y)[c]).toBeCloseTo(k * pixel(plain, x, y)[c]! + (1 - k) * pixel(back, x, y)[c]!, digits)
        }
      }
      return read
    }
    // By the place in the picture: the left half whole, the right half a quarter.
    const byPlace = await shoot({ ...base, law: { text: 'float lawShare(vec3 P, vec3 E, vec2 image) { return image.x < 0.5 ? 1.0 : 0.25; }' } })
    expect(mixed(byPlace, (x) => (x < 16 ? 1 : 0.25), 5)).toBeGreaterThan(200)
    // The place runs down the picture: the top rows of the picture are the top rows of the frame (read back from the bottom up).
    const byRow = await shoot({ ...base, law: { text: 'float lawShare(vec3 P, vec3 E, vec2 image) { return image.y < 0.125 ? 0.0 : 1.0; }' } })
    expect(mixed(byRow, (_x, y) => (y >= H - 2 ? 0 : 1), 5)).toBeGreaterThan(200)
    // By the ground point: the far layer stands 6 from the picture's eye and the near one 4, down the lens.
    const byPoint = await shoot({ ...base, law: { text: 'float lawShare(vec3 P, vec3 E, vec2 image) { return length(P) > 5.0 && P.z < -4.0 ? 0.5 : 1.0; }' } })
    expect(mixed(byPoint, () => 0.5, 5)).toBeGreaterThan(200)
    const far = pixel(plain, ...CORNER)
    const near = pixel(plain, ...CENTRE).map((v, c) => v - far[c]! * (1 - ALPHA))
    for (let c = 0; c < 3; c++) expect(pixel(byPoint, ...CENTRE)[c]).toBeCloseTo(near[c]! + (far[c]! * 0.5 + base.back[c]! * 0.5) * (1 - ALPHA), 5)
    // By the eye: at the picture's own eye it is whole, a step aside it has gone, and the eye is told in the relief's units under a scaled group.
    const byEye = { text: 'uniform float uLawReach;\nfloat lawShare(vec3 P, vec3 E, vec2 image) { return length(E) < uLawReach ? 1.0 : 0.0; }', uniforms: { uLawReach: 0.5 } }
    expect(await shoot({ ...base, law: byEye })).toEqual(plain)
    const aside: [number, number, number] = [0.6, 0, 0]
    expect(await shoot({ ...base, law: byEye, eye: aside })).toEqual(await shoot({ ...base, drawn: false, eye: aside }))
    expect(await shoot({ ...base, law: { ...byEye, uniforms: { uLawReach: 0.7 } }, eye: aside })).toEqual(await shoot({ ...base, eye: aside }))
    const scaledBack = await shoot({ ...base, drawn: false, eye: aside, scale: SCALE })
    const scaledGone = await shoot({ ...base, law: byEye, eye: aside, scale: SCALE })
    expect(scaledGone).toEqual(scaledBack)
    expect(await shoot({ ...base, law: { ...byEye, uniforms: { uLawReach: 0.7 } }, eye: aside, scale: SCALE })).not.toEqual(scaledBack)
    // Its own uniforms, a number and a pair.
    const byNumber = await shoot({ ...base, law: { text: 'uniform float uLawShare;\nuniform vec2 uLawPair;\nfloat lawShare(vec3 P, vec3 E, vec2 image) { return uLawShare * uLawPair.x + uLawPair.y; }', uniforms: { uLawShare: 0.5, uLawPair: [0.5, 0.125] } } })
    expect(mixed(byNumber, () => 0.375, 5)).toBeGreaterThan(200)
    expect(errors).toEqual([])
  }, 120000)

  it('the law is told the focal length of the lens in pixels of the master and the buffer pixels a pixel of the master takes, and may take derivatives', async () => {
    // A lens of 40 degrees on a frame 16 high: 8 over the tangent of 20 degrees.
    const focal = 8 / Math.tan((20 * Math.PI) / 180)
    const told = (frame: number): { text: string; uniforms: Record<string, number> } => ({
      text: 'uniform float uLawWant;\nuniform float uLawPass;\nfloat lawShare(vec3 P, vec3 E, vec2 image) { return abs(uLawFocal - uLawWant) < 0.001 && abs(uLawFrame - uLawPass) < 0.000001 ? 1.0 : 0.0; }',
      uniforms: { uLawWant: focal, uLawPass: frame },
    })
    const plain = await shoot(base)
    expect(await shoot({ ...base, law: told(1) })).toEqual(plain)
    expect(await shoot({ ...base, law: { ...told(1), uniforms: { uLawWant: focal + 0.01, uLawPass: 1 } } })).toEqual(await shoot({ ...base, drawn: false }))
    const big = { ...base, width: 2 * W, height: 2 * H }
    expect(await shoot({ ...big, law: told(2), frame: 2 })).toEqual(await shoot(big))
    expect(await shoot({ ...big, law: told(1), frame: 2 })).toEqual(await shoot({ ...big, drawn: false }))
    // A law that counts on the screen: the texels of the picture a pixel takes, by the derivative of the place, before any branch.
    const counted = { text: 'uniform vec2 uLawSize;\nfloat lawShare(vec3 P, vec3 E, vec2 image) { float across = abs(dFdx(image.x * uLawSize.x)) / uLawFrame; return clamp(across - 0.5, 0.0, 1.0); }', uniforms: { uLawSize: [W, H] as [number, number] } }
    const got = await shoot({ ...narrow, law: counted })
    const plainNarrow = await shoot(narrow)
    const backNarrow = await shoot({ ...narrow, drawn: false })
    for (let c = 0; c < 3; c++) expect(pixel(got, ...CORNER)[c]).toBeCloseTo(0.5 * pixel(plainNarrow, ...CORNER)[c]! + 0.5 * pixel(backNarrow, ...CORNER)[c]!, 3)
    expect(errors).toEqual([])
  }, 120000)

  it('a law of the kind a stop writes, the ground a texel of the picture shows on the screen: one pixel from the picture own eye through its own lens, larger nearer, and whole to the bit when its switch is off', async () => {
    const text = [
      'uniform vec4 uLawTexel; // from, to (pixels of the master), the focal length of the picture in its pixels, the smallest sine',
      'uniform vec4 uLawAir;   // from, to (ratio of sines), on, free',
      'uniform vec3 uLawEye;   // the eye the air is counted against',
      'float lawSine(vec3 ray) { return max(abs(dot(normalize(ray), uUpL)), uLawTexel.w); }',
      'vec3 lawLevel(vec3 ray) { vec3 level = ray - dot(ray, uUpL) * uUpL; return level / max(length(level), 1e-6); }',
      'float lawShare(vec3 P, vec3 E, vec2 image) {',
      '  if (uLawAir.z < 0.5) return 1.0;',
      '  float sinPicture = lawSine(P);',
      '  float sinNow = lawSine(P - E);',
      '  float sinTaken = lawSine(P - uLawEye);',
      '  vec3 a = lawLevel(normalize(P));',
      '  vec3 b = lawLevel(normalize(P - E));',
      '  float across = length(P) / uLawTexel.z * uLawFocal / length(P - E);',
      '  float along = across / sinPicture * length(vec2(sinNow * dot(a, b), length(cross(a, b))));',
      '  float texel = 1.0 - smoothstep(uLawTexel.x, uLawTexel.y, max(across, along));',
      '  float air = 1.0 - smoothstep(uLawAir.x, uLawAir.y, sinNow / sinTaken);',
      '  return texel * air;',
      '}',
    ].join('\n')
    // The picture of 32 by 16 through a lens of 0.5 degrees: its focal length in its own pixels.
    const focal = 8 / Math.tan((NARROW / 2 * Math.PI) / 180)
    const law = (from: number, to: number, on: number): Shot['law'] => ({ text, uniforms: { uLawTexel: [from, to, focal, 1 / 44.1], uLawAir: [1.2, 2, on, 0], uLawEye: [0, 0, 0] } })
    const plain = await shoot(narrow)
    const back = await shoot({ ...narrow, drawn: false })
    expect(await shoot({ ...narrow, law: law(0.5, 1.5, 0) })).toEqual(plain)
    expect(await shoot({ ...narrow, law: law(1.01, 1.5, 1) })).toEqual(plain)
    expect(await shoot({ ...narrow, law: law(0.5, 0.99, 1) })).toEqual(back)
    const half = await shoot({ ...narrow, law: law(0.5, 1.5, 1) })
    let read = 0
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (x >= 7 && x <= 24 && y >= 3 && y <= 12) continue
        read++
        for (let c = 0; c < 4; c++) expect(pixel(half, x, y)[c]).toBeCloseTo(0.5 * pixel(plain, x, y)[c]! + 0.5 * pixel(back, x, y)[c]!, 4)
      }
    }
    expect(read).toBeGreaterThan(200)
    // Nearer along the lens the far layer, 6 from the picture's eye, shows a texel of about 6 over its distance pixels. The law as
    // written here, for the point the first pixel sees: no room is asked for the rasteriser, the law takes no derivative.
    const floor = 1 / 44.1
    const tan = Math.tan((NARROW / 2 * Math.PI) / 180)
    const ray = new THREE.Vector3((0.5 / 16 - 1) * 2 * tan, (0.5 / 8 - 1) * tan, -1).normalize()
    const up = new THREE.Vector3(0, 1, 0)
    const sine = (v: THREE.Vector3): number => Math.max(Math.abs(v.clone().normalize().dot(up)), floor)
    const level = (v: THREE.Vector3): THREE.Vector3 => v.clone().addScaledVector(up, -v.dot(up)).normalize()
    let last = 1
    for (const z of [-0.6, -0.9, -1.2, -1.6]) {
      const eye: [number, number, number] = [0, 0, z]
      const E = new THREE.Vector3(0, 0, z)
      // Where the ray from the eye meets the far layer, a part of a ball of 6 about the picture's eye.
      const along = -E.dot(ray) + Math.sqrt(E.dot(ray) ** 2 - E.lengthSq() + 36)
      const P = E.clone().addScaledVector(ray, along)
      const a = level(P)
      const b = level(P.clone().sub(E))
      const across = 6 / P.distanceTo(E)
      const size = Math.max(across, across / sine(P) * Math.hypot(sine(P.clone().sub(E)) * a.dot(b), a.clone().cross(b).length()))
      const want = 1 - smoothStep((size - 1.1) / 0.3)
      expect(Math.abs(size - 6 / (6 + z))).toBeLessThan(0.01)
      const p = pixel(await shoot({ ...narrow, eye }), 0, 0)
      const g = pixel(await shoot({ ...narrow, drawn: false, eye }), 0, 0)
      const got = pixel(await shoot({ ...narrow, law: law(1.1, 1.4, 1), eye }), 0, 0)
      for (let c = 0; c < 3; c++) expect(got[c]).toBeCloseTo(want * p[c]! + (1 - want) * g[c]!, 4)
      expect(want).toBeLessThan(last)
      last = want
    }
    expect(last).toBeLessThan(0.1)
    // The other term, by the eye a uniform names: from 1 above the picture's eye the ground is seen seven times steeper than from the
    // picture's eye and has gone; counted against that same raised eye it is whole to the bit.
    const high: [number, number, number] = [0, 1, 0]
    const backHigh = await shoot({ ...narrow, drawn: false, eye: high })
    expect(await shoot({ ...narrow, law: { text, uniforms: { uLawTexel: [9, 10, focal, floor], uLawAir: [1.2, 2, 1, 0], uLawEye: [0, 0, 0] } }, eye: high })).toEqual(backHigh)
    expect(await shoot({ ...narrow, law: { text, uniforms: { uLawTexel: [9, 10, focal, floor], uLawAir: [1.2, 2, 1, 0], uLawEye: [0, 1, 0] } }, eye: high })).toEqual(await shoot({ ...narrow, eye: high }))
    // A frame of twice the height: the same lens is told with the same focal length, so the same share.
    const big = { ...narrow, width: 2 * W, height: 2 * H }
    const at2 = (p: number[], x: number, y: number): number[] => p.slice((y * 2 * W + x) * 4, (y * 2 * W + x) * 4 + 4)
    const half2 = await shoot({ ...big, law: law(0.5, 1.5, 1), frame: 2 })
    const plain2 = await shoot(big)
    const back2 = await shoot({ ...big, drawn: false })
    for (let c = 0; c < 4; c++) expect(at2(half2, 1, 1)[c]).toBeCloseTo(0.5 * at2(plain2, 1, 1)[c]! + 0.5 * at2(back2, 1, 1)[c]!, 4)
    expect(errors).toEqual([])
  }, 120000)

  it('goes with a presence: the two shares multiply', async () => {
    const plain = await shoot(base)
    const back = await shoot({ ...base, drawn: false })
    const got = await shoot({ ...base, presence: 0.5, law: { text: 'float lawShare(vec3 P, vec3 E, vec2 image) { return 0.5; }' } })
    for (let c = 0; c < 4; c++) expect(pixel(got, ...CORNER)[c]).toBeCloseTo(0.25 * pixel(plain, ...CORNER)[c]! + 0.75 * pixel(back, ...CORNER)[c]!, 5)
    expect(errors).toEqual([])
  }, 120000)
})
