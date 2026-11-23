import * as THREE from 'three'
import { plan } from '../../../src/stops/sun/plan'
import { stage } from '../../../src/stops/sun/stage'
import place from '../../../src/stops/sun/place.json'
import fit from '../../../src/stops/sun/fit.json'

/**
 * The two ways from the stage to the globe, compared at the handover of the rise (mail 275, the side
 * difference of the handover report): the way the terrain group and the camera's twin take (plan.toGlobe
 * and the carry of the spin) against the way the globe's own shader takes back (the spin in the shader,
 * the fit of the globe and place.json stage.toBody). Prints how far a stage point is from itself after
 * going out one way and back the other, in stage units and in pixels of the frame at that time.
 * usage: npx tsx assets-src/sun/place/sides.ts [time]
 */
const t = Number(process.argv[2] ?? 7.208333)
const fitTurn = new THREE.Quaternion().fromArray(fit.globe.quaternion)
const toBody = new THREE.Quaternion().fromArray(place.stage.toBody)
const back = toBody.clone().invert().multiply(fitTurn)
const carry = plan.carry(t)
const spin = plan.spin(t)
const spinY = (d: THREE.Vector3, a: number): THREE.Vector3 => new THREE.Vector3(Math.cos(a) * d.x - Math.sin(a) * d.z, d.y, Math.sin(a) * d.x + Math.cos(a) * d.z)
const pose = plan.risePose(t, 'terrain')
const px = (2 * Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)) / 1080
const g = stage.onGround(stage.spot[0], stage.spot[1])
console.log('time', t, 'spin', spin, 'eye height over the ground, stage units', (pose.position.distanceTo(stage.centre) - stage.radius).toFixed(4))
const up = g.clone().sub(stage.centre).normalize()
const e1 = new THREE.Vector3(1, 0, 0).addScaledVector(up, -up.x).normalize()
const e2 = new THREE.Vector3().crossVectors(up, e1)
for (const [a, b] of [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3], [6, 6], [-6, -6]] as [number, number][]) {
  const v = up.clone().multiplyScalar(stage.radius).addScaledVector(e1, a).addScaledVector(e2, b).normalize()
  const x = v.clone().multiplyScalar(stage.radius).add(stage.centre)
  const w = v.clone().applyQuaternion(plan.toGlobe).applyQuaternion(carry)
  const d = spinY(w.clone().applyQuaternion(fitTurn.clone().invert()), spin)
  const r = d.clone().applyQuaternion(back)
  const y = r.clone().multiplyScalar(stage.radius).add(stage.centre)
  const off = y.clone().sub(x)
  const dist = pose.position.distanceTo(x)
  console.log(`at ${a}, ${b}: off by ${off.length().toExponential(3)} stage units = ${(off.length() / (dist * px)).toFixed(3)} px at ${dist.toFixed(2)} units; along up ${off.dot(up).toExponential(2)}, e1 ${off.dot(e1).toExponential(2)}, e2 ${off.dot(e2).toExponential(2)}`)
}

// The same stage point on the screen of both sides: the terrain camera sees it in stage units, the orbit
// camera sees it where the terrain group is placed on the globe.
const orbit = plan.risePose(t, 'orbit')
const screen = (p: typeof pose, world: THREE.Vector3): [number, number] => {
  const d = world.clone().sub(p.position).applyQuaternion(p.quaternion.clone().invert())
  const k = Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)
  return [(0.5 + d.x / -d.z / (2 * k * (16 / 9))) * 1920, (0.5 - d.y / -d.z / (2 * k)) * 1080]
}
console.log('vfov terrain', pose.vfov, 'orbit', orbit.vfov)
for (const [a, b] of [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3], [6, 6], [-6, -6]] as [number, number][]) {
  const v = up.clone().multiplyScalar(stage.radius).addScaledVector(e1, a).addScaledVector(e2, b).normalize()
  const x = v.clone().multiplyScalar(stage.radius).add(stage.centre)
  const onGlobe = v.clone().applyQuaternion(plan.toGlobe).applyQuaternion(carry)
  const s1 = screen(pose, x)
  const s2 = screen(orbit, onGlobe)
  console.log(`at ${a}, ${b}: terrain side ${s1[0].toFixed(3)}, ${s1[1].toFixed(3)}  orbit side ${s2[0].toFixed(3)}, ${s2[1].toFixed(3)}  apart ${(s2[0] - s1[0]).toFixed(4)}, ${(s2[1] - s1[1]).toFixed(4)} px`)
}
