import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium, type Browser, type Page } from 'playwright-core'
import { build } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { CHROME, CHROME_FLAGS } from '../tools/lib/browser'

// The sheets of a crest in a WebGL2 browser (ReliefMotion.crest): the pixels. One layer whose distances step from a far ground on the
// left to a near ground on the right (or, lying flat, from a far ground above to a near ground below), painted in two flat colours
// with the border beside the step's middle, is drawn from the picture's eye and from an eye to either side, with the sheets and
// without; then with the paint's border beyond the middle, with a near side that is no ground and with a far side that is none,
// the matte in the colour's alpha and as a map of its own, and with the crest cut in a box of the layer only.
// The finding and the meshes are tests/crest.test.ts.

const ROOT = resolve(__dirname, '..')
const at = (path: string): string => JSON.stringify(resolve(ROOT, path))

const PAGE = `
import * as THREE from 'three'
import { Relief } from ${at('src/terrain/relief.ts')}

const renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas') })

function made(w, h, rgba, srgb) {
  const data = new Uint8Array(w * h * 4)
  // The first row of a data texture is the picture's lowest: rgba is asked by the row counted from the top, as a distance map is.
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data.set(rgba(x, h - 1 - y), (y * w + x) * 4)
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.minFilter = tex.magFilter = THREE.LinearFilter
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

async function shot(o) {
  const ctx = {
    texture: async (path, options) => {
      const ground = (x, y) => ((o.flat ? y : x) < o.border ? o.far : o.near)
      // With a matte of its own the colour is opaque everywhere and the map says where the layer is ground.
      if (path === 'relief-step-color.jpg') return made(o.w, o.h, (x, y) => (o.matte ? [ground(x, y)[0], ground(x, y)[1], ground(x, y)[2], 255] : ground(x, y)), true)
      if (path === 'relief-step-alpha.png') return made(o.w, o.h, (x, y) => [ground(x, y)[3], ground(x, y)[3], ground(x, y)[3], 255], false)
      return made(8, 8, () => [0, 0, 0, 255], false)
    },
    buffer: async () => new Float32Array(o.dist).buffer,
  }
  const relief = await Relief.load(ctx, '', o.def, o.motion)
  const cam = new THREE.PerspectiveCamera(o.def.vfovDeg, o.width / o.height, 0.1, 100)
  relief.update(0, 1, 0, { format: { width: o.width, height: o.height }, camera: cam })
  cam.position.set(o.eye[0], o.eye[1], o.eye[2])
  cam.updateMatrixWorld(true)
  const scene = new THREE.Scene()
  scene.add(relief.group)
  const target = new THREE.WebGLRenderTarget(o.width, o.height, { type: THREE.FloatType })
  renderer.setRenderTarget(target)
  renderer.setClearColor(new THREE.Color(o.back[0], o.back[1], o.back[2]), 1)
  renderer.render(scene, cam)
  const out = new Float32Array(o.width * o.height * 4)
  renderer.readRenderTargetPixels(target, 0, 0, o.width, o.height, out)
  renderer.setRenderTarget(null)
  target.dispose()
  relief.dispose()
  return Array.from(out)
}

window.crest = { shot }
`

const W = 64
const H = 48
const FAR = 20
const NEAR = 5
const FROM = 27
const BORDER = 29
const PX = 4
const WIDTH = W * PX
const HEIGHT = H * PX
const VFOV = 40
const SIDE = 0.5
const dist = (): number[] => {
  const d: number[] = []
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = Math.min(1, Math.max(0, (x - FROM + 1) / 4))
      d.push(1 / ((1 / FAR) * (1 - t) + (1 / NEAR) * t))
    }
  }
  return d
}
// The same step lying flat: far above, near below, its middle the middle of row 23, the paint's border at row 24.
const FROMY = 22
const BORDERY = 24
const distFlat = (): number[] => {
  const d: number[] = []
  for (let y = 0; y < H; y++) {
    const t = Math.min(1, Math.max(0, (y - FROMY + 1) / 4))
    for (let x = 0; x < W; x++) d.push(1 / ((1 / FAR) * (1 - t) + (1 / NEAR) * t))
  }
  return d
}
// A stop counts in cells of the layer's mesh: a cell of this mesh is 8 texels of the map, so a walk of 8 texels and 16 under.
const CELL = 8
const NUMBERS = { step: 0.02, walk: 1, under: 2 }
interface Shot { def: object; motion: object; w: number; h: number; border: number; flat?: boolean; matte?: boolean; far: number[]; near: number[]; dist: number[]; eye: number[]; width: number; height: number; back: number[] }
const LAYER = { color: 'relief-step-color.jpg', dist: 'relief-step-dist.bin', box: [0, 0, W, H], distSize: [W, H], tint: [1, 1, 1] }
const DEF = { imageSize: [W, H], vfovDeg: VFOV, masks: 'masks.png', maskBox: [0, 0, W, H], mistDir: [1, 0] }
const base: Shot = {
  def: { ...DEF, layers: [LAYER] },
  motion: { mistSpeed: 0, dustSpeed: 0, dustDir: [1, 0], mesh: 8 },
  w: W, h: H, border: BORDER, far: [200, 60, 40, 255], near: [40, 90, 220, 255], dist: dist(), eye: [0, 0, 0], width: WIDTH, height: HEIGHT, back: [0, 1, 0],
}
const crested: Shot = { ...base, motion: { ...base.motion, crest: [{ layer: 'step', ...NUMBERS }] } }
const lying: Shot = { ...base, flat: true, border: BORDERY, dist: distFlat() }
// out: how far the cut is moved out, in texels of the map here. under: how far the far sheet goes on under the near side, in cells.
const sheeted = (o: Shot, out = 0, boxes?: number[][], under = NUMBERS.under): Shot => ({ ...o, motion: { ...base.motion, crest: [{ layer: 'step', ...NUMBERS, under, ...(out > 0 ? { out: out / CELL } : {}), ...(boxes ? { boxes } : {}) }] } })
// The upper half of the layer (rows 0 to 23 of the map), the lower half and the middle third: where a crest is cut in one of them
// the sheets end and the mesh's wall goes on, with the whole step between the two sides.
const UPPER = [[0, 0, 1, 0.5]]
const LOWER = [[0, 0.5, 1, 1]]
const MIDDLE = [[0, 1 / 3, 1, 2 / 3]]
// The same layer with its matte as a map of its own beside an opaque colour, as a stop's layers have it.
const matted = (o: Shot): Shot => ({ ...o, matte: true, def: { ...DEF, layers: [{ ...LAYER, alpha: 'relief-step-alpha.png' }] } })
const FOCAL = HEIGHT / 2 / Math.tan((VFOV / 2) * Math.PI / 180)

const have = existsSync(CHROME)

describe.skipIf(!have)('the sheets of a crest in a WebGL2 browser', () => {
  let browser: Browser
  let page: Page
  const errors: string[] = []
  const shoot = async (o: Shot): Promise<number[]> => page.evaluate((x) => (window as unknown as { crest: { shot(o: unknown): Promise<number[]> } }).crest.shot(x), o)
  // A row of the picture: for each pixel 0 where it is the far ground's colour, 1 where it is the near ground's, between them by the
  // red channel; -1 where the cleared colour shows (green is in neither ground).
  const row = (pixels: number[], y: number, far: number[], near: number[]): number[] => {
    const out: number[] = []
    for (let x = 0; x < WIDTH; x++) {
      const i = (y * WIDTH + x) * 4
      const green = pixels[i + 1]! - Math.max(far[1]!, near[1]!)
      out.push(green > 0.2 ? -1 : (pixels[i]! - far[0]!) / (near[0]! - far[0]!))
    }
    return out
  }
  // Where the near ground's colour begins on the row, in pixels from the left, to a part of a pixel.
  const begins = (r: number[]): number => {
    const x = r.findIndex((v) => v >= 0.5)
    return x <= 0 ? x : x - (r[x]! - 0.5) / Math.max(r[x]! - r[x - 1]!, 1e-9) + 0.5
  }
  // The pixels across the crest through the middle of the picture, from the far side to the near side: the middle row from the
  // left for a crest that stands, the middle column from the top for one that lies flat (the pixels are read from the lowest row
  // up). Red and green of each.
  const across = (pixels: number[], flat: boolean): { red: number[]; green: number[] } => {
    const red: number[] = []
    const green: number[] = []
    const n = flat ? HEIGHT : WIDTH
    for (let k = 0; k < n; k++) {
      const i = (flat ? (HEIGHT - 1 - k) * WIDTH + WIDTH / 2 : (HEIGHT / 2) * WIDTH + k) * 4
      red.push(pixels[i]!)
      green.push(pixels[i + 1]!)
    }
    return { red, green }
  }
  // As row: 0 the far ground's colour, 1 the near ground's, -1 the cleared colour.
  const sides = (line: { red: number[]; green: number[] }, far: number[], near: number[]): number[] =>
    line.red.map((r, k) => (line.green[k]! - Math.max(far[1]!, near[1]!) > 0.2 ? -1 : (r - far[0]!) / (near[0]! - far[0]!)))
  // How much of each pixel a ground of one colour covers, by the green of the cleared colour behind it: 1 covered, 0 open.
  const cover = (line: { green: number[] }, ground: number[]): number[] => line.green.map((g) => 1 - (g - ground[1]!) / (1 - ground[1]!))
  // Where the cover ends, going from the far side, from the pixel start on: to a part of a pixel.
  const ends = (c: number[], start: number): number => {
    const k = c.findIndex((v, i) => i >= start && v < 0.5)
    return k <= 0 ? k : k - (0.5 - c[k]!) / Math.max(c[k - 1]! - c[k]!, 1e-9) + 0.5
  }
  // How far the picture's rim stands in from either end of such a line when the eye has moved by side toward the far end's side: a
  // distance is along the ray, so at the rim a ground stands nearer the lens's plane.
  const frame = (side: number, flat: boolean): { from: number; to: number } => {
    const n = flat ? HEIGHT : WIDTH
    const rim = 1 / Math.hypot(1, n / 2 / FOCAL)
    return { from: Math.ceil(Math.max(0, -side * FOCAL) / (FAR * rim) + 1), to: Math.floor(n - Math.max(0, side * FOCAL) / (NEAR * rim) - 1) }
  }
  // The eye moved by side along the line across the crest: a point at a depth then stands side times the focal length over the
  // depth nearer the far end of the line.
  const eyeAt = (side: number, flat: boolean): number[] => (flat ? [0, -side, 0] : [side, 0, 0])
  // Where the layer still covers the picture when the eye has moved by side, across and up: [left, bottom, right, top] in pixels.
  // A ground at the near distance moves most, and a distance is along the ray: in the picture's corners a ground stands nearer the
  // lens's plane.
  const frameOf = (side: number[]): number[] => {
    const rim = 1 / Math.hypot(1, WIDTH / 2 / FOCAL, HEIGHT / 2 / FOCAL)
    const x0 = Math.ceil(Math.max(0, -side[0]! * FOCAL) / (NEAR * rim) + 2)
    const x1 = Math.floor(WIDTH - Math.max(0, side[0]! * FOCAL) / (NEAR * rim) - 2)
    const y0 = Math.ceil(Math.max(0, -side[1]! * FOCAL) / (NEAR * rim) + 2)
    const y1 = Math.floor(HEIGHT - Math.max(0, side[1]! * FOCAL) / (NEAR * rim) - 2)
    return [x0, y0, x1, y1]
  }
  // How many pixels of such a frame hold the cleared colour: the eye sees through the layer there.
  const open = (pixels: number[], [x0, y0, x1, y1]: number[]): number => {
    let n = 0
    for (let y = y0!; y < y1!; y++) for (let x = x0!; x < x1!; x++) if (pixels[(y * WIDTH + x) * 4 + 1]! - Math.max(base.far[1]!, base.near[1]!) / 255 > 0.3) n++
    return n
  }

  beforeAll(async () => {
    const dir = resolve(ROOT, 'out/work/crest-test')
    mkdirSync(dir, { recursive: true })
    const entry = resolve(dir, 'page.js')
    writeFileSync(entry, PAGE)
    const built = await build({
      root: ROOT, configFile: false, logLevel: 'silent',
      build: { write: false, minify: false, target: 'es2022', lib: { entry, formats: ['iife'], name: 'crestPage', fileName: 'crest-page' } },
    })
    const output = (Array.isArray(built) ? built[0]! : built) as { output: { type: string; code?: string }[] }
    const code = output.output.find((x) => x.type === 'chunk')!.code!
    browser = await chromium.launch({ executablePath: CHROME, headless: true, args: CHROME_FLAGS })
    page = await browser.newPage()
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    await page.route('http://crest.test/**', (route) => {
      const url = route.request().url()
      if (url.endsWith('/page.js')) return route.fulfill({ status: 200, contentType: 'text/javascript', body: code })
      if (url === 'http://crest.test/') return route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body><script src="./page.js"></script></body></html>' })
      return route.fulfill({ status: 404, body: '' })
    })
    await page.goto('http://crest.test/')
    await page.waitForFunction(() => 'crest' in window, undefined, { timeout: 60000 })
    expect(errors).toEqual([])
  }, 180000)

  afterAll(async () => {
    await browser?.close()
  })

  it('from the picture own eye the sheets give the painting back, the pixels of the cut as every other', async () => {
    // The painting itself: the layer on even ground. From the picture's eye a layer shows its painting whatever its one distance is.
    const painting = await shoot({ ...base, dist: base.dist.map(() => FAR) })
    const same = await shoot({ ...base, dist: base.dist.map(() => NEAR) })
    const cut = await shoot(crested)
    expect(errors).toEqual([])
    const far = painting.slice(0, 4)
    const near = painting.slice((WIDTH - 1) * 4, WIDTH * 4)
    expect(Math.abs(far[0]! - near[0]!)).toBeGreaterThan(0.2)
    const against = (got: number[]): { moved: number; largest: number; from: number; to: number } => {
      const out = { moved: 0, largest: 0, from: WIDTH, to: -1 }
      for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
          const i = (y * WIDTH + x) * 4
          let step = 0
          for (let c = 0; c < 3; c++) step = Math.max(step, Math.abs(painting[i + c]! - got[i + c]!) / Math.max(Math.abs(far[c]! - near[c]!), 1e-6))
          out.largest = Math.max(out.largest, step)
          if (step <= 0.004) continue
          out.moved++
          out.from = Math.min(out.from, x)
          out.to = Math.max(out.to, x)
        }
      }
      return out
    }
    expect(against(same).moved).toBe(0)
    // The step's middle is the middle of texel 28: pixel 114. Where the near sheet ends (the pixel beyond the cut) the far sheet
    // under it still holds the layer's own texel, and where the far sheet takes the far end's texel (the pixel inside the cut) the
    // near sheet over it is whole: nothing but the painting, at the cut and beside it. Cut on the middle or moved out.
    const sheets = against(cut)
    expect(sheets.moved).toBe(0)
    expect(sheets.largest).toBeLessThanOrEqual(0.004)
    const moved = against(await shoot(sheeted(base, 2)))
    expect(moved.moved).toBe(0)
    // The mesh without the sheets does not: its wall lies across cells whose corners stand at two distances, and the painting on
    // it is drawn out of true inside those cells, the picture's own eye or not.
    expect(against(await shoot(base)).moved).toBeGreaterThan(HEIGHT)
    // A hollow in the near ground that lies deeper than the far side does, two cells wide, within the reach of the far sheet under
    // the near side (the crest is named by a point, so the hollow's own rims stay the mesh's): the far sheet lies behind the
    // hollow's ground, not before it, and the painting comes back there as everywhere.
    const hollow = base.dist.map((d, i) => (i % W >= 40 && i % W < 56 && Math.floor(i / W) >= 16 && Math.floor(i / W) < 32 ? 2 * FAR : d))
    const named: Shot = { ...base, dist: hollow, motion: { ...base.motion, crest: [{ layer: 'step', ...NUMBERS, at: [[28 / W, 0.25]] }] } }
    const deep = against(await shoot(named))
    expect(errors).toEqual([])
    expect(deep.moved).toBe(0)
  }, 120000)

  it('from an eye to the side the near ground keeps its border on its own distance and the far ground lies in the gap', async () => {
    const focal = HEIGHT / 2 / Math.tan((VFOV / 2) * Math.PI / 180)
    // A distance is along the ray: at the picture's left and right rim a ground stands nearer the lens's plane by this.
    const rim = 1 / Math.hypot(1, WIDTH / 2 / focal)
    const y = HEIGHT / 2
    for (const side of [-SIDE, SIDE]) {
      const plain = await shoot({ ...base, eye: [side, 0, 0] })
      const cut = await shoot({ ...crested, eye: [side, 0, 0] })
      expect(errors).toEqual([])
      const ends = await shoot({ ...base, eye: [0, 0, 0] })
      const far = ends.slice(0, 4)
      const near = ends.slice((WIDTH - 1) * 4, WIDTH * 4)
      const a = row(plain, y, far, near)
      const b = row(cut, y, far, near)
      // Rigid with the near ground: the painted border, texel 29, moves as a point at the near distance does.
      const rigid = BORDER * PX - (side * focal) / NEAR
      expect(Math.abs(begins(b) - rigid)).toBeLessThanOrEqual(1)
      // That this has teeth: the mesh without the sheets draws the border on the wall of the step, and where the wall opens to the
      // eye (the eye left of the picture's) that is texels away from where the near ground is.
      if (side < 0) expect(Math.abs(begins(a) - rigid)).toBeGreaterThan(4 * PX)
      // Left of the border the far ground and nothing else, right of it the near ground: no cleared colour, no second border.
      const at = Math.round(begins(b))
      for (let x = 0; x < WIDTH; x++) {
        if (Math.abs(x - at) <= 2) continue
        const inside = x + 0.5 > Math.max(0, -side * focal) / (FAR * rim) + 1 && x + 0.5 < WIDTH - Math.max(0, side * focal) / (NEAR * rim) - 1
        if (!inside) continue
        expect(Math.abs(b[x]! - (x < at ? 0 : 1))).toBeLessThanOrEqual(0.02)
      }
    }
  }, 120000)

  it('a crest that lies flat keeps its border on the near ground and has the far ground in the gap, as one that stands', async () => {
    const even = await shoot({ ...lying, dist: lying.dist.map(() => FAR) })
    const far = even.slice((HEIGHT - 1) * WIDTH * 4, (HEIGHT - 1) * WIDTH * 4 + 4)
    const near = even.slice(0, 4)
    expect(Math.abs(far[0]! - near[0]!)).toBeGreaterThan(0.2)
    for (const side of [-SIDE, SIDE]) {
      const a = sides(across(await shoot({ ...lying, eye: eyeAt(side, true) }), true), far, near)
      const b = sides(across(await shoot({ ...sheeted(lying), eye: eyeAt(side, true) }), true), far, near)
      expect(errors).toEqual([])
      const rigid = BORDERY * PX - (side * FOCAL) / NEAR
      expect(Math.abs(begins(b) - rigid)).toBeLessThanOrEqual(1)
      // The mesh without the sheets has a row of its vertices on this ramp (row 24), so its wall is short and the border on it
      // stands nearer the near ground's than on the standing crest: still more than two texels off.
      if (side < 0) expect(Math.abs(begins(a) - rigid)).toBeGreaterThan(2 * PX)
      // Were the way to the far ground read down the map in place of up, the gap would hold the near ground's colour.
      const at = Math.round(begins(b))
      const { from, to } = frame(side, true)
      for (let k = from; k < to; k++) if (Math.abs(k - at) > 2) expect(Math.abs(b[k]! - (k < at ? 0 : 1))).toBeLessThanOrEqual(0.02)
    }
  }, 120000)

  it('with the cut moved out as far as the paint reaches, the painted border rides with the near ground and leaves no outline', async () => {
    // The near ground's colour begins at texel 27: a texel and a half beyond the step's middle, on the far half of the ramp.
    const painted: Shot = { ...base, border: FROM }
    const even = await shoot({ ...painted, dist: base.dist.map(() => FAR) })
    const far = even.slice(0, 4)
    const near = even.slice((WIDTH - 1) * 4, WIDTH * 4)
    const borders = (r: number[], from: number, to: number): number => {
      let n = 0
      for (let x = from + 1; x < to; x++) if (r[x]! >= 0.5 !== r[x - 1]! >= 0.5) n++
      return n
    }
    for (const side of [-SIDE, SIDE]) {
      const middle = sides(across(await shoot({ ...sheeted(painted), eye: eyeAt(side, false) }), false), far, near)
      const out = sides(across(await shoot({ ...sheeted(painted, 2), eye: eyeAt(side, false) }), false), far, near)
      expect(errors).toEqual([])
      const { from, to } = frame(side, false)
      const rigid = FROM * PX - (side * FOCAL) / NEAR
      expect(Math.abs(begins(out) - rigid)).toBeLessThanOrEqual(1)
      expect(borders(out, from, to)).toBe(1)
      const at = Math.round(begins(out))
      for (let x = from; x < to; x++) if (Math.abs(x - at) > 2) expect(Math.abs(out[x]! - (x < at ? 0 : 1))).toBeLessThanOrEqual(0.02)
      // That this has teeth: cut on the middle, the paint beyond it stays on the far ground, and where the gap opens (the eye
      // left of the picture's) it stands there as a strip of the near ground's colour of its own.
      if (side < 0) expect(borders(middle, from, to)).toBe(3)
    }
    // From the picture's own eye the painting comes back wherever the cut lies: on the middle, with the near ground's paint beyond
    // it, or moved out to where that paint begins.
    const off = (got: number[]): number => {
      let largest = 0
      for (let i = 0; i < got.length; i += 4) for (let c = 0; c < 3; c++) largest = Math.max(largest, Math.abs(got[i + c]! - even[i + c]!) / Math.max(Math.abs(far[c]! - near[c]!), 1e-6))
      return largest
    }
    const offOut = off(await shoot(sheeted(painted, 2)))
    const offMiddle = off(await shoot(sheeted(painted)))
    expect(offOut).toBeLessThanOrEqual(0.004)
    expect(offMiddle).toBeLessThanOrEqual(0.004)
  }, 120000)

  it('a crest cut in a box of the layer is the sheets inside the box and the mesh as it was away from it', async () => {
    const boxed = sheeted(base, 0, UPPER)
    // A pixel row of the picture, counted as the map's rows are, from the top.
    const line = (pixels: number[], texelRow: number, part: number): number[] => pixels.slice((HEIGHT - 1 - (texelRow * PX + part)) * WIDTH * 4, (HEIGHT - (texelRow * PX + part)) * WIDTH * 4)
    const apart = (a: number[], b: number[]): number => a.reduce((m, v, i) => Math.max(m, Math.abs(v - b[i]!)), 0)
    for (const side of [-SIDE, SIDE]) {
      const plain = await shoot({ ...base, eye: eyeAt(side, false) })
      const whole = await shoot({ ...sheeted(base), eye: eyeAt(side, false) })
      const got = await shoot({ ...boxed, eye: eyeAt(side, false) })
      expect(errors).toEqual([])
      let teeth = 0
      for (const part of [0, 1, 2, 3]) {
        // Two cells into the box the picture is that of the layer cut everywhere.
        for (let texelRow = 2; texelRow <= 13; texelRow++) {
          expect(apart(line(got, texelRow, part), line(whole, texelRow, part))).toBeLessThanOrEqual(1e-4)
          teeth = Math.max(teeth, apart(line(plain, texelRow, part), line(whole, texelRow, part)))
        }
        // Beyond the box, from the second cell on (the first touches the last row of the ramp), the picture is that of the layer
        // not cut at all: the far sheet goes under the near side beside the ramp, and beyond its end it only comes up to the ground
        // under the mesh's own cells, where an eye to the side sees nothing of it.
        for (let texelRow = 32; texelRow <= 46; texelRow++) expect(apart(line(got, texelRow, part), line(plain, texelRow, part))).toBeLessThanOrEqual(1e-4)
      }
      // That this has teeth: the two pictures it is held against are not one.
      expect(teeth).toBeGreaterThan(0.2)
    }
  }, 120000)

  it('where a cut crest ends with a step left the sheets close onto the mesh: no eye sees through the layer there', async () => {
    // The crest cut everywhere and in a part of the layer alone, on the step's middle and moved out. The eye moves across the crest,
    // along it and both at once, twice as far as in the tests above. Inside the frame no pixel holds the cleared colour.
    const cuts = [sheeted(base), sheeted(base, 0, UPPER), sheeted(base, 2, UPPER), sheeted(base, 0, LOWER), sheeted(base, 0, MIDDLE), sheeted(base, 2, MIDDLE)]
    const WIDE = 2 * SIDE
    for (const side of [[-WIDE, 0], [WIDE, 0], [0, -WIDE], [0, WIDE], [-WIDE, WIDE], [WIDE, -WIDE], [-WIDE, -WIDE], [WIDE, WIDE]]) {
      const eye = [side[0]!, side[1]!, 0]
      const inside = frameOf(side)
      expect((inside[2]! - inside[0]!) * (inside[3]! - inside[1]!)).toBeGreaterThan(WIDTH * HEIGHT * 0.4)
      const plain = await shoot({ ...base, eye })
      // That the count has teeth: over the frame of the eye at rest the layer's rim has moved in, and the cleared colour is counted.
      expect(open(plain, frameOf([0, 0]))).toBeGreaterThan(0)
      expect(open(plain, inside)).toBe(0)
      // Measured with the sheets left on their own distances where they end: from the eye at (0, 1) 214 pixels open with the upper
      // half cut and 183 with the middle third, from (-1, 1) 958 and 683; moved out 57, 53, 708 and 554.
      // Measured with the sheets at the render order of the layer's own mesh, where the renderer draws them before it from some
      // eyes and the soft edge of their paint shuts the mesh out behind it: from (1, 1) 3 pixels open with the upper half, 13 with
      // it moved out and 7 with the middle third; from (1, -1) 11 with the lower half; from (-1, 0) 5 with the upper half.
      for (const cut of cuts) expect(open(await shoot({ ...cut, eye }), inside)).toBe(0)
      expect(errors).toEqual([])
    }
    // Nearer the picture's own eye, both ways at once. Measured with the sheets on their own distances at their end: 280 pixels
    // open from (-0.5, 0.5) with the upper half and 183 from there with the middle third moved out.
    for (const side of [[-SIDE, SIDE], [SIDE, -SIDE], [-SIDE, -SIDE], [SIDE, SIDE]]) {
      const eye = [side[0]!, side[1]!, 0]
      for (const cut of [cuts[1]!, cuts[5]!]) expect(open(await shoot({ ...cut, eye }), frameOf(side))).toBe(0)
      expect(errors).toEqual([])
    }
  }, 300000)

  it('an eye that looks in under the near ground further than the number under reckons with sees the far sheet come up to the ground, never past it', async () => {
    // Under half a cell: the far sheet lies under the near ground in the cells of the step alone, to texel 40. From an eye 1.5 to
    // the far side the two grounds stand 15 texels apart and from 2 nearly 20, and the cut is at 28.5: the eye looks past texel 40.
    // In the ring of cells round the far sheet it comes up to the mesh's own ground, so the eye sees the far ground's fill there.
    const rest = await shoot({ ...base, eye: [0, 0, 0] })
    const far = rest.slice(0, 4)
    const near = rest.slice((WIDTH - 1) * 4, WIDTH * 4)
    for (const side of [-3 * SIDE, -4 * SIDE]) {
      const inside = frameOf([side, 0])
      expect(inside[2]! - inside[0]!).toBeGreaterThan(WIDTH * 0.4)
      // Measured without the ring, the far sheet ending at the far distance in the open: from 1.5 to the side 1981 pixels open with
      // the crest cut everywhere, 1130 with the upper half and 1155 with the lower; from 2 to the side 4932, 2820 and 2845.
      const whole = await shoot({ ...sheeted(base, 0, undefined, 0.5), eye: [side, 0, 0] })
      expect(open(whole, inside)).toBe(0)
      for (const boxes of [UPPER, LOWER]) expect(open(await shoot({ ...sheeted(base, 0, boxes, 0.5), eye: [side, 0, 0] }), inside)).toBe(0)
      expect(errors).toEqual([])
      // The row through the middle: the far ground's colour up to the near ground's border, which stands where a point at the near
      // distance does, and the near ground's from there.
      const b = row(whole, HEIGHT / 2, far, near)
      const rigid = BORDER * PX - (side * FOCAL) / NEAR
      expect(rigid).toBeLessThan(inside[2]! - 8)
      expect(Math.abs(begins(b) - rigid)).toBeLessThanOrEqual(1)
      const at = Math.round(begins(b))
      for (let x = inside[0]!; x < inside[2]!; x++) if (Math.abs(x - at) > 2) expect(Math.abs(b[x]! - (x < at ? 0 : 1))).toBeLessThanOrEqual(0.02)
    }
  }, 180000)

  it('a step whose near side is no ground is a rim: it rides with the far side and nothing is drawn beyond it', async () => {
    const ground = (await shoot({ ...base, dist: base.dist.map(() => FAR) })).slice(0, 4)
    for (const [flat, matte] of [[false, false], [true, false], [false, true], [true, true]] as [boolean, boolean][]) {
      // The near side is the map's fill outside the matte: the far ground's colour, with no alpha.
      const drawn: Shot = { ...(flat ? lying : base), near: [base.far[0]!, base.far[1]!, base.far[2]!, 0] }
      const rimmed = matte ? matted(drawn) : drawn
      const n = flat ? HEIGHT : WIDTH
      const edge = (flat ? BORDERY : BORDER) * PX
      // From the picture's own eye: the layer as it is painted, its rim soft over a texel.
      const painting = cover(across(await shoot({ ...rimmed, dist: rimmed.dist.map(() => FAR) }), flat), ground)
      const own = cover(across(await shoot(sheeted(rimmed)), flat), ground)
      expect(errors).toEqual([])
      expect(Math.abs(ends(painting, 1) - edge)).toBeLessThanOrEqual(0.5)
      for (let k = 0; k < n; k++) expect(Math.abs(own[k]! - painting[k]!)).toBeLessThanOrEqual(0.02)
      for (const side of [-SIDE, SIDE]) {
        const c = cover(across(await shoot({ ...sheeted(rimmed), eye: eyeAt(side, flat) }), flat), ground)
        expect(errors).toEqual([])
        const { from } = frame(side, flat)
        // Rigid with the far ground: the rim moves as a point at the far distance does, and not as one at the near distance.
        const rigid = edge - (side * FOCAL) / FAR
        expect(Math.abs(ends(c, from) - rigid)).toBeLessThanOrEqual(1)
        for (let k = from; k < n; k++) {
          if (Math.abs(k + 0.5 - rigid) <= 3) continue
          expect(Math.abs(c[k]! - (k + 0.5 < rigid ? 1 : 0))).toBeLessThanOrEqual(0.02)
        }
      }
    }
  }, 180000)

  it('a near ground before no ground draws its silhouette on its own distance and puts nothing behind it', async () => {
    const even = await shoot({ ...base, dist: base.dist.map(() => FAR) })
    const ground = even.slice((WIDTH - 1) * 4, WIDTH * 4)
    for (const [flat, matte] of [[false, false], [true, false], [false, true], [true, true]] as [boolean, boolean][]) {
      // The far side is no ground: the near ground's colour, with no alpha.
      const drawn: Shot = { ...(flat ? lying : base), far: [base.near[0]!, base.near[1]!, base.near[2]!, 0] }
      const alone = matte ? matted(drawn) : drawn
      const n = flat ? HEIGHT : WIDTH
      const edge = (flat ? BORDERY : BORDER) * PX
      const painting = cover(across(await shoot({ ...alone, dist: alone.dist.map(() => FAR) }), flat), ground)
      const own = cover(across(await shoot(sheeted(alone)), flat), ground)
      expect(errors).toEqual([])
      expect(Math.abs(begins(painting) - edge)).toBeLessThanOrEqual(0.5)
      for (let k = 0; k < n; k++) expect(Math.abs(own[k]! - painting[k]!)).toBeLessThanOrEqual(0.02)
      for (const side of [-SIDE, SIDE]) {
        const c = cover(across(await shoot({ ...sheeted(alone), eye: eyeAt(side, flat) }), flat), ground)
        expect(errors).toEqual([])
        const { to } = frame(side, flat)
        const rigid = edge - (side * FOCAL) / NEAR
        expect(Math.abs(begins(c) - rigid)).toBeLessThanOrEqual(1)
        for (let k = 0; k < to; k++) {
          if (Math.abs(k + 0.5 - rigid) <= 3) continue
          expect(Math.abs(c[k]! - (k + 0.5 < rigid ? 0 : 1))).toBeLessThanOrEqual(0.02)
        }
      }
    }
  }, 180000)

  it('under the air law with its light by height each sheet wears the air of its own ground, up to the cut', async () => {
    // The air of a ball of 50 under the picture's eye, which stands half a unit over it, with the light's share by height at three
    // knots (ReliefMotion.airLaw): a layer takes that share at its vertices, and the sheets take it with the layer's own vertex
    // shader. The eye stands to the far side and up, so the gap is open and the paths through the air have changed, the long ones
    // to the far ground more than the short ones to the near ground. Held against the far ground alone and the near ground
    // alone, each even, from the same eye: left of the near ground's cut the picture is the far ground in the far ground's air (the
    // mesh, the far sheet and its fill alike), and from the cut on it is the near ground in its own.
    const law = { light: [0.31, 0.52, 0.08], density: 4, scaleHeight: 0.04, radius: 50, eyeHeight: 0.5, knots: [[-1, 0.3], [0.5, 0.7], [1.5, 1]] }
    const side = [-SIDE, 2 * SIDE]
    const eye = [side[0]!, side[1]!, 0]
    const lawful = (o: Shot): Shot => ({ ...o, eye, motion: { ...o.motion, airLaw: law } })
    const cut = await shoot(lawful(crested))
    expect(errors).toEqual([])
    const evenFar = await shoot(lawful({ ...base, border: W, dist: base.dist.map(() => FAR) }))
    const evenNear = await shoot(lawful({ ...base, dist: base.dist.map(() => NEAR) }))
    // Each ground's paint on the other's distance, and the sheets without the law: what the picture is not.
    const farNearer = await shoot(lawful({ ...base, border: W, dist: base.dist.map(() => NEAR) }))
    const nearFarther = await shoot(lawful({ ...base, border: 0, dist: base.dist.map(() => FAR) }))
    const bare = await shoot({ ...crested, eye })
    expect(errors).toEqual([])
    const apart = (a: number[], b: number[], x: number, y: number): number => {
      const i = (y * WIDTH + x) * 4
      return Math.max(Math.abs(a[i]! - b[i]!), Math.abs(a[i + 1]! - b[i + 1]!), Math.abs(a[i + 2]! - b[i + 2]!))
    }
    const TOL = 0.002
    const [x0, y0, x1, y1] = frameOf(side) as [number, number, number, number]
    expect((x1 - x0) * (y1 - y0)).toBeGreaterThan(WIDTH * HEIGHT * 0.4)
    const rigid = BORDER * PX - 2 - (side[0]! * FOCAL) / NEAR
    for (let y = y0; y < y1; y++) {
      // 0 the far ground in its air, 1 the near ground in its air, -1 neither.
      const kinds: number[] = []
      for (let x = x0; x < x1; x++) kinds.push(apart(cut, evenFar, x, y) <= TOL ? 0 : apart(cut, evenNear, x, y) <= TOL ? 1 : -1)
      // The near ground begins where its cut stands on the near distance (half a texel before the paint's border), and from
      // there on every pixel is the near ground's.
      const first = kinds.indexOf(1)
      expect(Math.abs(x0 + first + 0.5 - rigid)).toBeLessThanOrEqual(1.5)
      for (let k = first; k < kinds.length; k++) expect(kinds[k]).toBe(1)
      // Before it every pixel is the far ground's but the one the cut is soft over and one where the far sheet's own paint ends:
      // the painted border lies half a texel beyond the middle of the step here, and a faint rest of it shows there (measured
      // 0.023 at the most), with the law as without.
      let other = 0
      for (let k = 0; k < first; k++) {
        if (kinds[k] === 0) continue
        other++
        if (k < first - 2) expect(apart(cut, evenFar, x0 + k, y)).toBeLessThanOrEqual(0.03)
      }
      expect(other).toBeLessThanOrEqual(3)
      // That this has teeth, in the gap and on the near sheet: the far ground's paint on the near distance is another colour
      // there (measured 0.030 at the least), the near ground's on the far distance too (0.053), and so are the sheets without
      // the law (0.045 and 0.038).
      const gap = x0 + first - 6
      const on = x0 + first + 8
      expect(apart(evenFar, farNearer, gap, y)).toBeGreaterThan(10 * TOL)
      expect(apart(evenNear, nearFarther, on, y)).toBeGreaterThan(10 * TOL)
      expect(apart(cut, bare, gap, y)).toBeGreaterThan(10 * TOL)
      expect(apart(cut, bare, on, y)).toBeGreaterThan(10 * TOL)
    }
  }, 120000)
})
