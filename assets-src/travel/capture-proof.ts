import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, args, formatId, ensureBuild, loadConfig } from '../../tools/lib/common'
import { openCapture } from '../../tools/lib/browser'

const cfg = loadConfig()
const a = args()
const tier = a.tier ?? 'draft'
const format = formatId(cfg, a.format)
const rate = Number(a.rate ?? 1)
const query = (rate === 1 ? '' : '&rate=' + rate) + (a.shutter === undefined ? '' : '&shutter=' + a.shutter)
const frames = String(a.frames).split(',').map(Number)
const out = a.out ?? ''
if (out) mkdirSync(out, { recursive: true })
ensureBuild()
const s = await openCapture({ dist: DIST, format, assets: a.assets ?? 'full', query })
const info = await s.page.evaluate(() => JSON.stringify((window as unknown as { showcase: { info(): object } }).showcase.info()))
console.log('INFO ' + info.slice(0, 220))
for (const k of frames) {
  const t0 = Date.now()
  const [b64, samples] = await s.page.evaluate(async ([f, t]) => {
    const w = (window as unknown as { showcase: { renderFrame(f: number, t: string): Promise<void>; png(): Promise<string>; samples(): number } }).showcase
    await w.renderFrame(f as number, t as string)
    return [await w.png(), w.samples()] as const
  }, [k, tier] as const)
  const png = Buffer.from(b64, 'base64')
  if (out) writeFileSync(join(out, 'k' + String(k).padStart(5, '0') + '.png'), png)
  console.log('ROW ' + (a.label ?? '') + ' rate ' + rate + ' shutter ' + (a.shutter ?? 'film') + ' k ' + k + ' ' + createHash('sha256').update(png).digest('hex').slice(0, 16) + ' ' + samples + ' samples ' + ((Date.now() - t0) / 1000).toFixed(1) + 's')
}
await s.close()
console.log('PROOFDONE ' + (a.label ?? ''))
