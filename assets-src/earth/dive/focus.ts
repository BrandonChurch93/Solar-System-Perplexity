import * as THREE from 'three'
import { config } from '../../../src/config'
import type { Pose } from '../../../src/core/types'

const { plan } = (await import(process.env.EARTH_PLAN ?? '../../../src/stops/earth/plan')) as typeof import('../../../src/stops/earth/plan')

for (const kind of ['dive', 'rise'] as const) {
  const seg = kind === 'dive' ? plan.seg.dive! : plan.seg.rise
  const k = plan.p.coverRush!
  const h = 0.125 / config.fps
  const sign = kind === 'dive' ? 1 : -1
  const c = plan.coverCenter(seg)
  const at = (t: number): Pose => (kind === 'dive' ? plan.dive(t) : plan.rise(t)).pose
  const from = at(sign > 0 ? c : c - 2 * h)
  const v = at(sign > 0 ? c + h : c - h).position.clone().sub(from.position).multiplyScalar(sign).applyQuaternion(from.quaternion.clone().invert())
  const flat = Math.hypot(v.x, v.y)
  const reach = v.z < 0 ? Math.min(flat / -v.z, k.reach) : k.reach
  const th = Math.tan(THREE.MathUtils.degToRad(from.vfov) / 2)
  const f = flat > 1e-9 ? [(v.x / flat) * reach, (v.y / flat) * reach] : [0, 0]
  console.log(kind, 'centre frame', (c * config.fps).toFixed(2), 'v', v.toArray().map((x) => x.toExponential(2)).join(' '), 'focus', f.map((x) => x.toFixed(3)).join(' '), 'in half heights', (f[0]! / th).toFixed(2), (f[1]! / th).toFixed(2))
}
