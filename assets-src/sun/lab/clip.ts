// The life clip: capture frames A to B of the film (two a film frame), draft tier, one page, into a folder.
//   npx tsx assets-src/sun/lab/clip.ts --from 240 --to 359 --out out/work/sun/lab/clip
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, args, ensureBuild, formatId, loadConfig } from '../../../tools/lib/common'
import { openCapture, renderPngFresh, type Session } from '../../../tools/lib/browser'

const cfg = loadConfig()
const a = args()
const from = Number(a.from ?? 240)
const to = Number(a.to ?? 359)
const tier = a.tier ?? 'draft'
const out = a.out ?? 'out/work/sun/lab/clip'
ensureBuild()
mkdirSync(out, { recursive: true })
const held: { session?: Session } = {}
const format = formatId(cfg, a.format)
for (let k = from; k <= to; k++) {
  const file = join(out, 'k' + String(k).padStart(4, '0') + '.png')
  if (existsSync(file)) continue
  const { png, seconds } = await renderPngFresh(() => openCapture({ dist: DIST, format, assets: 'full', diag: 'beauty', query: '&rate=2' }), held, k, tier)
  writeFileSync(file, png)
  console.log(file + ' ' + seconds.toFixed(1) + 's')
}
await held.session?.close()
