import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

const d = new FilmDirector(plans)
const DEG = 180 / Math.PI
const n = (x: number, k = 1): string => x.toFixed(k)
for (const seg of config.segments.filter((s) => s.kind === 'travel')) {
  const a = d.shotAt(seg.firstFrame, seg.start)
  const b = d.shotAt(seg.endFrame, seg.end)
  const qa = a.camera.quaternion
  const qb = b.camera.quaternion
  const total = qa.angleTo(qb) * DEG
  const fa = new THREE.Vector3(0, 0, -1).applyQuaternion(qa)
  const fb = new THREE.Vector3(0, 0, -1).applyQuaternion(qb)
  const pan = fa.angleTo(fb) * DEG
  const inv = qa.clone().invert()
  const fbCam = fb.clone().applyQuaternion(inv)
  const dir = Math.atan2(fbCam.y, fbCam.x) * DEG
  const swingless = new THREE.Quaternion().setFromUnitVectors(fa, fb).multiply(qa)
  const roll = swingless.angleTo(qb) * DEG
  const upA = new THREE.Vector3(0, 1, 0).applyQuaternion(swingless)
  const upB = new THREE.Vector3(0, 1, 0).applyQuaternion(qb)
  const rollSign = Math.sign(new THREE.Vector3().crossVectors(upA, upB).dot(fb))
  const body = a.sets[0]!.origin.clone().sub(a.camera.position)
  const bodyCam = body.clone().applyQuaternion(inv)
  const sunA = a.sun.dir.clone().applyQuaternion(inv)
  const sunB = b.sun.dir.clone().applyQuaternion(qb.clone().invert())
  const ang = (v: THREE.Vector3): string => '(' + n(Math.atan2(v.x, -v.z) * DEG) + ', ' + n(Math.atan2(v.y, Math.hypot(v.x, v.z)) * DEG) + ')'
  const nextDir = b.sets[0]!.origin.clone().sub(a.camera.position).applyQuaternion(inv)
  console.log(seg.id + ': total ' + n(total) + ', pan ' + n(pan) + ' toward screen angle ' + n(dir) + ' (0 right, 90 up), roll ' + n(roll * rollSign) + '; leaving body at ' + ang(bodyCam) + ' radius ' + n(Math.asin(1 / body.length()) * DEG) + '; next body at ' + ang(nextDir) + '; sun at exit ' + ang(sunA) + ', sun at hold ' + ang(sunB) + '; begin ' + n(d.beginOf(config.stopIds.indexOf(seg.stop) + 1), 3))
}
