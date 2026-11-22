import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, WORK, args, ensureBuild, formatId, loadConfig, machineId, requireDisk } from './lib/common'
import { openCapture, renderPng } from './lib/browser'

const cfg = loadConfig()
const a = args()
const format = formatId(cfg, a.format)
const tier = a.tier ?? 'draft'
const assets = a.assets ?? 'full'
const sessions = Number(a.sessions ?? 2)
const runs = Number(a.runs ?? 2)
requireDisk(cfg)
const hashes = ensureBuild()

function pick(): number[] {
  if (a.frames) return a.frames.split(',').map(Number)
  const out: number[] = []
  for (const s of cfg.segments) {
    if (s.kind === 'travel') continue
    if (a.stop && s.stop !== a.stop) continue
    out.push(s.firstFrame + Math.floor(s.frames / 2))
  }
  return out
}

const frames = pick()
const seen = new Map<number, string[]>()
for (const f of frames) seen.set(f, [])
const keep = a.keep
if (keep) mkdirSync(keep, { recursive: true })
const t0 = Date.now()
for (let s = 0; s < sessions; s++) {
  const session = await openCapture({ dist: DIST, format, assets, diag: a.diag })
  for (let r = 0; r < runs; r++) {
    for (const f of frames) {
      const { png } = await renderPng(session.page, f, tier)
      const h = createHash('sha256').update(png).digest('hex').slice(0, 16)
      if (keep && !seen.get(f)!.includes(h)) writeFileSync(join(keep, f + '-' + h + '.png'), png)
      seen.get(f)!.push(h)
    }
  }
  await session.close()
}
const seconds = (Date.now() - t0) / 1000
const loose: number[] = []
const lines: string[] = []
for (const f of frames) {
  const all = seen.get(f)!
  const distinct = [...new Set(all)]
  if (distinct.length > 1) loose.push(f)
  lines.push('frame ' + f + ' distinct ' + distinct.length + ' of ' + all.length + ' ' + distinct.map((h) => h + ' x' + all.filter((x) => x === h).length).join(' '))
}
const dir = join(WORK, 'repeat')
mkdirSync(dir, { recursive: true })
writeFileSync(join(dir, 'result.json'), JSON.stringify({ ok: loose.length === 0, frames, loose, sessions, runs, format, tier, assets, seconds, engineHash: hashes.engine, stopHashes: hashes.stops, machine: machineId(), hashes: Object.fromEntries(seen) }, null, 1))
console.log(lines.join('\n'))
console.log('repeat: ' + frames.length + ' frames, ' + sessions + ' fresh sessions, ' + runs + ' runs each, ' + seconds.toFixed(0) + ' s, not repeatable: ' + (loose.length ? loose.join(' ') : 'none'))
process.exit(loose.length ? 1 : 0)
