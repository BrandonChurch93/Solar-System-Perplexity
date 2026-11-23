import { writeFileSync } from 'node:fs'
import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/mercury/plan'
import { closeRadius } from '../../../src/stops/mercury/close'
import fit from '../../../src/stops/mercury/fit.json'
import relief from '../../../src/stops/mercury/relief.json'
import camfit from '../relief/camera-fit.json'
import { glare } from '../../../src/stops/mercury/look'

const deg = THREE.MathUtils.radToDeg
const seg = plan.seg.terrain
const frame = seg.firstFrame + Math.floor((config.raw.judged.fractions as Record<string, number>).terrain! * seg.frames + 1e-9)
const time = (frame + config.shutterFraction / 2) / config.fps
const low = plan.low(time)
const a = plan.anchor
const globe = new THREE.Quaternion().fromArray(fit.globe.quaternion)
const toBody = globe.clone().invert()
const position = a.origin.clone().addScaledVector(low.position.clone().applyQuaternion(a.frame), 1 / closeRadius).applyQuaternion(toBody)
const quaternion = toBody.clone().multiply(a.frame).multiply(low.quaternion)
const nadir = position.clone().normalize()
const east = new THREE.Vector3(0, 1, 0).cross(nadir).normalize()
const north = nadir.clone().cross(east)
const ahead = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion)
const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion)
const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion)
const tan = Math.tan(THREE.MathUtils.degToRad(relief.vfovDeg) / 2)
const aspect = relief.imageSize.web[0] / relief.imageSize.web[1]
const sunImage = new THREE.Vector3((glare.terrainSun[0] - 0.5) * 2 * tan * aspect, (0.5 - glare.terrainSun[1]) * 2 * tan, -1).normalize().applyQuaternion(quaternion)
const sunFilm = plan.lightDir.clone().applyQuaternion(plan.drawn(time).invert()).applyQuaternion(toBody)
const compass = (v: THREE.Vector3): { azimuthDeg: number; elevationDeg: number } => ({ azimuthDeg: (deg(Math.atan2(v.dot(east), v.dot(north))) + 360) % 360, elevationDeg: deg(Math.asin(v.dot(nadir))) })
const r = (x: number, n = 6): number => Number(x.toFixed(n))
const out = {
  image: 'references/approved/mercury-close.jpg',
  frame,
  vfovDeg: low.vfov,
  heightRadii: r(position.length() - 1, 8),
  dipDeg: r(deg(Math.acos(1 / position.length())), 5),
  pitchDeg: r(deg(Math.asin(ahead.dot(nadir))), 5),
  rollDeg: r(deg(Math.atan2(right.dot(nadir), up.dot(nadir))), 5),
  headingDeg: r(compass(ahead).azimuthDeg, 5),
  nadir: { lonDeg: r(deg(Math.atan2(nadir.x, nadir.z))), latDeg: r(deg(Math.asin(nadir.y))) },
  body: { position: position.toArray().map((x) => r(x, 9)), quaternion: quaternion.toArray().map((x) => r(x, 9)) },
  closeUnitsPerRadius: r(closeRadius, 6),
  sun: { image: { ...compass(sunImage), pixel: [glare.terrainSun[0] * relief.imageSize.web[0], glare.terrainSun[1] * relief.imageSize.web[1]] }, film: compass(sunFilm) },
  fit: { points: camfit.horizonPx.length, residualDegMax: r(camfit.residualDegMax, 5), residualDegRms: r(camfit.residualDegRms, 5) },
  measured: [
    'The horizon of the approved close image was traced at the steepest rise of brightness in each column (assets-src/mercury/relief/camfit.py) and a cone about the nadir was fitted to it with the field of view the terrain view uses (60 degrees): pitch, roll and dip are the three unknowns.',
    'The dip gives the height: 1 / cos(dip) - 1 radii. The close scene counts the camera height as 1 unit, so the sphere has a radius of closeUnitsPerRadius units there.',
    'The nadir and the heading on the globe come from the dive spot and the dive heading of the plan (src/stops/mercury/plan.ts, src/stops/mercury/close.ts anchor), the same mapping the close scene is flown with.',
    'body is the camera in the frame of the globe textures (x = cos lat sin lon, y = sin lat, z = cos lat cos lon), at zero spin. heading is clockwise from north at the nadir. pitch is the view axis against the local level (negative looks down). roll is positive when the horizon falls to the right of the frame. The dip is also the arc from the nadir to the horizon. Written by assets-src/mercury/place/solve.ts.',
  ],
}
writeFileSync('src/stops/mercury/place.json', JSON.stringify(out, null, 1) + '\n')
console.log(JSON.stringify(out, null, 1))
