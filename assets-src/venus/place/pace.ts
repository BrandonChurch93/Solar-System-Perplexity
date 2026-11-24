import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/venus/plan'

// The pace of the Venus dive and rise from the camera path alone (plan E of the second review note, kit/PROGRESS.md).
//   npx tsx assets-src/venus/place/pace.ts [--rate 1|2] [--rows] [--from F --to F]
// Per step of the film (a frame at rate 1, half a frame at rate 2), on the globe side pose (the hold, the move, the twin of the surface
// view, the travel after), for each of the two moves and 12 frames into each neighbour:
//   fall: the change of the logarithm of the height over the cloud tops, over the mean of the move
//   turn: the angle the camera turns, in degrees per frame
//   flow: the mean speed, in px per frame at 1920 by 1080, of the ground under a grid of 16 by 9 screen points (those that meet the body)
// For each of the three: the largest step from one sample to the next over the mean of the move (limit 0.08), and the rebound: the most it
// climbs again after its largest value, and the most it falls before it, over the mean (limit 0.03).
;(globalThis as { __venusProbe?: object }).__venusProbe = { side: 'orbit', path: true }
const args = process.argv.slice(2)
const opt = (k: string, d: string): string => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1]! : d }
const rate = Number(opt('rate', '1'))
const rows = args.includes('--rows')
const W = 1920
const H = 1080
const seg = plan.seg
interface P { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }
const pose = (time: number): P => {
  if (time < seg.dive!.start) return plan.hold(time - seg.hold.start)
  if (time < seg.terrain.start) return plan.divePose(time, 'orbit')
  if (time < seg.rise.start) return plan.twin(plan.terrain(time - seg.terrain.start), time)
  if (time < seg.rise.end) return plan.risePose(time, 'orbit')
  return (plan as unknown as { after(t: number): P }).after(time)
}
const turnOf = (time: number): THREE.Quaternion => (plan as unknown as { turn(t: number): THREE.Quaternion }).turn(time)
const grid: [number, number][] = []
for (let j = 0; j < 9; j++) for (let i = 0; i < 16; i++) grid.push([(i + 0.5) / 16 * 2 - 1, (j + 0.5) / 9 * 2 - 1])
const flow = (t0: number, t1: number): number => {
  const a = pose(t0)
  const b = pose(t1)
  const ta = Math.tan(THREE.MathUtils.degToRad(a.vfov) / 2)
  const tb = Math.tan(THREE.MathUtils.degToRad(b.vfov) / 2)
  const spin = turnOf(t1).multiply(turnOf(t0).invert())
  const qb = b.quaternion.clone().invert()
  let sum = 0
  let n = 0
  for (const [x, y] of grid) {
    const ray = new THREE.Vector3(x * ta * W / H, y * ta, -1).normalize().applyQuaternion(a.quaternion)
    const along = -a.position.dot(ray)
    const disc = along * along - (a.position.lengthSq() - 1)
    if (disc <= 0 || along <= 0) continue
    const hit = a.position.clone().addScaledVector(ray, along - Math.sqrt(disc)).applyQuaternion(spin)
    const d = hit.sub(b.position).applyQuaternion(qb)
    if (d.z >= 0) continue
    const sx = d.x / -d.z / (tb * W / H)
    const sy = d.y / -d.z / tb
    sum += Math.hypot((sx - x) * W / 2, (sy - y) * H / 2)
    n++
  }
  return n > 0 ? sum / n : 0
}
const fps = config.fps * rate
const F = (s: { start: number; end: number }): [number, number] => [Math.round(s.start * config.fps), Math.round(s.end * config.fps)]
interface Row { at: number; h: number; fall: number; turn: number; flow: number }
const table = (f0: number, f1: number): Row[] => {
  const out: Row[] = []
  for (let k = f0 * rate; k < f1 * rate; k++) {
    const t0 = k / fps
    const t1 = (k + 1) / fps
    const a = pose(t0)
    const b = pose(t1)
    out.push({ at: k / rate, h: a.position.length() - 1, fall: (Math.log(b.position.length() - 1) - Math.log(a.position.length() - 1)) * rate, turn: THREE.MathUtils.radToDeg(2 * Math.acos(Math.min(Math.abs(a.quaternion.dot(b.quaternion)), 1))) * rate, flow: flow(t0, t1) * rate })
  }
  return out
}
const judge = (name: string, v: number[], at: number[], mean: number): string => {
  let step = 0
  let stepAt = 0
  for (let i = 1; i < v.length; i++) if (Math.abs(v[i]! - v[i - 1]!) > step) { step = Math.abs(v[i]! - v[i - 1]!); stepAt = at[i]! }
  let top = 0
  for (let i = 1; i < v.length; i++) if (v[i]! > v[top]!) top = i
  let after = 0
  let low = v[top]!
  let afterAt = at[top]!
  for (let i = top + 1; i < v.length; i++) { low = Math.min(low, v[i]!); if (v[i]! - low > after) { after = v[i]! - low; afterAt = at[i]! } }
  let before = 0
  let high = v[0]!
  let beforeAt = at[0]!
  for (let i = 1; i <= top; i++) { high = Math.max(high, v[i]!); if (high - v[i]! > before) { before = high - v[i]!; beforeAt = at[i]! } }
  return name + ': mean ' + mean.toFixed(4) + ', largest ' + (v[top]! / mean).toFixed(3) + ' of the mean at ' + at[top] + ', largest step ' + (step / mean).toFixed(3) + ' at ' + stepAt + ', climbs again after the top by ' + (after / mean).toFixed(3) + ' (at ' + afterAt + '), falls before the top by ' + (before / mean).toFixed(3) + ' (at ' + beforeAt + ')'
}
const run = (name: string, s: { start: number; end: number }): void => {
  const [m0, m1] = F(s)
  const lo = Number(opt('from', String(m0 - 12)))
  const hi = Number(opt('to', String(m1 + 12)))
  const t = table(lo, hi)
  const inside = t.filter((r) => r.at >= m0 && r.at < m1)
  const mean = (f: (r: Row) => number): number => inside.reduce((x, r) => x + f(r), 0) / inside.length
  const sign = Math.sign(mean((r) => r.fall))
  console.log(name + ', frames ' + m0 + ' to ' + (m1 - 1) + ', measured ' + lo + ' to ' + (hi - 1) + ', ' + rate + ' sample(s) per frame')
  console.log('  ' + judge('fall', t.map((r) => r.fall * sign), t.map((r) => r.at), Math.abs(mean((r) => r.fall))))
  console.log('  ' + judge('turn', t.map((r) => r.turn), t.map((r) => r.at), mean((r) => r.turn)))
  console.log('  ' + judge('flow', t.map((r) => r.flow), t.map((r) => r.at), mean((r) => r.flow)))
  if (rows) for (const r of t) console.log('    ' + r.at.toFixed(1) + ' height ' + r.h.toExponential(3) + ' fall ' + (r.fall * sign / Math.abs(mean((x) => x.fall))).toFixed(3) + ' turn ' + r.turn.toFixed(3) + ' flow ' + r.flow.toFixed(2))
}
run('dive', seg.dive!)
run('rise', seg.rise)
