import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
const d = new FilmDirector(plans)
for (const s of config.segments.filter((s) => s.kind === 'travel' || s.kind === 'retreat')) {
  const a = Math.round(s.start * config.fps), b = Math.round(s.end * config.fps) - 1
  const out: string[] = []
  for (const f of [a, b]) for (const o of [0, 0.25, 0.5]) { const x = d.shotAt(f, (f + o) / config.fps); out.push(`${f}+${o}: lift ${(x.skyStars ?? 0).toExponential(2)} dust ${x.dust.toExponential(2)}`) }
  console.log(s.id, out.join(' | '))
}
