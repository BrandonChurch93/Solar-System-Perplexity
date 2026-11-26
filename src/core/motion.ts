import * as THREE from 'three'
import { config, type Segment } from '../config'
import { dissolveWeight, drawnWord, forcedWord, handoverOf, sideForced, type Handover } from '../director/handover'
import { handoverChanges, segmentAtFrame } from '../director/timeline'
import { clockStamp, shutterSpan, spanMid, wholeFrame } from './clock'
import { sampleCount, shutterOffset, shutterWeights, splitSides } from './sampler'
import type { NearBody, SetState, Shot, ViewKind } from './types'

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
    // The ground of a surface view: the globe as the plan's twin places it in the set, where the state names it (SetState.ball), else the
    // plane y = -ground. Either way the points are fixed in the set.
    const ball = orbit ? undefined : s.ball
    const out = ball ? eye.clone().sub(ball.centre) : null
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const ray = new THREE.Vector3(((x / (cols - 1)) * 2 - 1) * tan * aspect, ((y / (rows - 1)) * 2 - 1) * tan, -1).normalize().applyQuaternion(mid.camera.quaternion).applyQuaternion(inverse)
        if (!orbit) {
          if (ball && out) {
            const along = -out.dot(ray)
            const disc = along * along - out.lengthSq() + ball.radius * ball.radius
            const t = disc > 0 ? along - Math.sqrt(disc) : 0
            if (t > 0) track(eye.clone().addScaledVector(ray, t), x, y)
          } else if (height > 0 && ray.y < -1e-9) track(eye.clone().addScaledVector(ray, height / -ray.y), x, y)
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

// A point given in the frame of a set (without the turn of its surface) as a shot sees it, in px of the master from the middle of the frame.
function seenPoint(shot: Shot, state: SetState, local: THREE.Vector3, half: number): THREE.Vector2 | null {
  const v = local.clone().applyQuaternion(state.rotation).add(state.origin).sub(shot.camera.position).applyQuaternion(shot.camera.quaternion.clone().invert())
  if (v.z > -1e-9) return null
  const k = half / Math.tan((shot.camera.vfov * RAD) / 2) / -v.z
  return new THREE.Vector2(v.x * k, v.y * k)
}

// Whether the sphere that holds a near body reaches into the frame of a shot: the angle between the direction to its centre and the nearest
// direction of the frame is no larger than the angle the sphere fills.
function bodyInFrame(shot: Shot, state: SetState, body: NearBody, aspect: number): boolean {
  const v = body.centre.clone().applyQuaternion(state.rotation).add(state.origin).sub(shot.camera.position).applyQuaternion(shot.camera.quaternion.clone().invert())
  const distance = v.length()
  if (distance <= body.radius) return true
  const ty = Math.tan((shot.camera.vfov * RAD) / 2)
  const tx = ty * aspect
  let x: number
  let y: number
  if (v.z < -1e-9) {
    x = Math.min(Math.max(v.x / -v.z, -tx), tx)
    y = Math.min(Math.max(v.y / -v.z, -ty), ty)
  } else {
    const m = Math.max(Math.abs(v.x) / tx, Math.abs(v.y) / ty)
    if (!(m > 0)) return false
    x = v.x / m
    y = v.y / m
  }
  const nearest = new THREE.Vector3(x, y, -1).normalize()
  return Math.acos(Math.min(Math.max(nearest.dot(v) / distance, -1), 1)) <= Math.asin(body.radius / distance)
}

// The motion in px of the master, between the opening and the closing of a shutter, of the fastest near body a stop names (SetState.near)
// that is in the frame at the opening, the middle or the closing: the longest way of its centre and of four points of its rim, the radius to
// the right, to the left, up and down as the camera of the middle sees it. A moon that passes close to the camera crosses the picture ten
// times as fast as the planet behind it, which is all rawMotion measures, so the count of such a frame was too small and the moon was drawn
// as separate copies. A point that leaves the half space in front of the camera inside the shutter runs out of the picture: it counts as
// the diagonal of the master. 0 where no body is named or none of them is in the frame, and then nothing changes.
export function nearMotion(open: Shot, mid: Shot, close: Shot): number {
  const master = config.formats[config.formatKeys.master]!
  const half = master.height / 2
  const aspect = master.width / master.height
  let most = 0
  mid.sets.forEach((s, i) => {
    const a = open.sets[i]
    const b = close.sets[i]
    if (!s.near || s.weight <= 0 || !a || !b || a.id !== s.id || b.id !== s.id) return
    s.near.forEach((body, j) => {
      const first = a.near?.[j]
      const last = b.near?.[j]
      if (!first || !last) return
      if (!bodyInFrame(open, a, first, aspect) && !bodyInFrame(mid, s, body, aspect) && !bodyInFrame(close, b, last, aspect)) return
      const axes = s.rotation.clone().invert().multiply(mid.camera.quaternion)
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(axes).multiplyScalar(body.radius)
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(axes).multiplyScalar(body.radius)
      for (const offset of [CENTRE, right, right.clone().negate(), up, up.clone().negate()]) {
        const pa = seenPoint(open, a, first.centre.clone().add(offset), half)
        const pb = seenPoint(close, b, last.centre.clone().add(offset), half)
        if (pa && pb) most = Math.max(most, pa.distanceTo(pb))
        else if (pa || pb) most = Math.max(most, Math.hypot(master.width, master.height))
      }
    })
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

// Whether a shot is a surface view that is measured on its globe as drawn (SetState.ball: a stop that handover.drawnMeasure names).
// Such a view takes no soft (framePlan), in every kind of segment, as a dive and a rise take none where they hand over. softness is
// the law of a frame that moves fast as a whole: it reads its lookups wider, by the fastest point the measure finds. The fastest point
// of a surface view is the ground under the lens while its horizon stands nearly still, and one number for the whole sample would
// soften the still part for the sake of the fast one. So the close side of a named stop has one law from the first frame of its dive
// to the last of its rise, and no border inside the stop steps by it. The true px of a surface view may pass motion.softFromPx where
// the plane read less (Uranus: 11.0 px where the plane read 9.6 at most), and its frames keep the lookups they had. A surface view
// that is not named keeps the law it had. The rule reads what the frame draws and never the name of its segment.
export function surfaceDrawn(shot: Shot): boolean {
  return shot.sets.some((s) => s.weight > 0 && s.view !== 'orbit' && s.ball !== undefined)
}

export function samplesNeeded(base: number, cap: number, motion: number): number {
  const need = Math.ceil(motion / config.motion.maxStepPx - 1e-9)
  return need <= base ? base : Math.min(need, Math.max(cap, base))
}

// The step of a frame's plan: how far the picture moves from one sample of the frame to the next, in px of the master. own is the picture's
// own motion in view across the shutter that is open, over the samples; near is the same of a near body the stop names to the motion measure
// (0 without one). The count follows the motion at motion.maxStepPx a sample up to the most the tier may take (samplesNeeded); where the
// count ends there, the step is larger. A step of more than a pixel draws a fine edge as a row of separate copies, so every frame of every
// dive and rise is judged on own against handover.limits.sampleStepPx at every tier that takes more than one sample (tools/handover.ts,
// tests/step.test.ts). near is reported beside it and not judged: a moon that crosses the picture within one shutter can be held to a pixel
// by no count, and what the frame shows of it is a streak in which one sample is the share 1 / samples.
// A frame of one sample has no step: it is one sharp picture (the draft tier).
export function sampleStep(plan: { samples: number; seen: number; near?: number }): { own: number; near: number } {
  if (!(plan.samples > 1)) return { own: 0, near: 0 }
  return { own: plan.seen / plan.samples, near: (plan.near ?? 0) / plan.samples }
}

// shutter is the share of the film's shutter the frame keeps (E6): 1 everywhere but in the capped frames of a dive or a rise that hands over.
// raw stays the motion across the full shutter; seen is the motion across the shutter that is open, and the sample count follows it.
// near is there only in a frame with a named near body in it: that body's motion across the shutter that is open (nearMotion). The count
// follows the larger of seen and near, up to the tier's maxSamplesPerFrame. The cap of the shutter does not read it.
// sharp is there only in a dive or a rise of a stop that hands over and that handover.sharpCover names with a cover above 0: the count that
// sharpens the lookups of a sample in place of the count of the whole frame (sharpCount).
// cover is there with sharp: the cover itself, for the count by the way of each point (frameWay).
// ends is there only where the shutter of the frame opens and closes over a share of its time above 0 (samplesFor), and is that share:
// in a dive or a rise of a stop that hands over and that handover.shutterEnds names with a number, and in any frame of a stop it names
// with a law, the flight that leaves the stop included, where the frame moves by more than the law's fromPx (endsLawOf).
// sides is there only in a frame that has ends by a law, draws both views (split) and takes more than one sample: the view of each
// sample, by the light the samples bring and not by their count (splitSides). The surface view has the share of the frame's light that
// the handover gives it (dissolveWeight); without the key a sample takes its view by its time (sideAt), as it did. A view that the
// harness forces leaves the key out: then every sample is the forced view's.
export interface FramePlan { samples: number; raw: number; seen: number; soft: number; split: boolean; shutter: number; near?: number; sharp?: number; cover?: number; ends?: number; sides?: ViewKind[] }

// The samples that see one pixel of the path. In a frame that stands still all samples of the frame lie over one another, each at its own
// place inside the pixel. In a frame that moves they are spread along the path: a point of the picture that moves by seen px across the open
// shutter is seen in one pixel of its path by samples / seen of them, not by all.
export function pathSamples(plan: { samples: number; seen: number }): number {
  return plan.samples / Math.max(plan.seen, 1)
}

// The count that sharpens the lookups of a sample. The lookups are read finer than the pixel where the samples that lie over one another add
// up to the pixel: the engine reads them at 1 / sqrt(count) of a pixel a side, down to a half (setSamples of src/diagnostics/diag.ts). With
// the count of the whole frame that is true only of a frame that stands still. In a frame that moves, a light smaller than the footprint is
// met by a sample only where the footprint lies on it: of the samples that see one pixel of the path, the share footprint squared. Where
// that is one sample or less to a pixel, the streak of the light is a row of dots (seen at Earth's 2156 at the review tier: 24 samples over
// 14.3 px, 1.7 to a pixel, read at half a pixel: 0.4 of a sample meets the light in each pixel of its way). So the count is the samples
// that see one pixel of the path, over the cover: the number of samples whose footprints must lie on every point of the way
// (handover.sharpCover, by stop). A frame that hardly moves keeps the count of the frame over the cover, which stays at the half while the tier
// takes four times the cover. The count never passes the count of the frame, whatever the cover: no frame is read finer than it was, and
// at one sample the lookups are the pixel's own, as they were.
export function sharpCount(plan: { samples: number; seen: number }, cover: number): number {
  return Math.min(pathSamples(plan) / cover, plan.samples)
}

// The cover of a stop: handover.sharpCover names the stops that asked for it. A stop it does not name has none, and its frames are read by
// the count of the whole frame, as they were.
export function sharpCoverOf(stop: string): number {
  return (config.raw.handover.sharpCover as Record<string, number>)[stop] ?? 0
}

// The ends of the shutter of a stop: handover.shutterEnds names the stops whose shutter opens and closes over a share of its time
// (samplesFor of core/sampler.ts). A stop it does not name has a shutter that is open at once and shut at once, as it was.
// Named with a number, the stop has that share in every frame of its dive and of its rise and in no other frame: this function.
// Named with {share, fromPx, toPx}, it has a law of the frame's own motion (endsLawOf), and this function answers 0.
export function shutterEndsOf(stop: string): number {
  const own = (config.raw.handover.shutterEnds as Record<string, number | EndsLaw>)[stop]
  return typeof own === 'number' ? own : 0
}

// The ends of the shutter as a law of the frame's own motion: handover.shutterEnds names a stop with {share, fromPx, toPx}. Every frame
// of the stop, its hold, its dive, its surface view, its rise and the flight that leaves it alike, opens and closes its shutter over
// share times a smooth step of the motion the frame shows across its open shutter (FramePlan.seen, in px of the master), from fromPx,
// where the step leaves 0, to toPx, where it is whole (endsBy). The motion is the only thing the share reads: not the time, not the
// segment, not the tier. So two frames that move alike have the same ends on whichever side of a change of view they lie, and a border
// of the stop steps only where the motion itself does. Under fromPx the shutter is open at once and the frame is the frame it was, to
// the bit; a slow border never sees the law. The flight is the stop's it leaves (its segment names that stop): a rise does not come to
// rest before its flight, the two are one move, and the last frame of the rise and the first of the flight show nearly the same px
// (the test holds the step of the ends between the two to the step of their px, at every stop). How fast that border is belongs to
// the travel: where it is slow the flight speeds up past fromPx a few frames later, and those frames are the stop's as well. A flight
// slows down into the hold of the next stop, so the law is at 0 long before the next stop's first frame, whether that stop is named
// or not (held for the film's own laws by tests/shutter-ends.test.ts).
export interface EndsLaw { share: number; fromPx: number; toPx: number }

export function endsLawOf(stop: string): EndsLaw | null {
  const own = (config.raw.handover.shutterEnds as Record<string, number | EndsLaw>)[stop]
  return typeof own === 'object' && own !== null ? own : null
}

export function endsBy(law: EndsLaw, px: number): number {
  const x = Math.min(Math.max((px - law.fromPx) / (law.toPx - law.fromPx), 0), 1)
  return law.share * x * x * (3 - 2 * x)
}

const SIDES: ViewKind[] = ['orbit', 'terrain']
// How often the share of the shutter is corrected by the measure across the shortened shutter (shutterScale). After two the motion left is the
// allowed one to a hundred thousandth of a pixel at every frame of the film.
const REFINE = 2

// The motion of one frame between two times inside it (in frames from its start), as framePlan measures it: on the frame's own side, and inside
// the dissolve window on both sides, the larger one. The sides are named there, so this never asks which side a time takes.
function motionOver(source: ShotSource, frame: number, split: boolean, from: number, to: number): number {
  const at = (offset: number, side?: ViewKind): Shot => source.shotAt(frame, (frame + offset) / config.fps, side)
  if (split) return Math.max(...SIDES.map((side) => rawMotion(at(from, side), at(spanMid(), side), at(to, side))))
  return rawMotion(at(from), at(spanMid()), at(to))
}

// The motion of the named near bodies of one frame between two times inside it, measured like the frame's own motion: on the frame's side, and
// inside the dissolve window on both. The shots of the two ends are only asked for where a set of the middle names a body.
function nearOver(source: ShotSource, frame: number, split: boolean, from: number, to: number): number {
  const at = (offset: number, side?: ViewKind): Shot => source.shotAt(frame, (frame + offset) / config.fps, side)
  const one = (side?: ViewKind): number => {
    const mid = at(spanMid(), side)
    return mid.sets.some((s) => s.near) ? nearMotion(at(from, side), mid, at(to, side)) : 0
  }
  return split ? Math.max(...SIDES.map((side) => one(side))) : one()
}

// E6, the capped shutter (decision d129). One steady move of a factor of a hundred in ninety frames changes scale by 6 to 14 percent a frame, so
// across the film's shutter the picture of a dive or a rise moves by 25 to 150 px for most of the way, and a still of it is a smear. In a dive or
// a rise of a stop that hands over, the shutter of a frame is therefore cut down around its middle until the motion left is handover.maxBlurPx:
// scale = min(1, allowed / raw), with raw the motion across the full shutter. The middle of the shutter stays, so the time of the frame, the sky
// (drawn at the middle) and the draft tier (one sample at the middle) stay where they were.
// The seams: the segments before and after run with the full shutter. Where the segment's own first or last frame moves more than maxBlurPx, the
// blur a frame may keep rises to that motion over handover.blurEaseFrames with a smooth ramp, so that frame keeps its full shutter and no frame
// steps. Where it moves less, the cap lets go by itself and there is no ramp.
// The cap is off with handover.maxBlurPx 0: then no frame is capped, the share is 1 everywhere and the floor and the ease have nothing to do.
// The floor (handover.minShutter, 0 for off): a capped frame never runs with less of the film's shutter than this share, scale = max(allowed / raw,
// floor). A shutter that is far shorter than the step to the next frame shows a fast edge as separate sharp copies; with the floor the fastest
// frames keep that share of their motion as blur instead, most at the rim of the picture and next to none at the place the camera goes to, and
// the sample count follows the blur that results. A frame that is not capped keeps its full shutter, so the seams stay as they are.
interface Cap { stamp: string; raw: Map<number, number>; scale: Map<number, number> }
const caps = new WeakMap<ShotSource, Cap>()
const CAP_KEPT = 1 << 15

function capOf(source: ShotSource): Cap {
  const stamp = handoverChanges() + '|' + config.raw.handover.maxBlurPx + '|' + config.raw.handover.blurEaseFrames + '|' + config.raw.handover.minShutter + '|' + forcedWord() + '|' + drawnWord() + '|' + clockStamp()
  let cap = caps.get(source)
  if (!cap || cap.stamp !== stamp) {
    cap = { stamp, raw: new Map(), scale: new Map() }
    caps.set(source, cap)
  }
  return cap
}

function inWindow(frame: number, h: Handover): boolean {
  const whole = wholeFrame(frame)
  return whole >= h.firstFrame && whole <= h.lastFrame
}

function fullMotion(cap: Cap, source: ShotSource, frame: number, h: Handover): number {
  let raw = cap.raw.get(frame)
  if (raw === undefined) {
    raw = motionOver(source, frame, inWindow(frame, h), 0, shutterSpan())
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
  // 0 switches the cap off: nothing is capped anywhere, every frame keeps the film's full shutter and its plan is the one of before E6.
  if (!(max > 0)) return Infinity
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
    if (cap.scale.size >= CAP_KEPT) {
      cap.scale.clear()
      cap.raw.clear()
    }
    const raw = fullMotion(cap, source, frame, own.h)
    const allowed = blurAllowed(source, frame)
    scale = 1
    if (raw > allowed) {
      scale = allowed / raw
      // Where a move starts or ends inside the shutter the motion is not even across it, and allowed / raw alone leaves a little more or less than
      // the allowed blur (3.6 percent more at the worst frame of the film). So the share is corrected by what is measured across the shortened
      // shutter itself.
      const split = inWindow(frame, own.h)
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

// Where the floor of the shutter holds over the cap of the blur: the px by which the motion of a frame across the least share of the shutter
// (handover.minShutter) is more than the cap lets the frame keep (blurAllowed). 0 where both hold: outside the dives and rises of the stops
// that hand over, without a cap, without a floor, and in every frame slow enough for both. The floor holds there by rule (one law at every
// rate and in every segment), so this is a number of the report (tools/handover.ts) and no fault: such a frame is fast by its path, and
// that is the stop's to cure in its plan.
export function capConflict(source: ShotSource, frame: number): number {
  const own = handing(frame)
  if (!own) return 0
  const floor = config.raw.handover.minShutter
  const allowed = blurAllowed(source, frame)
  if (!(floor > 0) || !Number.isFinite(allowed)) return 0
  const full = fullMotion(capOf(source), source, frame, own.h)
  if (!(full > allowed)) return 0
  const left = floor >= 1 ? full : motionOver(source, frame, inWindow(frame, own.h), shutterOffset(0, floor), shutterOffset(1, floor))
  return Math.max(left - allowed, 0)
}

export function framePlan(source: ShotSource, frame: number, tier: string): FramePlan {
  const segment = segmentAtFrame(frame)
  const base = sampleCount(tier, segment.kind)
  const cap = config.tiers[tier]!.maxSamplesPerFrame
  const at = (offset: number, side?: ViewKind): Shot => source.shotAt(frame, (frame + offset) / config.fps, side)
  const h = segment.kind === 'dive' || segment.kind === 'rise' ? handoverOf(segment.stop, segment.kind) : null
  if (h) {
    const split = inWindow(frame, h)
    const raw = motionOver(source, frame, split, 0, shutterSpan())
    const shutter = shutterScale(source, frame)
    const left = shutter === 1 ? raw : motionOver(source, frame, split, shutterOffset(0, shutter), shutterOffset(1, shutter))
    const seen = split ? left : left * seenShare(at(spanMid()))
    const body = nearOver(source, frame, split, shutterOffset(0, shutter), shutterOffset(1, shutter))
    const near = split || !(body > 0) ? body : body * seenShare(at(spanMid()))
    const samples = cap <= base ? base : samplesNeeded(base, cap, Math.max(seen, near))
    const cover = sharpCoverOf(segment.stop)
    const law = endsLawOf(segment.stop)
    const ends = law ? endsBy(law, seen) : shutterEndsOf(segment.stop)
    const sides = law && split && ends > 0 && samples > 1 && !sideForced() ? splitSides(shutterWeights(samples, ends), dissolveWeight(h, segment.kind as 'dive' | 'rise', wholeFrame(frame))) : null
    return { samples, raw, seen, soft: 0, split, shutter, ...(near > 0 ? { near } : {}), ...(cover > 0 ? { sharp: sharpCount({ samples, seen }, cover), cover } : {}), ...(ends > 0 ? { ends } : {}), ...(sides ? { sides: sides.map((close): ViewKind => (close ? 'terrain' : 'orbit')) } : {}) }
  }
  const mid = at(spanMid())
  const raw = rawMotion(at(0), mid, at(shutterSpan()))
  const seen = raw * seenShare(mid)
  const near = nearOver(source, frame, false, 0, shutterSpan()) * seenShare(mid)
  // The flight has the law of the stop it leaves: its segment names that stop, and its first frame moves as the rise's last one does.
  const law = endsLawOf(segment.stop)
  const ends = law ? endsBy(law, seen) : 0
  const soft = surfaceDrawn(mid) ? 0 : softness(raw)
  return { samples: cap <= base ? base : samplesNeeded(base, cap, Math.max(seen, near)), raw, seen, soft, split: false, shutter: 1, ...(near > 0 ? { near } : {}), ...(ends > 0 ? { ends } : {}) }
}

// Where the lens of one end of the shutter sees a point of a sample: the matrix that takes the point from the view space of the sample
// (the lens at the origin, looking down -z, as the engine draws it) to (x, y, unused, 1) times its distance in front of the lens of the end,
// with x and y in px of the master from the middle of the frame, times share. The point is carried as a point of the surface of the set:
// fixed in the set's frame, and turned with it where the state names a turn (the globe side of a dive or a rise). It is the measure of
// rawMotion, point for point, put into one matrix in doubles; what is left to the shader is one product and one division.
export function wayMatrix(shot: Shot, state: SetState, end: Shot, at: SetState, share = 1): THREE.Matrix4 {
  const half = config.formats[config.formatKeys.master]!.height / 2
  const k = (share * half) / Math.tan((end.camera.vfov * RAD) / 2)
  const from = state.turn ? state.rotation.clone().multiply(state.turn) : state.rotation.clone()
  const to = at.turn ? at.rotation.clone().multiply(at.turn) : at.rotation.clone()
  const carried = to.multiply(from.invert())
  const there = state.origin.clone().sub(shot.camera.position)
  const here = at.origin.clone().sub(end.camera.position)
  const m = new THREE.Matrix4().makeRotationFromQuaternion(shot.camera.quaternion)
  m.premultiply(new THREE.Matrix4().makeTranslation(-there.x, -there.y, -there.z))
  m.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(carried))
  m.premultiply(new THREE.Matrix4().makeTranslation(here.x, here.y, here.z))
  m.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(end.camera.quaternion.clone().invert()))
  return m.premultiply(new THREE.Matrix4().set(k, 0, 0, 0, 0, k, 0, 0, 0, 0, 1, 0, 0, 0, -1, 0))
}

// The way of the points of a frame across its open shutter, sample by sample, for the lookups that are read by each point's own way
// (gradAt of src/diagnostics/diag.ts). null where the plan has no cover (FramePlan.cover: a dive or a rise of a stop that
// handover.sharpCover names) and at one sample: then nothing is fed and gradAt returns uGrad. Else a function that gives a sample's shot
// its two matrices (wayMatrix), from the shots at the opening and at the closing of the frame's shutter on the sample's own side, as
// framePlan measures the frame: on the frame's side, and inside the handover window on each side by itself. share is the share of the
// picture that is seen (seenShare of the middle), which the plan's motion carries too. A shot that is not one set of the same side at
// both ends gets none.
export function frameWay(source: ShotSource, frame: number, plan: FramePlan, mid: Shot): ((shot: Shot) => { cover: number; open: number[]; close: number[] } | null) | null {
  const cover = plan.cover ?? 0
  if (!(cover > 0) || !(plan.samples > 1)) return null
  const share = plan.split ? 1 : seenShare(mid)
  const ends = new Map<ViewKind, { open: Shot; close: Shot }>()
  const at = (offset: number, side?: ViewKind): Shot => source.shotAt(frame, (frame + offset) / config.fps, side)
  return (shot) => {
    const state = shot.sets[0]
    if (!state || shot.sets.length !== 1) return null
    let end = ends.get(state.view)
    if (!end) {
      const side = plan.split ? state.view : undefined
      end = { open: at(shutterOffset(0, plan.shutter), side), close: at(shutterOffset(1, plan.shutter), side) }
      ends.set(state.view, end)
    }
    const a = end.open.sets[0]
    const b = end.close.sets[0]
    if (!a || !b || end.open.sets.length !== 1 || end.close.sets.length !== 1 || a.id !== state.id || b.id !== state.id || a.view !== state.view || b.view !== state.view) return null
    return { cover, open: wayMatrix(shot, state, end.open, a, share).elements.slice(), close: wayMatrix(shot, state, end.close, b, share).elements.slice() }
  }
}

export function frameSamples(source: ShotSource, frame: number, tier: string): number {
  return framePlan(source, frame, tier).samples
}
