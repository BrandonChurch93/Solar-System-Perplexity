import * as THREE from 'three'
import { readFileSync } from 'node:fs'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { config } from '../../../src/config'
import look from '../../../src/space/farsun/look.json'
const film = new FilmDirector(plans)
const deg = THREE.MathUtils.radToDeg, rad = THREE.MathUtils.degToRad
const spinY = (d: THREE.Vector3, a: number): THREE.Vector3 => new THREE.Vector3(Math.cos(a) * d.x - Math.sin(a) * d.z, d.y, Math.sin(a) * d.x + Math.cos(a) * d.z)
const f = 615
const shot = film.shotAt(f, f / config.fps)
const far = shot.sun.far
if (far == null) throw new Error('no far Sun at 615')
const q = shot.camera.quaternion
const a = shot.sun.angularRadius
const body = far.body.clone().invert()
const s = shot.sun.dir.clone().normalize()
const D = 1 / Math.sin(a)
const ro = s.clone().multiplyScalar(-D)
const fl = 540 / Math.tan(rad(shot.camera.vfov) / 2)
const pts = JSON.parse(readFileSync(String(process.argv[2]), 'utf8')) as number[][]
const out = pts.map(([px = 0, py = 0]) => {
  const rd = new THREE.Vector3((px - 960) / fl, -(py - 540) / fl, -1).normalize().applyQuaternion(q)
  const b = ro.dot(rd)
  const h = 1 - (D * D - b * b)
  if (h < 0) return null
  const p = ro.clone().addScaledVector(rd, -b - Math.sqrt(h)).normalize()
  const c = spinY(p.applyQuaternion(body), far.spin).applyAxisAngle(new THREE.Vector3(0, 1, 0), look.spinAt)
  return [Number(deg(Math.atan2(c.y, c.x)).toFixed(1)), Number(deg(Math.asin(c.z)).toFixed(1))]
})
console.log(JSON.stringify(out))
