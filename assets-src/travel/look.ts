import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

const d = new FilmDirector(plans)
const fmt = config.formats[config.formatKeys.master]!
const DEG = 180 / Math.PI
for (const id of process.argv.slice(2)) {
  const seg = config.segments.find((s) => s.id === id + '.travel')!
  const rise = config.segments.find((s) => s.id === id + '.rise')
  const at = (f: number) => d.shotAt(f, (f + 0.25) / config.fps)
  const end = new THREE.Vector3(0, 0, -1).applyQuaternion(at(seg.endFrame + 1).camera.quaternion)
  const row: string[] = []
  const span = (f: number): [number, number, number] => {
    const s = at(f)
    const ty = Math.tan(s.camera.vfov / DEG / 2)
    const tx = (ty * fmt.width) / fmt.height
    let lo = 999
    let hi = 0
    for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) {
      const v = new THREE.Vector3((i / 4 - 1) * tx, (j / 4 - 1) * ty, -1).normalize().applyQuaternion(s.camera.quaternion)
      const a = v.angleTo(end) * DEG
      lo = Math.min(lo, a)
      hi = Math.max(hi, a)
    }
    return [new THREE.Vector3(0, 0, -1).applyQuaternion(s.camera.quaternion).angleTo(end) * DEG, lo, hi]
  }
  const first = rise ? rise.firstFrame + 40 : seg.firstFrame
  for (let f = first; f <= seg.endFrame + 1; f += f < seg.firstFrame ? 8 : 5) {
    const [c, lo, hi] = span(f)
    row.push(f + ': axis ' + c.toFixed(1) + ' frame ' + lo.toFixed(1) + ' to ' + hi.toFixed(1))
  }
  console.log(id + '\n  ' + row.join('\n  '))
}
