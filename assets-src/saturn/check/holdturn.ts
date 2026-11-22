import * as THREE from 'three'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/saturn/plan'

const [from, to, step] = process.argv.slice(2).map(Number)
const tilt = new THREE.Quaternion().fromArray(plan.fit.globe.quaternion)
const d = new FilmDirector(plans) as any
for (let f = from!; f <= to!; f += step || 1) {
  const s = d.shotAt(f, f / config.fps)
  const set = s.sets.find((x: any) => x.id === 'saturn')
  const local = s.camera.quaternion.clone().premultiply(set.rotation.clone().invert())
  const want = plan.hold(f / config.fps - plan.seg.hold.start)
  const posL = s.camera.position.clone().sub(new THREE.Vector3(set.origin.x, set.origin.y, set.origin.z)).applyQuaternion(set.rotation.clone().invert())
  const dq = want.quaternion.clone().invert().multiply(local)
  const k = 1080 / 2 / Math.tan(THREE.MathUtils.degToRad(want.vfov) / 2)
  const fw = new THREE.Vector3(0, 0, -1).applyQuaternion(dq)
  console.log(f, 'angle deg', THREE.MathUtils.radToDeg(2 * Math.acos(Math.min(1, Math.abs(dq.w)))).toFixed(4), 'axis shift px', (-fw.x * k).toFixed(2), (fw.y * k).toFixed(2), 'position diff', posL.distanceTo(want.position).toExponential(2))
}
