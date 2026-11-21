import * as THREE from 'three'
import { config } from '../../../src/config'
import { frameSamples } from '../../../src/core/motion'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
const director = new FilmDirector(plans)
const argv = process.argv.slice(2)
const from = Number(argv[0] ?? 4980)
const to = Number(argv[1] ?? 5024)
const every = Number(argv[2] ?? 2)
const local = (time: number) => {
  const shot: any = director.shotAt(Math.floor(time * config.fps + 1e-6), time)
  const s = shot.sets.find((x: any) => x.id === 'neptune')
  const inv = (s.rotation as THREE.Quaternion).clone().invert()
  return { view: s.view as string, p: (shot.camera.position as THREE.Vector3).clone().sub(s.origin).applyQuaternion(inv), q: inv.clone().multiply(shot.camera.quaternion), th: Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2) }
}
console.log('frame view height  flow px per frame at 1080p (median, max over the globe in frame)  samples review final  px per sample final')
for (let f = from; f <= to; f += every) {
  const a = local(f / config.fps)
  const b = local((f + config.shutterFraction) / config.fps)
  if (a.view !== 'orbit' || b.view !== 'orbit') { console.log(f, a.view); continue }
  const moves: number[] = []
  for (let iy = 0; iy < 9; iy++) for (let ix = 0; ix < 15; ix++) {
    const sx = (ix + 0.5) / 15 * 2 - 1
    const sy = (iy + 0.5) / 9 * 2 - 1
    const d = new THREE.Vector3(sx * a.th * 16 / 9, sy * a.th, -1).normalize().applyQuaternion(a.q)
    const bq = a.p.dot(d)
    const disc = bq * bq - (a.p.lengthSq() - 1)
    if (disc <= 0 || bq > 0) continue
    const hit = a.p.clone().addScaledVector(d, -bq - Math.sqrt(disc))
    const v = hit.clone().sub(b.p).applyQuaternion(b.q.clone().invert())
    if (v.z >= 0) continue
    const bx = v.x / -v.z / (b.th * 16 / 9)
    const by = v.y / -v.z / b.th
    moves.push(Math.hypot((bx - sx) * 960, (by - sy) * 540) / config.shutterFraction)
  }
  moves.sort((x, y) => x - y)
  const review = frameSamples(director, f, 'review')
  const final = frameSamples(director, f, 'final')
  const max = moves[moves.length - 1] ?? 0
  console.log(f, a.view, (a.p.length() - 1).toFixed(3).padStart(6), (moves[Math.floor(moves.length / 2)] ?? 0).toFixed(0).padStart(5), max.toFixed(0).padStart(5), String(review).padStart(4), String(final).padStart(4), (max * config.shutterFraction / final).toFixed(2).padStart(6))
}
