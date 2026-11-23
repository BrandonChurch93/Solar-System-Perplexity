import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { plan } from '../../../src/stops/venus/plan'
const film = new FilmDirector(plans)
const deg = THREE.MathUtils.radToDeg
for (const a of process.argv.slice(2)) {
  const f = Number(a)
  const time = (f + config.shutterFraction * 0.5) / config.fps
  const s = film.shotAt(f, time, 'orbit')
  const kind = f < 1400 ? 'dive' : 'rise'
  const p = kind === 'dive' ? plan.divePose(time, 'orbit') : plan.risePose(time, 'orbit')
  const up = p.position.clone().normalize()
  const h = p.position.length() - 1
  const dip = Math.acos(1 / (1 + h))
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quaternion)
  const pitch = Math.asin(fwd.dot(up))
  // sun direction in the plan frame: camera of the shot may differ from p by drift; use shot camera to bring sun into camera frame then p
  const sunCam = s.sun.dir.clone().applyQuaternion(s.camera.quaternion.clone().invert())
  const sun = sunCam.clone().applyQuaternion(p.quaternion)
  const sunElev = Math.asin(sun.dot(up))
  const an = plan.anchor(time)
  const toA = an.clone().sub(p.position)
  console.log(f, 'h', h.toFixed(5), 'dip', deg(dip).toFixed(2), 'pitch', deg(pitch).toFixed(2), 'limb below axis', deg(-pitch - dip).toFixed(2), 'sun above limb', deg(sunElev + dip).toFixed(2), 'sun elev', deg(sunElev).toFixed(2), 'arc from anchor deg', deg(up.angleTo(an.clone().normalize())).toFixed(2), 'range', toA.length().toFixed(4), 'vfov', p.vfov.toFixed(1), 'posdiff', s.camera.position.distanceTo(p.position).toExponential(1))
}
