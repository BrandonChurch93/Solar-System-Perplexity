// The offset of a north up rise end that keeps the forward of the rise end in the tree. Run with the level end in plan.ts (rise.level true, the offset of main): npx tsx assets-src/mars/place/riseoffset.ts
import * as THREE from 'three'
import { plans } from '../../../src/director/plans'
const p = plans.find((x) => x.id === 'mars')! as any
const r = p.riseEnd
const f = new THREE.Vector3(0, 0, -1).applyQuaternion(r.quaternion)
const up = new THREE.Vector3(0, 1, 0).applyQuaternion(r.quaternion)
const pos = r.position.clone()
const Y = new THREE.Vector3(0, 1, 0)
const q0 = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(pos, new THREE.Vector3(), Y))
const n = pos.clone().normalize()
const t = -pos.dot(n) / f.dot(n)
const target = pos.clone().addScaledVector(f, t)
const local = target.clone().applyQuaternion(q0.clone().invert())
const fit = p.fit
const half = Math.tan(THREE.MathUtils.degToRad(fit.vfovDeg) / 2) * p.p.rise.distance
console.log('forward', f.toArray(), 'up', up.toArray())
console.log('pos', pos.toArray(), 'local target', local.toArray())
console.log('offset', [-local.x / (half * fit.aspect), -local.y / half])
