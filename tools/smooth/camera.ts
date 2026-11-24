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

export function sampleWindow(cfg: Config, film: FilmDirector, plan: StopPlan, kind: Kind, rate: number, reachFrames: number): Window | null {
  const seg = cfg.segments.find((s) => s.stop === plan.id && s.kind === kind)
  if (!seg) return null
  const firstFrame = Math.max(seg.firstFrame - reachFrames, 0)
  const endFrame = Math.min(seg.endFrame + reachFrames, cfg.frameCount)
  const k0 = Math.max(firstFrame * rate - 1, 0)
  const samples: Sample[] = []
  setCapture(rate)
  for (let k = k0; k < endFrame * rate; k++) {
    const at = k / rate
    const time = (at + spanMid()) / cfg.fps
    const c = carriedCamera(film, plan, plan.id, at, time)
    samples.push({ k, frame: Math.floor(at), time, segment: c.segment, side: c.side, pose: c.pose, height: c.pose.position.length() - 1 })
  }
  return { kind, seg, rate, k0, samples, own: { first: seg.firstFrame * rate + 1, end: seg.endFrame * rate }, firstFrame, frames: endFrame - firstFrame }
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
