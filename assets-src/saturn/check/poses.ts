import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/saturn/plan'

const frames = process.argv.slice(2).map(Number)
const toTilt = new THREE.Quaternion().fromArray(plan.fit.globe.quaternion).invert()
const out: Record<string, unknown> = {}
const put = (p: THREE.Vector3, q: THREE.Quaternion, vfov: number) => ({ position: p.clone().applyQuaternion(toTilt).toArray(), quaternion: toTilt.clone().multiply(q).toArray(), vfov })
out.skim = put(plan.skimPosition, plan.skimQuaternion, plan.p.terrain.vfov)
for (const f of frames) {
  const time = (f + config.shutterFraction / 2) / config.fps
  const seg = plan.seg
  let pose
  if (time >= seg.terrain.start && time < seg.terrain.end) pose = plan.skimAt(time)
  else {
    const shot = seg.dive && time >= seg.dive.start && time < seg.dive.end ? plan.dive(time) : time >= seg.rise.start && time < seg.rise.end ? plan.rise(time) : { pose: plan.hold(time - seg.hold.start), view: 'orbit' as const }
    pose = shot.view === 'terrain' ? { position: shot.pose.position.clone().applyQuaternion(plan.terrainFrame).add(plan.spot), quaternion: plan.terrainFrame.clone().multiply(shot.pose.quaternion), vfov: shot.pose.vfov } : shot.pose
  }
  out[String(f)] = put(pose.position, pose.quaternion, pose.vfov)
}
console.log(JSON.stringify(out))
