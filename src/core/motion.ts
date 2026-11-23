import * as THREE from 'three'
import { config, type Segment } from '../config'
import { forcedWord, handoverOf, type Handover } from '../director/handover'
import { handoverChanges, segmentAtFrame } from '../director/timeline'
import { sampleCount, shutterMid, shutterOffset } from './sampler'
import type { SetState, Shot, ViewKind } from './types'

export interface ShotSource { shotAt(frame: number, time: number, side?: ViewKind): Shot }

const RAD = Math.PI / 180
const CENTRE = new THREE.Vector3()

export type MotionProbe = (column: number, row: number, px: number) => void

export function rawMotion(open: Shot, mid: Shot, close: Shot, probe?: MotionProbe): number {
  const m = config.motion
  const master = config.formats[config.formatKeys.master]!
  const half = master.height / 2
  const aspect = master.width / master.height
  const tan = Math.tan((mid.camera.vfov * RAD) / 2)
  const [cols, rows] = m.probeGrid
  const seen = (shot: Shot, state: SetState, local: THREE.Vector3): THREE.Vector2 | null => {
    const turned = state.turn ? local.clone().applyQuaternion(state.turn) : local.clone()
    const v = turned.applyQuaternion(state.rotation).add(state.origin).sub(shot.camera.position).applyQuaternion(shot.camera.quaternion.clone().invert())
    if (v.z > -1e-9) return null
    const k = half / Math.tan((shot.camera.vfov * RAD) / 2) / -v.z
    return new THREE.Vector2(v.x * k, v.y * k)
  }
  let most = 0
  mid.sets.forEach((s, i) => {
    const a = open.sets[i]
    const b = close.sets[i]
    if (s.weight <= 0 || !a || !b || a.id !== s.id || b.id !== s.id) return
    const track = (local: THREE.Vector3, x = -1, y = -1): void => {
      const pa = seen(open, a, local)
      const pb = seen(close, b, local)
      if (!pa || !pb) return
      const px = pa.distanceTo(pb)
      most = Math.max(most, px)
      if (probe && x >= 0) probe(x, y, px)
    }
    const inverse = s.rotation.clone().invert()
    const unturn = s.turn ? s.turn.clone().invert() : null
    const eye = mid.camera.position.clone().sub(s.origin).applyQuaternion(inverse)
    const orbit = s.view === 'orbit'
    const reach = config.stops.find((x) => x.id === s.id)?.rings ? m.bodyReach : 0
    if (orbit) {
      const distance = eye.length()
      const radius = distance > 1 ? (half / tan) * Math.tan(Math.asin(1 / distance)) : Infinity
      if (radius < m.minBodyPx) return
      const c = seen(mid, s, CENTRE)
      // The centre stands for a disc the grid may miss. Where the body turns under a camera that follows the place, a disc larger than the frame
      // is met by the grid, and its centre far outside the frame would only report the stretch of the flat picture plane out there.
      const slack = s.turn ? Math.min(radius, half) : radius
      if (c && Math.abs(c.x) <= half * aspect + slack && Math.abs(c.y) <= half + slack) track(CENTRE)
    }
    const height = eye.y + (s.ground ?? 0)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const ray = new THREE.Vector3(((x / (cols - 1)) * 2 - 1) * tan * aspect, ((y / (rows - 1)) * 2 - 1) * tan, -1).normalize().applyQuaternion(mid.camera.quaternion).applyQuaternion(inverse)
        if (!orbit) {
          if (height > 0 && ray.y < -1e-9) track(eye.clone().addScaledVector(ray, height / -ray.y), x, y)
          continue
        }
        const along = -eye.dot(ray)
        const disc = along * along - eye.lengthSq() + 1
        const t = disc > 0 ? along - Math.sqrt(disc) : eye.length()
        if (t <= 0) continue
        const p = eye.clone().addScaledVector(ray, t)
        if (disc > 0 || p.length() <= reach) track(unturn ? p.applyQuaternion(unturn) : p, x, y)
      }
    }
  })
  return most
}

export function seenShare(mid: Shot): number {
  return Math.max(1 - (mid.cover.hidden ?? mid.cover.amount * (mid.cover.hides ?? 1)), 0)
}

export function shutterMotion(open: Shot, mid: Shot, close: Shot): number {
  return rawMotion(open, mid, close) * seenShare(mid)
}

export function softness(raw: number): number {
  const m = config.motion
  const x = Math.min(Math.max((raw - m.softFromPx) / (m.softToPx - m.softFromPx), 0), 1)
  return x * x * (3 - 2 * x)
}

export function samplesNeeded(base: number, cap: number, motion: number): number {
  const need = Math.ceil(motion / config.motion.maxStepPx - 1e-9)
  return need <= base ? base : Math.min(need, Math.max(cap, base))
}

// shutter is the share of the film's shutter the frame keeps (E6): 1 everywhere but in the capped frames of a dive or a rise that hands over.
// raw stays the motion across the full shutter; seen is the motion across the shutter that is open, and the sample count follows it.
export interface FramePlan { samples: number; raw: number; seen: number; soft: number; split: boolean; shutter: number }

const SIDES: ViewKind[] = ['orbit', 'terrain']
// How often the share of the shutter is corrected by the measure across the shortened shutter (shutterScale). After two the motion left is the
// allowed one to a hundred thousandth of a pixel at every frame of the film.
const REFINE = 2

// The motion of one frame between two times inside it (in frames from its start), as framePlan measures it: on the frame's own side, and inside
// the dissolve window on both sides, the larger one. The sides are named there, so this never asks which side a time takes.
function motionOver(source: ShotSource, frame: number, split: boolean, from: number, to: number): number {
  const at = (offset: number, side?: ViewKind): Shot => source.shotAt(frame, (frame + offset) / config.fps, side)
  if (split) return Math.max(...SIDES.map((side) => rawMotion(at(from, side), at(shutterMid(), side), at(to, side))))
  return rawMotion(at(from), at(shutterMid()), at(to))
}

// E6, the capped shutter (decision d129). One steady move of a factor of a hundred in ninety frames changes scale by 6 to 14 percent a frame, so
// across the film's shutter the picture of a dive or a rise moves by 25 to 150 px for most of the way, and a still of it is a smear. In a dive or
// a rise of a stop that hands over, the shutter of a frame is therefore cut down around its middle until the motion left is handover.maxBlurPx:
// scale = min(1, allowed / raw), with raw the motion across the full shutter. The middle of the shutter stays, so the time of the frame, the sky
// (drawn at the middle) and the draft tier (one sample at the middle) stay where they were.
// The seams: the segments before and after run with the full shutter. Where the segment's own first or last frame moves more than maxBlurPx, the
// blur a frame may keep rises to that motion over handover.blurEaseFrames with a smooth ramp, so that frame keeps its full shutter and no frame
// steps. Where it moves less, the cap lets go by itself and there is no ramp.
// The floor (handover.minShutter, 0 for off): a capped frame never runs with less of the film's shutter than this share, scale = max(allowed / raw,
// floor). A shutter that is far shorter than the step to the next frame shows a fast edge as separate sharp copies; with the floor the fastest
// frames keep that share of their motion as blur instead, most at the rim of the picture and next to none at the place the camera goes to, and
// the sample count follows the blur that results. A frame that is not capped keeps its full shutter, so the seams stay as they are.
interface Cap { stamp: string; raw: Map<number, number>; scale: Map<number, number> }
const caps = new WeakMap<ShotSource, Cap>()

function capOf(source: ShotSource): Cap {
  const stamp = handoverChanges() + '|' + config.raw.handover.maxBlurPx + '|' + config.raw.handover.blurEaseFrames + '|' + config.raw.handover.minShutter + '|' + forcedWord()
  let cap = caps.get(source)
  if (!cap || cap.stamp !== stamp) {
    cap = { stamp, raw: new Map(), scale: new Map() }
    caps.set(source, cap)
  }
  return cap
}

function fullMotion(cap: Cap, source: ShotSource, frame: number, h: Handover): number {
  let raw = cap.raw.get(frame)
  if (raw === undefined) {
    raw = motionOver(source, frame, frame >= h.firstFrame && frame <= h.lastFrame, 0, config.shutterFraction)
    cap.raw.set(frame, raw)
  }
  return raw
}

function handing(frame: number): { segment: Segment; h: Handover } | null {
  const segment = segmentAtFrame(frame)
  const h = segment.kind === 'dive' || segment.kind === 'rise' ? handoverOf(segment.stop, segment.kind) : null
  return h ? { segment, h } : null
}

// The motion in px the cap lets a frame keep across its shutter: handover.maxBlurPx, and near a seam that moves faster, the ramp up to that seam's
// motion. Infinity outside the dives and rises of the stops that hand over: nothing is capped there. A frame that runs at the floor
// (handover.minShutter) keeps more than this: its plan has the motion left in seen.
export function blurAllowed(source: ShotSource, frame: number): number {
  const own = handing(frame)
  if (!own) return Infinity
  const max = config.raw.handover.maxBlurPx
  const ease = config.raw.handover.blurEaseFrames
  const cap = capOf(source)
  let allowed = max
  for (const edge of [own.segment.firstFrame, own.segment.endFrame - 1]) {
    const away = Math.abs(frame - edge)
    if (away >= ease) continue
    const seam = fullMotion(cap, source, edge, own.h)
    if (!(seam > max)) continue
    const x = 1 - away / ease
    const w = x * x * (3 - 2 * x)
    allowed = Math.max(allowed, max * (1 - w) + seam * w)
  }
  return allowed
}

export function shutterScale(source: ShotSource, frame: number): number {
  const own = handing(frame)
  if (!own) return 1
  const cap = capOf(source)
  let scale = cap.scale.get(frame)
  if (scale === undefined) {
    const raw = fullMotion(cap, source, frame, own.h)
    const allowed = blurAllowed(source, frame)
    scale = 1
    if (raw > allowed) {
      scale = allowed / raw
      // Where a move starts or ends inside the shutter the motion is not even across it, and allowed / raw alone leaves a little more or less than
      // the allowed blur (3.6 percent more at the worst frame of the film). So the share is corrected by what is measured across the shortened
      // shutter itself.
      const split = frame >= own.h.firstFrame && frame <= own.h.lastFrame
      for (let i = 0; i < REFINE; i++) {
        const left = motionOver(source, frame, split, shutterOffset(0, scale), shutterOffset(1, scale))
        if (!(left > 0)) break
        scale = Math.min(scale * (allowed / left), 1)
      }
      const floor = config.raw.handover.minShutter
      if (scale < floor) scale = floor
    }
    cap.scale.set(frame, scale)
  }
  return scale
}

export function framePlan(source: ShotSource, frame: number, tier: string): FramePlan {
  const segment = segmentAtFrame(frame)
  const base = sampleCount(tier, segment.kind)
  const cap = config.tiers[tier]!.maxSamplesPerFrame
  const at = (offset: number, side?: ViewKind): Shot => source.shotAt(frame, (frame + offset) / config.fps, side)
  const h = segment.kind === 'dive' || segment.kind === 'rise' ? handoverOf(segment.stop, segment.kind) : null
  if (h) {
    const split = frame >= h.firstFrame && frame <= h.lastFrame
    const raw = motionOver(source, frame, split, 0, config.shutterFraction)
    const shutter = shutterScale(source, frame)
    const left = shutter === 1 ? raw : motionOver(source, frame, split, shutterOffset(0, shutter), shutterOffset(1, shutter))
    const seen = split ? left : left * seenShare(at(shutterMid()))
    return { samples: cap <= base ? base : samplesNeeded(base, cap, seen), raw, seen, soft: 0, split, shutter }
  }
  const mid = at(shutterMid())
  const raw = rawMotion(at(0), mid, at(config.shutterFraction))
  const seen = raw * seenShare(mid)
  return { samples: cap <= base ? base : samplesNeeded(base, cap, seen), raw, seen, soft: softness(raw), split: false, shutter: 1 }
}

export function frameSamples(source: ShotSource, frame: number, tier: string): number {
  return framePlan(source, frame, tier).samples
}
