import { createHash } from 'node:crypto'
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Page } from 'playwright-core'
import { DIST, ROOT, WORK, args, ensureBuild, loadConfig, requireDisk } from './lib/common'
import { openCapture, pageFault, type Session } from './lib/browser'
import { judgedFrames, segmentAtFrame } from '../src/director/timeline'

// The warm start of the live player (kit/PROGRESS.md, second review note of 2026-11-23, plan H 3).
//   npm run warm -- [--first F] [--last L] [--format ID] [--rate 2] [--player] [--cold] [--write [--reset]] [--label NAME]
// Draws the frames first..last in film order the way the player does: showcase.ahead (loads and warm draws), showcase.renderFrame, showcase.counts.
// --rate 2 draws the half frames too, as a display faster than the film asks for them.
// Exit 1, with the frames and what they made, when a frame of a dive, a surface view, a rise or a travel made a program, uploaded a texture or made
// a buffer. A piece starts at the first frame of a hold (or at frame 0), where the player is warm. --player takes the live page and the web assets
// instead of the capture page. --cold leaves the warm start out and only lists. --write adds every frame outside a hold that did work to
// src/core/warm.json and exits 0: run it, then run again without it. --reset first takes the frames first..last out of the list, for a stop that
// was rebuilt. Every line goes to out/work/warm/<label>.jsonl.
//   npm run warm -- --stills LABEL [--frames 100,200-210] [--format ID]
// The proof that a warm draw changes no pixel: before each still every warm frame that is due is drawn, and the hash of the still is compared with
// out/work/samebytes/LABEL/hashes.json (tools/samebytes.ts makes it from the same frames without the warm start). Exit 1 on any difference.
//   npm run warm -- --self
// The same proof in a small form, with nothing to prepare (gate G3): three frames of the first stop with a dive and frames in the list, each drawn on a fresh page and
// drawn again on another page after the warm start and after the other frames. Exit 1 on any difference.

interface Counts { programs: number; textures: number; buffers: number }
interface Api { memory(): { peakBytes: number; loaded: string[] }; png(): Promise<string>; setRate(rate: number): void; ahead(frame: number, tier: string, all?: boolean): Promise<number>; renderFrame(frame: number, tier: string): Promise<void>; counts(): Counts }

const cfg = loadConfig()
requireDisk(cfg)
const a = args()
const tier = a.tier ?? 'draft'
const format = a.format ?? (a.stills ? cfg.formatKeys.master : cfg.formatKeys.preview)
const player = a.player === 'true'
const first = a.first ? Number(a.first) : 0
const last = a.last ? Number(a.last) : cfg.frameCount - 1
const table = join(ROOT, 'src/core/warm.json')
const listed = (): { recipe: string; frames: number[] } => JSON.parse(readFileSync(table, 'utf8')) as { recipe: string; frames: number[] }
const list = (recipe: string, frames: number[]): void => writeFileSync(table, '{\n  "recipe": ' + JSON.stringify(recipe) + ',\n  "frames": [' + frames.join(', ') + ']\n}\n')
if (a.write === 'true' && a.reset === 'true') {
  const was = listed()
  list(was.recipe, was.frames.filter((f) => f < first || f >= last + 1))
}
ensureBuild()

const open = (first: number): Promise<Session> => openCapture({ dist: DIST, format, assets: a.assets ?? (player ? 'web' : 'full'), mode: player ? 'live' : 'capture', query: player ? '&frame=' + first : '' })
const sha = (b64: string): string => createHash('sha256').update(Buffer.from(b64, 'base64')).digest('hex')

async function usable(page: Page, frame: number): Promise<void> {
  const fault = await pageFault(page)
  if (fault) throw new Error('frame ' + frame + ' is not usable: ' + fault)
}

async function still(page: Page, frame: number, warm: boolean, others: number[]): Promise<{ hash: string; drawn: number }> {
  const r = await page.evaluate(async ([f, tr, w, more]) => {
    const api = (window as unknown as { showcase: Api }).showcase
    const drawn = w ? await api.ahead(f as number, tr as string, true) : 0
    for (const o of more as number[]) await api.renderFrame(o, tr as string)
    await api.renderFrame(f as number, tr as string)
    return { drawn, png: await api.png() }
  }, [frame, tier, warm, others] as const)
  await usable(page, frame)
  return { hash: sha(r.png), drawn: r.drawn }
}

async function self(): Promise<never> {
  const dives = cfg.segments.filter((x) => x.kind === 'dive')
  const dive = dives.find((x) => listed().frames.some((f) => segmentAtFrame(f).stop === x.stop)) ?? dives[0]!
  const of = (kind: string): number => {
    const x = cfg.segments.find((y) => y.stop === dive.stop && y.kind === kind)!
    return x.firstFrame + Math.floor(x.frames / 2)
  }
  const frames = [dive.firstFrame, of('rise'), of('travel')]
  const cold: string[] = []
  for (const f of frames) {
    const s = await open(f)
    cold.push((await still(s.page, f, false, [])).hash)
    await s.close()
  }
  const s = await open(frames[0]!)
  let differ = 0
  for (const [i, f] of frames.entries()) {
    const r = await still(s.page, f, true, [of('terrain'), ...frames.filter((x) => x !== f).reverse()])
    const same = r.hash === cold[i]
    if (!same) differ++
    console.log('frame ' + f + ' ' + (same ? 'identical' : 'DIFFERENT') + ' ' + cold[i]!.slice(0, 16) + ' ' + r.hash.slice(0, 16) + ' after ' + r.drawn + ' warm draws and 3 other frames')
  }
  await s.close()
  console.log(differ === 0 ? 'warm: pass' : 'warm: FAIL')
  process.exit(differ === 0 ? 0 : 1)
}

async function stills(label: string): Promise<never> {
  const frames = a.frames ? a.frames.split(',').flatMap((part) => {
    const [x, y] = part.split('-').map(Number)
    return y === undefined ? [x!] : Array.from({ length: y - x! + 1 }, (_, i) => x! + i)
  }) : judgedFrames().map((j) => j.frame)
  const other = JSON.parse(readFileSync(join(WORK, 'samebytes', label, 'hashes.json'), 'utf8')) as Record<string, string>
  const out = join(WORK, 'samebytes', label + '-warm')
  mkdirSync(out, { recursive: true })
  const hashes: Record<string, string> = {}
  let differ = 0
  let drawn = 0
  const s = await open(frames[0]!)
  for (const f of frames) {
    const r = await still(s.page, f, true, [])
    const key = f + ':' + tier
    hashes[key] = r.hash
    writeFileSync(join(out, 'hashes.json'), JSON.stringify(hashes, null, 1) + '\n')
    drawn += r.drawn
    const same = other[key] === r.hash
    if (!same) differ++
    console.log('frame ' + f + ' ' + r.hash.slice(0, 16) + ' after ' + r.drawn + ' warm draws: ' + (other[key] === undefined ? 'not in ' + label : same ? 'same' : 'DIFFERENT'))
  }
  await s.close()
  console.log(frames.length + ' stills after ' + drawn + ' warm draws, ' + differ + ' not the same bytes as ' + label)
  process.exit(differ > 0 ? 1 : 0)
}

if (a.self === 'true') await self()
if (a.stills) await stills(a.stills)

const cold = a.cold === 'true'
const write = a.write === 'true'
const rate = a.rate ? Number(a.rate) : 1
const label = a.label ?? (cold ? 'cold' : 'warm')
const guarded = ['dive', 'terrain', 'rise', 'travel']
if (write && first !== 0 && !(segmentAtFrame(first).kind === 'hold' && segmentAtFrame(first).firstFrame === first)) {
  console.error('warm: --write starts at frame 0 or at the first frame of a hold')
  process.exit(2)
}
const dir = join(WORK, 'warm')
mkdirSync(dir, { recursive: true })
const file = join(dir, label + '.jsonl')
writeFileSync(file, '')
const s = await open(first)
const bad: string[] = []
const found: number[] = []
const t0 = Date.now()
let sets = 0
let peak = 0
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
      return { ...api.counts(), drawn, before, sets: api.memory().loaded.length, peak: api.memory().peakBytes }
    }, [i, f, tier, !cold, i === first * rate] as const)
    await usable(s.page, f)
    sets = Math.max(sets, c.sets)
    peak = Math.max(peak, c.peak)
    const seg = segmentAtFrame(f)
    const work = c.programs + c.textures + c.buffers > 0
    appendFileSync(file, JSON.stringify({ frame: f, segment: seg.id, programs: c.programs, textures: c.textures, buffers: c.buffers, warmed: c.drawn, ahead: c.before, sets: c.sets, ms: Date.now() - t }) + '\n')
    if (work) {
      const line = 'frame ' + f + ' ' + seg.id + ': programs ' + c.programs + ', textures ' + c.textures + ', buffers ' + c.buffers
      console.log(line)
      if (guarded.includes(seg.kind)) bad.push(line)
      if (seg.kind !== 'hold') found.push(f)
    }
    if ((i - first * rate) % 300 === 299) console.log('at ' + f + ', ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s')
  }
} finally {
  await s.close()
}
console.log('frames ' + first + '..' + last + ' at ' + rate + ' pictures a film frame, ' + format + ', tier ' + tier + (player ? ', the player\'s path' : ', the capture path') + (cold ? ', cold' : ', warm start') + ': ' + bad.length + ' frames of a dive, surface view, rise or travel did work, ' + ((Date.now() - t0) / 60000).toFixed(1) + ' minutes')
console.log('at most ' + sets + ' sets loaded at a frame, peak ' + (peak / 1e6).toFixed(0) + ' MB of textures')
if (write) {
  const was = listed()
  const frames = [...new Set([...was.frames, ...found])].sort((x, y) => x - y)
  list(was.recipe, frames)
  console.log('src/core/warm.json: ' + was.frames.length + ' frames before, ' + frames.length + ' now')
} else if (!cold && bad.length > 0) {
  for (const line of bad) console.error('FAIL ' + line)
  process.exit(1)
}
