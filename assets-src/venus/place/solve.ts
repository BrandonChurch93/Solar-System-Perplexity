import * as THREE from 'three'
import { readFileSync, writeFileSync } from 'node:fs'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/venus/plan'
import fit from '../../../src/stops/venus/fit.json'
import relief from '../../../src/stops/venus/relief.json'

const deg = THREE.MathUtils.radToDeg
const rad = THREE.MathUtils.degToRad
const FRAME = 1440
const cam = relief.camera
const up = new THREE.Vector3().fromArray(cam.up).normalize()
const R = cam.radius
const centre = up.clone().multiplyScalar(-(R + 1))
const time = (FRAME + config.shutterFraction * 0.5) / config.fps
const close = plan.terrain(time - plan.seg.terrain.start)
const rot = plan.turn(time).multiply(plan.terrainFrame)
const position = close.position.clone().sub(centre).divideScalar(R).applyQuaternion(rot)
const quaternion = rot.clone().multiply(close.quaternion)
const height = position.length() - 1
const nadir = position.clone().normalize()
const globe = new THREE.Quaternion().fromArray(fit.globe.quaternion)
const toBody = (v: THREE.Vector3): THREE.Vector3 => v.clone().applyQuaternion(plan.turn(time).invert()).applyQuaternion(globe.clone().invert())
const lonLat = (b: THREE.Vector3): { lonDeg: number; latDeg: number } => ({ lonDeg: deg(Math.atan2(b.x, b.z)), latDeg: deg(Math.asin(b.y)) })
const body = toBody(nadir)
const east = new THREE.Vector3(0, 1, 0).cross(body).normalize()
const north = body.clone().cross(east)
const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion)
const level = fwd.clone().addScaledVector(nadir, -fwd.dot(nadir)).normalize()
const headBody = toBody(level)
const sun = plan.lightDir.clone()
const sunBody = toBody(sun)
const sunCam = sun.clone().applyQuaternion(quaternion.clone().invert())
const th = Math.tan(rad(close.vfov) / 2)
const aspect = 16 / 9
const px = (d: THREE.Vector3): [number, number] => [0.5 + (d.x / -d.z) / (2 * th * aspect), 0.5 - (d.y / -d.z) / (2 * th)]
const ground = (fx: number, fy: number): { lonDeg: number; latDeg: number; arcDeg: number; range: number } | null => {
  const d = new THREE.Vector3((2 * fx - 1) * th * aspect, (1 - 2 * fy) * th, -1).normalize().applyQuaternion(quaternion)
  const b = position.dot(d)
  const disc = b * b - (position.lengthSq() - 1)
  if (disc <= 0 || b >= 0) return null
  const k = -b - Math.sqrt(disc)
  const hit = position.clone().addScaledVector(d, k).normalize()
  return { ...lonLat(toBody(hit)), arcDeg: deg(hit.angleTo(nadir)), range: k }
}
const pts = JSON.parse(readFileSync(new URL('./horizon-points.json', import.meta.url), 'utf8')) as { size: [number, number]; points: [number, number][] }
const alpha = Math.asin(1 / position.length())
const down = nadir.clone().negate().applyQuaternion(quaternion.clone().invert())
let sum = 0
let worst = 0
const f = pts.size[1] / 2 / th
for (const [x, y] of pts.points) {
  const d = new THREE.Vector3((x - pts.size[0] / 2) / f, (pts.size[1] / 2 - y) / f, -1)
  const scale = d.lengthSq()
  d.normalize()
  const off = (Math.acos(Math.min(Math.max(d.dot(down), -1), 1)) - alpha) * f * scale
  sum += off * off
  worst = Math.max(worst, Math.abs(off))
}
const aim = ground(0.5, 0.5)!
const out = {
  stop: 'venus',
  source: 'references/approved/venus-close.jpg',
  frame: FRAME,
  measured: 'The horizon of the approved close image was traced at 70 points (assets-src/venus/place/horizon-points.json, pixels of the 2816 x 1584 upscale). A horizon ray makes the angle 90 deg + dip with the local up, so the up direction in camera space (pitch, roll) and the dip follow from a least squares fit at the vertical field of view of the terrain view, 60 deg (assets-src/venus/place/horizon.py: pitch -21.47, roll 1.03 in its sign, dip 10.92, height 0.01843, rms 1.14 px, largest 3.9 px; the residual is flat from 50 to 60 deg, so the horizon alone cannot fix the field of view). The camera written here is the one the close side is built on (relief.json camera: up, radius in camera heights, dip), so the terrain view does not change; horizonCheck is the same 70 points against that camera. Height = 1 / cos(dip) - 1 in radii. Heading and position follow from the engine: the close side is drawn in the frame turn(time) * terrainFrame at the spot, and the twin keeps the same world orientation, so the Sun and the sky stand where they stand on the close side. That puts the point under the camera 21.5 deg of arc from the spot of the plan (the close image looks 21.5 deg below the local level, the terrain frame takes its own y axis as the normal). Made by assets-src/venus/place/solve.ts.',
  camera: { vfovDeg: close.vfov, pitchDeg: cam.pitchDeg, rollDeg: cam.rollDeg, dipDeg: cam.dipDeg, height, radiusInCameraHeights: R, up: cam.up },
  horizonCheck: { points: pts.points.length, rmsPx: Math.sqrt(sum / pts.points.length), maxPx: worst, of: pts.size },
  twin: {
    note: 'The globe side camera that draws the same picture as the close side at the middle of the shutter of the frame. Plan frame: globe centre at the origin, radius 1, the hold camera at fit.json camera.position. It turns with the globe (plan.turn).',
    time,
    position: position.toArray(),
    quaternion: quaternion.toArray(),
    vfovDeg: close.vfov,
    body: {
      note: 'The same camera in the body fixed (map) frame: position in radii, and the camera axes x (right), y (up), z (back).',
      position: toBody(position).toArray(),
      x: toBody(new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion)).toArray(),
      y: toBody(new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion)).toArray(),
      z: toBody(new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion)).toArray(),
    },
  },
  place: {
    note: 'Body fixed (map) frame: dir(lon, lat) = (cos lat sin lon, sin lat, cos lat cos lon).',
    under: { ...lonLat(body), direction: body.toArray(), east: east.toArray(), north: north.toArray() },
    headingFromNorthCwDeg: deg(Math.atan2(headBody.dot(east), headBody.dot(north))),
    heading: headBody.toArray(),
    aim: { lonDeg: aim.lonDeg, latDeg: aim.latDeg, arcDeg: aim.arcDeg, range: aim.range },
    horizonArcDeg: deg(Math.acos(1 / position.length())),
    spotArcDeg: deg(nadir.angleTo(plan.spot.clone().applyQuaternion(plan.turn(time)))),
    footprint: [[0, 1], [0.5, 1], [1, 1], [0, 0.75], [0.5, 0.75], [1, 0.75], [0, 0.6], [0.5, 0.6], [1, 0.6], [0.25, 0.45], [0.5, 0.45], [0.75, 0.45]].map(([x, y]) => ({ at: [x, y], ...(ground(x!, y!) ?? { miss: true }) })),
  },
  sun: {
    note: 'inFrame is the Sun of the engine (plan.lightDir) seen by this camera, inCloseImage the painted Sun of the approved image; both in shares of the frame from the top left. The engine Sun stands 3.2 percent of the width left and 4.6 percent of the height above the painted one. On the close side the air dome hides the engine Sun (look.relief.air.sunHideDeg) and the painted one is seen.',
    inFrame: px(sunCam),
    inCloseImage: cam.sun,
    elevationAtPlaceDeg: deg(Math.asin(sunBody.dot(body))),
    azimuthFromNorthCwDeg: deg(Math.atan2(sunBody.dot(east), sunBody.dot(north))),
    body: sunBody.toArray(),
  },
}
writeFileSync(new URL('../../../src/stops/venus/place.json', import.meta.url), JSON.stringify(out, null, 1) + '\n')
console.log(JSON.stringify(out, null, 1))
