import { config, type CoverWindow, type Segment } from '../config'
import { shutterPosition } from '../core/sampler'
import type { ViewKind } from '../core/types'
import { coverFrames, coverWindow, handoverChanges, handoverParams } from './timeline'

export interface HandoverTimes { at: number; dissolveFrames: number; placeFrames: number }
export interface PlaceOptions { scale?: number; margin?: number; matte?: 'pair' | 'alpha'; valid?: [number, number, number, number]; lens?: number; seen?: number; maxEnlarge?: number; enlargeSoft?: number; limbReachDeg?: number; limbHoldDeg?: [number, number]; edgeIn?: [number, number, number, number]; toneIn?: [number, number, number, number]; limbSky?: boolean; limbLap?: number }
// The sidestep of a path: the far pose is moved round the place by so many radii to the right and up in its own frame. On a path of the
// stop's own it is complete by the share `by` of the way to T; on the engine's one move by the share `by` of the time of the segment,
// counted from the far end (the start of a dive, the end of a rise).
export interface Sidestep { right: number; up: number; by: number }
// fromDive (the rise only): the close view of the rise leaves from the eye of the dive. From the start of the rise the stop's own close path is led
// over to the pose the dive handed over at, by the share of the way to T raised to this power (1 or more: it starts from rest), so at T the camera
// of the rise stands where the twin of the dive stood. Plates of the globe that are true from that one eye are then true in both handovers.
export interface PathOptions { rise?: number; fall?: number; turnRise?: number; turnFall?: number; level?: boolean; levelBy?: number; sidestep?: Sidestep; fromDive?: number }
// pace: the flanks of the engine's one move (plan E) for this side, where the stop wants other than handover.pace: rise is the share of the
// segment over which the rate comes up from the far end, fall the share over which it goes down to the surface view, corner the share of a
// flank over which its slope comes in and goes out. turn: flanks of the same kind for the eye's direction from the place and the camera's
// uprightness, where they are to run on a bell of their own. liftPower: the height runs with the lift of that direction to this power
// (StopPlan.eyeLaw). A stop that sets none of the three takes the film's for that side (handover.dive, handover.rise of the config).
// corners (of pace and of turn, the stop's alone): two corners for a flank in place of the one, [foot, top]: the share of the flank over
// which its slope comes in at the end of the move and the share over which it goes out at the plateau. A long foot at the far end lets
// the rate die away slowly where the picture runs fast for the same rate; a flank that is not named keeps corner at both ends.
// pullBack (of the rise alone, the stop's alone, for a rise that a travel follows): the rise ends on its pose without coming to rest,
// flying `speed` radii a second above the drift along the line of the exit, picked up over its last `over` seconds
// (StopPlan.pullBack). It belongs to the far end, so it holds on the one move and on a stop's own path alike. With `from`, seconds
// before the end of the rise and more than `over`, the rise is untouched, to the bit, until then; without it the far end stands back
// from the start of the rise.
export interface HandoverSide extends Partial<HandoverTimes> { skyFrames?: number; live?: boolean; picture?: boolean; place?: PlaceOptions; path?: PathOptions; pace?: { rise?: number; fall?: number; corner?: number; corners?: { rise?: [number, number]; fall?: [number, number] } }; turn?: { rise?: number; fall?: number; corner?: number; corners?: { rise?: [number, number]; fall?: [number, number] } }; liftPower?: number; skyFloor?: boolean; pullBack?: { speed: number; over: number; from?: number } }
export interface HandoverParams { dive?: HandoverSide; rise?: HandoverSide }
// The shares of the two sky layers on the globe side of a dive or rise that hands over: low for the sky of the close view, high for the sky
// of the globe view. Both from 0 to 1. A stop may give its own through StopPlan.skyShare; without a high the globe view's sky keeps the
// engine's rule (what low leaves in a dive, nothing in a rise).
export interface SkyShares { low: number; high?: number }
// limbSky: the horizon of the place picture runs on the clock of the sky and not on the picture's own. The sky of the picture (the haze
// over the limb, with the frame's stars behind it) takes the share of the close view's sky (skyFrames, or the stop's own skyShare), never
// less than the weight of the picture, and the sides of the picture do not count for it. So the haze over the limb, the line of the
// globe's limb under it and the stars behind it change as one thing over the frames in which the sky itself changes, and the limb of the
// globe does not come in under a picture that is half there. The ground of the picture keeps the picture's own weight.
// It needs the picture's horizon held on the camera's limb (limbReachDeg above 0).
// limbLap goes with it: the share of the radius by which the mesh of the globe lies under its sphere at the limb (over it when negative).
// The sky of the picture reaches that far in under the limb of the sphere, so that the globe's own sky does not show as a line between
// the picture's sky and the ground. It is read only with limbSky.
export interface Handover { time: number; firstFrame: number; lastFrame: number; placeFirstFrame: number; placeLastFrame: number; skyFrames: number; live: boolean; picture: boolean; place: PlaceOptions; skyFloor: boolean; limbSky: boolean }

const CELLS = 8
const STEP = 0.618
const EDGE = 1e-6

const known = new Map<string, Handover | null>()
let knownAt = -1
let forced: ViewKind | null = null
let above = false
let horizon: boolean | null = null
let oneMove = false
let skyOff = false
let shutterOf: ((frame: number) => number) | null = null
let eyeOf: EyeHeight | null = null

function smooth(t: number): number {
  const x = Math.min(Math.max(t, 0), 1)
  return x * x * (3 - 2 * x)
}

export function handoverOf(stop: string, kind: 'dive' | 'rise'): Handover | null {
  if (knownAt !== handoverChanges()) {
    known.clear()
    knownAt = handoverChanges()
  }
  const key = stop + '|' + kind
  const hit = known.get(key)
  if (hit !== undefined) return hit
  const own = handoverParams(stop)
  const seg = config.segments.find((s) => s.stop === stop && s.kind === kind)
  let out: Handover | null = null
  if (own && seg) {
    const t = { ...config.raw.handover[kind], ...own[kind] }
    const centre = Math.floor((seg.start + t.at * (seg.end - seg.start)) * config.fps + 1e-9)
    const firstFrame = centre - Math.floor((t.dissolveFrames - 1) / 2)
    const lastFrame = firstFrame + t.dissolveFrames - 1
    const placeFirstFrame = kind === 'dive' ? firstFrame - t.placeFrames : firstFrame
    const placeLastFrame = kind === 'dive' ? lastFrame : lastFrame + t.placeFrames
    if (placeFirstFrame < seg.firstFrame || placeLastFrame > seg.endFrame - 1) throw new Error('the handover of ' + seg.id + ' does not fit inside its segment')
    const lim = own[kind]?.place
    if (lim && ((lim.seen !== undefined && !(lim.seen > 0 && lim.seen <= 1)) || (lim.maxEnlarge !== undefined && !(lim.maxEnlarge > 1)) || (lim.enlargeSoft !== undefined && !(lim.enlargeSoft > 0 && lim.enlargeSoft < 1)))) throw new Error('the place of ' + seg.id + ' needs seen above 0 and at most 1, maxEnlarge above 1 and enlargeSoft between 0 and 1')
    if (lim && lim.limbReachDeg !== undefined && !(lim.limbReachDeg >= 0 && lim.limbReachDeg < 90)) throw new Error('the place of ' + seg.id + ' needs limbReachDeg of 0 or more and under 90')
    if (lim && lim.limbHoldDeg !== undefined && !(Array.isArray(lim.limbHoldDeg) && lim.limbHoldDeg.length === 2 && lim.limbHoldDeg[0] >= 0 && lim.limbHoldDeg[1] > lim.limbHoldDeg[0] && lim.limbHoldDeg[1] < 90)) throw new Error('the place of ' + seg.id + ' needs limbHoldDeg as two angles, the first 0 or more, the second larger and under 90')
    if (own.dive?.path?.fromDive !== undefined) throw new Error('fromDive belongs to the rise of ' + stop + ', not to its dive')
    const lead = own.rise?.path?.fromDive
    if (lead !== undefined && (!(lead >= 1) || !Number.isFinite(lead) || !config.segments.some((s) => s.stop === stop && s.kind === 'dive'))) throw new Error('the rise of ' + stop + ' needs fromDive of 1 or more and a dive to leave from')
    if (lim && lim.edgeIn !== undefined && !(Array.isArray(lim.edgeIn) && lim.edgeIn.length === 4 && lim.edgeIn.every((x) => x >= 0 && x <= 1))) throw new Error('the place of ' + seg.id + ' needs edgeIn as four shares from 0 to 1: left, right, bottom, top')
    if (lim && lim.toneIn !== undefined && !(Array.isArray(lim.toneIn) && lim.toneIn.length === 4 && lim.toneIn.every((x) => x >= 0 && x <= 4))) throw new Error('the place of ' + seg.id + ' needs toneIn as four shares from 0 to 4: left, right, bottom, top')
    if (lim && lim.limbSky !== undefined && typeof lim.limbSky !== 'boolean') throw new Error('the place of ' + seg.id + ' needs limbSky as true or false')
    if (lim && lim.limbLap !== undefined && !(lim.limbLap > -0.01 && lim.limbLap < 0.01)) throw new Error('the place of ' + seg.id + ' needs limbLap between -0.01 and 0.01')
    const picture = own[kind]?.picture !== false
    const limbSky = picture && (lim?.limbSky ?? config.raw.handover.place.limbSky)
    if (limbSky && !((lim?.limbReachDeg ?? config.raw.handover.place.limbReachDeg) > 0)) throw new Error('the place of ' + seg.id + ' needs limbReachDeg above 0 for limbSky: the horizon of the picture has to lie on the limb of the camera')
    out = { time: ((firstFrame + lastFrame) / 2 + config.shutterFraction / 2) / config.fps, firstFrame, lastFrame, placeFirstFrame, placeLastFrame, skyFrames: t.skyFrames, live: own[kind]?.live === true, picture, place: own[kind]?.place ?? {}, skyFloor: own[kind]?.skyFloor === true, limbSky }
  }
  known.set(key, out)
  return out
}

export function dissolveWeight(h: Handover, kind: 'dive' | 'rise', frame: number): number {
  const w = smooth((frame - h.firstFrame + 1) / (h.lastFrame - h.firstFrame + 2))
  return kind === 'dive' ? w : 1 - w
}

export function shutterThreshold(s: number): number {
  const x = Math.min(Math.max(s, 0), 1) * CELLS + EDGE
  const cell = Math.floor(x)
  const v = x + cell * STEP
  return v - Math.floor(v)
}

export function sideAt(seg: Segment, time: number): ViewKind {
  if (seg.kind !== 'dive' && seg.kind !== 'rise') return seg.kind === 'terrain' ? 'terrain' : 'orbit'
  if (forced) return forced
  const dive = seg.kind === 'dive'
  const h = handoverOf(seg.stop, seg.kind)
  if (!h) {
    const centre = coverFrames(seg)!.centerFrame / config.fps
    return time >= centre === dive ? 'terrain' : 'orbit'
  }
  const x = time * config.fps
  const frame = Math.floor(x + 1e-9)
  const weight = dissolveWeight(h, seg.kind, frame)
  // Outside the dissolve the weight is 0 or 1 and the position inside the shutter decides nothing, so the share of the shutter the frame keeps is
  // asked for only inside it. That also keeps the measure of that share, which takes shots of other frames, from coming back here for itself.
  const s = shutterPosition(x - frame, weight > 0 && weight < 1 && shutterOf ? shutterOf(frame) : 1)
  return weight > shutterThreshold(s) ? 'terrain' : 'orbit'
}

// E6, the capped shutter: in a dive or a rise the shutter of a frame may keep only a share of the film's shutter around its middle, and a sample
// takes its side by its position inside the shutter that is open. The share is measured on shots (core/motion.ts, shutterScale), which this
// module can not take, so the film that asked for a shot last says how to ask. null: every frame keeps the full shutter.
export function shutterScales(of: ((frame: number) => number) | null): void {
  shutterOf = of
}

// PLAN F for the engine's own two weights: the share of the close view's sky on the globe side (skyWeight) and the weight of the place
// picture (placeWeight) read the height of the eye and never the clock. Each is a smooth step of the logarithm of the height of the globe
// camera over the unit sphere of the body, between the height the stop's path has where the span of frames begins (skyFrames, placeFrames:
// the far end) and the height it has at the frame of T. The frames only name the two heights. At the far end and at T the weight is what
// the clock gave, and between them it is the same at every pace and at every fraction of a frame: an eye that holds its height holds the
// weight, and one that comes back up takes it back. Where the segment ends inside the span (a sky span longer than its dive or rise) the
// far end is the end of the segment, and the weight there is the clock's.
// The eye is the globe camera of the stop's path whatever side the harness forces. It is a pose of the director, which this module can not
// ask for, so the film that was asked for a shot last says how (eyeHeights), as it does for the capped shutter. A stop that gives its own
// share (StopPlan.skyShare), has no span (skyFrames 0) or no picture is not asked for a height and is not touched by this.
// The two ends of a span are asked once for a film and kept with its eye: a film is made for the paths its plans have when it is made
// (its legs are read from them once, too), and three poses a weight made every shot of a dive or a rise cost twice what it did. A
// change of the forced one move or of a stop's handover asks them again. The height at the time of the sample is asked every time, or
// given by the caller that has it.
export type EyeHeight = (stop: string, kind: 'dive' | 'rise', time: number) => number

const spanEnds = new WeakMap<EyeHeight, Map<string, [number, number]>>()

export function eyeHeights(of: EyeHeight | null): void {
  eyeOf = of
}

// The height of the eye a weight would ask for at that time: for a caller that asks for both weights of one sample and gives it to both.
export function eyeHeightAt(seg: Segment, time: number): number | undefined {
  return eyeOf && (seg.kind === 'dive' || seg.kind === 'rise') ? eyeOf(seg.stop, seg.kind, time) : undefined
}

// The share of a span at the height the eye has at a time: base at the height of the far end, 1 at the height of T, on a straight line
// in the logarithm of the height between them and beyond the far end, down to 0.
function heightShare(seg: Segment, what: string, farTime: number, nearTime: number, base: number, time: number, eye?: number): number {
  if (!eyeOf) throw new Error('the ' + what + ' of ' + seg.id + ' goes by the height of the eye, and no film has said how to ask for it (eyeHeights)')
  const kind = seg.kind as 'dive' | 'rise'
  let ends = spanEnds.get(eyeOf)
  if (!ends) {
    ends = new Map()
    spanEnds.set(eyeOf, ends)
  }
  const key = seg.id + '|' + farTime + '|' + nearTime + '|' + (oneMove ? 1 : 0) + '|' + handoverChanges()
  let hit = ends.get(key)
  if (!hit) {
    const far = eyeOf(seg.stop, kind, farTime)
    const near = eyeOf(seg.stop, kind, nearTime)
    if (!(near > 0) || !(far > near)) throw new Error('the ' + what + ' of ' + seg.id + ' goes by the height of the eye, which must be over the body and lower at T than where the span begins (it is ' + near + ' radii at T and ' + far + ' where the span begins): the stop gives a share of its own, or no span')
    if (ends.size > 64) ends.clear()
    hit = [far, near]
    ends.set(key, hit)
  }
  const [far, near] = hit
  const height = time === farTime ? far : (eye ?? eyeOf(seg.stop, kind, time))
  if (!(height > 0)) return 1
  return smooth(base + ((1 - base) * (Math.log(far) - Math.log(height))) / (Math.log(far) - Math.log(near)))
}

// eye: the height of the eye at that time, for a caller that has it (eyeHeightAt); the weight asks for it otherwise.
export function placeWeight(seg: Segment, time: number, eye?: number): number {
  if (seg.kind !== 'dive' && seg.kind !== 'rise') return 0
  const h = handoverOf(seg.stop, seg.kind)
  if (!h || !h.picture) return 0
  const fps = config.fps
  const from = h.placeFirstFrame / fps
  const to = (h.placeLastFrame + 1) / fps
  // The side of T is the handover itself: the picture stands whole in the frame of T, and it is gone where the close view has the frame.
  if (seg.kind === 'dive') {
    const full = h.firstFrame / fps
    if (time >= to) return 0
    if (time >= full) return 1
    return full > from ? heightShare(seg, 'place picture', from, full, 0, time, eye) : 0
  }
  const full = (h.lastFrame + 1) / fps
  if (time < from) return 0
  if (time < full) return 1
  return to > full ? heightShare(seg, 'place picture', to, full, 0, time, eye) : 0
}

export function skyWeight(seg: Segment, time: number, eye?: number): number {
  if (seg.kind !== 'dive' && seg.kind !== 'rise') return 0
  const h = handoverOf(seg.stop, seg.kind)
  if (!h) return 0
  const fps = config.fps
  if (seg.kind === 'dive') {
    const full = h.firstFrame / fps
    if (time >= full) return 1
    if (!(h.skyFrames > 0)) return 0
    const span = h.skyFrames / fps
    const far = Math.max(full - span, seg.start)
    return far < full ? heightShare(seg, 'sky', far, full, (far - full) / span + 1, time, eye) : 0
  }
  const full = (h.lastFrame + 1) / fps
  if (time < full) return 1
  if (!(h.skyFrames > 0)) return 0
  const span = h.skyFrames / fps
  const far = Math.min(full + span, seg.end)
  return far > full ? heightShare(seg, 'sky', far, full, 1 - (far - full) / span, time, eye) : 0
}

// The weight of the horizon of the place picture (limbSky): the share of the close view's sky, never under the weight of the picture.
// undefined where the handover did not ask for it, and the horizon then goes with the picture.
export function horizonWeight(h: Handover, weight: number, skyShare: number): number | undefined {
  if (!h.picture || !(horizon ?? h.limbSky)) return undefined
  return Math.min(Math.max(weight, skyShare, 0), 1)
}

export function skyTurnWeight(seg: Segment, time: number): number {
  if (seg.kind !== 'dive' && seg.kind !== 'rise') return 0
  const h = handoverOf(seg.stop, seg.kind)
  if (!h) return 0
  const fps = config.fps
  const x = seg.kind === 'dive' ? (time - seg.start) / (h.firstFrame / fps - seg.start) : (seg.end - time) / (seg.end - (h.lastFrame + 1) / fps)
  const k = Math.min(Math.max(x, 0), 1)
  return k * k * k * (k * (k * 6 - 15) + 10)
}

export function forceSide(view: ViewKind | null): void {
  forced = view
}

// The view the harness has forced, null on the film's own path: who names the view of a sample by any other rule than sideAt asks here
// first and leaves the forced view alone.
export function sideForced(): ViewKind | null {
  return forced
}

// The top down view of the harness (E4, the check of S2): the globe camera of a dive or a rise is put straight above the place, at the height and
// with the field it has on the film's path. Like forceSide it is for the harness only and must not be reachable from the film path.
export function forceTop(on: boolean): void {
  above = on
}

// limbSky as the harness asks for it, for a look at a stop that has not set it (or at one that has, without it): true, false, or null for
// what the stop says. For the harness only, like forceSide.
export function forceLimbSky(on: boolean | null): void {
  horizon = on
}

export function topForced(): boolean {
  return above
}

// Plan E as the harness asks for it (--diag onemove): every stop that hands over flies the engine's one move in its dive and its rise, whatever
// handover.ownPath says. For the harness only, like forceSide: a builder looks at its stop on the one move before it leaves the list.
export function forceOneMove(on: boolean): void {
  oneMove = on
}

export function oneMoveForced(): boolean {
  return oneMove
}

// The globe side without the sky of the close view (--diag nosky): the share of that sky stays 0 up to T in a dive and from T on in a rise, for a
// stop that gives its own share too. What the fade of the sky adds to a picture or to a number of the judge is seen against it. For the
// harness only, like forceSide.
export function forceNoSky(on: boolean): void {
  skyOff = on
}

export function noSkyForced(): boolean {
  return skyOff
}

// What the harness has forced, as one word: whoever keeps a measure of the film's own path (the capped shutter) drops it when this changes.
export function forcedWord(): string {
  return (forced ?? 'film') + (above ? '|top' : '') + (oneMove ? '|onemove' : '')
}

// The measure reads what the stop draws: handover.drawnMeasure names the stops. In the surface view of a named stop the measure takes its
// points on the globe as the plan's twin places it in the set (SetState.ball, StopPlan.ballIn) in place of the plane y = -ground, and on
// the globe side of its dive and its rise the state carries the turn the stop draws its body by (StopPlan.drawn) in place of the plan's
// turn. Why: the plane lies across the set's own y axis at a height one number in a plan names, while the ground of a surface view is the
// globe, tilted against that axis and curved, so the surface side of a handover read up to twice and down to half the motion the globe side
// read for the same picture, and the count and the shutter of a frame stepped at the border between them. A stop that is not named is
// measured as before.
export function drawnMeasured(stop: string): boolean {
  return (config.raw.handover.drawnMeasure as string[]).includes(stop)
}

// The stops the measure is named for, as one word: whoever keeps a measure of the film's own path drops it when this changes.
export function drawnWord(): string {
  return (config.raw.handover.drawnMeasure as string[]).join(',')
}

export function handoverFrame(h: Handover): number {
  return Math.floor(h.time * config.fps + 1e-9)
}

export function judgedWindow(seg: Segment): CoverWindow | null {
  const h = seg.kind === 'dive' || seg.kind === 'rise' ? handoverOf(seg.stop, seg.kind) : null
  if (!h) return coverWindow(seg)
  const centerFrame = handoverFrame(h)
  const half = (config.raw.cover.seconds * config.fps) / 2
  return { firstFrame: Math.max(Math.floor(centerFrame - half + 1e-9), seg.firstFrame), lastFrame: Math.min(Math.floor(centerFrame + half + 1e-9), seg.endFrame - 1), centerFrame }
}
