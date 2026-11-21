import * as THREE from 'three'
import { writeFileSync } from 'node:fs'
import { config } from '../../../src/config'
import * as look from '../../../src/stops/uranus/look'
import { plan } from '../../../src/stops/uranus/plan'
import fit from '../../../src/stops/uranus/fit.json'

const globeQ = new THREE.Quaternion().fromArray(fit.globe.quaternion)
const axisQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3().fromArray(look.shape.axis).normalize())
const centre = new THREE.Vector3().fromArray(look.shape.center)
const toBody = (world: THREE.Vector3): THREE.Vector3 => {
  const v = world.clone().sub(centre).applyQuaternion(axisQ.clone().invert())
  v.set(v.x / look.shape.polar, v.y / look.shape.equator, v.z / look.shape.equator)
  return v.applyQuaternion(axisQ).applyQuaternion(globeQ.clone().invert()).normalize()
}
const CENTRE_DEG = [34, -24.5]
const ground = toBody(plan.spot)
const ahead = toBody(plan.spot.clone().addScaledVector(plan.heading, 0.01).normalize())
const lon = THREE.MathUtils.degToRad(CENTRE_DEG[0]!)
const lat = THREE.MathUtils.degToRad(CENTRE_DEG[1]!)
const spot = new THREE.Vector3(Math.sin(lon) * Math.cos(lat), Math.sin(lat), Math.cos(lon) * Math.cos(lat))
const east = new THREE.Vector3(0, 1, 0).cross(ground).normalize()
const north = ground.clone().cross(east)
const h = ahead.clone().sub(ground).normalize()
const headingDeg = THREE.MathUtils.radToDeg(Math.atan2(h.dot(north), h.dot(east)))
const sunBody = plan.lightDir.clone().applyQuaternion(globeQ.clone().invert())
const out = { spot: spot.toArray(), ground: ground.toArray(), latDeg: THREE.MathUtils.radToDeg(lat), lonDeg: THREE.MathUtils.radToDeg(lon), headingFromEastDeg: headingDeg, sunBody: sunBody.toArray(), ndl: sunBody.dot(spot), unit: plan.p.dive.altitude / (1 + plan.p.terrain.entryHeight * 0.6431), fps: config.fps }
writeFileSync('assets-src/uranus/dive/spot.json', JSON.stringify(out, null, 1) + '\n')
console.log(JSON.stringify(out, null, 1))
