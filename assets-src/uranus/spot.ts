import * as THREE from 'three'
import { loadConfig } from '../../tools/lib/common'
import { plans } from '../../src/director/plans'
import { FilmDirector } from '../../src/director/film'
import { sampleWindow, project, sphereHit } from '../../tools/smooth/camera'

const cfg = loadConfig()
const stop = process.argv[2] ?? 'uranus'
const kind = (process.argv[3] ?? 'dive') as 'dive' | 'rise'
const every = Number(process.argv[4] ?? 2)
const S = cfg.raw.smooth
const master = cfg.formats[cfg.formatKeys.master]!
const plan = plans.find((p) => p.id === stop)!
const film = new FilmDirector(plans)
const w = sampleWindow(cfg, film, plan, kind, 1, 2)!
const W = master.width, H = master.height, R = S.path.ringPx
console.log('size', W, H, 'ring', R)
w.samples.forEach((s, i) => {
  if (i === 0 || s.frame % every) return
  const prev = w.samples[i - 1]!
  const spot = project(s.pose, plan.place(kind, s.time), W, H)
  const cx = Math.min(Math.max(spot.x, R), W - R)
  const cy = Math.min(Math.max(spot.y, R), H - R)
  const carry = plan.turn(s.time).invert().premultiply(plan.turn(prev.time))
  let seen = 0
  const ds: string[] = []
  for (let j = 0; j < 8; j++) {
    const a = (j / 8) * 2 * Math.PI
    const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R
    const g = sphereHit(s.pose, x, y, W, H)
    if (!g) { ds.push('  -  '); continue }
    const b = project(prev.pose, g.clone().applyQuaternion(carry), W, H)
    if (!b.front) { ds.push('  b  '); continue }
    seen++
    ds.push(Math.hypot(x - b.x, y - b.y).toFixed(1).padStart(5))
  }
  const pl = plan.place(kind, s.time)
  const zen = Math.acos(Math.min(1, pl.clone().normalize().dot(s.pose.position.clone().normalize()))) * 180 / Math.PI
  console.log(s.frame, s.side, 'h', s.height.toFixed(4), 'spot', spot.x.toFixed(0), spot.y.toFixed(0), spot.front ? 'f' : 'B', 'c', cx.toFixed(0), cy.toFixed(0), 'seen', seen, 'arc', zen.toFixed(2), 'fov', s.pose.vfov.toFixed(1), ds.join(' '))
})
