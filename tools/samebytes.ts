import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { args, loadConfig, requireDisk, WORK } from './lib/common'
import { Capture, padFrame } from './lib/render'
import { judgedFrames } from '../src/director/timeline'

// Renders frames at one tier into out/work/samebytes/<label>/ and writes the hash of every PNG.
// With --against LABEL it compares the hashes with an earlier run and exits 1 on any difference.
const cfg = loadConfig()
requireDisk(cfg)
const a = args()
const label = a.label ?? 'now'
const tier = a.tier ?? 'draft'
const stops = a.stops ? a.stops.split(',') : null
const skip = a.skip ? a.skip.split(',') : []
let frames: number[]
if (a.frames) frames = a.frames.split(',').flatMap((part) => {
  const [x, y] = part.split('-').map(Number)
  return y === undefined ? [x!] : Array.from({ length: y - x! + 1 }, (_, i) => x! + i)
})
else frames = judgedFrames().filter((j) => (!stops || stops.includes(j.stop)) && !skip.includes(j.stop)).map((j) => j.frame)
const dir = join(WORK, 'samebytes', label)
mkdirSync(dir, { recursive: true })
const manifest = join(dir, 'hashes.json')
const hashes: Record<string, string> = existsSync(manifest) ? (JSON.parse(readFileSync(manifest, 'utf8')) as Record<string, string>) : {}
const capture = new Capture(cfg, a.format)
try {
  for (const frame of frames) {
    const file = join(dir, 'f' + padFrame(frame) + '-' + tier + '.png')
    const t0 = Date.now()
    await capture.still(frame, tier, file)
    hashes[frame + ':' + tier] = createHash('sha256').update(readFileSync(file)).digest('hex')
    writeFileSync(manifest, JSON.stringify(hashes, null, 1) + '\n')
    console.log('frame ' + frame + ' ' + hashes[frame + ':' + tier]!.slice(0, 16) + ' ' + ((Date.now() - t0) / 1000).toFixed(1) + 's')
  }
} finally {
  await capture.close()
}
if (a.against) {
  const other = JSON.parse(readFileSync(join(WORK, 'samebytes', a.against, 'hashes.json'), 'utf8')) as Record<string, string>
  let differ = 0
  let same = 0
  for (const frame of frames) {
    const key = frame + ':' + tier
    if (other[key] === undefined) console.log('frame ' + frame + ': not in ' + a.against)
    else if (other[key] !== hashes[key]) {
      differ++
      console.log('frame ' + frame + ': DIFFERENT')
    } else same++
  }
  console.log(same + ' frames the same bytes as ' + a.against + ', ' + differ + ' different')
  if (differ > 0) process.exit(1)
}
