import * as THREE from 'three'
import { config } from '../config'
import { handoverOf } from '../director/handover'
import { segmentAtFrame } from '../director/timeline'
import { sampleCount, shutterMid } from './sampler'
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

export interface FramePlan { samples: number; raw: number; seen: number; soft: number; split: boolean }

export function framePlan(source: ShotSource, frame: number, tier: string): FramePlan {
  const segment = segmentAtFrame(frame)
  const base = sampleCount(tier, segment.kind)
  const cap = config.tiers[tier]!.maxSamplesPerFrame
  const at = (offset: number, side?: ViewKind): Shot => source.shotAt(frame, (frame + offset) / config.fps, side)
  const h = segment.kind === 'dive' || segment.kind === 'rise' ? handoverOf(segment.stop, segment.kind) : null
  if (h && frame >= h.firstFrame && frame <= h.lastFrame) {
    const sides: ViewKind[] = ['orbit', 'terrain']
    const raw = Math.max(...sides.map((side) => rawMotion(at(0, side), at(shutterMid(), side), at(config.shutterFraction, side))))
    return { samples: cap <= base ? base : samplesNeeded(base, cap, raw), raw, seen: raw, soft: 0, split: true }
  }
  const mid = at(shutterMid())
  const raw = rawMotion(at(0), mid, at(config.shutterFraction))
  const seen = raw * seenShare(mid)
  return { samples: cap <= base ? base : samplesNeeded(base, cap, seen), raw, seen, soft: h ? 0 : softness(raw), split: false }
}

export function frameSamples(source: ShotSource, frame: number, tier: string): number {
  return framePlan(source, frame, tier).samples
}
