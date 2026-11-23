import * as THREE from 'three'
import type { Pose } from '../../core/types'

// One move between two motions that both run on in time. At its start the move is the first motion,
// pose, speed and turn rate; at its end it is the second. Between them the height above the unit sphere
// changes by a steady ratio per frame, and one point of the body (the anchor) is held in the frame.
// All poses are globe side poses: plan frame, the body a unit sphere about the origin.

export interface MoveShape { rate: [number, number]; turn: [number, number]; keep: [number, number]; lens: [number, number] }

const clamp01 = (x: number): number => Math.min(Math.max(x, 0), 1)

export const smoother = (x: number): number => {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

const area = (x: number): number => {
  const t = clamp01(x)
  const t4 = t * t * t * t
  return t4 * (t * t - 3 * t + 2.5)
}

// Share of the whole change of log height done at u: the rate rises over a, is constant, falls over b.
export const steady = (u: number, a: number, b: number): number => {
  const x = clamp01(u)
  const total = 1 - (a + b) / 2
  if (x < a) return (a * area(x / a)) / total
  if (x <= 1 - b) return (a / 2 + x - a) / total
  const y = (x - (1 - b)) / b
  return (a / 2 + 1 - a - b + b * (y - area(y))) / total
}

const window = (u: number, w: [number, number]): number => smoother((u - w[0]) / (w[1] - w[0]))

const seen = (pose: Pose, point: THREE.Vector3): [number, number] => {
  const d = point.clone().sub(pose.position).applyQuaternion(pose.quaternion.clone().invert())
  const t = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  return [d.x / -d.z / t, d.y / -d.z / t]
}

export function between(a: Pose, b: Pose, anchor: THREE.Vector3, u: number, shape: MoveShape): Pose {
  if (u <= 0) return a
  if (u >= 1) return b
  const ha = a.position.length() - 1
  const hb = b.position.length() - 1
  const h = Math.exp(Math.log(ha) + (Math.log(hb) - Math.log(ha)) * steady(u, shape.rate[0], shape.rate[1]))
  const quaternion = a.quaternion.clone().slerp(b.quaternion, window(u, shape.turn))
  const ta = Math.tan(THREE.MathUtils.degToRad(a.vfov) / 2)
  const tb = Math.tan(THREE.MathUtils.degToRad(b.vfov) / 2)
  const t = Math.exp(Math.log(ta) + (Math.log(tb) - Math.log(ta)) * window(u, shape.lens))
  const sa = seen(a, anchor)
  const sb = seen(b, anchor)
  const k = window(u, shape.keep)
  const ray = new THREE.Vector3((sa[0] + (sb[0] - sa[0]) * k) * t, (sa[1] + (sb[1] - sa[1]) * k) * t, -1).normalize().applyQuaternion(quaternion)
  const along = anchor.dot(ray)
  const range = along + Math.sqrt(along * along + h * (2 + h))
  return { position: anchor.clone().addScaledVector(ray, -range), quaternion, vfov: THREE.MathUtils.radToDeg(Math.atan(t)) * 2 }
}
