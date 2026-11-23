import { config, type CoverWindow, type Segment } from '../config'
import { shutterPosition } from '../core/sampler'
import type { ViewKind } from '../core/types'
import { coverFrames, coverWindow, handoverChanges, handoverParams } from './timeline'

export interface HandoverTimes { at: number; dissolveFrames: number; placeFrames: number }
export interface PlaceOptions { scale?: number; margin?: number; matte?: 'pair' | 'alpha'; valid?: [number, number, number, number]; lens?: number; seen?: number; maxEnlarge?: number; enlargeSoft?: number; limbReachDeg?: number; limbHoldDeg?: [number, number]; edgeIn?: [number, number, number, number]; toneIn?: [number, number, number, number]; limbSky?: boolean }
export interface Sidestep { right: number; up: number; by: number }
// fromDive (the rise only): the close view of the rise leaves from the eye of the dive. From the start of the rise the stop's own close path is led
// over to the pose the dive handed over at, by the share of the way to T raised to this power (1 or more: it starts from rest), so at T the camera
// of the rise stands where the twin of the dive stood. Plates of the globe that are true from that one eye are then true in both handovers.
export interface PathOptions { rise?: number; fall?: number; turnRise?: number; turnFall?: number; level?: boolean; levelBy?: number; sidestep?: Sidestep; fromDive?: number }
export interface HandoverSide extends Partial<HandoverTimes> { skyFrames?: number; live?: boolean; picture?: boolean; place?: PlaceOptions; path?: PathOptions; skyFloor?: boolean }
export interface HandoverParams { dive?: HandoverSide; rise?: HandoverSide }
// The shares of the two sky layers on the globe side of a dive or rise that hands over: low for the sky of the close view, high for the sky
// of the globe view. Both from 0 to 1. A stop may give its own through StopPlan.skyShare; without a high the globe view's sky keeps the
// engine's rule (what low leaves in a dive, nothing in a rise).
export interface SkyShares { low: number; high?: number }
// limbSky: the horizon of the place picture runs on the clock of the sky and not on the picture's own. The sky of the picture and its band
// along the limb take the share of the close view's sky (skyFrames, or the stop's own skyShare), never less than the weight of the picture,
// and the sides of the picture do not count for them. So the haze over the limb, the limb under it and the stars behind it change as one
// thing over the frames in which the sky itself changes, and the limb of the globe does not show through a picture that is half there.
// It needs the picture's horizon held on the camera's limb (limbReachDeg above 0).
export interface Handover { time: number; firstFrame: number; lastFrame: number; placeFirstFrame: number; placeLastFrame: number; skyFrames: number; live: boolean; picture: boolean; place: PlaceOptions; skyFloor: boolean; limbSky: boolean }

const CELLS = 8
const STEP = 0.618
const EDGE = 1e-6

const known = new Map<string, Handover | null>()
let knownAt = -1
let forced: ViewKind | null = null
let above = false
let horizon: boolean | null = null
let shutterOf: ((frame: number) => number) | null = null

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

export function placeWeight(seg: Segment, time: number): number {
  if (seg.kind !== 'dive' && seg.kind !== 'rise') return 0
  const h = handoverOf(seg.stop, seg.kind)
  if (!h) return 0
  const fps = config.fps
  const from = h.placeFirstFrame / fps
  const to = (h.placeLastFrame + 1) / fps
  if (time < from || time >= to) return 0
  if (seg.kind === 'dive') return time >= h.firstFrame / fps ? 1 : smooth((time - from) / (h.firstFrame / fps - from))
  const full = (h.lastFrame + 1) / fps
  return time < full ? 1 : smooth((to - time) / (to - full))
}

export function skyWeight(seg: Segment, time: number): number {
  if (seg.kind !== 'dive' && seg.kind !== 'rise') return 0
  const h = handoverOf(seg.stop, seg.kind)
  if (!h) return 0
  const fps = config.fps
  if (seg.kind === 'dive') {
    const full = h.firstFrame / fps
    return time >= full ? 1 : h.skyFrames > 0 ? smooth((time - full) / (h.skyFrames / fps) + 1) : 0
  }
  const full = (h.lastFrame + 1) / fps
  return time < full ? 1 : h.skyFrames > 0 ? smooth(1 - (time - full) / (h.skyFrames / fps)) : 0
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

// What the harness has forced, as one word: whoever keeps a measure of the film's own path (the capped shutter) drops it when this changes.
export function forcedWord(): string {
  return (forced ?? 'film') + (above ? '|top' : '')
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
