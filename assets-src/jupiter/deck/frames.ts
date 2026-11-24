import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { args, DIST, loadConfig, requireDisk, WORK } from '../../../tools/lib/common'
import { openCapture, renderPngFresh, type Session } from '../../../tools/lib/browser'
import { Capture, padFrame } from '../../../tools/lib/render'

// Stills of a list of frames into out/work/jupiter/frames/NAME.
//   npx tsx assets-src/jupiter/deck/frames.ts --frames 2895,3150 --name NAME [--tier draft] [--rate 2]
// With --rate the numbers count capture frames (film frame times the rate) and the files are kNNNNNN.png.

const cfg = loadConfig()
requireDisk(cfg)
const a = args()
const tier = a.tier ?? 'draft'
const rate = a.rate ? Number(a.rate) : 1
const dir = join(WORK, 'jupiter', 'frames', String(a.name ?? tier))
mkdirSync(dir, { recursive: true })
const list = String(a.frames).split(',').flatMap((s) => {
  const [first, last] = s.split('-').map(Number) as [number, number | undefined]
  return last === undefined ? [first] : Array.from({ length: last - first + 1 }, (_, i) => first + i)
})
const capture = new Capture(cfg, a.format)
const held: { session?: Session } = {}
try {
  for (const frame of list) {
    const t0 = process.hrtime.bigint()
    let count = 0
    const file = join(dir, (rate > 1 ? 'k' + String(frame).padStart(6, '0') : 'f' + padFrame(frame)) + '.png')
    if (rate > 1) {
      const { png, samples } = await renderPngFresh(() => openCapture({ dist: DIST, format: capture.format, assets: 'full', diag: 'beauty', query: '&rate=' + rate }), held, frame, tier)
      writeFileSync(file, png)
      count = samples
    } else count = Number((await capture.still(frame, tier, file)).record.extra?.samples ?? 0)
    console.log(file, (Number(process.hrtime.bigint() - t0) / 1e9).toFixed(1) + 's', count + ' samples')
  }
} finally {
  await held.session?.close().catch(() => undefined)
  await capture.close()
}
