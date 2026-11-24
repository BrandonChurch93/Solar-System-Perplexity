import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, ROOT, WORK, args, ensureBuild, formatId, loadConfig, machineId, requireDisk } from './lib/common'
import { openCapture, renderPng, type Session } from './lib/browser'
import type { Hashes } from './lib/hashes'
import { json, padFrame } from './lib/render'
import { FilmDirector } from '../src/director/film'
import { handoverFrame, handoverOf } from '../src/director/handover'
import { shutterMid } from '../src/core/sampler'
import type { Pose } from '../src/core/types'
import { plans } from '../src/director/plans'
import { MIN_POINTS, carriedCamera, curves, sampleWindow, sphereHit, type Kind, type Ring } from './smooth/camera'
import { judgeCurve, position, table, type CurveResult, type Fault, type Row } from './smooth/path'

// The measures of a smooth dive and rise (kit/PROGRESS.md, second review note of 2026-11-23, plan I). One stop.
//   npm run smooth -- --stop ID [--kind dive|rise] [--only path,pictures,place,parity,counts] [--rate N] [--calibrate] [--ring picture|ground]
// path      from the camera path alone, at whole film frames and at the capture rate (smooth.rate): the fall or climb of the height, the turn of the
//           camera and the speed of the picture at the place, each over the mean of the move. Judged: the change over one film frame, the same
//           across both seams, and one rise and one fall (smooth.path). The speed is a mean over ground points on a ring round the place:
//           every step and every rebound compares the mean over the points that have ground in every frame it compares, and their count
//           stands beside the number; fewer than 4 is not measured, which is red. --ring ground tries the ring laid on the ground.
// pictures  from draft frames, every frame of the dive and of the rise and smooth.reachFrames film frames into each neighbour (capture frames once
//           the page knows a rate, whole film frames until then): the step of the frame's level against the line through its two neighbours,
//           and the pop score: what is left of the difference between a frame and the next once the motion between them is taken out, over the
//           median of that number in the smooth.pictures.popWindow frames round it. A limit that is null is reported and not judged.
//           The pop is counted twice, once with every pixel and once with nothing left where the flow from a frame to the next and the flow
//           back do not agree (ground uncovered, content entering at the edge); the smaller of the two is the pop. The change in place: a frame against the frame smooth.pictures.changeFrames film frames later, carried back along
//           the flows, the difference smoothed, its 99th percentile on the body: a look that is replaced in place within those frames.
//           The rings of a stop named in smooth.pictures.ringBodies count as its body. The same number on the frames of the surface view
//           beside the move stands next to it: the life of the ground itself.
//           Frames at whole film frames are shared with npm run handover (out/work/handover/<stop>/frames), so nothing is rendered twice.
// place     the handover with the place picture switched off (the noplace view), draft tier: both sides at T, and every frame from one before the
//           place window and the dissolve to one after them: the steps of level and colour on the body as npm run handover counts them, and
//           the level step and the pop score of the pictures part. What the place picture covers is seen here. Limits in smooth.place.
// parity    the same film frame drawn at the first format of smooth.parity.formats and scaled down, against the frame drawn at the second (the
//           film's): a few frames of the dive, the surface view and the rise (smooth.parity.at, shares of the segment). What a stop holds in
//           pixels of the drawn format shows here as a difference.
// counts    the work the graphics card is given per picture, as the page counts it (showcase.counts(): programs linked, texture uploads, buffers
//           made): every capture frame of the stop from its first segment to the end of its travel, in order on one fresh page, draft tier at the
//           format smooth.counts.format; before each one the warm start runs as the live player calls it (showcase.ahead(frame, tier, all), all
//           true at the first) and its work counts for that picture. Judged: every picture of a dive, a rise and a travel against smooth.counts
//           (zero). NOT MEASURED while the page has no counter.
// Everything is written to out/work/smooth/<stop>.json and .md (<stop>-<kind> when --kind is given). Exit 1 when a number is over its limit in config smooth, or when a part that was
// asked for could not be measured. --calibrate writes every number and exits 0: the run that sets the limits.

const cfg = loadConfig()
const a = args()
const stop = a.stop
if (!stop || !cfg.stopIds.includes(stop)) {
  console.error('smooth: --stop must be one of ' + cfg.stopIds.join(', '))
  process.exit(2)
}
const S = cfg.raw.smooth
const PARTS = ['path', 'pictures', 'place', 'parity', 'counts']
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
const ring = (a.ring ?? 'picture') as Ring
if (ring !== 'picture' && ring !== 'ground') {
  console.error('smooth: --ring is picture or ground')
  process.exit(2)
}
const master = cfg.formats[cfg.formatKeys.master]!
const dir = join(WORK, 'smooth')
const stem = stop + (a.kind ? '-' + a.kind : '')
mkdirSync(dir, { recursive: true })

const plan = plans.find((p) => p.id === stop)!
const film = new FilmDirector(plans)

interface PartResult { measured: boolean; pass: boolean; why: string[]; note?: string }

interface PathRun { rate: number; curves: CurveResult[] }
interface PathKind { segment: string; firstFrame: number; endFrame: number; frameT: number | null; window: [number, number]; runs: PathRun[]; rows: Row[]; sides: string[]; heights: (number | null)[]; faults: Fault[] }

const UNITS: ['fall' | 'turn' | 'speed', string, string, number | null][] = [
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
    const c = curves(w, plan, master.width, master.height, S.path.ringPx, ring)
    runs.push({ rate: r, curves: UNITS.map(([key, name, unit, floor]) => judgeCurve(name, unit, c[key], w.k0, r, w.own, S.path, floor, key === 'speed' ? { values: c.ring, min: MIN_POINTS } : null)) })
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


let hashes: Hashes | null = null
let session: Session | null = null
let sessionFormat = ''
let view = ''
let pageRate = 1
let rendered = 0
let renderSeconds = 0
const format = formatId(cfg, a.format)

function measure<T>(job: object): T {
  const reply = execFileSync('python3', [join(ROOT, 'tools/img/smooth.py')], { input: JSON.stringify(job), encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'], maxBuffer: 1 << 28 })
  return JSON.parse(reply) as T
}

async function drop(): Promise<void> {
  await session?.close().catch(() => undefined)
  session = null
  view = ''
}

async function open(fmt: string): Promise<Session> {
  const s = await openCapture({ dist: DIST, format: fmt, assets: 'full', diag: 'beauty', query: rate > 1 ? '&rate=' + rate : '' })
  sessionFormat = fmt
  const known = await s.page.evaluate(() => (window as unknown as { showcase: { info(): { rate?: number } } }).showcase.info().rate)
  pageRate = known === rate ? rate : 1
  return s
}

// A frame of the film at the capture rate of the page: k counts capture frames. At rate 1 the file and its stamp are the handover report's.
async function still(k: number, tier: string, diag: string, fmt = format): Promise<string> {
  hashes ??= ensureBuild()
  if (session && sessionFormat !== fmt) await drop()
  session ??= await open(fmt)
  const tag = (diag === 'beauty' ? '' : '-' + diag.replace(/[^A-Za-z0-9.]+/g, '_')) + (fmt === format ? '' : '-' + fmt)
  const frameDir = pageRate === 1 && fmt === format ? join(WORK, 'handover', stop!, 'frames') : join(dir, stop!, 'frames')
  mkdirSync(frameDir, { recursive: true })
  const file = join(frameDir, (pageRate === 1 ? 'f' + padFrame(k) : 'k' + String(k).padStart(6, '0') + '-r' + pageRate) + '-' + tier + tag + '.png')
  const stamp = hashes.engine + ':' + JSON.stringify(hashes.stops) + '|' + fmt
  const note = file + '.stamp'
  if (existsSync(file) && existsSync(note) && readFileSync(note, 'utf8') === stamp) return file
  for (let attempt = 1; ; attempt++) {
    try {
      session ??= await open(fmt)
      if (view !== diag) {
        await session.page.evaluate((v) => (window as unknown as { showcase: { setDiagnostic(v: string): void } }).showcase.setDiagnostic(v), diag)
        view = diag
      }
      const { png, seconds } = await renderPng(session.page, k, tier)
      writeFileSync(file, png)
      writeFileSync(note, stamp)
      rendered++
      renderSeconds += seconds
      return file
    } catch (e) {
      await drop()
      if (attempt >= 3) throw e
      console.error('[smooth] ' + String(e).split('\n')[0]!.slice(0, 200) + '. Fresh page, try ' + (attempt + 1) + ' of 3')
    }
  }
}

interface PictureNumbers { level: number[]; levelStep: (number | null)[]; residual: (number | null)[]; base: (number | null)[]; popAll: (number | null)[]; popCarried: (number | null)[]; pop: (number | null)[]; motionPx: (number | null)[]; unsure: (number | null)[]; popBlock: (number | null)[]; popBlockAt: ([number, number] | null)[]; grid: [number, number]; change: (number | null)[]; changeTop: (number | null)[]; changeAt: ([number, number] | null)[]; changeShare: (number | null)[] }
interface PictureRow { k: number; frame: number; level: number; levelStep: number | null; residual: number | null; base: number | null; popAll: number | null; popCarried: number | null; pop: number | null; motionPx: number | null; unsure: number | null; popBlock: number | null; popBlockAt: [number, number] | null; change: number | null; changeTop: number | null; changeAt: [number, number] | null; changeShare: number | null }
interface Most { k: number; frame: number; value: number }
interface PictureKind { segment: string; firstFrame: number; endFrame: number; window: [number, number]; rate: number; frames: number; rows: PictureRow[]; levelStep: Most | null; pop: Most | null; popBlock: (Most & { at: [number, number] | null }) | null; change: (Most & { at: [number, number] | null }) | null; changeFrames: number; ground: { value: number; first: number; last: number } | null; panel: string | null; changePanel: string | null; why: string[] }

const CHANGE = { frames: (S.pictures as { changeFrames?: number }).changeFrames ?? 8, blurPx: (S.pictures as { changeBlurPx?: number }).changeBlurPx ?? 20, max: (S.pictures as { maxChange?: number | null }).maxChange ?? null, rings: (S.pictures as { ringBodies?: string[] }).ringBodies ?? [] }

function poseOf(k: number, r: number): { p: number[]; q: number[]; vfov: number; rings?: { normal: number[]; inner: number; outer: number } } {
  const pose = carriedCamera(film, plan, stop!, Math.floor(k / r), (k + shutterMid()) / (cfg.fps * r)).pose
  const rings = CHANGE.rings.includes(stop!) ? plan.fit.rings : null
  return { p: pose.position.toArray(), q: pose.quaternion.toArray(), vfov: pose.vfov, ...(rings && rings.outer > rings.inner ? { rings } : {}) }
}

async function picturesOf(kind: Kind): Promise<PictureKind | null> {
  const seg = cfg.segments.find((s) => s.stop === stop && s.kind === kind)
  if (!seg) return null
  const P = S.pictures
  const tier = P.tier
  const first = Math.max(seg.firstFrame - S.reachFrames, 0)
  const end = Math.min(seg.endFrame + S.reachFrames, cfg.frameCount)
  hashes ??= ensureBuild()
  if (session && sessionFormat !== format) await drop()
  session ??= await open(format)
  const r = pageRate
  const ks = Array.from({ length: (end - first) * r }, (_, i) => first * r + i)
  const paths: string[] = []
  const t0 = Date.now()
  for (const k of ks) {
    paths.push(await still(k, tier, 'beauty'))
    if (paths.length % 20 === 0) console.log(stop + ' ' + kind + ': ' + paths.length + ' of ' + ks.length + ' ' + tier + ' frames, ' + Math.round((Date.now() - t0) / 1000) + ' s')
  }
  const poses = ks.map((k) => poseOf(k, r))
  const n = measure<PictureNumbers>({ op: 'pictures', paths, poses, scale: P.flowScale, window: P.popWindow * r, floor: P.popFloor, grid: P.grid, changeFrames: CHANGE.frames * r, changeBlur: CHANGE.blurPx })
  const rows: PictureRow[] = ks.map((k, i) => ({ k, frame: Math.floor(k / r), level: n.level[i]!, levelStep: n.levelStep[i] ?? null, residual: n.residual[i] ?? null, base: n.base[i] ?? null, popAll: n.popAll[i] ?? null, popCarried: n.popCarried[i] ?? null, pop: n.pop[i] ?? null, motionPx: n.motionPx[i] ?? null, unsure: n.unsure[i] ?? null, popBlock: n.popBlock[i] ?? null, popBlockAt: n.popBlockAt[i] ?? null, change: n.change[i] ?? null, changeTop: n.changeTop[i] ?? null, changeAt: n.changeAt[i] ?? null, changeShare: n.changeShare[i] ?? null }))
  const most = (key: 'levelStep' | 'pop' | 'popBlock' | 'change'): Most | null => {
    let out: Most | null = null
    for (const row of rows) {
      const v = row[key]
      if (v !== null && (!out || v > out.value)) out = { k: row.k, frame: row.frame, value: v }
    }
    return out
  }
  const levelStep = most('levelStep')
  const pop = most('pop')
  const block = most('popBlock')
  const change = most('change')
  const why: string[] = []
  const limit = (v: number | null): number | null => v
  const over = (key: 'levelStep' | 'pop' | 'popBlock' | 'change', max: number | null, text: (row: PictureRow) => string): void => {
    if (max === null) return
    const bad = rows.filter((row) => row[key] !== null && row[key]! > max)
    if (bad.length === 0) return
    const top = bad.reduce((x, y) => (y[key]! > x[key]! ? y : x))
    why.push(text(top) + ', limit ' + max + (bad.length > 1 ? ' (' + bad.length + ' frames over it, first ' + position(bad[0]!.k, r) + ')' : ''))
  }
  over('levelStep', limit(P.maxLevelStep), (row) => 'the level of frame ' + position(row.k, r) + ' lies ' + row.levelStep!.toFixed(2) + ' off the line through its two neighbours')
  over('pop', limit(P.maxPop), (row) => 'pop score ' + row.pop!.toFixed(2) + ' from frame ' + position(row.k, r) + ' to the next')
  over('popBlock', limit(P.maxPopBlock), (row) => 'pop score of one block ' + row.popBlock!.toFixed(2) + ' from frame ' + position(row.k, r) + ' to the next')
  over('change', CHANGE.max, (row) => 'the picture changes in place by ' + row.change!.toFixed(1) + ' from frame ' + position(row.k, r) + ' to ' + CHANGE.frames + ' film frames later')
  const top = rows.filter((row) => row.pop !== null).sort((x, y) => y.pop! - x.pop!).slice(0, 4).sort((x, y) => x.k - y.k)
  let panel: string | null = null
  if (top.length > 0) {
    panel = join(dir, stop + '-' + kind + '-pops.png')
    measure({ op: 'panel', output: panel, scale: P.flowScale, gain: 8, limit: cfg.raw.critics.maxImageLongEdgePx, pairs: top.map((row) => ({ a: paths[row.k - ks[0]!]!, b: paths[row.k - ks[0]! + 1]!, label: stop + ' ' + kind + ' frame ' + position(row.k, r) + ' and the next, and what is left without the motion times 8: pop ' + row.pop!.toFixed(2) + ', left ' + row.residual!.toFixed(2) + ' against ' + row.base!.toFixed(2) })) })
  }
  const peaks: PictureRow[] = []
  for (const row of rows.filter((x) => x.change !== null).sort((x, y) => y.change! - x.change!)) {
    if (peaks.length < 4 && peaks.every((q) => Math.abs(q.k - row.k) >= CHANGE.frames * r)) peaks.push(row)
  }
  peaks.sort((x, y) => x.k - y.k)
  let changePanel: string | null = null
  if (peaks.length > 0) {
    changePanel = join(dir, stop + '-' + kind + '-changes.png')
    measure({ op: 'changes', output: changePanel, scale: P.flowScale, gain: 6, changeBlur: CHANGE.blurPx, limit: cfg.raw.critics.maxImageLongEdgePx, chains: peaks.map((row) => {
      const i = row.k - ks[0]!
      const last = i + CHANGE.frames * r
      return { paths: paths.slice(i, last + 1), poses: [poses[i]!, poses[last]!], label: stop + ' ' + kind + ' frame ' + position(row.k, r) + ', frame ' + position(row.k + CHANGE.frames * r, r) + ' carried back to it, their smoothed difference times 6: change ' + row.change!.toFixed(1) }
    }) })
  }
  const reach = CHANGE.frames * r
  const beside = rows.filter((row) => row.change !== null && (kind === 'dive' ? row.k >= seg.endFrame * r : row.k + reach < seg.firstFrame * r))
  const ground = beside.length > 0 ? { value: Math.max(...beside.map((row) => row.change!)), first: beside[0]!.k, last: beside.at(-1)!.k + reach } : null
  return { segment: seg.id, firstFrame: seg.firstFrame, endFrame: seg.endFrame, window: [first, end - 1], rate: r, frames: ks.length, rows, levelStep, pop, ground, popBlock: block ? { ...block, at: rows.find((row) => row.k === block.k)!.popBlockAt } : null, change: change ? { ...change, at: rows.find((row) => row.k === change.k)!.changeAt } : null, changeFrames: CHANGE.frames, panel, changePanel, why }
}

async function picturesPart(): Promise<PartResult & { kinds: Record<string, PictureKind | null>; tier: string; rate: number; secondsAFrame: number | null }> {
  const out: Record<string, PictureKind | null> = {}
  const why: string[] = []
  for (const kind of kinds) {
    const p = await picturesOf(kind)
    out[kind] = p
    if (p) for (const w of p.why) why.push(kind + ': ' + w)
  }
  const note = rate > 1 && pageRate === 1 ? 'the page has no capture rate yet: the pictures are whole film frames' : undefined
  return { measured: true, pass: why.length === 0, why, kinds: out, tier: S.pictures.tier, rate: pageRate, secondsAFrame: rendered > 0 ? Number((renderSeconds / rendered).toFixed(2)) : null, ...(note ? { note } : {}) }
}

function picturesText(kind: Kind, p: PictureKind | null): string[] {
  if (!p) return ['### ' + kind, '', 'The stop has no ' + kind + '.', '']
  const P = S.pictures
  const lim = (v: number | null): string => (v === null ? 'no limit yet, not judged' : 'limit ' + v)
  const lines = ['### ' + kind + ' (' + p.segment + ', frames ' + p.firstFrame + ' to ' + (p.endFrame - 1) + ', window ' + p.window[0] + ' to ' + p.window[1] + ', ' + p.frames + ' ' + P.tier + ' frames at rate ' + p.rate + ')', '']
  if (p.levelStep) lines.push('Largest level step: ' + p.levelStep.value.toFixed(2) + ' at frame ' + position(p.levelStep.k, p.rate) + ' (display values 0 to 255, the frame against the middle of its two neighbours), ' + lim(P.maxLevelStep) + '.')
  if (p.pop) lines.push('Largest pop score: ' + p.pop.value.toFixed(2) + ' from frame ' + position(p.pop.k, p.rate) + ' to the next, ' + lim(P.maxPop) + '.')
  if (p.popBlock) lines.push('Largest pop score of one block (a grid of ' + P.grid.join(' by ') + '): ' + p.popBlock.value.toFixed(2) + ' from frame ' + position(p.popBlock.k, p.rate) + ' to the next' + (p.popBlock.at ? ', block column ' + p.popBlock.at[0] + ' row ' + p.popBlock.at[1] + ' from the top left' : '') + ', ' + (P.maxPopBlock === null ? 'shown, not judged' : 'limit ' + P.maxPopBlock) + '.')
  if (p.change) lines.push('Largest change in place: ' + p.change.value.toFixed(1) + ' from frame ' + position(p.change.k, p.rate) + ' to ' + p.changeFrames + ' film frames later' + (p.change.at ? ', most at pixel ' + p.change.at.join(', ') : '') + ' (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over ' + CHANGE.blurPx + ' px, its 99th percentile on the body), ' + lim(CHANGE.max) + '.')
  if (p.ground) lines.push('The ground beside it, the same number on the surface view alone (frames ' + position(p.ground.first, p.rate) + ' to ' + position(p.ground.last, p.rate) + '): ' + p.ground.value.toFixed(1) + (CHANGE.max !== null && p.ground.value > CHANGE.max ? ', over the limit by itself' : '') + '.')
  if (p.panel) lines.push('The four largest pops, each with the next frame and what is left without the motion: ' + p.panel.slice(ROOT.length + 1))
  if (p.changePanel) lines.push('The largest changes in place, each with the later frame carried back and the difference: ' + p.changePanel.slice(ROOT.length + 1))
  lines.push('')
  if (p.why.length) lines.push(...p.why.map((w) => '- RED ' + w), '')
  lines.push('| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
  for (const row of p.rows) lines.push('| ' + [position(row.k, p.rate) + (row.frame === p.firstFrame && row.k % p.rate === 0 ? ' first' : row.frame === p.endFrame - 1 && row.k % p.rate === 0 ? ' last' : ''), row.level.toFixed(2), cell(row.levelStep, 2), cell(row.motionPx, 1), cell(row.residual, 2), cell(row.base, 2), cell(row.popAll, 2), cell(row.popCarried, 2), cell(row.pop, 2), cell(row.unsure, 3), cell(row.popBlock, 2), row.popBlockAt ? row.popBlockAt.join(',') : '', cell(row.change, 1), cell(row.changeTop, 1), cell(row.changeShare, 2)].join(' | ') + ' |')
  lines.push('')
  return lines
}

function handoverMeasure<T>(job: object): T {
  const reply = execFileSync('python3', [join(ROOT, 'tools/img/handover.py')], { input: JSON.stringify(job), encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'], maxBuffer: 1 << 26 })
  return JSON.parse(reply) as T
}

function bodyGrid(p: Pose): number[][] {
  const px = cfg.raw.handover.limits.blockPx
  const cols = Math.floor(master.width / px)
  const rows = Math.floor(master.height / px)
  return Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => (sphereHit(p, (c + 0.5) * px, (r + 0.5) * px, master.width, master.height) ? 1 : 0)))
}

interface SideNumbers { mean: number; p50: number; p99: number; p999: number; max: number; shareOver16: number }
interface BodyNumbers { level: number; colour: number[]; bodyShare: number; bodyLevel: number; bodyColour: number[]; flatShare: number; contrast: number }
interface PlaceRow { k: number; frame: number; level: number; bodyShare: number; bodyLevel: number; bodyLevelStep: number | null; bodyColourStep: number | null; levelStep: number | null; pop: number | null; popBlock: number | null }
interface PlaceKind { segment: string; frameT: number; window: [number, number]; frames: [number, number]; rate: number; sides: (SideNumbers & { panel: string }) | null; rows: PlaceRow[]; bodyLevelStep: Most | null; bodyColourStep: Most | null; levelStep: Most | null; pop: Most | null; note?: string; why: string[] }

async function placeOf(kind: Kind): Promise<PlaceKind | null> {
  const seg = cfg.segments.find((s) => s.stop === stop && s.kind === kind)
  if (!seg) return null
  const h = handoverOf(stop!, kind)
  const L = cfg.raw.handover.limits
  const P = S.place
  const none = { segment: seg.id, frameT: -1, window: [-1, -1] as [number, number], frames: [-1, -1] as [number, number], rate: 1, sides: null, rows: [], bodyLevelStep: null, bodyColourStep: null, levelStep: null, pop: null }
  if (!h) return { ...none, why: ['NOT MEASURED: the stop has not opted in, there is no handover'] }
  const frameT = handoverFrame(h)
  if (!h.picture) return { ...none, frameT, note: 'the stop draws no place picture: there is nothing to switch off', why: [] }
  hashes ??= ensureBuild()
  if (session && sessionFormat !== format) await drop()
  session ??= await open(format)
  const r = pageRate
  const first = Math.max(Math.min(h.placeFirstFrame, h.firstFrame) - 1, seg.firstFrame)
  const last = Math.min(Math.max(h.placeLastFrame, h.lastFrame) + 1, seg.endFrame - 1)
  const ks = Array.from({ length: (last - first + 1) * r }, (_, i) => first * r + i)
  const t = String(Number(h.time.toFixed(6)))
  const close = await still(frameT * r, 'draft', 'beauty/side=terrain/t=' + t)
  const globe = await still(frameT * r, 'draft', 'beauty/side=orbit/t=' + t + '/noplace')
  const stem = join(dir, stop + '-' + kind)
  const sides = handoverMeasure<SideNumbers>({ op: 'sides', close, globe, difference: stem + '-place-difference.png', panel: stem + '-place-sides.png', gain: L.differenceGain, limit: cfg.raw.critics.maxImageLongEdgePx })
  const paths: string[] = []
  const bodies: number[][][] = []
  for (const k of ks) {
    paths.push(await still(k, 'draft', 'beauty/noplace'))
    bodies.push(bodyGrid(carriedCamera(film, plan, stop!, Math.floor(k / r), (k + shutterMid()) / (cfg.fps * r)).pose))
  }
  const body = handoverMeasure<BodyNumbers[]>({ op: 'frames', paths, bodies, floor: L.flatFloor })
  const pic = measure<PictureNumbers>({ op: 'pictures', paths, scale: S.pictures.flowScale, window: S.pictures.popWindow * r, floor: S.pictures.popFloor, grid: S.pictures.grid })
  const rows: PlaceRow[] = ks.map((k, i) => {
    const b = body[i]!
    const p = body[i - 1]
    const seen = p !== undefined && Math.min(b.bodyShare, p.bodyShare) >= L.bodyShare
    return {
      k, frame: Math.floor(k / r), level: b.level, bodyShare: b.bodyShare, bodyLevel: b.bodyLevel,
      bodyLevelStep: seen ? Math.abs(b.bodyLevel - p.bodyLevel) : null, bodyColourStep: seen ? Math.max(...b.bodyColour.map((v, j) => Math.abs(v - p.bodyColour[j]!))) : null,
      levelStep: pic.levelStep[i] ?? null, pop: pic.pop[i] ?? null, popBlock: pic.popBlock[i] ?? null,
    }
  })
  const most = (key: 'bodyLevelStep' | 'bodyColourStep' | 'levelStep' | 'pop'): Most | null => {
    let out: Most | null = null
    for (const row of rows) {
      const v = row[key]
      if (v !== null && (!out || v > out.value)) out = { k: row.k, frame: row.frame, value: v }
    }
    return out
  }
  const found = { bodyLevelStep: most('bodyLevelStep'), bodyColourStep: most('bodyColourStep'), levelStep: most('levelStep'), pop: most('pop') }
  const why: string[] = []
  const judge = (value: number | undefined, max: number | null, text: string): void => {
    if (max !== null && value !== undefined && value > max) why.push('place picture off: ' + text + ', limit ' + max)
  }
  const lim = (v: number | null): number | null => v
  judge(sides.mean, lim(P.sideMean), 'mean side difference at T ' + sides.mean.toFixed(3))
  judge(sides.p99, lim(P.sideP99), '99th percentile of the side difference at T ' + sides.p99)
  judge(found.bodyLevelStep?.value, lim(P.levelStep), 'the mean level of the body steps by ' + (found.bodyLevelStep?.value ?? 0).toFixed(2) + ' into frame ' + position(found.bodyLevelStep?.k ?? 0, r))
  judge(found.bodyColourStep?.value, lim(P.colourStep), 'the mean colour of the body steps by ' + (found.bodyColourStep?.value ?? 0).toFixed(2) + ' into frame ' + position(found.bodyColourStep?.k ?? 0, r))
  judge(found.pop?.value, lim(P.maxPop), 'pop score ' + (found.pop?.value ?? 0).toFixed(2) + ' from frame ' + position(found.pop?.k ?? 0, r) + ' to the next')
  return { segment: seg.id, frameT, window: [h.placeFirstFrame, h.placeLastFrame], frames: [first, last], rate: r, sides: { mean: sides.mean, p50: sides.p50, p99: sides.p99, p999: sides.p999, max: sides.max, shareOver16: sides.shareOver16, panel: stem + '-place-sides.png' }, rows, ...found, why }
}

async function placePart(): Promise<PartResult & { kinds: Record<string, PlaceKind | null> }> {
  const out: Record<string, PlaceKind | null> = {}
  const why: string[] = []
  for (const kind of kinds) {
    const p = await placeOf(kind)
    out[kind] = p
    if (p) for (const w of p.why) why.push(kind + ': ' + w)
  }
  return { measured: true, pass: why.length === 0, why, kinds: out }
}

function placeText(kind: Kind, p: PlaceKind | null): string[] {
  if (!p) return ['### ' + kind, '', 'The stop has no ' + kind + '.', '']
  const P = S.place
  const H = cfg.raw.handover.limits
  const lim = (v: number | null, with_: number): string => (v === null ? 'no limit yet, not judged' : 'limit ' + v) + '; with the picture the handover report allows ' + with_
  const lines = ['### ' + kind + ' (' + p.segment + (p.frameT >= 0 ? ', T at ' + p.frameT + ', place window ' + p.window[0] + ' to ' + p.window[1] + ', frames ' + p.frames[0] + ' to ' + p.frames[1] + ' at rate ' + p.rate : '') + ')', '']
  if (p.note) lines.push('Note: ' + p.note + '.', '')
  if (p.why.length) lines.push(...p.why.map((w) => '- RED ' + w), '')
  if (!p.sides) return lines
  lines.push('Both sides at T, the globe side without the place picture (display values 0 to 255): mean difference ' + p.sides.mean.toFixed(3) + ' (' + lim(P.sideMean, H.sideMean) + '), 99th percentile ' + p.sides.p99 + ' (' + lim(P.sideP99, H.sideP99) + '), 99.9th ' + p.sides.p999 + ', max ' + p.sides.max + ', ' + (p.sides.shareOver16 * 100).toFixed(2) + ' percent of pixels over 16. Picture: ' + p.sides.panel.slice(ROOT.length + 1))
  if (p.bodyLevelStep) lines.push('Largest step between two frames on the body: mean level ' + p.bodyLevelStep.value.toFixed(2) + ' into frame ' + position(p.bodyLevelStep.k, p.rate) + ' (' + lim(P.levelStep, H.levelStep) + ')' + (p.bodyColourStep ? ', mean colour ' + p.bodyColourStep.value.toFixed(2) + ' into frame ' + position(p.bodyColourStep.k, p.rate) + ' (' + lim(P.colourStep, H.colourStep) + ')' : '') + '.')
  if (p.levelStep) lines.push('Largest level step of the whole frame against the middle of its two neighbours: ' + p.levelStep.value.toFixed(2) + ' at frame ' + position(p.levelStep.k, p.rate) + '.')
  if (p.pop) lines.push('Largest pop score: ' + p.pop.value.toFixed(2) + ' from frame ' + position(p.pop.k, p.rate) + ' to the next (' + (P.maxPop === null ? 'no limit yet, not judged' : 'limit ' + P.maxPop) + ').')
  lines.push('', '| frame | level | body share | body level | body level step | body colour step | level step | pop | pop of one block |', '|---|---|---|---|---|---|---|---|---|')
  for (const row of p.rows) lines.push('| ' + [position(row.k, p.rate) + (row.k === p.frameT * p.rate ? ' T' : ''), row.level.toFixed(2), row.bodyShare.toFixed(3), row.bodyLevel.toFixed(2), cell(row.bodyLevelStep, 2), cell(row.bodyColourStep, 2), cell(row.levelStep, 2), cell(row.pop, 2), cell(row.popBlock, 2)].join(' | ') + ' |')
  lines.push('')
  return lines
}

interface ParityNumbers { mean: number; p99: number; max: number; level: number; colour: number; coarse: number; coarseMax: number; blockLevel: number; blockAt: [number, number]; detail: number }
interface ParityRow extends ParityNumbers { segment: string; kind: string; share: number; frame: number }
interface ParityOut { formats: [string, string]; tier: string; factor: number; rows: ParityRow[]; panel: string | null; secondsAFrame: Record<string, number | null> }

async function parityPart(): Promise<PartResult & Partial<ParityOut>> {
  const P = S.parity
  const [bigId, filmId] = [formatId(cfg, P.formats[0]), formatId(cfg, P.formats[1])]
  const big = cfg.formats[bigId]!
  const small = cfg.formats[filmId]!
  const factor = big.width / small.width
  if (!Number.isInteger(factor) || factor < 2 || big.height !== small.height * factor) return { measured: false, pass: false, why: ['parity: NOT MEASURED, ' + bigId + ' is not a whole multiple of ' + filmId] }
  const wanted: { segment: string; kind: string; share: number; frame: number }[] = []
  for (const kind of ['dive', 'terrain', 'rise'] as const) {
    if (kind !== 'terrain' && !kinds.includes(kind)) continue
    const seg = cfg.segments.find((s) => s.stop === stop && s.kind === kind)
    if (!seg) continue
    for (const share of P.at[kind]) wanted.push({ segment: seg.id, kind, share, frame: Math.min(seg.firstFrame + Math.round(share * (seg.endFrame - seg.firstFrame)), seg.endFrame - 1) })
  }
  const seconds: Record<string, number | null> = {}
  const files: Record<string, string[]> = {}
  for (const fmt of [filmId, bigId]) {
    const before = [rendered, renderSeconds]
    files[fmt] = []
    for (const w of wanted) {
      if (session && sessionFormat !== fmt) await drop()
      session ??= await open(fmt)
      files[fmt]!.push(await still(w.frame * pageRate, P.tier, 'beauty', fmt))
      console.log(stop + ' parity: ' + fmt + ' frame ' + w.frame + ' (' + w.segment + ')')
    }
    seconds[fmt] = rendered > before[0]! ? Number(((renderSeconds - before[1]!) / (rendered - before[0]!)).toFixed(2)) : null
  }
  const panel = join(dir, stem + '-parity.png')
  const n = measure<ParityNumbers[]>({
    op: 'parity', coarse: P.coarse, grid: S.pictures.grid, output: panel, gain: 8, limit: cfg.raw.critics.maxImageLongEdgePx,
    pairs: wanted.map((w, i) => ({ big: files[bigId]![i]!, film: files[filmId]![i]!, label: stop + ' ' + w.segment + ' frame ' + w.frame + ': ' + filmId + ', ' + bigId + ' scaled down by ' + factor + ', the difference times 8' })),
  })
  const rows: ParityRow[] = wanted.map((w, i) => ({ ...w, ...n[i]! }))
  const why: string[] = []
  const judge = (key: 'mean' | 'coarse' | 'blockLevel' | 'level', max: number | null, what: string): void => {
    if (max === null) return
    const bad = rows.filter((row) => Math.abs(row[key]) > max)
    if (bad.length === 0) return
    const top = bad.reduce((x, y) => (Math.abs(y[key]) > Math.abs(x[key]) ? y : x))
    why.push('parity: ' + what + ' ' + top[key].toFixed(3) + ' at frame ' + top.frame + ' (' + top.segment + '), limit ' + max + (bad.length > 1 ? ' (' + bad.length + ' frames over it)' : ''))
  }
  const lim = (v: number | null): number | null => v
  judge('mean', lim(P.maxMean), 'mean difference between ' + bigId + ' scaled down and ' + filmId)
  judge('coarse', lim(P.maxCoarse), 'mean difference at one ' + P.coarse + 'th of the size')
  judge('blockLevel', lim(P.maxBlockLevel), 'level difference of one block')
  judge('level', lim(P.maxLevel), 'level difference of the whole frame')
  return { measured: true, pass: why.length === 0, why, formats: [bigId, filmId], tier: P.tier, factor, rows, panel, secondsAFrame: seconds }
}

function parityText(p: PartResult & Partial<ParityOut>): string[] {
  const P = S.parity
  const lim = (v: number | null): string => (v === null ? 'no limit yet, not judged' : 'limit ' + v)
  const rows = p.rows ?? []
  const top = (key: 'mean' | 'coarse' | 'blockLevel' | 'level'): string => {
    if (rows.length === 0) return 'none'
    const r = rows.reduce((x, y) => (Math.abs(y[key]) > Math.abs(x[key]) ? y : x))
    return r[key].toFixed(3) + ' at frame ' + r.frame + ' (' + r.segment + ')'
  }
  const [bigId, filmId] = p.formats!
  const lines = [
    'The same film frame at ' + bigId + ' scaled down by ' + p.factor + ' against ' + filmId + ', tier ' + p.tier + ', display values 0 to 255. Seconds a rendered frame on ' + machineId() + ': ' + Object.entries(p.secondsAFrame ?? {}).map(([k, v]) => k + ' ' + (v === null ? 'already rendered' : v)).join(', ') + '.', '',
    'Largest mean difference: ' + top('mean') + ', ' + lim(P.maxMean) + '.',
    'Largest mean difference at one ' + P.coarse + 'th of the size (what is left when the fine grain is averaged away): ' + top('coarse') + ', ' + lim(P.maxCoarse) + '.',
    'Largest level difference of one block (a grid of ' + S.pictures.grid.join(' by ') + '): ' + top('blockLevel') + ', ' + lim(P.maxBlockLevel) + '.',
    'Largest level difference of the whole frame: ' + top('level') + ', ' + lim(P.maxLevel) + '.',
  ]
  if (p.panel) lines.push('Picture: ' + p.panel.slice(ROOT.length + 1))
  lines.push('')
  if (p.why.length) lines.push(...p.why.map((w) => '- RED ' + w), '')
  lines.push('| frame | segment | mean | 99th | max | level | colour | coarse mean | coarse max | block level | block | fine detail, ' + filmId + ' over ' + bigId + ' |', '|---|---|---|---|---|---|---|---|---|---|---|---|')
  for (const r of rows) lines.push('| ' + [r.frame, r.segment, r.mean.toFixed(3), r.p99.toFixed(1), r.max.toFixed(0), r.level.toFixed(3), r.colour.toFixed(3), r.coarse.toFixed(3), r.coarseMax.toFixed(2), r.blockLevel.toFixed(3), r.blockAt.join(','), r.detail.toFixed(3)].join(' | ') + ' |')
  lines.push('', 'level: the mean of ' + bigId + ' less the mean of ' + filmId + '. colour: the largest of the three channel means, the same way. block level: the block whose mean differs most. fine detail: the mean strength of the finest detail in ' + filmId + ' over the same in ' + bigId + ' scaled down; 1 is the same grain.', '')
  return lines
}

interface Work { programs: number; textures: number; buffers: number }
interface CountRow extends Work { k: number; frame: number; segment: string; kind: string; ahead: Work | null; warmed: number }
interface CountSegment extends Work { segment: string; kind: string; judged: boolean; frames: number; framesWithWork: number; first: number | null }
interface CountsOut { format: string; tier: string; warm: boolean; rate: number; frames: [number, number]; pictures: number; warmDraws: number; segments: CountSegment[]; rows: CountRow[]; seconds: number }

async function countsPart(): Promise<PartResult & Partial<CountsOut>> {
  const C = S.counts
  const fmt = formatId(cfg, C.format)
  const own = cfg.segments.filter((s) => s.stop === stop)
  const first = Math.min(...own.map((s) => s.firstFrame))
  const end = Math.max(...own.map((s) => s.endFrame))
  hashes ??= ensureBuild()
  const t0 = Date.now()
  const rows: CountRow[] = []
  let warm = false
  let r = 1
  for (let attempt = 1; ; attempt++) {
    rows.length = 0
    try {
      await drop()
      session = await open(fmt)
      const has = await session.page.evaluate(() => {
        const s = (window as unknown as { showcase: Record<string, unknown> }).showcase
        return { counts: typeof s.counts === 'function', ahead: typeof s.ahead === 'function' }
      })
      if (!has.counts) return { measured: false, pass: false, why: ['counts: NOT MEASURED, the page has no counter (showcase.counts) on this commit'] }
      warm = has.ahead
      r = pageRate
      await session.page.evaluate(() => (window as unknown as { showcase: { counts(): unknown } }).showcase.counts())
      for (let from = first * r; from < end * r; from += 30) {
        const to = Math.min(from + 30, end * r)
        const got = await session.page.evaluate(async ([k0, k1, rate, tier, ahead, start]) => {
          const s = (window as unknown as { showcase: { renderFrame(f: number, t: string): Promise<void>; counts(): Work; ahead?(f: number, t: string, all?: boolean): Promise<number> } }).showcase
          const out: { k: number; ahead: Work | null; warmed: number; work: Work }[] = []
          for (let k = k0 as number; k < (k1 as number); k++) {
            let before: Work | null = null
            let warmed = 0
            if (ahead) {
              warmed = Number(await s.ahead!(k / (rate as number), tier as string, k === start)) || 0
              before = s.counts()
            }
            await s.renderFrame(k, tier as string)
            out.push({ k, ahead: before, warmed, work: s.counts() })
          }
          return out
        }, [from, to, r, C.tier, warm, first * r] as const)
        for (const g of got) {
          const frame = Math.floor(g.k / r)
          const seg = own.find((x) => frame >= x.firstFrame && frame < x.endFrame) ?? cfg.segments.find((x) => frame >= x.firstFrame && frame < x.endFrame)!
          const b = g.ahead ?? { programs: 0, textures: 0, buffers: 0 }
          rows.push({ k: g.k, frame, segment: seg.id, kind: seg.kind, ahead: g.ahead, warmed: g.warmed, programs: g.work.programs + b.programs, textures: g.work.textures + b.textures, buffers: g.work.buffers + b.buffers })
        }
        console.log(stop + ' counts: frame ' + position(to - 1, r) + ' of ' + first + ' to ' + (end - 1) + ', ' + Math.round((Date.now() - t0) / 1000) + ' s')
      }
      break
    } catch (e) {
      await drop()
      if (attempt >= 3) throw e
      console.error('[smooth] ' + String(e).split('\n')[0]!.slice(0, 200) + '. The walk starts again on a fresh page, try ' + (attempt + 1) + ' of 3')
    }
  }
  const JUDGED = ['dive', 'rise', 'travel']
  const segments: CountSegment[] = []
  for (const row of rows) {
    let s = segments.find((x) => x.segment === row.segment)
    if (!s) {
      s = { segment: row.segment, kind: row.kind, judged: JUDGED.includes(row.kind), frames: 0, framesWithWork: 0, first: null, programs: 0, textures: 0, buffers: 0 }
      segments.push(s)
    }
    s.frames++
    s.programs += row.programs
    s.textures += row.textures
    s.buffers += row.buffers
    if (row.programs + row.textures + row.buffers > 0) {
      s.framesWithWork++
      s.first ??= row.k
    }
  }
  const why: string[] = []
  for (const s of segments) {
    if (!s.judged) continue
    const over = rows.filter((row) => row.segment === s.segment && (row.programs > C.programs || row.textures > C.textures || row.buffers > C.buffers))
    if (over.length === 0) continue
    const top = over.reduce((x, y) => (y.programs + y.textures + y.buffers > x.programs + x.textures + x.buffers ? y : x))
    why.push('counts: ' + s.segment + ' makes ' + s.programs + ' programs, ' + s.textures + ' texture uploads and ' + s.buffers + ' buffers in ' + over.length + ' of its ' + s.frames + ' pictures, first at frame ' + position(over[0]!.k, r) + ', most at frame ' + position(top.k, r) + ' (' + top.programs + ', ' + top.textures + ', ' + top.buffers + '), limit ' + C.programs + ', ' + C.textures + ', ' + C.buffers + ' a picture')
  }
  const note = warm ? undefined : 'the page has no warm start call (showcase.ahead) on this commit: the frames were stepped without it'
  return { measured: true, pass: why.length === 0, why, format: fmt, tier: C.tier, warm, rate: r, frames: [first, end - 1], pictures: rows.length, warmDraws: rows.reduce((n, row) => n + row.warmed, 0), segments, rows: rows.filter((row) => row.programs + row.textures + row.buffers > 0), seconds: Math.round((Date.now() - t0) / 1000), ...(note ? { note } : {}) }
}

function countsText(p: PartResult & Partial<CountsOut>): string[] {
  const lines = [
    'Film frames ' + p.frames![0] + ' to ' + p.frames![1] + ' in order on one fresh page, ' + p.pictures + ' pictures at rate ' + p.rate + ', tier ' + p.tier + ' at ' + p.format + ', ' + p.seconds + ' s. ' + (p.warm ? 'Before each picture the warm start ran as the live player calls it (showcase.ahead, every due warm frame at the first picture): ' + p.warmDraws + ' warm draws. Its work counts for that picture and stands in brackets.' : 'No warm start call.') + ' Judged: dive, rise and travel, every picture.', '',
  ]
  if (p.why.length) lines.push(...p.why.map((w) => '- RED ' + w), '')
  lines.push('| segment | judged | pictures | pictures with work | first | programs | texture uploads | buffers |', '|---|---|---|---|---|---|---|---|')
  for (const s of p.segments ?? []) lines.push('| ' + [s.segment, s.judged ? 'yes' : 'no', s.frames, s.framesWithWork, s.first === null ? '' : position(s.first, p.rate!), s.programs, s.textures, s.buffers].join(' | ') + ' |')
  lines.push('', 'Every picture with work (of the warm start call in brackets):', '', '| frame | segment | programs | texture uploads | buffers | warm draws |', '|---|---|---|---|---|---|')
  const part = (all: number, ahead: number | undefined): string => all + (ahead ? ' (' + ahead + ')' : '')
  for (const r of p.rows ?? []) lines.push('| ' + [position(r.k, p.rate!), r.segment, part(r.programs, r.ahead?.programs), part(r.textures, r.ahead?.textures), part(r.buffers, r.ahead?.buffers), r.warmed || ''].join(' | ') + ' |')
  lines.push('')
  return lines
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
      const mark = (x: { value: number; points?: number } | null): string => (x ? cell(x.value) + (x.points === undefined ? '' : ' over ' + x.points) : '')
      lines.push('| ' + [r.rate === 1 ? 'whole frames' : 'rate ' + r.rate, c.name, Number(c.mean.toPrecision(4)) + ' ' + c.unit + (c.floored ? ' (under the floor ' + c.floor + ', judged against the floor)' : ''), cell(c.peak?.value), pos(c.peak), mark(c.worstStep), pos(c.worstStep), mark(c.worstHalfStep), pos(c.worstHalfStep), cell(c.seams[0]!.step), cell(c.seams[1]!.step), mark(c.fallBeforePeak), mark(c.climbAfterPeak), cell(c.worstBeyond?.value) + (c.worstBeyond ? ' at ' + pos(c.worstBeyond) : '')].join(' | ') + ' |')
    }
  }
  const dots = p.runs[0]!.curves.find((c) => c.points)?.points
  if (dots) lines.push('', 'The speed is a mean over ' + dots.of + ' ground points on a ring round the place (' + (ring === 'ground' ? 'a circle on the ground, as wide as ' + L.ringPx + ' px at its distance' : 'a circle of ' + L.ringPx + ' px in the picture, a point over the sky has no ground') + '). Each step and each fall or climb compares the mean over the points that have ground in every frame it compares: "over N" is their count. Fewer than ' + dots.min + ' is not measured, which is red. Fewest points in a frame of the move: ' + p.runs.map((r) => (r.rate === 1 ? 'whole frames ' : 'rate ' + r.rate + ' ') + (r.curves.find((c) => c.points)?.points?.fewest ?? '')).join(', ') + '.')
  lines.push('', 'Limits: step ' + L.maxStep + ' of the mean over one film frame, from ' + L.seamFrames + ' film frames before the segment to ' + L.seamFrames + ' after it; fall before the largest value and climb after it ' + L.maxRebound + ' of the mean, inside the segment. Steps further into the neighbours are shown and not judged.', '')
  if (p.faults.length) lines.push(...p.faults.map((f) => '- RED ' + f.text), '')
  else lines.push('No number of the path is over its limit.', '')
  const fine = p.runs.length > 1
  const head = ['frame', 'segment and side', 'height', 'rate', 'step', ...(fine ? ['step at rate ' + p.runs[1]!.rate] : []), 'turn', 'step', ...(fine ? ['step at rate ' + p.runs[1]!.rate] : []), 'speed', 'step', ...(fine ? ['step at rate ' + p.runs[1]!.rate] : []), ...(dots ? ['points'] : [])]
  lines.push('Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over ' + L.maxStep + '.', '')
  lines.push('| ' + head.join(' | ') + ' |', '|' + head.map(() => '---').join('|') + '|')
  const star = (v: number | null): string => (v === null ? '' : v.toFixed(3) + (v > L.maxStep ? ' *' : ''))
  p.rows.forEach((row, i) => {
    const cells = [String(row.frame) + (row.frame === p.firstFrame ? ' first' : row.frame === p.endFrame - 1 ? ' last' : row.frame === p.frameT ? ' T' : ''), p.sides[i]!, p.heights[i] === null ? '' : p.heights[i]!.toExponential(3)]
    for (const name of ['rate', 'turn', 'speed']) {
      const v = row.values[name]!
      cells.push(cell(v.over), star(v.step), ...(fine ? [star(v.fine)] : []))
      if (v.points !== undefined) cells.push(String(v.points))
    }
    lines.push('| ' + cells.join(' | ') + ' |')
  })
  lines.push('')
  return lines
}

function commit(): string {
  try {
    const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
    const dirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=no', '--', 'src', 'tools', 'config', 'package.json', 'index.html'], { cwd: ROOT, encoding: 'utf8' }).trim()
    return head + (dirty ? ' with changes that are not committed' : '')
  } catch {
    return 'unknown'
  }
}

async function main(): Promise<void> {
  const parts: Record<string, PartResult> = {}
  if (only.includes('path')) parts.path = pathPart()
  if (only.includes('pictures')) {
    requireDisk(cfg)
    try {
      parts.pictures = await picturesPart()
    } finally {
      await drop()
    }
  }
  if (only.includes('place')) {
    requireDisk(cfg)
    try {
      parts.place = await placePart()
    } finally {
      await drop()
    }
  }
  if (only.includes('parity')) {
    requireDisk(cfg)
    try {
      parts.parity = await parityPart()
    } finally {
      await drop()
    }
  }
  if (only.includes('counts')) {
    requireDisk(cfg)
    try {
      parts.counts = await countsPart()
    } finally {
      await drop()
    }
  }
  const why = Object.values(parts).flatMap((p) => p.why)
  const pass = why.length === 0
  const out = { stop, commit: commit(), engineHash: hashes?.engine ?? null, stopHash: hashes?.stops[stop!] ?? null, machine: machineId(), rate, calibrate, kinds, only, limits: S, pass, why, parts }
  json(join(dir, stem + '.json'), out)
  const lines = ['# smooth: ' + stop, '', 'Commit ' + out.commit + '. Capture rate ' + rate + '. Parts: ' + only.join(', ') + '.' + (calibrate ? ' A calibration run: every number is written, the exit code is 0.' : ''), '']
  lines.push(pass ? 'VERDICT: green. No number is over its limit.' : 'VERDICT: red. ' + why.length + ' number' + (why.length === 1 ? '' : 's') + ' over the limit or not measured.', '')
  for (const [name, p] of Object.entries(parts)) {
    lines.push('## ' + name, '')
    if (!p.measured) {
      lines.push(...p.why.map((w) => '- RED ' + w), '')
      continue
    }
    if (p.note) lines.push('Note: ' + p.note + '.', '')
    if (name === 'path') for (const kind of kinds) lines.push(...pathText(kind, (p as ReturnType<typeof pathPart>).kinds[kind] ?? null))
    if (name === 'pictures') {
      const pp = p as Awaited<ReturnType<typeof picturesPart>>
      lines.push('Tier ' + pp.tier + ', rate ' + pp.rate + (pp.secondsAFrame === null ? ', every frame was already rendered' : ', ' + pp.secondsAFrame + ' s a rendered frame on ' + machineId()) + '.', '')
      for (const kind of kinds) lines.push(...picturesText(kind, pp.kinds[kind] ?? null))
    }
    if (name === 'counts') lines.push(...countsText(p as Awaited<ReturnType<typeof countsPart>>))
    if (name === 'parity') lines.push(...parityText(p as Awaited<ReturnType<typeof parityPart>>))
    if (name === 'place') for (const kind of kinds) lines.push(...placeText(kind, (p as Awaited<ReturnType<typeof placePart>>).kinds[kind] ?? null))
  }
  writeFileSync(join(dir, stem + '.md'), lines.join('\n'))
  console.log('smooth ' + stop + ': ' + (pass ? 'green' : 'red, ' + why.length + ' over the limit or not measured') + '. ' + join('out/work/smooth', stem + '.md'))
  for (const w of why.slice(0, 12)) console.log('  ' + w)
  if (why.length > 12) console.log('  and ' + (why.length - 12) + ' more, see the report')
  process.exit(pass || calibrate ? 0 : 1)
}

void main()
