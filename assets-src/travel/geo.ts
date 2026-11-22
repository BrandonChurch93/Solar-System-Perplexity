import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
const d = new FilmDirector(plans) as any
const DEG = 180 / Math.PI
plans.slice(0, -1).forEach((p, i) => {
  const seg = config.segments.find((s) => s.id === p.id + '.travel')!
  const s = d.shotAt(seg.firstFrame, (seg.firstFrame + 0.25) / config.fps)
  const f = new THREE.Vector3(0, 0, -1).applyQuaternion(s.camera.quaternion)
  const b = s.sets[0].origin.clone().sub(s.camera.position)
  const m = d.approach[i + 1] as THREE.Vector3
  const n = d.frames[i + 1].origin.clone().sub(s.camera.position)
  const e = d.shotAt(seg.endFrame, (seg.endFrame + 0.25) / config.fps)
  const fe = new THREE.Vector3(0, 0, -1).applyQuaternion(e.camera.quaternion)
  const things = d.leavingThings(i, s.time)
  console.log(p.id, 'turnDeg', p.p.travel.turnDeg, 'side', p.p.travel.side, 'vfov', s.camera.vfov.toFixed(1), 'to', e.camera.vfov.toFixed(1), 'd0', b.length().toFixed(2), 'R', things[0].radius, 'body off axis', (f.angleTo(b) * DEG).toFixed(1), 'm to axis', (f.angleTo(m) * DEG).toFixed(1), 'm to body', (m.angleTo(b) * DEG).toFixed(1), 'miss', (b.length() * Math.sin(m.angleTo(b))).toFixed(2), 'next dist', n.length().toFixed(1), 'next off axis', (f.angleTo(n) * DEG).toFixed(1), 'reach', d.reach[i].toFixed(1), 'clear', d.clear[i + 1].toFixed(3), 'begin', d.begin[i].toFixed(3), 'end axis to start axis', (f.angleTo(fe) * DEG).toFixed(1), 'moons', things.length - 1)
})
