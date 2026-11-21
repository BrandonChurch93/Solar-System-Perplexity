import type { StopPlan } from '../../../src/director/moves'
import type { MoveParams } from '../../../src/director/moves'
import { Plan, timing as liveTune, params, plan as live, type Tune } from '../../../src/stops/earth/plan'
import { rows } from './lib'

const arg = (name: string, d: string): string => {
  const i = process.argv.indexOf('--' + name)
  return i >= 0 ? process.argv[i + 1]! : d
}
const kind = arg('kind', 'dive') as 'dive' | 'rise'
const over = arg('set', '')
let plan: StopPlan = live
if (over) {
  const o = JSON.parse(over) as Record<string, Record<string, unknown>>
  const merged = { ...params } as unknown as Record<string, unknown>
  for (const [k, v] of Object.entries(o)) merged[k] = v !== null && typeof v === 'object' && !Array.isArray(v) ? { ...(merged[k] as object), ...v } : v
  const t = (o.tune ?? {}) as Record<string, object | null>
  const tune = { dive: 'dive' in t ? (t.dive === null ? null : { ...liveTune.dive, ...t.dive }) : liveTune.dive, rise: 'rise' in t ? (t.rise === null ? null : { ...liveTune.rise, ...t.rise }) : liveTune.rise } as Tune
  delete merged.tune
  plan = new Plan(merged as unknown as MoveParams, tune)
}
const [a, b] = arg('range', kind === 'dive' ? '1830-1884' : '2130-2174').split('-').map(Number) as [number, number]
const step = Number(arg('step', '1'))
const all = rows(plan, kind, a, b)
let prev = 0
for (const r of all) {
  if ((r.f - a) % step === 0) console.log(r.f + ' h ' + r.h.toFixed(4) + ' limb ' + r.px.toFixed(0) + ' rate ' + r.rate.toFixed(2) + ' x' + (prev ? r.rate / prev : 0).toFixed(3) + ' motion ' + r.motion.toFixed(1) + ' cover ' + r.cover.toFixed(2) + ' top ' + r.top.toFixed(3) + ' tilt ' + r.tilt.toFixed(1) + ' sky ' + r.sky.toFixed(1))
  prev = r.rate
}
