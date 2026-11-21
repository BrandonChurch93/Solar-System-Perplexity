import * as THREE from 'three'
import { config } from '../../../src/config'
import { plans } from '../../../src/director/plans'
const plan = plans.find((p) => p.id === 'neptune')!
const fps = config.fps
const argv = process.argv.slice(2)
const from = Number(argv[0] ?? 4734)
const to = Number(argv[1] ?? 4980)
const every = Number(argv[2] ?? 6)
const shot = (time: number) => {
  const d = plan.seg.dive!
  if (time < d.end) return plan.dive(time)
  if (time < plan.seg.terrain.end) return { pose: plan.terrain(time - plan.seg.terrain.start), view: 'terrain' }
  return plan.rise(time)
}
const ref = plan.terrain((plan.seg.terrain.start + plan.seg.terrain.end) / 2 - plan.seg.terrain.start)
const inv = ref.quaternion.clone().invert()
const ty = Math.tan((15 * Math.PI) / 180)
const tx = (ty * 16) / 9
let lo = [9, 9]
let hi = [-9, -9]
console.log('frame view  left  right  top  bottom of the frame in units of the approved frame (0 to 1, top 0)')
for (let f = from; f <= to; f += every) {
  const s = shot(f / fps)
  if (s.view !== 'terrain') continue
  const fov = (s.pose as { fov?: number }).fov ?? 30
  const sy = Math.tan((fov * Math.PI) / 360)
  const sx = (sy * 16) / 9
  let a = [9, 9]
  let b = [-9, -9]
  for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) {
    if (i > 0 && i < 8 && j > 0 && j < 8) continue
    const d = new THREE.Vector3((i / 4 - 1) * sx, (1 - j / 4) * sy, -1).normalize().applyQuaternion(s.pose.quaternion).applyQuaternion(inv)
    if (d.z > -0.05) continue
    const u = (d.x / -d.z / tx + 1) / 2
    const v = (1 - d.y / -d.z / ty) / 2
    a = [Math.min(a[0]!, u), Math.min(a[1]!, v)]
    b = [Math.max(b[0]!, u), Math.max(b[1]!, v)]
  }
  lo = [Math.min(lo[0]!, a[0]!), Math.min(lo[1]!, a[1]!)]
  hi = [Math.max(hi[0]!, b[0]!), Math.max(hi[1]!, b[1]!)]
  console.log(String(f).padStart(5), s.view, a[0]!.toFixed(3).padStart(7), b[0]!.toFixed(3).padStart(7), a[1]!.toFixed(3).padStart(7), b[1]!.toFixed(3).padStart(7))
}
console.log('reach', lo.map((x) => x.toFixed(3)).join(' '), hi.map((x) => x.toFixed(3)).join(' '))
