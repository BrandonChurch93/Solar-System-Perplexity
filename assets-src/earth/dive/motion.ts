import * as THREE from 'three'
import { config } from '../../../src/config'
import { shutterMotion, samplesNeeded } from '../../../src/core/motion'
import { sampleCount, shutterMid } from '../../../src/core/sampler'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { segmentAtFrame } from '../../../src/director/timeline'

const arg = (name: string, d: string): string => {
  const i = process.argv.indexOf('--' + name)
  return i >= 0 ? process.argv[i + 1]! : d
}
const [first, last] = arg('range', '1830-1920').split('-').map(Number) as [number, number]
const step = Number(arg('step', '1'))
const tier = arg('tier', 'review')
const director = new FilmDirector(plans)
const plan = plans.find((p) => p.id === 'earth')!
const limb = (f: number): number => {
  const shot = director.shotAt(f, (f + shutterMid()) / config.fps)
  const s = shot.sets[0]!
  const d = shot.camera.position.distanceTo(s.origin)
  if (s.view !== 'orbit') return 0
  return (Math.tan(Math.asin(Math.min(1 / d, 1))) / Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2)) * 540
}
for (let f = first; f <= last; f += step) {
  const at = (o: number) => director.shotAt(f, (f + o) / config.fps)
  const open = at(0)
  const mid = at(shutterMid())
  const close = at(config.shutterFraction)
  const cover = mid.cover.amount
  const bare = shutterMotion(open, { ...mid, cover: { ...mid.cover, amount: 0 } }, close)
  const seg = segmentAtFrame(f)
  const base = sampleCount(tier, seg.kind)
  const n = samplesNeeded(base, config.tiers[tier]!.maxSamplesPerFrame, bare * Math.max(1 - cover, 0))
  const a = limb(f)
  const b = limb(f + 1)
  const d = mid.camera.position.distanceTo(mid.sets[0]!.origin)
  console.log(f + ' ' + seg.kind + ' ' + mid.sets[0]!.view + ' dist ' + d.toFixed(3) + ' limb ' + a.toFixed(0) + ' rate ' + (a > 0 && b > 0 ? (100 * Math.log(b / a)).toFixed(2) : '-') + ' motion ' + bare.toFixed(1) + ' cover ' + cover.toFixed(2) + ' n ' + n + ' step ' + (bare / n).toFixed(2))
}
void plan
