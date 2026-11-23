import * as THREE from 'three'
import { writeFileSync } from 'node:fs'
import { config } from '../../../src/config'
import deck from '../../../src/stops/uranus/deck.json'
import deckRings from '../../../src/stops/uranus/deck-rings.json'
import fit from '../../../src/stops/uranus/fit.json'
import * as look from '../../../src/stops/uranus/look'
import { plan } from '../../../src/stops/uranus/plan'
import terrainFit from '../terrain/fit.json'

const deg = THREE.MathUtils.radToDeg
const fps = config.fps
const seg = plan.seg
const judged = (s: { firstFrame: number; frames: number }, kind: string): number => s.firstFrame + Math.floor((config.raw.judged.fractions as Record<string, number>)[kind]! * s.frames + 1e-9)
const frame = judged(seg.terrain, 'terrain')
const time = (frame + 0.5 * config.shutterFraction) / fps
const local = plan.terrain(time - seg.terrain.start)
const centre = new THREE.Vector3().fromArray(deck.centre)
const unit = 1 / deck.radius
const globeQ = new THREE.Quaternion().fromArray(fit.globe.quaternion)

const frameAt = plan.deckFrame(time)
const spun = plan.turn(time)
const roundTwin = (p: { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }) => ({
  position: p.position.clone().sub(centre).multiplyScalar(unit).applyQuaternion(frameAt),
  quaternion: frameAt.clone().multiply(p.quaternion),
  vfov: p.vfov,
})
const twin = roundTwin(local)
const up = twin.position.clone().normalize()
const height = twin.position.length() - 1
const dip = Math.acos(1 / (1 + height))
const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(twin.quaternion)
const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(twin.quaternion)
const pitch = Math.asin(fwd.dot(up))
const level = fwd.clone().addScaledVector(up, -fwd.dot(up)).normalize()
const right = new THREE.Vector3().crossVectors(level, up).normalize()
const upLevel = new THREE.Vector3().crossVectors(right, fwd).normalize()
const roll = Math.atan2(camUp.dot(right), camUp.dot(upLevel))
const body = (v: THREE.Vector3): THREE.Vector3 => v.clone().applyQuaternion(spun.clone().invert()).applyQuaternion(globeQ.clone().invert())
const latLon = (v: THREE.Vector3): [number, number] => {
  const b = body(v).normalize()
  return [deg(Math.asin(b.y)), deg(Math.atan2(b.x, b.z))]
}
const east = new THREE.Vector3().crossVectors(plan.axis, up).normalize()
const north = new THREE.Vector3().crossVectors(up, east)
const heading = deg(Math.atan2(level.dot(east), level.dot(north)))
const sun = plan.lightDir.clone()
const sunLocal = new THREE.Vector3().fromArray(deck.sun).applyQuaternion(frameAt)
const sunElev = deg(Math.asin(sun.dot(up)))
const project = (dir: THREE.Vector3): [number, number] | null => {
  const c = dir.clone().applyQuaternion(twin.quaternion.clone().invert())
  if (c.z > -1e-6) return null
  const t = Math.tan(THREE.MathUtils.degToRad(twin.vfov) / 2)
  return [0.5 + (c.x / -c.z) / (2 * t * plan.fit.aspect), 0.5 - (c.y / -c.z) / (2 * t)]
}
const groundAt = (ndcX: number, ndcY: number): THREE.Vector3 | null => {
  const t = Math.tan(THREE.MathUtils.degToRad(twin.vfov) / 2)
  const d = new THREE.Vector3(ndcX * t * plan.fit.aspect, ndcY * t, -1).normalize().applyQuaternion(twin.quaternion)
  const b = twin.position.dot(d)
  const disc = b * b - (twin.position.lengthSq() - 1)
  if (disc <= 0 || b >= 0) return null
  return twin.position.clone().addScaledVector(d, -b - Math.sqrt(disc))
}
const arc = (a: THREE.Vector3, b: THREE.Vector3): number => deg(Math.acos(Math.min(a.clone().normalize().dot(b.clone().normalize()), 1)))
const corners: Record<string, number | null> = {}
for (const [name, x, y] of [['bottomLeft', -1, -1], ['bottomCentre', 0, -1], ['bottomRight', 1, -1], ['centre', 0, 0]] as [string, number, number][]) {
  const g = groundAt(x, y)
  corners[name] = g ? arc(g, up) : null
}
const ringN = new THREE.Vector3().fromArray(fit.rings!.normal).normalize()
const ringLat = deg(Math.asin(up.dot(ringN)))
const ringSeen: { radius: number; lonDeg: number; x: number; y: number; elevDeg: number }[] = []
const a1 = new THREE.Vector3().crossVectors(ringN, up).normalize()
const a2 = new THREE.Vector3().crossVectors(ringN, a1)
for (const radius of [fit.rings!.inner, fit.rings!.outer]) {
  for (let l = -180; l < 180; l += 15) {
    const p = a1.clone().multiplyScalar(Math.sin(THREE.MathUtils.degToRad(l)) * radius).addScaledVector(a2, -Math.cos(THREE.MathUtils.degToRad(l)) * radius)
    const d = p.clone().sub(twin.position)
    const elev = deg(Math.asin(d.clone().normalize().dot(up))) + deg(dip)
    const s = project(d.clone().normalize())
    if (s && elev > 0 && s[0] > -0.3 && s[0] < 1.3 && s[1] > -0.3 && s[1] < 1.3) ringSeen.push({ radius, lonDeg: l, x: +s[0].toFixed(3), y: +s[1].toFixed(3), elevDeg: +elev.toFixed(2) })
  }
}
const arcCentre = new THREE.Vector3().fromArray(deckRings.centre).sub(centre).multiplyScalar(unit).applyQuaternion(frameAt)
const hold = plan.hold(seg.hold.end - seg.hold.start)
const shape = look.shape
const out = {
  measured: 'The horizon of references/approved/uranus-close.jpg was fitted as the outline of a sphere seen by a camera of vfov 60 (assets-src/uranus/terrain/fit.py, rms 1.9 px of 2816 x 1584): nadir, angular radius of the limb and from it the height. The Sun pixel (1998, 758) gives the Sun direction; spot and dive.headingDeg in plan.ts were solved so that the world Sun falls on it at the judged terrain frame. This file is printed by assets-src/uranus/place/solve.ts from the plan and the deck, so it follows them.',
  frame,
  time,
  spinDeg: deg(plan.spin(time)),
  vfovDeg: twin.vfov,
  heightRadii: height,
  dipDeg: deg(dip),
  limbRadiusDeg: deg(terrainFit.alpha),
  pitchDeg: deg(pitch),
  rollDeg: deg(roll),
  headingFromNorthDeg: heading,
  subPoint: { world: up.toArray(), body: body(up).toArray(), latDeg: latLon(up)[0], lonDeg: latLon(up)[1] },
  twin: { position: twin.position.toArray(), quaternion: twin.quaternion.toArray() },
  horizonArcDeg: deg(dip),
  groundArcDeg: corners,
  sun: { world: sun.toArray(), fromImage: sunLocal.toArray(), gapDeg: arc(sun, sunLocal), elevationDeg: sunElev, aboveLimbDeg: sunElev + deg(dip), screen: project(sun) },
  rings: { latitudeDeg: ringLat, seen: ringSeen },
  arcs: { centre: arcCentre.toArray(), centreDistance: arcCentre.length(), radius: deckRings.scale * unit, normal: new THREE.Vector3().fromArray(deckRings.normal).applyQuaternion(frameAt).toArray() },
  unit,
  shape: { polar: shape.polar, equator: shape.equator, axisDotUp: new THREE.Vector3().fromArray(shape.axis).normalize().dot(up) },
  holdEnd: { distance: hold.position.length(), placeFromCameraAxisDeg: arc(hold.position, up) },
}
if (process.argv.includes('--write')) writeFileSync('src/stops/uranus/place.json', JSON.stringify(out, null, 1) + '\n')
console.log(JSON.stringify(out, null, 1))
