import { writeFileSync } from 'node:fs'
import { plan } from '../../../src/stops/sun/plan'
import { config } from '../../../src/config'

const FRAME = 0
const time = (FRAME + 0.5 * config.shutterFraction) / config.fps - plan.seg.terrain.start
const pose = plan.terrain(time)
const round = (v: number): number => Math.round(v * 1e6) / 1e6
writeFileSync('src/stops/sun/apron.json', JSON.stringify({
  frame: FRAME,
  position: pose.position.toArray().map(round),
  quaternion: pose.quaternion.toArray().map(round),
  vfovDeg: pose.vfov,
  top: 0.5,
  near: [3.0, 3.6],
  feather: 0.04,
  front: { side: 0.67, centre: 0.79, at: 0.5237, span: [0.16, 0.34], feather: 0.03 },
}, null, 2) + '\n')
console.log('src/stops/sun/apron.json')
