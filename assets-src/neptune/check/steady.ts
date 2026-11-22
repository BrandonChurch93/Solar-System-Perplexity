import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { drift } from '../../../src/director/rig'
const director = new FilmDirector(plans)
const plan: any = plans.find((p: any) => p.id === 'neptune')
for (const a of process.argv.slice(2)) {
  const f = Number(a)
  const time = (f + config.shutterFraction / 2) / config.fps
  const shot: any = director.shotAt(Math.floor(f), time)
  const seg = shot.segment
  const base = Object.getPrototypeOf(Object.getPrototypeOf(plan))
  const local = seg.kind === 'terrain' ? base.terrain.call(plan, time - seg.start) : base.hold.call(plan, time - seg.start)
  const s = shot.sets.find((x: any) => x.id === 'neptune')
  const rel = s.rotation.clone().multiply(local.quaternion).invert().multiply(shot.camera.quaternion)
  const d = drift(time)
  console.log(f, seg.id, 'camera', shot.camera.quaternion.toArray().map((v: number) => v.toFixed(7)).join(','), 'pos', shot.camera.position.toArray().map((v: number) => v.toFixed(5)).join(','), 'final against the plain plan pose deg', (2 * Math.acos(Math.min(1, Math.abs(rel.w))) * 180 / Math.PI).toFixed(5), 'drift deg', (2 * Math.acos(Math.min(1, Math.abs(d.w))) * 180 / Math.PI).toFixed(5))
}
