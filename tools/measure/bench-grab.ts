import { args, ensureBuild, formatId, loadConfig, requireDisk } from '../lib/common'
import { openSource, type GrabMode } from '../lib/frames'
import { openIntermediate } from '../lib/encode'
import { join } from 'node:path'
import { WORK } from '../lib/common'

const cfg = loadConfig()
const a = args()
const format = formatId(cfg, a.format ?? 'master')
const tier = a.tier ?? 'draft'
const first = Number(a.first ?? 180)
const n = Number(a.frames ?? 12)
requireDisk(cfg)
ensureBuild()
const src = await openSource({ format, assets: a.assets ?? 'full' })
await src.render(first, tier, 'none', false)
const modes: [string, GrabMode, boolean, boolean][] = [
  ['render only', 'none', false, false],
  ['render + sanity', 'none', true, false],
  ['render + png to node', 'png', false, false],
  ['render + raw to node', 'raw', false, false],
  ['render + sanity + png into ffv1 pipe', 'png', true, true],
  ['render + sanity + raw into ffv1 pipe', 'raw', true, true],
]
for (const [name, grab, sanity, pipe] of modes) {
  const it = pipe ? openIntermediate(join(WORK, 'tmp', 'bench.mkv'), src.width, src.height, cfg.fps, grab === 'raw' ? 'raw' : 'png') : null
  const t0 = Date.now()
  let s = 0
  for (let i = 0; i < n; i++) {
    const g = await src.render(first + i, tier, grab, sanity)
    s += g.sanitySeconds
    if (it) await it.write(g.data!)
  }
  if (it) await it.end()
  console.log(format + ' ' + tier + ' ' + name + ': ' + ((Date.now() - t0) / 1000 / n).toFixed(3) + ' s/frame' + (sanity ? ' (sanity in page ' + (s / n).toFixed(3) + ')' : ''))
}
await src.close()
