import { readFileSync, writeFileSync } from 'node:fs'
import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/sun/plan'
import { stage } from '../../../src/stops/sun/stage'
import terrain from '../../../src/stops/sun/terrain.json'

const deg = THREE.MathUtils.radToDeg
const r = (v: number, n = 6): number => Math.round(v * 10 ** n) / 10 ** n
const arr = (v: THREE.Vector3 | THREE.Quaternion, n = 6): number[] => v.toArray().map((x) => r(x, n))

const spotStage = stage.onGround(stage.spot[0], stage.spot[1])
const gs = spotStage.clone().sub(stage.centre).normalize()
const fs = new THREE.Vector3(0, 0, -1)
fs.addScaledVector(gs, -fs.dot(gs)).normalize()
const a = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(fs, gs), gs, fs.clone().negate())
const b = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(plan.heading, plan.normal), plan.normal, plan.heading.clone().negate())
const toBody = new THREE.Quaternion().setFromRotationMatrix(b.multiply(a.transpose()))

const eye = stage.centre.clone().negate()
const dist = eye.length()
const up = eye.clone().normalize()
const fwd = new THREE.Vector3(0, 0, -1)
const right = new THREE.Vector3(1, 0, 0)
const levelRight = fwd.clone().cross(up).normalize()
const levelFwd = fwd.clone().addScaledVector(up, -fwd.dot(up)).normalize()
const spotDir = gs.clone().addScaledVector(up, -gs.dot(up)).normalize()
const northAtNadir = fs.clone().addScaledVector(up, -fs.dot(up)).normalize()
const eastAtNadir = northAtNadir.clone().cross(up).normalize()

const limb = JSON.parse(readFileSync('out/work/sun/pl/limb.json', 'utf8')) as { columns: number; medianPx: number; rmsPx: number; imageHeight: number }
const judged = (config.raw.film as unknown as { judged?: unknown }).judged
void judged

const unfit = new THREE.Quaternion().fromArray(plan.fit.globe.quaternion).invert()
const mapSpot = plan.normal.clone().applyQuaternion(unfit)
const mapNorth = plan.heading.clone().applyQuaternion(unfit)
const patchEast = new THREE.Vector3(0, 1, 0).cross(mapSpot).normalize()
const patchNorth = mapSpot.clone().cross(patchEast)
const before = JSON.parse(readFileSync('src/stops/sun/place.json', 'utf8')) as { plates?: unknown }
const plates = before.plates ?? { keepStretch: [3, 6], featherDeg: 0.25, matchDeg: 1.5, feather: 0.12, fade: [1.1, 1.7], levels: [{ file: 'place-12.jpg', widthDeg: 12 }] }
const twinPosition = eye.clone().divideScalar(stage.radius).applyQuaternion(toBody)
const out = {
  source: 'references/approved/sun-close.jpg',
  measured: 'The limb of the approved close image is a conic in the picture. With the lens of the terrain view (vfov below, 16:9) every limb point is a ray from the camera, and the rays of a sphere limb lie on a cone round the nadir. assets-src/sun/terrain/fit.py fitted that cone to the limb read from two clean takes registered to the approved image (the direction of the nadir and the half angle, src/stops/sun/terrain.json down and alphaDeg). The half angle gives the dip and the height: dip = 90 - alpha, height = 1 / cos(dip) - 1. Pitch and roll are the angles of the camera axes to the nadir. The spot is the centre of the umbra (terrain.json spot), its ray met with the sphere. Heading: the far direction through the spot is the north of the globe at the spot (dive.headingDeg 0), so the aim has the bearing below. assets-src/sun/place/limb.py reads the limb again from the approved image itself and gives the residual below; assets-src/sun/place/solve.ts wrote this file.',
  frame: 90,
  vfovDeg: terrain.vfovDeg,
  aspect: r(16 / 9),
  heightRadii: r(dist / stage.radius - 1),
  dipDeg: r(deg(Math.acos(stage.radius / dist)), 4),
  limbHalfAngleDeg: terrain.alphaDeg,
  pitchDeg: r(deg(Math.asin(fwd.dot(up))), 4),
  rollDeg: r(deg(Math.atan2(right.dot(up), right.dot(levelRight))), 4),
  headingDeg: r(deg(Math.atan2(levelFwd.dot(eastAtNadir), levelFwd.dot(northAtNadir))), 4),
  nadirToSpotDeg: r(deg(up.angleTo(gs)), 4),
  spotBearingDeg: r(deg(Math.atan2(spotDir.dot(levelRight), spotDir.dot(levelFwd))), 4),
  limbResidual: { columns: limb.columns, medianPx: limb.medianPx, rmsPx: limb.rmsPx, imageHeightPx: limb.imageHeight, note: 'the fitted limb lies on the top of the bright fringe; the photosphere edge between the loop feet sits about 2 percent of the frame height under it' },
  stage: { radius: stage.radius, centre: arr(stage.centre), spot: arr(spotStage), toBody: arr(toBody, 8), note: 'a stage point p is the body point toBody * (p - centre) / radius; body axes are the world axes of the orbit view at the middle of the hold, the globe turns about its axis from there' },
  globe: { spot: arr(plan.normal, 8), north: arr(plan.heading, 8), mapSpot: arr(mapSpot, 8), mapNorth: arr(mapNorth, 8), patchNorthOffDeg: r(deg(patchNorth.angleTo(mapNorth)), 5), note: 'spot and north in body axes; mapSpot and mapNorth in the axes of the globe map (the mesh turned back by its fit), where the patch levels are laid: east = Y x mapSpot, north = mapSpot x east' },
  plates,
  twin: { position: arr(twinPosition, 8), quaternion: arr(toBody, 8), vfovDeg: terrain.vfovDeg, note: 'the camera of the approved image on the unit sphere, body axes; the terrain view passes through it at frame 90' },
}
writeFileSync('src/stops/sun/place.json', JSON.stringify(out, null, 2) + '\n')
console.log(JSON.stringify(out, null, 1).slice(0, 2400))
const check = plan.globe({ position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), vfov: 55 })
const carried = twinPosition.clone().applyQuaternion(plan.turn(plan.switchTime))
console.log('check against plan.globe at the switch time: position difference', check.position.distanceTo(carried).toExponential(2))
