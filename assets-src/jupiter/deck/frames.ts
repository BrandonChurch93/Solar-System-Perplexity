import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { args, loadConfig, requireDisk, WORK } from '../../../tools/lib/common'
import { Capture, padFrame } from '../../../tools/lib/render'

const cfg = loadConfig()
requireDisk(cfg)
const a = args()
const tier = a.tier ?? 'draft'
const dir = join(WORK, 'jupiter', 'frames', String(a.name ?? tier))
mkdirSync(dir, { recursive: true })
const list = String(a.frames).split(',').map((s) => Number(s))
const capture = new Capture(cfg, a.format)
try {
  for (const frame of list) {
    const t0 = process.hrtime.bigint()
    const file = join(dir, 'f' + padFrame(frame) + '.png')
    await capture.still(frame, tier, file)
    console.log(file, (Number(process.hrtime.bigint() - t0) / 1e9).toFixed(1) + 's')
  }
} finally {
  await capture.close()
}
