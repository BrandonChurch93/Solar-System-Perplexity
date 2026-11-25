import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { DIST, ROOT, WORK, args, ensureBuild, formatId, loadConfig, machineId, requireDisk } from './lib/common'
import { openCapture, renderPng, type Session } from './lib/browser'
import { computeHashes, type Hashes } from './lib/hashes'
import { json, padFrame } from './lib/render'
import { FilmDirector } from '../src/director/film'
import { handoverFrame, handoverOf, sideAt } from '../src/director/handover'
import { segmentAtFrame } from '../src/director/timeline'
import { setCapture, spanMid } from '../src/core/clock'
import type { Pose } from '../src/core/types'
import { plans } from '../src/director/plans'
import { LANDING_FROM, MIN_POINTS, SEAM_OWN, SEAM_REACH, afterRise, carriedCamera, curves, eyeCurves, landingCurves, ringPlane, sampleLanding, sampleLeave, sampleSeam, sampleWindow, sphereHit, type Kind, type Plane, type Ring } from './smooth/camera'
import { IN_PLACE } from './lib/steps'
import { BLOOM, apart, glowPx, look, mapFaults, shownRows, worded } from './smooth/maps'
import { placeReadings } from './smooth/place'
import { missing, partOwn, popContext, sliceName, sliceNeed, type Span } from './smooth/slice'
import { MOVES, PIECES, buildFault, differ, gather, gatherFaults, pieceStem, runFacts, type Facts, type Given } from './smooth/whole'
import { LANDING_FLOOR, LANDING_LATE, LANDING_SHOWN, changeNote, judgeCurve, judgeLanding, judgeLeave, judgeSeam, longestGap, minLeaveOf, parityFrames, peakRows, position, shown, table, type CurveResult, type Fault, type LandingResult, type LeaveResult, type Row, type SeamResult } from './smooth/path'

// The measures of a smooth dive and rise (kit/PROGRESS.md, second review note of 2026-11-23, plan I). One stop.
//   npm run smooth -- --stop ID [--kind dive|rise|landing] [--only path,pictures,place,parity,counts] [--rate N] [--calibrate] [--ring picture|ground]
// path      from the camera path alone, at whole film frames and at the capture rate (smooth.rate): the fall or climb of the height, the turn of the
//           camera and the speed of the picture at the place, each over the mean of the move. Judged: the change over one film frame, the same
//           across both seams, and one rise and one fall (smooth.path). The speed is a mean over ground points on a ring round the place:
//           every step and every rebound compares the mean over the points that have ground in every frame it compares, and their count
//           stands beside the number; a row with fewer than 5 of the 8 is shown and not judged, and the report says how many rows that was.
//           A point counts only on what the camera sees of the place's own surface (the plane of the rings where the place lies on the
//           rings). --ring ground tries the ring laid on the ground. At the seam with the surface view (the end of a dive, the start of a
//           rise): the way of the eye over its own height above the ground as the stop's twin holds it, over the same number of the surface view
//           itself, 16 film frames to each side at the capture rate. Judged: its lowest value (smooth.path.minEye); its largest step and the
//           part along the surface view's own direction of motion are shown. At the seam from a rise into the move that follows it (the travel that
//           leaves the stop, the retreat after the last stop's rise)
//           (smooth.reachFrames film frames to each side, at the capture rate): the lowest speed of the fastest point of the body's edge over
//           the smaller of that speed at the two ends of the window; near 0 the picture comes to rest between the rise and that move.
//           Judged against smooth.path.minLeave: a reading under it is red in the path part.
// pictures  from draft frames, every frame of the dive and of the rise and smooth.reachFrames film frames into each neighbour (capture frames once
//           the page knows a rate, whole film frames until then): the step of the frame's level against the line through its two neighbours,
//           and the pop score: what is left of the difference between a frame and the next once the motion between them is taken out, over the
//           median of that number in the smooth.pictures.popWindow frames round it. A limit that is null is reported and not judged.
//           The pop is counted twice, once with every pixel and once with nothing left where the flow from a frame to the next and the flow
//           back do not agree (ground uncovered, content entering at the edge); the smaller of the two is the pop. The change in place: a frame against the frame smooth.pictures.changeFrames film frames later, carried back along
//           the flows, the difference smoothed, its 99th percentile on the body: a look that is replaced in place within those frames.
//           The rings of a stop named in smooth.pictures.ringBodies count as its body. The change of the pattern alone: the same two pictures
//           reduced to their detail (local mean out, divided by the local contrast), 0 the same pattern and 1 an unrelated one, so a veil
//           of air counts little and a new texture in full. It is the judged test for a dissolve (smooth.pictures.maxPattern); the change in
//           place is shown beside it. The longest run of frames without a measured pattern is shown: a new pattern can hide in a long one. Both numbers on the frames of the surface view beside the move stand next to
//           them: the life of the ground itself.
//           Frames at whole film frames are shared with npm run handover (out/work/handover/<stop>/frames), so nothing is rendered twice.
// place     the handover with the place picture switched off (the noplace view), draft tier: both sides at T, and every frame from one before the
//           place window and the dissolve to one after them: the steps of level and colour on the body as npm run handover counts them, and
//           the level step and the pop score of the pictures part. What the place picture covers is seen here. Limits in smooth.place.
// parity    the same film frame drawn at the first format of smooth.parity.formats and scaled down, against the frame drawn at the second (the
//           film's): a few frames of the hold, the dive, the surface view, the rise and the travel that leaves the stop (smooth.parity.at,
//           shares of the segment; the hold and the travel only in a run without --kind). What a stop, the sky or the dust holds in
//           pixels of the drawn format shows here as a difference.
// counts    the work the graphics card is given per picture, as the page counts it (showcase.counts(): programs linked, texture uploads, buffers
//           made): every capture frame of the stop from its first segment to the end of its travel, in order on one fresh page, draft tier at the
//           format smooth.counts.format; before each one the warm start runs as the live player calls it (showcase.ahead(frame, tier, all), all
//           true at the first) and its work counts for that picture. Judged: every picture of a dive, a rise and a travel against smooth.counts
//           (zero). NOT MEASURED while the page has no counter.
//           One move in slices, for several machines: --kind dive|rise --only pictures --part I/N (or --frames A-B, capture frames, both
//           included) renders the frames the slice owns and the overlap their numbers need (the neighbours, the frames of the pop's median,
//           the frame smooth.pictures.changeFrames film frames later), measures them on the indices of the whole window and writes
//           <stop>-<kind>-pIofN.md, .json and its own panels. --kind dive|rise --only pictures --join [FOLDER] reads every such .json of the
//           move in the folder (out/work/smooth by default), renders nothing and writes <stop>-<kind>.md and .json as the whole run does,
//           judged by the limits the parts carry; it names the frames no part owns and exits 2 then.
//           The whole report from several machines: --join [PATHS] with neither --kind nor --only reads every .json of the folders and files
//           named (a comma list; out/work/smooth by default), takes each by what it holds (the slices of the pictures of both moves, and
//           the path, the place, the parity and the counts from runs with --only or --part, the place also one file a move), opens no
//           browser and writes <stop>.json and .md as the whole run does. It refuses files that are not one run or not this build (commit,
//           engine hash, stop hash, rate, limits; --commit SHA names the commit of the parts when the join runs at another), names every
//           part that is missing or there twice and writes nothing then (exit 2). The report says which machine wrote which part.
//           --part path,place,parity,counts (one or more) is --only with a file name of its own, <stop>-part-<names>.json and .md, so that
//           two runs in one folder do not write over each other; --part place --kind dive|rise writes <stop>-<kind>-part-place.
//           --carry reads the pattern a second way: each pair carried by the camera's own map (tools/img/carry.py), then the flow on the
//           carried pair, the reading after both; its numbers stand in columns and keys of their own (patternMap). Where it has a word on a
//           row it judges that row in place of the reader above, against the same limit: the pattern on the body (the whole frame's where no
//           body holds 0.02 of it) and the pattern of the sky farther from every limb than the bloom's glow reaches (tools/smooth/maps.ts,
//           from the levels of src/post/chain.ts and the shot's bloom radius); a refusal by its own evidence is red by its reason. The sky
//           off every body stays printed; a row where it is over the limit and the far sky is not is marked LOOK, and the worst such pair
//           of the slice gets a sheet for the eye (<stop>-<kind>[-slice]-look.jpg: the first frame, the later frame, the marks).
//           The depth is made from the pose (the stop's globe, its rings); --carry-from FOLDER takes it from the range pictures of the render
//           and their pose records there (kNNNNNN-rR-TIER-range.png and .pose.json; a row is read when both its frames have them);
//           --carry-range draws those range pictures itself, for the frames its rows pair (the view "range" of the build on a page of its own, opened with that view;
//           the records by tools/smooth/pose.ts of that build, written beside the pictures) and refuses on a tree that has neither.
// Everything is written to out/work/smooth/<stop>.json and .md (<stop>-<kind> when --kind is given). Exit 1 when a number is over its limit in config smooth, or when a part that was
// asked for could not be measured. --calibrate writes every number and exits 0: the run that sets the limits.

const cfg = loadConfig()
const a = args()
const stop = a.stop
if (!stop || !cfg.stopIds.includes(stop)) {
  console.error('smooth: --stop must be one of ' + cfg.stopIds.join(', '))
  process.exit(2)
}
const PARTS = ['path', 'pictures', 'place', 'parity', 'counts']
const landing = a.kind === 'landing'
const piece = a.part !== undefined && a.part.split(',').every((p) => PIECES.includes(p)) ? PIECES.filter((p) => a.part!.split(',').includes(p)) : null
if (piece && (a.only !== undefined || a.frames !== undefined || a.join !== undefined || landing || (a.kind !== undefined && piece.join() !== 'place'))) {
  console.error('smooth: a part file is --part with one or more of ' + PIECES.join(', ') + ' (the place alone also with --kind dive|rise): no --only, --frames, --join')
  process.exit(2)
}
const only = piece ?? (a.only ? a.only.split(',') : landing ? ['path'] : PARTS)
for (const p of only) {
  if (!PARTS.includes(p)) {
    console.error('smooth: --only takes ' + PARTS.join(', '))
    process.exit(2)
  }
}
const kinds: Kind[] = landing ? [] : a.kind ? [a.kind as Kind] : ['dive', 'rise']
if (kinds.some((k) => k !== 'dive' && k !== 'rise')) {
  console.error('smooth: --kind is dive, rise or landing')
  process.exit(2)
}
if (landing && only.some((p) => p !== 'path')) {
  console.error('smooth: --kind landing has the path part only')
  process.exit(2)
}
const calibrate = a.calibrate === 'true'
const mapFrom = a['carry-from'] ?? null
const mapRange = a['carry-range'] === 'true'
if (mapRange && mapFrom !== null) {
  console.error('smooth: --carry-range draws the range pictures of this build, --carry-from takes them from a folder: one of the two')
  process.exit(2)
}
const RECORDS = join(ROOT, 'tools', 'smooth', 'pose.ts')
const VIEWS = join(ROOT, 'src', 'diagnostics', 'diag.ts')
if (mapRange && (!existsSync(RECORDS) || !existsSync(VIEWS) || !readFileSync(VIEWS, 'utf8').includes('RANGE_LOW'))) {
  console.error('smooth: --carry-range needs a build that draws the view "range" and has tools/smooth/pose.ts; this tree has ' + (existsSync(RECORDS) ? 'no such view' : 'no such file'))
  process.exit(2)
}
const byMap = a.carry === 'true' || mapFrom !== null || mapRange
const mapMax = a['carry-limit'] === undefined ? null : Number(a['carry-limit'])
const ASSETS = a.assets ?? 'full'
if (ASSETS !== 'full' && (ASSETS !== 'web' || a.join !== undefined || only.join() !== 'pictures')) {
  console.error('smooth: --assets web draws the pictures part alone with the web asset set, the player\'s (--only pictures, no --join), into out/work/smooth-web; the film is judged on the full set')
  process.exit(2)
}
const dir = join(WORK, ASSETS === 'full' ? 'smooth' : 'smooth-' + ASSETS)
const partOf = a.part === undefined || piece ? null : /^(\d+)\/(\d+)$/.exec(a.part)
const framesOf = a.frames === undefined ? null : /^(\d+)-(\d+)$/.exec(a.frames)
const sliced = (a.part !== undefined && !piece) || a.frames !== undefined
const joining = a.join !== undefined
const whole = joining && !sliced && a.kind === undefined && a.only === undefined
if ((sliced || joining) && !whole) {
  const one = kinds.length === 1 && a.kind !== undefined && only.length === 1 && only[0] === 'pictures'
  const part = partOf ? [Number(partOf[1]), Number(partOf[2])] : null
  const span = framesOf ? [Number(framesOf[1]), Number(framesOf[2])] : null
  if (!one || (sliced && joining) || (a.part !== undefined && a.frames !== undefined) || (a.part !== undefined && !piece && (!part || part[0]! < 1 || part[0]! > part[1]!)) || (a.frames !== undefined && (!span || span[0]! > span[1]!))) {
    console.error('smooth: a slice is --kind dive|rise --only pictures with --part I/N or --frames A-B (capture frames, both included); the join of one move is --kind dive|rise --only pictures --join [FOLDER], the join of the whole report is --join [FOLDER] with neither --kind nor --only')
    process.exit(2)
  }
}
const joined = joining && !whole ? readParts(a.join === 'true' ? dir : a.join!, a.kind!) : null
const S = joined ? joined.limits : cfg.raw.smooth
const rate = joined ? joined.rate : a.rate ? Number(a.rate) : cfg.raw.smooth.rate
if (!Number.isInteger(rate) || rate < 1) {
  console.error('smooth: --rate is a whole number of at least 1')
  process.exit(2)
}
const ring = (a.ring ?? 'picture') as Ring
if (ring !== 'picture' && ring !== 'ground') {
  console.error('smooth: --ring is picture or ground')
  process.exit(2)
}
const master = cfg.formats[cfg.formatKeys.master]!
const sliceTag = partOf ? sliceName(Number(partOf[1]), Number(partOf[2]), 0, 0) : framesOf ? sliceName(null, null, Number(framesOf[1]), Number(framesOf[2])) : ''
const base = stop + (a.kind ? '-' + a.kind : '')
const stem = piece ? pieceStem(stop, a.kind ?? null, piece) : base + (sliceTag ? '-' + sliceTag : '')
const started = Date.now()
mkdirSync(dir, { recursive: true })

const plan = plans.find((p) => p.id === stop)!
const film = new FilmDirector(plans)
const ringGround: Plane | null = ringPlane(plan)

interface PartResult { measured: boolean; pass: boolean; why: string[]; note?: string }

interface PathRun { rate: number; curves: CurveResult[] }
interface PathKind { segment: string; firstFrame: number; endFrame: number; frameT: number | null; window: [number, number]; runs: PathRun[]; rows: Row[]; sides: string[]; heights: (number | null)[]; faults: Fault[]; eye: (SeamResult & { seam: number; own: number | null }) | null; leave?: LeaveResult & { seam: number; into: string; after?: string; reach: number }; noLeave?: string | null }

const MIN_LEAVE: number | null = joined ? (S.path as { minLeave?: number | null }).minLeave ?? null : only.includes('path') ? minLeaveOf(cfg.raw.smooth.path) : null

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
    const c = curves(w, plan, master.width, master.height, S.path.ringPx, ring, 8, ringGround)
    runs.push({ rate: r, curves: UNITS.map(([key, name, unit, floor]) => judgeCurve(name, unit, c[key], w.k0, r, w.own, S.path, floor, key === 'speed' ? { values: c.ring, min: MIN_POINTS } : null)) })
  }
  const w = whole!
  const sw = sampleSeam(cfg, film, plan, kind, rate)
  const ec = sw ? eyeCurves(sw, plan, ringGround) : null
  const eye = sw && ec ? { seam: sw.seam, own: ec.own, ...judgeSeam(ec.speed, ec.along, sw.k0, rate, S.path.minEye ?? null, kind === 'dive' ? { first: sw.k0, end: sw.seam * rate } : { first: sw.seam * rate + 1, end: (sw.seam + SEAM_REACH) * rate }) } : null
  const lw = kind === 'rise' ? sampleLeave(cfg, film, plan, rate, S.reachFrames) : null
  const leave = lw ? { seam: lw.seam, into: lw.next.id, after: lw.next.kind, reach: S.reachFrames, ...judgeLeave(landingCurves(lw, master.width, master.height).limb, lw.k0, rate, MIN_LEAVE, lw.next.kind) } : null
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
    faults: [...runs.flatMap((r) => r.curves.flatMap((c) => c.faults.map((x) => ({ ...x, text: (r.rate === 1 ? 'whole frames, ' : 'rate ' + r.rate + ', ') + x.text })))), ...(eye?.fault ? [eye.fault] : []), ...(leave?.fault ? [leave.fault] : [])],
    eye,
    ...(leave ? { leave } : kind === 'rise' ? { noLeave: afterRise(cfg, stop!)?.next?.id ?? null } : {}),
  }
}

interface LandingRun { rate: number; curves: LandingResult[] }
interface LandingKind { segment: string; into: string; firstFrame: number; holdFrame: number; window: [number, number]; judged: boolean; runs: LandingRun[]; rows: Row[]; sides: string[]; faults: Fault[]; shown: string[] }

const LANDING: ['sky' | 'centre' | 'edge' | 'limb', string][] = [
  ['sky', 'sky'],
  ['centre', 'centre'],
  ['edge', 'edge'],
  ['limb', 'centre and edge'],
]

// The travel out of the first stop has no landing law: it is shown and not judged. So is a curve whose mean is under the floor: what it
// measures stands still in the picture.
function landingOf(): LandingKind | null {
  const rates = rate > 1 ? [1, rate] : [1]
  const runs: LandingRun[] = []
  let whole: ReturnType<typeof sampleLanding> = null
  let fine: ReturnType<typeof sampleLanding> = null
  for (const r of rates) {
    const w = sampleLanding(cfg, film, plan, r, S.reachFrames)
    if (!w) return null
    if (r === 1) whole = w
    else fine = w
    const c = landingCurves(w, master.width, master.height)
    runs.push({ rate: r, curves: LANDING.map(([key, name]) => judgeLanding(name, 'px a film frame', c[key], w.k0, r, w.own, S.path, S.path.floors.speedPx)) })
  }
  const w = whole!
  const lead = w.firstFrame - w.k0
  const shifted = runs[0]!.curves.map((c) => ({ name: c.name, over: c.over.slice(lead), step: c.step.slice(lead), points: null }))
  const judged = w.travel.stop !== cfg.stopIds[0]
  const named = (still: boolean): Fault[] => runs.flatMap((r) => r.curves.filter((c) => c.floored === still).flatMap((c) => c.faults.map((x) => ({ ...x, text: (r.rate === 1 ? 'whole frames, ' : 'rate ' + r.rate + ', ') + x.text }))))
  return {
    segment: w.travel.id, into: w.hold.id, firstFrame: w.landingFrame, holdFrame: w.travel.endFrame, window: [w.firstFrame, w.firstFrame + w.frames - 1], judged, runs,
    rows: table(shifted, fine ? runs[1]!.curves : null, w.firstFrame, w.frames, fine ? fine.k0 : 0, fine ? fine.rate : 1),
    sides: Array.from({ length: w.frames }, (_, i) => w.samples[w.firstFrame + i - w.k0]!.segment),
    faults: named(false).filter((x) => judged && !LANDING_SHOWN.includes(x.rule)),
    shown: [...named(false).filter((x) => !judged || LANDING_SHOWN.includes(x.rule)), ...named(true)].map((x) => x.text),
  }
}

function pathPart(): PartResult & { kinds: Record<string, PathKind | LandingKind | null> } {
  const out: Record<string, PathKind | LandingKind | null> = {}
  const why: string[] = []
  if (landing) {
    const p = landingOf()
    out.landing = p
    if (p) for (const f of p.faults) why.push('landing: ' + f.text)
  }
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
let sessionView = 'beauty'
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

async function open(fmt: string, own = 'beauty'): Promise<Session> {
  hashes ??= ensureBuild()
  const s = await openCapture({ dist: DIST, format: fmt, assets: ASSETS, diag: own, query: rate > 1 ? '&rate=' + rate : '' })
  sessionFormat = fmt
  sessionView = own
  view = own === 'beauty' ? '' : own
  const known = await s.page.evaluate(() => (window as unknown as { showcase: { info(): { rate?: number } } }).showcase.info().rate)
  pageRate = known === rate ? rate : 1
  return s
}

// A frame of the film at the capture rate of the page: k counts capture frames. At rate 1 the file and its stamp are the handover report's.
async function still(k: number, tier: string, diag: string, fmt = format): Promise<string> {
  hashes ??= ensureBuild()
  const own = diag === 'range' ? diag : 'beauty'
  if (session && (sessionFormat !== fmt || sessionView !== own)) await drop()
  session ??= await open(fmt, own)
  const tag = (diag === 'beauty' ? '' : '-' + diag.replace(/[^A-Za-z0-9.]+/g, '_')) + (fmt === format ? '' : '-' + fmt)
  const frameDir = pageRate === 1 && fmt === format && ASSETS === 'full' ? join(WORK, 'handover', stop!, 'frames') : join(dir, stop!, 'frames')
  mkdirSync(frameDir, { recursive: true })
  const file = join(frameDir, (pageRate === 1 ? 'f' + padFrame(k) : 'k' + String(k).padStart(6, '0') + '-r' + pageRate) + '-' + tier + tag + '.png')
  const stamp = hashes.engine + ':' + JSON.stringify(hashes.stops) + '|' + fmt + (ASSETS === 'full' ? '' : '|' + ASSETS)
  const note = file + '.stamp'
  if (existsSync(file) && existsSync(note) && readFileSync(note, 'utf8') === stamp) return file
  for (let attempt = 1; ; attempt++) {
    try {
      session ??= await open(fmt, own)
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

interface PictureNumbers { level: number[]; levelStep: (number | null)[]; residual: (number | null)[]; base: (number | null)[]; popAll: (number | null)[]; popCarried: (number | null)[]; pop: (number | null)[]; motionPx: (number | null)[]; unsure: (number | null)[]; popBlock: (number | null)[]; popBlockAt: ([number, number] | null)[]; grid: [number, number]; change: (number | null)[]; changeTop: (number | null)[]; changeAt: ([number, number] | null)[]; changeShare: (number | null)[]; pattern: (number | null)[]; patternAt: ([number, number] | null)[]; patternShare: (number | null)[]; patternMap?: (number | null)[]; patternMapAt?: ([number, number] | null)[]; patternMapShare?: (number | null)[]; patternMapOn?: (number | null)[]; patternMapBy?: (ByRule | null)[]; patternMapRule?: (string | null)[]; patternMapLeft?: (number | null)[]; patternMapUnits?: (number[] | null)[]; patternMapBulk?: (number | null)[]; patternMapApart?: (number | null)[]; patternMapNo?: (string | null)[]; patternMapRefused?: (number | null)[]; patternMapBody?: (number | null)[]; patternMapSky?: (number | null)[]; patternMapSkyShare?: (number | null)[]; patternMapSkyTurn?: (number | null)[]; patternMapSkyFar?: (number | null)[]; patternMapSkyFarShare?: (number | null)[]; patternMapLimits?: MapLimits }
interface ByRule { map: number; sky: number; flow: number }
interface MapLimits { bulkPx: number; apart: number }
interface PictureRow { k: number; frame: number; level: number; levelStep: number | null; residual: number | null; base: number | null; popAll: number | null; popCarried: number | null; pop: number | null; motionPx: number | null; unsure: number | null; popBlock: number | null; popBlockAt: [number, number] | null; change: number | null; changeTop: number | null; changeAt: [number, number] | null; changeShare: number | null; pattern: number | null; patternAt: [number, number] | null; patternShare: number | null; patternMap?: number | null; patternMapAt?: [number, number] | null; patternMapShare?: number | null; patternMapOn?: number | null; patternMapBy?: ByRule | null; patternMapRule?: string | null; patternMapLeft?: number | null; patternMapUnits?: number[] | null; patternMapBulk?: number | null; patternMapApart?: number | null; patternMapNo?: string | null; patternMapRefused?: number | null; patternMapBody?: number | null; patternMapSky?: number | null; patternMapSkyShare?: number | null; patternMapSkyTurn?: number | null; patternMapSkyFar?: number | null; patternMapSkyFarShare?: number | null }
interface Most { k: number; frame: number; value: number }
interface PictureKind { segment: string; firstFrame: number; endFrame: number; window: [number, number]; rate: number; frames: number; rows: PictureRow[]; levelStep: Most | null; pop: Most | null; popBlock: (Most & { at: [number, number] | null }) | null; change: (Most & { at: [number, number] | null }) | null; pattern: (Most & { at: [number, number] | null }) | null; changeFrames: number; silent: { frames: number; first: number; last: number; body: number } | null; ground: { value: number; pattern: number | null; first: number; last: number } | null; panel: string | null; changePanel: string | null; why: string[]; context?: [number, number]; lead?: string[]; tail?: string[]; mapPanel?: string; lookPanel?: string; lookRow?: number; lookSheets?: { k: number; name: string }[]; mapGlow?: [number, number]; mapSource?: 'range' | 'made'; mapLimits?: MapLimits; assets?: string }
interface SliceInfo { name: string; part: number | null; of: number | null; total: number; own: [number, number]; need: [number, number]; pops: number[]; changes: number[] }
let slice: SliceInfo | null = null

const CHANGE = { frames: (S.pictures as { changeFrames?: number }).changeFrames ?? 8, blurPx: (S.pictures as { changeBlurPx?: number }).changeBlurPx ?? 20, max: (S.pictures as { maxChange?: number | null }).maxChange ?? null, rings: (S.pictures as { ringBodies?: string[] }).ringBodies ?? [] }
const PATTERN = { px: (S.pictures as { patternPx?: number }).patternPx ?? 40, floor: (S.pictures as { patternFloor?: number }).patternFloor ?? 1, max: (S.pictures as { maxPattern?: number | null }).maxPattern ?? null }

function poseOf(k: number, r: number): { p: number[]; q: number[]; vfov: number; rings?: { normal: number[]; inner: number; outer: number }; globe?: { quaternion: number[]; scale: number[] }; turn?: number[] } {
  const time = (k / r + spanMid()) / cfg.fps
  const pose = carriedCamera(film, plan, stop!, k / r, time).pose
  const rings = CHANGE.rings.includes(stop!) ? plan.fit.rings : null
  // a globe that the stop draws flattened (fit.globe.scale) is the body as it is drawn, not the unit sphere round it
  const globe = plan.fit.globe?.scale?.some((s) => s !== 1) ? { quaternion: plan.fit.globe.quaternion, scale: plan.fit.globe.scale } : null
  return { p: pose.position.toArray(), q: pose.quaternion.toArray(), vfov: pose.vfov, ...(rings && rings.outer > rings.inner ? { rings } : {}), ...(globe ? { globe } : {}), ...(byMap ? { turn: plan.turn(time).toArray() } : {}) }
}

interface Sums { levelStep: Most | null; pop: Most | null; block: Most | null; change: Most | null; pattern: Most | null; why: string[]; top: PictureRow[]; peaks: PictureRow[]; silent: PictureKind['silent']; ground: PictureKind['ground'] }

// What is read off the rows of a window, the same for a whole run, a slice and the join: total counts the capture frames of the whole window.
function sumsOf(kind: Kind, seg: { firstFrame: number; endFrame: number }, first: number, r: number, total: number, rows: PictureRow[]): Sums {
  const P = S.pictures
  const most = (key: 'levelStep' | 'pop' | 'popBlock' | 'change' | 'pattern'): Most | null => {
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
  const pattern = most('pattern')
  const why: string[] = []
  const limit = (v: number | null): number | null => v
  const over = (key: 'levelStep' | 'pop' | 'popBlock' | 'change' | 'pattern', max: number | null, text: (row: PictureRow) => string, from: PictureRow[] = rows): void => {
    if (max === null) return
    const bad = from.filter((row) => row[key] !== null && row[key]! > max)
    if (bad.length === 0) return
    const top = bad.reduce((x, y) => (y[key]! > x[key]! ? y : x))
    why.push(text(top) + ', limit ' + max + (bad.length > 1 ? ' (' + bad.length + ' frames over it, first ' + position(bad[0]!.k, r) + ')' : ''))
  }
  over('levelStep', limit(P.maxLevelStep), (row) => 'the level of frame ' + position(row.k, r) + ' lies ' + shown(row.levelStep!, 2, P.maxLevelStep) + ' off the line through its two neighbours')
  over('pop', limit(P.maxPop), (row) => 'pop score ' + shown(row.pop!, 2, P.maxPop) + ' from frame ' + position(row.k, r) + ' to the next')
  over('popBlock', limit(P.maxPopBlock), (row) => 'pop score of one block ' + shown(row.popBlock!, 2, P.maxPopBlock) + ' from frame ' + position(row.k, r) + ' to the next')
  over('change', CHANGE.max, (row) => 'the picture changes in place by ' + shown(row.change!, 1, CHANGE.max) + ' from frame ' + position(row.k, r) + ' to ' + CHANGE.frames + ' film frames later')
  over('pattern', PATTERN.max, (row) => 'the pattern of the picture changes in place by ' + shown(row.pattern!, 2, PATTERN.max) + ' from frame ' + position(row.k, r) + ' to ' + CHANGE.frames + ' film frames later', rows.filter((row) => !worded(row)))
  for (const f of mapFaults(rows, PATTERN.max)) {
    const more = f.rows > 1 ? ' (' + f.rows + ' frames, first ' + position(f.first, r) + ')' : ''
    const span = ' from frame ' + position(f.k, r) + ' to ' + CHANGE.frames + ' film frames later'
    if (f.kind === 'refused') why.push('no reading by the camera\'s map, a red of the reader: ' + f.no + ', at frame ' + position(f.k, r) + (f.value !== null ? ' the pair gave ' + f.value.toFixed(2) : '') + more)
    else why.push((f.kind === 'body' ? 'the pattern on the body, by the camera\'s map, changes in place by ' : 'the pattern of the sky far from the limbs, by the flow alone, changes in place by ') + shown(f.value!, 2, PATTERN.max) + span + ', limit ' + PATTERN.max + more)
  }
  const top = rows.filter((row) => row.pop !== null).sort((x, y) => y.pop! - x.pop!).slice(0, 4).sort((x, y) => x.k - y.k)
  const peaks = peakRows(rows, CHANGE.frames * r)
  const reach = CHANGE.frames * r
  const gap = longestGap(rows.filter((row) => row.k - first * r < total - reach).map((row) => row.pattern !== null))
  const silent: PictureKind['silent'] = gap ? { frames: (gap.last - gap.first + 1) / r, first: rows[gap.first]!.k, last: rows[gap.last]!.k, body: Math.max(...rows.slice(gap.first, gap.last + 1).map((row) => row.changeShare ?? 0)) } : null
  const beside = rows.filter((row) => row.change !== null && (kind === 'dive' ? row.k >= seg.endFrame * r : row.k + reach < seg.firstFrame * r))
  const woven = beside.filter((row) => row.pattern !== null).map((row) => row.pattern!)
  const ground = beside.length > 0 ? { value: Math.max(...beside.map((row) => row.change!)), pattern: woven.length > 0 ? Math.max(...woven) : null, first: beside[0]!.k, last: beside.at(-1)!.k + reach } : null
  return { levelStep, pop, block, change, pattern, why, top, peaks, silent, ground }
}

const LOOK_EDGE = 1400

function glowOf(k: number, r: number): number {
  const at = k / r
  const time = (at + spanMid()) / cfg.fps
  const seg = segmentAtFrame(at)
  return glowPx(film.shotAt(at, time, seg.stop === stop && (seg.kind === 'dive' || seg.kind === 'rise') ? sideAt(seg, time) : undefined).post.bloomRadius)
}

interface Ranged { depth: string; sky: number[]; range: unknown; bodies: unknown[] }

function rangeOf(k: number, r: number, tier: string, pose: { p: number[]; q: number[]; vfov: number }): Ranged | null {
  const name = join(mapFrom!, 'k' + String(k).padStart(6, '0') + '-r' + r + '-' + tier)
  if (!existsSync(name + '-range.png') || !existsSync(name + '.pose.json')) return null
  const rec = JSON.parse(readFileSync(name + '.pose.json', 'utf8')) as { k: number; rate: number; camera: { p: number[]; q: number[]; vfov: number }; sky: { q: number[] }; range: unknown; bodies: unknown[] }
  const off = Math.max(...pose.p.map((v, i) => Math.abs(v - rec.camera.p[i]!)), ...pose.q.map((v, i) => Math.abs(v - rec.camera.q[i]!)), Math.abs(pose.vfov - rec.camera.vfov))
  if (rec.k !== k || rec.rate !== r || !(off < 1e-9)) {
    console.error('smooth: ' + name + '.pose.json is not the pose of capture frame ' + k + ' at rate ' + r + ' of this build (off by ' + off + ')')
    process.exit(2)
  }
  return { depth: name + '-range.png', sky: rec.sky.q, range: rec.range, bodies: rec.bodies }
}

interface PoseRecord { sky: { q: number[] }; range: unknown; bodies: { id: string; turn: number[] }[] }
type Recorder = (k: number, r: number) => PoseRecord

async function recorder(): Promise<Recorder> {
  const made = (await import(pathToFileURL(RECORDS).href)) as { poseRecord(film: FilmDirector, plan: unknown, k: number, rate: number, fps: number, size: { width: number; height: number }): PoseRecord }
  const size = cfg.formats[format]!
  const drawn = (plan as unknown as { drawn?: (time: number) => { toArray(): number[] } }).drawn
  return (k, r) => {
    const rec = made.poseRecord(film, plan, k, r, cfg.fps, { width: size.width, height: size.height })
    setCapture(r)
    const at = k / r
    const time = (at + spanMid()) / cfg.fps
    const seg = segmentAtFrame(at)
    const shot = film.shotAt(at, time, seg.stop === stop && (seg.kind === 'dive' || seg.kind === 'rise') ? sideAt(seg, time) : undefined)
    const sky = shot.skyTurn.clone().invert().multiply(shot.skyQuaternion).toArray()
    const bodies = drawn ? rec.bodies.map((b) => (b.id === stop ? { ...b, turn: drawn.call(plan, time).toArray() } : b)) : rec.bodies
    return { ...rec, sky: { q: sky }, bodies }
  }
}

async function rangesOf(ks: number[], from: number, to: number, r: number, tier: string, kind: Kind): Promise<(Ranged | null)[]> {
  const record = await recorder()
  const out: (Ranged | null)[] = []
  const t0 = Date.now()
  const want = ks.filter((k) => k >= from && k <= to).length
  let drawn = 0
  for (const k of ks) {
    if (k < from || k > to) {
      out.push(null)
      continue
    }
    const depth = await still(k, tier, 'range')
    const rec = record(k, r)
    writeFileSync(depth.replace(/-range\.png$/, '.pose.json'), JSON.stringify(rec))
    out.push({ depth, sky: rec.sky.q, range: rec.range, bodies: rec.bodies })
    if (++drawn % 20 === 0) console.log(stop + ' ' + kind + ': ' + drawn + ' of ' + want + ' range pictures, ' + Math.round((Date.now() - t0) / 1000) + ' s')
  }
  await drop()
  return out
}

function mapLines(p: PictureKind): string[] {
  const read = p.rows.filter((row) => row.patternMap !== undefined && row.patternMap !== null)
  const refused = mapRefusals(p)
  if (read.length === 0) return ['The pattern by the camera\'s own map: no row has a reading.', ...refused]
  const top = read.reduce((x, y) => (y.patternMap! > x.patternMap! ? y : x))
  const share = (key: keyof ByRule): string => (read.reduce((sum, row) => sum + (row.patternMapBy?.[key] ?? 0), 0) / read.length).toFixed(2)
  const runs = apart(p.rows, PATTERN.max, mapMax ?? PATTERN.max)
  const sides = runs.length === 0 ? 'No row where the two readers fall on different sides of ' + (mapMax === null ? 'the limit ' + PATTERN.max : 'their limits (main ' + PATTERN.max + ', the map ' + mapMax + ')') + '.' : 'Rows where the two readers fall on different sides of ' + (mapMax === null ? 'the limit ' + PATTERN.max : 'their limits (main ' + PATTERN.max + ', the map ' + mapMax + ')') + ': ' + runs.map((run) => (run.last > run.first ? 'frames ' + position(run.first, p.rate) + ' to ' + position(run.last, p.rate) : 'frame ' + position(run.first, p.rate)) + ' (' + run.rows + (run.rows === 1 ? ' row' : ' rows') + ', red on ' + (run.red === 'main' ? 'main\'s reader' : 'the map') + ' alone, farthest apart at ' + position(run.k, p.rate) + ': main ' + run.main.toFixed(2) + ', the map ' + (run.no ? 'no reading: ' + run.no : run.map.toFixed(2)) + ')').join('; ') + '.'
  return ['The pattern by the camera\'s own map judges the rows it has a word on, against the limit ' + PATTERN.max + ': the pattern on the body (the whole frame\'s where no body holds 0.02 of it) and the pattern of the sky far from the limbs; a refusal is red. Main\'s reader stands beside and judges only the rows this reader has no word on. Largest by the map over the whole frame, shown: ' + top.patternMap!.toFixed(2) + ' from frame ' + position(top.k, p.rate) + ' to ' + p.changeFrames + ' film frames later, read on ' + (top.patternMapOn === 1 ? 'the later frame' : 'the first frame') + (top.patternMapAt ? ', most at pixel ' + top.patternMapAt.join(', ') + ' of it' : '') + ', its largest block under ' + (top.patternMapRule === 'map' ? 'the map' : top.patternMapRule === 'sky' ? 'the sky' : 'the flow') + ' (each pair carried by the camera\'s map from the depth and the pose of its frames, the turn of the body taken out, the sky by the camera\'s rotation; ' + (p.mapSource === 'range' ? 'the depth from the range pictures of the render, every surface the stop\'s one body; the column by unit is the share of the judged pixels whose range the render handed in each unit of the pose record, in the record\'s order' : 'the depth made from the pose: the stop\'s globe as it is fitted, its rings') + '; then the flow on the carried pair; the reading after both, on the nearer frame, the farther from its finer picture). Mean share of the judged pixels over ' + read.length + (read.length === 1 ? ' row' : ' rows') + ': the map ' + share('map') + ', the sky ' + share('sky') + ', the flow ' + share('flow') + '.', ...refused, sides, ...lookLines(p)]
}

function lookLines(p: PictureKind): string[] {
  const glow = p.mapGlow ? 'Far from the limbs is farther than ' + (p.mapGlow[0] === p.mapGlow[1] ? p.mapGlow[0] : p.mapGlow[0] + ' to ' + p.mapGlow[1]) + ' px of the frame from every body in both frames of the pair: the reach of the widest level of the film\'s bloom (' + BLOOM.texels + ' texels of the buffer halved ' + BLOOM.levels + ' times, times the bloom radius of the shot); the body\'s motion over the pair is in it by taking both outlines.' : null
  const rows = p.rows.filter((row) => look(row, PATTERN.max))
  if (rows.length === 0) return [...(glow ? [glow] : []), 'No row is marked LOOK (the sky off every body over the limit ' + PATTERN.max + ' while the sky far from the limbs is not).']
  const top = rows.reduce((x, y) => (y.patternMapSky! > x.patternMapSky! ? y : x))
  return [...(glow ? [glow] : []), 'LOOK: ' + rows.length + (rows.length === 1 ? ' row' : ' rows') + ' where the sky off every body reads over the limit ' + PATTERN.max + ' and the sky far from the limbs does not, frames ' + position(rows[0]!.k, p.rate) + ' to ' + position(rows.at(-1)!.k, p.rate) + '; the worst from frame ' + position(top.k, p.rate) + ' to ' + p.changeFrames + ' film frames later: off every body ' + top.patternMapSky!.toFixed(2) + ', far from the limbs ' + (top.patternMapSkyFar == null ? 'none' : top.patternMapSkyFar.toFixed(2)) + '. It is judged by eye: ' + (p.lookPanel && p.lookRow === top.k ? 'its sheet (the first frame, the later frame, the first frame with the marks) is ' + p.lookPanel.slice(ROOT.length + 1) + '.' : p.lookSheets ? 'the sheets of the parts, each the worst such pair of its part (the first frame, the later frame, the first frame with the marks): ' + p.lookSheets.map((x) => 'frame ' + position(x.k, p.rate) + ' in ' + x.name).join(', ') + '.' : 'its sheet is written by the run that draws these frames, beside its report (-look.jpg).')]
}

function mapRefusals(p: PictureKind): string[] {
  const no = p.rows.filter((row) => row.patternMapNo)
  if (!p.mapLimits) return []
  const L = p.mapLimits
  const law = 'A row is refused, and counts as a red of this reader, where its own evidence says the pair is not carried: "the range does not carry the pattern" where the flow left after the map, its median over the body\'s pixels, is over ' + L.bulkPx + ' px; "two grounds" where over ' + L.apart + ' of the body\'s pixels arrive on their own body at another distance than the other frame holds there.'
  if (no.length === 0) return [law + ' No row is refused.']
  const kinds = [...new Set(no.map((row) => row.patternMapNo!))]
  return [law + ' Refused: ' + kinds.map((kind) => {
    const rows = no.filter((row) => row.patternMapNo === kind)
    const runs: [number, number][] = []
    for (const row of rows) {
      const last = runs[runs.length - 1]
      if (last && row.k === last[1] + 1) last[1] = row.k
      else runs.push([row.k, row.k])
    }
    return rows.length + (rows.length === 1 ? ' row' : ' rows') + ' "' + kind + '" (' + runs.map(([x, y]) => (y > x ? 'frames ' + position(x, p.rate) + ' to ' + position(y, p.rate) : 'frame ' + position(x, p.rate))).join(', ') + ')'
  }).join('; ') + '.']
}

function kindOf(seg: { id: string; firstFrame: number; endFrame: number }, first: number, end: number, r: number, total: number, rows: PictureRow[], sums: Sums, panel: string | null, changePanel: string | null, more: { context?: [number, number]; lead?: string[]; tail?: string[]; mapPanel?: string; lookPanel?: string; lookRow?: number; lookSheets?: { k: number; name: string }[]; mapGlow?: [number, number]; mapSource?: 'range' | 'made'; mapLimits?: MapLimits; assets?: string }): PictureKind {
  const { levelStep, pop, block, change, pattern, silent, ground, why } = sums
  return { segment: seg.id, firstFrame: seg.firstFrame, endFrame: seg.endFrame, window: [first, end - 1], rate: r, frames: total, rows, levelStep, pop, ground, popBlock: block ? { ...block, at: rows.find((row) => row.k === block.k)!.popBlockAt } : null, change: change ? { ...change, at: rows.find((row) => row.k === change.k)!.changeAt } : null, pattern: pattern ? { ...pattern, at: rows.find((row) => row.k === pattern.k)!.patternAt } : null, changeFrames: CHANGE.frames, silent, panel, changePanel, why, ...more }
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
  setCapture(r)
  const total = (end - first) * r
  const k0 = first * r
  const own: Span = partOf ? partOwn(Number(partOf[1]), Number(partOf[2]), total) : framesOf ? { first: Number(framesOf[1]) - k0, end: Number(framesOf[2]) + 1 - k0 } : { first: 0, end: total }
  if (own.first < 0 || own.end > total || own.end <= own.first) {
    console.error('smooth: the window of the ' + kind + ' of ' + stop + ' has the capture frames ' + k0 + ' to ' + (k0 + total - 1) + (partOf ? ': too few for that many parts' : ''))
    await drop()
    process.exit(2)
  }
  const context = popContext(first, end, cfg.frameCount, P.popWindow)
  const [lo, hi] = sliceNeed(own, total, P.popWindow * r, CHANGE.frames * r, context[0] * r, context[1] * r)
  const ks = Array.from({ length: hi - lo + 1 }, (_, i) => k0 + lo + i)
  const paths: string[] = []
  const t0 = Date.now()
  for (const k of ks) {
    paths.push(await still(k, tier, 'beauty'))
    if (paths.length % 20 === 0) console.log(stop + ' ' + kind + ': ' + paths.length + ' of ' + ks.length + ' ' + tier + ' frames, ' + Math.round((Date.now() - t0) / 1000) + ' s')
  }
  const flat = ks.map((k) => poseOf(k, r))
  const ranged = mapRange ? await rangesOf(ks, k0 + own.first, k0 + own.end - 1 + CHANGE.frames * r, r, tier, kind) : mapFrom ? ks.map((k, i) => rangeOf(k, r, tier, flat[i]!)) : null
  const poses = flat.map((pose, i) => ({ ...(ranged?.[i] ? { ...pose, sky: ranged[i]!.sky, range: ranged[i]!.range, bodies: ranged[i]!.bodies } : pose), ...(byMap ? { glow: glowOf(ks[i]!, r) } : {}) }))
  const depths = ranged ? ranged.map((x) => x?.depth ?? null) : null
  const n = measure<PictureNumbers>({ op: 'pictures', paths, poses, ...(depths ? { depths } : {}), scale: P.flowScale, window: P.popWindow * r, floor: P.popFloor, grid: P.grid, changeFrames: CHANGE.frames * r, changeBlur: CHANGE.blurPx, patternPx: PATTERN.px, patternFloor: PATTERN.floor, ...(byMap ? { carry: true } : {}), first: lo, total, own: [own.first, own.end], lead: context[0] * r, tail: context[1] * r })
  const rows: PictureRow[] = ks.map((k, i) => ({ k, frame: Math.floor(k / r), level: n.level[i]!, levelStep: n.levelStep[i] ?? null, residual: n.residual[i] ?? null, base: n.base[i] ?? null, popAll: n.popAll[i] ?? null, popCarried: n.popCarried[i] ?? null, pop: n.pop[i] ?? null, motionPx: n.motionPx[i] ?? null, unsure: n.unsure[i] ?? null, popBlock: n.popBlock[i] ?? null, popBlockAt: n.popBlockAt[i] ?? null, change: n.change[i] ?? null, changeTop: n.changeTop[i] ?? null, changeAt: n.changeAt[i] ?? null, changeShare: n.changeShare[i] ?? null, pattern: n.pattern[i] ?? null, patternAt: n.patternAt[i] ?? null, patternShare: n.patternShare[i] ?? null, ...(n.patternMap ? { patternMap: n.patternMap[i] ?? null, patternMapAt: n.patternMapAt?.[i] ?? null, patternMapShare: n.patternMapShare?.[i] ?? null, patternMapOn: n.patternMapOn?.[i] ?? null, patternMapBy: n.patternMapBy?.[i] ?? null, patternMapRule: n.patternMapRule?.[i] ?? null, patternMapLeft: n.patternMapLeft?.[i] ?? null, ...(n.patternMapUnits?.[i] ? { patternMapUnits: n.patternMapUnits[i]! } : {}), ...(n.patternMapLimits ? { patternMapBulk: n.patternMapBulk?.[i] ?? null, patternMapApart: n.patternMapApart?.[i] ?? null, patternMapNo: n.patternMapNo?.[i] ?? null, patternMapRefused: n.patternMapRefused?.[i] ?? null, patternMapBody: n.patternMapBody?.[i] ?? null, patternMapSky: n.patternMapSky?.[i] ?? null, patternMapSkyShare: n.patternMapSkyShare?.[i] ?? null, patternMapSkyTurn: n.patternMapSkyTurn?.[i] ?? null, patternMapSkyFar: n.patternMapSkyFar?.[i] ?? null, patternMapSkyFarShare: n.patternMapSkyFarShare?.[i] ?? null } : {}) } : {}) })).filter((row) => row.k - k0 >= own.first && row.k - k0 < own.end)
  const sums = sumsOf(kind, seg, first, r, total, rows)
  let panel: string | null = null
  if (sums.top.length > 0) {
    panel = join(dir, stop + '-' + kind + (sliceTag ? '-' + sliceTag : '') + '-pops.png')
    measure({ op: 'panel', output: panel, scale: P.flowScale, gain: 8, limit: cfg.raw.critics.maxImageLongEdgePx, pairs: sums.top.map((row) => ({ a: paths[row.k - ks[0]!]!, b: paths[row.k - ks[0]! + 1]!, label: stop + ' ' + kind + ' frame ' + position(row.k, r) + ' and the next, and what is left without the motion times 8: pop ' + row.pop!.toFixed(2) + ', left ' + row.residual!.toFixed(2) + ' against ' + row.base!.toFixed(2) })) })
  }
  let changePanel: string | null = null
  if (sums.peaks.length > 0) {
    changePanel = join(dir, stop + '-' + kind + (sliceTag ? '-' + sliceTag : '') + '-changes.png')
    measure({ op: 'changes', output: changePanel, scale: P.flowScale, gain: 6, changeBlur: CHANGE.blurPx, patternPx: PATTERN.px, patternFloor: PATTERN.floor, limit: cfg.raw.critics.maxImageLongEdgePx, chains: sums.peaks.map((row) => {
      const i = row.k - ks[0]!
      const last = i + CHANGE.frames * r
      return { paths: paths.slice(i, last + 1), poses: [poses[i]!, poses[last]!], label: stop + ' ' + kind + ' frame ' + position(row.k, r) + ', frame ' + position(row.k + CHANGE.frames * r, r) + ' carried back to it, their smoothed difference times 6, the change of their pattern (white is 1): ' + changeNote(row) }
    }) })
  }
  const lead = sliced ? [(partOf ? 'Part ' + Number(partOf[1]) + ' of ' + Number(partOf[2]) : 'A slice') + ' of the move: the frames ' + position(k0 + own.first, r) + ' to ' + position(k0 + own.end - 1, r) + ' (capture frames ' + (k0 + own.first) + ' to ' + (k0 + own.end - 1) + '), ' + rows.length + ' of the ' + total + ' of the window, measured with the frames ' + position(k0 + lo, r) + ' to ' + position(k0 + hi, r) + ' round them. Every row is the row of the whole run. The largest values, the lines in red and the verdict here are of these frames alone: the report of the move is the join of all its parts (--join).'] : undefined
  if (sliced) slice = { name: sliceTag, part: partOf ? Number(partOf[1]) : null, of: partOf ? Number(partOf[2]) : null, total, own: [k0 + own.first, k0 + own.end - 1], need: [k0 + lo, k0 + hi], pops: sums.top.map((row) => row.k), changes: sums.peaks.map((row) => row.k) }
  let mapPanel: string | null = null
  const picks = byMap ? shownRows(rows, PATTERN.max, mapMax ?? PATTERN.max, 6) : []
  if (picks.length > 0) {
    mapPanel = join(dir, stop + '-' + kind + (sliceTag ? '-' + sliceTag : '') + '-maps.png')
    measure({ op: 'maps', output: mapPanel, scale: P.flowScale, changeBlur: CHANGE.blurPx, patternPx: PATTERN.px, patternFloor: PATTERN.floor, limit: cfg.raw.critics.maxImageLongEdgePx, pairs: picks.map((row) => {
      const i = row.k - ks[0]!
      const last = i + CHANGE.frames * r
      return { paths: [paths[i]!, paths[last]!], between: paths.slice(i, last + 1), poses: [poses[i]!, poses[last]!], ...(depths ? { depths: [depths[i]!, depths[last]!] } : {}), label: stop + ' ' + kind + ' frame ' + position(row.k, r) + ' and frame ' + position(row.k + CHANGE.frames * r, r) + ', main\'s reader ' + (row.pattern === null ? 'none' : row.pattern.toFixed(2)) + ', off every body by the flow ' + (row.patternMapSky == null ? 'none' : row.patternMapSky.toFixed(2)) + ', far from the limbs ' + (row.patternMapSkyFar == null ? 'none' : row.patternMapSkyFar.toFixed(2)) + ', by the camera\'s map' }
    }) })
  }
  let lookPanel: string | null = null
  const looks = byMap ? rows.filter((row) => look(row, PATTERN.max)) : []
  const worst = looks.length > 0 ? looks.reduce((x, y) => (y.patternMapSky! > x.patternMapSky! ? y : x)) : null
  if (worst) {
    const i = worst.k - ks[0]!
    const last = i + CHANGE.frames * r
    lookPanel = join(dir, stop + '-' + kind + (sliceTag ? '-' + sliceTag : '') + '-look.jpg')
    measure({ op: 'look', output: lookPanel, scale: P.flowScale, changeBlur: CHANGE.blurPx, patternPx: PATTERN.px, patternFloor: PATTERN.floor, limit: PATTERN.max, longEdge: Math.min(LOOK_EDGE, cfg.raw.critics.maxImageLongEdgePx), between: paths.slice(i, last + 1), poses: [poses[i]!, poses[last]!], ...(depths ? { depths: [depths[i]!, depths[last]!] } : {}), label: 'LOOK ' + stop + ' ' + kind + ' frame ' + position(worst.k, r) + ' and frame ' + position(worst.k + CHANGE.frames * r, r) + ': off every body ' + worst.patternMapSky!.toFixed(2) + ' on ' + (worst.patternMapSkyShare ?? 0).toFixed(3) + ' of the frame, far from the limbs ' + (worst.patternMapSkyFar == null ? 'none' : worst.patternMapSkyFar.toFixed(2)) + ' on ' + (worst.patternMapSkyFarShare ?? 0).toFixed(3) + ', on the body ' + (worst.patternMapBody == null ? 'none' : worst.patternMapBody.toFixed(2)) })
  }
  return kindOf(seg, first, end, r, total, rows, sums, panel, changePanel, { context, ...(lead ? { lead } : {}), ...(mapPanel ? { mapPanel } : {}), ...(lookPanel ? { lookPanel, lookRow: worst!.k } : {}), ...(byMap ? { mapGlow: [Math.min(...ks.map((k) => glowOf(k, r))), Math.max(...ks.map((k) => glowOf(k, r)))] as [number, number] } : {}), ...(byMap ? { mapSource: depths ? 'range' as const : 'made' as const } : {}), ...(n.patternMapLimits ? { mapLimits: n.patternMapLimits } : {}), ...(ASSETS !== 'full' ? { assets: ASSETS } : {}) })
}

type PicturesPart = PartResult & { kinds: Record<string, PictureKind | null>; tier: string; rate: number; secondsAFrame: number | null }

interface PartFile { name: string; machine: string; slice: SliceInfo & { rendered: number; seconds: number }; kind: PictureKind }
interface Joined { folder: string; files: PartFile[]; limits: typeof cfg.raw.smooth; rate: number; commit: string; engineHash: string | null; stopHash: string | null; machine: string; tier: string; note?: string }

// The parts of one move as the slices wrote them. They are one run only if they agree in everything that sets a number.
interface SliceFile { stop: string; commit: string; engineHash: string | null; stopHash: string | null; machine: string; rate: number; kinds: string[]; only: string[]; limits: typeof cfg.raw.smooth; slice?: PartFile['slice']; parts: { pictures?: PicturesPart } }

function readParts(folder: string, kind: string): Joined {
  const names = existsSync(folder) ? readdirSync(folder).filter((f) => new RegExp('^' + stop + '-' + kind + '-(p\\d+of\\d+|k\\d+-\\d+)\\.json$').test(f)).sort((x, y) => x.localeCompare(y, 'en', { numeric: true })) : []
  if (names.length === 0) {
    console.error('smooth: no part of the ' + kind + ' of ' + stop + ' in ' + folder + ' (' + stop + '-' + kind + '-pIofN.json)')
    process.exit(2)
  }
  return readSlices(folder, kind, names.map((name) => ({ name, j: JSON.parse(readFileSync(join(folder, name), 'utf8')) as SliceFile })))
}

function readSlices(folder: string, kind: string, read: { name: string; j: SliceFile }[]): Joined {
  const fail = (text: string): never => {
    console.error('smooth: ' + text)
    process.exit(2)
  }
  const facts = (x: (typeof read)[number]): [string, unknown][] => {
    const p = x.j.parts.pictures
    const k = p?.kinds[kind]
    if (x.j.stop !== stop || !x.j.slice || !p || !p.measured || !k || x.j.kinds.join() !== kind || x.j.only.join() !== 'pictures') fail(x.name + ' is not a slice of the pictures of the ' + kind + ' of ' + stop)
    return [['commit', x.j.commit], ['engine hash', x.j.engineHash], ['stop hash', x.j.stopHash], ['capture rate', x.j.rate], ['limits', x.j.limits], ['tier', p!.tier], ['rate of the page', p!.rate], ['segment', [k!.segment, k!.firstFrame, k!.endFrame]], ['window', k!.window], ['frames of the window', x.j.slice!.total], ['frames of context', k!.context ?? null], ['note', p!.note ?? null]]
  }
  const first = facts(read[0]!)
  for (const x of read.slice(1)) {
    facts(x).forEach(([what, value], i) => {
      const mine = JSON.stringify(value)
      const theirs = JSON.stringify(first[i]![1])
      if (mine !== theirs) fail(x.name + ' and ' + read[0]!.name + ' differ in the ' + what + (mine.length + theirs.length < 200 ? ' (' + mine + ' against ' + theirs + ')' : '') + ': the parts of one move are made at one commit')
    })
  }
  const f = read[0]!.j
  const p = f.parts.pictures!
  const files = read.map((x) => ({ name: x.name.slice(0, -'.json'.length), machine: x.j.machine, slice: x.j.slice!, kind: x.j.parts.pictures!.kinds[kind]! }))
  return { folder, files, limits: f.limits, rate: f.rate, commit: f.commit, engineHash: f.engineHash, stopHash: f.stopHash, machine: [...new Set(files.map((x) => x.machine))].join(', '), tier: p.tier, ...(p.note ? { note: p.note } : {}) }
}

// The report of the whole move from its parts: every row as its part wrote it, everything else read off the rows as the whole run reads it.
function joinPart(j: Joined, kind: Kind): PicturesPart {
  const base = j.files[0]!.kind
  const r = base.rate
  const first = base.window[0]
  const total = j.files[0]!.slice.total
  const k0 = first * r
  const seen = new Map<number, { row: PictureRow; name: string }>()
  for (const x of j.files) {
    for (const row of x.kind.rows) {
      const had = seen.get(row.k)
      if (!had) seen.set(row.k, { row, name: x.name })
      else if (JSON.stringify(had.row) !== JSON.stringify(row)) {
        console.error('smooth: ' + had.name + ' and ' + x.name + ' both own frame ' + position(row.k, r) + ' and give it other numbers')
        process.exit(2)
      }
    }
  }
  const rows = [...seen.values()].map((x) => x.row).sort((x, y) => x.k - y.k)
  const seconds = j.files.reduce((sum, x) => sum + x.slice.seconds, 0)
  const drawn = j.files.reduce((sum, x) => sum + x.slice.rendered, 0)
  const rest = { tier: j.tier, rate: r, secondsAFrame: drawn > 0 ? Number((seconds / drawn).toFixed(2)) : null, ...(j.note ? { note: j.note } : {}) }
  const gaps = missing(rows.map((row) => ({ first: row.k - k0, end: row.k - k0 + 1 })), total)
  if (gaps.length > 0) {
    const ofs = new Set(j.files.map((x) => x.slice.of))
    const of = ofs.size === 1 ? j.files[0]!.slice.of : null
    const why = gaps.map((g) => {
      const lost = of === null ? [] : Array.from({ length: of }, (_, i) => i + 1).filter((part) => !j.files.some((x) => x.slice.part === part) && partOwn(part, of, total).first < g.end && partOwn(part, of, total).end > g.first)
      return kind + ': not measured, the frames ' + position(k0 + g.first, r) + ' to ' + position(k0 + g.end - 1, r) + ' (capture frames ' + (k0 + g.first) + ' to ' + (k0 + g.end - 1) + ') are in no part' + (lost.length > 0 ? ': part ' + lost.join(', ') + ' of ' + of + ' is missing' : '')
    })
    return { measured: false, pass: false, why, kinds: { [kind]: null }, ...rest }
  }
  const sums = sumsOf(kind, base, first, r, total, rows)
  const glows = j.files.flatMap((x) => (x.kind.mapGlow ? [x.kind.mapGlow] : []))
  const sheets = j.files.flatMap((x) => (x.kind.lookRow !== undefined ? [{ k: x.kind.lookRow, name: x.name + '-look.jpg' }] : []))
  const where = (k: number, key: 'pops' | 'changes'): string => {
    const x = j.files.find((y) => y.slice[key].includes(k))
    return 'frame ' + position(k, r) + ' in ' + (x ? x.name + '-' + key + '.png' : 'no panel (a slice --frames ' + k + '-' + k + ' draws it)')
  }
  const tail = [
    ...(sums.top.length > 0 ? ['The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: ' + sums.top.map((row) => where(row.k, 'pops')).join(', ') + '.'] : []),
    ...(sums.peaks.length > 0 ? ['The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: ' + sums.peaks.map((row) => where(row.k, 'changes')).join(', ') + '.'] : []),
  ]
  const out = kindOf({ id: base.segment, firstFrame: base.firstFrame, endFrame: base.endFrame }, first, base.window[1] + 1, r, total, rows, sums, null, null, { ...(base.context ? { context: base.context } : {}), ...(base.mapSource ? { mapSource: base.mapSource } : {}), ...(base.mapLimits ? { mapLimits: base.mapLimits } : {}), ...(glows.length > 0 ? { mapGlow: [Math.min(...glows.map((g) => g[0])), Math.max(...glows.map((g) => g[1]))] as [number, number] } : {}), ...(sheets.length > 0 ? { lookSheets: sheets } : {}), tail })
  return { measured: true, pass: sums.why.length === 0, why: sums.why.map((w) => kind + ': ' + w), kinds: { [kind]: out }, ...rest }
}

interface Whole { parts: Record<string, PartResult>; commit: string; engineHash: string | null; stopHash: string | null; machine: string; files: Record<string, unknown>[]; slices: [Kind, Joined][]; same: string[] }

function joinWhole(given: string[]): Whole {
  const fail = (lines: string[]): never => {
    for (const l of lines) console.error('smooth: ' + l)
    process.exit(2)
  }
  const files: Given[] = []
  for (const g of given) {
    if (!existsSync(g)) fail(['--join: there is no ' + g])
    const list = statSync(g).isDirectory() ? readdirSync(g).filter((f) => f.endsWith('.json')).map((f) => join(g, f)) : [g]
    for (const file of list) {
      let j: unknown = null
      try {
        j = JSON.parse(readFileSync(file, 'utf8'))
      } catch {
        j = null
      }
      files.push({ file, j })
    }
  }
  const found = gather(stop!, files)
  const moves = (MOVES as Kind[]).filter((k) => cfg.segments.some((s) => s.stop === stop && s.kind === k))
  if (moves.length === 0) fail([stop + ' has no dive and no rise: there is no report to join'])
  const head = given.join(', ') + ' does not hold the whole report of ' + stop + ':'
  const faults = gatherFaults(stop!, found, moves)
  if (faults.length > 0) fail([head, ...faults.map((f) => '  ' + f), ...found.ignored.map((x) => '  not taken: ' + x.file + ' (' + x.why + ')')])
  const slices: [Kind, Joined][] = moves.map((kind) => [kind, readSlices(given.join(', '), kind, found.slices[kind]!.map((x) => ({ name: x.file, j: x.j as SliceFile })))])
  const holders = PIECES.flatMap((piece) => found.holders[piece]!.map((h) => ({ piece, ...h })))
  const runs: { file: string; facts: Facts }[] = [...holders.map((h) => ({ file: h.file, facts: runFacts(h.j) })), ...slices.map(([, j]) => ({ file: j.files[0]!.name + '.json', facts: runFacts(j) }))]
  for (const x of runs.slice(1)) {
    const d = differ(x.facts, runs[0]!.facts)
    if (d) fail([x.file + ' and ' + runs[0]!.file + ' differ in the ' + d + ': the parts of one report are made at one commit'])
  }
  const h = computeHashes(ROOT)
  const bad = buildFault(runs[0]!.facts, runFacts({ commit: commit(), engineHash: h.engine, stopHash: h.stops[stop!] ?? null, rate, limits: cfg.raw.smooth }), a.commit)
  if (bad) fail([bad])
  const kindsOut: Record<string, PictureKind | null> = {}
  const why: string[] = []
  const lost: string[] = []
  let seconds = 0
  let drawn = 0
  let rest: { tier: string; rate: number; note?: string } | null = null
  for (const kind of kinds) {
    const j = slices.find(([k]) => k === kind)?.[1]
    kindsOut[kind] = null
    if (!j) continue
    const p = joinPart(j, kind)
    if (!p.measured) {
      lost.push(...p.why)
      continue
    }
    const mine = { tier: p.tier, rate: p.rate, ...(p.note ? { note: p.note } : {}) }
    if (rest && JSON.stringify(rest) !== JSON.stringify(mine)) fail(['the pictures of the ' + kind + ' and of the ' + slices[0]![0] + ' differ in the tier, the rate of the page or the note (' + JSON.stringify(mine) + ' against ' + JSON.stringify(rest) + ')'])
    rest ??= mine
    kindsOut[kind] = p.kinds[kind]!
    why.push(...p.why)
    for (const x of j.files) {
      seconds += x.slice.seconds
      drawn += x.slice.rendered
    }
  }
  if (lost.length > 0) fail([head, ...lost.map((l) => '  ' + l)])
  const { note, ...tierRate } = rest!
  const pictures: PicturesPart = { measured: true, pass: why.length === 0, why, kinds: kindsOut, ...tierRate, secondsAFrame: drawn > 0 ? Number((seconds / drawn).toFixed(2)) : null, ...(note ? { note } : {}) }
  const of = (piece: string): PartResult => {
    const have = found.holders[piece]!
    if (have[0]!.kind === null) return have[0]!.j.parts![piece] as PartResult
    const both: Record<string, unknown> = {}
    const red: string[] = []
    for (const kind of MOVES) {
      const p = have.find((x) => x.kind === kind)?.j.parts![piece]
      both[kind] = p?.kinds?.[kind] ?? null
      red.push(...(p?.why ?? []))
    }
    return { measured: true, pass: red.length === 0, why: red, kinds: both } as PartResult
  }
  const short = (file: string): string => (file.endsWith('.json') ? file.slice(0, -'.json'.length) : file)
  const entry = (x: (typeof holders)[number]): Record<string, unknown> => ({ file: short(x.file), machine: x.j.machine, holds: x.piece, ...(x.kind ? { kind: x.kind } : {}), ...(x.j.seconds === undefined ? {} : { seconds: x.j.seconds }) })
  const list = [
    ...holders.filter((x) => x.piece === 'path').map(entry),
    ...slices.flatMap(([kind, j]) => j.files.map((x) => ({ file: x.name, machine: x.machine, holds: 'pictures', kind, ...x.slice }))),
    ...holders.filter((x) => x.piece !== 'path').map(entry),
  ]
  const f = runs[0]!.facts
  return {
    parts: { path: of('path'), pictures, place: of('place'), parity: of('parity'), counts: of('counts') },
    commit: f[0]![1] as string, engineHash: f[1]![1] as string | null, stopHash: f[2]![1] as string | null,
    machine: [...new Set(list.map((x) => String(x.machine)))].join(', '), files: list, slices, same: found.same,
  }
}

async function picturesPart(): Promise<PicturesPart> {
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
  if (p.assets) lines.push('Drawn with the ' + p.assets + ' asset set, the player\'s, not the film\'s full set: what stands here is not a judgement of the film.', '')
  if (p.lead) lines.push(...p.lead, '')
  if (p.levelStep) lines.push('Largest level step: ' + shown(p.levelStep.value, 2, P.maxLevelStep) + ' at frame ' + position(p.levelStep.k, p.rate) + ' (display values 0 to 255, the frame against the middle of its two neighbours), ' + lim(P.maxLevelStep) + '.')
  if (p.pop) lines.push('Largest pop score: ' + shown(p.pop.value, 2, P.maxPop) + ' from frame ' + position(p.pop.k, p.rate) + ' to the next, ' + lim(P.maxPop) + '.' + (p.context && p.context[0] + p.context[1] > 0 ? ' Every frame is read against the median of the ' + P.popWindow + ' film frames round it: for the ends of the window ' + p.context[0] + ' film frames before it and ' + p.context[1] + ' after it are drawn and not judged.' : ''))
  if (p.popBlock) lines.push('Largest pop score of one block (a grid of ' + P.grid.join(' by ') + '): ' + shown(p.popBlock.value, 2, P.maxPopBlock) + ' from frame ' + position(p.popBlock.k, p.rate) + ' to the next' + (p.popBlock.at ? ', block column ' + p.popBlock.at[0] + ' row ' + p.popBlock.at[1] + ' from the top left' : '') + ', ' + (P.maxPopBlock === null ? 'shown, not judged' : 'limit ' + P.maxPopBlock) + '.')
  if (p.change) lines.push('Largest change in place: ' + shown(p.change.value, 1, CHANGE.max) + ' from frame ' + position(p.change.k, p.rate) + ' to ' + p.changeFrames + ' film frames later' + (p.change.at ? ', most at pixel ' + p.change.at.join(', ') : '') + ' (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over ' + CHANGE.blurPx + ' px, its 99th percentile on the body), ' + (CHANGE.max === null ? 'shown, not judged' : 'limit ' + CHANGE.max) + '.')
  if (p.pattern) lines.push('Largest change of the pattern alone: ' + shown(p.pattern.value, 2, PATTERN.max) + ' from frame ' + position(p.pattern.k, p.rate) + ' to ' + p.changeFrames + ' film frames later' + (p.pattern.at ? ', most at pixel ' + p.pattern.at.join(', ') : '') + ' (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between ' + PATTERN.px / 5 + ' and ' + PATTERN.px + ' px, the local mean taken out, divided by the local contrast, only where both have detail over ' + PATTERN.floor + '; its 99th percentile on the body), ' + lim(PATTERN.max) + '.')
  if (p.ground) lines.push('The ground beside it, the same numbers on the surface view alone (frames ' + position(p.ground.first, p.rate) + ' to ' + position(p.ground.last, p.rate) + '): change ' + shown(p.ground.value, 1, CHANGE.max) + (CHANGE.max !== null && p.ground.value > CHANGE.max ? ', over the limit by itself' : '') + (p.ground.pattern !== null ? ', pattern ' + shown(p.ground.pattern, 2, PATTERN.max) + (PATTERN.max !== null && p.ground.pattern > PATTERN.max ? ', over the limit by itself' : '') : '') + '.')
  lines.push(p.silent ? 'Longest run without a measured pattern: ' + (Number.isInteger(p.silent.frames) ? p.silent.frames : p.silent.frames.toFixed(1)) + ' film frames, frames ' + position(p.silent.first, p.rate) + ' to ' + position(p.silent.last, p.rate) + ', each against the frame ' + p.changeFrames + ' film frames later (too little of the picture has detail in both, or too little of the body is carried; the judged body held at most ' + p.silent.body.toFixed(2) + ' of the picture there), shown, not judged. A new pattern can come in unseen where such a run is ' + 2 * p.changeFrames + ' film frames or longer.' : 'The pattern is measured in every row.')
  if (p.panel) lines.push('The four largest pops, each with the next frame and what is left without the motion: ' + p.panel.slice(ROOT.length + 1))
  if (p.changePanel) lines.push('The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern: ' + p.changePanel.slice(ROOT.length + 1))
  if (p.tail) lines.push(...p.tail)
  lines.push('')
  if (p.why.length) lines.push(...p.why.map((w) => '- RED ' + w), '')
  const mapped = p.rows.some((row) => row.patternMap !== undefined)
  const united = p.rows.some((row) => row.patternMapUnits)
  const refusing = p.mapLimits !== undefined
  if (mapped) lines.push(...mapLines(p), ...(p.mapPanel ? ['Pairs as that reader takes them (the frame read on, the other frame, the other carried onto it, their difference times 4, the rule of each pixel: green the map, blue the sky, orange the flow, the change of the pattern, and the change of the pattern off every body by the flow alone, on the first frame of the pair), the largest reading and the rows where the two readers fall on different sides of the limit: ' + p.mapPanel.slice(ROOT.length + 1)] : []), '')
  lines.push('| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged |' + (mapped ? ' pattern by the map | read on | judged | by the map | the sky | by the flow | largest block | flow left px |' + (united ? ' by unit |' : '') + (refusing ? ' flow left over the body px | at another distance | pattern on the body | off every body, by the flow alone | on what share of the frame | the same farther than the glow reaches from every limb | on what share | LOOK | off every body, by the sky\'s turn |' : '') : ''), '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|' + (mapped ? '---|---|---|---|---|---|---|---|' + (united ? '---|' : '') + (refusing ? '---|---|---|---|---|---|---|---|---|' : '') : ''))
  for (const row of p.rows) lines.push('| ' + [position(row.k, p.rate) + (row.frame === p.firstFrame && row.k % p.rate === 0 ? ' first' : row.frame === p.endFrame - 1 && row.k % p.rate === 0 ? ' last' : ''), row.level.toFixed(2), cell(row.levelStep, 2, P.maxLevelStep), cell(row.motionPx, 1), cell(row.residual, 2), cell(row.base, 2), cell(row.popAll, 2), cell(row.popCarried, 2), cell(row.pop, 2, P.maxPop), cell(row.unsure, 3), cell(row.popBlock, 2), row.popBlockAt ? row.popBlockAt.join(',') : '', cell(row.change, 1, CHANGE.max), cell(row.changeTop, 1), cell(row.changeShare, 2), cell(row.pattern, 2, worded(row) ? null : PATTERN.max), cell(row.patternShare, 2), ...(mapped ? [row.patternMapNo ? 'no reading: ' + row.patternMapNo + (row.patternMapRefused !== null && row.patternMapRefused !== undefined ? ' (the pair gave ' + row.patternMapRefused.toFixed(2) + ')' : '') : cell(row.patternMap ?? null, 2), row.patternMapOn === 1 ? 'the later' : row.patternMapOn === 0 ? 'the first' : '', cell(row.patternMapShare ?? null, 2), cell(row.patternMapBy?.map ?? null, 2), cell(row.patternMapBy?.sky ?? null, 2), cell(row.patternMapBy?.flow ?? null, 2), row.patternMapRule ?? '', cell(row.patternMapLeft ?? null, 1), ...(united ? [row.patternMapUnits ? row.patternMapUnits.map((v) => v.toFixed(2)).join(', ') : ''] : []), ...(refusing ? [cell(row.patternMapBulk ?? null, 1), cell(row.patternMapApart ?? null, 2), cell(row.patternMapBody ?? null, 2, PATTERN.max), cell(row.patternMapSky ?? null, 2), cell(row.patternMapSkyShare ?? null, 2), cell(row.patternMapSkyFar ?? null, 2, PATTERN.max), cell(row.patternMapSkyFarShare ?? null, 2), look(row, PATTERN.max) ? 'LOOK' : '', cell(row.patternMapSkyTurn ?? null, 2)] : [])] : [])].join(' | ') + ' |')
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
interface PlaceRow { k: number; frame: number; level: number; bodyShare: number; bodyLevel: number; bodyLevelStep: number | null; bodyColourStep: number | null; seen?: number | null; placeLevelStep?: number | null; placeColourStep?: number | null; levelStep: number | null; pop: number | null; popBlock: number | null }
interface PlaceSeen { share: number; level: Most | null; colour: Most | null; least: { k: number; share: number } | null; read: number; unread: number; unreadLevel: Most | null; unreadColour: Most | null; would: string[] }
interface PlaceKind { segment: string; frameT: number; window: [number, number]; frames: [number, number]; rate: number; sides: (SideNumbers & { panel: string }) | null; rows: PlaceRow[]; bodyLevelStep: Most | null; bodyColourStep: Most | null; inPlace?: PlaceSeen; levelStep: Most | null; pop: Most | null; note?: string; why: string[] }

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
  setCapture(r)
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
  const poses: { position: number[]; quaternion: number[]; vfov: number; turn: number[] }[] = []
  for (const k of ks) {
    paths.push(await still(k, 'draft', 'beauty/noplace'))
    const time = (k / r + spanMid()) / cfg.fps
    const pose = carriedCamera(film, plan, stop!, k / r, time).pose
    bodies.push(bodyGrid(pose))
    poses.push({ position: pose.position.toArray(), quaternion: pose.quaternion.toArray(), vfov: pose.vfov, turn: plan.turn(time).toArray() })
  }
  const body = handoverMeasure<BodyNumbers[]>({ op: 'frames', paths, bodies, floor: L.flatFloor })
  const seenOf = L as typeof L & { inPlaceScale?: number; inPlaceShare?: number }
  const share = seenOf.inPlaceShare ?? IN_PLACE.share
  const laid = handoverMeasure<({ seen: number; level: number; colour: number[] } | null)[]>({ op: 'inPlace', paths, poses, scale: seenOf.inPlaceScale ?? IN_PLACE.scale })
  const both = placeReadings(ks.map((k, i) => ({ k, ...body[i]!, inPlace: laid[i] ?? null })), { bodyShare: L.bodyShare, levelStep: P.levelStep, colourStep: P.colourStep, inPlaceShare: share })
  const pic = measure<PictureNumbers>({ op: 'pictures', paths, scale: S.pictures.flowScale, window: S.pictures.popWindow * r, floor: S.pictures.popFloor, grid: S.pictures.grid })
  const rows: PlaceRow[] = ks.map((k, i) => {
    const b = body[i]!
    return { k, frame: Math.floor(k / r), level: b.level, bodyShare: b.bodyShare, bodyLevel: b.bodyLevel, ...both.pairs[i]!, levelStep: pic.levelStep[i] ?? null, pop: pic.pop[i] ?? null, popBlock: pic.popBlock[i] ?? null }
  })
  const top = (m: { frame: number; step: number }): Most | null => (m.frame < 0 ? null : { k: m.frame, frame: Math.floor(m.frame / r), value: m.step })
  const n = both.inPlace
  const would: string[] = []
  const hold = (m: Most | null, max: number, text: string, note = ''): void => {
    if (m && m.value > max) would.push(text + ' steps by ' + shown(m.value, 2, max) + ' into frame ' + position(m.k, r) + note + ', limit ' + max)
  }
  const unreadNote = ' (a frame that shares too little ground with the one before to be read in place)'
  hold(top(n.level), P.levelStep, 'the level of the ground two frames both show')
  hold(top(n.colour), P.colourStep, 'the colour of the ground two frames both show')
  hold(top(n.unreadLevel), P.levelStep, 'the mean level of the body', unreadNote)
  hold(top(n.unreadColour), P.colourStep, 'the mean colour of the body', unreadNote)
  const inPlace: PlaceSeen = { share, level: top(n.level), colour: top(n.colour), least: n.least.frame < 0 ? null : { k: n.least.frame, share: n.least.share }, read: n.read, unread: n.unread, unreadLevel: top(n.unreadLevel), unreadColour: top(n.unreadColour), would }
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
  judge(sides.mean, lim(P.sideMean), 'mean side difference at T ' + shown(sides.mean, 3, P.sideMean))
  judge(sides.p99, lim(P.sideP99), '99th percentile of the side difference at T ' + sides.p99)
  judge(found.bodyLevelStep?.value, lim(P.levelStep), 'the mean level of the body steps by ' + shown(found.bodyLevelStep?.value ?? 0, 2, P.levelStep) + ' into frame ' + position(found.bodyLevelStep?.k ?? 0, r))
  judge(found.bodyColourStep?.value, lim(P.colourStep), 'the mean colour of the body steps by ' + shown(found.bodyColourStep?.value ?? 0, 2, P.colourStep) + ' into frame ' + position(found.bodyColourStep?.k ?? 0, r))
  judge(found.pop?.value, lim(P.maxPop), 'pop score ' + shown(found.pop?.value ?? 0, 2, P.maxPop) + ' from frame ' + position(found.pop?.k ?? 0, r) + ' to the next')
  return { segment: seg.id, frameT, window: [h.placeFirstFrame, h.placeLastFrame], frames: [first, last], rate: r, sides: { mean: sides.mean, p50: sides.p50, p99: sides.p99, p999: sides.p999, max: sides.max, shareOver16: sides.shareOver16, panel: stem + '-place-sides.png' }, rows, ...found, inPlace, why }
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
  lines.push('Both sides at T, the globe side without the place picture (display values 0 to 255): mean difference ' + shown(p.sides.mean, 3, P.sideMean) + ' (' + lim(P.sideMean, H.sideMean) + '), 99th percentile ' + p.sides.p99 + ' (' + lim(P.sideP99, H.sideP99) + '), 99.9th ' + p.sides.p999 + ', max ' + p.sides.max + ', ' + (p.sides.shareOver16 * 100).toFixed(2) + ' percent of pixels over 16. Picture: ' + p.sides.panel.slice(ROOT.length + 1))
  if (p.bodyLevelStep) lines.push('Largest step between two frames on the body: mean level ' + shown(p.bodyLevelStep.value, 2, P.levelStep) + ' into frame ' + position(p.bodyLevelStep.k, p.rate) + ' (' + lim(P.levelStep, H.levelStep) + ')' + (p.bodyColourStep ? ', mean colour ' + shown(p.bodyColourStep.value, 2, P.colourStep) + ' into frame ' + position(p.bodyColourStep.k, p.rate) + ' (' + lim(P.colourStep, H.colourStep) + ')' : '') + '.')
  if (p.inPlace) {
    const n = p.inPlace
    const at = (m: Most | null, max: number): string => (m ? shown(m.value, 2, max) + ' into frame ' + position(m.k, p.rate) : 'none')
    lines.push('The same step in place, on the ground both frames show (tools/img/handover.py, op inPlace; shown, not judged): level ' + at(n.level, P.levelStep) + ', colour ' + at(n.colour, P.colourStep) + '. ' + n.read + ' of ' + (n.read + n.unread) + ' pairs are read in place: the frame before shows at least ' + n.share + ' of the frame\'s body' + (n.least ? ' (least ' + n.least.share.toFixed(3) + ' into frame ' + position(n.least.k, p.rate) + ')' : '') + (n.unread ? '; the largest steps of the ' + n.unread + ' that are not, on the mean of the body: level ' + at(n.unreadLevel, P.levelStep) + ', colour ' + at(n.unreadColour, P.colourStep) : '') + '. Held to the same limits it would ' + (n.would.length ? 'be red: ' + n.would.join('; ') : 'pass') + '.')
  }
  if (p.levelStep) lines.push('Largest level step of the whole frame against the middle of its two neighbours: ' + p.levelStep.value.toFixed(2) + ' at frame ' + position(p.levelStep.k, p.rate) + '.')
  if (p.pop) lines.push('Largest pop score: ' + shown(p.pop.value, 2, P.maxPop) + ' from frame ' + position(p.pop.k, p.rate) + ' to the next (' + (P.maxPop === null ? 'no limit yet, not judged' : 'limit ' + P.maxPop) + ').')
  lines.push('', '| frame | level | body share | body level | body level step | body colour step | seen in the frame before | level step in place | colour step in place | level step | pop | pop of one block |', '|---|---|---|---|---|---|---|---|---|---|---|---|')
  for (const row of p.rows) lines.push('| ' + [position(row.k, p.rate) + (row.k === p.frameT * p.rate ? ' T' : ''), row.level.toFixed(2), row.bodyShare.toFixed(3), row.bodyLevel.toFixed(2), cell(row.bodyLevelStep, 2), cell(row.bodyColourStep, 2), cell(row.seen, 3), cell(row.placeLevelStep, 2), cell(row.placeColourStep, 2), cell(row.levelStep, 2), cell(row.pop, 2), cell(row.popBlock, 2)].join(' | ') + ' |')
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
  const wanted = parityFrames(cfg.segments, stop!, P.at, kinds, !a.kind)
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
  const panel = join(dir, base + '-parity.png')
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
    why.push('parity: ' + what + ' ' + shown(top[key], 3, top[key] < 0 ? -max : max) + ' at frame ' + top.frame + ' (' + top.segment + '), limit ' + max + (bad.length > 1 ? ' (' + bad.length + ' frames over it)' : ''))
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
  const top = (key: 'mean' | 'coarse' | 'blockLevel' | 'level', max: number | null): string => {
    if (rows.length === 0) return 'none'
    const r = rows.reduce((x, y) => (Math.abs(y[key]) > Math.abs(x[key]) ? y : x))
    return shown(r[key], 3, max === null ? null : r[key] < 0 ? -max : max) + ' at frame ' + r.frame + ' (' + r.segment + ')'
  }
  const [bigId, filmId] = p.formats!
  const lines = [
    'The same film frame at ' + bigId + ' scaled down by ' + p.factor + ' against ' + filmId + ', tier ' + p.tier + ', display values 0 to 255. Seconds a rendered frame on ' + machineId() + ': ' + Object.entries(p.secondsAFrame ?? {}).map(([k, v]) => k + ' ' + (v === null ? 'already rendered' : v)).join(', ') + '.', '',
    'Largest mean difference: ' + top('mean', P.maxMean) + ', ' + lim(P.maxMean) + '.',
    'Largest mean difference at one ' + P.coarse + 'th of the size (what is left when the fine grain is averaged away): ' + top('coarse', P.maxCoarse) + ', ' + lim(P.maxCoarse) + '.',
    'Largest level difference of one block (a grid of ' + S.pictures.grid.join(' by ') + '): ' + top('blockLevel', P.maxBlockLevel) + ', ' + lim(P.maxBlockLevel) + '.',
    'Largest level difference of the whole frame: ' + top('level', P.maxLevel) + ', ' + lim(P.maxLevel) + '.',
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

const cell = (v: number | null | undefined, digits = 3, limit: number | null = null): string => (v === null || v === undefined ? '' : shown(v, digits, limit))

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
  if (dots) {
    const surface = ringGround ? 'the plane of the rings between their two radii, where the globe does not hide it' : 'the sphere of the body'
    lines.push('', 'The speed is a mean over ' + dots.of + ' ground points on a ring round the place (' + (ring === 'ground' ? 'a circle on the ground, as wide as ' + L.ringPx + ' px at its distance' : 'a circle of ' + L.ringPx + ' px in the picture') + '). A point counts only where it lies on what the camera sees of the place\'s own surface: ' + surface + '. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than ' + dots.min + ' of the ' + dots.of + ' is shown and not judged. Fewest points in a frame of the move: ' + p.runs.map((r) => (r.rate === 1 ? 'whole frames ' : 'rate ' + r.rate + ' ') + (r.curves.find((c) => c.points)?.points?.fewest ?? '')).join(', ') + '.')
    lines.push('', 'Rows of the speed shown and not judged: ' + p.runs.map((r) => {
      const d = r.curves.find((c) => c.points)!.points!
      return (r.rate === 1 ? 'whole frames ' : 'rate ' + r.rate + ' ') + d.notMeasured + (d.notMeasured ? ' (frames ' + position(d.first!, r.rate) + ' to ' + position(d.last!, r.rate) + ')' : '')
    }).join(', ') + '.')
  }
  lines.push('', 'Limits: step ' + L.maxStep + ' of the mean over one film frame, from ' + L.seamFrames + ' film frames before the segment to ' + L.seamFrames + ' after it; fall before the largest value and climb after it ' + L.maxRebound + ' of the mean, inside the segment. Steps further into the neighbours are shown and not judged.', '')
  if (p.eye) {
    const e = p.eye
    const at = (x: { value: number; k: number } | null, limit: number | null = null): string => (x ? shown(x.value, 2, limit) + ' at frame ' + position(x.k, e.rate) : 'not measured')
    const min: number | null = L.minEye ?? null
    lines.push('The eye against the near ground at the seam with the surface view (film frame ' + e.seam + ', ' + SEAM_REACH + ' film frames to each side, read at rate ' + e.rate + '): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (' + (e.own === null ? 'not measured' : Number(e.own.toPrecision(3)) + ' of its height a film frame, the mean of its ' + (kind === 'dive' ? 'first ' : 'last ') + SEAM_OWN + ' film frames') + '). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest ' + at(e.lowest, min) + ', ' + (min === null ? 'no limit yet, not judged' : 'limit ' + min) + '; inside the ' + kind + ' itself ' + at(e.inMove) + '. Largest step from one capture frame to the next ' + at(e.step) + ', shown. The part along the surface view\'s own direction of motion: ' + (e.lowest ? shown(e.along[e.lowest.k - e.k0]!, 2) + ' at the lowest, ' : '') + 'lowest ' + at(e.back) + ', shown; under 0 the eye goes back.', '')
  }
  if (p.leave) {
    const v = p.leave
    const at = (x: { value: number; k: number } | null): string => (x ? x.value.toFixed(2) + ' at frame ' + position(x.k, v.rate) : 'not measured')
    lines.push('Rest between the rise and the ' + (v.after ?? 'travel') + ' (the seam into ' + v.into + ' at film frame ' + v.seam + ', ' + v.reach + ' film frames to each side, read at rate ' + v.rate + '): a rise and the ' + (v.after ?? 'travel') + ' after it are one flight, through the seam the speed of the picture falls once and rises once and never comes to rest. The fastest point of the body\'s edge, px a film frame (the way of its centre and the growth of its radius, from the path alone): lowest ' + at(v.lowest) + ', against ' + at(v.first) + ' and ' + at(v.last) + ' at the ends of the window. The lowest is ' + (v.over === null ? 'not measured' : shown(v.over, 3, MIN_LEAVE)) + ' of the slower end, ' + (MIN_LEAVE === null ? 'no limit yet, shown and not judged' : 'limit ' + MIN_LEAVE) + '. Near 0 the picture comes to rest between the rise and the ' + (v.after ?? 'travel') + '.', '')
} else if (p.noLeave !== undefined) {
    lines.push('Rest after the rise: not read. ' + (p.noLeave === null ? 'No move follows the rise.' : 'The rise ends in ' + p.noLeave + ', where the picture is to come to rest; the rule of one flight holds between a rise and a move.'), '')
  }
  if (p.faults.length) lines.push(...p.faults.map((f) => '- RED ' + f.text), '')
  else lines.push('No number of the path is over its limit.', '')
  const fine = p.runs.length > 1
  const head = ['frame', 'segment and side', 'height', 'rate', 'step', ...(fine ? ['step at rate ' + p.runs[1]!.rate] : []), 'turn', 'step', ...(fine ? ['step at rate ' + p.runs[1]!.rate] : []), 'speed', 'step', ...(fine ? ['step at rate ' + p.runs[1]!.rate] : []), ...(dots ? ['points'] : [])]
  lines.push('Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over ' + L.maxStep + '.', '')
  lines.push('| ' + head.join(' | ') + ' |', '|' + head.map(() => '---').join('|') + '|')
  const star = (v: number | null): string => (v === null ? '' : shown(v, 3, L.maxStep) + (v > L.maxStep ? ' *' : ''))
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

function landingText(p: LandingKind | null): string[] {
  if (!p) return ['### landing', '', 'No travel arrives at this stop.', '']
  const L = S.path
  const lines = ['### landing (' + p.segment + ' into ' + p.into + ', frames ' + p.firstFrame + ' to ' + (p.holdFrame - 1) + ', first frame of the hold ' + p.holdFrame + ', window ' + p.window[0] + ' to ' + p.window[1] + ')', '']
  lines.push('The last part of the travel that arrives at ' + stop + ', from ' + LANDING_FROM + ' of its length, in the camera of ' + stop + ', in px of the master a film frame: sky is the turn of the camera (what the stars do), centre the way of the centre of the body, edge the growth of its radius, centre and edge the fastest point of its edge. Every value is over the mean of the curve in the landing. loss is what a curve loses over one film frame.', '')
  if (!p.judged) lines.push('This travel has no landing law yet: shown, not judged.', '')
  lines.push('| run | curve | mean | at the start | hold\'s own | step at the seam | at | step between capture frames at the seam | at | largest loss | at | growth of the loss in the last ' + LANDING_LATE + ' | at | climb after a fall | at | under the hold\'s own | at |')
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
  for (const r of p.runs) {
    for (const c of r.curves) {
      const pos = (x: { k: number } | null): string => (x && x.k >= 0 ? position(x.k, r.rate) : '')
      lines.push('| ' + [r.rate === 1 ? 'whole frames' : 'rate ' + r.rate, c.name, Number(c.mean.toPrecision(4)) + ' px' + (c.floored ? ' (under the floor ' + c.floor + ' px, its values are over the floor; shown, not judged)' : ''), cell(c.first), cell(c.hold), cell(c.seam?.value, 3, L.maxStep), pos(c.seam), cell(c.halfSeam?.value, 3, L.maxStep), pos(c.halfSeam), cell(c.peakLoss?.value), pos(c.peakLoss), cell(c.growth?.value, 3, L.maxStep), pos(c.growth), cell(c.hump.value, 3, L.maxRebound), pos(c.hump), cell(c.dip?.value, 3, L.maxStep), pos(c.dip)].join(' | ') + ' |')
    }
  }
  lines.push('', 'Limits: step ' + L.maxStep + ' of the mean over one film frame from ' + L.seamFrames + ' film frames before the hold to ' + L.seamFrames + ' into it; the largest loss not in the last ' + LANDING_LATE + ' film frames before the hold, and no loss there larger than the one a film frame before by more than ' + L.maxStep + '; no loss under a third of the one a film frame before while the speed is over the hold\'s own; climb after a fall ' + L.maxRebound + '; not under the hold\'s own by more than ' + L.maxStep + '. A loss and a speed over the hold\'s own count from ' + LANDING_FLOOR + ' of the mean. The two rules of the loss (where the largest lies and how it grows, and letting go) are shown and not judged: the path alone does not part a good arrival from a bad one by them. A curve whose mean is under ' + L.floors.speedPx + ' px a film frame stands still in the picture: it is given over that floor, shown and not judged. The ' + S.reachFrames + ' film frames before the landing and the frames further into the hold are shown and not judged.', '')
  if (p.faults.length) lines.push(...p.faults.map((f) => '- RED ' + f.text), '')
  else lines.push(p.judged ? 'No judged number of the landing is over its limit.' : 'Nothing of this landing is judged.', '')
  if (p.shown.length) lines.push(...p.shown.map((t) => '- shown, not judged: ' + t), '')
  const fine = p.runs.length > 1
  const names = LANDING.map(([, name]) => name)
  const head = ['frame', 'segment', ...names.flatMap((n) => [n, 'step', ...(fine ? ['step at rate ' + p.runs[1]!.rate] : [])])]
  lines.push('Every film frame of the window. The curves are over their mean in the landing; step is the change from the film frame before; a star marks a step over ' + L.maxStep + '.', '')
  lines.push('| ' + head.join(' | ') + ' |', '|' + head.map(() => '---').join('|') + '|')
  const star = (v: number | null): string => (v === null ? '' : shown(v, 3, L.maxStep) + (v > L.maxStep ? ' *' : ''))
  p.rows.forEach((row, i) => {
    const cells = [String(row.frame) + (row.frame === p.firstFrame ? ' landing' : row.frame === p.holdFrame ? ' hold' : ''), p.sides[i]!]
    for (const name of names) {
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
    const dirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=no', '--', 'src', 'tools', 'config', 'package.json', 'index.html'], { cwd: ROOT, encoding: 'utf8' }).trim()
    return head + (dirty ? ' with changes that are not committed' : '')
  } catch {
    return 'unknown'
  }
}

async function measureParts(parts: Record<string, PartResult>): Promise<void> {
  if (only.includes('path')) parts.path = pathPart()
  if (only.includes('pictures') && joined) parts.pictures = joinPart(joined, kinds[0]!)
  else if (only.includes('pictures')) {
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
}

async function main(): Promise<void> {
  const all = whole ? joinWhole(a.join === 'true' ? [dir] : a.join!.split(',')) : null
  const parts: Record<string, PartResult> = all ? all.parts : {}
  if (!all) await measureParts(parts)
  if (piece) hashes ??= computeHashes(ROOT)
  const why = Object.values(parts).flatMap((p) => p.why)
  const pass = why.length === 0
  const made = all ? { commit: all.commit, engineHash: all.engineHash, stopHash: all.stopHash, machine: all.machine } : joined ? { commit: joined.commit, engineHash: joined.engineHash, stopHash: joined.stopHash, machine: joined.machine } : { commit: commit(), engineHash: hashes?.engine ?? null, stopHash: hashes?.stops[stop!] ?? null, machine: machineId() }
  const took = Number(((Date.now() - started) / 1000).toFixed(1))
  const out = { stop, ...made, rate, calibrate, kinds, only, limits: S, pass, why, parts, ...(slice ? { slice: { ...slice, rendered, seconds: Number(renderSeconds.toFixed(2)) } } : {}), ...(joining ? {} : { seconds: took }), ...(joined ? { joined: joined.files.map((x) => ({ file: x.name, machine: x.machine, ...x.slice })) } : {}), ...(all ? { joined: all.files } : {}) }
  json(join(dir, stem + '.json'), out)
  const lines = ['# smooth: ' + stop, '', 'Commit ' + out.commit + '. Capture rate ' + rate + '. Parts: ' + only.join(', ') + '.' + (calibrate ? ' A calibration run: every number is written, the exit code is 0.' : ''), '']
  if (piece) lines.push('A part file of the report of ' + stop + ' (--part ' + piece.join(',') + (a.kind ? ' --kind ' + a.kind : '') + '), written in ' + took + ' s on ' + made.machine + '. The verdict here is of this part alone: the report of the stop is the join of all its parts (--join).', '')
  if (all) {
    const who = (x: Record<string, unknown>): string => String(x.file) + ' (' + String(x.machine) + ')'
    const by = (holds: string, kind?: string): string => all.files.filter((x) => x.holds === holds && (kind === undefined || x.kind === kind)).map(who).join(', ')
    lines.push('Joined from the files of ' + new Set(all.files.map((x) => x.machine)).size + ' machine(s), nothing is rendered, measured or counted here. The path: ' + by('path') + '. The pictures: ' + all.slices.map(([kind]) => 'the ' + kind + ' ' + by('pictures', kind)).join('; ') + '. The place: ' + by('place') + '. The parity: ' + by('parity') + '. The counts: ' + by('counts') + '.', '')
    for (const t of all.same) console.log('smooth ' + stop + ': ' + t)
  }
  lines.push(pass ? 'VERDICT: green. No number is over its limit.' : 'VERDICT: red. ' + why.length + ' number' + (why.length === 1 ? '' : 's') + ' over the limit or not measured.', '')
  for (const [name, p] of Object.entries(parts)) {
    lines.push('## ' + name, '')
    if (!p.measured) {
      lines.push(...p.why.map((w) => '- RED ' + w), '')
      continue
    }
    if (p.note) lines.push('Note: ' + p.note + '.', '')
    if (name === 'path') for (const kind of kinds) lines.push(...pathText(kind, ((p as ReturnType<typeof pathPart>).kinds[kind] ?? null) as PathKind | null))
    if (name === 'path' && landing) lines.push(...landingText(((p as ReturnType<typeof pathPart>).kinds.landing ?? null) as LandingKind | null))
    if (name === 'pictures') {
      const pp = p as Awaited<ReturnType<typeof picturesPart>>
      lines.push('Tier ' + pp.tier + ', rate ' + pp.rate + (pp.secondsAFrame === null ? ', every frame was already rendered' : ', ' + pp.secondsAFrame + ' s a rendered frame on ' + made.machine) + '.', '')
      for (const [kind, j] of all ? all.slices : []) lines.push('The ' + kind + ' is joined from ' + j.files.length + ' part' + (j.files.length === 1 ? '' : 's') + ': ' + j.files.map((x) => x.name + ' (capture frames ' + x.slice.own[0] + ' to ' + x.slice.own[1] + ', ' + x.machine + ')').join(', ') + '.', '')
      if (joined) lines.push('Joined from ' + joined.files.length + ' part' + (joined.files.length === 1 ? '' : 's') + ', nothing is rendered here: ' + joined.files.map((x) => x.name + ' (capture frames ' + x.slice.own[0] + ' to ' + x.slice.own[1] + ', ' + x.machine + ')').join(', ') + '.', '')
      for (const kind of kinds) lines.push(...picturesText(kind, pp.kinds[kind] ?? null))
    }
    if (name === 'counts') lines.push(...countsText(p as Awaited<ReturnType<typeof countsPart>>))
    if (name === 'parity') lines.push(...parityText(p as Awaited<ReturnType<typeof parityPart>>))
    if (name === 'place') for (const kind of kinds) lines.push(...placeText(kind, (p as Awaited<ReturnType<typeof placePart>>).kinds[kind] ?? null))
  }
  writeFileSync(join(dir, stem + '.md'), lines.join('\n'))
  if (piece) console.log('smooth ' + stop + ': the part file of ' + piece.join(', ') + (a.kind ? ' of the ' + a.kind : '') + ' in ' + took + ' s')
  console.log('smooth ' + stop + ': ' + (pass ? 'green' : 'red, ' + why.length + ' over the limit or not measured') + '. ' + join('out/work/smooth', stem + '.md'))
  for (const w of why.slice(0, 12)) console.log('  ' + w)
  if (why.length > 12) console.log('  and ' + (why.length - 12) + ' more, see the report')
  process.exit(joined && !parts.pictures!.measured ? 2 : pass || calibrate ? 0 : 1)
}

void main()
