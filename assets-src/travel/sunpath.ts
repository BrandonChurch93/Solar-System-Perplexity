import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

const d = new FilmDirector(plans)
const DEG = 180 / Math.PI
const seg = config.segments.find((s) => s.id === 'sun.travel')!
const step = Number(process.argv[2] ?? 3)
console.log('frame u bodyX bodyY skyX skyY apartDeg bodyRdeg skyRdeg bodyW sunW glare turnDegPerFrame exposure skyExp')
let prev: THREE.Quaternion | null = null
let prevSky: [number, number] | null = null
let jump = 0
for (let f = seg.firstFrame; f <= seg.endFrame; f++) {
  const s = d.shotAt(f, (f + 0.25) / config.fps)
  const inv = s.camera.quaternion.clone().invert()
  const th = Math.tan((s.camera.vfov * Math.PI) / 360)
  const scr = (v: THREE.Vector3): [number, number] => {
    const c = v.clone().applyQuaternion(inv)
    return [c.x / -c.z / th, c.y / -c.z / th]
  }
  const lead = s.sets[0]!
  const to = lead.origin.clone().sub(s.camera.position)
  const b = scr(to)
  const k = scr(s.sun.dir)
  const rate = prev ? prev.angleTo(s.camera.quaternion) * DEG : 0
  if (prevSky) jump = Math.max(jump, Math.hypot(k[0] - prevSky[0], k[1] - prevSky[1]))
  prev = s.camera.quaternion.clone()
  prevSky = k
  const u = (s.time - seg.start) / (seg.end - seg.start)
  if ((f - seg.firstFrame) % step === 0) console.log(f, u.toFixed(3), b[0].toFixed(2), b[1].toFixed(2), k[0].toFixed(2), k[1].toFixed(2), (to.angleTo(s.sun.dir) * DEG).toFixed(2), (Math.asin(Math.min(1 / to.length(), 1)) * DEG).toFixed(2), (s.sun.angularRadius * DEG).toFixed(2), lead.weight.toFixed(2), s.sun.weight?.toFixed?.(2), s.sun.glare?.toFixed?.(3), rate.toFixed(2), s.exposure?.toFixed?.(2), s.skyExposure?.toFixed?.(2))
}
console.log('largest step of the sky Sun on screen, half heights per frame', jump.toFixed(3))
