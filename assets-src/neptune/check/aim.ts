import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
const director = new FilmDirector(plans)
const DEG = 180 / Math.PI
const f = Number(process.argv[2] ?? 4605)
const shot: any = director.shotAt(f, f / config.fps)
const s = shot.sets.find((x: any) => x.id === 'neptune')
const rot = s.rotation as THREE.Quaternion
const inv = (shot.camera.quaternion as THREE.Quaternion).clone().invert()
const c = (s.origin as THREE.Vector3).clone().sub(shot.camera.position)
const toCentre = c.clone().normalize()
const show = (name: string, w: THREE.Vector3) => {
  const flat = w.clone().addScaledVector(toCentre, -w.dot(toCentre)).applyQuaternion(inv)
  console.log(name, 'screen angle deg (0 right, positive down)', (Math.atan2(-flat.y, flat.x) * DEG).toFixed(1), 'toward the camera', (-w.dot(toCentre)).toFixed(3))
}
show('sun', (shot.sun.dir as THREE.Vector3).clone())
for (const a of process.argv.slice(3)) {
  const v = new THREE.Vector3().fromArray(a.split(',').map(Number)).normalize()
  show('local ' + a, v.clone().applyQuaternion(rot))
}
if (process.argv.includes('--local')) {
  const li = rot.clone().invert()
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(shot.camera.quaternion)
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(shot.camera.quaternion)
  for (const deg of [-20, -10, 0, 5, 10, 15, 18, 20, 30]) {
    const t = deg / DEG
    const w = right.clone().multiplyScalar(Math.cos(t)).addScaledVector(up, -Math.sin(t))
    w.addScaledVector(toCentre, -w.dot(toCentre)).normalize()
    const tilt = Math.asin((s.scale ?? 1) / c.length())
    w.multiplyScalar(Math.cos(tilt)).addScaledVector(toCentre, -Math.sin(tilt))
    console.log('limb at', deg, 'local', w.clone().applyQuaternion(li).toArray().map((x) => x.toFixed(4)).join(', '), 'sun dot', w.dot(shot.sun.dir).toFixed(3))
  }
}
