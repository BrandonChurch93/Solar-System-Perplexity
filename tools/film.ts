import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Config } from '../src/config'
import { WORK, args, ensureBuild, formatId, loadConfig, machineId, readRecord, recordMatches, requireDisk, writeRecord, type OutputRecord } from './lib/common'
import type { Hashes } from './lib/hashes'
import { PageFailure, openSource, type FrameSource, type GrabMode } from './lib/frames'
import { X264_LEVEL, X264_PRESET, concatCopy, encodeTwoPass, openIntermediate, probeVideo, rateFor, rgbToYuvFilter, tempDir, x264Args, yuvScaleFilter } from './lib/encode'
import { segmentAtFrame, setsForFrame } from '../src/director/timeline'

export interface G5Frame { frame: number; invalid: number; coverage: number }
export interface Unit { id: string; first: number; end: number; dir?: string; span?: boolean }
interface Part { file: string; rec: OutputRecord }
export interface Job {
  cfg: Config
  hashes: Hashes
  format: string
  tier: string
  assets: string
  budgetMinutes: number
  grab: Exclude<GrabMode, 'none'>
  logFile: string
  keepPng?: { frames: Set<number>; dir: string; name: (frame: number) => string }
  source?: FrameSource
  browser?: string
}

export function chunkDir(job: Pick<Job, 'format' | 'tier' | 'assets'>): string {
  return join(WORK, 'chunks', job.format + '-' + job.tier + '-' + job.assets + (process.env.GT_HALF === '1' ? '-half' : ''))
}

export function unitDir(job: Job, u: Unit): string {
  return u.dir ?? chunkDir(job)
}

export function unitStops(u: { first: number; end: number }): string[] {
  const s = new Set<string>()
  for (let f = u.first; f < u.end; f++) for (const id of setsForFrame(f)) s.add(id)
  return [...s]
}

export function wanted(job: Job, extra: Partial<OutputRecord> = {}): OutputRecord {
  return { engineHash: job.hashes.engine, stopHashes: job.hashes.stops, format: job.format, tier: job.tier, assets: job.assets, diag: 'beauty', browser: job.browser ?? '', machine: machineId(), ...extra }
}

export function g5Failed(cfg: Config, frames: G5Frame[]): number[] {
  const min = cfg.raw.detail.minBodyCoverage
  const out: number[] = []
  for (const g of frames) {
    const s = segmentAtFrame(g.frame)
    if (s.id === cfg.endingId + '.fade' || s.kind === 'fade') continue
    if (g.invalid !== 0 || ((s.kind === 'hold' || s.kind === 'terrain') && g.coverage < min)) out.push(g.frame)
  }
  return out
}

export function log(job: Job, line: string): void {
  mkdirSync(join(WORK, 'logs'), { recursive: true })
  appendFileSync(job.logFile, new Date().toISOString() + ' ' + line + '\n')
  process.stdout.write(line + '\n')
}

function partName(u: Unit, n: number): string {
  return u.id + '.part' + String(n).padStart(3, '0') + '.mp4'
}

export function chunkFile(job: Job, u: Unit): string {
  return join(unitDir(job, u), u.id + '.mp4')
}

export function chunkReady(job: Job, u: Unit): boolean {
  const r = readRecord(chunkFile(job, u))
  return recordMatches(r, wanted(job), unitStops(u)) && r!.first === u.first && r!.last === u.end - 1
}

function spanFile(job: Job, u: Unit): string {
  return join(unitDir(job, u), u.id + '.span' + u.first + '-' + (u.end - 1) + '.mp4')
}

function existingParts(job: Job, u: Unit): Part[] {
  const dir = unitDir(job, u)
  if (!existsSync(dir)) return []
  const re = new RegExp('^' + u.id.replace(/[.]/g, '\\.') + '\\.(part\\d+|span\\d+-\\d+)\\.mp4$')
  const stops = unitStops(u)
  const drop = (file: string): void => {
    rmSync(file, { force: true })
    rmSync(file + '.json', { force: true })
  }
  const good: Part[] = []
  for (const n of readdirSync(dir).filter((x) => re.test(x))) {
    const file = join(dir, n)
    const rec = readRecord(file)
    if (!rec || rec.first === undefined || rec.last === undefined || !recordMatches(rec, wanted(job), stops)) drop(file)
    else if (!u.span || (rec.first >= u.first && rec.last < u.end)) good.push({ file, rec })
  }
  good.sort((a, b) => a.rec.first! - b.rec.first!)
  const out: Part[] = []
  let next = u.first
  for (const p of good) {
    if (p.rec.first !== next || p.rec.last! >= u.end) throw new Error('parts of ' + u.id + ' do not line up: frame ' + next + ' is expected next and ' + p.file + ' holds ' + p.rec.first + ' to ' + p.rec.last + '. Add the missing parts or remove the ones after the gap')
    out.push(p)
    next = p.rec.last! + 1
  }
  return out
}

function encodeSettings(job: Job): Record<string, unknown> {
  const rate = rateFor(job.cfg, job.format)
  return { codec: 'libx264', preset: X264_PRESET, level: X264_LEVEL, twoPass: true, intermediate: 'ffv1 gbrp lossless', rate, filter: rgbToYuvFilter(), args: x264Args(job.cfg.fps, rate).join(' ') }
}

let current: { kill(): void } | null = null
for (const sig of ['SIGINT', 'SIGTERM'] as const)
  process.on(sig, () => {
    current?.kill()
    process.stderr.write('stopped by ' + sig + '; rerun to continue from the first missing frame\n')
    process.exit(130)
  })

async function source(job: Job): Promise<FrameSource> {
  if (!job.source) {
    job.source = await openSource({ format: job.format, assets: job.assets })
    job.browser = job.source.session.browserVersion
  }
  return job.source
}

export async function renderUnits(job: Job, units: Unit[]): Promise<void> {
  const cfg = job.cfg
  const todo = units.filter((u) => !chunkReady(job, u))
  const parts = new Map(todo.map((u) => [u.id, existingParts(job, u)]))
  const remaining = (): number => todo.reduce((n, u) => {
    const p = parts.get(u.id)!
    return n + (u.end - (p.length ? p[p.length - 1]!.rec.last! + 1 : u.first))
  }, 0)
  let left = remaining()
  if (todo.length) log(job, 'film: ' + todo.length + ' units to render, ' + left + ' frames, ' + job.format + ' ' + job.tier + ' ' + job.assets)
  const budget = job.budgetMinutes * 60 * 0.7
  const maxFrames = cfg.raw.sandbox.maxFramesOnDisk
  const rate = rateFor(cfg, job.format)
  let spent = 0
  let doneAll = 0
  for (const u of todo) {
    const have = parts.get(u.id)!
    let next = have.length ? have[have.length - 1]!.rec.last! + 1 : u.first
    while (next < u.end) {
      requireDisk(cfg)
      const src = await source(job)
      const n = have.length
      const name = partName(u, n)
      const tmp = join(tempDir(WORK, 'film'), name.replace(/\.mp4$/, '.mkv'))
      const it = openIntermediate(tmp, src.width, src.height, cfg.fps, job.grab)
      current = it
      const g5: G5Frame[] = []
      const t0 = Date.now()
      let f = next
      let sanitySeconds = 0
      let grabSeconds = 0
      try {
        for (; f < u.end; f++) {
          const g = await src.render(f, job.tier, job.grab, true)
          sanitySeconds += g.sanitySeconds
          grabSeconds += g.grabSeconds
          await it.write(g.data!)
          if (job.keepPng?.frames.has(f)) {
            const png = job.grab === 'png' ? g.data! : (await src.render(f, job.tier, 'png', false)).data!
            mkdirSync(job.keepPng.dir, { recursive: true })
            writeFileSync(join(job.keepPng.dir, job.keepPng.name(f)), png)
          }
          g5.push({ frame: f, invalid: g.invalid, coverage: Number(g.coverage.toFixed(5)) })
          doneAll++
          left--
          const el = (Date.now() - t0) / 1000
          const spf = (spent + el) / doneAll
          if ((f - next + 1) % 10 === 0) log(job, u.id + ' frame ' + f + ' part ' + n + ': ' + (f - u.first + 1) + '/' + (u.end - u.first) + ' done, ' + spf.toFixed(2) + ' s/frame (sanity ' + (sanitySeconds / (f - next + 1)).toFixed(3) + ', grab ' + (grabSeconds / (f - next + 1)).toFixed(3) + '), about ' + Math.ceil((left * spf) / 60) + ' min left')
          if (f + 1 < u.end && (it.frames >= maxFrames || (u.end - (f + 1) >= cfg.fps && el > budget))) {
            f++
            break
          }
        }
        if (f > u.end) f = u.end
      } catch (e) {
        it.kill()
        if (e instanceof PageFailure) {
          log(job, 'FAILED: ' + e.message + '. Nothing of this part was kept; rerun the same command to continue from frame ' + next)
          process.exit(3)
        }
        throw e
      }
      await it.end()
      current = null
      const renderSeconds = (Date.now() - t0) / 1000
      spent += renderSeconds
      const t1 = Date.now()
      const file = join(unitDir(job, u), name)
      encodeTwoPass(tmp, file, { fps: cfg.fps, rate, filter: rgbToYuvFilter(), passlog: join(tempDir(WORK, 'film'), name + '.pass') })
      rmSync(tmp, { force: true })
      const encodeSeconds = (Date.now() - t1) / 1000
      const rec = wanted(job, { first: next, last: f - 1, extra: { unit: u.id, part: n, g5, renderSeconds, encodeSeconds, sanitySecondsPerFrame: sanitySeconds / g5.length, grabSecondsPerFrame: grabSeconds / g5.length, grab: job.grab, encode: encodeSettings(job) } })
      writeRecord(file, rec)
      have.push({ file, rec })
      log(job, 'wrote ' + name + ' frames ' + next + '-' + (f - 1) + ' render ' + renderSeconds.toFixed(0) + ' s encode ' + encodeSeconds.toFixed(1) + ' s')
      next = f
    }
    buildChunk(job, u, have)
  }
}

function buildChunk(job: Job, u: Unit, have: Part[]): void {
  const file = u.span ? spanFile(job, u) : chunkFile(job, u)
  if (have.length === 1 && have[0]!.file === file) return
  if (have.length === 1) {
    rmSync(file, { force: true })
    writeFileSync(file, readFileSync(have[0]!.file))
  } else concatCopy(have.map((p) => p.file), file, false)
  const g5 = have.flatMap((p) => (p.rec.extra?.g5 as G5Frame[]) ?? [])
  const p = probeVideo(file)
  const frames = u.end - u.first
  if (!p || p.frames !== frames || g5.length !== frames) throw new Error('chunk ' + u.id + ' has ' + (p?.frames ?? 0) + ' frames and ' + g5.length + ' G5 results, expected ' + frames)
  const machines = [...new Set(have.map((x) => x.rec.machine))]
  const browsers = [...new Set(have.map((x) => x.rec.browser))]
  writeRecord(file, { ...have[0]!.rec, browser: browsers.join(', '), machine: machines.join(', '), first: u.first, last: u.end - 1, extra: { unit: u.id, parts: have.length, g5, machines, encode: have[0]!.rec.extra?.encode } })
  for (const x of have) {
    rmSync(x.file, { force: true })
    rmSync(x.file + '.json', { force: true })
  }
  log(job, (u.span ? 'span ' + file : 'chunk ' + u.id + '.mp4') + ' ready from ' + have.length + ' part(s), ' + frames + ' frames')
}

export function joinUnits(job: Job, units: Unit[], out: string, extra: Record<string, unknown> = {}): OutputRecord {
  const ready = units.filter((u) => chunkReady(job, u))
  if (ready.length === 0) throw new Error('no chunks with matching records to join')
  const recs = ready.map((u) => readRecord(chunkFile(job, u))!)
  const timing = concatCopy(ready.map((u) => chunkFile(job, u)), out, true)
  const g5 = recs.flatMap((r) => (r.extra?.g5 as G5Frame[]) ?? [])
  const frameCount = ready.reduce((n, u) => n + u.end - u.first, 0)
  const p = probeVideo(out)
  if (!p || p.frames !== frameCount) throw new Error('joined film has ' + (p?.frames ?? 0) + ' frames, expected ' + frameCount)
  const machines = [...new Set(recs.flatMap((r) => (r.extra?.machines as string[]) ?? [r.machine]))]
  const browsers = [...new Set(recs.map((r) => r.browser))]
  const gaps = units.filter((u) => !ready.includes(u)).map((u) => u.id)
  const rec: OutputRecord = {
    ...wanted(job),
    browser: browsers.join(', '),
    machine: machines.join(', '),
    first: ready[0]!.first,
    last: ready[ready.length - 1]!.end - 1,
    extra: { frameCount, segments: ready.map((u) => u.id), missing: gaps, machines, g5: { frames: g5, failed: g5Failed(job.cfg, g5) }, encode: recs[0]!.extra?.encode, probe: p, timing: { evenDecodeTimes: true, packetsRewritten: timing.fixed, reorderFrames: timing.delay }, ...extra },
  }
  writeRecord(out, rec)
  return rec
}

export function segmentUnits(cfg: Config, ids?: string[]): Unit[] {
  return cfg.segments.filter((s) => !ids || ids.includes(s.id)).map((s) => ({ id: s.id, first: s.firstFrame, end: s.endFrame }))
}

export function makeJob(cfg: Config, hashes: Hashes, format: string, tier: string, assets: string, a: Record<string, string>): Job {
  if (!cfg.tiers[tier]) throw new Error('unknown tier ' + tier)
  if (!cfg.assetSets[assets]) throw new Error('unknown asset set ' + assets)
  const grab = (a.grab ?? 'png') as Job['grab']
  if (grab !== 'png' && grab !== 'raw') throw new Error('--grab is png or raw')
  return { cfg, hashes, format, tier, assets, grab, budgetMinutes: a['budget-minutes'] ? Number(a['budget-minutes']) : cfg.raw.sandbox.chunkBudgetMinutes, logFile: join(WORK, 'logs', 'film-' + format + '-' + tier + '-' + assets + '.log') }
}

function fromMaster(cfg: Config, hashes: Hashes, tier: string, a: Record<string, string>): void {
  const master = cfg.formatKeys.master
  const preview = cfg.formats[cfg.formatKeys.preview]!
  const src = a.master ?? join(WORK, 'film-' + master + '-' + tier + '.mp4')
  const rec = readRecord(src)
  if (!rec) throw new Error('no master film with a record at ' + src)
  if (rec.engineHash !== hashes.engine || cfg.stopIds.some((s) => rec.stopHashes[s] !== hashes.stops[s])) throw new Error('the master film at ' + src + ' is from another build')
  const out = join(WORK, 'film-' + preview.id + '-' + tier + '.mp4')
  const rate = rateFor(cfg, preview.id)
  const t0 = Date.now()
  encodeTwoPass(src, out, { fps: cfg.fps, rate, filter: yuvScaleFilter(preview.width, preview.height), faststart: true, passlog: join(tempDir(WORK, 'film'), 'from-master.pass') })
  const p = probeVideo(out)
  const want = (rec.extra?.frameCount as number) ?? 0
  if (!p || p.frames !== want) throw new Error('scaled film has ' + (p?.frames ?? 0) + ' frames, expected ' + want)
  writeRecord(out, { ...rec, format: preview.id, extra: { ...rec.extra, fromMaster: src, probe: p, encode: { codec: 'libx264', preset: X264_PRESET, twoPass: true, rate, filter: yuvScaleFilter(preview.width, preview.height) }, seconds: (Date.now() - t0) / 1000 } })
  console.log(out + ' from ' + src + ', ' + p.frames + ' frames, ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s')
}

async function main(): Promise<void> {
  const cfg = loadConfig()
  const a = args()
  const tier = a.tier ?? 'draft'
  const format = formatId(cfg, a.format ?? 'preview')
  const assets = a.assets ?? 'full'
  requireDisk(cfg)
  const hashes = ensureBuild()
  if (a['from-master']) {
    fromMaster(cfg, hashes, tier, a)
    return
  }
  const job = makeJob(cfg, hashes, format, tier, assets, a)
  let units = segmentUnits(cfg)
  let out = join(WORK, 'film-' + format + '-' + tier + '.mp4')
  if (a.segment) {
    const ids = a.segment.split(',')
    for (const id of ids) if (!cfg.segments.some((s) => s.id === id)) throw new Error('unknown segment ' + id)
    units = segmentUnits(cfg, ids)
    if (a.span) {
      const m = /^(\d+)-(\d+)$/.exec(a.span)
      const u = units[0]!
      if (!m || units.length !== 1 || a.join) throw new Error('--span FIRST-LAST goes with one --segment and without --join')
      const first = Number(m[1])
      const last = Number(m[2])
      if (!(first >= u.first && last >= first && last < u.end)) throw new Error('--span must lie inside ' + u.id + ' (' + u.first + ' to ' + (u.end - 1) + ')')
      units = [{ id: u.id, first, end: last + 1, span: true }]
    }
    out = join(WORK, 'film-' + format + '-' + tier + '-' + units[0]!.first + '-' + (units[units.length - 1]!.end - 1) + '.mp4')
  } else if (a.first !== undefined || a.last !== undefined) {
    const first = Number(a.first ?? 0)
    const last = Number(a.last ?? cfg.frameCount - 1)
    if (!(first >= 0 && last >= first && last < cfg.frameCount)) throw new Error('bad --first/--last')
    const inside = units.filter((u) => u.first >= first && u.end - 1 <= last)
    const aligned = inside.length > 0 && inside[0]!.first === first && inside[inside.length - 1]!.end - 1 === last
    units = aligned ? inside : [{ id: 'range-' + first + '-' + last, first, end: last + 1 }]
    out = join(WORK, 'film-' + format + '-' + tier + '-' + first + '-' + last + '.mp4')
  }
  try {
    if (!a.join) await renderUnits(job, units)
  } finally {
    await job.source?.close()
  }
  if (a.segment && !a.join) return
  const rec = joinUnits(job, units, out)
  const g5 = rec.extra!.g5 as { failed: number[] }
  log(job, 'joined ' + out + ': ' + rec.extra!.frameCount + ' frames from ' + (rec.extra!.segments as string[]).length + ' chunks, G5 failed frames: ' + (g5.failed.length ? g5.failed.join(',') : 'none') + ((rec.extra!.missing as string[]).length ? ', missing chunks: ' + (rec.extra!.missing as string[]).join(',') : ''))
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch((e: unknown) => {
    console.error('film failed: ' + (e instanceof Error ? e.message : String(e)))
    process.exit(1)
  })
}
