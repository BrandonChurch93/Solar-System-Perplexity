import * as THREE from 'three'
import { config } from '../../src/config'
import { captureRate, setCapture, shutterAsked, spanMid } from '../../src/core/clock'
import { shutterMid } from '../../src/core/sampler'
import type { FilmDirector } from '../../src/director/film'
import { handoverOf } from '../../src/director/handover'
import type { StopPlan } from '../../src/director/moves'
import * as travelPath from '../../src/space/travel/path'
import { SEAM_OWN, SEAM_REACH, carriedCamera, landingCurves, project, ringPlane, sampleLeave } from '../smooth/camera'
import { judgeLeave } from '../smooth/path'

// The seam between a surface view and its dive or its rise, read on the eye itself (ruling d196), for tools/seam.ts and its test.
// The eye is the film's own camera as a camera at the unit sphere of the stop, read as the judge reads it (tools/smooth/camera.ts,
// carriedCamera at the capture rate: the close view through the twin, the globe as it stands), taken in the frame the ground itself
// stands in, so what is counted is its way over the ground. The height is the judge's own: above the unit sphere, or above the plane
// of the rings where the place lies on them (ringPlane). A step is the way from one capture frame to the next and carries the name of
// the frame it ends on, as the judge names it.

export type SeamKind = 'dive' | 'rise'

// One step. f is the frame it ends on (a film frame and a fraction at a rate above 1); speed is the way a film frame over the height;
// along, up and across are its parts over the surface view's own speed (shares of the height where the surface view stands still).
export interface SeamRow { f: number; speed: number; along: number; up: number; across: number; turn: number; height: number; inMove: boolean }

export interface SeamRead {
  stop: string
  kind: SeamKind
  seam: number
  rate: number
  oneMove: boolean
  onRings: boolean
  // The surface view's own speed over its height where it meets the move: the mean of its SEAM_OWN film frames next to the seam.
  own: number
  still: boolean
  // The lowest of the move's first (rise) or last (dive) frames, and that over the surface view's own (1 is no dent).
  lowest: { f: number; speed: number; over: number }
  // Where the eye's way along the surface view's own passes 0: in a rise the first step against it, in a dive the last.
  back: { f: number; speed: number; over: number } | null
  // The largest step of the number from one film frame to the next inside the surface view, over the surface view's own.
  viewStep: { value: number; f: number }
  // The frame of the change of view, null for a stop that does not hand over here.
  changeOfView: number | null
  rows: SeamRow[]
}

export function seamOf(film: FilmDirector, plan: StopPlan, kind: SeamKind, opts: { rate?: number; frames?: number; before?: number } = {}): SeamRead | null {
  const seg = plan.seg[kind]
  if (!seg) return null
  const rate = Math.max(1, Math.round(opts.rate ?? 2))
  const frames = opts.frames ?? SEAM_REACH
  const before = opts.before ?? 3
  const at = kind === 'dive' ? seg.endFrame : seg.firstFrame
  const from = kind === 'rise' ? at - before : at - frames
  const to = kind === 'rise' ? at + frames : at + before
  const plane = ringPlane(plan)
  const deg = THREE.MathUtils.radToDeg
  const was = { rate: captureRate(), shutter: shutterAsked() }
  try {
    setCapture(rate)
    // The ground's own frame is the one the stop's twin gives the close view: the pose goes back through the twin of its own time and
    // out through the twin of one fixed time, so a stop whose ground turns by a law of its own is read on that law.
    const fixed = plan.seg.terrain.start
    const eye = (k: number): { ground: THREE.Vector3; quaternion: THREE.Quaternion; height: number; up: THREE.Vector3 } => {
      const time = (k / rate + spanMid()) / config.fps
      const c = carriedCamera(film, plan, plan.id, k / rate, time)
      const g = plan.twin(plan.untwin(c.pose, time), fixed)
      const side = plane ? c.pose.position.dot(plane.normal) : 0
      return {
        ground: g.position,
        quaternion: g.quaternion,
        height: plane ? Math.abs(side) : c.pose.position.length() - 1,
        up: plane ? plane.normal.clone().multiplyScalar(side < 0 ? -1 : 1) : g.position.clone().normalize(),
      }
    }
    const raw: { k: number; f: number; way: THREE.Vector3; turn: number; height: number; up: THREE.Vector3; inMove: boolean }[] = []
    // The steps of the judge's own window (sampleSeam): from the one that ends on the first frame to the last that ends before the end.
    for (let k = Math.max(from * rate, 1); k < to * rate; k++) {
      const p = eye(k - 1)
      const q = eye(k)
      raw.push({ k, f: k / rate, way: q.ground.clone().sub(p.ground).multiplyScalar(rate), turn: deg(p.quaternion.angleTo(q.quaternion)) * rate, height: (p.height + q.height) / 2, up: q.up, inMove: kind === 'rise' ? k > at * rate : k <= at * rate })
    }
    // The surface view where it meets the move: its SEAM_OWN film frames next to the seam, every step wholly inside it.
    const near = raw.filter((r) => !r.inMove && r.height > 0 && (kind === 'rise' ? r.k > (at - SEAM_OWN) * rate : r.k <= (at + SEAM_OWN) * rate))
    const own = near.reduce((s, r) => s + r.way.length() / r.height, 0) / Math.max(near.length, 1)
    const way = near.reduce((s, r) => s.addScaledVector(r.way, 1 / r.height), new THREE.Vector3())
    const still = !(own > 1e-12) || way.lengthSq() < 1e-24
    const dir = still ? new THREE.Vector3() : way.normalize()
    const rows: SeamRow[] = raw.map((r) => {
      const along = r.way.dot(dir)
      const up = r.way.dot(r.up)
      const rest = r.way.clone().addScaledVector(dir, -along)
      const across = Math.sqrt(Math.max(rest.lengthSq() - Math.pow(rest.dot(r.up), 2), 0))
      const unit = still ? 1 : own * r.height
      return { f: r.f, speed: r.way.length() / r.height, along: along / unit, up: up / unit, across: across / unit, turn: r.turn, height: r.height, inMove: r.inMove }
    })
    const move = rows.filter((r) => r.inMove)
    const view = rows.filter((r) => !r.inMove)
    const over = (x: number): number => (still ? x : x / own)
    let low = move[0]!
    for (const r of move) if (r.speed < low.speed) low = r
    const against = move.filter((r) => r.along < 0)
    const back = against.length ? (kind === 'rise' ? against[0]! : against[against.length - 1]!) : null
    let step = 0
    let stepAt = view[0]?.f ?? at
    for (let i = rate; i < view.length; i++) {
      const d = Math.abs(view[i]!.speed - view[i - rate]!.speed)
      if (d > step) {
        step = d
        stepAt = view[i]!.f
      }
    }
    const h = handoverOf(plan.id, kind)
    return {
      stop: plan.id, kind, seam: at, rate, oneMove: plan.engineMove, onRings: plane !== null, own, still,
      lowest: { f: low.f, speed: low.speed, over: over(low.speed) },
      back: back ? { f: back.f, speed: back.speed, over: over(back.speed) } : null,
      viewStep: { value: over(step), f: stepAt },
      changeOfView: h ? Math.round((h.time * config.fps - shutterMid()) * rate) / rate : null,
      rows,
    }
  } finally {
    setCapture(was.rate, was.shutter)
  }
}

// THE FAR END OF A RISE that a travel follows (MAIL 602: a rise and the travel after it are one flight; through the seam the speed of
// the picture falls once and rises once and never comes to rest), read twice.
// As the travel reads it (the carry of src/space/travel, FilmDirector.carryOf): p0 the place the travel starts on (exitPose at the end
// of the rise), p1 and p2 the rise's own eye one and two steps before its end, in the globe view by name. From the three: the eye's
// velocity at the end (a one sided difference), its excess over the drift's own velocity, and its acceleration. An excess under the
// carry's threshold is a rise that comes to rest on its drift, and the travel carries nothing. The step and the threshold are the
// travel's own (CARRY of src/space/travel/path.ts); a tree that does not have them yet is read with the two numbers its builder gave,
// and the read says so.
// As the judge reads the picture (the rest line of npm run smooth: sampleLeave, landingCurves, judgeLeave of tools/smooth, on the
// film's own camera at the capture rate): the fastest point of the body's edge in pixels a film frame, its lowest and its two ends.
// And the way of the body's centre in the picture through the same window: where it is slowest, how far its way turns from the first
// step to the last, and the sharpest turn from one capture frame to the next between two steps that both have speed (AT_SPEED and
// more), with the speed of the slower of the two: a centre that turns while it stands is no bend, one that turns while it flies is.
// A stop that asks for a pull back states a speed (handover.rise.pullBack of its params). The read compares the excess the travel
// reads with it: apart by more than REACHED of the stated speed, the rise of that stop does not follow the far end the engine moves
// through its last moments (a path of its own that glides onto exitPose(time) and not onto after(time), or one whose law reads the far
// end only for its place), and the option does nothing or only a part there.
export const CARRY_AGREED = { from: 0.02, step: 1 / 600 }
export const AT_SPEED = 1
export const REACHED = 0.02

export interface FarEndRead {
  stop: string
  // The film frame of the seam into the travel.
  seam: number
  oneMove: boolean
  // The step of the reading in seconds, the threshold in radii a second, and whether they are the travel's own of this tree.
  step: number
  from: number
  carryKnown: boolean
  // Radii between the rise's own last pose and the pose the travel starts on, and the height of that pose.
  gap: number
  height: number
  // Radii a second: the eye at the end, the drift's own, the eye's excess over the drift, and the angle of that excess to the drift's
  // line in degrees (null where there is no excess to speak of).
  speed: number
  drift: number
  excess: number
  offLine: number | null
  // The acceleration at the end in radii a second squared: along the eye's way (under 0 it brakes, over 0 it speeds up) and across it.
  along: number
  across: number
  // The camera at the end: its turn in degrees a second and the change of its angle of view in degrees a second.
  turn: number
  vfov: number
  // Whether the travel carries the excess (at or over the threshold).
  carried: boolean
  // The speed the stop's pull back states (null without one), and whether the excess read is that speed (within REACHED of it).
  asked: number | null
  reached: boolean | null
  // The picture: the judge's rest line, positions as capture frames over the rate.
  rest: { rate: number; reach: number; lowest: { value: number; f: number } | null; first: { value: number; f: number } | null; last: { value: number; f: number } | null; over: number | null }
  // The body's centre in the picture, px a film frame and degrees.
  centre: { slowest: { value: number; f: number }; turned: number | null; sharpest: { value: number; f: number; speed: number } | null } | null
}

export function farEndOf(film: FilmDirector, plan: StopPlan, opts: { rate?: number; reach?: number } = {}): FarEndRead | null {
  const { rise, travel } = plan.seg
  if (!rise || !travel || plan.riseIntoHold || Math.abs(travel.start - rise.end) > 1e-9) return null
  const rate = Math.max(1, Math.round(opts.rate ?? config.raw.smooth.rate ?? 2))
  const reach = opts.reach ?? config.raw.smooth.reachFrames
  const deg = THREE.MathUtils.radToDeg
  const own = (travelPath as unknown as { CARRY?: { from: number; step: number } }).CARRY
  const carry = own ?? CARRY_AGREED
  const h = carry.step
  const end = rise.end
  const eye = (time: number) => plan.eyeShot('rise', time, 'orbit').pose
  const p0 = plan.exitPose(end).position
  const p1 = eye(end - h).position
  const p2 = eye(end - 2 * h).position
  const v = p0.clone().multiplyScalar(3).addScaledVector(p1, -4).add(p2).multiplyScalar(1 / (2 * h))
  const drift = plan.exitPose(end + h).position.sub(p0).multiplyScalar(1 / h)
  const w = v.clone().sub(drift)
  const a = p0.clone().addScaledVector(p1, -2).add(p2).multiplyScalar(1 / (h * h))
  const along = v.length() > 1e-12 ? a.dot(v) / v.length() : 0
  const asked = plan.p.handover?.rise?.pullBack?.speed ?? null
  const last = eye(end - 1e-9)
  const before = eye(end - h)
  const master = config.formats[config.formatKeys.master]!
  const lw = sampleLeave(config, film, plan, rate, reach)
  if (!lw) return null
  const curves = landingCurves(lw, master.width, master.height)
  const j = judgeLeave(curves.limb, lw.k0, rate, null)
  const named = (x: { value: number; k: number } | null): { value: number; f: number } | null => (x ? { value: x.value, f: x.k / rate } : null)
  // the body's centre: its steps in the picture, each named by the capture frame it ends on
  const zero = new THREE.Vector3()
  const steps: { f: number; size: number; way: number }[] = []
  for (let i = 1; i < lw.samples.length; i++) {
    const from = project(lw.samples[i - 1]!.pose, zero, master.width, master.height)
    const to = project(lw.samples[i]!.pose, zero, master.width, master.height)
    if (!from.front || !to.front || lw.samples[i]!.k !== lw.samples[i - 1]!.k + 1) continue
    steps.push({ f: lw.samples[i]!.k / rate, size: Math.hypot(to.x - from.x, to.y - from.y) * rate, way: deg(Math.atan2(to.y - from.y, to.x - from.x)) })
  }
  const between = (x: number, y: number): number => Math.abs(((y - x + 540) % 360) - 180)
  let centre: FarEndRead['centre'] = null
  if (steps.length > 0) {
    let slowest = steps[0]!
    for (const s of steps) if (s.size < slowest.size) slowest = s
    let sharpest: { value: number; f: number; speed: number } | null = null
    for (let i = 1; i < steps.length; i++) {
      const x = steps[i - 1]!
      const y = steps[i]!
      if (x.size < AT_SPEED || y.size < AT_SPEED) continue
      const turn = between(x.way, y.way)
      if (!sharpest || turn > sharpest.value) sharpest = { value: turn, f: y.f, speed: Math.min(x.size, y.size) }
    }
    const ends = [steps[0]!, steps[steps.length - 1]!]
    centre = { slowest: { value: slowest.size, f: slowest.f }, turned: ends[0]!.size > 1e-9 && ends[1]!.size > 1e-9 ? between(ends[0]!.way, ends[1]!.way) : null, sharpest }
  }
  return {
    stop: plan.id, seam: rise.endFrame, oneMove: plan.engineMove, step: h, from: carry.from, carryKnown: own !== undefined,
    gap: last.position.distanceTo(p0), height: p0.length() - 1,
    speed: v.length(), drift: drift.length(), excess: w.length(), offLine: w.length() > 1e-6 && drift.length() > 1e-12 ? deg(w.angleTo(drift)) : null,
    along, across: a.clone().addScaledVector(v, v.lengthSq() > 1e-24 ? -a.dot(v) / v.lengthSq() : 0).length(),
    turn: deg(before.quaternion.angleTo(last.quaternion)) / h, vfov: (last.vfov - before.vfov) / h,
    carried: w.length() >= carry.from,
    asked, reached: asked === null ? null : Math.abs(w.length() - asked) <= REACHED * asked,
    rest: { rate, reach, lowest: named(j.lowest), first: named(j.first), last: named(j.last), over: j.over },
    centre,
  }
}
