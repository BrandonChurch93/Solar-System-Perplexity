import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, ROOT, WORK, args, ensureBuild, formatId, loadConfig, machineId, requireDisk } from './lib/common'
import { openCapture, renderPng } from './lib/browser'
import { DETERMINISM, determinismFrames, toolHash } from './gate/kept'

const cfg = loadConfig()
const a = args()
const format = formatId(cfg, a.format ?? DETERMINISM.format)
const tier = a.tier ?? DETERMINISM.tier
const assets = a.assets ?? DETERMINISM.assets
requireDisk(cfg)
const hashes = ensureBuild()

const frames = a.frames ? a.frames.split(',').map(Number) : determinismFrames(cfg.segments)
const digest = (b: Buffer): string => createHash('sha256').update(b).digest('hex').slice(0, 16)
const runs: Record<string, Record<number, string>> = {}
const browsers = new Set<string>()

async function run(name: string, order: number[]): Promise<void> {
  const s = await openCapture({ dist: DIST, format, assets })
  browsers.add(s.browserVersion)
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
  browsers.add(s.browserVersion)
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
writeFileSync(join(dir, 'result.json'), JSON.stringify({ ok, frames, format, tier, assets, engineHash: hashes.engine, stopHashes: hashes.stops, tool: toolHash(ROOT, 'tools/determinism.ts'), browser: [...browsers].join(', '), machine: machineId(), runs, single }, null, 1))
console.log(lines.join('\n'))
console.log(ok ? 'determinism: pass' : 'determinism: FAIL')
process.exit(ok ? 0 : 1)
