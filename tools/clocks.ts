import { chromium } from 'playwright-core'
import { DIST, args, ensureBuild, formatId, loadConfig } from './lib/common'
import { CHROME, CHROME_FLAGS, serve } from './lib/browser'

// Counts, per shader program and uniform, how many distinct values a frame's samples set. A layer on a coarser clock than the sample shows up as a count below the sample count.

interface Track { program: string; verts: number; draws: number; views: number; first: number[]; last: number[] }
interface Clock { on: boolean; values: Record<string, Record<string, string[]>>; draws: Record<string, number>; hints: Record<string, string>; flat: Record<string, boolean>; tracks: Record<string, Track> }

function install(): void {
  const P = WebGL2RenderingContext.prototype
  const clock: Clock = { on: false, values: {}, draws: {}, hints: {}, flat: {}, tracks: {} }
  ;(window as unknown as { clock: Clock }).clock = clock
  const sources = new WeakMap<WebGLShader, string>()
  const names = new WeakMap<WebGLProgram, string>()
  const where = new WeakMap<WebGLUniformLocation, string>()
  let program: WebGLProgram | null = null
  let count = 0
  const shaderSource = P.shaderSource
  P.shaderSource = function (s, src) {
    sources.set(s, src)
    shaderSource.call(this, s, src)
  }
  const attachShader = P.attachShader
  P.attachShader = function (p, s) {
    if (!names.has(p)) names.set(p, 'p' + ++count)
    const src = sources.get(s) ?? ''
    if (this.getShaderParameter(s, this.SHADER_TYPE) === this.FRAGMENT_SHADER) {
      const own = [...src.matchAll(/uniform\s+\w+\s+(u[A-Z]\w+)/g)].map((m) => m[1]).slice(0, 6).join(' ')
      clock.hints[names.get(p)!] = own
    } else clock.flat[names.get(p)!] = !/modelViewMatrix|viewMatrix/.test(src.replace(/uniform[^;]*;/g, ''))
    attachShader.call(this, p, s)
  }
  const useProgram = P.useProgram
  P.useProgram = function (p) {
    program = p
    useProgram.call(this, p)
  }
  const getUniformLocation = P.getUniformLocation
  P.getUniformLocation = function (p, name) {
    const loc = getUniformLocation.call(this, p, name)
    if (loc) where.set(loc, name)
    return loc
  }
  const note = (loc: WebGLUniformLocation | null, value: string): void => {
    if (!clock.on || !loc || !program) return
    const p = names.get(program) ?? 'none'
    const u = where.get(loc) ?? 'unknown'
    const byName = (clock.values[p] ??= {})
    const list = (byName[u] ??= [])
    if (list.length < 400 && !list.includes(value)) list.push(value)
  }
  for (const key of Object.getOwnPropertyNames(P).filter((k) => /^uniform(\d[fi]v?|Matrix\dfv)$/.test(k))) {
    const original = (P as unknown as Record<string, (...a: unknown[]) => void>)[key]!
    ;(P as unknown as Record<string, unknown>)[key] = function (this: WebGL2RenderingContext, loc: WebGLUniformLocation | null, ...rest: unknown[]) {
      const v = key.startsWith('uniformMatrix') ? rest[1] : rest.length === 1 ? rest[0] : rest
      const name = loc ? where.get(loc) : undefined
      if (program && name && /^(projectionMatrix|modelViewMatrix|viewMatrix|modelMatrix)$/.test(name)) {
        const m = mats.get(program) ?? {}
        mats.set(program, m)
        m[name] = Float32Array.from(v as ArrayLike<number>)
      }
      note(loc, typeof v === 'number' ? String(v) : Array.from(v as ArrayLike<number>).join(','))
      original.call(this, loc, ...rest)
    }
  }
  const PROBES = 400
  const data = new WeakMap<WebGLBuffer, Float32Array>()
  const spots = new Map<WebGLVertexArrayObject | null, { buffer: WebGLBuffer; stride: number; offset: number }>()
  const ids = new Map<WebGLVertexArrayObject | null, number>()
  const mats = new WeakMap<WebGLProgram, Record<string, Float32Array>>()
  const seen = new Map<string, Set<string>>()
  let bound: WebGLBuffer | null = null
  let vao: WebGLVertexArrayObject | null = null
  const bindBuffer = P.bindBuffer
  P.bindBuffer = function (target, b) {
    if (target === this.ARRAY_BUFFER) bound = b
    bindBuffer.call(this, target, b)
  }
  const bufferData = P.bufferData as (...a: unknown[]) => void
  ;(P as unknown as Record<string, unknown>).bufferData = function (this: WebGL2RenderingContext, ...a: unknown[]) {
    if (a[0] === this.ARRAY_BUFFER && bound && a[1] instanceof Float32Array) data.set(bound, a[1])
    bufferData.apply(this, a)
  }
  const bindVertexArray = P.bindVertexArray
  P.bindVertexArray = function (v) {
    vao = v
    bindVertexArray.call(this, v)
  }
  const vertexAttribPointer = P.vertexAttribPointer
  P.vertexAttribPointer = function (index, size, type, normalized, stride, offset) {
    if (program && bound && size === 3 && type === this.FLOAT && index === this.getAttribLocation(program, 'position')) spots.set(vao, { buffer: bound, stride: stride ? stride / 4 : 3, offset: offset / 4 })
    vertexAttribPointer.call(this, index, size, type, normalized, stride, offset)
  }
  const mul = (a: ArrayLike<number>, b: ArrayLike<number>): number[] => {
    const o = new Array<number>(16).fill(0)
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r]! += a[k * 4 + r]! * b[c * 4 + k]!
    return o
  }
  const draw = (): void => {
    if (!clock.on || !program) return
    const p = names.get(program) ?? 'none'
    clock.draws[p] = (clock.draws[p] ?? 0) + 1
    const m = mats.get(program)
    const spot = spots.get(vao)
    const v = spot ? data.get(spot.buffer) : undefined
    if (!m || !m.projectionMatrix || !spot || !v) return
    const mv = m.modelViewMatrix ?? (m.viewMatrix && m.modelMatrix ? mul(m.viewMatrix, m.modelMatrix) : null)
    if (!mv) return
    if (!ids.has(vao)) ids.set(vao, ids.size)
    const key = p + '#' + ids.get(vao)
    const mvp = mul(m.projectionMatrix, mv)
    const count = Math.floor((v.length - spot.offset) / spot.stride)
    const step = Math.max(1, Math.floor(count / PROBES))
    const out: number[] = []
    for (let i = 0; i < count; i += step) {
      const x = v[spot.offset + i * spot.stride]!, y = v[spot.offset + i * spot.stride + 1]!, z = v[spot.offset + i * spot.stride + 2]!
      const w = mvp[3]! * x + mvp[7]! * y + mvp[11]! * z + mvp[15]!
      out.push((mvp[0]! * x + mvp[4]! * y + mvp[8]! * z + mvp[12]!) / w, (mvp[1]! * x + mvp[5]! * y + mvp[9]! * z + mvp[13]!) / w, w)
    }
    const views = seen.get(key) ?? new Set<string>()
    seen.set(key, views)
    views.add(Array.from(mv).join(','))
    const t = (clock.tracks[key] ??= { program: p, verts: count, draws: 0, views: 0, first: out, last: out })
    t.draws++
    t.views = views.size
    t.last = out
  }
  ;(clock as unknown as { reset: () => void }).reset = () => seen.clear()
  const drawArrays = P.drawArrays
  P.drawArrays = function (mode, first, n) {
    draw()
    drawArrays.call(this, mode, first, n)
  }
  const drawElements = P.drawElements
  P.drawElements = function (mode, n, type, offset) {
    draw()
    drawElements.call(this, mode, n, type, offset)
  }
}

const cfg = loadConfig()
const a = args()
const format = formatId(cfg, a.format)
const tier = a.tier ?? 'review'
const frames = (a.frames ?? a.frame ?? '2427').split(',').map(Number)
ensureBuild()
const { server, url } = await serve(DIST)
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: CHROME_FLAGS })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
page.on('pageerror', (e) => console.error('[page error]', e.message))
await page.addInitScript('globalThis.__name = (f) => f')
await page.addInitScript(install)
await page.goto(url + '?mode=capture&format=' + format + '&assets=' + (a.assets ?? 'full'))
await page.waitForFunction(() => 'showcase' in window, undefined, { timeout: 120000 })
for (const frame of frames) {
  const r = await page.evaluate(async ([f, t]) => {
    const w = window as unknown as { clock: Clock; showcase: { renderFrame(f: number, t: string): Promise<void> } }
    await w.showcase.renderFrame(f as number, 'draft')
    w.clock.values = {}
    w.clock.draws = {}
    w.clock.tracks = {}
    ;(w.clock as unknown as { reset: () => void }).reset()
    w.clock.on = true
    await w.showcase.renderFrame(f as number, t as string)
    w.clock.on = false
    return { values: w.clock.values, draws: w.clock.draws, hints: w.clock.hints, flat: w.clock.flat, tracks: w.clock.tracks }
  }, [frame, tier] as const)
  console.log('frame ' + frame + ' ' + tier)
  for (const [p, byName] of Object.entries(r.values)) {
    const draws = r.draws[p] ?? 0
    if (!draws) continue
    const counts = Object.entries(byName).map(([u, list]) => [u, list.length] as const).filter(([, n]) => n > 1).sort((x, y) => x[1] - y[1])
    console.log('  ' + p + ' [' + (r.hints[p] ?? '') + '] draws ' + draws + (r.flat[p] ? ' (no camera matrix in the vertex shader)' : '') + ': ' + counts.map(([u, n]) => u + ' ' + n).join(', '))
  }
  for (const [key, t] of Object.entries(r.tracks)) {
    const moved: number[] = []
    for (let i = 0; i + 2 < t.first.length; i += 3) {
      const wa = t.first[i + 2]!, wb = t.last[i + 2]!
      if (wa <= 0 || wb <= 0) continue
      const inside = (x: number, y: number): boolean => Math.abs(x) <= 1 && Math.abs(y) <= 1
      if (!inside(t.first[i]!, t.first[i + 1]!) && !inside(t.last[i]!, t.last[i + 1]!)) continue
      moved.push(Math.hypot((t.last[i]! - t.first[i]!) * 960, (t.last[i + 1]! - t.first[i + 1]!) * 540))
    }
    moved.sort((x, y) => x - y)
    const at = (q: number): string => (moved.length ? moved[Math.min(moved.length - 1, Math.floor(q * moved.length))]!.toFixed(1) : 'none')
    console.log('  motion ' + key + ' [' + (r.hints[t.program] ?? '') + '] verts ' + t.verts + ' draws ' + t.draws + ' views ' + t.views + ' on screen ' + moved.length + ': first to last sample px median ' + at(0.5) + ' p90 ' + at(0.9) + ' max ' + at(1))
  }
}
await browser.close()
server.close()
