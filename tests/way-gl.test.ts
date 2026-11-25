import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium, type Browser, type Page } from 'playwright-core'
import { build } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { CHROME, CHROME_FLAGS } from '../tools/lib/browser'
import { sharpCount } from '../src/core/motion'
import { gradUniform, setSamples } from '../src/diagnostics/diag'

// The footprint of a lookup by the way of its own point in a WebGL2 browser (gradAt of GRAD_GLSL in src/diagnostics/diag.ts): the pixels.
// A plane in front of a lens is drawn with a shader that writes gradAt(vView) and vView itself as floats. Each pixel that is read back is
// held against the law of the engine (sharpCount and setSamples) at the way the two matrices give that pixel's own point. The numbers that
// feed the shader are tests/way.test.ts.

const ROOT = resolve(__dirname, '..')
const at = (path: string): string => JSON.stringify(resolve(ROOT, path))

const PAGE = `
import * as THREE from 'three'
import { GRAD_GLSL, gradUniform, gradUniforms, setWay } from ${at('src/diagnostics/diag.ts')}

const renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas') })
const material = new THREE.ShaderMaterial({
  glslVersion: THREE.GLSL3,
  uniforms: { ...gradUniforms },
  vertexShader: 'out vec3 vView;\\nvoid main() {\\n  vec4 mv = modelViewMatrix * vec4(position, 1.0);\\n  vView = mv.xyz;\\n  gl_Position = projectionMatrix * mv;\\n}',
  fragmentShader: 'precision highp float;\\nin vec3 vView;\\nout vec4 outColor;\\n' + GRAD_GLSL + '\\nvoid main() {\\n  outColor = vec4(gradAt(vView), vView);\\n}',
})
const mesh = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), material)
const scene = new THREE.Scene()
scene.add(mesh)

function shot(o) {
  gradUniform.value = o.grad
  setWay(o.way, o.samples, o.floor, o.soft)
  const cam = new THREE.PerspectiveCamera(o.vfov, o.width / o.height, 0.1, 100)
  cam.quaternion.fromArray(o.turn)
  cam.updateMatrixWorld(true)
  mesh.position.fromArray(o.plane)
  mesh.quaternion.fromArray(o.tilt)
  mesh.updateMatrixWorld(true)
  const target = new THREE.WebGLRenderTarget(o.width, o.height, { type: THREE.FloatType })
  renderer.setRenderTarget(target)
  renderer.setClearColor(new THREE.Color(0, 0, 0), 0)
  renderer.render(scene, cam)
  const out = new Float32Array(o.width * o.height * 4)
  renderer.readRenderTargetPixels(target, 0, 0, o.width, o.height, out)
  renderer.setRenderTarget(null)
  target.dispose()
  setWay(null)
  return Array.from(out)
}

window.way = { shot }
`

interface Shot { grad: number; way: { cover: number; open: number[]; close: number[] } | null; samples: number; floor: number; soft: number; vfov: number; width: number; height: number; turn: number[]; plane: number[]; tilt: number[] }

const W = 48
const H = 27
const FLOOR = 0.5
const RAD = Math.PI / 180
// A lens that looks down -z turned a little about y, and a plane in front of it, tilted, that fills the frame.
const base: Shot = { grad: 0.8125, way: null, samples: 24, floor: FLOOR, soft: 0, vfov: 40, width: W, height: H, turn: [0, Math.sin(0.1), 0, Math.cos(0.1)], plane: [1.2, 0.1, -5.8], tilt: [Math.sin(0.15), 0, 0, Math.cos(0.15)] }

// (x px, y px, unused, 1) times the distance in front of the lens, for a lens that stands off by (dx, dy, dz) from the sample's and sees
// 540 / tan(vfov / 2) px to the unit of tangent: the form of wayMatrix, column by column.
function lens(dx: number, dy: number, dz: number, vfov = 40): number[] {
  const k = 540 / Math.tan((vfov * RAD) / 2)
  return [k, 0, 0, 0, 0, k, 0, 0, 0, 0, 1, -1, -k * dx, -k * dy, -dz, dz]
}
function pxOf(m: number[], v: number[]): [number, number] | null {
  const row = (i: number): number => m[i]! * v[0]! + m[i + 4]! * v[1]! + m[i + 8]! * v[2]! + m[i + 12]!
  const w = row(3)
  return w > 1e-9 ? [row(0) / w, row(1) / w] : null
}
const footprint = (count: number, soft: number): number => {
  setSamples(count, FLOOR, soft)
  return gradUniform.value
}

describe('gradAt in a browser', () => {
  let browser: Browser
  let page: Page
  const errors: string[] = []
  const shoot = (o: Shot): Promise<number[]> => page.evaluate((x) => (window as unknown as { way: { shot: (o: unknown) => number[] } }).way.shot(x), o)
  // Every pixel of a shot against the law at its own point. Returns the least and the most footprint that was read.
  const held = (o: Shot, pixels: number[]): { least: number; most: number; drawn: number } => {
    let least = Infinity
    let most = -Infinity
    let drawn = 0
    for (let i = 0; i < W * H; i++) {
      const view = pixels.slice(i * 4 + 1, i * 4 + 4)
      if (view[2] === 0) continue
      drawn++
      const got = pixels[i * 4]!
      const a = pxOf(o.way!.open, view)
      const b = pxOf(o.way!.close, view)
      const way = a && b ? Math.hypot(a[0] - b[0], a[1] - b[1]) : Infinity
      const want = footprint(sharpCount({ samples: o.samples, seen: way }, o.way!.cover), o.soft)
      expect(Math.abs(got - want), i + ' way ' + way).toBeLessThan(2e-4)
      least = Math.min(least, got)
      most = Math.max(most, got)
    }
    return { least, most, drawn }
  }

  beforeAll(async () => {
    const dir = resolve(ROOT, 'out/work/way-test')
    mkdirSync(dir, { recursive: true })
    const entry = resolve(dir, 'page.js')
    writeFileSync(entry, PAGE)
    const built = await build({
      root: ROOT, configFile: false, logLevel: 'silent',
      build: { write: false, minify: false, target: 'es2022', lib: { entry, formats: ['iife'], name: 'wayPage', fileName: 'way-page' } },
    })
    const output = (Array.isArray(built) ? built[0]! : built) as { output: { type: string; code?: string }[] }
    const code = output.output.find((x) => x.type === 'chunk')!.code!
    browser = await chromium.launch({ executablePath: CHROME, headless: true, args: CHROME_FLAGS })
    page = await browser.newPage()
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    await page.route('http://way.test/**', (route) => {
      const url = route.request().url()
      if (url.endsWith('/page.js')) return route.fulfill({ status: 200, contentType: 'text/javascript', body: code })
      if (url === 'http://way.test/') return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><script src="./page.js"></script>' })
      return route.fulfill({ status: 404, body: '' })
    })
    await page.goto('http://way.test/')
    await page.waitForFunction(() => 'way' in window, undefined, { timeout: 60000 })
    expect(errors).toEqual([])
  }, 180000)

  afterAll(async () => {
    await browser?.close()
    setSamples(1, FLOOR)
  })

  it('is uGrad itself, to the bit, in every pixel where the way is off', async () => {
    for (const grad of [1, 0.5, 0.8125, 1 / Math.sqrt(3)]) {
      for (const off of [{ way: null }, { way: { cover: 2, open: lens(0, 0, 0), close: lens(0.2, 0, 0) }, samples: 1 }, { way: { cover: 0, open: lens(0, 0, 0), close: lens(0.2, 0, 0) } }]) {
        const pixels = await shoot({ ...base, grad, ...off })
        let drawn = 0
        for (let i = 0; i < W * H; i++) {
          if (pixels[i * 4 + 3] === 0) continue
          drawn++
          expect(pixels[i * 4]).toBe(Math.fround(grad))
        }
        expect(drawn).toBe(W * H)
      }
    }
    expect(errors).toEqual([])
  })
  it('gives a picture that stands still the count of the frame over the cover: the half from eight samples on at a cover of 2', async () => {
    const still = { cover: 2, open: lens(0, 0, 0), close: lens(0, 0, 0) }
    for (const [samples, want] of [[16, 0.5], [24, 0.5], [64, 0.5], [8, 0.5], [4, 1 / Math.sqrt(2)], [2, 1]] as const) {
      const pixels = await shoot({ ...base, way: still, samples })
      for (let i = 0; i < W * H; i++) expect(Math.abs(pixels[i * 4]! - want)).toBeLessThan(1e-6)
    }
    // Under a pixel of way a point counts as still.
    const slow = await shoot({ ...base, way: { cover: 2, open: lens(0, 0, 0), close: lens(0.002, 0, 0) } })
    for (let i = 0; i < W * H; i++) expect(slow[i * 4]).toBe(0.5)
  })
  it('follows the way of each pixel own point: a lens that slides, one that flies in, one that zooms, at several counts and covers', async () => {
    const moves: [string, number[], number[]][] = [
      ['slide', lens(-0.02, 0, 0), lens(0.02, 0, 0)],
      ['fly in', lens(0, 0, 0.12), lens(0, 0, -0.12)],
      ['zoom', lens(0, 0, 0, 41), lens(0, 0, 0, 39)],
      ['both', lens(-0.01, 0.004, 0.1), lens(0.012, -0.003, -0.1)],
    ]
    for (const [name, open, close] of moves) {
      for (const [samples, cover] of [[24, 2], [64, 2], [16, 1], [128, 4], [24, 0.5]] as const) {
        const o = { ...base, way: { cover, open, close }, samples }
        const r = held(o, await shoot(o))
        expect(r.drawn, name).toBe(W * H)
        expect(r.least, name).toBeGreaterThanOrEqual(FLOOR)
        expect(r.most, name).toBeLessThanOrEqual(1)
      }
    }
    // A lens that flies in: the middle stands still and is read at the half, the rim runs and is read at the pixel.
    const o = { ...base, turn: [0, 0, 0, 1], plane: [0, 0, -5.8], tilt: [0, 0, 0, 1], way: { cover: 2, open: lens(0, 0, 0.12), close: lens(0, 0, -0.12) } }
    const pixels = await shoot(o)
    const r = held(o, pixels)
    expect(pixels[(Math.floor(H / 2) * W + Math.floor(W / 2)) * 4]).toBe(0.5)
    expect(pixels[0]).toBe(1)
    expect(r.least).toBe(0.5)
    expect(r.most).toBe(1)
  })
  it('takes the soft share and the floor as setSamples takes them', async () => {
    const way = { cover: 2, open: lens(-0.01, 0.004, 0.1), close: lens(0.012, -0.003, -0.1) }
    for (const soft of [0, 0.25, 1]) {
      const o = { ...base, way, soft }
      held(o, await shoot(o))
    }
    const all = await shoot({ ...base, way, soft: 1 })
    for (let i = 0; i < W * H; i++) expect(all[i * 4]).toBe(1)
  })
  it('counts a point that is behind the lens at one end of the shutter as fastest', async () => {
    const o = { ...base, way: { cover: 2, open: lens(0, 0, 0), close: lens(0, 0, -20) }, samples: 64 }
    const pixels = await shoot(o)
    for (let i = 0; i < W * H; i++) expect(pixels[i * 4]).toBe(1)
    expect(errors).toEqual([])
  })
})
