import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { args, loadConfig, WORK } from '../../../tools/lib/common'
import { Capture, outputFolder } from '../../../tools/lib/render'

const cfg = loadConfig()
const a = args()
const frames = String(a.frames).split(',').map(Number)
const tier = a.tier ?? 'draft'
const dir = outputFolder(join(WORK, 'sheets'))
const capture = new Capture(cfg, a.format)
const temp = mkdtempSync(join(dir, '.frames-'))
try {
  if (a.keep) {
    for (const frame of frames) console.log((await capture.still(frame, tier, join(String(a.keep), 'f' + frame + '-' + tier + '.png'))).file)
    process.exit(0)
  }
  const file = a.out ?? join(dir, 'neptune.pick-' + tier + '.png')
  await capture.sheet(file, frames.map((frame) => ({ frame, label: String(frame) })), tier, temp, { pick: frames.join(',') }, Number(a.limit ?? cfg.raw.critics.maxImageLongEdgePx))
  console.log(file)
} finally {
  try { await capture.close() } finally { rmSync(temp, { recursive: true, force: true }) }
}
