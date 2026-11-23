import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, WORK, args, loadConfig } from './lib/common'
import { json } from './lib/render'
import { FilmDirector } from '../src/director/film'
import { handoverFrame, handoverOf } from '../src/director/handover'
import { plans } from '../src/director/plans'
import { curves, sampleWindow, type Kind } from './smooth/camera'
import { judgeCurve, position, table, type CurveResult, type Fault, type Row } from './smooth/path'

// The measures of a smooth dive and rise (kit/PROGRESS.md, second review note of 2026-11-23, plan I). One stop.
//   npm run smooth -- --stop ID [--kind dive|rise] [--only path,pictures,place,counts] [--rate N] [--calibrate]
// path      from the camera path alone, at whole film frames and at the capture rate (smooth.rate): the fall or climb of the height, the turn of the
//           camera and the speed of the picture at the place, each over the mean of the move. Judged: the change over one film frame, the same
//           across both seams, and one rise and one fall (smooth.path).
// pictures, place, counts: see the parts below.
// Everything is written to out/work/smooth/<stop>.json and .md. Exit 1 when a number is over its limit in config smooth, or when a part that was
// asked for could not be measured. --calibrate writes every number and exits 0: the run that sets the limits.

const cfg = loadConfig()
const a = args()
const stop = a.stop
if (!stop || !cfg.stopIds.includes(stop)) {
  console.error('smooth: --stop must be one of ' + cfg.stopIds.join(', '))
  process.exit(2)
}
const S = cfg.raw.smooth
const PARTS = ['path', 'pictures', 'place', 'counts']
const only = a.only ? a.only.split(',') : PARTS
for (const p of only) {
  if (!PARTS.includes(p)) {
    console.error('smooth: --only takes ' + PARTS.join(', '))
    process.exit(2)
  }
}
const kinds: Kind[] = a.kind ? [a.kind as Kind] : ['dive', 'rise']
if (kinds.some((k) => k !== 'dive' && k !== 'rise')) {
  console.error('smooth: --kind is dive or rise')
  process.exit(2)
}
const rate = a.rate ? Number(a.rate) : S.rate
if (!Number.isInteger(rate) || rate < 1) {
  console.error('smooth: --rate is a whole number of at least 1')
  process.exit(2)
}
const calibrate = a.calibrate === 'true'
const master = cfg.formats[cfg.formatKeys.master]!
const dir = join(WORK, 'smooth')
mkdirSync(dir, { recursive: true })

const plan = plans.find((p) => p.id === stop)!
const film = new FilmDirector(plans)

interface PartResult { measured: boolean; pass: boolean; why: string[]; note?: string }

interface PathRun { rate: number; curves: CurveResult[] }
interface PathKind { segment: string; firstFrame: number; endFrame: number; frameT: number | null; window: [number, number]; runs: PathRun[]; rows: Row[]; sides: string[]; heights: (number | null)[]; faults: Fault[] }

const UNITS: [keyof ReturnType<typeof curves>, string, string, number | null][] = [
  ['fall', 'rate', 'log of the height a film frame', null],
  ['turn', 'turn', 'degrees a film frame', S.path.floors.turnDeg],
  ['speed', 'speed', 'px a film frame at the place', S.path.floors.speedPx],
]

function pathOf(kind: Kind): PathKind | null {
  const rates = rate > 1 ? [1, rate] : [1]
  const runs: PathRun[] = []
  let whole: ReturnType<typeof sampleWindow> = null
  let fine: ReturnType<typeof sampleWindow> = null
  for (const r of rates) {
    const w = sampleWindow(cfg, film, plan, kind, r, S.reachFrames)
    if (!w) return null
    if (r === 1) whole = w
    else fine = w
    const c = curves(w, plan, master.width, master.height, S.path.ringPx)
    runs.push({ rate: r, curves: UNITS.map(([key, name, unit, floor]) => judgeCurve(name, unit, c[key], w.k0, r, w.own, S.path, floor)) })
  }
  const w = whole!
  const h = handoverOf(stop!, kind)
  const at = (f: number): number => f - w.k0
  const frames = Array.from({ length: w.frames }, (_, i) => w.firstFrame + i)
  const lead = w.firstFrame - w.k0
  const shifted = runs[0]!.curves.map((c) => ({ ...c, over: c.over.slice(lead), step: c.step.slice(lead) }))
  return {
    segment: w.seg.id, firstFrame: w.seg.firstFrame, endFrame: w.seg.endFrame, frameT: h ? handoverFrame(h) : null, window: [w.firstFrame, w.firstFrame + w.frames - 1], runs,
    rows: table(shifted, fine ? runs[1]!.curves : null, w.firstFrame, w.frames, fine ? fine.k0 : 0, fine ? fine.rate : 1),
    sides: frames.map((f) => w.samples[at(f)]!.segment.split('.')[1] + ' ' + w.samples[at(f)]!.side),
    heights: frames.map((f) => Number(w.samples[at(f)]!.height.toExponential(4))),
    faults: runs.flatMap((r) => r.curves.flatMap((c) => c.faults.map((x) => ({ ...x, text: (r.rate === 1 ? 'whole frames, ' : 'rate ' + r.rate + ', ') + x.text })))),
  }
}

function pathPart(): PartResult & { kinds: Record<string, PathKind | null> } {
  const out: Record<string, PathKind | null> = {}
  const why: string[] = []
  for (const kind of kinds) {
    const p = pathOf(kind)
    out[kind] = p
    if (p) for (const f of p.faults) why.push(kind + ': ' + f.text)
  }
  return { measured: true, pass: why.length === 0, why, kinds: out }
}

function notBuilt(what: string): PartResult {
  return { measured: false, pass: false, why: [what + ': NOT MEASURED, this part of the tool is not built yet'] }
}

const cell = (v: number | null | undefined, digits = 3): string => (v === null || v === undefined ? '' : v.toFixed(digits))

function pathText(kind: Kind, p: PathKind | null): string[] {
  if (!p) return ['### ' + kind, '', 'The stop has no ' + kind + '.', '']
  const L = S.path
  const lines = ['### ' + kind + ' (' + p.segment + ', frames ' + p.firstFrame + ' to ' + (p.endFrame - 1) + (p.frameT === null ? '' : ', T at ' + p.frameT) + ', window ' + p.window[0] + ' to ' + p.window[1] + ')', '']
  lines.push('| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |')
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
  for (const r of p.runs) {
    for (const c of r.curves) {
      const pos = (x: { k: number } | null): string => (x && x.k >= 0 ? position(x.k, r.rate) : '')
      lines.push('| ' + [r.rate === 1 ? 'whole frames' : 'rate ' + r.rate, c.name, Number(c.mean.toPrecision(4)) + ' ' + c.unit + (c.floored ? ' (under the floor ' + c.floor + ', judged against the floor)' : ''), cell(c.peak?.value), pos(c.peak), cell(c.worstStep?.value), pos(c.worstStep), cell(c.worstHalfStep?.value), pos(c.worstHalfStep), cell(c.seams[0]!.step), cell(c.seams[1]!.step), cell(c.fallBeforePeak.value), cell(c.climbAfterPeak.value), cell(c.worstBeyond?.value) + (c.worstBeyond ? ' at ' + pos(c.worstBeyond) : '')].join(' | ') + ' |')
    }
  }
  lines.push('', 'Limits: step ' + L.maxStep + ' of the mean over one film frame, from ' + L.seamFrames + ' film frames before the segment to ' + L.seamFrames + ' after it; fall before the largest value and climb after it ' + L.maxRebound + ' of the mean, inside the segment. Steps further into the neighbours are shown and not judged.', '')
  if (p.faults.length) lines.push(...p.faults.map((f) => '- RED ' + f.text), '')
  else lines.push('No number of the path is over its limit.', '')
  const fine = p.runs.length > 1
  const head = ['frame', 'segment and side', 'height', 'rate', 'step', ...(fine ? ['step at rate ' + p.runs[1]!.rate] : []), 'turn', 'step', ...(fine ? ['step at rate ' + p.runs[1]!.rate] : []), 'speed', 'step', ...(fine ? ['step at rate ' + p.runs[1]!.rate] : [])]
  lines.push('Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over ' + L.maxStep + '.', '')
  lines.push('| ' + head.join(' | ') + ' |', '|' + head.map(() => '---').join('|') + '|')
  const star = (v: number | null): string => (v === null ? '' : v.toFixed(3) + (v > L.maxStep ? ' *' : ''))
  p.rows.forEach((row, i) => {
    const cells = [String(row.frame) + (row.frame === p.firstFrame ? ' first' : row.frame === p.endFrame - 1 ? ' last' : row.frame === p.frameT ? ' T' : ''), p.sides[i]!, p.heights[i] === null ? '' : p.heights[i]!.toExponential(3)]
    for (const name of ['rate', 'turn', 'speed']) {
      const v = row.values[name]!
      cells.push(cell(v.over), star(v.step), ...(fine ? [star(v.fine)] : []))
    }
    lines.push('| ' + cells.join(' | ') + ' |')
  })
  lines.push('')
  return lines
}

function commit(): string {
  try {
    const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
    const dirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: ROOT, encoding: 'utf8' }).trim()
    return head + (dirty ? ' with changes that are not committed' : '')
  } catch {
    return 'unknown'
  }
}

async function main(): Promise<void> {
  const parts: Record<string, PartResult> = {}
  if (only.includes('path')) parts.path = pathPart()
  if (only.includes('pictures')) parts.pictures = notBuilt('pictures')
  if (only.includes('place')) parts.place = notBuilt('place')
  if (only.includes('counts')) parts.counts = notBuilt('counts')
  const why = Object.values(parts).flatMap((p) => p.why)
  const pass = why.length === 0
  const out = { stop, commit: commit(), rate, calibrate, kinds, only, limits: S, pass, why, parts }
  json(join(dir, stop + '.json'), out)
  const lines = ['# smooth: ' + stop, '', 'Commit ' + out.commit + '. Capture rate ' + rate + '. Parts: ' + only.join(', ') + '.' + (calibrate ? ' A calibration run: every number is written, the exit code is 0.' : ''), '']
  lines.push(pass ? 'VERDICT: green. No number is over its limit.' : 'VERDICT: red. ' + why.length + ' number' + (why.length === 1 ? '' : 's') + ' over the limit or not measured.', '')
  for (const [name, p] of Object.entries(parts)) {
    lines.push('## ' + name, '')
    if (!p.measured) {
      lines.push(...p.why.map((w) => '- RED ' + w), '')
      continue
    }
    if (name === 'path') for (const kind of kinds) lines.push(...pathText(kind, (p as ReturnType<typeof pathPart>).kinds[kind] ?? null))
  }
  writeFileSync(join(dir, stop + '.md'), lines.join('\n'))
  console.log('smooth ' + stop + ': ' + (pass ? 'green' : 'red, ' + why.length + ' over the limit or not measured') + '. ' + join('out/work/smooth', stop + '.md'))
  for (const w of why.slice(0, 12)) console.log('  ' + w)
  if (why.length > 12) console.log('  and ' + (why.length - 12) + ' more, see the report')
  process.exit(pass || calibrate ? 0 : 1)
}

void main()
