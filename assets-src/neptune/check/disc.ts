import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
const director = new FilmDirector(plans)
for (const a of process.argv.slice(2)) {
  const f = Number(a)
  const shot: any = director.shotAt(f, f / config.fps)
  const s = shot.sets.find((x: any) => x.id === 'neptune')
  const inv = (shot.camera.quaternion as THREE.Quaternion).clone().invert()
  const c = (s.origin as THREE.Vector3).clone().sub(shot.camera.position).applyQuaternion(inv)
  const th = Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2)
  const scale = (s.scale ?? 1) as number
  const d = c.length()
  const k = 540 / th
  const cx = 960 + (c.x / -c.z) * k
  const cy = 540 - (c.y / -c.z) * k
  const ang = Math.asin(scale / d)
  const axis = Math.atan(Math.hypot(c.x, c.y) / -c.z)
  console.log(f, 'centre px', cx.toFixed(1), cy.toFixed(1), 'distance', (d / scale).toFixed(4), 'limb px along the axis', (k * (Math.tan(axis + ang) - Math.tan(axis))).toFixed(1), 'across', (k * Math.tan(ang) / Math.cos(axis)).toFixed(1), 'vfov', shot.camera.vfov)
}
