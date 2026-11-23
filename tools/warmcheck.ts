import { createHash } from 'node:crypto'
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, ROOT, WORK, args, ensureBuild, loadConfig, requireDisk } from './lib/common'
import { openCapture, pageFault } from './lib/browser'
import { judgedFrames, segmentAtFrame } from '../src/director/timeline'

interface Counts { programs: number; textures: number; buffers: number }
interface Api { png(): Promise<string>; setRate(rate: number): void; ahead(frame: number, tier: string, all?: boolean): Promise<number>; renderFrame(frame: number, tier: string): Promise<void>; counts(): Counts }

// The warm start of the live player (kit/PROGRESS.md, second review note of 2026-11-23, plan H 3).
//   npm run warm -- [--first F] [--last L] [--format ID] [--rate 2] [--player] [--cold] [--write] [--label NAME]
// Draws the frames first..last in film order the way the player does: showcase.ahead (loads and warm draws), showcase.renderFrame, showcase.counts.
// --rate 2 draws the half frames too, as a display faster than the film asks for them.
// Exit 1 when a frame of a dive, a rise or a travel made a program, uploaded a texture or made a buffer. A piece starts at the first frame of a hold
// (or at frame 0), where the player is warm. --player takes the live page and the web assets instead of the capture page. --cold leaves the warm
// start out and only lists. --write adds every frame outside a hold that did work to src/core/warm.json and exits 0: run it, then run again without
// it. Every line goes to out/work/warm/<label>.jsonl.
//   npm run warm -- --stills LABEL [--frames 100,200-210] [--format ID]
// The proof that a warm draw changes no pixel: before each still every warm frame that is due is drawn, and the hash of the still is compared with
// out/work/samebytes/LABEL/hashes.json (tools/samebytes.ts makes it from the same frames without the warm start). Exit 1 on any difference.

const cfg = loadConfig()
requireDisk(cfg)
const a = args()
const tier = a.tier ?? 'draft'
const format = a.format ?? (a.stills ? cfg.formatKeys.master : cfg.formatKeys.preview)
const first = a.first ? Number(a.first) : 0
const last = a.last ? Number(a.last) : cfg.frameCount - 1
const cold = a.cold === 'true'
const rate = a.rate ? Number(a.rate) : 1
const label = a.label ?? (cold ? 'cold' : 'warm')
const guarded = ['dive', 'rise', 'travel']
const dir = join(WORK, 'warm')
mkdirSync(dir, { recursive: true })
const file = join(dir, label + '.jsonl')
writeFileSync(file, '')
ensureBuild()
const player = a.player === 'true'
const s = await openCapture({ dist: DIST, format, assets: a.assets ?? (player ? 'web' : 'full'), mode: player ? 'live' : 'capture', query: player ? '&frame=' + first : '' })
if (a.stills) {
  const frames = a.frames ? a.frames.split(',').flatMap((part) => {
    const [x, y] = part.split('-').map(Number)
    return y === undefined ? [x!] : Array.from({ length: y - x! + 1 }, (_, i) => x! + i)
  }) : judgedFrames().map((j) => j.frame)
  const other = JSON.parse(readFileSync(join(WORK, 'samebytes', a.stills, 'hashes.json'), 'utf8')) as Record<string, string>
  const out = join(WORK, 'samebytes', a.stills + '-warm')
  mkdirSync(out, { recursive: true })
  const hashes: Record<string, string> = {}
  let differ = 0
  let drawnAll = 0
  for (const f of frames) {
    const r = await s.page.evaluate(async ([frame, tr]) => {
      const api = (window as unknown as { showcase: Api }).showcase
      const drawn = await api.ahead(frame as number, tr as string, true)
      await api.renderFrame(frame as number, tr as string)
      return { drawn, png: await api.png() }
    }, [f, tier] as const)
    const fault = await pageFault(s.page)
    if (fault) throw new Error('frame ' + f + ' is not usable: ' + fault)
    const key = f + ':' + tier
    hashes[key] = createHash('sha256').update(Buffer.from(r.png, 'base64')).digest('hex')
    writeFileSync(join(out, 'hashes.json'), JSON.stringify(hashes, null, 1) + '\n')
    drawnAll += r.drawn
    const same = other[key] === hashes[key]
    if (!same) differ++
    console.log('frame ' + f + ' ' + hashes[key]!.slice(0, 16) + ' after ' + r.drawn + ' warm draws: ' + (other[key] === undefined ? 'not in ' + a.stills : same ? 'same' : 'DIFFERENT'))
  }
  await s.close()
  console.log(frames.length + ' stills after ' + drawnAll + ' warm draws, ' + differ + ' not the same bytes as ' + a.stills)
  process.exit(differ > 0 ? 1 : 0)
}
const bad: string[] = []
const found: number[] = []
const t0 = Date.now()
try {
  await s.page.evaluate((r) => (window as unknown as { showcase: Api }).showcase.setRate(r), rate)
  for (let i = first * rate; i <= last * rate; i++) {
    const f = i / rate
    const t = Date.now()
    const c = await s.page.evaluate(async ([index, frame, tr, warm, start]) => {
      const api = (window as unknown as { showcase: Api }).showcase
      const drawn = warm ? await api.ahead(frame as number, tr as string, start as boolean) : 0
      const before = api.counts()
      await api.renderFrame(index as number, tr as string)
      return { ...api.counts(), drawn, before }
    }, [i, f, tier, !cold, i === first * rate] as const)
    const fault = await pageFault(s.page)
    if (fault) throw new Error('frame ' + f + ' is not usable: ' + fault)
    const seg = segmentAtFrame(f)
    const work = c.programs + c.textures + c.buffers > 0
    appendFileSync(file, JSON.stringify({ frame: f, segment: seg.id, programs: c.programs, textures: c.textures, buffers: c.buffers, warmed: c.drawn, ahead: c.before, ms: Date.now() - t }) + '\n')
    if (work) {
      const line = 'frame ' + f + ' ' + seg.id + ': programs ' + c.programs + ', textures ' + c.textures + ', buffers ' + c.buffers
      console.log(line)
      if (guarded.includes(seg.kind)) bad.push(line)
      if (seg.kind !== 'hold' && f !== first) found.push(f)
    }
    if ((i - first * rate) % 300 === 299) console.log('at ' + f + ', ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s')
  }
} finally {
  await s.close()
}
console.log('frames ' + first + '..' + last + ' at ' + rate + ' pictures a film frame, ' + format + ', tier ' + tier + (player ? ', the player\'s path' : ', the capture path') + (cold ? ', cold' : ', warm start') + ': ' + bad.length + ' frames of a dive, rise or travel did work')
if (a.write === 'true') {
  const table = join(ROOT, 'src/core/warm.json')
  const was = JSON.parse(readFileSync(table, 'utf8')) as { recipe: string; frames: number[] }
  const old = was.frames
  const frames = [...new Set([...old, ...found])].sort((x, y) => x - y)
  writeFileSync(table, '{\n  "recipe": ' + JSON.stringify(was.recipe) + ',\n  "frames": [' + frames.join(', ') + ']\n}\n')
  console.log('src/core/warm.json: ' + old.length + ' frames before, ' + frames.length + ' now')
} else if (!cold && bad.length > 0) {
  for (const line of bad) console.error('FAIL ' + line)
  process.exit(1)
}
