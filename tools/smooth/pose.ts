import * as THREE from 'three'
import { setCapture, spanMid } from '../../src/core/clock'
import type { ViewKind } from '../../src/core/types'
import { RANGE_LOW, RANGE_OCTAVES } from '../../src/diagnostics/diag'
import type { FilmDirector } from '../../src/director/film'
import { sideAt } from '../../src/director/handover'
import type { StopPlan } from '../../src/director/moves'
import { segmentAtFrame } from '../../src/director/timeline'
import { carriedCamera } from './camera'

export interface PoseBody { id: string; place: number[]; turn: number[]; scale: number[]; axes: number[]; shape?: number[]; flows?: number; light?: number }

export interface PoseNear { id: string; place: number[]; turn?: number[]; reach: number; sheet?: { normal: number[]; inner: number; thick: number }; flows?: number; light?: number }

export interface Bodied { drawnBodies(view: ViewKind, eye: THREE.Vector3, time: number): PoseNear[] }

export interface Seated { drawnSeat(time: number): THREE.Quaternion }

export interface Shaped { drawnShape(view: ViewKind, eye: THREE.Vector3, time: number): { shape: number[]; place?: number[] } | null }

export interface PoseLens { vfov: number; width: number; height: number }

export interface Flowing { drawnFlow(view: ViewKind, eye: THREE.Vector3, time: number, lens: PoseLens): number | null }

export interface Lit { drawnLight(view: ViewKind, eye: THREE.Vector3, time: number): number | null }

export interface PoseRecord {
  k: number
  rate: number
  time: number
  view: ViewKind
  camera: { p: number[]; q: number[]; vfov: number; near: number; width: number; height: number }
  // The lens against the sky as it is seen: the sky camera of the shot with the seen turn of the sky taken out (Shot.skyTurnSeen, the
  // shot's skyTurn where the film gives none), so that two records carry the sky between them as the picture does.
  sky: { q: number[] }
  range: { low: number; octaves: number; units: number[] }
  bodies: [PoseBody, ...PoseNear[]]
}

export function poseRecord(film: FilmDirector, plan: StopPlan, k: number, rate: number, fps: number, size: { width: number; height: number }): PoseRecord {
  setCapture(rate)
  const at = k / rate
  const time = (at + spanMid()) / fps
  const c = carriedCamera(film, plan, plan.id, at, time)
  const seg = segmentAtFrame(at)
  const shot = film.shotAt(at, time, seg.stop === plan.id && (seg.kind === 'dive' || seg.kind === 'rise') ? sideAt(seg, time) : undefined)
  const still = new THREE.Quaternion()
  const close = plan.twin({ position: new THREE.Vector3(1, 0, 0), quaternion: still, vfov: c.pose.vfov }, time).position.distanceTo(plan.twin({ position: new THREE.Vector3(), quaternion: still, vfov: c.pose.vfov }, time).position)
  const two = Number.isFinite(close) && close > 0 && Math.abs(close - 1) > 1e-9
  const globe = plan.fit.globe
  const drawn = (plan as { drawn?: (time: number) => THREE.Quaternion }).drawn
  const seat = (plan as Partial<Seated>).drawnSeat
  const lens = seat ? c.pose.quaternion.clone().multiply(seat.call(plan, time).invert()) : c.pose.quaternion
  const form = (plan as Partial<Shaped>).drawnShape?.call(plan, c.side, c.pose.position, time) ?? null
  const named = (plan as Partial<Bodied>).drawnBodies
  const flows = (plan as Partial<Flowing>).drawnFlow?.call(plan, c.side, c.pose.position, time, { vfov: c.pose.vfov, width: size.width, height: size.height }) ?? null
  const light = (plan as Partial<Lit>).drawnLight?.call(plan, c.side, c.pose.position, time) ?? null
  const some = (v: number | null): v is number => v !== null && Number.isFinite(v) && v > 0
  const others: PoseNear[] = named ? named.call(plan, c.side, c.pose.position, time) : c.side === 'orbit' ? plan.nearBodies(time).map((n, i) => ({ id: plan.id + '.near.' + i, place: n.centre.toArray(), reach: n.radius })) : []
  return {
    k,
    rate,
    time,
    view: c.side,
    camera: { p: c.pose.position.toArray(), q: lens.toArray(), vfov: c.pose.vfov, near: shot.near * (c.side === 'terrain' && two ? close : 1), width: size.width, height: size.height },
    sky: { q: (shot.skyTurnSeen ?? shot.skyTurn).clone().invert().multiply(shot.skyQuaternion).toArray() },
    range: { low: RANGE_LOW, octaves: RANGE_OCTAVES, units: two ? [1, close] : [1] },
    bodies: [{ id: plan.id, place: form?.place ?? [0, 0, 0], turn: (drawn ? drawn.call(plan, time) : plan.turn(time)).toArray(), scale: globe?.scale ?? [1, 1, 1], axes: globe?.quaternion ?? [0, 0, 0, 1], ...(form ? { shape: form.shape } : {}), ...(some(flows) ? { flows } : {}), ...(some(light) ? { light } : {}) }, ...others],
  }
}
