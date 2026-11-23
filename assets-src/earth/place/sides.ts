import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, WORK, args, formatId, ensureBuild, loadConfig, requireDisk } from '../../../tools/lib/common'
import { openCapture, renderPngFresh, type Session } from '../../../tools/lib/browser'

const cfg = loadConfig()
const a = args()
const frames = String(a.frames ?? '1915').split(',').map(Number)
const tier = a.tier ?? 'draft'
const format = formatId(cfg, a.format)
const diag = a.diag ?? 'nograin'
const dir = a.out ?? join(WORK, 'earth', 'place', 'sides')
requireDisk(cfg)
ensureBuild()
mkdirSync(dir, { recursive: true })
for (const side of String(a.sides ?? 'terrain,orbit').split(',')) {
  const held: { session?: Session } = {}
  for (const frame of frames) {
    const { png, seconds } = await renderPngFresh(() => openCapture({ dist: DIST, format, assets: 'full', diag, query: '&earthSide=' + side }), held, frame, tier)
    const file = join(dir, 'f' + String(frame).padStart(5, '0') + '-' + side + '.png')
    writeFileSync(file, png)
    console.log(file + ' ' + seconds.toFixed(1) + 's')
  }
  await held.session?.close()
}
