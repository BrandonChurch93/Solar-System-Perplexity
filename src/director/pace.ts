import * as THREE from 'three'
import { config } from '../config'
import { shutterMid } from '../core/sampler'
import type { Pose, ViewKind } from '../core/types'
import type { FilmDirector } from './film'
import { sideAt } from './handover'
import type { StopPlan } from './moves'
import { segmentAtFrame } from './timeline'

// Plan E, the one pace. Two things live here.
// 1. The bell: the one rate curve of a dive and of a rise over the whole segment, and its integral, the share of the move that is done.
// 2. The plan check: the three curves the harness judges a move by (npm run smooth), measured the same way on the film's own camera, so a
//    test can hold a plan to the limits. The judge of a build is the harness, not this file; the limits are read from its block of the config.

// The flanks of the bell as shares of the segment: the rate rises over `rise` from the far end, holds, and falls over `fall` to the near end.
// `corner` is the share of a flank over which its slope comes in and goes out again, so the rate has no kink.
export interface Flanks { rise: number; fall: number; corner: number }

export function checkFlanks(f: Flanks, who: string): void {
  if (!(f.rise > 0) || !(f.fall > 0) || !(f.rise + f.fall <= 1 + 1e-12) || !(f.corner > 0 && f.corner <= 0.5)) throw new Error(who + ': the flanks of the pace need rise and fall above 0 adding up to at most 1, and a corner above 0 and at most 0.5')
}

// The S curve of a flank: from 0 to 1 over u from 0 to 1, slope 0 at both ends, the slope a trapeze with corners of share j.
export function flank(u: number, j: number): number {
  if (u <= 0) return 0
  if (u >= 1) return 1
  if (u <= j) return (u * u) / (2 * j * (1 - j))
  if (u <= 1 - j) return (u - j / 2) / (1 - j)
  return 1 - ((1 - u) * (1 - u)) / (2 * j * (1 - j))
}

// The integral of the S curve from 0 to u; a half at u = 1.
export function flankArea(u: number, j: number): number {
  if (u <= 0) return 0
  if (u >= 1) return 0.5
  if (u <= j) return (u * u * u) / (6 * j * (1 - j))
  const first = (j * j) / (6 * (1 - j))
  if (u <= 1 - j) return first + ((u - j) * u) / (2 * (1 - j))
  const v = 1 - u
  return first + (1 - 2 * j) / 2 + (u - (1 - j)) - (j * j * j - v * v * v) / (6 * j * (1 - j))
}

// The height of the plateau over the mean of the move.
export function bellPeak(f: Flanks): number {
  return 1 / (1 - (f.rise + f.fall) / 2)
}

// The rate of the move over its mean at the share x of the segment, x from 0 at the far end to 1 at the near end.
export function bellRate(x: number, f: Flanks): number {
  if (x <= 0 || x >= 1) return 0
  const p = bellPeak(f)
  if (x < f.rise) return p * flank(x / f.rise, f.corner)
  if (x > 1 - f.fall) return p * flank((1 - x) / f.fall, f.corner)
  return p
}

// The share of the move that is done at x: the integral of the rate, 0 at the far end, 1 at the near end, with no rate at either.
export function bellShare(x: number, f: Flanks): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const p = bellPeak(f)
  if (x < f.rise) return p * f.rise * flankArea(x / f.rise, f.corner)
  if (x > 1 - f.fall) return 1 - p * f.fall * flankArea((1 - x) / f.fall, f.corner)
  return p * (x - f.rise / 2)
}

// The most the rate can change over one film frame, over the mean of the move, for a segment of that many frames: the steepest slope of a
// flank times one frame.
export function bellStep(f: Flanks, frames: number): number {
  return bellPeak(f) / ((1 - f.corner) * Math.min(f.rise, f.fall) * frames)
}

export interface PaceLimits { maxStep: number; maxRebound: number; seamFrames: number; ringPx: number; floors: { turnDeg: number; speedPx: number }; rate: number; reachFrames: number }

// The limits of a smooth move. They live once, in the harness's `smooth` block of the config, and are read here and nowhere else in the
// engine.
export function paceLimits(): PaceLimits {
  const s = config.raw.smooth
  const p = s.path
  return { maxStep: p.maxStep, maxRebound: p.maxRebound, seamFrames: p.seamFrames, ringPx: p.ringPx, floors: { turnDeg: p.floors.turnDeg, speedPx: p.floors.speedPx }, rate: s.rate, reachFrames: s.reachFrames }
}

export type PaceKind = 'dive' | 'rise'
export type CurveName = 'fall' | 'turn' | 'speed'

export interface Mark { frame: number; value: number }

export interface PaceCurve {
  name: CurveName
  mean: number
  floored: boolean
  over: (number | null)[]
  peak: Mark | null
  worstStep: Mark | null
  worstHalfStep: Mark | null
  climbAfterPeak: Mark
  fallBeforePeak: Mark
  faults: string[]
}

export interface Pace { stop: string; kind: PaceKind; rate: number; firstFrame: number; curves: Record<CurveName, PaceCurve>; ok: boolean; faults: string[] }

interface Sample { k: number; time: number; pose: Pose; height: number }

const RAD = Math.PI / 180

// The film's own camera as a camera at the unit sphere of the stop: the shot taken out of its set, the close view carried through the twin.
export function carried(film: FilmDirector, plan: StopPlan, frame: number, time: number): { pose: Pose; side: ViewKind } {
  const seg = segmentAtFrame(frame)
  const side: ViewKind | undefined = seg.stop === plan.id && (seg.kind === 'dive' || seg.kind === 'rise') ? sideAt(seg, time) : undefined
  const shot = film.shotAt(frame, time, side)
  const index = film.plans.findIndex((p) => p.id === plan.id)
  const set = shot.sets.find((s) => s.id === plan.id) ?? { rotation: film.frames[index]!.rotation, origin: film.frames[index]!.origin, view: 'orbit' as ViewKind }
  const back = set.rotation.clone().invert()
  const local: Pose = { position: shot.camera.position.clone().sub(set.origin).applyQuaternion(back), quaternion: back.clone().multiply(shot.camera.quaternion), vfov: shot.camera.vfov }
  return { pose: set.view === 'terrain' ? plan.twin(local, time) : local, side: set.view }
}

function project(p: Pose, point: THREE.Vector3, width: number, height: number): { x: number; y: number; front: boolean } {
  const v = point.clone().sub(p.position).applyQuaternion(p.quaternion.clone().invert())
  const k = height / 2 / Math.tan((p.vfov * RAD) / 2)
  const z = Math.min(v.z, -1e-9)
  return { x: width / 2 + (v.x / -z) * k, y: height / 2 - (v.y / -z) * k, front: v.z < -1e-9 }
}

function sphereHit(p: Pose, px: number, py: number, width: number, height: number): THREE.Vector3 | null {
  const k = height / 2 / Math.tan((p.vfov * RAD) / 2)
  const ray = new THREE.Vector3((px - width / 2) / k, (height / 2 - py) / k, -1).normalize().applyQuaternion(p.quaternion)
  const along = -p.position.dot(ray)
  const disc = along * along - p.position.lengthSq() + 1
  if (disc <= 0) return null
  const t = along - Math.sqrt(disc)
  return t > 0 ? p.position.clone().addScaledVector(ray, t) : null
}

function judge(name: CurveName, raw: (number | null)[], k0: number, rate: number, first: number, end: number, limits: PaceLimits, floor: number | null): PaceCurve {
  const at = (k: number): number | null => raw[k - k0] ?? null
  const frameOf = (k: number): number => k / rate
  let sum = 0
  let count = 0
  for (let k = first; k < end; k++) {
    const v = at(k)
    if (v === null) continue
    sum += v
    count++
  }
  const mean = count > 0 ? sum / count : 0
  const floored = floor !== null && Math.abs(mean) < floor
  const scale = floored ? floor! : mean
  const faults: string[] = []
  if (!(scale > 0)) faults.push(name + ': the mean of the move is ' + mean.toFixed(6) + ', it must be above 0')
  const over = raw.map((v) => (v === null || !(scale > 0) ? null : v / scale))
  const o = (k: number): number | null => over[k - k0] ?? null
  const diff = (k: number, lag: number): number | null => {
    const a = o(k)
    const b = o(k - lag)
    return a === null || b === null ? null : Math.abs(a - b)
  }
  const reach = limits.seamFrames * rate
  const judged = (k: number, lag: number): boolean => k - lag >= first - 1 - reach && k <= end + reach
  let worstStep: Mark | null = null
  let worstHalfStep: Mark | null = null
  for (let k = k0; k < k0 + raw.length; k++) {
    const s = diff(k, rate)
    if (s !== null && judged(k, rate) && (!worstStep || s > worstStep.value)) worstStep = { frame: frameOf(k), value: s }
    const h = rate > 1 ? diff(k, 1) : null
    if (h !== null && judged(k, 1) && (!worstHalfStep || h > worstHalfStep.value)) worstHalfStep = { frame: frameOf(k), value: h }
  }
  let peak: Mark | null = null
  let peakK = -1
  for (let k = first; k < end; k++) {
    const v = o(k)
    if (v !== null && (!peak || v > peak.value)) {
      peak = { frame: frameOf(k), value: v }
      peakK = k
    }
  }
  let climb: Mark = { frame: -1, value: 0 }
  let fall: Mark = { frame: -1, value: 0 }
  if (peak) {
    let high = -Infinity
    for (let k = first; k < peakK; k++) {
      const v = o(k)
      if (v === null) continue
      high = Math.max(high, v)
      if (high - v > fall.value) fall = { frame: frameOf(k), value: high - v }
    }
    let low = peak.value
    for (let k = peakK + 1; k < end; k++) {
      const v = o(k)
      if (v === null) continue
      low = Math.min(low, v)
      if (v - low > climb.value) climb = { frame: frameOf(k), value: v - low }
    }
  }
  if (!floored) {
    if (worstStep && worstStep.value > limits.maxStep) faults.push(name + ': changes by ' + worstStep.value.toFixed(3) + ' of the mean over one film frame at ' + worstStep.frame + ', limit ' + limits.maxStep)
    if (worstHalfStep && worstHalfStep.value > limits.maxStep) faults.push(name + ': changes by ' + worstHalfStep.value.toFixed(3) + ' of the mean from one capture frame to the next at ' + worstHalfStep.frame + ', limit ' + limits.maxStep)
    if (climb.value > limits.maxRebound) faults.push(name + ': climbs again by ' + climb.value.toFixed(3) + ' of the mean after its largest value, at ' + climb.frame + ', limit ' + limits.maxRebound)
    if (fall.value > limits.maxRebound) faults.push(name + ': falls by ' + fall.value.toFixed(3) + ' of the mean before its largest value, at ' + fall.frame + ', limit ' + limits.maxRebound)
  }
  return { name, mean, floored, over, peak, worstStep, worstHalfStep, climbAfterPeak: climb, fallBeforePeak: fall, faults: floored ? [] : faults }
}

// The pace of a dive or a rise of the film as it stands: the fall (or climb) of the height above the body, the turn of the camera and the
// speed of the picture round the place, each counted per film frame from one capture frame to the next, over its own mean of the move, and
// held against the limits at every capture frame of the segment and across both of its seams.
export function paceOf(film: FilmDirector, plan: StopPlan, kind: PaceKind, rate = paceLimits().rate): Pace | null {
  const seg = config.segments.find((s) => s.stop === plan.id && s.kind === kind)
  if (!seg) return null
  const limits = paceLimits()
  const master = config.formats[config.formatKeys.master]!
  const firstFrame = Math.max(seg.firstFrame - limits.reachFrames, 0)
  const endFrame = Math.min(seg.endFrame + limits.reachFrames, config.frameCount)
  const k0 = Math.max(firstFrame * rate - 1, 0)
  const samples: Sample[] = []
  for (let k = k0; k < endFrame * rate; k++) {
    const time = (k + shutterMid()) / (config.fps * rate)
    const c = carried(film, plan, Math.floor(k / rate), time)
    samples.push({ k, time, pose: c.pose, height: c.pose.position.length() - 1 })
  }
  const sign = kind === 'dive' ? 1 : -1
  const raw: Record<CurveName, (number | null)[]> = { fall: [], turn: [], speed: [] }
  const points = 8
  samples.forEach((s, i) => {
    const prev = i > 0 ? samples[i - 1]! : null
    if (!prev) {
      raw.fall.push(null)
      raw.turn.push(null)
      raw.speed.push(null)
      return
    }
    raw.fall.push(prev.height > 0 && s.height > 0 ? sign * Math.log(prev.height / s.height) * rate : null)
    raw.turn.push((prev.pose.quaternion.angleTo(s.pose.quaternion) / RAD) * rate)
    const spot = project(s.pose, plan.place(kind, s.time), master.width, master.height)
    if (!spot.front) {
      raw.speed.push(null)
      return
    }
    const cx = Math.min(Math.max(spot.x, limits.ringPx), master.width - limits.ringPx)
    const cy = Math.min(Math.max(spot.y, limits.ringPx), master.height - limits.ringPx)
    const carry = plan.turn(s.time).invert().premultiply(plan.turn(prev.time))
    let sum = 0
    let seen = 0
    for (let j = 0; j < points; j++) {
      const a = (j / points) * 2 * Math.PI
      const x = cx + Math.cos(a) * limits.ringPx
      const y = cy + Math.sin(a) * limits.ringPx
      const ground = sphereHit(s.pose, x, y, master.width, master.height)
      if (!ground) continue
      const before = project(prev.pose, ground.clone().applyQuaternion(carry), master.width, master.height)
      if (!before.front) continue
      sum += Math.hypot(x - before.x, y - before.y)
      seen++
    }
    raw.speed.push(seen * 2 >= points ? (sum / seen) * rate : null)
  })
  const first = seg.firstFrame * rate + 1
  const end = seg.endFrame * rate
  const curves: Record<CurveName, PaceCurve> = {
    fall: judge('fall', raw.fall, k0, rate, first, end, limits, null),
    turn: judge('turn', raw.turn, k0, rate, first, end, limits, limits.floors.turnDeg),
    speed: judge('speed', raw.speed, k0, rate, first, end, limits, limits.floors.speedPx),
  }
  const faults = [...curves.fall.faults, ...curves.turn.faults, ...curves.speed.faults].map((t) => plan.id + ' ' + kind + ': ' + t)
  return { stop: plan.id, kind, rate, firstFrame, curves, ok: faults.length === 0, faults }
}
