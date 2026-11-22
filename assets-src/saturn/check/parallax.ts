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
const vf = (plan as any).p.terrain.vfov as number
const f = (1584 / 2) / Math.tan(THREE.MathUtils.degToRad(vf) / 2)
const onPlane = (x: number, y: number): THREE.Vector3 => {
  const d = new THREE.Vector3((x - 1408) / f, (792 - y) / f, -1).applyQuaternion(plan.skimQuaternion)
  const t = -plan.skimPosition.dot(plan.ringNormal) / d.dot(plan.ringNormal)
  return plan.skimPosition.clone().addScaledVector(d, t)
}
const J = onPlane(1383, 718)
const far = onPlane(1383, 660)
console.log('junction point radius', J.length().toFixed(3), 'distance from skim camera', J.distanceTo(plan.skimPosition).toFixed(3), 'far point radius', far.length().toFixed(3), 'distance', far.distanceTo(plan.skimPosition).toFixed(3))
for (const fr of process.argv.slice(2).map(Number)) {
  const p = poseAt(fr / config.fps)
  const a = J.clone().sub(plan.skimPosition).normalize()
  const b = J.clone().sub(p.position).normalize()
  const px = (1080 / 2) / Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)
  const pr = (q: THREE.Vector3): [number, number] => { const v = q.clone().sub(p.position).applyQuaternion(p.quaternion.clone().invert()); return [v.x / -v.z * px + 960, -v.y / -v.z * px + 540] }
  const pj = pr(J), pf = pr(far)
  const c = new THREE.Vector3(0, 0, 0).sub(p.position)
  const dc = c.length()
  const limbAng = Math.asin(Math.min(1 / dc, 1))
  const toJ = J.clone().sub(p.position).normalize()
  const angJ = toJ.angleTo(c.clone().normalize())
  console.log(fr, 'theta deg', THREE.MathUtils.radToDeg(a.angleTo(b)).toFixed(2), 'junction on screen', pj[0].toFixed(0), pj[1].toFixed(0), 'far', pf[0].toFixed(0), pf[1].toFixed(0), 'junction outside the sphere limb by deg', THREE.MathUtils.radToDeg(angJ - limbAng).toFixed(2), 'px', ((angJ - limbAng) * px).toFixed(0))
}
