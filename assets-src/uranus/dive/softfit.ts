import * as THREE from 'three'
import { config } from '../../../src/config'
import { StopPlan, type Fit, type MoveParams } from '../../../src/director/moves'
import fit from '../../../src/stops/uranus/fit.json'
import patches from '../../../src/stops/uranus/patches.json'
import { params } from '../../../src/stops/uranus/plan'
import { coverWindow } from '../../../src/director/timeline'

const W = 1920
const H = 1080
const STEP = 10
const kind = process.argv[2] ?? 'rise'
const over = JSON.parse(process.argv[3] ?? '{}') as Partial<MoveParams>
const widths = process.argv[4] ? (JSON.parse(process.argv[4]) as number[]) : patches.levels.map((l) => l.widthDeg)
const size = Number(process.argv[5] ?? 4096)
const p: MoveParams = { ...params, ...over, rise: { ...params.rise, ...(over.rise ?? {}) }, dive: { ...params.dive, ...(over.dive ?? {}) } }
const plan = new StopPlan('uranus', fit as Fit, p)
const seg = kind === 'dive' ? plan.seg.dive! : plan.seg.rise
const win = coverWindow(seg)!
const wrap = 8192 / (2 * Math.PI)
const smoothstep = (a: number, b: number, x: number): number => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t) }
const scale = widths.map((w) => 1 / (2 * Math.tan(THREE.MathUtils.degToRad(w) / 2)))
const rows: string[] = []
let worst = 0
for (let f = seg.firstFrame; f < seg.firstFrame + seg.frames; f++) {
  const time = (f + 0.5 * config.shutterFraction) / config.fps
  const shot = kind === 'dive' ? plan.dive(time) : plan.rise(time)
  if (shot.view !== 'orbit') continue
  const pose = shot.pose
  const tq = plan.turn(time)
  const spot = plan.spot.clone().applyQuaternion(tq)
  const east = plan.axis.clone().cross(spot).normalize()
  const north = spot.clone().cross(east)
  const th = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
  const hit = (x: number, y: number): THREE.Vector3 | null => {
    const d = new THREE.Vector3(((2 * x) / W - 1) * th * (W / H), (1 - (2 * y) / H) * th, -1).normalize().applyQuaternion(pose.quaternion)
    const b = pose.position.dot(d)
    const disc = b * b - (pose.position.lengthSq() - 1)
    if (disc <= 0 || -b - Math.sqrt(disc) <= 0) return null
    return pose.position.clone().addScaledVector(d, -b - Math.sqrt(disc))
  }
  const gno = (q: THREE.Vector3): [number, number, number] => { const dn = q.dot(spot); return [q.dot(east) / Math.max(dn, 0.05), q.dot(north) / Math.max(dn, 0.05), dn] }
  let n = 0
  let soft = 0
  const by = [0, 0, 0, 0, 0]
  for (let y = STEP / 2; y < H; y += STEP) {
    for (let x = STEP / 2; x < W; x += STEP) {
      const a = hit(x, y)
      const bx = hit(x + 1, y)
      const cy = hit(x, y + 1)
      if (!a || !bx || !cy) continue
      n++
      let texels = Math.max(a.distanceTo(bx), a.distanceTo(cy)) * wrap
      const g = gno(a)
      const g1 = gno(bx)
      const g2 = gno(cy)
      const gd = Math.max(Math.hypot(g1[0] - g[0], g1[1] - g[1]), Math.hypot(g2[0] - g[0], g2[1] - g[1]))
      let parent = texels
      let level = 0
      if (g[2] > 0.3 && texels < patches.fade[1]!) {
        for (let i = 0; i < widths.length; i++) {
          const qx = g[0] * scale[i]!
          const qy = g[1] * scale[i]!
          const w = smoothstep(0.5, 0.5 - patches.feather, Math.max(Math.abs(qx), Math.abs(qy))) * (1 - smoothstep(patches.fade[0]!, patches.fade[1]!, parent))
          parent = gd * scale[i]! * size
          if (w >= 0.5) { texels = parent; level = i + 1 }
        }
      }
      if (texels < 1) { soft++; by[level]!++ }
    }
  }
  const inCover = f >= win.firstFrame && f <= win.lastFrame
  const frac = n ? soft / n : 0
  if (!inCover) worst = Math.max(worst, frac)
  const sub = THREE.MathUtils.radToDeg(pose.position.angleTo(spot))
  rows.push(`${f}${inCover ? ' cover' : ''} alt ${(pose.position.length() - 1).toFixed(3)} sub ${sub.toFixed(1)} deg from spot, globe ${(n / ((W / STEP) * (H / STEP))).toFixed(2)} soft ${frac.toFixed(4)} by level ${by.map((v) => (n ? v / n : 0).toFixed(3)).join(' ')}`)
}
console.log(rows.join('\n'))
console.log('cover window', win.firstFrame, win.lastFrame, 'worst soft fraction outside the cover', worst.toFixed(4))
const end = plan.rise((seg.firstFrame + seg.frames - 1 + 0.5 * config.shutterFraction) / config.fps).pose
const tEnd = seg.end
const inv = end.quaternion.clone().invert()
const view = (v: THREE.Vector3): string => v.clone().applyQuaternion(inv).toArray().map((c) => c.toFixed(3)).join(', ')
const centre = end.position.clone().negate().applyQuaternion(inv)
const thE = Math.tan(THREE.MathUtils.degToRad(end.vfov) / 2)
console.log('end pose: distance', end.position.length().toFixed(3), 'globe centre in frame (ndc x, y)', (centre.x / -centre.z / (thE * 16 / 9)).toFixed(3), (centre.y / -centre.z / thE).toFixed(3), 'radius of frame height', (Math.asin(1 / end.position.length()) / THREE.MathUtils.degToRad(end.vfov)).toFixed(3))
console.log('sun in view', view(plan.lightDir.clone()), 'phase deg', THREE.MathUtils.radToDeg(plan.lightDir.angleTo(end.position)).toFixed(1))
console.log('ring normal in view', view(new THREE.Vector3().fromArray(fit.rings!.normal).normalize()), 'band axis in view', view(plan.axis.clone()), 'spot in view', view(plan.spot.clone().applyQuaternion(plan.turn(tEnd))))
