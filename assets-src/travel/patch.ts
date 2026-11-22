import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
const d = new FilmDirector(plans)
config.segments.filter((s) => s.kind === 'travel').forEach((s, i) => {
  const span = d.patchSpanOf(i)
  const f = (u: number): number => Math.round(s.firstFrame + u * s.frames)
  const row: string[] = []
  for (const g of [0.3, 0.5, 0.6, 0.7, 0.8, 0.9]) { const fr = f(g); const x = d.shotAt(fr, (fr + 0.25) / config.fps); row.push(`${fr}: patch ${(x.skyPatch ?? 0).toFixed(2)} lift ${(x.skyStars ?? 0).toFixed(2)} sky ${x.skyExposure.toFixed(2)}`) }
  console.log(`${s.id} patch from u ${span[0].toFixed(3)} (frame ${f(span[0])}) to ${span[1].toFixed(3)} (frame ${f(span[1])}) | ${row.join(' | ')}`)
})
