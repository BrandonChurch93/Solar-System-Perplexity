import { loadConfig } from '../../../tools/lib/common'
import { handoverOf } from '../../../src/director/handover'
import { StopPlan } from '../../../src/director/moves'
import { plan } from '../../../src/stops/jupiter/plan'

const cfg = loadConfig()
const out: Record<string, number[][]> = {}
for (const kind of ['dive', 'rise'] as const) {
  const seg = cfg.segments.find((s) => s.stop === 'jupiter' && s.kind === kind)!
  const h = handoverOf('jupiter', kind)
  const rows: number[][] = []
  for (let q = seg.firstFrame * 8; q <= seg.endFrame * 8; q++) {
    const t = q / 8 / cfg.fps
    const close = h !== null && (kind === 'dive' ? t >= h.time : t <= h.time)
    const p = close ? (kind === 'dive' ? plan.divePose(t, 'orbit') : plan.risePose(t, 'orbit')) : kind === 'dive' ? StopPlan.prototype.divePose.call(plan, t, 'orbit') : StopPlan.prototype.risePose.call(plan, t, 'orbit')
    rows.push([q / 8, p.position.length() - 1])
  }
  out[kind] = rows
}
console.log(JSON.stringify(out))
