import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, WORK, args, ensureBuild, formatId, loadConfig, machineId, requireDisk } from './lib/common'
import { openCapture, renderPng } from './lib/browser'
import { segmentById } from '../src/director/timeline'

const cfg = loadConfig()
const a = args()
const format = formatId(cfg, a.format ?? 'preview')
const tier = a.tier ?? 'review'
const assets = a.assets ?? 'full'
requireDisk(cfg)
const hashes = ensureBuild()

function pick(): number[] {
  if (a.frames) return a.frames.split(',').map(Number)
  const kinds = ['hold', 'dive', 'travel', 'terrain']
  const out: number[] = []
  for (const k of kinds) {
    const s = cfg.segments.find((x) => x.kind === k)
    if (s) out.push(segmentById(s.id).firstFrame + Math.floor(s.frames / 2))
  }
  return out
}

const frames = pick()
const digest = (b: Buffer): string => createHash('sha256').update(b).digest('hex').slice(0, 16)
const runs: Record<string, Record<number, string>> = {}

async function run(name: string, order: number[]): Promise<void> {
  const s = await openCapture({ dist: DIST, format, assets })
  runs[name] = {}
  for (const f of order) {
    const { png } = await renderPng(s.page, f, tier)
    runs[name]![f] = digest(png)
  }
  await s.close()
}

await run('fresh-forward', frames)
await run('fresh-reverse', [...frames].reverse())
const single: Record<number, string> = {}
{
  const f = frames[frames.length - 1]!
  const s = await openCapture({ dist: DIST, format, assets })
  single[f] = digest((await renderPng(s.page, f, tier)).png)
  await s.close()
}
let ok = true
const lines: string[] = []
for (const f of frames) {
  const x = runs['fresh-forward']![f]
  const y = runs['fresh-reverse']![f]
  const z = single[f]
  const same = x === y && (z === undefined || z === x)
  if (!same) ok = false
  lines.push('frame ' + f + ' ' + (same ? 'identical' : 'DIFFERENT') + ' ' + x + ' ' + y + (z ? ' ' + z : ''))
}
const dir = join(WORK, 'determinism')
mkdirSync(dir, { recursive: true })
writeFileSync(join(dir, 'result.json'), JSON.stringify({ ok, frames, format, tier, assets, engineHash: hashes.engine, stopHashes: hashes.stops, machine: machineId(), runs, single }, null, 1))
console.log(lines.join('\n'))
console.log(ok ? 'determinism: pass' : 'determinism: FAIL')
process.exit(ok ? 0 : 1)
