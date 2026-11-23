import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { args, loadConfig, requireDisk, WORK } from '../../../tools/lib/common'
import { openSource } from '../../../tools/lib/frames'

const cfg = loadConfig()
requireDisk(cfg)
const a = args()
const tier = a.tier ?? 'draft'
const list = String(a.frames).split(',').map((s) => Number(s))
const dir = join(WORK, 'jupiter', 'frames', String(a.name ?? 'diag'))
mkdirSync(dir, { recursive: true })
const src = await openSource({ format: cfg.formatKeys.master, assets: a.assets ?? 'full' })
await src.setDiagnostic(String(a.diag ?? 'beauty'))
try {
  for (const frame of list) {
    const t0 = process.hrtime.bigint()
    const g = await src.render(frame, tier, 'png', false)
    const file = join(dir, 'f' + String(frame).padStart(5, '0') + '.png')
    writeFileSync(file, g.data!)
    console.log(file, (Number(process.hrtime.bigint() - t0) / 1e9).toFixed(1) + 's')
  }
} finally {
  await src.close()
}
