import { config } from '../../../src/config'
import { StopPlan, type Fit, type MoveParams } from '../../../src/director/moves'
import fit from '../../../src/stops/earth/fit.json'
import { params } from '../../../src/stops/earth/plan'

const limit = Number(process.argv[2] ?? '0.65')
const rows: { s: string; score: number; line: string }[] = []
const F0 = 1836
const F1 = 1883
for (const glide of [0.03, 0.05, 0.07, 0.09])
  for (const rise of [40, 50, 60, 70, 85])
    for (const fall of [2, 3, 4])
      for (const s0 of [0.3, 0.35, 0.4, 0.45, 0.5])
        for (const s1 of [6, 7, 8, 9, 10, 11])
          for (const s2 of [0.8, 1, 1.3, 1.6, 2]) {
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
            for (let f = 1870; f <= 1876; f++) ahead = Math.max(ahead, rate(f))
            let ratio = 0
            let dip = 0
            for (let f = 1840; f <= 1876; f++) {
              ratio = Math.max(ratio, rate(f) / rate(f - 1))
              dip = Math.max(dip, 1 - rate(f) / rate(f - 1))
            }
            const land = rate(1882)
            const score = ahead + 0.5 * rate(1877) + Math.max(land - Number(process.argv[3] ?? '12'), 0) + 40 * Math.max(ratio - 1.22, 0) + 100 * dip
            rows.push({ s: JSON.stringify(surge), score, line: 'r1857 ' + rate(1857).toFixed(2) + ' ahead ' + ahead.toFixed(1) + ' r1876 ' + rate(1876).toFixed(1) + ' peak ' + Math.max(rate(1879), rate(1880), rate(1881)).toFixed(1) + ' r1877 ' + rate(1877).toFixed(1) + ' r1878 ' + rate(1878).toFixed(1) + ' land ' + land.toFixed(1) + ' r1883 ' + (100 * Math.log(px[1883 - F0]! / px[1882 - F0]!)).toFixed(1) + ' ratio ' + ratio.toFixed(3) + ' dip ' + dip.toFixed(3) })
          }
rows.sort((a, b) => a.score - b.score)
for (const r of rows.slice(0, 14)) console.log(r.score.toFixed(2), r.s, r.line)
console.log(rows.length, 'candidates')
