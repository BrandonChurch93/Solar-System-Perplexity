import * as THREE from 'three'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { config } from '../../../src/config'
import look from '../../../src/space/farsun/look.json'
const film = new FilmDirector(plans)
const spinY = (d: THREE.Vector3, a: number): THREE.Vector3 => new THREE.Vector3(Math.cos(a) * d.x - Math.sin(a) * d.z, d.y, Math.sin(a) * d.x + Math.cos(a) * d.z)
const out = process.argv.slice(2).map(Number).map((f) => {
  const shot = film.shotAt(f, f / config.fps)
  const far = shot.sun.far
  if (far == null) return { frame: f, far: null }
  const inv = far.body.clone().invert()
  const toHold = (v: THREE.Vector3): number[] => spinY(v.clone().applyQuaternion(inv), far.spin - look.spinAt).toArray()
  const away = 1 / Math.sin(shot.sun.angularRadius)
  const q = shot.camera.quaternion
  const back = q.clone().invert()
  const set = (shot as unknown as { sets: { origin: THREE.Vector3; height: number }[] }).sets[0]
  const planet = set ? set.origin.clone().sub(shot.camera.position).applyQuaternion(back).normalize().toArray() : null
  return {
    frame: f,
    segment: shot.segment.id,
    u: shot.u,
    away,
    spin: far.spin,
    burn: far.burn,
    vfov: shot.camera.vfov,
    eye: toHold(shot.sun.dir.clone().normalize().multiplyScalar(-away)),
    right: toHold(new THREE.Vector3(1, 0, 0).applyQuaternion(q)),
    up: toHold(new THREE.Vector3(0, 1, 0).applyQuaternion(q)),
    back: toHold(new THREE.Vector3(0, 0, 1).applyQuaternion(q)),
    planet,
    planetRadius: set ? Math.asin(1 / (1 + set.height)) : 0,
  }
})
console.log(JSON.stringify(out))
