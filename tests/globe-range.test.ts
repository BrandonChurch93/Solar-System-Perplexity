import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium, type Browser, type Page } from 'playwright-core'
import { build } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { DIAG_GLSL, DIAG_VIEWS, RANGE_LOW, RANGE_OCTAVES, isRaw, rangeOf, setDiag } from '../src/diagnostics/diag'
import { CHROME, CHROME_FLAGS } from '../tools/lib/browser'
import { RANGE_BRANCH as BRANCH, RANGE_NUMBERS as NUMBERS, frozen } from './globe-frozen'

const ROOT = resolve(__dirname, '..')
const at = (path: string): string => JSON.stringify(resolve(ROOT, path))
const TOP = 16777214


function packed(d: number): [number, number, number] {
  const n = 1 + Math.floor(Math.min(Math.max((Math.log2(Math.max(d, 1e-30)) - RANGE_LOW) / RANGE_OCTAVES, 0), 1) * TOP)
  return [n >> 16, (n >> 8) & 255, n & 255]
}

describe('the range view', () => {
  it('is one more raw view and leaves the text of every other view as it was', () => {
    expect(DIAG_VIEWS).toEqual(['beauty', 'ungraded', 'nograin', 'texels', 'layers', 'depth', 'flow', 'range'])
    expect(isRaw('range')).toBe(true)
    expect(setDiag('range')).toBe(6)
    expect(setDiag('depth')).toBe(4)
    expect(setDiag('beauty')).toBe(0)
    expect(DIAG_GLSL.split(BRANCH).length - 1).toBe(1)
    expect(DIAG_GLSL.split(NUMBERS).length - 1).toBe(1)
    const before = frozen(DIAG_GLSL)
    expect(createHash('sha256').update(before).digest('hex')).toBe('3612ad39e16854bc7dbf37914d235b37731b13c5673dc61a815d8b563935ead8')
    expect(DIAG_GLSL.indexOf(BRANCH)).toBeGreaterThan(DIAG_GLSL.indexOf('if (uDiag == 5)'))
    expect(DIAG_GLSL.endsWith(BRANCH + '  return beauty;\n}')).toBe(true)
  })

  it('reads a packed range back within one step of 1.4 millionths of the range', () => {
    expect(rangeOf(0, 0, 0)).toBeNull()
    expect(rangeOf(0, 0, 1)).toBe(2 ** RANGE_LOW)
    expect(rangeOf(255, 255, 255)).toBe(2 ** (RANGE_LOW + RANGE_OCTAVES))
    const step = 2 ** (RANGE_OCTAVES / TOP) - 1
    expect(step).toBeLessThan(1.4e-6)
    let last = 0
    for (let e = -19.5; e < 12; e += 0.37) {
      const d = 2 ** e
      const back = rangeOf(...packed(d))!
      expect(back).toBeGreaterThan(last)
      expect(back).toBeLessThanOrEqual(d)
      expect(d / back - 1).toBeLessThan(step * 1.000001)
      last = back
    }
    expect(rangeOf(...packed(0))).toBe(2 ** RANGE_LOW)
    expect(rangeOf(...packed(1e9))).toBe(2 ** (RANGE_LOW + RANGE_OCTAVES))
    const two = rangeOf(packed(3.7)[0], packed(3.7)[1], 0)!
    expect(3.7 / two - 1).toBeLessThan(2 ** ((256 * RANGE_OCTAVES) / TOP) - 1)
  })
})

const MADE = `
import json, sys
import numpy as np
sys.path.insert(0, sys.argv[1])
import range as R

def record(p, q, turn, close):
    return {'camera': {'p': p, 'q': q, 'vfov': 50.0, 'width': 96, 'height': 54}, 'sky': {'q': q}, 'range': {'low': -20, 'octaves': 32, 'units': [1, close]},
            'bodies': [{'id': 'made', 'place': [0, 0, 0], 'turn': turn, 'scale': [1, 0.9, 1], 'axes': [0, 0, 0.0998334, 0.9950042]}]}

def drawn(rec, close):
    """The range picture of the flattened body as a layer in radii would write it on the left half and a close layer on the right half."""
    ray = R.rays(rec, (54, 96))
    p = np.array(rec['camera']['p'])
    rs, ps = R.shaped(rec, p + ray) - R.shaped(rec, p), R.shaped(rec, p)
    a, b = (rs * rs).sum(-1), (rs * ps).sum(-1)
    disc = b * b - a * (ps @ ps - 1)
    t = np.where(disc > 0, (-b - np.sqrt(np.maximum(disc, 0))) / a, np.nan)
    unit = np.where(np.arange(96)[None, :] < 48, 1.0, close) * np.ones((54, 96))
    n = np.where(np.isfinite(t), 1 + np.floor(np.clip((np.log2(np.maximum(t / unit, 1e-30)) + 20) / 32, 0, 1) * R.TOP), 0).astype(np.int64)
    return np.stack([n >> 16, (n >> 8) & 255, n & 255], axis=-1), t, p + ray * t[..., None]

close = 0.003
a = record([0.3, 0.2, 1.5], [-0.05, 0.1, 0.02, 0.9935], [0, 0, 0, 1], close)
b = record([0.5, 0.1, 2.4], [-0.02, 0.12, 0.0, 0.9926], [0, 0.0499792, 0, 0.9987503], close)
for r in (a, b):
    q = np.array(r['camera']['q']); r['camera']['q'] = list(q / np.linalg.norm(q)); r['sky']['q'] = r['camera']['q']
rgb, t, truth = drawn(a, close)
d = R.ranges(rgb, a)
x, which = R.points(d, a)
hit = np.isfinite(t)
px, py, far = R.carried(x, a, b)
rgb2, t2, truth2 = drawn(b, close)
x2, _ = R.points(R.ranges(rgb2, b), b)
gx, gy = np.rint(np.nan_to_num(px, nan=-1)).astype(int), np.rint(np.nan_to_num(py, nan=-1)).astype(int)
seen = hit & (gx >= 0) & (gx < 96) & (gy >= 0) & (gy < 54)
ys, xs = np.mgrid[0:54, 0:96]
sx, sy = R.sky(a, b, (54, 96))
tx, ty, _ = R.carried(truth, a, b)
json.dump({
    'surface': float(hit.mean()),
    'radii': float((which[hit & (xs < 48)] == 0).mean()), 'close': float((which[hit & (xs >= 48)] == 1).mean()), 'none': int((which[~hit] != -1).sum()),
    'point': float(np.abs(x - truth)[hit].max()),
    'rangeThere': float(np.nanmax(np.abs(far[seen] / np.linalg.norm(x2 - np.array(b['camera']['p']), axis=-1)[gy[seen], gx[seen]] - 1)[np.isfinite(t2[gy[seen], gx[seen]])])),
    'place': float(np.nanmax(np.hypot(px - tx, py - ty)[hit])),
    'moved': float(np.nanmedian(np.hypot(px - xs, py - ys)[hit])),
    'skyMoved': float(np.nanmedian(np.hypot(sx - xs, sy - ys))),
    'skyStill': float(np.nanmax(np.hypot(R.sky(a, a, (54, 96))[0] - xs, R.sky(a, a, (54, 96))[1] - ys))),
}, sys.stdout)
`

describe('the range picture as points of the body', () => {
  it('finds the unit of each layer, the point of each pixel, and its place in another frame of a turning, flattened body', () => {
    const n = JSON.parse(execFileSync('python3', ['-c', MADE, resolve(ROOT, 'tools/img')], { encoding: 'utf8' })) as Record<string, number>
    expect(n.surface).toBeGreaterThan(0.3)
    expect(n.radii).toBe(1)
    expect(n.close).toBe(1)
    expect(n.none).toBe(0)
    expect(n.point).toBeLessThan(5e-6)
    expect(n.place).toBeLessThan(1e-4)
    expect(n.rangeThere).toBeLessThan(0.05)
    expect(n.moved).toBeGreaterThan(5)
    expect(n.skyMoved).toBeGreaterThan(1)
    expect(n.skyStill).toBeLessThan(1e-9)
  })
})

const FORMED = `
import json, sys
import numpy as np
sys.path.insert(0, sys.argv[1])
import range as R

def matrix(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])

def record(p, q, turn, shape):
    q = list(np.array(q) / np.linalg.norm(q))
    body = {'id': 'made', 'place': [0.02, -0.01, 0.0], 'turn': turn, 'scale': [1, 1, 1], 'axes': [0, 0, 0, 1]}
    if shape is not None:
        body['shape'] = shape
    return {'camera': {'p': p, 'q': q, 'vfov': 50.0, 'width': 96, 'height': 54}, 'sky': {'q': q}, 'range': {'low': -20, 'octaves': 32, 'units': [1]}, 'bodies': [body]}

def picture(rec):
    ray = R.rays(rec, (54, 96))
    p = np.array(rec['camera']['p'])
    rs, ps = R.shaped(rec, p + ray) - R.shaped(rec, p), R.shaped(rec, p)
    a, b = (rs * rs).sum(-1), (rs * ps).sum(-1)
    disc = b * b - a * (ps @ ps - 1)
    t = np.where(disc > 0, (-b - np.sqrt(np.maximum(disc, 0))) / a, np.nan)
    n = np.where(np.isfinite(t), 1 + np.floor(np.clip((np.log2(np.maximum(t, 1e-30)) + 20) / 32, 0, 1) * R.TOP), 0).astype(np.int64)
    return np.stack([n >> 16, (n >> 8) & 255, n & 255], axis=-1), t

sa = [1.001, -0.001, 0.0, -0.001, 0.998, 0.0, 0.0, 0.0, 0.9994]
sb = [1.0043409, -0.0042483, 0.0, -0.0042483, 0.9907715, 0.0, 0.0, 0.0, 0.9975241]
ta, tb = [0.0199987, 0, 0, 0.9998], [0, 0.0499792, 0, 0.9987503]
a = record([0.1, 0.05, 1.08], [-0.05, 0.1, 0.02, 0.9935], ta, sa)
b = record([0.12, 0.06, 1.2], [-0.04, 0.11, 0.01, 0.9931], tb, sb)
rgb, t = picture(a)
hit = np.isfinite(t)
x, _ = R.points(R.ranges(rgb, a), a)
px, py, far = R.carried(x, a, b)
place = np.array([0.02, -0.01, 0.0])
A, B = np.array(sa).reshape(3, 3), np.array(sb).reshape(3, 3)
y = (x - place) @ np.linalg.inv(A).T @ matrix(ta) @ matrix(tb).T @ B.T + place
c = b['camera']
k = 54 / 2 / np.tan(np.radians(50.0) / 2)
r = (y - np.array(c['p'])) @ matrix(c['q'])
ex, ey = r[..., 0] / -r[..., 2] * k + 96 / 2 - 0.5, 54 / 2 - 0.5 - r[..., 1] / -r[..., 2] * k
plain_a = {**a, 'bodies': [{k2: v for k2, v in a['bodies'][0].items() if k2 != 'shape'}]}
plain_b = {**b, 'bodies': [{k2: v for k2, v in b['bodies'][0].items() if k2 != 'shape'}]}
qx, qy, qfar = R.carried(x, plain_a, plain_b)
gone = R.carried(x, plain_a, plain_a)
same = R.carried(x, {**a, 'bodies': [{**a['bodies'][0], 'shape': sa}]}, {**a, 'bodies': [{**a['bodies'][0], 'shape': sa}]})
json.dump({
    'surface': float(hit.mean()),
    'place': float(np.nanmax(np.hypot(px - ex, py - ey)[hit])),
    'far': float(np.nanmax(np.abs(far - np.linalg.norm(y - np.array(c['p']), axis=-1))[hit])),
    'onBody': float(np.nanmax(np.abs(np.linalg.norm(R.shaped(b, y), axis=-1) - 1)[hit])),
    'rigid': float(np.nanmedian(np.hypot(px - qx, py - qy)[hit])),
    'unit': float(np.nanmax(np.hypot(gone[0] - same[0], gone[1] - same[1])[hit])),
}, sys.stdout)
`

describe('the drawn shape of a body in the pose record', () => {
  it('carries a point through the shape of its own frame and into the shape of the other, and not at all where the record names none', () => {
    const n = JSON.parse(execFileSync('python3', ['-c', FORMED, resolve(ROOT, 'tools/img')], { encoding: 'utf8' })) as Record<string, number>
    expect(n.surface).toBeGreaterThan(0.3)
    expect(n.place).toBeLessThan(1e-9)
    expect(n.far).toBeLessThan(1e-12)
    expect(n.onBody).toBeLessThan(5e-6)
    expect(n.rigid).toBeGreaterThan(0.2)
    expect(n.unit).toBeLessThan(1e-9)
  })
})

const PAGE = `
import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, setDiag } from ${at('src/diagnostics/diag.ts')}

const W = 256
const renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas') })
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
const VERT = 'out vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'
const draw = new THREE.ShaderMaterial({
  glslVersion: THREE.GLSL3,
  uniforms: { uDiag: diagUniform, uSpan: { value: new THREE.Vector2() } },
  vertexShader: VERT,
  fragmentShader: 'precision highp float;\\n' + DIAG_GLSL + '\\nuniform vec2 uSpan; in vec2 vUv; out vec4 outColor; void main() { outColor = diagOut(vec4(0.25, 0.5, 0.75, 1.0), 0.0, 0.0, vec3(0.0), vec2(0.0), exp2(mix(uSpan.x, uSpan.y, vUv.x))); }',
})
const copy = new THREE.ShaderMaterial({
  glslVersion: THREE.GLSL3,
  uniforms: { uTex: { value: null } },
  vertexShader: VERT,
  fragmentShader: 'precision highp float; uniform sampler2D uTex; in vec2 vUv; out vec4 outColor; void main() { outColor = vec4(clamp(texture(uTex, vUv).rgb, 0.0, 1.0), 1.0); }',
})
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), draw)
const scene = new THREE.Scene()
scene.add(quad)

function row(view, from, to) {
  setDiag(view)
  draw.uniforms.uSpan.value.set(from, to)
  const half = new THREE.WebGLRenderTarget(W, 1, { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter })
  const bytes = new THREE.WebGLRenderTarget(W, 1, { depthBuffer: false })
  quad.material = draw
  renderer.setRenderTarget(half)
  renderer.render(scene, camera)
  copy.uniforms.uTex.value = half.texture
  quad.material = copy
  renderer.setRenderTarget(bytes)
  renderer.render(scene, camera)
  const out = new Uint8Array(W * 4)
  renderer.readRenderTargetPixels(bytes, 0, 0, W, 1, out)
  renderer.setRenderTarget(null)
  half.dispose()
  bytes.dispose()
  setDiag('beauty')
  return Array.from(out)
}

window.range = { row, width: W }
`

const have = existsSync(CHROME)

describe.skipIf(!have)('the range view in a WebGL2 browser', () => {
  let browser: Browser
  let page: Page
  const row = (view: string, from: number, to: number): Promise<number[]> => page.evaluate(([v, a, b]) => (window as unknown as { range: { row(v: string, a: number, b: number): number[] } }).range.row(v as string, a as number, b as number), [view, from, to] as const)

  beforeAll(async () => {
    const dir = resolve(ROOT, 'out/work/globe-test')
    mkdirSync(dir, { recursive: true })
    const entry = resolve(dir, 'range-page.js')
    writeFileSync(entry, PAGE)
    const built = await build({
      root: ROOT, configFile: false, logLevel: 'silent',
      build: { write: false, minify: false, target: 'es2022', lib: { entry, formats: ['iife'], name: 'rangePage', fileName: 'range-page' } },
    })
    const output = (Array.isArray(built) ? built[0]! : built) as { output: { type: string; code?: string }[] }
    const code = output.output.find((x) => x.type === 'chunk')!.code!
    browser = await chromium.launch({ executablePath: CHROME, headless: true, args: CHROME_FLAGS })
    page = await browser.newPage()
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    await page.route('http://range.test/**', (route) => {
      const url = route.request().url()
      if (url.endsWith('/page.js')) return route.fulfill({ status: 200, contentType: 'text/javascript', body: code })
      if (url === 'http://range.test/') return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><script src="./page.js"></script>' })
      return route.fulfill({ status: 404, body: '' })
    })
    await page.goto('http://range.test/')
    await page.waitForFunction(() => 'range' in window, undefined, { timeout: 60000 })
    expect(errors).toEqual([])
  }, 180000)

  afterAll(async () => {
    await browser?.close()
  })

  it('hands the range through a half float picture into 8 bit colour, to 4 millionths over 24 octaves', async () => {
    const W = 256
    for (const [from, to] of [[-12, 12], [-5, -4.99], [3, 3.0001]] as const) {
      const got = await row('range', from, to)
      let worst = 0
      let last = 0
      for (let i = 0; i < W; i++) {
        const want = 2 ** (from + ((i + 0.5) / W) * (to - from))
        const back = rangeOf(got[i * 4]!, got[i * 4 + 1]!, got[i * 4 + 2]!)!
        expect(got[i * 4 + 3]).toBe(255)
        expect(back).toBeGreaterThanOrEqual(last)
        worst = Math.max(worst, Math.abs(back / want - 1))
        last = back
      }
      expect(worst).toBeLessThan(4e-6)
    }
  }, 60000)

  it('leaves the beauty and the old depth view of the same draw as they are', async () => {
    const beauty = await row('beauty', -12, 12)
    for (let i = 0; i < 256; i++) expect(beauty.slice(i * 4, i * 4 + 4)).toEqual([64, 128, 191, 255])
    const depth = await row('depth', -12, 12)
    for (let i = 0; i < 256; i++) {
      const d = 2 ** (-12 + ((i + 0.5) / 256) * 24)
      const want = Math.min(Math.max(Math.log2(1 + d) / 14, 0), 1) * 255
      expect(Math.abs(depth[i * 4]! - want)).toBeLessThan(0.75)
      expect(depth[i * 4 + 1]).toBe(depth[i * 4])
    }
  }, 60000)
})
