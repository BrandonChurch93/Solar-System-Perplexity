import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { TRAVEL } from '../../src/space/travel/path'
import { flightField, type FlightDef } from '../../src/space/travel/field'

const def = (config.raw.travel as unknown as { sky: { flightStars: FlightDef } }).sky.flightStars
const field = flightField(def)
const fmt = config.formats[config.formatKeys.master]!
const id = process.argv[2]!
const frames = process.argv[3]!.split(',').map(Number)
const tries: Record<string, unknown>[] = process.argv.slice(4).map((s) => JSON.parse(s))
if (!tries.length) tries.push({})
const base = { ...TRAVEL[id] }
const v = new THREE.Vector3()
for (const t of tries) {
  if (TRAVEL[id]) TRAVEL[id] = { ...base, ...t }
  const d = new FilmDirector(plans)
  const row: string[] = []
  for (const f of frames) {
    const s = d.shotAt(f, (f + 0.25) / config.fps)
    const inv = s.camera.quaternion.clone().invert()
    const tan = Math.tan((s.camera.vfov * Math.PI) / 360)
    const tx = (tan * fmt.width) / fmt.height
    let n = 0
    let light = 0
    let big = 0
    for (let i = 0; i < def.count; i++) {
      v.fromArray(field.position, i * 3).applyQuaternion(inv)
      if (v.z >= 0 || Math.abs(v.x / -v.z) > tx || Math.abs(v.y / -v.z) > tan) continue
      const b = field.star[i * 4 + 1]!
      n++
      light += b
      if (b > 0.0167) big++
    }
    row.push(`${f}: ${n} stars, light ${light.toFixed(1)}, above 0.0167: ${big}`)
  }
  console.log(JSON.stringify(t), row.join(' | '))
}
