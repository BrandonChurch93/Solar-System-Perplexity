import { createHash } from 'node:crypto'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

const from = Number(process.argv[2] ?? 0)
const to = Number(process.argv[3] ?? 5024)
const d = new FilmDirector(plans)
const h = createHash('sha256')
for (let f = from; f <= to; f++) for (const o of [0, config.shutterFraction * 0.5, config.shutterFraction]) h.update(JSON.stringify(d.shotAt(f, (f + o) / config.fps)))
console.log('shots ' + from + ' to ' + to + ' at shutter open, mid, close: ' + h.digest('hex').slice(0, 16))
