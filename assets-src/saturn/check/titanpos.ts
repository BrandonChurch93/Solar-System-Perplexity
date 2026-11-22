import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/saturn/plan'
import * as look from '../../../src/stops/saturn/look'
const t = 3465 / config.fps
const pose: any = plan.hold(t - plan.seg.hold.start)
const p = pose.position as THREE.Vector3, q = pose.quaternion as THREE.Quaternion
const f = 540 / Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
const elapsed = t - plan.holdMid
const turn = new THREE.Quaternion().setFromAxisAngle(plan.axis, THREE.MathUtils.degToRad((plan as any).p.moonDegPerSecond) * elapsed)
const home = new THREE.Vector3().fromArray(look.titan.home)
const at = home.clone().applyQuaternion(turn)
const v = at.clone().sub(p).applyQuaternion(q.clone().invert())
console.log('elapsed', elapsed, 'vfov', pose.vfov, 'screen', (v.x / -v.z * f + 960).toFixed(2), (-v.y / -v.z * f + 540).toFixed(2), 'depth', (-v.z).toFixed(3))
const dx = Number(process.argv[2] ?? 0), dy = Number(process.argv[3] ?? 0)
const right = new THREE.Vector3(1, 0, 0).applyQuaternion(q), up = new THREE.Vector3(0, 1, 0).applyQuaternion(q)
const moved = at.clone().addScaledVector(right, dx * -v.z / f).addScaledVector(up, -dy * -v.z / f).applyQuaternion(turn.clone().invert())
console.log('new home', moved.toArray().map((x) => Number(x.toFixed(6))))
