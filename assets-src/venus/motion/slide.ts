import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/venus/plan'
import type { Pose } from '../../../src/core/types'

const W = 1920
const H = 1080
const GRID = 9

function slide(a: Pose, b: Pose): { most: number; median: number } {
  const ta = Math.tan(THREE.MathUtils.degToRad(a.vfov) / 2)
  const tb = Math.tan(THREE.MathUtils.degToRad(b.vfov) / 2)
  const aspect = W / H
  const back = b.quaternion.clone().invert()
  const all: number[] = []
  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      const x = ((i + 0.5) / GRID) * 2 - 1
      const y = ((j + 0.5) / GRID) * 2 - 1
      const ray = new THREE.Vector3(x * ta * aspect, y * ta, -1).normalize().applyQuaternion(a.quaternion)
      const along = a.position.dot(ray)
      const h = along * along - a.position.lengthSq() + 1
      if (h < 0) continue
      const v = ray.multiplyScalar(-along - Math.sqrt(h)).add(a.position).sub(b.position).applyQuaternion(back)
      if (v.z >= 0) continue
      all.push(Math.hypot(((v.x / -v.z / (tb * aspect)) - x) * W / 2, ((v.y / -v.z / tb) - y) * H / 2))
    }
  }
  all.sort((p, q) => p - q)
  return { most: all[all.length - 1] ?? 0, median: all[Math.floor(all.length / 2)] ?? 0 }
}

for (const seg of config.segments.filter((s) => s.stop === 'venus' && (s.kind === 'dive' || s.kind === 'rise'))) {
  for (let f = seg.firstFrame; f < seg.endFrame; f++) {
    const t0 = f / config.fps
    const t1 = (f + config.shutterFraction) / config.fps
    const at = (t: number) => (seg.kind === 'dive' ? plan.dive(t) : plan.rise(t))
    const a = at(t0)
    const b = at(t1)
    if (a.view !== 'orbit' || b.view !== 'orbit') continue
    const s = slide(a.pose, b.pose)
    const alt = a.pose.position.length() - 1
    console.log(seg.kind, f, 'altitude', alt.toFixed(3), 'blur per shutter px: median', s.median.toFixed(1), 'most', s.most.toFixed(1), 'cover', plan.coverAmount(seg, (f + 0.25) / config.fps).toFixed(2))
  }
}
