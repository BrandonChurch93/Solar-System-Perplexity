import { createHash } from 'node:crypto'
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Page } from 'playwright-core'
import { DIST, ROOT, WORK, args, ensureBuild, loadConfig, machineId, requireDisk } from './lib/common'
import { WARM_SELF, toolHash, warmSelfFrames } from './gate/kept'
import { openCapture, pageFault, type Session } from './lib/browser'
import { makerLines, watchMakers } from './lib/makers'
import { judgedFrames, segmentAtFrame } from '../src/director/timeline'

// The warm start of the live player (kit/PROGRESS.md, second review note of 2026-11-23, plan H 3).
//   npm run warm -- [--first F] [--last L] [--format ID] [--rate 2] [--player] [--cold] [--write [--reset]] [--label NAME]
// Draws the frames first..last in film order the way the player does: showcase.ahead (loads and warm draws), showcase.renderFrame, showcase.counts.
// --rate 2 draws the half frames too, as a display faster than the film asks for them.
// Exit 1, with the frames and what they made, when a frame of a dive, a surface view, a rise or a travel made a program, uploaded a texture or made
// a buffer, or when the warm start itself did such work before one of them (after the first frame of the run). A piece starts at the first frame of a hold (or at frame 0), where the player is warm. --player takes the live page and the web assets
// instead of the capture page. --cold leaves the warm start out and only lists. --write adds every frame outside a hold that did work to
// src/core/warm.json as it is found and exits 0: run it, then run again without it. --reset first takes the frames first..last out of the list, for a stop that
// was rebuilt. Every line goes to out/work/warm/<label>.jsonl.
//   npm run warm -- --stills LABEL [--frames 100,200-210] [--format ID]
// The proof that a warm draw changes no pixel: before each still every warm frame that is due is drawn, and the hash of the still is compared with
// out/work/samebytes/LABEL/hashes.json (tools/samebytes.ts makes it from the same frames without the warm start). Exit 1 on any difference.
//   npm run warm -- --self
// The same proof in a small form, with nothing to prepare (gate G3): three frames of the first stop with a dive and frames in the list, each drawn on a fresh page and
// drawn again on another page after the warm start and after the other frames. Exit 1 on any difference. The last line says so when no warm draw was made.

interface Counts { programs: number; textures: number; buffers: number }
interface Api { memory(): { peakBytes: number; loaded: string[] }; png(): Promise<string>; setRate(rate: number): void; ahead(frame: number, tier: string, all?: boolean): Promise<number>; renderFrame(frame: number, tier: string): Promise<void>; counts(): Counts }

const cfg = loadConfig()
requireDisk(cfg)
const a = args()
const tier = a.tier ?? WARM_SELF.tier
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
const hashes = ensureBuild()

const open = (first: number): Promise<Session> => openCapture({ dist: DIST, format, assets: a.assets ?? (player ? 'web' : WARM_SELF.assets), mode: player ? 'live' : 'capture', query: player ? '&frame=' + first : '' })
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
  const { stop, frames, terrain } = warmSelfFrames(cfg.segments, listed().frames)
  const cold: string[] = []
  for (const f of frames) {
    const s = await open(f)
    cold.push((await still(s.page, f, false, [])).hash)
    await s.close()
  }
  const s = await open(frames[0]!)
  let differ = 0
  let drawn = 0
  const rows: { frame: number; cold: string; warm: string; drawn: number }[] = []
  const lines: string[] = []
  const say = (line: string): void => {
    lines.push(line)
    console.log(line)
  }
  for (const [i, f] of frames.entries()) {
    const r = await still(s.page, f, true, [terrain, ...frames.filter((x) => x !== f).reverse()])
    drawn += r.drawn
    const same = r.hash === cold[i]
    if (!same) differ++
    rows.push({ frame: f, cold: cold[i]!, warm: r.hash, drawn: r.drawn })
    say('frame ' + f + ' ' + (same ? 'identical' : 'DIFFERENT') + ' ' + cold[i]!.slice(0, 16) + ' ' + r.hash.slice(0, 16) + ' after ' + r.drawn + ' warm draws and 3 other frames')
  }
  await s.close()
  say(differ > 0 ? 'warm: FAIL' : drawn > 0 ? 'warm: pass' : 'warm: pass, but no warm draw was made (the list holds no frame of ' + stop + '), so nothing was proven')
  mkdirSync(join(WORK, 'warm'), { recursive: true })
  writeFileSync(join(WORK, 'warm', 'self.json'), JSON.stringify({ ok: differ === 0, stop, frames, terrain, format, tier, assets: a.assets ?? (player ? 'web' : WARM_SELF.assets), engineHash: hashes.engine, stopHashes: hashes.stops, tool: toolHash(ROOT, 'tools/warmcheck.ts'), machine: machineId(), rows, lines }, null, 1))
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
    console.log('frame ' + f + ' ' + segmentAtFrame(f).id + ' ' + r.hash.slice(0, 16) + ' after ' + r.drawn + ' warm draws, ' + drawn + ' on this page: ' + (other[key] === undefined ? 'not in ' + label : same ? 'same' : 'DIFFERENT'))
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
if (write && first !== 0 && segmentAtFrame(first).kind !== 'hold') {
  console.error('warm: --write starts at frame 0 or at a frame of a hold')
  process.exit(2)
}
const dir = join(WORK, 'warm')
mkdirSync(dir, { recursive: true })
const file = join(dir, label + '.jsonl')
writeFileSync(file, '')
const s = await open(first)
const bad: string[] = []
const found: number[] = []
const before = listed().frames.length
const t0 = Date.now()
let sets = 0
let peak = 0
try {
  await s.page.evaluate((r) => (window as unknown as { showcase: Api }).showcase.setRate(r), rate)
  await watchMakers(s.page)
  for (let i = first * rate; i <= last * rate; i++) {
    const f = i / rate
    const t = Date.now()
    const c = await s.page.evaluate(async ([index, frame, tr, warm, start]) => {
      const api = (window as unknown as { showcase: Api }).showcase
      const drawn = warm ? await api.ahead(frame as number, tr as string, start as boolean) : 0
      const before = api.counts()
      const made = (window as unknown as { made: string[] }).made
      made.length = 0
      await api.renderFrame(index as number, tr as string)
      return { ...api.counts(), drawn, before, sets: api.memory().loaded.length, peak: api.memory().peakBytes, made: made.slice(0, 400) }
    }, [i, f, tier, !cold, i === first * rate] as const)
    await usable(s.page, f)
    sets = Math.max(sets, c.sets)
    peak = Math.max(peak, c.peak)
    const seg = segmentAtFrame(f)
    const work = c.programs + c.textures + c.buffers > 0
    appendFileSync(file, JSON.stringify({ frame: f, segment: seg.id, programs: c.programs, textures: c.textures, buffers: c.buffers, warmed: c.drawn, ahead: c.before, sets: c.sets, ms: Date.now() - t, ...(work ? { made: makerLines(c.made) } : {}) }) + '\n')
    if (work) {
      const line = 'frame ' + f + ' ' + seg.id + ': programs ' + c.programs + ', textures ' + c.textures + ', buffers ' + c.buffers
      console.log(line)
      for (const m of makerLines(c.made)) console.log('  ' + m)
      if (guarded.includes(seg.kind)) bad.push(line)
      if (seg.kind !== 'hold') {
        found.push(f)
        if (write) {
          const was = listed()
          list(was.recipe, [...new Set([...was.frames, f])].sort((x, y) => x - y))
        }
      }
    }
    const early = i > first * rate && c.before.programs + c.before.textures + c.before.buffers > 0
    if (early && guarded.includes(seg.kind)) {
      const line = 'frame ' + f + ' ' + seg.id + ': the warm start made programs ' + c.before.programs + ', textures ' + c.before.textures + ', buffers ' + c.before.buffers
      console.log(line)
      bad.push(line)
    }
    if ((i - first * rate) % 300 === 299) console.log('at ' + f + ', ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s')
  }
} finally {
  await s.close()
}
console.log('frames ' + first + '..' + last + ' at ' + rate + ' pictures a film frame, ' + format + ', tier ' + tier + (player ? ', the player\'s path' : ', the capture path') + (cold ? ', cold' : ', warm start') + ': ' + bad.length + ' frames of a dive, surface view, rise or travel did work, ' + ((Date.now() - t0) / 60000).toFixed(1) + ' minutes')
console.log('at most ' + sets + ' sets loaded at a frame, peak ' + (peak / 1e6).toFixed(0) + ' MB of textures')
if (write) {
  console.log('src/core/warm.json: ' + before + ' frames before, ' + listed().frames.length + ' now, ' + found.length + ' found by this run')
} else if (!cold && bad.length > 0) {
  for (const line of bad) console.error('FAIL ' + line)
  process.exit(1)
}
