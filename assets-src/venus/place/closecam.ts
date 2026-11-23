import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/venus/plan'
import placeJson from '../../../src/stops/venus/place.json'
import fit from '../../../src/stops/venus/fit.json'

// Prints the twin of the close view's camera in the body fixed frame at given frames (terrain time may run
// before 0 and past the end of the segment), beside the twin of place.json (the judged frame): height,
// the way from the judged twin in heights of the judged twin (ahead along its heading, right, up), and
// the angle between the two orientations. --json FILE writes position and axes for lay.py.
// npx tsx assets-src/venus/place/closecam.ts 1335 1349 1440 1529 1545 [--json FILE]
const args = process.argv.slice(2)
const j = args.indexOf('--json')
const file = j >= 0 ? args.splice(j, 2)[1]! : ''
const globe = new THREE.Quaternion().fromArray(fit.globe.quaternion)
const under = new THREE.Vector3().fromArray(placeJson.place.under.direction)
const head = new THREE.Vector3().fromArray(placeJson.place.heading)
const right = head.clone().cross(under)
const jt = placeJson.twin.body
const jp = new THREE.Vector3().fromArray(jt.position)
const jq = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().fromArray(jt.x), new THREE.Vector3().fromArray(jt.y), new THREE.Vector3().fromArray(jt.z)))
const h0 = jp.length() - 1
const out: Record<string, object> = {}
for (const a of args) {
  const f = Number(a)
  const time = (f + config.shutterFraction * 0.5) / config.fps
  const tw = plan.twin(plan.terrain(time - plan.seg.terrain.start), time)
  const back = globe.clone().invert().multiply(plan.turn(time).invert())
  const pos = tw.position.clone().applyQuaternion(back)
  const q = back.clone().multiply(tw.quaternion)
  const d = pos.clone().sub(jp).divideScalar(h0)
  const m = new THREE.Matrix4().makeRotationFromQuaternion(q)
  const x = new THREE.Vector3(), y = new THREE.Vector3(), z = new THREE.Vector3()
  m.extractBasis(x, y, z)
  console.log(f, 'tRel', (time - plan.seg.terrain.start).toFixed(3), 'height', (pos.length() - 1).toFixed(5), 'from the judged twin in its heights: ahead', d.dot(head).toFixed(3), 'right', d.dot(right).toFixed(3), 'up', d.dot(under).toFixed(3), 'turned deg', THREE.MathUtils.radToDeg(q.angleTo(jq)).toFixed(3), 'vfov', tw.vfov)
  out[a] = { frame: f, time, position: pos.toArray(), x: x.toArray(), y: y.toArray(), z: z.toArray(), vfovDeg: tw.vfov }
}
if (file) (await import('node:fs')).writeFileSync(file, JSON.stringify(out, null, 1))
