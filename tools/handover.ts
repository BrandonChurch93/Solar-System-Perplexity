import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import * as THREE from 'three'
import { DIST, ROOT, WORK, args, ensureBuild, formatId, loadConfig, machineId, requireDisk } from './lib/common'
import { openCapture, renderPng, type Session } from './lib/browser'
import { addLook } from './lib/looks'
import { image, json, padFrame } from './lib/render'
import type { Segment } from '../src/config'
import { rawMotion } from '../src/core/motion'
import { shutterMid } from '../src/core/sampler'
import type { Pose, ViewKind } from '../src/core/types'
import { FilmDirector } from '../src/director/film'
import { handoverFrame, handoverOf, sideAt } from '../src/director/handover'
import { StopPlan, type Fit, type MoveParams } from '../src/director/moves'
import { plans } from '../src/director/plans'
import { coverFrames } from '../src/director/timeline'

// The measures of the handover (cut/HANDOVER.md, E4). One stop, its dive and its rise.
//   npm run handover -- --stop ID [--kind dive|rise] [--tier draft|review] [--only sides,under,flow,frames,sheets,top]
//                       [--params FILE --dist DIR --name NAME]   (judge another build of the stop, for example the frozen one)
// Everything is written to out/work/handover/. Exit 1 when a judged number is over its limit in config.handover.limits.

type Kind = 'dive' | 'rise'
interface Verdict { pass: boolean; why: string[] }

const cfg = loadConfig()
const a = args()
const stop = a.stop
if (!stop || !cfg.stopIds.includes(stop)) {
  console.error('handover: --stop must be one of ' + cfg.stopIds.join(', '))
  process.exit(2)
}
const sheetTier = a.tier ?? 'review'
if (!Object.hasOwn(cfg.tiers, sheetTier)) throw new Error('unknown tier ' + sheetTier)
const only = a.only ? a.only.split(',') : ['sides', 'under', 'flow', 'frames', 'sheets', 'top']
const name = a.name ?? stop
const dist = a.dist ? resolve(a.dist) : DIST
const other = Boolean(a.dist)
requireDisk(cfg)
const hashes = other ? null : ensureBuild()
const format = formatId(cfg, a.format)
const master = cfg.formats[cfg.formatKeys.master]!
const fps = cfg.fps
const L = cfg.raw.handover.limits
const maxRate = cfg.raw.handover.maxRateOverMean
const dir = join(WORK, 'handover')
const frameDir = join(dir, name, 'frames')
mkdirSync(frameDir, { recursive: true })

let plan = plans.find((p) => p.id === stop)!
let film: FilmDirector
if (a.params) {
  const given = JSON.parse(readFileSync(resolve(a.params), 'utf8')) as { fit: Fit; params: MoveParams }
  plan = new StopPlan(stop, given.fit, given.params)
  film = new FilmDirector(plans.map((p) => (p.id === stop ? plan : p)))
} else film = new FilmDirector(plans)

const stamp = other ? 'dist:' + dist : hashes!.engine + ':' + JSON.stringify(hashes!.stops)
let session: Session | null = null
let view = ''

async function still(frame: number, tier: string, diag: string): Promise<string> {
  const tag = diag === 'beauty' ? '' : '-' + diag.replace(/[^A-Za-z0-9.]+/g, '_')
  const file = join(frameDir, 'f' + padFrame(frame) + '-' + tier + tag + '.png')
  const note = file + '.stamp'
  if (existsSync(file) && existsSync(note) && readFileSync(note, 'utf8') === stamp + '|' + format) return file
  for (let attempt = 1; ; attempt++) {
    try {
      session ??= await openCapture({ dist, format, assets: 'full', diag: 'beauty' })
      if (view !== diag) {
        await session.page.evaluate((v) => (window as unknown as { showcase: { setDiagnostic(v: string): void } }).showcase.setDiagnostic(v), diag)
        view = diag
      }
      const { png } = await renderPng(session.page, frame, tier)
      writeFileSync(file, png)
      writeFileSync(note, stamp + '|' + format)
      return file
    } catch (e) {
      await session?.close().catch(() => undefined)
      session = null
      view = ''
      if (attempt >= 3) throw e
      console.error('[handover] ' + String(e).split('\n')[0]!.slice(0, 200) + '. Fresh page, try ' + (attempt + 1) + ' of 3')
    }
  }
}

function measure<T>(job: object): T {
  const reply = execFileSync('python3', [join(ROOT, 'tools/img/handover.py')], { input: JSON.stringify(job), encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'], maxBuffer: 1 << 26 })
  return JSON.parse(reply) as T
}

const round = (v: number, digits = 4): number => Number(v.toFixed(digits))
const RAD = Math.PI / 180

class Line {
  readonly seg: Segment
  readonly opted: boolean
  readonly frameT: number
  readonly timeT: number
  readonly window: [number, number]
  constructor(readonly kind: Kind) {
    this.seg = cfg.segments.find((s) => s.stop === stop && s.kind === kind)!
    const h = handoverOf(stop!, kind)
    this.opted = h !== null
    if (h) {
      this.frameT = handoverFrame(h)
      this.timeT = h.time
      this.window = [h.placeFirstFrame, h.placeLastFrame]
    } else {
      const c = coverFrames(this.seg)!
      this.frameT = c.centerFrame
      this.timeT = c.centerFrame / fps
      this.window = [c.firstFrame, c.lastFrame]
    }
  }

  pose(time: number, side: ViewKind): Pose {
    return this.kind === 'dive' ? plan.divePose(time, side) : plan.risePose(time, side)
  }

  // The camera of either side as a camera at the unit sphere: the globe side as it is, the close side through the twin.
  carried(time: number, side: ViewKind): Pose {
    return side === 'orbit' ? this.pose(time, 'orbit') : plan.twin(this.pose(time, 'terrain'), time)
  }

  // The side that is the far one before T in a dive and after T in a rise.
  sideOf(time: number): ViewKind {
    return sideAt(this.seg, time)
  }
}

function project(p: Pose, point: THREE.Vector3): { x: number; y: number; front: boolean } {
  const v = point.clone().sub(p.position).applyQuaternion(p.quaternion.clone().invert())
  const k = master.height / 2 / Math.tan((p.vfov * RAD) / 2)
  const z = Math.min(v.z, -1e-9)
  return { x: master.width / 2 + (v.x / -z) * k, y: master.height / 2 - (v.y / -z) * k, front: v.z < -1e-9 }
}

function sphereHit(p: Pose, sx: number, sy: number): THREE.Vector3 | null {
  const tan = Math.tan((p.vfov * RAD) / 2)
  const ray = new THREE.Vector3(sx * tan * (master.width / master.height), sy * tan, -1).normalize().applyQuaternion(p.quaternion)
  const along = -p.position.dot(ray)
  const disc = along * along - p.position.lengthSq() + 1
  if (disc <= 0) return null
  const t = along - Math.sqrt(disc)
  return t > 0 ? p.position.clone().addScaledVector(ray, t) : null
}

// A grid of 0 and 1, rows from the top: the blocks whose centre ray meets the body.
function bodyGrid(p: Pose): number[][] {
  const cols = Math.floor(master.width / L.blockPx)
  const rows = Math.floor(master.height / L.blockPx)
  const out: number[][] = []
  for (let r = 0; r < rows; r++) {
    const row: number[] = []
    for (let c = 0; c < cols; c++) {
      const sx = (((c + 0.5) * L.blockPx) / master.width) * 2 - 1
      const sy = 1 - (((r + 0.5) * L.blockPx) / master.height) * 2
      row.push(sphereHit(p, sx, sy) ? 1 : 0)
    }
    out.push(row)
  }
  return out
}

interface SideNumbers { mean: number; p50: number; p99: number; p999: number; max: number; shareOver1: number; shareOver4: number; shareOver16: number; pixelsOver16: number; meanSigned: number[] }

async function sides(line: Line): Promise<Record<string, unknown> & Verdict> {
  if (!line.opted) return { pass: false, why: ['the stop has not opted in: there is no handover, the swap lies under a cover'] }
  if (other) return { pass: false, why: ['the sides cannot be forced in another build'] }
  const t = String(round(line.timeT, 6))
  const close = await still(line.frameT, 'draft', 'beauty/side=terrain/t=' + t)
  const globe = await still(line.frameT, 'draft', 'beauty/side=orbit/t=' + t)
  const stem = join(dir, name + '-' + line.kind)
  const n = measure<SideNumbers>({ op: 'sides', close, globe, difference: stem + '-difference.png', panel: stem + '-sides.png', gain: L.differenceGain, limit: cfg.raw.critics.maxImageLongEdgePx })
  addLook({ file: stem + '-sides.png' }, { kind: 'compare', label: stop + ' ' + line.kind + ', both sides at T (frame ' + line.frameT + ') and their difference times ' + L.differenceGain, stop: stop!, segment: line.seg.id, frame: line.frameT, tier: 'draft' })
  const why: string[] = []
  if (n.mean > L.sideMean) why.push('mean side difference ' + round(n.mean, 3) + ' over ' + L.sideMean)
  if (n.p99 > L.sideP99) why.push('99th percentile of the side difference ' + n.p99 + ' over ' + L.sideP99)
  return { ...n, close, globe, difference: stem + '-difference.png', panel: stem + '-sides.png', pass: why.length === 0, why }
}

interface UnderNumbers { pixels: number; share: number; mean: number; p50: number; p99: number; meanSigned: number[] }

// What lies under the place picture at T: the globe side drawn alone (place picture off) against the globe side with the picture, on the body where
// the pass draws the picture at more than half weight. The place window fades from the one to the other, so this is how far the plates are from
// the picture; where it is large the fade is a dissolve between two pictures that differ.
async function under(line: Line): Promise<Record<string, unknown> & Verdict> {
  if (!line.opted) return { pass: false, why: ['the stop has not opted in: there is no place picture'] }
  if (other) return { pass: false, why: ['the place picture cannot be switched off in another build'] }
  const h = handoverOf(stop!, line.kind)!
  if (!h.picture) return { pass: true, why: [], none: true }
  const t = String(round(line.timeT, 6))
  const withPicture = await still(line.frameT, 'draft', 'beauty/side=orbit/t=' + t)
  const alone = await still(line.frameT, 'draft', 'beauty/side=orbit/t=' + t + '/noplace')
  const mask = await still(line.frameT, 'draft', 'beauty/side=orbit/t=' + t + '/mask')
  const panel = join(dir, name + '-' + line.kind + '-under.png')
  const n = measure<UnderNumbers>({ op: 'under', picture: withPicture, alone, mask, body: bodyGrid(line.carried(line.timeT, 'orbit')), panel, gain: L.underGain, limit: cfg.raw.critics.maxImageLongEdgePx })
  addLook({ file: panel }, { kind: 'compare', label: stop + ' ' + line.kind + ', the globe side at T (frame ' + line.frameT + ') with the place picture, alone, and their difference times ' + L.underGain, stop: stop!, segment: line.seg.id, frame: line.frameT, tier: 'draft' })
  const why: string[] = []
  if (n.pixels > 0 && n.mean > L.underMean) why.push('under the place picture the globe alone differs from it by a mean of ' + round(n.mean, 2) + ' at T, limit ' + L.underMean)
  return { ...n, picture: withPicture, alone, mask, panel, pass: why.length === 0, why }
}

// The check of the plates: the globe side alone (place picture off) from straight above the place, at the heights of the film's own path, from the
// far end of the line to T. Every frame must look like one place coming closer.
async function top(line: Line): Promise<string> {
  const count = L.sheetFrames
  const far = line.kind === 'dive' ? line.seg.firstFrame : line.seg.endFrame - 1
  const inputs = []
  for (let i = 0; i < count; i++) {
    const f = Math.round(far + ((line.frameT - far) * i) / (count - 1))
    const time = (f + shutterMid()) / fps
    inputs.push({ path: await still(f, 'draft', 'beauty/side=orbit/noplace/top'), label: 'f' + padFrame(f) + ' height ' + Number((line.pose(time, 'orbit').position.length() - 1).toPrecision(3)) })
  }
  const file = join(dir, name + '-' + line.kind + '-top.png')
  image({ op: 'sheet', output: file, inputs, limit: cfg.raw.critics.maxImageLongEdgePx })
  addLook({ file }, { kind: 'sheet', label: stop + ' ' + line.kind + ', the globe side alone from straight above the place, ' + count + ' frames from the far end to T (frame ' + line.frameT + '), place picture off, draft tier', stop: stop!, segment: line.seg.id, first: Math.min(far, line.frameT), last: Math.max(far, line.frameT), tier: 'draft' })
  return file
}

interface FlowNumbers { points: number; stepFrames: number; meanBefore: number; meanAfter: number; meanGap: number; maxGap: number; positionGap: number; angleGapDeg: number }

// The image motion of ground points in pixels per frame, just before T on one side and just after T on the other.
// Both cameras are taken as cameras at the unit sphere (the close side through the twin), and the points turn with the body.
function flow(line: Line): FlowNumbers & Verdict {
  const step = L.flowStepFrames
  const dt = step / fps
  const T = line.timeT
  const before: ViewKind = line.kind === 'dive' ? 'orbit' : 'terrain'
  const after: ViewKind = line.kind === 'dive' ? 'terrain' : 'orbit'
  const b0 = line.carried(T - dt, before)
  const b1 = line.carried(T, before)
  const a0 = line.carried(T, after)
  const a1 = line.carried(T + dt, after)
  const back = plan.turn(T).invert()
  const at = (time: number, p: THREE.Vector3): THREE.Vector3 => p.clone().applyQuaternion(back).applyQuaternion(plan.turn(time))
  const [cols, rows] = cfg.motion.probeGrid as [number, number]
  let points = 0
  let sumB = 0
  let sumA = 0
  let sumGap = 0
  let maxGap = 0
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const p = sphereHit(b1, (x / (cols - 1)) * 2 - 1, (y / (rows - 1)) * 2 - 1)
      if (!p) continue
      const q0 = project(b0, at(T - dt, p))
      const q1 = project(b1, p)
      const r0 = project(a0, p)
      const r1 = project(a1, at(T + dt, p))
      if (!q0.front || !q1.front || !r0.front || !r1.front) continue
      const vb = [(q1.x - q0.x) / step, (q1.y - q0.y) / step] as const
      const va = [(r1.x - r0.x) / step, (r1.y - r0.y) / step] as const
      const gap = Math.hypot(va[0] - vb[0], va[1] - vb[1])
      points++
      sumB += Math.hypot(vb[0], vb[1])
      sumA += Math.hypot(va[0], va[1])
      sumGap += gap
      maxGap = Math.max(maxGap, gap)
    }
  }
  const n = Math.max(points, 1)
  const out: FlowNumbers = {
    points, stepFrames: step, meanBefore: round(sumB / n, 3), meanAfter: round(sumA / n, 3), meanGap: round(sumGap / n, 3), maxGap: round(maxGap, 3),
    positionGap: Number(b1.position.distanceTo(a0.position).toExponential(3)), angleGapDeg: round(b1.quaternion.angleTo(a0.quaternion) / RAD, 4),
  }
  const why: string[] = []
  if (points === 0) why.push('no ground point is seen at T')
  if (out.meanGap > L.flowGapMeanPx) why.push('mean flow gap ' + out.meanGap + ' px a frame over ' + L.flowGapMeanPx)
  if (out.maxGap > L.flowGapMaxPx) why.push('largest flow gap ' + out.maxGap + ' px a frame over ' + L.flowGapMaxPx)
  return { ...out, pass: why.length === 0, why }
}

interface FrameRow {
  frame: number; side: ViewKind; height: number; ratio: number | null; rate: number | null; place: [number, number] | null; motionCentre: number | null; motionEdge: number | null; motionMost: number
  level?: number; colour?: number[]; bodyShare?: number; bodyLevel?: number; bodyColour?: number[]; flatShare?: number; contrast?: number
}
interface ImageNumbers { level: number; colour: number[]; bodyShare: number; bodyLevel: number; bodyColour: number[]; flatShare: number; contrast: number }

async function frames(line: Line, withImages: boolean): Promise<{ rows: FrameRow[]; judged: Record<string, unknown> } & Verdict> {
  const seg = line.seg
  const rows: FrameRow[] = []
  const bodies: number[][][] = []
  const [cols, gridRows] = cfg.motion.probeGrid as [number, number]
  for (let f = seg.firstFrame; f < seg.endFrame; f++) {
    const mid = (f + shutterMid()) / fps
    const side = line.sideOf(mid)
    const cam = line.carried(mid, side)
    const spot = project(cam, plan.place(line.kind, mid))
    let centre: number | null = null
    let edge: number | null = null
    const most = rawMotion(film.shotAt(f, f / fps, side), film.shotAt(f, mid, side), film.shotAt(f, (f + cfg.shutterFraction) / fps, side), (x, y, px) => {
      if (x === (cols - 1) / 2 && y === (gridRows - 1) / 2) centre = px
      if (x === 0 || y === 0 || x === cols - 1 || y === gridRows - 1) edge = Math.max(edge ?? 0, px)
    })
    const height = cam.position.length() - 1
    const prev = rows[rows.length - 1]
    rows.push({
      frame: f, side, height: Number(height.toExponential(4)), ratio: prev ? round(height / prev.height, 5) : null, rate: prev ? round(Math.log(prev.height / height), 5) : null,
      place: spot.front ? [round(spot.x, 1), round(spot.y, 1)] : null, motionCentre: centre === null ? null : round(centre, 2), motionEdge: edge === null ? null : round(edge, 2), motionMost: round(most, 2),
    })
    bodies.push(bodyGrid(cam))
  }
  if (withImages) {
    const paths: string[] = []
    for (const r of rows) {
      paths.push(await still(r.frame, 'draft', 'beauty'))
      if (paths.length % 30 === 0) console.log(name + ' ' + line.kind + ': ' + paths.length + ' of ' + rows.length + ' draft frames')
    }
    const numbers = measure<ImageNumbers[]>({ op: 'frames', paths, bodies, floor: L.flatFloor })
    rows.forEach((r, i) => {
      const n = numbers[i]!
      Object.assign(r, { level: round(n.level, 2), colour: n.colour.map((v) => round(v, 2)), bodyShare: round(n.bodyShare, 3), bodyLevel: round(n.bodyLevel, 2), bodyColour: n.bodyColour.map((v) => round(v, 2)), flatShare: round(n.flatShare, 3), contrast: round(n.contrast, 2) })
    })
  }
  // The rate limits of E3, on the far part of the line: from the first frame to T in a dive, from T to the last frame in a rise.
  const dive = line.kind === 'dive'
  const iT = line.frameT - seg.firstFrame
  const part = dive ? rows.slice(0, iT + 1) : rows.slice(iT)
  const steps = part.length - 1
  const fall = Math.abs(Math.log(part[0]!.height / part[steps]!.height))
  const mean = fall / Math.max(steps, 1)
  const sign = dive ? 1 : -1
  const rates = rows.map((r) => (r.rate === null ? null : r.rate * sign))
  let worst = { frame: -1, over: 0 }
  rates.forEach((r, i) => {
    if (r !== null && r / mean > worst.over) worst = { frame: rows[i]!.frame, over: r / mean }
  })
  // A dive: by one fifth of the way to T the rate is at least a share of the mean. A rise only must not spike.
  const fifth = dive ? seg.firstFrame + Math.ceil(steps * L.earlyShare) : seg.endFrame - 1 - Math.ceil(steps * L.earlyShare)
  const early = rates[fifth - seg.firstFrame] ?? 0
  const farRates = rates.map((r, i) => ({ r, frame: rows[i]!.frame })).filter((x) => (dive ? x.frame <= line.frameT : x.frame > line.frameT))
  const backward = farRates.filter((x) => x.r !== null && x.r < -L.backRate * mean)
  const why: string[] = []
  if (worst.over > maxRate) why.push('frame ' + worst.frame + ' changes height at ' + round(worst.over, 2) + ' times the mean rate, limit ' + maxRate)
  if (dive && early / mean < L.earlyRateOverMean) why.push('frame ' + fifth + ' (one fifth of the way) moves at ' + round(early / mean, 2) + ' of the mean rate, at least ' + L.earlyRateOverMean + ' asked')
  if (backward.length > 0) why.push(backward.length + ' frames of the globe side move the wrong way in height, first ' + backward[0]!.frame)
  // A dive: the place stays in the middle from one fifth of the way until the place window (or the cover) begins. A rise: reported only.
  const from = dive ? fifth : line.window[1] + 1
  const to = dive ? line.window[0] - 1 : fifth
  let off = { frame: -1, by: 0 }
  for (const r of rows) {
    if (r.frame < from || r.frame > to) continue
    const by = r.place ? Math.max(Math.abs(r.place[0] / master.width - 0.5) * 2, Math.abs(r.place[1] / master.height - 0.5) * 2) : 9
    if (by > off.by) off = { frame: r.frame, by }
  }
  if (dive && off.by > L.placeMiddle) why.push('the place leaves the middle of the frame: frame ' + off.frame + ' has it at ' + round(off.by, 2) + ' of the half frame, limit ' + L.placeMiddle)
  const judged: Record<string, unknown> = { meanRate: round(mean, 5), meanRatio: round(Math.exp(-mean * sign), 5), worstRate: { frame: worst.frame, overMean: round(worst.over, 3) }, early: { frame: fifth, overMean: round(early / mean, 3) }, placeOff: { frame: off.frame, share: round(off.by, 3), from, to } }
  if (withImages) {
    // Steps are judged on the body alone (the blocks the body covers in both frames' own grids), so a globe that grows into a black sky or leaves it is not read as a cut. The whole frame steps are reported beside them.
    let level = { frame: -1, step: 0 }
    let colour = { frame: -1, step: 0 }
    let whole = { frame: -1, step: 0 }
    let wholeColour = { frame: -1, step: 0 }
    let flat = { frame: -1, share: 0 }
    rows.forEach((r, i) => {
      if (r.flatShare! > flat.share) flat = { frame: r.frame, share: r.flatShare! }
      const p = rows[i - 1]
      if (!p) return
      const wl = Math.abs(r.level! - p.level!)
      const wc = Math.max(...r.colour!.map((v, k) => Math.abs(v - p.colour![k]!)))
      if (wl > whole.step) whole = { frame: r.frame, step: wl }
      if (wc > wholeColour.step) wholeColour = { frame: r.frame, step: wc }
      if (Math.min(r.bodyShare!, p.bodyShare!) < L.bodyShare) return
      const dl = Math.abs(r.bodyLevel! - p.bodyLevel!)
      const dc = Math.max(...r.bodyColour!.map((v, k) => Math.abs(v - p.bodyColour![k]!)))
      if (dl > level.step) level = { frame: r.frame, step: dl }
      if (dc > colour.step) colour = { frame: r.frame, step: dc }
    })
    if (level.step > L.levelStep) why.push('the mean level of the body steps by ' + round(level.step, 2) + ' into frame ' + level.frame + ', limit ' + L.levelStep)
    if (colour.step > L.colourStep) why.push('the mean colour of the body steps by ' + round(colour.step, 2) + ' into frame ' + colour.frame + ', limit ' + L.colourStep)
    if (flat.share > L.flatShare) why.push('frame ' + flat.frame + ' has ' + round(flat.share * 100, 1) + ' percent of the body flat, limit ' + round(L.flatShare * 100, 1))
    Object.assign(judged, { levelStep: { frame: level.frame, step: round(level.step, 2) }, colourStep: { frame: colour.frame, step: round(colour.step, 2) }, frameLevelStep: { frame: whole.frame, step: round(whole.step, 2) }, frameColourStep: { frame: wholeColour.frame, step: round(wholeColour.step, 2) }, flat: { frame: flat.frame, share: round(flat.share, 3) } })
  }
  return { rows, judged, pass: why.length === 0, why }
}

async function sheets(line: Line, tier: string): Promise<string[]> {
  const T = line.frameT
  const span = L.sheetFrames
  const count = cfg.raw.critics.contactSheetFrames
  const lo = Math.max(T - span, line.seg.firstFrame)
  const hi = Math.min(T + span, line.seg.endFrame - 1)
  const files = new Map<number, string>()
  for (let f = lo; f <= hi; f++) files.set(f, await still(f, tier, 'beauty'))
  const parts: [string, number, number][] = [['before', lo, T - 1], ['across', Math.max(T - Math.floor(count / 2), lo), Math.min(T - Math.floor(count / 2) + count - 1, hi)], ['after', T + 1, hi]]
  const out: string[] = []
  for (const [part, first, last] of parts) {
    if (last < first) continue
    const inputs = []
    for (let f = first; f <= last; f++) inputs.push({ path: files.get(f)!, label: 'f' + padFrame(f) + (f === T ? ' T' : f < T ? ' T' + (f - T) : ' T+' + (f - T)) })
    const file = join(dir, name + '-' + line.kind + '-' + tier + '-' + part + '.png')
    image({ op: 'sheet', output: file, inputs, limit: cfg.raw.critics.maxImageLongEdgePx })
    addLook({ file }, { kind: 'sheet', label: stop + ' ' + line.kind + ', every frame ' + first + ' to ' + last + ' (' + part + ' T, frame ' + T + '), ' + tier + ' tier', stop: stop!, segment: line.seg.id, first, last, tier })
    out.push(file)
  }
  return out
}

const kinds = (a.kind ? [a.kind] : ['dive', 'rise']).filter((k): k is Kind => (k === 'dive' || k === 'rise') && cfg.segments.some((s) => s.stop === stop && s.kind === k))
if (kinds.length === 0) throw new Error(stop + ' has no ' + (a.kind ?? 'dive or rise'))
const report: Record<string, unknown> = { stop, name, engineHash: hashes?.engine ?? null, stopHash: hashes?.stops[stop] ?? null, dist: other ? dist : null, params: a.params ?? null, format, machine: machineId(), limits: { ...L, maxRateOverMean: maxRate }, kinds: {} }
const md: string[] = ['# Handover report: ' + name, '']
let pass = true
try {
  for (const kind of kinds) {
    const line = new Line(kind)
    const out: Record<string, unknown> = { optedIn: line.opted, frameT: line.frameT, timeT: round(line.timeT, 6), window: line.window }
    md.push('## ' + line.seg.id, '', (line.opted ? 'Handover in frame ' + line.frameT + ' (T = ' + round(line.timeT, 5) + ' s), place window frames ' + line.window[0] + ' to ' + line.window[1] : 'Not opted in: the sides swap under a cover in frame ' + line.frameT + ' (cover frames ' + line.window[0] + ' to ' + line.window[1] + ')') + '.', '')
    const verdicts: [string, Verdict][] = []
    if (only.includes('sides')) {
      const s = await sides(line)
      out.sides = s
      verdicts.push(['side difference at T', s])
      if (typeof s.mean === 'number') md.push('Side difference at T (display values 0 to 255): mean ' + round(s.mean as number, 3) + ', median ' + s.p50 + ', 99th percentile ' + s.p99 + ', 99.9th ' + s.p999 + ', max ' + s.max + '; ' + round((s.shareOver1 as number) * 100, 3) + ' percent of pixels over 1, ' + round((s.shareOver4 as number) * 100, 3) + ' percent over 4, ' + s.pixelsOver16 + ' pixels over 16. Picture: `' + (s.panel as string).replace(ROOT + '/', '') + '`.', '')
    }
    if (only.includes('under') && line.opted && !other) {
      const u = await under(line)
      out.under = u
      if (!u.none) {
        verdicts.push(['under the place picture', u])
        md.push('Under the place picture at T (the globe side alone against the globe side with the picture, on the ' + round((u.share as number) * 100, 1) + ' percent of the frame where the body carries the picture at more than half weight): mean difference ' + round(u.mean as number, 2) + ', median ' + u.p50 + ', 99th percentile ' + u.p99 + '; the globe alone is ' + (u.meanSigned as number[]).map((v) => (v >= 0 ? 'plus ' : 'minus ') + Math.abs(round(v, 1))).join(', ') + ' in red, green and blue. Picture: `' + (u.panel as string).replace(ROOT + '/', '') + '`.', '')
      }
    }
    if (only.includes('flow')) {
      const f = flow(line)
      out.flow = f
      verdicts.push(['flow gap at T', f])
      md.push('Flow gap at T over ' + f.points + ' ground points (step ' + f.stepFrames + ' of a frame): the ground moves ' + f.meanBefore + ' px a frame just before T and ' + f.meanAfter + ' px just after; gap mean ' + f.meanGap + ' px a frame, largest ' + f.maxGap + ' px. Pose gap between the sides at T: ' + f.positionGap + ' radii, ' + f.angleGapDeg + ' degrees.', '')
    }
    if (only.includes('frames') || only.includes('path')) {
      const f = await frames(line, only.includes('frames'))
      out.frames = f.rows
      out.judged = f.judged
      verdicts.push(['every frame', f])
      const j = f.judged as { meanRate: number; meanRatio: number; worstRate: { frame: number; overMean: number }; early: { frame: number; overMean: number }; placeOff: { frame: number; share: number }; levelStep?: { frame: number; step: number }; colourStep?: { frame: number; step: number }; frameLevelStep?: { frame: number; step: number }; frameColourStep?: { frame: number; step: number }; flat?: { frame: number; share: number } }
      md.push('Height: mean ratio per frame ' + j.meanRatio + ' on the way ' + (kind === 'dive' ? 'to' : 'from') + ' T; fastest frame ' + j.worstRate.frame + ' at ' + j.worstRate.overMean + ' times the mean rate; frame ' + j.early.frame + ' (one fifth of the way) at ' + j.early.overMean + ' of the mean. The place is at most ' + j.placeOff.share + ' of the half frame from the middle (frame ' + j.placeOff.frame + ').')
      if (j.levelStep && j.colourStep && j.flat) md.push('Largest step between two frames, on the body: mean level ' + j.levelStep.step + ' (into frame ' + j.levelStep.frame + '), mean colour ' + j.colourStep.step + ' (into frame ' + j.colourStep.frame + '). On the whole frame, not judged: level ' + j.frameLevelStep!.step + ' (into frame ' + j.frameLevelStep!.frame + '), colour ' + j.frameColourStep!.step + ' (into frame ' + j.frameColourStep!.frame + '). Largest flat share of the body ' + round(j.flat.share * 100, 1) + ' percent (frame ' + j.flat.frame + ').')
      md.push('', '| frame | side | height | ratio | place x, y | motion centre | motion edge | level | colour | body share | body level | body colour | flat |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
      for (const r of f.rows) md.push('| ' + [r.frame + (r.frame === line.frameT ? ' T' : ''), r.side === 'orbit' ? 'globe' : 'close', r.height, r.ratio ?? '', r.place ? r.place.join(', ') : 'behind', r.motionCentre ?? '', r.motionEdge ?? '', r.level ?? '', r.colour ? r.colour.join(' ') : '', r.bodyShare ?? '', r.bodyLevel ?? '', r.bodyColour ? r.bodyColour.join(' ') : '', r.flatShare ?? ''].join(' | ') + ' |')
      md.push('')
    }
    if (only.includes('sheets')) {
      const files: Record<string, string[]> = { draft: await sheets(line, 'draft') }
      if (sheetTier !== 'draft') files[sheetTier] = await sheets(line, sheetTier)
      out.sheets = files
      md.push('Sheets: ' + Object.values(files).flat().map((f) => '`' + f.replace(ROOT + '/', '') + '`').join(', ') + '.', '')
    }
    if (only.includes('top') && line.opted && !other) {
      const file = await top(line)
      out.top = file
      md.push('From straight above the place, the globe side alone: `' + file.replace(ROOT + '/', '') + '`.', '')
    }
    const failed = verdicts.filter(([, v]) => !v.pass)
    out.pass = failed.length === 0
    pass &&= failed.length === 0
    md.push(failed.length === 0 ? 'Verdict: pass (' + verdicts.map(([n]) => n).join(', ') + ').' : 'Verdict: FAIL.', ...failed.flatMap(([n, v]) => v.why.map((w) => '- ' + n + ': ' + w)), '')
    for (const [n, v] of verdicts) console.log(line.seg.id + ' ' + n + ': ' + (v.pass ? 'pass' : 'FAIL ' + v.why.join('; ')))
    ;(report.kinds as Record<string, unknown>)[kind] = out
  }
} finally {
  await (session as Session | null)?.close().catch(() => undefined)
}
report.pass = pass
json(join(dir, name + '.json'), report)
writeFileSync(join(dir, name + '.md'), md.join('\n') + '\n')
console.log(join(dir, name + '.md'))
if (!pass) process.exit(1)
