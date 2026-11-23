import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/neptune/plan'
const fps = config.fps
const hold = plan.hold(plan.holdMid - plan.seg.hold.start)
const smooth = (x: number) => { const t = Math.min(Math.max(x, 0), 1); return t * t * (3 - 2 * t) }
for (const f of [4680, 4688, 4696, 4704, 4712, 4720, 4740, 4757, 4957, 4970, 4976, 4983, 4990, 4993, 4996, 4999, 5002, 5005, 5008, 5012, 5016, 5020, 5024]) {
  const t = (f + config.shutterFraction / 2) / fps
  const p = f < 4900 ? plan.divePose(t, 'orbit') : plan.risePose(t, 'orbit')
  const off = THREE.MathUtils.radToDeg(p.position.angleTo(hold.position))
  console.log(f, 'height', (p.position.length() - 1).toFixed(3), 'offAxis', off.toFixed(2), 'home', (1 - smooth((off - 6) / 20)).toFixed(3))
}
