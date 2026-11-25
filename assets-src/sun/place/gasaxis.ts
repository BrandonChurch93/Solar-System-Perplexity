import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/sun/plan'
// Where the eye stands in the frame of the gas (the corona's map is read by the turn about that frame's z axis, corona.ts):
// the eye's distance from the centre in radii and its angle from the z axis, on the rise and at the hold.
const seg = plan.seg.rise
const timeOf = (f: number): number => (f + 0.5 * config.shutterFraction) / config.fps
const frames = process.argv.slice(2).map(Number)
for (const f of frames.length ? frames : [190, 196, 199, 204, 209, 213, 221, 231, 241, 247, 253, 260, 269, 270, 360, 449]) {
  const t = timeOf(f)
  const p = f >= seg.endFrame ? plan.hold(t - plan.seg.hold.start) : plan.risePose(t, 'orbit')
  const e = p.position
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quaternion)
  console.log(f, 'distance', e.length().toFixed(4), 'eye', e.clone().normalize().toArray().map((x) => x.toFixed(4)).join(' '), 'angle from z', THREE.MathUtils.radToDeg(Math.acos(e.z / e.length())).toFixed(2), 'look', fwd.toArray().map((x) => x.toFixed(4)).join(' '))
}
