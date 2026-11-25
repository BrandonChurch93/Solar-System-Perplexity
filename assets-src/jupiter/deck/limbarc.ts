import * as THREE from 'three'
import { args } from '../../../tools/lib/common'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { chartEye } from '../../../src/stops/jupiter/plan'
import * as look from '../../../src/stops/jupiter/look'
import deck from '../../../src/stops/jupiter/deck.json'
import place from '../../../src/stops/jupiter/place.json'

// The two laws of the limb, frame by frame, from the film's own camera (place.json limb.near and scene.limb).
//   npx tsx assets-src/jupiter/deck/limbarc.ts [--frames 2820-3314] [--every 1] [--arc 261]
// For each frame with the globe in view: the eye's height in radii, the lens, the foot of one pixel of the master frame at the limb in
// units, the scale height of the rim's glow in pixels (the measure of limb.near) and the share of the globe's rim it gives, the arc on
// the sphere from the place to the nearest point of the limb, and the smallest and largest share of the deck's own horizon glow round
// the horizon with their mean (scene.limb times what the rim has given up; the mean is what the globe's shells give way by).
// The last lines: the frames outside the dive and the rise in which the rim is not whole and in which the deck's glow stands somewhere
// (there must be none of either: the deck is on stage in the dive and the rise only, and that must cut nothing), the frames in which
// the rim is not whole and in which it is gone, the frames in which the deck's glow stands somewhere and everywhere, and the frames
// outside the dive and the rise whose limb passes within --arc units of the place (what a law of place alone would change).

const a = args()
const every = Number(a.every ?? 1)
const arc = Number(a.arc ?? 261)
const film = new FilmDirector(plans)
const plan = plans[config.stopIds.indexOf('jupiter')]!
const [first, last] = String(a.frames ?? '0-' + (config.frameCount - 1)).split('-').map(Number)
const R = place.solved.radiusUnits
const near = place.limb.near as number[]
const share = place.scene.limb as number[]
const steps = place.scene.horizon
const centre = deck.plates.far.centre as number[]
const rows = config.formats[config.formatKeys.master]!.height
const eye = new THREE.Vector3()
const E = new THREE.Vector3()
const zenith = new THREE.Vector3()
const level1 = new THREE.Vector3()
const level2 = new THREE.Vector3()
const point = new THREE.Vector3()
const middle = new THREE.Vector3(centre[0]!, centre[1]!, Math.sqrt(Math.max(R * R - centre[0]! * centre[0]! - centre[1]! * centre[1]!, 0)))
const spans: Record<string, number[]> = {}
const mark = (key: string, f: number): void => {
  const s = spans[key] ?? (spans[key] = [f, f, 0])
  s[1] = f
  s[2] = s[2]! + 1
}
for (let f = first!; f <= (last ?? first!); f++) {
  const time = f / config.fps
  const shot = film.shotAt(f, time)
  const set = shot.sets.find((s) => s.id === 'jupiter')
  if (!set || set.view !== 'orbit') continue
  eye.copy(shot.camera.position).sub(set.origin).applyQuaternion(set.rotation.clone().invert())
  chartEye(plan.turn(time), eye, E)
  const rho = Math.hypot(E.x, E.y)
  const dist = Math.hypot(rho, E.z + R)
  const under = Math.atan2(rho, E.z + R) * R
  const limb = Math.acos(Math.min(R / dist, 1)) * R
  const nearest = Math.abs(limb - under)
  const tangent = Math.sqrt(Math.max(dist * dist - R * R, 0))
  const foot = tangent * 2 * Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2) / rows
  const glow = look.edge.air[1] * R / foot
  const rim = 1 - THREE.MathUtils.smoothstep(glow, near[0]!, near[1]!)
  zenith.set(E.x, E.y, E.z + R)
  const reach = Math.acos(Math.min(R / zenith.length(), 1))
  zenith.normalize()
  level1.set(0, 1, 0).cross(zenith).normalize()
  level2.crossVectors(zenith, level1)
  let least = 1
  let most = 0
  let mean = 0
  for (let i = 0; i < steps; i++) {
    const turn = 2 * Math.PI * i / steps
    point.copy(zenith).multiplyScalar(Math.cos(reach)).addScaledVector(level1, Math.sin(reach) * Math.cos(turn)).addScaledVector(level2, Math.sin(reach) * Math.sin(turn)).multiplyScalar(R)
    const stands = (1 - rim) * (1 - THREE.MathUtils.smoothstep(point.distanceTo(middle), share[0]!, share[1]!))
    least = Math.min(least, stands)
    most = Math.max(most, stands)
    mean += stands / steps
  }
  const own = shot.segment.stop === 'jupiter' && (shot.segment.kind === 'dive' || shot.segment.kind === 'rise')
  if (!own && rim < 1) mark('outside the dive and the rise, rim not whole', f)
  if (!own && most > 0) mark("outside the dive and the rise, deck's glow stands somewhere", f)
  if (!own && nearest < arc) mark('outside the dive and the rise, limb within ' + arc + ' units of the place', f)
  if (rim < 1) mark('rim not whole', f)
  if (rim <= 0) mark('rim gone', f)
  if (most > 0) mark("deck's glow stands somewhere", f)
  if (least >= 1) mark("deck's glow stands everywhere", f)
  if ((f - first!) % every === 0) console.log('frame ' + f + ': height ' + (dist / R - 1).toFixed(4) + ' radii, lens ' + shot.camera.vfov.toFixed(2) + ' degrees, foot at the limb ' + foot.toFixed(4) + " units, rim's glow " + glow.toFixed(2) + ' px, rim ' + rim.toFixed(3) + ', limb from the place ' + nearest.toFixed(1) + " units, deck's glow " + least.toFixed(3) + ' to ' + most.toFixed(3) + ', mean ' + mean.toFixed(3) + (own ? '' : ' (not the dive or rise)'))
}
if (!spans['outside the dive and the rise, rim not whole']) console.log('outside the dive and the rise, rim not whole: no frame')
if (!spans["outside the dive and the rise, deck's glow stands somewhere"]) console.log("outside the dive and the rise, deck's glow stands somewhere: no frame")
for (const [key, s] of Object.entries(spans)) console.log(key + ': ' + s[2] + ' frames between ' + s[0] + ' and ' + s[1])
