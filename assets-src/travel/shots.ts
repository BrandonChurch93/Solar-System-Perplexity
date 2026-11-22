import { createHash } from 'node:crypto'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
const d = new FilmDirector(plans)
const total = config.segments[config.segments.length - 1]!.endFrame
for (let f = 0; f < total; f++) {
  const s = d.shotAt(f, (f + 0.25) / config.fps)
  console.log(f, createHash('sha256').update(JSON.stringify(s)).digest('hex').slice(0, 16))
}
