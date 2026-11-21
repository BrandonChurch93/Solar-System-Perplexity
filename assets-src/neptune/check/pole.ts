import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { plan } from '../../../src/stops/neptune/plan'
const director = new FilmDirector(plans)
for (const f of process.argv.slice(2).map(Number)) {
  const shot: any = director.shotAt(f, f / config.fps)
  const s = shot.sets.find((x: any) => x.id === 'neptune')
  const inv = (s.rotation as THREE.Quaternion).clone().invert()
  const cam = (shot.camera.position as THREE.Vector3).clone().sub(s.origin).applyQuaternion(inv)
  const q = inv.clone().multiply(shot.camera.quaternion)
  const th = Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2)
  const scr = (w: THREE.Vector3) => { const v = w.clone().sub(cam).applyQuaternion(q.clone().invert()); return [(0.5 + v.x / -v.z / (th * 16 / 9) / 2).toFixed(3), (0.5 - v.y / -v.z / th / 2).toFixed(3)] }
  const ax = plan.axis.clone().normalize()
  console.log(f, 'centre', scr(new THREE.Vector3()).join(' '), 'north pole', scr(ax).join(' '), 'faces camera', ax.dot(cam.clone().normalize()).toFixed(2), 'south pole', scr(ax.clone().negate()).join(' '), 'anti sun', scr(plan.lightDir.clone().negate()).join(' '), 'r', (Math.asin(1 / cam.length()) / th / 2).toFixed(3))
}
