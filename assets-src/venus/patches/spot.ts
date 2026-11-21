import * as THREE from 'three'
import { writeFileSync } from 'node:fs'
import { plan } from '../../../src/stops/venus/plan'
import fit from '../../../src/stops/venus/fit.json'

const turn = new THREE.Quaternion().fromArray(fit.globe.quaternion)
const inv = turn.clone().invert()
const n = plan.spot.clone().applyQuaternion(inv).normalize()
const east = new THREE.Vector3(0, 1, 0).cross(n).normalize()
const north = n.clone().cross(east)
const sun = plan.lightDir.clone().applyQuaternion(inv).normalize()
const heading = plan.heading.clone().applyQuaternion(inv).normalize()
const deg = THREE.MathUtils.radToDeg
const out = {
  stop: 'venus',
  spot: { lonDeg: deg(Math.atan2(n.x, n.z)), latDeg: deg(Math.asin(n.y)), direction: n.toArray(), east: east.toArray(), north: north.toArray() },
  sun: { bodyDir: sun.toArray(), patchEastNorthUp: [sun.dot(east), sun.dot(north), sun.dot(n)], elevationDeg: deg(Math.asin(sun.dot(n))), azimuthFromNorthCwDeg: deg(Math.atan2(sun.dot(east), sun.dot(north))) },
  heading: { patchEastNorth: [heading.dot(east), heading.dot(north)], azimuthFromNorthCwDeg: deg(Math.atan2(heading.dot(east), heading.dot(north))) },
}
writeFileSync(new URL('./spot.json', import.meta.url), JSON.stringify(out, null, 2) + '\n')
console.log(JSON.stringify(out))
