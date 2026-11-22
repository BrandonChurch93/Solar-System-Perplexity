import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
const d = new FilmDirector(plans)
let out = ''
for (const f of [5025, 5060, 5085, 5086, 5095, 5096, 5097, 5098, 5099, 5100, 5115, 5144, 5145, 5235, 5362]) { const s = d.shotAt(f, f / config.fps) as any; out += f + ' ' + s.sun.glare.toFixed(3) + '  ' }
console.log(out)
