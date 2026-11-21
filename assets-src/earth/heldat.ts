import * as THREE from 'three'
import { plan } from '../../src/stops/earth/plan'
import { direction } from '../../src/stops/earth/globe'
import wrap from '../../src/stops/earth/wrap.json'

const sun = plan.lightDir.clone().applyQuaternion(new THREE.Quaternion().fromArray(plan.fit.globe.quaternion).invert()).normalize()
const centre = direction(wrap.heroCentre[0]!, wrap.heroCentre[1]!)
const args = process.argv.slice(2).map(Number)
for (let i = 0; i + 1 < args.length; i += 2) {
  const d = direction(args[i]!, args[i + 1]!)
  console.log('lon', args[i], 'lat', args[i + 1], 'light at the middle of the hold', d.dot(sun).toFixed(3), 'cosine from the hero centre', d.dot(centre).toFixed(3))
}
