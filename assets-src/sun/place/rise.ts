import * as THREE from 'three'
import { writeFileSync } from 'node:fs'
import { config } from '../../../src/config'
import type { Pose } from '../../../src/core/types'
import { handoverOf } from '../../../src/director/handover'
import { plan } from '../../../src/stops/sun/plan'

const seg = plan.seg.rise
const timeOf = (f: number): number => (f + 0.5 * config.shutterFraction) / config.fps
const globeSide = (f: number): Pose => {
  const t = timeOf(f)
  if (f < seg.firstFrame) return plan.carried(plan.globe(plan.terrain(t - plan.seg.terrain.start)), t)
  if (f >= seg.endFrame) return plan.hold(t - plan.seg.hold.start)
  return plan.risePose(t, 'orbit')
}
const screen = (p: Pose, world: THREE.Vector3): [number, number] => {
  const d = world.clone().sub(p.position).applyQuaternion(p.quaternion.clone().invert())
  const t = Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)
  return [0.5 + d.x / -d.z / (2 * t * plan.fit.aspect), 0.5 - d.y / -d.z / (2 * t)]
}
const skyShare = (p: Pose): number => {
  const t = Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)
  let miss = 0
  let n = 0
  for (let j = 0; j < 37; j++) for (let i = 0; i < 65; i++) {
    const d = new THREE.Vector3((i / 32 - 1) * t * plan.fit.aspect, (1 - j / 18) * t, -1).normalize().applyQuaternion(p.quaternion)
    const b = p.position.dot(d)
    const disc = b * b - (p.position.lengthSq() - 1)
    n++
    if (!(disc > 0 && b < 0)) miss++
  }
  return miss / n
}
const rows: string[] = ['frame\theight\tratio\tscale\tpitchDeg\tturnDeg\tvfov\tspotX\tspotY\tskyShare']
const ratios: number[] = []
let prev: Pose | null = null
for (let f = seg.firstFrame - 3; f <= seg.endFrame + 2; f++) {
  const p = globeSide(f)
  const h = p.position.length() - 1
  const spot = plan.normal.clone().applyQuaternion(plan.turn(timeOf(f)))
  const s = screen(p, spot)
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quaternion)
  const pitch = THREE.MathUtils.radToDeg(Math.asin(fwd.dot(p.position.clone().normalize())))
  let ratio = NaN
  let turn = NaN
  let scale = NaN
  if (prev) {
    const hp = prev.position.length() - 1
    ratio = h / hp
    turn = THREE.MathUtils.radToDeg(prev.quaternion.angleTo(p.quaternion))
    scale = (h * Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)) / (hp * Math.tan(THREE.MathUtils.degToRad(prev.vfov) / 2))
    if (f >= seg.firstFrame && f <= seg.endFrame) ratios.push(ratio)
  }
  rows.push([f, h.toFixed(5), ratio.toFixed(4), scale.toFixed(4), pitch.toFixed(2), turn.toFixed(3), p.vfov.toFixed(2), s[0].toFixed(3), s[1].toFixed(3), skyShare(p).toFixed(3)].join('\t'))
  prev = p
}
const mean = Math.exp(ratios.reduce((a, r) => a + Math.log(r), 0) / ratios.length)
const peak = Math.max(...ratios)
const h = handoverOf('sun', 'rise')
const end = plan.risePose(seg.end, 'orbit')
const hold = plan.hold(seg.end - plan.seg.hold.start)
const dt = 1e-4
const v = (at: (t: number) => Pose, t: number): THREE.Vector3 => at(t + dt).position.clone().sub(at(t - dt).position).divideScalar(2 * dt)
const endSpeed = v((t) => plan.risePose(Math.min(t, seg.end), 'orbit'), seg.end - dt).distanceTo(v((t) => plan.hold(t - plan.seg.hold.start), seg.end + dt))
const startClose = plan.terrain(seg.start - plan.seg.terrain.start)
const startRise = plan.risePose(seg.start, 'terrain')
const startSpeed = v((t) => plan.risePose(Math.max(t, seg.start), 'terrain'), seg.start + dt).distanceTo(v((t) => plan.terrain(t - plan.seg.terrain.start), seg.start - dt))
const T = h ? h.time : NaN
const a = plan.risePose(T, 'orbit')
const b = plan.globe(plan.risePose(T, 'terrain'))
const bc = plan.carried(b, T)
const tail = [
  'handover: ' + (h ? 'frame ' + h.firstFrame + ' to ' + h.lastFrame + ', T ' + T.toFixed(5) + ' s, place window ' + h.placeFirstFrame + ' to ' + h.placeLastFrame : 'not opted in'),
  'height ratio per frame: geometric mean ' + mean.toFixed(4) + ', largest ' + peak.toFixed(4) + ', log ratio of largest over mean ' + (Math.log(peak) / Math.log(mean)).toFixed(3),
  'start against the close view at the first instant of the rise: position ' + startRise.position.distanceTo(startClose.position).toExponential(2) + ' stage units, angle ' + THREE.MathUtils.radToDeg(startRise.quaternion.angleTo(startClose.quaternion)).toExponential(2) + ' deg, velocity ' + startSpeed.toExponential(2) + ' stage units per second',
  'end against the hold at its first instant: position ' + end.position.distanceTo(hold.position).toExponential(2) + ' radii, angle ' + THREE.MathUtils.radToDeg(end.quaternion.angleTo(hold.quaternion)).toExponential(2) + ' deg, vfov ' + (end.vfov - hold.vfov).toExponential(2) + ' deg, velocity ' + endSpeed.toExponential(2) + ' radii per second',
  'the two sides at T: position ' + a.position.distanceTo(bc.position).toExponential(2) + ' radii, angle ' + THREE.MathUtils.radToDeg(a.quaternion.angleTo(bc.quaternion)).toExponential(2) + ' deg',
]
const out = rows.join('\n') + '\n\n' + tail.join('\n') + '\n'
writeFileSync(process.argv[2] ?? 'out/work/sun/pl/rise.tsv', out)
const brief = process.argv[3] === 'all' ? rows : rows.filter((_, i) => i < 22 || i % 5 === 3 || i > rows.length - 12)
console.log(brief.join('\n') + '\n\n' + tail.join('\n'))
