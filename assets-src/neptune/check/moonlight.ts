import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { plan } from '../../../src/stops/neptune/plan'
import * as look from '../../../src/stops/neptune/look'
import fit from '../../../src/stops/neptune/fit.json'
const DEG = 180 / Math.PI
const frame = Number(process.argv[2] ?? 4605)
const turnDeg = Number(process.argv[3] ?? 0)
const home = new THREE.Vector3().fromArray((fit as any).moons[0].position)
const director = new FilmDirector(plans)
const shot: any = director.shotAt(frame, frame / config.fps)
const s = shot.sets.find((x: any) => x.id === 'neptune')
const inv = (s.rotation as THREE.Quaternion).clone().invert()
const cam = (shot.camera.position as THREE.Vector3).clone().sub(s.origin).applyQuaternion(inv)
const q = inv.clone().multiply(shot.camera.quaternion)
const toMoon = home.clone().sub(cam).normalize()
const aim = new THREE.Vector3().fromArray(look.triton.aim)
const lit = aim.clone().add(plan.lightDir)
const scale = lit.length()
lit.normalize()
const show = (name: string, l: THREE.Vector3) => {
  const v = l.clone().applyQuaternion(q.clone().invert())
  console.log(name, 'screen angle', (Math.atan2(v.y, v.x) * DEG).toFixed(1), 'phase', (l.angleTo(toMoon.clone().negate()) * DEG).toFixed(1))
}
show('true sun  ', plan.lightDir.clone())
show('aimed now ', lit)
const turned = lit.clone().applyAxisAngle(toMoon, turnDeg / DEG)
show('turned    ', turned)
console.log('aim', turned.clone().multiplyScalar(scale).sub(plan.lightDir).toArray().map((v) => Number(v.toFixed(4))).join(', '))
