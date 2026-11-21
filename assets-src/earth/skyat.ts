import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import type { MoveParams } from '../../src/director/moves'
import { aimOf } from '../../src/space/aim'
import { Plan, params } from '../../src/stops/earth/plan'

const arg = (name: string, d: string): string => {
  const i = process.argv.indexOf('--' + name)
  return i >= 0 ? process.argv[i + 1]! : d
}
const frames = arg('frames', '1755,2156,2174').split(',').map(Number)
const sets = arg('set', '{}').split(';')
for (const one of sets) {
  const o = JSON.parse(one) as Record<string, unknown>
  const merged = { ...params } as unknown as Record<string, unknown>
  for (const [k, v] of Object.entries(o)) merged[k] = v !== null && typeof v === 'object' && !Array.isArray(v) ? { ...(merged[k] as object), ...(v as object) } : v
  const mine = new Plan(merged as unknown as MoveParams)
  const director = new FilmDirector(plans.map((p) => (p.id === 'earth' ? mine : p)))
  const out = frames.map((f) => {
    const shot = director.shotAt(f, (f + config.shutterFraction / 2) / config.fps)
    const q = director.sky.frame.clone().multiply(shot.skyTurn.clone().invert()).multiply(shot.camera.quaternion)
    return f + ' [' + aimOf(q).map((x) => x.toFixed(1)).join(', ') + ']'
  })
  console.log(one + ' ' + out.join('  '))
}
