import * as THREE from 'three'
import { writeFileSync, mkdirSync } from 'node:fs'
import { config } from '../../../src/config'
import { handoverOf } from '../../../src/director/handover'
import { plan } from '../../../src/stops/earth/plan'
import type { Pose } from '../../../src/core/types'

const fps = config.fps
const mid = config.shutterFraction / 2
const deg = THREE.MathUtils.radToDeg
const out: Record<string, unknown> = {}
const apart = (a: THREE.Quaternion, b: THREE.Quaternion): number => {
  const p = a.clone().normalize()
  const q = b.clone().normalize()
  const s = p.dot(q) < 0 ? -1 : 1
  return 4 * Math.asin(Math.min(Math.hypot(p.x - s * q.x, p.y - s * q.y, p.z - s * q.z, p.w - s * q.w) / 2, 1))
}

function report(kind: 'dive' | 'rise'): void {
  const seg = kind === 'dive' ? plan.seg.dive! : plan.seg.rise
  const h = handoverOf('earth', kind)!
  const pose = (t: number): Pose => (kind === 'dive' ? plan.divePose(t, 'orbit') : plan.risePose(t, 'orbit'))
  const rows: { frame: number; height: number; rate: number; x: number; y: number; off: number; limb: number; vfov: number; turn: number }[] = []
  let before: Pose | null = null
  for (let f = seg.firstFrame - 1; f <= seg.endFrame; f++) {
    const t = (f + mid) / fps
    const p = f < seg.firstFrame ? (kind === 'dive' ? plan.hold(t - plan.seg.hold.start) : plan.twin(plan.terrain(t - plan.seg.terrain.start), t)) : f >= seg.endFrame ? (kind === 'dive' ? plan.twin(plan.terrain(t - plan.seg.terrain.start), t) : plan.exitPose(t)) : pose(t)
    const anchor = plan.twin(plan.terrain(t - plan.seg.terrain.start), t)
    const axis = new THREE.Vector3(0, 0, -1).applyQuaternion(anchor.quaternion)
    const b = anchor.position.dot(axis)
    const place = anchor.position.clone().addScaledVector(axis, -b - Math.sqrt(Math.max(b * b - anchor.position.lengthSq() + 1, 0)))
    const c = place.sub(p.position).applyQuaternion(p.quaternion.clone().invert())
    const th = Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)
    const height = p.position.length() - 1
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quaternion)
    const off = deg(Math.acos(THREE.MathUtils.clamp(-fwd.dot(p.position.clone().normalize()), -1, 1)))
    const limb = deg(Math.asin(1 / p.position.length()))
    rows.push({ frame: f, height, rate: before ? Math.log(height / (before.position.length() - 1)) : 0, x: 0.5 + c.x / -c.z / (2 * th * (16 / 9)), y: 0.5 - c.y / -c.z / (2 * th), off, limb, vfov: p.vfov, turn: before ? deg(apart(before.quaternion, p.quaternion)) : 0 })
    before = p
  }
  const total = Math.abs(Math.log(rows[0]!.height / rows[rows.length - 1]!.height))
  const rates = rows.slice(1).map((r) => Math.abs(r.rate))
  const mean = Math.abs(total) / (rows.length - 1)
  const fifth = kind === 'dive' ? rows[1 + Math.round((h.firstFrame - seg.firstFrame) / 5)]! : rows[1 + Math.round((seg.endFrame - h.firstFrame) * 4 / 5)]!
  console.log(kind, 'T', h.time * fps, 'frames', seg.firstFrame, 'to', seg.endFrame - 1, 'ln of the height ratio', total.toFixed(4), 'mean per frame', mean.toFixed(5), 'largest', Math.max(...rates).toFixed(5), 'largest over mean', (Math.max(...rates) / mean).toFixed(3), 'rate at one fifth', Math.abs(fifth.rate).toFixed(5), 'frame', fifth.frame)
  let jerk = 0
  for (let i = 3; i < rows.length; i++) jerk = Math.max(jerk, Math.abs(rows[i]!.rate - 2 * rows[i - 1]!.rate + rows[i - 2]!.rate))
  console.log('  largest second difference of the rate', jerk.toExponential(3), 'largest turn per frame', Math.max(...rows.map((r) => r.turn)).toFixed(3), 'deg')
  for (const r of rows) console.log('  ' + r.frame, 'h', r.height.toFixed(5), 'rate', r.rate.toFixed(5), 'place', r.x.toFixed(3), r.y.toFixed(3), 'off nadir', r.off.toFixed(2), 'limb', r.limb.toFixed(2), 'vfov', r.vfov.toFixed(2), 'turn', r.turn.toFixed(3))
  out[kind] = rows
}

function joint(name: string, a: (t: number) => Pose, b: (t: number) => Pose, t: number): void {
  const e = 1e-4
  const pa = a(t)
  const pb = b(t)
  const va = a(t).position.clone().sub(a(t - e).position).divideScalar(e * fps)
  const vb = b(t + e).position.clone().sub(b(t).position).divideScalar(e * fps)
  const wa = deg(apart(a(t - e).quaternion, a(t).quaternion)) / (e * fps)
  const wb = deg(apart(b(t).quaternion, b(t + e).quaternion)) / (e * fps)
  console.log(name, 'position apart', pa.position.distanceTo(pb.position).toExponential(2), 'turn apart deg', deg(apart(pa.quaternion, pb.quaternion)).toExponential(2), 'vfov', pa.vfov.toFixed(4), pb.vfov.toFixed(4), 'speed per frame', va.length().toExponential(4), vb.length().toExponential(4), 'apart', va.distanceTo(vb).toExponential(2), 'turn rate deg per frame', wa.toExponential(3), wb.toExponential(3))
}

report('dive')
report('rise')
const d = handoverOf('earth', 'dive')!
const r = handoverOf('earth', 'rise')!
const twin = (t: number): Pose => plan.twin(plan.terrain(t - plan.seg.terrain.start), t)
joint('hold into dive', (t) => plan.hold(t - plan.seg.hold.start), (t) => plan.divePose(t, 'orbit'), plan.seg.dive!.start)
joint('dive into twin at T', (t) => plan.divePose(t, 'orbit'), twin, d.time)
joint('twin into rise at T', twin, (t) => plan.risePose(t, 'orbit'), r.time)
joint('rise into travel', (t) => plan.risePose(t, 'orbit'), (t) => plan.exitPose(t), plan.seg.rise.end)
console.log('clock at', plan.seg.terrain.end * fps - 1, plan.clock(plan.seg.terrain.end - 1 / fps) - (plan.seg.terrain.end - 1 / fps), 'at', plan.seg.rise.end * fps, plan.clock(plan.seg.rise.end) - plan.seg.rise.end, 'handover', JSON.stringify(d), JSON.stringify(r))
mkdirSync('out/work/earth/place', { recursive: true })
writeFileSync('out/work/earth/place/path.json', JSON.stringify(out))
