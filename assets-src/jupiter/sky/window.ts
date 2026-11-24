import * as THREE from 'three'
import { args } from '../../../tools/lib/common'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import place from '../../../src/stops/jupiter/place.json'

// The heights of the rise between which no pixel of the frame is sky, and whether the turn of the sky (scene.skyTurn) lies inside them.
//   npx tsx assets-src/jupiter/sky/window.ts [--steps 8]
// Fails when a part of the turn would be seen. To be run again when the path of the rise changes.

const steps = Number(args().steps ?? 8)
const film = new FilmDirector(plans)
const plan = plans[config.stopIds.indexOf('jupiter')]!
const seg = config.segments.find((s) => s.id === 'jupiter.rise')!
const { width, height } = config.formats[config.formatKeys.master]!
const open = (time: number): number => {
  const s = film.shotAt(Math.floor(time * config.fps + 1e-9), time)
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
let first: number | null = null
let last: number | null = null
let seen = 0
for (let i = seg.firstFrame * steps; i < seg.endFrame * steps; i++) {
  const time = i / steps / config.fps
  const n = open(time)
  const share = plan.skyTurnShare(seg, time) ?? 0
  if (n === 0) {
    if (first === null) first = time
    last = time
  } else if (share > 0 && share < 1) seen++
}
if (first === null || last === null) throw new Error('the sphere never fills the frame in the rise')
const at = (time: number): string => plan.eyeHeight(time).toFixed(4) + ' radii (frame ' + (time * config.fps).toFixed(3) + ')'
const [a, b] = place.scene.skyTurn as [number, number]
const inside = a >= plan.eyeHeight(first) && b <= plan.eyeHeight(last) && seen === 0
console.log('no pixel of the frame is sky from ' + at(first) + ' to ' + at(last))
console.log('scene.skyTurn ' + a + ' to ' + b + ': ' + (inside ? 'inside, the turn is not seen' : 'NOT inside, ' + seen + ' samples with sky in the frame carry a part of the turn'))
if (!inside) process.exit(1)
