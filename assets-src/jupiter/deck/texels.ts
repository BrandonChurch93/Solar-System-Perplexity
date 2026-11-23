import { args, loadConfig, requireDisk } from '../../../tools/lib/common'
import { decodePng, openSource } from '../../../tools/lib/frames'
import { countTexels } from '../../../tools/measure/texels'

const cfg = loadConfig()
requireDisk(cfg)
const a = args()
const list = String(a.frames).split(',').map((s) => Number(s))
const d = cfg.raw.detail
const src = await openSource({ format: cfg.formatKeys.master, assets: a.assets ?? 'full' })
await src.setDiagnostic('texels')
try {
  for (const frame of list) {
    const g = await src.render(frame, 'draft', 'png', false)
    const c = countTexels(decodePng(g.data!), d.minTexelsPerPixel)
    console.log('G13 ' + frame + ' soft ' + (c.fraction * 100).toFixed(2) + '% counted ' + c.counted + ' mean ' + c.meanTexels.toFixed(2) + (c.fraction <= d.maxSoftPixelFraction ? ' pass' : ' FAIL'))
  }
} finally {
  await src.close()
}
