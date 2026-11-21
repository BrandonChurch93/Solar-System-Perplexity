import { spawnSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const WORK = join(ROOT, 'out/work')
export const LOOKS = join(WORK, 'looks')
const LOG = join(LOOKS, 'log.jsonl')
const KEEP = 96
const LONG_EDGE = 1280
const STREAM_GAP_SECONDS = 45

export interface Look {
  time: string
  file: string
  source: string
  kind: string
  label: string
  stop?: string
  segment?: string
  frame?: number
  first?: number
  last?: number
  tier?: string
  format?: string
  diag?: string
  engine?: string
  job?: string
  from?: string
}

export interface LookInput {
  kind?: string
  label?: string
  stop?: string
  segment?: string
  frame?: number
  first?: number
  last?: number
  tier?: string
  format?: string
  diag?: string
  engine?: string
  job?: string
  extra?: Record<string, unknown>
}

interface Seg { id: string; stop: string; kind: string; start: number; end: number }
let cached: { fps: number; segments: Seg[]; stops: string[]; status: { maxGapMinutes: number; minGapMinutes: number; maxPictures: number; inlineMaxTries: number } } | null = null

export function looksConfig(): NonNullable<typeof cached> {
  if (cached) return cached
  const raw = JSON.parse(readFileSync(join(ROOT, 'config/showcase.json'), 'utf8')) as { film: { fps: number }; segments: Seg[]; stops: { id: string }[]; status: NonNullable<typeof cached>['status'] }
  cached = { fps: raw.film.fps, segments: raw.segments, stops: raw.stops.map((s) => s.id), status: raw.status }
  return cached
}

export function segmentOf(frame: number): Seg | undefined {
  const c = looksConfig()
  return c.segments.find((s) => frame >= Math.round(s.start * c.fps) && frame < Math.round(s.end * c.fps))
}

function kindOf(file: string): string {
  const parts = relative(WORK, file).split(sep)
  if (parts[0] === 'compare') return 'compare'
  if (parts[0] === 'crops') return 'crops'
  if (parts[0] === 'sheets') return parts.some((p) => p.startsWith('.frames-')) ? 'frame' : 'sheet'
  if (parts[0] === 'stills') return 'still'
  if (parts[0] === 'seq') return 'frame'
  return 'frame'
}

const STREAMED = new Set(['frame'])
const lastStream = new Map<string, number>()

function describe(kind: string, i: LookInput, name: string): string {
  const tier = i.tier ? ', ' + i.tier + ' tier' : ''
  const diag = i.diag && i.diag !== 'beauty' ? ', ' + i.diag + ' view' : ''
  const where = i.segment ?? (i.frame !== undefined ? segmentOf(i.frame)?.id : undefined)
  if (kind === 'compare') return (where ?? name) + ': approved image left, film frame right' + tier
  if (kind === 'sheet') return 'Contact sheet ' + (where ?? (i.first !== undefined ? 'frames ' + i.first + ' to ' + i.last : name)) + tier
  if (kind === 'crops') return 'Native crops of frame ' + i.frame + (where ? ' (' + where + ')' : '') + tier
  if (i.frame !== undefined) return (where ?? 'film') + ' frame ' + i.frame + tier + diag + (i.job ? ', from the running ' + i.job + ' job' : '')
  return name + tier + diag
}

function toJpg(input: { file?: string; raw?: { data: Buffer; width: number; height: number }; png?: Buffer }, out: string): boolean {
  const scale = 'scale=w=' + LONG_EDGE + ':h=' + LONG_EDGE + ':force_original_aspect_ratio=decrease:flags=lanczos'
  const tail = ['-vf', scale, '-frames:v', '1', '-q:v', '4', out]
  let r
  if (input.file) r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', input.file, ...tail], { encoding: 'utf8' })
  else if (input.png) r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-c:v', 'png', '-i', '-', ...tail], { input: input.png, maxBuffer: 1 << 28 })
  else r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', input.raw!.width + 'x' + input.raw!.height, '-i', '-', ...tail], { input: input.raw!.data, maxBuffer: 1 << 28 })
  return r.status === 0 && existsSync(out)
}

export function readLooks(dir = LOOKS): Look[] {
  const log = join(dir, 'log.jsonl')
  if (!existsSync(log)) return []
  const out: Look[] = []
  for (const line of readFileSync(log, 'utf8').split('\n')) {
    if (!line.trim()) continue
    try {
      const l = JSON.parse(line) as Look
      if (existsSync(join(dir, l.file))) out.push(l)
    } catch {
      continue
    }
  }
  return out.sort((a, b) => (a.time < b.time ? 1 : -1))
}

function prune(): void {
  const all = readLooks()
  if (all.length <= KEEP + 16) return
  const keep = all.slice(0, KEEP)
  const names = new Set(keep.map((l) => l.file))
  for (const f of readdirSync(LOOKS)) if (f.endsWith('.jpg') && !names.has(f)) rmSync(join(LOOKS, f), { force: true })
  writeFileSync(LOG, keep.reverse().map((l) => JSON.stringify(l)).join('\n') + '\n')
}

export function addLook(source: { file?: string; raw?: { data: Buffer; width: number; height: number }; png?: Buffer }, input: LookInput = {}): Look | null {
  try {
    const kind = input.kind ?? (source.file ? kindOf(source.file) : 'frame')
    if (STREAMED.has(kind)) {
      const key = kind + '|' + (input.job ?? '')
      const now = Date.now()
      if (now - (lastStream.get(key) ?? 0) < STREAM_GAP_SECONDS * 1000) return null
      lastStream.set(key, now)
    }
    mkdirSync(LOOKS, { recursive: true })
    const time = new Date().toISOString()
    const name = source.file ? basename(source.file).replace(/\.[a-z]+$/i, '') : 'frame-' + String(input.frame ?? 0).padStart(5, '0')
    const file = time.replace(/[-:.TZ]/g, '').slice(0, 17) + '-' + kind + '-' + name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60) + '.jpg'
    if (!toJpg(source, join(LOOKS, file))) return null
    const seg = input.segment ?? (input.frame !== undefined ? segmentOf(input.frame)?.id : undefined)
    const stop = input.stop ?? (seg ? seg.split('.')[0] : looksConfig().stops.find((s) => name.includes(s)))
    const look: Look = {
      time, file, source: source.file ? relative(ROOT, source.file) : 'memory', kind, label: input.label ?? describe(kind, { ...input, segment: seg }, name),
      ...(stop ? { stop } : {}), ...(seg ? { segment: seg } : {}), ...(input.frame !== undefined ? { frame: input.frame } : {}), ...(input.first !== undefined ? { first: input.first, last: input.last } : {}),
      ...(input.tier ? { tier: input.tier } : {}), ...(input.format ? { format: input.format } : {}), ...(input.diag ? { diag: input.diag } : {}), ...(input.engine ? { engine: input.engine } : {}), ...(input.job ? { job: input.job } : {}),
    }
    appendFileSync(LOG, JSON.stringify(look) + '\n')
    prune()
    return look
  } catch {
    return null
  }
}

export function lookFromRecord(file: string, r: { engineHash: string; format: string; tier: string; diag: string; frame?: number; first?: number; last?: number; extra?: Record<string, unknown> }): void {
  if (!/\.(png|jpe?g|webp)$/i.test(file)) return
  const abs = file.startsWith(sep) ? file : join(ROOT, file)
  if (!abs.startsWith(WORK + sep) || abs.startsWith(LOOKS + sep) || !existsSync(abs)) return
  const kind = kindOf(abs)
  if (kind === 'compare' && r.extra?.viewingCopy !== true) return
  if (kind === 'crops' && /-overview\.png$/.test(abs)) return
  const segment = typeof r.extra?.segment === 'string' ? (r.extra.segment as string) : undefined
  addLook({ file: abs }, { kind, segment, frame: r.frame, first: r.first, last: r.last, tier: r.tier, format: r.format, diag: r.diag, engine: r.engineHash })
}

export class JobLooks {
  private last = 0
  private readonly gapMs: number
  constructor(readonly job: string) {
    const s = looksConfig().status
    this.gapMs = Math.min(s.minGapMinutes, s.maxGapMinutes / 2) * 60000
  }
  due(): boolean {
    return Date.now() - this.last >= this.gapMs
  }
  add(source: { raw?: { data: Buffer; width: number; height: number }; png?: Buffer }, input: LookInput): void {
    if (!this.due()) return
    this.last = Date.now()
    addLook(source, { ...input, kind: 'job', job: this.job })
  }
}

export function fileAgeMinutes(file: string): number {
  return (Date.now() - statSync(file).mtimeMs) / 60000
}

export function pickLooks(all: Look[], max: number, stop?: string): Look[] {
  const seen = new Set<string>()
  const out: Look[] = []
  const key = (l: Look): string => l.kind + '|' + (l.segment ?? '') + '|' + (l.kind === 'crops' || l.kind === 'still' ? l.frame ?? '' : '') + '|' + (l.first ?? '') + '|' + (l.kind === 'note' ? l.file : '')
  const take = (l: Look): void => {
    if (out.length >= max || seen.has(key(l))) return
    seen.add(key(l))
    out.push(l)
  }
  if (stop) for (const view of ['hold', 'terrain']) {
    const c = all.find((l) => l.kind === 'compare' && l.segment === stop + '.' + view)
    if (c) take(c)
  }
  for (const l of all) take(l)
  return out.sort((x, y) => (x.time < y.time ? 1 : -1))
}

