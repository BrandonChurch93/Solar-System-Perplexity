import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Page } from 'playwright-core'
import { DIST, WORK, args, formatId, ensureBuild, loadConfig } from './lib/common'
import { openCapture, pageFaults, renderPng } from './lib/browser'
import { decodePng } from './lib/frames'

// Forces a lost and restored WebGL context and checks that the page draws the same picture again.
// --frame N --tier T --stop ID --wait ms (time the context stays lost) --settle ms (time after the sets are back) --liveShare x (free view: allowed change of the mean level)

const cfg = loadConfig()
const a = args()
const frame = Number(a.frame ?? 2325)
const tier = a.tier ?? 'draft'
const stop = a.stop ?? 'mars'
const wait = Number(a.wait ?? 1000)
const settle = Number(a.settle ?? 3000)
const format = formatId(cfg, a.format)
ensureBuild()
const dir = join(WORK, 'restore')
mkdirSync(dir, { recursive: true })

interface Api { png(): Promise<string>; memory(): { loaded: string[] } }

const shot = async (page: Page, name: string): Promise<Buffer> => {
  const png = Buffer.from(await page.evaluate(() => (window as unknown as { showcase: Api }).showcase.png()), 'base64')
  writeFileSync(join(dir, name + '.png'), png)
  return png
}
const sha = (b: Buffer): string => createHash('sha256').update(b).digest('hex').slice(0, 16)
const mean = (b: Buffer): number => {
  const p = decodePng(b)
  let s = 0
  for (let i = 0; i < p.data.length; i += p.channels) s += p.data[i]! + p.data[i + 1]! + p.data[i + 2]!
  return s / ((p.data.length / p.channels) * 3)
}
const mad = (x: Buffer, y: Buffer): number => {
  const p = decodePng(x)
  const q = decodePng(y)
  if (p.data.length !== q.data.length) return 255
  let s = 0
  for (let i = 0; i < p.data.length; i += p.channels) for (let c = 0; c < 3; c++) s += Math.abs(p.data[i + c]! - q.data[i + c]!)
  return s / ((p.data.length / p.channels) * 3)
}
const loaded = (page: Page): Promise<string[]> => page.evaluate(() => (window as unknown as { showcase: Api }).showcase.memory().loaded)

async function loseAndRestore(page: Page, label: string): Promise<{ black: number; seconds: number }> {
  const before = await loaded(page)
  await page.evaluate(() => {
    const c = document.querySelector('canvas')!
    const gl = c.getContext('webgl2')!
    const w = window as unknown as { __lose: WEBGL_lose_context; __events: string[] }
    w.__lose = gl.getExtension('WEBGL_lose_context')!
    w.__events = []
    c.addEventListener('webglcontextlost', () => w.__events.push('lost'))
    c.addEventListener('webglcontextrestored', () => w.__events.push('restored'))
    w.__lose.loseContext()
  })
  await page.waitForFunction(() => (window as unknown as { __events: string[] }).__events.includes('lost'), undefined, { timeout: 30000 })
  await page.waitForTimeout(wait)
  const black = mean(await shot(page, label + '-lost'))
  pageFaults(page).length = 0
  const t0 = Date.now()
  await page.evaluate(() => {
    const w = window as unknown as { __lose: WEBGL_lose_context; __glLost: number }
    w.__glLost = 0
    w.__lose.restoreContext()
  })
  await page.waitForFunction(() => (window as unknown as { __events: string[] }).__events.includes('restored'), undefined, { timeout: 30000 })
  await page.waitForFunction((ids) => ids.every((id) => (window as unknown as { showcase: Api }).showcase.memory().loaded.includes(id)), before, { timeout: 300000 }).catch(() => undefined)
  const seconds = (Date.now() - t0) / 1000
  await page.waitForTimeout(settle)
  return { black, seconds }
}

const errors = (page: Page, log: string[]): string => {
  const bad = [...pageFaults(page), ...log].filter((x) => /texSubImage2D|WebGLState|INVALID_|GL ERROR/.test(x))
  const rest = log.filter((x) => !bad.includes(x))
  return (bad.length === 0 ? 'none' : bad.length + ' (' + bad[0]!.slice(0, 120) + ')') + (rest.length > 0 ? ', other lines ' + rest.length + ' (' + rest[0]!.slice(0, 120) + ')' : '')
}

const watch = (page: Page): string[] => {
  const log: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') log.push(m.text())
  })
  return log
}

let ok = true
const say = (name: string, good: boolean, text: string): void => {
  ok &&= good
  console.log((good ? 'pass ' : 'FAIL ') + name + ': ' + text)
}

{
  const s = await openCapture({ dist: DIST, format, assets: a.assets ?? 'full' })
  const log = watch(s.page)
  const first = (await renderPng(s.page, frame, tier)).png
  writeFileSync(join(dir, 'capture-before.png'), first)
  const { black, seconds } = await loseAndRestore(s.page, 'capture')
  log.length = 0
  const redrawn = await shot(s.page, 'capture-redrawn')
  let again: Buffer = Buffer.alloc(0)
  let fault = ''
  try {
    again = (await renderPng(s.page, frame, tier)).png
    writeFileSync(join(dir, 'capture-after.png'), again)
  } catch (e) {
    fault = String(e).split('\n')[0]!
  }
  say('capture, the page draws its frame again by itself', mad(first, redrawn) === 0, 'frame ' + frame + ' ' + tier + ', mean level ' + mean(first).toFixed(2) + ' before, ' + black.toFixed(2) + ' while lost, ' + mean(redrawn).toFixed(2) + ' after, mean absolute difference ' + mad(first, redrawn).toFixed(4) + ', sets back after ' + seconds.toFixed(1) + ' s')
  say('capture, renderPng after the restore', fault === '' && sha(first) === sha(again), fault || 'sha256 ' + sha(first) + ' before, ' + sha(again) + ' after, mean absolute difference ' + mad(first, again).toFixed(4))
  say('capture, console after the restore', errors(s.page, log).startsWith('none'), 'texture or state errors: ' + errors(s.page, log))
  await s.close()
}

for (const kind of ['frame', 'free'] as const) {
  const query = kind === 'frame' ? '&frame=' + frame + '&tier=' + tier : '&stop=' + stop
  const s = await openCapture({ dist: DIST, format, assets: a.liveAssets ?? 'web', mode: 'live', query })
  const log = watch(s.page)
  await s.page.waitForFunction((id) => {
    const ids = (window as unknown as { showcase: Api }).showcase.memory().loaded
    return id === '' ? ids.length > 0 : ids.includes(id)
  }, kind === 'frame' ? '' : stop, { timeout: 300000 })
  await s.page.waitForTimeout(settle)
  const first = await shot(s.page, 'live-' + kind + '-before')
  const { black, seconds } = await loseAndRestore(s.page, 'live-' + kind)
  log.length = 0
  await s.page.waitForTimeout(settle)
  const after = await shot(s.page, 'live-' + kind + '-after')
  const d = mad(first, after)
  const share = Number(a.liveShare ?? 0.2)
  const level = Math.abs(mean(after) - mean(first)) / Math.max(mean(first), 1e-6)
  const good = kind === 'frame' ? d === 0 : mean(after) > 1 && level <= share
  say('live ' + (kind === 'frame' ? 'frame ' + frame : stop + ' free view') + ', picture after the restore', good, 'mean level ' + mean(first).toFixed(2) + ' before, ' + black.toFixed(2) + ' while lost, ' + mean(after).toFixed(2) + ' after, mean absolute difference ' + d.toFixed(4) + (kind === 'free' ? ' (the clock of the free view runs on, so the body has turned: the test is the mean level within ' + share + ' of before)' : '') + ', sets back after ' + seconds.toFixed(1) + ' s')
  say('live ' + kind + ', console after the restore', errors(s.page, log).startsWith('none'), 'texture or state errors: ' + errors(s.page, log))
  await s.close()
}

console.log('restore: ' + (ok ? 'pass' : 'FAIL') + ', pictures in ' + dir)
process.exit(ok ? 0 : 1)
