import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

const argv = process.argv.slice(2)
const arg = (k: string): string | undefined => {
  const i = argv.indexOf('--' + k)
  return i >= 0 ? argv[i + 1] ?? '' : undefined
}
const d = new FilmDirector(plans)
const fmt = config.formats[config.formatKeys.master]!
const DEG = 180 / Math.PI
const MID = 0.25
const H = 0.02

interface Row { f: number; seg: string; u: number; fov: number; w: THREE.Vector3; rate: number; speed: number; logRate: number; bodies: { id: string; weight: number; x: number; y: number; r: number; inView: boolean; front: boolean }[]; sun: { x: number; y: number; front: boolean }; exposure: number; sky: number; glare: number; sunR: number; dust: number; roll: number }

const cam = (f: number, o: number) => d.shotAt(f, (f + o) / config.fps)

function project(c: THREE.Vector3, vfov: number): { x: number; y: number; front: boolean } {
  const t = Math.tan(vfov / DEG / 2)
  const z = Math.max(-c.z, 1e-9)
  return { x: (c.x / z / (t * fmt.width / fmt.height) * 0.5 + 0.5) * fmt.width, y: (0.5 - c.y / z / t * 0.5) * fmt.height, front: c.z < 0 }
}

function row(f: number): Row {
  const a = cam(f, MID - H)
  const s = cam(f, MID)
  const b = cam(f, MID + H)
  const dq = b.camera.quaternion.clone().multiply(a.camera.quaternion.clone().invert())
  if (dq.w < 0) dq.set(-dq.x, -dq.y, -dq.z, -dq.w)
  const ang = 2 * Math.atan2(Math.hypot(dq.x, dq.y, dq.z), dq.w)
  const axis = new THREE.Vector3(dq.x, dq.y, dq.z)
  if (axis.lengthSq() > 0) axis.normalize()
  const w = axis.multiplyScalar((ang * DEG) / (2 * H)).applyQuaternion(s.camera.quaternion.clone().invert())
  const inv = s.camera.quaternion.clone().invert()
  const speed = b.camera.position.distanceTo(a.camera.position) / (2 * H) * config.fps
  let logRate = 0
  const bodies = s.sets.map((st, k) => {
    const rel = st.origin.clone().sub(s.camera.position)
    const dist = rel.length()
    const p = project(rel.clone().applyQuaternion(inv), s.camera.vfov)
    const r = (1 / Math.sqrt(Math.max(dist * dist - 1, 1e-12))) / Math.tan(s.camera.vfov / DEG / 2) * (fmt.height / 2)
    const inView = p.front && p.x > -r && p.x < fmt.width + r && p.y > -r && p.y < fmt.height + r && st.weight > 0
    if (k === s.sets.length - 1) {
      const da = st.origin.distanceTo(a.camera.position)
      const db = b.sets[k] ? b.sets[k]!.origin.distanceTo(b.camera.position) : da
      logRate = Math.log(da / db) / (2 * H)
    }
    return { id: st.id, weight: st.weight, x: p.x, y: p.y, r, inView, front: p.front }
  })
  const sun = project(s.sun.dir.clone().applyQuaternion(inv), s.camera.vfov)
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(s.camera.quaternion)
  const fw = new THREE.Vector3(0, 0, -1).applyQuaternion(s.camera.quaternion)
  const ref = d.sunWorld.clone().addScaledVector(fw, -d.sunWorld.dot(fw)).normalize()
  const roll = Math.atan2(new THREE.Vector3().crossVectors(ref, up).dot(fw), ref.dot(up)) * DEG
  return { f, seg: s.segment.id, u: s.u, fov: s.camera.vfov, w, rate: w.length(), speed, logRate, bodies, sun, exposure: s.post.exposure, sky: s.skyExposure, glare: s.sun.glare, sunR: s.sun.angularRadius * DEG, dust: s.dust, roll }
}

const n = (x: number, k = 2): string => x.toFixed(k)

function show(r: Row): string {
  const b = r.bodies.map((x) => x.id.slice(0, 3) + (x.weight > 0 ? '' : '(off)') + ' ' + (x.front ? n(x.x, 0) + ',' + n(x.y, 0) : 'behind') + ' r' + (x.r < 10 ? n(x.r, 2) : n(x.r, 0)) + (x.inView ? ' IN' : '')).join(' | ')
  return 'f' + r.f + ' ' + r.seg.padEnd(16) + ' u' + n(r.u, 3) + ' fov' + n(r.fov, 2) + ' turn' + n(r.rate, 3) + ' w[' + r.w.toArray().map((x) => n(x, 2)).join(' ') + '] v' + r.speed.toExponential(2) + ' ln' + n(r.logRate, 4) + ' roll' + n(r.roll, 1) + ' | ' + b + ' | sun ' + (r.sun.front ? n(r.sun.x, 0) + ',' + n(r.sun.y, 0) : 'behind') + ' R' + n(r.sunR, 2) + ' g' + n(r.glare, 2) + ' exp' + n(r.exposure, 2) + ' sky' + n(r.sky, 2) + ' dust' + n(r.dust, 2)
}

function range(first: number, last: number): Row[] {
  const out: Row[] = []
  for (let f = first; f <= last; f++) out.push(row(f))
  return out
}

function summary(id: string): void {
  const seg = config.segments.find((s) => s.id === id)!
  const pad = 6
  const rows = range(Math.max(seg.firstFrame - pad, 0), Math.min(seg.endFrame - 1 + pad, config.frameCount - 1))
  const at = (f: number): Row => rows[f - rows[0]!.f]!
  const inner = rows.filter((r) => r.f >= seg.firstFrame && r.f < seg.endFrame)
  const peak = inner.reduce((m, r) => (r.rate > m.rate ? r : m))
  let jerk = { f: 0, v: 0 }
  let fovStep = { f: 0, v: 0 }
  let lnStep = { f: 0, v: 0 }
  for (let i = 1; i < rows.length; i++) {
    const dw = rows[i]!.w.clone().sub(rows[i - 1]!.w).length()
    if (dw > jerk.v) jerk = { f: rows[i]!.f, v: dw }
    const df = Math.abs(rows[i]!.fov - rows[i - 1]!.fov)
    if (df > fovStep.v) fovStep = { f: rows[i]!.f, v: df }
    const dl = Math.abs(rows[i]!.logRate - rows[i - 1]!.logRate)
    if (dl > lnStep.v) lnStep = { f: rows[i]!.f, v: dl }
  }
  const join = (f: number): string => {
    if (f - 1 < rows[0]!.f || f > rows[rows.length - 1]!.f) return 'n/a'
    const a = at(f - 1)
    const b = at(f)
    const before = f - 2 >= rows[0]!.f ? at(f - 2) : a
    const after = f + 1 <= rows[rows.length - 1]!.f ? at(f + 1) : b
    const step = b.w.clone().sub(a.w).length()
    const usual = Math.max(a.w.clone().sub(before.w).length(), after.w.clone().sub(b.w).length())
    return 'turn ' + n(a.rate, 3) + ' to ' + n(b.rate, 3) + ' deg/frame (step ' + n(step, 3) + ', neighbours ' + n(usual, 3) + '), fov ' + n(a.fov, 3) + ' to ' + n(b.fov, 3) + ', speed ' + a.speed.toExponential(2) + ' to ' + b.speed.toExponential(2) + ', ln rate ' + n(a.logRate, 4) + ' to ' + n(b.logRate, 4)
  }
  const leaving = inner.filter((r) => r.bodies.length > 1 && r.bodies[0]!.inView).map((r) => r.f)
  const next = (px: number): number | null => {
    for (const r of inner) {
      const b = r.bodies[r.bodies.length - 1]!
      if (b.r >= px) return r.f
    }
    return null
  }
  const firstIn = inner.find((r) => r.bodies[r.bodies.length - 1]!.inView && r.bodies.length > 1)
  console.log('== ' + id + ' frames ' + seg.firstFrame + ' to ' + (seg.endFrame - 1))
  console.log('  join in  (' + seg.firstFrame + '): ' + join(seg.firstFrame))
  console.log('  join out (' + seg.endFrame + '): ' + join(seg.endFrame))
  console.log('  peak turn ' + n(peak.rate, 2) + ' deg/frame at ' + peak.f + '; largest change of turn between frames ' + n(jerk.v, 3) + ' at ' + jerk.f + '; largest fov change ' + n(fovStep.v, 3) + ' at ' + fovStep.f + '; largest ln rate change ' + n(lnStep.v, 4) + ' at ' + lnStep.f)
  if (leaving.length) console.log('  departing body in view: ' + leaving.length + ' frames, ' + leaving[0] + ' to ' + leaving[leaving.length - 1])
  else console.log('  departing body in view: 0 frames')
  console.log('  next body: in frame from ' + (firstIn ? firstIn.f : 'never') + ', radius passes 1 px at ' + next(1) + ', 10 px at ' + next(10) + ', 100 px at ' + next(100))
  const roll0 = inner[0]!.roll
  const roll1 = inner[inner.length - 1]!.roll
  console.log('  roll against the Sun line ' + n(roll0, 1) + ' to ' + n(roll1, 1) + ', exposure ' + n(inner[0]!.exposure) + ' to ' + n(inner[inner.length - 1]!.exposure) + ', sun radius ' + n(inner[0]!.sunR) + ' to ' + n(inner[inner.length - 1]!.sunR))
}

const ids = config.segments.filter((s) => s.kind === 'travel' || s.stop === config.endingId).map((s) => s.id)
if (arg('segment') !== undefined) {
  const seg = config.segments.find((s) => s.id === arg('segment'))!
  const pad = Number(arg('pad') ?? 3)
  for (const r of range(Math.max(seg.firstFrame - pad, 0), Math.min(seg.endFrame - 1 + pad, config.frameCount - 1))) console.log(show(r))
} else if (arg('first') !== undefined) {
  for (const r of range(Number(arg('first')), Number(arg('last') ?? arg('first')))) console.log(show(r))
} else for (const id of ids) summary(id)
