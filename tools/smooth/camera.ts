import * as THREE from 'three'
import type { Config, Segment } from '../../src/config'
import { setCapture, spanMid } from '../../src/core/clock'
import type { Pose, ViewKind } from '../../src/core/types'
import type { FilmDirector } from '../../src/director/film'
import { sideAt } from '../../src/director/handover'
import type { StopPlan } from '../../src/director/moves'
import { segmentAtFrame } from '../../src/director/timeline'

// The camera of the film along a dive or a rise and into its neighbours, as a camera at the unit sphere of the stop: the film's own shot, taken
// out of its set, the close view carried through the twin. One sample for every capture frame, at the middle of its shutter.

export type Kind = 'dive' | 'rise'

export interface Sample { k: number; frame: number; time: number; segment: string; side: ViewKind; pose: Pose; height: number }

export interface Window { kind: Kind; seg: Segment; rate: number; k0: number; samples: Sample[]; own: { first: number; end: number }; firstFrame: number; frames: number }

const RAD = Math.PI / 180

export function carriedCamera(film: FilmDirector, plan: StopPlan, stop: string, frame: number, time: number): { pose: Pose; side: ViewKind; segment: string } {
  const seg = segmentAtFrame(frame)
  const mine = seg.stop === stop
  const side: ViewKind | undefined = mine && (seg.kind === 'dive' || seg.kind === 'rise') ? sideAt(seg, time) : undefined
  const shot = film.shotAt(frame, time, side)
  const index = film.plans.findIndex((p) => p.id === stop)
  const set = shot.sets.find((s) => s.id === stop) ?? { rotation: film.frames[index]!.rotation, origin: film.frames[index]!.origin, view: 'orbit' as ViewKind }
  const back = set.rotation.clone().invert()
  const local: Pose = { position: shot.camera.position.clone().sub(set.origin).applyQuaternion(back), quaternion: back.clone().multiply(shot.camera.quaternion), vfov: shot.camera.vfov }
  return { pose: set.view === 'terrain' ? plan.twin(local, time) : local, side: set.view, segment: seg.id }
}

function samplesOf(cfg: Config, film: FilmDirector, plan: StopPlan, rate: number, firstFrame: number, endFrame: number): { k0: number; samples: Sample[] } {
  const k0 = Math.max(firstFrame * rate - 1, 0)
  const samples: Sample[] = []
  setCapture(rate)
  for (let k = k0; k < endFrame * rate; k++) {
    const at = k / rate
    const time = (at + spanMid()) / cfg.fps
    const c = carriedCamera(film, plan, plan.id, at, time)
    samples.push({ k, frame: Math.floor(at), time, segment: c.segment, side: c.side, pose: c.pose, height: c.pose.position.length() - 1 })
  }
  return { k0, samples }
}

export function sampleWindow(cfg: Config, film: FilmDirector, plan: StopPlan, kind: Kind, rate: number, reachFrames: number): Window | null {
  const seg = cfg.segments.find((s) => s.stop === plan.id && s.kind === kind)
  if (!seg) return null
  const firstFrame = Math.max(seg.firstFrame - reachFrames, 0)
  const endFrame = Math.min(seg.endFrame + reachFrames, cfg.frameCount)
  return { kind, seg, rate, ...samplesOf(cfg, film, plan, rate, firstFrame, endFrame), own: { first: seg.firstFrame * rate + 1, end: seg.endFrame * rate }, firstFrame, frames: endFrame - firstFrame }
}

// The landing of a stop: the last part of the travel that arrives at it, from the share LANDING_FROM of the travel to the first frame of the
// hold, in the camera of the arriving stop. own is the span of capture frames whose step lies inside the landing; the window reaches
// reachFrames film frames before the landing and into the hold.
export const LANDING_FROM = 0.68

export interface LandingWindow { travel: Segment; hold: Segment; rate: number; k0: number; samples: Sample[]; own: { first: number; end: number }; firstFrame: number; frames: number; landingFrame: number }

export function sampleLanding(cfg: Config, film: FilmDirector, plan: StopPlan, rate: number, reachFrames: number): LandingWindow | null {
  const hold = cfg.segments.find((s) => s.stop === plan.id && s.kind === 'hold')
  const travel = hold ? cfg.segments.find((s) => s.kind === 'travel' && s.endFrame === hold.firstFrame) : undefined
  if (!hold || !travel) return null
  const landingFrame = travel.firstFrame + Math.ceil(LANDING_FROM * (travel.endFrame - travel.firstFrame) - 1e-9)
  const firstFrame = Math.max(landingFrame - reachFrames, 0)
  const endFrame = Math.min(travel.endFrame + reachFrames, cfg.frameCount)
  return { travel, hold, rate, ...samplesOf(cfg, film, plan, rate, firstFrame, endFrame), own: { first: landingFrame * rate + 1, end: travel.endFrame * rate }, firstFrame, frames: endFrame - firstFrame, landingFrame }
}

export interface LandingCurves { sky: (number | null)[]; centre: (number | null)[]; edge: (number | null)[]; limb: (number | null)[] }

// What changed from capture frame k - 1 to k in the picture, in pixels a film frame: sky, the turn of the camera (what the stars do); centre,
// the way of the centre of the arriving body; edge, the growth of its radius; limb, centre and edge together, the fastest point of its edge.
export function landingCurves(w: LandingWindow, width: number, height: number): LandingCurves {
  const out: LandingCurves = { sky: [], centre: [], edge: [], limb: [] }
  const focal = (p: Pose): number => height / 2 / Math.tan((p.vfov * RAD) / 2)
  const radius = (p: Pose): number | null => (p.position.lengthSq() > 1 ? focal(p) / Math.sqrt(p.position.lengthSq() - 1) : null)
  const zero = new THREE.Vector3()
  w.samples.forEach((s, i) => {
    const prev = i > 0 && w.samples[i - 1]!.k === s.k - 1 ? w.samples[i - 1]! : null
    if (!prev) {
      out.sky.push(null)
      out.centre.push(null)
      out.edge.push(null)
      out.limb.push(null)
      return
    }
    out.sky.push(prev.pose.quaternion.angleTo(s.pose.quaternion) * ((focal(prev.pose) + focal(s.pose)) / 2) * w.rate)
    const a = project(prev.pose, zero, width, height)
    const b = project(s.pose, zero, width, height)
    const centre = a.front && b.front ? Math.hypot(b.x - a.x, b.y - a.y) * w.rate : null
    const ra = radius(prev.pose)
    const rb = radius(s.pose)
    const edge = ra !== null && rb !== null ? Math.abs(rb - ra) * w.rate : null
    out.centre.push(centre)
    out.edge.push(edge)
    out.limb.push(centre !== null && edge !== null ? centre + edge : null)
  })
  return out
}

export function project(p: Pose, point: THREE.Vector3, width: number, height: number): { x: number; y: number; front: boolean } {
  const v = point.clone().sub(p.position).applyQuaternion(p.quaternion.clone().invert())
  const k = height / 2 / Math.tan((p.vfov * RAD) / 2)
  const z = Math.min(v.z, -1e-9)
  return { x: width / 2 + (v.x / -z) * k, y: height / 2 - (v.y / -z) * k, front: v.z < -1e-9 }
}

export function sphereHit(p: Pose, px: number, py: number, width: number, height: number): THREE.Vector3 | null {
  const dir = ray(p, px, py, width, height)
  const along = -p.position.dot(dir)
  const disc = along * along - p.position.lengthSq() + 1
  if (disc <= 0) return null
  const t = along - Math.sqrt(disc)
  return t > 0 ? p.position.clone().addScaledVector(dir, t) : null
}

// The ground of a stop whose place lies on its rings: the plane through the origin with this normal, between the two radii, where the globe
// (the unit sphere) does not stand in front of it. centre is the place itself, a point of that plane.
export interface Plane { normal: THREE.Vector3; inner: number; outer: number; centre: THREE.Vector3 }

const ray = (p: Pose, px: number, py: number, width: number, height: number): THREE.Vector3 => {
  const k = height / 2 / Math.tan((p.vfov * RAD) / 2)
  return new THREE.Vector3((px - width / 2) / k, (height / 2 - py) / k, -1).normalize().applyQuaternion(p.quaternion)
}

// Whether the camera sees a point: the unit sphere does not stand between the two.
export function seen(p: Pose, point: THREE.Vector3): boolean {
  const to = point.clone().sub(p.position)
  const far = to.length()
  if (far < 1e-12) return true
  const dir = to.multiplyScalar(1 / far)
  const along = -p.position.dot(dir)
  const disc = along * along - p.position.lengthSq() + 1
  if (disc <= 0) return true
  const t = along - Math.sqrt(disc)
  return !(t > 0 && t < far - 1e-9)
}

const onPlane = (g: Plane, point: THREE.Vector3): boolean => {
  const r = point.length()
  return r >= g.inner && r <= g.outer
}

export function planeHit(p: Pose, px: number, py: number, width: number, height: number, g: Plane): THREE.Vector3 | null {
  const dir = ray(p, px, py, width, height)
  const down = dir.dot(g.normal)
  if (Math.abs(down) < 1e-12) return null
  const t = -p.position.dot(g.normal) / down
  if (!(t > 0)) return null
  const point = p.position.clone().addScaledVector(dir, t)
  return onPlane(g, point) && seen(p, point) ? point : null
}

// The ground of a plan whose place lies on its rings, null for a place on the body.
export function ringPlane(plan: StopPlan): Plane | null {
  const rings = plan.fit.rings
  const point = (plan as unknown as { placePoint?: () => THREE.Vector3 }).placePoint
  if (plan.p.spot.on !== 'rings' || !rings || !point) return null
  return { normal: new THREE.Vector3(...rings.normal).normalize(), inner: rings.inner, outer: rings.outer, centre: point.call(plan) }
}

export interface Curves { fall: (number | null)[]; turn: (number | null)[]; speed: (number | null)[]; ring: ((number | null)[] | null)[] }

export type Ring = 'picture' | 'ground'

export const MIN_POINTS = 5

// What changed from capture frame k - 1 to k, counted per film frame: the fall of the height (its logarithm, a climb in a rise), the turn of the
// camera in degrees, and how far ground points on a ring round the place move in the picture, in pixels. ring holds what every point of the ring
// gave, null where it has no ground under it; speed is their mean where at least MIN_POINTS have one.
// A point has ground only where it lies on what the camera sees of the place's own surface: the unit sphere of the stop, or the plane of its
// rings (ground) where the place lies on the rings.
// The ring: 'picture' is a circle of ringPx in the picture round the place, each point the ground under that pixel (a point over the sky has
// none). 'ground' is a circle on the ground round the same spot, as wide as ringPx at its distance: every point lies on the ground.
export function curves(w: Window, plan: StopPlan, width: number, height: number, ringPx: number, form: Ring = 'picture', ringPoints = 8, ground: Plane | null = null): Curves {
  const sign = w.kind === 'dive' ? 1 : -1
  const out: Curves = { fall: [], turn: [], speed: [], ring: [] }
  w.samples.forEach((s, i) => {
    const prev = i > 0 && w.samples[i - 1]!.k === s.k - 1 ? w.samples[i - 1]! : null
    if (!prev) {
      out.fall.push(null)
      out.turn.push(null)
      out.speed.push(null)
      out.ring.push(null)
      return
    }
    out.fall.push(prev.height > 0 && s.height > 0 ? sign * Math.log(prev.height / s.height) * w.rate : null)
    out.turn.push((prev.pose.quaternion.angleTo(s.pose.quaternion) / RAD) * w.rate)
    const place = ground ? ground.centre : plan.place(w.kind, s.time)
    const spot = project(s.pose, place, width, height)
    if (!spot.front) {
      out.speed.push(null)
      out.ring.push(null)
      return
    }
    const cx = Math.min(Math.max(spot.x, ringPx), width - ringPx)
    const cy = Math.min(Math.max(spot.y, ringPx), height - ringPx)
    const carry = plan.turn(s.time).invert().premultiply(plan.turn(prev.time))
    const moved = (point: THREE.Vector3, x: number, y: number): number | null => {
      const before = project(prev.pose, point.clone().applyQuaternion(carry), width, height)
      return before.front ? Math.hypot(x - before.x, y - before.y) * w.rate : null
    }
    const hit = (x: number, y: number): THREE.Vector3 | null => (ground ? planeHit(s.pose, x, y, width, height, ground) : sphereHit(s.pose, x, y, width, height))
    const points: (number | null)[] = []
    if (form === 'ground') {
      const centre = hit(cx, cy) ?? (ground ? place.clone() : place.clone().normalize())
      const up = ground ? ground.normal.clone() : centre.clone().normalize()
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(s.pose.quaternion)
      const e1 = right.addScaledVector(up, -right.dot(up))
      if (e1.lengthSq() < 1e-12) e1.set(0, 1, 0).applyQuaternion(s.pose.quaternion).addScaledVector(up, -new THREE.Vector3(0, 1, 0).applyQuaternion(s.pose.quaternion).dot(up))
      e1.normalize()
      const e2 = up.clone().cross(e1)
      const focal = height / 2 / Math.tan((s.pose.vfov * RAD) / 2)
      const radius = Math.min((ringPx / focal) * centre.distanceTo(s.pose.position), 0.5)
      for (let j = 0; j < ringPoints; j++) {
        const a = (j / ringPoints) * 2 * Math.PI
        const point = centre.clone().addScaledVector(e1, Math.cos(a) * radius).addScaledVector(e2, Math.sin(a) * radius)
        if (!ground) point.normalize()
        const now = project(s.pose, point, width, height)
        points.push(now.front && seen(s.pose, point) && (!ground || onPlane(ground, point)) ? moved(point, now.x, now.y) : null)
      }
    } else {
      for (let j = 0; j < ringPoints; j++) {
        const a = (j / ringPoints) * 2 * Math.PI
        const x = cx + Math.cos(a) * ringPx
        const y = cy + Math.sin(a) * ringPx
        const point = hit(x, y)
        points.push(point ? moved(point, x, y) : null)
      }
    }
    const got = points.filter((v): v is number => v !== null)
    out.ring.push(points)
    out.speed.push(got.length >= MIN_POINTS ? got.reduce((n, v) => n + v, 0) / got.length : null)
  })
  return out
}

// The seam of a dive or a rise with the surface view: the eye against the near ground. SEAM_REACH film frames to each side of the seam;
// own is the span of capture frames whose step lies inside the surface view within SEAM_OWN film frames of the seam.
export const SEAM_REACH = 16
export const SEAM_OWN = 2

export interface SeamWindow { kind: Kind; seg: Segment; seam: number; rate: number; k0: number; samples: Sample[]; own: { first: number; end: number } }

export function sampleSeam(cfg: Config, film: FilmDirector, plan: StopPlan, kind: Kind, rate: number): SeamWindow | null {
  const seg = cfg.segments.find((s) => s.stop === plan.id && s.kind === kind)
  if (!seg) return null
  const seam = kind === 'dive' ? seg.endFrame : seg.firstFrame
  const own = kind === 'dive' ? { first: seam * rate + 1, end: (seam + SEAM_OWN) * rate } : { first: (seam - SEAM_OWN) * rate + 1, end: seam * rate }
  return { kind, seg, seam, rate, ...samplesOf(cfg, film, plan, rate, Math.max(seam - SEAM_REACH, 0), Math.min(seam + SEAM_REACH, cfg.frameCount)), own }
}

export interface EyeCurves { own: number | null; speed: (number | null)[]; along: (number | null)[] }

// What the eye did from capture frame k - 1 to k against the ground as the stop's twin holds it (as tools/seam.ts reads it): its way over its own height above the ground
// (the unit sphere, or the plane of the rings), per film frame, over the same number of the surface view next to the seam (own, the mean of
// its SEAM_OWN film frames at the seam). along is the part of that way in the direction the surface view itself moves in: under 0 the eye
// goes back.
export function eyeCurves(w: SeamWindow, plan: StopPlan, ground: Plane | null = null): EyeCurves {
  const fixed = (s: Sample): THREE.Vector3 => plan.twin(plan.untwin(s.pose, s.time), plan.seg.terrain.start).position.clone()
  const high = (s: Sample): number => (ground ? Math.abs(s.pose.position.dot(ground.normal)) : s.height)
  const ways: (THREE.Vector3 | null)[] = w.samples.map((s, i) => {
    const prev = i > 0 && w.samples[i - 1]!.k === s.k - 1 ? w.samples[i - 1]! : null
    const h = prev ? (high(prev) + high(s)) / 2 : 0
    return prev && high(prev) > 0 && high(s) > 0 ? fixed(s).sub(fixed(prev)).multiplyScalar(w.rate / h) : null
  })
  const mine = ways.filter((v, i): v is THREE.Vector3 => v !== null && w.k0 + i >= w.own.first && w.k0 + i <= w.own.end)
  const own = mine.length ? mine.reduce((n, v) => n + v.length(), 0) / mine.length : null
  const dir = mine.reduce((n, v) => n.add(v), new THREE.Vector3())
  if (own === null || own < 1e-12 || dir.lengthSq() < 1e-24) return { own, speed: ways.map(() => null), along: ways.map(() => null) }
  dir.normalize()
  return { own, speed: ways.map((v) => (v ? v.length() / own : null)), along: ways.map((v) => (v ? v.dot(dir) / own : null)) }
}
