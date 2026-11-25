// The low band's share over the rise (MAIL 1218 point 3): draws a film frame three times on one page, with the
// band's share held at 0, at 1 and as the law gives it; band.py reads the share of each frame from the pictures
// and the largest change of a fixed place from a frame to the next.
//   npx tsx assets-src/sun/lab/band.ts --frames 221,222 --out out/work/sun/lab/band
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, args, ensureBuild, formatId, loadConfig } from '../../../tools/lib/common'
import { openCapture, renderPng } from '../../../tools/lib/browser'

const cfg = loadConfig()
const a = args()
const frames = String(a.frames ?? '221,222').split(',').map(Number)
const out = a.out ?? 'out/work/sun/lab/band'
ensureBuild()
mkdirSync(out, { recursive: true })
const s = await openCapture({ dist: DIST, format: formatId(cfg, a.format), assets: 'full', diag: 'beauty' })
for (const f of frames) {
  for (const [name, v] of [['0', 0], ['1', 1], ['law', null]] as const) {
    await s.page.evaluate((x) => { (globalThis as { labBand?: number }).labBand = x ?? undefined }, v)
    const { png } = await renderPng(s.page, f, a.tier ?? 'draft')
    writeFileSync(join(out, 'f' + f + '-' + name + '.png'), png)
    console.log('frame ' + f + ' band ' + name)
  }
}
await s.close()
