import * as THREE from 'three'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/saturn/plan'

const [from, to, step] = process.argv.slice(2).map(Number)
const tilt = new THREE.Quaternion().fromArray(plan.fit.globe.quaternion)
const polar = plan.fit.globe.scale[1]!
const d = new FilmDirector(plans) as any
const hits = (c: THREE.Vector3, p: THREE.Vector3): boolean => {
  const k = new THREE.Vector3(1, 1 / polar, 1)
  const cc = c.clone().multiply(k)
  const dd = p.clone().multiply(k).sub(cc)
  const qa = dd.dot(dd)
  const qb = cc.dot(dd)
  const qd = qb * qb - qa * (cc.dot(cc) - 1)
  return qb < 0 && qd > 0 && -qb - Math.sqrt(qd) > qa
}
for (let f = from!; f <= to!; f += step || 1) {
  const s = d.shotAt(f, f / config.fps)
  const set = s.sets.find((x: any) => x.id === 'saturn')
  const toRing = set.rotation.clone().multiply(tilt).invert()
  const camL = s.camera.position.clone().sub(new THREE.Vector3(set.origin.x, set.origin.y, set.origin.z)).applyQuaternion(toRing)
  const out: string[] = []
  for (const r of [1.25, 1.35, 1.5]) {
    let lo = 180
    let hi = -180
    for (let az = -180; az < 180; az += 0.05) {
      const a = THREE.MathUtils.degToRad(az)
      if (hits(camL, new THREE.Vector3(r * Math.cos(a), 0, r * Math.sin(a)))) {
        lo = Math.min(lo, az)
        hi = Math.max(hi, az)
      }
    }
    out.push('r ' + r + ' over az ' + lo.toFixed(2) + ' to ' + hi.toFixed(2))
  }
  console.log(f, 'camL', camL.toArray().map((v: number) => v.toFixed(3)).join(' '), out.join(' | '))
}
