import * as THREE from 'three'
import { config } from '../../src/config'
import { spanMid } from '../../src/core/clock'
import type { Pose } from '../../src/core/types'
import type { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { carriedCamera, project, sphereHit } from '../smooth/camera'
import { WINDOW, type Step } from './rule'

// The reading of the seams report, travel_builder's probe: no frame is drawn. For each pair of half frames a point of the scene is carried
// from one camera of the film's own shots to the next and the way it went is read, in px a half frame at the size given.
//   middle  the point of the scene under the picture's middle, read only where that point lies on the stop's own body
//   limb    the shift of the body's centre plus the change of its outline's radius, read only where the outline crosses the picture and
//           the stop's set is drawn
//   mean    the same reading at 48 by 27 points spread over the picture, averaged (the reader's kind of measure)
// A point off every body is carried with the sky as it is seen: by the shot's skyTurnSeen where the film gives one, else by its skyTurn.

const zero = new THREE.Vector3()

interface At { k: number; inShot: boolean; body: Pose; others: { id: string; pose: Pose }[]; sky: THREE.Quaternion; vfov: number }
export interface Size { w: number; h: number; rate: number }
export interface Seam { stop: string; seam: string; frame: number; from: number; to: number }
export interface Read extends Step { on: string; share: number; inShot: boolean; seen: boolean; centre: number | null; edge: number | null; radius: number | null }

function at(film: FilmDirector, stop: string, k: number, rate: number): At {
  const f = k / rate
  const time = (f + spanMid()) / config.fps
  const plan = plans.find((p) => p.id === stop)!
  const body = carriedCamera(film, plan, stop, f, time).pose
  const shot = film.shotAt(f, time)
  const others = shot.sets.filter((s) => s.id !== stop && s.view === 'orbit' && s.weight > 0).map((s) => {
    const back = s.rotation.clone().invert()
    return { id: s.id, pose: { position: shot.camera.position.clone().sub(s.origin).applyQuaternion(back), quaternion: back.clone().multiply(shot.camera.quaternion), vfov: shot.camera.vfov } as Pose }
  })
  return { k, inShot: shot.sets.some((x) => x.id === stop && x.weight > 0), body, others, sky: (shot.skyTurnSeen ?? shot.skyTurn).clone().invert().multiply(shot.skyQuaternion), vfov: shot.camera.vfov }
}

function point(a: At, b: At, stop: string, x: number, y: number, s: Size): { px: number; on: string } {
  const hit = a.inShot && b.inShot ? sphereHit(a.body, x, y, s.w, s.h) : null
  if (hit) {
    const q = project(b.body, hit, s.w, s.h)
    return { px: Math.hypot(q.x - x, q.y - y), on: stop }
  }
  for (const o of a.others) {
    const h = sphereHit(o.pose, x, y, s.w, s.h)
    const next = b.others.find((n) => n.id === o.id)
    if (h && next) {
      const q = project(next.pose, h, s.w, s.h)
      return { px: Math.hypot(q.x - x, q.y - y), on: o.id }
    }
  }
  const fa = s.h / 2 / Math.tan((a.vfov * Math.PI) / 360)
  const v = new THREE.Vector3(x - s.w / 2, s.h / 2 - y, -fa).applyQuaternion(a.sky).applyQuaternion(b.sky.clone().invert())
  const fb = s.h / 2 / Math.tan((b.vfov * Math.PI) / 360)
  return { px: Math.hypot((v.x / -v.z) * fb - (x - s.w / 2), (v.y / -v.z) * fb - (s.h / 2 - y)), on: 'stars' }
}

function whole(a: At, b: At, stop: string, s: Size): { mean: number; share: number } {
  const [nx, ny] = [48, 27]
  let sum = 0
  let on = 0
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const p = point(a, b, stop, ((i + 0.5) * s.w) / nx, ((j + 0.5) * s.h) / ny, s)
    sum += p.px
    if (p.on !== 'stars') on++
  }
  return { mean: sum / (nx * ny), share: on / (nx * ny) }
}

function limb(a: At, b: At, s: Size): { px: number | null; centre: number | null; edge: number | null; seen: boolean; radius: number | null } {
  const focal = (p: Pose): number => s.h / 2 / Math.tan((p.vfov * Math.PI) / 360)
  const rad = (p: Pose): number | null => (p.position.lengthSq() > 1 ? focal(p) / Math.sqrt(p.position.lengthSq() - 1) : null)
  const [ca, cb] = [project(a.body, zero, s.w, s.h), project(b.body, zero, s.w, s.h)]
  const [ra, rb] = [rad(a.body), rad(b.body)]
  if (!ca.front || !cb.front || ra === null || rb === null) return { px: null, centre: null, edge: null, seen: false, radius: ra }
  const near = Math.hypot(Math.max(0 - ca.x, 0, ca.x - s.w), Math.max(0 - ca.y, 0, ca.y - s.h))
  const far = Math.max(...[[0, 0], [s.w, 0], [0, s.h], [s.w, s.h]].map(([x, y]) => Math.hypot(ca.x - x!, ca.y - y!)))
  const centre = Math.hypot(cb.x - ca.x, cb.y - ca.y)
  const edge = Math.abs(rb - ra)
  return { px: centre + edge, centre, edge, seen: near < ra && far > ra, radius: ra }
}

// Every seam of the film, in the film's order: the end of each rise with the WINDOW.before film frames before it and the WINDOW.after
// after; the start of each hold with WINDOW.after before and WINDOW.before after; the end of a hold that no dive follows (the Sun's).
export function seamsOf(): Seam[] {
  const seg = (id: string) => config.segments.find((s) => s.id === id)
  const out: Seam[] = []
  for (const p of plans) {
    const rise = seg(p.id + '.rise')
    const hold = seg(p.id + '.hold')
    const after = rise ? config.segments.find((s) => s.firstFrame === rise.endFrame) : undefined
    if (rise && after) out.push({ stop: p.id, seam: 'rise to ' + after.id, frame: rise.endFrame, from: rise.endFrame - WINDOW.before, to: rise.endFrame + WINDOW.after })
    if (!hold) continue
    const before = config.segments.find((s) => s.endFrame === hold.firstFrame)
    if (before && before.id !== rise?.id) out.push({ stop: p.id, seam: before.id + ' to hold', frame: hold.firstFrame, from: hold.firstFrame - WINDOW.after, to: hold.firstFrame + WINDOW.before })
    const next = config.segments.find((s) => s.firstFrame === hold.endFrame)
    if (next && next.kind !== 'dive') out.push({ stop: p.id, seam: 'hold to ' + next.id, frame: hold.endFrame, from: hold.endFrame - WINDOW.before, to: hold.endFrame + WINDOW.after })
  }
  return out.map((s) => ({ ...s, from: Math.max(s.from, 0), to: Math.min(s.to, config.frameCount) })).sort((x, y) => x.frame - y.frame)
}

export function read(film: FilmDirector, seam: Seam, s: Size): Read[] {
  const rows: Read[] = []
  let prev = at(film, seam.stop, seam.from * s.rate, s.rate)
  for (let k = seam.from * s.rate; k < seam.to * s.rate; k++) {
    const next = at(film, seam.stop, k + 1, s.rate)
    const m = point(prev, next, seam.stop, s.w / 2, s.h / 2, s)
    const l = limb(prev, next, s)
    const w = whole(prev, next, seam.stop, s)
    const inShot = prev.inShot && next.inShot
    rows.push({ k, middle: m.on === seam.stop ? m.px : null, limb: l.seen && inShot ? l.px : null, mean: w.mean, on: m.on, share: w.share, inShot, seen: l.seen, centre: l.centre, edge: l.edge, radius: l.radius })
    prev = next
  }
  return rows
}
