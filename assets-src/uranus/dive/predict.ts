import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/uranus/plan'

const W = 1920
const H = 1080
const STEP = 12
const kind = process.argv[2] ?? 'dive'
const seg = kind === 'dive' ? plan.seg.dive! : plan.seg.rise
const wrapWidth = Number(process.argv[3] ?? 8192)
const texel = (2 * Math.PI) / wrapWidth
const rows: string[] = []
let worst = 0
let reach = 0
for (let f = seg.firstFrame; f < seg.firstFrame + seg.frames; f++) {
  const time = (f + 0.5 * config.shutterFraction) / config.fps
  const shot = kind === 'dive' ? plan.dive(time) : plan.rise(time)
  const cover = plan.coverAmount(seg, time)
  if (shot.view !== 'orbit') continue
  const pose = shot.pose
  const spot = plan.spot.clone().applyQuaternion(plan.turn(time))
  const th = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  const hit = (x: number, y: number): THREE.Vector3 | null => {
    const d = new THREE.Vector3(((2 * x) / W - 1) * th * (W / H), (1 - (2 * y) / H) * th, -1).normalize().applyQuaternion(pose.quaternion)
    const b = pose.position.dot(d)
    const c = pose.position.lengthSq() - 1
    const disc = b * b - c
    if (disc <= 0 || -b - Math.sqrt(disc) <= 0) return null
    return pose.position.clone().addScaledVector(d, -b - Math.sqrt(disc))
  }
  const need: number[] = []
  const ang: number[] = []
  for (let y = STEP / 2; y < H; y += STEP) {
    for (let x = STEP / 2; x < W; x += STEP) {
      const p = hit(x, y)
      const px = hit(x + 1, y)
      const py = hit(x, y + 1)
      if (!p || !px || !py) continue
      const foot = Math.max(p.distanceTo(px), p.distanceTo(py))
      need.push(texel / foot)
      ang.push(THREE.MathUtils.radToDeg(p.angleTo(spot)))
    }
  }
  if (need.length === 0) continue
  const order = need.map((_, i) => i).sort((a, b) => need[b]! - need[a]!)
  const p2 = need[order[Math.floor(order.length * 0.02)]!]!
  const top = need[order[0]!]!
  const soft = order.filter((i) => need[i]! > 1)
  const far = soft.length ? Math.max(...soft.map((i) => ang[i]!)) : 0
  const levels = [2, 4, 8, 16, 32, 64, 128].map((k) => { const s = order.filter((i) => need[i]! > k / 2); return s.length ? Math.max(...s.map((i) => ang[i]!)).toFixed(1) : '-' })
  if (cover < 0.02) { worst = Math.max(worst, p2); reach = Math.max(reach, far) }
  rows.push(`${f} alt ${(pose.position.length() - 1).toFixed(4)} vfov ${pose.vfov.toFixed(1)} cover ${cover.toFixed(2)} globe ${(need.length / ((W / STEP) * (H / STEP))).toFixed(2)} zoom needed p2 ${p2.toFixed(2)} max ${top.toFixed(2)} reach ${far.toFixed(1)} deg | deg from spot where level k (2x..128x) is needed at half density: ${levels.join(' ')}`)
}
console.log(rows.join('\n'))
console.log('worst zoom over the wrap outside the cover (2 percent of globe pixels above it):', worst.toFixed(2), 'reach of soft pixels from the spot, deg:', reach.toFixed(1))
