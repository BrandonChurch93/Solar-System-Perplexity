import * as THREE from 'three'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { handoverOf } from '../../../src/director/handover'
import { plan } from '../../../src/stops/venus/plan'
import { drift } from '../../../src/director/rig'
import fit from '../../../src/stops/venus/fit.json'

// The film's camera on the globe side at the T of the dive and of the rise (the twin of the close side there, with the
// film's drift), in the body fixed frame of the globe: the camera lay.py lays the close side's picture at T back with.
// npx tsx assets-src/venus/place/tcam.ts --json out/work/venus/place/tcam.json
const args = process.argv.slice(2)
const j = args.indexOf('--json')
const file = j >= 0 ? args[j + 1]! : ''
const film = new FilmDirector(plans)
const globe = new THREE.Quaternion().fromArray(fit.globe.quaternion)
const out: Record<string, object> = {}
for (const kind of ['dive', 'rise'] as const) {
  const h = handoverOf('venus', kind)
  if (!h) throw new Error('venus has not opted in')
  const frame = kind === 'dive' ? h.lastFrame : h.firstFrame
  for (const side of ['orbit', 'terrain'] as const) {
    const s = film.shotAt(frame, h.time, side)
    const p = kind === 'dive' ? plan.divePose(h.time, side) : plan.risePose(h.time, side)
    console.log(kind, side, 'frame', frame, 'time', h.time, 'window', h.placeFirstFrame, h.placeLastFrame, 'dissolve', h.firstFrame, h.lastFrame, 'shot camera from the plan pose: position', s.camera.position.distanceTo(p.position).toExponential(2), 'turned deg', THREE.MathUtils.radToDeg(s.camera.quaternion.angleTo(p.quaternion)).toFixed(4), 'vfov', s.camera.vfov, p.vfov)
    if (side !== 'orbit') continue
    // The shot's camera is the plan's pose set into the film's world and turned by the film's drift; here the same in the plan's frame.
    const frames = (film as unknown as { frames: { rotation: THREE.Quaternion; origin: THREE.Vector3 }[] }).frames
    const f = frames.find((c) => Math.abs(c.origin.distanceTo(s.camera.position) - p.position.length()) < 1e-6 * c.origin.length() + 1e-6)
    const own = p.quaternion.clone().multiply(drift(h.time))
    if (f) console.log(' the shot camera against pose times drift: position', s.camera.position.clone().sub(f.origin).applyQuaternion(f.rotation.clone().invert()).distanceTo(p.position).toExponential(2), 'turned deg', THREE.MathUtils.radToDeg(f.rotation.clone().invert().multiply(s.camera.quaternion).angleTo(own)).toExponential(2))
    else console.log(' no stop frame found for the check')
    const back = globe.clone().invert().multiply(plan.turn(h.time).invert())
    const pos = p.position.clone().applyQuaternion(back)
    const q = back.clone().multiply(own)
    const x = new THREE.Vector3(), y = new THREE.Vector3(), z = new THREE.Vector3()
    new THREE.Matrix4().makeRotationFromQuaternion(q).extractBasis(x, y, z)
    out[kind] = { frame, time: h.time, position: pos.toArray(), x: x.toArray(), y: y.toArray(), z: z.toArray(), vfovDeg: s.camera.vfov, height: pos.length() - 1 }
  }
}
if (file) (await import('node:fs')).writeFileSync(file, JSON.stringify(out, null, 1))
console.log(JSON.stringify(out))
