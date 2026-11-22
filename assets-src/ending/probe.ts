import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector, LOOKBACK } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import * as look from '../../src/stops/neptune/look'
import { smooth } from '../../src/director/rig'

const argv = process.argv.slice(2)
const num = (k: string, d: number): number => {
  const i = argv.indexOf('--' + k)
  return i >= 0 ? Number(argv[i + 1]) : d
}
for (const kv of (process.env.LB ?? '').split(',').filter(Boolean)) {
  const [k, v] = kv.split('=')
  const path = k!.split('.')
  let o: any = LOOKBACK
  for (const q of path.slice(0, -1)) o = o[q]
  o[path[path.length - 1]!] = Number(v)
}
const first = num('from', 5015)
const last = num('to', 5399)
const step = num('step', 5)
const d = new FilmDirector(plans)
const fmt = config.formats[config.formatKeys.master]!
const DEG = 180 / Math.PI
const MID = config.shutterFraction * 0.5
const n = plans[plans.length - 1]!

interface Row { psi: number; ring: number; elong: number; f: number; seg: string; turn: number; phase: number; r: number; nx: number; ny: number; sx: number; sy: number; sunFront: boolean; tx: number; ty: number; tr: number; tFront: boolean; tPhase: number; stars: number; sky: number; glare: number; fov: number; dist: number; speed: number; roll: number; sunHidden: boolean }

const shot = (t: number) => d.shotAt(Math.floor(t * config.fps + 1e-9), t)

function project(c: THREE.Vector3, vfov: number): { x: number; y: number; front: boolean } {
  const t = Math.tan(vfov / DEG / 2)
  const z = Math.max(-c.z, 1e-9)
  return { x: (c.x / z / (t * fmt.width / fmt.height) * 0.5 + 0.5) * fmt.width, y: (0.5 - c.y / z / t * 0.5) * fmt.height, front: c.z < 0 }
}

function at(f: number, o = MID): Row {
  const t = (f + o) / config.fps
  const s = d.shotAt(f, t)
  const st = s.sets[s.sets.length - 1]!
  const inv = s.camera.quaternion.clone().invert()
  const ending = s.segment.stop !== n.id && s.segment.kind !== 'travel'
  const lit = ending ? (s.segment.kind === 'retreat' ? smooth(s.u * 1.5) : 1) : 0
  const light = n.lightDir.clone().applyQuaternion(st.rotation).lerp(s.sun.dir, lit).normalize()
  const out = s.camera.position.clone().sub(st.origin)
  const dist = out.length()
  const phase = out.angleTo(light) * DEG
  const k = (fmt.height / 2) / Math.tan(s.camera.vfov / DEG / 2)
  const r = k / Math.sqrt(Math.max(dist * dist - 1, 1e-12))
  const p = project(st.origin.clone().sub(s.camera.position).applyQuaternion(inv), s.camera.vfov)
  const sun = project(s.sun.dir.clone().applyQuaternion(inv), s.camera.vfov)
  const moonStage = new THREE.Vector3().fromArray(look.triton.stage).applyAxisAngle(n.axis, THREE.MathUtils.degToRad(n.p.moonDegPerSecond!) * (t - n.seg.rise.end))
  const moon = moonStage.applyQuaternion(st.rotation).add(st.origin)
  const mrel = moon.clone().sub(s.camera.position)
  const mp = project(mrel.clone().applyQuaternion(inv), s.camera.vfov)
  const mr = 0.475967
  const tr = k * mr / Math.sqrt(Math.max(mrel.lengthSq() - mr * mr, 1e-12))
  const tPhase = mrel.clone().negate().angleTo(s.sun.dir) * DEG
  const lc = light.clone().applyQuaternion(inv)
  const nc = st.origin.clone().sub(s.camera.position).normalize().applyQuaternion(inv)
  lc.addScaledVector(nc, -lc.dot(nc))
  const psi = Math.atan2(lc.y, lc.x) * DEG
  const ring = Math.asin(new THREE.Vector3().fromArray(look.ring.normal).normalize().applyQuaternion(st.rotation).dot(out.clone().normalize())) * DEG
  const sunOff = s.sun.dir.angleTo(st.origin.clone().sub(s.camera.position))
  const h = 0.02
  const a = shot(t - h / config.fps)
  const b = shot(t + h / config.fps)
  const dq = b.camera.quaternion.clone().multiply(a.camera.quaternion.clone().invert())
  const turn = 2 * Math.atan2(Math.hypot(dq.x, dq.y, dq.z), Math.abs(dq.w)) * DEG / (2 * h)
  const speed = b.camera.position.distanceTo(a.camera.position) / (2 * h) * config.fps
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(s.camera.quaternion)
  const fw = new THREE.Vector3(0, 0, -1).applyQuaternion(s.camera.quaternion)
  const ref = d.sunWorld.clone().addScaledVector(fw, -d.sunWorld.dot(fw)).normalize()
  const roll = Math.atan2(new THREE.Vector3().crossVectors(ref, up).dot(fw), ref.dot(up)) * DEG
  return { psi, ring, elong: sunOff * DEG, f, seg: s.segment.id, turn, phase, r, nx: p.x, ny: p.y, sx: sun.x, sy: sun.y, sunFront: sun.front, tx: mp.x, ty: mp.y, tr, tFront: mp.front, tPhase, stars: s.skyStars, sky: s.skyExposure, glare: s.sun.glare, fov: s.camera.vfov, dist, speed, roll, sunHidden: sunOff < Math.asin(Math.min(1 / dist, 1)) }
}

if (argv.includes('--scan')) {
  const G = LOOKBACK.glide as Record<string, number>
  const grid: Record<string, number[]> = JSON.parse(process.env.GRID ?? '{}')
  const keys = Object.keys(grid)
  const out: { score: number; text: string }[] = []
  const walk = (k: number): void => {
    if (k === keys.length) {
      const rows: Row[] = []
      for (let f = 5024; f <= 5150; f++) rows.push(at(f))
      let dp = 0, turn = 0, dpsi = 0, back = 0, jerk = 0
      for (let i = 1; i < rows.length; i++) {
        const c = rows[i]!.phase - rows[i - 1]!.phase
        dp = Math.max(dp, Math.abs(c))
        back = Math.min(back, c)
        turn = Math.max(turn, rows[i]!.turn)
        let q = rows[i]!.psi - rows[i - 1]!.psi
        q -= Math.round(q / 360) * 360
        dpsi = Math.max(dpsi, Math.abs(q))
        if (i > 1) jerk = Math.max(jerk, Math.abs(c - (rows[i - 1]!.phase - rows[i - 2]!.phase)))
      }
      const cs = rows.slice(1).map((r, i) => r.phase - rows[i]!.phase)
      let dip = 0
      for (let i = 16; i < cs.length - 16; i++) dip = Math.max(dip, Math.min(Math.max(...cs.slice(0, i)), Math.max(...cs.slice(i + 1))) - cs[i]!)
      out.push({ score: dp + Math.max(turn - 1, 0) + Math.max(-back - 0.02, 0) * 5 + dip * 2, text: keys.map((q) => q + '=' + (q in G ? G[q] : (LOOKBACK as any)[q])).join(',') + ' dphase ' + x(dp, 3) + ' back ' + x(back, 3) + ' turn ' + x(turn, 3) + ' dpsi ' + x(dpsi, 2) + ' jerk ' + x(jerk, 3) + ' dip ' + x(dip, 3) })
      return
    }
    for (const v of grid[keys[k]!]!) {
      if (keys[k]! in G) G[keys[k]!] = v
      else (LOOKBACK as any)[keys[k]!] = v
      walk(k + 1)
    }
  }
  const x = (v: number, k = 2): string => v.toFixed(k)
  walk(0)
  out.sort((p, q) => p.score - q.score)
  for (const o of out.slice(0, Number(process.env.TOP ?? 12))) console.log(o.text)
  process.exit(0)
}
const all: Row[] = []
for (let f = first - 1; f <= last; f++) all.push(at(f))
const x = (v: number, k = 2): string => v.toFixed(k)
if (argv.includes('--md')) {
  console.log('| frame | turn deg/f | phase deg | phase change deg/f | Neptune r px | star level | sky exposure |')
  console.log('| --- | --- | --- | --- | --- | --- | --- |')
}
let peakPsi = 0, peakPsiF = 0, maxPhase = 0, peakTurn = 0, peakPhase = 0, peakPhaseF = 0, peakTurnF = 0, peakJerk = 0, peakJerkF = 0
for (let i = 1; i < all.length; i++) {
  const r = all[i]!
  const dp = r.phase - all[i - 1]!.phase
  if (r.f >= 5025) {
    let dpsi = r.psi - all[i - 1]!.psi
    dpsi -= Math.round(dpsi / 360) * 360
    if (Math.abs(dpsi) > Math.abs(peakPsi)) { peakPsi = dpsi; peakPsiF = r.f }
    maxPhase = Math.max(maxPhase, r.phase)
    if (r.turn > peakTurn) { peakTurn = r.turn; peakTurnF = r.f }
    if (Math.abs(dp) > Math.abs(peakPhase)) { peakPhase = dp; peakPhaseF = r.f }
    if (i > 1) {
      const j = Math.abs(dp - (all[i - 1]!.phase - all[i - 2]!.phase))
      if (j > peakJerk) { peakJerk = j; peakJerkF = r.f }
    }
  }
  if ((r.f - first) % step !== 0 || argv.includes('--quiet')) continue
  if (argv.includes('--md')) console.log('| ' + r.f + ' | ' + x(r.turn, 3) + ' | ' + x(r.phase, 1) + ' | ' + x(dp, 3) + ' | ' + x(r.r, 0) + ' | ' + x(r.stars, 3) + ' | ' + x(r.sky, 3) + ' |')
  else console.log('f' + r.f + ' ' + r.seg.slice(7, 11) + ' turn' + x(r.turn, 3) + ' ph' + x(r.phase, 1) + ' d' + x(dp, 3) + ' r' + x(r.r, 0) + ' nep ' + x(r.nx, 0) + ',' + x(r.ny, 0) + ' sun ' + (r.sunFront ? x(r.sx, 0) + ',' + x(r.sy, 0) : 'behind') + (r.sunHidden ? ' HID' : '') + ' tri ' + (r.tFront ? x(r.tx, 0) + ',' + x(r.ty, 0) : 'behind') + ' r' + x(r.tr, 1) + ' ph' + x(r.tPhase, 0) + ' st' + x(r.stars, 3) + ' sky' + x(r.sky, 3) + ' g' + x(r.glare, 2) + ' fov' + x(r.fov, 1) + ' d' + x(r.dist, 2) + ' v' + r.speed.toExponential(2) + ' roll' + x(r.roll, 1) + ' psi' + x(r.psi, 0) + ' ring' + x(r.ring, 0))
}
console.log('peak turn ' + x(peakTurn, 3) + ' at ' + peakTurnF + ', peak phase change ' + x(peakPhase, 3) + ' at ' + peakPhaseF + ', peak change of phase rate ' + x(peakJerk, 4) + ' at ' + peakJerkF + ', peak crescent swing ' + x(peakPsi, 2) + ' at ' + peakPsiF + ', max phase ' + x(maxPhase, 1))
