import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import place from '../../../src/stops/sun/place.json'
// skystep-aim.ts along tilt lift [carryFrom carryTo]: the sky over the Sun's rise with a trial aim and trial heights of
// the carry. Printed a frame: the height's share, the step of the sky in the picture (turn^-1 * skyQuaternion) and
// the step of the sky's own turn.
const A = process.argv.slice(2).map(Number)
if (A.length >= 3) ((plans as any[]).find((x) => x.id === 'sun')).p.skyAim.terrain = [A[0], A[1], A[2]]
if (A.length >= 5) (place as any).onGlobe.heights.carry = [A[3], A[4]]
const film = new FilmDirector(plans) as any
const timeOf = (f: number): number => (f + config.shutterFraction / 2) / config.fps
const deg = (a: THREE.Quaternion, b: THREE.Quaternion): number => THREE.MathUtils.radToDeg(a.angleTo(b))
console.log('terrain aim', JSON.stringify(film.plans[0].p.skyAim.terrain), 'carry', JSON.stringify((place as any).onGlobe.heights.carry), 'low against high', deg(film.sky.turns.sun, film.sky.orbits.sun).toFixed(3))
let before: { m: THREE.Quaternion; q: THREE.Quaternion; t: THREE.Quaternion } | null = null
const rows: [number, number, number, number][] = []
for (let f = 170; f <= 271; f += 1) {
  const s = film.shotAt(f, timeOf(f))
  const t: THREE.Quaternion = (s.skyTurn ?? new THREE.Quaternion()).clone()
  const q: THREE.Quaternion = s.skyQuaternion.clone()
  const m = t.clone().invert().multiply(q)
  if (before) rows.push([f - 1, deg(m, before.m), deg(q, before.q), deg(t, before.t)])
  before = { m, q, t }
}
const worst = rows.reduce((a, b) => (b[1] > a[1] ? b : a))
const worstOwn = rows.reduce((a, b) => (b[3] > a[3] ? b : a))
let jump = 0
let jumpAt = 0
for (let i = 1; i < rows.length; i += 1) if (Math.abs(rows[i]![1] - rows[i - 1]![1]) > jump) { jump = Math.abs(rows[i]![1] - rows[i - 1]![1]); jumpAt = rows[i]![0] }
if (process.env.ROWS) for (const r of rows) if (r[0] % 3 === 0 || (r[0] >= 203 && r[0] <= 207)) console.log(r[0] + ' to ' + (r[0] + 1), r[1].toFixed(3), r[2].toFixed(3), r[3].toFixed(3))
console.log('largest step in the picture', worst[1].toFixed(3), 'at', worst[0], '| largest own turn', worstOwn[3].toFixed(3), 'at', worstOwn[0], '| largest change of step', jump.toFixed(3), 'at', jumpAt)
