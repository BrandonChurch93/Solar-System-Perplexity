import * as THREE from 'three'
import { config } from '../../../src/config'
import type { StopPlan } from '../../../src/director/moves'

export interface Row { f: number; view: string; h: number; px: number; rate: number; motion: number; cover: number; top: number; tilt: number }

type P = { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }
const RAD = Math.PI / 180

export function motionOf(open: P, mid: P, close: P): number {
  const [cols, rows] = config.motion.probeGrid as [number, number]
  const half = 540
  const aspect = 16 / 9
  const tan = Math.tan((mid.vfov * RAD) / 2)
  const seen = (p: P, local: THREE.Vector3): THREE.Vector2 | null => {
    const v = local.clone().sub(p.position).applyQuaternion(p.quaternion.clone().invert())
    if (v.z > -1e-9) return null
    const k = half / Math.tan((p.vfov * RAD) / 2) / -v.z
    return new THREE.Vector2(v.x * k, v.y * k)
  }
  let most = 0
  const track = (local: THREE.Vector3): void => {
    const a = seen(open, local)
    const b = seen(close, local)
    if (a && b) most = Math.max(most, a.distanceTo(b))
  }
  const eye = mid.position
  const distance = eye.length()
  const radius = distance > 1 ? (half / tan) * Math.tan(Math.asin(1 / distance)) : Infinity
  const c = seen(mid, new THREE.Vector3())
  if (c && Math.abs(c.x) <= half * aspect + radius && Math.abs(c.y) <= half + radius) track(new THREE.Vector3())
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const ray = new THREE.Vector3(((x / (cols - 1)) * 2 - 1) * tan * aspect, ((y / (rows - 1)) * 2 - 1) * tan, -1).normalize().applyQuaternion(mid.quaternion)
      const along = -eye.dot(ray)
      const disc = along * along - eye.lengthSq() + 1
      if (disc <= 0) continue
      const t = along - Math.sqrt(disc)
      if (t <= 0) continue
      track(eye.clone().addScaledVector(ray, t))
    }
  return most
}

export function rows(plan: StopPlan, kind: 'dive' | 'rise', first: number, last: number): Row[] {
  const seg = kind === 'dive' ? plan.seg.dive! : plan.seg.rise
  const at = (t: number) => (kind === 'dive' ? plan.dive(t) : plan.rise(t))
  const limb = (p: P): number => (Math.tan(Math.asin(Math.min(1 / p.position.length(), 1))) / Math.tan((p.vfov * RAD) / 2)) * 540
  const out: Row[] = []
  for (let f = first; f <= last; f++) {
    const sh = config.shutterFraction
    const mid = at((f + sh / 2) / config.fps)
    if (mid.view !== 'orbit') continue
    const open = at(f / config.fps)
    const close = at((f + sh) / config.fps)
    const next = at((f + 1 + sh / 2) / config.fps)
    const p = mid.pose
    const down = p.position.clone().normalize().negate()
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quaternion)
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(p.quaternion)
    const off = Math.acos(THREE.MathUtils.clamp(fwd.dot(down), -1, 1))
    const lim = Math.asin(Math.min(1 / p.position.length(), 1)) - off
    const th = Math.tan((p.vfov * RAD) / 2)
    out.push({
      f, view: mid.view, h: p.position.length() - 1, px: limb(p),
      rate: next.view === 'orbit' ? 100 * Math.log(limb(next.pose) / limb(p)) : NaN,
      motion: open.view === 'orbit' && close.view === 'orbit' ? motionOf(open.pose, p, close.pose) : NaN,
      cover: plan.coverAmount(seg, (f + sh / 2) / config.fps),
      top: 0.5 - (0.5 * Math.tan(lim)) / th,
      tilt: THREE.MathUtils.radToDeg(Math.atan2(-down.dot(new THREE.Vector3(1, 0, 0).applyQuaternion(p.quaternion)), -down.dot(up))),
    })
  }
  return out
}
