import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { TravelShape } from '../../src/space/travel/path'
const d = new FilmDirector(plans)
for (let i = 1; i + 1 < plans.length; i++) {
  const row: string[] = []
  for (let b = -24; b <= 24; b += 4) row.push(b + ':' + d.clearOf(i, new TravelShape(plans[i]!.id, { bowDeg: b })).toFixed(2))
  console.log(plans[i]!.id.padEnd(8) + row.join(' '))
}
