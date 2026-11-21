import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { plan } from '../../../src/stops/neptune/plan'
import fit from '../../../src/stops/neptune/fit.json'
const DEG = 180 / Math.PI
const m = (fit as any).moons[0]
const home = new THREE.Vector3().fromArray(m.position)
const director = new FilmDirector(plans)
const argv = process.argv.slice(2).map(Number)
const frames = argv.length ? argv : [4605, 5006, 5024, 5040, 5060, 5080, 5100, 5120, 5145, 5200, 5300]
console.log('triton home distance', home.length().toFixed(3), 'radius', m.radius)
console.log('frame  camera distance from neptune, from triton (in triton radii), triton angle off axis deg, triton screen x y (0 to 1), angular radius deg, vfov')
for (const f of frames) {
  const time = f / config.fps
  const shot: any = director.shotAt(f, time)
  const s = shot.sets.find((x: any) => x.id === 'neptune')
  if (!s) { console.log(f, 'no neptune set'); continue }
  const elapsed = time - plan.holdMid
  const turn = new THREE.Quaternion().setFromAxisAngle(plan.axis, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * elapsed)
  const local = home.clone().applyQuaternion(turn)
  const world = local.clone().applyQuaternion(s.rotation).add(s.origin)
  const cam = shot.camera.position as THREE.Vector3
  const rel = world.clone().sub(cam)
  const v = rel.clone().applyQuaternion((shot.camera.quaternion as THREE.Quaternion).clone().invert())
  const th = Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2)
  const x = 0.5 + v.x / -v.z / (th * 16 / 9) / 2
  const y = 0.5 - v.y / -v.z / th / 2
  const off = Math.atan2(Math.hypot(v.x, v.y), -v.z) * DEG
  console.log(String(f).padStart(5), cam.clone().sub(s.origin).length().toFixed(2).padStart(7), (rel.length() / m.radius).toFixed(1).padStart(8), off.toFixed(1).padStart(7), x.toFixed(2).padStart(7), y.toFixed(2).padStart(6), (Math.asin(Math.min(m.radius / rel.length(), 1)) * DEG).toFixed(2).padStart(7), shot.camera.vfov.toFixed(1).padStart(6))
}
