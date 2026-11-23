import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { DIST, args, ensureBuild, formatId, loadConfig } from '../../../tools/lib/common'
import { openCapture, renderPng } from '../../../tools/lib/browser'
import { decodePng } from '../../../tools/lib/frames'
import { countTexels } from '../../../tools/measure/texels'

// Draws a dive frame of Venus from one side at a pose of the close view (and its twin on the globe).
// Uses the temporary probe of src/stops/venus/plan.ts (globalThis.__venusProbe); the engine's forceSide replaces it at the merge of E1.
// npx tsx assets-src/venus/place/check.ts --frames 1349 --trel 3.0083333 --sides terrain,orbit --tier draft --out out/work/venus/place/check
// --path draws the new dive and rise (plan.divePose, plan.risePose, the one steady move) from the given side at the frames' own times; --name sets the file tag.
// --tops path draws every frame of --frames from straight above the plate centre at the height the dive path has at that frame.
// --on X and --dusk X set the weight of the plates and the share of the dusk gain for the --tops views by hand.
// --tops 3.4,1.2,0.4 adds views from straight above the plate centre at those heights (radii), the heading of the twin at the top of the frame.
const cfg = loadConfig()
const a = args()
const frames = (a.frames ?? '1349').split(',').map(Number)
const tier = a.tier ?? 'draft'
const format = formatId(cfg, a.format)
const sides = (a.sides ?? 'terrain,orbit').split(',').filter((s) => s !== 'none')
const tRel = a.trel === undefined ? null : Number(a.trel)
const tops = a.tops === undefined || a.tops === 'path' ? [] : a.tops.split(',').map(Number)
const topsOnPath = a.tops === 'path'
const vfov = a.vfov === undefined ? 60 : Number(a.vfov)
const out = a.out ?? 'out/work/venus/place/check'
const path = a.path !== undefined
// With --diag texels every frame is counted like G13 (tools/measure): the share of counted pixels with less than detail.minTexelsPerPixel.
const counts: { file: string; counted: number; soft: number; fraction: number; meanTexels: number }[] = []
const count = (file: string, png: Buffer): string => {
  if (a.diag !== 'texels') return ''
  const c = countTexels(decodePng(png), cfg.raw.detail.minTexelsPerPixel)
  counts.push({ file, counted: c.counted, soft: c.soft, fraction: c.fraction, meanTexels: c.meanTexels })
  return ' counted ' + c.counted + ' soft share ' + c.fraction.toFixed(4) + ' mean texels ' + c.meanTexels.toFixed(2)
}
ensureBuild()
for (const side of topsOnPath ? [] : sides) {
  const s = await openCapture({ dist: DIST, format, assets: a.assets ?? 'full', diag: a.diag ?? 'beauty' })
  await s.page.evaluate(([sd, tr, pa, on, dusk]) => {
    const g = globalThis as { __venusProbe?: { side: string; tRel?: number; path?: boolean; on?: number; dusk?: number } }
    const look = { ...(on === null ? {} : { on: on as number }), ...(dusk === null ? {} : { dusk: dusk as number }) }
    if (sd === 'film') delete g.__venusProbe
    else if (pa) g.__venusProbe = { side: sd as string, path: true, ...look }
    else g.__venusProbe = tr === null ? { side: sd as string, ...look } : { side: sd as string, tRel: tr as number, ...look }
  }, [side, tRel, path, a.on === undefined ? null : Number(a.on), a.dusk === undefined ? null : Number(a.dusk)] as const)
  for (const frame of frames) {
    const { png, seconds } = await renderPng(s.page, frame, tier)
    const file = out + '-f' + frame + '-' + side + '.png'
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, png)
    console.log(file + ' ' + seconds.toFixed(1) + 's' + count(file, png))
  }
  await s.close()
}
if (tops.length > 0) {
  const s = await openCapture({ dist: DIST, format, assets: a.assets ?? 'full', diag: a.diag ?? 'beauty' })
  for (const top of tops) {
    await s.page.evaluate(([h, v, on, dusk]) => {
      ;(globalThis as { __venusProbe?: object }).__venusProbe = { side: 'orbit', top: h as number, vfov: v as number, ...(on === null ? {} : { on }), ...(dusk === null ? {} : { dusk }) }
    }, [top, vfov, a.on === undefined ? null : Number(a.on), a.dusk === undefined ? null : Number(a.dusk)] as const)
    const { png, seconds } = await renderPng(s.page, frames[0]!, tier)
    const file = out + '-top-' + top + '.png'
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, png)
    console.log(file + ' ' + seconds.toFixed(1) + 's' + count(file, png))
  }
  await s.close()
}
if (topsOnPath) {
  // The view from straight above the plate centre at the height the dive path has at each frame, with the look of that frame.
  const s = await openCapture({ dist: DIST, format, assets: a.assets ?? 'full', diag: a.diag ?? 'beauty' })
  await s.page.evaluate((v) => {
    ;(globalThis as { __venusProbe?: { side: string; top: number; vfov: number } }).__venusProbe = { side: 'orbit', top: -1, vfov: v }
  }, vfov)
  for (const frame of frames) {
    const { png, seconds } = await renderPng(s.page, frame, tier)
    const file = out + '-top-f' + frame + '.png'
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, png)
    console.log(file + ' ' + seconds.toFixed(1) + 's' + count(file, png))
  }
  await s.close()
}
if (counts.length > 0) {
  const over = counts.filter((c) => c.fraction > cfg.raw.detail.maxSoftPixelFraction)
  console.log('texels: ' + over.length + ' of ' + counts.length + ' frames over ' + cfg.raw.detail.maxSoftPixelFraction + ' soft' + (over.length > 0 ? ': ' + over.map((c) => c.file.replace(/^.*-f(\d+)-.*$/, '$1') + ' ' + c.fraction.toFixed(3)).join(', ') : ''))
  writeFileSync(out + '-texels.json', JSON.stringify(counts, null, 1))
}
