import * as THREE from 'three'
import { plan } from '../../../src/stops/uranus/plan'
import { config } from '../../../src/config'

const p = plan as unknown as { entry(t: number): { g: number; rate: number }; coverCenter(s: unknown): number; coverFractions(s: unknown): { first: number; center: number; last: number } }
const dive = plan.seg.dive!
const c = p.coverCenter(dive)
const at = p.entry(c)
console.log('dive cover centre', c.toFixed(4), 'frame', Math.round(c * config.fps), 'g', at.g.toFixed(4), 'fractions', JSON.stringify(p.coverFractions(dive)))
console.log('altitude for unit 0.0151327 R', (0.0151327 * (1 + plan.p.terrain.entryHeight * at.g)).toFixed(5))
const sun = plan.sunDir.clone()
for (const f of [4200, 4290, 4379]) {
  const time = f / config.fps
  const q = plan.turn(time).multiply(plan.terrainFrame).invert()
  console.log('frame', f, 'sun local', sun.clone().applyQuaternion(q).toArray().map((x) => x.toFixed(4)).join(' '))
}
