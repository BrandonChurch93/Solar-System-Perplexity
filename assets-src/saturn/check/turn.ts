import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/saturn/plan'
const poseAt = (time: number): any => {
  const seg = plan.seg
  if (time >= seg.terrain.start && time < seg.terrain.end) return plan.skimAt(time)
  if (time >= seg.rise.end) return plan.after(time)
  const shot: any = seg.dive && time >= seg.dive.start && time < seg.dive.end ? plan.dive(time) : time >= seg.rise.start && time < seg.rise.end ? plan.rise(time) : { pose: plan.hold(time - seg.hold.start), view: 'orbit' }
  return shot.view === 'terrain' ? { position: shot.pose.position.clone().applyQuaternion(plan.terrainFrame).add(plan.spot), quaternion: plan.terrainFrame.clone().multiply(shot.pose.quaternion), vfov: shot.pose.vfov } : shot.pose
}
const ref = poseAt(3720 / config.fps)
const refHold = poseAt(3465 / config.fps)
const f0 = new THREE.Vector3(0, 0, -1).applyQuaternion(ref.quaternion)
const fh = new THREE.Vector3(0, 0, -1).applyQuaternion(refHold.quaternion)
const scr = (pose: any, dir: THREE.Vector3): string => {
  const v = dir.clone().applyQuaternion(pose.quaternion.clone().invert())
  const f = 540 / Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  return v.z < 0 ? `${(v.x / -v.z * f + 960).toFixed(0)},${(-v.y / -v.z * f + 540).toFixed(0)}` : 'behind'
}
for (const f of process.argv.slice(2).map(Number)) {
  const p = poseAt(f / config.fps)
  const fw = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quaternion)
  console.log(f, 'angle to terrain view', THREE.MathUtils.radToDeg(fw.angleTo(f0)).toFixed(1), 'to hold view', THREE.MathUtils.radToDeg(fw.angleTo(fh)).toFixed(1), 'vfov', p.vfov.toFixed(1), 'terrain view centre on screen', scr(p, f0), 'hold view centre', scr(p, fh))
}
