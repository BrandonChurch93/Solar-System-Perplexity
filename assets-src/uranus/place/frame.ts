import * as THREE from 'three'
import { config } from '../../../src/config'
import deck from '../../../src/stops/uranus/deck.json'
import fit from '../../../src/stops/uranus/fit.json'
import patches from '../../../src/stops/uranus/patches.json'
import * as look from '../../../src/stops/uranus/look'
import { plan } from '../../../src/stops/uranus/plan'
import { writeFileSync, mkdirSync } from 'node:fs'
import plates from '../../../src/stops/uranus/plates.json'

const deg = THREE.MathUtils.radToDeg
const fps = config.fps
const seg = plan.seg
const centre = new THREE.Vector3().fromArray(deck.centre)
const n = new THREE.Vector3().fromArray(plates.n)
const e = new THREE.Vector3().fromArray(plates.e)
const u = new THREE.Vector3().fromArray(plates.u)
const globeQ = new THREE.Quaternion().fromArray(fit.globe.quaternion)
const rot = plan.terrainFrame.clone().invert().multiply(globeQ)
const tan = (d: THREE.Vector3): [number, number] => [d.dot(e) / d.dot(n), d.dot(u) / d.dot(n)]
const round = (v: number[]): number[] => v.map((x) => Math.round(x * 1e4) / 1e4)
const axisDeck = new THREE.Vector3(0, 1, 0).applyQuaternion(rot)
const east = new THREE.Vector3().crossVectors(axisDeck, n).normalize()
const north = new THREE.Vector3().crossVectors(n, east)
const sun = new THREE.Vector3().fromArray(deck.sun)
const spot = new THREE.Vector3().fromArray(patches.spot).applyQuaternion(rot)
const foot = (time: number, pose: { position: THREE.Vector3; quaternion: THREE.Quaternion; vfov: number }): Record<string, number[] | null> => {
  const t = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  const out: Record<string, number[] | null> = {}
  const p = pose.position.clone().sub(centre)
  out.sub = round(tan(p.clone().normalize()))
  out.height = [Math.round((p.length() / deck.radius - 1) * 1e5) / 1e5]
  for (const [name, x, y] of [['bl', -1, -1], ['bc', 0, -1], ['br', 1, -1], ['ml', -1, -0.5], ['mc', 0, -0.5], ['mr', 1, -0.5], ['cl', -1, 0], ['cc', 0, 0], ['cr', 1, 0]] as [string, number, number][]) {
    const d = new THREE.Vector3(x * t * plan.fit.aspect, y * t, -1).normalize().applyQuaternion(pose.quaternion)
    const b = p.dot(d)
    const disc = b * b - (p.lengthSq() - deck.radius * deck.radius)
    out[name] = disc <= 0 || b >= 0 ? null : round(tan(p.clone().addScaledVector(d, -b - Math.sqrt(disc)).normalize()))
  }
  return out
}
const dive = seg.dive!
const at = (frame: number): number => (frame + 0.5 * config.shutterFraction) / fps
console.log(JSON.stringify({
  eastInPlate: round([east.dot(e), east.dot(u)]),
  northInPlate: round([north.dot(e), north.dot(u)]),
  eastAngleDeg: deg(Math.atan2(east.dot(u), east.dot(e))),
  flowAngleDeg: deg(deck.flowAngle),
  sunInPlate: round([sun.dot(e), sun.dot(u), sun.dot(n)]),
  sunAzimuthDeg: deg(Math.atan2(sun.dot(u), sun.dot(e))),
  spotTan: round(tan(spot)),
  spotArcDeg: deg(Math.acos(spot.dot(n))),
  halfTans: plates.levels.map((l) => l.halfTan),
  patchHalfTans: patches.levels.map((l) => Math.round(Math.tan(THREE.MathUtils.degToRad(l.widthDeg / 2)) * 1e4) / 1e4),
  unitTan: 1 / deck.radius,
  foot4199: foot(at(4199), plan.entryPath(at(4199))),
  foot4164: foot(at(4164), plan.entryPath(at(4164))),
  foot4200: foot(at(4200), plan.terrain(at(4200) - seg.terrain.start)),
  foot4290: foot(at(4290), plan.terrain(at(4290) - seg.terrain.start)),
  foot4379: foot(at(4379), plan.terrain(at(4379) - seg.terrain.start)),
  diveFrames: [dive.firstFrame, dive.frames],
}, null, 1))

const m = new THREE.Matrix4().makeRotationFromQuaternion(rot).elements
const cam = (frame: number, pose: { position: THREE.Vector3; quaternion: THREE.Quaternion }): { position: number[]; quaternion: number[] } => ({ position: pose.position.toArray(), quaternion: pose.quaternion.toArray() })
mkdirSync('out/work/u/place', { recursive: true })
writeFileSync('out/work/u/place/frame.json', JSON.stringify({
  rot: [[m[0], m[4], m[8]], [m[1], m[5], m[9]], [m[2], m[6], m[10]]],
  bandRate: look.globe.bandRate,
  holdMid: plan.holdMid,
  diveStart: seg.dive!.start,
  riseEnd: seg.rise!.end,
  fps,
  cam4199: cam(4199, plan.entryPath(at(4199))),
  cam4200: cam(4200, plan.terrain(at(4200) - seg.terrain.start)),
  cam4290: cam(4290, plan.terrain(at(4290) - seg.terrain.start)),
  cam4379: cam(4379, plan.terrain(at(4379) - seg.terrain.start)),
}, null, 1))
