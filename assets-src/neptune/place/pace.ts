// Round 39 issue 11: npx tsx assets-src/neptune/place/pace.ts [first last]. Per frame: where the Sun and the planet's
// centre are on screen (px of 1920 x 1080), the limb's radius on screen, and how far each moved since the frame before.
import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/neptune/plan'

const fps = config.fps
const first = Number(process.argv[2] ?? plan.seg.dive!.firstFrame - 8)
const last = Number(process.argv[3] ?? plan.seg.dive!.firstFrame + 32)
const pose = (f: number) => {
  const t = f / fps
  if (t < plan.seg.dive!.start) return plan.hold(t - plan.seg.hold.start)
  if (t < plan.seg.dive!.end) return plan.divePose(t, 'orbit')
  return plan.twin(plan.terrain(t - plan.seg.terrain.start), t)
}
const seen = (f: number) => {
  const p = pose(f)
  const th = Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)
  const back = p.quaternion.clone().invert()
  const px = (d: THREE.Vector3): [number, number] => [960 + 540 * d.x / -d.z / th, 540 - 540 * d.y / -d.z / th]
  const sun = px(plan.sunDir.clone().applyQuaternion(back))
  const centre = px(p.position.clone().negate().applyQuaternion(back))
  const h = p.position.length() - 1
  const limb = 540 * Math.tan(Math.asin(1 / (1 + h))) / th
  return { sun, centre, limb, h, vfov: p.vfov }
}
console.log('frame\theight\tvfov\tsunX\tsunY\tsun px/f\tcentreX\tcentreY\tcentre px/f\tlimb radius px\tlimb px/f\tscale %/f')
let before = seen(first - 1)
for (let f = first; f <= last; f++) {
  const s = seen(f)
  const d = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1])
  console.log([f, s.h.toFixed(4), s.vfov.toFixed(2), s.sun[0].toFixed(1), s.sun[1].toFixed(1), d(s.sun, before.sun).toFixed(2), s.centre[0].toFixed(1), s.centre[1].toFixed(1), d(s.centre, before.centre).toFixed(2), s.limb.toFixed(1), (s.limb - before.limb).toFixed(2), (100 * (s.limb / before.limb - 1)).toFixed(2)].join('\t'))
  before = s
}
