// S3 numbers: npx tsx assets-src/neptune/place/path.ts [dive|rise]. Height, rate, where the eye is in the frame, per frame.
import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/neptune/plan'
import place from '../../../src/stops/neptune/place.json'

const kind = (process.argv[2] ?? 'dive') as 'dive' | 'rise'
const seg = kind === 'dive' ? plan.seg.dive! : plan.seg.rise
const fps = config.fps
const eye0 = new THREE.Vector3().fromArray(place.storm.atSpinZero).normalize()
const at = (t: number) => (kind === 'dive' ? plan.divePose(t, 'orbit') : plan.risePose(t, 'orbit'))
const edge = (t: number) => (t < seg.start ? (kind === 'dive' ? plan.hold(t - plan.seg.hold.start) : plan.twin(plan.terrain(t - plan.seg.terrain.start), t)) : t >= seg.end ? (kind === 'dive' ? plan.twin(plan.terrain(t - plan.seg.terrain.start), t) : plan.exitPose(t)) : at(t))
const rows: string[] = []
let worst = 0
let sum = 0
let n = 0
for (let f = seg.firstFrame - 2; f <= seg.endFrame + 1; f++) {
  const t = f / fps
  const p = edge(t)
  const q = edge(t - 1 / fps)
  const h = p.position.length() - 1
  const rate = Math.log(h / (q.position.length() - 1))
  const e = eye0.clone().applyQuaternion(plan.turn(t)).sub(p.position).applyQuaternion(p.quaternion.clone().invert())
  const th = Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)
  const x = 0.5 + 0.5 * e.x / -e.z / (th * 16 / 9)
  const y = 0.5 - 0.5 * e.y / -e.z / th
  const under = p.position.clone().normalize()
  const arc = THREE.MathUtils.radToDeg(under.angleTo(eye0.clone().applyQuaternion(plan.turn(t))))
  const step = THREE.MathUtils.radToDeg(p.quaternion.angleTo(q.quaternion))
  const dip = THREE.MathUtils.radToDeg(Math.acos(1 / (1 + h)))
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quaternion)
  const pitch = THREE.MathUtils.radToDeg(Math.asin(-fwd.dot(under)))
  if (f > seg.firstFrame && f < seg.endFrame) { worst = Math.max(worst, Math.abs(rate)); sum += Math.abs(rate); n++ }
  rows.push([f, h.toFixed(5), (100 * rate).toFixed(2), arc.toFixed(2), x.toFixed(3), y.toFixed(3), p.vfov.toFixed(2), step.toFixed(3), pitch.toFixed(1), dip.toFixed(1)].join('\t'))
}
console.log('frame\theight\trate%\tarc\teyeX\teyeY\tvfov\tturn deg\tpitch\tdip')
console.log(rows.join('\n'))
console.log('mean rate %', (100 * sum / n).toFixed(3), 'largest %', (100 * worst).toFixed(3), 'largest over mean', (worst / (sum / n)).toFixed(3))
