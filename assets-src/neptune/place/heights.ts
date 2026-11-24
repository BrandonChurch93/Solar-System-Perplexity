// npx tsx assets-src/neptune/place/heights.ts A B [step]: height of the camera over the cloud deck (radii) per frame, hold, dive, terrain, rise.
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/neptune/plan'
const fps = config.fps
const a = Number(process.argv[2]), b = Number(process.argv[3]), step = Number(process.argv[4] ?? 1)
for (let f = a; f <= b; f += step) {
  const t = f / fps
  const p = t < plan.seg.dive!.start ? plan.hold(t - plan.seg.hold.start) : t < plan.seg.dive!.end ? plan.divePose(t, 'orbit') : t < plan.seg.rise!.start ? null : t < plan.seg.rise!.end ? plan.risePose(t, 'orbit') : null
  console.log(f, p ? (p.position.length() - 1).toFixed(4) : 'not an orbit pose', p ? p.vfov.toFixed(2) : '')
}
