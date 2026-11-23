import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { config } from '../../../src/config'
const d = new FilmDirector(plans) as any
for (const f of process.argv.slice(2).map(Number)) {
  const s = d.shotAt(f, f / config.fps)
  const set = s.sets.find((x: any) => x.id === 'saturn')
  console.log(f, set ? Object.fromEntries(Object.entries(set).filter(([k, v]) => typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean')) : 'none', 'seg', s.segment?.stop, s.segment?.kind)
}
