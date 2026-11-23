import { writeFileSync } from 'node:fs'
import * as THREE from 'three'
import { config } from '../../../src/config'
import fit from '../../../src/stops/mercury/fit.json'
import { closeRadius } from '../../../src/stops/mercury/close'
import { plan } from '../../../src/stops/mercury/plan'
import spec from './tiles.json'

const rad = THREE.MathUtils.degToRad
const toBody = new THREE.Quaternion().fromArray(fit.globe.quaternion).invert()
const out: Record<string, unknown> = {}
for (const [kind, s] of Object.entries(spec)) {
  const low = plan.low(s.atFrame / config.fps)
  const a = plan.anchor
  const position = a.origin.clone().addScaledVector(low.position.clone().applyQuaternion(a.frame), 1 / closeRadius).applyQuaternion(toBody)
  const tiles = s.views.map(([yaw, pitch], k) => {
    const q = toBody.clone().multiply(a.frame).multiply(low.quaternion).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(rad(pitch!), rad(yaw!), 0, 'YXZ')))
    const m = new THREE.Matrix4().makeRotationFromQuaternion(q).elements
    return { frame: s.firstFrame + k, yawDeg: yaw, pitchDeg: pitch, matrix: [[m[0], m[4], m[8]], [m[1], m[5], m[9]], [m[2], m[6], m[10]]] }
  })
  const n = position.clone().normalize()
  const sun = plan.lightDir.clone().applyQuaternion(plan.drawn(s.atFrame / config.fps).invert()).applyQuaternion(toBody)
  out[kind] = { atFrame: s.atFrame, vfovDeg: s.vfovDeg, sun: sun.toArray(), position: position.toArray(), heightRadii: position.length() - 1, nadir: { lonDeg: THREE.MathUtils.radToDeg(Math.atan2(n.x, n.z)), latDeg: THREE.MathUtils.radToDeg(Math.asin(n.y)) }, tiles }
}
const a = plan.anchor
const frame = new THREE.Matrix4().makeRotationFromQuaternion(toBody.clone().multiply(a.frame)).elements
out.close = { radius: closeRadius, origin: a.origin.clone().applyQuaternion(toBody).toArray(), matrix: [[frame[0], frame[4], frame[8]], [frame[1], frame[5], frame[9]], [frame[2], frame[6], frame[10]]] }
writeFileSync(process.argv[2] ?? 'out/work/mercury/place/tiles/cameras.json', JSON.stringify(out, null, 1))
console.log('written', Object.keys(out).join(' '))
