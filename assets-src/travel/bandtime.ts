import { config } from '../../src/config'
import { TravelShape, type TravelLook } from '../../src/space/travel/path'

const id = process.argv[2]!
const a = Number(process.argv[3])
const b = Number(process.argv[4])
const seg = config.segments.find((s) => s.id === id + '.travel')!
const u = (f: number): number => (f + 0.5 - seg.firstFrame) / seg.frames
const base = new TravelShape(id, JSON.parse(process.argv[5] ?? '{}') as Partial<TravelLook>)
const lo = base.pan(u(a))
const hi = base.pan(u(b))
for (const j of process.argv.slice(6)) {
  const s = new TravelShape(id, JSON.parse(j) as Partial<TravelLook>)
  let n = 0
  let first = -1
  let peak = 0
  for (let f = seg.firstFrame; f < seg.endFrame; f++) {
    const w = s.pan(u(f))
    peak = Math.max(peak, s.pan(u(f + 1)) - w)
    if (w >= lo && w <= hi) {
      n++
      if (first < 0) first = f
    }
  }
  console.log(j + ': the same stretch of the turn takes ' + n + ' frames from ' + first + ', peak pan share per frame ' + peak.toFixed(4))
}
