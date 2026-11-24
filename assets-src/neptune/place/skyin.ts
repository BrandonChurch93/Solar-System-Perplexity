// npx tsx assets-src/neptune/place/skyin.ts [first last]: is any sky in the frame? Per frame of the dive the corner of the 16 by 9 frame
// that is farthest out from the planet's centre, as the angle from the centre less the angle of the limb (degrees). Above 0 the corner
// shows sky, under 0 the whole frame lies on the globe. The air above the limb is not counted: allow about 1 degree for it.
import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/neptune/plan'

const fps = config.fps
const seg = plan.seg.dive!
const first = Number(process.argv[2] ?? seg.firstFrame)
const last = Number(process.argv[3] ?? seg.endFrame - 1)
const names = ['upper left', 'upper right', 'lower left', 'lower right']
for (let f = first; f <= last; f++) {
  const p = plan.divePose((f + config.shutterFraction / 2) / fps, 'orbit')
  const th = Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)
  const centre = p.position.clone().negate().normalize()
  const limb = THREE.MathUtils.radToDeg(Math.asin(1 / p.position.length()))
  let out = -Infinity
  let which = 0
  for (let i = 0; i < 4; i++) {
    const d = new THREE.Vector3((i % 2 ? 1 : -1) * th * 16 / 9, (i < 2 ? 1 : -1) * th, -1).normalize().applyQuaternion(p.quaternion)
    const a = THREE.MathUtils.radToDeg(d.angleTo(centre)) - limb
    if (a > out) {
      out = a
      which = i
    }
  }
  console.log(f + '\t' + (p.position.length() - 1).toFixed(3) + '\t' + out.toFixed(2) + '\t' + names[which] + (out > 0 ? '\tsky' : ''))
}
