import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { TRAVEL } from '../../src/space/travel/path'
const over = process.env.OVER ? JSON.parse(process.env.OVER) : {}
for (const k of Object.keys(over)) Object.assign(TRAVEL[k]!, over[k])
const d = new FilmDirector(plans)
const id = process.argv[2] ?? 'uranus'
const i = config.stopIds.indexOf(id)
const seg = plans[i]!.seg.travel!
const f0 = Math.round(seg.start * config.fps)
const moons = (plans[i + 1] as any).fit.moons ?? []
const sf = config.shutterFraction
const A = Number(process.argv[3] ?? f0 + 40), B = Number(process.argv[4] ?? f0 + 75)
for (let f = A; f <= B; f++) {
  const row: string[] = []
  const at = (t: number): { c: THREE.Vector2; r: number; m: THREE.Vector2[]; sun: string } => {
    const s: any = d.shotAt(f, t)
    const set = s.sets[s.sets.length - 1]
    const q = (s.camera.quaternion as THREE.Quaternion).clone().invert()
    const k = 540 / Math.tan(THREE.MathUtils.degToRad(s.camera.vfov) / 2)
    const pr = (w: THREE.Vector3): THREE.Vector2 => { const v = w.clone().sub(s.camera.position).applyQuaternion(q); return new THREE.Vector2(960 + (v.x / -v.z) * k, 540 - (v.y / -v.z) * k) }
    const dist = set.origin.distanceTo(s.camera.position)
    const sd = (s.sun.dir as THREE.Vector3).clone().applyQuaternion(q)
    const sun = sd.z < 0 ? `${(960 + (sd.x / -sd.z) * k).toFixed(0)},${(540 - (sd.y / -sd.z) * k).toFixed(0)}` : 'behind'
    return { c: pr(set.origin), r: k / Math.sqrt(dist * dist - 1), m: moons.map((m: any) => pr(new THREE.Vector3(m.position[0], m.position[1], m.position[2]).applyQuaternion(set.rotation).add(set.origin))), sun }
  }
  const a = at(f / config.fps), m = at((f + sf / 2) / config.fps), b = at((f + sf) / config.fps)
  row.push(`${f} r ${m.r.toFixed(1)} centre ${m.c.x.toFixed(0)},${m.c.y.toFixed(0)} shift ${a.c.distanceTo(b.c).toFixed(2)} limb blur ${Math.abs(b.r - a.r).toFixed(2)}`)
  m.m.forEach((p, k) => row.push(`moon${k} at ${p.x.toFixed(0)},${p.y.toFixed(0)} r ${(moons[k].radius * m.r).toFixed(1)} streak ${a.m[k]!.distanceTo(b.m[k]!).toFixed(1)}`))
  row.push(`sun ${m.sun}`)
  console.log(row.join(' | '))
}
