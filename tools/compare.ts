import { join } from 'node:path'
import { args, loadConfig, requireDisk, ROOT, WORK, writeRecord } from './lib/common'
import { cached, Capture, fingerprint, image, imageRevision, jpgQuality, judged, stopDependencies, type Rect } from './lib/render'

const cfg = loadConfig()
requireDisk(cfg)
const a = args()
const stop = cfg.stops.find((s) => s.id === a.stop)
if (stop === undefined) throw new Error('expected --stop ID')
const viewKind = a.view === 'hold' || a.view === 'terrain' ? a.view : undefined
if (viewKind === undefined) throw new Error('expected --view hold|terrain')
const segment = cfg.segments.find((s) => s.stop === stop.id && s.kind === viewKind)
if (segment === undefined) throw new Error('no ' + viewKind + ' segment for ' + stop.id)
const approved = join(ROOT, viewKind === 'hold' ? stop.hero : stop.close)
const frame = judged(cfg, segment)
const tier = a.tier ?? 'final'
const capture = new Capture(cfg, 'master')
const prefix = join(WORK, 'compare', 'compare-' + stop.id + '-' + viewKind)
const output = prefix + '.jpg'
const view = prefix + '-view.jpg'
const limit = cfg.raw.critics.maxImageLongEdgePx
const signature = JSON.stringify([frame, fingerprint(approved), limit, imageRevision(), jpgQuality])
try {
  const want = capture.record(tier, [frame])
  const deps = stopDependencies([frame])
  if (cached(output, want, deps, signature) === null || cached(view, want, deps, signature) === null) {
    const still = await capture.still(frame, tier)
    const rectangles = image<Rect[]>({ op: 'compare', output, view, limit, a: approved, b: still.file, quality: jpgQuality })
    const extra = { signature, segment: segment.id, rectangles, quality: jpgQuality }
    writeRecord(output, { ...still.record, extra })
    writeRecord(view, { ...still.record, extra: { ...extra, viewingCopy: true } })
  }
  console.log(output + '\n' + view)
} finally {
  await capture.close()
}
