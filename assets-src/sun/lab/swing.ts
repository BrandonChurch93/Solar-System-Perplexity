// The swing between the live cells and their bake on the globe (MAIL 1267 point 2 b): draws a film frame twice on
// one page, as it stands and with the live ground taken away (globalThis.labGone), so the globe's face with the
// baked level shows at the same places; swing.py reads the difference of the two at every place of the ground.
//   npx tsx assets-src/sun/lab/swing.ts --frames 221,229 --out out/work/sun/lab/swing
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, args, ensureBuild, formatId, loadConfig } from '../../../tools/lib/common'
import { openCapture, renderPng } from '../../../tools/lib/browser'

const cfg = loadConfig()
const a = args()
const frames = String(a.frames ?? '221,229').split(',').map(Number)
const out = a.out ?? 'out/work/sun/lab/swing'
ensureBuild()
mkdirSync(out, { recursive: true })
const s = await openCapture({ dist: DIST, format: formatId(cfg, a.format), assets: 'full', diag: 'beauty' })
for (const f of frames) {
  for (const [name, v] of [['live', false], ['bake', true]] as const) {
    await s.page.evaluate((x) => { (globalThis as { labGone?: boolean }).labGone = x }, v)
    const { png } = await renderPng(s.page, f, a.tier ?? 'draft')
    writeFileSync(join(out, 'f' + f + '-' + name + '.png'), png)
    console.log('frame ' + f + ' ' + name)
  }
}
await s.close()
