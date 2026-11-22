import * as THREE from 'three'
import { readFileSync } from 'node:fs'
import { plan } from '../../../src/stops/saturn/plan'
const pts = JSON.parse(readFileSync(process.argv[2]!, 'utf8')) as [number, number][]
const polar = Number(process.argv[3] ?? 0.902)
const vf = (plan as any).p.terrain.vfov as number
const f = (1584 / 2) / Math.tan(THREE.MathUtils.degToRad(vf) / 2)
const tilt = new THREE.Quaternion().fromArray(plan.fit.globe.quaternion)
const toTilt = tilt.clone().invert()
const cam = plan.skimPosition.clone().applyQuaternion(toTilt)
const q = toTilt.clone().multiply(plan.skimQuaternion)
const rt = (x: number, y: number, p: number): number => {
  const d = new THREE.Vector3((x - 1408) / f, (792 - y) / f, -1).applyQuaternion(q)
  const c = new THREE.Vector3(cam.x, cam.y / p, cam.z)
  const e = new THREE.Vector3(d.x, d.y / p, d.z).normalize()
  const along = -c.dot(e)
  return Math.sqrt(Math.max(c.lengthSq() - along * along, 0))
}
console.log('camera local', cam.toArray().map((v) => v.toFixed(4)).join(' '), 'polar', polar)
for (const [x, y] of pts) {
  const r0 = rt(x, y, polar)
  const gx = rt(x + 1, y, polar) - r0
  const gy = rt(x, y + 1, polar) - r0
  const g = Math.hypot(gx, gy)
  console.log(y.toFixed(0), x.toFixed(0), 'rt', r0.toFixed(5), 'model limb inside the trace by px (2816 scale)', ((r0 - 1) / g).toFixed(2), 'normal', (gx / g).toFixed(2), (gy / g).toFixed(2))
}
