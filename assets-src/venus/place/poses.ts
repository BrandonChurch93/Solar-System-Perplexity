import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan, deck } from '../../../src/stops/venus/plan'
import placeJson from '../../../src/stops/venus/place.json'
import fit from '../../../src/stops/venus/fit.json'

// Prints the poses the new dive and rise have to join: the hold's last frames, the close side from the
// first terrain frame on (as twins on the sphere, in the frame of the place), the rise's last frames.
const deg = THREE.MathUtils.radToDeg
const globe = new THREE.Quaternion().fromArray(fit.globe.quaternion)
const twin = (time: number, close: { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }) => {
  const rot = plan.turn(time).multiply(plan.terrainFrame)
  return { position: close.position.clone().sub(deck.centre).divideScalar(deck.radius).applyQuaternion(rot), quaternion: rot.clone().multiply(close.quaternion), vfov: close.vfov }
}
const under = new THREE.Vector3().fromArray(placeJson.place.under.direction)
const head = new THREE.Vector3().fromArray(placeJson.place.heading)
const right = head.clone().cross(under)
const local = (time: number, p: { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }): string => {
  const back = globe.clone().invert().multiply(plan.turn(time).invert())
  const pos = p.position.clone().applyQuaternion(back)
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quaternion).applyQuaternion(back)
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(p.quaternion).applyQuaternion(back)
  const n = pos.clone().normalize()
  const arcAhead = deg(Math.atan2(n.dot(head), n.dot(under)))
  const arcRight = deg(Math.asin(n.dot(right)))
  const pitch = deg(Math.asin(fwd.dot(n)))
  const flat = fwd.clone().addScaledVector(n, -fwd.dot(n)).normalize()
  const e = new THREE.Vector3(0, 1, 0).cross(n).normalize()
  const no = n.clone().cross(e)
  const az = deg(Math.atan2(flat.dot(e), flat.dot(no)))
  const lvl = n.clone().addScaledVector(fwd, -n.dot(fwd)).normalize()
  const roll = deg(Math.atan2(up.clone().cross(lvl).dot(fwd), up.dot(lvl)))
  return 'h ' + (pos.length() - 1).toFixed(5) + ' ahead ' + arcAhead.toFixed(3) + ' right ' + arcRight.toFixed(3) + ' pitch ' + pitch.toFixed(2) + ' az ' + az.toFixed(2) + ' roll ' + roll.toFixed(2) + ' vfov ' + p.vfov.toFixed(1)
}
const t = (f: number): number => (f + config.shutterFraction * 0.5) / config.fps
console.log('segments', JSON.stringify({ hold: plan.seg.hold, dive: plan.seg.dive, terrain: plan.seg.terrain, rise: plan.seg.rise }))
for (const f of [1255, 1258, 1259]) console.log('hold', f, local(t(f), plan.hold(t(f) - plan.seg.hold.start)))
for (const f of [1260, 1270, 1280, 1290, 1300, 1305, 1310, 1313]) { const s = plan.dive(t(f)); console.log('dive now', f, s.view, s.view === 'orbit' ? local(t(f), s.pose) : local(t(f), twin(t(f), s.pose))) }
for (const f of [1314, 1320, 1330, 1340, 1349]) { const s = plan.dive(t(f)); console.log('dive now', f, s.view, local(t(f), s.view === 'orbit' ? s.pose : twin(t(f), s.pose))) }
for (const f of [1350, 1351, 1352, 1380, 1440, 1500, 1527, 1528, 1529]) console.log('terrain', f, local(t(f), twin(t(f), plan.terrain(t(f) - plan.seg.terrain.start))))
for (const f of [1530, 1540, 1550, 1559, 1560, 1570, 1580, 1590, 1600, 1603, 1604]) { const s = plan.rise(t(f)); console.log('rise now', f, s.view, local(t(f), s.view === 'orbit' ? s.pose : twin(t(f), s.pose))) }
