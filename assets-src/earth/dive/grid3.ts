import { StopPlan, type Fit, type MoveParams } from '../../../src/director/moves'
import fit from '../../../src/stops/earth/fit.json'
import { params } from '../../../src/stops/earth/plan'
import { rows } from './lib'

const lim = Number(process.argv[2] ?? '0.95')
const cap = Number(process.argv[3] ?? '90')
const out: { score: number; s: string; line: string }[] = []
for (const glide of [0.06, 0.08, 0.1, 0.12])
  for (const rise of [64, 85, 110])
    for (const fall of [3, 4, 6])
      for (const s0 of [0.3, 0.36, 0.42, 0.48])
        for (const s1 of [6, 8, 10, 13])
          for (const s2 of [1.3, 2, 3]) {
            const surge = { glide, rise, fall, swell: [s0, s1, s2] }
            const plan = new StopPlan('earth', fit as Fit, { ...params, dive: { ...params.dive, surge } } as unknown as MoveParams)
            const r = rows(plan, 'dive', 1838, 1883)
            const at = (f: number) => r[f - 1838]!
            if (at(1857).rate > lim) continue
            let most = 0
            let ratio = 0
            let dip = 0
            for (let f = 1840; f <= 1877; f++) {
              most = Math.max(most, at(f).motion)
              ratio = Math.max(ratio, at(f).rate / at(f - 1).rate)
              dip = Math.max(dip, 1 - at(f).rate / at(f - 1).rate)
            }
            const land = Math.max(at(1882).top - at(1881).top, 0) + 2 * Math.max(at(1883).top - at(1882).top, 0) + 4 * Math.abs(0.166 - at(1883).top)
            const peak = Math.max(at(1879).motion, at(1880).motion, at(1881).motion, at(1882).motion)
            const score = Math.max(most - cap, 0) * 0.5 + 60 * Math.max(ratio - 1.14, 0) + 80 * Math.max(dip - 0.02, 0) + 150 * land + 0.01 * peak + 3 * Math.max(0.6 - at(1857).rate, 0)
            out.push({ score, s: JSON.stringify(surge), line: 'r57 ' + at(1857).rate.toFixed(2) + ' px57 ' + at(1857).px.toFixed(0) + ' r66 ' + at(1866).rate.toFixed(1) + ' r70 ' + at(1870).rate.toFixed(1) + ' r74 ' + at(1874).rate.toFixed(1) + ' r77 ' + at(1877).rate.toFixed(1) + ' most ' + most.toFixed(0) + ' m78 ' + at(1878).motion.toFixed(0) + ' peak ' + peak.toFixed(0) + ' ratio ' + ratio.toFixed(3) + ' dip ' + dip.toFixed(3) + ' top ' + [1879, 1880, 1881, 1882, 1883].map((f) => at(f).top.toFixed(3)).join(' ') })
          }
out.sort((a, b) => a.score - b.score)
for (const r of out.slice(0, 14)) console.log(r.score.toFixed(2), r.s, r.line)
console.log(out.length, 'candidates')
