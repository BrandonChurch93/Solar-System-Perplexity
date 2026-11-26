import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
// The sky over the Sun's rise as the picture shows it: the engine reads the sky at frame * turn^-1 * skyQuaternion * ray
// (src/space/sky.ts), so what moves the stars in the picture from frame to frame is turn^-1 * skyQuaternion. Printed:
// its step a frame (degrees), the step of skyQuaternion alone and the step of the sky's own turn (the aim), 180 to 270.
const film = new FilmDirector(plans) as any
const timeOf = (f: number): number => (f + config.shutterFraction / 2) / config.fps
const deg = (a: THREE.Quaternion, b: THREE.Quaternion): number => THREE.MathUtils.radToDeg(a.angleTo(b))
console.log('terrain aim', JSON.stringify(film.plans[0].p.skyAim.terrain), 'low against high', deg(film.sky.turns.sun, film.sky.orbits.sun).toFixed(3))
let before: { m: THREE.Quaternion; q: THREE.Quaternion; t: THREE.Quaternion } | null = null
const rows: [number, number, number, number][] = []
for (let f = 179; f <= 271; f += 1) {
  const s = film.shotAt(f, timeOf(f))
  const t: THREE.Quaternion = (s.skyTurn ?? new THREE.Quaternion()).clone()
  const q: THREE.Quaternion = s.skyQuaternion.clone()
  const m = t.clone().invert().multiply(q)
  if (before) rows.push([f - 1, deg(m, before.m), deg(q, before.q), deg(t, before.t)])
  before = { m, q, t }
}
const worst = rows.reduce((a, b) => (b[1] > a[1] ? b : a))
const way = rows.reduce((a, b) => a + b[1], 0)
let jump = 0
let jumpAt = 0
for (let i = 1; i < rows.length; i += 1) if (Math.abs(rows[i]![1] - rows[i - 1]![1]) > jump) { jump = Math.abs(rows[i]![1] - rows[i - 1]![1]); jumpAt = rows[i]![0] }
console.log('frame  sky in the picture  skyQuaternion alone  the sky\'s own turn')
for (const r of rows) if (r[0] % 3 === 0 || r === worst || (r[0] >= 203 && r[0] <= 207) || r[0] >= 267) console.log(r[0] + ' to ' + (r[0] + 1), r[1].toFixed(3), r[2].toFixed(3), r[3].toFixed(3))
console.log('largest step of the sky in the picture', worst[1].toFixed(3), 'degrees at', worst[0], 'to', worst[0] + 1, '| way of the sky 179 to 271', way.toFixed(2), 'degrees | largest change of step', jump.toFixed(3), 'at', jumpAt)
