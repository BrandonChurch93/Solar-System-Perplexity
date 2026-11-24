import { createHash } from 'node:crypto'

export interface TexelRow { frame: number; segment: string; counted: number; soft: number; fraction: number; meanTexels: number; pass: boolean }
export interface G5Row { frame: number; segment: string; kind: string; invalid: number; coverage: number; pass: boolean }
export type G17Row = Record<string, unknown> & { frame: number; median: number | null; p25: number | null; tiles: number; pass: boolean }
export interface Summary { record: Record<string, unknown>; line: string }

export const TEXEL_RULE = 'counted when green > 0.5; soft when red byte < 127.5 x detail.minTexelsPerPixel; pass when soft/counted <= detail.maxSoftPixelFraction'

export function listHash(frames: number[]): string {
  return createHash('sha256').update(JSON.stringify(frames)).digest('hex')
}

export function parsePart(text: string): { part: number; parts: number } | 'finals' {
  if (text === 'finals') return 'finals'
  const m = /^(\d+)\/(\d+)$/.exec(text)
  const part = Number(m?.[1])
  const parts = Number(m?.[2])
  if (m === null || parts < 1 || part < 1 || part > parts) throw new Error('--part takes I/N with I from 1 to N, or finals: 2/6')
  return { part, parts }
}

// A frame belongs to the part its place in the list falls to, counted round: the costly frames of a stop lie together, so blocks would
// give one machine the whole surface view.
export function share<T>(list: T[], part: number, parts: number): T[] {
  return list.filter((_, i) => i % parts === part - 1)
}

export function sumG13(stop: string, results: TexelRow[], of: number, every: number, tier: string, maxSoft: number): Summary {
  const failed = results.filter((r) => !r.pass)
  const empty = results.filter((r) => r.counted === 0).map((r) => r.frame)
  const worst = [...results].sort((x, y) => y.fraction - x.fraction).slice(0, 10)
  const pass = failed.length === 0
  return {
    record: { pass, tier, view: 'texels', frames: results.length, of, failed: failed.map((r) => r.frame), zeroCounted: empty, worst, results, rule: TEXEL_RULE },
    line: (pass ? 'PASS' : 'FAIL') + ' G13 ' + stop + ': ' + failed.length + ' of ' + results.length + ' frames over ' + maxSoft + ' soft' + (every > 1 ? ' (every ' + every + 'th frame)' : '') + '; worst ' + worst.slice(0, 3).map((w) => 'frame ' + w.frame + ' ' + (w.fraction * 100).toFixed(2) + '%').join(', ') + (empty.length ? '; ' + empty.length + ' frames had no counted pixels' : ''),
  }
}

export function sumG5(stop: string, tier: string, g5: G5Row[]): Summary {
  const failed = g5.filter((x) => !x.pass)
  return {
    record: { pass: failed.length === 0, tier, diag: 'nograin', frames: g5 },
    line: (failed.length === 0 ? 'PASS' : 'FAIL') + ' G5 ' + stop + ': ' + g5.map((x) => x.frame + ' ' + x.kind + ' invalid ' + x.invalid + ' coverage ' + x.coverage.toFixed(3)).join('; '),
  }
}

export function sumG17(stop: string, tier: string, minSharpnessRatio: number, definition: Record<string, unknown>, g17: G17Row[]): Summary {
  const pass = g17.length > 0 && g17.every((x) => x.pass)
  return {
    record: { pass, tier, diag: 'nograin', minSharpnessRatio, definition, frames: g17 },
    line: (pass ? 'PASS' : 'FAIL') + ' G17 ' + stop + ': ' + g17.map((x) => x.frame + ' median ' + (x.median === null ? 'none' : x.median.toFixed(3)) + ' p25 ' + (x.p25 === null ? 'none' : x.p25.toFixed(3)) + ' over ' + x.tiles + ' tiles').join('; '),
  }
}

export interface Build {
  stop: string
  commit: string
  engineHash: string
  stopHashes: Record<string, string>
  stopHash: string
  format: string
  assets: string
  detail: string
  texelsRule: string
  finalsRule: string
}

export interface PartFile extends Build {
  kind: 'measure part'
  part: number | 'finals'
  parts: number
  browser: string
  machine: string
  every: number
  noCover: boolean
  seconds: number
  run: Record<string, unknown>
  tier: string
  view: string
  list?: string
  listFrames?: number
  of?: number
  frames?: number[]
  results?: TexelRow[]
  G5?: Record<string, unknown>
  G17?: Record<string, unknown>
  lines?: string[]
}

export interface JoinAsk { build: Build; every: number; only: string[]; tier: string; texelsTier: string; maxSoft: number; frames: (noCover: boolean) => number[]; acceptCommit?: string }

const BUILD_NAMES: (keyof Build)[] = ['stop', 'commit', 'engineHash', 'stopHash', 'format', 'assets', 'detail', 'texelsRule', 'finalsRule']
const short = (v: unknown): string => String(v).slice(0, 40)

// Joins the parts of one measure into the record a whole run writes. Every part must be of this build and of the same run as the others,
// and every frame of the list must be in exactly one part; anything else is refused with the part and the name that is off.
export function joinParts(files: { name: string; part: PartFile }[], ask: JoinAsk): { out: Record<string, unknown>; lines: string[] } {
  const no = (why: string): never => {
    throw new Error('join refused: ' + why)
  }
  const mine = files.filter((f) => f.part.kind === 'measure part' && f.part.stop === ask.build.stop)
  if (mine.length === 0) no('no part of ' + ask.build.stop + ' in the folder')
  const wantTexels = ask.only.includes('G13')
  const wantFinals = ask.only.includes('G5') || ask.only.includes('G17')
  const texels = mine.filter((f) => f.part.part !== 'finals')
  const finals = mine.filter((f) => f.part.part === 'finals')
  const used = [...(wantTexels ? texels : []), ...(wantFinals ? finals : [])]
  const head = used[0] ?? no('no part of what is asked (' + ask.only.join(', ') + ') in the folder')
  for (const f of used) {
    for (const k of BUILD_NAMES) {
      const want = k === 'commit' && ask.acceptCommit ? ask.acceptCommit : ask.build[k]
      if (f.part[k] !== want) no(f.name + ' does not match the build: ' + k + ' ' + short(f.part[k]) + ' against ' + short(want))
    }
    if (JSON.stringify(f.part.stopHashes) !== JSON.stringify(ask.build.stopHashes)) no(f.name + ' does not match the build: the stops\' hashes differ')
    for (const k of ['browser', 'noCover', 'every'] as const) if (f.part[k] !== head.part[k]) no(f.name + ' does not match ' + head.name + ': ' + k + ' ' + short(f.part[k]) + ' against ' + short(head.part[k]))
    if (f.part.every !== ask.every) no(f.name + ' is of every ' + f.part.every + 'th frame, the join is asked for every ' + ask.every)
  }
  const out: Record<string, unknown> = {
    stop: ask.build.stop, commit: head.part.commit, engineHash: ask.build.engineHash, stopHashes: ask.build.stopHashes, stopHash: ask.build.stopHash, format: ask.build.format, assets: ask.build.assets,
    browser: head.part.browser, every: ask.every, noCover: head.part.noCover,
  }
  const lines: string[] = []
  if (wantTexels) {
    const first = texels[0] ?? no('no texel part in the folder')
    const list = ask.frames(first.part.noCover)
    const picked = list.filter((_, i) => i % ask.every === 0)
    const hash = listHash(picked)
    const n = first.part.parts
    const seen = new Map<number, string>()
    const rows = new Map<number, TexelRow>()
    for (const f of texels) {
      const p = f.part
      if (p.tier !== ask.texelsTier || p.view !== 'texels') no(f.name + ' is drawn at ' + p.tier + ' in the view ' + p.view + ', not at ' + ask.texelsTier + ' in texels')
      if (p.parts !== n) no(f.name + ' is one of ' + p.parts + ' parts, ' + first.name + ' one of ' + n)
      if (p.list !== hash || p.listFrames !== picked.length) no(f.name + ' was drawn from another list of frames (' + p.listFrames + ' frames, ' + short(p.list).slice(0, 12) + ') than this build gives (' + picked.length + ' frames, ' + hash.slice(0, 12) + ')')
      const other = seen.get(p.part as number)
      if (other) no('part ' + p.part + ' of ' + n + ' is there twice: ' + other + ' and ' + f.name)
      seen.set(p.part as number, f.name)
      const want = share(picked, p.part as number, n)
      const got = (p.results ?? []).map((r) => r.frame)
      if (JSON.stringify(p.frames) !== JSON.stringify(want)) no(f.name + ' does not hold the frames of part ' + p.part + ' of ' + n)
      if (JSON.stringify(got) !== JSON.stringify(want)) no(f.name + ' has results for ' + got.length + ' frames where its part has ' + want.length + (want.find((x) => !got.includes(x)) !== undefined ? '; frame ' + want.find((x) => !got.includes(x)) + ' is missing' : ''))
      for (const r of p.results!) {
        if (rows.has(r.frame)) no('frame ' + r.frame + ' is in two parts')
        rows.set(r.frame, r)
      }
    }
    for (let i = 1; i <= n; i++) if (!seen.has(i)) no('part ' + i + ' of ' + n + ' is missing')
    const results = picked.map((f) => rows.get(f) ?? no('frame ' + f + ' is in no part'))
    if (rows.size !== picked.length) no('the parts hold ' + rows.size + ' frames, the list ' + picked.length)
    const s = sumG13(ask.build.stop, results, list.length, ask.every, ask.texelsTier, ask.maxSoft)
    out.G13 = s.record
    lines.push(s.line)
  }
  if (wantFinals) {
    if (finals.length > 1) no('the part of the judged finals is there twice: ' + finals.map((f) => f.name).join(' and '))
    const f = finals[0] ?? no('the part of the judged finals is missing')
    if (f.part.tier !== ask.tier || f.part.view !== 'nograin') no(f.name + ' is drawn at ' + f.part.tier + ' in the view ' + f.part.view + ', not at ' + ask.tier + ' in nograin')
    for (const id of ['G5', 'G17'] as const) {
      if (!ask.only.includes(id)) continue
      out[id] = f.part[id] ?? no(f.name + ' holds no ' + id)
      lines.push((f.part.lines ?? []).find((l) => l.includes(' ' + id + ' ')) ?? no(f.name + ' holds no line of ' + id))
    }
  }
  out.run = { joined: used.map((f) => ({ file: f.name, part: f.part.part, parts: f.part.parts, machine: f.part.machine, seconds: f.part.seconds, run: f.part.run })) }
  out.pass = ask.only.every((id) => (out[id] as { pass: boolean } | undefined)?.pass === true)
  return { out, lines }
}
