// The camera of the film at the unit sphere of the stop, as the smooth report takes it (tools/smooth/camera.ts, carriedCamera), with
// the turn of the ground at that time (plan.laid), for whole film frames: npx tsx assets-src/neptune/check/weave.ts 4696,4704 > poses.json
// Read by weave.py, which carries a later frame back onto an earlier one on the sphere and judges the pair with the report's own
// pattern function.
import { config } from '../../../src/config'
import { setCapture, spanMid } from '../../../src/core/clock'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { carriedCamera } from '../../../tools/smooth/camera'
import { plan as neptune } from '../../../src/stops/neptune/plan'

const frames = (process.argv[2] ?? '').split(',').filter((s) => s.length > 0).map(Number)
const film = new FilmDirector(plans)
const plan = plans.find((p) => p.id === 'neptune')!
setCapture(1)
const out: Record<string, { p: number[]; q: number[]; vfov: number; laid: number[]; height: number; side: string }> = {}
for (const f of frames) {
  const time = (f + spanMid()) / config.fps
  const c = carriedCamera(film, plan, 'neptune', f, time)
  out[String(f)] = { p: c.pose.position.toArray(), q: c.pose.quaternion.toArray(), vfov: c.pose.vfov, laid: neptune.laid(time).toArray(), height: c.pose.position.length() - 1, side: c.side }
}
console.log(JSON.stringify(out))
