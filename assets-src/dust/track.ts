import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

const d = new FilmDirector(plans)
const fmt = config.formats[config.formatKeys.master]!
const [from, x, y, first, last] = process.argv.slice(2).map(Number)
const mid = (f: number) => d.shotAt(f, (f + 0.5 * config.shutterFraction) / config.fps)
const a = mid(from!)
const ta = Math.tan((a.camera.vfov * Math.PI) / 360)
const dir = new THREE.Vector3(((x! / fmt.width) * 2 - 1) * ta * (fmt.width / fmt.height), (1 - (y! / fmt.height) * 2) * ta, -1).normalize().applyQuaternion(a.camera.quaternion)
const rows: number[][] = []
for (let f = first!; f <= last!; f++) {
  const s = mid(f)
  const t = Math.tan((s.camera.vfov * Math.PI) / 360)
  const v = dir.clone().applyQuaternion(s.camera.quaternion.clone().invert())
  rows.push([f, ((v.x / -v.z / (t * fmt.width / fmt.height)) * 0.5 + 0.5) * fmt.width, (0.5 - (v.y / -v.z / t) * 0.5) * fmt.height, v.z < 0 ? 1 : 0])
}
console.log(JSON.stringify(rows))
