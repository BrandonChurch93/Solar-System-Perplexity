import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'
import { aimAt, aimOf } from '../src/space/aim'

const at = process.argv.indexOf('--stop')
const only = at >= 0 ? process.argv[at + 1] : null
const sky = new FilmDirector(plans).sky
const show = (v: [number, number, number]): string => '[' + v.map((x) => Number(x.toFixed(5))).join(', ') + ']'
plans.forEach((p, i) => {
  if (only && p.id !== only) return
  const aims = sky.patches[p.id]
  if (!aims) return
  const orbit = aimOf(aims.orbit)
  const terrain = aimOf(aims.terrain)
  const back = aimAt(orbit[0], orbit[1], orbit[2]).invert().multiply(aims.orbit.clone().normalize())
  const off = (2 * Math.asin(Math.min(1, Math.hypot(back.x, back.y, back.z))) * 180) / Math.PI
  const set = p.p.skyAim
  console.log(p.id + ': skyAim: { orbit: ' + show(orbit) + ', terrain: ' + show(terrain) + ' }')
  let note: string
  if (p.id === sky.anchor) note = 'this stop carries the fit of the whole sky: its aims are fixed in src/space/skyframe.json'
  else if (plans[i - 1]?.id === sky.anchor) note = 'the arrival here shares its sky with the approved rise of ' + sky.anchor + ': an orbit aim in this plan is ignored. In the plan now: orbit ' + (set?.orbit ? show(set.orbit) + ' (ignored)' : 'not set') + ', terrain ' + (set?.terrain ? show(set.terrain) : 'not set, follows the orbit view')
  else {
    const second = plans[1]
    const shared = i === 0 && second ? ' This hold shares its sky with the arrival at ' + second.id + ': an orbit aim here is used only while ' + second.id + ' has none.' : ''
    note = 'in the plan now: orbit ' + (set?.orbit ? show(set.orbit) : 'not set, so it moves when another stop changes its exit, its travel or its own aim') + ', terrain ' + (set?.terrain ? show(set.terrain) : 'not set, follows the orbit view') + '.' + shared
  }
  console.log('  ' + note + ' Read back within ' + off.toFixed(6) + ' deg.')
})
