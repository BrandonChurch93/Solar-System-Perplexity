import * as THREE from 'three'
import { config } from '../../../../src/config'
import { FilmDirector } from '../../../../src/director/film'
import { plans } from '../../../../src/director/plans'
import * as look from '../../../../src/stops/neptune/look'

const argv = process.argv.slice(2)
const frames = (argv[0] ?? '5085').split(',').map(Number)
const shutter = config.shutterFraction
const film = new FilmDirector(plans)
const normal = new THREE.Vector3().fromArray(look.ring.normal).normalize()
const tilt = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
const project = (f: number, t: number, local: THREE.Vector3): [number, number, number] => {
  const shot = film.shotAt(f, (f + t) / config.fps)
  const s = shot.sets.find((x) => x.id === 'neptune')!
  const p = local.clone().applyQuaternion(tilt).applyQuaternion(s.rotation).add(s.origin)
  const v = p.sub(shot.camera.position).applyQuaternion(shot.camera.quaternion.clone().invert())
  const k = 540 / Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2)
  return [960 + v.x / -v.z * k, 540 - v.y / -v.z * k, -v.z]
}
for (const f of frames) {
  console.log('frame ' + f + ', shutter ' + shutter + ' of a frame')
  const rows: number[] = []
  for (const r of [0, 1.4, 1.6, 1.85]) {
    for (let a = 0; a < 360; a += r === 0 ? 360 : 30) {
      const q = new THREE.Vector3(Math.cos(a * Math.PI / 180) * r, Math.sin(a * Math.PI / 180) * r, 0)
      const a0 = project(f, 0, q)
      const a1 = project(f, shutter, q)
      const d = Math.hypot(a1[0] - a0[0], a1[1] - a0[1])
      const inside = a0[0] > 0 && a0[0] < 1920 && a0[1] > 0 && a0[1] < 1080
      if (r > 0 && inside) rows.push(d)
      console.log((r === 0 ? 'centre' : 'ring r ' + r + ' az ' + a).padEnd(22) + (a0[0].toFixed(0) + ', ' + a0[1].toFixed(0)).padStart(12) + '  moves ' + d.toFixed(1) + ' px  (' + (a1[0] - a0[0]).toFixed(1) + ', ' + (a1[1] - a0[1]).toFixed(1) + ')' + (inside ? '' : '  out of frame'))
    }
  }
  console.log('ring points in frame: ' + Math.min(...rows).toFixed(1) + ' to ' + Math.max(...rows).toFixed(1) + ' px across the shutter')
}
