import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/sun/plan'
import { stage } from '../../../src/stops/sun/stage'
import place from '../../../src/stops/sun/place.json'
import fit from '../../../src/stops/sun/fit.json'
// Does the stage's ground turn with the globe's map (asked by the lab, 19:58 UTC)? For each film frame: the direction
// in the MAP's frame that stands over a fixed point of the stage's ground, as the close view carries the stage on the
// turning globe (plan.carry, plan.toGlobe), read as the globe's shader reads the map (d = spinY(local, spin), globe.ts
// 258). Printed: how far that map direction has moved from the one at the first frame, and how far it stands from
// the direction that the globe's side gives the same stage point (the fixed matrix mapToStage of set.ts).
const timeOf = (f: number): number => (f + 0.5 * config.shutterFraction) / config.fps
const fitTurn = new THREE.Quaternion().fromArray(fit.globe.quaternion)
const mapToStage = new THREE.Quaternion().fromArray(place.stage.toBody).invert().multiply(fitTurn)
const spinY = (d: THREE.Vector3, a: number): THREE.Vector3 => new THREE.Vector3(Math.cos(a) * d.x - Math.sin(a) * d.z, d.y, Math.sin(a) * d.x + Math.cos(a) * d.z)
const deg = (a: THREE.Vector3, b: THREE.Vector3): number => THREE.MathUtils.radToDeg(a.angleTo(b))
const mapSpot = new THREE.Vector3().fromArray(place.globe.mapSpot).normalize()
const points: [string, THREE.Vector3][] = [['the anchor', mapSpot.clone().applyQuaternion(mapToStage)], ['20 degrees east of it', mapSpot.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(20)).applyQuaternion(mapToStage)]]
const frames = process.argv.slice(2).map(Number)
const list = frames.length ? frames : [90, 180, 221, 229, 240, 248, 256, 269]
for (const [name, onStage] of points) {
  const globeSide = onStage.clone().applyQuaternion(mapToStage.clone().invert())
  let first: THREE.Vector3 | null = null
  for (const f of list) {
    const t = timeOf(f)
    const x = onStage.clone().applyQuaternion(plan.toGlobe).applyQuaternion(plan.carry(t))
    const d = spinY(x.clone().applyQuaternion(fitTurn.clone().invert()), plan.spin(t))
    first ??= d
    console.log(name, 'frame', f, 'map direction', d.toArray().map((v) => v.toFixed(6)).join(' '), '| moved since frame', list[0], deg(d, first).toFixed(5), 'degrees | from the globe side\'s', deg(d, globeSide).toFixed(5), 'degrees | spin', THREE.MathUtils.radToDeg(plan.spin(t)).toFixed(4))
  }
}
