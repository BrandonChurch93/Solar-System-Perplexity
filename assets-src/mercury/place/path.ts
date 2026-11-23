import * as THREE from 'three'
import { config } from '../../../src/config'
import { handoverOf } from '../../../src/director/handover'
import { plan } from '../../../src/stops/mercury/plan'

const fps = config.fps
const mid = config.shutterFraction / 2
const master = config.formats[config.formatKeys.master]!
const rows: string[] = []
for (const kind of ['dive', 'rise'] as const) {
  const seg = kind === 'dive' ? plan.seg.dive! : plan.seg.rise
  const h = handoverOf('mercury', kind)!
  const place = plan.placeOf(kind)
  const at = (f: number) => {
    const time = (f + mid) / fps
    const pose = kind === 'dive' ? plan.divePose(time, 'orbit') : plan.risePose(time, 'orbit')
    const g = plan.drawn(time).invert()
    const p = pose.position.clone().applyQuaternion(g)
    const q = g.multiply(pose.quaternion)
    const v = place.clone().sub(p).applyQuaternion(q.clone().invert())
    const k = 1 / Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2) / -v.z
    const down = p.clone().normalize().negate()
    const pitch = THREE.MathUtils.radToDeg(Math.asin(new THREE.Vector3(0, 0, -1).applyQuaternion(q).dot(down)))
    return { height: p.length() - 1, x: v.x * k / (master.width / master.height), y: v.y * k, vfov: pose.vfov, pitch, p, q }
  }
  const first = kind === 'dive' ? seg.firstFrame - 3 : h.firstFrame - 3
  const last = kind === 'dive' ? h.lastFrame + 3 : seg.endFrame + 2
  let was = at(first - 1)
  const ratios: number[] = []
  rows.push(kind + ': handover time ' + (h.time * fps).toFixed(2) + ' frames, place window ' + h.placeFirstFrame + ' to ' + h.placeLastFrame)
  rows.push('frame  height    ratio   place x  place y   vfov   pitch   turn deg   scale ratio')
  for (let f = first; f <= last; f++) {
    const now = at(f)
    const ratio = now.height / was.height
    const turn = THREE.MathUtils.radToDeg(2 * Math.acos(Math.min(Math.abs(now.q.dot(was.q)), 1)))
    const scale = (was.height * Math.tan(THREE.MathUtils.degToRad(was.vfov) / 2)) / (now.height * Math.tan(THREE.MathUtils.degToRad(now.vfov) / 2))
    const inside = kind === 'dive' ? f >= seg.firstFrame && f <= h.firstFrame : f >= h.lastFrame + 1 && f <= seg.endFrame - 1
    if (inside) ratios.push(Math.abs(Math.log(ratio)))
    rows.push(String(f).padStart(5) + now.height.toFixed(5).padStart(9) + ratio.toFixed(4).padStart(9) + now.x.toFixed(3).padStart(9) + now.y.toFixed(3).padStart(9) + now.vfov.toFixed(2).padStart(8) + now.pitch.toFixed(2).padStart(8) + turn.toFixed(3).padStart(9) + scale.toFixed(4).padStart(11) + (f === Math.floor(h.time * fps) ? '  T' : ''))
    was = now
  }
  const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length
  const fifth = ratios[Math.floor(ratios.length / 5)]!
  rows.push(kind + ': mean log ratio per frame ' + mean.toFixed(4) + ', largest ' + Math.max(...ratios).toFixed(4) + ' (' + (Math.max(...ratios) / mean).toFixed(3) + ' of the mean), at one fifth ' + (kind === 'dive' ? fifth : ratios[ratios.length - 1 - Math.floor(ratios.length / 5)]!).toFixed(4))
}
console.log(rows.join('\n'))
