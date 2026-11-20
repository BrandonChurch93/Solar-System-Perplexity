import { join } from 'node:path'
import { WORK, args, ensureBuild, loadConfig, requireDisk } from './lib/common'
import { chunkReady, joinUnits, log, makeJob, renderUnits, segmentUnits } from './film'
import { clipRange, stopSegments } from '../src/director/timeline'

const cfg = loadConfig()
const a = args()
const stop = a.stop
if (!stop || !cfg.stopIds.includes(stop)) {
  console.error('clip: --stop must be one of ' + cfg.stopIds.join(', '))
  process.exit(2)
}
const tier = a.tier ?? 'review'
const assets = a.assets ?? 'full'
requireDisk(cfg)
const hashes = ensureBuild()
const job = makeJob(cfg, hashes, cfg.formatKeys.master, tier, assets, a)
const range = clipRange(stop)
const ids = stopSegments(stop).filter((s) => s.kind !== 'travel' && s.firstFrame >= range.firstFrame && s.endFrame <= range.endFrame).map((s) => s.id)
const units = segmentUnits(cfg, ids)
const missing = units.filter((u) => !chunkReady(job, u))
const t0 = Date.now()
try {
  if (missing.length) {
    log(job, 'clip ' + stop + ': rendering ' + missing.map((u) => u.id).join(', '))
    await renderUnits(job, missing)
  } else log(job, 'clip ' + stop + ': every chunk exists, joining only')
} finally {
  await job.source?.close()
}
const out = join(WORK, 'clips', stop + '.mp4')
const rec = joinUnits(job, units, out, { stop, clipRange: range, rendered: missing.map((u) => u.id) })
if ((rec.extra!.missing as string[]).length) {
  console.error('clip ' + stop + ' is missing chunks: ' + (rec.extra!.missing as string[]).join(', '))
  process.exit(1)
}
const failed = (rec.extra!.g5 as { failed: number[] }).failed
log(job, 'clip ' + out + ': ' + rec.extra!.frameCount + ' frames in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s, G5 failed frames: ' + (failed.length ? failed.join(',') : 'none'))
