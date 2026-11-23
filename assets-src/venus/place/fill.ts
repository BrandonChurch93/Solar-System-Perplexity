// Where the bottom of the frame meets the deck (unit sphere) in the rise or the dive, as arc from the point under the
// twin of place.json: ahead along its heading and to the right, in degrees. The close scene ends behind the camera of
// the judged frame, so a frame whose lower corners reach further back than a frame known to be filled shows its edge.
// npx tsx assets-src/venus/place/fill.ts KIND 'SHAPE JSON or -' FRAME ...
import * as THREE from 'three'
import { config } from '../../../src/config'
import moveJson from '../../../src/stops/venus/move.json'
import placeJson from '../../../src/stops/venus/place.json'
import { between, type MoveShape } from '../../../src/stops/venus/path'
import { plan } from '../../../src/stops/venus/plan'
import fit from '../../../src/stops/venus/fit.json'

const deg = THREE.MathUtils.radToDeg
const kind = process.argv[2] as 'dive' | 'rise'
const shape = (process.argv[3] && process.argv[3] !== '-' ? JSON.parse(process.argv[3]) : moveJson[kind]) as MoveShape
const seg = kind === 'dive' ? (plan.seg.dive ?? plan.seg.rise) : plan.seg.rise
const under = new THREE.Vector3().fromArray(placeJson.place.under.direction).normalize()
const heading = new THREE.Vector3().fromArray(placeJson.place.heading).normalize()
const right = new THREE.Vector3().crossVectors(heading, under).normalize()
for (const a of process.argv.slice(4)) {
  const f = Number(a)
  const time = (f + config.shutterFraction * 0.5) / config.fps
  const u = (time - seg.start) / (seg.end - seg.start)
  const close = plan.twin(plan.terrain(time - plan.seg.terrain.start), time)
  const p = kind === 'dive' ? between(plan.hold(time - plan.seg.hold.start), close, plan.anchor(time), u, shape) : between(close, plan.after(time), plan.anchor(time), u, shape)
  // into the body fixed frame of the globe
  const toBody = plan.turn(time).multiply(new THREE.Quaternion().fromArray(fit.globe.quaternion)).invert()
  const t = Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)
  const out: string[] = []
  for (const [name, x, y] of [['left', -1, -1], ['middle', 0, -1], ['right', 1, -1]] as [string, number, number][]) {
    const d = new THREE.Vector3(x * t * 16 / 9, y * t, -1).normalize().applyQuaternion(p.quaternion)
    const b = p.position.dot(d)
    const disc = b * b - (p.position.lengthSq() - 1)
    if (disc < 0) { out.push(name + ' off the sphere'); continue }
    const hit = p.position.clone().addScaledVector(d, -b - Math.sqrt(disc)).applyQuaternion(toBody).normalize()
    out.push(name + ' ahead ' + deg(Math.asin(hit.dot(heading))).toFixed(3) + ' right ' + deg(Math.asin(hit.dot(right))).toFixed(3))
  }
  console.log(f, 'h', (p.position.length() - 1).toFixed(4), out.join(' | '))
}
