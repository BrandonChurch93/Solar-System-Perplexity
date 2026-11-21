import * as THREE from 'three'
import { readFileSync } from 'node:fs'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { galactic } from '../../src/space/sky'

const d = new FilmDirector(plans)
const e = galactic().elements
const pole = new THREE.Vector3(e[2]!, e[5]!, e[8]!)
const out: Record<string, unknown> = {}
for (const p of plans.slice(1)) {
  const def = JSON.parse(readFileSync('src/stops/' + p.id + '/sky.json', 'utf8')).orbit
  const aim = d.sky.patches[p.id]?.orbit
  if (!def || !aim) continue
  const n = pole.clone().applyQuaternion(aim.clone().invert())
  const wide = 1 + 2 * def.margin
  const t = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2)
  const flat = Math.hypot(n.x, n.y)
  out[p.id] = { file: 'public/assets/' + p.id + '/full/' + def.file, wide, lineDeg: ((THREE.MathUtils.radToDeg(Math.atan2(-n.x, n.y)) % 180) + 180) % 180, offDeg: THREE.MathUtils.radToDeg(Math.atan(Math.abs(n.z) / Math.max(flat, 1e-9))), foot: [(n.x * n.z) / (flat * flat) / (t * 16 / 9), (n.y * n.z) / (flat * flat) / t], halfDeg: def.vfovDeg / 2, add: def.add, gain: def.gain }
}
console.log(JSON.stringify(out))
