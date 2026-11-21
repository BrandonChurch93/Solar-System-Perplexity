import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright-core'
import { DIST, WORK, args, ensureBuild, formatId, loadConfig, machineId } from './lib/common'
import { CHROME, CHROME_FLAGS, serve } from './lib/browser'

// Times every draw call of a frame. A pixel is read back after each call, so the time of a call is the time the software rasterizer needed for it.

interface Row { name: string; mode: number; count: number; ms: number; gap: number; target: string }
interface Perf { on: boolean; skip: string[]; rows: Row[]; uploads: number; uploadMs: number; last: number }

const RULES: [string, string][] = [
  ['uBandGrade', 'sky map'], ['aStar', 'star points'], ['uPatchScale', 'planet'], ['uCoreHeight', 'haze shell'], ['uLitMask', 'moon'], ['uValleyFlow', 'relief layer'], ['uWarmSide', 'relief air'],
  ['aSeed', 'dust'], ['uBillow', 'cover'], ['uFirst', 'accumulator'], ['uPrefilter', 'lens: bloom down'], ['uRadius', 'lens: bloom up'], ['uThreshold', 'lens: streak'], ['uBloomNorm', 'lens: final'],
]

function install([rules, edits]: [[string, string][], [string, string][]]): void {
  const P = WebGL2RenderingContext.prototype
  const perf: Perf = { on: false, skip: [], rows: [], uploads: 0, uploadMs: 0, last: 0 }
  ;(window as unknown as { perf: Perf }).perf = perf
  const sources = new WeakMap<WebGLShader, string>()
  const names = new WeakMap<WebGLProgram, string>()
  const parts = new WeakMap<WebGLProgram, string>()
  let program: WebGLProgram | null = null
  let fb: WebGLFramebuffer | null = null
  let unnamed = 0
  const px8 = new Uint8Array(4)
  const pxf = new Float32Array(4)
  const shaderSource = P.shaderSource
  P.shaderSource = function (s, src) {
    let text = src
    for (const [find, put] of edits) {
      if (!text.includes(find)) continue
      text = text.split(find).join(put)
      console.log('perf edit applied: ' + find.slice(0, 60))
    }
    sources.set(s, text)
    shaderSource.call(this, s, text)
  }
  const attachShader = P.attachShader
  P.attachShader = function (p, s) {
    const all = (parts.get(p) ?? '') + (sources.get(s) ?? '')
    parts.set(p, all)
    const rule = rules.find(([key]) => all.includes(key))
    const apron = all.includes('#define RELIEF_APRON') ? ' with apron' : ''
    names.set(p, rule ? rule[1] + apron : names.get(p) ?? 'program ' + ++unnamed)
    attachShader.call(this, p, s)
  }
  const useProgram = P.useProgram
  P.useProgram = function (p) {
    program = p
    useProgram.call(this, p)
  }
  const bindFramebuffer = P.bindFramebuffer
  P.bindFramebuffer = function (target, f) {
    if (target !== this.READ_FRAMEBUFFER) fb = f
    bindFramebuffer.call(this, target, f)
  }
  const sync = (gl: WebGL2RenderingContext): void => {
    if (fb) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, pxf)
    else gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px8)
  }
  const size = (gl: WebGL2RenderingContext): string => (fb ? '' : 'canvas ') + gl.getParameter(gl.VIEWPORT)[2] + 'x' + gl.getParameter(gl.VIEWPORT)[3]
  const timed = (gl: WebGL2RenderingContext, name: string, mode: number, count: number, call: () => void): void => {
    if (!perf.on) {
      call()
      return
    }
    const t0 = performance.now()
    if (!perf.skip.includes(name)) call()
    sync(gl)
    const t1 = performance.now()
    perf.rows.push({ name, mode, count, ms: t1 - t0, gap: perf.last ? t0 - perf.last : 0, target: size(gl) })
    perf.last = t1
  }
  const label = (): string => (program ? names.get(program) ?? 'unknown' : 'none')
  const drawArrays = P.drawArrays
  P.drawArrays = function (mode, first, count) {
    timed(this, label(), mode, count, () => drawArrays.call(this, mode, first, count))
  }
  const drawElements = P.drawElements
  P.drawElements = function (mode, count, type, offset) {
    timed(this, label(), mode, count, () => drawElements.call(this, mode, count, type, offset))
  }
  const clear = P.clear
  P.clear = function (mask) {
    timed(this, 'clear', 0, 0, () => clear.call(this, mask))
  }
  for (const key of ['texImage2D', 'texSubImage2D', 'texStorage2D', 'bufferData', 'bufferSubData', 'generateMipmap'] as const) {
    const original = P[key] as (...a: unknown[]) => void
    ;(P as unknown as Record<string, unknown>)[key] = function (this: WebGL2RenderingContext, ...a: unknown[]) {
      if (!perf.on) {
        original.apply(this, a)
        return
      }
      const t0 = performance.now()
      original.apply(this, a)
      sync(this)
      perf.uploads++
      perf.uploadMs += performance.now() - t0
      perf.last = performance.now()
    }
  }
}

const cfg = loadConfig()
const a = args()
const format = formatId(cfg, a.format)
const tier = a.tier ?? 'review'
const frames = (a.frames ?? a.frame ?? '2325,2580,2427,2726').split(',').map(Number)
const skip = a.skip ? a.skip.split(',') : []
const edits = a.edits ? JSON.parse(readFileSync(a.edits, 'utf8')) as [string, string][] : []
ensureBuild()

const { server, url } = await serve(DIST)
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: CHROME_FLAGS })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
page.on('pageerror', (e) => console.error('[page error]', e.message))
page.on('console', (m) => {
  if (m.type() === 'error' || m.text().startsWith('perf edit')) console.error('[page]', m.text())
})
await page.addInitScript('globalThis.__name = (f) => f')
await page.addInitScript(install, [RULES, edits] as [[string, string][], [string, string][]])
await page.goto(url + '?mode=capture&format=' + format + '&assets=full')
await page.waitForFunction(() => 'showcase' in window, undefined, { timeout: 120000 })

type Result = { plain: number; timed: number; png: number; rows: Row[]; uploads: number; uploadMs: number; coverage: number; image: string }
const out: Record<string, unknown> = { machine: machineId(), format, tier, skip, frames: {} }
const lines: string[] = []

for (const frame of frames) {
  const r = await page.evaluate(async ([f, t, s, k]) => {
    const w = window as unknown as { perf: Perf; showcase: { renderFrame(f: number, t: string): Promise<void>; png(): Promise<string>; sanity(): { coverage: number } } }
    await w.showcase.renderFrame(f as number, 'draft')
    let t0 = performance.now()
    await w.showcase.renderFrame(f as number, t as string)
    const plain = performance.now() - t0
    t0 = performance.now()
    await w.showcase.png()
    const png = performance.now() - t0
    w.perf.rows = []
    w.perf.uploads = 0
    w.perf.uploadMs = 0
    w.perf.last = 0
    w.perf.skip = s as string[]
    w.perf.on = true
    t0 = performance.now()
    await w.showcase.renderFrame(f as number, t as string)
    const timed = performance.now() - t0
    w.perf.on = false
    return { plain, timed, png, rows: w.perf.rows, uploads: w.perf.uploads, uploadMs: w.perf.uploadMs, coverage: w.showcase.sanity().coverage, image: k ? await w.showcase.png() : '' }
  }, [frame, tier, skip, a.png !== undefined] as const) as Result
  if (a.png) {
    const bytes = Buffer.from(r.image, 'base64')
    mkdirSync(a.png, { recursive: true })
    writeFileSync(join(a.png, 'f' + frame + '-' + tier + (a.tag ? '-' + a.tag : '') + '.png'), bytes)
    lines.push('', 'sha256 ' + frame + ' ' + createHash('sha256').update(bytes).digest('hex'))
  }
  const samples = r.rows.filter((x) => x.name === 'accumulator').length
  const sums = new Map<string, { ms: number; calls: number; count: number; target: string; perFrame: boolean }>()
  const seen = new Map<string, number>()
  let inSample = true
  let lensStart = r.rows.length
  for (let i = r.rows.length - 1; i >= 0; i--) {
    if (r.rows[i]!.name === 'accumulator') {
      lensStart = i + 1
      break
    }
  }
  let gap = 0
  r.rows.forEach((row, i) => {
    inSample = i < lensStart
    const n = (seen.get(row.name) ?? 0) + 1
    seen.set(row.name, n)
    const key = inSample ? row.name + ' #' + n : row.name + ' ' + row.target
    const e = sums.get(key) ?? { ms: 0, calls: 0, count: row.count, target: row.target, perFrame: !inSample }
    e.ms += row.ms
    e.calls++
    sums.set(key, e)
    gap += row.gap
    if (row.name === 'accumulator') seen.clear()
  })
  const perSample = [...sums.entries()].filter(([, e]) => !e.perFrame).map(([part, e]) => ({ part, seconds: e.ms / 1000 / samples, vertices: e.count }))
  const fixed = [...sums.entries()].filter(([, e]) => e.perFrame).map(([part, e]) => ({ part, seconds: e.ms / 1000 }))
  const sampleTotal = perSample.reduce((s, x) => s + x.seconds, 0)
  const fixedTotal = fixed.reduce((s, x) => s + x.seconds, 0)
  lines.push('', 'frame ' + frame + ' ' + tier + ' ' + samples + ' samples: ' + (r.plain / 1000).toFixed(2) + ' s untimed, ' + (r.timed / 1000).toFixed(2) + ' s timed, png ' + (r.png / 1000).toFixed(2) + ' s, uploads ' + r.uploads + ' (' + (r.uploadMs / 1000).toFixed(3) + ' s), alpha coverage ' + (100 * r.coverage).toFixed(1) + ' %')
  lines.push('| Part | Vertices | Seconds per sample | Share |', '| --- | --- | --- | --- |')
  for (const x of perSample.sort((p, q) => q.seconds - p.seconds)) lines.push('| ' + x.part + ' | ' + x.vertices + ' | ' + x.seconds.toFixed(3) + ' | ' + (100 * x.seconds / sampleTotal).toFixed(1) + ' % |')
  lines.push('| script between calls | | ' + (gap / 1000 / samples).toFixed(3) + ' | |', '| all draw calls of a sample | | ' + sampleTotal.toFixed(3) + ' | 100 % |')
  lines.push('| Once per frame | Seconds |', '| --- | --- |')
  for (const x of fixed) lines.push('| ' + x.part + ' | ' + x.seconds.toFixed(3) + ' |')
  lines.push('| lens chain total | ' + fixedTotal.toFixed(3) + ' |', '| canvas to PNG and base64 in the page | ' + (r.png / 1000).toFixed(3) + ' |')
  ;(out.frames as Record<string, unknown>)[frame] = { samples, untimedSeconds: r.plain / 1000, timedSeconds: r.timed / 1000, pngSeconds: r.png / 1000, uploads: r.uploads, perSample, fixed }
}
await browser.close()
server.close()
mkdirSync(join(WORK, 'perf'), { recursive: true })
writeFileSync(join(WORK, 'perf', 'perf' + (a.tag ? '-' + a.tag : '') + '.json'), JSON.stringify(out, null, 1))
console.log(lines.join('\n'))
