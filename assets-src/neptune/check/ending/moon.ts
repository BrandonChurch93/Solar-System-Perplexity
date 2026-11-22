import * as THREE from 'three'
import { config } from '../../../../src/config'
import { FilmDirector } from '../../../../src/director/film'
import { plans } from '../../../../src/director/plans'
import * as look from '../../../../src/stops/neptune/look'
import { plan } from '../../../../src/stops/neptune/plan'
import fit from '../../../../src/stops/neptune/fit.json'
const DEG = 180 / Math.PI
const m = (fit as any).moons[0]
const stage = new THREE.Vector3().fromArray(look.triton.stage).applyAxisAngle(plan.axis, -THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * (plan.seg.rise!.end - plan.holdMid))
const film = new FilmDirector(plans)
const argv = process.argv.slice(2).map(Number)
const frames = argv.length ? argv : [5006, 5024, 5025, 5040, 5055, 5070, 5085, 5100, 5115, 5130, 5145, 5190, 5235, 5280, 5324, 5362, 5399]
console.log('stage', look.triton.stage, 'distance', stage.length().toFixed(2), 'radius', m.radius)
console.log('frame  triton x y px  radius px  planet x y px  radius px  phase of triton deg  behind the globe')
for (const f of frames) {
  const time = f / config.fps
  const shot: any = film.shotAt(f, time)
  const s = shot.sets.find((x: any) => x.id === 'neptune')
  if (!s) { console.log(f, 'no neptune'); continue }
  const turn = new THREE.Quaternion().setFromAxisAngle(plan.axis, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * (time - plan.holdMid))
  const world = stage.clone().applyQuaternion(turn).applyQuaternion(s.rotation).add(s.origin)
  const inv = shot.camera.quaternion.clone().invert()
  const k = 540 / Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2)
  const v = world.clone().sub(shot.camera.position).applyQuaternion(inv)
  const c = s.origin.clone().sub(shot.camera.position).applyQuaternion(inv)
  const toMoon = world.clone().sub(shot.camera.position)
  const phase = toMoon.clone().negate().angleTo(shot.sun.dir) * DEG
  const d = toMoon.length()
  const dir = toMoon.clone().normalize()
  const oc = s.origin.clone().sub(shot.camera.position)
  const along = oc.dot(dir)
  const miss = oc.clone().addScaledVector(dir, -along).length()
  const hidden = along > 0 && along < d && miss < 1
  console.log(String(f).padStart(5) + (v.z > 0 ? '  behind the camera' : (960 + v.x / -v.z * k).toFixed(0).padStart(8) + (540 - v.y / -v.z * k).toFixed(0).padStart(6) + (m.radius / d * k).toFixed(1).padStart(8)) + (960 + c.x / -c.z * k).toFixed(0).padStart(10) + (540 - c.y / -c.z * k).toFixed(0).padStart(6) + (1 / oc.length() * k).toFixed(1).padStart(8) + phase.toFixed(0).padStart(12) + (hidden ? '   yes' : '   no'))
}
