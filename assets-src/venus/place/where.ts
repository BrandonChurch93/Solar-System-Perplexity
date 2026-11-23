import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/venus/plan'
import place from '../../../src/stops/venus/place.json'
import fit from '../../../src/stops/venus/fit.json'
const globe = new THREE.Quaternion().fromArray(fit.globe.quaternion)
const body = new THREE.Vector3().fromArray(place.place.under.direction)
for (const fr of [1110, 1185, 1259, 1287, 1300]) {
  const time = (fr + config.shutterFraction * 0.5) / config.fps
  const p = body.clone().applyQuaternion(globe).applyQuaternion(plan.turn(time))
  const pose = fr < 1260 ? plan.hold(time - plan.seg.hold.start) : plan.dive(time).pose
  const c = p.clone().sub(pose.position).applyQuaternion(pose.quaternion.clone().invert())
  const th = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  const cosv = p.dot(pose.position.clone().sub(p).normalize())
  const sun = p.dot(plan.lightDir)
  console.log(fr, 'place px', (0.5 + c.x / -c.z / (2 * th * 16 / 9)).toFixed(4), (0.5 - c.y / -c.z / (2 * th)).toFixed(4), 'view cos', cosv.toFixed(3), 'sun elev', THREE.MathUtils.radToDeg(Math.asin(sun)).toFixed(2), 'dist', pose.position.length().toFixed(3))
}
