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
const n = plan.ringNormal.clone().normalize()
const u = new THREE.Vector3(1, 0, 0).addScaledVector(n, -n.x).normalize()
const v = n.clone().cross(u)
for (const fr of process.argv.slice(2).map(Number)) {
  const p = poseAt(fr / config.fps)
  const px = (1080 / 2) / Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)
  const inv = p.quaternion.clone().invert()
  const pr = (q: THREE.Vector3): [number, number, number] => { const w = q.clone().sub(p.position).applyQuaternion(inv); return [w.x / -w.z * px + 960, -w.y / -w.z * px + 540, -w.z] }
  const cu = p.position.dot(u), cv = p.position.dot(v)
  const rad = Math.hypot(cu, cv) / 2
  const out: string[] = []
  for (let k = 0; k < 20000; k++) {
    const a = k / 20000 * Math.PI * 2
    const P = u.clone().multiplyScalar(cu / 2 + rad * Math.cos(a)).addScaledVector(v, cv / 2 + rad * Math.sin(a))
    const s = pr(P)
    if (s[2] > 0 && s[0] > 760 && s[0] < 1040 && s[1] > 380 && s[1] < 620 && k % 40 === 0) out.push(`${s[0].toFixed(0)},${s[1].toFixed(0)} r ${P.length().toFixed(3)}`)
  }
  console.log(fr, 'camera height over the ring plane', p.position.dot(n).toFixed(4), 'distance', p.position.length().toFixed(3), out.join(' | '))
}
