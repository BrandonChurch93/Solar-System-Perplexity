import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan, skim } from '../../../src/stops/saturn/plan'
const args = process.argv.slice(2)
for (const a of args.filter((x) => x.includes('='))) { const [k, v] = a.split('='); (skim as any)[k!] = Number(v) }
const nums = args.filter((x) => !x.includes('=')).map(Number)
const from = nums[0] ?? 3540, to = nums[1] ?? 3630, step = nums[2] ?? 3
const H = 1080
const pt = (pose: any, p: THREE.Vector3): [number, number, number] => {
  const v = p.clone().sub(pose.position).applyQuaternion(pose.quaternion.clone().invert())
  const f = (H / 2) / Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  return [v.x / -v.z * f + 960, -v.y / -v.z * f + 540, -v.z]
}
const poseAt = (time: number): any => {
  const seg = plan.seg
  if (time >= seg.terrain.start && time < seg.terrain.end) return plan.skimAt(time)
  if (time >= seg.rise.end) return plan.after(time)
  const shot: any = seg.dive && time >= seg.dive.start && time < seg.dive.end ? plan.dive(time) : time >= seg.rise.start && time < seg.rise.end ? plan.rise(time) : { pose: plan.hold(time - seg.hold.start), view: 'orbit' }
  return shot.view === 'terrain' ? { position: shot.pose.position.clone().applyQuaternion(plan.terrainFrame).add(plan.spot), quaternion: plan.terrainFrame.clone().multiply(shot.pose.quaternion), vfov: shot.pose.vfov } : shot.pose
}
const centre = new THREE.Vector3(0, 0, 0)
const spot = plan.skimPosition.clone().addScaledVector(plan.ringNormal, -plan.skimPosition.dot(plan.ringNormal)).addScaledVector(plan.skimForward, 0.6)
let last: [number, number, number] | null = null
let lastS: [number, number, number] | null = null
for (let f = from; f <= to; f += step) {
  const a = poseAt(f / config.fps)
  const c = pt(a, centre), s = pt(a, spot)
  const fpx = (H / 2) / Math.tan(THREE.MathUtils.degToRad(a.vfov) / 2)
  const size = fpx / a.position.length()
  const v = last ? [(c[0] - last[0]) / step, (c[1] - last[1]) / step] : [0, 0]
  const vs = lastS ? [(s[0] - lastS[0]) / step, (s[1] - lastS[1]) / step] : [0, 0]
  console.log(f, 'centre', c[0].toFixed(0).padStart(6), c[1].toFixed(0).padStart(6), 'v', v[0]!.toFixed(1).padStart(6), v[1]!.toFixed(1).padStart(6), 'radius px', size.toFixed(0).padStart(5), 'dist', a.position.length().toFixed(3), 'h', a.position.dot(plan.ringNormal).toFixed(3), 'vfov', a.vfov.toFixed(1), 'spot', s[0].toFixed(0).padStart(6), s[1].toFixed(0).padStart(6), 'v', vs[0]!.toFixed(1).padStart(6), vs[1]!.toFixed(1).padStart(6))
  last = c
  lastS = s
}
