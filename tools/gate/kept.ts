import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

// Gate G3 from a record: the determinism check and the warm start's self test are run once for a build, on any machine, and the gate takes
// their records while they match what it would run now. A record that is red, or of another build, tool or frame list, is never taken.

export const DETERMINISM = { format: 'preview', tier: 'review', assets: 'full' }
export const WARM_SELF = { tier: 'draft', assets: 'full' }

interface Seg { id: string; kind: string; stop: string; firstFrame: number; frames: number }

export function determinismFrames(segments: Seg[]): number[] {
  const out: number[] = []
  for (const k of ['hold', 'dive', 'travel', 'terrain']) {
    const s = segments.find((x) => x.kind === k)
    if (s) out.push(s.firstFrame + Math.floor(s.frames / 2))
  }
  return out
}

export interface WarmList { stop: string; frames: number[]; terrain: number }

export function warmSelfFrames(segments: Seg[], listed: number[]): WarmList {
  const stopAt = (f: number): string | undefined => segments.find((s) => f >= s.firstFrame && f < s.firstFrame + s.frames)?.stop
  const dives = segments.filter((x) => x.kind === 'dive')
  const dive = dives.find((x) => listed.some((f) => stopAt(f) === x.stop)) ?? dives[0]!
  const of = (kind: string): number => {
    const x = segments.find((y) => y.stop === dive.stop && y.kind === kind)!
    return x.firstFrame + Math.floor(x.frames / 2)
  }
  return { stop: dive.stop, frames: [dive.firstFrame, of('rise'), of('travel')], terrain: of('terrain') }
}

// The tool as it is now: its file and every file under tools/ it imports. The engine hash does not cover them.
export function toolHash(root: string, entry: string): string {
  const tools = join(root, 'tools')
  const seen: string[] = []
  const walk = (file: string): void => {
    if (seen.includes(file)) return
    seen.push(file)
    for (const m of readFileSync(file, 'utf8').matchAll(/from '(\.[^']*)'/g)) {
      const p = resolve(dirname(file), m[1]!)
      const f = [p + '.ts', join(p, 'index.ts'), p].find((x) => existsSync(x) && statSync(x).isFile())
      if (f && !relative(tools, f).startsWith('..')) walk(f)
    }
  }
  walk(join(root, entry))
  const h = createHash('sha256')
  for (const f of seen.sort()) h.update(relative(root, f).split('\\').join('/') + '\0').update(readFileSync(f)).update('\0')
  return h.digest('hex').slice(0, 16)
}

export interface Build { engineHash: string; stopHashes: Record<string, string>; format: string; tier: string; assets: string; tool: string }
export interface Kept { why: string; machine: string; lines: string[] }

const same = (x: unknown, y: unknown): boolean => JSON.stringify(x) === JSON.stringify(y)
const text = (x: unknown): x is string => typeof x === 'string' && x.length > 0

function buildFault(r: Record<string, unknown>, want: Build): string {
  if (r.ok !== true) return 'the record is red'
  if (r.engineHash !== want.engineHash) return 'the record is of another engine hash (' + String(r.engineHash) + ' against ' + want.engineHash + ')'
  const had = (r.stopHashes ?? {}) as Record<string, string>
  const stops = [...new Set([...Object.keys(want.stopHashes), ...Object.keys(had)])].sort()
  const off = stops.find((s) => had[s] !== want.stopHashes[s])
  if (off) return 'the record is of another stop hash of ' + off + ' (' + String(had[off]) + ' against ' + String(want.stopHashes[off]) + ')'
  for (const key of ['format', 'tier', 'assets'] as const) if (r[key] !== want[key]) return 'the record is of another ' + (key === 'assets' ? 'asset set' : key) + ' (' + String(r[key]) + ' against ' + want[key] + ')'
  if (r.tool !== want.tool) return 'the record is of another state of the tool (' + String(r.tool) + ' against ' + want.tool + ')'
  if (!text(r.machine)) return 'the record names no machine'
  return ''
}

function read(file: string): Record<string, unknown> | null {
  try {
    const r: unknown = JSON.parse(readFileSync(file, 'utf8'))
    return r !== null && typeof r === 'object' && !Array.isArray(r) ? (r as Record<string, unknown>) : null
  } catch {
    return null
  }
}

// why is '' when the record stands for a run of the determinism check now; lines are what that run printed.
export function keptDeterminism(r: Record<string, unknown> | null, want: Build & { frames: number[] }): Kept {
  const no = (why: string): Kept => ({ why, machine: '', lines: [] })
  if (!r) return no('there is no record')
  const bad = buildFault(r, want)
  if (bad) return no(bad)
  if (!same(r.frames, want.frames)) return no('the record is of other frames (' + JSON.stringify(r.frames) + ' against ' + JSON.stringify(want.frames) + ')')
  const runs = (r.runs ?? {}) as Record<string, Record<string, unknown> | undefined>
  const single = (r.single ?? {}) as Record<string, unknown>
  const lines: string[] = []
  for (const [i, f] of want.frames.entries()) {
    const x = runs['fresh-forward']?.[f]
    const y = runs['fresh-reverse']?.[f]
    const z = single[f]
    if (!text(x) || !text(y) || (i === want.frames.length - 1 && !text(z))) return no('the record holds no hash of frame ' + f + ' in one of its runs')
    if (x !== y || (z !== undefined && z !== x)) return no('the hashes of frame ' + f + ' in the record differ')
    lines.push('frame ' + f + ' identical ' + x + ' ' + y + (text(z) ? ' ' + z : ''))
  }
  return { why: '', machine: r.machine as string, lines: [...lines, 'determinism: pass'] }
}

export function keptWarm(r: Record<string, unknown> | null, want: Build & WarmList): Kept {
  const no = (why: string): Kept => ({ why, machine: '', lines: [] })
  if (!r) return no('there is no record')
  const bad = buildFault(r, want)
  if (bad) return no(bad)
  if (r.stop !== want.stop || !same(r.frames, want.frames) || r.terrain !== want.terrain) return no('the record is of other frames (' + String(r.stop) + ' ' + JSON.stringify(r.frames) + ' and ' + String(r.terrain) + ' against ' + want.stop + ' ' + JSON.stringify(want.frames) + ' and ' + want.terrain + ')')
  const rows = (Array.isArray(r.rows) ? r.rows : []) as { frame?: number; cold?: unknown; warm?: unknown }[]
  for (const f of want.frames) {
    const row = rows.find((x) => x.frame === f)
    if (!row || !text(row.cold) || !text(row.warm)) return no('the record holds no hash of frame ' + f)
    if (row.cold !== row.warm) return no('the hashes of frame ' + f + ' in the record differ')
  }
  const lines = Array.isArray(r.lines) && r.lines.every(text) ? (r.lines as string[]) : []
  if (lines.length === 0) return no('the record holds no lines')
  return { why: '', machine: r.machine as string, lines }
}

export const readKept = read
