import type * as THREE from 'three'
import { setCapture, spanMid } from '../../src/core/clock'
import type { ViewKind } from '../../src/core/types'
import { RANGE_LOW, RANGE_OCTAVES } from '../../src/diagnostics/diag'
import type { FilmDirector } from '../../src/director/film'
import { sideAt } from '../../src/director/handover'
import type { StopPlan } from '../../src/director/moves'
import { segmentAtFrame } from '../../src/director/timeline'
import { carriedCamera } from './camera'

export interface PoseBody { id: string; place: number[]; turn: number[]; scale: number[]; axes: number[]; shape?: number[] }

export interface Shaped { drawnShape(view: ViewKind, eye: THREE.Vector3, time: number): { shape: number[]; place?: number[] } | null }

export interface PoseRecord {
  k: number
  rate: number
  time: number
  view: ViewKind
  camera: { p: number[]; q: number[]; vfov: number; width: number; height: number }
  sky: { q: number[] }
  range: { low: number; octaves: number; units: number[] }
  bodies: PoseBody[]
}

export function poseRecord(film: FilmDirector, plan: StopPlan, k: number, rate: number, fps: number, size: { width: number; height: number }): PoseRecord {
  setCapture(rate)
  const at = k / rate
  const time = (at + spanMid()) / fps
  const c = carriedCamera(film, plan, plan.id, at, time)
  const seg = segmentAtFrame(at)
  const shot = film.shotAt(at, time, seg.stop === plan.id && (seg.kind === 'dive' || seg.kind === 'rise') ? sideAt(seg, time) : undefined)
  const close = plan.twinFrame(time).scale
  const globe = plan.fit.globe
  const drawn = (plan as { drawn?: (time: number) => THREE.Quaternion }).drawn
  const form = (plan as Partial<Shaped>).drawnShape?.call(plan, c.side, c.pose.position, time) ?? null
  return {
    k,
    rate,
    time,
    view: c.side,
    camera: { p: c.pose.position.toArray(), q: c.pose.quaternion.toArray(), vfov: c.pose.vfov, width: size.width, height: size.height },
    sky: { q: shot.skyTurn.clone().invert().multiply(shot.skyQuaternion).toArray() },
    range: { low: RANGE_LOW, octaves: RANGE_OCTAVES, units: Number.isFinite(close) && close > 0 ? [1, close] : [1] },
    bodies: [{ id: plan.id, place: form?.place ?? [0, 0, 0], turn: (drawn ? drawn.call(plan, time) : plan.turn(time)).toArray(), scale: globe?.scale ?? [1, 1, 1], axes: globe?.quaternion ?? [0, 0, 0, 1], ...(form ? { shape: form.shape } : {}) }],
  }
}
