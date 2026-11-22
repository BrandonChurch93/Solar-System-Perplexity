import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

const director = new FilmDirector(plans)
const format = config.formats[config.formatKeys.master]!
for (let f = 2745; f <= 2819; f += 3) {
  const shot = director.shotAt(f, (f + 0.25) / config.fps)
  const inv = shot.camera.quaternion.clone().invert()
  const sun = shot.sun.dir.clone().applyQuaternion(inv)
  const focal = format.height / 2 / Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2)
  const discs = shot.sets.map((set) => {
    const j = set.origin.clone().sub(shot.camera.position).applyQuaternion(inv)
    const d = j.length()
    return j.z < 0 ? [Math.round(format.width / 2 + (j.x / -j.z) * focal), Math.round(format.height / 2 - (j.y / -j.z) * focal), Math.round(focal * Math.tan(Math.asin(Math.min(1, 1 / d))))].join(',') : 'behind'
  })
  console.log(f, 'sun', sun.toArray().map((v) => v.toFixed(2)).join(' '), 'discs', discs.join(' | '))
}
