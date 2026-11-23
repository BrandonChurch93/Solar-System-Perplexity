// The dive and the rise frame by frame: height, climb ratio, pitch, the limb in the frame, turn per frame.
// npx tsx assets-src/venus/place/turn.ts [dive|rise] [step] ['{"rate":[..],"turn":[..],"keep":[..],"lens":[..]}']
// With a shape given, the move is computed with that shape in place of the one in move.json (to try a shape before it is written there).
// limb: where the limb crosses the centre column, 0 at the frame centre, 1 at the top edge. turn: degrees between the
// orientations of this frame and the one before. ratio: height over the height of the frame before.
import * as THREE from 'three'
import { config } from '../../../src/config'
import moveJson from '../../../src/stops/venus/move.json'
import { between, type MoveShape } from '../../../src/stops/venus/path'
import { plan } from '../../../src/stops/venus/plan'

const deg = THREE.MathUtils.radToDeg
const kind = (process.argv[2] ?? 'rise') as 'dive' | 'rise'
const step = Number(process.argv[3] ?? 1)
const shape = (process.argv[4] ? JSON.parse(process.argv[4]) : moveJson[kind]) as MoveShape
const seg = kind === 'dive' ? (plan.seg.dive ?? plan.seg.rise) : plan.seg.rise
const poseAt = (time: number) => {
  const u = (time - seg.start) / (seg.end - seg.start)
  const close = plan.twin(plan.terrain(time - plan.seg.terrain.start), time)
  return kind === 'dive' ? between(plan.hold(time - plan.seg.hold.start), close, plan.anchor(time), u, shape) : between(close, plan.after(time), plan.anchor(time), u, shape)
}
let before = poseAt((seg.firstFrame - 1 + config.shutterFraction * 0.5) / config.fps)
let worstTurn = 0
let worstRatio = 0
for (let f = seg.firstFrame; f < seg.endFrame; f++) {
  const time = (f + config.shutterFraction * 0.5) / config.fps
  const p = poseAt(time)
  const up = p.position.clone().normalize()
  const h = p.position.length() - 1
  const dip = Math.acos(1 / (1 + h))
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quaternion)
  const pitch = Math.asin(fwd.dot(up))
  const limb = Math.tan(-pitch - dip) / Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)
  const turn = deg(p.quaternion.angleTo(before.quaternion))
  const ratio = h / (before.position.length() - 1)
  const moved = deg(up.angleTo(before.position.clone().normalize()))
  if (f > seg.firstFrame) {
    worstTurn = Math.max(worstTurn, turn)
    worstRatio = Math.max(worstRatio, ratio > 1 ? ratio : 1 / ratio)
  }
  if ((f - seg.firstFrame) % step === 0 || f === seg.endFrame - 1) console.log(f, 'u', ((time - seg.start) / (seg.end - seg.start)).toFixed(3), 'h', h.toFixed(4), 'ratio', ratio.toFixed(4), 'pitch', deg(pitch).toFixed(1), 'dip', deg(dip).toFixed(1), 'vfov', p.vfov.toFixed(1), 'limb', limb.toFixed(2), 'turn', turn.toFixed(2), 'arc moved', moved.toFixed(2))
  before = p
}
console.log('largest turn per frame deg', worstTurn.toFixed(2), 'largest ratio per frame', worstRatio.toFixed(4))
