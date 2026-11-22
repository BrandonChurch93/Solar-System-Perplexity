import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
const d = new FilmDirector(plans)
for (const id of ['mercury','uranus']) { const seg = config.segments.find((s) => s.id === id + '.travel')!; const r: string[] = []; for (let f = seg.firstFrame; f < seg.endFrame; f += 4) r.push(f + ':' + d.shotAt(f, (f + 0.25) / config.fps).skyExposure.toFixed(3)); console.log(id, r.join(' ')) }
