import * as THREE from 'three'
import { args } from '../../../tools/lib/common'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import place from '../../../src/stops/jupiter/place.json'

// The turn of the sky in the rise or the dive (scene.skyTurn) as it shows on screen.
//   npx tsx assets-src/jupiter/sky/window.ts [--kind rise] [--steps 2] [--slack 0.03]
// Prints the heights between which no pixel of the frame is sky, if there are any, and the way of the sky on screen in degrees a film
// frame beside the camera's own turn. If the turn lies between those heights it is not seen. If it does not, it has to run with the
// camera: the way of the sky then rises once and falls once (a second hill higher than slack times the largest fails).
// To be run again when the path of the rise or scene.skyTurn changes.

const steps = Number(args().steps ?? 2)
const slack = Number(args().slack ?? 0.03)
const film = new FilmDirector(plans)
const plan = plans[config.stopIds.indexOf('jupiter')]!
const kind = String(args().kind ?? 'rise')
const seg = config.segments.find((s) => s.id === 'jupiter.' + kind)!
const { width, height } = config.formats[config.formatKeys.master]!
const shot = (time: number) => film.shotAt(Math.floor(time * config.fps + 1e-9), time)
const open = (time: number): number => {
  const s = shot(time)
  const set = s.sets[0]!
  if (set.view !== 'orbit') return -1
  const inv = set.rotation.clone().invert()
  const eye = s.camera.position.clone().sub(set.origin).applyQuaternion(inv)
  const q = inv.multiply(s.camera.quaternion)
  const t = Math.tan(THREE.MathUtils.degToRad(s.camera.vfov) / 2)
  const c = eye.lengthSq() - 1
  const miss = (px: number, py: number): boolean => {
    const d = new THREE.Vector3(((px / width) * 2 - 1) * t * (width / height), (1 - (py / height) * 2) * t, -1).normalize().applyQuaternion(q)
    const b = eye.dot(d)
    return !(b < 0 && b * b - c >= 0)
  }
  let n = 0
  for (let x = 0; x <= width; x++) n += (miss(x, 0) ? 1 : 0) + (miss(x, height) ? 1 : 0)
  for (let y = 0; y <= height; y++) n += (miss(0, y) ? 1 : 0) + (miss(width, y) ? 1 : 0)
  return n
}
const seen = (time: number): { sky: THREE.Quaternion; camera: THREE.Quaternion } => {
  const s = shot(time)
  return { sky: film.sky.frame.clone().multiply(s.skyTurn.clone().invert()).multiply(s.skyQuaternion), camera: s.camera.quaternion.clone() }
}
const between = (a: THREE.Quaternion, b: THREE.Quaternion): number => THREE.MathUtils.radToDeg(2 * Math.acos(Math.min(1, Math.abs(a.dot(b))))) * steps
const at = (time: number): string => plan.eyeHeight(time).toFixed(4) + ' radii (frame ' + (time * config.fps).toFixed(3) + ')'
const half = config.shutterFraction / (2 * config.fps)

let first: number | null = null
let last: number | null = null
let shown = 0
const rows: { time: number; sky: number; camera: number }[] = []
for (let i = seg.firstFrame * steps; i < seg.endFrame * steps; i++) {
  const time = i / steps / config.fps + half
  const n = open(time)
  const share = plan.skyTurnShare(seg, time) ?? 0
  if (n === 0) {
    if (first === null) first = time
    last = time
  } else if (share > 0 && share < 1) shown++
  const p = seen(time)
  const q = seen(time + 1 / steps / config.fps)
  rows.push({ time, sky: between(p.sky, q.sky), camera: between(p.camera, q.camera) })
}
const [a, b] = place.scene.skyTurn as [number, number]
if (first !== null && last !== null) console.log('no pixel of the frame is sky from ' + at(first) + ' to ' + at(last))
else console.log('the sphere never fills the frame in the ' + kind)
const hidden = first !== null && last !== null && a >= plan.eyeHeight(first) && b <= plan.eyeHeight(last) && shown === 0
let top = rows[0]!
for (const r of rows) if (r.sky > top.sky) top = r
let hill = 0
let low = rows[0]!.sky
for (const r of rows) {
  if (r.time > top.time) {
    hill = Math.max(hill, r.sky - low)
    low = Math.min(low, r.sky)
  } else low = top.sky
}
let dip = 0
let high = 0
for (const r of rows) {
  if (r.time >= top.time) break
  dip = Math.max(dip, high - r.sky)
  high = Math.max(high, r.sky)
}
console.log('scene.skyTurn ' + a + ' to ' + b + ': ' + (hidden ? 'inside, the turn is not seen' : shown + ' samples with sky in the frame carry a part of the turn'))
console.log('way of the sky on screen: largest ' + top.sky.toFixed(2) + ' degrees a film frame at frame ' + (top.time * config.fps).toFixed(2) + ' (the camera alone ' + top.camera.toFixed(2) + '); fall before it ' + dip.toFixed(3) + ', climb after it ' + hill.toFixed(3) + ', allowed ' + (slack * top.sky).toFixed(3))
const out: string[] = []
for (const r of rows) if (Math.abs(r.time * config.fps - half * config.fps - Math.round(r.time * config.fps - half * config.fps)) < 1e-6 && Math.round(r.time * config.fps - half * config.fps) % 6 === 0) out.push(Math.round(r.time * config.fps - half * config.fps) + ' ' + r.sky.toFixed(2) + ' (' + r.camera.toFixed(2) + ')')
console.log('frame, sky (camera alone): ' + out.join(', '))
if (!hidden && (dip > slack * top.sky || hill > slack * top.sky)) process.exit(1)
