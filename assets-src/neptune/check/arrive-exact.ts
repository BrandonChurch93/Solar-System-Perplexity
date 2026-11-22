import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { plan } from '../../../src/stops/neptune/plan'
const argv = process.argv.slice(2)
if (argv[0] !== 'now') plan.p.arrive!.swingDeg = Number(argv[0])
const frames = argv.slice(1).map(Number)
const director = new FilmDirector(plans)
const seen = new Set<unknown>()
const flat = (v: any, depth: number): unknown => {
  if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean' || v === null || v === undefined) return v
  if (typeof v === 'function' || depth > 6) return undefined
  if (ArrayBuffer.isView(v)) return Array.from(v as any)
  if (seen.has(v)) return undefined
  seen.add(v)
  if (Array.isArray(v)) return v.map((x) => flat(x, depth + 1))
  const o: Record<string, unknown> = {}
  for (const k of Object.keys(v).sort()) { if (k === 'plan' || k === 'set' || k.startsWith('_listeners')) continue; o[k] = flat(v[k], depth + 1) }
  return o
}
for (const f of frames) {
  seen.clear()
  const shot: any = director.shotAt(f, f / config.fps)
  console.log(f + ' ' + JSON.stringify(flat(shot, 0)))
}
