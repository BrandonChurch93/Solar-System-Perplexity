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
const n = new THREE.Vector3(0.45, 0.82, 0.35).normalize()
const DEG = 180 / Math.PI
for (const t of tries) {
  TRAVEL[id] = { ...base, ...t }
  const d = new FilmDirector(plans)
  const row: string[] = []
  for (let f = seg.firstFrame; f <= seg.endFrame; f += 5) {
    const s = d.shotAt(f, (f + 0.25) / config.fps)
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(s.camera.quaternion)
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(s.camera.quaternion)
    const lat = Math.asin(dir.dot(n)) * DEG
    row.push(`${f}:${lat.toFixed(0)}/${(Math.asin(up.dot(n)) * DEG).toFixed(0)}/${s.camera.vfov.toFixed(0)}`)
  }
  console.log(JSON.stringify(t), row.join(' '))
}
