import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { galactic } from '../../../src/space/sky'
import { aimAt } from '../../../src/space/aim'
// skysolve.ts x1 y1 x2 y2 [frame]: the aims of the close view's sky at which the middle line of the Milky Way passes
// through two points of the frame given (1920 by 1080), one for each place along the band, with the turn against the
// present aim
const [x1, y1, x2, y2] = process.argv.slice(2, 6).map(Number) as [number, number, number, number]
const at = Number(process.argv[6] ?? 90)
const film = new FilmDirector(plans) as any
const sun = film.plans.find((x: any) => x.id === 'sun')
const fractions = (config.raw as any).judged.fractions as Record<string, number>
const s = config.segments.find((x: any) => x.id === 'sun.terrain')!
const judged = Math.min(s.endFrame - 1, s.firstFrame + Math.floor((fractions[s.kind] ?? 0.5) * s.frames + 1e-9))
const cam = (f: number): THREE.Quaternion => film.shotAt(f, f / config.fps).camera.quaternion.clone()
const tcam = cam(judged)
const rel = tcam.clone().invert().multiply(cam(at))
const vfov = film.shotAt(at, at / config.fps).camera.vfov
const th = Math.tan(THREE.MathUtils.degToRad(vfov) / 2)
const gal = galactic()
const ray = (x: number, y: number): THREE.Vector3 => new THREE.Vector3((x / 1920 * 2 - 1) * th * 16 / 9, (1 - y / 1080 * 2) * th, -1).normalize().applyQuaternion(rel)
const r1 = ray(x1, y1), r2 = ray(x2, y2), rm = ray(960, 540)
const lat = (q: THREE.Quaternion, r: THREE.Vector3): number => Math.asin(Math.min(Math.max(r.clone().applyQuaternion(q).applyMatrix3(gal).z, -1), 1))
const lon = (q: THREE.Quaternion, r: THREE.Vector3): number => { const v = r.clone().applyQuaternion(q).applyMatrix3(gal); return THREE.MathUtils.radToDeg(Math.atan2(v.y, v.x)) }
const now = sun.p.skyAim.terrain as [number, number, number]
const qNow = aimAt(now[0], now[1], now[2])
console.log('judged terrain frame', judged, 'read at', at, 'vfov', vfov, 'present aim', JSON.stringify(now), 'lat at the two points now', THREE.MathUtils.radToDeg(lat(qNow, r1)).toFixed(2), THREE.MathUtils.radToDeg(lat(qNow, r2)).toFixed(2))
const best: { a: number; t: number; l: number; turn: number }[] = []
for (let a = -180; a < 180; a += 5) {
  for (const side of [0, 1]) {
    // Newton on (tilt, lift) from several starts
    let found: [number, number] | null = null
    for (let t0 = -180; t0 < 180 && !found; t0 += 30) for (let l0 = -30; l0 <= 30 && !found; l0 += 15) {
      let t = t0, l = l0
      for (let k = 0; k < 40; k++) {
        const f = (tt: number, ll: number): [number, number] => { const q = aimAt(a, tt, ll); return [lat(q, r1), lat(q, r2)] }
        const [f1, f2] = f(t, l)
        const e = 1e-3
        const [a1, a2] = f(t + e, l), [b1, b2] = f(t, l + e)
        const j11 = (a1 - f1) / e, j21 = (a2 - f2) / e, j12 = (b1 - f1) / e, j22 = (b2 - f2) / e
        const det = j11 * j22 - j12 * j21
        if (Math.abs(det) < 1e-12) break
        const dt = (-f1 * j22 + f2 * j12) / det, dl = (-j11 * f2 + j21 * f1) / det
        t += Math.max(-20, Math.min(20, dt)); l += Math.max(-10, Math.min(10, dl))
        if (Math.abs(f1) + Math.abs(f2) < 1e-9) break
      }
      const q = aimAt(a, t, l)
      const up = lat(q, ray(x1, y1 - 200)) > 0 ? 1 : 0
      if (Math.abs(lat(q, r1)) + Math.abs(lat(q, r2)) < 1e-6 && Math.abs(l) < 80 && up === side) found = [((t + 540) % 360) - 180, l]
    }
    if (found) best.push({ a, t: found[0], l: found[1], turn: THREE.MathUtils.radToDeg(aimAt(a, found[0], found[1]).angleTo(qNow)) })
  }
}
best.sort((p, q) => p.turn - q.turn)
for (const b of best.slice(0, 80)) { const q = aimAt(b.a, b.t, b.l); console.log('along', b.a, 'tilt', b.t.toFixed(3), 'lift', b.l.toFixed(3), 'turn against now', b.turn.toFixed(1), 'lon at 1, middle, 2:', lon(q, r1).toFixed(0), lon(q, rm).toFixed(0), lon(q, r2).toFixed(0)) }
