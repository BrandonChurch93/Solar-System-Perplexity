import * as THREE from 'three'
import { config } from '../../../src/config'
import { StopPlan, type Fit, type MoveParams, type OrbitShot } from '../../../src/director/moves'
import fit from '../../../src/stops/earth/fit.json'
import { params } from '../../../src/stops/earth/plan'

const arg = (name: string, d: string): string => {
  const i = process.argv.indexOf('--' + name)
  return i >= 0 ? process.argv[i + 1]! : d
}
const tail = JSON.parse(arg('tail', '{"from":0.5467,"gain":5.2,"shape":[2,6.5]}')) as { from: number; gain: number; shape: [number, number] }

class Try extends StopPlan {
  on = true
  override rise(time: number): OrbitShot {
    const shot = super.rise(time)
    if (!this.on || shot.view !== 'orbit') return shot
    const seg = this.seg.rise
    const s = Math.min(Math.max(((time - seg.start) / (seg.end - seg.start) - tail.from) / (1 - tail.from), 0), 1)
    shot.pose.position.multiplyScalar(Math.exp(-tail.gain * Math.pow(s, tail.shape[0]) * Math.pow(1 - s, tail.shape[1])))
    return shot
  }
}
const plan = new Try('earth', fit as Fit, params as MoveParams)
const seg = config.segments.find((s) => s.stop === 'earth' && s.kind === 'rise')!
const W = 1920
const H = 1080
const px = (f: number): number | null => {
  const r = plan.rise((f + 0.25) / config.fps)
  if (r.view !== 'orbit') return null
  return (Math.tan(Math.asin(1 / r.pose.position.length())) / Math.tan(((r.pose.vfov * Math.PI) / 180) / 2)) * 540
}
const project = (pose: { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }, p: THREE.Vector3): [number, number] => {
  const t = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  const v = p.clone().sub(pose.position).applyQuaternion(pose.quaternion.clone().invert())
  return [((v.x / -v.z / (t * (W / H)) + 1) * W) / 2, ((1 - v.y / -v.z / t) * H) / 2]
}
const hit = (pose: { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }, x: number, y: number): THREE.Vector3 | null => {
  const t = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  const ray = new THREE.Vector3(((2 * x) / W - 1) * t * (W / H), (1 - (2 * y) / H) * t, -1).normalize().applyQuaternion(pose.quaternion)
  const b = pose.position.dot(ray)
  const disc = b * b - (pose.position.lengthSq() - 1)
  if (disc <= 0 || -b - Math.sqrt(disc) <= 0) return null
  return pose.position.clone().addScaledVector(ray, -b - Math.sqrt(disc))
}
const blur = (f: number): { med: number; p90: number; limb: number } | null => {
  const a = plan.rise((f + 0.25) / config.fps)
  const p0 = plan.rise(f / config.fps)
  const p1 = plan.rise((f + 0.5) / config.fps)
  if (a.view !== 'orbit' || p0.view !== 'orbit' || p1.view !== 'orbit') return null
  const tq = plan.turn((f + 0.25) / config.fps)
  const q0 = plan.turn(f / config.fps).multiply(tq.clone().invert())
  const q1 = plan.turn((f + 0.5) / config.fps).multiply(tq.clone().invert())
  const list: number[] = []
  for (let y = 12; y < H; y += 24) {
    for (let x = 12; x < W; x += 24) {
      const p = hit(a.pose, x, y)
      if (!p) continue
      const u = project(p0.pose, p.clone().applyQuaternion(q0))
      const v = project(p1.pose, p.clone().applyQuaternion(q1))
      list.push(Math.hypot(v[0] - u[0], v[1] - u[1]))
    }
  }
  list.sort((u, v) => u - v)
  const r0 = Math.tan(Math.asin(1 / p0.pose.position.length())) / Math.tan(((p0.pose.vfov * Math.PI) / 180) / 2)
  const r1 = Math.tan(Math.asin(1 / p1.pose.position.length())) / Math.tan(((p1.pose.vfov * Math.PI) / 180) / 2)
  return { med: list[Math.floor(list.length / 2)] ?? 0, p90: list[Math.floor(list.length * 0.9)] ?? 0, limb: Math.abs(r1 - r0) * 540 }
}
const from = Number(arg('first', '2130'))
const out: string[] = []
let last = 0
for (let f = from; f < seg.endFrame; f++) {
  const row: string[] = [String(f)]
  for (const on of [false, true]) {
    plan.on = on
    const a = px(f)
    const b = px(f + 1 < seg.endFrame ? f + 1 : f)
    const c = f + 1 < seg.endFrame ? b : px(f - 1)
    if (!a || !b || !c) continue
    const rate = f + 1 < seg.endFrame ? Math.log(b / a) : Math.log(a / c)
    const bl = blur(f)
    row.push((on ? 'tail ' : 'now ') + a.toFixed(0) + ' px ' + (100 * rate).toFixed(2) + ' %/f' + (on ? ' x' + (last ? rate / last : 0).toFixed(2) : '') + (bl ? ' blur ' + bl.med.toFixed(1) + ' p90 ' + bl.p90.toFixed(1) + ' limb ' + bl.limb.toFixed(1) : ''))
    if (on) last = rate
  }
  out.push(row.join(' | '))
}
console.log(out.join('\n'))
plan.on = true
const end = plan.rise(seg.end - 1e-6).pose
const next = plan.exitPose(seg.end)
console.log('end gap ' + end.position.distanceTo(next.position).toExponential(2) + ' speed in ' + (plan.rise(seg.end - 1e-4).pose.position.distanceTo(plan.rise(seg.end - 2e-4).pose.position) / 1e-4).toExponential(3) + ' drift ' + params.rise.driftSpeed)
