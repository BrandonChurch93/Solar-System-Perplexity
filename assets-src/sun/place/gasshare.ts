import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { sideAt } from '../../../src/director/handover'
import { segmentAtFrame } from '../../../src/director/timeline'
import { plan } from '../../../src/stops/sun/plan'
import { stage } from '../../../src/stops/sun/stage'
import place from '../../../src/stops/sun/place.json'
// gasshare.ts FROM TO FRAMES...: the eye's height in radii and the share of the gas's light by the law of set.ts
// (gasAt: the floor gas.low under the height from, a smooth step in the logarithm of the height up to 1 at the height to),
// as it stands in place.json and with a trial from and to
const film = new FilmDirector(plans)
const A = process.argv.slice(2).map(Number)
const g = place.onGlobe.gas
const at = (h: number, a: number, b: number): number => g.low + (1 - g.low) * THREE.MathUtils.smoothstep(Math.log(h), Math.log(a), Math.log(b))
for (const f of A.slice(2)) {
  const time = (f + 0.5 * config.shutterFraction) / config.fps
  const seg = segmentAtFrame(f)
  const side = seg.stop === 'sun' && (seg.kind === 'dive' || seg.kind === 'rise') ? sideAt(seg, time) : undefined
  const shot = film.shotAt(f, time, side)
  const set = shot.sets.find((s) => s.id === 'sun')
  if (!set) continue
  const back = set.rotation.clone().invert()
  const local = shot.camera.position.clone().sub(set.origin).applyQuaternion(back)
  const eye = set.view === 'terrain' ? local : local.clone().applyQuaternion(plan.carry(time).invert()).applyQuaternion(plan.toStage).multiplyScalar(stage.radius).add(stage.centre)
  const h = eye.distanceTo(stage.centre) / stage.radius - 1
  console.log(f, set.view, 'height', h.toFixed(4), 'gas', at(h, g.from, g.to).toFixed(4), 'trial', at(h, A[0]!, A[1]!).toFixed(4))
}
