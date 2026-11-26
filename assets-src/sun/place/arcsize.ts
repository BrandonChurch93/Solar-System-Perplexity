import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { sideAt } from '../../../src/director/handover'
import { segmentAtFrame } from '../../../src/director/timeline'
import { plan } from '../../../src/stops/sun/plan'
import { stage } from '../../../src/stops/sun/stage'
import { Arcade } from '../../../src/stops/sun/arcs'
// arcsize.ts FRAMES...: the arcade's size through the film's own shot (the camera the set is drawn with), by the law of
// set.ts: the eye in the stage's frame, on the close side as it stands, on the globe's side through the carry
const film = new FilmDirector(plans)
const a = new Arcade()
const index = film.plans.findIndex((p) => p.id === 'sun')
console.log('tall', a.tall.toFixed(4), 'leave', JSON.stringify(a.leave))
for (const f of process.argv.slice(2).map(Number)) {
  const time = (f + 0.5 * config.shutterFraction) / config.fps
  const seg = segmentAtFrame(f)
  const side = seg.stop === 'sun' && (seg.kind === 'dive' || seg.kind === 'rise') ? sideAt(seg, time) : undefined
  const shot = film.shotAt(f, time, side)
  const set = shot.sets.find((s) => s.id === 'sun')
  if (!set) { console.log(f, seg.id, 'no set of the Sun'); continue }
  const back = set.rotation.clone().invert()
  const local = shot.camera.position.clone().sub(set.origin).applyQuaternion(back)
  const eye = set.view === 'terrain' ? local : local.clone().applyQuaternion(plan.carry(time).invert()).applyQuaternion(plan.toStage).multiplyScalar(stage.radius).add(stage.centre)
  const d = eye.distanceTo(a.place)
  const px = a.tall / d * a.leave.lines / (2 * Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2))
  console.log(f, seg.id, set.view, 'weight', (set as any).weight, 'vfov', shot.camera.vfov.toFixed(2), 'distance', d.toFixed(3), 'size', px.toFixed(1), 'share', a.sized(eye, shot.camera.vfov).toFixed(4))
}
