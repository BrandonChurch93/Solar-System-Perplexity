import * as THREE from 'three'
import { writeFileSync } from 'node:fs'
import { loadConfig } from '../../../../tools/lib/common'
import { plans } from '../../../../src/director/plans'
const cfg = loadConfig()
const fps = (cfg.raw as any).fps ?? 30
const plan = plans.find((p) => p.id === 'saturn')! as any
const n: THREE.Vector3 = plan.ringNormal
const rows: number[][] = []
for (let k = 3380 * 2; k <= 3890 * 2; k++) {
  const fr = k / 2
  const pose = plan.flight(fr / fps)
  const p: THREE.Vector3 = pose.position
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(pose.quaternion)
  rows.push([fr, p.length(), p.dot(n), pose.vfov, p.x, p.y, p.z, fwd.x, fwd.y, fwd.z])
}
writeFileSync(process.argv[2]!, JSON.stringify(rows))
console.log('rows', rows.length)
