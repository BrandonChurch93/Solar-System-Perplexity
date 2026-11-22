import * as THREE from 'three'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/saturn/plan'
import * as look from '../../../src/stops/saturn/look'
const smooth = (x: number): number => { const t = Math.min(Math.max(x, 0), 1); return t * t * (3 - 2 * t) }
const tilt = new THREE.Quaternion().fromArray(plan.fit.globe.quaternion)
const toTilt = tilt.clone().invert()
const heroPose = plan.hold(plan.holdMid - plan.seg.hold.start)
const heroL = heroPose.position.clone().applyQuaternion(toTilt)
const d = new FilmDirector(plans) as any
for (const f of process.argv.slice(2).map(Number)) {
  const s = d.shotAt(f, f / config.fps)
  const set = s.sets.find((x: any) => x.id === 'saturn')
  if (!set) { console.log(f, 'no set'); continue }
  const toRing = set.rotation.clone().multiply(tilt).invert()
  const camL = s.camera.position.clone().sub(new THREE.Vector3(set.origin.x, set.origin.y, set.origin.z)).applyQuaternion(toRing)
  const dist = camL.distanceTo(heroL)
  console.log(f, 'dist', dist.toFixed(3), 'poseW', (1 - smooth((dist - look.heroRange[0]) / (look.heroRange[1] - look.heroRange[0]))).toFixed(3), 'camL', camL.toArray().map((v: number) => v.toFixed(2)).join(' '), 'patch', JSON.stringify(s.skyPatch ?? null).slice(0, 80), 'w', set.weight)
}
