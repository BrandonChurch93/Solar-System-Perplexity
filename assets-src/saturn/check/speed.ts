import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan, skim } from '../../../src/stops/saturn/plan'
const args = process.argv.slice(2)
for (const a of args.filter((x) => x.includes('='))) { const [k, v] = a.split('='); (skim as any)[k!] = Number(v) }
const frames = args.filter((x) => !x.includes('=')).map(Number)
const H = 1080
const pt = (pose: any, p: THREE.Vector3) => {
  const v = p.clone().sub(pose.position).applyQuaternion(pose.quaternion.clone().invert())
  const f = (H / 2) / Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  return [v.x / -v.z * f + 960, -v.y / -v.z * f + 540, -v.z]
}
const poseAt = (time: number) => {
  const seg = plan.seg
  if (time >= seg.terrain.start && time < seg.terrain.end) return plan.skimAt(time)
  const shot: any = seg.dive && time >= seg.dive.start && time < seg.dive.end ? plan.dive(time) : time >= seg.rise.start && time < seg.rise.end ? plan.rise(time) : { pose: plan.hold(time - seg.hold.start), view: 'orbit' }
  return shot.view === 'terrain' ? { position: shot.pose.position.clone().applyQuaternion(plan.terrainFrame).add(plan.spot), quaternion: plan.terrainFrame.clone().multiply(shot.pose.quaternion), vfov: shot.pose.vfov } : shot.pose
}
const centre = new THREE.Vector3(0, 0, 0)
const top = plan.ringNormal.clone().multiplyScalar(0.9)
for (const f of frames) {
  const t0 = f / config.fps, t1 = (f + config.shutterFraction) / config.fps
  const a = poseAt(t0), b = poseAt(t1)
  const c0 = pt(a, centre), c1 = pt(b, centre), p0 = pt(a, top), p1 = pt(b, top)
  const ang = THREE.MathUtils.radToDeg(a.quaternion.angleTo(b.quaternion))
  console.log(f, 'centre', c0.slice(0, 2).map((x) => Math.round(x)).join(','), 'blur px centre', Math.hypot(c1[0]! - c0[0]!, c1[1]! - c0[1]!).toFixed(1), 'pole', Math.hypot(p1[0]! - p0[0]!, p1[1]! - p0[1]!).toFixed(1), 'turn deg', ang.toFixed(2), 'move', a.position.distanceTo(b.position).toFixed(3), 'dist', a.position.length().toFixed(2), 'h', a.position.dot(plan.ringNormal).toFixed(2))
}
