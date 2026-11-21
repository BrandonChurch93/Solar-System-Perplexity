import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { plan } from '../../../src/stops/neptune/plan'
import fit from '../../../src/stops/neptune/fit.json'
const DEG = 180 / Math.PI
const m = (fit as any).moons[0]
const R = Number(process.argv[2] ?? new THREE.Vector3().fromArray(m.position).length())
const step = Number(process.argv[3] ?? 4)
const director = new FilmDirector(plans)
const frames = [5006, 5024, 5040, 5055, 5070, 5085, 5100, 5115, 5130, 5145, 5200, 5260, 5320]
const cams = frames.map((f) => {
  const shot: any = director.shotAt(f, f / config.fps)
  const s = shot.sets.find((x: any) => x.id === 'neptune')
  const rot = s.rotation as THREE.Quaternion
  const inv = rot.clone().invert()
  return { f, pos: (shot.camera.position as THREE.Vector3).clone().sub(s.origin).applyQuaternion(inv), q: inv.clone().multiply(shot.camera.quaternion), th: Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2), vfov: shot.camera.vfov }
})
const scr = (c: (typeof cams)[number], w: THREE.Vector3) => {
  const v = w.clone().sub(c.pos).applyQuaternion(c.q.clone().invert())
  if (v.z >= 0) return null
  return { x: 0.5 + v.x / -v.z / (c.th * 16 / 9) / 2, y: 0.5 - v.y / -v.z / c.th / 2, d: v.length() }
}
for (const c of cams) {
  const p = scr(c, new THREE.Vector3())!
  const s = scr(c, c.pos.clone().addScaledVector(plan.sunDir, 1e6))
  console.log(c.f, 'camera at', c.pos.toArray().map((v) => v.toFixed(2)).join(' '), 'dist', c.pos.length().toFixed(2), 'planet', p.x.toFixed(2), p.y.toFixed(2), 'r', (Math.asin(1 / c.pos.length()) * DEG / c.vfov).toFixed(2), 'sun', s ? s.x.toFixed(2) + ' ' + s.y.toFixed(2) : 'behind', 'light phase', (c.pos.clone().normalize().angleTo(plan.lightDir) * DEG).toFixed(0))
}
if (process.argv[4] === 'at') {
  const c = cams.find((x) => x.f === Number(process.argv[5]))!
  for (const pair of process.argv.slice(6)) {
    const [x, y] = pair.split(',').map(Number) as [number, number]
    const dir = new THREE.Vector3((x - 0.5) * 2 * c.th * 16 / 9, (0.5 - y) * 2 * c.th, -1).normalize().applyQuaternion(c.q)
    const b = c.pos.dot(dir)
    const t = -b + Math.sqrt(b * b - c.pos.lengthSq() + R * R)
    const w = c.pos.clone().addScaledVector(dir, t)
    console.log('target', pair, 'position', w.toArray().map((v) => v.toFixed(3)).join(', '), 'from home deg', (w.angleTo(new THREE.Vector3().fromArray(m.position)) * DEG).toFixed(1))
    console.log('   ' + cams.map((k) => {
      const q = scr(k, w)
      if (!q) return 'behind'
      const pl = scr(k, new THREE.Vector3())!
      const rr = Math.asin(1 / k.pos.length()) / (2 * Math.atan(k.th))
      const hid = Math.hypot((q.x - pl.x) * 16 / 9, q.y - pl.y) < rr && q.d > k.pos.length()
      return k.f + ' ' + q.x.toFixed(2) + ',' + q.y.toFixed(2) + ' ' + (Math.asin(Math.min(m.radius / q.d, 1)) * 2 * DEG / k.vfov).toFixed(2) + (hid ? ' hidden' : '')
    }).join(' | '))
  }
  process.exit(0)
}
const inFrame = (p: { x: number; y: number } | null, mg: number) => !!p && p.x > mg && p.x < 1 - mg && p.y > mg * 16 / 9 && p.y < 1 - mg * 16 / 9
const rows: { score: number; text: string }[] = []
for (let lat = -88; lat <= 88; lat += step) for (let lon = 0; lon < 360; lon += step / Math.max(Math.cos(lat / DEG), 0.2)) {
  const w = new THREE.Vector3(Math.cos(lat / DEG) * Math.sin(lon / DEG), Math.sin(lat / DEG), Math.cos(lat / DEG) * Math.cos(lon / DEG)).multiplyScalar(R)
  const ps = cams.map((c) => scr(c, w))
  const look = ps.slice(9)
  if (!look.every((p) => inFrame(p, 0.05))) continue
  const hidden = cams.slice(9).some((c, i) => {
    const p = look[i]!
    const pl = scr(c, new THREE.Vector3())!
    const rr = Math.asin(1 / c.pos.length()) / (2 * Math.atan(c.th))
    return Math.hypot((p.x - pl.x) * 16 / 9, p.y - pl.y) < rr + 0.06 && p.d > c.pos.length()
  })
  if (hidden) continue
  const early = ps.slice(0, 2).filter((p) => inFrame(p, 0.04)).length
  const mid = ps.slice(2, 9).filter((p) => inFrame(p, 0.02)).length
  const size = (i: number) => (Math.asin(Math.min(m.radius / ps[i]!.d, 1)) * 2 * DEG / cams[i]!.vfov)
  rows.push({ score: early * 3 + mid, text: 'lat ' + lat + ' lon ' + lon.toFixed(0) + ' early ' + early + ' mid ' + mid + ' | ' + ps.map((p, i) => (p ? p.x.toFixed(2) + ',' + p.y.toFixed(2) + ' ' + size(i).toFixed(2) : 'behind')).join(' | ') })
}
rows.sort((a, b) => b.score - a.score)
console.log('candidates', rows.length, 'frames', frames.join(' '), '(x,y size in frame heights)')
for (const r of rows.slice(0, Number(process.argv[4] ?? 25))) console.log(r.text)
