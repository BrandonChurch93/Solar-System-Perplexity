import * as THREE from 'three'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/saturn/plan'

const [from, to, step, ref] = process.argv.slice(2).map(Number)
const d = new FilmDirector(plans) as any
const at = (f: number) => {
  const s = d.shotAt(f, f / config.fps)
  const set = s.sets.find((x: any) => x.id === 'saturn')
  return { cam: s.camera, origin: new THREE.Vector3(set.origin.x, set.origin.y, set.origin.z), vfov: plan.hold(f / config.fps - plan.seg.hold.start).vfov }
}
const r = at(ref!)
const dir = r.origin.clone().sub(r.cam.position).normalize()
for (let f = from!; f <= to!; f += step || 1) {
  const s = at(f)
  const k = 1080 / 2 / Math.tan(THREE.MathUtils.degToRad(s.vfov) / 2)
  const inv = s.cam.quaternion.clone().invert()
  const b = s.origin.clone().sub(s.cam.position).applyQuaternion(inv)
  const q = dir.clone().applyQuaternion(inv)
  console.log(f, 'body px', (960 + (b.x / -b.z) * k).toFixed(1), (540 - (b.y / -b.z) * k).toFixed(1), 'sky point px', (960 + (q.x / -q.z) * k).toFixed(1), (540 - (q.y / -q.z) * k).toFixed(1), 'distance', b.length().toFixed(4))
}
