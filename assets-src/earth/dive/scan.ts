import { config } from '../../../src/config'
import { StopPlan, type Fit, type MoveParams } from '../../../src/director/moves'
import fit from '../../../src/stops/earth/fit.json'
import { params } from '../../../src/stops/earth/plan'

const seg = config.segments.find((s) => s.stop === 'earth' && s.kind === 'dive')!
const frames = [1838, 1846, 1857, 1862, 1866, 1870, 1874, 1876, 1877, 1878, 1879, 1880, 1881, 1882, 1883]
const sets: Record<string, unknown>[] = JSON.parse(process.argv[2]!)
for (const surge of sets) {
  const plan = new StopPlan('earth', fit as Fit, { ...params, dive: { ...params.dive, surge } } as unknown as MoveParams)
  const px = (f: number): number => {
    const r = plan.dive((f + 0.25) / config.fps)
    const h = r.pose.position.length() - 1
    return (Math.tan(Math.asin(1 / (1 + h))) / Math.tan(((r.pose.vfov * Math.PI) / 180) / 2)) * 540
  }
  let worst = 0
  for (let f = 1858; f < 1877; f++) worst = Math.max(worst, Math.log(px(f + 1) / px(f)) / Math.log(px(f) / px(f - 1)))
  console.log(JSON.stringify(surge), 'max ratio 1858..1876', worst.toFixed(3))
  console.log('  ' + frames.map((f) => f + ':' + (100 * Math.log(px(f + 1) / px(f))).toFixed(2)).join(' '))
}
void seg
