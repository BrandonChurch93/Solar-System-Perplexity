import * as THREE from 'three'
import { config } from '../../src/config'
import { Plan, params } from '../../src/stops/earth/plan'
import moon from '../../src/stops/earth/moon.json'

const over = process.argv[2] ? (JSON.parse(process.argv[2]) as Record<string, unknown>) : {}
const merged = { ...params } as unknown as Record<string, unknown>
for (const [k, v] of Object.entries(over)) merged[k] = v !== null && typeof v === 'object' && !Array.isArray(v) ? { ...(merged[k] as object), ...(v as object) } : v
const plan = new Plan(merged as never)
const seg = plan.seg.hold
const px = (pose: { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }, p: THREE.Vector3, dir = false): [number, number] => {
  const v = (dir ? p.clone() : p.clone().sub(pose.position)).applyQuaternion(pose.quaternion.clone().invert())
  const k = 540 / Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2) / -v.z
  return [960 + v.x * k, 540 - v.y * k]
}
const mid = plan.hold(plan.holdMid - seg.start)
const star = new THREE.Vector3(-0.2, 0.12, -1).normalize().applyQuaternion(mid.quaternion)
const home = new THREE.Vector3().fromArray(moon.center)
const show = (a: [number, number]): string => '(' + a[0].toFixed(1) + ', ' + a[1].toFixed(1) + ')'
let first: Record<string, [number, number]> | null = null
for (const f of [seg.firstFrame, 1755, seg.firstFrame + seg.frames - 1]) {
  const t = (f + config.shutterFraction / 2) / config.fps
  const pose = plan.hold(t - seg.start)
  const tq = plan.turn(t)
  const at = {
    globe: px(pose, new THREE.Vector3()),
    spot: px(pose, plan.spot.clone().applyQuaternion(tq)),
    moon: px(pose, home.clone().applyAxisAngle(plan.axis, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * (t - plan.holdMid))),
    star: px(pose, star, true),
  }
  if (!first) first = at
  console.log(f + ' dist ' + pose.position.length().toFixed(4) + Object.entries(at).map(([k, v]) => ' ' + k + ' ' + show(v) + ' d ' + Math.hypot(v[0] - first![k]![0], v[1] - first![k]![1]).toFixed(1)).join(''))
}
