import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, args, formatId, ensureBuild, loadConfig, requireDisk } from '../../../tools/lib/common'
import { openCapture, renderPngFresh, type Session } from '../../../tools/lib/browser'
import { config } from '../../../src/config'

const cfg = loadConfig()
const a = args()
const list: number[] = []
for (const part of String(a.frames ?? '').split(',')) {
  const m = part.split(':').map(Number)
  if (m.length === 1 && Number.isFinite(m[0])) list.push(m[0]!)
  else for (let f = m[0]!; f <= m[1]!; f += m[2] ?? 1) list.push(f)
}
const tier = a.tier ?? 'draft'
const diag = a.diag ?? 'beauty'
const dir = a.dir ?? 'out/work/sun/pl/frames'
// --rate N: the page counts capture frames at N to a film frame (as the smooth tool does), and --frames are capture frames
const rate = a.rate ? Number(a.rate) : 1
requireDisk(cfg)
ensureBuild()
mkdirSync(dir, { recursive: true })
const held: { session?: Session } = {}
// --hold K: the life of the lab's ground is held at capture frame K while the eye goes on (globalThis.labAhead, seconds
// added to the ground's own time, read by src/stops/sun/lab/ground.ts at every update): a control for the pattern reading
const hold = a.hold === undefined ? null : Number(a.hold)
const open = (): Promise<Session> => openCapture({ dist: DIST, format: formatId(cfg, a.format), assets: a.assets === 'web' ? 'web' : 'full', diag, query: rate > 1 ? '&rate=' + rate : '' })
for (const frame of list) {
  if (hold !== null) {
    held.session ??= await open()
    await held.session.page.evaluate((x) => { (globalThis as { labAhead?: number }).labAhead = x }, (hold - frame) / (config.fps * rate))
  }
  const { png, seconds } = await renderPngFresh(open, held, frame, tier)
  const file = join(dir, (rate > 1 ? 'k' + String(frame).padStart(6, '0') + '-r' + rate : 'f' + String(frame).padStart(5, '0')) + (diag === 'beauty' ? '' : '-' + diag) + '.png')
  writeFileSync(file, png)
  console.log(file + ' ' + seconds.toFixed(1) + 's')
}
await held.session?.close()
