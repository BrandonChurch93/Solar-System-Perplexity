import * as THREE from 'three'
import { config } from '../../../../src/config'
import { FilmDirector } from '../../../../src/director/film'
import { plans } from '../../../../src/director/plans'
import { smooth } from '../../../../src/director/rig'
const film = new FilmDirector(plans)
const DEG = 180 / Math.PI
for (let f = 5025; f <= 5150; f += 5) {
  const shot = film.shotAt(f, f / config.fps)
  const s = shot.sets.find((x) => x.id === 'neptune')!
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(shot.camera.quaternion)
  const off = fwd.angleTo(shot.sun.dir) * DEG
  const toPlanet = s.origin.clone().sub(shot.camera.position).normalize()
  console.log(f, 'u', s.u.toFixed(3), 'sun off axis', off.toFixed(1), 'planet off axis', (fwd.angleTo(toPlanet) * DEG).toFixed(1), 'sun to planet centre', (toPlanet.angleTo(shot.sun.dir) * DEG).toFixed(1), 'vfov', shot.camera.vfov.toFixed(1), 'lit 1.5u', smooth(s.u * 1.5).toFixed(3), 'exposure', shot.post.exposure.toFixed(3))
}
