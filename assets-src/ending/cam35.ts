import { createHash } from 'node:crypto'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
const d = new FilmDirector(plans)
const h = createHash('sha256')
const keys = new Set<string>()
for (let f = 5025; f <= 5399; f++) for (const o of [0, config.shutterFraction * 0.5, config.shutterFraction]) {
  const s = d.shotAt(f, (f + o) / config.fps) as unknown as Record<string, unknown>
  const sun = { ...(s.sun as Record<string, unknown>), glare: 0 }
  for (const k of Object.keys(s)) keys.add(k)
  h.update(JSON.stringify({ ...s, sun }))
}
console.log('shots 5025 to 5399 with the glare left out (' + [...keys].join(', ') + '): ' + h.digest('hex').slice(0, 16))
