import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

const sky = config.raw.travel.sky as unknown as { bandLook: Record<string, number>; riseLift: Record<string, number> }
const set = process.env.W
if (set !== undefined) {
  const off = (process.env.OFF ?? 'mars').split(',')
  for (const id of config.stopIds) {
    sky.bandLook[id] = off.includes(id) ? 0 : Number(set)
    if (id !== 'sun') sky.riseLift[id] = off.includes(id) ? 0 : Number(set)
  }
}
if (process.env.WINDOW) (sky as unknown as { window: number }).window = Number(process.env.WINDOW)
const d = new FilmDirector(plans)
const at = (f: number) => d.shotAt(f, (f + 0.25) / config.fps)
for (const seg of config.segments) {
  if (seg.kind !== 'rise' || seg.stop === 'sun') continue
  const next = config.segments[seg.index + 1]!
  const judged = seg.firstFrame + Math.floor(seg.frames * 0.75)
  let step = { lift: 0, sky: 0, look: 0, at: [0, 0, 0] }
  let prev = at(seg.firstFrame)
  for (let f = seg.firstFrame + 1; f < next.endFrame + 2; f++) {
    const s = at(f)
    const dl = Math.abs((s.skyStars ?? 0) - (prev.skyStars ?? 0))
    const ds = Math.abs(s.skyExposure - prev.skyExposure)
    const dk = Math.abs((s.skyLook ?? 0) - (prev.skyLook ?? 0))
    if (dl > step.lift) { step.lift = dl; step.at[0] = f }
    if (ds > step.sky && s.cover.amount === 0 && prev.cover.amount === 0) { step.sky = ds; step.at[1] = f }
    if (dk > step.look) { step.look = dk; step.at[2] = f }
    prev = s
  }
  const row = (f: number) => { const s = at(f); return `${f}: lift ${(s.skyStars ?? 0).toFixed(3)} sky ${s.skyExposure.toFixed(3)} look ${(s.skyLook ?? 0).toFixed(2)}` }
  const e = seg.endFrame
  console.log(`${seg.id} | ${[judged, e - 2, e - 1, e, e + 1, e + 8, e + 16, e + 24].map(row).join(' | ')} | largest step per frame: lift ${step.lift.toFixed(3)} at ${step.at[0]}, sky ${step.sky.toFixed(3)} at ${step.at[1]}, look ${step.look.toFixed(3)} at ${step.at[2]}`)
}
