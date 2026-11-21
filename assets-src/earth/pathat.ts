import * as THREE from 'three'
import { config } from '../../src/config'
import { plan } from '../../src/stops/earth/plan'

const frames = process.argv.slice(2).map(Number)
const spot = (plan as unknown as { spot: THREE.Vector3 }).spot
for (const f of frames) {
  const time = (f + 0.25) / config.fps
  const seg = config.segments.find((s) => s.stop === 'earth' && f >= s.firstFrame && f < s.endFrame)!
  if (seg.kind !== 'dive' && seg.kind !== 'rise') continue
  const r = seg.kind === 'dive' ? plan.dive(time) : plan.rise(time)
  if (r.view !== 'orbit') {
    console.log(f, seg.kind, 'terrain view')
    continue
  }
  const p = r.pose.position
  const tq = (plan as unknown as { turn(t: number): THREE.Quaternion }).turn(time)
  const s = spot.clone().applyQuaternion(tq)
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(r.pose.quaternion)
  const h = p.length() - 1
  const nadir = p.clone().normalize()
  const offDeg = THREE.MathUtils.radToDeg(nadir.angleTo(s))
  const pitch = THREE.MathUtils.radToDeg(Math.asin(-fwd.dot(nadir)))
  const px = (2 * Math.tan(THREE.MathUtils.degToRad(r.pose.vfov) / 2)) / 1080
  const need = 1 / (h * px)
  console.log(f, seg.kind, 'h', h.toFixed(4), 'vfov', r.pose.vfov.toFixed(1), 'spot off nadir deg', offDeg.toFixed(2), 'pitch down', pitch.toFixed(1), 'nadir texels per radian for 1 per px', need.toFixed(0), 'widest 4096 patch deg', ((4096 / need) * 57.2958).toFixed(2), 'cover', plan.coverAmount(seg, time).toFixed(2))
}
