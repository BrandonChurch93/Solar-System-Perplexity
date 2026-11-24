import { config } from '../../src/config'
import { setCapture, spanMid } from '../../src/core/clock'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

// npx tsx assets-src/travel/sundim.ts [--rate 2] [--leg ID]: the sky's level (skyExposure) at both seams of every travel leg and through it
const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf('--' + name)
  return i > 0 ? process.argv[i + 1] : undefined
}
const rate = Number(arg('rate') ?? 2)
setCapture(rate)
const film = new FilmDirector(plans)
const level = (p: number): number => film.shotAt(Math.floor(p), (p + spanMid()) / config.fps).skyExposure
const seen = (index: number, p: number): number => (film as unknown as { sunSeen(i: number, t: number): number }).sunSeen(index, (p + spanMid()) / config.fps)
const f = (x: number): string => x.toFixed(6)
const legs = config.segments.filter((s) => s.kind === 'travel' || s.kind === 'retreat')
const only = arg('leg')
console.log('leg | first frame | level of the last ' + 2 * rate + ' capture frames before | of the first ' + 2 * rate + ' of the leg | step at the seam, share of the level | last ' + 2 * rate + ' of the leg | first ' + 2 * rate + ' after | step | largest step inside the leg, share, at | lowest level, at | Sun seen at the first frame')
legs.forEach((seg, n) => {
  if (only && !seg.id.startsWith(only)) return
  const row = (from: number, count: number): number[] => Array.from({ length: count }, (_, k) => level(from + k / rate))
  const before = row(seg.firstFrame - 2, 2 * rate)
  const first = row(seg.firstFrame, 2 * rate)
  const last = row(seg.endFrame - 2, 2 * rate)
  const after = seg.endFrame < config.frameCount ? row(seg.endFrame, 2 * rate) : []
  let top = 0
  let topAt = 0
  let low = Infinity
  let lowAt = 0
  let was = level(seg.firstFrame)
  for (let k = 1; k < (seg.endFrame - seg.firstFrame) * rate; k++) {
    const p = seg.firstFrame + k / rate
    const v = level(p)
    const step = Math.abs(v - was) / Math.max(v, was)
    if (step > top) {
      top = step
      topAt = p
    }
    if (v < low) {
      low = v
      lowAt = p
    }
    was = v
  }
  const share = (a: number, b: number): string => (Math.abs(b - a) / Math.max(a, b)).toFixed(4)
  const index = seg.kind === 'travel' ? n : -1
  console.log([seg.id, seg.firstFrame, before.map(f).join(' '), first.map(f).join(' '), share(before[before.length - 1]!, first[0]!), last.map(f).join(' '), after.map(f).join(' '), after.length ? share(last[last.length - 1]!, after[0]!) : '-', top.toFixed(4) + ' at ' + topAt, f(low) + ' at ' + lowAt, index > 0 ? seen(index, seg.firstFrame).toFixed(3) : '-'].join(' | '))
})
