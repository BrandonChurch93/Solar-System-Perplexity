import { config } from '../../../src/config'
import { StopPlan, type Fit, type MoveParams } from '../../../src/director/moves'

const arg = (name: string, d: string): string => {
  const i = process.argv.indexOf('--' + name)
  return i >= 0 ? process.argv[i + 1]! : d
}
const id = arg('stop', 'earth')
const fit = (await import('../../../src/stops/' + id + '/fit.json')).default as unknown
const { params } = (await import('../../../src/stops/' + id + '/plan')) as { params: MoveParams }
const over = JSON.parse(arg('set', '{}')) as Record<string, Record<string, unknown>>
const merged = { ...params } as unknown as Record<string, unknown>
for (const [k, v] of Object.entries(over)) merged[k] = typeof v === 'object' && !Array.isArray(v) ? { ...(merged[k] as object), ...v } : v
const plan = new StopPlan(id, fit as Fit, merged as unknown as MoveParams)
const kind = arg('kind', 'dive') as 'dive' | 'rise'
const step = Number(arg('step', '2'))
const seg = config.segments.find((s) => s.stop === id && s.kind === kind)!
const size = (f: number): { px: number; h: number; cover: number } | null => {
  const time = (f + 0.25) / config.fps
  const r = kind === 'dive' ? plan.dive(time) : plan.rise(time)
  if (r.view !== 'orbit') return null
  const h = r.pose.position.length() - 1
  const px = (Math.tan(Math.asin(1 / (1 + h))) / Math.tan(((r.pose.vfov * Math.PI) / 180) / 2)) * 540
  return { px, h, cover: plan.coverAmount(seg, time) }
}
const out: string[] = []
let worst = 0
for (let f = seg.firstFrame; f < seg.endFrame; f += step) {
  const a = size(f)
  const b = size(f + 1)
  if (!a || !b) continue
  const rate = Math.log(b.px / a.px)
  const p = size(f - 1)
  const jerk = p ? rate / Math.log(a.px / p.px) : 0
  if (a.cover < 0.5 && Math.abs(rate) > worst) worst = Math.abs(rate)
  out.push(f + ' h ' + a.h.toFixed(3) + ' limb px ' + a.px.toFixed(0) + ' rate %/f ' + (100 * rate).toFixed(2) + ' x' + jerk.toFixed(2) + ' cover ' + a.cover.toFixed(2))
}
console.log(out.join('\n'))
console.log('largest rate with cover under 0.5: ' + (100 * worst).toFixed(1) + ' % per frame')
