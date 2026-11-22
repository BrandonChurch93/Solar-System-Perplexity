import { config } from '../../src/config'
import { flightField } from '../../src/space/travel/field'
const t0 = performance.now()
const f = flightField(config.raw.travel.sky.flightStars)
const v = Array.from(f.veil).sort((a, b) => a - b)
const q = (p: number): string => v[Math.floor(p * (v.length - 1))]!.toFixed(2)
console.log('veil', q(0), q(0.1), q(0.5), q(0.9), q(1), 'ms', (performance.now() - t0).toFixed(0))
const b = Array.from(f.deep.star)
for (const th of [0.04, 0.12, 0.25, 0.5, 1, 2]) console.log('deep above', th, b.filter((x) => x > th).length, 'per frame about', Math.round(b.filter((x) => x > th).length * 0.036))
