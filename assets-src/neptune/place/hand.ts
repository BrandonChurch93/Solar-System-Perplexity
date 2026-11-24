// npx tsx assets-src/neptune/place/hand.ts: the frames of the two handovers as the engine holds them.
import { config } from '../../../src/config'
import { handoverOf } from '../../../src/director/handover'
import { plan } from '../../../src/stops/neptune/plan'

void plan
for (const k of ['dive', 'rise'] as const) {
  const h = handoverOf('neptune', k)!
  console.log(k, JSON.stringify({ firstFrame: h.firstFrame, lastFrame: h.lastFrame, placeFirstFrame: h.placeFirstFrame, placeLastFrame: h.placeLastFrame, skyFrames: h.skyFrames, time: h.time, frame: h.time * config.fps }))
}
