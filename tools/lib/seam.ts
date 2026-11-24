import * as THREE from 'three'
import { config } from '../../src/config'
import { captureRate, setCapture, shutterAsked, spanMid } from '../../src/core/clock'
import { shutterMid } from '../../src/core/sampler'
import type { FilmDirector } from '../../src/director/film'
import { handoverOf } from '../../src/director/handover'
import type { StopPlan } from '../../src/director/moves'
import { SEAM_OWN, SEAM_REACH, carriedCamera, ringPlane } from '../smooth/camera'

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
