import * as THREE from 'three'
import { config } from '../../../src/config'
import { plans } from '../../../src/director/plans'
import close from '../../../src/stops/neptune/close.json'

const plan = plans.find((p) => p.id === 'neptune')!
const out: Record<string, { centre: number[]; alphaDeg: number; view: string; vfov: number }> = {}
for (const f of process.argv.slice(2).join(',').split(',').map(Number)) {
  const t = (f + 0.25) / config.fps
  const d = plan.seg.dive!
  const s = t < d.start ? { pose: plan.hold(t - plan.seg.hold.start), view: 'orbit' } : t < d.end ? plan.dive(t) : t < plan.seg.terrain.end ? { pose: plan.terrain(t - plan.seg.terrain.start), view: 'terrain' } : plan.rise(t)
  const c = s.view === 'orbit' ? s.pose.position.clone().negate() : new THREE.Vector3().fromArray(close.nadir).multiplyScalar(close.radius + 1).sub(s.pose.position).divideScalar(close.radius)
  const alpha = Math.asin(Math.min(1 / c.length(), 1))
  c.normalize().applyQuaternion(s.pose.quaternion.clone().invert())
  out[f] = { centre: [c.x, c.y, c.z], alphaDeg: THREE.MathUtils.radToDeg(alpha), view: s.view, vfov: s.pose.vfov }
}
console.log(JSON.stringify(out))
