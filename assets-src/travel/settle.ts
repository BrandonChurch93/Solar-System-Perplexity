import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { TRAVEL } from '../../src/space/travel/path'

const id = process.argv[2]!
const tries: Record<string, unknown>[] = process.argv.slice(3).map((s) => JSON.parse(s))
if (!tries.length) tries.push({})
const base = { ...TRAVEL[id] }
const seg = config.segments.find((s) => s.id === id + '.travel')!
const fmt = config.formats[config.formatKeys.master]!
const DEG = 180 / Math.PI
const judged = seg.firstFrame + Math.floor(seg.frames * 0.5)
for (const t of tries) {
  TRAVEL[id] = { ...base, ...t }
  const d = new FilmDirector(plans)
  const at = (f: number, o = 0.25) => d.shotAt(f, (f + o) / config.fps)
  let peak = 0
  let peakAt = 0
  let enter = -1
  let leave = -1
  let pos = ''
  let last: THREE.Quaternion | null = null
  for (let f = seg.firstFrame; f < seg.endFrame; f++) {
    const s = at(f)
    const q = s.camera.quaternion
    if (last) {
      const r = q.angleTo(last) * DEG
      if (r > peak) {
        peak = r
        peakAt = f
      }
    }
    last = q.clone()
    const inv = q.clone().invert()
    const tan = Math.tan(s.camera.vfov / DEG / 2)
    const px = (k: number) => {
      const st = s.sets[k]!
      const c = st.origin.clone().sub(s.camera.position).applyQuaternion(inv)
      const z = -c.z
      return { x: (c.x / z / (tan * fmt.width / fmt.height) * 0.5 + 0.5) * fmt.width, y: (0.5 - c.y / z / tan * 0.5) * fmt.height, front: z > 0, w: st.weight, r: (1 / Math.max(c.length(), 1.0001)) / tan * (fmt.height / 2) }
    }
    const b = px(s.sets.length - 1)
    const inside = b.front && b.x > 40 && b.x < fmt.width - 40 && b.y > 40 && b.y < fmt.height - 40
    if (!inside) enter = -1
    else if (enter < 0) enter = f
    if (s.sets.length > 1) {
      const a = px(0)
      if (a.w > 0 && a.front && a.x > -a.r && a.x < fmt.width + a.r && a.y > -a.r && a.y < fmt.height + a.r) leave = f
    }
    if (f === judged || f === judged - 4) pos += ` f${f} ${b.x.toFixed(0)},${b.y.toFixed(0)} r${b.r.toFixed(2)}`
  }
  console.log(JSON.stringify(t), `| in frame from ${enter} | leaving body last seen ${leave} | peak ${peak.toFixed(2)} deg/frame at ${peakAt} |${pos}`)
}
