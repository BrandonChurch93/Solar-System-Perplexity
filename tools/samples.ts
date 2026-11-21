import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { config } from '../src/config'
import { shutterMotion } from '../src/core/motion'
import { sampleCount } from '../src/core/sampler'
import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'
import { segmentAtFrame, segmentById } from '../src/director/timeline'
import { args } from './lib/common'
import { samplesOf, samplesOfSpan, stressSpan } from './lib/samples'

// The one place that answers "samples of frame N at tier T" for the tools: the same rule the engine applies when it renders the frame.
// --tier T --frames a,b | --range a-b : one line per frame. --out file : JSON of every frame of the film for every tier. --report : frames whose count rises, by kind. --stress [ids] : JSON of the summed samples of each stress window.

const a = args()
const director = new FilmDirector(plans)
const all = Array.from({ length: config.frameCount }, (_, i) => i)
const tiers = a.tier ? [a.tier] : Object.keys(config.tiers)
const counts = (tier: string, frames: number[]): number[] => frames.map((f) => samplesOf(f, tier))

if (a.out) {
  const out = { fps: config.fps, frameCount: config.frameCount, maxStepPx: config.motion.maxStepPx, tiers: Object.fromEntries(tiers.map((t) => [t, counts(t, all)])) }
  mkdirSync(dirname(a.out), { recursive: true })
  writeFileSync(a.out, JSON.stringify(out))
  console.log('wrote ' + a.out)
} else if (a.stress !== undefined) {
  const st = config.raw.quality.stress
  const tier = a.tier ?? st.tier
  console.log(JSON.stringify(Object.fromEntries((a.stress === 'true' ? st.segments : a.stress.split(',')).map((id) => {
    const span = stressSpan(segmentById(id), st.seconds)
    return [id, samplesOfSpan(span.first, span.end, tier)]
  }))))
} else if (a.report !== undefined) {
  const motion = all.map((f) => shutterMotion(director.shotAt(f, f / config.fps), director.shotAt(f, (f + config.shutterFraction / 2) / config.fps), director.shotAt(f, (f + config.shutterFraction) / config.fps)))
  for (const tier of tiers) {
    const now = counts(tier, all)
    const kinds: Record<string, { frames: number; raised: number; before: number; after: number }> = {}
    const runs: string[] = []
    let from = -1
    all.forEach((f) => {
      const kind = segmentAtFrame(f).kind
      const base = sampleCount(tier, kind)
      const k = (kinds[kind] ??= { frames: 0, raised: 0, before: 0, after: 0 })
      k.frames++
      k.before += base
      k.after += now[f]!
      if (now[f]! > base) k.raised++
      const up = now[f]! > base
      const next = f + 1 < all.length && now[f + 1]! > sampleCount(tier, segmentAtFrame(f + 1).kind) && segmentAtFrame(f + 1).id === segmentAtFrame(f).id
      if (up && from < 0) from = f
      if (up && !next) {
        const span = all.slice(from, f + 1)
        runs.push(segmentAtFrame(f).id + ' ' + from + (f > from ? ' to ' + f : '') + ': ' + (a.report === 'frames' ? span.map((x) => now[x]).join(' ') : 'count ' + Math.min(...span.map((x) => now[x]!)) + ' to ' + Math.max(...span.map((x) => now[x]!)) + ', motion up to ' + Math.max(...span.map((x) => motion[x]!)).toFixed(0) + ' px'))
        from = -1
      }
    })
    const sum = (key: 'before' | 'after' | 'raised' | 'frames'): number => Object.values(kinds).reduce((s, k) => s + k[key], 0)
    console.log('tier ' + tier + ': samples of the film ' + sum('before') + ' before, ' + sum('after') + ' after, frames raised ' + sum('raised') + ' of ' + sum('frames'))
    for (const [kind, k] of Object.entries(kinds)) console.log('  ' + kind + ': frames ' + k.frames + ', raised ' + k.raised + ', samples ' + k.before + ' before, ' + k.after + ' after')
    for (const r of runs) console.log('  ' + r)
  }
} else {
  const frames = a.range ? all.slice(Number(a.range.split('-')[0]), Number(a.range.split('-')[1]) + 1) : (a.frames ?? a.frame ?? '').split(',').filter((x) => x !== '').map(Number)
  for (const tier of tiers) counts(tier, frames).forEach((n, i) => console.log(tier + ' ' + frames[i] + ' ' + n))
}
