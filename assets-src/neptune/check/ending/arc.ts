import * as THREE from 'three'
import { config } from '../../../../src/config'
import { FilmDirector } from '../../../../src/director/film'
import { plans } from '../../../../src/director/plans'
import * as look from '../../../../src/stops/neptune/look'
import { plan } from '../../../../src/stops/neptune/plan'
import { smooth } from '../../../../src/director/rig'

const argv = process.argv.slice(2)
const f = Number(argv[0] ?? 5235)
const radii = (argv[1] ?? '1.3,1.65,1.95').split(',').map(Number)
const film = new FilmDirector(plans)
const shot = film.shotAt(f, f / config.fps)
const s = shot.sets.find((x) => x.id === 'neptune')!
const normal = new THREE.Vector3().fromArray(look.ring.normal).normalize()
const tilt = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
const lit = s.segment.kind === 'retreat' ? smooth(s.u * 1.5) : 1
const light = plan.lightDir.clone().applyQuaternion(s.rotation).lerp(shot.sun.dir, lit).normalize()
const k = 540 / Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2)
const cam = shot.camera.position.clone().sub(s.origin)
for (let a = 0; a < 360; a += 5) {
  const row: string[] = [String(a)]
  for (const r of radii) {
    const q = new THREE.Vector3(Math.cos(a * Math.PI / 180) * r, Math.sin(a * Math.PI / 180) * r, 0).applyQuaternion(tilt).applyQuaternion(s.rotation)
    const along = q.dot(light)
    const miss = Math.sqrt(Math.max(q.lengthSq() - along * along, 0))
    const toCam = cam.clone().sub(q)
    const d = toCam.length()
    const dir = toCam.clone().divideScalar(d)
    const tb = -q.dot(dir)
    const near = q.clone().addScaledVector(dir, Math.min(Math.max(tb, 0), d)).length()
    const hidden = near < 1 && tb > 0 ? 1 : 0
    const front = q.clone().sub(dir.clone().multiplyScalar(q.dot(dir))).length() < 1 && !hidden ? 1 : 0
    const v = q.add(s.origin).sub(shot.camera.position).applyQuaternion(shot.camera.quaternion.clone().invert())
    row.push((960 + v.x / -v.z * k).toFixed(1), (540 - v.y / -v.z * k).toFixed(1), (along < 0 ? miss : 9).toFixed(3), String(front), String(hidden))
  }
  console.log(row.join(' '))
}
