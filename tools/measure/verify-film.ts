import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { WORK, args, ensureBuild, loadConfig, readRecord, requireDisk } from '../lib/common'
import { openSource } from '../lib/frames'
import { decodeFramePng, probeVideo, psnrPng } from '../lib/encode'

const cfg = loadConfig()
const a = args()
const file = a.film
if (!file) throw new Error('--film path is required')
const rec = readRecord(file)
if (!rec) throw new Error('no record beside ' + file)
requireDisk(cfg)
ensureBuild()
const segs = (rec.extra?.segments as string[]) ?? []
const map: number[] = []
for (const id of segs) {
  const s = cfg.segments.find((x) => x.id === id)
  if (s) for (let f = s.firstFrame; f < s.endFrame; f++) map.push(f)
}
if (map.length === 0) for (let f = rec.first ?? 0; f <= (rec.last ?? 0); f++) map.push(f)
const p = probeVideo(file)
console.log('ffprobe: ' + p?.frames + ' frames, ' + p?.width + 'x' + p?.height + ' ' + p?.fps + ' ' + p?.profile + ' ' + p?.pixFmt + ' ' + p?.colorSpace + ' ' + p?.colorRange + '; record says ' + map.length)
const picks = a.frames ? a.frames.split(',').map(Number) : [0, Math.floor(map.length / 3), Math.floor((2 * map.length) / 3), map.length - 1].map((i) => map[i]!)
const src = await openSource({ format: rec.format, assets: rec.assets })
const dir = join(WORK, 'tmp', 'verify')
mkdirSync(dir, { recursive: true })
let worst = Infinity
for (const f of picks) {
  const i = map.indexOf(f)
  if (i < 0) throw new Error('frame ' + f + ' is not in this film')
  const g = await src.render(f, rec.tier, 'png', false)
  const still = join(dir, 'still-' + f + '.png')
  writeFileSync(still, g.data!)
  const dec = join(dir, 'dec-' + f + '.png')
  decodeFramePng(file, i, dec)
  const v = psnrPng(dec, still)
  worst = Math.min(worst, v)
  console.log('frame ' + f + ' (film index ' + i + '): PSNR ' + v.toFixed(2) + ' dB')
}
await src.close()
console.log('frame count ' + (p?.frames === map.length ? 'exact' : 'WRONG') + ', worst PSNR ' + worst.toFixed(2) + ' dB')
