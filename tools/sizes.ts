import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, ROOT, WORK, args, ensureBuild, formatId, loadConfig, machineId, requireDisk } from './lib/common'
import { openCapture, renderPng, type Session } from './lib/browser'
import { padFrame } from './lib/render'
import { EVERY, PROPOSED, linesOf, movesOf, overOf, pairsOf, type Pair, type PairRow } from './sizes/pairs'

// The film's two sizes against each other, a report and not a gate (tools/sizes/pairs.ts says what it looks for and how it is read).
//   npx tsx tools/sizes.ts --stop ID [--kind dive|rise] [--every N] [--frames A-B] [--keep]
// Writes out/work/sizes/<stop>[-kind][-fA-B].json and .md with every number; keeps the pictures of a pair over the proposed limit only.

const cfg = loadConfig()
const a = args()
const stop = a.stop
if (!stop || !cfg.segments.some((s) => s.stop === stop)) {
  console.error('sizes: --stop ID, one of ' + [...new Set(cfg.segments.map((s) => s.stop).filter(Boolean))].join(', '))
  process.exit(2)
}
const kinds = a.kind ? [a.kind] : ['dive', 'rise']
const every = a.every === undefined ? EVERY : Number(a.every)
const span = a.frames ? a.frames.split('-').map(Number) : null
if (!Number.isInteger(every) || every < 1 || (span && (span.length !== 2 || span.some((v) => !Number.isInteger(v))))) {
  console.error('sizes: --every N, a whole number of film frames; --frames A-B, film frames')
  process.exit(2)
}
requireDisk(cfg)
const S = cfg.raw.smooth
const [bigId, filmId] = [formatId(cfg, S.parity.formats[0]), formatId(cfg, S.parity.formats[1])]
const factor = cfg.formats[bigId]!.width / cfg.formats[filmId]!.width
if (!Number.isInteger(factor) || factor < 2 || cfg.formats[bigId]!.height !== cfg.formats[filmId]!.height * factor) {
  console.error('sizes: ' + bigId + ' is not a whole multiple of ' + filmId)
  process.exit(2)
}
const tier: string = S.parity.tier
const moves = movesOf(cfg.segments, stop, kinds, S.reachFrames, cfg.frameCount)
if (moves.length === 0) {
  console.error('sizes: ' + stop + ' has no ' + kinds.join(' or '))
  process.exit(2)
}
ensureBuild()
const dir = join(WORK, 'sizes')
const frames = join(dir, stop, 'frames')
mkdirSync(frames, { recursive: true })
const fileOf = (frame: number, fmt: string): string => join(frames, 'f' + padFrame(frame) + '-' + tier + '-' + fmt + '.png')
const drawn: Record<string, number> = { [filmId]: 0, [bigId]: 0 }
const spent: Record<string, number> = { [filmId]: 0, [bigId]: 0 }

async function draw(pairs: Pair[], fmt: string): Promise<void> {
  let session: Session | null = null
  for (const p of pairs) {
    for (let attempt = 1; ; attempt++) {
      try {
        session ??= await openCapture({ dist: DIST, format: fmt, assets: 'full', diag: 'beauty' })
        const { png, seconds } = await renderPng(session.page, p.frame, tier)
        writeFileSync(fileOf(p.frame, fmt), png)
        drawn[fmt]!++
        spent[fmt]! += seconds
        break
      } catch (e) {
        await session?.close().catch(() => undefined)
        session = null
        if (attempt >= 3) throw e
        console.error('[sizes] ' + String(e).split('\n')[0]!.slice(0, 200) + '. Fresh page, try ' + (attempt + 1) + ' of 3')
      }
    }
  }
  await session?.close().catch(() => undefined)
}

const rows: PairRow[] = []
const t0 = Date.now()
for (const move of moves) {
  const pairs = pairsOf(move, every, span ? span[0]! : null, span ? span[1]! : null)
  if (pairs.length === 0) continue
  await draw(pairs, filmId)
  await draw(pairs, bigId)
  const read = JSON.parse(execFileSync('python3', [join(ROOT, 'tools/img/sizes.py')], { input: JSON.stringify({ scale: S.pictures.flowScale, patternPx: S.pictures.patternPx, patternFloor: S.pictures.patternFloor, pairs: pairs.map((p) => ({ film: fileOf(p.frame, filmId), big: fileOf(p.frame, bigId) })) }), encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'], maxBuffer: 1 << 26 })) as Omit<PairRow, keyof Pair>[]
  const got = pairs.map((p, i) => ({ ...p, ...read[i]! }))
  const kept = new Set(a.keep === 'true' ? got.map((row) => row.frame) : overOf(got, PROPOSED).map((row) => row.frame))
  for (const p of pairs) if (!kept.has(p.frame)) for (const fmt of [filmId, bigId]) rmSync(fileOf(p.frame, fmt), { force: true })
  rows.push(...got)
  const top = got.reduce((x, y) => ((y.pattern ?? -1) > (x.pattern ?? -1) ? y : x))
  console.log(stop + ' ' + move.kind + ': ' + got.length + ' pairs, largest ' + (top.pattern === null ? 'none' : top.pattern.toFixed(3) + ' at film frame ' + top.frame) + ', ' + Math.round((Date.now() - t0) / 1000) + ' s')
}

const seconds = Object.fromEntries([filmId, bigId].map((fmt) => [fmt, drawn[fmt]! > 0 ? Number((spent[fmt]! / drawn[fmt]!).toFixed(2)) : null]))
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
const told = { formats: [bigId, filmId] as [string, string], factor, tier, every, bandPx: [S.pictures.patternPx / 5, S.pictures.patternPx] as [number, number], machine: machineId(), seconds, commit }
const base = join(dir, stop + (a.kind ? '-' + a.kind : '') + (span ? '-f' + span[0] + '-' + span[1] : ''))
const over = overOf(rows, PROPOSED)
writeFileSync(base + '.json', JSON.stringify({ stop, ...told, proposed: PROPOSED, gate: false, minutes: Number(((Date.now() - t0) / 60000).toFixed(1)), moves, rows, over: over.map((row) => row.frame) }, null, 1))
writeFileSync(base + '.md', linesOf(stop, moves, rows, told).join('\n') + '\n')
console.log('sizes ' + stop + ': ' + rows.length + ' pairs, ' + (over.length === 0 ? 'none' : over.length) + ' over the proposed limit ' + PROPOSED + ' (not a gate). ' + base + '.md')
