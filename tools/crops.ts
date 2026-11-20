import { readdirSync, rmSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { args, loadConfig, requireDisk, WORK, writeRecord } from './lib/common'
import { cached, Capture, frameNumber, image, imageRevision, padFrame, stopDependencies, type Rect } from './lib/render'

const cfg = loadConfig()
requireDisk(cfg)
const a = args()
const frame = frameNumber(cfg, a.frame, 'frame')
const tier = a.tier ?? 'final'
const regions = a.regions?.split(';').map((region) => {
  const fields = region.split(',')
  if ((fields.length === 4 && fields.every((v) => /^\s*\d+\s*$/.test(v))) === false) throw new Error('expected --regions x,y,w,h;x,y,w,h')
  return fields.map(Number) as Rect
}) ?? []
const capture = new Capture(cfg, a.format)
const output = join(WORK, 'crops', 'f' + padFrame(frame) + '-' + capture.format + '-' + tier)
const overview = output + '-overview.png'
const limit = cfg.raw.critics.maxImageLongEdgePx
const signature = JSON.stringify([frame, regions, limit, imageRevision()])
const want = capture.record(tier, [frame])
const deps = stopDependencies([frame])
try {
  const previous = cached(overview, want, deps, signature)
  const grids = previous?.extra?.grids as string[] | undefined
  if (grids?.length && grids.every((file) => cached(file, want, deps, signature))) {
    console.log([...grids, overview].join('\n'))
  } else {
    const input = await capture.still(frame, tier)
    const pages = image<{ path: string; rectangles: Rect[] }[]>({ op: 'crops', output, input: input.file, regions, overview, limit })
    for (const p of pages) writeRecord(p.path, { ...input.record, extra: { signature, rectangles: p.rectangles } })
    const grids = pages.map((p) => p.path)
    writeRecord(overview, { ...input.record, extra: { signature, grids, rectangles: pages.flatMap((p) => p.rectangles) } })
    for (const file of readdirSync(dirname(output))) {
      if (file.startsWith(basename(output) + '-') && /^\d+\.png$/.test(file.slice(basename(output).length + 1)) && grids.includes(join(dirname(output), file)) === false) {
        rmSync(join(dirname(output), file))
        rmSync(join(dirname(output), file + '.json'), { force: true })
      }
    }
    console.log([...grids, overview].join('\n'))
  }
} finally {
  await capture.close()
}
