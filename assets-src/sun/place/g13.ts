import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig } from '../../../tools/lib/common'
import { decodePng } from '../../../tools/lib/frames'
import { countTexels } from '../../../tools/measure/texels'

const cfg = loadConfig()
const d = cfg.raw.detail
const dir = process.argv[2] ?? 'out/work/sun/pl/frames'
const rows: string[] = []
let failed = 0
let worst = 0
for (const name of readdirSync(dir).filter((n) => n.endsWith('-texels.png')).sort()) {
  const c = countTexels(decodePng(readFileSync(join(dir, name))), d.minTexelsPerPixel)
  const pass = c.fraction <= d.maxSoftPixelFraction
  if (!pass) failed++
  worst = Math.max(worst, c.fraction)
  rows.push([name.slice(1, 6), c.counted, c.soft, (c.fraction * 100).toFixed(3), c.meanTexels.toFixed(3), pass ? 'pass' : 'FAIL'].join('\t'))
}
console.log('frame\tcounted\tsoft\tsoftPercent\tmeanTexels\t')
console.log(rows.join('\n'))
console.log('G13 by the rule of tools/measure.ts: ' + failed + ' of ' + rows.length + ' frames over ' + d.maxSoftPixelFraction + ' soft, worst ' + (worst * 100).toFixed(3) + ' percent (min texels per pixel ' + d.minTexelsPerPixel + ')')
