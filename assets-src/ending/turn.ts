// usage: [LIGHT=smooth|smoother|soft [LRATE=1.5] [LLEAD=0.3]] [G='{"turn":0.5}'] [STEP=4] [QUIET=1] [SCAN=1 [VALS='[0.3,0.4]'] [TOL=0.002] [TOP=12] [ONE='[turn,aim,phase]']] [PROFILE='[{"turn":0.5,"aim":0.3,"phase":0.4}]'] npx tsx assets-src/ending/turn.ts
// AHEAD=0.6: the glides of the rebuilt pose run on v = (u + a) / (1 + a), a = AHEAD seconds over the retreat's length. ONLY=turn,aim: only those glides. LIGHTV=1: the light on v too; LIGHTV=2: on v and set to 0 at the seam.
// FROM=5000: the turn of the director's own camera from that frame to the retreat's end, with its peaks and dips (any tree).
import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector, LOOKBACK } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { lookAt, mix, smooth, smoother } from '../../src/director/rig'

const DEG = 180 / Math.PI
const glide = (u: number, e: number): number => {
  const x = Math.min(Math.max(u, 0), 1)
  const edge = (t: number): number => e * (t * t * t - (t * t * t * t) / 2)
  return (x < e ? edge(x / e) : x > 1 - e ? 1 - e - edge((1 - x) / e) : x - e / 2) / (1 - e)
}
const d = new FilmDirector(plans) as any
const p = d.plans[d.plans.length - 1]
const seg = config.segments.find((x: any) => x.kind === 'retreat')! as any
const F0 = Math.round(seg.start * config.fps), F1 = Math.round(seg.end * config.fps)
const AHEAD = Number(process.env.AHEAD ?? 0) / (seg.end - seg.start)
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null
const gl = (u: number, e: number, k: string): number => { const a = !ONLY || ONLY.includes(k) ? AHEAD : 0; return glide((u + a) / (1 + a), e) }
type U = { lit: number; phase: number; turn: number; pull: number; aim: number; t: number }
const soft = (x: number, lead: number): number => { const c = Math.min(Math.max(x, 0), 1); const k = c / lead; return smooth(c) - (k < 1 ? 3 * lead * lead * k * k * (1 - k) * (1 - k) * (1 - k) : 0) }
const laws: Record<string, (u: number) => number> = { smooth: (u) => smooth(Math.min(u * 1.5, 1)), smoother: (u) => smoother(Math.min(u * 1.5, 1)), soft: (u) => soft(u * Number(process.env.LRATE ?? 1.5), Number(process.env.LLEAD ?? 0.3)) }
const rawLaw = laws[process.env.LIGHT ?? 'smooth']!
const LV = Number(process.env.LIGHTV ?? 0)
const lightLaw = (u: number): number => LV === 0 ? rawLaw(u) : LV === 1 ? rawLaw((u + AHEAD) / (1 + AHEAD)) : (rawLaw((u + AHEAD) / (1 + AHEAD)) - rawLaw(AHEAD / (1 + AHEAD))) / (1 - rawLaw(AHEAD / (1 + AHEAD)))
const G = { ...LOOKBACK.glide, ...(process.env.G ? JSON.parse(process.env.G) : {}) } as Record<string, number>
const us = (u: number): U => ({ lit: lightLaw(u), phase: gl(u, G.phase!, 'phase'), turn: gl(u, G.turn!, 'turn'), pull: gl(u, G.pull!, 'pull'), aim: gl(u, G.aim!, 'aim'), t: u })
const pose = (x: U): THREE.Quaternion => {
  const time = seg.start + x.t * (seg.end - seg.start)
  const a = p.exitPose(time)
  const b = d.lookback(time)
  const end = d.lookbackPlace(time)
  const lit = p.lightDir.clone().lerp(d.lookbackSun, x.lit).normalize()
  const phase = mix(a.position.angleTo(p.lightDir), end.phase, x.phase)
  const position = d.nightSide(phase, end.azimuth * x.turn, a.position.length() * Math.pow(end.distance / a.position.length(), x.pull), lit)
  const track = (v: THREE.Vector3): THREE.Quaternion => lookAt(v, new THREE.Vector3(), d.lookbackSun)
  const held = track(a.position).invert().multiply(a.quaternion)
  return track(position).multiply(held.slerp(track(b.position).invert().multiply(b.quaternion), x.aim))
}
const omega = (q0: THREE.Quaternion, q1: THREE.Quaternion): THREE.Vector3 => {
  const dq = q1.clone().multiply(q0.clone().invert())
  if (dq.w < 0) dq.set(-dq.x, -dq.y, -dq.z, -dq.w)
  const s = Math.hypot(dq.x, dq.y, dq.z)
  const ang = 2 * Math.atan2(s, dq.w) * DEG
  return s < 1e-12 ? new THREE.Vector3() : new THREE.Vector3(dq.x, dq.y, dq.z).multiplyScalar(ang / s)
}
const n = F1 - F0
const keys: (keyof U)[] = ['lit', 'phase', 'turn', 'aim', 't']
const rows: string[] = []
let prevTotal = 0
const totals: number[] = []
for (let f = F0; f < F1; f++) {
  const u0 = us((f - F0) / n), u1 = us((f + 1 - F0) / n)
  const q0 = pose(u0)
  const total = omega(q0, pose(u1))
  const dir = total.clone().normalize()
  const parts = keys.map((k) => omega(q0, pose({ ...u0, [k]: u1[k] })))
  const real = omega(d.shotAt(f, f / config.fps).camera.quaternion, d.shotAt(f + 1, (f + 1) / config.fps).camera.quaternion).length()
  totals.push(total.length())
  if ((f - F0) % Number(process.env.STEP ?? 4) === 0 || f === F1 - 1) rows.push(f + ' total ' + total.length().toFixed(3) + ' (director ' + real.toFixed(3) + ')  ' + keys.map((k, i) => k + ' ' + parts[i]!.length().toFixed(2) + '/' + parts[i]!.dot(dir).toFixed(2)).join('  '))
  prevTotal = total.length()
}
console.log('light ' + (process.env.LIGHT ?? 'smooth') + ' glide ' + JSON.stringify(G) + '; per driver: size / share along the total turn, degrees a frame')
if (!process.env.QUIET) console.log(rows.join('\n'))
let ext: string[] = []
for (let i = 1; i < totals.length - 1; i++) { if (totals[i]! > totals[i - 1]! && totals[i]! >= totals[i + 1]!) ext.push('peak ' + totals[i]!.toFixed(3) + ' at ' + (F0 + i)); if (totals[i]! < totals[i - 1]! && totals[i]! <= totals[i + 1]!) ext.push('dip ' + totals[i]!.toFixed(3) + ' at ' + (F0 + i)) }
console.log('turns: ' + ext.join(', '))
if (process.env.FROM) {
  const from = Number(process.env.FROM), tol = Number(process.env.TOL ?? 0.002), step = Number(process.env.STEP ?? 4)
  const cam = (f: number): THREE.Quaternion => d.shotAt(Math.floor(f), f / config.fps).camera.quaternion
  const r: number[] = []
  for (let f = from; f < F1; f++) r.push(omega(cam(f), cam(f + 1)).length())
  const marks: string[] = []
  let hi = r[0]!, lo = r[0]!, hiAt = 0, loAt = 0, up = true
  for (let i = 1; i < r.length; i++) {
    if (up) { if (r[i]! > hi) { hi = r[i]!; hiAt = i } else if (hi - r[i]! > tol) { marks.push('peak ' + hi.toFixed(3) + ' at ' + (from + hiAt)); up = false; lo = r[i]!; loAt = i } }
    else if (r[i]! < lo) { lo = r[i]!; loAt = i } else if (r[i]! - lo > tol) { marks.push('dip ' + lo.toFixed(3) + ' at ' + (from + loAt)); up = true; hi = r[i]!; hiAt = i }
  }
  console.log('director, camera turn in degrees a frame from ' + from + ': ' + r.map((x, i) => i % step === 0 ? (from + i) + ' ' + x.toFixed(3) : '').filter(Boolean).join('; '))
  console.log('director turns (a change under ' + tol + ' is not counted): start ' + r[0]!.toFixed(3) + ', ' + marks.join(', '))
}
if (process.env.SCAN) {
  const rate = (g: Record<string, number>, law: (u: number) => number): number[] => {
    const u2 = (u: number): U => ({ lit: law(u), phase: gl(u, g.phase!, 'phase'), turn: gl(u, g.turn!, 'turn'), pull: gl(u, g.pull!, 'pull'), aim: gl(u, g.aim!, 'aim'), t: u })
    const out: number[] = []
    let q = pose(u2(0))
    for (let f = F0; f < F1; f++) { const q1 = pose(u2((f + 1 - F0) / n)); out.push(omega(q, q1).length()); q = q1 }
    return out
  }
  const base = pose(us(60 / n))
  const found: { peak: number; line: string }[] = []
  const vals = process.env.VALS ? JSON.parse(process.env.VALS) as number[] : [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5]
  const one = process.env.ONE ? JSON.parse(process.env.ONE) as number[] : null
  for (const turn of one ? [one[0]!] : vals) for (const aim of one ? [one[1]!] : vals) for (const phase of one ? [one[2]!] : vals) {
    const g = { ...G, turn, aim, phase }
    const r = rate(g, lightLaw)
    let deep = 0, peak = 0, peakAt = 0, hi = 0
    for (let i = 0; i < r.length; i++) { if (r[i]! > peak) { peak = r[i]!; peakAt = F0 + i } }
    for (let i = 0; F0 + i < peakAt; i++) { hi = Math.max(hi, r[i]!); deep = Math.max(deep, hi - r[i]!) }
    hi = 0
    for (let i = r.length - 1; F0 + i > peakAt; i--) { hi = Math.max(hi, r[i]!); deep = Math.max(deep, hi - r[i]!) }
    let acc = 0, dec = 0, top = 0
    for (let i = 1; i < r.length; i++) { acc = Math.max(acc, r[i]! - r[i - 1]!); dec = Math.max(dec, r[i - 1]! - r[i]!) }
    for (let i = 0; i < r.length; i++) if (r[i]! > 0.9 * peak) top++
    const q85 = pose({ lit: lightLaw(60 / n), phase: gl(60 / n, phase, 'phase'), turn: gl(60 / n, turn, 'turn'), pull: gl(60 / n, g.pull!, 'pull'), aim: gl(60 / n, aim, 'aim'), t: 60 / n })
    found.push({ peak: deep > Number(process.env.TOL ?? 0.002) ? 99 + deep : peak, line: 'turn ' + turn + ' aim ' + aim + ' phase ' + phase + ': peak ' + peak.toFixed(3) + ' at ' + peakAt + ', rebound ' + deep.toFixed(3) + ', steepest rise ' + acc.toFixed(3) + ' and fall ' + dec.toFixed(3) + ' a frame, ' + top + ' frames within a tenth of the peak, 5085 at shutter open turned by ' + omega(base, q85).length().toFixed(1) })
  }
  found.sort((a, b) => a.peak - b.peak)
  if (!one) console.log(found.filter((x) => x.peak < 99).length + ' of ' + found.length + ' settings rise once and fall once')
  console.log(found.slice(0, Number(process.env.TOP ?? 14)).map((x) => x.line).join('\n'))
}
if (process.env.PROFILE) {
  const fmt = config.formats[config.formatKeys.master]! as any
  const sets = JSON.parse(process.env.PROFILE) as Record<string, number>[]
  const head = 'frame  ' + sets.map((g) => 'turn ' + g.turn + ' aim ' + g.aim + ' phase ' + g.phase + ': rate, Neptune x y, Sun x y').join('  |  ')
  const lines: string[] = [head]
  const place = (q: THREE.Quaternion, v: THREE.Vector3, vfov: number): string => {
    const c = v.clone().applyQuaternion(q.clone().invert())
    const t = Math.tan(vfov / DEG / 2)
    return c.z < 0 ? Math.round((0.5 + c.x / -c.z / t / (fmt.width / fmt.height) * 0.5) * fmt.width) + ' ' + Math.round((0.5 - c.y / -c.z / t * 0.5) * fmt.height) : 'behind'
  }
  for (let f = F0; f <= F1; f += Number(process.env.STEP ?? 5)) {
    const cells = sets.map((g0) => {
      const g = { ...G, ...g0 }
      const u2 = (u: number): U => ({ lit: lightLaw(u), phase: gl(u, g.phase!, 'phase'), turn: gl(u, g.turn!, 'turn'), pull: gl(u, g.pull!, 'pull'), aim: gl(u, g.aim!, 'aim'), t: u })
      const x = u2((f - F0) / n)
      const q = pose(x)
      const time = seg.start + x.t * (seg.end - seg.start)
      const a = p.exitPose(time), b = d.lookback(time), end = d.lookbackPlace(time)
      const lit = p.lightDir.clone().lerp(d.lookbackSun, x.lit).normalize()
      const position = d.nightSide(mix(a.position.angleTo(p.lightDir), end.phase, x.phase), end.azimuth * x.turn, a.position.length() * Math.pow(end.distance / a.position.length(), x.pull), lit) as THREE.Vector3
      const vfov = mix(a.vfov, b.vfov, x.aim)
      const r = f < F1 ? omega(q, pose(u2((f + 1 - F0) / n))).length() : 0
      return r.toFixed(3) + ', ' + place(q, position.clone().negate(), vfov) + ', ' + place(q, d.lookbackSun, vfov)
    })
    lines.push(f + '  ' + cells.join('  |  '))
  }
  console.log(lines.join('\n'))
}
