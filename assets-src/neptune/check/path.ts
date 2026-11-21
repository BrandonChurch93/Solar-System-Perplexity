import * as THREE from 'three'
import { config } from '../../../src/config'
import { plans } from '../../../src/director/plans'
import close from '../../../src/stops/neptune/close.json'
const stop = process.argv.includes('--stop') ? process.argv[process.argv.indexOf('--stop') + 1]! : 'neptune'
const plan = plans.find((p) => p.id === stop)!

const argv = process.argv.slice(2)
const from = Number(argv[0] ?? 4676)
const to = Number(argv[1] ?? 4770)
const every = Number(argv[2] ?? 1)
const DEG = 180 / Math.PI
const fps = config.fps
const shot = (time: number) => {
  const d = plan.seg.dive!
  if (time < d.start) return { pose: plan.hold(time - plan.seg.hold.start), view: 'orbit' }
  if (time < d.end) return plan.dive(time)
  if (time < plan.seg.terrain.end) return { pose: plan.terrain(time - plan.seg.terrain.start), view: 'terrain' }
  if (time < plan.seg.rise.end) return plan.rise(time)
  return { pose: plan.exitPose(time), view: 'orbit' }
}
const horizon = (v: { pose: { position: THREE.Vector3; quaternion: THREE.Quaternion }; view: string }) => {
  let nadir: THREE.Vector3
  let alpha: number
  if (v.view === 'orbit') {
    nadir = v.pose.position.clone().normalize().negate()
    alpha = Math.asin(Math.min(1 / v.pose.position.length(), 1))
  } else {
    const c = new THREE.Vector3().fromArray(close.nadir).multiplyScalar(close.radius + 1).sub(v.pose.position)
    alpha = Math.asin(Math.min(close.radius / c.length(), 1))
    nadir = c.normalize()
  }
  nadir.applyQuaternion(v.pose.quaternion.clone().invert())
  const theta = Math.acos(Math.min(Math.max(-nadir.z, -1), 1))
  return { above: (alpha - theta) * DEG, roll: Math.atan2(nadir.x, -nadir.y) * DEG, h: v.view === 'orbit' ? v.pose.position.length() - 1 : (new THREE.Vector3().fromArray(close.nadir).multiplyScalar(close.radius + 1).sub(v.pose.position).length() - close.radius) / close.radius }
}
console.log('frame view   height   dlog/fr  turn deg/fr  slide/h per fr  fov  cover  horizon above centre deg, roll deg, height in radii')
for (let f = from; f <= to; f += every) {
  const t = (f + 0.25) / fps
  const h = 0.25 / fps
  const a = shot(t - h)
  const s = shot(t)
  const b = shot(t + h)
  const height = (v: typeof s) => (v.view === 'orbit' ? v.pose.position.length() - 1 : v.pose.position.y)
  const same = a.view === b.view
  const dq = b.pose.quaternion.clone().multiply(a.pose.quaternion.clone().invert())
  const ang = 2 * Math.atan2(Math.hypot(dq.x, dq.y, dq.z), Math.abs(dq.w)) * DEG * 2
  const move = b.pose.position.clone().sub(a.pose.position).multiplyScalar(2)
  const up = s.view === 'orbit' ? s.pose.position.clone().normalize() : new THREE.Vector3(0, 1, 0)
  const vert = move.dot(up)
  const slide = move.clone().addScaledVector(up, -vert).length()
  const hs = height(s)
  const ground = s.view === 'orbit' ? hs : hs + 1
  const seg = config.segments.find((x) => t >= x.start && t < x.end)
  const cover = seg && seg.stop === stop && (seg.kind === 'dive' || seg.kind === 'rise') ? plan.coverAmount(seg, t) : 0
  console.log(String(f).padStart(5), s.view.padEnd(7), hs.toFixed(4).padStart(8), same ? (vert / Math.max(ground, 1e-6)).toFixed(4).padStart(8) : '   view', same ? ang.toFixed(3).padStart(8) : '', same ? (slide / Math.max(ground, 1e-6)).toFixed(4).padStart(10) : '', s.pose.vfov.toFixed(1).padStart(8), cover.toFixed(2).padStart(6), horizon(s).above.toFixed(2).padStart(8), horizon(s).roll.toFixed(1).padStart(7), horizon(s).h.toFixed(4).padStart(8))
}
