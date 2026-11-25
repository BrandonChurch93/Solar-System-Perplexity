// Is a frame a pure function of its number: draws the frame alone on a fresh page and after other frames on one
// page, and writes the pictures; pure.py compares their pixels (whole, and the rows of the ground alone).
//   npx tsx assets-src/sun/lab/pure.ts --frame 90 --after 60,360 --out out/work/sun/lab/pure
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { DIST, args, ensureBuild, formatId, loadConfig } from '../../../tools/lib/common'
import { openCapture, renderPng } from '../../../tools/lib/browser'

const cfg = loadConfig()
const a = args()
const frame = Number(a.frame ?? 90)
const after = String(a.after ?? '60,360').split(';').map((s) => s.split(',').map(Number))
const out = a.out ?? 'out/work/sun/lab/pure'
const tier = a.tier ?? 'draft'
ensureBuild()
mkdirSync(out, { recursive: true })
const format = formatId(cfg, a.format)
const hash = (b: Buffer): string => createHash('sha256').update(b).digest('hex').slice(0, 16)
for (const before of [[] as number[], ...after]) {
  const s = await openCapture({ dist: DIST, format, assets: 'full', diag: 'beauty' })
  for (const f of before) await renderPng(s.page, f, tier)
  const { png } = await renderPng(s.page, frame, tier)
  await s.close()
  const name = before.length ? 'after-' + before.join('-') : 'alone'
  writeFileSync(join(out, 'f' + frame + '-' + name + '.png'), png)
  console.log('frame ' + frame + ' ' + name + ': bytes of the file ' + hash(png))
}
