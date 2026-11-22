import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/saturn/plan'
const poseAt = (time: number): any => {
  const seg = plan.seg
  if (time >= seg.terrain.start && time < seg.terrain.end) return plan.skimAt(time)
  if (time >= seg.rise.end) return plan.after(time)
  const shot: any = seg.dive && time >= seg.dive.start && time < seg.dive.end ? plan.dive(time) : time >= seg.rise.start && time < seg.rise.end ? plan.rise(time) : { pose: plan.hold(time - seg.hold.start), view: 'orbit' }
  return shot.view === 'terrain' ? { position: shot.pose.position.clone().applyQuaternion(plan.terrainFrame).add(plan.spot), quaternion: plan.terrainFrame.clone().multiply(shot.pose.quaternion), vfov: shot.pose.vfov, view: 'terrain' } : { ...shot.pose, view: shot.view ?? 'orbit' }
}
const smooth = (x: number): number => { const t = Math.min(Math.max(x, 0), 1); return t * t * (3 - 2 * t) }
for (const f of process.argv.slice(2).map(Number)) {
  const t = f / config.fps
  const p = poseAt(t)
  const away = p.position.distanceTo(plan.skimPosition)
  const seg = plan.seg
  const view = t >= seg.terrain.start && t < seg.terrain.end ? 'terrain' : p.view
  console.log(f, view, 'away', away.toFixed(3), 'skimW', (1 - smooth((away - 0.5) / 0.6)).toFixed(3), 'height', p.position.dot(plan.ringNormal).toFixed(4), 'dist', p.position.length().toFixed(3), 'patch orbit', plan.patchWeight(t, 'orbit').toFixed(3), 'terrain', plan.patchWeight(t, 'terrain').toFixed(3))
}
