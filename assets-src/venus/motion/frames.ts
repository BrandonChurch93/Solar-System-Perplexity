import { join } from 'node:path'
import { args, loadConfig } from '../../../tools/lib/common'
import { Capture, outputFolder } from '../../../tools/lib/render'

const a = args()
const cfg = loadConfig()
const tier = a.tier ?? 'draft'
const dir = outputFolder(a.out ?? 'out/work/venus/frames')
const capture = new Capture(cfg, a.format)
const list = (a.frames ?? '').split(',').flatMap((part) => {
  const [from, to, step] = part.split(':').map(Number)
  if (from === undefined || Number.isNaN(from)) return []
  const out: number[] = []
  for (let f = from; f <= (to ?? from); f += step ?? 1) out.push(f)
  return out
})
try {
  for (const frame of list) {
    const r = await capture.still(frame, tier, join(dir, (a.name ?? 'f') + '-' + frame + '.png'))
    console.log(frame, r.record.extra?.samples ?? '', r.file)
  }
} finally {
  await capture.close()
}
