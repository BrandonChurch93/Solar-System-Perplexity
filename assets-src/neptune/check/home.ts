import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { plan } from '../../../src/stops/neptune/plan'
import * as look from '../../../src/stops/neptune/look'
const director = new FilmDirector(plans)
const smooth = (x: number) => { const t = Math.min(Math.max(x, 0), 1); return t * t * (3 - 2 * t) }
const at = (f: number) => {
  const shot: any = director.shotAt(f, f / config.fps)
  const s = shot.sets.find((x: any) => x.id === 'neptune')
  return (shot.camera.position as THREE.Vector3).clone().sub(s.origin).applyQuaternion((s.rotation as THREE.Quaternion).clone().invert())
}
const mid = Math.round(plan.holdMid * config.fps)
const hold = at(mid)
for (const a of process.argv.slice(2)) {
  const f = Number(a)
  const c = at(f)
  const off = THREE.MathUtils.radToDeg(c.angleTo(hold))
  console.log(f, 'off axis deg', off.toFixed(2), 'home', (1 - smooth((off - look.holdness.fromDeg) / (look.holdness.toDeg - look.holdness.fromDeg))).toFixed(3), 'height', (c.length() - 1).toFixed(3))
}
