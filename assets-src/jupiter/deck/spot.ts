import * as THREE from 'three'
import { writeFileSync } from 'node:fs'
import { args } from '../../../tools/lib/common'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { chartEye } from '../../../src/stops/jupiter/plan'
import place from '../../../src/stops/jupiter/place.json'

// Where the place's storm stands on screen, frame by frame, from the film's own camera.
//   npx tsx assets-src/jupiter/deck/spot.ts --frames 2895,2970-3059 [--rate 1] --out FILE
// For each capture frame (film frame times the rate): the pixel of the vortex in the film's format, the pixels one chart unit takes
// there (the smaller and the larger of two directions on the ground), whether the vortex faces the camera, and the eye's height in radii.

const a = args()
const rate = Number(a.rate ?? 1)
const film = new FilmDirector(plans)
const plan = plans[config.stopIds.indexOf('jupiter')]!
const { width, height } = config.formats[config.formatKeys.master]!
const list = String(a.frames).split(',').flatMap((s) => {
  const [from, to] = s.split('-').map(Number)
  const out: number[] = []
  for (let k = from!; k <= (to ?? from!); k++) out.push(k)
  return out
})
const vortex = place.vortex as number[]

function globePoint(turn: THREE.Quaternion, x: number, y: number): THREE.Vector3 {
  const eye = new THREE.Vector3()
  const at = (p: THREE.Vector3): THREE.Vector3 => {
    chartEye(turn, p, eye)
    return eye.clone()
  }
  const b = at(new THREE.Vector3(0, 0, 0))
  const cols = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)].map((v) => at(v).sub(b))
  const m = new THREE.Matrix3().set(cols[0]!.x, cols[1]!.x, cols[2]!.x, cols[0]!.y, cols[1]!.y, cols[2]!.y, cols[0]!.z, cols[1]!.z, cols[2]!.z).invert()
  const back = (z: number): THREE.Vector3 => new THREE.Vector3(x, y, z).sub(b).applyMatrix3(m)
  let z = 0
  for (let i = 0; i < 20; i++) {
    const f = back(z).length() - 1
    const g = (back(z + 1e-3).length() - 1 - f) / 1e-3
    z -= f / g
  }
  return back(z)
}

const rows: Record<string, { frame: number; x: number; y: number; unit: number[]; front: boolean; height: number }> = {}
for (const k of list) {
  const f = k / rate
  const time = f / config.fps
  const shot = film.shotAt(Math.floor(f + 1e-9), time)
  const set = shot.sets.find((s) => s.id === 'jupiter')
  if (!set || set.view !== 'orbit') continue
  const turn = plan.turn(time)
  const tan = Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2)
  const inverse = shot.camera.quaternion.clone().invert()
  const pixel = (x: number, y: number): { p: THREE.Vector2; front: boolean } => {
    const g = globePoint(turn, x, y)
    const w = g.clone().applyQuaternion(set.rotation).add(set.origin)
    const c = w.clone().sub(shot.camera.position).applyQuaternion(inverse)
    const eye = shot.camera.position.clone().sub(set.origin)
    const out = g.clone().applyQuaternion(set.rotation)
    return { p: new THREE.Vector2((c.x / -c.z / (tan * width / height) + 1) * width / 2, (1 - c.y / -c.z / tan) * height / 2), front: c.z < 0 && eye.sub(out).dot(out) > 0 }
  }
  const o = pixel(vortex[0]!, vortex[1]!)
  const ex = pixel(vortex[0]! + 1, vortex[1]!).p.distanceTo(o.p)
  const ey = pixel(vortex[0]!, vortex[1]! + 1).p.distanceTo(o.p)
  const eye = shot.camera.position.clone().sub(set.origin)
  rows[String(k)] = { frame: f, x: o.p.x, y: o.p.y, unit: [Math.min(ex, ey), Math.max(ex, ey)], front: o.front, height: eye.length() - 1 }
}
writeFileSync(String(a.out), JSON.stringify(rows))
const keys = Object.keys(rows)
console.log(keys.length + ' frames, first ' + JSON.stringify(rows[keys[0]!]) + ', last ' + JSON.stringify(rows[keys[keys.length - 1]!]))
