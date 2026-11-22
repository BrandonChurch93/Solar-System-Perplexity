import * as THREE from 'three'
import { config } from '../../../src/config'
import { plans } from '../../../src/director/plans'
import close from '../../../src/stops/neptune/close.json'

const plan = plans.find((p) => p.id === 'neptune')!
const argv = process.argv.slice(2)
const over = argv[0] && argv[0] !== '-' ? JSON.parse(argv[0]) : {}
const from = Number(argv[1] ?? 4676)
const to = Number(argv[2] ?? 4780)
const every = Number(argv[3] ?? 1)
for (const [group, values] of Object.entries(over)) Object.assign((plan.p as unknown as Record<string, object>)[group]!, values as object)
const DEG = 180 / Math.PI
const fps = config.fps
type Shot = { pose: { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }; view: string }
const shot = (time: number): Shot => {
  const d = plan.seg.dive!
  if (time < d.start) return { pose: plan.hold(time - plan.seg.hold.start), view: 'orbit' }
  if (time < d.end) return plan.dive(time)
  return { pose: plan.terrain(time - plan.seg.terrain.start), view: 'terrain' }
}
const centre = new THREE.Vector3().fromArray(close.nadir).multiplyScalar(close.radius + 1)
const look = (v: Shot) => {
  const c = v.view === 'orbit' ? v.pose.position.clone().negate() : centre.clone().sub(v.pose.position)
  const radius = v.view === 'orbit' ? 1 : close.radius
  const alpha = Math.asin(Math.min(radius / c.length(), 1))
  const h = (c.length() - radius) / radius
  const nadir = c.normalize().applyQuaternion(v.pose.quaternion.clone().invert())
  const theta = Math.acos(Math.min(Math.max(-nadir.z, -1), 1))
  return { above: (alpha - theta) * DEG, roll: Math.atan2(nadir.x, -nadir.y) * DEG, h }
}
const rows: { f: number; view: string; h: number; v: number; turn: number; above: number; roll: number; cover: number }[] = []
for (let f = from; f <= to; f += every) {
  const t = (f + 0.25) / fps
  const dt = 0.25 / fps
  const a = shot(t - dt)
  const s = shot(t)
  const b = shot(t + dt)
  const same = a.view === b.view
  const dq = b.pose.quaternion.clone().multiply(a.pose.quaternion.clone().invert())
  const turn = 2 * Math.atan2(Math.hypot(dq.x, dq.y, dq.z), Math.abs(dq.w)) * DEG * 2
  const seg = config.segments.find((x) => t >= x.start && t < x.end)
  const cover = seg && seg.stop === 'neptune' && (seg.kind === 'dive' || seg.kind === 'rise') ? plan.coverAmount(seg, t) : 0
  rows.push({ f, view: s.view, h: look(s).h, v: same ? Math.log(look(b).h / look(a).h) * 2 : NaN, turn: same ? turn : NaN, above: look(s).above, roll: look(s).roll, cover })
}
console.log('frame view     height   dlog/fr   ratio  turn deg/fr  ratio  horizon  d/fr   roll   d/fr  cover')
for (const [i, r] of rows.entries()) {
  const p = rows[i - 1]
  const ratio = (x: number, y: number | undefined) => (y !== undefined && Number.isFinite(x) && Number.isFinite(y) && Math.abs(y) > 1e-9 ? (x / y).toFixed(2) : '').padStart(7)
  const step = (x: number, y: number | undefined, n: number) => (y !== undefined && p!.view === r.view ? (x - y).toFixed(n) : '').padStart(7)
  console.log(String(r.f).padStart(5), r.view.padEnd(7), r.h.toFixed(4).padStart(8), r.v.toFixed(5).padStart(9), ratio(r.v, p?.v), r.turn.toFixed(3).padStart(8), ratio(r.turn, p?.turn), r.above.toFixed(2).padStart(8), step(r.above, p?.above, 3), r.roll.toFixed(1).padStart(6), step(r.roll, p?.roll, 2), r.cover.toFixed(2).padStart(6))
}
const orbit = rows.filter((r) => r.view === 'orbit' && Number.isFinite(r.v) && r.f >= 4680)
let dips = 0
let worst = 0
for (let i = 1; i < orbit.length; i++) {
  if (Math.abs(orbit[i]!.v) < Math.abs(orbit[i - 1]!.v) - 1e-6) dips++
  if (orbit[i]!.cover < 0.5) worst = Math.max(worst, Math.abs(orbit[i]!.v) / Math.max(Math.abs(orbit[i - 1]!.v), 1e-6))
}
const ground = rows.filter((r) => r.view === 'terrain')
let turns = 0
for (let i = 2; i < ground.length; i++) if (Math.sign(ground[i]!.above - ground[i - 1]!.above) !== Math.sign(ground[i - 1]!.above - ground[i - 2]!.above)) turns++
console.log('speed dips before the switch', dips, 'largest speed ratio frame to frame while the cover is under 0.5', worst.toFixed(3), 'horizon direction changes after the switch', turns)
