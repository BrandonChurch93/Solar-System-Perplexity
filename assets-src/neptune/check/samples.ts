import { config } from '../../../src/config'
import { shutterMotion, frameSamples } from '../../../src/core/motion'
import { shutterMid } from '../../../src/core/sampler'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
const d = new FilmDirector(plans)
console.log('motion', JSON.stringify(config.motion), 'shutter', config.shutterFraction, 'master', JSON.stringify(config.formats[config.formatKeys.master]), 'tiers', JSON.stringify(config.tiers))
for (let f = 4978; f <= 4996; f += 1) {
  const at = (o: number) => d.shotAt(f, (f + o) / config.fps)
  const mid = at(shutterMid())
  console.log(f, 'cover', mid.cover.amount.toFixed(3), 'motion master px', shutterMotion(at(0), mid, at(config.shutterFraction)).toFixed(1), 'review', frameSamples(d, f, 'review'), 'final', frameSamples(d, f, 'final'))
}
