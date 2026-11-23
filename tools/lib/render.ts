import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Config, Segment } from '../../src/config'
import { handoverOf, judgedWindow } from '../../src/director/handover'
import { coverWindow, setsForFrame } from '../../src/director/timeline'
import '../../src/director/plans' // each plan sets its stop's cover window or its handover
import { openCapture, renderPngFresh, type Session } from './browser'
import { DIST, ROOT, WORK, ensureBuild, formatId, machineId, readRecord, recordMatches, requireDisk, writeRecord, type OutputRecord } from './common'

export type Rect = [number, number, number, number]
export interface FrameSpec { frame: number; label: string }
export const jpgQuality = 92
export const padFrame = (f: number): string => String(f).padStart(5, '0')
export const padImage = (i: number): string => String(i).padStart(2, '0')

export function json(file: string, value: unknown): void {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(value, null, 2) + '\n')
}

export function image<T = void>(job: object): T {
  const reply = execFileSync('python3', [join(ROOT, 'tools/img/compose.py')], { input: JSON.stringify(job), encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'] })
  return JSON.parse(reply) as T
}

export function fingerprint(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

export function cached(file: string, want: OutputRecord, stops: string[], signature: string): OutputRecord | null {
  const record = safeRecord(file)
  return recordMatches(record, want, stops) && record?.extra?.signature === signature ? record : null
}

export function safeRecord(file: string): OutputRecord | null {
  try { return readRecord(file) } catch { return null }
}

export function frameNumber(cfg: Config, value: string | undefined, name: string): number {
  const frame = Number(value)
  if (value === undefined || value.trim() === '' || value === 'true' || Number.isInteger(frame) === false || frame < 0 || frame >= cfg.frameCount) {
    throw new Error('--' + name + ' must be an integer frame from 0 to ' + (cfg.frameCount - 1))
  }
  return frame
}

export function judged(cfg: Config, segment: Segment): number {
  const f = (cfg.raw.judged.fractions as Record<string, number>)[segment.kind] ?? 1 / 2
  return Math.min(segment.endFrame - 1, segment.firstFrame + Math.floor(f * segment.frames + 1e-9))
}

export function spread(first: number, last: number, limit: number): number[] {
  const count = Math.min(last - first + 1, limit)
  return Array.from({ length: count }, (_, i) => count === 1 ? first : first + Math.round(i * (last - first) / (count - 1)))
}

export function sheetFrames(cfg: Config, segment: Segment, cover: boolean, placeWindow = false): FrameSpec[] {
  const limit = cfg.raw.critics.contactSheetFrames
  let frames: number[]
  const h = cover && placeWindow && (segment.kind === 'dive' || segment.kind === 'rise') ? handoverOf(segment.stop, segment.kind) : null
  if (h) {
    // the run is centred on the place window; a spare half frame goes to the end where the sides change, the last frame of a dive, the first of a rise
    const count = Math.min(segment.endFrame - segment.firstFrame, limit)
    const start = (h.placeFirstFrame + h.placeLastFrame - (count - 1)) / 2
    const first = Math.max(segment.firstFrame, Math.min(segment.endFrame - count, segment.kind === 'dive' ? Math.ceil(start) : Math.floor(start)))
    frames = Array.from({ length: count }, (_, i) => first + i)
  } else if (cover) {
    const window = judgedWindow(segment)
    if (window === null) throw new Error(segment.id + ' has neither a cover window nor a handover')
    const count = Math.min(window.lastFrame - window.firstFrame + 1, limit)
    const first = Math.max(window.firstFrame, Math.min(window.lastFrame - count + 1, window.centerFrame - Math.floor((count - 1) / 2)))
    frames = Array.from({ length: count }, (_, i) => first + i)
  } else frames = spread(segment.firstFrame, segment.endFrame - 1, limit)
  return frames.map((frame) => ({ frame, label: String(frame) }))
}

export function detailFrames(segments: Segment[], noCover: boolean): number[] {
  const frames: number[] = []
  for (const s of segments) {
    const cw = s.kind === 'dive' || s.kind === 'rise' ? coverWindow(s) : null
    for (let f = s.firstFrame; f < s.endFrame; f++) {
      if (cw && !noCover && f >= cw.firstFrame && f <= cw.lastFrame) continue
      frames.push(f)
    }
  }
  return frames
}

export function filmSheets(cfg: Config, blind = false): FrameSpec[][] {
  return chunk(cfg.segments.map((segment) => {
    const frame = judged(cfg, segment)
    return { frame, label: blind ? String(frame) : segment.id + '  ' + frame }
  }), cfg.raw.critics.contactSheetFrames)
}

export function chunk<T>(items: T[], count: number): T[][] {
  if (count < 1) throw new Error('chunk size must be positive')
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += count) chunks.push(items.slice(i, i + count))
  return chunks
}

export function stopDependencies(frames: readonly number[]): string[] {
  return [...new Set(frames.flatMap(setsForFrame))]
}

const composer = join(ROOT, 'tools/img/compose.py')
export const imageRevision = (): string => fingerprint(composer)

export class Capture {
  readonly format: string
  readonly hashes: ReturnType<typeof ensureBuild>
  readonly machine = machineId()
  private readonly held: { session?: Session } = {}

  constructor(readonly cfg: Config, format: string | undefined) {
    requireDisk(cfg)
    this.format = formatId(cfg, format)
    this.hashes = ensureBuild()
  }

  record(tier: string, frames: number[], extra: Record<string, unknown> = {}): OutputRecord {
    if (Object.hasOwn(this.cfg.tiers, tier) === false) throw new Error('unknown tier ' + tier)
    return {
      engineHash: this.hashes.engine, stopHashes: Object.fromEntries(stopDependencies(frames).map((s) => [s, this.hashes.stops[s]])),
      format: this.format, tier, assets: 'full', diag: 'beauty', browser: this.held.session?.browserVersion ?? '', machine: this.machine,
      ...(frames.length === 1 ? { frame: frames[0] } : frames.length > 1 ? { first: Math.min(...frames), last: Math.max(...frames) } : {}), extra,
    }
  }

  async still(frame: number, tier: string, file?: string, useCanonical = false): Promise<{ file: string; record: OutputRecord }> {
    const want = this.record(tier, [frame])
    const canonical = join(WORK, 'stills', 'f' + padFrame(frame) + '-' + this.format + '-' + tier + '-full.png')
    const home = file ?? canonical
    const deps = stopDependencies([frame])
    const previous = safeRecord(home)
    if (previous?.frame === frame && recordMatches(previous, want, deps)) return { file: home, record: previous }
    if (file && useCanonical) {
      const still = safeRecord(canonical)
      if (still?.frame === frame && recordMatches(still, want, deps)) return { file: canonical, record: still }
    }
    const { png, seconds, samples } = await renderPngFresh(() => openCapture({ dist: DIST, format: this.format, assets: 'full', diag: 'beauty' }), this.held, frame, tier)
    mkdirSync(dirname(home), { recursive: true })
    writeFileSync(home, png)
    const record = this.record(tier, [frame], { seconds, samples })
    writeRecord(home, record)
    return { file: home, record }
  }

  async sheet(file: string, specs: FrameSpec[], tier: string, temp: string, extra: Record<string, unknown> = {}, limit = this.cfg.raw.critics.maxImageLongEdgePx): Promise<OutputRecord> {
    const frames = specs.map((s) => s.frame)
    const signature = JSON.stringify([specs, extra, limit, imageRevision()])
    const previous = cached(file, this.record(tier, frames), stopDependencies(frames), signature)
    if (previous) return previous
    const inputs = []
    let browser = ''
    for (const spec of specs) {
      const f = await this.still(spec.frame, tier, join(temp, 'f' + padFrame(spec.frame) + '-' + tier + '.png'), true)
      inputs.push({ path: f.file, label: spec.label })
      browser = f.record.browser
    }
    image({ op: 'sheet', output: file, inputs, limit })
    for (const { path } of inputs) {
      if (dirname(path) === temp) {
        rmSync(path, { force: true })
        rmSync(path + '.json', { force: true })
      }
    }
    const record = { ...this.record(tier, frames, { frames, ...extra, signature }), browser }
    writeRecord(file, record)
    return record
  }

  async close(): Promise<void> {
    if (this.held.session) await this.held.session.close()
  }
}

export function outputFolder(dir: string): string {
  if (existsSync(dir) === false) mkdirSync(dir, { recursive: true })
  return dir
}
