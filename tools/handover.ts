import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import * as THREE from 'three'
import { DIST, ROOT, WORK, args, ensureBuild, formatId, loadConfig, machineId, requireDisk } from './lib/common'
import { openCapture, renderPng, type Session } from './lib/browser'
import { addLook } from './lib/looks'
import { image, json, padFrame } from './lib/render'
import { IN_PLACE, frameSteps } from './lib/steps'
import type { Segment } from '../src/config'
import { blurAllowed, framePlan, rawMotion, shutterScale } from '../src/core/motion'
import { samplesFor, shutterMid, shutterOffset } from '../src/core/sampler'
import type { Pose, ViewKind } from '../src/core/types'
import { FilmDirector } from '../src/director/film'
import { handoverFrame, handoverOf, sideAt } from '../src/director/handover'
import { StopPlan, type Fit, type MoveParams } from '../src/director/moves'
import { plans } from '../src/director/plans'
import { coverFrames } from '../src/director/timeline'

// The measures of the handover (cut/HANDOVER.md, E4). One stop, its dive and its rise.
//   npm run handover -- --stop ID [--kind dive|rise] [--tier draft|review] [--only sides,under,flow,frames,sheets,top]
//                       [--params FILE --dist DIR --name NAME]   (judge another build of the stop, for example the frozen one)
//   --parts across,before,after picks the sheets (all three when not given; the one across T is made first)
//   The frames part (and --only path, the same without pictures) also reports the capped shutter of E6: per frame the share of the film's shutter
//   that is open, the motion left across it (centre, edge, most) and the motion to the next frame; judged: no frame keeps more than it may.
//   The frames part reads the step between two frames two ways: on the mean of the body, and in place, on the ground both frames show
//   (tools/img/handover.py, op inPlace): a frame that opens on a darker side of the body moves the mean, not the look of any ground. Both are
//   held to the same limits (handover.limits.levelStep, colourStep) and the report says what each would rule.
//   The step in place is the judged one (tools/lib/steps.ts, IN_PLACE.judged, is the standing choice; decision d238): the mean of the body
//   judges only the frames that share too little ground with the frame before to be read in place. --in-place asks for that by hand.
//   --gate-under makes the line "under the place picture" part of the verdict and of the exit code. Without it the line is judged against its
//   limit and printed as a warning: it says how far a stop's plates are from its picture, and no stop is held up by it.
// Everything is written to out/work/handover/. Exit 1 when a judged number of the verdict is over its limit in config.handover.limits.

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
const sheetParts = a.parts ? a.parts.split(',') : null
const gateUnder = a['gate-under'] === 'true'
const judgeInPlace = a['in-place'] === 'true' || IN_PLACE.judged
const name = a.name ?? stop
const dist = a.dist ? resolve(a.dist) : DIST
const other = Boolean(a.dist)
requireDisk(cfg)
const hashes = other ? null : ensureBuild()
const format = formatId(cfg, a.format)
const master = cfg.formats[cfg.formatKeys.master]!
const fps = cfg.fps
const L = cfg.raw.handover.limits
// The reading in place (tools/lib/steps.ts): its two numbers come from handover.limits where the config names them, else from the tool.
const inPlaceOf = L as typeof L & { inPlaceScale?: number; inPlaceShare?: number }
const inPlaceScale = inPlaceOf.inPlaceScale ?? IN_PLACE.scale
const inPlaceShare = inPlaceOf.inPlaceShare ?? IN_PLACE.share
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
    return plan.eye(this.kind, time, side)
  }

  // What the frame of T holds at a tier: the open shutter of that frame straddles T, and each of its samples is drawn by the side that owns
  // its time. The draft tier draws one sample, so the judge at draft never sees the two sides in one frame; the report says what the
  // frame holds where it does.
  mix(tier: string): { samples: number; close: number; globe: number } {
    const p = framePlan(film, this.frameT, tier)
    const close = samplesFor(p.samples, p.shutter).filter((s) => sideAt(this.seg, (this.frameT + s.timeOffset) / fps) === 'terrain').length
    return { samples: p.samples, close, globe: p.samples - close }
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

interface UnderPart { pixels: number; share: number; mean: number; p50: number; p99: number; meanSigned: number[] }
interface UnderNumbers extends UnderPart { sky: UnderPart; tone: number; detail: number }

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

// E6: shutter is the share of the film's shutter the frame keeps; blurCentre, blurEdge and blurMost are the motion in px across the shutter that
// is open (in the dissolve frames the larger of both sides, as the engine measures it); allowed is the blur the frame may keep; stepMost is how
// far the point that moves most goes from the middle of this frame to the middle of the next one.
interface FrameRow {
  frame: number; side: ViewKind; height: number; ratio: number | null; rate: number | null; place: [number, number] | null; motionCentre: number | null; motionEdge: number | null; motionMost: number
  shutter: number; allowed: number | null; blurCentre: number | null; blurEdge: number | null; blurMost: number; stepMost: number | null; samples: number; atFloor?: true
  level?: number; colour?: number[]; bodyShare?: number; bodyLevel?: number; bodyColour?: number[]; flatShare?: number; contrast?: number
  inPlace?: InPlace
}
// The change of a frame against the frame before it on the ground both show (tools/img/handover.py, in_place): seen is the share of the body's
// pixels whose ground the frame before shows too, level and colour the mean change on them, fresh and kept the level of the new ground and of
// the ground seen in both.
interface InPlace { seen: number; level: number; colour: number[]; rms: number; fresh: number; kept: number }
interface ImageNumbers { level: number; colour: number[]; bodyShare: number; bodyLevel: number; bodyColour: number[]; flatShare: number; contrast: number }

interface Seam { with: string; own: number; other: number; ownBefore: number; ownAfter: number; otherBlur: number }
interface BlurNumbers { maxBlurPx: number; easeFrames: number; minShutter: number; floored: number; samplesMost: { frame: number; count: number }; capped: number; leastShutter: { frame: number; share: number }; mostLeft: { frame: number; px: number }; mostBefore: { frame: number; px: number }; ease: { first: number; last: number; px: number }[]; stepBefore: { frame: number; px: number }; stepAfter: { frame: number; px: number }; fastest: { frame: number; pxAFrame: number; blur: number }; seams: Seam[] }

async function frames(line: Line, withImages: boolean): Promise<{ rows: FrameRow[]; judged: Record<string, unknown>; blur: BlurNumbers | null } & Verdict> {
  const seg = line.seg
  let inPlacePaths: string[] = []
  let inPlacePoses: object[] = []
  const rows: FrameRow[] = []
  const bodies: number[][][] = []
  const poses: { position: number[]; quaternion: number[]; vfov: number; turn: number[] }[] = []
  const [cols, gridRows] = cfg.motion.probeGrid as [number, number]
  const h = line.opted ? handoverOf(stop!, line.kind) : null
  const full: number[] = []
  const left: number[] = []
  const floor = cfg.raw.handover.minShutter
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
    // The shutter that is open (E6) and the motion across it, measured the way the engine plans the frame: both sides inside the dissolve.
    const share = shutterScale(film, f)
    const allowed = blurAllowed(film, f)
    // At the floor (handover.minShutter) a frame keeps more than the cap allows, by design: it is reported, not judged against the cap.
    const atFloor = h !== null && floor > 0 && share < 1 && share <= floor
    let blurCentre: number | null = null
    let blurEdge: number | null = null
    let blurMost = 0
    // A stop that has not opted in is measured on the film's own shot, cover and all, as the engine plans that frame.
    for (const sd of h && f >= h.firstFrame && f <= h.lastFrame ? (['orbit', 'terrain'] as ViewKind[]) : [h ? side : undefined]) {
      blurMost = Math.max(blurMost, rawMotion(film.shotAt(f, (f + shutterOffset(0, share)) / fps, sd), film.shotAt(f, mid, sd), film.shotAt(f, (f + shutterOffset(1, share)) / fps, sd), (x, y, px) => {
        if (x === (cols - 1) / 2 && y === (gridRows - 1) / 2) blurCentre = Math.max(blurCentre ?? 0, px)
        if (x === 0 || y === 0 || x === cols - 1 || y === gridRows - 1) blurEdge = Math.max(blurEdge ?? 0, px)
      }))
    }
    // From the middle of this frame to the middle of the next one, on this frame's side: what the eye has to bridge between two frames.
    const stepMost = f + 1 < seg.endFrame ? rawMotion(film.shotAt(f, mid, side), film.shotAt(f, mid + 0.5 / fps, side), film.shotAt(f, mid + 1 / fps, side)) : null
    full.push(framePlan(film, f, 'draft').raw)
    left.push(blurMost)
    const height = cam.position.length() - 1
    const prev = rows[rows.length - 1]
    rows.push({
      frame: f, side, height: Number(height.toExponential(4)), ratio: prev ? round(height / prev.height, 5) : null, rate: prev ? round(Math.log(prev.height / height), 5) : null,
      place: spot.front ? [round(spot.x, 1), round(spot.y, 1)] : null, motionCentre: centre === null ? null : round(centre, 2), motionEdge: edge === null ? null : round(edge, 2), motionMost: round(most, 2),
      shutter: round(share, 4), allowed: Number.isFinite(allowed) ? round(allowed, 2) : null, blurCentre: blurCentre === null ? null : round(blurCentre, 2), blurEdge: blurEdge === null ? null : round(blurEdge, 2), blurMost: round(blurMost, 2), stepMost: stepMost === null ? null : round(stepMost, 1),
      samples: framePlan(film, f, 'review').samples, ...(atFloor ? { atFloor: true as const } : {}),
    })
    bodies.push(bodyGrid(cam))
    poses.push({ position: cam.position.toArray(), quaternion: cam.quaternion.toArray(), vfov: cam.vfov, turn: plan.turn(mid).toArray() })
  }
  // E6, judged: no frame keeps more blur than it may. Outside the ease frames that is handover.maxBlurPx; in them the ramp to the seam's motion.
  // A frame at the floor keeps the motion across that share of the shutter, whatever the cap.
  const blurWhy: string[] = []
  let blur: BlurNumbers | null = null
  if (h) {
    const maxBlurPx = cfg.raw.handover.maxBlurPx
    const at = (i: number): number => seg.firstFrame + i
    const top = (v: number[]): { frame: number; px: number } => {
      const px = Math.max(...v)
      return { frame: at(v.indexOf(px)), px: round(px, 2) }
    }
    for (const r of rows) if (r.allowed !== null && r.blurMost > r.allowed && !r.atFloor) blurWhy.push('frame ' + r.frame + ' keeps ' + r.blurMost + ' px of motion across its shutter, ' + r.allowed + ' allowed' + (r.allowed > maxBlurPx ? ' in the ease to the seam' : ''))
    // The seams: the frame before the segment and the frame after it run with the full shutter, as they always did.
    const seams: Seam[] = []
    const before = seg.firstFrame - 1
    const after = seg.endFrame
    const beside = (f: number): number => framePlan(film, f, 'draft').raw
    if (before >= 0) seams.push({ with: cfg.segments.find((x) => before >= x.firstFrame && before < x.endFrame)!.id, own: seg.firstFrame, other: before, ownBefore: round(full[0]!, 2), ownAfter: round(left[0]!, 2), otherBlur: round(beside(before), 2) })
    if (after < cfg.frameCount) seams.push({ with: cfg.segments.find((x) => after >= x.firstFrame && after < x.endFrame)!.id, own: seg.endFrame - 1, other: after, ownBefore: round(full[full.length - 1]!, 2), ownAfter: round(left[left.length - 1]!, 2), otherBlur: round(beside(after), 2) })
    // The largest change of blur from one frame to the next, the frames beside the segment included.
    const chain = (v: number[]): number[] => [...(before >= 0 ? [beside(before)] : []), ...v, ...(after < cfg.frameCount ? [beside(after)] : [])]
    const step = (v: number[]): { frame: number; px: number } => {
      const c = chain(v)
      const first = before >= 0 ? before : seg.firstFrame
      let out = { frame: -1, px: 0 }
      for (let i = 1; i < c.length; i++) if (Math.abs(c[i]! - c[i - 1]!) > out.px) out = { frame: first + i, px: Math.abs(c[i]! - c[i - 1]!) }
      return { frame: out.frame, px: round(out.px, 2) }
    }
    const ease: { first: number; last: number; px: number }[] = []
    for (const r of rows) {
      if (r.allowed === null || !(r.allowed > maxBlurPx)) continue
      const last = ease[ease.length - 1]
      if (last && last.last === r.frame - 1) {
        last.last = r.frame
        last.px = Math.max(last.px, r.allowed)
      } else ease.push({ first: r.frame, last: r.frame, px: r.allowed })
    }
    const least = rows.reduce((a, b) => (b.shutter < a.shutter ? b : a))
    const busiest = rows.reduce((a, b) => (b.samples > a.samples ? b : a))
    const fast = rows.reduce((a, b) => ((b.stepMost ?? 0) > (a.stepMost ?? 0) ? b : a))
    blur = {
      maxBlurPx, easeFrames: cfg.raw.handover.blurEaseFrames, minShutter: floor, floored: rows.filter((r) => r.atFloor).length, samplesMost: { frame: busiest.frame, count: busiest.samples }, capped: rows.filter((r) => r.shutter < 1).length, leastShutter: { frame: least.frame, share: least.shutter }, mostLeft: top(left), mostBefore: top(full), ease,
      stepBefore: step(full), stepAfter: step(left), fastest: { frame: fast.frame, pxAFrame: fast.stepMost ?? 0, blur: fast.blurMost }, seams,
    }
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
    // The same frames laid over each other by the ground they show (the two cameras and the turn of the body between them).
    const laid = measure<(InPlace | null)[]>({ op: 'inPlace', paths, poses, scale: inPlaceScale })
    rows.forEach((r, i) => {
      const n = laid[i]
      if (n) r.inPlace = { seen: round(n.seen, 3), level: round(n.level, 2), colour: n.colour.map((v) => round(v, 2)), rms: round(n.rms, 2), fresh: round(n.fresh, 1), kept: round(n.kept, 1) }
    })
    inPlacePaths = paths
    inPlacePoses = poses
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
  const why: string[] = [...blurWhy]
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
    // The steps between two frames (tools/lib/steps.ts). Read on the mean of the body alone (the blocks the body covers in both frames' own
    // grids), so a globe that grows into a black sky or leaves it is not read as a cut; the whole frame steps are reported beside them. Read
    // beside them, held to the same limits, and judged where IN_PLACE.judged or --in-place says so: the same step in place, on the ground
    // both frames show (FrameRow.inPlace).
    const found = frameSteps(rows.map((r) => ({ frame: r.frame, level: r.level!, colour: r.colour!, bodyShare: r.bodyShare!, bodyLevel: r.bodyLevel!, bodyColour: r.bodyColour!, flatShare: r.flatShare!, ...(r.inPlace ? { inPlace: r.inPlace } : {}) })), { bodyShare: L.bodyShare, levelStep: L.levelStep, colourStep: L.colourStep, flatShare: L.flatShare, inPlaceShare, inPlace: judgeInPlace })
    why.push(...found.why)
    const { level, colour, whole, wholeColour, flat } = found
    const { level: seenLevel, colour: seenColour, least, unread, unreadLevel, unreadColour, judged: inPlaceJudged } = found.inPlace
    Object.assign(judged, { levelStep: { frame: level.frame, step: round(level.step, 2) }, colourStep: { frame: colour.frame, step: round(colour.step, 2) }, frameLevelStep: { frame: whole.frame, step: round(whole.step, 2) }, frameColourStep: { frame: wholeColour.frame, step: round(wholeColour.step, 2) }, flat: { frame: flat.frame, share: round(flat.share, 3) } })
    const panels: string[] = []
    const pair = async (frame: number, tag: string, what: string): Promise<void> => {
      const i = rows.findIndex((r) => r.frame === frame)
      if (i < 1) return
      const file = join(dir, name + '-' + line.kind + '-step-' + tag + '.png')
      measure<unknown>({ op: 'inPlace', paths: [inPlacePaths[i - 1], inPlacePaths[i]], poses: [inPlacePoses[i - 1], inPlacePoses[i]], scale: inPlaceScale, panels: [{ index: 1, file, gain: L.differenceGain, limit: cfg.raw.critics.maxImageLongEdgePx, names: ['frame ' + (frame - 1), 'frame ' + frame] }] })
      addLook({ file }, { kind: 'compare', label: stop + ' ' + line.kind + ', ' + what + ': frame ' + (frame - 1) + ', frame ' + frame + ', the ground that is new in it, and the change on the ground both show times ' + L.differenceGain, stop: stop!, segment: line.seg.id, frame })
      panels.push(file)
    }
    await pair(level.frame, 'body', 'the largest step of the mean level of the body (' + round(level.step, 2) + ')')
    if (seenLevel.frame !== level.frame) await pair(seenLevel.frame, 'in-place', 'the largest step of the level in place (' + round(seenLevel.step, 2) + ')')
    Object.assign(judged, { inPlace: { judged: inPlaceJudged, levelStep: { frame: seenLevel.frame, step: round(seenLevel.step, 2) }, colourStep: { frame: seenColour.frame, step: round(seenColour.step, 2) }, leastSeen: { frame: least.frame, share: round(least.share, 3) }, unread, unreadLevelStep: { frame: unreadLevel.frame, step: round(unreadLevel.step, 2) }, unreadColourStep: { frame: unreadColour.frame, step: round(unreadColour.step, 2) }, share: inPlaceShare, scale: inPlaceScale, fails: found.fails, panels } })
  }
  return { rows, judged, blur, pass: why.length === 0, why }
}

async function sheets(line: Line, tier: string): Promise<string[]> {
  const T = line.frameT
  const span = L.sheetFrames
  const count = cfg.raw.critics.contactSheetFrames
  const lo = Math.max(T - span, line.seg.firstFrame)
  const hi = Math.min(T + span, line.seg.endFrame - 1)
  // The sheet across T first: its frames are the ones the swap is judged on, and the frames before T of a dive can ask for
  // the most samples of the film. Each sheet is written as soon as its frames are there.
  const parts: [string, number, number][] = [['across', Math.max(T - Math.floor(count / 2), lo), Math.min(T - Math.floor(count / 2) + count - 1, hi)], ['before', lo, T - 1], ['after', T + 1, hi]]
  const out: string[] = []
  for (const [part, first, last] of parts) {
    if (last < first || (sheetParts && !sheetParts.includes(part))) continue
    const inputs = []
    for (let f = first; f <= last; f++) inputs.push({ path: await still(f, tier, 'beauty'), label: 'f' + padFrame(f) + (f === T ? ' T' : f < T ? ' T' + (f - T) : ' T+' + (f - T)) })
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
    const mixed = line.opted ? { final: line.mix('final'), review: line.mix('review'), draft: line.mix('draft') } : null
    if (mixed) out.samplesAtT = mixed
    const held = (m: { samples: number; close: number; globe: number }): string => m.close + ' of ' + m.samples + ' samples by the close side and ' + m.globe + ' by the globe side'
    md.push('## ' + line.seg.id, '', (line.opted ? 'Handover in frame ' + line.frameT + ' (T = ' + round(line.timeT, 5) + ' s), place window frames ' + line.window[0] + ' to ' + line.window[1] + '. Frame ' + line.frameT + ' holds both sides, each sample drawn by the side that owns its time: at the final tier ' + held(mixed!.final) + ', at the review tier ' + held(mixed!.review) + ', at the draft tier ' + held(mixed!.draft) + ' (the measures below are taken at draft and do not see the two in one frame)' : 'Not opted in: the sides swap under a cover in frame ' + line.frameT + ' (cover frames ' + line.window[0] + ' to ' + line.window[1] + ')') + '.', '')
    const verdicts: [string, Verdict][] = []
    const warnings: [string, Verdict][] = []
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
        if (gateUnder) verdicts.push(['under the place picture', u])
        else warnings.push(['under the place picture', u])
        md.push('Under the place picture at T (the globe side alone against the globe side with the picture, on the ' + round((u.share as number) * 100, 1) + ' percent of the frame where the body carries the picture at more than half weight): mean difference ' + round(u.mean as number, 2) + ', median ' + u.p50 + ', 99th percentile ' + u.p99 + '; the globe alone is ' + (u.meanSigned as number[]).map((v) => (v >= 0 ? 'plus ' : 'minus ') + Math.abs(round(v, 1))).join(', ') + ' in red, green and blue. Of the difference, tone (the means of ' + L.blockPx + ' px blocks) carries ' + round(u.tone as number, 2) + ' and detail (what is left inside the blocks) ' + round(u.detail as number, 2) + '. Picture: `' + (u.panel as string).replace(ROOT + '/', '') + '`.', '')
        const sky = u.sky as UnderPart
        if (sky.pixels > 0) md.push('In the sky at T (not judged), on the ' + round(sky.share * 100, 1) + ' percent of the frame where the picture is drawn off the body at more than half weight: mean difference ' + round(sky.mean, 2) + ', median ' + sky.p50 + ', 99th percentile ' + sky.p99 + '; the globe side alone is ' + sky.meanSigned.map((v) => (v >= 0 ? 'plus ' : 'minus ') + Math.abs(round(v, 1))).join(', ') + ' in red, green and blue.', '')
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
      out.blur = f.blur
      verdicts.push(['every frame', f])
      const j = f.judged as { meanRate: number; meanRatio: number; worstRate: { frame: number; overMean: number }; early: { frame: number; overMean: number }; placeOff: { frame: number; share: number }; levelStep?: { frame: number; step: number }; colourStep?: { frame: number; step: number }; frameLevelStep?: { frame: number; step: number }; frameColourStep?: { frame: number; step: number }; flat?: { frame: number; share: number }; inPlace?: { judged: boolean; levelStep: { frame: number; step: number }; colourStep: { frame: number; step: number }; leastSeen: { frame: number; share: number }; unread: number; unreadLevelStep: { frame: number; step: number }; unreadColourStep: { frame: number; step: number }; share: number; fails: { body: string[]; inPlace: string[] }; panels: string[] } }
      md.push('Height: mean ratio per frame ' + j.meanRatio + ' on the way ' + (kind === 'dive' ? 'to' : 'from') + ' T; fastest frame ' + j.worstRate.frame + ' at ' + j.worstRate.overMean + ' times the mean rate; frame ' + j.early.frame + ' (one fifth of the way) at ' + j.early.overMean + ' of the mean. The place is at most ' + j.placeOff.share + ' of the half frame from the middle (frame ' + j.placeOff.frame + ').')
      if (j.levelStep && j.colourStep && j.flat) md.push('Largest step between two frames, on the body: mean level ' + j.levelStep.step + ' (into frame ' + j.levelStep.frame + '), mean colour ' + j.colourStep.step + ' (into frame ' + j.colourStep.frame + '). On the whole frame, not judged: level ' + j.frameLevelStep!.step + ' (into frame ' + j.frameLevelStep!.frame + '), colour ' + j.frameColourStep!.step + ' (into frame ' + j.frameColourStep!.frame + '). Largest flat share of the body ' + round(j.flat.share * 100, 1) + ' percent (frame ' + j.flat.frame + ').')
      if (j.inPlace) {
        const p = j.inPlace
        const ruling = (lines: string[]): string => (lines.length === 0 ? 'pass' : 'fail (' + lines.join('; ') + ')')
        md.push('The same step in place, on the ground both frames show (' + (p.judged ? 'judged, with the same limits; the mean of the body judges only the frames that cannot be read in place and would on its own ' + ruling(p.fails.body) : 'shown, not judged; judged with the same limits it would ' + ruling(p.fails.inPlace)) + '): level ' + p.levelStep.step + ' (into frame ' + p.levelStep.frame + '), colour ' + p.colourStep.step + ' (into frame ' + p.colourStep.frame + '). The frame before shows at least ' + p.leastSeen.share + ' of a frame\'s body (frame ' + p.leastSeen.frame + '); ' + (p.unread === 0 ? 'every frame is read in place.' : p.unread + ' frames show less than ' + p.share + ' of it and are not read in place (on the mean of the body they step by at most ' + p.unreadLevelStep.step + ' in level, into frame ' + p.unreadLevelStep.frame + ', and ' + p.unreadColourStep.step + ' in colour, into frame ' + p.unreadColourStep.frame + ').') + (p.panels.length > 0 ? ' Pictures: ' + p.panels.join(', ') + '.' : ''))
      }
      const b = f.blur
      if (b) {
        if (!(b.maxBlurPx > 0)) md.push('Shutter (E6): no cap (handover.maxBlurPx 0). Every frame keeps the film\'s full shutter, as before the cap: ' + b.capped + ' of ' + f.rows.length + ' frames run with a shortened shutter. Motion across the shutter at the point that moves most: up to ' + b.mostBefore.px + ' px (frame ' + b.mostBefore.frame + ').')
        else md.push('Shutter (E6): the motion across the shutter is capped at ' + b.maxBlurPx + ' px. ' + b.capped + ' of ' + f.rows.length + ' frames run with a shortened shutter, the shortest ' + b.leastShutter.share + ' of the film\'s shutter (frame ' + b.leastShutter.frame + '). Motion across the shutter at the point that moves most: up to ' + b.mostBefore.px + ' px with the full shutter (frame ' + b.mostBefore.frame + '), up to ' + b.mostLeft.px + ' px now (frame ' + b.mostLeft.frame + ').' + (b.ease.length > 0 ? ' Ease to a seam that moves more than the cap: ' + b.ease.map((e) => 'frames ' + e.first + ' to ' + e.last + ', up to ' + e.px + ' px').join('; ') + '.' : ' No seam moves more than the cap, so no frame is eased.'))
        md.push(b.minShutter > 0
          ? 'Floor (handover.minShutter ' + b.minShutter + ', the least share of the shutter a capped frame runs): ' + b.floored + ' of ' + f.rows.length + ' frames run at the floor and keep more than the cap, the longest blur ' + b.mostLeft.px + ' px (frame ' + b.mostLeft.frame + '). The review tier takes up to ' + b.samplesMost.count + ' samples (frame ' + b.samplesMost.frame + '). Share of the shutter and longest blur of every frame: the columns shutter and blur most of the table.'
          : 'Floor: off (handover.minShutter 0). The review tier takes up to ' + b.samplesMost.count + ' samples (frame ' + b.samplesMost.frame + '). Share of the shutter and longest blur of every frame: the columns shutter and blur most of the table.')
        md.push('Seams, motion across the shutter in px: ' + b.seams.map((x) => 'frame ' + x.own + ' ' + x.ownBefore + ' with the full shutter and ' + x.ownAfter + ' now, beside it frame ' + x.other + ' of ' + x.with + ' ' + x.otherBlur).join('; ') + '. Largest change from one frame to the next, the frames beside the segment included: ' + b.stepBefore.px + ' px with the full shutter (into frame ' + b.stepBefore.frame + '), ' + b.stepAfter.px + ' px now (into frame ' + b.stepAfter.frame + ').')
        md.push('Motion from frame to frame against the blur: at the fastest frame (' + b.fastest.frame + ') the point that moves most goes ' + b.fastest.pxAFrame + ' px to the next frame and keeps ' + b.fastest.blur + ' px of blur. The table has both for every frame (blur most, px a frame).')
      }
      md.push('', '| frame | side | height | ratio | place x, y | motion centre | motion edge | shutter | blur centre | blur edge | blur most | px a frame | samples at review | level | colour | body share | body level | body colour | flat | seen in both | level in place | colour in place | new ground level | kept ground level |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
      for (const r of f.rows) md.push('| ' + [r.frame + (r.frame === line.frameT ? ' T' : ''), r.side === 'orbit' ? 'globe' : 'close', r.height, r.ratio ?? '', r.place ? r.place.join(', ') : 'behind', r.motionCentre ?? '', r.motionEdge ?? '', r.shutter, r.blurCentre ?? '', r.blurEdge ?? '', r.blurMost, r.stepMost ?? '', r.samples, r.level ?? '', r.colour ? r.colour.join(' ') : '', r.bodyShare ?? '', r.bodyLevel ?? '', r.bodyColour ? r.bodyColour.join(' ') : '', r.flatShare ?? '', r.inPlace?.seen ?? '', r.inPlace?.level ?? '', r.inPlace ? r.inPlace.colour.join(' ') : '', r.inPlace?.fresh ?? '', r.inPlace?.kept ?? ''].join(' | ') + ' |')
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
    const warned = warnings.filter(([, v]) => !v.pass)
    out.warnings = warned.flatMap(([n, v]) => v.why.map((w) => n + ': ' + w))
    if (warnings.length > 0) md.push(warned.length === 0 ? 'Judged beside the verdict: inside the limit (' + warnings.map(([n]) => n).join(', ') + ').' : 'Warning, judged beside the verdict (not part of it; --gate-under makes it part):', ...warned.flatMap(([n, v]) => v.why.map((w) => '- ' + n + ': ' + w)), '')
    for (const [n, v] of verdicts) console.log(line.seg.id + ' ' + n + ': ' + (v.pass ? 'pass' : 'FAIL ' + v.why.join('; ')))
    for (const [n, v] of warnings) console.log(line.seg.id + ' ' + n + ': ' + (v.pass ? 'inside the limit' : 'WARNING ' + v.why.join('; ')))
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
