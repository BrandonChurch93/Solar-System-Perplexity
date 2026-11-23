// The camera of each frame in the close frame, with the globe's flow state: npx tsx assets-src/neptune/place/poses.ts dive|rise [first last] > poses.json
// Time is the draft tier's one sample, (frame + shutterFraction / 2) / fps. Used by shown.py and cover.py.
import * as THREE from 'three'
import { config } from '../../../src/config'
import * as look from '../../../src/stops/neptune/look'
import { plan } from '../../../src/stops/neptune/plan'

const kind = (process.argv[2] ?? 'dive') as 'dive' | 'rise'
const seg = kind === 'dive' ? plan.seg.dive! : plan.seg.rise
const first = Number(process.argv[3] ?? seg.firstFrame)
const last = Number(process.argv[4] ?? seg.endFrame - 1)
const eased = (t: number, full: number, ease: number): number => {
  const a = Math.abs(t)
  if (a <= full) return t
  const x = Math.min((a - full) / ease, 1)
  return Math.sign(t) * (full + ease * (x - 0.5 * x * x))
}
const out: Record<string, unknown> = {}
for (let f = first; f <= last; f++) {
  const t = (f + config.shutterFraction / 2) / config.fps
  const local = kind === 'dive' ? plan.divePose(t, 'terrain') : plan.risePose(t, 'terrain')
  const globe = kind === 'dive' ? plan.divePose(t, 'orbit') : plan.risePose(t, 'orbit')
  const elapsed = t - plan.holdMid
  out[f] = {
    time: t,
    position: local.position.toArray(),
    quaternion: local.quaternion.toArray(),
    vfovDeg: local.vfov,
    height: globe.position.length() - 1,
    stormTurnDeg: look.storm.degPerSecond * eased(elapsed, look.storm.fullSeconds, look.storm.easeSeconds),
    streamDeg: look.stream.degPerSecond * eased(elapsed, look.stream.fullSeconds, look.stream.easeSeconds),
    closeElapsed: t - (plan.seg.terrain.start + plan.seg.terrain.end) / 2,
  }
}
console.log(JSON.stringify(out))
