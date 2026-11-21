import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
const director = new FilmDirector(plans)
for (const f of process.argv.slice(2).map(Number)) {
  const shot: any = director.shotAt(f, f / config.fps)
  const q = (shot.camera.quaternion as THREE.Quaternion).clone().invert()
  const v = (shot.sun.dir as THREE.Vector3).clone().applyQuaternion(q)
  const th = Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2)
  console.log(f, 'sun screen', v.z < 0 ? (0.5 + v.x / -v.z / (th * 16 / 9) / 2).toFixed(3) + ' ' + (0.5 - v.y / -v.z / th / 2).toFixed(3) : 'behind', 'vfov', shot.camera.vfov.toFixed(1), 'sun keys', Object.keys(shot.sun).join(','), 'glare', shot.sun.glare, 'radius', shot.sun.radiusDeg ?? '')
}
