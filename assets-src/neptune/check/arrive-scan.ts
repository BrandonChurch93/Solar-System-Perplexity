import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { plan } from '../../../src/stops/neptune/plan'
import fit from '../../../src/stops/neptune/fit.json'
const DEG = 180 / Math.PI
const a = plan.p.arrive!
const m = (fit as any).moons[0]
const home = new THREE.Vector3().fromArray(m.position)
const place = (shot: any, world: THREE.Vector3): [number, number] => {
  const v = world.clone().sub(shot.camera.position).applyQuaternion(shot.camera.quaternion.clone().invert())
  const k = 540 / Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2)
  return [960 + v.x / -v.z * k, 540 - v.y / -v.z * k]
}
const base: any[] = []
console.log('swing  offset      turn 4455 to 4497  turn 4498 to 4530  peak deg per frame  triton least x, least y (4498 on)  y turns back by px  uranus at 4464, 4467   poses outside the travel equal')
for (const spec of process.argv.slice(2)) {
  const [sw, ox, oy] = spec.split(',').map(Number)
  a.swingDeg = sw!
  a.offset = [ox ?? 0.5, oy ?? 0.2]
  const d = new FilmDirector(plans)
  let lastQ: THREE.Quaternion | null = null
  let t1 = 0, t2 = 0, peak = 0, lx = 1e9, ly = 1e9, back = 0, lastY = 0
  let ur = ''
  for (let f = 4455; f <= 4530; f++) {
    const shot: any = d.shotAt(f, f / config.fps)
    const q = shot.skyQuaternion as THREE.Quaternion
    const r = lastQ ? 2 * Math.acos(Math.min(1, Math.abs(lastQ.dot(q)))) * DEG : 0
    lastQ = q.clone()
    if (f <= 4497) t1 += r; else t2 += r
    peak = Math.max(peak, r)
    const s = shot.sets.find((x: any) => x.id === 'neptune')
    const u = shot.sets.find((x: any) => x.id === 'uranus')
    if (u && (f === 4464 || f === 4467)) { const c = place(shot, u.origin); ur += ' ' + c[0].toFixed(0) + ',' + c[1].toFixed(0) }
    if (s && f >= 4498) {
      const turn = new THREE.Quaternion().setFromAxisAngle(plan.axis, THREE.MathUtils.degToRad(plan.p.moonDegPerSecond) * (f / config.fps - plan.holdMid))
      const t = place(shot, home.clone().applyQuaternion(turn).applyQuaternion(s.rotation).add(s.origin))
      lx = Math.min(lx, t[0]); ly = Math.min(ly, t[1])
      lastY = t[1]
    }
  }
  back = lastY - ly
  const out: any[] = []
  for (const f of [4380, 4420, 4454, 4530, 4531, 4605, 4707, 4860, 5006, 5085, 5235]) {
    const shot: any = d.shotAt(f, f / config.fps)
    const row: number[] = [...shot.skyQuaternion.toArray(), shot.camera.vfov]
    for (const x of shot.sets) {
      if (x.id !== 'neptune' && process.env.ONLY) continue
      const inv = x.rotation.clone().invert()
      row.push(...shot.camera.position.clone().sub(x.origin).applyQuaternion(inv).toArray(), ...inv.clone().multiply(shot.camera.quaternion).toArray(), ...shot.sun.dir.clone().applyQuaternion(inv).toArray())
    }
    out.push(row)
  }
  if (!base.length) base.push(...out)
  let worst = 0
  const per: string[] = []
  out.forEach((p, i) => { let w = 0; p.forEach((v: number, j: number) => { w = Math.max(w, Math.abs(v - base[i][j])) }); worst = Math.max(worst, w); per.push(w.toExponential(0)) })
  console.log(String(sw).padStart(5) + (' ' + a.offset.join(',')).padEnd(10) + t1.toFixed(1).padStart(14) + t2.toFixed(1).padStart(19) + peak.toFixed(2).padStart(17) + (lx.toFixed(0) + ', ' + ly.toFixed(0)).padStart(22) + back.toFixed(0).padStart(26) + ur.padStart(28) + '   largest difference ' + worst.toExponential(1) + ' per frame ' + per.join(' '))
}
