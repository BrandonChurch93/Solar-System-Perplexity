import * as THREE from 'three'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

const film = new FilmDirector(plans)
for (const frame of process.argv.slice(2).map(Number)) {
  const shot = film.shotAt(frame, (frame + 0.25) / 30)
  const d = shot.sun.dir.clone().applyQuaternion(shot.camera.quaternion.clone().invert())
  const th = Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2)
  const x = d.z < 0 ? (d.x / -d.z) / (th * 16 / 9) : NaN
  const y = d.z < 0 ? (d.y / -d.z) / th : NaN
  console.log(frame, shot.segment.kind, 'vfov', shot.camera.vfov.toFixed(2), 'sun in camera', d.toArray().map((v) => v.toFixed(4)).join(' '), 'screen (x right, y up, frame edge at 1)', x.toFixed(3), y.toFixed(3), 'glare', shot.sun.glare.toFixed(3))
}
