import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { args, loadConfig, requireDisk, WORK } from '../../tools/lib/common'
import { Capture, padFrame } from '../../tools/lib/render'
import { beltSegment } from '../../src/space/belt/motion'

const cfg = loadConfig()
requireDisk(cfg)
const a = args()
const seg = beltSegment()
const tier = a.tier ?? 'review'
const step = Number(a.step ?? 3)
const name = a.name ?? 'sheet-' + tier
const dir = join(WORK, 'belt', name)
const capture = new Capture(cfg, a.format)
const files: string[] = []
try {
  const list = a.frames ? String(a.frames).split(',').map(Number) : Array.from({ length: Math.ceil(seg.frames / step) }, (_, n) => seg.firstFrame + n * step)
  for (const frame of list) {
    const file = join(dir, 'f' + padFrame(frame) + '.png')
    const out = await capture.still(frame, tier, file)
    files.push(file)
    console.log(file + ' ' + JSON.stringify(out.record.extra ?? {}))
  }
} finally {
  await capture.close()
}
execFileSync('python3', ['assets-src/belt/sheet.py', join(dir, 'sheet.jpg'), ...files], { stdio: 'inherit' })
console.log(join(dir, 'sheet.jpg'))
