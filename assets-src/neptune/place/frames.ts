// Proof frames in one browser session: npx tsx assets-src/neptune/place/frames.ts --dir DIR --frames 4680,4688 [--tier draft] [--diag texels] [--tag -name]
// The globe side alone, without the engine's place picture: --diag beauty/side=orbit/noplace (options of the engine's harness).
// Writes DIR/fN.png (or DIR/fN-DIAG.png, or DIR/fN followed by the tag). With a texels diagnostic each line also carries the
// count of G13 (share of counted pixels under detail.minTexelsPerPixel, the measure's own counter). One build check, one page, so a sheet of twelve frames costs twelve renders and no more.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, args, ensureBuild, formatId, loadConfig } from '../../../tools/lib/common'
import { openCapture, renderPngFresh, type Session } from '../../../tools/lib/browser'
import { decodePng } from '../../../tools/lib/frames'
import { countTexels } from '../../../tools/measure/texels'

const cfg = loadConfig()
const a = args()
const dir = a.dir ?? 'out/work/nep/frames'
const tier = a.tier ?? 'draft'
const diag = a.diag ?? 'beauty'
const tag = a.tag ?? (diag === 'beauty' ? '' : '-' + diag.replace(/[/=]/g, '_'))
const format = formatId(cfg, a.format)
const frames = (a.frames ?? '').split(',').filter((s) => s.length > 0).map(Number)
ensureBuild()
mkdirSync(dir, { recursive: true })
const held: { session?: Session } = {}
try {
  for (const frame of frames) {
    const { png, seconds, samples } = await renderPngFresh(() => openCapture({ dist: DIST, format, assets: 'full', diag }), held, frame, tier)
    const file = join(dir, 'f' + frame + tag + '.png')
    writeFileSync(file, png)
    let count = ''
    if (diag.startsWith('texels')) {
      const c = countTexels(decodePng(png), cfg.raw.detail.minTexelsPerPixel)
      count = ' G13 soft ' + (c.fraction * 100).toFixed(3) + '% of ' + c.counted + ' mean ' + c.meanTexels.toFixed(2) + (c.fraction > cfg.raw.detail.maxSoftPixelFraction ? ' OVER' : '')
    }
    console.log(file + ' ' + seconds.toFixed(1) + 's ' + samples + ' samples' + count)
  }
} finally {
  await held.session?.close()
}
console.log('FRAMES DONE')
