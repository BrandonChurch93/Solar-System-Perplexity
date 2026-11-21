import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

const d = new FilmDirector(plans)
const fmt = config.formats[config.formatKeys.master]!
const DEG = 180 / Math.PI
const full = process.argv.includes('--rows')

function at(f: number, o: number): { x: number; y: number; r: number; front: boolean; weight: number } {
  const s = d.shotAt(f, (f + o) / config.fps)
  const st = s.sets[0]!
  const rel = st.origin.clone().sub(s.camera.position).applyQuaternion(s.camera.quaternion.clone().invert())
  const t = Math.tan(s.camera.vfov / DEG / 2)
  const z = Math.max(-rel.z, 1e-9)
  const dist = rel.length()
  return { x: (rel.x / z / (t * fmt.width / fmt.height) * 0.5 + 0.5) * fmt.width, y: (0.5 - rel.y / z / t * 0.5) * fmt.height, r: (1 / Math.sqrt(Math.max(dist * dist - 1, 1e-12))) / t * (fmt.height / 2), front: rel.z < 0, weight: st.weight }
}

for (const seg of config.segments.filter((s) => s.kind === 'travel')) {
  let worst = { f: 0, v: 0, r: 0 }
  let seen = 0
  const rows: string[] = []
  for (let f = seg.firstFrame; f < seg.firstFrame + 30; f++) {
    const a = at(f, 0)
    const b = at(f, config.shutterFraction)
    const inView = a.front && a.weight > 0 && a.x > -a.r && a.x < fmt.width + a.r && a.y > -a.r && a.y < fmt.height + a.r
    const v = Math.hypot(b.x - a.x, b.y - a.y) + Math.abs(b.r - a.r)
    if (inView) {
      seen++
      if (v > worst.v) worst = { f, v, r: a.r }
    }
    rows.push('  f' + f + ' r' + a.r.toFixed(0) + ' at ' + a.x.toFixed(0) + ',' + a.y.toFixed(0) + ' shutter px ' + v.toFixed(1) + (inView ? ' IN' : ''))
  }
  console.log(seg.id + ': leaving body in view ' + seen + ' frames, worst edge travel across the shutter ' + worst.v.toFixed(1) + ' px at ' + worst.f + ' (radius ' + worst.r.toFixed(0) + ' px)')
  if (full) console.log(rows.join('\n'))
}
