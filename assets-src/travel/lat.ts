import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { TRAVEL } from '../../src/space/travel/path'
import { galactic } from '../../src/space/sky'
import { readFileSync } from 'node:fs'

const id = process.argv[2]!
const list = process.argv[3] ?? ''
const tries: Record<string, unknown>[] = process.argv.slice(4).map((s) => JSON.parse(s))
if (!tries.length) tries.push({})
const base = { ...TRAVEL[id] }
const seg = config.segments.find((s) => s.id === id + '.travel')!
const frames = list ? list.split(',').map(Number) : Array.from({ length: Math.ceil(seg.frames / 5) + 1 }, (_, i) => Math.min(seg.firstFrame + i * 5, seg.endFrame))
const e = galactic().elements
const n = new THREE.Vector3(e[2]!, e[5]!, e[8]!)
const fmt = config.formats[config.formatKeys.master]!
const DEG = 180 / Math.PI
const v = new THREE.Vector3()
const next = plans[plans.findIndex((p) => p.id === id) + 1]!.id
const def = JSON.parse(readFileSync('src/stops/' + next + '/sky.json', 'utf8')).orbit as { vfovDeg: number; margin: number }
const py = Math.tan(def.vfovDeg / DEG / 2) * (1 + 2 * def.margin)
const pxl = (py * fmt.width) / fmt.height
for (const t of tries) {
  TRAVEL[id] = { ...base, ...t }
  const d = new FilmDirector(plans)
  const row: string[] = []
  for (const f of frames) {
    const s = d.shotAt(f, (f + 0.25) / config.fps)
    const q = s.skyTurn.clone().invert().premultiply(d.sky.frame).multiply(s.camera.quaternion)
    const tan = Math.tan(s.camera.vfov / DEG / 2)
    const tx = (tan * fmt.width) / fmt.height
    const aim = d.sky.patches[next]?.orbit
    const pq = aim ? aim.clone().invert().multiply(q) : null
    let cover = 0
    let core = 0
    let near = 0
    let wide = 0
    let least = 90
    let where = ''
    for (let j = 0; j < 27; j++) for (let i = 0; i < 48; i++) {
      const x = (i + 0.5) / 48 * 2 - 1
      const y = 1 - (j + 0.5) / 27 * 2
      const lat = Math.abs(Math.asin(v.set(x * tx, y * tan, -1).normalize().applyQuaternion(q).dot(n))) * DEG
      if (pq) {
        v.set(x * tx, y * tan, -1).applyQuaternion(pq)
        if (v.z < 0) {
          const ex = 0.5 - Math.abs(v.x / -v.z / pxl) * 0.5
          const ey = 0.5 - Math.abs(v.y / -v.z / py) * 0.5
          if (Math.min(ex, ey) > 0) cover++
          if (Math.min(ex, ey) > 0.15) core++
        }
      }
      if (lat < 8) near++
      if (lat < 16) wide++
      if (lat < least) { least = lat; where = `${Math.round((x * 0.5 + 0.5) * fmt.width)},${Math.round((0.5 - y * 0.5) * fmt.height)}` }
    }
    const st = s.sets[s.sets.length - 1]!
    const inv = s.camera.quaternion.clone().invert()
    const c = st.origin.clone().sub(s.camera.position).applyQuaternion(inv)
    const body = c.z < 0 ? `${Math.round((c.x / -c.z / tx * 0.5 + 0.5) * fmt.width)},${Math.round((0.5 - c.y / -c.z / tan * 0.5) * fmt.height)}` : 'behind'
    const centre = Math.asin(v.set(0, 0, -1).applyQuaternion(q).dot(n)) * DEG
    row.push(`${f}: centre ${centre.toFixed(0)}, within 8 deg ${(near / 12.96).toFixed(0)}%, within 16 deg ${(wide / 12.96).toFixed(0)}%, nearest ${least.toFixed(0)} at ${where}, body ${body}, patch ${(s.skyPatch ?? 0).toFixed(2)} lift ${(s.skyStars ?? 0).toFixed(2)}, in patch ${(cover / 12.96).toFixed(0)}% core ${(core / 12.96).toFixed(0)}%`)
  }
  console.log(JSON.stringify(t) + '\n  ' + row.join('\n  '))
}
