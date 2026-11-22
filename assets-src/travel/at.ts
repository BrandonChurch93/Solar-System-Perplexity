import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
const d = new FilmDirector(plans)
for (const f of process.argv.slice(2).map(Number)) { const s = d.shotAt(f, (f + 0.25) / config.fps); console.log(f, (s.skyStars ?? 0).toFixed(5), s.skyExposure.toFixed(5), (s.skyLook ?? 0).toFixed(4)) }
