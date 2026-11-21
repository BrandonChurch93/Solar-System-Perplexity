import * as THREE from 'three'
import { config } from '../../../src/config'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { plan } from '../../../src/stops/neptune/plan'
const DEG = 180 / Math.PI
const director = new FilmDirector(plans)
for (const f of process.argv.slice(2).map(Number)) {
  const shot: any = director.shotAt(f, f / config.fps)
  const s = shot.sets.find((x: any) => x.id === 'neptune')
  const inv = (s.rotation as THREE.Quaternion).clone().invert()
  const cam = (shot.camera.position as THREE.Vector3).clone().sub(s.origin).applyQuaternion(inv)
  const q = inv.clone().multiply(shot.camera.quaternion)
  const up = cam.clone().normalize()
  const own = plan.lightDir.clone()
  const film = (shot.sun.dir as THREE.Vector3).clone().applyQuaternion(inv)
  const show = (name: string, l: THREE.Vector3) => {
    const v = l.clone().applyQuaternion(q.clone().invert())
    return name + ' elevation at camera ' + (90 - l.angleTo(up) * DEG).toFixed(1) + ' screen angle ' + (Math.atan2(v.y, v.x) * DEG).toFixed(0) + ' toward lens ' + (Math.asin(v.z) * DEG).toFixed(0)
  }
  console.log(f, s.view ?? '', 'h', (cam.length() - 1).toFixed(3), show('own', own), '|', show('film', film), '| own to film', (own.angleTo(film) * DEG).toFixed(1))
}
import * as look from '../../../src/stops/neptune/look'
{
  const smooth = (x: number) => { const t = Math.min(Math.max(x, 0), 1); return t * t * (3 - 2 * t) }
  const holdPose = plan.hold(plan.holdMid - plan.seg.hold.start)
  for (const f of process.argv.slice(2).map(Number)) {
    const shot: any = director.shotAt(f, f / config.fps)
    const s = shot.sets.find((x: any) => x.id === 'neptune')
    const camera = (s.origin as THREE.Vector3).clone().sub(shot.camera.position).negate()
    const offAxis = camera.angleTo(holdPose.position.clone().applyQuaternion(s.rotation)) * DEG
    console.log(f, 'off axis', offAxis.toFixed(1), 'home', (1 - smooth((offAxis - look.holdness.fromDeg) / (look.holdness.toDeg - look.holdness.fromDeg))).toFixed(3))
  }
}
