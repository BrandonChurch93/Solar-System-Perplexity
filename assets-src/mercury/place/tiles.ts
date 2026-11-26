import { readFileSync, writeFileSync } from 'node:fs'
import * as THREE from 'three'
import { config } from '../../../src/config'
import fit from '../../../src/stops/mercury/fit.json'
import { closeRadius } from '../../../src/stops/mercury/close'
import { plan } from '../../../src/stops/mercury/plan'
import spec from './tiles.json'

const rad = THREE.MathUtils.degToRad
const toBody = new THREE.Quaternion().fromArray(fit.globe.quaternion).invert()
const out: Record<string, unknown> = {}
const eyes: Record<string, THREE.Vector3> = {}
for (const kind of ['dive', 'rise'] as const) {
  const s = spec[kind]
  const low = plan.low(s.atFrame / config.fps)
  const a = plan.anchor
  const position = a.origin.clone().addScaledVector(low.position.clone().applyQuaternion(a.frame), 1 / closeRadius).applyQuaternion(toBody)
  const tiles = s.views.map(([yaw, pitch], k) => {
    const q = toBody.clone().multiply(a.frame).multiply(low.quaternion).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(rad(pitch!), rad(yaw!), 0, 'YXZ')))
    const m = new THREE.Matrix4().makeRotationFromQuaternion(q).elements
    return { frame: s.firstFrame + k, yawDeg: yaw, pitchDeg: pitch, matrix: [[m[0], m[4], m[8]], [m[1], m[5], m[9]], [m[2], m[6], m[10]]] }
  })
  eyes[kind] = position
  const n = position.clone().normalize()
  const sun = plan.lightDir.clone().applyQuaternion(plan.drawn(s.atFrame / config.fps).invert()).applyQuaternion(toBody)
  out[kind] = { atFrame: s.atFrame, vfovDeg: s.vfovDeg, sun: sun.toArray(), position: position.toArray(), heightRadii: position.length() - 1, nadir: { lonDeg: THREE.MathUtils.radToDeg(Math.atan2(n.x, n.z)), latDeg: THREE.MathUtils.radToDeg(Math.asin(n.y)) }, tiles }
}
const a = plan.anchor
const frame = new THREE.Matrix4().makeRotationFromQuaternion(toBody.clone().multiply(a.frame)).elements
out.close = { radius: closeRadius, origin: a.origin.clone().applyQuaternion(toBody).toArray(), matrix: [[frame[0], frame[4], frame[8]], [frame[1], frame[5], frame[9]], [frame[2], frame[6], frame[10]]] }
if (process.argv[2] === '--check') {
  const lay = JSON.parse(readFileSync(new URL('./lay.json', import.meta.url), 'utf8')) as Record<string, { atFrame: number; position: number[] }>
  let failed = 0
  for (const [kind, l] of Object.entries(lay)) {
    const moved = eyes[kind]!.distanceTo(new THREE.Vector3().fromArray(l.position))
    const same = l.atFrame === spec[kind as 'dive' | 'rise'].atFrame && moved <= spec.eyeTolerance
    if (!same) failed++
    console.log(`${kind}: the eye of the installed lay (frame ${l.atFrame}) is ${moved.toFixed(6)} radii from the eye of the path at frame ${spec[kind as 'dive' | 'rise'].atFrame} (limit ${spec.eyeTolerance}) ${same ? 'PASS' : 'FAIL'}`)
  }
  process.exit(failed > 0 ? 1 : 0)
}
writeFileSync(process.argv[2] ?? 'out/work/mercury/place/tiles/cameras.json', JSON.stringify(out, null, 1))
console.log('written', Object.keys(out).join(' '))
