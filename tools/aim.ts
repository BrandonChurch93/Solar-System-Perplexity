import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'
import { aimAt, aimOf } from '../src/space/aim'

const at = process.argv.indexOf('--stop')
const only = at >= 0 ? process.argv[at + 1] : null
const sky = new FilmDirector(plans).sky
const show = (v: [number, number, number]): string => '[' + v.map((x) => Number(x.toFixed(5))).join(', ') + ']'
for (const p of plans) {
  if (only && p.id !== only) continue
  const aims = sky.patches[p.id]
  if (!aims) continue
  const orbit = aimOf(aims.orbit)
  const terrain = aimOf(aims.terrain)
  const back = aimAt(orbit[0], orbit[1], orbit[2]).invert().multiply(aims.orbit.clone().normalize())
  const off = (2 * Math.asin(Math.min(1, Math.hypot(back.x, back.y, back.z))) * 180) / Math.PI
  const set = p.p.skyAim
  console.log(p.id + ': skyAim: { orbit: ' + show(orbit) + ', terrain: ' + show(terrain) + ' }')
  if (p.id === sky.anchor) console.log('  this stop carries the fit of the whole sky: its aims are fixed in src/space/skyframe.json')
  else console.log('  in the plan now: orbit ' + (set?.orbit ? show(set.orbit) : 'not set, so it moves when a stop between this one and ' + sky.anchor + ' changes its exit or its travel') + ', terrain ' + (set?.terrain ? show(set.terrain) : 'not set, follows the orbit view') + '; read back within ' + off.toFixed(6) + ' deg')
}
