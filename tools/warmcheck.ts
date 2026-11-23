import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, ROOT, WORK, args, ensureBuild, loadConfig, requireDisk } from './lib/common'
import { openCapture, pageFault } from './lib/browser'
import { segmentAtFrame } from '../src/director/timeline'

interface Counts { programs: number; textures: number; buffers: number }
interface Api { setRate(rate: number): void; ahead(frame: number, tier: string, all?: boolean): Promise<number>; renderFrame(frame: number, tier: string): Promise<void>; counts(): Counts }

// The warm start of the live player (kit/PROGRESS.md, second review note of 2026-11-23, plan H 3).
//   npm run warm -- [--first F] [--last L] [--format ID] [--rate 2] [--player] [--cold] [--write] [--label NAME]
// Draws the frames first..last in film order the way the player does: showcase.ahead (loads and warm draws), showcase.renderFrame, showcase.counts.
// --rate 2 draws the half frames too, as a display faster than the film asks for them.
// Exit 1 when a frame of a dive, a rise or a travel made a program, uploaded a texture or made a buffer. A piece starts at the first frame of a hold
// (or at frame 0), where the player is warm. --player takes the live page and the web assets instead of the capture page. --cold leaves the warm
// start out and only lists. --write adds every frame outside a hold that did work to src/core/warm.json and exits 0: run it, then run again without
// it. Every line goes to out/work/warm/<label>.jsonl.

const cfg = loadConfig()
requireDisk(cfg)
const a = args()
const tier = a.tier ?? 'draft'
const format = a.format ?? cfg.formatKeys.preview
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
