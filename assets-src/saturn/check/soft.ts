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
const logLo = Math.log(look.closeRange[0]), logHi = Math.log(look.closeRange[1])
const out: string[] = []
for (const f of process.argv.slice(2).map(Number)) {
  const s = d.shotAt(f, f / config.fps)
  const set = s.sets.find((x: any) => x.id === 'saturn')
  if (!set) { out.push(f + ' none'); continue }
  const toRing = set.rotation.clone().multiply(tilt).invert()
  const camL = s.camera.position.clone().sub(new THREE.Vector3(set.origin.x, set.origin.y, set.origin.z)).applyQuaternion(toRing)
  const pw = 1 - smooth((camL.distanceTo(heroL) - look.heroRange[0]) / (look.heroRange[1] - look.heroRange[0]))
  const close = 1 - smooth((Math.log(Math.max(Math.abs(camL.y), 1e-3)) - logLo) / (logHi - logLo))
  out.push(`${f} poseW ${pw.toFixed(3)} close ${close.toFixed(3)} soft ${((1 - pw) * (1 - close)).toFixed(3)} solid ${smooth((f / config.fps - plan.seg.hold.end) / look.rings.shadeSolid[1]).toFixed(3)}`)
}
console.log(out.join('\n'))
