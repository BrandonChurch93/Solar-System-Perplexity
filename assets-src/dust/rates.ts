import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { Flow, FLOW } from '../../src/space/travel/flow'

const d = new FilmDirector(plans)
const flow = new Flow(d, FLOW.ease)
const every = Number(process.argv[2] ?? 6)
const only = process.argv[3]
const steps = Math.round(config.shutterFraction * FLOW.stepsPerFrame)
for (const seg of config.segments) {
  if (!FLOW.kinds.includes(seg.kind)) continue
  if (only && seg.id !== only) continue
  console.log(seg.id + ' ' + seg.firstFrame + ' to ' + (seg.endFrame - 1))
  for (let f = seg.firstFrame; f < seg.endFrame; f += every) {
    const open = d.shotAt(f, f / config.fps)
    const close = d.shotAt(f, (f + config.shutterFraction) / config.fps)
    const mid = d.shotAt(f, (f + 0.5 * config.shutterFraction) / config.fps)
    const turn = (open.camera.quaternion.angleTo(close.camera.quaternion) * 180) / Math.PI
    const pxPerDeg = 540 / Math.tan((mid.camera.vfov * Math.PI) / 360) * (Math.PI / 180)
    const f0 = flow.at(seg, f, 0, new THREE.Vector3())
    const f1 = flow.at(seg, f, steps, new THREE.Vector3())
    const step = f1.distanceTo(f0)
    console.log(f + ' u ' + mid.u.toFixed(3) + ' dust ' + mid.dust.toFixed(3) + ' look ' + (mid.dustLook ?? 0).toFixed(2) + ' vfov ' + mid.camera.vfov.toFixed(1) + ' turnShutterDeg ' + turn.toFixed(3) + ' panPx ' + (turn * pxPerDeg).toFixed(1) + ' flowStep ' + step.toFixed(4) + ' exposure ' + mid.post.exposure.toFixed(2) + ' sunR ' + mid.sun.angularRadius.toFixed(4) + ' glare ' + mid.sun.glare.toFixed(2))
  }
}
