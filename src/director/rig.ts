import * as THREE from 'three'
import gsap from 'gsap'
import { stream } from '../core/random'
import type { Pose } from '../core/types'

export type Ease = (t: number) => number

export function ease(name: string): Ease {
  const f = gsap.parseEase(name)
  return (t) => f(Math.min(Math.max(t, 0), 1))
}

export const clamp01 = (t: number): number => Math.min(Math.max(t, 0), 1)
export const smooth = (t: number): number => {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}
export const smoother = (t: number): number => {
  const x = clamp01(t)
  return x * x * x * (x * (x * 6 - 15) + 10)
}
export const softSmooth = (t: number, lead: number): number => {
  const x = clamp01(t)
  const s = Math.min(x / lead, 1)
  return x * x * (3 - 2 * x) - 3 * lead * lead * s * s * (1 - s) * (1 - s) * (1 - s)
}
export const ramp = (a: number, b: number, t: number): number => clamp01((t - a) / (b - a))
export const mix = (a: number, b: number, t: number): number => a + (b - a) * t

const M = new THREE.Matrix4()

export function lookAt(position: THREE.Vector3, target: THREE.Vector3, up: THREE.Vector3, rollDeg = 0): THREE.Quaternion {
  M.lookAt(position, target, up)
  const q = new THREE.Quaternion().setFromRotationMatrix(M)
  if (rollDeg !== 0) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(rollDeg)))
  return q
}

export function forward(q: THREE.Quaternion): THREE.Vector3 {
  return new THREE.Vector3(0, 0, -1).applyQuaternion(q)
}

export function blendPose(a: Pose, b: Pose, w: number): Pose {
  if (w <= 0) return a
  if (w >= 1) return b
  return { position: a.position.clone().lerp(b.position, w), quaternion: a.quaternion.clone().slerp(b.quaternion, w), vfov: mix(a.vfov, b.vfov, w) }
}

export function slerpDir(a: THREE.Vector3, b: THREE.Vector3, t: number): THREE.Vector3 {
  const d = Math.min(Math.max(a.dot(b), -1), 1)
  const ang = Math.acos(d)
  if (ang < 1e-6) return a.clone()
  const s = Math.sin(ang)
  return a.clone().multiplyScalar(Math.sin((1 - t) * ang) / s).addScaledVector(b, Math.sin(t * ang) / s)
}

export function arc(from: THREE.Vector3, to: THREE.Vector3): THREE.Quaternion {
  return new THREE.Quaternion().setFromUnitVectors(from.clone().normalize(), to.clone().normalize())
}

interface Wave { f: number; p: number; a: number }
const waves: Wave[][] = []
{
  const r = stream('camera-drift')
  for (let axis = 0; axis < 3; axis++) {
    const list: Wave[] = []
    for (let i = 0; i < 4; i++) list.push({ f: r.range(0.05, 0.42), p: r.range(0, Math.PI * 2), a: r.range(0.5, 1) / (i + 1) })
    waves.push(list)
  }
}

const DRIFT_RAD = 0.0011

export function drift(time: number, amount = 1): THREE.Quaternion {
  const v = [0, 0, 0]
  for (let axis = 0; axis < 3; axis++) for (const w of waves[axis]!) v[axis]! += w.a * Math.sin(time * w.f * Math.PI * 2 + w.p)
  const e = new THREE.Euler(v[0]! * DRIFT_RAD * amount, v[1]! * DRIFT_RAD * amount, v[2]! * DRIFT_RAD * 0.5 * amount, 'YXZ')
  return new THREE.Quaternion().setFromEuler(e)
}
