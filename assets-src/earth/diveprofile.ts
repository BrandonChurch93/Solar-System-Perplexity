import { config } from '../../src/config'

const id = process.argv[2] ?? 'earth'
const step = Number(process.argv[3] ?? 8)
const mod = (await import('../../src/stops/' + id + '/plan')) as { plan: { dive(t: number): { view: string; pose: { position: { length(): number } } }; rise(t: number): { view: string; pose: { position: { length(): number } } }; coverAmount(s: unknown, t: number): number } }
for (const kind of ['dive', 'rise'] as const) {
  const seg = config.segments.find((s) => s.stop === id && s.kind === kind)!
  const row: string[] = []
  let last = 0
  for (let f = seg.firstFrame; f < seg.endFrame; f += step) {
    const time = (f + 0.25) / config.fps
    const r = kind === 'dive' ? mod.plan.dive(time) : mod.plan.rise(time)
    if (r.view !== 'orbit') {
      row.push(f + ' terrain')
      continue
    }
    const h = r.pose.position.length() - 1
    const deg = (Math.asin(1 / (1 + h)) * 180) / Math.PI
    row.push(f + ' h ' + h.toFixed(3) + ' disc ' + deg.toFixed(2) + (last ? ' x' + (deg / last).toFixed(3) : '') + ' cover ' + mod.plan.coverAmount(seg, time).toFixed(2))
    last = deg
  }
  console.log(id, kind, '\n  ' + row.join('\n  '))
}
