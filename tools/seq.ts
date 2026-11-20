import { join } from 'node:path'
import { args, loadConfig, requireDisk, WORK } from './lib/common'
import { Capture, frameNumber, padFrame } from './lib/render'

const cfg = loadConfig()
requireDisk(cfg)
const a = args()
const first = frameNumber(cfg, a.first, 'first')
const last = frameNumber(cfg, a.last, 'last')
if (last < first) throw new Error('--last must be at least --first')
const limit = cfg.raw.sandbox.maxFramesOnDisk
if (last - first + 1 > limit) throw new Error('sequence exceeds sandbox.maxFramesOnDisk (' + limit + ')')
const capture = new Capture(cfg, a.format)
const tier = a.tier ?? 'draft'
const dir = join(WORK, 'seq', first + '-' + last)
try {
  for (let frame = first; frame <= last; frame++) {
    const file = join(dir, 'f' + padFrame(frame) + '.png')
    await capture.still(frame, tier, file)
  }
  console.log(dir + ' (' + (last - first + 1) + ' frames)')
} finally {
  await capture.close()
}
