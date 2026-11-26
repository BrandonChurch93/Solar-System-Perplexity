import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { aimAt, aimOf } from '../../../src/space/aim'
// One sky for the Sun's close view and its globe view: the aim of the close view's sky (plan.ts skyAim.terrain) at
// which the close view sees the very sky the globe view's twin sees there, so that the sky has no turn of its own on
// the way up (film.ts: d = frame * turn^-1 * skyQuaternion * ray; skyCarry = (qc qt^-1)^share, turn = slerp(high, low, share))
const film = new FilmDirector(plans) as any
const p = film.plans[0]
const fr = film.frames[0]
const deg = (a: THREE.Quaternion, b: THREE.Quaternion): number => THREE.MathUtils.radToDeg(a.angleTo(b))
const F: THREE.Quaternion = film.sky.frame
const high: THREE.Quaternion = film.sky.orbits[p.id]
const low: THREE.Quaternion = film.sky.turns[p.id]
console.log('stop', p.id, 'aims in the plan', JSON.stringify(p.p.skyAim), 'anchor', film.sky.anchor, 'fitted', JSON.stringify(film.sky.fitted))
console.log('turn of the sky between the two aims (low against high):', deg(low, high).toFixed(3), 'degrees')
const D = (t: number): THREE.Quaternion => {
  const close = t < p.seg.rise.start ? p.terrain(t - p.seg.terrain.start) : p.closePose('rise', t)
  const qc = fr.rotation.clone().multiply(p.turn(t)).multiply(p.terrainFrame).multiply(close.quaternion)
  const qt = fr.rotation.clone().multiply(p.twin(close, t).quaternion)
  return qc.multiply(qt.invert())
}
const at = (f: number): number => f / config.fps
const ref = D(at(206))
for (const f of [0, 60, 90, 179, 180, 196, 205, 206, 207, 210]) console.log('frame', f, 'the close frame against the twin:', THREE.MathUtils.radToDeg(2 * Math.acos(Math.min(Math.abs(D(at(f)).w), 1))).toFixed(4), 'degrees; against the one at 206:', deg(D(at(f)), ref).toFixed(5))
const fractions = (config.raw as any).judged.fractions as Record<string, number>
const s = config.segments.find((x: any) => x.id === p.id + '.terrain')!
const judged = Math.min(s.endFrame - 1, s.firstFrame + Math.floor((fractions[s.kind] ?? 0.5) * s.frames + 1e-9))
const tcam: THREE.Quaternion = film.shotAt(judged, judged / config.fps).camera.quaternion.clone()
for (const f of [205.5, 206, 218]) {
  const want = D(at(f)).multiply(high)
  const aimQ = F.clone().multiply(want.clone().invert()).multiply(tcam)
  const triple = aimOf(aimQ)
  const back = tcam.clone().multiply(aimAt(triple[0], triple[1], triple[2]).invert()).multiply(F)
  console.log('by the frames at', f, ': judged terrain frame', judged, 'aim', JSON.stringify(triple.map((x) => Number(x.toFixed(5)))), 'turn it gives against the wanted:', deg(back, want).toFixed(5), 'against the present low:', deg(want, low).toFixed(3))
}
