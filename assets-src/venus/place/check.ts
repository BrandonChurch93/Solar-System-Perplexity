import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { DIST, args, ensureBuild, formatId, loadConfig } from '../../../tools/lib/common'
import { openCapture, renderPng } from '../../../tools/lib/browser'

// Draws a dive frame of Venus from one side at a pose of the close view (and its twin on the globe).
// Uses the temporary probe of src/stops/venus/plan.ts (globalThis.__venusProbe); the engine's forceSide replaces it at the merge of E1.
// npx tsx assets-src/venus/place/check.ts --frames 1349 --trel 3.0083333 --sides terrain,orbit --tier draft --out out/work/venus/place/check
// --tops 3.4,1.2,0.4 adds views from straight above the plate centre at those heights (radii), the heading of the twin at the top of the frame.
const cfg = loadConfig()
const a = args()
const frames = (a.frames ?? '1349').split(',').map(Number)
const tier = a.tier ?? 'draft'
const format = formatId(cfg, a.format)
const sides = (a.sides ?? 'terrain,orbit').split(',')
const tRel = a.trel === undefined ? null : Number(a.trel)
const tops = a.tops === undefined ? [] : a.tops.split(',').map(Number)
const vfov = a.vfov === undefined ? 60 : Number(a.vfov)
const out = a.out ?? 'out/work/venus/place/check'
ensureBuild()
for (const side of sides) {
  const s = await openCapture({ dist: DIST, format, assets: a.assets ?? 'full', diag: a.diag ?? 'beauty' })
  await s.page.evaluate(([sd, tr]) => {
    const g = globalThis as { __venusProbe?: { side: string; tRel?: number } }
    if (sd === 'film') delete g.__venusProbe
    else g.__venusProbe = tr === null ? { side: sd as string } : { side: sd as string, tRel: tr as number }
  }, [side, tRel] as const)
  for (const frame of frames) {
    const { png, seconds } = await renderPng(s.page, frame, tier)
    const file = out + '-f' + frame + '-' + side + '.png'
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, png)
    console.log(file + ' ' + seconds.toFixed(1) + 's')
  }
  await s.close()
}
if (tops.length > 0) {
  const s = await openCapture({ dist: DIST, format, assets: a.assets ?? 'full', diag: a.diag ?? 'beauty' })
  for (const top of tops) {
    await s.page.evaluate(([h, v]) => {
      ;(globalThis as { __venusProbe?: { side: string; top: number; vfov: number } }).__venusProbe = { side: 'orbit', top: h as number, vfov: v as number }
    }, [top, vfov] as const)
    const { png, seconds } = await renderPng(s.page, frames[0]!, tier)
    const file = out + '-top-' + top + '.png'
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, png)
    console.log(file + ' ' + seconds.toFixed(1) + 's')
  }
  await s.close()
}
