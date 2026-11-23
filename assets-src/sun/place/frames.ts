import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, args, formatId, ensureBuild, loadConfig, requireDisk } from '../../../tools/lib/common'
import { openCapture, renderPngFresh, type Session } from '../../../tools/lib/browser'

const cfg = loadConfig()
const a = args()
const list: number[] = []
for (const part of String(a.frames ?? '').split(',')) {
  const m = part.split(':').map(Number)
  if (m.length === 1 && Number.isFinite(m[0])) list.push(m[0]!)
  else for (let f = m[0]!; f <= m[1]!; f += m[2] ?? 1) list.push(f)
}
const tier = a.tier ?? 'draft'
const diag = a.diag ?? 'beauty'
const dir = a.dir ?? 'out/work/sun/pl/frames'
requireDisk(cfg)
ensureBuild()
mkdirSync(dir, { recursive: true })
const held: { session?: Session } = {}
for (const frame of list) {
  const { png, seconds } = await renderPngFresh(() => openCapture({ dist: DIST, format: formatId(cfg, a.format), assets: 'full', diag }), held, frame, tier)
  const file = join(dir, 'f' + String(frame).padStart(5, '0') + (diag === 'beauty' ? '' : '-' + diag) + '.png')
  writeFileSync(file, png)
  console.log(file + ' ' + seconds.toFixed(1) + 's')
}
await held.session?.close()
