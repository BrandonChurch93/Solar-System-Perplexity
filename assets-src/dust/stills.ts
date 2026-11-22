import { mkdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, resolve } from 'node:path'
import { args } from '../../tools/lib/common'
import { openCapture, renderPngFresh, type Session } from '../../tools/lib/browser'

const a = args()
const dist = resolve(a.dist ?? 'dist')
const tier = a.tier ?? 'draft'
const out = resolve(a.out ?? 'out/work/dust')
const frames: number[] = []
for (const part of String(a.frames).split(',')) {
  const [lo, hi] = part.split('-').map(Number)
  for (let f = lo!; f <= (hi ?? lo!); f++) frames.push(f)
}
mkdirSync(out, { recursive: true })
for (const frame of frames) {
  const held: { session?: Session } = {}
  const { png, seconds, samples } = await renderPngFresh(() => openCapture({ dist, format: '16x9', assets: 'full' }), held, frame, tier)
  const file = join(out, 'f' + String(frame).padStart(5, '0') + '-' + tier + '.png')
  writeFileSync(file, png)
  console.log(frame + ' ' + tier + ' ' + createHash('sha256').update(png).digest('hex') + ' ' + seconds.toFixed(1) + 's ' + samples)
  await held.session!.close()
}
