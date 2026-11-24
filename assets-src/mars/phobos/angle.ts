import * as THREE from 'three'
import { config } from '../../../src/config'
import { shutterMid } from '../../../src/core/sampler'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { plan } from '../../../src/stops/mars/plan'
import * as look from '../../../src/stops/mars/look'
import phobos from '../../../src/stops/mars/phobos.json'

// The angle at Phobos between the eye of a frame and the eye of the hold's middle, in the moon's own frame (its tumble
// counts), and the eye's distance in moon radii. The baked lit side of the moon (phobos-lit.jpg, the hero's own
// pixels) is the hero's light as that one eye saw it; src/stops/mars/set.ts lets it go by this angle (phobos.json lit).
//   npx tsx assets-src/mars/phobos/angle.ts [firstFrame endFrame]
const film = new FilmDirector(plans)
const fps = config.fps
const home = new THREE.Vector3().fromArray(phobos.center)
const hold = new THREE.Quaternion().fromArray(phobos.holdQuaternion)
const axis = new THREE.Vector3().fromArray(phobos.tumbleAxis).normalize()
const holdEye = plan.hold(plan.holdMid - plan.seg.hold.start).position.clone().sub(home).applyQuaternion(hold.clone().invert()).normalize()
const first = Number(process.argv[2] ?? Math.round((plan.seg.hold.start - 3) * fps))
const end = Number(process.argv[3] ?? Math.round((plan.seg.rise.end + 2.5) * fps))
let line = ''
for (let f = first; f < end; f++) {
  const time = (f + shutterMid()) / fps
  const shot = film.shotAt(f, time)
  const s = shot.sets.find((x) => x.id === 'mars' && x.view === 'orbit')
  if (!s) continue
  const elapsed = s.time - plan.holdMid
  const eye = shot.camera.position.clone().sub(s.origin).applyQuaternion(s.rotation.clone().invert())
  const at = home.clone().applyQuaternion(new THREE.Quaternion().setFromAxisAngle(plan.axis, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * elapsed))
  const q = new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(look.moon.tumbleDegPerSecond) * elapsed).multiply(hold)
  const rel = eye.sub(at)
  const distance = rel.length() / phobos.radius
  const angle = THREE.MathUtils.radToDeg(rel.applyQuaternion(q.invert()).normalize().angleTo(holdEye))
  line += f + ' ' + shot.segment.id + ' ' + angle.toFixed(2) + ' deg, ' + distance.toFixed(1) + ' radii\n'
}
console.log(line)
