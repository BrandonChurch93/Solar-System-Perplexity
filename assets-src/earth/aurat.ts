import * as THREE from 'three'
import { config } from '../../src/config'
import { plan } from '../../src/stops/earth/plan'
import aur from '../../src/stops/earth/aurora.json'
const home = new THREE.Vector3().fromArray(aur.eye).normalize()
for (const f of process.argv.slice(2).map(Number)) {
  const time = (f + 0.25) / config.fps
  const seg = config.segments.find((s) => s.stop === 'earth' && f >= s.firstFrame && f < s.endFrame)!
  let pose
  if (seg.kind === 'hold') pose = plan.hold(time - seg.start)
  else if (seg.kind === 'dive') pose = plan.dive(time).pose
  else if (seg.kind === 'rise') pose = plan.rise(time).pose
  else continue
  const p = pose.position
  const e = p.clone().normalize()
  const cam = e.clone().applyQuaternion(pose.quaternion.clone().invert())
  const hq = home.clone().applyQuaternion(pose.quaternion.clone().invert())
  console.log(f, seg.kind, 'r', p.length().toFixed(3), 'eye', e.toArray().map((x) => x.toFixed(3)).join(' '), 'off home deg', THREE.MathUtils.radToDeg(e.angleTo(home)).toFixed(1), 'spin deg', THREE.MathUtils.radToDeg(plan.spin(time)).toFixed(2), 'home dir in camera', hq.toArray().map((x) => x.toFixed(2)).join(' '))
}
