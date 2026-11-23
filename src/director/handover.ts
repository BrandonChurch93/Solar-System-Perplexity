import { config, type CoverWindow, type Segment } from '../config'
import type { ViewKind } from '../core/types'
import { coverFrames, coverWindow, handoverChanges, handoverParams } from './timeline'

export interface HandoverTimes { at: number; dissolveFrames: number; placeFrames: number }
export interface HandoverParams { dive?: Partial<HandoverTimes>; rise?: Partial<HandoverTimes> }
export interface Handover { time: number; firstFrame: number; lastFrame: number; placeFirstFrame: number; placeLastFrame: number }

const CELLS = 8
const STEP = 0.618
const EDGE = 1e-6

const known = new Map<string, Handover | null>()
let knownAt = -1
let forced: ViewKind | null = null

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
    const t: HandoverTimes = { ...config.raw.handover[kind], ...own[kind] }
    const centre = Math.floor((seg.start + t.at * (seg.end - seg.start)) * config.fps + 1e-9)
    const firstFrame = centre - Math.floor((t.dissolveFrames - 1) / 2)
    const lastFrame = firstFrame + t.dissolveFrames - 1
    const placeFirstFrame = kind === 'dive' ? firstFrame - t.placeFrames : firstFrame
    const placeLastFrame = kind === 'dive' ? lastFrame : lastFrame + t.placeFrames
    if (placeFirstFrame < seg.firstFrame || placeLastFrame > seg.endFrame - 1) throw new Error('the handover of ' + seg.id + ' does not fit inside its segment')
    out = { time: ((firstFrame + lastFrame) / 2 + config.shutterFraction / 2) / config.fps, firstFrame, lastFrame, placeFirstFrame, placeLastFrame }
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
  const s = (x - frame) / config.shutterFraction
  return dissolveWeight(h, seg.kind, frame) > shutterThreshold(s) ? 'terrain' : 'orbit'
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

export function forceSide(view: ViewKind | null): void {
  forced = view
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
