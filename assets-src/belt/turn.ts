import * as THREE from 'three'
import { config } from '../../src/config'
import { shutterMid } from '../../src/core/sampler'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { BeltMotion, beltSegment } from '../../src/space/belt/motion'

const d = new FilmDirector(plans)
const seg = beltSegment()
const m = new BeltMotion(d)
const fmt = config.formats[config.formatKeys.master]!
const id = process.argv[2] ?? 'hero'
const index = m.rocks.findIndex((r) => r.id === id)
const pose = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() }
let prevQ: THREE.Quaternion | null = null
let prevC: THREE.Quaternion | null = null
let prev: [number, number] | null = null
const at: Record<number, [number, number]> = {}
for (let f = seg.firstFrame; f < seg.endFrame; f++) {
  const s = d.shotAt(f, (f + shutterMid()) / config.fps)
  const inv = s.camera.quaternion.clone().invert()
  const fl = fmt.height / 2 / Math.tan(THREE.MathUtils.degToRad(s.camera.vfov) / 2)
  m.pose(index, s, pose)
  const c = pose.position.clone().applyQuaternion(inv)
  const x = fmt.width / 2 + (c.x / -c.z) * fl
  const y = fmt.height / 2 - (c.y / -c.z) * fl
  const rad = (m.rocks[index]!.radius / -c.z) * fl
  const q = inv.clone().multiply(pose.quaternion)
  const turn = prevQ ? THREE.MathUtils.radToDeg(prevQ.angleTo(q)) * config.fps : 0
  const cam = prevC ? THREE.MathUtils.radToDeg(prevC.angleTo(s.camera.quaternion)) * config.fps : 0
  const step = prev ? Math.hypot(x - prev[0], y - prev[1]) : 0
  at[f] = [x, y]
  const seen = x + rad > 0 && x - rad < fmt.width && y + rad > 0 && y - rad < fmt.height
  if (f >= 2755 && f <= 2805) console.log('f' + f, seen ? '*' : ' ', x.toFixed(0) + ',' + y.toFixed(0), 'r' + rad.toFixed(0), 'step', step.toFixed(1), 'px, rock turns', turn.toFixed(1), 'deg/s on screen, camera turns', cam.toFixed(1), 'deg/s')
  prevQ = q
  prevC = s.camera.quaternion.clone()
  prev = [x, y]
}
let path = 0
for (let f = 2766; f <= 2795; f++) path += Math.hypot(at[f]![0] - at[f - 1]![0], at[f]![1] - at[f - 1]![1])
console.log('2765 to 2795: straight', Math.hypot(at[2795]![0] - at[2765]![0], at[2795]![1] - at[2765]![1]).toFixed(0), 'px, along the path', path.toFixed(0), 'px')
