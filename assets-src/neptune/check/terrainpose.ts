import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
const director = new FilmDirector(plans)
let first = true
for (const a of process.argv.slice(2)) {
  const f = Number(a)
  const shot: any = director.shotAt(f, f / config.fps)
  const s = shot.sets.find((x: any) => x.id === 'neptune')
  if (first) { console.log(Object.keys(s).join(' '), 'scale', s.scale, 'view', s.view); first = false }
  const inv = (s.rotation as THREE.Quaternion).clone().invert()
  const p = (shot.camera.position as THREE.Vector3).clone().sub(s.origin).applyQuaternion(inv).divideScalar(s.scale ?? 1)
  const q = inv.clone().multiply(shot.camera.quaternion)
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(q)
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(q)
  const pitch = THREE.MathUtils.radToDeg(Math.asin(-fwd.y))
  const yaw = THREE.MathUtils.radToDeg(Math.atan2(fwd.x, -fwd.z))
  const roll = THREE.MathUtils.radToDeg(Math.asin(right.y))
  console.log(f, 'pos', p.toArray().map((v) => v.toFixed(3)).join(' '), 'pitch down', pitch.toFixed(2), 'yaw', yaw.toFixed(2), 'roll', roll.toFixed(2))
}
