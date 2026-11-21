import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
const director = new FilmDirector(plans)
for (const a of process.argv.slice(2)) {
  const f = Number(a)
  const shot: any = director.shotAt(f, f / config.fps)
  const s = shot.sets.find((x: any) => x.id === 'neptune')
  const c = (shot.camera.position as THREE.Vector3).clone().sub(s.origin)
  const h = c.length() - 1
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(shot.camera.quaternion)
  const down = c.clone().normalize().negate()
  const below = 90 - THREE.MathUtils.radToDeg(Math.acos(fwd.dot(down)))
  const dip = THREE.MathUtils.radToDeg(Math.acos(1 / (1 + h)))
  const vfov = shot.camera.vfov ?? shot.camera.fov
  console.log(f, 'height', h.toFixed(4), 'aim below level deg', below.toFixed(2), 'horizon dip deg', dip.toFixed(2), 'horizon above centre deg', (below - dip).toFixed(2), 'vfov', vfov, 'cover', (shot.cover?.amount ?? shot.coverAmount ?? NaN))
}
