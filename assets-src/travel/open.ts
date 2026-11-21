import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
const d = new FilmDirector(plans)
const segs = config.segments.filter((s) => s.kind === 'travel')
for (const s of segs) {
  const a = Math.round(s.start * config.fps), b = Math.round(s.end * config.fps)
  const rows: string[] = []
  for (let f = a; f < b; f += (f < a + 3 || f >= b - 4) ? 1 : 6) {
    const x = d.shotAt(f, (f + 0.25) / config.fps)
    rows.push(`${f}:${x.skyExposure.toFixed(3)}/${(x.skyStars ?? 0).toFixed(2)}/${(x.skyPatch ?? 1).toFixed(2)}`)
  }
  const x0 = d.shotAt(a, a / config.fps), x1 = d.shotAt(b - 1, (b - 1 + 0.5) / config.fps)
  console.log(s.id, 'first', x0.skyExposure, x0.skyStars, 'last', x1.skyExposure, x1.skyStars, x1.skyPatch)
  console.log('  ' + rows.join(' '))
}
{
  const s = config.segments.find((x) => x.id === 'ending.retreat')!
  const a = Math.round(s.start * config.fps), b = Math.round(s.end * config.fps)
  const rows: string[] = []
  for (let f = a; f < b; f += 6) {
    const x = d.shotAt(f, (f + 0.25) / config.fps)
    rows.push(`${f}:${x.skyExposure.toFixed(3)}/${(x.skyStars ?? 0).toFixed(2)}`)
  }
  console.log(s.id + '\n  ' + rows.join(' '))
  for (const f of [b - 1, b, 5235, 5360]) { const x = d.shotAt(f, (f + 0.25) / config.fps); console.log(f, x.skyExposure, x.skyStars, x.skyPatch) }
}
for (let i = 0; i < 8; i++) console.log('patch span', config.stopIds[i], d.patchSpanOf(i).map((x) => x.toFixed(3)).join(' '))
