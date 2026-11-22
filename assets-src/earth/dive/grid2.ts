import { config } from '../../../src/config'
import { StopPlan, type Fit, type MoveParams } from '../../../src/director/moves'
import fit from '../../../src/stops/earth/fit.json'
import { params } from '../../../src/stops/earth/plan'

const limit = Number(process.argv[2] ?? '0.45')
const cap = Number(process.argv[3] ?? '9.5')
const rows: { s: string; score: number; line: string }[] = []
const F0 = 1836
const F1 = 1883
for (const glide of [0.02, 0.03, 0.045])
  for (const rise of [64, 85])
    for (const fall of [3, 4])
      for (const s0 of [0.34, 0.38, 0.42, 0.46])
        for (const s1 of [9, 11, 13, 15, 18])
          for (const s2 of [1.3, 1.8, 2.4, 3.2]) {
            const surge = { glide, rise, fall, swell: [s0, s1, s2] }
            const plan = new StopPlan('earth', fit as Fit, { ...params, dive: { ...params.dive, surge } } as unknown as MoveParams)
            const px: number[] = []
            for (let f = F0; f <= F1; f++) {
              const r = plan.dive((f + 0.25) / config.fps)
              const h = r.pose.position.length() - 1
              px.push((Math.tan(Math.asin(1 / (1 + h))) / Math.tan(((r.pose.vfov * Math.PI) / 180) / 2)) * 540)
            }
            const rate = (f: number): number => 100 * Math.log(px[f + 1 - F0]! / px[f - F0]!)
            if (rate(1857) > limit) continue
            let ahead = 0
            for (let f = 1866; f <= 1877; f++) ahead = Math.max(ahead, rate(f))
            let ratio = 0
            let dip = 0
            for (let f = 1857; f <= 1877; f++) {
              ratio = Math.max(ratio, rate(f) / rate(f - 1))
              dip = Math.max(dip, 1 - rate(f) / rate(f - 1))
            }
            const peak = Math.max(rate(1879), rate(1880), rate(1881), rate(1882))
            const score = Math.max(ahead - cap, 0) * 2 + 0.25 * peak + 40 * Math.max(ratio - 1.3, 0) + 60 * Math.max(dip - 0.03, 0) + Math.max(rate(1882) - 22, 0)
            rows.push({ s: JSON.stringify(surge), score, line: 'r1857 ' + rate(1857).toFixed(2) + ' r1862 ' + rate(1862).toFixed(2) + ' r1866 ' + rate(1866).toFixed(1) + ' r1870 ' + rate(1870).toFixed(1) + ' r1874 ' + rate(1874).toFixed(1) + ' r1876 ' + rate(1876).toFixed(1) + ' r1877 ' + rate(1877).toFixed(1) + ' r1878 ' + rate(1878).toFixed(1) + ' peak ' + peak.toFixed(1) + ' r1882 ' + rate(1882).toFixed(1) + ' ratio ' + ratio.toFixed(3) + ' dip ' + dip.toFixed(3) })
          }
rows.sort((a, b) => a.score - b.score)
for (const r of rows.slice(0, 16)) console.log(r.score.toFixed(2), r.s, r.line)
console.log(rows.length, 'candidates')
