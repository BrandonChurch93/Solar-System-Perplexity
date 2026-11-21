import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { drift } from '../../../src/director/rig'
const director = new FilmDirector(plans)
for (const a of process.argv.slice(2)) {
  const f = Number(a)
  const time = (f + config.shutterFraction / 2) / config.fps
  const shot: any = director.shotAt(Math.floor(f), time)
  const q = drift(time)
  const e = new THREE.Euler().setFromQuaternion(q, 'YXZ')
  const s = shot.sets.find((x: any) => x.id === 'neptune')
  let centre = ''
  if (s) {
    const c = (s.origin as THREE.Vector3).clone().sub(shot.camera.position).applyQuaternion((shot.camera.quaternion as THREE.Quaternion).clone().invert())
    const th = Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2)
    centre = ' centre at 1920 ' + (960 * (1 + c.x / -c.z / (th * 16 / 9))).toFixed(3) + ',' + (540 * (1 - c.y / -c.z / th)).toFixed(3)
  }
  console.log(f + ' drift ' + q.toArray().map((v) => v.toFixed(8)).join(',') + ' pitch yaw roll deg ' + [e.x, e.y, e.z].map((v) => THREE.MathUtils.radToDeg(v).toFixed(4)).join(' ') + ' vfov ' + shot.camera.vfov + centre)
}
