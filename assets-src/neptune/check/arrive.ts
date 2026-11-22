import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { plan } from '../../../src/stops/neptune/plan'
import fit from '../../../src/stops/neptune/fit.json'
const DEG = 180 / Math.PI
const argv = process.argv.slice(2)
const a = plan.p.arrive!
if (argv[0] !== undefined && argv[0] !== 'now') a.swingDeg = Number(argv[0])
if (argv[1] !== undefined) a.offset = [Number(argv[1]), Number(argv[2] ?? 0)]
const from = Number(argv[3] ?? 4496)
const to = Number(argv[4] ?? 4532)
const step = Number(argv[5] ?? 2)
const m = (fit as any).moons[0]
const home = new THREE.Vector3().fromArray(m.position)
const director = new FilmDirector(plans)
console.log('arrive', JSON.stringify(a))
console.log('frame   dist  planet x y px  radius px   triton x y px   turn deg per frame   uranus x y px')
let lastQ: THREE.Quaternion | null = null
let lastF = 0
const place = (shot: any, world: THREE.Vector3): [number, number, number] => {
  const v = world.clone().sub(shot.camera.position).applyQuaternion(shot.camera.quaternion.clone().invert())
  const k = 540 / Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2)
  return [960 + v.x / -v.z * k, 540 - v.y / -v.z * k, -v.z]
}
for (let f = from; f <= to; f += step) {
  const time = f / config.fps
  const shot: any = director.shotAt(f, time)
  const s = shot.sets.find((x: any) => x.id === 'neptune')
  const u = shot.sets.find((x: any) => x.id === 'uranus')
  const q = shot.camera.quaternion as THREE.Quaternion
  const rate = lastQ ? (2 * Math.acos(Math.min(1, Math.abs(lastQ.dot(q)))) * DEG) / (f - lastF) : 0
  lastQ = q.clone()
  lastF = f
  let line = String(f).padStart(5)
  if (s) {
    const d = shot.camera.position.clone().sub(s.origin).length()
    const c = place(shot, s.origin)
    const r = (1 / d) / Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2) * 540
    const turn = new THREE.Quaternion().setFromAxisAngle(plan.axis, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * (time - plan.holdMid))
    const t = place(shot, home.clone().applyQuaternion(turn).applyQuaternion(s.rotation).add(s.origin))
    line += d.toFixed(2).padStart(9) + c[0].toFixed(0).padStart(7) + c[1].toFixed(0).padStart(6) + r.toFixed(1).padStart(9) + t[0].toFixed(0).padStart(9) + t[1].toFixed(0).padStart(6) + (t[2] < 0 ? ' behind' : '')
  } else line += ' no neptune'.padEnd(46)
  line += rate.toFixed(2).padStart(12)
  if (u) { const c = place(shot, u.origin); line += c[0].toFixed(0).padStart(12) + c[1].toFixed(0).padStart(7) + (c[2] < 0 ? ' behind' : '') }
  console.log(line)
}
