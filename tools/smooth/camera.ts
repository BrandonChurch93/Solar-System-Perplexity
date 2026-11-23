import * as THREE from 'three'
import type { Config, Segment } from '../../src/config'
import { shutterMid } from '../../src/core/sampler'
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
  for (let k = k0; k < endFrame * rate; k++) {
    const frame = Math.floor(k / rate)
    const time = (k + shutterMid()) / (cfg.fps * rate)
    const c = carriedCamera(film, plan, plan.id, frame, time)
    samples.push({ k, frame, time, segment: c.segment, side: c.side, pose: c.pose, height: c.pose.position.length() - 1 })
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
  const k = height / 2 / Math.tan((p.vfov * RAD) / 2)
  const ray = new THREE.Vector3((px - width / 2) / k, (height / 2 - py) / k, -1).normalize().applyQuaternion(p.quaternion)
  const along = -p.position.dot(ray)
  const disc = along * along - p.position.lengthSq() + 1
  if (disc <= 0) return null
  const t = along - Math.sqrt(disc)
  return t > 0 ? p.position.clone().addScaledVector(ray, t) : null
}

export interface Curves { fall: (number | null)[]; turn: (number | null)[]; speed: (number | null)[] }

// What changed from capture frame k - 1 to k, counted per film frame: the fall of the height (its logarithm, a climb in a rise), the turn of the
// camera in degrees, and how far ground points on a ring round the place move in the picture, in pixels.
export function curves(w: Window, plan: StopPlan, width: number, height: number, ringPx: number, ringPoints = 8): Curves {
  const sign = w.kind === 'dive' ? 1 : -1
  const out: Curves = { fall: [], turn: [], speed: [] }
  w.samples.forEach((s, i) => {
    const prev = i > 0 && w.samples[i - 1]!.k === s.k - 1 ? w.samples[i - 1]! : null
    if (!prev) {
      out.fall.push(null)
      out.turn.push(null)
      out.speed.push(null)
      return
    }
    out.fall.push(prev.height > 0 && s.height > 0 ? sign * Math.log(prev.height / s.height) * w.rate : null)
    out.turn.push((prev.pose.quaternion.angleTo(s.pose.quaternion) / RAD) * w.rate)
    const spot = project(s.pose, plan.place(w.kind, s.time), width, height)
    if (!spot.front) {
      out.speed.push(null)
      return
    }
    const cx = Math.min(Math.max(spot.x, ringPx), width - ringPx)
    const cy = Math.min(Math.max(spot.y, ringPx), height - ringPx)
    const carry = plan.turn(s.time).invert().premultiply(plan.turn(prev.time))
    let sum = 0
    let seen = 0
    for (let j = 0; j < ringPoints; j++) {
      const a = (j / ringPoints) * 2 * Math.PI
      const x = cx + Math.cos(a) * ringPx
      const y = cy + Math.sin(a) * ringPx
      const ground = sphereHit(s.pose, x, y, width, height)
      if (!ground) continue
      const before = project(prev.pose, ground.clone().applyQuaternion(carry), width, height)
      if (!before.front) continue
      sum += Math.hypot(x - before.x, y - before.y)
      seen++
    }
    out.speed.push(seen * 2 >= ringPoints ? (sum / seen) * w.rate : null)
  })
  return out
}
